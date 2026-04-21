/**
 * 正学堂: 柱纳音 = 年纳音五行, 且柱支 = 学堂位 (年纳音长生).
 * 这里表中每种纳音五行对应唯一一组满足条件的干支. 年柱不标.
 */
import type { GanZhi, NayinWuxing } from "../types.ts";
import { nayinOf } from "../nayin.ts";
import { gzOf, pillarAt, type ShenshaCheck } from "./common.ts";

/** 每种年纳音五行对应的正学堂干支. 供 `学堂.ts` 做排除检查. */
export const ZHENG_XUE_TANG_GZ: Readonly<Record<NayinWuxing, GanZhi>> = {
  金:"辛巳", 木:"己亥", 水:"甲申", 土:"戊申", 火:"丙寅",
};

const check: ShenshaCheck = (b, i) => {
  if (i === 0) return false;
  return gzOf(pillarAt(b, i)) === ZHENG_XUE_TANG_GZ[nayinOf(b.year.gan, b.year.zhi)];
};

export const 正学堂 = { name: "正学堂", check } as const;
