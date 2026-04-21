/**
 * 学堂 = 年纳音五行之长生位.
 * 命中柱支 = 对应长生位, 但不包含 "正学堂" 的 干支组合 (互斥).
 * 土随水派 (长生申). 年柱不标.
 */
import type { NayinWuxing, Zhi } from "../types.ts";
import { nayinOf } from "../nayin.ts";
import { gzOf, pillarAt, type ShenshaCheck } from "./common.ts";
import { ZHENG_XUE_TANG_GZ } from "./正学堂.ts";

const XUE_TANG_ZHI: Readonly<Record<NayinWuxing, Zhi>> = {
  金:"巳", 木:"亥", 水:"申", 土:"申", 火:"寅",
};

const check: ShenshaCheck = (b, i) => {
  if (i === 0) return false;
  const p = pillarAt(b, i);
  const ny = nayinOf(b.year.gan, b.year.zhi);
  if (p.zhi !== XUE_TANG_ZHI[ny]) return false;
  return gzOf(p) !== ZHENG_XUE_TANG_GZ[ny];
};

export const 学堂 = { name: "学堂", check } as const;
