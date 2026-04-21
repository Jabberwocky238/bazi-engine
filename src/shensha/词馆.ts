/**
 * 词馆 = 年纳音五行之临官位.
 * 命中柱支 = 对应临官位, 但不包含 "正词馆" 的 干支组合 (互斥).
 * 土随水派 (临官亥). 年柱不标.
 */
import type { NayinWuxing, Zhi } from "../types.ts";
import { nayinOf } from "../nayin.ts";
import { gzOf, pillarAt, type ShenshaCheck } from "./common.ts";
import { ZHENG_CI_GUAN_GZ } from "./正词馆.ts";

const CI_GUAN_ZHI: Readonly<Record<NayinWuxing, Zhi>> = {
  金:"申", 木:"寅", 水:"亥", 土:"亥", 火:"巳",
};

const check: ShenshaCheck = (b, i) => {
  if (i === 0) return false;
  const p = pillarAt(b, i);
  const ny = nayinOf(b.year.gan, b.year.zhi);
  if (p.zhi !== CI_GUAN_ZHI[ny]) return false;
  return gzOf(p) !== ZHENG_CI_GUAN_GZ[ny];
};

export const 词馆 = { name: "词馆", check } as const;
