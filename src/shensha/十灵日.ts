/** 十灵日 (日柱, 10 日). */
import { gzOf, type GanZhi, type ShenshaCheck } from "./common.ts";

const DAYS: readonly GanZhi[] = [
  "甲辰","乙亥","丙辰","丁酉","戊午","庚戌","庚寅","辛亥","壬寅","癸未",
] as const;

const check: ShenshaCheck = (pillars, i) => {
  if (i !== 2) return false;
  return DAYS.includes(gzOf(pillars[2]));
};

export const 十灵日 = { name: "十灵日", check } as const;
