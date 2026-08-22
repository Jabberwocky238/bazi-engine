/**
 * 核心类型与基础序列常量.
 *
 * 这里只放被其它模块普遍依赖的 "原子" 类型与字面量元组; 具体领域常量
 * (五行生克表 / 十神 / 神煞等) 拆入对应模块.
 */

import { LunarUtil } from "lunar-typescript";
import { createTable, type Table } from "./bitmap.ts";
import type { ShishenC } from "./shishen.ts";
import { shishenOf } from "./shishen.ts";
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
export const CANG_GAN = LunarUtil.ZHI_HIDE_GAN as Record<Zhi, Gan[]>;
export const GAN_WUXING = LunarUtil.WU_XING_GAN as Record<Gan, WuXing>;
export const ZHI_WUXING = LunarUtil.WU_XING_ZHI as Record<Zhi, WuXing>;
/** 五行相生: key 生 value */
export const GENERATES: Readonly<Record<WuXing, WuXing>> = {
    木: "火", 火: "土", 土: "金", 金: "水", 水: "木",
};
/** 五行相克: key 克 value */
export const CONTROLS: Readonly<Record<WuXing, WuXing>> = {
    木: "土", 土: "水", 水: "火", 火: "金", 金: "木",
};
/** 反查: value 生 key */
export const GENERATED_BY: Readonly<Record<WuXing, WuXing>> = {
    火: "木", 土: "火", 金: "土", 水: "金", 木: "水",
};
/** 反查: value 克 key */
export const CONTROLLED_BY: Readonly<Record<WuXing, WuXing>> = {
    土: "木", 水: "土", 火: "水", 金: "火", 木: "金",
};
/** 日主与某天干的五行关系 (不分阴阳). */
export type Relation = "同类" | "我生" | "我克" | "克我" | "生我";
export const TRIAD_NAMES = [
    "桃花",
    "将星",
    "华盖",
    "驿马",
    "劫煞",
    "灾煞",
    "亡神",
] as const;

export type TriadName = typeof TRIAD_NAMES[number];

const TRIAD_KEYS = [
    "申子辰",
    "寅午戌",
    "亥卯未",
    "巳酉丑",
] as const;

const TRIAD_TABLE = [
    ["酉", "子", "辰", "寅", "巳", "午", "亥"],
    ["卯", "午", "戌", "申", "亥", "子", "巳"],
    ["子", "卯", "未", "巳", "申", "酉", "寅"],
    ["午", "酉", "丑", "亥", "寅", "卯", "申"],
] as const satisfies Table<Zhi, [4, 7]>;

export const TRIAD_TABLE_WRAPPER = createTable(
    TRIAD_TABLE,
    TRIAD_KEYS,
    TRIAD_NAMES,
);
const WUXING_RELATION_TABLE = [
    //       木      火      土      金      水
    ["同类", "我生", "我克", "克我", "生我"], // 木
    ["生我", "同类", "我生", "我克", "克我"], // 火
    ["克我", "生我", "同类", "我生", "我克"], // 土
    ["我生", "克我", "生我", "同类", "我生"], // 金
    ["生我", "我克", "克我", "生我", "同类"], // 水
] as const satisfies Table<Relation, [5, 5]>;
export const WUXING_RELATION_TABLE_WRAPPER = createTable(WUXING_RELATION_TABLE, WUXING, WUXING);
export const RELATIONS = [
    "同类",
    "我生",
    "我克",
    "克我",
    "生我",
] as const satisfies readonly Relation[];
const WUXING_BY_RELATION = [
    ["木", "火", "土", "金", "水"], // 同类
    ["火", "土", "金", "水", "木"], // 我生
    ["土", "水", "火", "金", "木"], // 我克
    ["金", "木", "水", "火", "土"], // 克我
    ["水", "木", "金", "土", "火"], // 生我
] as const satisfies Table<WuXing, [5, 5]>;
export const WUXING_BY_RELATION_TABLE = createTable(
    WUXING_BY_RELATION,
    RELATIONS,
    WUXING,
);
/** 取干支对应的完整纳音名 (如 甲子 => "海中金"). */
export function nayinNameOf(gan: GanC, zhi: ZhiC): string {
    const name = LunarUtil.NAYIN[`${gan.str}${zhi.str}`];
    if (!name) throw new Error(`invalid ganzhi ${gan.str}${zhi.str}`);
    return name;
}
export function nayinOf(gan: GanC, zhi: ZhiC): WuXingC {
    const name = nayinNameOf(gan, zhi);
    const wx = name.charAt(name.length - 1);
    if (wx !== "金" && wx !== "木" && wx !== "水" && wx !== "火" && wx !== "土") {
        throw new Error(`unexpected nayin ${name}`);
    }
    return WuXingC.from(wx);
}
export const KONGWANG_XUN: readonly (readonly [Zhi, Zhi])[] = [
    ["戌", "亥"], ["申", "酉"], ["午", "未"],
    ["辰", "巳"], ["寅", "卯"], ["子", "丑"],
];
export function kongwangFor(gan: GanC, zhi: ZhiC): readonly [ZhiC, ZhiC] {
    const g = GAN.indexOf(gan.str), z = ZHI.indexOf(zhi.str);
    for (let n = 0; n < 60; n++) {
        if (n % 10 === g && n % 12 === z) {
            const row = KONGWANG_XUN[Math.floor(n / 10)];
            if (!row) throw new Error(`kongwang table miss at xun ${Math.floor(n / 10)}`);
            return [ZhiC.from(row[0]), ZhiC.from(row[1])];
        }
    }
    throw new Error(`invalid pillar ${gan}${zhi}`);
}
export const LIFE_STATES = [
    "长生",
    "沐浴",
    "冠带",
    "临官",
    "帝旺",
    "衰",
    "病",
    "死",
    "墓",
    "绝",
    "胎",
    "养",
] as const;
export type ChangSheng = typeof LIFE_STATES[number];

/** 十干长生起点 (子平寄生十二宫; 阴干逆行). */
const CHANGSHENG_START: Record<Gan, { zhi: Zhi; forward: boolean }> = {
    甲: { zhi: "亥", forward: true },
    乙: { zhi: "午", forward: false },
    丙: { zhi: "寅", forward: true },
    丁: { zhi: "酉", forward: false },
    戊: { zhi: "寅", forward: true },
    己: { zhi: "酉", forward: false },
    庚: { zhi: "巳", forward: true },
    辛: { zhi: "子", forward: false },
    壬: { zhi: "申", forward: true },
    癸: { zhi: "卯", forward: false },
};
const CHANGSHENG_TABLE = [
    //       子       丑       寅       卯       辰       巳       午       未       申       酉       戌       亥
    ["沐浴", "冠带", "临官", "帝旺", "衰", "病", "死", "墓", "绝", "胎", "养", "长生"], // 甲
    ["病", "衰", "帝旺", "临官", "冠带", "沐浴", "长生", "养", "胎", "绝", "墓", "死"],   // 乙
    ["胎", "养", "长生", "沐浴", "冠带", "临官", "帝旺", "衰", "病", "死", "墓", "绝"],   // 丙
    ["绝", "墓", "死", "病", "衰", "帝旺", "临官", "冠带", "沐浴", "长生", "养", "胎"],   // 丁
    ["胎", "养", "长生", "沐浴", "冠带", "临官", "帝旺", "衰", "病", "死", "墓", "绝"],   // 戊
    ["绝", "墓", "死", "病", "衰", "帝旺", "临官", "冠带", "沐浴", "长生", "养", "胎"],   // 己
    ["死", "墓", "绝", "胎", "养", "长生", "沐浴", "冠带", "临官", "帝旺", "衰", "病"],   // 庚
    ["长生", "养", "胎", "绝", "墓", "死", "病", "衰", "帝旺", "临官", "冠带", "沐浴"], // 辛
    ["帝旺", "衰", "病", "死", "墓", "绝", "胎", "养", "长生", "沐浴", "冠带", "临官"], // 壬
    ["临官", "冠带", "沐浴", "长生", "养", "胎", "绝", "墓", "死", "病", "衰", "帝旺"], // 癸
] as const satisfies Table<ChangSheng, [10, 12]>;

export const CHANGSHENG_TABLE_WRAPPER = createTable(
    CHANGSHENG_TABLE,
    GAN,
    ZHI,
);

export function changshengState(gan: Gan, zhi: Zhi): ChangSheng {
    return CHANGSHENG_TABLE_WRAPPER[gan][zhi];
}

export function isYueling(dayGan: Gan, monthZhi: Zhi, targetZhi: Zhi): boolean {
    return changshengState(dayGan, targetZhi) === changshengState(dayGan, monthZhi);
}

export function isLu(dayGan: Gan, targetZhi: Zhi): boolean {
    return changshengState(dayGan, targetZhi) === "临官";
}

export function isRen(dayGan: Gan, targetZhi: Zhi): boolean {
    return changshengState(dayGan, targetZhi) === "帝旺";
}
/** 月令 / 禄位 / 刃: 以月支和日干的十二长生状态推算目标地支. */
function zhiByChangsheng(dayGan: Gan, state: ChangSheng): Zhi {
    const zhi = ZHI.find(z => changshengState(dayGan, z) === state);
    if (!zhi) throw new Error(`unreachable: no ${state} zhi for ${dayGan}`);
    return zhi;
}

/** 十干禄位 = 十二长生「临官」位. */
export function luWeiOf(dayGan: Gan): Zhi { return zhiByChangsheng(dayGan, "临官"); }
/** 刃位 = 十二长生「帝旺」位. */
export function renWeiOf(dayGan: Gan): Zhi { return zhiByChangsheng(dayGan, "帝旺"); }

export class TriadC {
    private constructor(public readonly key: TriadKey) { }

    static map = {
        "申子辰": new TriadC("申子辰"),
        "寅午戌": new TriadC("寅午戌"),
        "亥卯未": new TriadC("亥卯未"),
        "巳酉丑": new TriadC("巳酉丑"),
    } satisfies Record<TriadKey, TriadC>;

    static from(key: TriadKey): TriadC {
        return TriadC.map[key];
    }

    get(name: TriadName): ZhiC;
    get(zhi: ZhiC): TriadName;

    get(value: TriadName | ZhiC): ZhiC | TriadName {
        if (typeof value === "string") {
            return ZhiC.from(TRIAD_TABLE_WRAPPER[this.key][value]);
        }
        const entries = Object.entries(TRIAD_TABLE_WRAPPER[this.key]) as [
            TriadName,
            Zhi,
        ][]
        const found = entries.find(([, zhi]) => zhi === value.str);
        if (!found) {
            throw new Error(`${value.str} is not part of triad ${this.key}`);
        }
        return found[0];
    }
    isYearOnly(name: TriadName): boolean {
        return name === "灾煞";
    }
}
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
    relationOf(wx: WuXingC): Relation {
        return WUXING_RELATION_TABLE_WRAPPER[this.str][wx.str]
    }
    relationFrom(relation: Relation): WuXingC {
        return WuXingC.from(WUXING_BY_RELATION_TABLE[relation][this.str])
    }
    gan(yang: boolean): GanC {
        const gans = Object.entries(GAN_WUXING).filter(([g, x]) => x === this.str).map(([g]) => g as Gan);
        if (gans.length !== 2) throw new Error(`unreachable: wuxingGan(${this.str}, ${yang})`);
        const ret = gans.find(g => (GAN_WUXING[g] === this.str) && ((GAN.indexOf(g) % 2 === 0) === yang))!;
        return GanC.from(ret)
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
    get wuxing(): WuXingC {
        return WuXingC.from(GAN_WUXING[this.str])
    }
    shishenGan(targetGan: GanC): ShishenC {
        return shishenOf(this, targetGan);
    }
    shishenZhi(targetZhi: ZhiC): ShishenC[] {
        return targetZhi.canggan().map(g => shishenOf(this, g));
    }
    shishenWuxing(targetShishen: ShishenC): WuXingC {
        return this.wuxing.relationFrom(targetShishen.cat.relation)
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
    get wuxing(): WuXingC {
        return WuXingC.from(ZHI_WUXING[this.str])
    }
    /** 春: 寅卯辰; 夏: 巳午未; 秋: 申酉戌; 冬: 亥子丑. */
    season(): SeasonC {
        if ("寅卯辰".includes(this.str)) return SeasonC.from("春");
        if ("巳午未".includes(this.str)) return SeasonC.from("夏");
        if ("申酉戌".includes(this.str)) return SeasonC.from("秋");
        if ("亥子丑".includes(this.str)) return SeasonC.from("冬");
        throw new Error(`unreachable: seasonOf(${this.str})`);
    }
    triad(): TriadC {
        const ret = () => {
            if ("申子辰".includes(this.str)) return "申子辰";
            if ("寅午戌".includes(this.str)) return "寅午戌";
            if ("亥卯未".includes(this.str)) return "亥卯未";
            return "巳酉丑";
        }
        return TriadC.from(ret())
    }
    canggan(): GanC[] {
        return CANG_GAN[this.str].map((i) => GanC.from(i))
    }
}
export class MukuC {
    private constructor(public str: Muku) { }

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
    
    static from(gan: Gan, zhi: Zhi): PillarC;
static from(gan: GanC, zhi: ZhiC): PillarC;
    static from(gan: GanC | Gan, zhi: ZhiC | Zhi): PillarC {
        if (typeof gan === "string" && typeof zhi === "string") {
            return new PillarC(GanC.from(gan), ZhiC.from(zhi))
        }

        return new PillarC(gan as GanC, zhi as ZhiC)
    }
    static fromPillar(pillar: Pillar): PillarC {
        return PillarC.from(pillar.gan as Gan, pillar.zhi as Zhi)
    }
}

