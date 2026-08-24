/**
 * 交叉验证: 五行关系两张表, 修改前 (git HEAD 6d01ff5) 与修改后逐格比对独立 oracle.
 *
 * oracle = 重构前 src/wuxing.ts 的 relationOf / wuxingRelations 实现 (提交 09a5a63^),
 *          即这两张表所要替代的原始逻辑 —— 与表本身无共同来源.
 * 全枚举, 非抽样: relationOf 5x5 = 25 格; relationFrom 5x5 = 25 格; 新旧两表各跑一遍.
 */
import { describe, expect, test } from "bun:test";
import {
  WUXING, RELATIONS, WuXingC,
  GENERATES, CONTROLS, GENERATED_BY, CONTROLLED_BY,
  WUXING_RELATION_TABLE_WRAPPER as NEW_REL,
  WUXING_BY_RELATION_TABLE as NEW_BY,
  type Relation, type WuXing,
} from "@/types.ts";
import { oracleRelationOf, oracleRelations } from "./oracle.ts";
import { OLD_WUXING_RELATION_TABLE, OLD_WUXING_BY_RELATION } from "./old-tables.ts";

const at = <T,>(m: readonly (readonly T[])[], r: number, c: number): T => {
  const v = m[r]?.[c];
  if (v === undefined) throw new Error(`missing cell ${r},${c}`);
  return v;
};
const oldRelationOf = (me: WuXing, o: WuXing) =>
  at(OLD_WUXING_RELATION_TABLE, WUXING.indexOf(me), WUXING.indexOf(o));
const oldRelationFrom = (r: Relation, me: WuXing) =>
  at(OLD_WUXING_BY_RELATION, RELATIONS.indexOf(r), WUXING.indexOf(me));

const PAIRS = WUXING.flatMap((me) => WUXING.map((o) => [me, o] as const));
const SLOTS = RELATIONS.flatMap((r) => WUXING.map((me) => [r, me] as const));

describe("前置校验", () => {
  test("枚举覆盖 25 + 25", () => {
    expect(PAIRS).toHaveLength(25);
    expect(SLOTS).toHaveLength(25);
  });

  test("oracle 与 types.ts 的生克常量同源一致 (防 oracle 漂移)", async () => {
    const o = await import("./oracle.ts");
    expect(o.GENERATES).toEqual(GENERATES);
    expect(o.CONTROLS).toEqual(CONTROLS);
    expect(o.GENERATED_BY).toEqual(GENERATED_BY);
    expect(o.CONTROLLED_BY).toEqual(CONTROLLED_BY);
  });

  test("oracle 自身自洽: 生克互为反查, 每个五行五种关系齐备", () => {
    for (const w of WUXING) {
      expect(GENERATED_BY[GENERATES[w]]).toBe(w);
      expect(CONTROLLED_BY[CONTROLS[w]]).toBe(w);
      expect(new Set(Object.values(oracleRelations(w))).size).toBe(5);
    }
  });
});

describe("新表 relationOf vs oracle — 全枚举 25 格", () => {
  for (const [me, o] of PAIRS) {
    test(`${me} 对 ${o}`, () => expect(NEW_REL[me][o]).toBe(oracleRelationOf(me, o)));
  }
});

describe("新表 relationFrom vs oracle — 全枚举 25 格", () => {
  for (const [r, me] of SLOTS) {
    test(`${me} 的 ${r}`, () => expect(NEW_BY[r][me]).toBe(oracleRelations(me)[r]));
  }
});

describe("WuXingC API vs oracle — 全枚举 25 + 25", () => {
  for (const [me, o] of PAIRS) {
    test(`${me}.relationOf(${o})`, () =>
      expect(WuXingC.from(me).relationOf(WuXingC.from(o))).toBe(oracleRelationOf(me, o)));
  }
  for (const [r, me] of SLOTS) {
    test(`${me}.relationFrom(${r})`, () =>
      expect(WuXingC.from(me).relationFrom(r).str).toBe(oracleRelations(me)[r]));
  }
});

describe("新表 relationFrom 是 relationOf 的逆 — 全枚举 25 格", () => {
  for (const [r, me] of SLOTS) {
    test(`${me} --${r}--> X, 且 ${me} 对 X 为 ${r}`, () =>
      expect(NEW_REL[me][NEW_BY[r][me]]).toBe(r));
  }
});

describe("新表每行均为 5 元排列 — 全 10 行", () => {
  for (const me of WUXING) {
    test(`relationOf 行 ${me}`, () =>
      expect(new Set(WUXING.map((o) => NEW_REL[me][o])).size).toBe(5));
  }
  for (const r of RELATIONS) {
    test(`relationFrom 行 ${r}`, () =>
      expect(new Set(WUXING.map((me) => NEW_BY[r][me])).size).toBe(5));
  }
});

describe("旧表 vs oracle — 全枚举, 记录全部分歧", () => {
  test("relationOf: 25 格中 2 格错误", () => {
    expect(PAIRS
      .filter(([me, o]) => oldRelationOf(me, o) !== oracleRelationOf(me, o))
      .map(([me, o]) => `${me}对${o}: 旧=${oldRelationOf(me, o)} 应=${oracleRelationOf(me, o)}`),
    ).toEqual([
      "金对木: 旧=我生 应=我克",
      "水对木: 旧=生我 应=我生",
    ]);
  });

  test("relationFrom: 25 格中 8 格错误", () => {
    expect(SLOTS
      .filter(([r, me]) => oldRelationFrom(r, me) !== oracleRelations(me)[r])
      .map(([r, me]) => `${me}的${r}: 旧=${oldRelationFrom(r, me)} 应=${oracleRelations(me)[r]}`),
    ).toEqual([
      "火的我克: 旧=水 应=金",
      "土的我克: 旧=火 应=水",
      "金的我克: 旧=金 应=木",
      "水的我克: 旧=木 应=火",
      "火的克我: 旧=木 应=水",
      "土的克我: 旧=水 应=木",
      "土的生我: 旧=金 应=火",
      "水的生我: 旧=火 应=金",
    ]);
  });

  test("旧表 relationOf 有两行不是排列 (旧表自身不自洽)", () => {
    expect(WUXING.filter((me) => new Set(WUXING.map((o) => oldRelationOf(me, o))).size !== 5))
      .toEqual(["金", "水"]);
  });

  test("新表恰好修正旧表错误格, 未改动本来正确的格", () => {
    expect(PAIRS.filter(([me, o]) => oldRelationOf(me, o) !== NEW_REL[me][o]))
      .toEqual(PAIRS.filter(([me, o]) => oldRelationOf(me, o) !== oracleRelationOf(me, o)));
    expect(SLOTS.filter(([r, me]) => oldRelationFrom(r, me) !== NEW_BY[r][me]))
      .toEqual(SLOTS.filter(([r, me]) => oldRelationFrom(r, me) !== oracleRelations(me)[r]));
  });
});
