/** 吊客 = 年支 - 2 (即 + 10). 不标年柱. */
import { pillarAt, zhiOffset, type ShenshaCheck } from "./common.ts";

const check: ShenshaCheck = (pillars, i) => {
  if (i === 0) return false;
  return pillarAt(pillars, i).zhi === zhiOffset(pillars[0].zhi, 10);
};

export const 吊客 = { name: "吊客", check } as const;
