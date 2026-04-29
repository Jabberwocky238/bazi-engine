/**
 * 合冲刑害入口. 按三大类别组织, 每类一个子目录:
 *   天干/: 天干五合 · 天干相冲 · 天干相克
 *   地支/: 地支六合 · 地支三合 · 地支三会 · 地支暗合
 *         地支相刑 · 地支相冲 · 地支相破 · 地支相害 · 墓库
 *   整柱/: 盖头 · 截脚 · 覆载 (单柱内天干地支作用)
 *
 * analyzeGanZhi(pillars, extras?) — extras (大运/流年/流月 等岁运柱) 可选:
 *   - 不传 / 空 → 仅返回原局 detector 结果, 等价于旧版.
 *   - 提供时 → 在每个 finding 上挂 dissolved / impacted / opened 状态,
 *     并用 result.extras 列出 extras×主柱 引入的新两两关系.
 */
import type { Pillar, WuXing } from "../types.ts";
import {
  POS_NAMES,
  type ExtraInteraction,
  type ExtraPillar,
  type Finding,
  type FindingMod,
  type Pos,
} from "./common.ts";
import { pairwiseGan, pairwiseZhi } from "./pairwise.ts";

export * from "./common.ts";

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
  /** extras 引入的新两两关系 (extras 提供且非空才有此字段). */
  extras?: ExtraInteraction[];
}

// ———————————————————————————————————————————————
// extras 后处理 — 内部 helper
// ———————————————————————————————————————————————

const HE_KINDS_FOR_IMPACT = ["天干五合", "地支六合", "地支三合", "地支三会"] as const;
const CONFLICT_KINDS_FOR_DISSOLVE = [
  "天干相冲", "天干相克",
  "地支相冲", "地支相刑", "地支相害", "地支相破",
] as const;

function pillarsAt(positions: string, pillars: Pillar[]): Pillar[] {
  const out: Pillar[] = [];
  for (const ch of positions) {
    const i = POS_NAMES.indexOf(ch as Pos);
    if (i >= 0) {
      const p = pillars[i];
      if (p) out.push(p);
    }
  }
  return out;
}

/** 扫描 extras × 主柱 两两关系. */
function scanExtras(pillars: Pillar[], extras: ExtraPillar[]): ExtraInteraction[] {
  const out: ExtraInteraction[] = [];
  for (const e of extras) {
    for (let i = 0; i < pillars.length && i < 4; i++) {
      const p = pillars[i]!;
      const g = pairwiseGan(e.gan, p.gan);
      if (g) out.push({
        kind: g.kind, source: { label: e.label, gz: e.gz },
        target: POS_NAMES[i]!, targetGz: `${p.gan}${p.zhi}`,
        huaWx: g.huaWx, note: g.note,
      });
      const z = pairwiseZhi(e.zhi, p.zhi);
      if (z) out.push({
        kind: z.kind, source: { label: e.label, gz: e.gz },
        target: POS_NAMES[i]!, targetGz: `${p.gan}${p.zhi}`,
        huaWx: z.huaWx, note: z.note,
      });
    }
  }
  return out;
}

/** 冲/克/刑/害/破 的 finding: extras 与参与方 合 → dissolved. */
function annotateDissolved(
  findings: Finding[],
  pillars: Pillar[],
  extras: ExtraPillar[],
  isGanKind: boolean,
): void {
  for (const f of findings) {
    const parts = pillarsAt(f.positions, pillars);
    const mods: FindingMod[] = [];
    for (const e of extras) {
      let via: string | null = null;
      for (const p of parts) {
        if (isGanKind) {
          const r = pairwiseGan(e.gan, p.gan);
          if (r && r.kind === "天干五合") { via = r.note; break; }
        } else {
          const r = pairwiseZhi(e.zhi, p.zhi);
          if (r && (r.kind === "六合" || r.kind === "半三合")) { via = r.note; break; }
        }
      }
      if (via) mods.push({ by: { label: e.label, gz: e.gz }, via });
    }
    if (mods.length) f.dissolved = mods;
  }
}

/** 合 的 finding: extras 与参与方 冲/克 → impacted. */
function annotateImpacted(
  findings: Finding[],
  pillars: Pillar[],
  extras: ExtraPillar[],
  isGanKind: boolean,
): void {
  for (const f of findings) {
    const parts = pillarsAt(f.positions, pillars);
    const mods: FindingMod[] = [];
    for (const e of extras) {
      let via: string | null = null;
      for (const p of parts) {
        if (isGanKind) {
          const r = pairwiseGan(e.gan, p.gan);
          if (r && r.kind === "天干相克") { via = r.note; break; }
        } else {
          const r = pairwiseZhi(e.zhi, p.zhi);
          if (r && r.kind === "六冲") { via = r.note; break; }
        }
      }
      if (via) mods.push({ by: { label: e.label, gz: e.gz }, via });
    }
    if (mods.length) f.impacted = mods;
  }
}

/** 墓库 finding: extras 与本柱地支 六冲 → opened. */
function annotateOpened(
  findings: Finding[],
  pillars: Pillar[],
  extras: ExtraPillar[],
): void {
  for (const f of findings) {
    const parts = pillarsAt(f.positions, pillars);
    const muZhi = parts[0]?.zhi;
    if (!muZhi) continue;
    const mods: FindingMod[] = [];
    for (const e of extras) {
      const r = pairwiseZhi(e.zhi, muZhi);
      if (r && r.kind === "六冲") {
        mods.push({ by: { label: e.label, gz: e.gz }, via: r.note });
      }
    }
    if (mods.length) f.opened = mods;
  }
}

// ———————————————————————————————————————————————
// 入口
// ———————————————————————————————————————————————

export function analyzeGanZhi(
  pillars: Pillar[],
  extras: ExtraPillar[] = [],
): GanZhiAnalysis | null {
  if (pillars.length !== 4) return null;

  const result: GanZhiAnalysis = {
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

  if (extras.length === 0) return result;

  result.extras = scanExtras(pillars, extras);

  for (const k of CONFLICT_KINDS_FOR_DISSOLVE) {
    annotateDissolved(result[k], pillars, extras, k.startsWith("天干"));
  }
  for (const k of HE_KINDS_FOR_IMPACT) {
    annotateImpacted(result[k], pillars, extras, k === "天干五合");
  }
  annotateOpened(result.墓库, pillars, extras);

  return result;
}

/** @deprecated 兼容旧调用; 现已转为 analyzeGanZhi(pillars, extras). */
export const analyzeGanZhiWithExtras = analyzeGanZhi;
