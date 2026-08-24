/**
 * 交叉验证: 墓库状态判定表 vs 改表前的 if/else 链.
 * 全枚举 2^5 = 32 种标志组合, 非抽样. 表必须与原实现逐格一致 (纯重构, 零行为变化).
 */
import { describe, expect, test } from "bun:test";
import { MUKU_FLAG_BITS, mukuState, type MuKuState } from "@/ganzhi/墓库.ts";

const MUKU_FLAGS = MUKU_FLAG_BITS.items;

/** 改表前 detect 中的 if/else 链, 逐字复刻, 作为 oracle. */
function oracleState(
  touMuqi: boolean, beingChong: boolean, xingOpen: boolean,
  tianChongOpen: boolean, tianHeClose: boolean,
): MuKuState {
  let state: MuKuState = "静库";
  if (touMuqi && !beingChong && !xingOpen && !tianHeClose) {
    state = "自动开库";
  } else if (beingChong || xingOpen) {
    state = "冲刑开库";
  } else if (tianChongOpen) {
    state = "天干冲开";
  } else if (tianHeClose) {
    state = "天干合闭";
  } else if (!touMuqi) {
    state = "闭库";
  }
  return state;
}

/** 全部 32 种掩码及其对应标志. */
const COMBOS = Array.from({ length: 32 }, (_, mask) => {
  const bits = [0, 1, 2, 3, 4].map((b) => (mask & (1 << b)) !== 0) as [boolean, boolean, boolean, boolean, boolean];
  return { mask, bits };
});

test("枚举完整: 32 行, 表长 32, 掩码空间 32", () => {
  expect(COMBOS).toHaveLength(32);
  expect(MUKU_FLAG_BITS.size).toBe(32);
  expect(MUKU_FLAGS).toHaveLength(5);
});

describe("encode/decode 互逆 — 全枚举 32", () => {
  for (const { mask, bits } of COMBOS) {
    test(`mask ${mask}`, () => {
      const flags = Object.fromEntries(MUKU_FLAGS.map((f, i) => [f, bits[i]!]));
      expect(MUKU_FLAG_BITS.encode(flags)).toBe(mask);
      const decoded = MUKU_FLAG_BITS.decode(mask);
      MUKU_FLAGS.forEach((f, i) => {
        expect(decoded[i] === f).toBe(bits[i]!);
      });
    });
  }
});

describe("查表 vs 原 if/else 链 — 全枚举 32 行", () => {
  for (const { mask, bits } of COMBOS) {
    const [t, c, x, tc, th] = bits;
    test(`mask ${mask} 透${+t}冲${+c}刑${+x}干冲${+tc}干合${+th}`, () => {
      const flags = { 透墓气: t, 被冲: c, 被刑: x, 天干冲开: tc, 天干合闭: th };
      expect(mukuState(flags)).toBe(oracleState(t, c, x, tc, th));
    });
  }
});

test("表中出现的状态集合 = 原实现可达状态集合", () => {
  const fromTable = new Set(COMBOS.map(({ bits }) =>
    mukuState(Object.fromEntries(MUKU_FLAGS.map((f, i) => [f, bits[i]!])))));
  const fromOracle = new Set(COMBOS.map(({ bits }) => oracleState(...bits)));
  expect([...fromTable].sort()).toEqual([...fromOracle].sort());
});

test("静库 在原实现与表中均不可达 (记录现状)", () => {
  expect(COMBOS.map(({ bits }) => oracleState(...bits))).not.toContain("静库");
  expect(COMBOS.map(({ bits }) =>
    mukuState(Object.fromEntries(MUKU_FLAGS.map((f, i) => [f, bits[i]!]))))).not.toContain("静库");
});
