import { strict as assert } from "node:assert";
import { GAN } from "../src/types.ts";
import { TIAN_GAN_RELATION_TABLE_WRAPPER as table } from "../src/ganzhi/天干.ts";

const he = new Set(["甲己", "乙庚", "丙辛", "丁壬", "戊癸"]);
const chong = new Set(["甲庚", "乙辛", "丙壬", "丁癸"]);
const ke = new Set([
  "甲戊", "乙己", "丙庚", "丁辛", "戊壬",
  "己癸", "庚甲", "辛乙", "壬丙", "癸丁",
]);

for (const row of GAN) {
  for (const column of GAN) {
    const pair = `${row}${column}`;
    const reverse = `${column}${row}`;
    const expected = he.has(pair) || he.has(reverse)
      ? "五合"
      : chong.has(pair) || chong.has(reverse)
        ? "相冲"
        : ke.has(pair) || ke.has(reverse)
          ? "相克"
          : null;
    assert.equal(table[row][column], expected, `${pair} relation mismatch`);
  }
}
