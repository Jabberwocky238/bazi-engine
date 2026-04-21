/** 九丑日 (日柱, 9 日, 自坐桃花). */
import type { GanZhi } from "../types.ts";
import { gzOf, type ShenshaCheck } from "./common.ts";

const DAYS: readonly GanZhi[] = [
  "戊子","戊午","己卯","己酉","辛卯","辛酉","壬子","壬午","丁酉",
] as const;

const check: ShenshaCheck = (b, i) => {
  if (i !== 2) return false;
  return DAYS.includes(gzOf(b.day));
};

export const 九丑日 = { name: "九丑日", check } as const;
