/**
 * 墓库 (开 / 闭 / 静).
 * md: 墓库/墓库总论.md + 开库.md + 闭库.md + 出库.md
 *
 *   辰 = 水库 (癸), 未 = 木库 (乙), 戌 = 火库 (丁), 丑 = 金库 (辛)
 *
 *   开启路径:
 *     - 墓气透干无冲克         → 自动开库
 *     - 被对冲支冲 / 丑戌未三刑 → 冲 / 刑 开库
 *     - 特定天干组合冲开天库    → 丁癸 开辰戌, 乙辛 开未丑
 *   封闭路径:
 *     - 墓气透干 + 特定天干合   → 戊癸合辰, 乙庚合未, 丁壬合戌, 丙辛合丑
 *   默认:
 *     - 墓气未透 → 闭库
 */
import type { Pillar } from "../../types.ts";
import { POS_NAMES, hasGan, type Finding } from "../common.ts";

interface KuInfo {
  readonly benqi: string;
  readonly zhongqi: string;
  readonly muqi: string;
  readonly muqiWx: string;
  readonly name: string;
}

const MUKU: Readonly<Record<string, KuInfo>> = {
  辰: { benqi: "戊", zhongqi: "乙", muqi: "癸", muqiWx: "水", name: "水库" },
  未: { benqi: "己", zhongqi: "丁", muqi: "乙", muqiWx: "木", name: "木库" },
  戌: { benqi: "戊", zhongqi: "辛", muqi: "丁", muqiWx: "火", name: "火库" },
  丑: { benqi: "己", zhongqi: "癸", muqi: "辛", muqiWx: "金", name: "金库" },
};

/** 对冲支 (辰↔戌, 丑↔未). */
const CHONG_PAIR: Readonly<Record<string, string>> = {
  辰: "戌", 戌: "辰", 丑: "未", 未: "丑",
};

/** 天干冲开天库. md: 开库.md — 丁癸 冲开辰戌, 乙辛 冲开未丑. */
const TIAN_CHONG_OPEN: Readonly<Record<string, readonly string[]>> = {
  丁癸: ["辰", "戌"],
  乙辛: ["未", "丑"],
};

/** 天干合闭天库. md: 闭库.md. */
const TIAN_HE_CLOSE: Readonly<Record<string, string>> = {
  戊癸: "辰", 乙庚: "未", 丁壬: "戌", 丙辛: "丑",
};

function detect(pillars: Pillar[]): Finding[] {
  const out: Finding[] = [];
  const zhiSet = pillars.map((p) => p.zhi);

  for (const [zhi, ku] of Object.entries(MUKU)) {
    const idx = zhiSet.indexOf(zhi as (typeof zhiSet)[number]);
    if (idx < 0) continue;

    const touMuqi = hasGan(pillars, ku.muqi);
    const chongCounterpart = CHONG_PAIR[zhi]!;
    const beingChong = zhiSet.includes(chongCounterpart as (typeof zhiSet)[number]);
    // 丑戌未 三刑的两两组合 (库被刑)
    const xingOpen = (zhi === "丑" && zhiSet.includes("戌")) ||
                     (zhi === "戌" && zhiSet.includes("未")) ||
                     (zhi === "未" && zhiSet.includes("丑"));

    let tianChongOpen = false;
    let tianChongNote = "";
    for (const [pair, zhis] of Object.entries(TIAN_CHONG_OPEN)) {
      if (zhis.includes(zhi) && hasGan(pillars, pair[0]!) && hasGan(pillars, pair[1]!) && touMuqi) {
        tianChongOpen = true;
        tianChongNote = `天干 ${pair} 冲开天库`;
        break;
      }
    }

    let tianHeClose = false;
    let tianHeNote = "";
    for (const [pair, targetZhi] of Object.entries(TIAN_HE_CLOSE)) {
      if (targetZhi === zhi && hasGan(pillars, pair[0]!) && hasGan(pillars, pair[1]!) && touMuqi) {
        tianHeClose = true;
        tianHeNote = `天干 ${pair} 合闭天库`;
        break;
      }
    }

    let state = "静库";
    let note = "";
    if (touMuqi && !beingChong && !xingOpen && !tianHeClose) {
      state = "自动开库";
      note = `${ku.muqi}(${ku.muqiWx}) 透干无冲克 → 不入库, 源源提供 ${ku.muqiWx} 力`;
    } else if (beingChong || xingOpen) {
      state = "冲/刑开库";
      note = `${beingChong ? `遇${chongCounterpart}冲` : "丑戌未刑"} → 强行开库, ${ku.muqi}(${ku.muqiWx}) 动`;
    } else if (tianChongOpen) {
      state = "天干冲开";
      note = tianChongNote;
    } else if (tianHeClose) {
      state = "天干合闭";
      note = tianHeNote + ` → ${ku.muqiWx} 被封`;
    } else if (!touMuqi) {
      state = "闭库";
      note = `${ku.muqi}(${ku.muqiWx}) 未透 → 库中 ${ku.muqiWx} 封存, 需岁运冲开`;
    }

    out.push({
      kind: "墓库",
      name: `${zhi} · ${ku.name}`,
      positions: POS_NAMES[idx]!,
      close: false,
      state,
      note,
      quality: "neutral",
    });
  }
  return out;
}

export const 墓库 = { name: "墓库", detect } as const;
