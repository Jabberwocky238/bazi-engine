/** 天医 (月支前一位地支). 正月(寅)见丑, 二月(卯)见寅, 依此类推. */
import type { Zhi } from "../types.ts";
import { pillarAt, type ShenshaCheck } from "./common.ts";

const TIAN_YI_XING: Readonly<Record<Zhi, Zhi>> = {
  子:"亥", 丑:"子", 寅:"丑", 卯:"寅",
  辰:"卯", 巳:"辰", 午:"巳", 未:"午",
  申:"未", 酉:"申", 戌:"酉", 亥:"戌",
};

const check: ShenshaCheck = (b, i) => pillarAt(b, i).zhi === TIAN_YI_XING[b.month.zhi];

export const 天医 = { name: "天医", check } as const;
