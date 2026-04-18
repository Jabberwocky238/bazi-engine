/**
 * Static tables & name lists for bazi calculations.
 * All rules below are derived either from the classical mnemonics or from
 * statistical fitting against the scraped dataset.
 */

export const GAN = ["甲","乙","丙","丁","戊","己","庚","辛","壬","癸"] as const;
export const ZHI = ["子","丑","寅","卯","辰","巳","午","未","申","酉","戌","亥"] as const;

export type Gan = typeof GAN[number];
export type Zhi = typeof ZHI[number];
export type GanZhi = `${Gan}${Zhi}`;
export type TriadKey = "申子辰" | "寅午戌" | "亥卯未" | "巳酉丑";

export type Pillar = { gan: Gan; zhi: Zhi };
/** sex: 1 = 男, 0 = 女. Required for sex-dependent shensha such as 元辰. */
export type Sex = 0 | 1;
export type BaziInput = { year: Pillar; month: Pillar; day: Pillar; hour: Pillar; sex: Sex };

// --- 基础 ---------------------------------------------------------------

export const WU_XING: Readonly<Record<Gan, "木" | "火" | "土" | "金" | "水">> = {
  甲:"木", 乙:"木",
  丙:"火", 丁:"火",
  戊:"土", 己:"土",
  庚:"金", 辛:"金",
  壬:"水", 癸:"水",
};

export function isYangGan(g: Gan): boolean { return GAN.indexOf(g) % 2 === 0; }

// 地支藏干 (dataset convention)
export const CANG_GAN: Readonly<Record<Zhi, readonly Gan[]>> = {
  子:["癸"],
  丑:["己","癸","辛"],
  寅:["甲","丙","戊"],
  卯:["乙"],
  辰:["戊","乙","癸"],
  巳:["丙","庚","戊"],
  午:["丁","己"],
  未:["己","丁","乙"],
  申:["庚","壬","戊"],
  酉:["辛"],
  戌:["戊","辛","丁"],
  亥:["壬","甲"],
};

// --- 三合局 -------------------------------------------------------------

export function triadOf(z: Zhi): TriadKey {
  if ("申子辰".includes(z)) return "申子辰";
  if ("寅午戌".includes(z)) return "寅午戌";
  if ("亥卯未".includes(z)) return "亥卯未";
  return "巳酉丑";
}

export const TRIAD_MAP: Readonly<Record<TriadKey, Readonly<Record<string, Zhi>>>> = {
  "申子辰": { 桃花:"酉", 将星:"子", 华盖:"辰", 驿马:"寅", 劫煞:"巳", 灾煞:"午", 亡神:"亥" },
  "寅午戌": { 桃花:"卯", 将星:"午", 华盖:"戌", 驿马:"申", 劫煞:"亥", 灾煞:"子", 亡神:"巳" },
  "亥卯未": { 桃花:"子", 将星:"卯", 华盖:"未", 驿马:"巳", 劫煞:"申", 灾煞:"酉", 亡神:"寅" },
  "巳酉丑": { 桃花:"午", 将星:"酉", 华盖:"丑", 驿马:"亥", 劫煞:"寅", 灾煞:"卯", 亡神:"申" },
};

export const TRIAD_NAMES = ["桃花","将星","华盖","驿马","劫煞","灾煞","亡神"] as const;
// 只从年支起局 (不用日支);其余从年支或日支起局,不标源柱
export const TRIAD_YEAR_ONLY: ReadonlySet<string> = new Set(["灾煞"]);

// --- 日干查支 -----------------------------------------------------------

// 禄神 (日干 → 支)
export const LU: Readonly<Record<Gan, Zhi>> = {
  甲:"寅", 乙:"卯", 丙:"巳", 丁:"午", 戊:"巳",
  己:"午", 庚:"申", 辛:"酉", 壬:"亥", 癸:"子",
};

// 天乙贵人 (日干 或 年干 → 支)
export const TIAN_YI: Readonly<Record<Gan, readonly Zhi[]>> = {
  甲:["丑","未"], 戊:["丑","未"], 庚:["丑","未"],
  乙:["子","申"], 己:["子","申"],
  丙:["亥","酉"], 丁:["亥","酉"],
  壬:["卯","巳"], 癸:["卯","巳"],
  辛:["午","寅"],
};

// 羊刃 (日干 → 支): 阳干禄后一位, 阴干禄前一位
export const YANG_REN: Readonly<Record<Gan, Zhi>> = {
  甲:"卯", 乙:"寅",
  丙:"午", 丁:"巳",
  戊:"午", 己:"巳",
  庚:"酉", 辛:"申",
  壬:"子", 癸:"亥",
};

// 飞刃 = 羊刃冲支
export const FEI_REN: Readonly<Record<Gan, Zhi>> = {
  甲:"酉", 乙:"申",
  丙:"子", 丁:"亥",
  戊:"子", 己:"亥",
  庚:"卯", 辛:"寅",
  壬:"午", 癸:"巳",
};

/**
 * 福星贵人. 以年干或日干起, 四柱地支见对应字者.
 * 《三命通会·论福星贵人》:
 *   "甲丙相邀入虎乡, 更游鼠穴最高强;
 *    戊猴己未丁宜亥, 乙癸逢牛卯禄昌;
 *    庚趋马首辛到巳, 壬骑龙背喜非常."
 */
export const FU_XING: Readonly<Record<Gan, readonly Zhi[]>> = {
  甲:["寅","子"],
  乙:["丑","卯"],
  丙:["寅","子"],
  丁:["亥"],
  戊:["申"],
  己:["未"],
  庚:["午"],
  辛:["巳"],
  壬:["辰"],
  癸:["丑","卯"],
};

/**
 * 太极贵人. 以年干或日干起, 四柱地支见对应字者.
 * 口诀: 甲乙生人子午中, 丙丁鸡兔(卯酉)定亨通; 戊己两干临四季(辰戌丑未),
 *       庚辛寅亥禄丰隆; 壬癸巳申偏喜美.
 */
export const TAI_JI: Readonly<Record<Gan, readonly Zhi[]>> = {
  甲:["子","午"], 乙:["子","午"],
  丙:["卯","酉"], 丁:["卯","酉"],
  戊:["辰","戌","丑","未"], 己:["辰","戌","丑","未"],
  庚:["寅","亥"], 辛:["寅","亥"],
  壬:["巳","申"], 癸:["巳","申"],
};

/**
 * 文昌贵人. 阳干长生位之冲, 阴干长生位.
 * 以年干或日干起, 四柱地支见对应字者.
 */
export const WEN_CHANG: Readonly<Record<Gan, Zhi>> = {
  甲:"巳", 乙:"午",
  丙:"申", 丁:"酉",
  戊:"申", 己:"酉",
  庚:"亥", 辛:"子",
  壬:"寅", 癸:"卯",
};

/**
 * 天厨贵人 = 食神之禄.
 *   甲食神丙→丙禄巳; 丙食神戊→戊禄巳; 戊食神庚→庚禄申; ...
 * 以年干或日干起, 四柱地支见对应字者.
 */
export const TIAN_CHU: Readonly<Record<Gan, Zhi>> = {
  甲:"巳", 乙:"午",
  丙:"巳", 丁:"午",
  戊:"申", 己:"酉",
  庚:"亥", 辛:"子",
  壬:"寅", 癸:"卯",
};

/**
 * 金舆 = 禄前二位 (日干或年干 → 支, 任一柱地支见之).
 * 口诀: 甲龙乙蛇丙戊羊, 丁己猴歌庚犬方, 辛猪壬牛癸逢虎.
 */
export const JIN_YU: Readonly<Record<Gan, Zhi>> = {
  甲:"辰", 乙:"巳",
  丙:"未", 丁:"申",
  戊:"未", 己:"申",
  庚:"戌", 辛:"亥",
  壬:"丑", 癸:"寅",
};

/**
 * 国印贵人 (日干或年干 → 支).
 * 口诀: 甲见戌, 乙见亥, 丙见丑, 丁见寅, 戊见丑, 己见寅,
 *       庚见辰, 辛见巳, 壬见未, 癸见申.
 */
export const GUO_YIN: Readonly<Record<Gan, Zhi>> = {
  甲:"戌", 乙:"亥",
  丙:"丑", 丁:"寅",
  戊:"丑", 己:"寅",
  庚:"辰", 辛:"巳",
  壬:"未", 癸:"申",
};

/**
 * 红艳煞 (日干 → 支). 数据版本 (与古诀略有出入: 乙取午而非申).
 * 口诀: 多情多欲少人知, 六丙逢寅辛见鸡; 癸临申上丁见未,
 *       甲乙午申庚见戌; 戊己怕辰壬怕子.
 * 本项目按数据拟合取 乙→午.
 */
export const HONG_YAN: Readonly<Record<Gan, Zhi>> = {
  甲:"午", 乙:"午",
  丙:"寅", 丁:"未",
  戊:"辰", 己:"辰",
  庚:"戌", 辛:"酉",
  壬:"子", 癸:"申",
};

/**
 * 流霞 (日干 → 支). 古诀: 甲鸡乙犬丙羊加, 丁是猴乡戊见蛇;
 *                         己马庚龙辛逐兔, 壬猪癸虎是流霞.
 */
export const LIU_XIA: Readonly<Record<Gan, Zhi>> = {
  甲:"酉", 乙:"戌",
  丙:"未", 丁:"申",
  戊:"巳", 己:"午",
  庚:"辰", 辛:"卯",
  壬:"亥", 癸:"寅",
};

// --- 年支查支 -----------------------------------------------------------

export const HONG_LUAN: Readonly<Record<Zhi, Zhi>> = { 子:"卯", 丑:"寅", 寅:"丑", 卯:"子", 辰:"亥", 巳:"戌", 午:"酉", 未:"申", 申:"未", 酉:"午", 戌:"巳", 亥:"辰" };
export const TIAN_XI:   Readonly<Record<Zhi, Zhi>> = { 子:"酉", 丑:"申", 寅:"未", 卯:"午", 辰:"巳", 巳:"辰", 午:"卯", 未:"寅", 申:"丑", 酉:"子", 戌:"亥", 亥:"戌" };

export const GU_CHEN: Readonly<Record<Zhi, Zhi>> = {
  亥:"寅", 子:"寅", 丑:"寅",
  寅:"巳", 卯:"巳", 辰:"巳",
  巳:"申", 午:"申", 未:"申",
  申:"亥", 酉:"亥", 戌:"亥",
};
export const GUA_SU: Readonly<Record<Zhi, Zhi>> = {
  亥:"戌", 子:"戌", 丑:"戌",
  寅:"丑", 卯:"丑", 辰:"丑",
  巳:"辰", 午:"辰", 未:"辰",
  申:"未", 酉:"未", 戌:"未",
};

// --- 月支查支 -----------------------------------------------------------

/**
 * 血刃 (月支 → 支). 月支查四柱其他地支.
 * 口诀: 子午丑子寅丑卯未, 辰寅巳申午卯未酉, 申辰酉戌戌巳亥亥.
 */
export const XUE_REN: Readonly<Record<Zhi, Zhi>> = {
  子:"午", 丑:"子", 寅:"丑", 卯:"未",
  辰:"寅", 巳:"申", 午:"卯", 未:"酉",
  申:"辰", 酉:"戌", 戌:"巳", 亥:"亥",
};

/**
 * 天医 (月支 → 月支前一位). 即月支往前退一位地支.
 * 如正月(寅)见丑, 二月(卯)见寅, 依此类推.
 */
export const TIAN_YI_XING: Readonly<Record<Zhi, Zhi>> = {
  子:"亥", 丑:"子", 寅:"丑", 卯:"寅",
  辰:"卯", 巳:"辰", 午:"巳", 未:"午",
  申:"未", 酉:"申", 戌:"酉", 亥:"戌",
};

// --- 月令相关 -----------------------------------------------------------

// 月德贵人 (月支三合局 → 干)
export const YUE_DE: Readonly<Record<TriadKey, Gan>> = {
  "寅午戌":"丙", "申子辰":"壬", "亥卯未":"甲", "巳酉丑":"庚",
};
// 月德合 (月德干的天干五合)
export const YUE_DE_HE: Readonly<Record<TriadKey, Gan>> = {
  "寅午戌":"辛", "申子辰":"丁", "亥卯未":"己", "巳酉丑":"乙",
};

// 天德贵人 (月支 → 干 或 支)
export const TIAN_DE: Readonly<Record<Zhi, Gan | Zhi>> = {
  寅:"丁", 卯:"申", 辰:"壬", 巳:"辛",
  午:"亥", 未:"甲", 申:"癸", 酉:"寅",
  戌:"丙", 亥:"乙", 子:"巳", 丑:"庚",
};
// 天德合 (天德的 干合 或 支合)
export const TIAN_DE_HE: Readonly<Record<Zhi, Gan | Zhi>> = {
  寅:"壬", 卯:"巳", 辰:"丁", 巳:"丙",
  午:"寅", 未:"己", 申:"戊", 酉:"亥",
  戌:"辛", 亥:"庚", 子:"申", 丑:"乙",
};

// 德秀贵人 (月支三合 → 干集合, 数据拟合)
export const DE_XIU: Readonly<Record<TriadKey, readonly Gan[]>> = {
  "寅午戌": ["丙","丁","戊","癸"],
  "申子辰": ["甲","丙","戊","己","辛","壬","癸"],
  "亥卯未": ["甲","乙","丁","壬"],
  "巳酉丑": ["乙","庚","辛"],
};

// --- 年支相对位移神煞 (丧门/吊客/披麻/勾绞煞) ---------------------------
// 查法: 以年支为基准取固定偏移位
//   丧门    = 年支 + 2
//   勾绞煞  = 年支 + 3
//   披麻    = 年支 - 3 (即 + 9)
//   吊客    = 年支 - 2 (即 + 10)
// 均不区分性别、年干阴阳. 由数据拟合 (1550 样本) 确认.
export const SANG_MEN_OFFSET = 2;
export const GOU_JIAO_OFFSET = 3;
export const PI_MA_OFFSET = 9;
export const DIAO_KE_OFFSET = 10;

// --- 元辰 (大耗) --------------------------------------------------------
// 以年支为基准, 按 "年干阴阳 × 性别" 分组:
//   阳男 / 阴女 → 年支 + 7
//   阴男 / 阳女 → 年支 + 5
// 阳年干: 甲丙戊庚壬 (GAN 索引偶数); 阴年干: 乙丁己辛癸 (奇数)
export const YUAN_CHEN_OFFSET_YANG_MALE_YIN_FEMALE = 7;
export const YUAN_CHEN_OFFSET_YIN_MALE_YANG_FEMALE = 5;

// --- 日柱特殊 -----------------------------------------------------------

// 孤鸾煞 (日柱固定集合, 来自数据)
export const GU_LUAN_DAYS: readonly GanZhi[] = [
  "乙巳","丁巳","戊申","辛亥","壬子","甲寅","戊午","丙午",
] as const;

// 十恶大败 (日柱, 本旬禄位落空, 十无禄日)
export const SHI_E_DA_BAI_DAYS: readonly GanZhi[] = [
  "甲辰","乙巳","丙申","丁亥","戊戌","己丑","庚辰","辛巳","壬申","癸亥",
] as const;

// 阴差阳错 (日柱, 12 日)
export const YIN_CHA_YANG_CUO_DAYS: readonly GanZhi[] = [
  "辛卯","壬辰","癸巳","丙午","丁未","戊申",
  "辛酉","壬戌","癸亥","丙子","丁丑","戊寅",
] as const;

// 十灵日 (日柱, 10 日)
export const SHI_LING_DAYS: readonly GanZhi[] = [
  "甲辰","乙亥","丙辰","丁酉","戊午","庚戌","庚寅","辛亥","壬寅","癸未",
] as const;

// 九丑日 (日柱, 9 日, 自坐桃花)
export const JIU_CHOU_DAYS: readonly GanZhi[] = [
  "戊子","戊午","己卯","己酉","辛卯","辛酉","壬子","壬午","丁酉",
] as const;

// 八专日 (日柱, 8 日, 干支同气)
export const BA_ZHUAN_DAYS: readonly GanZhi[] = [
  "甲寅","乙卯","丁未","戊戌","己未","庚申","辛酉","癸丑",
] as const;

// 六秀日 (日柱, 6 日)
export const LIU_XIU_DAYS: readonly GanZhi[] = [
  "丙午","丁未","戊子","戊午","己丑","己未",
] as const;

// 魁罡日 (日柱, 4 日)
export const KUI_GANG_DAYS: readonly GanZhi[] = [
  "壬辰","庚辰","庚戌","戊戌",
] as const;

// 金神 (固定干支: 乙丑 / 己巳 / 癸酉)
export const JIN_SHEN_GANZHI: readonly GanZhi[] = [
  "乙丑","己巳","癸酉",
] as const;

// 四废日: 月支所属季节 → 日柱干支 (当令五行之绝地)
export const SI_FEI_DAYS: Readonly<Record<"春"|"夏"|"秋"|"冬", readonly GanZhi[]>> = {
  春: ["庚申","辛酉"],
  夏: ["壬子","癸亥"],
  秋: ["甲寅","乙卯"],
  冬: ["丙午","丁巳"],
};

// --- 学堂 / 词馆 (年纳音 → 地支) ----------------------------------------
// 学堂 = 年纳音五行之长生; 词馆 = 年纳音五行之临官.
// 土随水派 (长生申/临官亥), 火派为次.
export const XUE_TANG_ZHI: Readonly<Record<NayinWuxing, Zhi>> = {
  金:"巳", 木:"亥", 水:"申", 土:"申", 火:"寅",
};
export const CI_GUAN_ZHI: Readonly<Record<NayinWuxing, Zhi>> = {
  金:"申", 木:"寅", 水:"亥", 土:"亥", 火:"巳",
};

// 正学堂 / 正词馆: 柱纳音 = 年纳音五行, 且柱支 = 长生 / 临官 位.
// 其唯一满足条件的干支如下 (与 "学堂/词馆" 互斥: 后者仅在柱支一致但柱非此 "正" 干支时命中).
export const ZHENG_XUE_TANG_GZ: Readonly<Record<NayinWuxing, GanZhi>> = {
  金:"辛巳", 木:"己亥", 水:"甲申", 土:"戊申", 火:"丙寅",
};
export const ZHENG_CI_GUAN_GZ: Readonly<Record<NayinWuxing, GanZhi>> = {
  金:"壬申", 木:"庚寅", 水:"癸亥", 土:"丁亥", 火:"乙巳",
};

// --- 天罗地网 (年纳音起) -----------------------------------------------
// 火命见戌亥 → 天罗; 水/土命见辰巳 → 地网; 金木无此煞.
export const TIAN_LUO_ZHI: readonly Zhi[] = ["戌","亥"] as const;
export const DI_WANG_ZHI: readonly Zhi[] = ["辰","巳"] as const;

// --- 天罗地网 (地支配对法) --------------------------------------------
// 《知乎·四柱神煞》等: 辰↔巳 互见为地网, 戌↔亥 互见为天罗.
// 以年支或日支为主, 其它地支见之者为是. 合并标作"天罗地网".
export const LUO_WANG_PARTNER: Partial<Record<Zhi, Zhi>> = {
  辰:"巳", 巳:"辰", 戌:"亥", 亥:"戌",
};

// 按"月支所属季节"查日柱的神煞表 (春:寅卯辰 夏:巳午未 秋:申酉戌 冬:亥子丑)
export type Season = "春" | "夏" | "秋" | "冬";
export function seasonOf(monthZhi: Zhi): Season {
  if ("寅卯辰".includes(monthZhi)) return "春";
  if ("巳午未".includes(monthZhi)) return "夏";
  if ("申酉戌".includes(monthZhi)) return "秋";
  return "冬";
}

// 天转日: 春乙卯 / 夏丙午 / 秋辛酉 / 冬壬子
export const TIAN_ZHUAN_DAY: Readonly<Record<Season, GanZhi>> = {
  春:"乙卯", 夏:"丙午", 秋:"辛酉", 冬:"壬子",
};
// 地转日: 春辛卯 / 夏戊午 / 秋癸酉 / 冬丙子
export const DI_ZHUAN_DAY: Readonly<Record<Season, GanZhi>> = {
  春:"辛卯", 夏:"戊午", 秋:"癸酉", 冬:"丙子",
};
// 天赦日: 春戊寅 / 夏甲午 / 秋戊申 / 冬甲子
export const TIAN_SHE_DAY: Readonly<Record<Season, GanZhi>> = {
  春:"戊寅", 夏:"甲午", 秋:"戊申", 冬:"甲子",
};

// 拱禄: 日柱 + 时柱 固定五组 (《三命通会·拱禄拱贵》)
export const GONG_LU_DAY_HOUR: readonly (readonly [GanZhi, GanZhi])[] = [
  ["癸亥","癸丑"], ["癸丑","癸亥"],          // 拱子
  ["丁巳","丁未"], ["己未","己巳"],          // 拱午
  ["戊辰","戊午"],                            // 拱巳
] as const;

// 三奇贵人: 三个连续柱天干按顺序匹配 (天上/地下/人中)
export const SAN_QI_TRIPLES: readonly (readonly [Gan, Gan, Gan])[] = [
  ["甲","戊","庚"], // 天上三奇
  ["乙","丙","丁"], // 地下三奇
  ["壬","癸","辛"], // 人中三奇
] as const;

// --- 纳音五行 (委托 lunar-typescript) ----------------------------------
// LunarUtil.NAYIN["甲子"] → "海中金"; 末字即五行.
import { LunarUtil } from "lunar-typescript";

export type NayinWuxing = "金" | "火" | "木" | "土" | "水";

export function nayinOf(gan: Gan, zhi: Zhi): NayinWuxing {
  const name = LunarUtil.NAYIN[`${gan}${zhi}`];
  if (!name) throw new Error(`invalid ganzhi ${gan}${zhi}`);
  const wx = name.charAt(name.length - 1);
  if (wx !== "金" && wx !== "木" && wx !== "水" && wx !== "火" && wx !== "土") {
    throw new Error(`unexpected nayin ${name}`);
  }
  return wx;
}

// --- 旬空 ---------------------------------------------------------------

export const KONGWANG_XUN: readonly (readonly [Zhi, Zhi])[] = [
  ["戌","亥"], ["申","酉"], ["午","未"],
  ["辰","巳"], ["寅","卯"], ["子","丑"],
];

// --- 神煞完整清单 (数据中观察到) ----------------------------------------
export const ALL_SHENSHA = [
  "德秀贵人","太极贵人","天乙贵人","福星贵人","空亡","童子煞","文昌贵人","天厨贵人",
  "金舆","桃花","国印贵人","将星","劫煞","驿马","亡神","羊刃","华盖","禄神",
  "月德合","天德合","天德贵人","月德贵人","血刃","天医","飞刃","红艳煞","流霞","天喜",
  "披麻","寡宿","孤辰","元辰","红鸾","勾绞煞","丧门","吊客","灾煞",
  "十恶大败","学堂","词馆","天罗地网","阴差阳错","十灵日","九丑日","八专日",
  "孤鸾煞","六秀日","金神","地网","正词馆","魁罡日","正学堂","四废日",
  "地转日","天赦日","天罗","天转日","拱禄","三奇贵人",
] as const;

