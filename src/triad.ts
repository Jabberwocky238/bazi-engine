/** 三合局 + 三合神煞对照表. */
import type { Zhi, TriadKey } from "./types.ts";

export function triadOf(z: Zhi): TriadKey {
  if ("申子辰".includes(z)) return "申子辰";
  if ("寅午戌".includes(z)) return "寅午戌";
  if ("亥卯未".includes(z)) return "亥卯未";
  return "巳酉丑";
}

export const TRIAD_MAP: Readonly<Record<TriadKey, Readonly<Record<string, Zhi>>>> = {
  "申子辰": { 桃花:"酉", 将星:"子", 华盖:"辰", 驿马:"寅", 劫煞:"巳", 灾煞:"午", 亡神:"亥" },
  "寅午戌": { 桃花:"卯", 将星:"午", 华盖:"戌", 驿马:"申", 劫煞:"亥", 灾煞:"子", 亡神:"巳" },
  "亥卯未": { 桃花:"子", 将星:"卯", 华盖:"未", 驿马:"巳", 劫煞:"申", 灾煞:"酉", 亡神:"寅" },
  "巳酉丑": { 桃花:"午", 将星:"酉", 华盖:"丑", 驿马:"亥", 劫煞:"寅", 灾煞:"卯", 亡神:"申" },
};

export const TRIAD_NAMES = ["桃花","将星","华盖","驿马","劫煞","灾煞","亡神"] as const;
/** 只从年支起局 (不用日支). */
export const TRIAD_YEAR_ONLY: ReadonlySet<string> = new Set(["灾煞"]);
