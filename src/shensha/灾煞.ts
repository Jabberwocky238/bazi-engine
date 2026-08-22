/** 灾煞 (三合局; 仅以年支起, 不从日支). */
import { triadOf, TRIAD_MAP } from "./common.ts";
import { pillarAt, type ShenshaCheck } from "./common.ts";

const NAME = "灾煞";

const check: ShenshaCheck = (pillars, i) => {
  if (i === 0) return false;
  const z = pillarAt(pillars, i).zhi;
  const yTarget = TRIAD_MAP[triadOf(pillars[0].zhi)][NAME];
  return yTarget !== undefined && z === yTarget;
};

export const 灾煞 = { name: NAME, check } as const;
