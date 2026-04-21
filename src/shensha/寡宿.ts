/** 寡宿 (年支 → 地支). 亥子丑年见戌, 寅卯辰年见丑, 巳午未年见辰, 申酉戌年见未. */
import type { Zhi } from "../types.ts";
import { pillarAt, type ShenshaCheck } from "./common.ts";

const GUA_SU: Readonly<Record<Zhi, Zhi>> = {
  亥:"戌", 子:"戌", 丑:"戌",
  寅:"丑", 卯:"丑", 辰:"丑",
  巳:"辰", 午:"辰", 未:"辰",
  申:"未", 酉:"未", 戌:"未",
};

const check: ShenshaCheck = (b, i) => pillarAt(b, i).zhi === GUA_SU[b.year.zhi];

export const 寡宿 = { name: "寡宿", check } as const;
