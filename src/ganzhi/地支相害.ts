/**
 * 地支相害 (又称 穿). md: 合/相害.md
 *   子未 世家之害
 *   丑午 官鬼相害
 *   寅巳 两强相害
 *   申亥 争嗔之害
 *   卯辰 欺凌之害
 *   酉戌 嫉妒之害
 *
 * API 全名 "寅巳相害", state "相害".
 */
import type { Pillar, Zhi } from "../types.ts";
import {
  adjacent, collectZhis, posRange, dissolversByZhi,
  type ExtraPillar, type FindingMod,
} from "./common.ts";

// ———————————————————————————————————————————————
// 结构化类型 — detect 返回 HaiFinding[]
// ———————————————————————————————————————————————
// 相害 (穿) 为单一子类别 (state 恒 "相害"), 有 close 判别.
// 判别信息: 两支 / 害名 (世家/官鬼/两强/争嗔/欺凌/嫉妒) / 应事侧重.
// 旧版把害名压在 note, 应事侧重压在 EXTRA_NOTES.

/** 六害名. */
export type HaiName =
  | "世家之害"   // 子未
  | "官鬼相害"   // 丑午
  | "两强相害"   // 寅巳
  | "争嗔之害"   // 申亥
  | "欺凌之害"   // 卯辰
  | "嫉妒之害";  // 酉戌

export interface HaiFinding {
  kind: "地支相害";
  name: string;                 // "寅巳相害"
  positions: string;            // "年月"
  slots: readonly [number, number];
  state: "相害";
  /** 紧贴 = 两支相邻. */
  close: boolean;
  /** 害两支. */
  zhis: readonly [Zhi, Zhi];
  /** 害名. */
  haiName: HaiName;
  /** 应事侧重 (旧 EXTRA_NOTES), 可选. */
  yingshi?: string;
  dissolved?: FindingMod[];     // extras 六合/半三合 引化
}

const LIUHAI: Array<[Zhi, Zhi, HaiName, string?]> = [
  ["子", "未", "世家之害", "对骨肉六亲最不利"],
  ["丑", "午", "官鬼相害", "官杀失效; 易怒或残疾"],
  ["寅", "巳", "两强相害", "既合既刑又相害, 庚金六亲注意"],
  ["申", "亥", "争嗔之害", "对婚姻最凶; 动荡变故"],
  ["卯", "辰", "欺凌之害", "年轻欺压年长; 腰脚筋骨"],
  ["酉", "戌", "嫉妒之害", "嫉妒克害; 头面生疮聋哑"],
];

function detect(pillars: Pillar[], extras: ExtraPillar[] = []): HaiFinding[] {
  const out: HaiFinding[] = [];
  const zhis = collectZhis(pillars);
  for (const [a, b, haiName, yingshi] of LIUHAI) {
    const A = zhis.filter((z) => z.zhi === a);
    const B = zhis.filter((z) => z.zhi === b);
    for (const x of A) for (const y of B) {
      const pos = [x.pos, y.pos].sort((p, q) => p - q) as [number, number];
      const f: HaiFinding = {
        kind: "地支相害",
        name: `${a}${b}相害`,
        positions: posRange(pos),
        slots: pos,
        state: "相害",
        close: adjacent(x.pos, y.pos),
        zhis: [a, b],
        haiName,
        yingshi,
      };
      const dis = dissolversByZhi([a, b], extras);
      if (dis.length) f.dissolved = dis;
      out.push(f);
    }
  }
  return out;
}

export const 地支相害 = { name: "地支相害", detect } as const;
