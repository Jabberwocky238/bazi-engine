/**
 * 元辰 (大耗). 以年支为基准, 按 "年干阴阳 × 性别" 分组:
 *   阳男 / 阴女 → 年支 + 7
 *   阴男 / 阳女 → 年支 + 5
 * 年柱不标.
 */
import { GAN } from "@/types";
import { pillarAt, zhiOffset, type ShenshaCheck } from "./common.ts";

const OFFSET_YANG_MALE_YIN_FEMALE = 7;
const OFFSET_YIN_MALE_YANG_FEMALE = 5;

const check: ShenshaCheck = (pillars, i, sex) => {
  if (i === 0) return false;
  if (sex !== 0 && sex !== 1) return false;
  const target = pillarAt(pillars, i);
  if (!target) return false;
  const yangYearGan = GAN.indexOf(pillars[0].gan) % 2 === 0;
  const yangMaleOrYinFemale = (sex === 1 && yangYearGan) || (sex === 0 && !yangYearGan);
  const off = yangMaleOrYinFemale ? OFFSET_YANG_MALE_YIN_FEMALE : OFFSET_YIN_MALE_YANG_FEMALE;
  return target.zhi === zhiOffset(pillars[0].zhi, off);
};

export const 元辰 = { name: "元辰", check } as const;
