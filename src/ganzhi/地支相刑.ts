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
import type { Pillar, WuXing, Zhi } from "../types.ts";
import {
  adjacent, isGanTou, posRange, zhiWuxing, dissolversByZhi,
  type ExtraPillar, type FindingMod,
} from "./common.ts";

// ———————————————————————————————————————————————
// 结构化类型 — detect 返回 XingFinding[]
// ———————————————————————————————————————————————
// 相刑有四种子类别, state 区分 "相刑" (三刑/pair/子卯) 与 "自刑".
// 判别信息: 刑名 (恃势/无恩/无礼/自刑) / 三刑归属 (属哪组 triple) / 自刑本气透否.
// 旧版把刑名压在 note, 三刑归属靠 mdKey, 自刑透干压在 note.

/** 三刑名. */
export type XingName = "恃势之刑" | "无恩之刑" | "无礼之刑";

/** 自刑地支. */
export type ZiXingZhi = "辰" | "午" | "酉" | "亥";

/** 三刑归属 triple key (pair 子集用). */
export type XingTriple = "丑未戌" | "寅巳申";

/** 相刑子类别. */
export type XingSub = "三刑" | "半刑" | "子卯刑" | "自刑";

/** 刑共有字段. */
export interface XingBase {
  kind: "地支相刑";
  sub: XingSub;
  name: string;
  positions: string;
  slots: readonly number[];
  state: "相刑" | "自刑";
  close: boolean;
  dissolved?: FindingMod[];
}

export type XingFinding = SanXingInfo | BanXingInfo | ZiMaoXingInfo | ZiXingInfo;

/** 三刑齐全 (丑未戌 / 寅巳申). */
export interface SanXingInfo extends XingBase {
  sub: "三刑";
  slots: readonly [number, number, number];
  state: "相刑";
  xingName: XingName;           // 恃势之刑 / 无恩之刑
  triple: XingTriple;           // 丑未戌 / 寅巳申
  zhis: readonly [Zhi, Zhi, Zhi];
}

/** 半刑 — 三刑 triple 的 2 支子集. */
export interface BanXingInfo extends XingBase {
  sub: "半刑";
  slots: readonly [number, number];
  state: "相刑";
  xingName: XingName;
  triple: XingTriple;           // 该 pair 所属 triple
  zhis: readonly [Zhi, Zhi];
}

/** 子卯刑 (无礼之刑). */
export interface ZiMaoXingInfo extends XingBase {
  sub: "子卯刑";
  slots: readonly [number, number];
  state: "相刑";
  xingName: "无礼之刑";
  zhis: readonly [Zhi, Zhi];
}

/** 自刑 (辰辰/午午/酉酉/亥亥). */
export interface ZiXingInfo extends XingBase {
  sub: "自刑";
  state: "自刑";
  /** 自刑地支 (重复者). */
  zhi: ZiXingZhi;
  zhis: readonly Zhi[];         // 所有重复位的地支 (同 zhi)
  /** 本气是否透干 → 力加倍. */
  touBenqi: boolean;
}

function withDissolved<T extends XingBase>(f: T, zhis: Zhi[], extras: ExtraPillar[]): T {
  const dis = dissolversByZhi(zhis, extras);
  if (dis.length) f.dissolved = dis;
  return f;
}

const ZIXING_ZHIS: ReadonlySet<Zhi> = new Set<Zhi>(["辰", "午", "酉", "亥"]);

const SELF_XING_DESC: Record<string, string> = {
  辰: "水库碰撞 · 委屈内积、自我贬低; 脾胃消化、抑郁",
  午: "火焰合一 · 脾气暴躁、完美主义; 心血管眼睛、焦虑失眠",
  酉: "刀刃互磨 · 冷漠不切实际; 肺呼吸、外伤手术",
  亥: "江河泛滥 · 忧郁沉溺; 肾泌尿内分泌、情绪困扰",
};

/** 定义三刑 triples, 用于统一 pair 子集的输出. */
const SAN_XING: Array<[Zhi, Zhi, Zhi, XingTriple, XingName]> = [
  ["丑", "未", "戌", "丑未戌", "恃势之刑"],  // 恃势之刑 (土刑)
  ["寅", "巳", "申", "寅巳申", "无恩之刑"],  // 无恩之刑 (驿马刑)
];

function detect(pillars: Pillar[], extras: ExtraPillar[] = []): XingFinding[] {
  const out: XingFinding[] = [];
  const zhiSet = pillars.map((p) => p.zhi);
  const idxOf = (z: string): number => zhiSet.indexOf(z as Zhi);

  // 三刑 triple + 所有 pair 子集
  for (const [a, b, c, triple, xingName] of SAN_XING) {
    const iA = idxOf(a), iB = idxOf(b), iC = idxOf(c);
    const hasA = iA >= 0, hasB = iB >= 0, hasC = iC >= 0;

    if (hasA && hasB && hasC) {
      const idxs = [iA, iB, iC].sort((x, y) => x - y) as [number, number, number];
      const close = adjacent(idxs[0]!, idxs[1]!) && adjacent(idxs[1]!, idxs[2]!);
      out.push(withDissolved({
        kind: "地支相刑",
        sub: "三刑",
        name: `${triple}三刑`,
        positions: posRange(idxs),
        slots: idxs,
        state: "相刑",
        close,
        xingName,
        triple,
        zhis: [a, b, c],
      }, [a, b, c], extras));
    }

    // 3 个 pair 子集都单独出
    const pairs: Array<[Zhi, Zhi, number, number]> = [];
    if (hasA && hasB) pairs.push([a, b, iA, iB]);
    if (hasB && hasC) pairs.push([b, c, iB, iC]);
    if (hasA && hasC) pairs.push([a, c, iA, iC]);
    for (const [p1, p2, i1, i2] of pairs) {
      const idxs = [i1, i2].sort((x, y) => x - y) as [number, number];
      out.push(withDissolved({
        kind: "地支相刑",
        sub: "半刑",
        name: `${p1}${p2}相刑`,
        positions: posRange(idxs),
        slots: idxs,
        state: "相刑",
        close: adjacent(i1, i2),
        xingName,
        triple,
        zhis: [p1, p2],
      }, [p1, p2], extras));
    }
  }

  // 子卯 刑
  const iZi = idxOf("子"), iMao = idxOf("卯");
  if (iZi >= 0 && iMao >= 0) {
    const idxs = [iZi, iMao].sort((a, b) => a - b) as [number, number];
    out.push(withDissolved({
      kind: "地支相刑",
      sub: "子卯刑",
      name: "子卯相刑",
      positions: posRange(idxs),
      slots: idxs,
      state: "相刑",
      close: adjacent(iZi, iMao),
      xingName: "无礼之刑",
      zhis: ["子", "卯"],
    }, ["子", "卯"], extras));
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
      out.push(withDissolved({
        kind: "地支相刑",
        sub: "自刑",
        name: `${zhi}${zhi}相刑`,
        positions: posRange(idxs),
        slots: idxs,
        state: "自刑",
        close: idxs.some((a, i) => i > 0 && adjacent(idxs[i - 1]!, a)),
        zhi: zhi as ZiXingZhi,
        zhis: idxs.map(() => zhi as Zhi),
        touBenqi,
      }, [zhi as Zhi], extras));
    }
  }

  return out;
}

export const 地支相刑 = { name: "地支相刑", detect } as const;
