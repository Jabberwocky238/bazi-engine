/** 桃花 (三合局; 年支或日支起, 不标源柱). */
import { triadOf, TRIAD_MAP } from "./common.ts";
import { pillarAt, type ShenshaCheck } from "./common.ts";

const NAME = "桃花";

const check: ShenshaCheck = (pillars, i) => {
  const z = pillarAt(pillars, i).zhi;
  const yTarget = TRIAD_MAP[triadOf(pillars[0].zhi)][NAME];
  if (yTarget && i !== 0 && z === yTarget) return true;
  const dTarget = TRIAD_MAP[triadOf(pillars[2].zhi)][NAME];
  if (dTarget && i !== 2 && z === dTarget) return true;
  return false;
};

export const 桃花 = { name: NAME, check } as const;
