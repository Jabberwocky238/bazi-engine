/**
 * 墓库 (开 / 闭 / 入墓).
 * md: 墓库/墓库总论.md + 墓气与余气.md + 开库.md + 闭库.md + 出库.md
 *
 *   辰 = 水库 (墓气癸), 未 = 木库 (乙), 戌 = 火库 (丁), 丑 = 金库 (辛)
 *   墓气 = 三合局旺神的阴天干, 即该库的余气; 只有墓气是"被封存"的,
 *   本气土与中气性质同普通藏干, 可随时与外界作用.
 *
 * 状态与触发方式对齐 闭库.md「开闭库的总体原则」表:
 *
 *   自动开库     墓气透干露支 + 无冲克
 *   自动闭库     墓气透干露支 + 遇冲克 (逃入库中避难)
 *   强行开库     地支冲、刑、破、害
 *   合会闭库     六合、三合、半三合、三会
 *   再冲闭库     已开库状态下再次冲刑 (开关效应)
 *   开天库       墓气透干 + 阴天干相冲 (丁癸冲辰戌, 乙辛冲未丑)
 *   闭天库       墓气透干 + 阴天干相合 (戊癸合辰, 乙庚合未, 丁壬合戌, 丙辛合丑)
 *   入墓 —— 墓气既不透干也不露支, 始终困于墓中, 库反成其保护 (开库.md 四种判断之一).
 *
 * 文档的「毁库」(过量刑冲) 未实现: 其阈值需结合月令旺衰与力量对比,
 * 文档未给可判定的通用条件, 故不作猜测.
 * 同理本模块只给结构性状态, 不判旺衰强弱 —— 那需要月令层的计算.
 *
 * 本模块只判定状态; 岁运引起的态变由 mukuShift 给出 (前后两次判定之差).
 */
import { GAN, ZHI, GANZHI_BITS, GanC, PillarC, type Gan, type GanZhiMask, type WuXing, type Zhi, type Muku } from "@/types";
import { TianGanC } from "./天干.ts";
import { createTable, createBitList, type Table } from "@/bitmap";

// ———————————————————————————————————————————————
// 状态类型
// ———————————————————————————————————————————————
// 墓库为单一子类别, 状态由下列标志的组合决定 (见 MUKU_FLAG_BITS).

/** 墓库状态. */
export type MuKuState =
  | "自动开库"   // 墓气透干露支 + 无冲克
  | "自动闭库"   // 墓气透干露支 + 遇冲克, 逃入库中避难
  | "强行开库"   // 地支冲、刑、破、害
  | "合会闭库"   // 六合、三合、半三合、三会
  | "再冲闭库"   // 已开库状态下再次冲刑 (开关效应)
  | "开天库"     // 墓气透干 + 阴天干相冲
  | "闭天库"     // 墓气透干 + 阴天干相合
  | "入墓";      // 墓气既不透干也不露支

/** 状态是否为「开」(库中墓气可参与作用). */
export function isOpenState(state: MuKuState): boolean {
  return state === "自动开库" || state === "强行开库" || state === "开天库";
}

// ———————————————————————————————————————————————
// 状态判定 — 触发标志 + 规则链定状态
// ———————————————————————————————————————————————
// 库只决定标志怎么算 (见 MUKU_RULES), 不影响标志组合如何定状态.

/** 状态标志位 — 每个标志各占 1 bit. */
export const MUKU_FLAG_BITS = createBitList(
  [
    "透墓气",     // 墓气透干
    "露墓气",     // 墓气露支 (同五行的支现于盘中)
    "墓气受克",   // 透/露的墓气被冲克 -> 自动入库
    "被冲", "被刑", "被破", "被害",
    "合会",       // 库支逢 六合/三合/半合/三会
    "天干冲开", "天干合闭",
  ] as const,
);

/** 单个标志名. */
export type MuKuFlag = (typeof MUKU_FLAG_BITS.items)[number];
/** 标志组合. */
export type MuKuFlags = Partial<Record<MuKuFlag, boolean>>;

/** 规则链 — 顺序即优先级, 首个命中者定状态. */
const MUKU_STATE_RULES: readonly (readonly [MuKuState, (f: Required<MuKuFlags>) => boolean])[] = [
  // 墓气全不现 -> 入墓 (库反为其保护); 开闭无从谈起, 故最先判.
  ["入墓", (f) => !f.透墓气 && !f.露墓气],
  // 已开库状态下再次冲刑 -> 闭 (开关效应).
  ["再冲闭库", (f) => f.被冲 && f.被刑],
  // 文档「已开库遇相合相会 -> 闭库」, 故先于强行开库判.
  ["合会闭库", (f) => f.合会],
  ["强行开库", (f) => f.被冲 || f.被刑 || f.被破 || f.被害],
  // 天干一路 (需墓气透干).
  ["闭天库", (f) => f.天干合闭],
  ["开天库", (f) => f.天干冲开],
  // 墓气现: 遇冲克则逃入库中自动闭, 无冲克则自动开.
  ["自动闭库", (f) => f.墓气受克],
  ["自动开库", (f) => f.透墓气 || f.露墓气],
];

/** 判定状态. */
export function mukuState(flags: MuKuFlags): MuKuState {
  const f = Object.fromEntries(
    MUKU_FLAG_BITS.items.map((item) => [item, flags[item] ?? false]),
  ) as Required<MuKuFlags>;
  // 规则链已穷尽: 首条 入墓 与末条 自动开库 互补, 必有一条命中.
  return MUKU_STATE_RULES.find(([, hit]) => hit(f))![0];
}

/** Ordered treasury table, aligned with MUKU_ZHI_KEYS. */
export type MuKuQi = "本气" | "中气" | "余气" | null;
export const MUKU_QI_TABLE = [
  [null, null, null, null, null, null, null, null, null, null, null, null],
  [null, null, null, null, "中气", null, null, "余气", null, null, null, null],
  [null, null, null, null, null, null, null, null, null, null, null, null],
  [null, null, null, null, null, null, null, "中气", null, null, "余气", null],
  [null, null, null, null, "本气", null, null, null, null, null, "本气", null],
  [null, "本气", null, null, null, null, null, "本气", null, null, null, null],
  [null, null, null, null, null, null, null, null, null, null, null, null],
  [null, "余气", null, null, null, null, null, null, null, null, "中气", null],
  [null, null, null, null, null, null, null, null, null, null, null, null],
  [null, "中气", null, null, "余气", null, null, null, null, null, null, null],
] as const satisfies Table<MuKuQi, [10, 12]>;

export const MUKU_TABLE_WRAPPER = createTable(MUKU_QI_TABLE,GAN,ZHI);

/** 触发一条标志所需的干支 (全部到位才算命中). */
type MuKuRule = readonly [flag: MuKuFlag, zhi: Muku, needs: readonly (Gan | Zhi)[]];

/**
 * 触发规则 — needs 压成掩码后与命盘掩码做子集判定.
 * md: 开库.md (被冲 / 被刑 / 天干冲开) + 闭库.md (天干合闭).
 */
const MUKU_RULES: readonly MuKuRule[] = [
  // 对冲支 (辰↔戌, 丑↔未)
  ["被冲", "辰", ["戌"]], ["被冲", "戌", ["辰"]],
  ["被冲", "丑", ["未"]], ["被冲", "未", ["丑"]],
  // 丑戌未 三刑的两两组合 (库被刑)
  ["被刑", "丑", ["戌"]], ["被刑", "戌", ["未"]], ["被刑", "未", ["丑"]],
  // 四库相破 (辰丑破, 未戌破) 与相害 (丑午害, 辰卯害, 戌酉害, 未子害)
  ["被破", "辰", ["丑"]], ["被破", "丑", ["辰"]],
  ["被破", "未", ["戌"]], ["被破", "戌", ["未"]],
  ["被害", "丑", ["午"]], ["被害", "辰", ["卯"]],
  ["被害", "戌", ["酉"]], ["被害", "未", ["子"]],
  // 合会闭库: 六合 + 三合半合 (库为墓地半合的一端) + 三会末位
  ["合会", "辰", ["酉"]], ["合会", "未", ["午"]],
  ["合会", "戌", ["卯"]], ["合会", "丑", ["子"]],
  ["合会", "辰", ["子"]], ["合会", "未", ["卯"]],
  ["合会", "戌", ["午"]], ["合会", "丑", ["酉"]],
  // 丁癸 冲开辰戌, 乙辛 冲开未丑
  ["天干冲开", "辰", ["丁", "癸"]], ["天干冲开", "戌", ["丁", "癸"]],
  ["天干冲开", "未", ["乙", "辛"]], ["天干冲开", "丑", ["乙", "辛"]],
  // 戊癸合辰, 乙庚合未, 丁壬合戌, 丙辛合丑
  ["天干合闭", "辰", ["戊", "癸"]], ["天干合闭", "未", ["乙", "庚"]],
  ["天干合闭", "戌", ["丁", "壬"]], ["天干合闭", "丑", ["丙", "辛"]],
];

/** 预编译: 规则的 needs → 掩码, 避免每次判定重新 encode. */
const MUKU_RULE_MASKS: readonly (readonly [MuKuFlag, Muku, number])[] = MUKU_RULES.map(
  ([flag, zhi, needs]) => [flag, zhi, GANZHI_BITS.encode([...needs])] as const,
);

/** 命盘掩码 → 某库命中的标志集 (墓气相关标志由 mukuVerdict 补齐). */
export function triggeredFlags(zhi: Muku, mask: GanZhiMask): MuKuFlags {
  const flags: MuKuFlags = {};
  for (const [flag, ruleZhi, need] of MUKU_RULE_MASKS) {
    if (ruleZhi === zhi && (mask & need) === need) flags[flag] = true;
  }
  return flags;
}

// ———————————————————————————————————————————————
// 实盘判定
// ———————————————————————————————————————————————

/** 四墓库. */
export const MUKU_ZHI: readonly Muku[] = ["辰", "未", "戌", "丑"];

/** 库 → 墓气 (余气) 天干. */
export const MU_QI: Readonly<Record<Muku, Gan>> = {
  辰: "癸", 未: "乙", 戌: "丁", 丑: "辛",
};

/** 墓气同五行的地支 (露支判定用). */
const MU_QI_ZHI: Readonly<Record<Muku, readonly Zhi[]>> = {
  辰: ["子", "亥"], 未: ["卯", "寅"], 戌: ["午", "巳"], 丑: ["酉", "申"],
};

/** 一个库在给定命盘下的判定. */
export interface MuKuVerdict {
  readonly zhi: Muku;
  /** 库支是否在盘中; 不在盘则无从谈开闭. */
  readonly present: boolean;
  /** 该库在盘中出现的次数. */
  readonly count: number;
  readonly flags: MuKuFlags;
  readonly state: MuKuState;
  readonly open: boolean;
}

/** 一组柱 → 干支集合掩码. */
export function mukuMask(pillars: readonly PillarC[]): GanZhiMask {
  return pillars.reduce((m, p) => m | p.ganzhiMask(), 0);
}

/** 判定某库在这组柱下的状态. */
export function mukuVerdict(zhi: Muku, pillars: readonly PillarC[]): MuKuVerdict {
  const mask = mukuMask(pillars);
  const flags: MuKuFlags = { ...triggeredFlags(zhi, mask) };
  const qi = MU_QI[zhi];

  // 墓气透干 / 露支.
  if (pillars.some((p) => p.gan.str === qi)) flags.透墓气 = true;
  if (pillars.some((p) => (MU_QI_ZHI[zhi] as readonly string[]).includes(p.zhi.str))) {
    flags.露墓气 = true;
  }
  // 墓气受克: 透出的墓气被天干相克 (逃入库中 -> 自动闭库).
  if (flags.透墓气) {
    const qiC = GanC.from(qi);
    flags.墓气受克 = pillars.some((p) =>
      TianGanC.at(p.gan, qiC).some((r) => r.kind === "相克"));
  }
  const count = pillars.filter((p) => p.zhi.str === zhi).length;

  const state = mukuState(flags);
  return { zhi, present: count > 0, count, flags, state, open: isOpenState(state) };
}

/** 四库在这组柱下的判定. */
export function mukuAll(pillars: readonly PillarC[]): readonly MuKuVerdict[] {
  return MUKU_ZHI.map((z) => mukuVerdict(z, pillars));
}

/** 一次态变 —— 加入某柱后某库状态改变. */
export interface MuKuShift {
  readonly zhi: Muku;
  readonly by: PillarC;
  readonly from: MuKuState;
  readonly to: MuKuState;
  /** 闭→开 = true, 开→闭 = false, 开闭未变但状态名变 = null. */
  readonly opened: boolean | null;
}

/** 某柱 (岁运) 加入后引起的墓库态变; 只报状态确有变化且库在盘中者. */
export function mukuShift(
  pillars: readonly PillarC[],
  extra: PillarC,
): readonly MuKuShift[] {
  const before = mukuAll(pillars);
  const after = mukuAll([...pillars, extra]);
  const out: MuKuShift[] = [];
  for (let i = 0; i < before.length; i++) {
    const b = before[i]!, a = after[i]!;
    if (!b.present && !a.present) continue;
    if (b.state === a.state) continue;
    out.push({
      zhi: b.zhi, by: extra, from: b.state, to: a.state,
      opened: b.open === a.open ? null : a.open,
    });
  }
  return out;
}

/**
 * 穷举六十甲子, 找出所有能改变某库状态的干支组合.
 *
 * 库的「解法」与单条关系不同 —— 它是双向的: 原局闭的可能被冲开,
 * 原局开的可能被合闭, 故不分 dissolvers/breakers, 一律以态变呈现.
 */
export function mukuTransitions(
  pillars: readonly PillarC[],
  zhi: Muku,
): readonly MuKuShift[] {
  const out: MuKuShift[] = [];
  for (const g of GAN) {
    for (const z of ZHI) {
      if (GAN.indexOf(g) % 2 !== ZHI.indexOf(z) % 2) continue;  // 六十甲子
      for (const s of mukuShift(pillars, PillarC.from(g, z, "大运"))) {
        if (s.zhi === zhi) out.push(s);
      }
    }
  }
  return out;
}
