/**
 * 十神计算入口. 十神本身的定义按名字拆在同目录的 10 个文件里; 本文件只做
 * (a) 汇总注册表  (b) 派发函数 shishenOf  (c) 批量计算 computeShishen.
 */
import type { Gan, Pillar, Relation, WuXing, WuXingC, Zhi, ZhiC } from "./types.ts";
import { CANG_GAN, GAN, GanC } from "./types.ts";
import { createTable, type Table } from "./bitmap.ts";
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
    ["劫财", "比肩"], // 比劫
    ["伤官", "食神"], // 食伤
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

/** 日主 `day` 对某天干的十神. (原 GanC.shishenGan; 移出 types.ts 以断开循环依赖.) */
export function shishenGan(day: GanC, targetGan: GanC): ShishenC {
    return shishenOf(day, targetGan);
}

/** 日主 `day` 对某地支各藏干的十神. (原 GanC.shishenZhi.) */
export function shishenZhi(day: GanC, targetZhi: ZhiC): ShishenC[] {
    return targetZhi.canggan().map(g => shishenOf(day, g));
}

/** 日主 `day` 之某十神所属五行. (原 GanC.shishenWuxing.) */
export function shishenWuxing(day: GanC, targetShishen: ShishenC): WuXingC {
    return day.wuxing.relationFrom(targetShishen.cat.relation);
}

/** 一柱的十神结果 —— 日主柱的 十神 记 "日主". */
export interface PillarShishen {
    /** 该柱天干的十神; 日主柱为 "日主". */
    十神: Shishen | "日主";
    /** 该柱地支藏干. */
    藏干: Gan[];
    /** 各藏干对应的十神 (与 藏干 同序). */
    藏干十神: Shishen[];
}

/**
 * 一柱相对日主 `day` 的十神 —— 天干十神 + 地支藏干及其十神.
 * `target` 即日主柱时 十神 记 "日主" (日主自身不论十神).
 */
export function computeShishen(day: Pillar, target: Pillar): PillarShishen {
    const dayGan = GanC.from(day.gan);
    const isRizhu = target === day;
    const canggan = CANG_GAN[target.zhi];
    return {
        十神: isRizhu ? "日主" : shishenOf(dayGan, GanC.from(target.gan)).str,
        藏干: [...canggan],
        藏干十神: canggan.map((g) => shishenOf(dayGan, GanC.from(g)).str),
    };
}
