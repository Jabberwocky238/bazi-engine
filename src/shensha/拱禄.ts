/** 拱禄: 日柱 + 时柱 固定五组 (《三命通会·拱禄拱贵》). 仅标日柱. */
import type { GanZhi } from "../types.ts";
import { gzOf, type ShenshaCheck } from "./common.ts";

const GONG_LU_DAY_HOUR: readonly (readonly [GanZhi, GanZhi])[] = [
  ["癸亥","癸丑"], ["癸丑","癸亥"],          // 拱子
  ["丁巳","丁未"], ["己未","己巳"],          // 拱午
  ["戊辰","戊午"],                            // 拱巳
] as const;

const check: ShenshaCheck = (b, i) => {
  if (i !== 2) return false;
  const dayGz = gzOf(b.day);
  const hourGz = gzOf(b.hour);
  return GONG_LU_DAY_HOUR.some(([d, h]) => d === dayGz && h === hourGz);
};

export const 拱禄 = { name: "拱禄", check } as const;
