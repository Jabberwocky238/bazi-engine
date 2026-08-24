/**
 * 合冲刑害 共享内核 —— 位图关系推断 + 岁运柱输入.
 *
 * 干支基础 (五行属性 / 藏干 / 阴阳) 一律取 types.ts 的 GanC / ZhiC / WuXingC,
 * 本文件不再另立一套同源包装.
 *
 * 类别编目 (API 权威清单, 共 9 个):
 *   天干: 天干五合 / 天干相克
 *     (天干相冲并入天干相克; API 对天干冲克统一标 "相克")
 *   地支: 地支六合 / 地支三合 / 地支三会 / 地支暗合
 *         地支相刑 / 地支相冲 / 地支相破 / 地支相害
 *
 * 墓库 为工具附加, 不在 API 清单内.
 * 争合 / 妒合 为 天干五合 的子态, 单独成条便于展示.
 */

// ———————————————————————————————————————————————
// 位图关系推断 — 天干.ts / 地支.ts 共用
// ———————————————————————————————————————————————
// 一组干支的掩码即该关系的身份, 判定只是 (盘 & 键) === 键.
// 本段与具体是干还是支无关, 故泛型化: Item 为 GanC | ZhiC.

/** 掩码里有几位. */
export function popcount(m: number): number {
  let n = 0;
  for (let x = m; x; x &= x - 1) n++;
  return n;
}

/** 笛卡尔积 — 各位置的下标各取一个. */
export function product(lists: readonly (readonly number[])[]): readonly (readonly number[])[] {
  return lists.reduce<readonly (readonly number[])[]>(
    (acc, list) => acc.flatMap((pre) => list.map((v) => [...pre, v])),
    [[]],
  );
}

/** 下标数组 → 位掩码 (bit i = 占第 i 柱). */
export function slotsToMask(slots: readonly number[]): number {
  return slots.reduce((m, i) => m | (1 << i), 0);
}

/** item → 其出现的全部下标 (升序). */
export function slotIndex<T>(items: readonly T[]): ReadonlyMap<T, number[]> {
  const m = new Map<T, number[]>();
  items.forEach((it, i) => {
    const arr = m.get(it);
    if (arr) arr.push(i); else m.set(it, [i]);
  });
  return m;
}

/** 一条命中: 关系 + 命中它的那几个下标 (升序). */
export interface BitHit<R> {
  readonly rule: R;
  readonly slots: readonly number[];
}

/** 位图关系的最小形状 —— 掩码即身份. */
export interface BitRule {
  readonly mask: number;
  readonly size: number;
}

/**
 * 批量推断 —— 逐条 & 一下即知命中.
 *
 * 掩码只答"有没有"; 一位重出多次时同一关系成立多次 (子午子午 有 4 组子午冲),
 * 故命中后取各位下标的笛卡尔积, 每个组合各出一条 —— 计数即条数.
 * 单位掩码 (自刑 之类) 须重出 ≥2 次, 且只出一条, slots 列全部重出位.
 */
export function inferBitHits<T, R extends BitRule>(
  rules: readonly R[],
  items: readonly T[],
  itemsOf: (mask: number) => readonly T[],
  maskOf: (items: readonly T[]) => number,
): readonly BitHit<R>[] {
  const slotsOf = slotIndex(items);
  const mask = maskOf(items);

  const out: BitHit<R>[] = [];
  for (const rule of rules) {
    if ((mask & rule.mask) !== rule.mask) continue;   // ← 判定就这一句
    const members = itemsOf(rule.mask);
    if (rule.size === 1) {
      const ss = slotsOf.get(members[0]!)!;
      if (ss.length >= 2) out.push({ rule, slots: [...ss] });
      continue;
    }
    for (const slots of product(members.map((it) => slotsOf.get(it)!))) {
      out.push({ rule, slots: [...slots].sort((a, b) => a - b) });
    }
  }
  return out;
}
