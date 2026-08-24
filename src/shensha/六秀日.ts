/** 六秀日 (日柱, 6 日). */
import { gzOf, type GanZhi, type ShenshaCheck } from "./common.ts";

const DAYS: readonly GanZhi[] = [
  "丙午","丁未","戊子","戊午","己丑","己未",
] as const;

const check: ShenshaCheck = (pillars, i) => {
  if (i !== 2) return false;
  return DAYS.includes(gzOf(pillars[2]));
};

export const 六秀日 = { name: "六秀日", check } as const;
