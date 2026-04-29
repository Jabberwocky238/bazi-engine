/** 披麻 = 年支 - 3 (即 + 9). 不标年柱. */
import { pillarAt, zhiOffset, type ShenshaCheck } from "./common.ts";

const check: ShenshaCheck = (pillars, i) => {
  if (i === 0) return false;
  return pillarAt(pillars, i).zhi === zhiOffset(pillars[0].zhi, 9);
};

export const 披麻 = { name: "披麻", check } as const;
