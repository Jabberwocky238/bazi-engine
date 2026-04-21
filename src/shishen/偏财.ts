/** 偏财 = 我克 + 同阴阳. */
import type { Gan } from "../types.ts";
import { isYangGan } from "../ganzhi.ts";
import { relationOf } from "../wuxing.ts";
import type { ShishenDef } from "./index.ts";

export const 偏财 = {
  name: "偏财",
  category: "财",
  relation: "我克",
  samePolarity: true,
  match(day: Gan, other: Gan): boolean {
    return relationOf(day, other) === "我克" && isYangGan(day) === isYangGan(other);
  },
} as ShishenDef;
