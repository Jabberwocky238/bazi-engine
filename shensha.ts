/**
 * 八字 -> 神煞 (subset). Pure library — no IO.
 *
 * Supported shensha (the only ones worth validating against 3rd-party data):
 *   禄神, 天乙贵人, 桃花, 将星, 华盖, 驿马, 劫煞, 灾煞, 亡神,
 *   红鸾, 天喜, 孤辰, 寡宿, 空亡
 */

export const GAN = ["甲","乙","丙","丁","戊","己","庚","辛","壬","癸"] as const;
export const ZHI = ["子","丑","寅","卯","辰","巳","午","未","申","酉","戌","亥"] as const;

export type Gan = typeof GAN[number];
export type Zhi = typeof ZHI[number];
export type Pillar = { gan: Gan; zhi: Zhi };
export type BaziInput = { year: Pillar; month: Pillar; day: Pillar; hour: Pillar };
export type ShenshaResult = { year: string[]; month: string[]; day: string[]; hour: string[] };

export const SUPPORTED_SHENSHA = [
  "禄神","天乙贵人","桃花","将星","华盖","驿马",
  "劫煞","灾煞","亡神","红鸾","天喜","孤辰","寡宿","空亡",
] as const;

type TriadKey = "申子辰" | "寅午戌" | "亥卯未" | "巳酉丑";

// 日干 -> 禄神所在支
const LU: Readonly<Record<Gan, Zhi>> = {
  甲:"寅", 乙:"卯", 丙:"巳", 丁:"午", 戊:"巳",
  己:"午", 庚:"申", 辛:"酉", 壬:"亥", 癸:"子",
};

// 天乙贵人: 甲戊庚牛羊, 乙己鼠猴乡, 丙丁猪鸡位, 壬癸兔蛇藏, 六辛逢马虎
const TIANYI: Readonly<Record<Gan, readonly Zhi[]>> = {
  甲:["丑","未"], 戊:["丑","未"], 庚:["丑","未"],
  乙:["子","申"], 己:["子","申"],
  丙:["亥","酉"], 丁:["亥","酉"],
  壬:["卯","巳"], 癸:["卯","巳"],
  辛:["午","寅"],
};

function triadOf(zhi: Zhi): TriadKey {
  if ("申子辰".includes(zhi)) return "申子辰";
  if ("寅午戌".includes(zhi)) return "寅午戌";
  if ("亥卯未".includes(zhi)) return "亥卯未";
  return "巳酉丑";
}

const TRIAD_MAP: Readonly<Record<TriadKey, Readonly<Record<string, Zhi>>>> = {
  "申子辰": { 桃花:"酉", 将星:"子", 华盖:"辰", 驿马:"寅", 劫煞:"巳", 灾煞:"午", 亡神:"亥" },
  "寅午戌": { 桃花:"卯", 将星:"午", 华盖:"戌", 驿马:"申", 劫煞:"亥", 灾煞:"子", 亡神:"巳" },
  "亥卯未": { 桃花:"子", 将星:"卯", 华盖:"未", 驿马:"巳", 劫煞:"申", 灾煞:"酉", 亡神:"寅" },
  "巳酉丑": { 桃花:"午", 将星:"酉", 华盖:"丑", 驿马:"亥", 劫煞:"寅", 灾煞:"卯", 亡神:"申" },
};
const TRIAD_NAMES = ["桃花","将星","华盖","驿马","劫煞","灾煞","亡神"] as const;
// 灾煞 only dispatches from year branch; others dispatch from year OR day branch
const TRIAD_YEAR_ONLY = new Set<string>(["灾煞"]);

const HONGLUAN: Readonly<Record<Zhi, Zhi>> = { 子:"卯", 丑:"寅", 寅:"丑", 卯:"子", 辰:"亥", 巳:"戌", 午:"酉", 未:"申", 申:"未", 酉:"午", 戌:"巳", 亥:"辰" };
const TIANXI:   Readonly<Record<Zhi, Zhi>> = { 子:"酉", 丑:"申", 寅:"未", 卯:"午", 辰:"巳", 巳:"辰", 午:"卯", 未:"寅", 申:"丑", 酉:"子", 戌:"亥", 亥:"戌" };

const GUCHEN: Readonly<Record<Zhi, Zhi>> = {
  亥:"寅", 子:"寅", 丑:"寅",
  寅:"巳", 卯:"巳", 辰:"巳",
  巳:"申", 午:"申", 未:"申",
  申:"亥", 酉:"亥", 戌:"亥",
};
const GUASU: Readonly<Record<Zhi, Zhi>> = {
  亥:"戌", 子:"戌", 丑:"戌",
  寅:"丑", 卯:"丑", 辰:"丑",
  巳:"辰", 午:"辰", 未:"辰",
  申:"未", 酉:"未", 戌:"未",
};

const KONGWANG_XUN: readonly (readonly [Zhi, Zhi])[] = [
  ["戌","亥"], ["申","酉"], ["午","未"],
  ["辰","巳"], ["寅","卯"], ["子","丑"],
];

/** Returns the two-branch 旬空 for a day pillar. */
export function kongwangFor(gan: Gan, zhi: Zhi): readonly [Zhi, Zhi] {
  const g = GAN.indexOf(gan);
  const z = ZHI.indexOf(zhi);
  for (let n = 0; n < 60; n++) {
    if (n % 10 === g && n % 12 === z) {
      const entry = KONGWANG_XUN[Math.floor(n / 10)];
      if (!entry) throw new Error(`kongwang table miss at xun ${Math.floor(n / 10)}`);
      return entry;
    }
  }
  throw new Error(`invalid pillar ${gan}${zhi} — not in sexagenary cycle`);
}

function isGan(x: string): x is Gan { return (GAN as readonly string[]).includes(x); }
function isZhi(x: string): x is Zhi { return (ZHI as readonly string[]).includes(x); }
function assertPillar(p: Pillar, label: string): void {
  if (!isGan(p.gan)) throw new Error(`${label}.gan invalid: ${p.gan}`);
  if (!isZhi(p.zhi)) throw new Error(`${label}.zhi invalid: ${p.zhi}`);
}

export function computeShensha(input: BaziInput): ShenshaResult {
  assertPillar(input.year, "year");
  assertPillar(input.month, "month");
  assertPillar(input.day, "day");
  assertPillar(input.hour, "hour");

  const pillars = [input.year, input.month, input.day, input.hour];
  const branches = pillars.map(p => p.zhi);
  const out: string[][] = [[], [], [], []];
  const dg = input.day.gan, dz = input.day.zhi;
  const yg = input.year.gan, yz = input.year.zhi;

  const luT = LU[dg];
  branches.forEach((b, i) => { if (b === luT) out[i]!.push("禄神"); });

  const tianyi = new Set<Zhi>([...TIANYI[dg], ...TIANYI[yg]]);
  branches.forEach((b, i) => { if (tianyi.has(b)) out[i]!.push("天乙贵人"); });

  // 三合神煞: 年支/日支起局,取匹配支,但不标记源柱本身
  // (indices: 0=year, 2=day)
  const yTriad = TRIAD_MAP[triadOf(yz)];
  const dTriad = TRIAD_MAP[triadOf(dz)];
  for (const name of TRIAD_NAMES) {
    const yTarget = yTriad[name];
    const dTarget = dTriad[name];
    const tagged = new Set<number>();
    if (yTarget) {
      branches.forEach((br, i) => { if (i !== 0 && br === yTarget) tagged.add(i); });
    }
    if (dTarget && !TRIAD_YEAR_ONLY.has(name)) {
      branches.forEach((br, i) => { if (i !== 2 && br === dTarget) tagged.add(i); });
    }
    for (const i of tagged) out[i]!.push(name);
  }

  const hl = HONGLUAN[yz], tx = TIANXI[yz], gc = GUCHEN[yz], gs = GUASU[yz];
  branches.forEach((b, i) => { if (b === hl) out[i]!.push("红鸾"); });
  branches.forEach((b, i) => { if (b === tx) out[i]!.push("天喜"); });
  branches.forEach((b, i) => { if (b === gc) out[i]!.push("孤辰"); });
  branches.forEach((b, i) => { if (b === gs) out[i]!.push("寡宿"); });

  // 空亡 — 年柱旬空 ∪ 日柱旬空
  const kwSet = new Set<string>([...kongwangFor(yg, yz), ...kongwangFor(dg, dz)]);
  branches.forEach((b, i) => { if (kwSet.has(b)) out[i]!.push("空亡"); });

  return { year: out[0]!, month: out[1]!, day: out[2]!, hour: out[3]! };
}
