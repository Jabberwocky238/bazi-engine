/**
 * 神煞计算入口. 每个神煞的数据 + 判定封装在同目录下同名文件里;
 * 本文件只负责 (a) 注册表 (b) 批量计算 computeShensha (c) 导出 API.
 */
import type { BaziInput, Gan, Zhi } from "../types.ts";
import { GAN, ZHI } from "../types.ts";
import { PILLAR_KEYS, type ShenshaCheck } from "./common.ts";

export type { PillarIndex, ShenshaCheck, ShenshaDef } from "./common.ts";

import { 禄神 } from "./禄神.ts";
import { 天乙贵人 } from "./天乙贵人.ts";
import { 羊刃 } from "./羊刃.ts";
import { 飞刃 } from "./飞刃.ts";
import { 福星贵人 } from "./福星贵人.ts";
import { 太极贵人 } from "./太极贵人.ts";
import { 文昌贵人 } from "./文昌贵人.ts";
import { 天厨贵人 } from "./天厨贵人.ts";
import { 童子煞 } from "./童子煞.ts";
import { 桃花 } from "./桃花.ts";
import { 将星 } from "./将星.ts";
import { 华盖 } from "./华盖.ts";
import { 驿马 } from "./驿马.ts";
import { 劫煞 } from "./劫煞.ts";
import { 灾煞 } from "./灾煞.ts";
import { 亡神 } from "./亡神.ts";
import { 红鸾 } from "./红鸾.ts";
import { 天喜 } from "./天喜.ts";
import { 孤辰 } from "./孤辰.ts";
import { 寡宿 } from "./寡宿.ts";
import { 月德贵人 } from "./月德贵人.ts";
import { 月德合 } from "./月德合.ts";
import { 天德贵人 } from "./天德贵人.ts";
import { 天德合 } from "./天德合.ts";
import { 德秀贵人 } from "./德秀贵人.ts";
import { 空亡 } from "./空亡.ts";
import { 孤鸾煞 } from "./孤鸾煞.ts";
import { 丧门 } from "./丧门.ts";
import { 吊客 } from "./吊客.ts";
import { 披麻 } from "./披麻.ts";
import { 勾绞煞 } from "./勾绞煞.ts";
import { 元辰 } from "./元辰.ts";
import { 天转日 } from "./天转日.ts";
import { 地转日 } from "./地转日.ts";
import { 天赦日 } from "./天赦日.ts";
import { 天罗 } from "./天罗.ts";
import { 拱禄 } from "./拱禄.ts";
import { 三奇贵人 } from "./三奇贵人.ts";
import { 六秀日 } from "./六秀日.ts";
import { 魁罡日 } from "./魁罡日.ts";
import { 金神 } from "./金神.ts";
import { 四废日 } from "./四废日.ts";
import { 地网 } from "./地网.ts";
import { 正学堂 } from "./正学堂.ts";
import { 正词馆 } from "./正词馆.ts";
import { 学堂 } from "./学堂.ts";
import { 词馆 } from "./词馆.ts";
import { 天罗地网 } from "./天罗地网.ts";
import { 十恶大败 } from "./十恶大败.ts";
import { 阴差阳错 } from "./阴差阳错.ts";
import { 十灵日 } from "./十灵日.ts";
import { 九丑日 } from "./九丑日.ts";
import { 八专日 } from "./八专日.ts";
import { 金舆 } from "./金舆.ts";
import { 国印贵人 } from "./国印贵人.ts";
import { 红艳煞 } from "./红艳煞.ts";
import { 流霞 } from "./流霞.ts";
import { 天医 } from "./天医.ts";
import { 血刃 } from "./血刃.ts";

export {
  禄神, 天乙贵人, 羊刃, 飞刃, 福星贵人, 太极贵人, 文昌贵人, 天厨贵人,
  童子煞, 桃花, 将星, 华盖, 驿马, 劫煞, 灾煞, 亡神,
  红鸾, 天喜, 孤辰, 寡宿,
  月德贵人, 月德合, 天德贵人, 天德合, 德秀贵人,
  空亡, 孤鸾煞,
  丧门, 吊客, 披麻, 勾绞煞, 元辰,
  天转日, 地转日, 天赦日, 天罗, 拱禄, 三奇贵人,
  六秀日, 魁罡日, 金神, 四废日, 地网,
  正学堂, 正词馆, 学堂, 词馆, 天罗地网,
  十恶大败, 阴差阳错, 十灵日, 九丑日, 八专日,
  金舆, 国印贵人, 红艳煞, 流霞, 天医, 血刃,
};

export const SHENSHA_DEFS = [
  禄神, 天乙贵人, 羊刃, 飞刃, 福星贵人, 太极贵人, 文昌贵人, 天厨贵人,
  童子煞, 桃花, 将星, 华盖, 驿马, 劫煞, 灾煞, 亡神,
  红鸾, 天喜, 孤辰, 寡宿,
  月德贵人, 月德合, 天德贵人, 天德合, 德秀贵人,
  空亡, 孤鸾煞,
  丧门, 吊客, 披麻, 勾绞煞, 元辰,
  天转日, 地转日, 天赦日, 天罗, 拱禄, 三奇贵人,
  六秀日, 魁罡日, 金神, 四废日, 地网,
  正学堂, 正词馆, 学堂, 词馆, 天罗地网,
  十恶大败, 阴差阳错, 十灵日, 九丑日, 八专日,
  金舆, 国印贵人, 红艳煞, 流霞, 天医, 血刃,
] as const;

export type Shensha = typeof SHENSHA_DEFS[number]["name"];

/** 名称完整清单. 与 SHENSHA_DEFS 顺序一致. */
export const ALL_SHENSHA = SHENSHA_DEFS.map(s => s.name) as readonly Shensha[];

/** `[name, check]` 对, 兼容旧 API 签名. */
export const SHENSHA_CHECKS: readonly (readonly [Shensha, ShenshaCheck])[] =
  SHENSHA_DEFS.map(s => [s.name, s.check]);

export type ShenshaResult = { year: Shensha[]; month: Shensha[]; day: Shensha[]; hour: Shensha[] };

const isGan = (x: string): x is Gan => (GAN as readonly string[]).includes(x);
const isZhi = (x: string): x is Zhi => (ZHI as readonly string[]).includes(x);

function validate(b: BaziInput): void {
  for (const key of PILLAR_KEYS) {
    const p = b[key];
    if (!isGan(p.gan)) throw new Error(`${key}.gan invalid: ${p.gan}`);
    if (!isZhi(p.zhi)) throw new Error(`${key}.zhi invalid: ${p.zhi}`);
  }
}

export function computeShensha(input: BaziInput): ShenshaResult {
  validate(input);
  const out: Shensha[][] = [[], [], [], []];
  for (const def of SHENSHA_DEFS) {
    for (const i of [0, 1, 2, 3] as const) {
      if (def.check(input, i)) out[i]!.push(def.name);
    }
  }
  return { year: out[0]!, month: out[1]!, day: out[2]!, hour: out[3]! };
}
