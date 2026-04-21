/**
 * 神煞判定共享类型与极小工具. 不放任何查表 const —
 * 每个神煞自己的数据在各自的文件里.
 */
import type { BaziInput, GanZhi, Pillar, Zhi } from "../types.ts";
import { ZHI } from "../types.ts";

export type PillarIndex = 0 | 1 | 2 | 3;
export type ShenshaCheck = (b: BaziInput, i: PillarIndex) => boolean;

export type ShenshaDef = {
  readonly name: string;
  readonly check: ShenshaCheck;
};

export const PILLAR_KEYS = ["year", "month", "day", "hour"] as const;
export const pillarAt = (b: BaziInput, i: PillarIndex): Pillar => b[PILLAR_KEYS[i]];
export const gzOf = (p: Pillar): GanZhi => `${p.gan}${p.zhi}` as GanZhi;

/** 以 base 为起点沿 ZHI 顺行 `off` 位. */
export function zhiOffset(base: Zhi, off: number): Zhi {
  const idx = (ZHI.indexOf(base) + off + 12) % 12;
  return ZHI[idx] as Zhi;
}
