/**
 * 地支六合. md: 合/地支六合.md
 *   子丑 合化土 (泥合)
 *   寅亥 合化木 (破合)
 *   卯戌 合化火 (淫合)
 *   辰酉 合化金 (荣合)
 *   巳申 合化水 (贤合)
 *   午未 合化火土 (和合)
 *
 * API 表述: 全名 "子丑合化土", state 形如 "合化土" (六合皆按合化描述).
 * 化气硬条件 (紧贴 + 天干透化气) 由 Finding.transformed 反映.
 */
import type { Pillar, WuXing } from "../../types.ts";
import {
  adjacent, collectZhis, isGanTou, posRange,
  type Finding,
} from "../common.ts";

const LIUHE: Array<[string, string, string, string]> = [
  ["子", "丑", "土",   "泥合"],
  ["寅", "亥", "木",   "破合"],
  ["卯", "戌", "火",   "淫合"],
  ["辰", "酉", "金",   "荣合"],
  ["巳", "申", "水",   "贤合"],
  ["午", "未", "火土", "和合"],
];

const WUXING_CHARS: readonly WuXing[] = ["木", "火", "土", "金", "水"];

function detect(pillars: Pillar[]): Finding[] {
  const out: Finding[] = [];
  const zhis = collectZhis(pillars);
  for (const [z1, z2, hua, alias] of LIUHE) {
    const A = zhis.filter((z) => z.zhi === z1);
    const B = zhis.filter((z) => z.zhi === z2);
    for (const a of A) for (const b of B) {
      const close = adjacent(a.pos, b.pos);
      const targetWx = [...hua].filter((c): c is WuXing => (WUXING_CHARS as readonly string[]).includes(c));
      const canHua = close && targetWx.some((w) => isGanTou(pillars, w));
      out.push({
        kind: "地支六合",
        name: `${z1}${z2}合化${hua}`,
        positions: posRange([a.pos, b.pos].sort((x, y) => x - y)),
        close,
        transformed: canHua,
        state: `合化${hua}`,
        note: `${alias} · ${canHua ? "天干透化气, 真合化" : close ? "紧贴合绊, 天干无引化" : "隔位虚合"}`,
        quality: "neutral",
      });
    }
  }
  return out;
}

export const 地支六合 = { name: "地支六合", detect } as const;
