/** 正官 = 克我 + 异阴阳. */
import type { Gan } from "../types.ts";
import { isYangGan } from "../ganzhi.ts";
import { relationOf } from "../wuxing.ts";
import type { ShishenDef } from "./index.ts";

export const 正官 = {
  name: "正官",
  category: "官杀",
  relation: "克我",
  samePolarity: false,
  match(day: Gan, other: Gan): boolean {
    return relationOf(day, other) === "克我" && isYangGan(day) !== isYangGan(other);
  },
} as ShishenDef;
