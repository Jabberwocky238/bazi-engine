/** 月德合 (月德干的天干五合). */
import type { Gan, TriadKey } from "../types.ts";
import { triadOf } from "../triad.ts";
import { pillarAt, type ShenshaCheck } from "./common.ts";

const YUE_DE_HE: Readonly<Record<TriadKey, Gan>> = {
  "寅午戌":"辛", "申子辰":"丁", "亥卯未":"己", "巳酉丑":"乙",
};

const check: ShenshaCheck = (b, i) =>
  pillarAt(b, i).gan === YUE_DE_HE[triadOf(b.month.zhi)];

export const 月德合 = { name: "月德合", check } as const;
