/**
 * 解法 —— 给定一条已成立的关系, 反推「什么可以解开 / 打破它」.
 *
 * 岁运引化.ts 回答的是「这些岁运柱是否影响了这条关系」(已知因求果);
 * 本模块回答的是「哪些干支能影响这条关系」(已知果求因), 即穷举所有
 * 十干 / 十二支, 逐个试其对该关系的作用, 给出可行解集.
 *
 * 复用 岁运引化.ts 的判定函数, 故两边规则天然一致:
 *   刑冲破害 (可解类) → 找能与某成员成 合 的干支 → 效果 引化
 *   合会     (可破类) → 找能与某成员成 冲/克 的干支 → 效果 冲克
 *   两者反向 → 效果 加重 / 助合
 *
 * 墓库不在本模块: 库的态变是状态机而非单条关系, 由 墓库.ts 自行处理.
 */
import { GAN, GanC, PillarC, ZHI, ZhiC } from "@/types";
import type { DiZhiHit } from "./地支.ts";
import type { TianGanHit } from "./天干.ts";
import {
  地支岁运作用, 天干岁运作用,
  type SuiYunEffect,
} from "./岁运引化.ts";


/** 一个可行解 —— 某个干或支能对目标关系产生何种作用. */
export interface Remedy {
  /** 起作用的干或支. */
  readonly by: GanC | ZhiC;
  /** 产生的作用: 引化 / 冲克 (减弱) 与 加重 / 助合 (增强). */
  readonly effect: SuiYunEffect;
  /** 经由哪条关系起作用, 形如 "子丑合化土". */
  readonly via: string;
  /** 作用在关系的哪个成员上. */
  readonly target: GanC | ZhiC;
}

/**
 * 一条关系的全部作用方案 —— 好坏两侧都给出.
 *
 * 吉凶不由本结构判定: 减弱一条 相冲 是好事, 减弱一条 六合 是坏事;
 * 增强同理. 调用方按原关系的性质自行解读.
 */
export interface RemedySet {
  /** 关系全名, 便于回溯. */
  readonly of: string;
  /** 关系类别, 供调用方判断吉凶. */
  readonly kind: string;
  /** 解开该关系的方案 (刑冲破害 → 引化). */
  readonly dissolvers: readonly Remedy[];
  /** 打破该关系的方案 (合会 → 冲克). */
  readonly breakers: readonly Remedy[];
  /** 加重该关系的方案 (刑冲破害 → 再成同类, 凶更凶). */
  readonly aggravators: readonly Remedy[];
  /** 增强该关系的方案 (合会 → 再成同类, 合更牢). */
  readonly reinforcers: readonly Remedy[];
}

type Buckets = {
  dissolvers: Remedy[]; breakers: Remedy[];
  aggravators: Remedy[]; reinforcers: Remedy[];
};

const emptyBuckets = (): Buckets =>
  ({ dissolvers: [], breakers: [], aggravators: [], reinforcers: [] });

/** 作用类型 → 归入哪个桶. */
function bucketOf(b: Buckets, e: SuiYunEffect): Remedy[] {
  switch (e) {
    case "引化": return b.dissolvers;
    case "冲克": return b.breakers;
    case "加重": return b.aggravators;
    case "助合": return b.reinforcers;
  }
}

/** 探针柱: 只为借用 地支岁运作用 / 天干岁运作用 的成员匹配逻辑. */
const probeZhi = (z: ZhiC) => PillarC.from(GanC.from("甲"), z);
const probeGan = (g: GanC) => PillarC.from(g, ZhiC.from("子"));

/**
 * 某条地支关系的解法 —— 穷举十二支.
 * 注意探针柱的天干固定为甲, 不参与地支判定, 故不影响结果.
 */
export function 地支解法(hit: DiZhiHit): RemedySet {
  const buckets = emptyBuckets();
  for (const z of ZHI) {
    const cand = ZhiC.from(z);
    for (const m of 地支岁运作用(hit, [probeZhi(cand)])) {
      bucketOf(buckets, m.effect).push({ by: cand, effect: m.effect, via: m.via, target: m.target });
    }
  }
  return { of: hit.name, kind: hit.kind, ...buckets };
}

/** 某条天干关系的解法 —— 穷举十干. */
export function 天干解法(hit: TianGanHit): RemedySet {
  const buckets = emptyBuckets();
  for (const g of GAN) {
    const cand = GanC.from(g);
    for (const m of 天干岁运作用(hit, [probeGan(cand)])) {
      bucketOf(buckets, m.effect).push({ by: cand, effect: m.effect, via: m.via, target: m.target });
    }
  }
  return { of: hit.name, kind: hit.kind, ...buckets };
}
