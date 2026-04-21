/**
 * 天干相冲. md: 冲/天干相冲.md
 *   甲庚 / 乙辛 / 丙壬 / 丁癸 4 组. 戊己居中不冲.
 *
 * 注: API 将天干冲归入 "相克" 而不用 "相冲" 短标, 故与 `天干相克` 在 pair-category
 * 层可能重叠. 本文件保留原始分类定义供展示 / md 对照.
 */
import type { Pillar } from "../../types.ts";
import { adjacent, collectGans, posRange, type Finding } from "../common.ts";

const GAN_CHONG: Array<[string, string]> = [
  ["甲", "庚"], ["乙", "辛"], ["丙", "壬"], ["丁", "癸"],
];

function detect(pillars: Pillar[]): Finding[] {
  const out: Finding[] = [];
  const gans = collectGans(pillars);
  for (const [g1, g2] of GAN_CHONG) {
    const A = gans.filter((g) => g.gan === g1);
    const B = gans.filter((g) => g.gan === g2);
    for (const a of A) for (const b of B) {
      const close = adjacent(a.pos, b.pos);
      out.push({
        kind: "天干相冲",
        name: `${g1}${g2}相冲`,
        positions: posRange([a.pos, b.pos].sort((x, y) => x - y)),
        close,
        state: "相冲",
        note: close ? "紧冲, 突发变化" : "隔冲, 作用渐进",
        quality: "bad",
      });
    }
  }
  return out;
}

export const 天干相冲 = { name: "天干相冲", detect } as const;
