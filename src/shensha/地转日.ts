/** 地转日: 春辛卯 / 夏戊午 / 秋癸酉 / 冬丙子. */
import type { GanZhi, Season } from "../types.ts";
import { seasonOf } from "../season.ts";
import { gzOf, type ShenshaCheck } from "./common.ts";

const DAYS: Readonly<Record<Season, GanZhi>> = {
  春:"辛卯", 夏:"戊午", 秋:"癸酉", 冬:"丙子",
};

const check: ShenshaCheck = (b, i) => {
  if (i !== 2) return false;
  return gzOf(b.day) === DAYS[seasonOf(b.month.zhi)];
};

export const 地转日 = { name: "地转日", check } as const;
