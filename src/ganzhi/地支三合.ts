/**
 * 地支三合 (含 半合 / 拱合).
 * md: 合/地支三合.md + 合/半三合.md + 合/地支拱合.md
 *
 *   亥卯未 木局, 寅午戌 火局, 巳酉丑 金局, 申子辰 水局
 *
 * API 对同一局内 任何两支 / 三支齐全 都会独立输出一条, 此处对齐:
 *   三支齐全 (长生+帝旺+墓) → "XYZ三合X局"
 *   长生+帝旺              → "XY半合X局" (生地半合)
 *   帝旺+墓                → "XY半合X局" (墓地半合)
 *   长生+墓                → "XY拱合Z"   (透中神阴干者称 "拱出")
 * 一个 三支齐全 的局, 会同时输出 三合 + 2×半合 + 1×拱合 共 4 条.
 */
import type { Gan, Pillar, WuXing, Zhi } from "../types.ts";
import {
  adjacent, hasGan, isGanTou, posRange, impactorsByZhi,
  type ExtraPillar, type FindingMod,
} from "./common.ts";

// ———————————————————————————————————————————————
// 结构化类型 — detect 返回 SanHeFinding[]
// ———————————————————————————————————————————————
// 三合有"紧贴"判别 (紧贴半合 vs 隔位半合力弱), 故保留 close.
// 判别信息: 化气 / 中神 / 子类别 (三合齐全 | 半合 | 拱合 | 暗三合)
//   / 半合类型 (生地 | 墓地) / 中神是否占月令 / 是否透干引化.
// 旧版压进 state("三合X局"|"半合X局"|"拱合X局"|"暗三合") 与 note 字符串.

/** 三合子类别. */
export type SanHeSub = "三合局" | "半合" | "拱合" | "暗三合";

/** 半合类型: 生地半合 (长生+帝旺) / 墓地半合 (帝旺+墓). */
export type BanHeKind = "生地半合" | "墓地半合";

/** 三合共有字段 (展示 + 定位 + 紧贴 + 方局五行 + 三支角色 + extras 冲克). */
export interface SanHeBase {
  kind: "地支三合";
  sub: SanHeSub;
  name: string;
  positions: string;
  slots: readonly number[];
  state: string;
  /** 紧贴 = 参与柱全部相邻 (半合力强弱判别). */
  close: boolean;
  /** 化气 = 局五行. */
  hua: WuXing;
  /** 长生支. */
  changsheng: Zhi;
  /** 中神 (帝旺位). 齐全/半合为实际在局; 拱合/暗三合为待拱出之目标. */
  diwang: Zhi;
  /** 墓支. */
  mu: Zhi;
  impacted?: FindingMod[];
}

export type SanHeFinding = SanHeJuInfo | BanHeInfo | GongHeInfo | AnSanHeInfo;

/** 三合齐全 (长生+帝旺+墓俱在). */
export interface SanHeJuInfo extends SanHeBase {
  sub: "三合局";
  slots: readonly [number, number, number];
  state: `三合${WuXing}局`;
  /** 中神是否占月令 (月支). */
  diwangAtMonth: boolean;
  /** 天干是否透化气 → 真三合. */
  transformed: boolean;
}

/** 半合 — 生+旺 或 旺+墓 (寅午跳过). */
export interface BanHeInfo extends SanHeBase {
  sub: "半合";
  slots: readonly [number, number];
  state: `半合${WuXing}局`;
  /** 半合类型. */
  banHeKind: BanHeKind;
  /** 天干是否透化气. */
  transformed: boolean;
}

/** 拱合 — 长+墓 (缺中神). 透中神阴干时与 暗三合 并存各一条. */
export interface GongHeInfo extends SanHeBase {
  sub: "拱合";
  slots: readonly [number, number];
  state: `拱合${WuXing}局`;
  /** 拱出所需的阴干 (中神对应). */
  needGan: Gan;
  /** 是否透 needGan → 拱成. */
  transformed: boolean;
}

/** 暗三合 — 长+墓 且透中神阴干. 仅在透干时追加输出. */
export interface AnSanHeInfo extends SanHeBase {
  sub: "暗三合";
  slots: readonly [number, number];
  state: "暗三合";
  /** 透出的中神阴干. */
  needGan: Gan;
  transformed: true;             // 恒真
}

/** [长生, 帝旺, 墓库, 化气]. */
const SANHE: Array<[Zhi, Zhi, Zhi, WuXing]> = [
  ["亥", "卯", "未", "木"],
  ["寅", "午", "戌", "火"],
  ["巳", "酉", "丑", "金"],
  ["申", "子", "辰", "水"],
];

/** 三合化气对应的阴干 (拱合需透之方能拱出). */
const YIN_GAN: Partial<Record<WuXing, string>> = {
  木: "乙", 火: "丁", 金: "辛", 水: "癸",
};

/**
 * API 例外: `寅午` 在 API 中归入 地支暗合 而不输出 半合火局 (取 暗合 优先于 半合).
 * 其余 7 组 生+旺 / 旺+墓 pair 正常输出 半合.
 */
const BANHE_SKIP: ReadonlySet<string> = new Set(["寅午", "午寅"]);

function withImpacted<T extends SanHeBase>(f: T, zhis: Zhi[], extras: ExtraPillar[]): T {
  const imp = impactorsByZhi(zhis, extras);
  if (imp.length) f.impacted = imp;
  return f;
}

function emitBanhe(
  out: SanHeFinding[], pillars: Pillar[], extras: ExtraPillar[],
  x: Zhi, y: Zhi, hua: WuXing,
  changsheng: Zhi, diwang: Zhi, mu: Zhi,
  banHeKind: BanHeKind,
  iX: number, iY: number,
): void {
  if (BANHE_SKIP.has(`${x}${y}`)) return;
  const pos = [iX, iY].sort((a, b) => a - b) as [number, number];
  const close = adjacent(iX, iY);
  const canHua = close && isGanTou(pillars, hua);
  out.push(withImpacted({
    kind: "地支三合",
    sub: "半合",
    name: `${x}${y}半合${hua}局`,
    positions: posRange(pos),
    slots: pos,
    state: `半合${hua}局`,
    close,
    hua,
    changsheng, diwang, mu,
    banHeKind,
    transformed: canHua,
  }, [x, y], extras));
}

function emitGonghe(
  out: SanHeFinding[], pillars: Pillar[], extras: ExtraPillar[],
  a: Zhi, c: Zhi, b: Zhi, hua: WuXing,
  iA: number, iC: number,
): void {
  const pos = [iA, iC].sort((x, y) => x - y) as [number, number];
  const close = adjacent(iA, iC);
  const needGan = YIN_GAN[hua] as Gan | undefined;
  const hasYinGan = !!needGan && hasGan(pillars, needGan);

  // 拱合 —— 不要求透干, 始终输出
  out.push(withImpacted({
    kind: "地支三合",
    sub: "拱合",
    name: `${a}${c}拱合${b}`,
    positions: posRange(pos),
    slots: pos,
    state: `拱合${hua}局`,
    close,
    hua,
    changsheng: a, diwang: b, mu: c,
    needGan: needGan!,
    transformed: hasYinGan,
  }, [a, c], extras));

  // 暗三合 —— 仅当透中神阴干时追加输出 (与 拱合 并存)
  if (hasYinGan && needGan) {
    out.push(withImpacted({
      kind: "地支三合",
      sub: "暗三合",
      name: `${a}${c}见${needGan}暗三合`,
      positions: posRange(pos),
      slots: pos,
      state: "暗三合",
      close,
      hua,
      changsheng: a, diwang: b, mu: c,
      needGan,
      transformed: true,
    }, [a, c], extras));
  }
}

function detect(pillars: Pillar[], extras: ExtraPillar[] = []): SanHeFinding[] {
  const out: SanHeFinding[] = [];
  const zhiSet = pillars.map((p) => p.zhi);

  for (const [a, b, c, hua] of SANHE) {
    const iA = zhiSet.indexOf(a);
    const iB = zhiSet.indexOf(b);
    const iC = zhiSet.indexOf(c);
    const hasA = iA >= 0, hasB = iB >= 0, hasC = iC >= 0;

    // 三支齐全 → 三合
    if (hasA && hasB && hasC) {
      const pos = [iA, iB, iC].sort((x, y) => x - y) as [number, number, number];
      const close = adjacent(pos[0]!, pos[1]!) && adjacent(pos[1]!, pos[2]!);
      const diwangAtMonth = iB === 1;
      const canHua = diwangAtMonth && isGanTou(pillars, hua);
      out.push(withImpacted({
        kind: "地支三合",
        sub: "三合局",
        name: `${a}${b}${c}三合${hua}局`,
        positions: posRange(pos),
        slots: pos,
        state: `三合${hua}局`,
        close,
        hua,
        changsheng: a, diwang: b, mu: c,
        diwangAtMonth,
        transformed: canHua,
      }, [a, b, c], extras));
    }

    // 所有 pair 子集 —— 无论齐全与否都独立输出 (对齐 API)
    if (hasA && hasB) emitBanhe(out, pillars, extras, a, b, hua, a, b, c, "生地半合", iA, iB);   // 生+帝旺 半合
    if (hasB && hasC) emitBanhe(out, pillars, extras, b, c, hua, a, b, c, "墓地半合", iB, iC);   // 帝旺+墓 半合
    if (hasA && hasC) emitGonghe(out, pillars, extras, a, c, b, hua, iA, iC); // 生+墓 拱合
  }
  return out;
}

export const 地支三合 = { name: "地支三合", detect } as const;
