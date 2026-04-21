/** 食神 = 我生 + 同阴阳. */
import type { Gan } from "../types.ts";
import { isYangGan } from "../ganzhi.ts";
import { relationOf } from "../wuxing.ts";
import type { ShishenDef } from "./index.ts";

export const 食神 = {
  name: "食神",
  category: "食伤",
  relation: "我生",
  samePolarity: true,
  match(day: Gan, other: Gan): boolean {
    return relationOf(day, other) === "我生" && isYangGan(day) === isYangGan(other);
  },
} as ShishenDef;
