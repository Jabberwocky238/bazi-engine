/** 飞刃 = 羊刃冲支 (日干 → 地支). */
import type { Gan, Zhi } from "../types.ts";
import { pillarAt, type ShenshaCheck } from "./common.ts";

const FEI_REN: Readonly<Record<Gan, Zhi>> = {
  甲:"酉", 乙:"申",
  丙:"子", 丁:"亥",
  戊:"子", 己:"亥",
  庚:"卯", 辛:"寅",
  壬:"午", 癸:"巳",
};

const check: ShenshaCheck = (pillars, i) => pillarAt(pillars, i).zhi === FEI_REN[pillars[2].gan];

export const 飞刃 = { name: "飞刃", check } as const;
