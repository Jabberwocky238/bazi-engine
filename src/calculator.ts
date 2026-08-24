import { computeShensha, type Shensha } from "@/shensha";
import {
    analyzeGanZhi, detect as detectWholePillar, pairwiseGan, pairwiseZhi,
    type DiZhiHit, type GanZhiAnalysis, type PairGan, type PairZhi,
    DiZhiDetector, TianGanDetector, 地支解法, 天干解法,
    MukuC, mukuAll, mukuShift,
    type MuKuShift, type MuKuVerdict, type RemedySet,
    type SuiYunHit, type TianGanHit, type WholePillarHit, type WholePillarR, type ZhengHeHit,
} from "@/ganzhi";
import { type Shishen, type ShishenCat, shishenOf, ShishenC, ShishenCC } from "@/shishen";
import { BaziInputC, GAN_WUXING, GanC, PillarC, WuXingC, type ChangSheng, type Muku, type Pillar, type Sex, type ZhiC } from "@/types";

export interface ICalculator {
    touGan(): GanC[]
    touGan(gan: GanC): [boolean, number[]] // 是否透 + 透的柱索引
    touWx(): WuXingC[]
    touWx(wx: WuXingC): [boolean, number[]] // 是否透 + 透的柱索引
    rootGan(): GanC[]
    rootGan(gan: GanC): [boolean, number[]] // 是否有根 + 根的柱索引
    rootWx(): WuXingC[]
    rootWx(wx: WuXingC): [boolean, number[]] // 是否有根 + 根的柱索引
}

export interface IShishenCalculator {
    tou(): ShishenC[]
    tou(ss: ShishenC): [boolean, number[]] // 是否透 + 透的柱索引
    zang(): ShishenC[]
    zang(ss: ShishenC): [boolean, number[]] // 是否藏 + 藏的柱索引
    has(): ShishenC[]
    has(ss: ShishenC): [boolean, number[]] // 是否有 + 有的柱索引
    count(): Record<Shishen, number>
    count(ss: ShishenC): number
    countCat(): Record<ShishenCat, number>
    countCat(c: ShishenCC): number
    strong(): ShishenC[]
    strong(ss: ShishenC): boolean
    strongCat(): ShishenCC[]
    strongCat(c: ShishenCC): boolean
    adjacentTou(ss1: ShishenC, ss2: ShishenC): boolean // 两个十神是否在相邻柱天干紧贴（差 1）
}

/** 干支关系 (合冲刑害 / 整柱 / 岁运引化) 的查询入口. */
export interface IGanZhiCalculator {
    /** 全量分析: 四柱 + 可选岁运柱, 天干/地支/子集/争合/整柱 一并给出. */
    analyze(extras?: PillarC[]): GanZhiAnalysis | null
    /** 天干关系 (相合 / 相冲 / 相克), 各带岁运作用. */
    gan(extras?: PillarC[]): readonly SuiYunHit<TianGanHit>[]
    /** 地支关系 (八类), 各带岁运作用. */
    zhi(extras?: PillarC[]): readonly SuiYunHit<DiZhiHit>[]
    /** 三合/三会 的两支子集 (半合 / 拱合 / 拱会). */
    subsets(extras?: PillarC[]): GanZhiAnalysis["子集"]
    /** 争合 (五合一方重出). */
    zhengHe(extras?: PillarC[]): readonly ZhengHeHit[]
    /** 各柱整柱作用 (盖头 / 截脚 / 覆载 三态), 仅原局四柱. */
    wholePillar(): readonly WholePillarHit[]
    /** 指定柱的整柱作用; slot 0=年 1=月 2=日 3=时. */
    wholePillarAt(slot: number): WholePillarR | undefined
    /**
     * 天干 detector (原局四柱 + 岁运柱 依次入列, 岁运柱下标从 4 起).
     * 用于取原始命中 / 掩码等 detector 级信息.
     */
    ganDetector(extras?: PillarC[]): TianGanDetector
    /** 地支 detector, 入列规则同 {@link ganDetector}. */
    zhiDetector(extras?: PillarC[]): DiZhiDetector
    /**
     * 每条关系的解法 —— 反推「哪些干支能解开 / 打破它」.
     * 刑冲破害 给出 dissolvers (引化), 合会 给出 breakers (冲克).
     */
    remedies(extras?: PillarC[]): readonly RemedySet[]
    /**
     * 原局四墓库的开闭判定 (库不在盘中时 present=false).
     * 月支取自原局, 故结果附带墓气与三藏干在月令下的旺衰.
     */
    muku(extras?: PillarC[]): readonly MuKuVerdict[]
    /** 某岁运柱引起的墓库态变 (开→闭 / 闭→开). */
    mukuShifts(extra: PillarC, extras?: PillarC[]): readonly MuKuShift[]
    /** 穷举干支, 找出所有能改变某库状态的组合. */
    mukuTransitions(muZhi: Muku, extras?: PillarC[]): readonly MuKuShift[]
    /** 两支查表 (六合/六冲/六害/六破/刑/半合). */
    pairZhi(a: ZhiC, b: ZhiC): PairZhi | null
    /** 两干查表 (相合 优先, 其次 相克). */
    pairGan(a: GanC, b: GanC): PairGan | null
}

export interface DetailedPillar {
    /** 干支本体; 柱位标签与纳音从它取 (pillarType / nayinName()). */
    pillar: PillarC
    /** 整盘 + 性别推出的神煞. */
    shensha: Shensha[]
    /** 日干 vs 本柱地支的十二长生 (非本柱干支对). */
    changsheng: ChangSheng
    /** 是否日柱 (整盘位置). */
    isRizhu: boolean
}

export class Calculator implements ICalculator {
    constructor(
        public bazi: BaziInputC,
    ) { }

    /** 四柱原位序列, 时柱可缺. 随 bazi 实时求值. */
    private get fourPillars(): [PillarC, PillarC, PillarC, PillarC | undefined] {
        return [this.bazi.year, this.bazi.month, this.bazi.day, this.bazi.hour]
    }

    /** 四柱的字面量形式, 供仍吃裸 Pillar 的神煞链使用. */
    private get fourRawPillars(): [Pillar, Pillar, Pillar, Pillar | undefined] {
        return this.fourPillars.map(
            (p) => p && { gan: p.gan.str, zhi: p.zhi.str }
        ) as [Pillar, Pillar, Pillar, Pillar | undefined]
    }

    /** 已滤掉缺失时柱的柱序列. */
    private get mustPillars(): PillarC[] {
        return this.fourPillars.filter((p): p is PillarC => !!p)
    }

    private get sex(): Sex { return this.bazi.sex }

    /** 日主天干。 */
    get dayGan(): GanC { return this.bazi.day.gan }

    /**
     * 透干柱索引 —— 年/月/时三柱 (排除日柱: 日主自身不计"透").
     * mustPillars 已滤掉缺失的时柱, 这里按四柱原位扫描, 跳过 i===2 (日柱).
     */
    private touSlots(): number[] {
        const out: number[] = []
        this.fourPillars.forEach((p, i) => {
            if (p && i !== 2) out.push(i)
        })
        return out
    }

    pillars(): DetailedPillar[] {
        const shensha = computeShensha(
            this.fourRawPillars,
            this.sex,
        )
        const realshensha = [shensha.year, shensha.month, shensha.day, shensha.hour]
        const dayGan = this.bazi.day.gan
        return this.fourPillars.filter((p): p is PillarC => !!p).map((p, i): DetailedPillar => {
            return {
                pillar: p,
                shensha: realshensha[i] ? realshensha[i]! : [],
                changsheng: PillarC.from(dayGan, p.zhi).changsheng(),
                isRizhu: i === 2,
            }
        })
    }

    shishen(): ShishenCalculator {
        return new ShishenCalculator(this)
    }

    ganzhi(): GanZhiCalculator {
        return new GanZhiCalculator(this)
    }

    // ———————————————————————————————————————————————
    // ICalculator: 透干 (年/月/时天干) / 有根 (地支藏干)
    // ———————————————————————————————————————————————

    /** 透出的天干列表 (按柱序, 去重). */
    touGan(): GanC[]
    /** 指定天干是否透 + 透的柱索引 (年/月/时). */
    touGan(gan: GanC): [boolean, number[]]
    touGan(gan?: GanC): GanC[] | [boolean, number[]] {
        if (gan === undefined) {
            const seen = new Set<GanC>()
            const out: GanC[] = []
            this.touSlots().forEach((i) => {
                const g = this.fourPillars[i]!.gan
                if (!seen.has(g)) { seen.add(g); out.push(g) }
            })
            return out
        }
        const slots = this.touSlots().filter((i) => this.fourPillars[i]!.gan === gan)
        return [slots.length > 0, slots]
    }

    /** 透出的五行列表 (按柱序, 去重). */
    touWx(): WuXingC[]
    /** 指定五行是否透 + 透的柱索引. */
    touWx(wx: WuXingC): [boolean, number[]]
    touWx(wx?: WuXingC): WuXingC[] | [boolean, number[]] {
        if (wx === undefined) {
            const seen = new Set<WuXingC>()
            const out: WuXingC[] = []
            this.touSlots().forEach((i) => {
                const w = WuXingC.from(GAN_WUXING[this.fourPillars[i]!.gan.str])
                if (!seen.has(w)) { seen.add(w); out.push(w) }
            })
            return out
        }
        const slots = this.touSlots().filter((i) => GAN_WUXING[this.fourPillars[i]!.gan.str] === wx.str)
        return [slots.length > 0, slots]
    }

    /** 地支藏干含此天干的柱索引 (有根). */
    private rootSlotsOfGan(gan: GanC): number[] {
        const out: number[] = []
        this.mustPillars.forEach((p, i) => {
            if (p.zhi.canggan().includes(gan)) out.push(i)
        })
        return out
    }

    /** 地支藏干含此五行的柱索引 (有根). */
    private rootSlotsOfWx(wx: WuXingC): number[] {
        const out: number[] = []
        this.mustPillars.forEach((p, i) => {
            if (p.zhi.canggan().some((g) => GAN_WUXING[g.str] === wx.str)) out.push(i)
        })
        return out
    }

    /** 有根的天干列表 (藏干含之, 去重). */
    rootGan(): GanC[]
    /** 指定天干是否有根 + 根的柱索引. */
    rootGan(gan: GanC): [boolean, number[]]
    rootGan(gan?: GanC): GanC[] | [boolean, number[]] {
        if (gan === undefined) {
            const seen = new Set<GanC>()
            const out: GanC[] = []
            this.mustPillars.forEach((p) => {
                p.zhi.canggan().forEach((g) => {
                    if (!seen.has(g)) { seen.add(g); out.push(g) }
                })
            })
            return out
        }
        const slots = this.rootSlotsOfGan(gan)
        return [slots.length > 0, slots]
    }

    /** 有根的五行列表 (藏干含之, 去重). */
    rootWx(): WuXingC[]
    /** 指定五行是否有根 + 根的柱索引. */
    rootWx(wx: WuXingC): [boolean, number[]]
    rootWx(wx?: WuXingC): WuXingC[] | [boolean, number[]] {
        if (wx === undefined) {
            const seen = new Set<WuXingC>()
            const out: WuXingC[] = []
            this.mustPillars.forEach((p) => {
                p.zhi.canggan().forEach((g) => {
                    const w = WuXingC.from(GAN_WUXING[g.str])
                    if (!seen.has(w)) { seen.add(w); out.push(w) }
                })
            })
            return out
        }
        const slots = this.rootSlotsOfWx(wx)
        return [slots.length > 0, slots]
    }

    /** 天干五行计数。 */
    ganWxCount(wx: WuXingC): number {
        return this.mustPillars.filter((p) => GAN_WUXING[p.gan.str] === wx.str).length
    }
    /** 地支本气五行计数。 */
    zhiMainWxCount(wx: WuXingC): number {
        return this.mustPillars.filter((p) => {
            const g = p.zhi.canggan()[0]
            return !!g && GAN_WUXING[g.str] === wx.str
        }).length
    }

    /** 本气或中气含此五行。 */
    rootExt(wx: WuXingC): boolean {
        return this.mustPillars.some((p) => {
            const b = p.zhi.canggan()[0]
            const m = p.zhi.canggan()[1]
            return (!!b && GAN_WUXING[b.str] === wx.str) || (!!m && GAN_WUXING[m.str] === wx.str)
        })
    }
}

export class ShishenCalculator implements IShishenCalculator {
    constructor(
        private calculator: Calculator,
    ) { }

    private pillars(): DetailedPillar[] { return this.calculator.pillars() }
    private get dayGan(): GanC { return this.calculator.dayGan }
    private ganShishen(p: DetailedPillar): ShishenC | undefined {
        return p.isRizhu ? undefined : shishenOf(this.dayGan, p.pillar.gan)
    }
    private zhiShishen(p: DetailedPillar): ShishenC[] {
        return p.pillar.zhi.canggan().map((gan) => shishenOf(this.dayGan, gan))
    }

    // ———————————————————————————————————————————————
    // 透 (年/月/时天干, 排除日主) / 藏 (地支藏干) / 有 (透∪藏)
    // ———————————————————————————————————————————————

    /** 透出的十神列表 (去重). */
    tou(): ShishenC[]
    /** 指定十神是否透 + 透的柱索引 (年/月/时). */
    tou(ss: ShishenC): [boolean, number[]]
    tou(ss?: ShishenC): ShishenC[] | [boolean, number[]] {
        const slots: number[] = []
        const seen = new Set<ShishenC>()
        this.pillars().forEach((p, i) => {
            const value = this.ganShishen(p)
            if (value) {
                slots.push(i)
                seen.add(value)
            }
        })
        if (ss === undefined) return [...seen]
        const hit = slots.filter((i) => this.ganShishen(this.pillars()[i]!) === ss)
        return [hit.length > 0, hit]
    }

    /** 藏于地支的十神列表 (去重). */
    zang(): ShishenC[]
    /** 指定十神是否藏 + 藏的柱索引. */
    zang(ss: ShishenC): [boolean, number[]]
    zang(ss?: ShishenC): ShishenC[] | [boolean, number[]] {
        const seen = new Set<ShishenC>()
        const hitSlots: number[] = []
        this.pillars().forEach((p, i) => {
            let any = false
            this.zhiShishen(p).forEach((value) => {
                seen.add(value)
                if (value === ss) any = true
            })
            if (ss !== undefined && any) hitSlots.push(i)
        })
        if (ss === undefined) return [...seen]
        return [hitSlots.length > 0, hitSlots]
    }

    /** 透或藏的十神列表 (去重). */
    has(): ShishenC[]
    /** 指定十神是否有 (透∪藏) + 有的柱索引. */
    has(ss: ShishenC): [boolean, number[]]
    has(ss?: ShishenC): ShishenC[] | [boolean, number[]] {
        const touSet = new Set(this.tou())
        const zangSet = new Set(this.zang())
        const union = new Set<ShishenC>([...touSet, ...zangSet])
        if (ss === undefined) return [...union]
        const slots = new Set<number>()
        this.pillars().forEach((p, i) => {
            if (this.ganShishen(p) === ss) slots.add(i)
            if (this.zhiShishen(p).includes(ss)) slots.add(i)
        })
        const arr = [...slots].sort((a, b) => a - b)
        return [arr.length > 0, arr]
    }

    /** 各十神出现次数 (透 + 藏). */
    count(): Record<Shishen, number>
    /** 指定十神出现次数. */
    count(ss: ShishenC): number
    count(ss?: ShishenC): Record<Shishen, number> | number {
        const rec = this.countAll()
        if (ss === undefined) return rec
        return rec[ss.str]
    }

    /** 各类别十神出现次数. */
    countCat(): Record<ShishenCat, number>
    /** 指定类别十神出现次数. */
    countCat(c: ShishenCC): number
    countCat(c?: ShishenCC): Record<ShishenCat, number> | number {
        const rec = this.countAllCat()
        if (c === undefined) return rec
        return rec[c.str]
    }

    /** 有力的十神列表 (透或藏). */
    strong(): ShishenC[]
    /** 指定十神是否有力 (透或藏). */
    strong(ss: ShishenC): boolean
    strong(ss?: ShishenC): ShishenC[] | boolean {
        if (ss === undefined) return this.has()
        const [t] = this.has(ss)
        return t
    }

    /** 有力的十神类别列表. */
    strongCat(): ShishenCC[]
    /** 指定类别是否有力. */
    strongCat(c: ShishenCC): boolean
    strongCat(c?: ShishenCC): ShishenCC[] | boolean {
        const cats = Object.values(ShishenCC.map)
        if (c === undefined) return cats.filter((cat) => this.strongCat(cat))
        return this.pillars().some((p, i) => {
            if (this.ganShishen(p)?.cat === c) return true
            return this.zhiShishen(p).some((value) => value.cat === c)
        })
    }

    /** 两个十神是否在相邻柱天干紧贴 (差 1, 仅年/月/时). */
    adjacentTou(ss1: ShishenC, ss2: ShishenC): boolean {
        const posOf = (s: ShishenC): number[] => {
            const out: number[] = []
            this.pillars().forEach((p, i) => {
                if (this.ganShishen(p) === s) out.push(i)
            })
            return out
        }
        const p1 = posOf(ss1)
        const p2 = posOf(ss2)
        for (const a of p1) for (const b of p2) if (Math.abs(a - b) === 1) return true
        return false
    }

    // ———————————————————————————————————————————————
    // 内部: 计数 (透 + 藏)
    // ———————————————————————————————————————————————

    private countAll(): Record<Shishen, number> {
        const rec = {} as Record<Shishen, number>
        this.pillars().forEach((p) => {
            const gan = this.ganShishen(p)
            if (gan) rec[gan.str] = (rec[gan.str] ?? 0) + 1
            this.zhiShishen(p).forEach((value) => {
                rec[value.str] = (rec[value.str] ?? 0) + 1
            })
        })
        return rec
    }

    private countAllCat(): Record<ShishenCat, number> {
        const rec: Record<ShishenCat, number> = { 比劫: 0, 印: 0, 食伤: 0, 财: 0, 官杀: 0 }
        this.pillars().forEach((p) => {
            const gan = this.ganShishen(p)
            if (gan) rec[gan.cat.str]++
            this.zhiShishen(p).forEach((value) => rec[value.cat.str]++)
        })
        return rec
    }
}

/** 干支关系计算器 —— 委托 ./ganzhi 的 detector, 四柱由 Calculator 提供. */
export class GanZhiCalculator implements IGanZhiCalculator {
    constructor(
        private calculator: Calculator,
    ) { }

    /** 原局柱 (C 形式); 时辰未知时只有三柱. */
    private get originPillars(): PillarC[] {
        return this.calculator.pillars().map((p) => p.pillar)
    }

    /** 原局四柱的字面量形式; 时辰未知时不足四柱, analyzeGanZhi 会返回 null. */
    private get rawPillars(): Pillar[] {
        return this.calculator.pillars().map((p) => ({
            gan: p.pillar.gan.str,
            zhi: p.pillar.zhi.str,
        }))
    }

    analyze(extras: PillarC[] = []): GanZhiAnalysis | null {
        return analyzeGanZhi(this.rawPillars, extras)
    }

    gan(extras: PillarC[] = []): readonly SuiYunHit<TianGanHit>[] {
        return this.analyze(extras)?.天干 ?? []
    }

    zhi(extras: PillarC[] = []): readonly SuiYunHit<DiZhiHit>[] {
        return this.analyze(extras)?.地支 ?? []
    }

    subsets(extras: PillarC[] = []): GanZhiAnalysis["子集"] {
        return this.analyze(extras)?.子集 ?? []
    }

    zhengHe(extras: PillarC[] = []): readonly ZhengHeHit[] {
        return this.analyze(extras)?.争合 ?? []
    }

    wholePillar(): readonly WholePillarHit[] {
        return this.rawPillars.map((p, slot) => ({ slot, state: detectWholePillar(p) }))
    }

    wholePillarAt(slot: number): WholePillarR | undefined {
        const p = this.rawPillars[slot]
        return p && detectWholePillar(p)
    }

    ganDetector(extras: PillarC[] = []): TianGanDetector {
        return TianGanDetector.detect([
            ...this.originPillars.map((p) => p.gan),
            ...extras.map((p) => p.gan),
        ])
    }

    zhiDetector(extras: PillarC[] = []): DiZhiDetector {
        return DiZhiDetector.detect([
            ...this.originPillars.map((p) => p.zhi),
            ...extras.map((p) => p.zhi),
        ])
    }

    remedies(extras: PillarC[] = []): readonly RemedySet[] {
        return [
            ...this.ganDetector(extras).hits.map(天干解法),
            ...this.zhiDetector(extras).hits.map(地支解法),
        ]
    }


    muku(extras: PillarC[] = []): readonly MuKuVerdict[] {
        return mukuAll([...this.originPillars, ...extras], this.calculator.bazi.month.zhi)
    }

    mukuShifts(extra: PillarC, extras: PillarC[] = []): readonly MuKuShift[] {
        return mukuShift([...this.originPillars, ...extras], extra)
    }

    mukuTransitions(muZhi: Muku, extras: PillarC[] = []): readonly MuKuShift[] {
        return MukuC.from(muZhi).transitions([...this.originPillars, ...extras])
    }

    pairZhi(a: ZhiC, b: ZhiC): PairZhi | null {
        return pairwiseZhi(a.str, b.str)
    }

    pairGan(a: GanC, b: GanC): PairGan | null {
        return pairwiseGan(a.str, b.str)
    }
}
