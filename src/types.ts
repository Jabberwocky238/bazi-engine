/**
 * 核心类型与基础序列常量.
 *
 * 这里只放被其它模块普遍依赖的 "原子" 类型与字面量元组; 具体领域常量
 * (五行生克表 / 十神 / 神煞等) 拆入对应模块.
 */

export const WUXING = ["木", "火", "土", "金", "水"] as const;
export type WuXing = typeof WUXING[number]
export const GAN = ["甲", "乙", "丙", "丁", "戊", "己", "庚", "辛", "壬", "癸"] as const;
export type Gan = typeof GAN[number]
export const ZHI = ["子", "丑", "寅", "卯", "辰", "巳", "午", "未", "申", "酉", "戌", "亥"] as const;
export type Zhi = typeof ZHI[number]
export type Muku = Extract<Zhi, "辰" | "未" | "戌" | "丑">;
export type Pillar = { gan: Gan, zhi: Gan }
export type TriadKey = "申子辰" | "寅午戌" | "亥卯未" | "巳酉丑";
export type Season = "春" | "夏" | "秋" | "冬";
/** sex: 1 = 男, 0 = 女. 性别相关神煞 (如 元辰) 必填. */
export type Sex = 0 | 1;
export type BaziInput = { year: Pillar; month: Pillar; day: Pillar; hour?: Pillar; sex: Sex };

/** 日主与某天干的五行关系 (不分阴阳). */
export type Relation = "同类" | "我生" | "我克" | "克我" | "生我";

export class SeasonC {
    private constructor(public readonly season: Season) { }

    static readonly map = {
        春: new SeasonC("春"),
        夏: new SeasonC("夏"),
        秋: new SeasonC("秋"),
        冬: new SeasonC("冬"),
    } satisfies Record<Season, SeasonC>;

    static from(season: Season): SeasonC {
        return SeasonC.map[season];
    }
}
export class WuXingC {
    private constructor(public readonly str: WuXing) { }

    static readonly map = {
        木: new WuXingC("木"),
        火: new WuXingC("火"),
        土: new WuXingC("土"),
        金: new WuXingC("金"),
        水: new WuXingC("水"),
    } satisfies Record<WuXing, WuXingC>;

    static from(str: WuXing): WuXingC {
        return WuXingC.map[str];
    }
}

export class GanC {
    private constructor(public readonly str: Gan) { }

    static readonly map = {
        甲: new GanC("甲"),
        乙: new GanC("乙"),
        丙: new GanC("丙"),
        丁: new GanC("丁"),
        戊: new GanC("戊"),
        己: new GanC("己"),
        庚: new GanC("庚"),
        辛: new GanC("辛"),
        壬: new GanC("壬"),
        癸: new GanC("癸"),
    } satisfies Record<Gan, GanC>;

    static from(str: Gan): GanC {
        return GanC.map[str];
    }
}

export class ZhiC {
    protected constructor(public readonly str: Zhi) { }

    static readonly map = {
        子: new ZhiC("子"),
        丑: new ZhiC("丑"),
        寅: new ZhiC("寅"),
        卯: new ZhiC("卯"),
        辰: new ZhiC("辰"),
        巳: new ZhiC("巳"),
        午: new ZhiC("午"),
        未: new ZhiC("未"),
        申: new ZhiC("申"),
        酉: new ZhiC("酉"),
        戌: new ZhiC("戌"),
        亥: new ZhiC("亥"),
    } satisfies Record<Zhi, ZhiC>;

    static from(str: Zhi): ZhiC {
        return ZhiC.map[str];
    }

    /** 春: 寅卯辰; 夏: 巳午未; 秋: 申酉戌; 冬: 亥子丑. */
    season(): SeasonC {
        if ("寅卯辰".includes(this.str)) return SeasonC.from("春");
        if ("巳午未".includes(this.str)) return SeasonC.from("夏");
        if ("申酉戌".includes(this.str)) return SeasonC.from("秋");
        if ("亥子丑".includes(this.str)) return SeasonC.from("冬");
        throw new Error(`unreachable: seasonOf(${this.str})`);
    }
}
export class MukuC  {
    private constructor(public str: Muku) {  }

    static readonly map = {
        辰: new MukuC("辰"),
        未: new MukuC("未"),
        戌: new MukuC("戌"),
        丑: new MukuC("丑"),
    } satisfies Record<Muku, MukuC>;

    static from(str: Muku): MukuC {
        return MukuC.map[str];
    }
}

export class PillarC {
    constructor(
        public readonly gan: GanC,
        public readonly zhi: ZhiC,
    ) { }
}
