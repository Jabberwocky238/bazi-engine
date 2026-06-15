/** 月令 / 禄位 / 刃: 以月支和日干的十二长生状态推算目标地支. */
import type { Gan, Pillar, Zhi } from "./types.ts";
import { ZHI } from "./types.ts";
import { changshengState, type ChangSheng } from "./changsheng.ts";

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
  禄位: boolean;
  /** target 地支是否为日干刃位 (帝旺). */
  刃: boolean;
};

export function isYueling(dayGan: Gan, monthZhi: Zhi, targetZhi: Zhi): boolean {
  return changshengState(dayGan, targetZhi) === changshengState(dayGan, monthZhi);
}

export function isLuWei(dayGan: Gan, targetZhi: Zhi): boolean {
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
    禄位: 十二长生 === "临官",
    刃: 十二长生 === "帝旺",
  };
}
