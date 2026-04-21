/**
 * Verify shishen.ts against every sample in bazi_data/**\/*.json.
 *
 *   bun run shishen
 *   bun run shishen --limit 100
 *   bun run shishen --show 20
 *
 * Compares `ss` / `cg` / `cgss` exactly.
 */
import { readFileSync } from "node:fs";
import { computeShishen, type BaziInput, type Gan, type Zhi, type Sex } from "../src/index.ts";

const DATA_DIR = new URL("../bazi_data/", import.meta.url).pathname.replace(/^\//, "");

type Sample = {
  path: string;
  input: BaziInput;
  truth: { ss: string[]; cg: string[][]; cgss: string[][] };
};

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

function isStrArr(x: unknown): x is string[] {
  return Array.isArray(x) && x.every(v => typeof v === "string");
}
function isStrArr2(x: unknown): x is string[][] {
  return Array.isArray(x) && x.every(isStrArr);
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
    const ss = data.ss, cg = data.cg, cgss = data.cgss;
    if (!isStrArr(ss) || ss.length !== 4) continue;
    if (!isStrArr2(cg) || cg.length !== 4) continue;
    if (!isStrArr2(cgss) || cgss.length !== 4) continue;
    const sexRaw = data?.sex;
    if (sexRaw !== 0 && sexRaw !== 1) continue;
    const sex = sexRaw as Sex;
    yield {
      path: rel,
      input: {
        year:  { gan: yg as Gan, zhi: yz as Zhi },
        month: { gan: mg as Gan, zhi: mz as Zhi },
        day:   { gan: dg as Gan, zhi: dz as Zhi },
        hour:  { gan: hg as Gan, zhi: hz as Zhi },
        sex,
      },
      truth: { ss, cg, cgss },
    };
  }
}

function eq(a: unknown, b: unknown): boolean {
  return JSON.stringify(a) === JSON.stringify(b);
}

function main(): number {
  const { limit, show } = parseArgs();
  let total = 0, ok = 0, bad = 0, shown = 0;
  const perField: Record<"ss" | "cg" | "cgss", number> = { ss: 0, cg: 0, cgss: 0 };

  for (const sample of iterSamples()) {
    if (total >= limit) break;
    total++;

    let got: ReturnType<typeof computeShishen>;
    try { got = computeShishen(sample.input); }
    catch (e) {
      bad++;
      const msg = e instanceof Error ? e.message : String(e);
      console.error(`[err] ${sample.path}: ${msg}`);
      continue;
    }

    const pairs = [
      ["十神",   "ss"],
      ["藏干",   "cg"],
      ["藏干十神", "cgss"],
    ] as const;
    const diffs: { field: string; want: unknown; got: unknown }[] = [];
    for (const [resKey, truthKey] of pairs) {
      if (!eq(got[resKey], sample.truth[truthKey])) {
        perField[truthKey]++;
        diffs.push({ field: resKey, want: sample.truth[truthKey], got: got[resKey] });
      }
    }

    if (diffs.length) {
      bad++;
      if (shown < show) {
        console.log(`\n[diff] ${sample.path}  pillars=${JSON.stringify(sample.input)}`);
        for (const d of diffs) {
          console.log(`    ${d.field.padEnd(5)}  want=${JSON.stringify(d.want)}`);
          console.log(`           got =${JSON.stringify(d.got)}`);
        }
        shown++;
      }
    } else {
      ok++;
    }
  }

  console.log(`\n[done] total=${total}  ok=${ok}  bad=${bad}`);
  for (const [k, v] of Object.entries(perField)) if (v) console.log(`  ${k} mismatches: ${v}`);
  return bad === 0 ? 0 : 1;
}

process.exit(main());
