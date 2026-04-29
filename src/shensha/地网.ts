/** 地网: 年命纳音为水/土 + 日支辰/巳. 仅标日柱. */
import { nayinOf } from "../nayin.ts";
import { type ShenshaCheck } from "./common.ts";

const check: ShenshaCheck = (pillars, i) => {
  if (i !== 2) return false;
  const ny = nayinOf(pillars[0].gan, pillars[0].zhi);
  if (ny !== "水" && ny !== "土") return false;
  return pillars[2].zhi === "辰" || pillars[2].zhi === "巳";
};

export const 地网 = { name: "地网", check } as const;
