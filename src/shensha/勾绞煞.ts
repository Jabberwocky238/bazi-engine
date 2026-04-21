/** 勾绞煞 = 年支 + 3. 不标年柱. */
import { pillarAt, zhiOffset, type ShenshaCheck } from "./common.ts";

const check: ShenshaCheck = (b, i) => {
  if (i === 0) return false;
  return pillarAt(b, i).zhi === zhiOffset(b.year.zhi, 3);
};

export const 勾绞煞 = { name: "勾绞煞", check } as const;
