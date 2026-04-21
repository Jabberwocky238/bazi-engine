/** 纳音五行 (委托 lunar-typescript). */
import type { Gan, Zhi, NayinWuxing } from "./types.ts";
import { LunarUtil } from "lunar-typescript";

export function nayinOf(gan: Gan, zhi: Zhi): NayinWuxing {
  const name = LunarUtil.NAYIN[`${gan}${zhi}`];
  if (!name) throw new Error(`invalid ganzhi ${gan}${zhi}`);
  const wx = name.charAt(name.length - 1);
  if (wx !== "金" && wx !== "木" && wx !== "水" && wx !== "火" && wx !== "土") {
    throw new Error(`unexpected nayin ${name}`);
  }
  return wx;
}
