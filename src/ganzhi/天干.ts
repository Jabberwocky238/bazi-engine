import { GAN, GanC, WuXingC, type Gan, type WuXing } from "@/types.ts";
import { createBitList, createTable, type Table } from "@/bitmap.ts";
import { popcount, slotsToMask, slotIndex, type BitHit } from "./common.ts";

export type TianGanRelation = "相合" | "相冲" | "相克" | null;

export const TIAN_GAN_RELATION_TABLE = [
  [null, null, null, null, "相克", "相合", "相冲", null, null, null],
  [null, null, null, null, null, "相克", "相合", "相冲", null, null],
  [null, null, null, null, null, null, "相克", "相合", "相冲", null],
  [null, null, null, null, null, null, null, "相克", "相合", "相冲"],
  ["相克", null, null, null, null, null, null, null, "相克", "相合"],
  ["相合", "相克", null, null, null, null, null, null, null, "相克"],
  ["相冲", "相合", "相克", null, null, null, null, null, null, null],
  [null, "相冲", "相合", "相克", null, null, null, null, null, null],
  [null, null, "相冲", "相合", "相克", null, null, null, null, null],
  [null, null, null, "相冲", "相合", "相克", null, null, null, null],
] as const satisfies Table<TianGanRelation, [10, 10]>;

export const TIAN_GAN_RELATION_TABLE_WRAPPER = createTable(TIAN_GAN_RELATION_TABLE, GAN, GAN);

// ———————————————————————————————————————————————
// 天干位表 — 10 干各占 1 bit, 一组干即一个数
// ———————————————————————————————————————————————
// 同 地支.ts: 一组干的掩码就是这组关系的身份, 掩码即键, C 即值,
// 判定只是 (盘 & 键) === 键. 三类关系皆两干相对, 故无 triple.

/** 天干位表 (bit0..bit9, 位序同 GAN). */
export const GAN_BITS = createBitList(GAN, 10);
/** 一组天干的位掩码. */
export type GanMask = number;
/** 把天干压成掩码. */
export function ganMask(gans: readonly (GanC | Gan)[]): GanMask {
  return GAN_BITS.encode(gans.map((g) => (typeof g === "string" ? g : g.str)));
}
/** 掩码 → 天干 (按 GAN 位序). */
export function maskGans(mask: GanMask): readonly GanC[] {
  return GAN_BITS.decode(mask).map(GanC.from);
}
/** 一条命中: 关系 + 命中它的那几个下标 (地支.ts 已占用 Hit, 故名 GanHit). */
export type GanHit<R> = BitHit<R>;

// ———————————————————————————————————————————————
// 三类关系 — 相合 (五合) / 相冲 / 相克
// ———————————————————————————————————————————————
// 注: 相冲 4 组 (甲庚/乙辛/丙壬/丁癸) 为 相克 10 对之子集 —— 原文件
// 天干相冲.ts / 天干相克.ts 自身即注明此重叠, 故两类并存, 各自可查.

/** 三类. */
export type TianGanKind = "相合" | "相冲" | "相克";

/** 五合别名. */
export type WuHeAlias = "中正之合" | "仁义之合" | "威制之合" | "淫昵之合" | "无情之合";

/** 各类专属元数据 — 由 TianGanC.meta() 取出. */
export type TianGanMeta =
  | { kind: "相合"; hua: WuXing; alias: WuHeAlias }
  | { kind: "相冲" }
  | { kind: "相克"; controller: Gan; controlled: Gan };

/**
 * 天干关系 — 掩码为键, 本实例为值.
 * 同一掩码可有多条 (甲庚 兼 相冲与相克), 故 map 的值为数组.
 */
export class TianGanC {
  /** 该组干的掩码 —— 即本关系的身份. */
  public readonly mask: GanMask;

  private constructor(
    /** 声明之序 (成名用; 庚甲相克 / 辛乙相克 皆非 GAN 位序). */
    private readonly _seq: string,
    private readonly _meta: TianGanMeta,
  ) {
    this.mask = ganMask([...this._seq] as Gan[]);
  }

  private static rule(gans: readonly Gan[], meta: TianGanMeta): TianGanC {
    return new TianGanC(gans.join(""), meta);
  }

  /** 三类之一. */
  get kind(): TianGanKind { return this._meta.kind; }
  /** 参与干数 (恒 2). */
  get size(): number { return popcount(this.mask); }
  /** 涉及的干 (由掩码还原, 按 GAN 位序). */
  get gans(): readonly GanC[] { return maskGans(this.mask); }
  /** 双方五行. */
  get wuxing(): readonly WuXingC[] { return this.gans.map((g) => g.wuxing); }
  /** 全名 ("甲己合化土" / "甲庚相冲" / "甲戊相克"). */
  get name(): string {
    const m = this._meta;
    return m.kind === "相合" ? `${this._seq}合化${m.hua}` : `${this._seq}${m.kind}`;
  }

  /** 获取专属元数据. */
  meta(): TianGanMeta { return this._meta; }

  /** 化气五行 (相合才有). */
  get huaWuxing(): WuXingC | undefined {
    const m = this._meta;
    return m.kind === "相合" ? WuXingC.from(m.hua) : undefined;
  }
  /** 克方 (相克才有). */
  get controller(): GanC | undefined {
    const m = this._meta;
    return m.kind === "相克" ? GanC.from(m.controller) : undefined;
  }
  /** 被克方 (相克才有). */
  get controlled(): GanC | undefined {
    const m = this._meta;
    return m.kind === "相克" ? GanC.from(m.controlled) : undefined;
  }

  // ——— 掩码 → C ———

  /** 五合. md: 合/天干五合.md */
  static readonly 相合: readonly TianGanC[] = [
    TianGanC.rule(["甲", "己"], { kind: "相合", hua: "土", alias: "中正之合" }),
    TianGanC.rule(["乙", "庚"], { kind: "相合", hua: "金", alias: "仁义之合" }),
    TianGanC.rule(["丙", "辛"], { kind: "相合", hua: "水", alias: "威制之合" }),
    TianGanC.rule(["丁", "壬"], { kind: "相合", hua: "木", alias: "淫昵之合" }),
    TianGanC.rule(["戊", "癸"], { kind: "相合", hua: "火", alias: "无情之合" }),
  ];

  /** 相冲 — 4 组, 戊己居中不冲. md: 冲/天干相冲.md */
  static readonly 相冲: readonly TianGanC[] = [
    TianGanC.rule(["甲", "庚"], { kind: "相冲" }),
    TianGanC.rule(["乙", "辛"], { kind: "相冲" }),
    TianGanC.rule(["丙", "壬"], { kind: "相冲" }),
    TianGanC.rule(["丁", "癸"], { kind: "相冲" }),
  ];

  /** 相克 — 同性相克 10 对 (已涵盖 4 组冲). md: 克/天干相克.md */
  static readonly 相克: readonly TianGanC[] = [
    TianGanC.rule(["甲", "戊"], { kind: "相克", controller: "甲", controlled: "戊" }),
    TianGanC.rule(["乙", "己"], { kind: "相克", controller: "乙", controlled: "己" }),
    TianGanC.rule(["丙", "庚"], { kind: "相克", controller: "丙", controlled: "庚" }),
    TianGanC.rule(["丁", "辛"], { kind: "相克", controller: "丁", controlled: "辛" }),
    TianGanC.rule(["戊", "壬"], { kind: "相克", controller: "戊", controlled: "壬" }),
    TianGanC.rule(["己", "癸"], { kind: "相克", controller: "己", controlled: "癸" }),
    TianGanC.rule(["庚", "甲"], { kind: "相克", controller: "庚", controlled: "甲" }),
    TianGanC.rule(["辛", "乙"], { kind: "相克", controller: "辛", controlled: "乙" }),
    TianGanC.rule(["壬", "丙"], { kind: "相克", controller: "壬", controlled: "丙" }),
    TianGanC.rule(["癸", "丁"], { kind: "相克", controller: "癸", controlled: "丁" }),
  ];

  /** 全部关系. */
  static readonly rules: readonly TianGanC[] = [
    ...TianGanC.相合, ...TianGanC.相冲, ...TianGanC.相克,
  ];

  /** 掩码 → 该组干的全部关系 (甲庚 → [相冲, 相克]). */
  static readonly map: ReadonlyMap<GanMask, readonly TianGanC[]> = (() => {
    const m = new Map<GanMask, TianGanC[]>();
    for (const r of TianGanC.rules) {
      const arr = m.get(r.mask);
      if (arr) arr.push(r); else m.set(r.mask, [r]);
    }
    return m;
  })();



  /** 查一组干命中的全部关系 (顺序无关). */
  static at(...gans: GanC[]): readonly TianGanC[] {
    return TianGanC.map.get(ganMask(gans)) ?? [];
  }



  /**
   * 批量推断 — 一串天干 → 全部命中及其下标.
   *
   * 冲 / 克: 一干重出则关系成立多次, 每个组合各出一条 (计数即条数).
   * 相合: 只出最近一对 —— 一方重出是 争合 而非多重合, 见 inferZhengHe.
   */
  static infer(gans: readonly GanC[]): readonly GanHit<TianGanC>[] {
    const slotsOf = slotIndex(gans);
    const mask = ganMask(gans);

    const out: GanHit<TianGanC>[] = [];
    for (const rule of TianGanC.rules) {
      if ((mask & rule.mask) !== rule.mask) continue;   // ← 判定就这一句
      const [a, b] = rule.gans as readonly [GanC, GanC];
      const A = slotsOf.get(a)!, B = slotsOf.get(b)!;
      // 冲 / 克: 一干重出则关系成立多次, 逐组合各出一条 (计数即条数)
      if (rule.kind !== "相合") {
        for (const i of A) for (const j of B) out.push({ rule, slots: [i, j].sort((x, y) => x - y) });
        continue;
      }
      // 相合: 只取最近一对 —— 一方重出即为 争合 (见 inferZhengHe), 而非多重合
      let best: [number, number] | undefined;
      let gap = Infinity;
      for (const i of A) {
        for (const j of B) {
          const g = Math.abs(i - j);
          if (g < gap) { gap = g; best = [i, j]; }
        }
      }
      out.push({ rule, slots: [...best!].sort((x, y) => x - y) });
    }
    return out;
  }


}

// ———————————————————————————————————————————————
// 争合 — 两同干争合一字
// ———————————————————————————————————————————————
// 掩码答不了"同一干出现几次" (一干一 bit), 故争合另走重数索引,
// 同 地支 自刑. md: 合/争合.md

/** 争合命中. */
export interface ZhengHeHit {
  /** 所依之五合. */
  readonly rule: TianGanC;
  /** 重复出现的天干. */
  readonly dupGan: GanC;
  /** 被争合的目标天干. */
  readonly targetGan: GanC;
  /** 重复干数量 (≥2). */
  readonly dupCount: number;
  /** 全部参与位 (升序). */
  readonly slots: readonly number[];
  /** 全名 ("争合 甲甲己"). */
  readonly name: string;
}

/** 推断争合 —— 五合之一方重出 ≥2 且另一方在场. */
export function inferZhengHe(gans: readonly GanC[]): readonly ZhengHeHit[] {
  const slotsOf = slotIndex(gans);

  const out: ZhengHeHit[] = [];
  for (const rule of TianGanC.相合) {
    const [a, b] = rule.gans as readonly [GanC, GanC];
    for (const [dup, target] of [[a, b], [b, a]] as const) {
      const dupSlots = slotsOf.get(dup);
      const tgtSlots = slotsOf.get(target);
      if (!dupSlots || dupSlots.length < 2 || !tgtSlots?.length) continue;
      out.push({
        rule,
        dupGan: dup,
        targetGan: target,
        dupCount: dupSlots.length,
        slots: [...dupSlots, ...tgtSlots].sort((x, y) => x - y),
        name: `争合 ${dup.str}${dup.str}${target.str}`,
      });
    }
  }
  return out;
}

// ———————————————————————————————————————————————
// TianGanDetector — 检测算法入口
// ———————————————————————————————————————————————
// TianGanC 是具体类型入口 (三类关系, 掩码表与元数据);
// 本类是算法入口: 一次输入一串天干, 三类一并推断, 结果按类归拢.
// 类 / 柱 / 干 一律用位表示, 故筛选皆是一次按位与, 不作字符串比较.

/** 关系类位表 — 三类各占 1 bit. */
export const TG_REL_BITS = createBitList(["相合", "相冲", "相克"] as const, 3);
/** 一组关系类的位掩码. */
export type TGRelMask = number;
/** 把关系类压成掩码. */
export function tgRelMask(kinds: readonly TianGanKind[]): TGRelMask {
  return TG_REL_BITS.encode([...kinds]);
}
/** 单个类的位. */
function tgRelBit(kind: TianGanKind): TGRelMask {
  return TG_REL_BITS.encode([kind]);
}

/** 一条检测结果. */
export interface TianGanHit {
  /** 三类之一. */
  readonly kind: TianGanKind;
  /** 该类的位. */
  readonly kindBit: TGRelMask;
  /** 关系的天干掩码. */
  readonly ganMask: GanMask;
  /** 涉及柱的下标掩码 (bit i = 占第 i 柱). */
  readonly slotMask: number;
  /** 全名. */
  readonly name: string;
  /** 涉及的干. */
  readonly gans: readonly GanC[];
  /** 命中的下标 (升序). */
  readonly slots: readonly number[];
  /** 具体关系 — 需取专属元数据时用 rule.meta(). */
  readonly rule: TianGanC;
}

/** 检测结果全集. */
export interface TianGanReport {
  /** 输入的天干序列. */
  readonly gans: readonly GanC[];
  /** 输入的天干掩码. */
  readonly mask: GanMask;
  /** 命中的全部关系类之掩码. */
  readonly kinds: TGRelMask;
  /** 全部命中. */
  readonly hits: readonly TianGanHit[];
  /** 争合命中. */
  readonly zhenghe: readonly ZhengHeHit[];
}

const norm = (h: GanHit<TianGanC>): TianGanHit => ({
  kind: h.rule.kind,
  kindBit: tgRelBit(h.rule.kind),
  ganMask: h.rule.mask,
  slotMask: slotsToMask(h.slots),
  name: h.rule.name,
  gans: h.rule.gans,
  slots: h.slots,
  rule: h.rule,
});

/**
 * 天干关系检测 — 算法入口.
 * 输入一串天干 (四柱, 或含岁运的更长序列), 一次推断出全部三类关系 + 争合.
 */
export class TianGanDetector {
  private constructor(public readonly report: TianGanReport) { }

  /** 跑一遍检测. */
  static detect(gans: readonly GanC[]): TianGanDetector {
    const hits = TianGanC.infer(gans).map(norm);
    const kinds = hits.reduce((m, h) => m | h.kindBit, 0);
    return new TianGanDetector({
      gans: [...gans],
      mask: ganMask(gans),
      kinds,
      hits,
      zhenghe: inferZhengHe(gans),
    });
  }

  /** 全部命中. */
  get hits(): readonly TianGanHit[] { return this.report.hits; }
  /** 争合命中. */
  get zhenghe(): readonly ZhengHeHit[] { return this.report.zhenghe; }
  /** 命中的全部关系类之掩码. */
  get kinds(): TGRelMask { return this.report.kinds; }

  /** 有无这几类中的任一 —— 掩码或起来一次判定, 不必遍历命中. */
  has(...kinds: TianGanKind[]): boolean {
    return (this.report.kinds & tgRelMask(kinds)) !== 0;
  }

  /** 命中了哪几类 (按 TG_REL_BITS 位序). */
  kindList(): readonly TianGanKind[] {
    return TG_REL_BITS.decode(this.report.kinds);
  }

  /** 取这几类的命中 —— 一个掩码筛全部. */
  byKind(...kinds: TianGanKind[]): readonly TianGanHit[] {
    const m = tgRelMask(kinds);
    return this.report.hits.filter((h) => (h.kindBit & m) !== 0);
  }

  /** 涉及这几柱中任一柱的命中 —— 柱也是位. */
  bySlot(...slots: number[]): readonly TianGanHit[] {
    const m = slotsToMask(slots);
    return this.report.hits.filter((h) => (h.slotMask & m) !== 0);
  }

  /** 涉及这几干中任一干的命中 —— 干也是位. */
  byGan(...gans: GanC[]): readonly TianGanHit[] {
    const m = ganMask(gans);
    return this.report.hits.filter((h) => (h.ganMask & m) !== 0);
  }
}
