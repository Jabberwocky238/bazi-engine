/** 孤辰 (年支 → 地支). 亥子丑年见寅, 寅卯辰年见巳, 巳午未年见申, 申酉戌年见亥. */
import type { Zhi } from "../types.ts";
import { pillarAt, type ShenshaCheck } from "./common.ts";

const GU_CHEN: Readonly<Record<Zhi, Zhi>> = {
  亥:"寅", 子:"寅", 丑:"寅",
  寅:"巳", 卯:"巳", 辰:"巳",
  巳:"申", 午:"申", 未:"申",
  申:"亥", 酉:"亥", 戌:"亥",
};

const check: ShenshaCheck = (b, i) => pillarAt(b, i).zhi === GU_CHEN[b.year.zhi];

export const 孤辰 = { name: "孤辰", check } as const;
