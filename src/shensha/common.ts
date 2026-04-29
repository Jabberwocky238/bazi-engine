/**
 * 神煞判定共享类型与极小工具. 不放任何查表 const —
 * 每个神煞自己的数据在各自的文件里.
 */
import type { GanZhi, Pillar, Sex, Zhi } from "../types.ts";
import { ZHI } from "../types.ts";

export type PillarIndex = 0 | 1 | 2 | 3;

/**
 * 四主柱 tuple, 顺序为 年/月/日/时. 时柱可缺 (时辰未知场景).
 * computeShensha 在 hour === undefined 时不会以 i=3 调用 detector,
 * 但 detector 仍可能从其他柱的 check 中读到 pillars[3] (例如 拱禄 / 金神 / 三奇贵人), 这些情形需要 detector 自行判空.
 */
export type ShenshaPillars = readonly [Pillar, Pillar, Pillar, Pillar | undefined];

/**
 * 神煞判定. 入参为四主柱 tuple + 性别 + 当前柱 index.
 * 仅 元辰 用到 sex; 其他 detector 写 `(pillars, i)` 即可, 第三参数省略.
 */
export type ShenshaCheck = (
  pillars: ShenshaPillars,
  i: PillarIndex,
  sex: Sex,
) => boolean;

export type ShenshaDef = {
  readonly name: string;
  readonly check: ShenshaCheck;
};

/**
 * 取第 i 柱. 调用方需保证 i 对应的柱不为 undefined (即 i!==3 或 hour 已知);
 * computeShensha 入口已按此过滤, detector 如需手动越过该约束应直接读 pillars[3]
 * 并自行判空 (见 拱禄 / 金神 / 三奇贵人).
 */
export const pillarAt = (pillars: ShenshaPillars, i: PillarIndex): Pillar => pillars[i]!;
export const gzOf = (p: Pillar): GanZhi => `${p.gan}${p.zhi}` as GanZhi;

/** 以 base 为起点沿 ZHI 顺行 `off` 位. */
export function zhiOffset(base: Zhi, off: number): Zhi {
  const idx = (ZHI.indexOf(base) + off + 12) % 12;
  return ZHI[idx] as Zhi;
}
