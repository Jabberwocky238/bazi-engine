/**
 * 流霞 (日干 → 地支).
 * 古诀: 甲鸡乙犬丙羊加, 丁是猴乡戊见蛇;
 *       己马庚龙辛逐兔, 壬猪癸虎是流霞.
 */
import type { Gan, Zhi } from "../types.ts";
import { pillarAt, type ShenshaCheck } from "./common.ts";

const LIU_XIA: Readonly<Record<Gan, Zhi>> = {
  甲:"酉", 乙:"戌",
  丙:"未", 丁:"申",
  戊:"巳", 己:"午",
  庚:"辰", 辛:"卯",
  壬:"亥", 癸:"寅",
};

const check: ShenshaCheck = (b, i) => pillarAt(b, i).zhi === LIU_XIA[b.day.gan];

export const 流霞 = { name: "流霞", check } as const;
