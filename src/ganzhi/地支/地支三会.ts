/**
 * 地支三会 (含 拱会). md: 会/地支三会.md + 会/会总论.md
 *   寅卯辰 东方木, 巳午未 南方火, 申酉戌 西方金, 亥子丑 北方水
 *
 * API 表述:
 *   三支齐全 → "寅卯辰三会木局", state "三会木局"
 *   首+末 (缺中神) → "寅辰拱会", state "拱会木局"
 * 一个 三支齐全 的会, 同时输出 三会 + 拱会 两条.
 */
import type { Pillar, WuXing, Zhi } from "../../types.ts";
import { hasGan, isGanTou, posRange, type Finding } from "../common.ts";

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

function detect(pillars: Pillar[]): Finding[] {
  const out: Finding[] = [];
  const zhiSet = pillars.map((p) => p.zhi);

  for (const [a, b, c, hua, fang] of SANHUI) {
    const iA = zhiSet.indexOf(a);
    const iB = zhiSet.indexOf(b);
    const iC = zhiSet.indexOf(c);
    const hasA = iA >= 0, hasB = iB >= 0, hasC = iC >= 0;

    // 三支齐全 → 三会
    if (hasA && hasB && hasC) {
      const pos = [iA, iB, iC].sort((x, y) => x - y);
      const canHua = isGanTou(pillars, hua);
      out.push({
        kind: "地支三会",
        name: `${a}${b}${c}三会${hua}局`,
        positions: posRange(pos),
        close: false,
        transformed: canHua,
        state: `三会${hua}局`,
        note: canHua
          ? `${fang}方局, 天干透 ${hua} 引化, 力量最大但最不稳定`
          : `${fang}方局已聚, 但天干未透 ${hua}`,
        quality: "neutral",
      });
    }

    // 首+末 → 拱会 (不要求透干, 始终输出)
    if (hasA && hasC) {
      const needGan = MID_YIN_GAN[hua];
      const hasYinGan = !!needGan && hasGan(pillars, needGan);
      out.push({
        kind: "地支三会",
        name: `${a}${c}拱会`,
        positions: posRange([iA, iC].sort((x, y) => x - y)),
        close: false,
        transformed: hasYinGan,
        state: `拱会${hua}局`,
        note: hasYinGan
          ? `透 ${needGan} 引化, 拱出 ${b}`
          : `需透 ${needGan} 方能拱出 ${b}`,
        quality: "neutral",
      });

      // 暗三会 —— 透中神阴干时追加 (与 拱会 并存)
      if (hasYinGan && needGan) {
        out.push({
          kind: "地支三会",
          name: `${a}${c}见${needGan}暗三会`,
          positions: posRange([iA, iC].sort((x, y) => x - y)),
          close: false,
          transformed: true,
          state: "暗三会",
          note: `${a}${c} 首+末 且透中神阴干 ${needGan} → 暗成三会`,
          quality: "neutral",
        });
      }
    }
  }
  return out;
}

export const 地支三会 = { name: "地支三会", detect } as const;
