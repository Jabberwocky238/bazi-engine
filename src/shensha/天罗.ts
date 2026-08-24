/** 天罗: 年命纳音为火 + 日支戌/亥. 仅标日柱. */
import { nayinOf, type ShenshaCheck } from "./common.ts";

const check: ShenshaCheck = (pillars, i) => {
  if (i !== 2) return false;
  if (nayinOf(pillars[0].gan, pillars[0].zhi) !== "火") return false;
  return pillars[2].zhi === "戌" || pillars[2].zhi === "亥";
};

export const 天罗 = { name: "天罗", check } as const;
