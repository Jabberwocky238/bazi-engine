import { ZHI } from "@/types.ts";
import { createTable, type Table } from "@/bitmap";

export type DiZhiRelation = "六合" | "相冲" | "相破" | "相害" | "自刑" | "半刑" | "相刑" | null;

/** 十二地支 × 十二地支基础关系表，行列顺序均为 ZHI。 */
export const DI_ZHI_RELATION_TABLE = [
  [null, "六合", null, "相刑", null, null, "相冲", "相害", null, "相破", null, null],
  ["六合", null, null, null, "相破", null, "相害", "半刑", null, null, "半刑", null],
  [null, null, null, null, "自刑", "半刑", null, null, "半刑", null, null, "六合"],
  [null, null, null, null, "相害", null, "相破", null, null, "相冲", "六合", null],
  [null, "相破", null, "相害", null, null, null, null, null, "六合", "相冲", null],
  [null, null, "相害", null, null, null, null, null, "六合", null, null, "相冲"],
  ["相冲", "相害", null, "相破", null, null, null, "六合", null, null, null, null],
  ["相害", "相冲", null, null, null, null, "六合", null, null, null, "相破", null],
  [null, null, "相冲", null, null, "六合", null, null, null, null, null, "相害"],
  ["相破", null, null, "相冲", "六合", null, null, null, null, null, "相害", null],
  [null, null, null, "六合", "相冲", null, null, "相破", null, "相害", null, null],
  [null, null, "六合", null, null, "相冲", null, null, "相害", null, null, null],
] as const satisfies Table<DiZhiRelation, [12, 12]>;

export const DI_ZHI_RELATION_TABLE_WRAPPER = createTable(
  DI_ZHI_RELATION_TABLE,
  ZHI,
  ZHI,
);

export const DI_ZHI_RELATION_BIT = {
  六合: 0x00001,
  相冲: 0x00002,
  相破: 0x00004,
  相害: 0x00008,
  自刑: 0x00010,
  半刑: 0x00020,
  相刑: 0x00040,
  三合: 0x00080,
} as const;
export const DI_ZHI_REQUIRED_MASK_SHIFT = 0x00008;

const SAN_HE_GROUPS = [
  ["寅", "午", "戌"], ["巳", "酉", "丑"],
  ["申", "子", "辰"], ["亥", "卯", "未"],
] as const;
const bit = (zhi: (typeof ZHI)[number]) => 0x00001 << ZHI.indexOf(zhi);
const relationBit = (name: keyof typeof DI_ZHI_RELATION_BIT) => DI_ZHI_RELATION_BIT[name];

export const DI_ZHI_BITMAP_TABLE = [
  [0x00000,0x00001,0x00000,0x00040,0x10080,0x00000,0x00002,0x00008,0x01080,0x00004,0x00000,0x00000],
  [0x00001,0x00000,0x00000,0x00000,0x00004,0x20080,0x00008,0x00022,0x00000,0x02080,0x00020,0x00000],
  [0x00000,0x00000,0x00000,0x00000,0x00000,0x00028,0x40080,0x00000,0x00022,0x00000,0x04080,0x00005],
  [0x00040,0x00000,0x00000,0x00000,0x00008,0x00000,0x00004,0x80080,0x00000,0x00002,0x00001,0x08080],
  [0x10080,0x00004,0x00000,0x00008,0x00010,0x00000,0x00000,0x00000,0x00180,0x00001,0x00002,0x00000],
  [0x00000,0x20080,0x00028,0x00000,0x00000,0x00000,0x00000,0x00000,0x00025,0x00280,0x00000,0x00002],
  [0x00002,0x00008,0x40080,0x00004,0x00000,0x00000,0x00010,0x00001,0x00000,0x00000,0x00480,0x00000],
  [0x00008,0x00022,0x00000,0x80080,0x00000,0x00000,0x00001,0x00000,0x00000,0x00000,0x00024,0x00880],
  [0x01080,0x00000,0x00022,0x00000,0x00180,0x00025,0x00000,0x00000,0x00000,0x00000,0x00000,0x00008],
  [0x00004,0x02080,0x00000,0x00002,0x00001,0x00280,0x00000,0x00000,0x00000,0x00010,0x00008,0x00000],
  [0x00000,0x00020,0x04080,0x00001,0x00002,0x00000,0x00480,0x00024,0x00000,0x00008,0x00000,0x00000],
  [0x00000,0x00000,0x00005,0x08080,0x00000,0x00002,0x00000,0x00880,0x00008,0x00000,0x00000,0x00010],
] as const satisfies Table<number, [12, 12]>;

export const DI_ZHI_BITMAP_TABLE_WRAPPER = createTable(
  DI_ZHI_BITMAP_TABLE,
  ZHI,
  ZHI,
);

export const ZHI_BIT: Readonly<Record<(typeof ZHI)[number], number>> = Object.fromEntries(
  ZHI.map((zhi, index) => [zhi, 0x00001 << index]),
) as Record<(typeof ZHI)[number], number>;

const mask = (...zhis: readonly (typeof ZHI)[number][]): number =>
  zhis.reduce((value, zhi) => value | ZHI_BIT[zhi], 0x00000);

export const ZHI_RELATION_MASKS = {
  六合: {
    子: mask("丑"), 丑: mask("子"), 寅: mask("亥"), 卯: mask("戌"), 辰: mask("酉"), 巳: mask("申"),
    午: mask("未"), 未: mask("午"), 申: mask("巳"), 酉: mask("辰"), 戌: mask("卯"), 亥: mask("寅"),
  },
  相冲: {
    子: mask("午"), 丑: mask("未"), 寅: mask("申"), 卯: mask("酉"), 辰: mask("戌"), 巳: mask("亥"),
    午: mask("子"), 未: mask("丑"), 申: mask("寅"), 酉: mask("卯"), 戌: mask("辰"), 亥: mask("巳"),
  },
  相破: {
    子: mask("酉"), 丑: mask("辰"), 寅: mask("亥"), 卯: mask("午"), 辰: mask("丑"), 巳: mask("申"),
    午: mask("卯"), 未: mask("戌"), 申: mask("巳"), 酉: mask("子"), 戌: mask("未"), 亥: mask("寅"),
  },
  相害: {
    子: mask("未"), 丑: mask("午"), 寅: mask("巳"), 卯: mask("辰"), 辰: mask("卯"), 巳: mask("寅"),
    午: mask("丑"), 未: mask("子"), 申: mask("亥"), 酉: mask("戌"), 戌: mask("酉"), 亥: mask("申"),
  },
  自刑: {
    子: 0x00000, 丑: 0x00000, 寅: 0x00000, 卯: 0x00000, 辰: mask("辰"), 巳: 0x00000,
    午: mask("午"), 未: 0x00000, 申: 0x00000, 酉: mask("酉"), 戌: 0x00000, 亥: mask("亥"),
  },
  半刑: {
    子: 0x00000, 丑: mask("未", "戌"), 寅: mask("巳", "申"), 卯: 0x00000, 辰: 0x00000, 巳: mask("寅", "申"),
    午: 0x00000, 未: mask("丑", "戌"), 申: mask("寅", "巳"), 酉: 0x00000, 戌: mask("丑", "未"), 亥: 0x00000,
  },
  相刑: {
    子: mask("卯"), 丑: 0x00000, 寅: 0x00000, 卯: mask("子"), 辰: 0x00000, 巳: 0x00000,
    午: 0x00000, 未: 0x00000, 申: 0x00000, 酉: 0x00000, 戌: 0x00000, 亥: 0x00000,
  },
} as const;

export function hasZhiRelation(
  relation: keyof typeof ZHI_RELATION_MASKS,
  source: (typeof ZHI)[number],
  target: (typeof ZHI)[number],
): boolean {
  return (ZHI_RELATION_MASKS[relation][source] & ZHI_BIT[target]) !== 0x00000;
}



export const ZHI_BIT_LIST = createBitList(ZHI, 4);

export const DI_ZHI_RELATIONS = [
  "六合", "相冲", "相破", "相害", "自刑", "半刑", "相刑", "三合",
] as const;
export const DI_ZHI_RELATION_BIT_LIST = createBitList(DI_ZHI_RELATIONS, 3);

export const DI_ZHI_RELATION_MASK = 0x000ff;
export const DI_ZHI_REQUIRED_ZHI_MASK = 0xfff00;

export interface DiZhiRelationCode {
  readonly relations: BitListT<typeof DI_ZHI_RELATIONS, 8>;
  readonly requiredZhis: BitListT<typeof ZHI, 12>;
}

export function decodeDiZhiRelation(code: number): DiZhiRelationCode {
  return {
    relations: DI_ZHI_RELATION_BIT_LIST.decode(code & DI_ZHI_RELATION_MASK),
    requiredZhis: ZHI_BIT_LIST.decode(
      (code & DI_ZHI_REQUIRED_ZHI_MASK) >>> Number(DI_ZHI_REQUIRED_MASK_SHIFT),
    ),
  };
}

export function getDiZhiRelation(
  source: (typeof ZHI)[number],
  target: (typeof ZHI)[number],
): DiZhiRelationCode {
  return decodeDiZhiRelation(DI_ZHI_BITMAP_TABLE_WRAPPER[source][target]);
}

export function decodeZhiBits(mask: number): BitListT<typeof ZHI, typeof ZHI["length"]> {
  return ZHI_BIT_LIST.decode(mask);
}
