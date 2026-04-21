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
import type { Pillar } from "../../types.ts";
import { adjacent, collectZhis, posRange, type Finding } from "../common.ts";

const LIUHAI: Array<[string, string, string]> = [
  ["子", "未", "世家之害"],
  ["丑", "午", "官鬼相害"],
  ["寅", "巳", "两强相害"],
  ["申", "亥", "争嗔之害"],
  ["卯", "辰", "欺凌之害"],
  ["酉", "戌", "嫉妒之害"],
];

const EXTRA_NOTES: Record<string, string> = {
  子未: "对骨肉六亲最不利",
  丑午: "官杀失效; 易怒或残疾",
  寅巳: "既合既刑又相害, 庚金六亲注意",
  申亥: "对婚姻最凶; 动荡变故",
  卯辰: "年轻欺压年长; 腰脚筋骨",
  酉戌: "嫉妒克害; 头面生疮聋哑",
};

function detect(pillars: Pillar[]): Finding[] {
  const out: Finding[] = [];
  const zhis = collectZhis(pillars);
  for (const [a, b, title] of LIUHAI) {
    const A = zhis.filter((z) => z.zhi === a);
    const B = zhis.filter((z) => z.zhi === b);
    for (const x of A) for (const y of B) {
      out.push({
        kind: "地支相害",
        name: `${a}${b}相害`,
        positions: posRange([x.pos, y.pos].sort((p, q) => p - q)),
        close: adjacent(x.pos, y.pos),
        state: "相害",
        note: `${title}${EXTRA_NOTES[a + b] ? " · " + EXTRA_NOTES[a + b] : ""}`,
        mdKey: "相害",
        quality: "bad",
      });
    }
  }
  return out;
}

export const 地支相害 = { name: "地支相害", detect } as const;
