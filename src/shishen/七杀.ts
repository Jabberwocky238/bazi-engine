/** 七杀 = 克我 + 同阴阳. */
import type { Gan } from "../types.ts";
import { isYangGan } from "../ganzhi.ts";
import { relationOf } from "../wuxing.ts";
import type { ShishenDef } from "./index.ts";

export const 七杀 = {
  name: "七杀",
  category: "官杀",
  relation: "克我",
  samePolarity: true,
  match(day: Gan, other: Gan): boolean {
    return relationOf(day, other) === "克我" && isYangGan(day) === isYangGan(other);
  },
} as ShishenDef;
