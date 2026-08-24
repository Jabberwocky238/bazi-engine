/**
 * 合冲刑害入口 + 两支/两干 pairwise 查表.
 *
 *   天干: 相合 (五合) · 相冲 · 相克            → 天干.ts / TianGanDetector
 *   地支: 六合 · 三合 · 三会 · 暗合
 *         相刑 · 相冲 · 相破 · 相害            → 地支.ts / DiZhiDetector
 *   整柱: 盖头 · 截脚 · 覆载 (单柱内干支作用)  → 整柱.ts
 *   岁运: 引化 / 冲克 / 冲开                   → 岁运引化.ts
 *
 * 天干.ts / 地支.ts 只管原局的掩码判定, 不含岁运概念; 岁运作用由 岁运引化.ts
 * 在其输出之上叠加. 本层只负责调度 + 聚合, 不自维任何关系表.
 *
 * pairwise (pairwiseZhi / pairwiseGan) 同样委托 XPCHC / HeHuiC / TianGanC 查表 ——
 * 掩码即身份, 一次 map 命中即得, 不再构造凑柱跑 detector.
 *   - 半三会 已废弃 (三会 仅 首+末 出拱会, 不产半会; pairwise 同步不产).
 *   - 暗合 与 半三合 / 六合 多义时无统一优先级, pairwise 不含暗合.
 */
import { GanC, PillarC, ZhiC, type Gan, type Pillar, type Zhi } from "@/types";
import {
  DiZhiDetector, HeHuiC, XPCHC, zhiMask,
  type DiZhiHit, type DiZhiRelKind, type HeHuiSubset,
} from "./地支.ts";
import { TianGanC, TianGanDetector, type TianGanHit, type ZhengHeHit } from "./天干.ts";
import {
  叠加地支岁运, 叠加天干岁运,
  type SuiYunHit,
} from "./岁运引化.ts";
import { detect as detectWholePillar, type WholePillarR } from "./整柱.ts";

export * from "./common.ts";
export * from "./天干.ts";
export * from "./地支.ts";
export * from "./岁运引化.ts";
export * from "./整柱.ts";
export * from "./墓库.ts";
export * from "./解法.ts";

// ———————————————————————————————————————————————
// 汇总分析
// ———————————————————————————————————————————————

/** 一柱的整柱作用 (盖头 / 截脚 / 覆载三态). */
export interface WholePillarHit {
  /** 柱下标 (0=年 1=月 2=日 3=时). */
  readonly slot: number;
  readonly state: WholePillarR;
}

/**
 * 干支关系全量分析.
 *
 * 原局 四柱 + 岁运柱 一并送入 detector (岁运柱接在四柱之后, 故其下标为 4,5,...),
 * 这样跨原局与岁运的关系 (如流年支与月支相冲) 也能被判出;
 * 每条关系再由 岁运引化 标注是否被岁运 引化 / 冲克.
 */
export interface GanZhiAnalysis {
  /** 天干关系 (相合 / 相冲 / 相克), 各带岁运作用. */
  readonly 天干: readonly SuiYunHit<TianGanHit>[];
  /** 地支关系 (八类), 各带岁运作用. */
  readonly 地支: readonly SuiYunHit<DiZhiHit>[];
  /** 三合/三会 的两支子集 (半合 / 拱合 / 拱会). */
  readonly 子集: readonly { readonly sub: string; readonly name: string; readonly slots: readonly number[] }[];
  /** 争合 (五合一方重出). */
  readonly 争合: readonly ZhengHeHit[];
  /** 各柱的整柱作用 (仅原局四柱). */
  readonly 整柱: readonly WholePillarHit[];
}

/** 送入 detector 的干支序列 —— 原局四柱在前, 岁运柱依次接后. */
function seq(pillars: readonly Pillar[], extras: readonly PillarC[]) {
  const gans = [
    ...pillars.map((p) => GanC.from(p.gan)),
    ...extras.map((e) => e.gan),
  ];
  const zhis = [
    ...pillars.map((p) => ZhiC.from(p.zhi)),
    ...extras.map((e) => e.zhi),
  ];
  return { gans, zhis };
}

export function analyzeGanZhi(
  pillars: Pillar[],
  extras: PillarC[] = [],
): GanZhiAnalysis | null {
  if (pillars.length !== 4) return null;
  const { gans, zhis } = seq(pillars, extras);

  const tg = TianGanDetector.detect(gans);
  const dz = DiZhiDetector.detect(zhis);

  return {
    天干: 叠加天干岁运(tg.hits, extras),
    地支: 叠加地支岁运(dz.hits, extras),
    子集: dz.subsets.map(({ sub, name, slots }) => ({ sub, name, slots })),
    争合: tg.zhenghe,
    整柱: pillars.map((p, slot) => ({ slot, state: detectWholePillar(p) })),
  };
}

// ———————————————————————————————————————————————
// pairwise — 两支/两干关系查表
// ———————————————————————————————————————————————
// 掩码即身份, 故直接查 XPCHC / HeHuiC / TianGanC 的 map, 不构造凑柱跑 detector.

/** 两支查表的结果 —— 命中的关系 (整局或子集). */
export interface PairZhi {
  /** 八类之一; 子集命中时为其所属 triple 的类 (三合 / 三会). */
  readonly kind: DiZhiRelKind;
  /** 全名 ("子午相冲" / "申子半合水局"). */
  readonly name: string;
  /** 子集名目 (半合 / 拱合 / 拱会); 整局命中时无. */
  readonly sub?: string;
  readonly rule: XPCHC | HeHuiC;
}

/**
 * 两支查表. 优先级 (与既有前端 extras 实现保持兼容):
 *   六合 → 六冲 → 六害 → 六破 → 刑 (子卯/三刑子集/自刑) → 半三合/拱合.
 * 半三会 与 暗合 不产. 找不到任何一类返回 null.
 */
export function pairwiseZhi(a: Zhi, b: Zhi): PairZhi | null {
  const A = ZhiC.from(a), B = ZhiC.from(b);
  const hehui = HeHuiC.at(A, B);
  const xpch = XPCHC.at(A, B);
  const pick = (r: XPCHC | HeHuiC | undefined): PairZhi | undefined =>
    r && { kind: r.kind, name: r.name, rule: r };

  // 六合 → 六冲 → 六害 → 六破 → 刑
  const first =
    pick(hehui.find((r) => r.kind === "六合"))
    ?? pick(xpch.find((r) => r.kind === "相冲"))
    ?? pick(xpch.find((r) => r.kind === "相害"))
    ?? pick(xpch.find((r) => r.kind === "相破"))
    ?? pick(xpch.find((r) => r.kind === "相刑"));
  if (first) return first;

  // 半三合 / 拱合 —— 同三合组的两支 (三合的 pair 子集)
  const pair = zhiMask([A, B]);
  for (const rule of HeHuiC.三合) {
    const sub = rule.subsets().find((s: HeHuiSubset) => s.mask === pair);
    if (sub) return { kind: rule.kind, name: sub.name, sub: sub.sub, rule };
  }
  return null;
}

/** 两干查表的结果. */
export interface PairGan {
  readonly kind: "相合" | "相克";
  readonly name: string;
  readonly rule: TianGanC;
}

/** 两干查表. 相合 优先, 其次 相克 (单向). 同五行 / 我生 / 我泄 不返回. */
export function pairwiseGan(a: Gan, b: Gan): PairGan | null {
  const rules = TianGanC.at(GanC.from(a), GanC.from(b));
  const he = rules.find((r) => r.kind === "相合");
  if (he) return { kind: "相合", name: he.name, rule: he };
  const ke = rules.find((r) => r.kind === "相克");
  if (ke) return { kind: "相克", name: ke.name, rule: ke };
  return null;
}
