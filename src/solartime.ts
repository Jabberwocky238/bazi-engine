/**
 * 真太阳时换算.
 *
 * 输入 "钟表时间" (某个时区的挂钟时间) + 观测地经度, 输出:
 *  - 平太阳时 (仅做经度修正)
 *  - 真太阳时 (经度修正 + 均时差修正)
 *
 * 排盘取时柱应使用真太阳时.
 */

import { ShouXingUtil, Solar } from "lunar-typescript";
import { BaziInputC, type BaziInput, type Gan, type Sex, type Zhi } from "./types.ts";

/** 构造参数: 经度 (东经为正) + 该钟表所用时区偏移 (小时, 东为正). 两者均可省略. */
export interface SolarTimeOptions {
    /**
     * 观测地经度, 东经为正, 西经为负, 单位度.
     * 省略时取 {@link SolarTime.DEFAULT_LONGITUDE} (东经 120°, 北京标准时中央经线),
     * 此时不产生经度修正, 只做均时差修正.
     */
    longitude?: number;
    /**
     * 钟表时间所属时区偏移, 单位小时, 东为正 (如北京 = 8).
     * 省略时按经度所在的标准时区 round(longitude / 15) 推算.
     */
    tzOffset?: number;
}

/** 时间推移量. 年 / 月 按日历推移 (须为整数), 其余按固定时长, 允许小数与负数. */
export interface SolarTimeDelta {
    years?: number;
    months?: number;
    days?: number;
    hours?: number;
    minutes?: number;
    seconds?: number;
}

export class SolarTime {
    /** 钟表时间对应的 UTC 时刻. */
    private readonly utcMs: number;
    /** 钟表时间所属时区偏移, 单位毫秒. */
    private readonly tzOffsetMs: number;
    private readonly longitude: number;

    private static readonly HOUR_MS = 3600_000;

    /** 缺省经度: 东经 120°, 即北京标准时的中央经线. */
    static readonly DEFAULT_LONGITUDE = 120;

    /**
     * @param date 钟表时间. 传 Date 时按其真实 UTC 时刻解释;
     *             传 "钟表读数" 请使用 {@link SolarTime.fromLocal}.
     */
    constructor(date: Date, opts: SolarTimeOptions = {}) {
        if (Number.isNaN(date.getTime())) {
            throw new RangeError("SolarTime: invalid date");
        }
        const lon = opts.longitude ?? SolarTime.DEFAULT_LONGITUDE;
        if (!Number.isFinite(lon) || Math.abs(lon) > 180) {
            throw new RangeError(`SolarTime: invalid longitude ${opts.longitude}`);
        }
        const tz = opts.tzOffset ?? SolarTime.defaultTzOffset(lon);
        if (!Number.isFinite(tz) || Math.abs(tz) > 14) {
            throw new RangeError(`SolarTime: invalid tzOffset ${tz}`);
        }
        this.utcMs = date.getTime();
        this.tzOffsetMs = tz * SolarTime.HOUR_MS;
        this.longitude = lon;
    }

    /**
     * 用挂钟读数构造: 各字段按 opts.tzOffset 所指时区解释, 与运行环境时区无关.
     */
    static fromLocal(
        y: number, mo: number, d: number,
        h: number, mi: number, s: number,
        opts: SolarTimeOptions = {},
    ): SolarTime {
        const tz = opts.tzOffset
            ?? SolarTime.defaultTzOffset(opts.longitude ?? SolarTime.DEFAULT_LONGITUDE);
        const utc = Date.UTC(y, mo - 1, d, h, mi, s) - tz * SolarTime.HOUR_MS;
        return new SolarTime(new Date(utc), { ...opts, tzOffset: tz });
    }

    /** 经度对应的标准时区偏移 (小时). */
    static defaultTzOffset(longitude: number): number {
        return Math.round(longitude / 15);
    }

    /** 时区中央经线, 单位度. */
    get centralMeridian(): number {
        return (this.tzOffsetMs / SolarTime.HOUR_MS) * 15;
    }

    /** 经度修正量, 单位分钟. 每偏离中央经线 1 度 = 4 分钟. */
    get longitudeCorrectionMinutes(): number {
        return (this.longitude - this.centralMeridian) * 4;
    }

    /** 均时差 (真太阳时 - 平太阳时), 单位分钟. */
    get equationOfTimeMinutes(): number {
        return SolarTime.equationOfTime(this.utcMs);
    }

    /** 原始钟表时间. */
    get clockTime(): Date {
        return new Date(this.utcMs);
    }

    /** 平太阳时 (只做经度修正). 返回的 Date 需用 getUTC* 读取字段. */
    get meanSolarTime(): Date {
        return new Date(
            this.utcMs + this.longitude * 4 * 60_000,
        );
    }

    /** 真太阳时 = 平太阳时 + 均时差. 返回的 Date 需用 getUTC* 读取字段. */
    get trueSolarTime(): Date {
        return new Date(
            this.meanSolarTime.getTime() + this.equationOfTimeMinutes * 60_000,
        );
    }

    /** 真太阳时相对钟表时间的总修正量, 单位分钟. */
    get totalCorrectionMinutes(): number {
        return this.longitudeCorrectionMinutes + this.equationOfTimeMinutes;
    }

    /** 真太阳时的年月日时分秒 (拆开的挂钟读数). */
    get trueSolarParts(): {
        year: number; month: number; day: number;
        hour: number; minute: number; second: number;
    } {
        const t = this.trueSolarTime;
        return {
            year: t.getUTCFullYear(),
            month: t.getUTCMonth() + 1,
            day: t.getUTCDate(),
            hour: t.getUTCHours(),
            minute: t.getUTCMinutes(),
            second: t.getUTCSeconds(),
        };
    }

    /** 真太阳时对应的地支时辰索引 (0 = 子, 1 = 丑, ... 11 = 亥). */
    get zhiIndex(): number {
        const t = this.trueSolarTime;
        const h = t.getUTCHours();
        const m = t.getUTCMinutes();
        const s = t.getUTCSeconds();
        // 23:00 起为次日子时; 其余每两小时一支.
        return Math.floor((((h + 1) % 24) * 3600 + m * 60 + s) / 7200) % 12;
    }

    /** 真太阳时是否已跨入次日子时 (即钟表 23 点后). */
    get isLateZi(): boolean {
        return this.trueSolarTime.getUTCHours() === 23;
    }

    /**
     * 向后推移得到新的 SolarTime, 经度与时区不变.
     * 各字段可为负数或小数, 累加生效.
     */
    forward(delta: SolarTimeDelta): SolarTime {
        return this.shift(delta, 1);
    }

    /** 向前回退得到新的 SolarTime, 语义同 {@link forward} 取反. */
    backward(delta: SolarTimeDelta): SolarTime {
        return this.shift(delta, -1);
    }

    private shift(delta: SolarTimeDelta, sign: 1 | -1): SolarTime {
        const { years = 0, months = 0, days = 0, hours = 0, minutes = 0, seconds = 0 } = delta;
        if (!Number.isInteger(years) || !Number.isInteger(months)) {
            throw new RangeError("SolarTime: years/months must be integers");
        }
        const tz = this.tzOffsetMs / SolarTime.HOUR_MS;

        // 年 / 月 是日历量, 交给 lunar-typescript 的 Solar 推移
        // (月末不足时钳到月末, 如 1/31 + 1 月 -> 2/28); 其余是固定时长, 直接加毫秒.
        let ms = this.utcMs;
        if (years !== 0 || months !== 0) {
            const c = new Date(this.utcMs + this.tzOffsetMs);
            const moved = Solar.fromYmdHms(
                c.getUTCFullYear(), c.getUTCMonth() + 1, c.getUTCDate(),
                c.getUTCHours(), c.getUTCMinutes(), c.getUTCSeconds(),
            )
                .nextYear(sign * years)
                .nextMonth(sign * months);
            ms = Date.UTC(
                moved.getYear(), moved.getMonth() - 1, moved.getDay(),
                moved.getHour(), moved.getMinute(), moved.getSecond(),
            ) - this.tzOffsetMs;
        }
        ms += sign * (
            days * 86400_000
            + hours * SolarTime.HOUR_MS
            + minutes * 60_000
            + seconds * 1000
        );
        return new SolarTime(new Date(ms), { longitude: this.longitude, tzOffset: tz });
    }

    /**
     * 按真太阳时排出四柱干支.
     * @param sex 1 = 男, 0 = 女
     * @param hourKnown 时辰是否已知; false 时不产时柱
     * @param raw true 则返回字符串字面量形式的 BaziInput, 默认返回 C 化的 BaziInputC
     */
    toBazi(sex: Sex, hourKnown?: boolean): BaziInputC;
    toBazi(sex: Sex, hourKnown: boolean, raw: true): BaziInput;
    toBazi(sex: Sex, hourKnown = true, raw = false): BaziInputC | BaziInput {
        const p = this.trueSolarParts;
        const solar = Solar.fromYmdHms(
            p.year, p.month, p.day,
            hourKnown ? p.hour : 0,
            hourKnown ? p.minute : 0,
            hourKnown ? p.second : 0,
        );
        const ec = solar.getLunar().getEightChar();
        ec.setSect(1);
        const bazi: BaziInput = {
            year: { gan: ec.getYearGan() as Gan, zhi: ec.getYearZhi() as Zhi },
            month: { gan: ec.getMonthGan() as Gan, zhi: ec.getMonthZhi() as Zhi },
            day: { gan: ec.getDayGan() as Gan, zhi: ec.getDayZhi() as Zhi },
            hour: hourKnown
                ? { gan: ec.getTimeGan() as Gan, zhi: ec.getTimeZhi() as Zhi }
                : undefined,
            sex,
        };
        return raw ? bazi : BaziInputC.from(bazi);
    }

    toString(): string {
        const p = this.trueSolarParts;
        const pad = (n: number, w = 2) => String(n).padStart(w, "0");
        return `${p.year}-${pad(p.month)}-${pad(p.day)} ${pad(p.hour)}:${pad(p.minute)}:${pad(p.second)}`;
    }

    /**
     * 均时差 (视太阳时 - 平太阳时), 单位分钟.
     *
     * 基于 lunar-typescript 的 ShouXingUtil 天文级数 (VSOP87 截断 + 光行差 +
     * 章动 + ΔT), 而非低精度经验拟合式; 误差在秒级.
     * @param utcMs UTC 毫秒时间戳
     */
    static equationOfTime(utcMs: number): number {
        const RAD = Math.PI / 180;
        // 儒略日 -> 儒略世纪 (UT), 再加 ΔT 转为力学时 TT.
        const jdUt = utcMs / 86400_000 + 2440587.5;
        const tUt = (jdUt - 2451545) / 36525;
        const t = tUt + ShouXingUtil.dtT(tUt);

        // 太阳视黄经 = 地球日心黄经 + 180° + 光行差 + 黄经章动.
        const nutation = ShouXingUtil.nutationLon2(t);
        const lambda = ShouXingUtil.eLon(t, -1) + Math.PI
            + ShouXingUtil.gxcSunLon(t) + nutation;

        // 平黄赤交角 (IAU 1980).
        const eps = (23 + (26 + 21.448 / 60) / 60
            - (46.8150 * t + 0.00059 * t * t - 0.001813 * t * t * t) / 3600) * RAD;

        // 太阳视赤经.
        const ra = Math.atan2(Math.cos(eps) * Math.sin(lambda), Math.cos(lambda));

        // 太阳平黄经 (Meeus 28.2, 自变量为儒略千年).
        const tm = t / 10;
        const l0 = (280.4664567 + 360007.6982779 * tm + 0.03032028 * tm * tm
            + tm ** 3 / 49931 - tm ** 4 / 15300 - tm ** 5 / 2000000) * RAD;

        // Meeus 28.1: E = L0 - 0.0057183° - RA + Δψ·cos(ε)
        const e = l0 - 0.0057183 * RAD - ra + nutation * Math.cos(eps);
        // 归一到 (-180°, 180°], 再按 1° = 4 分钟换算.
        return ((((e / RAD) % 360) + 540) % 360 - 180) * 4;
    }
}
