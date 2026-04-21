/**
 * 天厨贵人 (年干 或 日干 → 地支). 即 食神之禄:
 * 甲食神丙→丙禄巳; 丙食神戊→戊禄巳; 戊食神庚→庚禄申; ...
 */
import type { Gan, Zhi } from "../types.ts";
import { pillarAt, type ShenshaCheck } from "./common.ts";

const TIAN_CHU: Readonly<Record<Gan, Zhi>> = {
  甲:"巳", 乙:"午",
  丙:"巳", 丁:"午",
  戊:"申", 己:"酉",
  庚:"亥", 辛:"子",
  壬:"寅", 癸:"卯",
};

const check: ShenshaCheck = (b, i) => {
  const z = pillarAt(b, i).zhi;
  return z === TIAN_CHU[b.day.gan] || z === TIAN_CHU[b.year.gan];
};

export const 天厨贵人 = { name: "天厨贵人", check } as const;
