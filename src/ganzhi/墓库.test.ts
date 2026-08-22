import { expect, test } from "bun:test";
import { GAN, ZHI } from "../types.ts";
import { MUKU_TABLE, MUKU_TABLE_WRAPPER } from "./墓库.ts";

const qiFields = ["benqi", "zhongqi", "yuqi"] as const;
const qiNames = ["本气", "中气", "余气"] as const;

test("MUKU_TABLE 与 MUKU_QI_TABLE 的墓库气位一一对应", () => {
  const expected = new Map<string, string>();

  for (const zhi of ["辰", "未", "戌", "丑"] as const) {
    const ku = MUKU_TABLE[zhi]!;
    for (let i = 0; i < qiFields.length; i++) {
      expected.set(`${ku[qiFields[i]]}${zhi}`, qiNames[i]);
    }
  }

  // 全排列检查：每个天干 × 每个地支都必须与墓库定义一致。
  for (const gan of GAN) {
    for (const zhi of ZHI) {
      const actual = MUKU_TABLE_WRAPPER[gan][zhi];
      expect(actual, `${gan}${zhi} qi mismatch`).toBe(expected.get(`${gan}${zhi}`) ?? null);
    }
  }

  // 每个墓库的本气、中气、余气都恰好出现一次。
  for (const zhi of ["辰", "未", "戌", "丑"] as const) {
    const ku = MUKU_TABLE[zhi]!;
    expect(MUKU_TABLE_WRAPPER[ku.benqi][zhi]).toBe("本气");
    expect(MUKU_TABLE_WRAPPER[ku.zhongqi][zhi]).toBe("中气");
    expect(MUKU_TABLE_WRAPPER[ku.yuqi][zhi]).toBe("余气");
  }
});
