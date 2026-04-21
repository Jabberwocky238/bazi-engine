/** 旬空 (六十甲子分六旬, 每旬余两支为空). */
import type { Gan, Zhi } from "./types.ts";
import { GAN, ZHI } from "./types.ts";

export const KONGWANG_XUN: readonly (readonly [Zhi, Zhi])[] = [
  ["戌","亥"], ["申","酉"], ["午","未"],
  ["辰","巳"], ["寅","卯"], ["子","丑"],
];

export function kongwangFor(gan: Gan, zhi: Zhi): readonly [Zhi, Zhi] {
  const g = GAN.indexOf(gan), z = ZHI.indexOf(zhi);
  for (let n = 0; n < 60; n++) {
    if (n % 10 === g && n % 12 === z) {
      const row = KONGWANG_XUN[Math.floor(n / 10)];
      if (!row) throw new Error(`kongwang table miss at xun ${Math.floor(n / 10)}`);
      return row;
    }
  }
  throw new Error(`invalid pillar ${gan}${zhi}`);
}
