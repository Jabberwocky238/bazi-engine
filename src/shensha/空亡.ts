/** 空亡 (以年柱和日柱起旬, 任一旬空支命中). */
import { kongwangFor } from "../kongwang.ts";
import { pillarAt, type ShenshaCheck } from "./common.ts";

const check: ShenshaCheck = (pillars, i) => {
  const z = pillarAt(pillars, i).zhi;
  const yKw = kongwangFor(pillars[0].gan, pillars[0].zhi);
  const dKw = kongwangFor(pillars[2].gan, pillars[2].zhi);
  return yKw.includes(z) || dKw.includes(z);
};

export const 空亡 = { name: "空亡", check } as const;
