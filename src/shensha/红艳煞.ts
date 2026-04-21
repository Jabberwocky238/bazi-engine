/**
 * 红艳煞 (日干 → 地支). 数据版本 (与古诀略有出入: 乙取午而非申).
 * 口诀: 多情多欲少人知, 六丙逢寅辛见鸡; 癸临申上丁见未,
 *       甲乙午申庚见戌; 戊己怕辰壬怕子.
 */
import type { Gan, Zhi } from "../types.ts";
import { pillarAt, type ShenshaCheck } from "./common.ts";

const HONG_YAN: Readonly<Record<Gan, Zhi>> = {
  甲:"午", 乙:"午",
  丙:"寅", 丁:"未",
  戊:"辰", 己:"辰",
  庚:"戌", 辛:"酉",
  壬:"子", 癸:"申",
};

const check: ShenshaCheck = (b, i) => pillarAt(b, i).zhi === HONG_YAN[b.day.gan];

export const 红艳煞 = { name: "红艳煞", check } as const;
