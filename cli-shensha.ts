/**
 * Verify shensha.ts against every sample in bazi_data/**\/*.json.
 *
 *   bun run shensha           # verify all
 *   bun run shensha --limit 100
 *   bun run shensha --show 20 # how many diffs to print (default 10)
 *
 * Compares shensha sets after intersecting both sides with ALL_SHENSHA —
 * rules outside that list are out of scope.
 */
import { readFileSync } from "node:fs";
import { relative } from "node:path";
import { computeShensha, type BaziInput, type Gan, type Zhi } from "./shensha.ts";
import { ALL_SHENSHA, type Sex } from "./consts.ts";

const DATA_DIR = new URL("./bazi_data/", import.meta.url).pathname.replace(/^\//, "");
const PILLAR_KEYS = ["year", "month", "day", "hour"] as const;

type Sample = { path: string; input: BaziInput; truth: string[][] };

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

function* iterSamples(): Generator<Sample> {
  const glob = new Bun.Glob("**/*.json");
  for (const rel of glob.scanSync({ cwd: DATA_DIR, absolute: false })) {
    const abs = `${DATA_DIR}${rel}`;
    let data: any;
    try { data = JSON.parse(readFileSync(abs, "utf-8")); } catch { continue; }
    const bz = data?.bz;
    if (!bz) continue;
    const get = (k: string) => typeof bz[k] === "string" ? bz[k] : null;
    const [yg, yz, mg, mz, dg, dz, hg, hz] = ["0","1","2","3","4","5","6","7"].map(get);
    if (!yg || !yz || !mg || !mz || !dg || !dz || !hg || !hz) continue;
    const truth = data.szshensha;
    if (!Array.isArray(truth) || truth.length < 4) continue;
    const sexRaw = data?.sex;
    const sex: Sex | undefined = sexRaw === 0 || sexRaw === 1 ? (sexRaw as Sex) : undefined;
    yield {
      path: rel,
      input: {
        year:  { gan: yg as Gan, zhi: yz as Zhi },
        month: { gan: mg as Gan, zhi: mz as Zhi },
        day:   { gan: dg as Gan, zhi: dz as Zhi },
        hour:  { gan: hg as Gan, zhi: hz as Zhi },
        sex: sex!,
      },
      truth: (truth as unknown[]).slice(0, 4).map(v => Array.isArray(v) ? (v as string[]) : []),
    };
  }
}

function main(): number {
  const { limit, show } = parseArgs();
  const supported = new Set<string>(ALL_SHENSHA);
  console.log(`[info] supported (${supported.size}): ${[...supported].sort().join(", ")}`);

  let total = 0, ok = 0, bad = 0, shown = 0;
  const missing: Record<string, number> = {};
  const extra:   Record<string, number> = {};

  for (const sample of iterSamples()) {
    if (total >= limit) break;
    total++;

    let got: ReturnType<typeof computeShensha>;
    try { got = computeShensha(sample.input); }
    catch (e) {
      bad++;
      const msg = e instanceof Error ? e.message : String(e);
      console.error(`[err] ${sample.path}: ${msg}`);
      continue;
    }

    const diffs: { pillar: string; missing: string[]; extra: string[] }[] = [];
    PILLAR_KEYS.forEach((key, i) => {
      const want = new Set((sample.truth[i] ?? []).filter(s => supported.has(s)));
      const mine = new Set(got[key].filter(s => supported.has(s)));
      const missingArr = [...want].filter(s => !mine.has(s)).sort();
      const extraArr   = [...mine].filter(s => !want.has(s)).sort();
      if (missingArr.length || extraArr.length) {
        for (const s of missingArr) missing[s] = (missing[s] ?? 0) + 1;
        for (const s of extraArr)   extra[s]   = (extra[s]   ?? 0) + 1;
        diffs.push({ pillar: key, missing: missingArr, extra: extraArr });
      }
    });

    if (diffs.length) {
      bad++;
      if (shown < show) {
        console.log(`\n[diff] ${sample.path}  pillars=${JSON.stringify(sample.input)}`);
        for (const d of diffs) console.log(`    ${d.pillar.padEnd(5)}  missing=${JSON.stringify(d.missing)}  extra=${JSON.stringify(d.extra)}`);
        shown++;
      }
    } else {
      ok++;
    }
  }

  console.log(`\n[done] total=${total}  ok=${ok}  bad=${bad}`);
  const byCount = (o: Record<string, number>) =>
    Object.entries(o).sort((a, b) => b[1] - a[1]).map(([k, v]) => `    ${k.padEnd(10)} ${v}`).join("\n");
  if (Object.keys(missing).length) console.log(`  missing (in truth, not in ts):\n${byCount(missing)}`);
  if (Object.keys(extra).length)   console.log(`  extra (in ts, not in truth):\n${byCount(extra)}`);
  return bad === 0 ? 0 : 1;
}

process.exit(main());
