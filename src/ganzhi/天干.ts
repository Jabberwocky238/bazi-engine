import { GAN } from "@/types.ts";
import { createTable, type Table } from "@/bitmap";

export type TianGanRelation = "相合" | "相冲" | "相克" | null;

export const TIAN_GAN_RELATION_TABLE = [
  [null, null, null, null, "相克", "相合", "相冲", null, null, null],
  [null, null, null, null, null, "相克", "相合", "相冲", null, null],
  [null, null, null, null, null, null, "相克", "相合", "相冲", null],
  [null, null, null, null, null, null, null, "相克", "相合", "相冲"],
  ["相克", null, null, null, null, null, null, null, "相克", "相合"],
  ["相合", "相克", null, null, null, null, null, null, null, "相克"],
  ["相冲", "相合", "相克", null, null, null, null, null, null, null],
  [null, "相冲", "相合", "相克", null, null, null, null, null, null],
  [null, null, "相冲", "相合", "相克", null, null, null, null, null],
  [null, null, null, "相冲", "相合", "相克", null, null, null, null],
] as const satisfies Table<TianGanRelation, [10, 10]>;

export const TIAN_GAN_RELATION_TABLE_WRAPPER = createTable(TIAN_GAN_RELATION_TABLE, GAN, GAN);
