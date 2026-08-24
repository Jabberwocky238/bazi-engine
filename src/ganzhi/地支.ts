import { ZHI } from "@/types.ts";
import { createTable, createBitList, type Table } from "@/bitmap.ts";

export type DiZhiRelation = "六合" | "相冲" | "相破" | "相害" | "自刑" | "半刑" | "相刑" | null;
export const DI_ZHI_RELATION_TABLE = [
  [null,"六合",null,"相刑",null,null,"相冲","相害",null,"相破",null,null],
  ["六合",null,null,null,"相破",null,"相害","半刑",null,null,"半刑",null],
  [null,null,null,null,null,"半刑",null,null,"半刑",null,null,"六合"],
  ["相刑",null,null,null,"相害",null,"相破",null,null,"相冲","六合",null],
  [null,"相破",null,"相害","自刑",null,null,null,"六合","六合","相冲",null],
  [null,null,"半刑",null,null,null,null,null,"六合",null,null,"相冲"],
  ["相冲","相害",null,"相破",null,null,"自刑","六合",null,null,null,null],
  ["相害","半刑",null,null,null,null,"六合",null,null,null,"半刑",null],
  [null,null,"半刑",null,"六合","六合",null,null,null,null,null,"相害"],
  ["相破",null,null,"相冲","六合",null,null,null,null,"自刑","相害",null],
  [null,"半刑",null,"六合","相冲",null,null,"半刑",null,"相害",null,null],
  [null,null,"六合",null,null,"相冲",null,null,"相害",null,null,"自刑"],
] as const satisfies Table<DiZhiRelation, [12, 12]>;
export const DI_ZHI_RELATION_TABLE_WRAPPER = createTable(DI_ZHI_RELATION_TABLE, ZHI, ZHI);
