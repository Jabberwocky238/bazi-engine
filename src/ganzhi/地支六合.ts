/**
 * 地支六合. md: 合/地支六合.md
 *   子丑 合化土 (泥合)
 *   寅亥 合化木 (破合)
 *   卯戌 合化火 (淫合)
 *   辰酉 合化金 (荣合)
 *   巳申 合化水 (贤合)
 *   午未 合化火土 (和合)
 *
 * API 表述: 全名 "子丑合化土", state 形如 "合化土" (六合皆按合化描述).
 * 化气硬条件 (紧贴 + 天干透化气) 由 Finding.transformed 反映.
 */
import type { Gan, Pillar, WuXing, Zhi } from "../types.ts";
import {
  adjacent, collectZhis, isGanTou, posRange, impactorsByZhi,
  type ExtraPillar, type FindingMod,
} from "./common.ts";

// ———————————————————————————————————————————————
// 结构化类型 — detect 返回 LiuHeFinding[]
// ———————————————————————————————————————————————
// 六合为单一子类别, 但有 close 判别 (紧贴合绊 vs 隔位虚合).
// 判别信息: 化气 (午未为火土双化气, 余皆单五行) / 别名 / 紧贴 / 是否透干引化.
// 旧版把化气压进 state("合化土"|"合化火土") 与 note 字符串.

/** 六合别名. */
export type LiuHeAlias = "泥合" | "破合" | "淫合" | "荣合" | "贤合" | "和合";

/** 六合化气: 单五行 (子丑土/寅亥木/卯戌火/辰酉金/巳申水) 或 午未 火土双化气. */
export type LiuHeHua = WuXing | "火土";

/** 化气状态: 真化 (紧贴+透化气) / 合绊 (紧贴不引化) / 虚合 (隔位). */
export type LiuHeHuaState = "真化" | "合绊" | "虚合";

export interface LiuHeFinding {
  kind: "地支六合";
  name: string;                 // "子丑合化土" / "午未合化火土"
  positions: string;            // "年月"
  slots: readonly [number, number];
  state: `合化${LiuHeHua}`;     // "合化土" / "合化火土"
  /** 紧贴 = 两支相邻. */
  close: boolean;
  /** 化气. */
  hua: LiuHeHua;
  /** 别名. */
  alias: LiuHeAlias;
  /** 是否透化气 → 真合化. */
  transformed: boolean;
  /** 化气状态. */
  huaState: LiuHeHuaState;
  impacted?: FindingMod[];      // extras 六冲击破
}

const LIUHE: Array<[string, string, string, string]> = [
  ["子", "丑", "土",   "泥合"],
  ["寅", "亥", "木",   "破合"],
  ["卯", "戌", "火",   "淫合"],
  ["辰", "酉", "金",   "荣合"],
  ["巳", "申", "水",   "贤合"],
  ["午", "未", "火土", "和合"],
];

const WUXING_CHARS: readonly WuXing[] = ["木", "火", "土", "金", "水"];

function detect(pillars: Pillar[], extras: ExtraPillar[] = []): LiuHeFinding[] {
  const out: LiuHeFinding[] = [];
  const zhis = collectZhis(pillars);
  for (const [z1, z2, hua, alias] of LIUHE) {
    const A = zhis.filter((z) => z.zhi === z1);
    const B = zhis.filter((z) => z.zhi === z2);
    for (const a of A) for (const b of B) {
      const pos = [a.pos, b.pos].sort((x, y) => x - y) as [number, number];
      const close = adjacent(a.pos, b.pos);
      const huaT = hua as LiuHeHua;
      const aliasT = alias as LiuHeAlias;
      const targetWx = [...hua].filter((c): c is WuXing => (WUXING_CHARS as readonly string[]).includes(c));
      const canHua = close && targetWx.some((w) => isGanTou(pillars, w));
      const huaState: LiuHeHuaState = canHua ? "真化" : close ? "合绊" : "虚合";
      const f: LiuHeFinding = {
        kind: "地支六合",
        name: `${z1}${z2}合化${hua}`,
        positions: posRange(pos),
        slots: pos,
        state: `合化${huaT}`,
        close,
        hua: huaT,
        alias: aliasT,
        transformed: canHua,
        huaState,
      };
      const imp = impactorsByZhi([z1 as Zhi, z2 as Zhi], extras);
      if (imp.length) f.impacted = imp;
      out.push(f);
    }
  }
  return out;
}

export const 地支六合 = { name: "地支六合", detect } as const;
