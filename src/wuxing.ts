/** 五行生克体系 + 日主相对关系. */
import type { Gan, WuXing, Relation } from "./types.ts";
import { GAN_WUXING } from "./ganzhi.ts";

/** 五行相生: key 生 value */
export const GENERATES: Readonly<Record<WuXing, WuXing>> = {
  木:"火", 火:"土", 土:"金", 金:"水", 水:"木",
};
/** 五行相克: key 克 value */
export const CONTROLS: Readonly<Record<WuXing, WuXing>> = {
  木:"土", 土:"水", 水:"火", 火:"金", 金:"木",
};
/** 反查: value 生 key */
export const GENERATED_BY: Readonly<Record<WuXing, WuXing>> = {
  火:"木", 土:"火", 金:"土", 水:"金", 木:"水",
};
/** 反查: value 克 key */
export const CONTROLLED_BY: Readonly<Record<WuXing, WuXing>> = {
  土:"木", 水:"土", 火:"水", 金:"火", 木:"金",
};

/** 日主与某天干的五行关系 (不分阴阳). */
export function relationOf(day: Gan, other: Gan): Relation {
  const dx = GAN_WUXING[day], ox = GAN_WUXING[other];
  if (dx === ox) return "同类";
  if (GENERATES[dx] === ox) return "我生";
  if (CONTROLS[dx]  === ox) return "我克";
  if (CONTROLS[ox]  === dx) return "克我";
  if (GENERATES[ox] === dx) return "生我";
  throw new Error(`unreachable: ${day} vs ${other}`);
}

/** 日主对应的五行生克体系. */
export type WuXingRelations = {
  同类: WuXing;
  我生: WuXing;
  我克: WuXing;
  克我: WuXing;
  生我: WuXing;
};

export function wuxingRelations(day: Gan): WuXingRelations {
  const self = GAN_WUXING[day];
  return {
    同类: self,
    我生: GENERATES[self],
    我克: CONTROLS[self],
    克我: CONTROLLED_BY[self],
    生我: GENERATED_BY[self],
  };
}
