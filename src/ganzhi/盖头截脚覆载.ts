/**
 * 盖头: 柱内天干克地支 (天干盖压地支).
 *   木柱: 甲/乙 + 辰/戌/丑/未  (木克土)
 *   火柱: 丙/丁 + 申/酉        (火克金)
 *   土柱: 戊/己 + 子/亥        (土克水)
 *   金柱: 庚/辛 + 寅/卯        (金克木)
 *   水柱: 壬/癸 + 巳/午        (水克火)
 *
 * 天干受地支反制能力削弱, 地支根基被压制, 整柱力量打折.
 * 一柱内紧贴作用 —— close 恒为 true.
 */
/**
 * 截脚: 柱内地支克天干 (地支反噬天干, 天干失根).
 *   木柱: 甲/乙 + 申/酉        (金克木)
 *   火柱: 丙/丁 + 子/亥        (水克火)
 *   土柱: 戊/己 + 寅/卯        (木克土)
 *   金柱: 庚/辛 + 巳/午        (火克金)
 *   水柱: 壬/癸 + 辰/戌/丑/未  (土克水)
 *
 * 天干虚浮无根, 被自己坐下反克, 整柱尤其天干显象力量大损.
 * 一柱内紧贴作用 —— close 恒为 true.
 */
/**
 * 覆载: 柱内天干与地支为相生 / 同气关系, 天干有根、地支被覆, 整柱力量集中.
 *   三种子态:
 *     - 同气: 干支五行相同           (甲寅 / 乙卯 / 丙午 / 丁巳 ...)
 *     - 得覆: 天干生地支 (天覆地)    (甲午 — 木生火, 地支受生)
 *     - 得载: 地支生天干 (地载天)    (甲子 — 水生木, 天干有根)
 *
 * 同气最稳、得载次之 (天干坐印)、得覆偏泄 (天干气泄). 皆归同一 kind,
 * 通过 sub 区分. 一柱内紧贴作用 —— close 恒为 true.
 */
import type { Gan, Pillar, WuXing, Zhi } from "../types.ts";
import { CONTROLS, GENERATES } from "../wuxing.ts";
import { ganWuxing, zhiWuxing, POS_NAMES } from "./common.ts";

// ———————————————————————————————————————————————
// 结构化类型 — detect 返回 GaiTouJieJiaoFuZaiFinding | undefined
// ———————————————————————————————————————————————
// 整柱类 (盖头/截脚/覆载), 一柱内天干地支作用, 紧贴恒真.
// 判别信息: 干支 / 双方五行 / 子类别 (覆载: 同气/得覆/得载).
// 旧版把覆载子态压进 name + note.

/** 覆载子态. */
export type FuZaiSub = "同气" | "得覆" | "得载";

/** 整柱共有字段. */
export interface WholePillarBase {
  /** 柱位 (0=年 1=月 2=日 3=时). */
  slot: number;
  positions: string;
  /** 天干. */
  gan: Gan;
  /** 地支. */
  zhi: Zhi;
  /** 天干五行. */
  ganWx: WuXing;
  /** 地支五行. */
  zhiWx: WuXing;
}

/** 盖头 — 天干克地支. */
export interface GaiTouFinding extends WholePillarBase {
  kind: "盖头";
}

/** 截脚 — 地支克天干. */
export interface JieJiaoFinding extends WholePillarBase {
  kind: "截脚";
}

/** 覆载 — 干支相生/同气. */
export interface FuZaiFinding extends WholePillarBase {
  kind: "覆载";
  sub: FuZaiSub;
}

export type WholePillarFinding = GaiTouFinding | JieJiaoFinding | FuZaiFinding;

function classify(gw: WuXing, zw: WuXing): FuZaiSub | null {
  if (gw === zw) return "同气";
  if (GENERATES[gw] === zw) return "得覆";
  if (GENERATES[zw] === gw) return "得载";
  return null;
}

function detect(pillar: Pillar, slot: number): WholePillarFinding | undefined {
  const gw = ganWuxing(pillar.gan);
  const zw = zhiWuxing(pillar.zhi);
  const base = {
    slot,
    positions: POS_NAMES[slot]!,
    gan: pillar.gan,
    zhi: pillar.zhi,
    ganWx: gw,
    zhiWx: zw,
  };
  const st = classify(gw, zw);
  if (st) return { ...base, kind: "覆载", sub: st };
  if (CONTROLS[zw] === gw) return { ...base, kind: "截脚" };
  if (CONTROLS[gw] === zw) return { ...base, kind: "盖头" };
  return undefined;
}

export { detect };
