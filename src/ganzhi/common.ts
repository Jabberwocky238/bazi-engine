/**
 * 干支基础 + 合冲刑害共享类型与小工具.
 *
 * 第一段: 天干 / 地支 五行属性, 地支藏干, 阴阳判断.
 * 第二段: 合冲刑害 detect 共用的类型 / 工具, 不放具体类别的查表 const ——
 *        每个类别的对照表放在各自文件内.
 *
 * 类别编目 (API 权威清单, 共 9 个):
 *   天干: 天干五合 / 天干相克
 *     (天干相冲并入天干相克; API 对天干冲克统一标 "相克")
 *   地支: 地支六合 / 地支三合 / 地支三会 / 地支暗合
 *         地支相刑 / 地支相冲 / 地支相破 / 地支相害
 *
 * 墓库 为工具附加, 不在 API 清单内.
 * 争合 / 妒合 为 天干五合 的子态, 单独成条便于展示.
 */
import { LunarUtil } from "lunar-typescript";
import type { Gan, Pillar, WuXing, Zhi } from "../types.ts";
import { GAN } from "../types.ts";


/** 阳干: 甲丙戊庚壬 (GAN 索引偶数). */
export function isYangGan(g: Gan): boolean {
  return GAN.indexOf(g) % 2 === 0;
}

export function ganWuxing(g: Gan): WuXing { return LunarUtil.WU_XING_GAN[g] as WuXing; }
export function zhiWuxing(z: Zhi): WuXing { return LunarUtil.WU_XING_ZHI[z] as WuXing; }

// ———————————————————————————————————————————————
// 合冲刑害 共享类型
// ———————————————————————————————————————————————

export type Pos = "年" | "月" | "日" | "时";
export const POS_NAMES: readonly Pos[] = ["年", "月", "日", "时"];

// ———————————————————————————————————————————————
// extras (大运/流年/流月) 输入 + 关系
// ———————————————————————————————————————————————
export const PILLAR_LABELS = ['年柱', '月柱', '日柱', '时柱', '大运', '流年', '流月', '流日', '流时'] as const
export type PillarType = typeof PILLAR_LABELS[number]

/** 岁运柱 — 大运 / 流年 / 流月 等任意标签的单柱输入. */
export interface ExtraPillar {
  /** 任意标签, 通常为 "大运" / "流年" / "流月". */
  label: PillarType;
  gan: Gan;
  zhi: Zhi;
}

/** Finding 状态字段的来源标记 (dissolved / impacted / opened 各自 FindingMod[]). */
export interface FindingMod {
  by: ExtraPillar;
  /** 触发关系的 finding.name, 形如 "申子半合水局" / "甲己合化土" / "子午相冲". */
  via: string;
}

export interface GanSlot { pos: number; gan: Pillar["gan"] }
export interface ZhiSlot { pos: number; zhi: Pillar["zhi"] }

export function collectGans(pillars: Pillar[]): GanSlot[] {
  return pillars.map((p, i) => ({ pos: i, gan: p.gan }));
}
export function collectZhis(pillars: Pillar[]): ZhiSlot[] {
  return pillars.map((p, i) => ({ pos: i, zhi: p.zhi }));
}

/** 紧贴 = 相邻位 (差 1). */
export function adjacent(i: number, j: number): boolean {
  return Math.abs(i - j) === 1;
}

/** 把位置索引数组压成形如 "年月日" 的串. */
export function posRange(idxs: readonly number[]): string {
  return idxs.map((i) => POS_NAMES[i]).join("");
}

/** 命局天干是否透出指定五行. */
export function isGanTou(pillars: Pillar[], wx: WuXing): boolean {
  return pillars.some((p) => ganWuxing(p.gan) === wx);
}

/** 命局是否有指定天干. */
export function hasGan(pillars: Pillar[], gan: string): boolean {
  return pillars.some((p) => p.gan === gan);
}

// ———————————————————————————————————————————————
// extras 状态助手 — detectors 在生成 Finding 时直接挂状态用
// ———————————————————————————————————————————————

import { pairwiseGan, pairwiseZhi } from "./index.ts";

/** extras 中与本组 zhis 形成 六合 / 半三合 / 拱合 的 → 引化 (合解 冲/克/刑/害/破). */
export function dissolversByZhi(zhis: Iterable<Zhi>, extras: ExtraPillar[]): FindingMod[] {
  const out: FindingMod[] = [];
  for (const e of extras) {
    for (const z of zhis) {
      const r = pairwiseZhi(e.zhi, z);
      if (r && (
        r.kind === "地支六合"
        || (r.kind === "地支三合" && (r.sub === "半合" || r.sub === "拱合"))
      )) {
        out.push({ by: e, via: r.name });
        break;
      }
    }
  }
  return out;
}

/** extras 中与本组 gans 形成 天干五合 的 → 引化 (合解 天干冲/克). */
export function dissolversByGan(gans: Iterable<Gan>, extras: ExtraPillar[]): FindingMod[] {
  const out: FindingMod[] = [];
  for (const e of extras) {
    for (const g of gans) {
      const r = pairwiseGan(e.gan, g);
      if (r && r.kind === "天干五合") {
        out.push({ by: e, via: r.name });
        break;
      }
    }
  }
  return out;
}

/** extras 中与本组 zhis 形成 六冲 的 → 冲克 (击破 地支合). */
export function impactorsByZhi(zhis: Iterable<Zhi>, extras: ExtraPillar[]): FindingMod[] {
  const out: FindingMod[] = [];
  for (const e of extras) {
    for (const z of zhis) {
      const r = pairwiseZhi(e.zhi, z);
      if (r && r.kind === "地支相冲") {
        out.push({ by: e, via: r.name });
        break;
      }
    }
  }
  return out;
}

/** extras 中与本组 gans 形成 天干相克 的 → 冲克 (击破 天干合). */
export function impactorsByGan(gans: Iterable<Gan>, extras: ExtraPillar[]): FindingMod[] {
  const out: FindingMod[] = [];
  for (const e of extras) {
    for (const g of gans) {
      const r = pairwiseGan(e.gan, g);
      if (r && r.kind === "天干相克") {
        out.push({ by: e, via: r.name });
        break;
      }
    }
  }
  return out;
}

/** extras 中与本柱地支 六冲 的 → 冲开 (墓库). */
export function openersByZhi(muZhi: Zhi, extras: ExtraPillar[]): FindingMod[] {
  const out: FindingMod[] = [];
  for (const e of extras) {
    const r = pairwiseZhi(e.zhi, muZhi);
    if (r && r.kind === "地支相冲") {
      out.push({ by: e, via: r.name });
    }
  }
  return out;
}

// ———————————————————————————————————————————————
// 位图关系推断 — 天干.ts / 地支.ts 共用
// ———————————————————————————————————————————————
// 一组干支的掩码即该关系的身份, 判定只是 (盘 & 键) === 键.
// 本段与具体是干还是支无关, 故泛型化: Item 为 GanC | ZhiC.

/** 掩码里有几位. */
export function popcount(m: number): number {
  let n = 0;
  for (let x = m; x; x &= x - 1) n++;
  return n;
}

/** 笛卡尔积 — 各位置的下标各取一个. */
export function product(lists: readonly (readonly number[])[]): readonly (readonly number[])[] {
  return lists.reduce<readonly (readonly number[])[]>(
    (acc, list) => acc.flatMap((pre) => list.map((v) => [...pre, v])),
    [[]],
  );
}

/** 下标数组 → 位掩码 (bit i = 占第 i 柱). */
export function slotsToMask(slots: readonly number[]): number {
  return slots.reduce((m, i) => m | (1 << i), 0);
}

/** item → 其出现的全部下标 (升序). */
export function slotIndex<T>(items: readonly T[]): ReadonlyMap<T, number[]> {
  const m = new Map<T, number[]>();
  items.forEach((it, i) => {
    const arr = m.get(it);
    if (arr) arr.push(i); else m.set(it, [i]);
  });
  return m;
}

/** 一条命中: 关系 + 命中它的那几个下标 (升序). */
export interface BitHit<R> {
  readonly rule: R;
  readonly slots: readonly number[];
}

/** 位图关系的最小形状 —— 掩码即身份. */
export interface BitRule {
  readonly mask: number;
  readonly size: number;
}

/**
 * 批量推断 —— 逐条 & 一下即知命中.
 *
 * 掩码只答"有没有"; 一位重出多次时同一关系成立多次 (子午子午 有 4 组子午冲),
 * 故命中后取各位下标的笛卡尔积, 每个组合各出一条 —— 计数即条数.
 * 单位掩码 (自刑 之类) 须重出 ≥2 次, 且只出一条, slots 列全部重出位.
 */
export function inferBitHits<T, R extends BitRule>(
  rules: readonly R[],
  items: readonly T[],
  itemsOf: (mask: number) => readonly T[],
  maskOf: (items: readonly T[]) => number,
): readonly BitHit<R>[] {
  const slotsOf = slotIndex(items);
  const mask = maskOf(items);

  const out: BitHit<R>[] = [];
  for (const rule of rules) {
    if ((mask & rule.mask) !== rule.mask) continue;   // ← 判定就这一句
    const members = itemsOf(rule.mask);
    if (rule.size === 1) {
      const ss = slotsOf.get(members[0]!)!;
      if (ss.length >= 2) out.push({ rule, slots: [...ss] });
      continue;
    }
    for (const slots of product(members.map((it) => slotsOf.get(it)!))) {
      out.push({ rule, slots: [...slots].sort((a, b) => a - b) });
    }
  }
  return out;
}
