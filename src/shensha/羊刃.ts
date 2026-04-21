/** 羊刃 (日干 → 地支): 阳干禄后一位, 阴干禄前一位. */
import type { Gan, Zhi } from "../types.ts";
import { pillarAt, type ShenshaCheck } from "./common.ts";

const YANG_REN: Readonly<Record<Gan, Zhi>> = {
  甲:"卯", 乙:"寅",
  丙:"午", 丁:"巳",
  戊:"午", 己:"巳",
  庚:"酉", 辛:"申",
  壬:"子", 癸:"亥",
};

const check: ShenshaCheck = (b, i) => pillarAt(b, i).zhi === YANG_REN[b.day.gan];

export const 羊刃 = { name: "羊刃", check } as const;
