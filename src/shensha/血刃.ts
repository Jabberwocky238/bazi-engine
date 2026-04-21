/**
 * 血刃 (月支 → 地支).
 * 口诀: 子午丑子寅丑卯未, 辰寅巳申午卯未酉, 申辰酉戌戌巳亥亥.
 */
import type { Zhi } from "../types.ts";
import { pillarAt, type ShenshaCheck } from "./common.ts";

const XUE_REN: Readonly<Record<Zhi, Zhi>> = {
  子:"午", 丑:"子", 寅:"丑", 卯:"未",
  辰:"寅", 巳:"申", 午:"卯", 未:"酉",
  申:"辰", 酉:"戌", 戌:"巳", 亥:"亥",
};

const check: ShenshaCheck = (b, i) => pillarAt(b, i).zhi === XUE_REN[b.month.zhi];

export const 血刃 = { name: "血刃", check } as const;
