import { ZHI, GanC, WuXingC, ZhiC, type Gan, type WuXing, type Zhi } from "@/types.ts";
import { createBitList } from "@/bitmap.ts";
import {
  popcount, slotsToMask, slotIndex, inferBitHits,
  type BitHit,
} from "./common.ts";

// ———————————————————————————————————————————————
// 地支位表 — 12 支各占 1 bit, 一组支即一个数
// ———————————————————————————————————————————————
// 一组支的掩码就是这组关系的身份: 亥卯未 即 (1<<亥)|(1<<卯)|(1<<未).
// 故不设规则表 —— 掩码即键, C 即值, 判定只是 (盘 & 键) === 键.

/** 地支位表 (bit0..bit11, 位序同 ZHI). */
export const ZHI_BITS = createBitList(ZHI, 12);
/** 一组地支的位掩码. */
export type ZhiMask = number;
/** 把地支压成掩码. */
export function zhiMask(zhis: readonly (ZhiC | Zhi)[]): ZhiMask {
  return ZHI_BITS.encode(zhis.map((z) => (typeof z === "string" ? z : z.str)));
}
/** 掩码 → 地支 (按 ZHI 位序). */
export function maskZhis(mask: ZhiMask): readonly ZhiC[] {
  return ZHI_BITS.decode(mask).map(ZhiC.from);
}
/** 一条命中: 关系 + 命中它的那几个下标. */
export type Hit<R> = BitHit<R>;

/** 批量推断 — 掩码判定 + 下标笛卡尔积, 见 common.inferBitHits. */
function inferHits<R extends { mask: ZhiMask; size: number }>(
  rules: readonly R[],
  zhis: readonly ZhiC[],
): readonly Hit<R>[] {
  return inferBitHits(rules, zhis, maskZhis, zhiMask);
}

// ———————————————————————————————————————————————
// XPCH — 刑 / 破 / 冲 / 害
// ———————————————————————————————————————————————
// 掩码为键, C 为值. 同一掩码可有多条 (寅巳 兼 相刑与相害), 故值为数组.

/** XPCH 四类. */
export type XPCHKind = "相刑" | "相破" | "相冲" | "相害";

/** 相刑子类. */
export type XingSubKind = "三刑" | "半刑" | "子卯刑" | "自刑";
/** 三刑名. */
export type XingName = "恃势之刑" | "无恩之刑" | "无礼之刑";
/** 三刑 triple. */
export type XingTriple = "丑未戌" | "寅巳申";
/** 破类. */
export type PoLei = "四帝旺之破" | "四长生之破" | "四墓库之破";
/** 冲类型. */
export type ChongKind = "水火对冲" | "木金对冲" | "驿马冲" | "墓库冲";
/** 六害名. */
export type HaiName =
  | "世家之害" | "官鬼相害" | "两强相害" | "争嗔之害" | "欺凌之害" | "嫉妒之害";

/** 各类专属元数据 — 由 XPCHC.meta() 取出. */
export type XPCHMeta =
  | { kind: "相刑"; sub: XingSubKind; xingName: XingName; triple?: XingTriple; desc?: string }
  | { kind: "相破"; poLei: PoLei }
  | { kind: "相冲"; chongKind: ChongKind; isMukuChong: boolean }
  | { kind: "相害"; haiName: HaiName; yingshi: string };

/**
 * 刑破冲害 — 掩码为键, 本实例为值.
 * 同一组支可有多条 (寅巳 兼 相刑与相害), 故 map 的值为数组.
 */
export class XPCHC {
  /** 该组支的掩码 —— 即本关系的身份. */
  public readonly mask: ZhiMask;

  private constructor(
    private readonly _seq: string,          // 声明之序 (成名用; 辰丑相破 非 ZHI 位序)
    private readonly _meta: XPCHMeta,
  ) {
    this.mask = zhiMask([..._seq] as Zhi[]);
  }

  private static rule(zhis: readonly Zhi[], meta: XPCHMeta): XPCHC {
    return new XPCHC(zhis.join(""), meta);
  }

  /** 四类之一. */
  get kind(): XPCHKind { return this._meta.kind; }
  /** 参与支数 (1 = 自刑, 2 = pair, 3 = 三刑). */
  get size(): number { return popcount(this.mask); }
  /** 涉及的支 (由掩码还原, 按 ZHI 位序). */
  get zhis(): readonly ZhiC[] { return maskZhis(this.mask); }
  /** 全名 ("寅巳相害" / "丑未戌三刑" / "辰辰相刑" / "辰丑相破"). */
  get name(): string {
    const m = this._meta;
    if (m.kind === "相刑") {
      if (m.sub === "三刑") return `${this._seq}三刑`;
      if (m.sub === "自刑") return `${this._seq}${this._seq}相刑`;
      return `${this._seq}相刑`;
    }
    return `${this._seq}${m.kind}`;
  }

  /** 获取专属元数据. */
  meta(): XPCHMeta { return this._meta; }

  /** 三刑 triple 之支 (半刑用其 triple; 非刑者无). */
  tripleZhis(): readonly ZhiC[] {
    const m = this._meta;
    if (m.kind !== "相刑" || !m.triple) return [];
    return [...m.triple].map((c) => ZhiC.from(c as Zhi));
  }

  // ——— 掩码 → C ———

  /** 三刑 / 半刑 / 子卯刑 / 自刑. md: 刑/地支相刑总论.md */
  static readonly 刑: readonly XPCHC[] = [
    // 丑未戌 恃势之刑 (土刑) — triple 及其 3 个 pair 子集
    XPCHC.rule(["丑", "未", "戌"], { kind: "相刑", sub: "三刑", xingName: "恃势之刑", triple: "丑未戌" }),
    XPCHC.rule(["丑", "未"], { kind: "相刑", sub: "半刑", xingName: "恃势之刑", triple: "丑未戌" }),
    XPCHC.rule(["未", "戌"], { kind: "相刑", sub: "半刑", xingName: "恃势之刑", triple: "丑未戌" }),
    XPCHC.rule(["丑", "戌"], { kind: "相刑", sub: "半刑", xingName: "恃势之刑", triple: "丑未戌" }),
    // 寅巳申 无恩之刑 (驿马刑)
    XPCHC.rule(["寅", "巳", "申"], { kind: "相刑", sub: "三刑", xingName: "无恩之刑", triple: "寅巳申" }),
    XPCHC.rule(["寅", "巳"], { kind: "相刑", sub: "半刑", xingName: "无恩之刑", triple: "寅巳申" }),
    XPCHC.rule(["巳", "申"], { kind: "相刑", sub: "半刑", xingName: "无恩之刑", triple: "寅巳申" }),
    XPCHC.rule(["寅", "申"], { kind: "相刑", sub: "半刑", xingName: "无恩之刑", triple: "寅巳申" }),
    // 子卯 无礼之刑
    XPCHC.rule(["子", "卯"], { kind: "相刑", sub: "子卯刑", xingName: "无礼之刑" }),
    // 自刑 — 同支重出
    XPCHC.rule(["辰"], { kind: "相刑", sub: "自刑", xingName: "无礼之刑", desc: "水库碰撞 · 委屈内积、自我贬低; 脾胃消化、抑郁" }),
    XPCHC.rule(["午"], { kind: "相刑", sub: "自刑", xingName: "无礼之刑", desc: "火焰合一 · 脾气暴躁、完美主义; 心血管眼睛、焦虑失眠" }),
    XPCHC.rule(["酉"], { kind: "相刑", sub: "自刑", xingName: "无礼之刑", desc: "刀刃互磨 · 冷漠不切实际; 肺呼吸、外伤手术" }),
    XPCHC.rule(["亥"], { kind: "相刑", sub: "自刑", xingName: "无礼之刑", desc: "江河泛滥 · 忧郁沉溺; 肾泌尿内分泌、情绪困扰" }),
  ];

  /** 六破. md: 克/地支相破相绝.md */
  static readonly 破: readonly XPCHC[] = [
    XPCHC.rule(["子", "酉"], { kind: "相破", poLei: "四帝旺之破" }),
    XPCHC.rule(["卯", "午"], { kind: "相破", poLei: "四帝旺之破" }),
    XPCHC.rule(["寅", "亥"], { kind: "相破", poLei: "四长生之破" }),
    XPCHC.rule(["巳", "申"], { kind: "相破", poLei: "四长生之破" }),
    XPCHC.rule(["辰", "丑"], { kind: "相破", poLei: "四墓库之破" }),
    XPCHC.rule(["未", "戌"], { kind: "相破", poLei: "四墓库之破" }),
  ];

  /** 六冲. md: 冲/地支相冲总论.md */
  static readonly 冲: readonly XPCHC[] = [
    XPCHC.rule(["子", "午"], { kind: "相冲", chongKind: "水火对冲", isMukuChong: false }),
    XPCHC.rule(["卯", "酉"], { kind: "相冲", chongKind: "木金对冲", isMukuChong: false }),
    XPCHC.rule(["寅", "申"], { kind: "相冲", chongKind: "驿马冲", isMukuChong: false }),
    XPCHC.rule(["巳", "亥"], { kind: "相冲", chongKind: "驿马冲", isMukuChong: false }),
    XPCHC.rule(["辰", "戌"], { kind: "相冲", chongKind: "墓库冲", isMukuChong: true }),
    XPCHC.rule(["丑", "未"], { kind: "相冲", chongKind: "墓库冲", isMukuChong: true }),
  ];

  /** 六害 (穿). md: 合/相害.md */
  static readonly 害: readonly XPCHC[] = [
    XPCHC.rule(["子", "未"], { kind: "相害", haiName: "世家之害", yingshi: "对骨肉六亲最不利" }),
    XPCHC.rule(["丑", "午"], { kind: "相害", haiName: "官鬼相害", yingshi: "官杀失效; 易怒或残疾" }),
    XPCHC.rule(["寅", "巳"], { kind: "相害", haiName: "两强相害", yingshi: "既合既刑又相害, 庚金六亲注意" }),
    XPCHC.rule(["申", "亥"], { kind: "相害", haiName: "争嗔之害", yingshi: "对婚姻最凶; 动荡变故" }),
    XPCHC.rule(["卯", "辰"], { kind: "相害", haiName: "欺凌之害", yingshi: "年轻欺压年长; 腰脚筋骨" }),
    XPCHC.rule(["酉", "戌"], { kind: "相害", haiName: "嫉妒之害", yingshi: "嫉妒克害; 头面生疮聋哑" }),
  ];

  /** 全部关系. */
  static readonly rules: readonly XPCHC[] = [
    ...XPCHC.刑, ...XPCHC.破, ...XPCHC.冲, ...XPCHC.害,
  ];

  /** 掩码 → 该组支的全部关系 (寅巳 → [相刑, 相害]). */
  static readonly map: ReadonlyMap<ZhiMask, readonly XPCHC[]> = (() => {
    const m = new Map<ZhiMask, XPCHC[]>();
    for (const r of XPCHC.rules) {
      const arr = m.get(r.mask);
      if (arr) arr.push(r); else m.set(r.mask, [r]);
    }
    return m;
  })();



  /** 查一组支命中的全部关系 (顺序无关). */
  static at(...zhis: ZhiC[]): readonly XPCHC[] {
    return XPCHC.map.get(zhiMask(zhis)) ?? [];
  }



  /** 批量推断 — 一串地支 → 全部命中及其下标. */
  static infer(zhis: readonly ZhiC[]): readonly Hit<XPCHC>[] {
    return inferHits(XPCHC.rules, zhis);
  }


}

// ———————————————————————————————————————————————
// 合会 — 六合 / 三合 / 三会 / 暗合
// ———————————————————————————————————————————————

/** 合会 四类. */
export type HeHuiKind = "六合" | "三合" | "三会" | "暗合";

/** 六合别名. */
export type LiuHeAlias = "泥合" | "破合" | "淫合" | "荣合" | "贤合" | "和合";
/** 六合化气 — 午未 为火土双化气. */
export type LiuHeHua = WuXing | "火土";
/** 三会方位. */
export type SanHuiFang = "东方" | "南方" | "西方" | "北方";
/** 藏干五合对. */
export type CangHePair = "癸戊合" | "甲己合" | "乙庚合" | "丙辛合" | "丁壬合";

/** 各类专属元数据 — 由 HeHuiC.meta() 取出. */
export type HeHuiMeta =
  | { kind: "六合"; hua: LiuHeHua; alias: LiuHeAlias }
  | { kind: "三合"; hua: WuXing; changsheng: Zhi; diwang: Zhi; mu: Zhi; needGan: Gan }
  | { kind: "三会"; hua: WuXing; fang: SanHuiFang; head: Zhi; middle: Zhi; tail: Zhi; needGan: Gan }
  | { kind: "暗合"; hua: WuXing; cangHe: CangHePair };

/** triple 的 2 支子集 (半合 / 拱合 / 拱会). */
export interface HeHuiSubset {
  /** 子集掩码 —— 判定同样一个 & 了事. */
  readonly mask: ZhiMask;
  readonly zhis: readonly [ZhiC, ZhiC];
  readonly sub: string;
  readonly name: string;
}

/**
 * 合会 — 掩码为键, 本实例为值.
 * 三合/三会 为 triple, 其 pair 子集经 subsets() 派生 (半合/拱合/拱会).
 */
export class HeHuiC {
  /** 该组支的掩码 —— 即本关系的身份. */
  public readonly mask: ZhiMask;

  private constructor(
    private readonly _seq: string,          // 声明之序 (成名用: 长生→帝旺→墓 / 首→中→末)
    private readonly _meta: HeHuiMeta,
  ) {
    this.mask = zhiMask([..._seq] as Zhi[]);
  }

  private static rule(zhis: readonly Zhi[], meta: HeHuiMeta): HeHuiC {
    return new HeHuiC(zhis.join(""), meta);
  }

  /** 四类之一. */
  get kind(): HeHuiKind { return this._meta.kind; }
  /** 参与支数 (2 = 六合/暗合, 3 = 三合/三会). */
  get size(): number { return popcount(this.mask); }
  /** 涉及的支 (由掩码还原, 按 ZHI 位序). */
  get zhis(): readonly ZhiC[] { return maskZhis(this.mask); }
  /** 化气 (六合 午未 为 "火土", 故非单一 WuXingC). */
  get hua(): LiuHeHua { return this._meta.hua; }
  /** 化气五行 —— 午未 取火; 其余即本五行. */
  get huaWuxing(): WuXingC {
    const h = this._meta.hua;
    return WuXingC.from(h === "火土" ? "火" : h);
  }
  /** 拱出中神所需之阴干 (三合/三会 才有). */
  get needGan(): GanC | undefined {
    const m = this._meta;
    return m.kind === "三合" || m.kind === "三会" ? GanC.from(m.needGan) : undefined;
  }
  /** 中神 (三合 帝旺 / 三会 中位). */
  get middle(): ZhiC | undefined {
    const m = this._meta;
    if (m.kind === "三合") return ZhiC.from(m.diwang);
    if (m.kind === "三会") return ZhiC.from(m.middle);
    return undefined;
  }
  /** 全名 ("子丑合化土" / "亥卯未三合木局" / "寅卯辰三会木局" / "巳酉暗合"). */
  get name(): string {
    const m = this._meta;
    switch (m.kind) {
      case "六合": return `${this._seq}合化${m.hua}`;
      case "三合": return `${this._seq}三合${m.hua}局`;
      case "三会": return `${this._seq}三会${m.hua}局`;
      case "暗合": return `${this._seq}暗合`;
    }
  }

  /** 获取专属元数据. */
  meta(): HeHuiMeta { return this._meta; }

  /**
   * triple 的 2 支子集及其名目 —— 三合 生+旺/旺+墓 为半合, 生+墓 为拱合;
   * 三会 首+末 为拱会. 六合/暗合 本身即 pair, 返回空.
   */
  subsets(): readonly HeHuiSubset[] {
    const m = this._meta;
    const pair = (a: Zhi, b: Zhi, sub: string, name: string): HeHuiSubset => ({
      mask: zhiMask([a, b]),
      zhis: [ZhiC.from(a), ZhiC.from(b)],
      sub, name,
    });
    if (m.kind === "三合") {
      const { changsheng: a, diwang: b, mu: c, hua } = m;
      return [
        pair(a, b, "生地半合", `${a}${b}半合${hua}局`),
        pair(b, c, "墓地半合", `${b}${c}半合${hua}局`),
        pair(a, c, "拱合", `${a}${c}拱合${b}`),
      ];
    }
    if (m.kind === "三会") {
      const { head: a, tail: c } = m;
      return [pair(a, c, "拱会", `${a}${c}拱会`)];
    }
    return [];
  }

  // ——— 掩码 → C ———

  /** 六合. md: 合/地支六合.md */
  static readonly 六合: readonly HeHuiC[] = [
    HeHuiC.rule(["子", "丑"], { kind: "六合", hua: "土", alias: "泥合" }),
    HeHuiC.rule(["寅", "亥"], { kind: "六合", hua: "木", alias: "破合" }),
    HeHuiC.rule(["卯", "戌"], { kind: "六合", hua: "火", alias: "淫合" }),
    HeHuiC.rule(["辰", "酉"], { kind: "六合", hua: "金", alias: "荣合" }),
    HeHuiC.rule(["巳", "申"], { kind: "六合", hua: "水", alias: "贤合" }),
    HeHuiC.rule(["午", "未"], { kind: "六合", hua: "火土", alias: "和合" }),
  ];

  /** 三合 (长生 + 帝旺 + 墓). md: 合/地支三合.md */
  static readonly 三合: readonly HeHuiC[] = [
    HeHuiC.rule(["亥", "卯", "未"], { kind: "三合", hua: "木", changsheng: "亥", diwang: "卯", mu: "未", needGan: "乙" }),
    HeHuiC.rule(["寅", "午", "戌"], { kind: "三合", hua: "火", changsheng: "寅", diwang: "午", mu: "戌", needGan: "丁" }),
    HeHuiC.rule(["巳", "酉", "丑"], { kind: "三合", hua: "金", changsheng: "巳", diwang: "酉", mu: "丑", needGan: "辛" }),
    HeHuiC.rule(["申", "子", "辰"], { kind: "三合", hua: "水", changsheng: "申", diwang: "子", mu: "辰", needGan: "癸" }),
  ];

  /** 三会 (方局). md: 会/地支三会.md */
  static readonly 三会: readonly HeHuiC[] = [
    HeHuiC.rule(["寅", "卯", "辰"], { kind: "三会", hua: "木", fang: "东方", head: "寅", middle: "卯", tail: "辰", needGan: "乙" }),
    HeHuiC.rule(["巳", "午", "未"], { kind: "三会", hua: "火", fang: "南方", head: "巳", middle: "午", tail: "未", needGan: "丁" }),
    HeHuiC.rule(["申", "酉", "戌"], { kind: "三会", hua: "金", fang: "西方", head: "申", middle: "酉", tail: "戌", needGan: "辛" }),
    HeHuiC.rule(["亥", "子", "丑"], { kind: "三会", hua: "水", fang: "北方", head: "亥", middle: "子", tail: "丑", needGan: "癸" }),
  ];

  /** 暗合 (两支藏干暗成五合). md: 合/地支暗合.md */
  static readonly 暗合: readonly HeHuiC[] = [
    HeHuiC.rule(["子", "戌"], { kind: "暗合", hua: "火", cangHe: "癸戊合" }),
    HeHuiC.rule(["子", "辰"], { kind: "暗合", hua: "火", cangHe: "癸戊合" }),
    HeHuiC.rule(["子", "巳"], { kind: "暗合", hua: "火", cangHe: "癸戊合" }),
    HeHuiC.rule(["丑", "寅"], { kind: "暗合", hua: "土", cangHe: "甲己合" }),
    HeHuiC.rule(["寅", "午"], { kind: "暗合", hua: "土", cangHe: "甲己合" }),
    HeHuiC.rule(["寅", "未"], { kind: "暗合", hua: "土", cangHe: "甲己合" }),
    HeHuiC.rule(["卯", "申"], { kind: "暗合", hua: "金", cangHe: "乙庚合" }),
    HeHuiC.rule(["巳", "酉"], { kind: "暗合", hua: "水", cangHe: "丙辛合" }),
    HeHuiC.rule(["午", "亥"], { kind: "暗合", hua: "木", cangHe: "丁壬合" }),
  ];

  /** 全部关系. */
  static readonly rules: readonly HeHuiC[] = [
    ...HeHuiC.六合, ...HeHuiC.三合, ...HeHuiC.三会, ...HeHuiC.暗合,
  ];

  /** 掩码 → 该组支的全部关系. */
  static readonly map: ReadonlyMap<ZhiMask, readonly HeHuiC[]> = (() => {
    const m = new Map<ZhiMask, HeHuiC[]>();
    for (const r of HeHuiC.rules) {
      const arr = m.get(r.mask);
      if (arr) arr.push(r); else m.set(r.mask, [r]);
    }
    return m;
  })();



  /** 查一组支命中的全部关系 (顺序无关). */
  static at(...zhis: ZhiC[]): readonly HeHuiC[] {
    return HeHuiC.map.get(zhiMask(zhis)) ?? [];
  }



  /** 批量推断 — 一串地支 → 全部命中及其下标. */
  static infer(zhis: readonly ZhiC[]): readonly Hit<HeHuiC>[] {
    return inferHits(HeHuiC.rules, zhis);
  }


  /**
   * 批量推断 triple 的 2 支子集 (半合 / 拱合 / 拱会) —— 局不齐也能命中.
   * 三支齐全时子集与整局并出, 同 地支三合/三会 的行为.
   */
  static inferSubsets(zhis: readonly ZhiC[]): readonly {
    rule: HeHuiC; sub: string; name: string; slots: readonly number[];
  }[] {
    const slotsOf = slotIndex(zhis);
    const mask = zhiMask(zhis);
    const out: { rule: HeHuiC; sub: string; name: string; slots: readonly number[] }[] = [];
    for (const rule of HeHuiC.rules) {
      for (const sub of rule.subsets()) {
        if ((mask & sub.mask) !== sub.mask) continue;     // ← 同样一个 &
        // 两支各自可能重出, 故取笛卡尔积, 每组合一条
        for (const a of slotsOf.get(sub.zhis[0])!) {
          for (const b of slotsOf.get(sub.zhis[1])!) {
            out.push({ rule, sub: sub.sub, name: sub.name, slots: [a, b].sort((x, y) => x - y) });
          }
        }
      }
    }
    return out;
  }

}

// ———————————————————————————————————————————————
// DiZhiDetector — 检测算法入口
// ———————————————————————————————————————————————
// XPCHC / HeHuiC 是具体类型入口 (各管四类关系, 各自的掩码表与元数据);
// 本类是算法入口: 一次输入一串地支, 两族一并推断, 结果按类归拢.
// 类 / 族 / 柱 / 支 一律用位表示, 故筛选皆是一次按位与, 不作字符串比较.

/** 八类关系名 (XPCH 四 + 合会 四). */
export type DiZhiRelKind = XPCHKind | HeHuiKind;

/** 关系类位表 — 八类各占 1 bit (bit0..bit7). */
export const REL_BITS = createBitList(
  ["相刑", "相破", "相冲", "相害", "六合", "三合", "三会", "暗合"] as const,
  8,
);
/** 一组关系类的位掩码. */
export type RelMask = number;
/** 把关系类压成掩码. */
export function relMask(kinds: readonly DiZhiRelKind[]): RelMask {
  return REL_BITS.encode([...kinds]);
}
/** 单个类的位. */
function relBit(kind: DiZhiRelKind): RelMask {
  return REL_BITS.encode([kind]);
}

/** 族位表 — XPCH / 合会 各占 1 bit. */
export const FAMILY_BITS = createBitList(["XPCH", "合会"] as const, 2);
/** 族名. */
export type DiZhiFamily = (typeof FAMILY_BITS.items)[number];

/** 一条检测结果 — 抹平两族差异, 供统一消费. */
export interface DiZhiHit {
  /** 八类之一. */
  readonly kind: DiZhiRelKind;
  /** 该类的位. */
  readonly kindBit: RelMask;
  /** 该族的位. */
  readonly familyBit: number;
  /** 关系的地支掩码. */
  readonly zhiMask: ZhiMask;
  /** 涉及柱的下标掩码 (bit i = 占第 i 柱). */
  readonly slotMask: number;
  /** 全名 ("寅巳相害" / "亥卯未三合木局"). */
  readonly name: string;
  /** 涉及的支. */
  readonly zhis: readonly ZhiC[];
  /** 命中的下标 (升序). */
  readonly slots: readonly number[];
  /** 所属族. */
  readonly family: DiZhiFamily;
  /** 具体关系 — 需取专属元数据时用 rule.meta(). */
  readonly rule: XPCHC | HeHuiC;
}

/** triple 的 2 支子集命中 (半合 / 拱合 / 拱会). */
export interface DiZhiSubsetHit {
  readonly sub: string;
  readonly name: string;
  readonly slots: readonly number[];
  readonly rule: HeHuiC;
}

/** 检测结果全集. */
export interface DiZhiReport {
  /** 输入的地支序列. */
  readonly zhis: readonly ZhiC[];
  /** 输入的地支掩码. */
  readonly mask: ZhiMask;
  /** 命中的全部关系类之掩码 —— 一次按位与即知"有没有某类". */
  readonly kinds: RelMask;
  /** 全部命中 (两族合并). */
  readonly hits: readonly DiZhiHit[];
  /** triple 的 2 支子集命中. */
  readonly subsets: readonly DiZhiSubsetHit[];
}

const norm = (h: Hit<XPCHC> | Hit<HeHuiC>, family: DiZhiFamily): DiZhiHit => ({
  kind: h.rule.kind,
  kindBit: relBit(h.rule.kind),
  familyBit: FAMILY_BITS.encode([family]),
  zhiMask: h.rule.mask,
  slotMask: slotsToMask(h.slots),
  name: h.rule.name,
  zhis: h.rule.zhis,
  slots: h.slots,
  family,
  rule: h.rule,
});

/**
 * 地支关系检测 — 算法入口.
 * 输入一串地支 (四柱, 或含岁运的更长序列), 一次推断出全部八类关系.
 */
export class DiZhiDetector {
  private constructor(public readonly report: DiZhiReport) { }

  /** 跑一遍检测. */
  static detect(zhis: readonly ZhiC[]): DiZhiDetector {
    const hits = [
      ...XPCHC.infer(zhis).map((h) => norm(h, "XPCH")),
      ...HeHuiC.infer(zhis).map((h) => norm(h, "合会")),
    ];
    const subsets = HeHuiC.inferSubsets(zhis).map(({ rule, sub, name, slots }) => ({
      rule, sub, name, slots,
    }));
    const kinds = hits.reduce((m, h) => m | h.kindBit, 0);
    return new DiZhiDetector({ zhis: [...zhis], mask: zhiMask(zhis), kinds, hits, subsets });
  }

  /** 全部命中. */
  get hits(): readonly DiZhiHit[] { return this.report.hits; }
  /** triple 子集命中. */
  get subsets(): readonly DiZhiSubsetHit[] { return this.report.subsets; }
  /** 命中的全部关系类之掩码. */
  get kinds(): RelMask { return this.report.kinds; }

  /** 有无这几类中的任一 —— 掩码或起来一次判定, 不必遍历命中. */
  has(...kinds: DiZhiRelKind[]): boolean {
    return (this.report.kinds & relMask(kinds)) !== 0;
  }

  /** 命中了哪几类 (按 REL_BITS 位序). */
  kindList(): readonly DiZhiRelKind[] {
    return REL_BITS.decode(this.report.kinds);
  }

  /** 取这几类的命中 —— 一个掩码筛全部. */
  byKind(...kinds: DiZhiRelKind[]): readonly DiZhiHit[] {
    const m = relMask(kinds);
    return this.report.hits.filter((h) => (h.kindBit & m) !== 0);
  }

  /** 取某族的命中. */
  byFamily(family: DiZhiFamily): readonly DiZhiHit[] {
    const bit = FAMILY_BITS.encode([family]);
    return this.report.hits.filter((h) => (h.familyBit & bit) !== 0);
  }

  /** 涉及这几柱中任一柱的命中 —— 柱也是位. */
  bySlot(...slots: number[]): readonly DiZhiHit[] {
    const m = slotsToMask(slots);
    return this.report.hits.filter((h) => (h.slotMask & m) !== 0);
  }

  /** 涉及这几支中任一支的命中 —— 支也是位. */
  byZhi(...zhis: ZhiC[]): readonly DiZhiHit[] {
    const m = zhiMask(zhis);
    return this.report.hits.filter((h) => (h.zhiMask & m) !== 0);
  }
}
