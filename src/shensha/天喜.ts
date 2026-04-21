/** 天喜 (年支 → 地支). */
import type { Zhi } from "../types.ts";
import { pillarAt, type ShenshaCheck } from "./common.ts";

const TIAN_XI: Readonly<Record<Zhi, Zhi>> = {
  子:"酉", 丑:"申", 寅:"未", 卯:"午", 辰:"巳", 巳:"辰",
  午:"卯", 未:"寅", 申:"丑", 酉:"子", 戌:"亥", 亥:"戌",
};

const check: ShenshaCheck = (b, i) => pillarAt(b, i).zhi === TIAN_XI[b.year.zhi];

export const 天喜 = { name: "天喜", check } as const;
