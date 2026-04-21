/** 月支 → 四季. */
import type { Zhi, Season } from "./types.ts";

/** 春: 寅卯辰; 夏: 巳午未; 秋: 申酉戌; 冬: 亥子丑. */
export function seasonOf(monthZhi: Zhi): Season {
  if ("寅卯辰".includes(monthZhi)) return "春";
  if ("巳午未".includes(monthZhi)) return "夏";
  if ("申酉戌".includes(monthZhi)) return "秋";
  return "冬";
}
