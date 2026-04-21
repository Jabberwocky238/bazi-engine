/**
 * 盖头: 柱内天干克地支 (天干盖压地支).
 *   木柱: 甲/乙 + 辰/戌/丑/未  (木克土)
 *   火柱: 丙/丁 + 申/酉        (火克金)
 *   土柱: 戊/己 + 子/亥        (土克水)
 *   金柱: 庚/辛 + 寅/卯        (金克木)
 *   水柱: 壬/癸 + 巳/午        (水克火)
 *
 * 天干受地支反制能力削弱, 地支根基被压制, 整柱力量打折.
 * 一柱内紧贴作用 —— close 恒为 true.
 */
import type { Pillar } from "../../types.ts";
import { ganWuxing, zhiWuxing } from "../../ganzhi.ts";
import { CONTROLS } from "../../wuxing.ts";
import { POS_NAMES, type Finding } from "../common.ts";

function detect(pillars: Pillar[]): Finding[] {
  const out: Finding[] = [];
  pillars.forEach((p, i) => {
    const gw = ganWuxing(p.gan);
    const zw = zhiWuxing(p.zhi);
    if (CONTROLS[gw] !== zw) return;
    out.push({
      kind: "盖头",
      name: `${p.gan}${p.zhi}盖头`,
      positions: POS_NAMES[i]!,
      close: true,
      state: "盖头",
      note: `${p.gan}(${gw}) 克 ${p.zhi}(${zw}) — 地支根基被压, 整柱力量打折`,
      quality: "bad",
    });
  });
  return out;
}

export const 盖头 = { name: "盖头", detect } as const;
