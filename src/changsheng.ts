/** 自坐: 日柱天干坐在日柱地支上的十二长生状态 (也可用于其它柱). */
import type { Gan, Pillar, Zhi } from "./types.ts";
import { ZHI } from "./types.ts";

export const LIFE_STATES = [
  "长生","沐浴","冠带","临官","帝旺","衰","病","死","墓","绝","胎","养",
] as const;
export type ChangSheng = typeof LIFE_STATES[number];

/** 十干长生起点 (子平寄生十二宫; 阴干逆行). */
const START: Record<Gan, { zhi: Zhi; forward: boolean }> = {
  甲: { zhi: "亥", forward: true },
  乙: { zhi: "午", forward: false },
  丙: { zhi: "寅", forward: true },
  丁: { zhi: "酉", forward: false },
  戊: { zhi: "寅", forward: true },
  己: { zhi: "酉", forward: false },
  庚: { zhi: "巳", forward: true },
  辛: { zhi: "子", forward: false },
  壬: { zhi: "申", forward: true },
  癸: { zhi: "卯", forward: false },
};

/**
 * e.g. 甲 + 亥 => 长生; 壬 + 午 => 胎; 癸 + 未 => 墓.
 */
export function changshengState(gan: Gan, zhi: Zhi): ChangSheng {
  const info = START[gan]!;
  const startIdx = ZHI.indexOf(info.zhi);
  const zhiIdx = ZHI.indexOf(zhi);
  let diff = zhiIdx - startIdx;
  if (!info.forward) diff = -diff;
  diff = ((diff % 12) + 12) % 12;
  return LIFE_STATES[diff] as ChangSheng;
}


/** 月令 / 禄位 / 刃: 以月支和日干的十二长生状态推算目标地支. */
function zhiByChangsheng(dayGan: Gan, state: ChangSheng): Zhi {
  const zhi = ZHI.find(z => changshengState(dayGan, z) === state);
  if (!zhi) throw new Error(`unreachable: no ${state} zhi for ${dayGan}`);
  return zhi;
}

/** 十干禄位 = 十二长生「临官」位. */
export function luWeiOf(dayGan: Gan): Zhi { return zhiByChangsheng(dayGan, "临官"); }
/** 刃位 = 十二长生「帝旺」位. */
export function renWeiOf(dayGan: Gan): Zhi { return zhiByChangsheng(dayGan, "帝旺"); }

export type YuelingResult = {
  /** target 地支对日干的十二长生状态. */
  十二长生: ChangSheng;
  /** target 地支是否与月支处于同一十二长生位 (即同为月令). */
  月令: boolean;
  /** target 地支是否为日干禄位 (临官). */
  禄: boolean;
  /** target 地支是否为日干刃位 (帝旺). */
  刃: boolean;
};

export function isYueling(dayGan: Gan, monthZhi: Zhi, targetZhi: Zhi): boolean {
  return changshengState(dayGan, targetZhi) === changshengState(dayGan, monthZhi);
}

export function isLu(dayGan: Gan, targetZhi: Zhi): boolean {
  return changshengState(dayGan, targetZhi) === "临官";
}

export function isRen(dayGan: Gan, targetZhi: Zhi): boolean {
  return changshengState(dayGan, targetZhi) === "帝旺";
}

/**
 * 计算 target 柱地支相对月支 / 日干的位置.
 *   - month: 月柱 (取月支为月令).
 *   - day:   日主柱 (取日干查禄位 / 刃位).
 *   - target: 任意目标柱 — 主柱或大运 / 流年 / 流月等.
 */
export function computeYueling(day: Pillar, month: Pillar, target: Pillar): YuelingResult {
  const 十二长生 = changshengState(day.gan, target.zhi);
  return {
    十二长生,
    月令: 十二长生 === changshengState(day.gan, month.zhi),
    禄: 十二长生 === "临官",
    刃: 十二长生 === "帝旺",
  };
}
