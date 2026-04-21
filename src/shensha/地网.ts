/** 地网: 年命纳音为水/土 + 日支辰/巳. 仅标日柱. */
import { nayinOf } from "../nayin.ts";
import { type ShenshaCheck } from "./common.ts";

const check: ShenshaCheck = (b, i) => {
  if (i !== 2) return false;
  const ny = nayinOf(b.year.gan, b.year.zhi);
  if (ny !== "水" && ny !== "土") return false;
  return b.day.zhi === "辰" || b.day.zhi === "巳";
};

export const 地网 = { name: "地网", check } as const;
