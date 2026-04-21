/** 亡神 (三合局; 年支或日支起). */
import { triadOf, TRIAD_MAP } from "../triad.ts";
import { pillarAt, type ShenshaCheck } from "./common.ts";

const NAME = "亡神";

const check: ShenshaCheck = (b, i) => {
  const z = pillarAt(b, i).zhi;
  const yTarget = TRIAD_MAP[triadOf(b.year.zhi)][NAME];
  if (yTarget && i !== 0 && z === yTarget) return true;
  const dTarget = TRIAD_MAP[triadOf(b.day.zhi)][NAME];
  if (dTarget && i !== 2 && z === dTarget) return true;
  return false;
};

export const 亡神 = { name: NAME, check } as const;
