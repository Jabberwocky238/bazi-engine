/** 地转日: 春辛卯 / 夏戊午 / 秋癸酉 / 冬丙子. */
import { seasonOf, gzOf, type GanZhi, type Season, type ShenshaCheck } from "./common.ts";

const DAYS: Readonly<Record<Season, GanZhi>> = {
  春:"辛卯", 夏:"戊午", 秋:"癸酉", 冬:"丙子",
};

const check: ShenshaCheck = (pillars, i) => {
  if (i !== 2) return false;
  return gzOf(pillars[2]) === DAYS[seasonOf(pillars[1].zhi)];
};

export const 地转日 = { name: "地转日", check } as const;
