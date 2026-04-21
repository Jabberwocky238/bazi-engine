/**
 * 大运 / 流年 / 流月 / 流日 / 流时 懒加载视图.
 *
 * 每一层都是一个独立 class, 下一层通过 getter 按需计算并缓存.
 * 顶层 computeDaYun(...) 立即返回, steps / liunian / liuyue / liuri / liushi
 * 都只在首次访问时计算.
 *
 * 访问路径:
 *   computeDaYun(...).steps[i]
 *     .liunian[j].liuyue[k].liuri[d].liushi[h]
 *
 * 流月 → 流日 边界按 节气 (节, 非气) 划分:
 *   正月 寅 = 立春 → 惊蛰
 *   二月 卯 = 惊蛰 → 清明
 *   ...
 *   十二月 丑 = 小寒 → 次年立春
 */
import {
  Solar,
  type DaYun as RawDaYun,
  type LiuNian as RawLiuNian,
  type Yun as RawYun,
} from "lunar-typescript";
import type { Gan, Sex, Zhi } from "./types.ts";

function parseGz(raw: string): [Gan, Zhi] | null {
  if (!raw || raw.length !== 2) return null;
  return [raw.charAt(0) as Gan, raw.charAt(1) as Zhi];
}

function pad2(n: number): string { return n < 10 ? `0${n}` : String(n); }

function daysInMonth(y: number, m: number): number {
  if (m === 2) return ((y % 4 === 0 && y % 100 !== 0) || y % 400 === 0) ? 29 : 28;
  if (m === 4 || m === 6 || m === 9 || m === 11) return 30;
  return 31;
}

// ———————————————————————————————————————————————
// 流时 (叶子)
// ———————————————————————————————————————————————

export class LiuShi {
  constructor(
    /** 0..11 (0=子, 1=丑, ..., 11=亥). */
    public readonly index: number,
    /** 2h 粒度代表小时: 0, 2, 4, ..., 22. */
    public readonly hour: number,
    public readonly gz: [Gan, Zhi] | null,
  ) {}
}

// ———————————————————————————————————————————————
// 流日 → 12 流时
// ———————————————————————————————————————————————

export class LiuRi {
  #liushi: LiuShi[] | null = null;

  constructor(
    /** 公历日期 "YYYY-MM-DD". */
    public readonly date: string,
    public readonly gz: [Gan, Zhi] | null,
    private readonly _year: number,
    private readonly _month: number,
    private readonly _day: number,
  ) {}

  /** 12 流时 (懒). */
  get liushi(): readonly LiuShi[] {
    if (!this.#liushi) {
      const out: LiuShi[] = [];
      for (let h = 0; h < 12; h++) {
        const hr = h * 2;
        const s = Solar.fromYmdHms(this._year, this._month, this._day, hr, 0, 0);
        out.push(new LiuShi(h, hr, parseGz(s.getLunar().getTimeInGanZhi())));
      }
      this.#liushi = out;
    }
    return this.#liushi;
  }
}

// ———————————————————————————————————————————————
// 流月 → 该月节气范围内的流日
// ———————————————————————————————————————————————

export class LiuYue {
  #liuri: LiuRi[] | null = null;

  constructor(
    public readonly index: number,
    /** 月建中文: "正" / "二" / ... / "腊". */
    public readonly monthName: string,
    public readonly gz: [Gan, Zhi] | null,
    private readonly _parent: LiuNian,
    private readonly _myIdx: number,   // 0..11
  ) {}

  /** 该流月 (节 → 下一节 的前一天) 的流日 (懒). */
  get liuri(): readonly LiuRi[] {
    if (!this.#liuri) {
      const bounds = this._parent._getJieSolars();
      const start = bounds[this._myIdx]!;
      const end = bounds[this._myIdx + 1]!;
      this.#liuri = iterateDays(start, end);
    }
    return this.#liuri;
  }
}

/** 迭代 [start, end) 的公历日 (day-level, 不含 end 当日). */
function iterateDays(start: Solar, end: Solar): LiuRi[] {
  const out: LiuRi[] = [];
  let y = start.getYear(), m = start.getMonth(), d = start.getDay();
  const eY = end.getYear(), eM = end.getMonth(), eD = end.getDay();
  while (y < eY || (y === eY && (m < eM || (m === eM && d < eD)))) {
    const s = Solar.fromYmdHms(y, m, d, 12, 0, 0);
    const dayGz = s.getLunar().getDayInGanZhiExact();
    out.push(new LiuRi(
      `${y}-${pad2(m)}-${pad2(d)}`,
      parseGz(dayGz),
      y, m, d,
    ));
    d++;
    if (d > daysInMonth(y, m)) { d = 1; m++; if (m > 12) { m = 1; y++; } }
  }
  return out;
}

// ———————————————————————————————————————————————
// 流年 → 12 流月 (+ 节气边界缓存)
// ———————————————————————————————————————————————

const JIE_COUNT = 12;

export class LiuNian {
  #liuyue: LiuYue[] | null = null;
  #jieSolars: Solar[] | null = null;

  constructor(
    public readonly age: number,
    public readonly year: number,
    public readonly gz: [Gan, Zhi] | null,
    private readonly _raw: RawLiuNian,
  ) {}

  /** 12 流月 (懒). */
  get liuyue(): readonly LiuYue[] {
    if (!this.#liuyue) {
      this.#liuyue = this._raw.getLiuYue().map((ly, i) =>
        new LiuYue(
          ly.getIndex(),
          ly.getMonthInChinese(),
          parseGz(ly.getGanZhi()),
          this,
          i,
        ),
      );
    }
    return this.#liuyue;
  }

  /**
   * 13 个节气 Solar (内部, 供 LiuYue 切流日用):
   * [立春(y), 惊蛰(y), ..., 小寒(y+1), 立春(y+1)]
   * 按日界截: 流月 i 的流日 = [bounds[i].solarDay, bounds[i+1].solarDay).
   */
  _getJieSolars(): readonly Solar[] {
    if (!this.#jieSolars) {
      const first = Solar.fromYmd(this.year, 6, 1).getLunar().getJieQiTable()["立春"]!;
      const bounds: Solar[] = [first];
      let cursor = first.getLunar();
      for (let i = 0; i < JIE_COUNT; i++) {
        const nj = cursor.getNextJie();
        const s = nj.getSolar();
        bounds.push(s);
        // 下一次搜索从 此节当日末 出发, 避免 getNextJie 返回同一个
        cursor = Solar.fromYmdHms(s.getYear(), s.getMonth(), s.getDay(), 23, 59, 59).getLunar();
      }
      this.#jieSolars = bounds;
    }
    return this.#jieSolars;
  }
}

// ———————————————————————————————————————————————
// 大运 step → 10 流年
// ———————————————————————————————————————————————

export class DaYunStep {
  #liunian: LiuNian[] | null = null;

  constructor(
    /** lunar-typescript 原始 index; 0 = 起运前. */
    public readonly index: number,
    public readonly startAge: number,
    public readonly endAge: number,
    public readonly startYear: number,
    public readonly endYear: number,
    /** 起运前等无干支情况 → null. */
    public readonly gz: [Gan, Zhi] | null,
    private readonly _raw: RawDaYun,
  ) {}

  /** 10 流年 (懒). */
  get liunian(): readonly LiuNian[] {
    if (!this.#liunian) {
      this.#liunian = this._raw.getLiuNian(10).map((ln) =>
        new LiuNian(ln.getAge(), ln.getYear(), parseGz(ln.getGanZhi()), ln),
      );
    }
    return this.#liunian;
  }
}

// ———————————————————————————————————————————————
// 根节点
// ———————————————————————————————————————————————

export class DaYun {
  #steps: DaYunStep[] | null = null;

  constructor(
    public readonly forward: boolean,
    public readonly startYear: number,
    public readonly startMonth: number,
    public readonly startDay: number,
    private readonly _yun: RawYun,
  ) {}

  /** 十步大运 (含起运前), 懒. */
  get steps(): readonly DaYunStep[] {
    if (!this.#steps) {
      this.#steps = this._yun.getDaYun(10).map((dy) =>
        new DaYunStep(
          dy.getIndex(),
          dy.getStartAge(),
          dy.getEndAge(),
          dy.getStartYear(),
          dy.getEndYear(),
          parseGz(dy.getGanZhi()),
          dy,
        ),
      );
    }
    return this.#steps;
  }
}

/**
 * 入口. 仅构造根节点; 所有子层 (steps / liunian / liuyue / liuri / liushi)
 * 均在各自 getter 首次访问时才计算, 且各自缓存.
 */
export function computeDaYun(
  year: number,
  month: number,
  day: number,
  hour: number,
  minute: number,
  sex: Sex,
): DaYun {
  const solar = Solar.fromYmdHms(year, month, day, hour, minute, 0);
  const ec = solar.getLunar().getEightChar();
  ec.setSect(1);
  const yun = ec.getYun(sex, 1);
  return new DaYun(
    yun.isForward(),
    yun.getStartYear(),
    yun.getStartMonth(),
    yun.getStartDay(),
    yun,
  );
}
