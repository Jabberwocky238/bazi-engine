/**
 * 地支相冲. md: 冲/地支相冲总论.md + 冲/子午冲.md
 *   子午 / 卯酉 / 寅申 / 巳亥 / 辰戌 / 丑未
 *
 * API 全名 "子午相冲", state "相冲".
 */
import type { Pillar, WuXing, Zhi } from "../types.ts";
import {
  adjacent, collectZhis, posRange, dissolversByZhi,
  type ExtraPillar, type FindingMod,
} from "./common.ts";

// ———————————————————————————————————————————————
// 结构化类型 — detect 返回 ChongFinding[]
// ———————————————————————————————————————————————
// 相冲为单一子类别 (state 恒 "相冲"), 有 close 判别 (紧贴力大 vs 隔位力弱).
// 判别信息: 两支 / 五行对冲类型 (水火/木金/驿马/墓库) / 双方五行.
// 旧版把对冲类型压进 note 字符串 ("水火对冲" / "驿马冲" / "墓库冲" …).

/** 六冲类型 — 按双方五行 / 性质分类. */
export type ChongKind =
  | "水火对冲"   // 子午 (水火)
  | "木金对冲"   // 卯酉 (木金)
  | "驿马冲"     // 寅申 / 巳亥
  | "墓库冲";    // 辰戌 / 丑未

export interface ChongFinding {
  kind: "地支相冲";
  name: string;                 // "子午相冲"
  positions: string;            // "年月"
  slots: readonly [number, number];
  state: "相冲";
  /** 紧贴 = 两支相邻. */
  close: boolean;
  /** 冲两支. */
  zhis: readonly [Zhi, Zhi];
  /** 双方五行. */
  wuxing: readonly [WuXing, WuXing];
  /** 冲类型. */
  chongKind: ChongKind;
  /** 墓库冲 (辰戌/丑未) 才有 —— 冲开墓库, 藏干暗动. */
  isMukuChong: boolean;
  dissolved?: FindingMod[];     // extras 六合/半三合 引化
}

import { zhiWuxing } from "./common.ts";

/** [z1, z2, 冲类型, 是否墓库冲]. */
const ZHI_CHONG: Array<[Zhi, Zhi, ChongKind, boolean]> = [
  ["子", "午", "水火对冲", false],
  ["卯", "酉", "木金对冲", false],
  ["寅", "申", "驿马冲", false],
  ["巳", "亥", "驿马冲", false],
  ["辰", "戌", "墓库冲", true],
  ["丑", "未", "墓库冲", true],
];

function detect(pillars: Pillar[], extras: ExtraPillar[] = []): ChongFinding[] {
  const out: ChongFinding[] = [];
  const zhis = collectZhis(pillars);
  for (const [z1, z2, chongKind, isMukuChong] of ZHI_CHONG) {
    const A = zhis.filter((z) => z.zhi === z1);
    const B = zhis.filter((z) => z.zhi === z2);
    for (const a of A) for (const b of B) {
      const pos = [a.pos, b.pos].sort((x, y) => x - y) as [number, number];
      const f: ChongFinding = {
        kind: "地支相冲",
        name: `${z1}${z2}相冲`,
        positions: posRange(pos),
        slots: pos,
        state: "相冲",
        close: adjacent(a.pos, b.pos),
        zhis: [z1, z2],
        wuxing: [zhiWuxing(z1), zhiWuxing(z2)],
        chongKind,
        isMukuChong,
      };
      const dis = dissolversByZhi([z1, z2], extras);
      if (dis.length) f.dissolved = dis;
      out.push(f);
    }
  }
  return out;
}

export const 地支相冲 = { name: "地支相冲", detect } as const;
