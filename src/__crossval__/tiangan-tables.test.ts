/**
 * 交叉验证: 天干.ts 的 TianGanC 批量推断 vs 三个原 detector.
 *
 * 全排列 10^4 = 10000 种四柱天干组合, 非抽样. 逐类比对命中的 名+下标 多重集
 * (非去重集合 —— 重干盘同一关系成立多次, 计数必须对上).
 *
 * 地支恒取 子 —— 本表只管天干层面的判定; 原 detector 中依赖地支的派生状态
 * (五合的 真化/合绊/远合 取决于地支引化) 不在对照范围.
 */
import { describe, expect, test } from "bun:test";
import { GAN, GanC, type Gan, type Pillar } from "@/types.ts";
import {
  TianGanC, TianGanDetector, GAN_BITS, ganMask, maskGans, inferZhengHe,
} from "@/ganzhi/天干.ts";
import { 天干五合 } from "@/ganzhi/天干五合.ts";
import { 天干相冲 } from "@/ganzhi/天干相冲.ts";
import { 天干相克 } from "@/ganzhi/天干相克.ts";

/** 全排列 10^4 —— 四柱天干的每一种取法 (字面量, 供原 detector). */
const ALL_RAW: Gan[][] = (() => {
  const out: Gan[][] = [];
  for (const a of GAN) for (const b of GAN) for (const c of GAN) for (const d of GAN) {
    out.push([a, b, c, d]);
  }
  return out;
})();
/** 同上, C 化 —— 新 API 一律吃 GanC. */
const ALL: GanC[][] = ALL_RAW.map((gs) => gs.map(GanC.from));

const P = (gs: readonly Gan[]): Pillar[] => gs.map((g) => ({ gan: g, zhi: "子" }));
/** 多重集签名 —— 名+下标, 不去重, 故计数差异会被抓到. */
const bag = (xs: readonly { name: string; slots: readonly number[] }[]) =>
  xs.map((x) => `${x.name}@${x.slots.join(",")}`).sort();

test("全排列完整: 10^4 = 10000 例", () => {
  expect(ALL).toHaveLength(10 ** 4);
  expect(new Set(ALL_RAW.map((g) => g.join(""))).size).toBe(10 ** 4);
});

const KINDS = [
  ["相合", (gs: GanC[]) => TianGanC.infer(gs).filter((h) => h.rule.kind === "相合")
    .map((h) => ({ name: h.rule.name, slots: h.slots })),
    (ps: Pillar[]) => 天干五合.detect(ps).filter((f) => f.kind === "天干五合")
      .map((f) => ({ name: f.name, slots: f.slots }))],
  ["相冲", (gs: GanC[]) => TianGanC.infer(gs).filter((h) => h.rule.kind === "相冲")
    .map((h) => ({ name: h.rule.name, slots: h.slots })),
    (ps: Pillar[]) => 天干相冲.detect(ps).map((f) => ({ name: f.name, slots: f.slots }))],
  ["相克", (gs: GanC[]) => TianGanC.infer(gs).filter((h) => h.rule.kind === "相克")
    .map((h) => ({ name: h.rule.name, slots: h.slots })),
    (ps: Pillar[]) => 天干相克.detect(ps).map((f) => ({ name: f.name, slots: f.slots }))],
] as const;

describe("表推断 vs 原 detector — 全排列 10^4", () => {
  for (const [label, mine, theirs] of KINDS) {
    test(`${label} — 10000 例逐例一致 (名+下标 多重集)`, () => {
      const diffs: string[] = [];
      for (let i = 0; i < ALL.length; i++) {
        const gs = ALL[i]!, raw = ALL_RAW[i]!;
        const a = bag(mine(gs));
        const b = bag(theirs(P(raw)));
        if (a.join("|") !== b.join("|")) {
          diffs.push(`${raw.join("")}: 表[${a.join(",")}] ≠ 原[${b.join(",")}]`);
          if (diffs.length >= 5) break;
        }
      }
      expect(diffs).toEqual([]);
    });
  }
});

test("争合 — 全排列下与原 detector 一致", () => {
  const diffs: string[] = [];
  for (let i = 0; i < ALL.length; i++) {
    const gs = ALL[i]!, raw = ALL_RAW[i]!;
    const a = bag(inferZhengHe(gs).map((z) => ({ name: z.name, slots: z.slots })));
    const b = bag(天干五合.detect(P(raw)).filter((f) => f.kind === "争合")
      .map((f) => ({ name: f.name, slots: f.slots })));
    if (a.join("|") !== b.join("|")) {
      diffs.push(`${raw.join("")}: 表[${a.join(",")}] ≠ 原[${b.join(",")}]`);
      if (diffs.length >= 5) break;
    }
  }
  expect(diffs).toEqual([]);
});

describe("计数 — 重干盘", () => {
  const D = (s: string) => TianGanDetector.detect([...s].map((c) => GanC.from(c as Gan)));

  test("冲 / 克: 一干重出则逐配对各一条", () => {
    expect(D("甲庚甲庚").byKind("相冲")).toHaveLength(4);   // 甲×2 庚×2
    expect(D("甲庚甲子".slice(0, 3) + "庚").byKind("相冲")).toHaveLength(4);
    expect(D("甲戊甲戊").byKind("相克")).toHaveLength(4);
    expect(D("甲庚丙壬").byKind("相冲")).toHaveLength(2);   // 各一 → 2 组
  });

  test("相合: 只出最近一对 —— 一方重出是 争合 而非多重合", () => {
    expect(D("甲己甲己").byKind("相合")).toHaveLength(1);
    expect(D("甲己甲己").zhenghe).toHaveLength(2);          // 争合 甲甲己 / 己己甲
    expect(D("甲己丙辛").byKind("相合")).toHaveLength(2);   // 两组不同的合
    expect(D("甲己丙辛").zhenghe).toHaveLength(0);
  });
});

describe("位与查表 — 全排列", () => {
  test("slots 自洽: 所指之干恰为关系涉及之干", () => {
    const diffs: string[] = [];
    for (const gs of ALL) {
      for (const h of TianGanC.infer(gs)) {
        const at = h.slots.map((i) => gs[i]!.str).sort().join("");
        const need = h.rule.gans.map((g) => g.str).sort().join("");
        if (at !== need) { diffs.push(`${gs.map((g) => g.str).join("")} ${h.rule.name}`); break; }
      }
      if (diffs.length) break;
    }
    expect(diffs).toEqual([]);
  });

  test("slots 升序且不越界", () => {
    for (const gs of ALL) {
      for (const h of TianGanC.infer(gs)) {
        expect(h.slots).toEqual([...h.slots].sort((a, b) => a - b));
        for (const i of h.slots) {
          expect(i).toBeGreaterThanOrEqual(0);
          expect(i).toBeLessThan(gs.length);
        }
      }
    }
  });

  test("ganMask 与 GAN_BITS / maskGans 互逆 — 全排列", () => {
    for (const gs of ALL) {
      const want = [...new Set(gs.map((g) => g.str))].sort();
      expect([...GAN_BITS.decode(ganMask(gs))].sort()).toEqual(want);
      expect(maskGans(ganMask(gs)).map((g) => g.str).sort()).toEqual(want);
    }
  });

  test("at() 顺序无关 — 全部 pair 两序同结果", () => {
    for (const a of GAN) for (const b of GAN) {
      const [A, B] = [GanC.from(a), GanC.from(b)];
      expect(TianGanC.at(A, B).map((r) => r.name)).toEqual(TianGanC.at(B, A).map((r) => r.name));
    }
  });

  test("byKind 三类之和 = 全部命中; kindList 与 has 一致", () => {
    const KS = ["相合", "相冲", "相克"] as const;
    for (const gs of ALL) {
      const d = TianGanDetector.detect(gs);
      expect(KS.reduce((n, k) => n + d.byKind(k).length, 0)).toBe(d.hits.length);
      expect([...d.kindList()].sort()).toEqual(KS.filter((k) => d.has(k)).sort());
    }
  });

  test("bySlot / byGan 与 hits 一致", () => {
    for (const gs of ALL.slice(0, 2000)) {
      const d = TianGanDetector.detect(gs);
      for (let i = 0; i < gs.length; i++) {
        expect(d.bySlot(i).map((h) => h.name))
          .toEqual(d.hits.filter((h) => h.slots.includes(i)).map((h) => h.name));
      }
      for (const g of new Set(gs)) {
        expect(d.byGan(g).map((h) => h.name))
          .toEqual(d.hits.filter((h) => h.gans.includes(g)).map((h) => h.name));
      }
    }
  });
});

test("规则表完整性 — 条数与原文件一致", () => {
  expect(TianGanC.相合).toHaveLength(5);
  expect(TianGanC.相冲).toHaveLength(4);
  expect(TianGanC.相克).toHaveLength(10);
  expect(TianGanC.rules).toHaveLength(19);
});

test("相冲 4 组为 相克 10 对之子集 (原文件即注明此重叠)", () => {
  for (const c of TianGanC.相冲) {
    expect(TianGanC.相克.some((k) => k.mask === c.mask)).toBe(true);
    // 同一掩码下两类并存, at() 应两条都给
    expect(TianGanC.at(...c.gans).map((r) => r.kind).sort()).toEqual(["相克", "相冲"]);
  }
});

test("每条关系都能被自身的干推断出来", () => {
  for (const r of TianGanC.rules) {
    expect(TianGanC.infer([...r.gans]).map((h) => h.rule.name)).toContain(r.name);
  }
});
