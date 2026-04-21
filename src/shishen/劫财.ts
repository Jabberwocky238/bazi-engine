/** 劫财 = 同类 + 异阴阳. */
import type { Gan } from "../types.ts";
import { isYangGan } from "../ganzhi.ts";
import { relationOf } from "../wuxing.ts";
import type { ShishenDef } from "./index.ts";

export const 劫财 = {
  name: "劫财",
  category: "比劫",
  relation: "同类",
  samePolarity: false,
  match(day: Gan, other: Gan): boolean {
    return relationOf(day, other) === "同类" && isYangGan(day) !== isYangGan(other);
  },
} as ShishenDef;
