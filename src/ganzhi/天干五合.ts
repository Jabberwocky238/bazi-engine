/**
 * 天干五合 (含争合 / 妒合).
 * md: 合/天干五合.md + 合/争合.md + 合/妒合.md
 *
 *   甲己 合化土 · 中正之合
 *   乙庚 合化金 · 仁义之合
 *   丙辛 合化水 · 威制之合
 *   丁壬 合化木 · 淫昵之合
 *   戊癸 合化火 · 无情之合
 *
 * API 表述: 全名 "甲己合化土", 类型 "合化土" (凡合皆标合化).
 * 化气硬条件 (md "真化") 在 state 里以 "真化"/"合绊"/"远合" 区分.
 * 即便触发 争合 / 妒合, API 仍单独输出 基础合化 条目, 此处与之对齐.
 */
import type { Gan, Pillar, WuXing } from "../types.ts";
import { GENERATES } from "../wuxing.ts";
import {
  adjacent, collectGans, posRange, POS_NAMES, zhiWuxing,
  impactorsByGan,
  type ExtraPillar, type FindingMod,
} from "./common.ts";

// ———————————————————————————————————————————————
// 结构化类型 — detect 返回 TianGanWuHeFinding[]
// ———————————————————————————————————————————————
// 天干五合有 基础合化 与 争合 两种条目 (妒合 md 有, detect 暂未输出, 不建类型).
// 判别信息: 合对 / 化气 / 别名 / 紧贴 / 化气状态 (真化/合绊/远合) / 争合重复干.
// 旧版把别名 + 化气状态压进 note, 争合信息压进 name("争合 甲甲己") 与 note.

/** 五合别名. */
export type WuHeAlias = "中正之合" | "仁义之合" | "威制之合" | "淫昵之合" | "无情之合";

/** 化气状态: 真化 (紧贴+地支月令引化) / 合绊 (紧贴不引化) / 远合 (隔位虚合). */
export type WuHeHuaState = "真化" | "合绊" | "远合";

export type TianGanWuHeFinding = WuHeFinding | ZhengHeInfo;

/** 基础合化条目. */
export interface WuHeFinding {
  kind: "天干五合";
  name: string;                 // "甲己合化土"
  positions: string;            // "年月"
  slots: readonly [number, number];
  state: `合化${WuXing}`;       // "合化土"
  /** 紧贴 = 两干相邻. */
  close: boolean;
  /** 合对. */
  pair: readonly [Gan, Gan];
  /** 化气五行. */
  hua: WuXing;
  /** 别名. */
  alias: WuHeAlias;
  /** 是否真化. */
  transformed: boolean;
  /** 化气状态. */
  huaState: WuHeHuaState;
  impacted?: FindingMod[];      // extras 天干相克击破
}

/** 争合 — 两同干争合一字. */
export interface ZhengHeInfo {
  kind: "争合";
  name: string;                 // "争合 甲甲己"
  positions: string;            // 全部参与位
  slots: readonly number[];
  state: "争合";
  /** 重复出现的天干. */
  dupGan: Gan;
  /** 被争合的目标天干. */
  targetGan: Gan;
  /** 重复干数量 (≥2). */
  dupCount: number;
}

/** [gan1, gan2, 化气五行, 别名]. */
const WUHE: Array<[Gan, Gan, WuXing, WuHeAlias]> = [
  ["甲", "己", "土", "中正之合"],
  ["乙", "庚", "金", "仁义之合"],
  ["丙", "辛", "水", "威制之合"],
  ["丁", "壬", "木", "淫昵之合"],
  ["戊", "癸", "火", "无情之合"],
];

function detect(pillars: Pillar[], extras: ExtraPillar[] = []): TianGanWuHeFinding[] {
  const out: TianGanWuHeFinding[] = [];
  const gans = collectGans(pillars);

  for (const [g1, g2, hua, alias] of WUHE) {
    const m1 = gans.filter((g) => g.gan === g1);
    const m2 = gans.filter((g) => g.gan === g2);
    if (m1.length === 0 || m2.length === 0) continue;

    // 争合 — 两同干争合一字, 另记, 不阻断基础合化输出
    if (m1.length >= 2 && m2.length >= 1) {
      const slots = [...m1, ...m2].sort((a, b) => a.pos - b.pos).map((s) => s.pos);
      out.push({
        kind: "争合",
        name: `争合 ${g1}${g1}${g2}`,
        positions: slots.map((s) => POS_NAMES[s]!).join(""),
        slots,
        state: "争合",
        dupGan: g1,
        targetGan: g2,
        dupCount: m1.length,
      });
    }
    if (m2.length >= 2 && m1.length >= 1) {
      const slots = [...m2, ...m1].sort((a, b) => a.pos - b.pos).map((s) => s.pos);
      out.push({
        kind: "争合",
        name: `争合 ${g2}${g2}${g1}`,
        positions: slots.map((s) => POS_NAMES[s]!).join(""),
        slots,
        state: "争合",
        dupGan: g2,
        targetGan: g1,
        dupCount: m2.length,
      });
    }

    // 基础合化 —— 取距离最近的一对, 始终输出
    const pairs = m1.flatMap((a) => m2.map((b) => ({ a, b, gap: Math.abs(a.pos - b.pos) })));
    pairs.sort((x, y) => x.gap - y.gap);
    const pair = pairs[0]!;

    const close = adjacent(pair.a.pos, pair.b.pos);
    let canHua = false;
    if (close) {
      const zwA = zhiWuxing(pillars[pair.a.pos]!.zhi);
      const zwB = zhiWuxing(pillars[pair.b.pos]!.zhi);
      const zwM = zhiWuxing(pillars[1]!.zhi);
      const supports = (zw: WuXing) => zw === hua || GENERATES[zw] === hua;
      canHua = supports(zwA) || supports(zwB) || supports(zwM);
    }
    const huaState: WuHeHuaState = canHua ? "真化" : close ? "合绊" : "远合";

    const slots = [pair.a.pos, pair.b.pos].sort((x, y) => x - y) as [number, number];
    const f: WuHeFinding = {
      kind: "天干五合",
      name: `${g1}${g2}合化${hua}`,
      positions: posRange(slots),
      slots,
      state: `合化${hua}`,
      close,
      pair: [g1, g2],
      hua,
      alias,
      transformed: canHua,
      huaState,
    };
    const imp = impactorsByGan([g1, g2], extras);
    if (imp.length) f.impacted = imp;
    out.push(f);
  }

  return out;
}

export const 天干五合 = { name: "天干五合", detect } as const;
