/**
 * 八字 -> 神煞. Each shensha is a predicate `isXxx(input, pillarIdx) -> boolean`
 * that directly consults the tables in ./consts.ts.
 */
import {
  GAN, ZHI, type Gan, type Zhi, type GanZhi, type Pillar, type BaziInput,
  LU, TIAN_YI, YANG_REN, FEI_REN, FU_XING,
  HONG_LUAN, TIAN_XI, GU_CHEN, GUA_SU,
  TRIAD_MAP, TRIAD_NAMES, TRIAD_YEAR_ONLY, triadOf,
  YUE_DE, YUE_DE_HE, TIAN_DE, TIAN_DE_HE, DE_XIU,
  GU_LUAN_DAYS, KONGWANG_XUN, SUPPORTED_SHENSHA,
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

export const isFuXingGuiRen: ShenshaCheck = (b, i) =>
  FU_XING[b.day.gan].includes(pillarAt(b, i).zhi);

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

// ========= 注册表 / 汇总 =========

export const SHENSHA_CHECKS: readonly (readonly [string, ShenshaCheck])[] = [
  ["禄神", isLuShen],
  ["天乙贵人", isTianYiGuiRen],
  ["羊刃", isYangRen],
  ["飞刃", isFeiRen],
  ["福星贵人", isFuXingGuiRen],
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
