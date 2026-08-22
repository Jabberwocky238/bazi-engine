import { expect, test } from "bun:test";
import { WuXingC, WUXING } from "./types.ts";

test("符合预期", () => {
  for (const istr of WUXING) {
    const i = new WuXingC(istr)
    expect(istr === String(i))
  }
});
