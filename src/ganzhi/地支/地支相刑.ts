/**
 * 地支相刑 (含 三刑 / 半刑 / 自刑).
 * md: 刑/地支相刑总论.md + 丑未戌三刑.md + 寅巳申三刑.md + 子卯刑.md + 自刑.md
 *
 *   丑未戌 · 恃势之刑 (土刑)
 *   寅巳申 · 无恩之刑 (驿马刑)
 *   子卯   · 无礼之刑
 *   自刑   · 辰辰 / 午午 / 酉酉 / 亥亥
 *
 * API 对 三刑 triple + 所有 2 支子集 + 自刑 都各自输出一条:
 *   "丑未戌三刑" / "寅巳申三刑"  state "相刑"
 *   "寅巳相刑" / "寅申相刑" / "巳申相刑" 等 pair 子集  state "相刑"
 *   "子卯相刑"                                     state "相刑"
 *   "酉酉相刑" / "辰辰相刑" ...                     state "自刑"
 */
import type { Pillar, Zhi } from "../../types.ts";
import { zhiWuxing } from "../../ganzhi.ts";
import {
  adjacent, isGanTou, posRange,
  type Finding,
} from "../common.ts";

const ZIXING_ZHIS: ReadonlySet<Zhi> = new Set<Zhi>(["辰", "午", "酉", "亥"]);

const SELF_XING_DESC: Record<string, string> = {
  辰: "水库碰撞 · 委屈内积、自我贬低; 脾胃消化、抑郁",
  午: "火焰合一 · 脾气暴躁、完美主义; 心血管眼睛、焦虑失眠",
  酉: "刀刃互磨 · 冷漠不切实际; 肺呼吸、外伤手术",
  亥: "江河泛滥 · 忧郁沉溺; 肾泌尿内分泌、情绪困扰",
};

/** 定义三刑 triples, 用于统一 pair 子集的输出. */
const SAN_XING: Array<[Zhi, Zhi, Zhi, string]> = [
  ["丑", "未", "戌", "丑未戌"],  // 恃势之刑 (土刑)
  ["寅", "巳", "申", "寅巳申"],  // 无恩之刑 (驿马刑)
];

function detect(pillars: Pillar[]): Finding[] {
  const out: Finding[] = [];
  const zhiSet = pillars.map((p) => p.zhi);
  const idxOf = (z: string): number => zhiSet.indexOf(z as Zhi);

  // 三刑 triple + 所有 pair 子集
  for (const [a, b, c, label] of SAN_XING) {
    const iA = idxOf(a), iB = idxOf(b), iC = idxOf(c);
    const hasA = iA >= 0, hasB = iB >= 0, hasC = iC >= 0;

    if (hasA && hasB && hasC) {
      const idxs = [iA, iB, iC].sort((x, y) => x - y);
      const close = adjacent(idxs[0]!, idxs[1]!) && adjacent(idxs[1]!, idxs[2]!);
      out.push({
        kind: "地支相刑",
        name: `${label}三刑`,
        positions: posRange(idxs),
        close,
        state: "相刑",
        note: label === "丑未戌"
          ? "恃势之刑 · 土越刑越旺, 伤藏干癸水、辛金、乙木; 脾胃皮肤"
          : "无恩之刑 · 驿马三支互刑, 事业环境频变、恩情难续, 防牢狱血光",
        mdKey: `${label}三刑`, quality: "bad",
      });
    }

    // 3 个 pair 子集都单独出
    const pairs: Array<[Zhi, Zhi, number, number]> = [];
    if (hasA && hasB) pairs.push([a, b, iA, iB]);
    if (hasB && hasC) pairs.push([b, c, iB, iC]);
    if (hasA && hasC) pairs.push([a, c, iA, iC]);
    for (const [p1, p2, i1, i2] of pairs) {
      out.push({
        kind: "地支相刑",
        name: `${p1}${p2}相刑`,
        positions: posRange([i1, i2].sort((x, y) => x - y)),
        close: adjacent(i1, i2),
        state: "相刑",
        note: `${label} 之 ${p1}${p2} 相刑`,
        mdKey: `${label}三刑`, quality: "bad",
      });
    }
  }

  // 子卯 刑
  const iZi = idxOf("子"), iMao = idxOf("卯");
  if (iZi >= 0 && iMao >= 0) {
    out.push({
      kind: "地支相刑",
      name: "子卯相刑",
      positions: posRange([iZi, iMao].sort((a, b) => a - b)),
      close: adjacent(iZi, iMao),
      state: "相刑",
      note: "无礼之刑 · 母子相刑, 水生木变相克; 桃花纠纷、肝胆神经",
      mdKey: "子卯刑", quality: "bad",
    });
  }

  // 自刑
  const counter: Record<string, number[]> = {};
  pillars.forEach((p, i) => {
    if (ZIXING_ZHIS.has(p.zhi)) {
      (counter[p.zhi] ??= []).push(i);
    }
  });
  for (const [zhi, idxs] of Object.entries(counter)) {
    if (idxs.length >= 2) {
      const wx = zhiWuxing(zhi as Zhi);
      const touBenqi = isGanTou(pillars, wx);
      out.push({
        kind: "地支相刑",
        name: `${zhi}${zhi}相刑`,
        positions: posRange(idxs),
        close: idxs.some((a, i) => i > 0 && adjacent(idxs[i - 1]!, a)),
        state: "自刑",
        note: `${SELF_XING_DESC[zhi] ?? ""} · ${touBenqi ? "透本气, 力加倍" : "本气不透"}`,
        mdKey: "自刑", quality: "bad",
      });
    }
  }

  return out;
}

export const 地支相刑 = { name: "地支相刑", detect } as const;
