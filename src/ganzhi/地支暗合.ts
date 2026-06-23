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
import type { Gan, Pillar, WuXing, Zhi } from "../types.ts";
import {
  adjacent, collectZhis, posRange, impactorsByZhi,
  type ExtraPillar, type FindingMod,
} from "./common.ts";

// ———————————————————————————————————————————————
// 结构化类型 — detect 返回 AnHeFinding[]
// ———————————————————————————————————————————————
// 暗合为单一子类别 (state 恒 "暗合"), 有 close 判别 (紧贴暗合 vs 隔位).
// 判别信息: 两支 / 藏干合对 (哪两藏干成五合) / 藏干合化的五行.
// 旧版把藏干合对 ("癸戊合") 压进 note 字符串.

/** 藏干五合对 (两藏干). */
export type CangHePair = `${Gan}${Gan}合`;

export interface AnHeFinding {
  kind: "地支暗合";
  name: string;                 // "巳酉暗合"
  positions: string;            // "年月"
  slots: readonly [number, number];
  state: "暗合";
  /** 紧贴 = 两支相邻. */
  close: boolean;
  /** 暗合两支. */
  zhis: readonly [Zhi, Zhi];
  /** 藏干合对, 形如 "癸戊合". */
  cangHe: CangHePair;
  /** 藏干合化的五行 (癸戊火/甲己土/乙庚金/丙辛水/丁壬木). */
  hua: WuXing;
  impacted?: FindingMod[];      // extras 六冲击破
}

/** [a, b, 藏干合对, 化气]. */
const AN_HE: Array<[Zhi, Zhi, CangHePair, WuXing]> = [
  ["子", "戌", "癸戊合", "火"],
  ["子", "辰", "癸戊合", "火"],
  ["子", "巳", "癸戊合", "火"],
  ["丑", "寅", "甲己合", "土"],
  ["寅", "午", "甲己合", "土"],
  ["寅", "未", "甲己合", "土"],
  ["卯", "申", "乙庚合", "金"],
  ["巳", "酉", "丙辛合", "水"],
  ["午", "亥", "丁壬合", "木"],
];

function detect(pillars: Pillar[], extras: ExtraPillar[] = []): AnHeFinding[] {
  const out: AnHeFinding[] = [];
  const zhis = collectZhis(pillars);
  for (const [a, b, cangHe, hua] of AN_HE) {
    const A = zhis.filter((z) => z.zhi === a);
    const B = zhis.filter((z) => z.zhi === b);
    for (const x of A) for (const y of B) {
      const pos = [x.pos, y.pos].sort((p, q) => p - q) as [number, number];
      const f: AnHeFinding = {
        kind: "地支暗合",
        name: `${a}${b}暗合`,
        positions: posRange(pos),
        slots: pos,
        state: "暗合",
        close: adjacent(x.pos, y.pos),
        zhis: [a, b],
        cangHe,
        hua,
      };
      const imp = impactorsByZhi([a, b], extras);
      if (imp.length) f.impacted = imp;
      out.push(f);
    }
  }
  return out;
}

export const 地支暗合 = { name: "地支暗合", detect } as const;
