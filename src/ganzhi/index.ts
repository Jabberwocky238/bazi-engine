/**
 * 合冲刑害入口. 按三大类别组织, 每类一个子目录:
 *   天干/: 天干五合 · 天干相冲 · 天干相克
 *   地支/: 地支六合 · 地支三合 · 地支三会 · 地支暗合
 *         地支相刑 · 地支相冲 · 地支相破 · 地支相害 · 墓库
 *   整柱/: 盖头 · 截脚 · 覆载 (单柱内天干地支作用)
 */
import type { Pillar } from "../types.ts";

export type { Pos, Finding, FindingKind, FindingQuality } from "./common.ts";

// --- 天干 ---------------------------------------------------------------
import { 天干五合 } from "./天干/天干五合.ts";
import { 天干相冲 } from "./天干/天干相冲.ts";
import { 天干相克 } from "./天干/天干相克.ts";

// --- 地支 ---------------------------------------------------------------
import { 地支六合 } from "./地支/地支六合.ts";
import { 地支三合 } from "./地支/地支三合.ts";
import { 地支三会 } from "./地支/地支三会.ts";
import { 地支暗合 } from "./地支/地支暗合.ts";
import { 地支相刑 } from "./地支/地支相刑.ts";
import { 地支相冲 } from "./地支/地支相冲.ts";
import { 地支相破 } from "./地支/地支相破.ts";
import { 地支相害 } from "./地支/地支相害.ts";
import { 墓库 } from "./地支/墓库.ts";

// --- 整柱 ---------------------------------------------------------------
import { 盖头 } from "./整柱/盖头.ts";
import { 截脚 } from "./整柱/截脚.ts";
import { 覆载 } from "./整柱/覆载.ts";

export {
  天干五合, 天干相冲, 天干相克,
  地支六合, 地支三合, 地支三会, 地支暗合,
  地支相刑, 地支相冲, 地支相破, 地支相害, 墓库,
  盖头, 截脚, 覆载,
};

import type { Finding } from "./common.ts";

export interface GanZhiAnalysis {
  // 天干
  天干五合: Finding[];
  天干相冲: Finding[];
  天干相克: Finding[];
  // 地支
  地支六合: Finding[];
  地支三合: Finding[];
  地支三会: Finding[];
  地支暗合: Finding[];
  地支相刑: Finding[];
  地支相冲: Finding[];
  地支相破: Finding[];
  地支相害: Finding[];
  墓库: Finding[];
  // 整柱
  盖头: Finding[];
  截脚: Finding[];
  覆载: Finding[];
}

export function analyzeGanZhi(pillars: Pillar[]): GanZhiAnalysis | null {
  if (pillars.length !== 4) return null;
  return {
    天干五合: 天干五合.detect(pillars),
    天干相冲: 天干相冲.detect(pillars),
    天干相克: 天干相克.detect(pillars),
    地支六合: 地支六合.detect(pillars),
    地支三合: 地支三合.detect(pillars),
    地支三会: 地支三会.detect(pillars),
    地支暗合: 地支暗合.detect(pillars),
    地支相刑: 地支相刑.detect(pillars),
    地支相冲: 地支相冲.detect(pillars),
    地支相破: 地支相破.detect(pillars),
    地支相害: 地支相害.detect(pillars),
    墓库:     墓库.detect(pillars),
    盖头:     盖头.detect(pillars),
    截脚:     截脚.detect(pillars),
    覆载:     覆载.detect(pillars),
  };
}
