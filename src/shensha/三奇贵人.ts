/**
 * 三奇贵人: 年-月-日 或 月-日-时 三干按顺序匹配三奇之一.
 *   天上三奇 甲戊庚, 地下三奇 乙丙丁, 人中三奇 壬癸辛.
 * 仅标日柱.
 */
import type { Gan } from "../types.ts";
import { type ShenshaCheck } from "./common.ts";

const SAN_QI_TRIPLES: readonly (readonly [Gan, Gan, Gan])[] = [
  ["甲","戊","庚"],
  ["乙","丙","丁"],
  ["壬","癸","辛"],
] as const;

const check: ShenshaCheck = (pillars, i) => {
  if (i !== 2) return false;
  const windows: (readonly [Gan, Gan, Gan])[] = [
    [pillars[0].gan, pillars[1].gan, pillars[2].gan], // 年-月-日
  ];
  if (pillars[3]) {
    windows.push([pillars[1].gan, pillars[2].gan, pillars[3].gan]); // 月-日-时
  }
  return SAN_QI_TRIPLES.some(t =>
    windows.some(w => w[0] === t[0] && w[1] === t[1] && w[2] === t[2]));
};

export const 三奇贵人 = { name: "三奇贵人", check } as const;
