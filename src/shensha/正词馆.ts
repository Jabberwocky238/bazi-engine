/**
 * 正词馆: 柱纳音 = 年纳音五行, 且柱支 = 词馆位 (年纳音临官).
 * 这里表中每种纳音五行对应唯一一组满足条件的干支. 年柱不标.
 */
import type { GanZhi, NayinWuxing } from "../types.ts";
import { nayinOf } from "../nayin.ts";
import { gzOf, pillarAt, type ShenshaCheck } from "./common.ts";

/** 每种年纳音五行对应的正词馆干支. 供 `词馆.ts` 做排除检查. */
export const ZHENG_CI_GUAN_GZ: Readonly<Record<NayinWuxing, GanZhi>> = {
  金:"壬申", 木:"庚寅", 水:"癸亥", 土:"丁亥", 火:"乙巳",
};

const check: ShenshaCheck = (b, i) => {
  if (i === 0) return false;
  return gzOf(pillarAt(b, i)) === ZHENG_CI_GUAN_GZ[nayinOf(b.year.gan, b.year.zhi)];
};

export const 正词馆 = { name: "正词馆", check } as const;
