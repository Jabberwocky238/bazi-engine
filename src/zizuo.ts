/** 自坐: 日柱天干坐在日柱地支上的十二长生状态 (也可用于其它柱). */
import type { Gan, Zhi } from "./types.ts";
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
export function zizuoState(gan: Gan, zhi: Zhi): ChangSheng {
  const info = START[gan]!;
  const startIdx = ZHI.indexOf(info.zhi);
  const zhiIdx = ZHI.indexOf(zhi);
  let diff = zhiIdx - startIdx;
  if (!info.forward) diff = -diff;
  diff = ((diff % 12) + 12) % 12;
  return LIFE_STATES[diff] as ChangSheng;
}
