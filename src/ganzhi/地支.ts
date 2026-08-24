import { ZHI, type WuXing, type Zhi } from "@/types.ts";
import { createTable, createBitList, type Table } from "@/bitmap.ts";

export type DiZhiRelation = "六合" | "相冲" | "相破" | "相害" | "自刑" | "半刑" | "相刑" | null;
export const DI_ZHI_RELATION_TABLE = [
  [null,"六合",null,"相刑",null,null,"相冲","相害",null,"相破",null,null],
  ["六合",null,null,null,"相破",null,"相害","半刑",null,null,"半刑",null],
  [null,null,null,null,null,"半刑",null,null,"半刑",null,null,"六合"],
  ["相刑",null,null,null,"相害",null,"相破",null,null,"相冲","六合",null],
  [null,"相破",null,"相害","自刑",null,null,null,"六合","六合","相冲",null],
  [null,null,"半刑",null,null,null,null,null,"六合",null,null,"相冲"],
  ["相冲","相害",null,"相破",null,null,"自刑","六合",null,null,null,null],
  ["相害","半刑",null,null,null,null,"六合",null,null,null,"半刑",null],
  [null,null,"半刑",null,"六合","六合",null,null,null,null,null,"相害"],
  ["相破",null,null,"相冲","六合",null,null,null,null,"自刑","相害",null],
  [null,"半刑",null,"六合","相冲",null,null,"半刑",null,"相害",null,null],
  [null,null,"六合",null,null,"相冲",null,null,"相害",null,null,"自刑"],
] as const satisfies Table<DiZhiRelation, [12, 12]>;
export const DI_ZHI_RELATION_TABLE_WRAPPER = createTable(DI_ZHI_RELATION_TABLE, ZHI, ZHI);

// ———————————————————————————————————————————————
// 地支位表 — 12 支各占 1 bit, 一组支即一个数
// ———————————————————————————————————————————————

/** 地支位表 (bit0..bit11, 位序同 ZHI). */
export const ZHI_BITS = createBitList(ZHI, 12);
/** 一组地支的位掩码. */
export type ZhiMask = number;
/** 把地支压成掩码. */
export function zhiMask(zhis: readonly Zhi[]): ZhiMask {
  return ZHI_BITS.encode([...zhis]);
}

// ———————————————————————————————————————————————
// XPCH — 刑 / 破 / 冲 / 害 (四者皆两支相对, 用 12×12 矩阵)
// ———————————————————————————————————————————————
// 矩阵每格只容一个值, 而 寅巳 兼 相刑与相害, 巳申 兼 六合与相破;
// 故 at() 返回该 pair 的全部关系, 不止矩阵所记的那一个.

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

/** 一条 XPCH 规则: 涉及的支 + 专属元数据. */
type XPCHRule = readonly [zhis: readonly Zhi[], meta: XPCHMeta];

/** 三刑 / 半刑 / 子卯刑 / 自刑. md: 刑/地支相刑总论.md */
const XING_RULES: readonly XPCHRule[] = [
  // 丑未戌 恃势之刑 (土刑) — triple 及其 3 个 pair 子集
  [["丑", "未", "戌"], { kind: "相刑", sub: "三刑", xingName: "恃势之刑", triple: "丑未戌" }],
  [["丑", "未"], { kind: "相刑", sub: "半刑", xingName: "恃势之刑", triple: "丑未戌" }],
  [["未", "戌"], { kind: "相刑", sub: "半刑", xingName: "恃势之刑", triple: "丑未戌" }],
  [["丑", "戌"], { kind: "相刑", sub: "半刑", xingName: "恃势之刑", triple: "丑未戌" }],
  // 寅巳申 无恩之刑 (驿马刑)
  [["寅", "巳", "申"], { kind: "相刑", sub: "三刑", xingName: "无恩之刑", triple: "寅巳申" }],
  [["寅", "巳"], { kind: "相刑", sub: "半刑", xingName: "无恩之刑", triple: "寅巳申" }],
  [["巳", "申"], { kind: "相刑", sub: "半刑", xingName: "无恩之刑", triple: "寅巳申" }],
  [["寅", "申"], { kind: "相刑", sub: "半刑", xingName: "无恩之刑", triple: "寅巳申" }],
  // 子卯 无礼之刑
  [["子", "卯"], { kind: "相刑", sub: "子卯刑", xingName: "无礼之刑" }],
  // 自刑 — 同支重出
  [["辰"], { kind: "相刑", sub: "自刑", xingName: "无礼之刑", desc: "水库碰撞 · 委屈内积、自我贬低; 脾胃消化、抑郁" }],
  [["午"], { kind: "相刑", sub: "自刑", xingName: "无礼之刑", desc: "火焰合一 · 脾气暴躁、完美主义; 心血管眼睛、焦虑失眠" }],
  [["酉"], { kind: "相刑", sub: "自刑", xingName: "无礼之刑", desc: "刀刃互磨 · 冷漠不切实际; 肺呼吸、外伤手术" }],
  [["亥"], { kind: "相刑", sub: "自刑", xingName: "无礼之刑", desc: "江河泛滥 · 忧郁沉溺; 肾泌尿内分泌、情绪困扰" }],
];

/** 六破. md: 克/地支相破相绝.md */
const PO_RULES: readonly XPCHRule[] = [
  [["子", "酉"], { kind: "相破", poLei: "四帝旺之破" }],
  [["卯", "午"], { kind: "相破", poLei: "四帝旺之破" }],
  [["寅", "亥"], { kind: "相破", poLei: "四长生之破" }],
  [["巳", "申"], { kind: "相破", poLei: "四长生之破" }],
  [["辰", "丑"], { kind: "相破", poLei: "四墓库之破" }],
  [["未", "戌"], { kind: "相破", poLei: "四墓库之破" }],
];

/** 六冲. md: 冲/地支相冲总论.md */
const CHONG_RULES: readonly XPCHRule[] = [
  [["子", "午"], { kind: "相冲", chongKind: "水火对冲", isMukuChong: false }],
  [["卯", "酉"], { kind: "相冲", chongKind: "木金对冲", isMukuChong: false }],
  [["寅", "申"], { kind: "相冲", chongKind: "驿马冲", isMukuChong: false }],
  [["巳", "亥"], { kind: "相冲", chongKind: "驿马冲", isMukuChong: false }],
  [["辰", "戌"], { kind: "相冲", chongKind: "墓库冲", isMukuChong: true }],
  [["丑", "未"], { kind: "相冲", chongKind: "墓库冲", isMukuChong: true }],
];

/** 六害 (穿). md: 合/相害.md */
const HAI_RULES: readonly XPCHRule[] = [
  [["子", "未"], { kind: "相害", haiName: "世家之害", yingshi: "对骨肉六亲最不利" }],
  [["丑", "午"], { kind: "相害", haiName: "官鬼相害", yingshi: "官杀失效; 易怒或残疾" }],
  [["寅", "巳"], { kind: "相害", haiName: "两强相害", yingshi: "既合既刑又相害, 庚金六亲注意" }],
  [["申", "亥"], { kind: "相害", haiName: "争嗔之害", yingshi: "对婚姻最凶; 动荡变故" }],
  [["卯", "辰"], { kind: "相害", haiName: "欺凌之害", yingshi: "年轻欺压年长; 腰脚筋骨" }],
  [["酉", "戌"], { kind: "相害", haiName: "嫉妒之害", yingshi: "嫉妒克害; 头面生疮聋哑" }],
];

/** 刑破冲害 全表. */
export const XPCH_RULES: readonly XPCHRule[] = [
  ...XING_RULES, ...PO_RULES, ...CHONG_RULES, ...HAI_RULES,
];

/** pair/triple 的规范键 — 按 ZHI 位序排序后拼接, 使 寅巳 与 巳寅 同键. */
function zhiKey(zhis: readonly Zhi[]): string {
  return [...zhis].sort((a, b) => ZHI.indexOf(a) - ZHI.indexOf(b)).join("");
}

/**
 * 刑破冲害 — 一个实例代表一条规则 (一组支 + 其专属元数据).
 * 同一组支可命中多条 (寅巳 兼 相刑与相害), 故按 key 存数组.
 */
export class XPCHC {
  private constructor(
    /** 涉及的支 (自刑 1 支, pair 2 支, 三刑 3 支). */
    public readonly zhis: readonly Zhi[],
    private readonly _meta: XPCHMeta,
  ) { }

  /** 四类之一. */
  get kind(): XPCHKind { return this._meta.kind; }
  /** 参与支数 (1 = 自刑, 2 = pair, 3 = 三刑). */
  get size(): number { return this.zhis.length; }
  /** 该组支的掩码. */
  get mask(): ZhiMask { return zhiMask(this.zhis); }
  /** 规范键 ("寅巳" / "丑未戌"). */
  get key(): string { return zhiKey(this.zhis); }
  /** 全名 ("寅巳相害" / "丑未戌三刑" / "辰辰相刑"). */
  get name(): string {
    const m = this._meta;
    if (m.kind === "相刑") {
      if (m.sub === "三刑") return `${this.key}三刑`;
      if (m.sub === "自刑") return `${this.zhis[0]}${this.zhis[0]}相刑`;
      return `${this.key}相刑`;
    }
    return `${this.key}${m.kind}`;
  }

  /** 获取专属元数据. */
  meta(): XPCHMeta { return this._meta; }

  static readonly map: ReadonlyMap<string, readonly XPCHC[]> = (() => {
    const m = new Map<string, XPCHC[]>();
    for (const [zhis, meta] of XPCH_RULES) {
      const key = zhiKey(zhis);
      (m.get(key) ?? m.set(key, []).get(key)!).push(new XPCHC(zhis, meta));
    }
    return m;
  })();

  /** 全部规则 (扁平). */
  static all(): readonly XPCHC[] {
    return [...XPCHC.map.values()].flat();
  }

  /** 查一组支命中的全部关系 (顺序无关). 寅巳 → [相刑, 相害]. */
  static at(...zhis: Zhi[]): readonly XPCHC[] {
    return XPCHC.map.get(zhiKey(zhis)) ?? [];
  }

  /** 查一组支在某类下的关系. */
  static of(kind: XPCHKind, ...zhis: Zhi[]): XPCHC | undefined {
    return XPCHC.at(...zhis).find((r) => r.kind === kind);
  }

  /** 某类的全部规则. */
  static byKind(kind: XPCHKind): readonly XPCHC[] {
    return XPCHC.all().filter((r) => r.kind === kind);
  }

  /** 命盘地支掩码 → 全部命中的关系 (组内支全到位才算命中). */
  static hits(mask: ZhiMask): readonly XPCHC[] {
    return XPCHC.all().filter((r) => (mask & r.mask) === r.mask);
  }
}

// ———————————————————————————————————————————————
// 合会 — 六合 / 三合 / 三会 / 暗合 (含 triple, 用组行表)
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
  | { kind: "三合"; hua: WuXing; changsheng: Zhi; diwang: Zhi; mu: Zhi; needGan: string }
  | { kind: "三会"; hua: WuXing; fang: SanHuiFang; head: Zhi; middle: Zhi; tail: Zhi; needGan: string }
  | { kind: "暗合"; hua: WuXing; cangHe: CangHePair };

/** 一条 合会 规则: 涉及的支 + 专属元数据. */
type HeHuiRule = readonly [zhis: readonly Zhi[], meta: HeHuiMeta];

/** 六合. md: 合/地支六合.md */
const LIUHE_RULES: readonly HeHuiRule[] = [
  [["子", "丑"], { kind: "六合", hua: "土", alias: "泥合" }],
  [["寅", "亥"], { kind: "六合", hua: "木", alias: "破合" }],
  [["卯", "戌"], { kind: "六合", hua: "火", alias: "淫合" }],
  [["辰", "酉"], { kind: "六合", hua: "金", alias: "荣合" }],
  [["巳", "申"], { kind: "六合", hua: "水", alias: "贤合" }],
  [["午", "未"], { kind: "六合", hua: "火土", alias: "和合" }],
];

/** 三合 (长生 + 帝旺 + 墓). md: 合/地支三合.md */
const SANHE_RULES: readonly HeHuiRule[] = [
  [["亥", "卯", "未"], { kind: "三合", hua: "木", changsheng: "亥", diwang: "卯", mu: "未", needGan: "乙" }],
  [["寅", "午", "戌"], { kind: "三合", hua: "火", changsheng: "寅", diwang: "午", mu: "戌", needGan: "丁" }],
  [["巳", "酉", "丑"], { kind: "三合", hua: "金", changsheng: "巳", diwang: "酉", mu: "丑", needGan: "辛" }],
  [["申", "子", "辰"], { kind: "三合", hua: "水", changsheng: "申", diwang: "子", mu: "辰", needGan: "癸" }],
];

/** 三会 (方局). md: 会/地支三会.md */
const SANHUI_RULES: readonly HeHuiRule[] = [
  [["寅", "卯", "辰"], { kind: "三会", hua: "木", fang: "东方", head: "寅", middle: "卯", tail: "辰", needGan: "乙" }],
  [["巳", "午", "未"], { kind: "三会", hua: "火", fang: "南方", head: "巳", middle: "午", tail: "未", needGan: "丁" }],
  [["申", "酉", "戌"], { kind: "三会", hua: "金", fang: "西方", head: "申", middle: "酉", tail: "戌", needGan: "辛" }],
  [["亥", "子", "丑"], { kind: "三会", hua: "水", fang: "北方", head: "亥", middle: "子", tail: "丑", needGan: "癸" }],
];

/** 暗合 (两支藏干暗成五合). md: 合/地支暗合.md */
const ANHE_RULES: readonly HeHuiRule[] = [
  [["子", "戌"], { kind: "暗合", hua: "火", cangHe: "癸戊合" }],
  [["子", "辰"], { kind: "暗合", hua: "火", cangHe: "癸戊合" }],
  [["子", "巳"], { kind: "暗合", hua: "火", cangHe: "癸戊合" }],
  [["丑", "寅"], { kind: "暗合", hua: "土", cangHe: "甲己合" }],
  [["寅", "午"], { kind: "暗合", hua: "土", cangHe: "甲己合" }],
  [["寅", "未"], { kind: "暗合", hua: "土", cangHe: "甲己合" }],
  [["卯", "申"], { kind: "暗合", hua: "金", cangHe: "乙庚合" }],
  [["巳", "酉"], { kind: "暗合", hua: "水", cangHe: "丙辛合" }],
  [["午", "亥"], { kind: "暗合", hua: "木", cangHe: "丁壬合" }],
];

/** 合会 全表. */
export const HEHUI_RULES: readonly HeHuiRule[] = [
  ...LIUHE_RULES, ...SANHE_RULES, ...SANHUI_RULES, ...ANHE_RULES,
];

/**
 * 合会 — 一个实例代表一条规则 (一组支 + 其专属元数据).
 * 三合/三会 为 triple, 其 pair 子集经 subsets() 派生 (半合/拱合/拱会).
 */
export class HeHuiC {
  private constructor(
    /** 涉及的支 (六合/暗合 2 支, 三合/三会 3 支). */
    public readonly zhis: readonly Zhi[],
    private readonly _meta: HeHuiMeta,
  ) { }

  /** 四类之一. */
  get kind(): HeHuiKind { return this._meta.kind; }
  /** 参与支数 (2 = 六合/暗合, 3 = 三合/三会). */
  get size(): number { return this.zhis.length; }
  /** 该组支的掩码. */
  get mask(): ZhiMask { return zhiMask(this.zhis); }
  /** 规范键 ("子丑" / "亥卯未"). */
  get key(): string { return zhiKey(this.zhis); }
  /** 化气五行 (六合 午未 为 "火土"). */
  get hua(): LiuHeHua { return this._meta.hua; }
  /** 全名 ("子丑合化土" / "亥卯未三合木局" / "寅卯辰三会木局" / "巳酉暗合"). */
  get name(): string {
    const m = this._meta;
    switch (m.kind) {
      case "六合": return `${this.key}合化${m.hua}`;
      case "三合": return `${this.key}三合${m.hua}局`;
      case "三会": return `${this.key}三会${m.hua}局`;
      case "暗合": return `${this.key}暗合`;
    }
  }

  /** 获取专属元数据. */
  meta(): HeHuiMeta { return this._meta; }

  /**
   * triple 的 2 支子集及其名目 —— 三合 生+旺/旺+墓 为半合, 生+墓 为拱合;
   * 三会 首+末 为拱会. 六合/暗合 本身即 pair, 返回空.
   */
  subsets(): readonly { zhis: readonly [Zhi, Zhi]; sub: string; name: string }[] {
    const m = this._meta;
    if (m.kind === "三合") {
      const { changsheng: a, diwang: b, mu: c, hua } = m;
      return [
        { zhis: [a, b], sub: "生地半合", name: `${a}${b}半合${hua}局` },
        { zhis: [b, c], sub: "墓地半合", name: `${b}${c}半合${hua}局` },
        { zhis: [a, c], sub: "拱合", name: `${a}${c}拱合${b}` },
      ];
    }
    if (m.kind === "三会") {
      const { head: a, tail: c } = m;
      return [{ zhis: [a, c], sub: "拱会", name: `${a}${c}拱会` }];
    }
    return [];
  }

  static readonly map: ReadonlyMap<string, readonly HeHuiC[]> = (() => {
    const m = new Map<string, HeHuiC[]>();
    for (const [zhis, meta] of HEHUI_RULES) {
      const key = zhiKey(zhis);
      (m.get(key) ?? m.set(key, []).get(key)!).push(new HeHuiC(zhis, meta));
    }
    return m;
  })();

  /** 全部规则 (扁平). */
  static all(): readonly HeHuiC[] {
    return [...HeHuiC.map.values()].flat();
  }

  /** 查一组支命中的全部关系 (顺序无关). 巳申 → [六合]. */
  static at(...zhis: Zhi[]): readonly HeHuiC[] {
    return HeHuiC.map.get(zhiKey(zhis)) ?? [];
  }

  /** 查一组支在某类下的关系. */
  static of(kind: HeHuiKind, ...zhis: Zhi[]): HeHuiC | undefined {
    return HeHuiC.at(...zhis).find((r) => r.kind === kind);
  }

  /** 某类的全部规则. */
  static byKind(kind: HeHuiKind): readonly HeHuiC[] {
    return HeHuiC.all().filter((r) => r.kind === kind);
  }

  /** 命盘地支掩码 → 全部命中的关系 (组内支全到位才算命中). */
  static hits(mask: ZhiMask): readonly HeHuiC[] {
    return HeHuiC.all().filter((r) => (mask & r.mask) === r.mask);
  }
}
