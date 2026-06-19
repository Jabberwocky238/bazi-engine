/** 纳音五行 (委托 lunar-typescript). */
import type { Gan, Zhi, NayinWuxing } from "./types.ts";
import { LunarUtil } from "lunar-typescript";

/** 取干支对应的完整纳音名 (如 甲子 => "海中金"). */
export function nayinNameOf(gan: Gan, zhi: Zhi): string {
  const name = LunarUtil.NAYIN[`${gan}${zhi}`];
  if (!name) throw new Error(`invalid ganzhi ${gan}${zhi}`);
  return name;
}

export function nayinOf(gan: Gan, zhi: Zhi): NayinWuxing {
  const name = nayinNameOf(gan, zhi);
  const wx = name.charAt(name.length - 1);
  if (wx !== "金" && wx !== "木" && wx !== "水" && wx !== "火" && wx !== "土") {
    throw new Error(`unexpected nayin ${name}`);
  }
  return wx;
}
