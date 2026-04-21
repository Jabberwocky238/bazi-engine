/** 比肩 = 同类 + 同阴阳. */
import type { Gan } from "../types.ts";
import { isYangGan } from "../ganzhi.ts";
import { relationOf } from "../wuxing.ts";
import type { ShishenDef } from "./index.ts";

export const 比肩 = {
  name: "比肩",
  category: "比劫",
  relation: "同类",
  samePolarity: true,
  match(day: Gan, other: Gan): boolean {
    return relationOf(day, other) === "同类" && isYangGan(day) === isYangGan(other);
  },
} as ShishenDef;
