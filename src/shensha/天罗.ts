/** 天罗: 年命纳音为火 + 日支戌/亥. 仅标日柱. */
import { nayinOf } from "../nayin.ts";
import { type ShenshaCheck } from "./common.ts";

const check: ShenshaCheck = (b, i) => {
  if (i !== 2) return false;
  if (nayinOf(b.year.gan, b.year.zhi) !== "火") return false;
  return b.day.zhi === "戌" || b.day.zhi === "亥";
};

export const 天罗 = { name: "天罗", check } as const;
