/**
 * 天干相冲. md: 冲/天干相冲.md
 *   甲庚 / 乙辛 / 丙壬 / 丁癸 4 组. 戊己居中不冲.
 *
 * 注: API 将天干冲归入 "相克" 而不用 "相冲" 短标, 故与 `天干相克` 在 pair-category
 * 层可能重叠. 本文件保留原始分类定义供展示 / md 对照.
 */
import type { Gan, Pillar, WuXing } from "../types.ts";
import {
  adjacent, collectGans, posRange, dissolversByGan, ganWuxing,
  type ExtraPillar, type FindingMod,
} from "./common.ts";

// ———————————————————————————————————————————————
// 结构化类型 — detect 返回 TianGanChongFinding[]
// ———————————————————————————————————————————————
// 天干相冲 4 组 (甲庚/乙辛/丙壬/丁癸, 戊己居中不冲), 单子类, state "相冲".
// 判别信息: 两干 / 双方五行 / 紧贴. 旧版把紧贴力度压在 note.

export interface TianGanChongFinding {
  kind: "天干相冲";
  name: string;                 // "甲庚相冲"
  positions: string;            // "年月"
  slots: readonly [number, number];
  state: "相冲";
  /** 紧贴 = 两干相邻. */
  close: boolean;
  /** 冲两干. */
  gans: readonly [Gan, Gan];
  /** 双方五行. */
  wuxing: readonly [WuXing, WuXing];
  dissolved?: FindingMod[];     // extras 天干五合 引化
}

const GAN_CHONG: Array<[Gan, Gan]> = [
  ["甲", "庚"], ["乙", "辛"], ["丙", "壬"], ["丁", "癸"],
];

function detect(pillars: Pillar[], extras: ExtraPillar[] = []): TianGanChongFinding[] {
  const out: TianGanChongFinding[] = [];
  const gans = collectGans(pillars);
  for (const [g1, g2] of GAN_CHONG) {
    const A = gans.filter((g) => g.gan === g1);
    const B = gans.filter((g) => g.gan === g2);
    for (const a of A) for (const b of B) {
      const pos = [a.pos, b.pos].sort((x, y) => x - y) as [number, number];
      const f: TianGanChongFinding = {
        kind: "天干相冲",
        name: `${g1}${g2}相冲`,
        positions: posRange(pos),
        slots: pos,
        state: "相冲",
        close: adjacent(a.pos, b.pos),
        gans: [g1, g2],
        wuxing: [ganWuxing(g1), ganWuxing(g2)],
      };
      const dis = dissolversByGan([g1, g2], extras);
      if (dis.length) f.dissolved = dis;
      out.push(f);
    }
  }
  return out;
}

export const 天干相冲 = { name: "天干相冲", detect } as const;
