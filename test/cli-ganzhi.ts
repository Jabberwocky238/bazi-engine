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
import { fileURLToPath } from "node:url";
import {
  analyzeGanZhi,
  GAN, ZHI, type Gan, type Zhi, type Pillar,
} from "../src/index.ts";

/** 测试只关心 类 / 子集名目 / 全名 三者, 不依赖具体 Hit 类型. */
interface AnyRel {
  kind: string;
  sub?: string;
  name: string;
}

const DATA_DIR = fileURLToPath(new URL("../bazi_data/", import.meta.url));
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
/** 地支八类 + 子集名目 → API 粗分类. */
function zhiCat(f: AnyRel): string | null {
  switch (f.kind) {
    case "六合": return "合";
    case "暗合": return "暗合";
    case "相冲": return "冲";
    case "相破": return "破";
    case "相害": return "害";
    case "相刑": return "刑";       // 三刑 / 半刑 / 子卯刑 / 自刑 一律归 刑
    case "三合": return f.sub ? (f.sub === "拱合" ? "拱合" : "半合") : "三合";
    case "三会": return f.sub ? "拱会" : "三会";
    default:    return null;
  }
}

/** 天干三类 → API 粗分类 (API 对天干冲克统一标 "相克"). */
function ganCat(f: AnyRel): string | null {
  switch (f.kind) {
    case "相合": return "合";
    case "相冲":
    case "相克": return "克";
    default:     return null;
  }
}

function ourKeys(pillars: Pillar[]): Set<string> {
  const a = analyzeGanZhi(pillars);
  const keys = new Set<string>();
  if (!a) return keys;

  const add = (cat: string | null, name: string) => {
    if (!cat) return;
    const chars = extractChars(name);
    if (chars.length < 2) return;
    keys.add(`${canon(chars)}|${cat}`);
  };

  for (const { hit } of a.天干) add(ganCat(hit), hit.name);
  for (const { hit } of a.地支) add(zhiCat(hit), hit.name);
  // 三合/三会 的两支子集 —— 名目定分类 (半合 / 拱合 / 拱会)
  for (const s of a.子集) {
    const cat = s.sub === "拱合" ? "拱合" : s.sub === "拱会" ? "拱会" : "半合";
    add(cat, s.name);
  }
  // 整柱 (盖头/截脚/覆载) 与 争合: API 不输出, 不参与比较.
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
