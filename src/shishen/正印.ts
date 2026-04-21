/** 正印 = 生我 + 异阴阳. */
import type { Gan } from "../types.ts";
import { isYangGan } from "../ganzhi.ts";
import { relationOf } from "../wuxing.ts";
import type { ShishenDef } from "./index.ts";

export const 正印 = {
  name: "正印",
  category: "印",
  relation: "生我",
  samePolarity: false,
  match(day: Gan, other: Gan): boolean {
    return relationOf(day, other) === "生我" && isYangGan(day) !== isYangGan(other);
  },
} as ShishenDef;
