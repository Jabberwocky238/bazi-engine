/**
 * 神煞判定共享类型与极小工具. 不放任何查表 const —
 * 每个神煞自己的数据在各自的文件里.
 */
import { ZHI, KONGWANG_XUN, type Gan, type Sex, type Zhi, type Season, type TriadKey, type WuXing, type Pillar } from "@/types";

import { LunarUtil } from "lunar-typescript";
import { BaziEngineError } from "@/error";

export type GanZhi = `${Gan}${Zhi}`;
export type NayinWuxing = WuXing;
export type { Gan, Sex, Zhi, Season, TriadKey, WuXing, Pillar };

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
export function seasonOf(z: Zhi): Season {
  if ("寅卯辰".includes(z)) return "春";
  if ("巳午未".includes(z)) return "夏";
  if ("申酉戌".includes(z)) return "秋";
  if ("亥子丑".includes(z)) return "冬";
  throw new BaziEngineError(`invalid month zhi ${z}`);
}
export function nayinOf(gan: Gan, zhi: Zhi): NayinWuxing {
  const name = LunarUtil.NAYIN[`${gan}${zhi}`];
  if (!name) throw new BaziEngineError(`invalid ganzhi ${gan}${zhi}`);
  return name.charAt(name.length - 1) as WuXing;
}
export function kongwangFor(gan: Gan, zhi: Zhi): readonly [Zhi, Zhi] {
  const g = ["甲","乙","丙","丁","戊","己","庚","辛","壬","癸"].indexOf(gan);
  const z = ["子","丑","寅","卯","辰","巳","午","未","申","酉","戌","亥"].indexOf(zhi);
  for (let n = 0; n < 60; n++) if (n % 10 === g && n % 12 === z) return KONGWANG_XUN[Math.floor(n / 10)]!;
  throw new BaziEngineError(`invalid pillar ${gan}${zhi}`);
}

export type PillarIndex = 0 | 1 | 2 | 3;

/**
 * 四主柱 tuple, 顺序为 年/月/日/时. 时柱可缺 (时辰未知场景).
 * computeShensha 在 hour === undefined 时不会以 i=3 调用 detector,
 * 但 detector 仍可能从其他柱的 check 中读到 pillars[3] (例如 拱禄 / 金神 / 三奇贵人), 这些情形需要 detector 自行判空.
 */
export type ShenshaPillars = readonly [Pillar, Pillar, Pillar, Pillar | undefined];

/**
 * 神煞判定. 入参为四主柱 tuple + 性别 + 当前柱 index.
 * 仅 元辰 用到 sex; 其他 detector 写 `(pillars, i)` 即可, 第三参数省略.
 */
export type ShenshaCheck = (
  pillars: ShenshaPillars,
  i: PillarIndex,
  sex: Sex,
) => boolean;

export type ShenshaDef = {
  readonly name: string;
  readonly check: ShenshaCheck;
};

/**
 * 取第 i 柱. 调用方需保证 i 对应的柱不为 undefined (即 i!==3 或 hour 已知);
 * computeShensha 入口已按此过滤, detector 如需手动越过该约束应直接读 pillars[3]
 * 并自行判空 (见 拱禄 / 金神 / 三奇贵人).
 */
export const pillarAt = (pillars: ShenshaPillars, i: PillarIndex): Pillar => pillars[i]!;
export const gzOf = (p: Pillar): GanZhi => `${p.gan}${p.zhi}` as GanZhi;

/** 以 base 为起点沿 ZHI 顺行 `off` 位. */
export function zhiOffset(base: Zhi, off: number): Zhi {
  const idx = (ZHI.indexOf(base) + off + 12) % 12;
  return ZHI[idx] as Zhi;
}
