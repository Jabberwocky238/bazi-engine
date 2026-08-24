/** OLD tables copied verbatim from git HEAD (6d01ff5) — test fixture for cross-validation. */
import type { WuXing, Relation } from "@/types.ts";

export const OLD_WUXING_RELATION_TABLE: readonly (readonly Relation[])[] = [

    //       木      火      土      金      水
    ["同类", "我生", "我克", "克我", "生我"], // 木
    ["生我", "同类", "我生", "我克", "克我"], // 火
    ["克我", "生我", "同类", "我生", "我克"], // 土
    ["我生", "克我", "生我", "同类", "我生"], // 金
    ["生我", "我克", "克我", "生我", "同类"], // 水
];

export const OLD_WUXING_BY_RELATION: readonly (readonly WuXing[])[] = [

    ["木", "火", "土", "金", "水"], // 同类
    ["火", "土", "金", "水", "木"], // 我生
    ["土", "水", "火", "金", "木"], // 我克
    ["金", "木", "水", "火", "土"], // 克我
    ["水", "木", "金", "土", "火"], // 生我
];
