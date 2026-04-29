/**
 * 金神 (固定干支: 乙丑 / 己巳 / 癸酉).
 *   日柱为此三日之一 → 日柱金神.
 *   时柱为此三日之一 且 日干 ∈ {甲,己} → 时柱金神.
 */
import type { GanZhi } from "../types.ts";
import { gzOf, type ShenshaCheck } from "./common.ts";

const JIN_SHEN_GANZHI: readonly GanZhi[] = ["乙丑","己巳","癸酉"] as const;

const check: ShenshaCheck = (pillars, i) => {
  if (i === 2) return JIN_SHEN_GANZHI.includes(gzOf(pillars[2]));
  if (i === 3) {
    const hour = pillars[3];
    if (!hour) return false;
    return JIN_SHEN_GANZHI.includes(gzOf(hour)) && (pillars[2].gan === "甲" || pillars[2].gan === "己");
  }
  return false;
};

export const 金神 = { name: "金神", check } as const;
