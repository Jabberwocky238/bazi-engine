/** 红鸾 (年支 → 地支). */
import type { Zhi } from "@/types";
import { pillarAt, type ShenshaCheck } from "./common.ts";

const HONG_LUAN: Readonly<Record<Zhi, Zhi>> = {
  子:"卯", 丑:"寅", 寅:"丑", 卯:"子", 辰:"亥", 巳:"戌",
  午:"酉", 未:"申", 申:"未", 酉:"午", 戌:"巳", 亥:"辰",
};

const check: ShenshaCheck = (pillars, i) => pillarAt(pillars, i).zhi === HONG_LUAN[pillars[0].zhi];

export const 红鸾 = { name: "红鸾", check } as const;
