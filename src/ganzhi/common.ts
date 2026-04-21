/**
 * 合冲刑害共享类型与小工具. 不放具体类别的查表 const —
 * 每个类别的对照表放在各自文件内.
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
import type { Pillar, WuXing } from "../types.ts";
import { ganWuxing } from "../ganzhi.ts";

export type Pos = "年" | "月" | "日" | "时";
export const POS_NAMES: readonly Pos[] = ["年", "月", "日", "时"];

export type FindingKind =
  // 天干
  | "天干五合" | "天干相冲" | "天干相克"
  // 地支
  | "地支六合" | "地支三合" | "地支三会" | "地支暗合"
  | "地支相刑" | "地支相冲" | "地支相破" | "地支相害"
  // 整柱 (柱内干支作用)
  | "盖头" | "截脚" | "覆载"
  // 天干五合 子态
  | "争合" | "妒合"
  // 附加
  | "墓库";

export type FindingQuality = "good" | "bad" | "neutral";

export interface Finding {
  kind: FindingKind;
  /**
   * API 全名, 形如:
   *   "甲己合化土" / "子午相冲" / "巳酉丑三合金局" / "巳酉半合金局"
   *   "巳丑拱合酉" / "寅辰拱会" / "酉酉相刑" / "寅巳相害" / "辰丑相破"
   */
  name: string;
  /** 位置组合, 如 "年月". */
  positions: string;
  /** 紧贴 = 参与柱全部相邻 (差 = 1). */
  close: boolean;
  /** 化气是否成立. */
  transformed?: boolean;
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
