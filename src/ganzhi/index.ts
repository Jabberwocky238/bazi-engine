/**
 * 合冲刑害入口 + 两支/两干 pairwise 查表.
 *
 *   : 天干五合 · 天干相冲 · 天干相克
 *   : 地支六合 · 地支三合 · 地支三会 · 地支暗合
 *         地支相刑 · 地支相冲 · 地支相破 · 地支相害 · 墓库
 *   : 盖头 · 截脚 · 覆载 (单柱内天干地支作用)
 *
 * 统一签名: detector.detect(pillars, extras) → Finding[].
 *   - pillars: 原局四主柱.
 *   - extras: 岁运柱 (大运 / 流年 / 流月 等); 不需要时传 [] 或省略.
 *
 * extras 引化 / 冲克 / 冲开 已由各 detector 内部直接挂在 Finding 上 (dissolved /
 * impacted / opened), 此层只负责调度 + 聚合, 不做后处理。
 *
 * pairwise (pairwiseZhi / pairwiseGan) 不再自维表, 而是构造含两支/两干的
 * 四柱后委托对应 detector 判定 —— detector 是唯一事实源, 不再有会漂移的影子表.
 *   - 地支判断不需天干, 凑柱时随便填干即可.
 *   - 半三会 已废弃 (三会 detector 仅对 首+末 输出拱会, 不产半会; pairwise 同步不产).
 */
import type { Gan, Pillar, Zhi } from "../types.ts";
import { ZHI } from "../types.ts";
import type { ExtraPillar } from "./common.ts";

export * from "./common.ts";
export * from "../tables.ts";

// --- 天干 ---------------------------------------------------------------
import { 天干五合, type TianGanWuHeFinding, type WuHeFinding } from "./天干五合.ts";
import { 天干相冲, type TianGanChongFinding } from "./天干相冲.ts";
import { 天干相克, type TianGanKeFinding } from "./天干相克.ts";

// --- 地支 ---------------------------------------------------------------
import { 地支六合, type LiuHeFinding } from "./地支六合.ts";
import { 地支三合, type SanHeFinding } from "./地支三合.ts";
import { 地支三会, type SanHuiFinding } from "./地支三会.ts";
import { 地支暗合, type AnHeFinding } from "./地支暗合.ts";
import { 地支相刑, type XingFinding } from "./地支相刑.ts";
import { 地支相冲, type ChongFinding } from "./地支相冲.ts";
import { 地支相破, type PoFinding } from "./地支相破.ts";
import { 地支相害, type HaiFinding } from "./地支相害.ts";
import { 墓库, type MuKuFinding } from "./墓库.ts";

// --- 整柱 ---------------------------------------------------------------
import { detect as detectWholePillar, type WholePillarFinding } from "./盖头截脚覆载.ts";

export interface GanZhiAnalysis {
  // 合类 (含五合子态 争合/妒合)
  天干五合: TianGanWuHeFinding[];
  地支六合: LiuHeFinding[];
  地支三合: SanHeFinding[];
  地支三会: SanHuiFinding[];
  地支暗合: AnHeFinding[];
  // 冲克刑害破类
  天干相冲: TianGanChongFinding[];
  天干相克: TianGanKeFinding[];
  地支相冲: ChongFinding[];
  地支相刑: XingFinding[];
  地支相破: PoFinding[];
  地支相害: HaiFinding[];
  // 墓库
  墓库: MuKuFinding[];
  // 整柱
  盖头截脚覆载: [WholePillarFinding?, WholePillarFinding?, WholePillarFinding?, WholePillarFinding?];
}

export function analyzeGanZhi(
  pillars: Pillar[],
  extras: ExtraPillar[] = [],
): GanZhiAnalysis | null {
  if (pillars.length !== 4) return null;
  return {
    天干五合: 天干五合.detect(pillars, extras),
    天干相冲: 天干相冲.detect(pillars, extras),
    天干相克: 天干相克.detect(pillars, extras),
    地支六合: 地支六合.detect(pillars, extras),
    地支三合: 地支三合.detect(pillars, extras),
    地支三会: 地支三会.detect(pillars, extras),
    地支暗合: 地支暗合.detect(pillars, extras),
    地支相刑: 地支相刑.detect(pillars, extras),
    地支相冲: 地支相冲.detect(pillars, extras),
    地支相破: 地支相破.detect(pillars, extras),
    地支相害: 地支相害.detect(pillars, extras),
    墓库: 墓库.detect(pillars, extras),
    盖头截脚覆载: [
      detectWholePillar(pillars[0] as Pillar, 0),
      detectWholePillar(pillars[1] as Pillar, 1),
      detectWholePillar(pillars[2] as Pillar, 2),
      detectWholePillar(pillars[3] as Pillar, 3),
    ],
  };
}

// ———————————————————————————————————————————————
// pairwise — 两支/两干关系查表 (委托 detector, 返回 detector 的 finding)
// ———————————————————————————————————————————————
// detector 是唯一事实源, 此处不维影子表:
//   - 寅午 在 半三合 中跳过 (三合.detect 内部 BANHE_SKIP), 委托后自动一致.
//   - 半三会 已废弃 (三会.detect 不产半会).
//   - 暗合 由 地支暗合.detect 处理 (与 半三合 / 六合 多义时无统一优先级), pairwise 不含.
// 返回值即 detector 产出的结构化 finding (各 detector 的输出类型), 无 PairResult 包装.

/** 地支六冲对. */
export const CHONG_PAIR: Readonly<Record<Zhi, Zhi>> = {
  子: "午", 午: "子",
  卯: "酉", 酉: "卯",
  寅: "申", 申: "寅",
  巳: "亥", 亥: "巳",
  辰: "戌", 戌: "辰",
  丑: "未", 未: "丑",
};

/** 找一个与 a,b 均不同的占位支 (取 ZHI 中首个可用者). */
function pickFiller(a: Zhi, b: Zhi): Zhi {
  return ZHI.find((z) => z !== a && z !== b) ?? "子";
}

/**
 * 构造含两支 a,b 的四柱 (地支判断不需天干, 干随便填).
 * a 放位 0, b 放位 1; 位 2/3 用与 a,b 都不同的占位支, 避免占位支参与关系干扰.
 * a==b 时位 0/1 同支 —— 供 地支相刑 产出 自刑 (slots [0,1]).
 */
function zhiPillars(a: Zhi, b: Zhi): Pillar[] {
  const f = pickFiller(a, b);
  return [
    { gan: "甲", zhi: a },
    { gan: "甲", zhi: b },
    { gan: "甲", zhi: f },
    { gan: "甲", zhi: f },
  ];
}

/** finding 的 slots 是否恰为 {0,1} (即同时落在 a 位与 b 位). */
function hits01(f: { slots: readonly number[] }): boolean {
  const s = f.slots;
  return s.length === 2 && s.includes(0) && s.includes(1);
}

/** pairwiseZhi 可能返回的 finding 联合 (各 detector 输出类型). */
export type PairwiseZhi =
  | LiuHeFinding | ChongFinding | HaiFinding | PoFinding
  | XingFinding | SanHeFinding;

/**
 * 两支查表. 优先级 (与既有前端 extras 实现保持兼容):
 *   自刑 → 六合 → 六冲 → 六害 → 六破 → 子卯刑 → 三刑 → 半三合/拱合.
 * 半三会已废弃. 找不到任何一类返回 null.
 *
 * 实现委托各 detector: 构造含 a,b 的四柱后调 detector, 找出 slots 恰为 {0,1} 的 finding.
 * 自刑 (a==b 且属自刑支) 由 地支相刑.detect 在 [a,a,...] 上产出 ZiXingInfo (slots [0,1]),
 * 经相刑分支 (state "相刑" | "自刑") 返回 —— 无需自维自刑支表.
 */
export function pairwiseZhi(a: Zhi, b: Zhi): PairwiseZhi | null {
  const ps = zhiPillars(a, b);

  // 六合
  const lh = 地支六合.detect(ps).find(hits01);
  if (lh) return lh;

  // 六冲
  const c = 地支相冲.detect(ps).find(hits01);
  if (c) return c;

  // 六害
  const hai = 地支相害.detect(ps).find(hits01);
  if (hai) return hai;

  // 六破
  const po = 地支相破.detect(ps).find(hits01);
  if (po) return po;

  // 相刑 (子卯 / 三刑 pair 子集 / 自刑) —— 两支条目 (slots 长度 2)
  const xing = 地支相刑.detect(ps).find((f) =>
    (f.state === "相刑" || f.state === "自刑") && hits01(f));
  if (xing) return xing;

  // 半三合 / 拱合 (同三合组的两支; 寅午由 detector 跳过)
  const sh = 地支三合.detect(ps).find((f) =>
    (f.sub === "半合" || f.sub === "拱合") && hits01(f));
  if (sh) return sh;

  return null;
}

/** 构造含两干 a,b 的四柱 (凑柱地支随便填). a 放位 0, b 放位 1. */
function ganPillars(a: Gan, b: Gan): Pillar[] {
  return [
    { gan: a, zhi: "子" },
    { gan: b, zhi: "子" },
    { gan: "甲", zhi: "子" },
    { gan: "甲", zhi: "子" },
  ];
}

/** pairwiseGan 可能返回的 finding 联合. */
export type PairwiseGan = WuHeFinding | TianGanKeFinding;

/** 两干查表. 五合 优先, 其次 相克 (单向), 同五行 / 我生 / 我泄 不返回.
 *  委托 天干五合 / 天干相克 detector, 返回其 finding. */
export function pairwiseGan(a: Gan, b: Gan): PairwiseGan | null {
  const ps = ganPillars(a, b);

  // 天干五合
  const he = 天干五合.detect(ps).find((f) => f.kind === "天干五合" && hits01(f));
  if (he && he.kind === "天干五合") return he;

  // 天干相克
  const ke = 天干相克.detect(ps).find((f) => f.kind === "天干相克" && hits01(f));
  if (ke && ke.kind === "天干相克") return ke;

  return null;
}
