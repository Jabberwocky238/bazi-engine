/**
 * 干支基础 + 合冲刑害共享类型与小工具.
 *
 * 第一段: 天干 / 地支 五行属性, 地支藏干, 阴阳判断.
 * 第二段: 合冲刑害 detect 共用的类型 / 工具, 不放具体类别的查表 const ——
 *        每个类别的对照表放在各自文件内.
 *
 * 类别编目 (API 权威清单, 共 9 个):
 *   天干: 天干五合 / 天干相克
 *     (天干相冲并入天干相克; API 对天干冲克统一标 "相克")
 *   地支: 地支六合 / 地支三合 / 地支三会 / 地支暗合
 *         地支相刑 / 地支相冲 / 地支相破 / 地支相害
 *
 * 墓库 为工具附加, 不在 API 清单内.
 * 争合 / 妒合 为 天干五合 的子态, 单独成条便于展示.
 */
import type { Gan, Pillar, WuXing, Zhi } from "../types.ts";
import { GAN } from "../types.ts";

// ———————————————————————————————————————————————
// 干支五行 / 藏干 / 阴阳
// ———————————————————————————————————————————————

export const GAN_WUXING: Record<Gan, WuXing> = {
  甲: "木", 乙: "木",
  丙: "火", 丁: "火",
  戊: "土", 己: "土",
  庚: "金", 辛: "金",
  壬: "水", 癸: "水",
};

export const ZHI_WUXING: Record<Zhi, WuXing> = {
  子: "水", 亥: "水",
  寅: "木", 卯: "木",
  巳: "火", 午: "火",
  申: "金", 酉: "金",
  辰: "土", 戌: "土",
  丑: "土", 未: "土",
};

/** 地支藏干 (dataset convention). */
export const CANG_GAN: Readonly<Record<Zhi, readonly Gan[]>> = {
  子: ["癸"],
  丑: ["己", "癸", "辛"],
  寅: ["甲", "丙", "戊"],
  卯: ["乙"],
  辰: ["戊", "乙", "癸"],
  巳: ["丙", "庚", "戊"],
  午: ["丁", "己"],
  未: ["己", "丁", "乙"],
  申: ["庚", "壬", "戊"],
  酉: ["辛"],
  戌: ["戊", "辛", "丁"],
  亥: ["壬", "甲"],
};

/** 阳干: 甲丙戊庚壬 (GAN 索引偶数). */
export function isYangGan(g: Gan): boolean {
  return GAN.indexOf(g) % 2 === 0;
}

export function ganWuxing(g: Gan): WuXing { return GAN_WUXING[g]; }
export function zhiWuxing(z: Zhi): WuXing { return ZHI_WUXING[z]; }

// ———————————————————————————————————————————————
// 合冲刑害 共享类型
// ———————————————————————————————————————————————

export type Pos = "年" | "月" | "日" | "时";
export const POS_NAMES: readonly Pos[] = ["年", "月", "日", "时"];

export type FindingQuality = "good" | "bad" | "neutral";

// ———————————————————————————————————————————————
// extras (大运/流年/流月) 输入 + 关系
// ———————————————————————————————————————————————

/** 岁运柱 — 大运 / 流年 / 流月 等任意标签的单柱输入. */
export interface ExtraPillar {
  /** 任意标签, 通常为 "大运" / "流年" / "流月". */
  label: string;
  gan: Gan;
  zhi: Zhi;
}

/** Finding 状态字段的来源标记 (dissolved / impacted / opened 各自 FindingMod[]). */
export interface FindingMod {
  by: ExtraPillar;
  /** pairwise note, 形如 "申子半三合水" / "甲己合化土" / "辰戌相冲". */
  via: string;
}

// ———————————————————————————————————————————————
// Finding — 按类别拆为四种, 各自只持有自己关心的字段
// ———————————————————————————————————————————————

interface BaseFinding {
  /**
   * API 全名, 形如:
   *   "甲己合化土" / "子午相冲" / "巳酉丑三合金局" / "巳酉半合金局"
   *   "巳丑拱合酉" / "寅辰拱会" / "酉酉相刑" / "寅巳相害" / "辰丑相破"
   */
  name: string;
  /** 位置组合, 如 "年月". */
  positions: string;
  /**
   * 对齐 API short 字段, 形如:
   *   "合化X" / "半合X局" / "拱合X局" / "拱会X局" / "三合X局" / "三会X局"
   *   / "相克" / "相冲" / "相刑" / "自刑" / "相害" / "相破" / "暗合" 等.
   */
  state: string;
  note: string;
  mdKey?: string;
  quality: FindingQuality;
}

/**
 * 合类 (天干五合 / 地支六合 / 地支三合 / 地支三会 / 地支暗合) —
 * 可被 extras 冲克 (六冲 / 天干相克 介入参与方).
 */
export interface HeFinding extends BaseFinding {
  kind: "天干五合" | "地支六合" | "地支三合" | "地支三会" | "地支暗合";
  /** 紧贴 = 参与柱全部相邻 (差 = 1). */
  close: boolean;
  /** 化气是否成立. */
  transformed?: boolean;
  /** 被 extras 冲克 → 合解. */
  impacted?: FindingMod[];
}

/**
 * 冲克刑害破类 (天干相冲 / 天干相克 / 地支相冲 / 地支相刑 / 地支相害 / 地支相破) —
 * 可被 extras 引化 (六合 / 半三合 / 天干五合 介入参与方).
 */
export interface ConflictFinding extends BaseFinding {
  kind: "天干相冲" | "天干相克" | "地支相冲" | "地支相刑" | "地支相害" | "地支相破";
  close: boolean;
  /** 被 extras 引化 → 合解. */
  dissolved?: FindingMod[];
}

/** 墓库 (开 / 闭 / 静) — 可被 extras 冲开. */
export interface MuKuFinding extends BaseFinding {
  kind: "墓库";
  /** extras 中地支与本柱地支六冲 → 冲开. */
  opened?: FindingMod[];
}

/** 整柱 (盖头 / 截脚 / 覆载) */
export interface WholePillarFinding {
  kind: "盖头" | "截脚" | "覆载";
  subfuzai?: "同气" | "得覆" | "得载";
  name: string;
  note: string;
}

/** 争合 / 妒合 — 天干五合 子态, 单独成条便于展示. */
export interface ZhengHeFinding extends BaseFinding {
  kind: "争合" | "妒合";
}

export type Finding =
  | HeFinding
  | ConflictFinding
  | MuKuFinding
  | WholePillarFinding
  | ZhengHeFinding;

export type FindingKind = Finding["kind"];

export interface GanSlot { pos: number; gan: Pillar["gan"] }
export interface ZhiSlot { pos: number; zhi: Pillar["zhi"] }

export function collectGans(pillars: Pillar[]): GanSlot[] {
  return pillars.map((p, i) => ({ pos: i, gan: p.gan }));
}
export function collectZhis(pillars: Pillar[]): ZhiSlot[] {
  return pillars.map((p, i) => ({ pos: i, zhi: p.zhi }));
}

/** 紧贴 = 相邻位 (差 1). */
export function adjacent(i: number, j: number): boolean {
  return Math.abs(i - j) === 1;
}

/** 把位置索引数组压成形如 "年月日" 的串. */
export function posRange(idxs: readonly number[]): string {
  return idxs.map((i) => POS_NAMES[i]).join("");
}

/** 命局天干是否透出指定五行. */
export function isGanTou(pillars: Pillar[], wx: WuXing): boolean {
  return pillars.some((p) => ganWuxing(p.gan) === wx);
}

/** 命局是否有指定天干. */
export function hasGan(pillars: Pillar[], gan: string): boolean {
  return pillars.some((p) => p.gan === gan);
}

// ———————————————————————————————————————————————
// extras 状态助手 — detectors 在生成 Finding 时直接挂状态用
// ———————————————————————————————————————————————

import { pairwiseGan, pairwiseZhi } from "./pairwise.ts";

/** extras 中与本组 zhis 形成 六合 / 半三合 的 → 引化 (合解 冲/克/刑/害/破). */
export function dissolversByZhi(zhis: Iterable<Zhi>, extras: ExtraPillar[]): FindingMod[] {
  const out: FindingMod[] = [];
  for (const e of extras) {
    for (const z of zhis) {
      const r = pairwiseZhi(e.zhi, z);
      if (r && (r.kind === "六合" || r.kind === "半三合")) {
        out.push({ by: e, via: r.note });
        break;
      }
    }
  }
  return out;
}

/** extras 中与本组 gans 形成 天干五合 的 → 引化 (合解 天干冲/克). */
export function dissolversByGan(gans: Iterable<Gan>, extras: ExtraPillar[]): FindingMod[] {
  const out: FindingMod[] = [];
  for (const e of extras) {
    for (const g of gans) {
      const r = pairwiseGan(e.gan, g);
      if (r && r.kind === "天干五合") {
        out.push({ by: e, via: r.note });
        break;
      }
    }
  }
  return out;
}

/** extras 中与本组 zhis 形成 六冲 的 → 冲克 (击破 地支合). */
export function impactorsByZhi(zhis: Iterable<Zhi>, extras: ExtraPillar[]): FindingMod[] {
  const out: FindingMod[] = [];
  for (const e of extras) {
    for (const z of zhis) {
      const r = pairwiseZhi(e.zhi, z);
      if (r && r.kind === "六冲") {
        out.push({ by: e, via: r.note });
        break;
      }
    }
  }
  return out;
}

/** extras 中与本组 gans 形成 天干相克 的 → 冲克 (击破 天干合). */
export function impactorsByGan(gans: Iterable<Gan>, extras: ExtraPillar[]): FindingMod[] {
  const out: FindingMod[] = [];
  for (const e of extras) {
    for (const g of gans) {
      const r = pairwiseGan(e.gan, g);
      if (r && r.kind === "天干相克") {
        out.push({ by: e, via: r.note });
        break;
      }
    }
  }
  return out;
}

/** extras 中与本柱地支 六冲 的 → 冲开 (墓库). */
export function openersByZhi(muZhi: Zhi, extras: ExtraPillar[]): FindingMod[] {
  const out: FindingMod[] = [];
  for (const e of extras) {
    const r = pairwiseZhi(e.zhi, muZhi);
    if (r && r.kind === "六冲") {
      out.push({ by: e, via: r.note });
    }
  }
  return out;
}
