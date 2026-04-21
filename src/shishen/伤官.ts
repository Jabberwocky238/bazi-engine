/** 伤官 = 我生 + 异阴阳. */
import type { Gan } from "../types.ts";
import { isYangGan } from "../ganzhi.ts";
import { relationOf } from "../wuxing.ts";
import type { ShishenDef } from "./index.ts";

export const 伤官 = {
  name: "伤官",
  category: "食伤",
  relation: "我生",
  samePolarity: false,
  match(day: Gan, other: Gan): boolean {
    return relationOf(day, other) === "我生" && isYangGan(day) !== isYangGan(other);
  },
} as ShishenDef;
