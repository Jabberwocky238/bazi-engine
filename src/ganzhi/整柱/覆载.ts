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
import type { Pillar, WuXing } from "../../types.ts";
import { ganWuxing, zhiWuxing } from "../../ganzhi.ts";
import { GENERATES } from "../../wuxing.ts";
import { POS_NAMES, type Finding } from "../common.ts";

type FuZaiState = "同气" | "得覆" | "得载";

function classify(gw: WuXing, zw: WuXing): FuZaiState | null {
  if (gw === zw) return "同气";
  if (GENERATES[gw] === zw) return "得覆";
  if (GENERATES[zw] === gw) return "得载";
  return null;
}

function detect(pillars: Pillar[]): Finding[] {
  const out: Finding[] = [];
  pillars.forEach((p, i) => {
    const gw = ganWuxing(p.gan);
    const zw = zhiWuxing(p.zhi);
    const st = classify(gw, zw);
    if (!st) return;
    const note =
      st === "同气"
        ? `天地同气 (${gw}) — 力量集中, 整柱最稳`
        : st === "得覆"
          ? `${p.gan}(${gw}) 生 ${p.zhi}(${zw}) — 天覆地, 天干气泄于支`
          : `${p.zhi}(${zw}) 生 ${p.gan}(${gw}) — 地载天, 天干坐印有根`;
    out.push({
      kind: "覆载",
      name: `${p.gan}${p.zhi}${st}`,
      positions: POS_NAMES[i]!,
      close: true,
      state: st,
      note,
      quality: "good",
    });
  });
  return out;
}

export const 覆载 = { name: "覆载", detect } as const;
