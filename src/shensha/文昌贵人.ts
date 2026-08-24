/** 文昌贵人 (年干 或 日干 → 地支). 阳干长生位之冲, 阴干长生位. */
import type { Gan, Zhi } from "@/types";
import { pillarAt, type ShenshaCheck } from "./common.ts";

const WEN_CHANG: Readonly<Record<Gan, Zhi>> = {
  甲:"巳", 乙:"午",
  丙:"申", 丁:"酉",
  戊:"申", 己:"酉",
  庚:"亥", 辛:"子",
  壬:"寅", 癸:"卯",
};

const check: ShenshaCheck = (pillars, i) => {
  const z = pillarAt(pillars, i).zhi;
  return z === WEN_CHANG[pillars[2].gan] || z === WEN_CHANG[pillars[0].gan];
};

export const 文昌贵人 = { name: "文昌贵人", check } as const;
