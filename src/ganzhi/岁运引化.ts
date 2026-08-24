/**
 * 岁运引化 —— 大运 / 流年 / 流月 等岁运柱对原局关系的作用.
 *
 * 天干.ts / 地支.ts 只管原局的掩码判定, 不含岁运概念 (保持纯净);
 * 本层在其输出之上叠加岁运作用, 故只依赖它们的结果, 不改其逻辑.
 *
 * 旧算法的岁运规则 (见 common.ts 的 dissolvers/impactors/openers), 三类作用:
 *
 *   引化 (解) —— 岁运与成员成 合, 则原局的 冲/克/刑/害/破 被合解
 *     地支: 岁运支与成员支成 六合 / 半合 / 拱合
 *     天干: 岁运干与成员干成 相合
 *   冲克 (破) —— 岁运与成员成 冲/克, 则原局的 合 被击破
 *     地支: 岁运支与成员支成 六冲
 *     天干: 岁运干与成员干成 相克
 *   冲开 —— 岁运支与库支 六冲, 冲开墓库 (库由调用方给出)
 *
 * 一个岁运柱对一条关系最多产生一条记录: 逐成员试, 首个命中即止 (同旧实现的 break).
 */
import { GanC, ZhiC, type Gan, type Zhi } from "@/types.ts";
import { XPCHC, HeHuiC, zhiMask, type DiZhiHit, type DiZhiRelKind, type ZhiMask } from "./地支.ts";
import { TianGanC, type TianGanHit } from "./天干.ts";
import type { ExtraPillar, PillarType } from "./common.ts";

// ———————————————————————————————————————————————
// 岁运柱
// ———————————————————————————————————————————————

/** 岁运柱 —— C 化的 ExtraPillar. */
export class SuiYunC {
  private constructor(
    public readonly label: PillarType,
    public readonly gan: GanC,
    public readonly zhi: ZhiC,
  ) { }

  static from(label: PillarType, gan: Gan | GanC, zhi: Zhi | ZhiC): SuiYunC {
    return new SuiYunC(
      label,
      typeof gan === "string" ? GanC.from(gan) : gan,
      typeof zhi === "string" ? ZhiC.from(zhi) : zhi,
    );
  }

  /** 由旧式 ExtraPillar 转入. */
  static fromExtra(e: ExtraPillar): SuiYunC {
    return SuiYunC.from(e.label, e.gan, e.zhi);
  }
}

// ———————————————————————————————————————————————
// 作用类型
// ———————————————————————————————————————————————

/** 三类作用. */
export type SuiYunEffect = "引化" | "冲克" | "冲开";

/** 一条岁运作用记录. */
export interface SuiYunMod {
  /** 何种作用. */
  readonly effect: SuiYunEffect;
  /** 由哪个岁运柱触发. */
  readonly by: SuiYunC;
  /** 经由哪条关系触发, 形如 "子丑合化土" / "子午相冲". */
  readonly via: string;
  /** 岁运与原局哪个成员成的关系. */
  readonly target: ZhiC | GanC;
}

/** 可被合解的地支关系类 (刑冲破害). */
const 地支可解类: readonly DiZhiRelKind[] = ["相冲", "相刑", "相害", "相破"];
/** 可被冲破的地支关系类 (合会). */
const 地支可破类: readonly DiZhiRelKind[] = ["六合", "三合", "三会", "暗合"];

/**
 * 寅午 例外 —— API 归 暗合 而不出 半合火局 (暗合优先于半合),
 * 故 寅午 不作引化. 同 地支三合.ts 的 BANHE_SKIP.
 */
const 半合例外: ZhiMask = zhiMask(["寅", "午"]);

/**
 * 岁运支 × 原局支 → 引化关系名?
 * 取 六合, 或 三合的 半合/拱合 —— 三合整局不算 (两支只可能成子集).
 * 优先级同 pairwiseZhi: 六合 在前.
 */
function 引化关系(e: ZhiC, z: ZhiC): string | undefined {
  const lh = HeHuiC.at(e, z).find((r) => r.kind === "六合");
  if (lh) return lh.name;
  const pair = zhiMask([e, z]);
  if (pair === 半合例外) return undefined;
  for (const r of HeHuiC.rules) {
    if (r.kind !== "三合") continue;
    const sub = r.subsets().find((x) => x.mask === pair);
    if (sub) return sub.name;
  }
  return undefined;
}

/** 岁运支 × 原局支 → 六冲? */
function 相冲关系(e: ZhiC, z: ZhiC): XPCHC | undefined {
  return XPCHC.at(e, z).find((r) => r.kind === "相冲");
}

/** 岁运干 × 原局干 → 相合? */
function 相合关系(e: GanC, g: GanC): TianGanC | undefined {
  return TianGanC.at(e, g).find((r) => r.kind === "相合");
}

/** 岁运干 × 原局干 → 相克? */
function 相克关系(e: GanC, g: GanC): TianGanC | undefined {
  return TianGanC.at(e, g).find((r) => r.kind === "相克");
}

// ———————————————————————————————————————————————
// 逐条关系叠加岁运作用
// ———————————————————————————————————————————————

/**
 * 一个岁运柱对一组成员的作用 —— 逐成员试, 首个命中即止.
 * probe 返回关系名则记一条, 返回 undefined 则该岁运柱对本关系无作用.
 */
function firstHit<T>(
  members: readonly T[],
  probe: (m: T) => string | undefined,
): { via: string; target: T } | undefined {
  for (const m of members) {
    const via = probe(m);
    if (via !== undefined) return { via, target: m };
  }
  return undefined;
}

/** 地支关系 + 岁运 → 作用记录. */
export function 地支岁运作用(
  hit: DiZhiHit,
  suiyun: readonly SuiYunC[],
): readonly SuiYunMod[] {
  const out: SuiYunMod[] = [];
  const members = hit.zhis;
  const 可解 = 地支可解类.includes(hit.kind);
  const 可破 = 地支可破类.includes(hit.kind);

  for (const sy of suiyun) {
    if (可解) {
      const r = firstHit(members, (z) => 引化关系(sy.zhi, z));
      if (r) { out.push({ effect: "引化", by: sy, via: r.via, target: r.target }); continue; }
    }
    if (可破) {
      const r = firstHit(members, (z) => 相冲关系(sy.zhi, z)?.name);
      if (r) out.push({ effect: "冲克", by: sy, via: r.via, target: r.target });
    }
  }
  return out;
}

/** 天干关系 + 岁运 → 作用记录. */
export function 天干岁运作用(
  hit: TianGanHit,
  suiyun: readonly SuiYunC[],
): readonly SuiYunMod[] {
  const out: SuiYunMod[] = [];
  const members = hit.gans;
  const 可解 = hit.kind === "相冲" || hit.kind === "相克";
  const 可破 = hit.kind === "相合";

  for (const sy of suiyun) {
    if (可解) {
      const r = firstHit(members, (g) => 相合关系(sy.gan, g)?.name);
      if (r) { out.push({ effect: "引化", by: sy, via: r.via, target: r.target }); continue; }
    }
    if (可破) {
      const r = firstHit(members, (g) => 相克关系(sy.gan, g)?.name);
      if (r) out.push({ effect: "冲克", by: sy, via: r.via, target: r.target });
    }
  }
  return out;
}

/** 墓库冲开 —— 岁运支与库支 六冲. */
export function 墓库冲开(
  muZhi: ZhiC,
  suiyun: readonly SuiYunC[],
): readonly SuiYunMod[] {
  const out: SuiYunMod[] = [];
  for (const sy of suiyun) {
    const r = 相冲关系(sy.zhi, muZhi);
    if (r) out.push({ effect: "冲开", by: sy, via: r.name, target: muZhi });
  }
  return out;
}

// ———————————————————————————————————————————————
// 汇总
// ———————————————————————————————————————————————

/** 一条关系连同其岁运作用. */
export interface SuiYunHit<H> {
  readonly hit: H;
  readonly mods: readonly SuiYunMod[];
  /** 被引化 (合解). */
  readonly dissolved: boolean;
  /** 被冲克 (击破). */
  readonly impacted: boolean;
}

const wrap = <H>(hit: H, mods: readonly SuiYunMod[]): SuiYunHit<H> => ({
  hit,
  mods,
  dissolved: mods.some((m) => m.effect === "引化"),
  impacted: mods.some((m) => m.effect === "冲克"),
});

/** 给一批地支关系挂上岁运作用. */
export function 叠加地支岁运(
  hits: readonly DiZhiHit[],
  suiyun: readonly SuiYunC[],
): readonly SuiYunHit<DiZhiHit>[] {
  return hits.map((h) => wrap(h, 地支岁运作用(h, suiyun)));
}

/** 给一批天干关系挂上岁运作用. */
export function 叠加天干岁运(
  hits: readonly TianGanHit[],
  suiyun: readonly SuiYunC[],
): readonly SuiYunHit<TianGanHit>[] {
  return hits.map((h) => wrap(h, 天干岁运作用(h, suiyun)));
}
