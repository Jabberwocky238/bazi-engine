/**
 * 地支相冲. md: 冲/地支相冲总论.md + 冲/子午冲.md
 *   子午 / 卯酉 / 寅申 / 巳亥 / 辰戌 / 丑未
 *
 * API 全名 "子午相冲", state "相冲".
 */
import type { Pillar } from "../../types.ts";
import { adjacent, collectZhis, posRange, type Finding } from "../common.ts";

const ZHI_CHONG: Array<[string, string]> = [
  ["子", "午"], ["卯", "酉"], ["寅", "申"], ["巳", "亥"], ["辰", "戌"], ["丑", "未"],
];

function subNote(z1: string, z2: string): string {
  const pair = z1 + z2, rev = z2 + z1;
  if (pair === "子午" || rev === "子午") return "水火对冲, 心肾不交";
  if (pair === "卯酉" || rev === "卯酉") return "阴木阴金, 肝肺神经";
  if (["寅申", "巳亥"].includes(pair) || ["寅申", "巳亥"].includes(rev))
    return "驿马冲, 变动 · 居住与职业俱变";
  if (["辰戌", "丑未"].includes(pair) || ["辰戌", "丑未"].includes(rev))
    return "墓库冲 —— 冲开墓库, 藏干暗动";
  return "";
}

function detect(pillars: Pillar[]): Finding[] {
  const out: Finding[] = [];
  const zhis = collectZhis(pillars);
  for (const [z1, z2] of ZHI_CHONG) {
    const A = zhis.filter((z) => z.zhi === z1);
    const B = zhis.filter((z) => z.zhi === z2);
    for (const a of A) for (const b of B) {
      const close = adjacent(a.pos, b.pos);
      const sub = subNote(z1, z2);
      out.push({
        kind: "地支相冲",
        name: `${z1}${z2}相冲`,
        positions: posRange([a.pos, b.pos].sort((x, y) => x - y)),
        close,
        state: "相冲",
        note: `${sub}${sub ? " · " : ""}${close ? "紧贴力大" : "隔位力弱"}; 冲忌为吉, 冲用为凶`,
        quality: "bad",
      });
    }
  }
  return out;
}

export const 地支相冲 = { name: "地支相冲", detect } as const;
