/**
 * 十神计算入口. 十神本身的定义按名字拆在同目录的 10 个文件里; 本文件只做
 * (a) 汇总注册表  (b) 派发函数 shishenOf  (c) 批量计算 computeShishen.
 */
import type { Gan, GanC, Pillar, Relation, WuXing, Zhi, ZhiC } from "./types.ts";
import { CANG_GAN, GAN } from "@/types.ts";
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
export const SHISHEN = ["正官", "七杀", "正印", "偏印", "劫财", "比肩", "伤官", "食神", "正财", "偏财"] as const
export type Shishen = typeof SHISHEN[number]
export const SHISHEN_CAT = ["比劫", "印", "食伤", "财", "官杀"] as const
export type ShishenCat = typeof SHISHEN_CAT[number]

const SHISHEN_BY_CAT_POLARITY = [
    ["比肩", "劫财"], // 比劫
    ["食神", "伤官"], // 食伤
    ["偏财", "正财"], // 财
    ["七杀", "正官"], // 官杀
    ["偏印", "正印"], // 印
] as const satisfies Table<Shishen, [5, 2]>;

export const SHISHEN_BY_CAT_POLARITY_TABLE = createTable(
    SHISHEN_BY_CAT_POLARITY,
    SHISHEN_CAT,
    [1, 0],
);
export class ShishenC {
    private constructor(public readonly str: Shishen) { }

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

    get cat(): ShishenCC {
        return ShishenCC.from(ShishenC.catMap[this.str])
    }
}
export class ShishenCC {
    private constructor(public readonly str: ShishenCat) { }

    static map = {
        比劫: new ShishenCC("比劫"),
        食伤: new ShishenCC("食伤"),
        财: new ShishenCC("财"),
        官杀: new ShishenCC("官杀"),
        印: new ShishenCC("印"),
    } satisfies Record<ShishenCat, ShishenCC>;

    static from(str: ShishenCat): ShishenCC {
        return ShishenCC.map[str];
    }
    get relation(): Relation {
        switch(this.str) {
            case "印": return "生我"
            case "官杀": return "克我"
            case "比劫": return "同类"
            case "财": return "我克"
            case "食伤": return "我生"
        }
    }
    cast(yang: boolean): ShishenC {
        return ShishenC.from(SHISHEN_BY_CAT_POLARITY_TABLE[this.str][yang ? 1 : 0] as Shishen)
    }

}


/**
 * 日主 `day` 对另一天干 `other` 的十神称谓.
 *   我生: 同阴阳=食神 异=伤官
 *   我克: 同=偏财 异=正财
 *   克我: 同=七杀 异=正官
 *   生我: 同=偏印 异=正印
 *   同类: 同=比肩 异=劫财
 */
export function shishenOf(day: GanC, other: GanC): ShishenC {
    return ShishenC.from(SHISHEN_TABLE_WRAPPER[day.str][other.str]);
}
