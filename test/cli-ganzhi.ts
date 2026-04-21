/**
 * Verify analyzeGanZhi against every bazi_data/**\/*.liuyi.json sample.
 *
 *   bun run ganzhi            # verify all
 *   bun run ganzhi --limit 100
 *   bun run ganzhi --show 20  # how many diffs to print (default 10)
 *
 * Both API and our findings are bucketed into coarse categories keyed by
 * canonical (sorted) pair/triple identifiers, then set-compared per sample.
 * Categories align with the API short-type vocabulary:
 *   合 / 半合 / 拱合 / 拱会 / 三合 / 三会 / 暗合 / 暗三会
 *   克 / 冲 / 刑 / 害 / 破
 * 墓库 / 绝 are ours-only, excluded from extra counting.
 */
import { readFileSync } from "node:fs";
import {
  analyzeGanZhi, type Finding,
  GAN, ZHI, type Gan, type Zhi, type Pillar,
} from "../src/index.ts";

const DATA_DIR = new URL("../bazi_data/", import.meta.url).pathname.replace(/^\//, "");
const GAN_SET: ReadonlySet<string> = new Set(GAN);
const ZHI_SET: ReadonlySet<string> = new Set(ZHI);

function parseArgs() {
  const args = process.argv.slice(2);
  let limit = Infinity;
  let show = 10;
  for (let i = 0; i < args.length; i++) {
    const a = args[i];
    if (a === "--limit") limit = Number(args[++i]);
    else if (a === "--show") show = Number(args[++i]);
  }
  return { limit, show };
}

/** 取 Finding.name 前缀的 gan/zhi 字符. e.g. "甲己合化土" → ["甲","己"]. */
function extractChars(name: string): string[] {
  const out: string[] = [];
  for (const c of Array.from(name)) {
    if (GAN_SET.has(c) || ZHI_SET.has(c)) out.push(c);
    else break;
  }
  return out;
}

/** Sorted-pair key. 对 2/3 字都适用. */
function canon(chars: readonly string[]): string {
  return [...chars].sort().join("_");
}

// --- API 侧 -------------------------------------------------------------

type ApiLine = { short: string; pair: string };

function parseApiLine(line: string, kind: "gan" | "zhi"): ApiLine | null {
  // "己癸相克,克,己_癸,"          (gan: slot 2 = pair)
  // "巳酉半合金局,半合金局,,巳_酉" (zhi: slot 3 = pair)
  const parts = line.split(",");
  if (parts.length < 4) return null;
  const short = parts[1] ?? "";
  const pairRaw = (kind === "gan" ? parts[2] : parts[3]) ?? "";
  if (!short || !pairRaw) return null;
  const pieces = pairRaw.split("_").filter((s) => s.length > 0);
  if (pieces.length < 2) return null;
  return { short, pair: canon(pieces) };
}

/** API short type → 粗分类. 返回 null 表示不参与比较. */
function apiCat(short: string): string | null {
  if (short.startsWith("合化")) return "合";     // 天干五合 / 地支六合
  if (short.startsWith("半合")) return "半合";    // 三合式半合
  if (short.startsWith("拱合")) return "拱合";    // 三合式 生+墓
  if (short.startsWith("拱会")) return "拱会";    // 三会式 首+末
  if (short.startsWith("三合")) return "三合";
  if (short.startsWith("三会")) return "三会";
  if (short === "暗合") return "暗合";
  if (short === "暗三会") return "暗三会";
  if (short === "暗三合") return "暗三合";
  if (short === "自刑") return "刑";              // 合并到 刑
  if (short === "三刑") return "刑";              // 三刑 triple 归并
  if (short === "克" || short === "刑" || short === "害" || short === "破") return short;
  if (short === "冲") return "冲";
  return null;
}

function apiKeys(result: unknown): Set<string> {
  const keys = new Set<string>();
  if (!Array.isArray(result) || result.length < 2) return keys;
  const [ganArr, zhiArr] = result as [unknown, unknown];
  const process = (arr: unknown, kind: "gan" | "zhi") => {
    if (!Array.isArray(arr)) return;
    for (const line of arr) {
      if (typeof line !== "string") continue;
      const p = parseApiLine(line, kind);
      if (!p) continue;
      const cat = apiCat(p.short);
      if (!cat) continue;
      keys.add(`${p.pair}|${cat}`);
    }
  };
  process(ganArr, "gan");
  process(zhiArr, "zhi");
  return keys;
}

// --- Our 侧 -------------------------------------------------------------

/** 把 Finding 映射到 API 的粗分类. 依 kind + state. */
function ourCat(f: Finding): string | null {
  switch (f.kind) {
    case "天干五合":
    case "地支六合":  return "合";     // state 形如 "合化X"
    case "地支三合":
      if (f.state.startsWith("三合")) return "三合";
      if (f.state.startsWith("半合")) return "半合";
      if (f.state.startsWith("拱合")) return "拱合";
      if (f.state === "暗三合") return "暗三合";
      return null;
    case "地支三会":
      if (f.state.startsWith("三会")) return "三会";
      if (f.state.startsWith("拱会")) return "拱会";
      if (f.state === "暗三会") return "暗三会";
      return null;
    case "地支暗合":  return "暗合";
    case "地支相刑":
      if (f.state === "自刑") return "刑";
      return "刑";
    case "地支相冲":  return "冲";
    case "地支相破":  return "破";
    case "地支相害":  return "害";
    case "天干相冲":  return "克";     // API 归入 "相克"
    case "天干相克":  return "克";
    case "墓库":      return null;     // API 不输出
    case "盖头":      return null;     // 整柱类, 不在对比维度
    case "截脚":      return null;
    case "覆载":      return null;
    case "争合":
    case "妒合":      return null;
  }
}

function ourKeys(pillars: Pillar[]): Set<string> {
  const a = analyzeGanZhi(pillars);
  const keys = new Set<string>();
  if (!a) return keys;
  const all: Finding[] = [
    ...a.天干五合, ...a.天干相冲, ...a.天干相克,
    ...a.地支六合, ...a.地支三合, ...a.地支三会, ...a.地支暗合,
    ...a.地支相刑, ...a.地支相冲, ...a.地支相破, ...a.地支相害,
    ...a.墓库,
    ...a.盖头, ...a.截脚, ...a.覆载,
  ];
  for (const f of all) {
    const cat = ourCat(f);
    if (!cat) continue;
    const chars = extractChars(f.name);
    if (chars.length < 2) continue;
    keys.add(`${canon(chars)}|${cat}`);
  }
  return keys;
}

// --- 样本加载 -----------------------------------------------------------

type Sample = {
  rel: string;
  gz: string[];
  pillars: Pillar[];
  api: Set<string>;
};

function* iterSamples(): Generator<Sample> {
  const glob = new Bun.Glob("**/*.liuyi.json");
  for (const rel of glob.scanSync({ cwd: DATA_DIR, absolute: false })) {
    const abs = `${DATA_DIR}${rel}`;
    let data: any;
    try { data = JSON.parse(readFileSync(abs, "utf-8")); } catch { continue; }
    const gz = data?.gz;
    if (!Array.isArray(gz) || gz.length !== 4) continue;
    if (!gz.every((s) => typeof s === "string" && s.length === 2)) continue;
    const pillars: Pillar[] = gz.map((s: string) => ({ gan: s.charAt(0) as Gan, zhi: s.charAt(1) as Zhi }));
    yield { rel, gz, pillars, api: apiKeys(data.result) };
  }
}

function main(): number {
  const { limit, show } = parseArgs();
  let total = 0, ok = 0, bad = 0, shown = 0;
  const missingByCat: Record<string, number> = {};
  const extraByCat: Record<string, number> = {};

  const seenGz = new Set<string>();
  for (const s of iterSamples()) {
    const key = s.gz.join(" ");
    if (seenGz.has(key)) continue;  // 同 gz (_s0/_s1) 去重
    seenGz.add(key);
    if (total >= limit) break;
    total++;

    const ours = ourKeys(s.pillars);
    const missing: string[] = [];
    const extra: string[] = [];
    for (const k of s.api) {
      if (ours.has(k)) continue;
      const cat = k.split("|")[1] ?? "?";
      missing.push(k);
      missingByCat[cat] = (missingByCat[cat] ?? 0) + 1;
    }
    for (const k of ours) {
      if (s.api.has(k)) continue;
      const cat = k.split("|")[1] ?? "?";
      extra.push(k);
      extraByCat[cat] = (extraByCat[cat] ?? 0) + 1;
    }

    if (missing.length === 0 && extra.length === 0) {
      ok++;
    } else {
      bad++;
      if (shown < show) {
        console.log(`\n[diff] ${s.rel}  gz=${s.gz.join(" ")}`);
        if (missing.length) console.log(`  missing (api not ours): ${missing.sort().join(", ")}`);
        if (extra.length)   console.log(`  extra   (ours not api): ${extra.sort().join(", ")}`);
        shown++;
      }
    }
  }

  console.log(`\n[done] total=${total}  ok=${ok}  bad=${bad}`);
  const byCount = (o: Record<string, number>) =>
    Object.entries(o).sort((a, b) => b[1] - a[1]).map(([k, v]) => `    ${k.padEnd(8)} ${v}`).join("\n");
  if (Object.keys(missingByCat).length) console.log(`  missing by category (api ∖ ours):\n${byCount(missingByCat)}`);
  if (Object.keys(extraByCat).length)   console.log(`  extra   by category (ours ∖ api):\n${byCount(extraByCat)}`);
  return bad === 0 ? 0 : 1;
}

process.exit(main());
