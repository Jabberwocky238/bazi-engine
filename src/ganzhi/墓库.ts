/**
 * 墓库 (开 / 闭 / 静).
 * md: 墓库/墓库总论.md + 开库.md + 闭库.md + 出库.md
 *
 *   辰 = 水库 (癸), 未 = 木库 (乙), 戌 = 火库 (丁), 丑 = 金库 (辛)
 *
 *   开启路径:
 *     - 墓气透干无冲克         → 自动开库
 *     - 被对冲支冲 / 丑戌未三刑 → 冲 / 刑 开库
 *     - 特定天干组合冲开天库    → 丁癸 开辰戌, 乙辛 开未丑
 *   封闭路径:
 *     - 墓气透干 + 特定天干合   → 戊癸合辰, 乙庚合未, 丁壬合戌, 丙辛合丑
 *   默认:
 *     - 墓气未透 → 闭库
 */
import { GAN, ZHI, GANZHI_BITS, type Gan, type GanZhiMask, type WuXing, type Zhi, type Muku } from "@/types";
import { createTable, createBitList, type Table } from "@/bitmap";

// ———————————————————————————————————————————————
// 状态类型
// ———————————————————————————————————————————————
// 墓库为单一子类别, 状态由 透墓气 / 被冲 / 被刑 / 天干冲开 / 天干合闭 组合决定.

/** 墓库状态. */
export type MuKuState =
  | "静库"       // 墓气透但既未纯开也未合闭 (兜底)
  | "自动开库"   // 墓气透干无冲克
  | "冲刑开库"   // 被对冲支冲 / 丑戌未三刑
  | "天干冲开"   // 丁癸 冲开辰戌, 乙辛 冲开未丑
  | "天干合闭"   // 戊癸合辰 / 乙庚合未 / 丁壬合戌 / 丙辛合丑
  | "闭库";      // 墓气未透

// ———————————————————————————————————————————————
// 状态判定 — 5 个触发标志, 规则链定状态
// ———————————————————————————————————————————————
// 库只决定标志怎么算 (见 MUKU_RULES), 不影响标志组合如何定状态.

/** 状态标志位 (bit0..bit4). */
export const MUKU_FLAG_BITS = createBitList(
  ["透墓气", "被冲", "被刑", "天干冲开", "天干合闭"] as const,
);

/** 单个标志名. */
export type MuKuFlag = (typeof MUKU_FLAG_BITS.items)[number];
/** 标志组合. */
export type MuKuFlags = Partial<Record<MuKuFlag, boolean>>;

/** 规则链 — 顺序即优先级, 首个命中者定状态. */
const MUKU_STATE_RULES: readonly (readonly [MuKuState, (f: Required<MuKuFlags>) => boolean])[] = [
  ["冲刑开库", (f) => f.被冲 || f.被刑],
  ["自动开库", (f) => f.透墓气 && !f.天干合闭],
  ["天干冲开", (f) => f.天干冲开],
  ["天干合闭", (f) => f.天干合闭],
  ["闭库", (f) => !f.透墓气],
];

/** 判定状态. */
export function mukuState(flags: MuKuFlags): MuKuState {
  const f = Object.fromEntries(
    MUKU_FLAG_BITS.items.map((item) => [item, flags[item] ?? false]),
  ) as Required<MuKuFlags>;
  return MUKU_STATE_RULES.find(([, hit]) => hit(f))?.[0] ?? "静库";
}

/** Ordered treasury table, aligned with MUKU_ZHI_KEYS. */
export type MuKuQi = "本气" | "中气" | "余气" | null;
export const MUKU_QI_TABLE = [
  [null, null, null, null, null, null, null, null, null, null, null, null],
  [null, null, null, null, "中气", null, null, "余气", null, null, null, null],
  [null, null, null, null, null, null, null, null, null, null, null, null],
  [null, null, null, null, null, null, null, "中气", null, null, "余气", null],
  [null, null, null, null, "本气", null, null, null, null, null, "本气", null],
  [null, "本气", null, null, null, null, null, "本气", null, null, null, null],
  [null, null, null, null, null, null, null, null, null, null, null, null],
  [null, "余气", null, null, null, null, null, null, null, null, "中气", null],
  [null, null, null, null, null, null, null, null, null, null, null, null],
  [null, "中气", null, null, "余气", null, null, null, null, null, null, null],
] as const satisfies Table<MuKuQi, [10, 12]>;

export const MUKU_TABLE_WRAPPER = createTable(MUKU_QI_TABLE,GAN,ZHI);

/** 触发一条标志所需的干支 (全部到位才算命中). */
type MuKuRule = readonly [flag: MuKuFlag, zhi: Muku, needs: readonly (Gan | Zhi)[]];

/**
 * 触发规则 — needs 压成掩码后与命盘掩码做子集判定.
 * md: 开库.md (被冲 / 被刑 / 天干冲开) + 闭库.md (天干合闭).
 */
const MUKU_RULES: readonly MuKuRule[] = [
  // 对冲支 (辰↔戌, 丑↔未)
  ["被冲", "辰", ["戌"]], ["被冲", "戌", ["辰"]],
  ["被冲", "丑", ["未"]], ["被冲", "未", ["丑"]],
  // 丑戌未 三刑的两两组合 (库被刑)
  ["被刑", "丑", ["戌"]], ["被刑", "戌", ["未"]], ["被刑", "未", ["丑"]],
  // 丁癸 冲开辰戌, 乙辛 冲开未丑
  ["天干冲开", "辰", ["丁", "癸"]], ["天干冲开", "戌", ["丁", "癸"]],
  ["天干冲开", "未", ["乙", "辛"]], ["天干冲开", "丑", ["乙", "辛"]],
  // 戊癸合辰, 乙庚合未, 丁壬合戌, 丙辛合丑
  ["天干合闭", "辰", ["戊", "癸"]], ["天干合闭", "未", ["乙", "庚"]],
  ["天干合闭", "戌", ["丁", "壬"]], ["天干合闭", "丑", ["丙", "辛"]],
];

/** 预编译: 规则的 needs → 掩码, 避免每次判定重新 encode. */
const MUKU_RULE_MASKS: readonly (readonly [MuKuFlag, Muku, number])[] = MUKU_RULES.map(
  ([flag, zhi, needs]) => [flag, zhi, GANZHI_BITS.encode([...needs])] as const,
);

/** 命盘掩码 → 某库命中的标志集 (不含 透墓气, 它由墓气是否透干单独决定). */
export function triggeredFlags(zhi: Muku, mask: GanZhiMask): MuKuFlags {
  const flags: MuKuFlags = {};
  for (const [flag, ruleZhi, need] of MUKU_RULE_MASKS) {
    if (ruleZhi === zhi && (mask & need) === need) flags[flag] = true;
  }
  return flags;
}
