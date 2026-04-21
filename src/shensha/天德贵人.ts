/** 天德贵人 (月支 → 天干 或 地支). */
import type { Gan, Zhi } from "../types.ts";
import { GAN, ZHI } from "../types.ts";
import { pillarAt, type ShenshaCheck } from "./common.ts";

const TIAN_DE: Readonly<Record<Zhi, Gan | Zhi>> = {
  寅:"丁", 卯:"申", 辰:"壬", 巳:"辛",
  午:"亥", 未:"甲", 申:"癸", 酉:"寅",
  戌:"丙", 亥:"乙", 子:"巳", 丑:"庚",
};

const isGan = (x: string): x is Gan => (GAN as readonly string[]).includes(x);
const isZhi = (x: string): x is Zhi => (ZHI as readonly string[]).includes(x);

const check: ShenshaCheck = (b, i) => {
  const p = pillarAt(b, i);
  const t = TIAN_DE[b.month.zhi];
  return (isGan(t) && p.gan === t) || (isZhi(t) && p.zhi === t);
};

export const 天德贵人 = { name: "天德贵人", check } as const;
