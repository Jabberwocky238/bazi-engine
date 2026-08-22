/**
 * 墓库 (开 / 闭 / 静).
 * md: 墓库/墓库总论.md + 开库.md + 闭库.md + 出库.md
 *
 *   辰 = 水库 (癸), 未 = 木库 (乙), 戌 = 火库 (丁), 丑 = 金库 (辛)
 *
 *   开启路径:
 *     - 墓气透干无冲克         → 自动开库
 *     - 被对冲支冲 / 丑戌未三刑 → 冲 / 刑 开库
 *     - 特定天干组合冲开天库    → 丁癸 开辰戌, 乙辛 开未丑
 *   封闭路径:
 *     - 墓气透干 + 特定天干合   → 戊癸合辰, 乙庚合未, 丁壬合戌, 丙辛合丑
 *   默认:
 *     - 墓气未透 → 闭库
 */
import { GAN, ZHI, type Gan, type Pillar, type WuXing, type Zhi, type Muku } from "@/types.ts";
import { createTable, type Table } from "@/bitmap.ts";
import {
  POS_NAMES, hasGan, openersByZhi,
  type ExtraPillar, type FindingMod,
} from "./common.ts";

// ———————————————————————————————————————————————
// 结构化类型 — detect 返回 MuKuFinding[]
// ———————————————————————————————————————————————
// 墓库为单一子类别, 状态由 透墓气 / 被冲 / 被刑 / 天干冲开 / 天干合闭 组合决定.
// 旧版把状态压进 state, 各触发标志只在 note 字符串里描述.

/** 墓库状态. */
export type MuKuState =
  | "静库"       // 墓气透但既未纯开也未合闭 (兜底)
  | "自动开库"   // 墓气透干无冲克
  | "冲刑开库"   // 被对冲支冲 / 丑戌未三刑
  | "天干冲开"   // 丁癸 冲开辰戌, 乙辛 冲开未丑
  | "天干合闭"   // 戊癸合辰 / 乙庚合未 / 丁壬合戌 / 丙辛合丑
  | "闭库";      // 墓气未透

interface KuInfo {
  readonly benqi: Gan;
  readonly zhongqi: Gan;
  readonly yuqi: Gan;
  readonly muqi: Gan;
  readonly muqiWx: WuXing;
  readonly name: string;
}

const MUKU: Readonly<Partial<Record<Zhi, KuInfo>>> = {
  辰: { benqi: "戊", zhongqi: "乙", yuqi: "癸", muqi: "癸", muqiWx: "水", name: "水库" },
  未: { benqi: "己", zhongqi: "丁", yuqi: "乙", muqi: "乙", muqiWx: "木", name: "木库" },
  戌: { benqi: "戊", zhongqi: "辛", yuqi: "丁", muqi: "丁", muqiWx: "火", name: "火库" },
  丑: { benqi: "己", zhongqi: "癸", yuqi: "辛", muqi: "辛", muqiWx: "金", name: "金库" },
};

/** Static lookup for callers that need the four treasury definitions. */
export const MUKU_TABLE = Object.freeze(MUKU);

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

export interface MuKuFinding {
  kind: "墓库";
  name: string;                 // "辰 · 水库"
  slots: readonly [number];
  state: MuKuState;
  /** 库支. */
  zhi: Zhi;
  /** 库名 (水库/木库/火库/金库). */
  kuName: string;
  /** 墓气天干. */
  muqi: Gan;
  /** 墓气五行. */
  muqiWx: WuXing;
  /** 墓气是否透干. */
  touMuqi: boolean;
  /** 被对冲支冲 (辰↔戌, 丑↔未). */
  beingChong: boolean;
  /** 被丑戌未三刑. */
  xingOpen: boolean;
  /** 天干冲开天库 (丁癸/乙辛). */
  tianChongOpen: boolean;
  /** 天干合闭天库. */
  tianHeClose: boolean;
  /** extras 中与本柱地支六冲 → 冲开. */
  opened?: FindingMod[];
}

/** 对冲支 (辰↔戌, 丑↔未). */
const CHONG_PAIR: Readonly<Record<string, string>> = {
  辰: "戌", 戌: "辰", 丑: "未", 未: "丑",
};

/** 天干冲开天库. md: 开库.md — 丁癸 冲开辰戌, 乙辛 冲开未丑. */
const TIAN_CHONG_OPEN: Readonly<Record<string, readonly string[]>> = {
  丁癸: ["辰", "戌"],
  乙辛: ["未", "丑"],
};

/** 天干合闭天库. md: 闭库.md. */
const TIAN_HE_CLOSE: Readonly<Record<string, string>> = {
  戊癸: "辰", 乙庚: "未", 丁壬: "戌", 丙辛: "丑",
};

function detect(pillars: Pillar[], extras: ExtraPillar[] = []): MuKuFinding[] {
  const out: MuKuFinding[] = [];
  const zhiSet = pillars.map((p) => p.zhi);

  for (const [zhi, ku] of Object.entries(MUKU) as [Zhi, KuInfo][]) {
    const idx = zhiSet.indexOf(zhi);
    if (idx < 0) continue;

    const touMuqi = hasGan(pillars, ku.muqi);
    const chongCounterpart = CHONG_PAIR[zhi]!;
    const beingChong = zhiSet.includes(chongCounterpart as Zhi);
    // 丑戌未 三刑的两两组合 (库被刑)
    const xingOpen = (zhi === "丑" && zhiSet.includes("戌")) ||
      (zhi === "戌" && zhiSet.includes("未")) ||
      (zhi === "未" && zhiSet.includes("丑"));

    let tianChongOpen = false;
    for (const [pair, zhis] of Object.entries(TIAN_CHONG_OPEN)) {
      if (zhis.includes(zhi) && hasGan(pillars, pair[0]! as Gan) && hasGan(pillars, pair[1]! as Gan) && touMuqi) {
        tianChongOpen = true;
        break;
      }
    }

    let tianHeClose = false;
    for (const [pair, targetZhi] of Object.entries(TIAN_HE_CLOSE)) {
      if (targetZhi === zhi && hasGan(pillars, pair[0]! as Gan) && hasGan(pillars, pair[1]! as Gan) && touMuqi) {
        tianHeClose = true;
        break;
      }
    }

    let state: MuKuState = "静库";
    if (touMuqi && !beingChong && !xingOpen && !tianHeClose) {
      state = "自动开库";
    } else if (beingChong || xingOpen) {
      state = "冲刑开库";
    } else if (tianChongOpen) {
      state = "天干冲开";
    } else if (tianHeClose) {
      state = "天干合闭";
    } else if (!touMuqi) {
      state = "闭库";
    }

    const f: MuKuFinding = {
      kind: "墓库",
      name: `${zhi} · ${ku.name}`,
      slots: [idx],
      state,
      zhi,
      kuName: ku.name,
      muqi: ku.muqi,
      muqiWx: ku.muqiWx,
      touMuqi,
      beingChong,
      xingOpen,
      tianChongOpen,
      tianHeClose,
    };
    const opn = openersByZhi(zhi, extras);
    if (opn.length) f.opened = opn;
    out.push(f);
  }
  return out;
}

/** Return the finding for a specific treasury, if it exists in the chart. */
export function findByZhi(
  findings: readonly MuKuFinding[],
  zhi: Zhi,
): MuKuFinding | undefined {
  return findings.find((finding) => finding.zhi === zhi);
}

/** Whether a finding represents an opened treasury state. */
export function isOpen(finding: Pick<MuKuFinding, "state">): boolean {
  return finding.state !== "闭库";
}

/** Compact state counts for reports and UI summaries. */
export function summarize(findings: readonly MuKuFinding[]): Readonly<Record<MuKuState, number>> {
  const summary: Record<MuKuState, number> = {
    "静库": 0,
    "自动开库": 0,
    "冲刑开库": 0,
    "天干冲开": 0,
    "天干合闭": 0,
    "闭库": 0,
  };
  for (const finding of findings) summary[finding.state] += 1;
  return summary;
}

export const 墓库 = { name: "墓库", detect, findByZhi, isOpen, summarize } as const;
