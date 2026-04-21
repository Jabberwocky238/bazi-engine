/**
 * 地支暗合. md: 合/地支暗合.md
 *
 * 两支藏干暗中成五合者谓之暗合. 下表为 API 权威清单 (由抓回的 liuyi.json
 * 聚合去重所得, 覆盖五合的 5 种藏干组合):
 *
 *   子戌 · 癸戊合 (火)        子辰 · 癸戊合 (火)        子巳 · 癸戊合 (火)
 *   丑寅 · 甲己合 (土)        寅午 · 甲己合 (土)        寅未 · 甲己合 (土)
 *   卯申 · 乙庚合 (金)
 *   巳酉 · 丙辛合 (水)
 *   午亥 · 丁壬合 (木)
 *
 * API 全名 "巳酉暗合", state "暗合".
 */
import type { Pillar, Zhi } from "../../types.ts";
import { adjacent, collectZhis, posRange, type Finding } from "../common.ts";

/** [a, b, 藏干合对]. */
const AN_HE: Array<[Zhi, Zhi, string]> = [
  ["子", "戌", "癸戊合"],
  ["子", "辰", "癸戊合"],
  ["子", "巳", "癸戊合"],
  ["丑", "寅", "甲己合"],
  ["寅", "午", "甲己合"],
  ["寅", "未", "甲己合"],
  ["卯", "申", "乙庚合"],
  ["巳", "酉", "丙辛合"],
  ["午", "亥", "丁壬合"],
];

function detect(pillars: Pillar[]): Finding[] {
  const out: Finding[] = [];
  const zhis = collectZhis(pillars);
  for (const [a, b, note] of AN_HE) {
    const A = zhis.filter((z) => z.zhi === a);
    const B = zhis.filter((z) => z.zhi === b);
    for (const x of A) for (const y of B) {
      out.push({
        kind: "地支暗合",
        name: `${a}${b}暗合`,
        positions: posRange([x.pos, y.pos].sort((p, q) => p - q)),
        close: adjacent(x.pos, y.pos),
        state: "暗合",
        note: `藏干 ${note} · 暗中相合`,
        quality: "neutral",
      });
    }
  }
  return out;
}

export const 地支暗合 = { name: "地支暗合", detect } as const;
