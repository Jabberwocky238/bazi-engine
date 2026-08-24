/** 禄神 (日干 → 地支). */
import type { Gan, Zhi } from "@/types";
import { pillarAt, type ShenshaCheck } from "./common.ts";

const LU: Readonly<Record<Gan, Zhi>> = {
  甲:"寅", 乙:"卯", 丙:"巳", 丁:"午", 戊:"巳",
  己:"午", 庚:"申", 辛:"酉", 壬:"亥", 癸:"子",
};

const check: ShenshaCheck = (pillars, i) => pillarAt(pillars, i).zhi === LU[pillars[2].gan];

export const 禄神 = { name: "禄神", check } as const;
