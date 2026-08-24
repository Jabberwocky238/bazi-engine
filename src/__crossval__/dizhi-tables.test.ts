/**
 * 交叉验证: 地支.ts 的 XPCHC / HeHuiC 批量推断 vs 八个原 detector.
 *
 * 全排列 12^4 = 20736 种四柱地支组合, 非抽样. 逐类比对命中的 名+下标 多重集
 * (非去重集合 —— 重支盘同一关系成立多次, 计数必须对上).
 *
 * 已知差异: 相刑 的 半刑 在重支盘上, 本表按"每个配对各一条"出 (同 相冲/六合),
 * 而原 地支相刑.ts 用 indexOf 只出一条. 此为原实现自身不一致, 已定案取前者,
 * 故 相刑 不参与逐例对照, 另立计数用例.
 * 天干恒取 甲 —— 本表只管地支层面的判定; 原 detector 中依赖天干的派生状态
 * (transformed / touBenqi / 半合的透干引化等) 不在对照范围.
 */
import { describe, expect, test } from "bun:test";
import { ZHI, ZhiC, type Pillar, type Zhi } from "@/types.ts";
import { XPCHC, HeHuiC, DiZhiDetector, zhiMask, ZHI_BITS } from "@/ganzhi/地支.ts";
import { 地支相刑 } from "@/ganzhi/地支相刑.ts";
import { 地支相破 } from "@/ganzhi/地支相破.ts";
import { 地支相冲 } from "@/ganzhi/地支相冲.ts";
import { 地支相害 } from "@/ganzhi/地支相害.ts";
import { 地支六合 } from "@/ganzhi/地支六合.ts";
import { 地支暗合 } from "@/ganzhi/地支暗合.ts";

/** 全排列 12^4 —— 四柱地支的每一种取法 (字面量, 供原 detector). */
const ALL_RAW: Zhi[][] = (() => {
  const out: Zhi[][] = [];
  for (const a of ZHI) for (const b of ZHI) for (const c of ZHI) for (const d of ZHI) {
    out.push([a, b, c, d]);
  }
  return out;
})();
/** 同上, C 化 —— 新 API 一律吃 ZhiC. */
const ALL: ZhiC[][] = ALL_RAW.map((zs) => zs.map(ZhiC.from));

const P = (zs: readonly Zhi[]): Pillar[] => zs.map((z) => ({ gan: "甲", zhi: z }));
const uniqSort = (xs: readonly string[]) => [...new Set(xs)].sort();
/** 多重集签名 —— 名+下标, 不去重, 故计数差异会被抓到. */
const bag = (xs: readonly { name: string; slots: readonly number[] }[]) =>
  xs.map((x) => `${x.name}@${x.slots.join(",")}`).sort();

test("全排列完整: 12^4 = 20736 例", () => {
  expect(ALL).toHaveLength(12 ** 4);
  expect(new Set(ALL_RAW.map((z) => z.join(""))).size).toBe(12 ** 4);
});

/** 每类: 表推断的名集合 必须等于 原 detector 的名集合. */
const KINDS = [
  ["相破", (zs: ZhiC[]) => XPCHC.infer(zs).filter((h) => h.rule.kind === "相破").map((h) => ({ name: h.rule.name, slots: h.slots })),
    (ps: Pillar[]) => 地支相破.detect(ps).map((f) => ({ name: f.name, slots: f.slots }))],
  ["相冲", (zs: ZhiC[]) => XPCHC.infer(zs).filter((h) => h.rule.kind === "相冲").map((h) => ({ name: h.rule.name, slots: h.slots })),
    (ps: Pillar[]) => 地支相冲.detect(ps).map((f) => ({ name: f.name, slots: f.slots }))],
  ["相害", (zs: ZhiC[]) => XPCHC.infer(zs).filter((h) => h.rule.kind === "相害").map((h) => ({ name: h.rule.name, slots: h.slots })),
    (ps: Pillar[]) => 地支相害.detect(ps).map((f) => ({ name: f.name, slots: f.slots }))],
  ["六合", (zs: ZhiC[]) => HeHuiC.infer(zs).filter((h) => h.rule.kind === "六合").map((h) => ({ name: h.rule.name, slots: h.slots })),
    (ps: Pillar[]) => 地支六合.detect(ps).map((f) => ({ name: f.name, slots: f.slots }))],
  ["暗合", (zs: ZhiC[]) => HeHuiC.infer(zs).filter((h) => h.rule.kind === "暗合").map((h) => ({ name: h.rule.name, slots: h.slots })),
    (ps: Pillar[]) => 地支暗合.detect(ps).map((f) => ({ name: f.name, slots: f.slots }))],
] as const;

describe("表推断 vs 原 detector — 全排列 12^4", () => {
  for (const [label, mine, theirs] of KINDS) {
    test(`${label} — 20736 例逐例一致`, () => {
      const diffs: string[] = [];
      for (let i = 0; i < ALL.length; i++) {
        const zs = ALL[i]!, raw = ALL_RAW[i]!;
        const a = bag(mine(zs));
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

describe("自刑 — 全排列下须同支重出方命中", () => {
  test("命中当且仅当 辰/午/酉/亥 出现 ≥2 次", () => {
    const ZI: readonly ZhiC[] = (["辰", "午", "酉", "亥"] as Zhi[]).map(ZhiC.from);
    const diffs: string[] = [];
    for (const zs of ALL) {
      const hit = new Set(
        XPCHC.infer(zs).filter((h) => h.rule.kind === "相刑")
          .filter((h) => h.rule.size === 1)
          .map((h) => h.rule.zhis[0]!),
      );
      const want = new Set(ZI.filter((z) => zs.filter((x) => x === z).length >= 2));
      const key = (xs: ZhiC[]) => xs.map((z) => z.str).sort().join("");
      if (key([...hit]) !== key([...want])) {
        diffs.push(zs.map((z) => z.str).join(""));
        if (diffs.length >= 5) break;
      }
    }
    expect(diffs).toEqual([]);
  });

  test("自刑 slots 即该支出现的全部下标", () => {
    for (const zs of ALL.filter((z) => new Set(z).size < 4)) {
      for (const h of XPCHC.infer(zs).filter((h) => h.rule.kind === "相刑").filter((x) => x.rule.size === 1)) {
        const z = h.rule.zhis[0]!;
        const want = zs.flatMap((x, i) => (x === z ? [i] : []));
        expect(h.slots).toEqual(want);
      }
    }
  });
});

describe("slots 自洽 — 全排列", () => {
  test("每条命中的 slots 所指之支恰为规则涉及之支", () => {
    const diffs: string[] = [];
    for (const zs of ALL) {
      for (const h of [...XPCHC.infer(zs), ...HeHuiC.infer(zs)]) {
        const atSlots = uniqSort(h.slots.map((i) => zs[i]!.str));
        const need = uniqSort(h.rule.zhis.map((z) => z.str));
        if (atSlots.join("") !== need.join("")) {
          diffs.push(`${zs.map((z) => z.str).join("")} ${h.rule.name} slots=${h.slots.join(",")}`);
          break;
        }
      }
      if (diffs.length) break;
    }
    expect(diffs).toEqual([]);
  });

  test("slots 升序且不越界", () => {
    for (const zs of ALL) {
      for (const h of [...XPCHC.infer(zs), ...HeHuiC.infer(zs)]) {
        expect(h.slots).toEqual([...h.slots].sort((a, b) => a - b));
        for (const i of h.slots) {
          expect(i).toBeGreaterThanOrEqual(0);
          expect(i).toBeLessThan(zs.length);
        }
      }
    }
  });
});

describe("掩码与查表 — 全排列", () => {
  test("多支规则: infer 命中集 = hits(mask) 命中集", () => {
    const diffs: string[] = [];
    for (const zs of ALL) {
      const m = zhiMask(zs);
      const byInfer = uniqSort(XPCHC.infer(zs).filter((h) => h.rule.size > 1).map((h) => h.rule.name));
      const byMask = uniqSort(XPCHC.rules.filter((r) => r.size > 1 && (m & r.mask) === r.mask).map((r) => r.name));
      if (byInfer.join("|") !== byMask.join("|")) {
        diffs.push(zs.map((z) => z.str).join(""));
        if (diffs.length >= 5) break;
      }
    }
    expect(diffs).toEqual([]);
  });

  test("at() 顺序无关 — 全部 pair 两序同结果", () => {
    for (const a of ZHI) for (const b of ZHI) {
      const [A, B] = [ZhiC.from(a), ZhiC.from(b)];
      expect(XPCHC.at(A, B).map((r) => r.name)).toEqual(XPCHC.at(B, A).map((r) => r.name));
      expect(HeHuiC.at(A, B).map((r) => r.name)).toEqual(HeHuiC.at(B, A).map((r) => r.name));
    }
  });

  test("zhiMask 与 ZHI_BITS 互逆 — 全排列", () => {
    for (const zs of ALL) {
      expect(uniqSort(ZHI_BITS.decode(zhiMask(zs)))).toEqual(uniqSort(zs.map((z) => z.str)));
    }
  });
});

describe("triple 子集 — 全排列", () => {
  test("子集命中当且仅当其两支俱在", () => {
    const diffs: string[] = [];
    for (const zs of ALL) {
      const set = new Set(zs);
      const got = new Set(HeHuiC.inferSubsets(zs).map((s) => s.name));
      const want = new Set(
        HeHuiC.rules.flatMap((r) =>
          r.subsets().filter((s) => set.has(s.zhis[0]) && set.has(s.zhis[1])).map((s) => s.name)),
      );
      if ([...got].sort().join("|") !== [...want].sort().join("|")) {
        diffs.push(zs.map((z) => z.str).join(""));
        if (diffs.length >= 5) break;
      }
    }
    expect(diffs).toEqual([]);
  });
});

test("规则表完整性 — 条数与原文件一致", () => {
  expect(XPCHC.rules.filter((r) => r.kind === "相破")).toHaveLength(6);
  expect(XPCHC.rules.filter((r) => r.kind === "相冲")).toHaveLength(6);
  expect(XPCHC.rules.filter((r) => r.kind === "相害")).toHaveLength(6);
  expect(XPCHC.rules.filter((r) => r.kind === "相刑")).toHaveLength(13);   // 2 triple + 6 pair + 子卯 + 4 自刑
  expect(HeHuiC.rules.filter((r) => r.kind === "六合")).toHaveLength(6);
  expect(HeHuiC.rules.filter((r) => r.kind === "三合")).toHaveLength(4);
  expect(HeHuiC.rules.filter((r) => r.kind === "三会")).toHaveLength(4);
  expect(HeHuiC.rules.filter((r) => r.kind === "暗合")).toHaveLength(9);
});

test("每条规则都能被自身的支推断出来", () => {
  for (const r of XPCHC.rules) {
    const zs = r.size === 1 ? [r.zhis[0]!, r.zhis[0]!] : [...r.zhis];
    expect(XPCHC.infer(zs).map((h) => h.rule.name)).toContain(r.name);
  }
  for (const r of HeHuiC.rules) {
    expect(HeHuiC.infer([...r.zhis]).map((h) => h.rule.name)).toContain(r.name);
  }
});

describe("DiZhiDetector 算法入口 — 全排列 12^4", () => {
  test("hits = XPCHC.infer + HeHuiC.infer 之并", () => {
    const diffs: string[] = [];
    for (const zs of ALL) {
      const want = uniqSort([
        ...XPCHC.infer(zs).map((h) => h.rule.name),
        ...HeHuiC.infer(zs).map((h) => h.rule.name),
      ]);
      const got = uniqSort(DiZhiDetector.detect(zs).hits.map((h) => h.name));
      if (got.join("|") !== want.join("|")) {
        diffs.push(zs.map((z) => z.str).join(""));
        if (diffs.length >= 5) break;
      }
    }
    expect(diffs).toEqual([]);
  });

  test("byKind 八类之和 = 全部命中", () => {
    const KS = ["相刑", "相破", "相冲", "相害", "六合", "三合", "三会", "暗合"] as const;
    for (const zs of ALL) {
      const d = DiZhiDetector.detect(zs);
      const sum = KS.reduce((n, k) => n + d.byKind(k).length, 0);
      expect(sum).toBe(d.hits.length);
    }
  });

  test("byFamily 两族之和 = 全部命中, 且族归属正确", () => {
    for (const zs of ALL) {
      const d = DiZhiDetector.detect(zs);
      expect(d.byFamily("XPCH").length + d.byFamily("合会").length).toBe(d.hits.length);
      for (const h of d.byFamily("XPCH")) expect(h.rule).toBeInstanceOf(XPCHC);
      for (const h of d.byFamily("合会")) expect(h.rule).toBeInstanceOf(HeHuiC);
    }
  });

  test("bySlot: 每柱的命中恰为 slots 含该柱者", () => {
    for (const zs of ALL) {
      const d = DiZhiDetector.detect(zs);
      for (let i = 0; i < zs.length; i++) {
        expect(d.bySlot(i).map((h) => h.name))
          .toEqual(d.hits.filter((h) => h.slots.includes(i)).map((h) => h.name));
      }
    }
  });

  test("byZhi: 每支的命中恰为 zhis 含该支者", () => {
    for (const zs of ALL) {
      const d = DiZhiDetector.detect(zs);
      for (const z of new Set(zs)) {
        expect(d.byZhi(z).map((h) => h.name))
          .toEqual(d.hits.filter((h) => h.zhis.includes(z)).map((h) => h.name));
      }
    }
  });

  test("empty 当且仅当无命中; report 自洽", () => {
    for (const zs of ALL) {
      const d = DiZhiDetector.detect(zs);
      expect(d.hits.length === 0).toBe(d.hits.length === 0);
      expect(d.report.zhis).toEqual(zs);
      expect(d.report.mask).toBe(zhiMask(zs));
      expect(d.subsets.map((s) => s.name))
        .toEqual(HeHuiC.inferSubsets(zs).map((s) => s.name));
    }
  });
});

describe("相刑 计数 — 重支盘每个配对各一条 (已定案, 与原 地支相刑.ts 不同)", () => {
  const CASES: readonly [string, number][] = [
    ["寅巳寅巳", 4],   // 寅×2 巳×2 → 4 组 寅巳半刑
    ["寅巳申子", 3],   // 三刑齐全 → 3 个 pair 子集 (寅巳/巳申/寅申) 各一条
    ["丑未丑未", 4],   // 丑×2 未×2 → 4 组 丑未半刑
  ];
  for (const [zs, want] of CASES) {
    test(`${zs} 半刑 ${want} 条`, () => {
      const half = DiZhiDetector.detect([...zs].map((c) => ZhiC.from(c as Zhi)))
        .byKind("相刑")
        .filter((h) => (h.rule as XPCHC).meta().kind === "相刑"
          && ((h.rule as XPCHC).meta() as { sub?: string }).sub === "半刑");
      expect(half).toHaveLength(want);
    });
  }

  test("自刑 只出一条, slots 列全部重出位", () => {
    for (const [zs, want] of [["辰辰辰辰", [0, 1, 2, 3]], ["辰子辰午", [0, 2]]] as const) {
      const self = DiZhiDetector.detect([...zs].map((c) => ZhiC.from(c as Zhi)))
        .byKind("相刑")
        .filter((h) => ((h.rule as XPCHC).meta() as { sub?: string }).sub === "自刑");
      expect(self).toHaveLength(1);
      expect(self[0]!.slots).toEqual(want as unknown as number[]);
    }
  });
});
