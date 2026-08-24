/** 天转日: 春乙卯 / 夏丙午 / 秋辛酉 / 冬壬子. */
import { seasonOf, gzOf, type GanZhi, type Season, type ShenshaCheck } from "./common.ts";

const DAYS: Readonly<Record<Season, GanZhi>> = {
  春:"乙卯", 夏:"丙午", 秋:"辛酉", 冬:"壬子",
};

const check: ShenshaCheck = (pillars, i) => {
  if (i !== 2) return false;
  return gzOf(pillars[2]) === DAYS[seasonOf(pillars[1].zhi)];
};

export const 天转日 = { name: "天转日", check } as const;
