/**
 * 八字 -> 神煞. Each shensha is a predicate `isXxx(input, pillarIdx) -> boolean`
 * that directly consults the tables in ./consts.ts.
 */
import {
  GAN, ZHI, type Gan, type Zhi, type GanZhi, type Pillar, type BaziInput,
  LU, TIAN_YI, YANG_REN, FEI_REN, FU_XING,
  TAI_JI, WEN_CHANG, TIAN_CHU,
  HONG_LUAN, TIAN_XI, GU_CHEN, GUA_SU,
  TRIAD_MAP, TRIAD_NAMES, TRIAD_YEAR_ONLY, triadOf,
  YUE_DE, YUE_DE_HE, TIAN_DE, TIAN_DE_HE, DE_XIU,
  GU_LUAN_DAYS, KONGWANG_XUN, SUPPORTED_SHENSHA,
  SANG_MEN_OFFSET, GOU_JIAO_OFFSET, PI_MA_OFFSET, DIAO_KE_OFFSET,
  YUAN_CHEN_OFFSET_YANG_MALE_YIN_FEMALE, YUAN_CHEN_OFFSET_YIN_MALE_YANG_FEMALE,
  seasonOf, TIAN_ZHUAN_DAY, DI_ZHUAN_DAY, TIAN_SHE_DAY,
  GONG_LU_DAY_HOUR, SAN_QI_TRIPLES, nayinOf,
  SHI_E_DA_BAI_DAYS, YIN_CHA_YANG_CUO_DAYS, SHI_LING_DAYS, JIU_CHOU_DAYS, BA_ZHUAN_DAYS,
  XUE_TANG_ZHI, CI_GUAN_ZHI, TIAN_LUO_ZHI, DI_WANG_ZHI,
} from "./consts.ts";

export { SUPPORTED_SHENSHA };
export type { Gan, Zhi, Pillar, BaziInput, GanZhi } from "./consts.ts";

export type PillarIndex = 0 | 1 | 2 | 3;
export type ShenshaResult = { year: string[]; month: string[]; day: string[]; hour: string[] };
export type ShenshaCheck = (b: BaziInput, i: PillarIndex) => boolean;

const PILLAR_KEYS = ["year", "month", "day", "hour"] as const;
const pillarAt = (b: BaziInput, i: PillarIndex): Pillar => b[PILLAR_KEYS[i]];

function isGan(x: string): x is Gan { return (GAN as readonly string[]).includes(x); }
function isZhi(x: string): x is Zhi { return (ZHI as readonly string[]).includes(x); }

/** 六十甲子旬空. */
export function kongwangFor(gan: Gan, zhi: Zhi): readonly [Zhi, Zhi] {
  const g = GAN.indexOf(gan), z = ZHI.indexOf(zhi);
  for (let n = 0; n < 60; n++) {
    if (n % 10 === g && n % 12 === z) {
      const row = KONGWANG_XUN[Math.floor(n / 10)];
      if (!row) throw new Error(`kongwang table miss at xun ${Math.floor(n / 10)}`);
      return row;
    }
  }
  throw new Error(`invalid pillar ${gan}${zhi}`);
}

// ========= 日干查支 =========

export const isLuShen: ShenshaCheck = (b, i) =>
  pillarAt(b, i).zhi === LU[b.day.gan];

export const isTianYiGuiRen: ShenshaCheck = (b, i) => {
  const z = pillarAt(b, i).zhi;
  return TIAN_YI[b.day.gan].includes(z) || TIAN_YI[b.year.gan].includes(z);
};

export const isYangRen: ShenshaCheck = (b, i) =>
  pillarAt(b, i).zhi === YANG_REN[b.day.gan];

export const isFeiRen: ShenshaCheck = (b, i) =>
  pillarAt(b, i).zhi === FEI_REN[b.day.gan];

/** 以年干或日干起, 任一柱地支命中表中对应字 → 该柱标. */
const dayOrYearGanToZhi = (table: Readonly<Record<Gan, readonly Zhi[] | Zhi>>): ShenshaCheck =>
  (b, i) => {
    const z = pillarAt(b, i).zhi;
    const dt = table[b.day.gan];
    const yt = table[b.year.gan];
    const hit = (t: readonly Zhi[] | Zhi) => Array.isArray(t) ? t.includes(z) : t === z;
    return hit(dt) || hit(yt);
  };

export const isFuXingGuiRen = dayOrYearGanToZhi(FU_XING);
export const isTaiJiGuiRen = dayOrYearGanToZhi(TAI_JI);
export const isWenChangGuiRen = dayOrYearGanToZhi(WEN_CHANG);
export const isTianChuGuiRen = dayOrYearGanToZhi(TIAN_CHU);

// ========= 童子煞 (月支季节 + 年纳音 → 日支/时支) =========
// 真童子口诀:
//   春秋寅子贵, 冬夏卯未辰;
//   金木午卯合, 水火鸡犬(酉戌)多, 土命逢辰巳.
// 仅落 日柱 / 时柱.
export const isTongZiSha: ShenshaCheck = (b, i) => {
  if (i !== 2 && i !== 3) return false;
  const z = pillarAt(b, i).zhi;
  const season = seasonOf(b.month.zhi);
  if ((season === "春" || season === "秋") && (z === "寅" || z === "子")) return true;
  if ((season === "冬" || season === "夏") && (z === "卯" || z === "未" || z === "辰")) return true;
  const yWx = nayinOf(b.year.gan, b.year.zhi);
  if ((yWx === "金" || yWx === "木") && (z === "午" || z === "卯")) return true;
  if ((yWx === "水" || yWx === "火") && (z === "酉" || z === "戌")) return true;
  if (yWx === "土" && (z === "辰" || z === "巳")) return true;
  return false;
};

// ========= 三合神煞 (年支起局; 除 灾煞 外也从日支起局; 不标源柱) =========

function checkTriad(name: string): ShenshaCheck {
  return (b, i) => {
    const z = pillarAt(b, i).zhi;
    const yTarget = TRIAD_MAP[triadOf(b.year.zhi)][name];
    if (yTarget && i !== 0 && z === yTarget) return true;
    if (!TRIAD_YEAR_ONLY.has(name)) {
      const dTarget = TRIAD_MAP[triadOf(b.day.zhi)][name];
      if (dTarget && i !== 2 && z === dTarget) return true;
    }
    return false;
  };
}

export const isTaoHua = checkTriad("桃花");
export const isJiangXing = checkTriad("将星");
export const isHuaGai = checkTriad("华盖");
export const isYiMa = checkTriad("驿马");
export const isJieSha = checkTriad("劫煞");
export const isZaiSha = checkTriad("灾煞");
export const isWangShen = checkTriad("亡神");

// ========= 年支查支 =========

export const isHongLuan: ShenshaCheck = (b, i) => pillarAt(b, i).zhi === HONG_LUAN[b.year.zhi];
export const isTianXi:   ShenshaCheck = (b, i) => pillarAt(b, i).zhi === TIAN_XI[b.year.zhi];
export const isGuChen:   ShenshaCheck = (b, i) => pillarAt(b, i).zhi === GU_CHEN[b.year.zhi];
export const isGuaSu:    ShenshaCheck = (b, i) => pillarAt(b, i).zhi === GUA_SU[b.year.zhi];

// ========= 年支相对位移 (丧门/吊客/披麻/勾绞煞) =========

const zhiOffset = (base: Zhi, off: number): Zhi => {
  const idx = (ZHI.indexOf(base) + off + 12) % 12;
  return ZHI[idx] as Zhi;
};

const offsetFromYearZhi = (off: number): ShenshaCheck => (b, i) => {
  if (i === 0) return false;
  return pillarAt(b, i).zhi === zhiOffset(b.year.zhi, off);
};

export const isSangMen  = offsetFromYearZhi(SANG_MEN_OFFSET);
export const isGouJiao  = offsetFromYearZhi(GOU_JIAO_OFFSET);
export const isPiMa     = offsetFromYearZhi(PI_MA_OFFSET);
export const isDiaoKe   = offsetFromYearZhi(DIAO_KE_OFFSET);

// ========= 元辰 (大耗) =========
// 阳男阴女 → 年支+7; 阴男阳女 → 年支+5. 年干阴阳以 GAN 索引奇偶判定.

export const isYuanChen: ShenshaCheck = (b, i) => {
  if (i === 0) return false;
  if (b.sex !== 0 && b.sex !== 1) return false;
  const yangYearGan = GAN.indexOf(b.year.gan) % 2 === 0;
  const yangMaleOrYinFemale = (b.sex === 1 && yangYearGan) || (b.sex === 0 && !yangYearGan);
  const off = yangMaleOrYinFemale
    ? YUAN_CHEN_OFFSET_YANG_MALE_YIN_FEMALE
    : YUAN_CHEN_OFFSET_YIN_MALE_YANG_FEMALE;
  return pillarAt(b, i).zhi === zhiOffset(b.year.zhi, off);
};

// ========= 月令 =========

export const isYueDeGuiRen: ShenshaCheck = (b, i) =>
  pillarAt(b, i).gan === YUE_DE[triadOf(b.month.zhi)];

export const isYueDeHe: ShenshaCheck = (b, i) =>
  pillarAt(b, i).gan === YUE_DE_HE[triadOf(b.month.zhi)];

export const isTianDeGuiRen: ShenshaCheck = (b, i) => {
  const p = pillarAt(b, i);
  const t = TIAN_DE[b.month.zhi];
  return (isGan(t) && p.gan === t) || (isZhi(t) && p.zhi === t);
};

export const isTianDeHe: ShenshaCheck = (b, i) => {
  const p = pillarAt(b, i);
  const t = TIAN_DE_HE[b.month.zhi];
  return (isGan(t) && p.gan === t) || (isZhi(t) && p.zhi === t);
};

export const isDeXiuGuiRen: ShenshaCheck = (b, i) =>
  DE_XIU[triadOf(b.month.zhi)].includes(pillarAt(b, i).gan);

// ========= 旬空 / 日柱特殊 =========

export const isKongWang: ShenshaCheck = (b, i) => {
  const z = pillarAt(b, i).zhi;
  const yKw = kongwangFor(b.year.gan, b.year.zhi);
  const dKw = kongwangFor(b.day.gan, b.day.zhi);
  return yKw.includes(z) || dKw.includes(z);
};

export const isGuLuanSha: ShenshaCheck = (b, i) => {
  if (i !== 2) return false;
  return GU_LUAN_DAYS.includes(`${b.day.gan}${b.day.zhi}` as GanZhi);
};

// ========= 季节 + 日柱 (天转日 / 地转日 / 天赦日) =========

const dayEqualsSeason = (table: Readonly<Record<ReturnType<typeof seasonOf>, GanZhi>>): ShenshaCheck =>
  (b, i) => {
    if (i !== 2) return false;
    return `${b.day.gan}${b.day.zhi}` === table[seasonOf(b.month.zhi)];
  };

export const isTianZhuanRi = dayEqualsSeason(TIAN_ZHUAN_DAY);
export const isDiZhuanRi   = dayEqualsSeason(DI_ZHUAN_DAY);
export const isTianSheRi   = dayEqualsSeason(TIAN_SHE_DAY);

// ========= 天罗 (年命纳音为火 + 日支戌/亥) =========

export const isTianLuo: ShenshaCheck = (b, i) => {
  if (i !== 2) return false;
  if (nayinOf(b.year.gan, b.year.zhi) !== "火") return false;
  return b.day.zhi === "戌" || b.day.zhi === "亥";
};

// ========= 拱禄 (日柱 + 时柱 固定五组) =========

export const isGongLu: ShenshaCheck = (b, i) => {
  if (i !== 2) return false;
  const dayGz = `${b.day.gan}${b.day.zhi}` as GanZhi;
  const hourGz = `${b.hour.gan}${b.hour.zhi}` as GanZhi;
  return GONG_LU_DAY_HOUR.some(([d, h]) => d === dayGz && h === hourGz);
};

// ========= 三奇贵人 (年-月-日 或 月-日-时 干顺布) =========

export const isSanQiGuiRen: ShenshaCheck = (b, i) => {
  if (i !== 2) return false;
  const gans: [Gan, Gan, Gan, Gan] = [b.year.gan, b.month.gan, b.day.gan, b.hour.gan];
  const windows: readonly [Gan, Gan, Gan][] = [
    [gans[0], gans[1], gans[2]], // 年-月-日
    [gans[1], gans[2], gans[3]], // 月-日-时
  ];
  return SAN_QI_TRIPLES.some(triple =>
    windows.some(w => w[0] === triple[0] && w[1] === triple[1] && w[2] === triple[2]));
};

// ========= 注册表 / 汇总 =========

export const SHENSHA_CHECKS: readonly (readonly [string, ShenshaCheck])[] = [
  ["禄神", isLuShen],
  ["天乙贵人", isTianYiGuiRen],
  ["羊刃", isYangRen],
  ["飞刃", isFeiRen],
  ["福星贵人", isFuXingGuiRen],
  ["太极贵人", isTaiJiGuiRen],
  ["文昌贵人", isWenChangGuiRen],
  ["天厨贵人", isTianChuGuiRen],
  ["童子煞", isTongZiSha],
  ["桃花", isTaoHua],
  ["将星", isJiangXing],
  ["华盖", isHuaGai],
  ["驿马", isYiMa],
  ["劫煞", isJieSha],
  ["灾煞", isZaiSha],
  ["亡神", isWangShen],
  ["红鸾", isHongLuan],
  ["天喜", isTianXi],
  ["孤辰", isGuChen],
  ["寡宿", isGuaSu],
  ["月德贵人", isYueDeGuiRen],
  ["月德合", isYueDeHe],
  ["天德贵人", isTianDeGuiRen],
  ["天德合", isTianDeHe],
  ["德秀贵人", isDeXiuGuiRen],
  ["空亡", isKongWang],
  ["孤鸾煞", isGuLuanSha],
  ["丧门", isSangMen],
  ["吊客", isDiaoKe],
  ["披麻", isPiMa],
  ["勾绞煞", isGouJiao],
  ["元辰", isYuanChen],
  ["天转日", isTianZhuanRi],
  ["地转日", isDiZhuanRi],
  ["天赦日", isTianSheRi],
  ["天罗", isTianLuo],
  ["拱禄", isGongLu],
  ["三奇贵人", isSanQiGuiRen],
];

function validate(b: BaziInput): void {
  for (const key of PILLAR_KEYS) {
    const p = b[key];
    if (!isGan(p.gan)) throw new Error(`${key}.gan invalid: ${p.gan}`);
    if (!isZhi(p.zhi)) throw new Error(`${key}.zhi invalid: ${p.zhi}`);
  }
}

export function computeShensha(input: BaziInput): ShenshaResult {
  validate(input);
  const out: string[][] = [[], [], [], []];
  for (const [name, check] of SHENSHA_CHECKS) {
    for (const i of [0, 1, 2, 3] as const) {
      if (check(input, i)) out[i]!.push(name);
    }
  }
  return { year: out[0]!, month: out[1]!, day: out[2]!, hour: out[3]! };
}
