/**
 * 天干相克. API 对 "同性相克" (甲戊/乙己/丙庚/丁辛/戊壬/己癸/庚甲/辛乙/壬丙/癸丁)
 * 与 md 意义上的 "天干相冲" (甲庚/乙辛/丙壬/丁癸) 统一标 "相克", 故此文件涵盖全部.
 * md: 克/天干相克.md + 冲/天干相冲.md
 *
 * 不要求紧贴 —— 隔位也论相克. 紧贴与否由 Finding.close 反映.
 */
import type { Gan, Pillar, WuXing } from "../types.ts";
import {
  adjacent, collectGans, posRange, dissolversByGan, ganWuxing,
  type ExtraPillar, type FindingMod,
} from "./common.ts";
import { CONTROLS } from "../types.ts";

// ———————————————————————————————————————————————
// 结构化类型 — detect 返回 TianGanKeFinding[]
// ———————————————————————————————————————————————
// 天干相克 10 对同性相克 (含 4 组冲), 单子类, state "相克".
// 判别信息: 两干 / 克方与被克方 (有方向) / 双方五行 / 紧贴.
// 旧版只输出 name("甲戊相克"), 克向信息缺失 (pairwiseGan 有 a克b 但 detect 未保留).

export interface TianGanKeFinding {
  kind: "天干相克";
  name: string;                 // "甲戊相克"
  positions: string;            // "年月"
  slots: readonly [number, number];
  state: "相克";
  /** 紧贴 = 两干相邻. */
  close: boolean;
  /** 相克两干 (按 g1,g2 原序). */
  gans: readonly [Gan, Gan];
  /** 双方五行. */
  wuxing: readonly [WuXing, WuXing];
  /** 克方 (我克者). */
  controller: Gan;
  /** 被克方 (受克者). */
  controlled: Gan;
  dissolved?: FindingMod[];     // extras 天干五合 引化
}

/** 同性相克 10 对 (已涵盖 4 组冲). */
const KE_PAIRS: Array<[Gan, Gan]> = [
  ["甲", "戊"], ["乙", "己"],
  ["丙", "庚"], ["丁", "辛"],
  ["戊", "壬"], ["己", "癸"],
  ["庚", "甲"], ["辛", "乙"],
  ["壬", "丙"], ["癸", "丁"],
];

function detect(pillars: Pillar[], extras: ExtraPillar[] = []): TianGanKeFinding[] {
  const out: TianGanKeFinding[] = [];
  const gans = collectGans(pillars);
  const seen = new Set<string>();
  for (const [g1, g2] of KE_PAIRS) {
    const A = gans.filter((g) => g.gan === g1);
    const B = gans.filter((g) => g.gan === g2);
    for (const a of A) for (const b of B) {
      const key = [a.pos, b.pos].sort((x, y) => x - y).join("-") + `:${[g1, g2].sort().join("")}`;
      if (seen.has(key)) continue;
      seen.add(key);
      const pos = [a.pos, b.pos].sort((x, y) => x - y) as [number, number];
      const wx1 = ganWuxing(g1), wx2 = ganWuxing(g2);
      // g1→g2 为克向 (KE_PAIRS 已按克向排列), 反向断言以保稳健.
      const controller = CONTROLS[wx1] === wx2 ? g1 : g2;
      const controlled = controller === g1 ? g2 : g1;
      const f: TianGanKeFinding = {
        kind: "天干相克",
        name: `${g1}${g2}相克`,
        positions: posRange(pos),
        slots: pos,
        state: "相克",
        close: adjacent(a.pos, b.pos),
        gans: [g1, g2],
        wuxing: [wx1, wx2],
        controller,
        controlled,
      };
      const dis = dissolversByGan([g1, g2], extras);
      if (dis.length) f.dissolved = dis;
      out.push(f);
    }
  }
  return out;
}

export const 天干相克 = { name: "天干相克", detect } as const;
