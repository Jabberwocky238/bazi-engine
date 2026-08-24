/**
 * 核心类型与基础序列常量.
 *
 * 这里只放被其它模块普遍依赖的 "原子" 类型与字面量元组; 具体领域常量
 * (五行生克表 / 十神 / 神煞等) 拆入对应模块.
 */

import { LunarUtil } from "lunar-typescript";
import { createTable, createBitList, type Table } from "@/bitmap";
import { BaziEngineError } from "@/error";
export const WUXING = ["木", "火", "土", "金", "水"] as const;
export type WuXing = typeof WUXING[number]
export const GAN = ["甲", "乙", "丙", "丁", "戊", "己", "庚", "辛", "壬", "癸"] as const;
export type Gan = typeof GAN[number]
export const ZHI = ["子", "丑", "寅", "卯", "辰", "巳", "午", "未", "申", "酉", "戌", "亥"] as const;
export type Zhi = typeof ZHI[number]
export type Muku = Extract<Zhi, "辰" | "未" | "戌" | "丑">;
export type Pillar = { gan: Gan, zhi: Zhi }

/** 干支位表 — 10 干 + 12 支 各占 1 bit, 一个数即一组干支的集合. */
export const GANZHI_BITS = createBitList([...GAN, ...ZHI]);
/** 一组干支的位掩码. */
export type GanZhiMask = number;
export type TriadKey = "申子辰" | "寅午戌" | "亥卯未" | "巳酉丑";
export type Season = "春" | "夏" | "秋" | "冬";
/** sex: 1 = 男, 0 = 女. 性别相关神煞 (如 元辰) 必填. */
export type Sex = 0 | 1;
export type BaziInput = { year: Pillar; month: Pillar; day: Pillar; hour?: Pillar; sex: Sex };
export const CANG_GAN = LunarUtil.ZHI_HIDE_GAN as Record<Zhi, Gan[]>;
export const GAN_WUXING = LunarUtil.WU_XING_GAN as Record<Gan, WuXing>;
export const ZHI_WUXING = LunarUtil.WU_XING_ZHI as Record<Zhi, WuXing>;
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
    ["我克", "克我", "生我", "同类", "我生"], // 金
    ["我生", "我克", "克我", "生我", "同类"], // 水
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
    ["土", "金", "水", "木", "火"], // 我克
    ["金", "水", "木", "火", "土"], // 克我
    ["水", "木", "火", "土", "金"], // 生我
] as const satisfies Table<WuXing, [5, 5]>;
export const WUXING_BY_RELATION_TABLE = createTable(
    WUXING_BY_RELATION,
    RELATIONS,
    WUXING,
);
export const KONGWANG_XUN: readonly (readonly [Zhi, Zhi])[] = [
    ["戌", "亥"], ["申", "酉"], ["午", "未"],
    ["辰", "巳"], ["寅", "卯"], ["子", "丑"],
];
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

function changshengOf(gan: Gan, zhi: Zhi): ChangSheng {
    return CHANGSHENG_TABLE_WRAPPER[gan][zhi];
}
/** 月令 / 禄位 / 刃: 以月支和日干的十二长生状态推算目标地支. */
function zhiByChangsheng(dayGan: Gan, state: ChangSheng): Zhi {
    const zhi = ZHI.find(z => changshengOf(dayGan, z) === state);
    if (!zhi) throw new BaziEngineError(`unreachable: no ${state} zhi for ${dayGan}`);
    return zhi;
}


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
            throw new BaziEngineError(`${value.str} is not part of triad ${this.key}`);
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
        if (gans.length !== 2) throw new BaziEngineError(`unreachable: wuxingGan(${this.str}, ${yang})`);
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

    /** 由天干字面量取 GanC; 非十干则抛 RangeError. */
    static from(str: Gan): GanC {
        const ret = GanC.map[str];
        if (!ret) throw new BaziEngineError(`invalid gan "${str}"`);
        return ret;
    }
    /** 在 GAN 中的索引 (0 = 甲 ... 9 = 癸). */
    get index(): number {
        return GAN.indexOf(this.str);
    }
    get wuxing(): WuXingC {
        return WuXingC.from(GAN_WUXING[this.str])
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

    /** 由地支字面量取 ZhiC; 非十二支则抛 RangeError. */
    static from(str: Zhi): ZhiC {
        const ret = ZhiC.map[str];
        if (!ret) throw new BaziEngineError(`invalid zhi "${str}"`);
        return ret;
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
        throw new BaziEngineError(`unreachable: seasonOf(${this.str})`);
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
    /** 在 ZHI 中的索引 (0 = 子 ... 11 = 亥). */
    get index(): number {
        return ZHI.indexOf(this.str);
    }
}
/** 柱位标签 — 四主柱 + 岁运柱. */
export const PILLAR_LABELS = ['年柱', '月柱', '日柱', '时柱', '大运', '流年', '流月', '流日', '流时'] as const
export type PillarType = typeof PILLAR_LABELS[number]
/** 原局四柱的标签; 其余标签 (大运/流年/...) 属岁运柱. */
export const ORIGIN_PILLAR_LABELS = ['年柱', '月柱', '日柱', '时柱'] as const
export type OriginPillarType = typeof ORIGIN_PILLAR_LABELS[number]

export class PillarC {
    constructor(
        public readonly gan: GanC,
        public readonly zhi: ZhiC,
        /** 柱位标签; 脱离八字单独使用的柱为 null. */
        public pillarType: PillarType | null = null,
    ) { }
    
    static from(gan: Gan, zhi: Zhi, pillarType?: PillarType | null): PillarC;
    static from(gan: GanC, zhi: ZhiC, pillarType?: PillarType | null): PillarC;
    static from(gan: GanC | Gan, zhi: ZhiC | Zhi, pillarType: PillarType | null = null): PillarC {
        if (typeof gan === "string" && typeof zhi === "string") {
            return new PillarC(GanC.from(gan), ZhiC.from(zhi), pillarType)
        }
        return new PillarC(gan as GanC, zhi as ZhiC, pillarType)
    }
    static fromPillar(pillar: Pillar, pillarType: PillarType | null = null): PillarC {
        return PillarC.from(pillar.gan as Gan, pillar.zhi as Zhi, pillarType)
    }

    /** 本柱干支对应的完整纳音名 (如 甲子 => "海中金"). */
    nayinName(): string {
        const name = LunarUtil.NAYIN[`${this.gan.str}${this.zhi.str}`];
        if (!name) throw new BaziEngineError(`invalid ganzhi ${this.gan.str}${this.zhi.str}`);
        return name;
    }

    /** 本柱纳音五行. */
    nayin(): WuXingC {
        const name = this.nayinName();
        const wx = name.charAt(name.length - 1);
        if (wx !== "金" && wx !== "木" && wx !== "水" && wx !== "火" && wx !== "土") {
            throw new BaziEngineError(`unexpected nayin ${name}`);
        }
        return WuXingC.from(wx);
    }

    /** 本柱所在旬的两个空亡地支. */
    kongwang(): readonly [ZhiC, ZhiC] {
        const g = this.gan.index, z = this.zhi.index;
        for (let n = 0; n < 60; n++) {
            if (n % 10 === g && n % 12 === z) {
                const row = KONGWANG_XUN[Math.floor(n / 10)];
                if (!row) throw new BaziEngineError(`kongwang table miss at xun ${Math.floor(n / 10)}`);
                return [ZhiC.from(row[0]), ZhiC.from(row[1])];
            }
        }
        throw new BaziEngineError(`invalid pillar ${this.gan.str}${this.zhi.str}`);
    }

    /**
     * 是否原局柱 (年/月/日/时). 大运 / 流年 等岁运柱为 false;
     * pillarType 为 null (脱离八字的裸柱) 亦为 false.
     */
    get isOrigin(): boolean {
        return this.pillarType !== null
            && (ORIGIN_PILLAR_LABELS as readonly string[]).includes(this.pillarType);
    }

    /** 本柱干支的十二长生状态. */
    changsheng(): ChangSheng {
        return changshengOf(this.gan.str, this.zhi.str);
    }

    /** 把本柱的干与支压成掩码. */
    ganzhiMask(): GanZhiMask {
        return GANZHI_BITS.encode([this.gan.str, this.zhi.str]);
    }
}

/** C 化的八字输入: 四柱均为 PillarC. */
/** BaziInputC 的四柱位. */
export const BAZI_SLOTS = ["year", "month", "day", "hour"] as const;
export type BaziSlot = typeof BAZI_SLOTS[number];

export class BaziInputC {
  constructor(
    public year: PillarC,
    public month: PillarC,
    public day: PillarC,
    public hour: PillarC | undefined,
    public sex: Sex,
  ) { }

  /** BaziInput -> BaziInputC. */
  static from(bazi: BaziInput): BaziInputC {
    return new BaziInputC(
      PillarC.fromPillar(bazi.year, "年柱"),
      PillarC.fromPillar(bazi.month, "月柱"),
      PillarC.fromPillar(bazi.day, "日柱"),
      bazi.hour ? PillarC.fromPillar(bazi.hour, "时柱") : undefined,
      bazi.sex,
    );
  }

  /**
   * 从八字字符串构造, 如 "庚午壬午辛亥乙未" 或 "庚午 壬午 辛亥 乙未".
   * 必须是四柱八字 (8 个汉字, 空白字符忽略), 不接受时柱缺失;
   * 时辰未知请用其它构造方式. 干支须为六十甲子之一, 否则抛 RangeError.
   */
  static fromString(bazi: string, sex: Sex): BaziInputC {
    const chars = [...bazi.replace(/\s+/gu, "")];
    if (chars.length !== 8) {
      throw new BaziEngineError(
        `BaziInputC: expect 8 chars (4 pillars), got ${chars.length} in "${bazi}"`,
      );
    }
    const pillars: PillarC[] = [];
    for (let i = 0; i < chars.length; i += 2) {
      // 干支合法性由 GanC / ZhiC.from 校验 (非十干十二支即抛).
      const gan = GanC.from(chars[i]! as Gan), zhi = ZhiC.from(chars[i + 1]! as Zhi);
      // 六十甲子只有阳干配阳支 / 阴干配阴支, 如 "甲丑" 不存在.
      if (gan.index % 2 !== zhi.index % 2) {
        throw new BaziEngineError(`BaziInputC: "${gan.str}${zhi.str}" is not in the 60 ganzhi cycle`);
      }
      pillars.push(new PillarC(gan, zhi, PILLAR_LABELS[i / 2]!));
    }
    return new BaziInputC(pillars[0]!, pillars[1]!, pillars[2]!, pillars[3]!, sex);
  }

  /** 时柱是否已知. */
  get hourKnown(): boolean {
    return this.hour !== undefined;
  }

  /** 取指定柱位 (时柱可能为 undefined). */
  pillar(slot: BaziSlot): PillarC | undefined {
    return this[slot];
  }

  /**
   * 原地替换指定柱位, 返回自身以便链式调用.
   * hour 可传 undefined 表示时辰未知; 其余三柱必填.
   *
   * 注意: Calculator 在构造时缓存四柱, 已交给 Calculator 的实例
   * 再改柱不会反映到该 Calculator, 需重新构造.
   */
  setPillar(slot: BaziSlot, pillar: PillarC | undefined): this {
    if (slot !== "hour" && !pillar) {
      throw new BaziEngineError(`BaziInputC: ${slot} pillar is required`);
    }
    if (slot === "hour") this.hour = pillar;
    else this[slot] = pillar as PillarC;
    return this;
  }

  /** 原地替换性别, 返回自身. */
  setSex(sex: Sex): this {
    this.sex = sex;
    return this;
  }

  /** 目标地支对日干的十二长生状态. */
  changsheng(targetZhi: ZhiC): ChangSheng {
    return changshengOf(this.day.gan.str, targetZhi.str);
  }

  /** 目标地支是否与月支同处一个十二长生状态 (月令). */
  isYueling(targetZhi: ZhiC): boolean {
    return this.changsheng(targetZhi) === this.changsheng(this.month.zhi);
  }

  /** 目标地支是否为日干禄位. */
  isLu(targetZhi: ZhiC): boolean {
    return this.changsheng(targetZhi) === "临官";
  }

  /** 目标地支是否为日干刃位. */
  isRen(targetZhi: ZhiC): boolean {
    return this.changsheng(targetZhi) === "帝旺";
  }

  /** 十干禄位 = 日干十二长生「临官」位. */
  luWei(): ZhiC {
    return ZhiC.from(zhiByChangsheng(this.day.gan.str, "临官"));
  }

  /** 刃位 = 日干十二长生「帝旺」位. */
  renWei(): ZhiC {
    return ZhiC.from(zhiByChangsheng(this.day.gan.str, "帝旺"));
  }

  /** BaziInputC -> BaziInput (字符串字面量形式). */
  toBaziInput(): BaziInput {
    return {
      year: { gan: this.year.gan.str, zhi: this.year.zhi.str },
      month: { gan: this.month.gan.str, zhi: this.month.zhi.str },
      day: { gan: this.day.gan.str, zhi: this.day.zhi.str },
      hour: this.hour
        ? { gan: this.hour.gan.str, zhi: this.hour.zhi.str }
        : undefined,
      sex: this.sex,
    };
  }
}



