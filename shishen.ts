/**
 * 八字 -> 十神 / 五行生克. Pure library — no IO.
 */
import {
  type Gan, type Pillar, type BaziInput,
  WU_XING, isYangGan, CANG_GAN,
} from "./consts.ts";

export type WuXing = "木" | "火" | "土" | "金" | "水";
export type Relation = "同类" | "我生" | "我克" | "克我" | "生我";

/** 五行相生: key 生 value */
const GENERATES: Readonly<Record<WuXing, WuXing>> = {
  木:"火", 火:"土", 土:"金", 金:"水", 水:"木",
};
/** 五行相克: key 克 value */
const CONTROLS: Readonly<Record<WuXing, WuXing>> = {
  木:"土", 土:"水", 水:"火", 火:"金", 金:"木",
};
/** 反查: value 生 key */
const GENERATED_BY: Readonly<Record<WuXing, WuXing>> = {
  火:"木", 土:"火", 金:"土", 水:"金", 木:"水",
};
/** 反查: value 克 key */
const CONTROLLED_BY: Readonly<Record<WuXing, WuXing>> = {
  土:"木", 水:"土", 火:"水", 金:"火", 木:"金",
};

/** 日主的五行生克体系: 每种关系对应的五行. */
export type WuXingRelations = {
  同类: WuXing;
  我生: WuXing;
  我克: WuXing;
  克我: WuXing;
  生我: WuXing;
};

/** 日主与某天干的五行关系 (不分阴阳). */
export function relationOf(day: Gan, other: Gan): Relation {
  const dx = WU_XING[day], ox = WU_XING[other];
  if (dx === ox) return "同类";
  if (GENERATES[dx] === ox) return "我生";
  if (CONTROLS[dx]  === ox) return "我克";
  if (CONTROLS[ox]  === dx) return "克我";
  if (GENERATES[ox] === dx) return "生我";
  throw new Error(`unreachable: ${day} vs ${other}`);
}

/** 日主对应的五行生克体系. */
export function wuxingRelations(day: Gan): WuXingRelations {
  const self = WU_XING[day];
  return {
    同类: self,
    我生: GENERATES[self],
    我克: CONTROLS[self],
    克我: CONTROLLED_BY[self],
    生我: GENERATED_BY[self],
  };
}

/**
 * Ten-god name for `other` relative to `day`.
 *  我生: 同阴阳=食神 异=伤官
 *  我克: 同=偏财 异=正财
 *  克我: 同=七杀 异=正官
 *  生我: 同=偏印 异=正印
 *  同类: 同=比肩 异=劫财
 */
export function shishenOf(day: Gan, other: Gan): string {
  const rel = relationOf(day, other);
  const same = isYangGan(day) === isYangGan(other);
  switch (rel) {
    case "同类": return same ? "比肩" : "劫财";
    case "我生": return same ? "食神" : "伤官";
    case "我克": return same ? "偏财" : "正财";
    case "克我": return same ? "七杀" : "正官";
    case "生我": return same ? "偏印" : "正印";
  }
}

export type ShishenResult = {
  /** 每柱天干十神 (日柱为 "日主") */
  十神: string[];
  /** 每柱地支藏干 */
  藏干: string[][];
  /** 每柱藏干对应十神 */
  藏干十神: string[][];
  /** 每柱天干与日主的五行关系 (日柱为 "同类") */
  生克: Relation[];
  /** 每柱藏干与日主的五行关系 */
  藏干生克: Relation[][];
  /** 日主的五行生克体系 */
  五行: WuXingRelations;
};

export function computeShishen(input: BaziInput): ShishenResult {
  const day = input.day.gan;
  const pillars: Pillar[] = [input.year, input.month, input.day, input.hour];

  const 十神 = pillars.map((p, i) => (i === 2 ? "日主" : shishenOf(day, p.gan)));
  const 藏干 = pillars.map(p => [...CANG_GAN[p.zhi]]);
  const 藏干十神 = 藏干.map(gans => gans.map(g => shishenOf(day, g)));
  const 生克 = pillars.map(p => relationOf(day, p.gan));
  const 藏干生克 = pillars.map(p => CANG_GAN[p.zhi].map(g => relationOf(day, g)));
  const 五行 = wuxingRelations(day);

  return { 十神, 藏干, 藏干十神, 生克, 藏干生克, 五行 };
}
