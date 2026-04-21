/** 天转日: 春乙卯 / 夏丙午 / 秋辛酉 / 冬壬子. */
import type { GanZhi, Season } from "../types.ts";
import { seasonOf } from "../season.ts";
import { gzOf, type ShenshaCheck } from "./common.ts";

const DAYS: Readonly<Record<Season, GanZhi>> = {
  春:"乙卯", 夏:"丙午", 秋:"辛酉", 冬:"壬子",
};

const check: ShenshaCheck = (b, i) => {
  if (i !== 2) return false;
  return gzOf(b.day) === DAYS[seasonOf(b.month.zhi)];
};

export const 天转日 = { name: "天转日", check } as const;
