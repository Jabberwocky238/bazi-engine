/** 偏印 = 生我 + 同阴阳. */
import type { Gan } from "../types.ts";
import { isYangGan } from "../ganzhi.ts";
import { relationOf } from "../wuxing.ts";
import type { ShishenDef } from "./index.ts";

export const 偏印 = {
  name: "偏印",
  category: "印",
  relation: "生我",
  samePolarity: true,
  match(day: Gan, other: Gan): boolean {
    return relationOf(day, other) === "生我" && isYangGan(day) === isYangGan(other);
  },
} as ShishenDef;
