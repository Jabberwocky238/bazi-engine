import { strict as assert } from "node:assert";
import { ZHI } from "../src/types.ts";
import { DI_ZHI_RELATION_TABLE_WRAPPER as table } from "../src/ganzhi/地支.ts";

const pairs = (values: readonly string[]) => new Set(values.flatMap((pair) => [pair, [...pair].reverse().join("")]));
const liuhe = pairs(["子丑", "寅亥", "卯戌", "辰酉", "巳申", "午未"]);
const chong = pairs(["子午", "卯酉", "寅申", "巳亥", "辰戌", "丑未"]);
const po = pairs(["子酉", "卯午", "寅亥", "巳申", "辰丑", "未戌"]);
const hai = pairs(["子未", "丑午", "寅巳", "申亥", "卯辰", "酉戌"]);
const ziXing = new Set(["辰辰", "午午", "酉酉", "亥亥"]);
const banXing = pairs(["丑未", "未戌", "丑戌", "寅巳", "巳申", "寅申"]);
const ziMaoXing = pairs(["子卯"]);

for (const row of ZHI) {
  for (const column of ZHI) {
    const pair = `${row}${column}`;
    const expected = ziXing.has(pair)
      ? "自刑"
      : ziMaoXing.has(pair)
        ? "相刑"
        : banXing.has(pair)
          ? "半刑"
          : liuhe.has(pair)
      ? "六合"
      : chong.has(pair)
        ? "相冲"
        : po.has(pair)
          ? "相破"
          : hai.has(pair)
            ? "相害"
              : null;
    assert.equal(table[row][column], expected, `${pair} relation mismatch`);
  }
}
