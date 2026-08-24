/**
 * 天罗地网 (地支配对法). 辰↔巳 为地网对家; 戌↔亥 为天罗对家.
 * 以年支或日支为主 — 即对家必须出现在年或日柱才成立:
 *   年柱: 柱支 ∈ {辰,巳,戌,亥} 且 日支 = 对家 → 标.
 *   日柱: 柱支 ∈ {辰,巳,戌,亥} 且 年支 = 对家 → 标.
 *   月/时柱: 柱支 ∈ {辰,巳,戌,亥} 且 年支 或 日支 = 对家 → 标.
 */
import type { Zhi } from "@/types";
import { pillarAt, type ShenshaCheck } from "./common.ts";

const PARTNER: Partial<Record<Zhi, Zhi>> = {
  辰:"巳", 巳:"辰", 戌:"亥", 亥:"戌",
};

const check: ShenshaCheck = (pillars, i) => {
  const z = pillarAt(pillars, i).zhi;
  const partner = PARTNER[z];
  if (!partner) return false;
  if (i === 0) return pillars[2].zhi === partner;
  if (i === 2) return pillars[0].zhi === partner;
  return pillars[0].zhi === partner || pillars[2].zhi === partner;
};

export const 天罗地网 = { name: "天罗地网", check } as const;
