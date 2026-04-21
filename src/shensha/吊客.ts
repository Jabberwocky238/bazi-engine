/** 吊客 = 年支 - 2 (即 + 10). 不标年柱. */
import { pillarAt, zhiOffset, type ShenshaCheck } from "./common.ts";

const check: ShenshaCheck = (b, i) => {
  if (i === 0) return false;
  return pillarAt(b, i).zhi === zhiOffset(b.year.zhi, 10);
};

export const 吊客 = { name: "吊客", check } as const;
