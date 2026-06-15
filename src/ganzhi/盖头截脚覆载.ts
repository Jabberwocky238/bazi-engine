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
/**
 * 覆载: 柱内天干与地支为相生 / 同气关系, 天干有根、地支被覆, 整柱力量集中.
 *   三种子态:
 *     - 同气: 干支五行相同           (甲寅 / 乙卯 / 丙午 / 丁巳 ...)
 *     - 得覆: 天干生地支 (天覆地)    (甲午 — 木生火, 地支受生)
 *     - 得载: 地支生天干 (地载天)    (甲子 — 水生木, 天干有根)
 *
 * 同气最稳、得载次之 (天干坐印)、得覆偏泄 (天干气泄). 皆归同一 kind,
 * 通过 state 区分. 一柱内紧贴作用 —— close 恒为 true.
 */
import type { Pillar, WuXing } from "../types.ts";
import { CONTROLS, GENERATES } from "../wuxing.ts";
import {
  POS_NAMES, ganWuxing, zhiWuxing,
  type WholePillarFinding,
} from "./common.ts";

type FuZaiState = "同气" | "得覆" | "得载";

function classify(gw: WuXing, zw: WuXing): FuZaiState | null {
  if (gw === zw) return "同气";
  if (GENERATES[gw] === zw) return "得覆";
  if (GENERATES[zw] === gw) return "得载";
  return null;
}

function detect(pillar: Pillar): WholePillarFinding | undefined {
  const gw = ganWuxing(pillar.gan);
  const zw = zhiWuxing(pillar.zhi);
  const st = classify(gw, zw);
  if (st) {
    const note =
      st === "同气"
        ? `天地同气 (${gw}) — 力量集中, 整柱最稳`
        : st === "得覆"
          ? `${pillar.gan}(${gw}) 生 ${pillar.zhi}(${zw}) — 天覆地, 天干气泄于支`
          : `${pillar.zhi}(${zw}) 生 ${pillar.gan}(${gw}) — 地载天, 天干坐印有根`;
    return {
      kind: "覆载",
      name: `${pillar.gan}${pillar.zhi}${st}`,
      note,
    }
  }
  else if (CONTROLS[gw] !== zw) {
    return {
      kind: "截脚",
      name: `${pillar.gan}${pillar.zhi}截脚`,
      note: `${pillar.zhi}(${zw}) 克 ${pillar.gan}(${gw}) — 天干虚浮无根, 被坐下反噬`,
    }
  }
  else if (CONTROLS[zw] !== gw) {
    return {
      kind: "盖头",
      name: `${pillar.gan}${pillar.zhi}盖头`,
      note: `${pillar.gan}(${gw}) 克 ${pillar.zhi}(${zw}) — 地支根基被压, 整柱力量打折`,
    };
  } else {
    return undefined;
  }
}

export {
  detect
}