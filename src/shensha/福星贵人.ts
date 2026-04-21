/**
 * 福星贵人 (年干 或 日干 → 地支集合).
 * 《三命通会·论福星贵人》: 甲丙相邀入虎乡, 更游鼠穴最高强;
 *   戊猴己未丁宜亥, 乙癸逢牛卯禄昌;
 *   庚趋马首辛到巳, 壬骑龙背喜非常.
 */
import type { Gan, Zhi } from "../types.ts";
import { pillarAt, type ShenshaCheck } from "./common.ts";

const FU_XING: Readonly<Record<Gan, readonly Zhi[]>> = {
  甲:["寅","子"],
  乙:["丑","卯"],
  丙:["寅","子"],
  丁:["亥"],
  戊:["申"],
  己:["未"],
  庚:["午"],
  辛:["巳"],
  壬:["辰"],
  癸:["丑","卯"],
};

const check: ShenshaCheck = (b, i) => {
  const z = pillarAt(b, i).zhi;
  return FU_XING[b.day.gan].includes(z) || FU_XING[b.year.gan].includes(z);
};

export const 福星贵人 = { name: "福星贵人", check } as const;
