/** 四废日 (月支季节 → 日柱干支, 当令五行之绝地). */
import { seasonOf, gzOf, type GanZhi, type Season, type ShenshaCheck } from "./common.ts";

const DAYS: Readonly<Record<Season, readonly GanZhi[]>> = {
  春: ["庚申","辛酉"],
  夏: ["壬子","癸亥"],
  秋: ["甲寅","乙卯"],
  冬: ["丙午","丁巳"],
};

const check: ShenshaCheck = (pillars, i) => {
  if (i !== 2) return false;
  return DAYS[seasonOf(pillars[1].zhi)].includes(gzOf(pillars[2]));
};

export const 四废日 = { name: "四废日", check } as const;
