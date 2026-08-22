/**
 * 十神计算入口. 十神本身的定义按名字拆在同目录的 10 个文件里; 本文件只做
 * (a) 汇总注册表  (b) 派发函数 shishenOf  (c) 批量计算 computeShishen.
 */
import type { Gan, Pillar, Relation, WuXing, Zhi } from "../types.ts";
import { CANG_GAN } from "../wuxing.ts";
import { relationOf, wuxingRelations } from "../wuxing.ts";

import { 比肩 } from "./比肩.ts";
import { 劫财 } from "./劫财.ts";
import { 食神 } from "./食神.ts";
import { 伤官 } from "./伤官.ts";
import { 偏财 } from "./偏财.ts";
import { 正财 } from "./正财.ts";
import { 七杀 } from "./七杀.ts";
import { 正官 } from "./正官.ts";
import { 偏印 } from "./偏印.ts";
import { 正印 } from "./正印.ts";

export type Shishen = "比肩" | "劫财" | "食神" | "伤官" | "偏财" | "正财" | "七杀" | "正官" | "偏印" | "正印";
export type ShishenCat = "比劫" | "印" | "食伤" | "财" | "官杀";

export type ShishenDef = {
  name: Shishen;
  category: ShishenCat;
  relation: Relation;
  samePolarity: boolean;
  match: (day: Gan, other: Gan) => boolean;
}

export { 比肩 , 劫财, 食神, 伤官, 偏财, 正财, 七杀, 正官, 偏印, 正印 };


/** 按"先入先胜"顺序排; 每个样本满足恰好一个 def.match. */
export const SHISHEN_DEFS = [
  比肩, 劫财, 食神, 伤官, 偏财, 正财, 七杀, 正官, 偏印, 正印,
] as const;

/** 十神 → 大类 (比劫/印/食伤/财/官杀). */
export const ShishenMap = Object.fromEntries(
  SHISHEN_DEFS.map(d => [d.name, d]),
) as Record<Shishen, ShishenDef>;

export const SHI_SHEN_CAT: Record<Shishen, ShishenCat> = Object.fromEntries(
  Object.entries(ShishenMap).map(([name, def]) => [name, def.category]),
) as Record<Shishen, ShishenCat>

/**
 * 日主 `day` 对另一天干 `other` 的十神称谓.
 *   我生: 同阴阳=食神 异=伤官
 *   我克: 同=偏财 异=正财
 *   克我: 同=七杀 异=正官
 *   生我: 同=偏印 异=正印
 *   同类: 同=比肩 异=劫财
 */
export function shishenOf(day: Gan, other: Gan): Shishen {
  for (const def of SHISHEN_DEFS) {
    if (def.match(day, other)) return def.name;
  }
  throw new Error(`unreachable: no shishen match for day=${day} other=${other}`);
}

/**
 * 单柱十神结果. 适用于年/月/时主柱, 也适用于大运/流年/流月/流日/流时 等任意目标柱.
 * 当 target 与 day 是同一柱时, 天干十神为 "日主" (与日主自身的关系不入十神体系).
 */
export type ShishenResult = {
  /** target 天干对日主的十神 (target 即日主时为 "日主"). */
  十神: Shishen | "日主";
  /** target 地支藏干. */
  藏干: Gan[];
  /** target 藏干对日主的十神. */
  藏干十神: Shishen[];
  /** target 天干对日主的五行关系 (target 即日主时为 "同类"). */
  生克: Relation;
  /** target 藏干对日主的五行关系. */
  藏干生克: Relation[];
};

/** 计算目标柱相对日主的完整十神结果。 */
export function computeShishen(day: Pillar, target: Pillar | undefined): ShishenResult {
  if (!target) throw new Error("target pillar is required");
  const dayGan = day.gan;
  const isDayMaster = dayGan === target.gan && day.zhi === target.zhi;
  const 十神 = isDayMaster ? "日主" : computeShishenGan(dayGan, target.gan);
  const 藏干 = CANG_GAN[target.zhi];
  const 藏干十神 = computeShishenZhi(dayGan, target.zhi);
  const 生克 = isDayMaster ? "同类" : relationOf(dayGan, target.gan);
  const 藏干生克 = 藏干.map(g => relationOf(dayGan, g));
  return { 十神, 藏干, 藏干十神, 生克, 藏干生克 };
}

/**
 * 计算 target 柱对 day 柱 (日主) 的十神视图.
 *   - day:    日主柱 (取其天干为参考, 地支不参与).
 *   - target: 任意目标柱 — 主柱 (年/月/时) 或 大运/流年/流月/流日/流时.
 */

export function computeShishenGan(dayGan: Gan, targetGan: Gan): Shishen | "日主" {
  if (dayGan === targetGan) return "日主";
  return shishenOf(dayGan, targetGan);
}
  
export function computeShishenZhi(dayGan: Gan, targetZhi: Zhi): Shishen[] {
  const cangGan = CANG_GAN[targetZhi];
  return cangGan.map(g => shishenOf(dayGan, g));
} 

export function computeShishenWuxing(dayGan: Gan, targetShishen: Shishen): WuXing {
  const def = ShishenMap[targetShishen];
  return wuxingRelations(dayGan)[def.relation];
}
