/**
 * 国印贵人 (年干 或 日干 → 地支).
 * 口诀: 甲见戌, 乙见亥, 丙见丑, 丁见寅, 戊见丑, 己见寅,
 *       庚见辰, 辛见巳, 壬见未, 癸见申.
 */
import type { Gan, Zhi } from "../types.ts";
import { pillarAt, type ShenshaCheck } from "./common.ts";

const GUO_YIN: Readonly<Record<Gan, Zhi>> = {
  甲:"戌", 乙:"亥",
  丙:"丑", 丁:"寅",
  戊:"丑", 己:"寅",
  庚:"辰", 辛:"巳",
  壬:"未", 癸:"申",
};

const check: ShenshaCheck = (b, i) => {
  const z = pillarAt(b, i).zhi;
  return z === GUO_YIN[b.day.gan] || z === GUO_YIN[b.year.gan];
};

export const 国印贵人 = { name: "国印贵人", check } as const;
