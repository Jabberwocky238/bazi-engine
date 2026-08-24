/** 魁罡日 (日柱, 4 日: 壬辰/庚辰/庚戌/戊戌). */
import { gzOf, type GanZhi, type ShenshaCheck } from "./common.ts";

const DAYS: readonly GanZhi[] = [
  "壬辰","庚辰","庚戌","戊戌",
] as const;

const check: ShenshaCheck = (pillars, i) => {
  if (i !== 2) return false;
  return DAYS.includes(gzOf(pillars[2]));
};

export const 魁罡日 = { name: "魁罡日", check } as const;
