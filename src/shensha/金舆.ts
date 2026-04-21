/**
 * 金舆 = 禄前二位 (年干 或 日干 → 地支).
 * 口诀: 甲龙乙蛇丙戊羊, 丁己猴歌庚犬方, 辛猪壬牛癸逢虎.
 */
import type { Gan, Zhi } from "../types.ts";
import { pillarAt, type ShenshaCheck } from "./common.ts";

const JIN_YU: Readonly<Record<Gan, Zhi>> = {
  甲:"辰", 乙:"巳",
  丙:"未", 丁:"申",
  戊:"未", 己:"申",
  庚:"戌", 辛:"亥",
  壬:"丑", 癸:"寅",
};

const check: ShenshaCheck = (b, i) => {
  const z = pillarAt(b, i).zhi;
  return z === JIN_YU[b.day.gan] || z === JIN_YU[b.year.gan];
};

export const 金舆 = { name: "金舆", check } as const;
