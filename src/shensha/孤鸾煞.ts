/** 孤鸾煞 (日柱固定集合, 来自数据). */
import type { GanZhi } from "../types.ts";
import { gzOf, type ShenshaCheck } from "./common.ts";

const GU_LUAN_DAYS: readonly GanZhi[] = [
  "乙巳","丁巳","戊申","辛亥","壬子","甲寅","戊午","丙午",
] as const;

const check: ShenshaCheck = (b, i) => {
  if (i !== 2) return false;
  return GU_LUAN_DAYS.includes(gzOf(b.day));
};

export const 孤鸾煞 = { name: "孤鸾煞", check } as const;
