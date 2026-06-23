/**
 * 地支三会 (含 拱会). md: 会/地支三会.md + 会/会总论.md
 *   寅卯辰 东方木, 巳午未 南方火, 申酉戌 西方金, 亥子丑 北方水
 *
 * API 表述:
 *   三支齐全 → "寅卯辰三会木局", state "三会木局"
 *   首+末 (缺中神) → "寅辰拱会", state "拱会木局"
 * 一个 三支齐全 的会, 同时输出 三会 + 拱会 两条.
 */
import type { Gan, Pillar, WuXing, Zhi } from "../types.ts";
import {
  hasGan, isGanTou, posRange, impactorsByZhi,
  type ExtraPillar, type FindingMod,
} from "./common.ts";

// ———————————————————————————————————————————————
// 结构化类型 — detect 返回 SanHuiFinding[]
// ———————————————————————————————————————————————
// 三会无"紧贴"概念 (旧 close 恒 false, 故不设该字段); 真正的判别信息是
//   化气 / 方位 / 子类别 (三会齐全 | 拱会 | 暗三会) / 中神 / 是否透中神阴干.
// 旧版把这些压进 state("三会木局"|"拱会木局"|"暗三会") 与 note 字符串.

/** 三会方位. */
export type SanHuiFang = "东方" | "南方" | "西方" | "北方";

/** 三会子类别. */
export type SanHuiSub = "三会局" | "拱会" | "暗三会";

/** 三会共有字段 (展示 + 定位 + 方局五行 + 方位 + 三支角色 + extras 冲克). */
export interface SanHuiBase {
  kind: "地支三会";
  sub: SanHuiSub;
  name: string;
  positions: string;
  slots: readonly number[];
  state: string;
  /** 化气 = 方局五行. */
  hua: WuXing;
  /** 方位. */
  fang: SanHuiFang;
  /** 首支 (长生位). 齐全/拱会/暗三会均为实际在局之首支. */
  head: Zhi;
  /** 中神 (帝旺位). 齐全为实际在局; 拱会/暗三会为待拱出之目标. */
  middle: Zhi;
  /** 末支 (墓位). 齐全/拱会/暗三会均为实际在局之末支. */
  tail: Zhi;
  impacted?: FindingMod[];
}

export type SanHuiFinding = SanHuiJuInfo | GongHuiInfo | AnSanHuiInfo;

/** 三会齐全 (首+中+末俱在). */
export interface SanHuiJuInfo extends SanHuiBase {
  sub: "三会局";
  slots: readonly [number, number, number];
  state: `三会${WuXing}局`;
  /** 中神 b 是否占月令 (月支). */
  middleAtMonth: boolean;
  /** 天干是否透化气 → 真三会. */
  transformed: boolean;
}

/** 拱会 — 首+末 (缺中神). 透中神阴干时与 暗三会 并存各一条. */
export interface GongHuiInfo extends SanHuiBase {
  sub: "拱会";
  slots: readonly [number, number];
  state: `拱会${WuXing}局`;
  /** 拱出所需的阴干 (中神对应). */
  needGan: Gan;
  /** 是否透 needGan → 拱成. */
  transformed: boolean;
}

/** 暗三会 — 首+末 且透中神阴干. 仅在透干时追加输出. */
export interface AnSanHuiInfo extends SanHuiBase {
  sub: "暗三会";
  slots: readonly [number, number];
  state: "暗三会";
  /** 透出的中神阴干. */
  needGan: Gan;
  transformed: true;             // 恒真
}

/** [首, 中, 末, 化气, 方位]. */
const SANHUI: Array<[Zhi, Zhi, Zhi, WuXing, string]> = [
  ["寅", "卯", "辰", "木", "东方"],
  ["巳", "午", "未", "火", "南方"],
  ["申", "酉", "戌", "金", "西方"],
  ["亥", "子", "丑", "水", "北方"],
];

/** 中神 对应的阴干 (拱会透之方拱出中神). */
const MID_YIN_GAN: Partial<Record<WuXing, string>> = {
  木: "乙", 火: "丁", 金: "辛", 水: "癸",
};

function withImpacted<T extends SanHuiBase>(f: T, zhis: Zhi[], extras: ExtraPillar[]): T {
  const imp = impactorsByZhi(zhis, extras);
  if (imp.length) f.impacted = imp;
  return f;
}

function detect(pillars: Pillar[], extras: ExtraPillar[] = []): SanHuiFinding[] {
  const out: SanHuiFinding[] = [];
  const zhiSet = pillars.map((p) => p.zhi);

  for (const [a, b, c, hua, fang] of SANHUI) {
    const iA = zhiSet.indexOf(a);
    const iB = zhiSet.indexOf(b);
    const iC = zhiSet.indexOf(c);
    const hasA = iA >= 0, hasB = iB >= 0, hasC = iC >= 0;
    const fangT = fang as SanHuiFang;

    // 三支齐全 → 三会
    if (hasA && hasB && hasC) {
      const pos = [iA, iB, iC].sort((x, y) => x - y) as [number, number, number];
      const canHua = isGanTou(pillars, hua);
      out.push(withImpacted({
        kind: "地支三会",
        sub: "三会局",
        name: `${a}${b}${c}三会${hua}局`,
        positions: posRange(pos),
        slots: pos,
        state: `三会${hua}局`,
        hua,
        fang: fangT,
        head: a, middle: b, tail: c,
        middleAtMonth: iB === 1,
        transformed: canHua,
      }, [a, b, c], extras));
    }

    // 首+末 → 拱会 (不要求透干, 始终输出)
    if (hasA && hasC) {
      const pos = [iA, iC].sort((x, y) => x - y) as [number, number];
      const needGan = MID_YIN_GAN[hua] as Gan | undefined;
      const hasYinGan = !!needGan && hasGan(pillars, needGan);
      out.push(withImpacted({
        kind: "地支三会",
        sub: "拱会",
        name: `${a}${c}拱会`,
        positions: posRange(pos),
        slots: pos,
        state: `拱会${hua}局`,
        hua,
        fang: fangT,
        head: a, middle: b, tail: c,
        needGan: needGan!,
        transformed: hasYinGan,
      }, [a, c], extras));

      // 暗三会 —— 透中神阴干时追加 (与 拱会 并存)
      if (hasYinGan && needGan) {
        out.push(withImpacted({
          kind: "地支三会",
          sub: "暗三会",
          name: `${a}${c}见${needGan}暗三会`,
          positions: posRange(pos),
          slots: pos,
          state: "暗三会",
          hua,
          fang: fangT,
          head: a, middle: b, tail: c,
          needGan,
          transformed: true,
        }, [a, c], extras));
      }
    }
  }
  return out;
}

export const 地支三会 = { name: "地支三会", detect } as const;
