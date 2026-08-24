import { GAN_WUXING, type ChangSheng, type Pillar } from "./types";
import { PILLAR_LABELS, type PillarType } from "./ganzhi";
import { computeShensha, type Shensha } from "./shensha";
import { type Shishen, type ShishenCat, shishenOf, ShishenC, ShishenCC } from "./shishen";
import { GanC, PillarC, WuXingC, type BaziInput, type Gan, type Sex, type ZhiC } from "./types";

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

export interface DetailedPillar {
    label: PillarType
    gan: {
        name: GanC
        isRizhu: boolean
    }
    zhi: ZhiC
    nayin: string
    shensha: Shensha[]
    changsheng: ChangSheng
}

export class Calculator implements ICalculator {
    private fourRawPillars: [Pillar, Pillar, Pillar, Pillar | undefined]
    private fourPillars: [PillarC, PillarC, PillarC, PillarC | undefined]
    private mustPillars: PillarC[]
    private sex: Sex

    constructor(
        public bazi: BaziInput,
    ) {
        this.sex = bazi.sex
        this.fourRawPillars = [
            this.bazi.year,
            this.bazi.month,
            this.bazi.day,
            this.bazi.hour
        ]
        this.fourPillars = [
            PillarC.fromPillar(this.bazi.year),
            PillarC.fromPillar(this.bazi.month),
            PillarC.fromPillar(this.bazi.day),
            this.bazi.hour ? PillarC.fromPillar(this.bazi.hour) : undefined
        ]
        this.mustPillars = this.fourPillars.filter((p): p is PillarC => !!p)
    }

    /** 日主天干。 */
    get dayGan(): Gan { return this.bazi.day.gan }

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
        const rizhu = this.bazi.day.gan as Gan
        const dayGan = GanC.from(rizhu)
        return this.fourPillars.filter((p): p is PillarC => !!p).map((p, i): DetailedPillar => {
            return {
                label: PILLAR_LABELS[i]!,
                gan: {
                    name: p.gan,
                    isRizhu: i === 2,
                },
                zhi: p.zhi,
                nayin: p.nayinName(),
                shensha: realshensha[i] ? realshensha[i]! : [],
                changsheng: PillarC.from(dayGan, p.zhi).changsheng(),
            }
        })
    }

    shishen(): ShishenCalculator {
        return new ShishenCalculator(this)
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
    private get dayGan(): GanC { return GanC.from(this.calculator.dayGan) }
    private ganShishen(p: DetailedPillar): ShishenC | undefined {
        return p.gan.isRizhu ? undefined : shishenOf(this.dayGan, p.gan.name)
    }
    private zhiShishen(p: DetailedPillar): ShishenC[] {
        return p.zhi.canggan().map((gan) => shishenOf(this.dayGan, gan))
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
