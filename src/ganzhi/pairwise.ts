/**
 * 两支/两干 关系查表 (extras × 主柱). 引擎 detector 走的是 4 主柱整体扫描;
 * 大运/流年/流月 与命局某柱的两两关系只是其中很小的一部分查表, 抽到这里
 * 给前端 (或任何调用方) 直接用, 避免上层重写一份会与 detector 漂移的影子表.
 *
 * 与各 detector 的规则口径保持一致:
 *   - 寅午 在 半三合 中 跳过 (engine 三合.ts BANHE_SKIP), 此处同步跳过.
 *   - 暗合 不在本表内: 与 半三合 / 六合 多义重叠时无统一优先级,
 *     保留给整体扫描的 地支暗合.detect 处理.
 */
import type { Gan, Zhi, WuXing } from "../types.ts";
import { GAN_WUXING } from "./common.ts";
import { CONTROLS } from "../wuxing.ts";

// ————————————————————————————————————————————————————————
// 公开常量
// ————————————————————————————————————————————————————————

/** 地支六冲对. */
export const CHONG_PAIR: Readonly<Record<Zhi, Zhi>> = {
  子: "午", 午: "子",
  卯: "酉", 酉: "卯",
  寅: "申", 申: "寅",
  巳: "亥", 亥: "巳",
  辰: "戌", 戌: "辰",
  丑: "未", 未: "丑",
};

/** 阳干集合 (甲丙戊庚壬). */
export const YANG_GANS: ReadonlySet<Gan> = new Set<Gan>(["甲", "丙", "戊", "庚", "壬"]);

// ————————————————————————————————————————————————————————
// 内部查表
// ————————————————————————————————————————————————————————

const LIU_HE_PARTNER: Readonly<Record<Zhi, Zhi>> = {
  子: "丑", 丑: "子",
  寅: "亥", 亥: "寅",
  卯: "戌", 戌: "卯",
  辰: "酉", 酉: "辰",
  巳: "申", 申: "巳",
  午: "未", 未: "午",
};

/** 六合化气 (午未 取 土, 与 detector 同口径; "火土" 双化气在 detector 内描述). */
const LIU_HE_HUA: Readonly<Record<string, WuXing>> = {
  子丑: "土", 寅亥: "木", 卯戌: "火",
  辰酉: "金", 巳申: "水", 午未: "土",
};

const LIU_HAI: Readonly<Record<Zhi, Zhi>> = {
  子: "未", 未: "子",
  丑: "午", 午: "丑",
  寅: "巳", 巳: "寅",
  卯: "辰", 辰: "卯",
  申: "亥", 亥: "申",
  酉: "戌", 戌: "酉",
};

const LIU_PO: Readonly<Record<Zhi, Zhi>> = {
  子: "酉", 酉: "子",
  卯: "午", 午: "卯",
  寅: "亥", 亥: "寅",
  巳: "申", 申: "巳",
  辰: "丑", 丑: "辰",
  戌: "未", 未: "戌",
};

const SAN_HE_GROUPS: ReadonlyArray<{ zhis: ReadonlySet<Zhi>; wx: WuXing }> = [
  { zhis: new Set<Zhi>(["申", "子", "辰"]), wx: "水" },
  { zhis: new Set<Zhi>(["亥", "卯", "未"]), wx: "木" },
  { zhis: new Set<Zhi>(["寅", "午", "戌"]), wx: "火" },
  { zhis: new Set<Zhi>(["巳", "酉", "丑"]), wx: "金" },
];

const SAN_HUI_GROUPS: ReadonlyArray<{ zhis: ReadonlySet<Zhi>; wx: WuXing }> = [
  { zhis: new Set<Zhi>(["寅", "卯", "辰"]), wx: "木" },
  { zhis: new Set<Zhi>(["巳", "午", "未"]), wx: "火" },
  { zhis: new Set<Zhi>(["申", "酉", "戌"]), wx: "金" },
  { zhis: new Set<Zhi>(["亥", "子", "丑"]), wx: "水" },
];

const SAN_XING_GROUPS: ReadonlyArray<ReadonlySet<Zhi>> = [
  new Set<Zhi>(["寅", "巳", "申"]),
  new Set<Zhi>(["丑", "戌", "未"]),
];

const ZIXING_ZHIS: ReadonlySet<Zhi> = new Set<Zhi>(["辰", "午", "酉", "亥"]);

const ZIKAO_PAIR: Readonly<Record<string, Zhi>> = { 子: "卯", 卯: "子" };

/** 半三合 跳过对 (与 detector 三合.ts 同口径; 寅午 归 暗合 处理). */
const BANHE_SKIP: ReadonlySet<string> = new Set(["寅午", "午寅"]);

const TIAN_HE: Readonly<Record<Gan, readonly [Gan, WuXing]>> = {
  甲: ["己", "土"], 己: ["甲", "土"],
  乙: ["庚", "金"], 庚: ["乙", "金"],
  丙: ["辛", "水"], 辛: ["丙", "水"],
  丁: ["壬", "木"], 壬: ["丁", "木"],
  戊: ["癸", "火"], 癸: ["戊", "火"],
};

// ————————————————————————————————————————————————————————
// 公开 API
// ————————————————————————————————————————————————————————

export type PairKind =
  | "六合" | "半三合" | "半三会"
  | "六冲" | "六害" | "六破"
  | "相刑" | "自刑"
  | "天干五合" | "天干相克";

export interface PairResult {
  kind: PairKind;
  /** 化气五行 (六合 / 半三合 / 半三会 / 天干五合 才有). */
  huaWx?: WuXing;
  /** 形如 "寅亥六合木" / "甲己合化土" / "子午相冲". */
  note: string;
}

/**
 * 两支查表. 优先级 (与既有前端 extras 实现保持兼容):
 *   自刑 → 六合 → 六冲 → 六害 → 六破 → 子卯刑 → 三刑 → 半三合 → 半三会.
 * 找不到任何一类返回 null.
 */
export function pairwiseZhi(a: Zhi, b: Zhi): PairResult | null {
  if (a === b) {
    if (ZIXING_ZHIS.has(a)) return { kind: "自刑", note: `${a}${b}自刑` };
    return null;
  }
  if (LIU_HE_PARTNER[a] === b) {
    const huaWx = LIU_HE_HUA[`${a}${b}`] ?? LIU_HE_HUA[`${b}${a}`];
    return { kind: "六合", huaWx, note: `${a}${b}六合${huaWx ?? ""}` };
  }
  if (CHONG_PAIR[a] === b) return { kind: "六冲", note: `${a}${b}相冲` };
  if (LIU_HAI[a] === b) return { kind: "六害", note: `${a}${b}相害` };
  if (LIU_PO[a] === b) return { kind: "六破", note: `${a}${b}相破` };
  if (ZIKAO_PAIR[a] === b) return { kind: "相刑", note: `${a}${b}相刑` };
  for (const sx of SAN_XING_GROUPS) {
    if (sx.has(a) && sx.has(b)) return { kind: "相刑", note: `${a}${b}相刑` };
  }
  if (!BANHE_SKIP.has(`${a}${b}`)) {
    for (const sh of SAN_HE_GROUPS) {
      if (sh.zhis.has(a) && sh.zhis.has(b)) {
        return { kind: "半三合", huaWx: sh.wx, note: `${a}${b}半三合${sh.wx}` };
      }
    }
  }
  for (const sh of SAN_HUI_GROUPS) {
    if (sh.zhis.has(a) && sh.zhis.has(b)) {
      return { kind: "半三会", huaWx: sh.wx, note: `${a}${b}半三会${sh.wx}` };
    }
  }
  return null;
}

/** 两干查表. 五合 优先, 其次 相克 (单向), 同五行 / 我生 / 我泄 不返回. */
export function pairwiseGan(a: Gan, b: Gan): PairResult | null {
  const he = TIAN_HE[a];
  if (he && he[0] === b) return { kind: "天干五合", huaWx: he[1], note: `${a}${b}合化${he[1]}` };
  const aWx = GAN_WUXING[a], bWx = GAN_WUXING[b];
  if (CONTROLS[aWx] === bWx) return { kind: "天干相克", note: `${a}克${b}` };
  if (CONTROLS[bWx] === aWx) return { kind: "天干相克", note: `${b}克${a}` };
  return null;
}
