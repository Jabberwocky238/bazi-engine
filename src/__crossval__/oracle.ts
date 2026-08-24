/** Pre-refactor implementation (recovered from 09a5a63^:src/wuxing.ts) — used ONLY as a test oracle. */
import type { WuXing, Relation } from "@/types.ts";

export const GENERATES: Readonly<Record<WuXing, WuXing>> = {
  木:"火", 火:"土", 土:"金", 金:"水", 水:"木",
};
export const CONTROLS: Readonly<Record<WuXing, WuXing>> = {
  木:"土", 土:"水", 水:"火", 火:"金", 金:"木",
};
export const GENERATED_BY: Readonly<Record<WuXing, WuXing>> = {
  火:"木", 土:"火", 金:"土", 水:"金", 木:"水",
};
export const CONTROLLED_BY: Readonly<Record<WuXing, WuXing>> = {
  土:"木", 水:"土", 火:"水", 金:"火", 木:"金",
};

/** verbatim from old wuxing.ts relationOf, lifted from Gan to WuXing */
export function oracleRelationOf(dx: WuXing, ox: WuXing): Relation {
  if (dx === ox) return "同类";
  if (GENERATES[dx] === ox) return "我生";
  if (CONTROLS[dx]  === ox) return "我克";
  if (CONTROLS[ox]  === dx) return "克我";
  if (GENERATES[ox] === dx) return "生我";
  throw new Error(`unreachable: ${dx} vs ${ox}`);
}

/** verbatim from old wuxing.ts wuxingRelations */
export function oracleRelations(self: WuXing): Record<Relation, WuXing> {
  return {
    同类: self,
    我生: GENERATES[self],
    我克: CONTROLS[self],
    克我: CONTROLLED_BY[self],
    生我: GENERATED_BY[self],
  };
}
