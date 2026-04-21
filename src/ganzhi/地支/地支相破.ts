/**
 * 地支相破. md: 克/地支相破相绝.md
 *   子酉 / 卯午 (四帝旺之破)
 *   寅亥 / 巳申 (四长生之破)  — 与六合同支, 合中兼破
 *   辰丑 / 未戌 (四墓库之破)
 *
 * API 全名 "辰丑相破", state "相破". 力量较弱.
 */
import type { Pillar } from "../../types.ts";
import { adjacent, collectZhis, posRange, type Finding } from "../common.ts";

const LIUPO: Array<[string, string, string]> = [
  ["子", "酉", "四帝旺之破"],
  ["卯", "午", "四帝旺之破"],
  ["寅", "亥", "四长生之破"],
  ["巳", "申", "四长生之破"],
  ["辰", "丑", "四墓库之破"],
  ["未", "戌", "四墓库之破"],
];

function detect(pillars: Pillar[]): Finding[] {
  const out: Finding[] = [];
  const zhis = collectZhis(pillars);
  for (const [a, b, title] of LIUPO) {
    const A = zhis.filter((z) => z.zhi === a);
    const B = zhis.filter((z) => z.zhi === b);
    for (const x of A) for (const y of B) {
      out.push({
        kind: "地支相破",
        name: `${a}${b}相破`,
        positions: posRange([x.pos, y.pos].sort((p, q) => p - q)),
        close: adjacent(x.pos, y.pos),
        state: "相破",
        note: `${title} · 力量较弱, 仅作参考`,
        quality: "bad",
      });
    }
  }
  return out;
}

export const 地支相破 = { name: "地支相破", detect } as const;
