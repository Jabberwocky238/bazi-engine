/** 天干 / 地支 五行属性 与 地支藏干. */
import type { Gan, Zhi, WuXing } from "./types.ts";
import { GAN } from "./types.ts";

export const GAN_WUXING: Record<Gan, WuXing> = {
  甲:"木", 乙:"木",
  丙:"火", 丁:"火",
  戊:"土", 己:"土",
  庚:"金", 辛:"金",
  壬:"水", 癸:"水",
};

export const ZHI_WUXING: Record<Zhi, WuXing> = {
  子:"水", 亥:"水",
  寅:"木", 卯:"木",
  巳:"火", 午:"火",
  申:"金", 酉:"金",
  辰:"土", 戌:"土",
  丑:"土", 未:"土",
};

/** 地支藏干 (dataset convention). */
export const CANG_GAN: Readonly<Record<Zhi, readonly Gan[]>> = {
  子:["癸"],
  丑:["己","癸","辛"],
  寅:["甲","丙","戊"],
  卯:["乙"],
  辰:["戊","乙","癸"],
  巳:["丙","庚","戊"],
  午:["丁","己"],
  未:["己","丁","乙"],
  申:["庚","壬","戊"],
  酉:["辛"],
  戌:["戊","辛","丁"],
  亥:["壬","甲"],
};

/** 阳干: 甲丙戊庚壬 (GAN 索引偶数). */
export function isYangGan(g: Gan): boolean {
  return GAN.indexOf(g) % 2 === 0;
}

export function ganWuxing(g: Gan): WuXing { return GAN_WUXING[g]; }
export function zhiWuxing(z: Zhi): WuXing { return ZHI_WUXING[z]; }
