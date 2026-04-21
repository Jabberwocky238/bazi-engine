/** 月德贵人 (月支三合局 → 天干; 四柱天干见之). */
import type { Gan, TriadKey } from "../types.ts";
import { triadOf } from "../triad.ts";
import { pillarAt, type ShenshaCheck } from "./common.ts";

const YUE_DE: Readonly<Record<TriadKey, Gan>> = {
  "寅午戌":"丙", "申子辰":"壬", "亥卯未":"甲", "巳酉丑":"庚",
};

const check: ShenshaCheck = (b, i) =>
  pillarAt(b, i).gan === YUE_DE[triadOf(b.month.zhi)];

export const 月德贵人 = { name: "月德贵人", check } as const;
