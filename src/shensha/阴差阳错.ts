/** 阴差阳错 (日柱, 12 日). */
import type { GanZhi } from "../types.ts";
import { gzOf, type ShenshaCheck } from "./common.ts";

const DAYS: readonly GanZhi[] = [
  "辛卯","壬辰","癸巳","丙午","丁未","戊申",
  "辛酉","壬戌","癸亥","丙子","丁丑","戊寅",
] as const;

const check: ShenshaCheck = (b, i) => {
  if (i !== 2) return false;
  return DAYS.includes(gzOf(b.day));
};

export const 阴差阳错 = { name: "阴差阳错", check } as const;
