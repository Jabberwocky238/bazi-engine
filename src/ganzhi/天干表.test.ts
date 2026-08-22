import { expect, test } from "bun:test";
import { GAN } from "../types.ts";
import { TIAN_GAN_RELATION_TABLE_WRAPPER as table } from "./天干.ts";

const he = new Set(["甲己", "乙庚", "丙辛", "丁壬", "戊癸"]);
const chong = new Set(["甲庚", "乙辛", "丙壬", "丁癸"]);
const ke = new Set([
  "甲戊", "乙己", "丙庚", "丁辛", "戊壬",
  "己癸", "庚甲", "辛乙", "壬丙", "癸丁",
]);

test("天干关系表符合预期", () => {
  for (const row of GAN) {
    for (const column of GAN) {
      const pair = `${row}${column}`;
      const reverse = `${column}${row}`;
      const expected = he.has(pair) || he.has(reverse)
        ? "相合"
        : chong.has(pair) || chong.has(reverse)
          ? "相冲"
          : ke.has(pair) || ke.has(reverse)
            ? "相克"
            : null;
      expect(table[row][column], `${pair} relation mismatch`).toBe(expected);
    }
  }
});
