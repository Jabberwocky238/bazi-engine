/**
 * 截脚: 柱内地支克天干 (地支反噬天干, 天干失根).
 *   木柱: 甲/乙 + 申/酉        (金克木)
 *   火柱: 丙/丁 + 子/亥        (水克火)
 *   土柱: 戊/己 + 寅/卯        (木克土)
 *   金柱: 庚/辛 + 巳/午        (火克金)
 *   水柱: 壬/癸 + 辰/戌/丑/未  (土克水)
 *
 * 天干虚浮无根, 被自己坐下反克, 整柱尤其天干显象力量大损.
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
    if (CONTROLS[zw] !== gw) return;
    out.push({
      kind: "截脚",
      name: `${p.gan}${p.zhi}截脚`,
      positions: POS_NAMES[i]!,
      close: true,
      state: "截脚",
      note: `${p.zhi}(${zw}) 克 ${p.gan}(${gw}) — 天干虚浮无根, 被坐下反噬`,
      quality: "bad",
    });
  });
  return out;
}

export const 截脚 = { name: "截脚", detect } as const;
