/**
 * 合冲刑害入口. 按三大类别组织, 每类一个子目录:
 *   : 天干五合 · 天干相冲 · 天干相克
 *   : 地支六合 · 地支三合 · 地支三会 · 地支暗合
 *         地支相刑 · 地支相冲 · 地支相破 · 地支相害 · 墓库
 *   : 盖头 · 截脚 · 覆载 (单柱内天干地支作用)
 *
 * 统一签名: detector.detect(pillars, extras) → Finding[].
 *   - pillars: 原局四主柱.
 *   - extras: 岁运柱 (大运 / 流年 / 流月 等); 不需要时传 [] 或省略.
 *
 * extras 引化 / 冲克 / 冲开 已由各 detector 内部直接挂在 Finding 上 (dissolved /
 * impacted / opened), 此层只负责调度 + 聚合, 不做后处理。
 */
import type { Pillar } from "../types.ts";
import type {
  ConflictFinding, ExtraPillar, HeFinding, MuKuFinding,
  WholePillarFinding, ZhengHeFinding,
} from "./common.ts";

export * from "./common.ts";

// --- 天干 ---------------------------------------------------------------
import { 天干五合 } from "./天干五合.ts";
import { 天干相冲 } from "./天干相冲.ts";
import { 天干相克 } from "./天干相克.ts";

// --- 地支 ---------------------------------------------------------------
import { 地支六合 } from "./地支六合.ts";
import { 地支三合 } from "./地支三合.ts";
import { 地支三会 } from "./地支三会.ts";
import { 地支暗合 } from "./地支暗合.ts";
import { 地支相刑 } from "./地支相刑.ts";
import { 地支相冲 } from "./地支相冲.ts";
import { 地支相破 } from "./地支相破.ts";
import { 地支相害 } from "./地支相害.ts";
import { 墓库 } from "./墓库.ts";

// --- 整柱 ---------------------------------------------------------------
import * as 盖头截脚覆载 from "./盖头截脚覆载.ts";

export {
  天干五合, 天干相冲, 天干相克,
  地支六合, 地支三合, 地支三会, 地支暗合,
  地支相刑, 地支相冲, 地支相破, 地支相害, 墓库,
};

export interface GanZhiAnalysis {
  // 合类 (含五合子态 争合/妒合)
  天干五合: (HeFinding | ZhengHeFinding)[];
  地支六合: HeFinding[];
  地支三合: HeFinding[];
  地支三会: HeFinding[];
  地支暗合: HeFinding[];
  // 冲克刑害破类
  天干相冲: ConflictFinding[];
  天干相克: ConflictFinding[];
  地支相冲: ConflictFinding[];
  地支相刑: ConflictFinding[];
  地支相破: ConflictFinding[];
  地支相害: ConflictFinding[];
  // 墓库
  墓库: MuKuFinding[];
  // 整柱
  盖头截脚覆载: [WholePillarFinding?, WholePillarFinding?, WholePillarFinding?, WholePillarFinding?];
}

export function analyzeGanZhi(
  pillars: Pillar[],
  extras: ExtraPillar[] = [],
): GanZhiAnalysis | null {
  if (pillars.length !== 4) return null;
  return {
    天干五合: 天干五合.detect(pillars, extras),
    天干相冲: 天干相冲.detect(pillars, extras),
    天干相克: 天干相克.detect(pillars, extras),
    地支六合: 地支六合.detect(pillars, extras),
    地支三合: 地支三合.detect(pillars, extras),
    地支三会: 地支三会.detect(pillars, extras),
    地支暗合: 地支暗合.detect(pillars, extras),
    地支相刑: 地支相刑.detect(pillars, extras),
    地支相冲: 地支相冲.detect(pillars, extras),
    地支相破: 地支相破.detect(pillars, extras),
    地支相害: 地支相害.detect(pillars, extras),
    墓库: 墓库.detect(pillars, extras),
    盖头截脚覆载: [
      盖头截脚覆载.detect(pillars[0] as Pillar),
      盖头截脚覆载.detect(pillars[1] as Pillar),
      盖头截脚覆载.detect(pillars[2] as Pillar),
      盖头截脚覆载.detect(pillars[3] as Pillar),
    ],
  };
}
