/**
 * 地支相破. md: 克/地支相破相绝.md
 *   子酉 / 卯午 (四帝旺之破)
 *   寅亥 / 巳申 (四长生之破)  — 与六合同支, 合中兼破
 *   辰丑 / 未戌 (四墓库之破)
 *
 * API 全名 "辰丑相破", state "相破". 力量较弱.
 */
import type { Pillar, Zhi } from "../types.ts";
import {
  adjacent, collectZhis, posRange, dissolversByZhi,
  type ExtraPillar, type FindingMod,
} from "./common.ts";

// ———————————————————————————————————————————————
// 结构化类型 — detect 返回 PoFinding[]
// ———————————————————————————————————————————————
// 相破为单一子类别 (state 恒 "相破"), 有 close 判别, 力量较弱.
// 判别信息: 两支 / 破类 (四帝旺/四长生/四墓库之破).
// 旧版把破类 (title) 压在 note 字符串.

/** 破类 — 按地支所处四正/四长生/四墓库分类. */
export type PoLei =
  | "四帝旺之破"  // 子酉 / 卯午
  | "四长生之破"  // 寅亥 / 巳申 (与六合同支, 合中兼破)
  | "四墓库之破"; // 辰丑 / 未戌

export interface PoFinding {
  kind: "地支相破";
  name: string;                 // "辰丑相破"
  positions: string;            // "年月"
  slots: readonly [number, number];
  state: "相破";
  /** 紧贴 = 两支相邻. */
  close: boolean;
  /** 破两支. */
  zhis: readonly [Zhi, Zhi];
  /** 破类. */
  poLei: PoLei;
  dissolved?: FindingMod[];     // extras 六合/半三合 引化
}

const LIUPO: Array<[Zhi, Zhi, PoLei]> = [
  ["子", "酉", "四帝旺之破"],
  ["卯", "午", "四帝旺之破"],
  ["寅", "亥", "四长生之破"],
  ["巳", "申", "四长生之破"],
  ["辰", "丑", "四墓库之破"],
  ["未", "戌", "四墓库之破"],
];

function detect(pillars: Pillar[], extras: ExtraPillar[] = []): PoFinding[] {
  const out: PoFinding[] = [];
  const zhis = collectZhis(pillars);
  for (const [a, b, poLei] of LIUPO) {
    const A = zhis.filter((z) => z.zhi === a);
    const B = zhis.filter((z) => z.zhi === b);
    for (const x of A) for (const y of B) {
      const pos = [x.pos, y.pos].sort((p, q) => p - q) as [number, number];
      const f: PoFinding = {
        kind: "地支相破",
        name: `${a}${b}相破`,
        positions: posRange(pos),
        slots: pos,
        state: "相破",
        close: adjacent(x.pos, y.pos),
        zhis: [a, b],
        poLei,
      };
      const dis = dissolversByZhi([a, b], extras);
      if (dis.length) f.dissolved = dis;
      out.push(f);
    }
  }
  return out;
}

export const 地支相破 = { name: "地支相破", detect } as const;
