/**
 * 童子煞 (月支季节 + 年纳音 → 日支 / 时支).
 * 真童子口诀:
 *   春秋寅子贵, 冬夏卯未辰;
 *   金木午卯合, 水火鸡犬(酉戌)多, 土命逢辰巳.
 * 仅落 日柱 / 时柱.
 */
import { seasonOf } from "../season.ts";
import { nayinOf } from "../nayin.ts";
import { pillarAt, type ShenshaCheck } from "./common.ts";

const check: ShenshaCheck = (b, i) => {
  if (i !== 2 && i !== 3) return false;
  const z = pillarAt(b, i).zhi;
  const season = seasonOf(b.month.zhi);
  if ((season === "春" || season === "秋") && (z === "寅" || z === "子")) return true;
  if ((season === "冬" || season === "夏") && (z === "卯" || z === "未" || z === "辰")) return true;
  const yWx = nayinOf(b.year.gan, b.year.zhi);
  if ((yWx === "金" || yWx === "木") && (z === "午" || z === "卯")) return true;
  if ((yWx === "水" || yWx === "火") && (z === "酉" || z === "戌")) return true;
  if (yWx === "土" && (z === "辰" || z === "巳")) return true;
  return false;
};

export const 童子煞 = { name: "童子煞", check } as const;
