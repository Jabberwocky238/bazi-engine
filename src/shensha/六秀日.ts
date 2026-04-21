/** 六秀日 (日柱, 6 日). */
import type { GanZhi } from "../types.ts";
import { gzOf, type ShenshaCheck } from "./common.ts";

const DAYS: readonly GanZhi[] = [
  "丙午","丁未","戊子","戊午","己丑","己未",
] as const;

const check: ShenshaCheck = (b, i) => {
  if (i !== 2) return false;
  return DAYS.includes(gzOf(b.day));
};

export const 六秀日 = { name: "六秀日", check } as const;
