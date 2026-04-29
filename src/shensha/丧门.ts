/** 丧门 = 年支 + 2. 不标年柱. */
import { pillarAt, zhiOffset, type ShenshaCheck } from "./common.ts";

const check: ShenshaCheck = (pillars, i) => {
  if (i === 0) return false;
  return pillarAt(pillars, i).zhi === zhiOffset(pillars[0].zhi, 2);
};

export const 丧门 = { name: "丧门", check } as const;
