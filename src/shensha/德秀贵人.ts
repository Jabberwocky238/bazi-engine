/** 德秀贵人 (月支三合 → 干集合, 数据拟合). */
import type { Gan, TriadKey } from "../types.ts";
import { triadOf } from "../triad.ts";
import { pillarAt, type ShenshaCheck } from "./common.ts";

const DE_XIU: Readonly<Record<TriadKey, readonly Gan[]>> = {
  "寅午戌": ["丙","丁","戊","癸"],
  "申子辰": ["甲","丙","戊","己","辛","壬","癸"],
  "亥卯未": ["甲","乙","丁","壬"],
  "巳酉丑": ["乙","庚","辛"],
};

const check: ShenshaCheck = (b, i) =>
  DE_XIU[triadOf(b.month.zhi)].includes(pillarAt(b, i).gan);

export const 德秀贵人 = { name: "德秀贵人", check } as const;
