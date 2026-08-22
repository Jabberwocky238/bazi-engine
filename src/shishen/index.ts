/**
 * 十神计算入口. 十神本身的定义按名字拆在同目录的 10 个文件里; 本文件只做
 * (a) 汇总注册表  (b) 派发函数 shishenOf  (c) 批量计算 computeShishen.
 */
import type { Gan, GanC, Pillar, Relation, WuXing, Zhi, ZhiC } from "../types.ts";
import { CANG_GAN, GAN } from "@/types.ts";

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
import { createTable, type Table } from "@/bitmap.ts";
const SHISHEN_TABLE = [
  //       甲      乙      丙      丁      戊      己      庚      辛      壬      癸
  ["比肩", "劫财", "食神", "伤官", "偏财", "正财", "七杀", "正官", "偏印", "正印"], // 甲
  ["劫财", "比肩", "伤官", "食神", "正财", "偏财", "正官", "七杀", "正印", "偏印"], // 乙
  ["偏印", "正印", "比肩", "劫财", "食神", "伤官", "偏财", "正财", "七杀", "正官"], // 丙
  ["正印", "偏印", "劫财", "比肩", "伤官", "食神", "正财", "偏财", "正官", "七杀"], // 丁
  ["七杀", "正官", "偏印", "正印", "比肩", "劫财", "食神", "伤官", "偏财", "正财"], // 戊
  ["正官", "七杀", "正印", "偏印", "劫财", "比肩", "伤官", "食神", "正财", "偏财"], // 己
  ["偏财", "正财", "七杀", "正官", "偏印", "正印", "比肩", "劫财", "食神", "伤官"], // 庚
  ["正财", "偏财", "正官", "七杀", "正印", "偏印", "劫财", "比肩", "伤官", "食神"], // 辛
  ["食神", "伤官", "偏财", "正财", "七杀", "正官", "偏印", "正印", "比肩", "劫财"], // 壬
  ["伤官", "食神", "正财", "偏财", "正官", "七杀", "正印", "偏印", "劫财", "比肩"], // 癸
] as const satisfies Table<Shishen, [10, 10]>;

export const SHISHEN_TABLE_WRAPPER = createTable(
  SHISHEN_TABLE,
  GAN,
  GAN,
);
export type Shishen = "比肩" | "劫财" | "食神" | "伤官" | "偏财" | "正财" | "七杀" | "正官" | "偏印" | "正印";
export type ShishenCat = "比劫" | "印" | "食伤" | "财" | "官杀";
export class ShishenC extends String {
  private constructor(public readonly str: Shishen) {
    super(str)
  }

  static map = {
    比肩: new ShishenC("比肩"),
    劫财: new ShishenC("劫财"),
    食神: new ShishenC("食神"),
    伤官: new ShishenC("伤官"),
    偏财: new ShishenC("偏财"),
    正财: new ShishenC("正财"),
    七杀: new ShishenC("七杀"),
    正官: new ShishenC("正官"),
    偏印: new ShishenC("偏印"),
    正印: new ShishenC("正印"),
  } satisfies Record<Shishen, ShishenC>;

  static catMap = {
    比肩: "比劫",
    劫财: "比劫",
    食神: "食伤",
    伤官: "食伤",
    偏财: "财",
    正财: "财",
    七杀: "官杀",
    正官: "官杀",
    偏印: "印",
    正印: "印",
  } satisfies Record<Shishen, ShishenCat>;

  static from(str: Shishen): ShishenC {
    return ShishenC.map[str];
  }

  get cat(): ShishenCat {
    return ShishenC.catMap[this.str];
  }

  get is比劫(): boolean {
    return this.cat === "比劫";
  }

  get is印(): boolean {
    return this.cat === "印";
  }

  get is食伤(): boolean {
    return this.cat === "食伤";
  }

  get is财(): boolean {
    return this.cat === "财";
  }

  get is官杀(): boolean {
    return this.cat === "官杀";
  }
}
export type ShishenDef = {
  name: Shishen;
  category: ShishenCat;
  relation: Relation;
  samePolarity: boolean;
  match: (day: Gan, other: Gan) => boolean;
}

export { 比肩, 劫财, 食神, 伤官, 偏财, 正财, 七杀, 正官, 偏印, 正印 };


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
export function shishenOf(day: GanC, other: GanC): ShishenC {
  return SHISHEN_TABLE_WRAPPER[day.str][other.str];
}
export function shishenOfZhi(day: GanC, zhi: ZhiC): ShishenC[] {
  return CANG_GAN[zhi.str].map(
    (hiddenGan) => SHISHEN_TABLE_WRAPPER[day.str][hiddenGan.str],
  ).map(i => ShishenC.from(i));
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
