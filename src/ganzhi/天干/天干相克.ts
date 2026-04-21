/**
 * 天干相克. API 对 "同性相克" (甲戊/乙己/丙庚/丁辛/戊壬/己癸/庚甲/辛乙/壬丙/癸丁)
 * 与 md 意义上的 "天干相冲" (甲庚/乙辛/丙壬/丁癸) 统一标 "相克", 故此文件涵盖全部.
 * md: 克/天干相克.md + 冲/天干相冲.md
 *
 * 不要求紧贴 —— 隔位也论相克. 紧贴与否由 Finding.close 反映.
 */
import type { Pillar } from "../../types.ts";
import { adjacent, collectGans, posRange, type Finding } from "../common.ts";

/** 同性相克 10 对 (已涵盖 4 组冲). */
const KE_PAIRS: Array<[string, string]> = [
  ["甲", "戊"], ["乙", "己"],
  ["丙", "庚"], ["丁", "辛"],
  ["戊", "壬"], ["己", "癸"],
  ["庚", "甲"], ["辛", "乙"],
  ["壬", "丙"], ["癸", "丁"],
];

function detect(pillars: Pillar[]): Finding[] {
  const out: Finding[] = [];
  const gans = collectGans(pillars);
  const seen = new Set<string>();
  for (const [g1, g2] of KE_PAIRS) {
    const A = gans.filter((g) => g.gan === g1);
    const B = gans.filter((g) => g.gan === g2);
    for (const a of A) for (const b of B) {
      const key = [a.pos, b.pos].sort((x, y) => x - y).join("-") + `:${[g1, g2].sort().join("")}`;
      if (seen.has(key)) continue;
      seen.add(key);
      const close = adjacent(a.pos, b.pos);
      out.push({
        kind: "天干相克",
        name: `${g1}${g2}相克`,
        positions: posRange([a.pos, b.pos].sort((x, y) => x - y)),
        close,
        state: "相克",
        note: close ? "紧克, 作用直接" : "隔克, 作用渐进",
        quality: "bad",
      });
    }
  }
  return out;
}

export const 天干相克 = { name: "天干相克", detect } as const;
