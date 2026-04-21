/**
 * 核心类型与基础序列常量.
 *
 * 这里只放被其它模块普遍依赖的 "原子" 类型与字面量元组; 具体领域常量
 * (五行生克表 / 十神 / 神煞等) 拆入对应模块.
 */

export const WUXING = ["木", "火", "土", "金", "水"] as const;
export const GAN = ["甲","乙","丙","丁","戊","己","庚","辛","壬","癸"] as const;
export const ZHI = ["子","丑","寅","卯","辰","巳","午","未","申","酉","戌","亥"] as const;

export type WuXing = typeof WUXING[number];
export type Gan = typeof GAN[number];
export type Zhi = typeof ZHI[number];
export type GanZhi = `${Gan}${Zhi}`;
export type TriadKey = "申子辰" | "寅午戌" | "亥卯未" | "巳酉丑";
export type NayinWuxing = "金" | "火" | "木" | "土" | "水";
export type Season = "春" | "夏" | "秋" | "冬";

export type Pillar = { gan: Gan; zhi: Zhi };
/** sex: 1 = 男, 0 = 女. 性别相关神煞 (如 元辰) 必填. */
export type Sex = 0 | 1;
export type BaziInput = { year: Pillar; month: Pillar; day: Pillar; hour: Pillar; sex: Sex };

/** 日主与某天干的五行关系 (不分阴阳). */
export type Relation = "同类" | "我生" | "我克" | "克我" | "生我";
