/**
 * 太极贵人 (年干 或 日干 → 地支集合).
 * 口诀: 甲乙生人子午中, 丙丁鸡兔(卯酉)定亨通; 戊己两干临四季(辰戌丑未),
 *       庚辛寅亥禄丰隆; 壬癸巳申偏喜美.
 */
import type { Gan, Zhi } from "../types.ts";
import { pillarAt, type ShenshaCheck } from "./common.ts";

const TAI_JI: Readonly<Record<Gan, readonly Zhi[]>> = {
  甲:["子","午"], 乙:["子","午"],
  丙:["卯","酉"], 丁:["卯","酉"],
  戊:["辰","戌","丑","未"], 己:["辰","戌","丑","未"],
  庚:["寅","亥"], 辛:["寅","亥"],
  壬:["巳","申"], 癸:["巳","申"],
};

const check: ShenshaCheck = (b, i) => {
  const z = pillarAt(b, i).zhi;
  return TAI_JI[b.day.gan].includes(z) || TAI_JI[b.year.gan].includes(z);
};

export const 太极贵人 = { name: "太极贵人", check } as const;
