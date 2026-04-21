/** 八专日 (日柱, 8 日, 干支同气). */
import type { GanZhi } from "../types.ts";
import { gzOf, type ShenshaCheck } from "./common.ts";

const DAYS: readonly GanZhi[] = [
  "甲寅","乙卯","丁未","戊戌","己未","庚申","辛酉","癸丑",
] as const;

const check: ShenshaCheck = (b, i) => {
  if (i !== 2) return false;
  return DAYS.includes(gzOf(b.day));
};

export const 八专日 = { name: "八专日", check } as const;
