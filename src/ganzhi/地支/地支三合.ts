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
import type { Pillar, WuXing, Zhi } from "../../types.ts";
import {
  adjacent, hasGan, isGanTou, posRange,
  type Finding,
} from "../common.ts";

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

function emitBanhe(
  out: Finding[], pillars: Pillar[],
  x: Zhi, y: Zhi, hua: WuXing,
  iX: number, iY: number,
): void {
  if (BANHE_SKIP.has(`${x}${y}`)) return;
  const close = adjacent(iX, iY);
  const canHua = close && isGanTou(pillars, hua);
  out.push({
    kind: "地支三合",
    name: `${x}${y}半合${hua}局`,
    positions: posRange([iX, iY].sort((a, b) => a - b)),
    close,
    transformed: canHua,
    state: `半合${hua}局`,
    note: close ? "紧贴半合" : "隔位半合, 力弱",
    quality: "neutral",
  });
}

function emitGonghe(
  out: Finding[], pillars: Pillar[],
  a: Zhi, c: Zhi, b: Zhi, hua: WuXing,
  iA: number, iC: number,
): void {
  const close = adjacent(iA, iC);
  const needGan = YIN_GAN[hua];
  const hasYinGan = !!needGan && hasGan(pillars, needGan);

  // 拱合 —— 不要求透干, 始终输出
  out.push({
    kind: "地支三合",
    name: `${a}${c}拱合${b}`,
    positions: posRange([iA, iC].sort((x, y) => x - y)),
    close,
    transformed: hasYinGan,
    state: `拱合${hua}局`,
    note: hasYinGan
      ? `透 ${needGan} 引化, 拱出 ${b}`
      : `需透 ${needGan} 方能拱出 ${b}`,
    quality: "neutral",
  });

  // 暗三合 —— 仅当透中神阴干时追加输出 (与 拱合 并存)
  if (hasYinGan && needGan) {
    out.push({
      kind: "地支三合",
      name: `${a}${c}见${needGan}暗三合`,
      positions: posRange([iA, iC].sort((x, y) => x - y)),
      close,
      transformed: true,
      state: "暗三合",
      note: `${a}${c} 长生+墓 且透中神阴干 ${needGan} → 暗成三合`,
      quality: "neutral",
    });
  }
}

function detect(pillars: Pillar[]): Finding[] {
  const out: Finding[] = [];
  const zhiSet = pillars.map((p) => p.zhi);

  for (const [a, b, c, hua] of SANHE) {
    const iA = zhiSet.indexOf(a);
    const iB = zhiSet.indexOf(b);
    const iC = zhiSet.indexOf(c);
    const hasA = iA >= 0, hasB = iB >= 0, hasC = iC >= 0;

    // 三支齐全 → 三合
    if (hasA && hasB && hasC) {
      const pos = [iA, iB, iC].sort((x, y) => x - y);
      const close = adjacent(pos[0]!, pos[1]!) && adjacent(pos[1]!, pos[2]!);
      const zhongqiAtMonth = iB === 1;
      const canHua = zhongqiAtMonth && isGanTou(pillars, hua);
      out.push({
        kind: "地支三合",
        name: `${a}${b}${c}三合${hua}局`,
        positions: posRange(pos),
        close,
        transformed: canHua,
        state: `三合${hua}局`,
        note: canHua
          ? "中神占月令且天干透化气 → 真三合, 气势磅礴"
          : !zhongqiAtMonth ? `中神 ${b} 未占月令, 合而不化`
                            : `天干无 ${hua} 透出, 合而不化`,
        quality: "neutral",
      });
    }

    // 所有 pair 子集 —— 无论齐全与否都独立输出 (对齐 API)
    if (hasA && hasB) emitBanhe(out, pillars, a, b, hua, iA, iB);   // 生+帝旺 半合
    if (hasB && hasC) emitBanhe(out, pillars, b, c, hua, iB, iC);   // 帝旺+墓 半合
    if (hasA && hasC) emitGonghe(out, pillars, a, c, b, hua, iA, iC); // 生+墓 拱合
  }
  return out;
}

export const 地支三合 = { name: "地支三合", detect } as const;
