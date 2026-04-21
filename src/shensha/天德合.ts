/** 天德合 (天德的 干合 或 支合). */
import type { Gan, Zhi } from "../types.ts";
import { GAN, ZHI } from "../types.ts";
import { pillarAt, type ShenshaCheck } from "./common.ts";

const TIAN_DE_HE: Readonly<Record<Zhi, Gan | Zhi>> = {
  寅:"壬", 卯:"巳", 辰:"丁", 巳:"丙",
  午:"寅", 未:"己", 申:"戊", 酉:"亥",
  戌:"辛", 亥:"庚", 子:"申", 丑:"乙",
};

const isGan = (x: string): x is Gan => (GAN as readonly string[]).includes(x);
const isZhi = (x: string): x is Zhi => (ZHI as readonly string[]).includes(x);

const check: ShenshaCheck = (b, i) => {
  const p = pillarAt(b, i);
  const t = TIAN_DE_HE[b.month.zhi];
  return (isGan(t) && p.gan === t) || (isZhi(t) && p.zhi === t);
};

export const 天德合 = { name: "天德合", check } as const;
