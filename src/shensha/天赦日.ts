/** 天赦日: 春戊寅 / 夏甲午 / 秋戊申 / 冬甲子. */
import type { GanZhi, Season } from "../types.ts";
import { seasonOf } from "../season.ts";
import { gzOf, type ShenshaCheck } from "./common.ts";

const DAYS: Readonly<Record<Season, GanZhi>> = {
  春:"戊寅", 夏:"甲午", 秋:"戊申", 冬:"甲子",
};

const check: ShenshaCheck = (b, i) => {
  if (i !== 2) return false;
  return gzOf(b.day) === DAYS[seasonOf(b.month.zhi)];
};

export const 天赦日 = { name: "天赦日", check } as const;
