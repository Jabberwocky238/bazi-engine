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
import type { Pillar, WuXing } from "../../types.ts";
import { zhiWuxing } from "../../ganzhi.ts";
import { GENERATES } from "../../wuxing.ts";
import {
  adjacent, collectGans, posRange, POS_NAMES,
  type Finding,
} from "../common.ts";

/** [gan1, gan2, 化气五行, 别名]. */
const WUHE: Array<[string, string, WuXing, string]> = [
  ["甲", "己", "土", "中正之合"],
  ["乙", "庚", "金", "仁义之合"],
  ["丙", "辛", "水", "威制之合"],
  ["丁", "壬", "木", "淫昵之合"],
  ["戊", "癸", "火", "无情之合"],
];

function detect(pillars: Pillar[]): Finding[] {
  const out: Finding[] = [];
  const gans = collectGans(pillars);

  for (const [g1, g2, hua, qing] of WUHE) {
    const m1 = gans.filter((g) => g.gan === g1);
    const m2 = gans.filter((g) => g.gan === g2);
    if (m1.length === 0 || m2.length === 0) continue;

    // 争合 / 妒合 另记, 不阻断基础合化输出
    if (m1.length >= 2 && m2.length >= 1) {
      out.push({
        kind: "争合", name: `争合 ${g1}${g1}${g2}`,
        positions: [...m1, ...m2].sort((a, b) => a.pos - b.pos).map((s) => POS_NAMES[s.pos]!).join(""),
        close: false, state: "争合",
        note: "两个相同天干争合一字 —— 感情纠葛、合作拆散、财来财去",
        mdKey: "争合", quality: "bad",
      });
    }
    if (m2.length >= 2 && m1.length >= 1) {
      out.push({
        kind: "争合", name: `争合 ${g2}${g2}${g1}`,
        positions: [...m2, ...m1].sort((a, b) => a.pos - b.pos).map((s) => POS_NAMES[s.pos]!).join(""),
        close: false, state: "争合",
        note: "两个相同天干争合一字 —— 感情纠葛、合作拆散、财来财去",
        mdKey: "争合", quality: "bad",
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

    out.push({
      kind: "天干五合",
      name: `${g1}${g2}合化${hua}`,
      positions: posRange([pair.a.pos, pair.b.pos].sort((x, y) => x - y)),
      close,
      transformed: canHua,
      state: `合化${hua}`,
      note: canHua
        ? `${qing} · 地支 / 月令 引化, 真合化 ${hua}`
        : close
          ? `${qing} · 紧贴相合但地支不引化, 贪合忘克、两干力减`
          : `${qing} · 隔位虚合, 作用微弱`,
      quality: "neutral",
    });
  }

  return out;
}

export const 天干五合 = { name: "天干五合", detect } as const;
