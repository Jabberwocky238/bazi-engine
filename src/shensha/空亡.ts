/** 空亡 (以年柱和日柱起旬, 任一旬空支命中). */
import { kongwangFor } from "../kongwang.ts";
import { pillarAt, type ShenshaCheck } from "./common.ts";

const check: ShenshaCheck = (b, i) => {
  const z = pillarAt(b, i).zhi;
  const yKw = kongwangFor(b.year.gan, b.year.zhi);
  const dKw = kongwangFor(b.day.gan, b.day.zhi);
  return yKw.includes(z) || dKw.includes(z);
};

export const 空亡 = { name: "空亡", check } as const;
