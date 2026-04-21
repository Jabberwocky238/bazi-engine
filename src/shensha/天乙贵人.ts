/** 天乙贵人 (日干 或 年干 → 地支集合). */
import type { Gan, Zhi } from "../types.ts";
import { pillarAt, type ShenshaCheck } from "./common.ts";

const TIAN_YI: Readonly<Record<Gan, readonly Zhi[]>> = {
  甲:["丑","未"], 戊:["丑","未"], 庚:["丑","未"],
  乙:["子","申"], 己:["子","申"],
  丙:["亥","酉"], 丁:["亥","酉"],
  壬:["卯","巳"], 癸:["卯","巳"],
  辛:["午","寅"],
};

const check: ShenshaCheck = (b, i) => {
  const z = pillarAt(b, i).zhi;
  return TIAN_YI[b.day.gan].includes(z) || TIAN_YI[b.year.gan].includes(z);
};

export const 天乙贵人 = { name: "天乙贵人", check } as const;
