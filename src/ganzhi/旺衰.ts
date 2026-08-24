/**
 * 旺衰 —— 月令层的两项确定性计算.
 * md: 基础/身强弱/旺衰理论.md (第二节 人元司令 + 附录 旺相休囚死) + 月令.md
 *
 *   旺相休囚死 —— 粗判. 以某五行与月令五行的生克关系定其能量状态,
 *                 由五行生克表推导, 不另立表.
 *   人元司令   —— 精判. 月令藏干按 余气 → 中气 → 本气 轮流当令,
 *                 按出生日距本月节气起点的天数定当日主事的藏干.
 *
 * 文档强调「司令一错, 整个旺衰、喜用判断全盘错」: 立夏后第十天生者,
 * 若按 巳火 月令判为得令身强, 按 庚金 司令判则失令身弱, 结论相反.
 *
 * 本模块不含评分法与身强/身旺分级 —— 文档自述其「准确性仍有待验证」,
 * 且依赖「占大多数」等模糊阈值, 故不实现.
 */
import {
  WUXING_RELATION_TABLE_WRAPPER, GanC, WuXingC, ZhiC,
  type Gan, type Relation, type Zhi,
} from "@/types";

// ———————————————————————————————————————————————
// 旺相休囚死 (粗判)
// ———————————————————————————————————————————————

/** 五行在某月令下的能量状态, 强到弱依次为 旺 > 相 > 休 > 囚 > 死. */
export const WANG_SHUAI_STATES = ["旺", "相", "休", "囚", "死"] as const;
export type WangShuai = typeof WANG_SHUAI_STATES[number];

/**
 * 我 (行) 对月令的五行关系 → 旺衰状态.
 *   同类 = 旺, 生我 = 相 (月令生我), 我生 = 休 (泄于月令),
 *   我克 = 囚 (克月令反被困), 克我 = 死 (被月令所克).
 */
const RELATION_TO_WANGSHUAI: Readonly<Record<Relation, WangShuai>> = {
  同类: "旺", 生我: "相", 我生: "休", 我克: "囚", 克我: "死",
};

/** 某五行在给定月令五行下的状态. */
export function wangShuaiOf(wx: WuXingC, monthWx: WuXingC): WangShuai {
  return RELATION_TO_WANGSHUAI[WUXING_RELATION_TABLE_WRAPPER[wx.str][monthWx.str]];
}

/** 天干在某月支下的状态. */
export function ganWangShuai(gan: GanC, monthZhi: ZhiC): WangShuai {
  return wangShuaiOf(gan.wuxing, monthZhi.wuxing);
}

/** 地支在某月支下的状态. */
export function zhiWangShuai(zhi: ZhiC, monthZhi: ZhiC): WangShuai {
  return wangShuaiOf(zhi.wuxing, monthZhi.wuxing);
}

// ———————————————————————————————————————————————
// 人元司令 (精判)
// ———————————————————————————————————————————————

/** 司令的三段. 顺序即当令次序: 余气 → 中气 → 本气. */
export type SiLingPhase = "余气" | "中气" | "本气";

/** 一段司令: 主事天干 + 该段天数. */
export interface SiLingSpan {
  readonly phase: SiLingPhase;
  readonly gan: Gan;
  /** 该段天数. */
  readonly days: number;
}

/**
 * 十二月令人元司令分野表.
 * 卯 / 酉 / 子 三个月无中气 (本气纯), 故只有两段.
 * 申月余气文档记作「戊己土」, 此处取戊 (阳土) 为主事者.
 */
export const SI_LING_TABLE: Readonly<Record<Zhi, readonly SiLingSpan[]>> = {
  寅: [{ phase: "余气", gan: "戊", days: 7 }, { phase: "中气", gan: "丙", days: 7 }, { phase: "本气", gan: "甲", days: 16 }],
  卯: [{ phase: "余气", gan: "甲", days: 10 }, { phase: "本气", gan: "乙", days: 20 }],
  辰: [{ phase: "余气", gan: "乙", days: 9 }, { phase: "中气", gan: "癸", days: 3 }, { phase: "本气", gan: "戊", days: 18 }],
  巳: [{ phase: "余气", gan: "戊", days: 5 }, { phase: "中气", gan: "庚", days: 9 }, { phase: "本气", gan: "丙", days: 16 }],
  午: [{ phase: "余气", gan: "丙", days: 10 }, { phase: "中气", gan: "己", days: 9 }, { phase: "本气", gan: "丁", days: 11 }],
  未: [{ phase: "余气", gan: "丁", days: 9 }, { phase: "中气", gan: "乙", days: 3 }, { phase: "本气", gan: "己", days: 18 }],
  申: [{ phase: "余气", gan: "戊", days: 7 }, { phase: "中气", gan: "壬", days: 3 }, { phase: "本气", gan: "庚", days: 20 }],
  酉: [{ phase: "余气", gan: "庚", days: 10 }, { phase: "本气", gan: "辛", days: 20 }],
  戌: [{ phase: "余气", gan: "辛", days: 9 }, { phase: "中气", gan: "丁", days: 3 }, { phase: "本气", gan: "戊", days: 18 }],
  亥: [{ phase: "余气", gan: "戊", days: 7 }, { phase: "中气", gan: "甲", days: 5 }, { phase: "本气", gan: "壬", days: 18 }],
  子: [{ phase: "余气", gan: "壬", days: 10 }, { phase: "本气", gan: "癸", days: 20 }],
  丑: [{ phase: "余气", gan: "癸", days: 9 }, { phase: "中气", gan: "辛", days: 3 }, { phase: "本气", gan: "己", days: 18 }],
} as const;

/**
 * 人元司令 —— 月令藏干按 余气 → 中气 → 本气 轮流当令,
 * 由出生日距本月节令起点的天数定当日主事者.
 */
export class SiLingC {
  private constructor(
    /** 月支 (以节气划分, 非农历月). */
    public readonly monthZhi: ZhiC,
    /** 入本月节令后的天数, 节令当日记 1. */
    public readonly dayInMonth: number,
    private readonly _span: SiLingSpan,
  ) { }

  /**
   * @param monthZhi 月支
   * @param dayInMonth 距本月节令起点的天数, 节令当日记 1
   *
   * 超出分野总天数时取本气 (末段) —— 节气实际长度有浮动 (29~31 天).
   */
  static from(monthZhi: ZhiC | Zhi, dayInMonth: number): SiLingC {
    const zhi = typeof monthZhi === "string" ? ZhiC.from(monthZhi) : monthZhi;
    const spans = SI_LING_TABLE[zhi.str];
    const day = Math.max(1, Math.floor(dayInMonth));
    let acc = 0;
    for (const s of spans) {
      acc += s.days;
      if (day <= acc) return new SiLingC(zhi, day, s);
    }
    return new SiLingC(zhi, day, spans[spans.length - 1]!);
  }

  /** 当日主事的藏干. */
  get gan(): GanC { return GanC.from(this._span.gan); }
  /** 所处段: 余气 / 中气 / 本气. */
  get phase(): SiLingPhase { return this._span.phase; }
  /** 该段天数. */
  get days(): number { return this._span.days; }
  /** 本月令的完整分野, 便于展示. */
  get spans(): readonly SiLingSpan[] { return SI_LING_TABLE[this.monthZhi.str]; }
  /** 是否本气当令 (月令之正气). */
  get isBenQi(): boolean { return this._span.phase === "本气"; }

  /**
   * 司令干在本月令下的旺衰 —— 文档「司令是确定天干旺衰最权威的依据」.
   * 注意这与按月令本气判出的结果可能不同, 那正是司令的意义所在.
   */
  get wangShuai(): WangShuai { return ganWangShuai(this.gan, this.monthZhi); }

  /** 某天干以司令干为准的旺衰. */
  wangShuaiOfGan(gan: GanC): WangShuai {
    return wangShuaiOf(gan.wuxing, this.gan.wuxing);
  }

  toString(): string {
    return `${this.monthZhi.str}月第${this.dayInMonth}天 ${this._span.gan}${this._span.phase}用事`;
  }
}
