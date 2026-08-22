/** 十恶大败 (日柱, 本旬禄位落空, 十无禄日). */
import type { GanZhi } from "./common.ts";
import { gzOf, type ShenshaCheck } from "./common.ts";

const DAYS: readonly GanZhi[] = [
  "甲辰","乙巳","丙申","丁亥","戊戌","己丑","庚辰","辛巳","壬申","癸亥",
] as const;

const check: ShenshaCheck = (pillars, i) => {
  if (i !== 2) return false;
  return DAYS.includes(gzOf(pillars[2]));
};

export const 十恶大败 = { name: "十恶大败", check } as const;
