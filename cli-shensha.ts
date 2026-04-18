/**
 * CLI for shensha. JSONL protocol:
 *   stdout line 1:            {"type":"supported","value":[...]}
 *   for each stdin line (BaziInput):
 *     stdout on success:      {"type":"result","value":ShenshaResult}
 *     stdout on error:        {"type":"error","message":"..."}
 *
 * Invoked via `bun run shensha` (package.json script) -> `bun run cli-shensha.ts`.
 */
import { computeShensha, SUPPORTED_SHENSHA, type BaziInput } from "./shensha.ts";

function writeLine(obj: unknown): void {
  process.stdout.write(JSON.stringify(obj) + "\n");
}

async function main(): Promise<void> {
  writeLine({ type: "supported", value: SUPPORTED_SHENSHA });

  const decoder = new TextDecoder();
  let buf = "";
  for await (const chunk of Bun.stdin.stream()) {
    buf += decoder.decode(chunk, { stream: true });
    let nl: number;
    while ((nl = buf.indexOf("\n")) !== -1) {
      const line = buf.slice(0, nl).trim();
      buf = buf.slice(nl + 1);
      if (!line) continue;
      try {
        const input = JSON.parse(line) as BaziInput;
        writeLine({ type: "result", value: computeShensha(input) });
      } catch (e) {
        const msg = e instanceof Error ? e.message : String(e);
        writeLine({ type: "error", message: msg });
      }
    }
  }
}

await main();
