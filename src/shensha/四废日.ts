/** 四废日 (月支季节 → 日柱干支, 当令五行之绝地). */
import type { GanZhi, Season } from "../types.ts";
import { seasonOf } from "../season.ts";
import { gzOf, type ShenshaCheck } from "./common.ts";

const DAYS: Readonly<Record<Season, readonly GanZhi[]>> = {
  春: ["庚申","辛酉"],
  夏: ["壬子","癸亥"],
  秋: ["甲寅","乙卯"],
  冬: ["丙午","丁巳"],
};

const check: ShenshaCheck = (b, i) => {
  if (i !== 2) return false;
  return DAYS[seasonOf(b.month.zhi)].includes(gzOf(b.day));
};

export const 四废日 = { name: "四废日", check } as const;
