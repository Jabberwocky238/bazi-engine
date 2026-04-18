/**
 * 八字 -> 十神 (ten gods). Pure library — no IO.
 *
 * Produces, relative to the day stem:
 *   ss:    string[4]          -- 年/月/日/时 天干十神 (day pillar is "日主")
 *   cg:    string[4][]        -- 各支藏干 (per the dataset's convention)
 *   cgss:  string[4][]        -- 藏干对应十神
 */
import { type Gan, type Zhi, type Pillar, type BaziInput, GAN } from "./shensha.ts";

export type ShishenResult = {
  ss: string[];
  cg: string[][];
  cgss: string[][];
};

// 五行
const WU_XING: Readonly<Record<Gan, "木" | "火" | "土" | "金" | "水">> = {
  甲:"木", 乙:"木",
  丙:"火", 丁:"火",
  戊:"土", 己:"土",
  庚:"金", 辛:"金",
  壬:"水", 癸:"水",
};

// 阴阳: 甲丙戊庚壬=阳, 乙丁己辛癸=阴
function isYang(g: Gan): boolean {
  return GAN.indexOf(g) % 2 === 0;
}

// 地支藏干 (convention observed in scraped dataset)
const CANG_GAN: Readonly<Record<Zhi, readonly Gan[]>> = {
  子:["癸"],
  丑:["己","癸","辛"],
  寅:["甲","丙","戊"],
  卯:["乙"],
  辰:["戊","乙","癸"],
  巳:["丙","庚","戊"],
  午:["丁","己"],
  未:["己","丁","乙"],
  申:["庚","壬","戊"],
  酉:["辛"],
  戌:["戊","辛","丁"],
  亥:["壬","甲"],
};

/**
 * Ten-god name for `other` relative to `day`.
 *  我生: 同阴阳=食神 异=伤官
 *  我克: 同=偏财 异=正财
 *  克我: 同=七杀 异=正官
 *  生我: 同=偏印 异=正印
 *  同类: 同=比肩 异=劫财
 */
export function shishenOf(day: Gan, other: Gan): string {
  const dx = WU_XING[day], ox = WU_XING[other];
  const same = isYang(day) === isYang(other);

  if (dx === ox) return same ? "比肩" : "劫财";

  // 生克关系: 木生火, 火生土, 土生金, 金生水, 水生木
  //           木克土, 土克水, 水克火, 火克金, 金克木
  const generates: Record<string, string> = { 木:"火", 火:"土", 土:"金", 金:"水", 水:"木" };
  const controls:  Record<string, string> = { 木:"土", 土:"水", 水:"火", 火:"金", 金:"木" };

  if (generates[dx] === ox) return same ? "食神" : "伤官"; // 我生
  if (controls[dx]  === ox) return same ? "偏财" : "正财"; // 我克
  if (controls[ox]  === dx) return same ? "七杀" : "正官"; // 克我
  if (generates[ox] === dx) return same ? "偏印" : "正印"; // 生我

  throw new Error(`unreachable: ${day} vs ${other}`);
}

export function computeShishen(input: BaziInput): ShishenResult {
  const day = input.day.gan;
  const pillars: Pillar[] = [input.year, input.month, input.day, input.hour];

  const ss = pillars.map((p, i) => (i === 2 ? "日主" : shishenOf(day, p.gan)));
  const cg = pillars.map(p => [...CANG_GAN[p.zhi]]);
  const cgss = cg.map(gans => gans.map(g => shishenOf(day, g)));

  return { ss, cg, cgss };
}
