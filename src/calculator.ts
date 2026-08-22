import { changshengState, type ChangSheng } from "./types";
import { ganWuxing, PILLAR_LABELS, zhiWuxing, type PillarType } from "./ganzhi";
import { nayinNameOf } from "./types";
import { computeShensha, type Shensha } from "./shensha";
import { computeShishenGan, computeShishenZhi, computeShishenWuxing, type Shishen, SHI_SHEN_CAT, type ShishenCat, ShishenC } from "./shishen";
import type { BaziInput, Gan, GanC, Pillar, Sex, WuXing, WuXingC, Zhi } from "./types";
import { CANG_GAN } from "./types";

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
    count(): Record<ShishenC, number>
    count(ss: ShishenC): number
    countCat(): Record<ShishenCat, number>
    countCat(c: ShishenCat): number
    strong(): Shishen[]
    strong(ss: Shishen): boolean
    strongCat(): ShishenCat[]
    strongCat(c: ShishenCat): boolean
    adjacentTou(ss1: Shishen, ss2: Shishen): boolean // 两个十神是否在相邻柱天干紧贴（差 1）
}

export interface DetailedPillar {
    label: PillarType
    gan: {
        name: Gan
        wuxing: WuXing
        shishen: Shishen | '日主'
    }
    zhi: {
        name: Zhi
        wuxing: WuXing
        cangGan: {
            name: Gan
            shishen: Shishen
            wuxing: WuXing
        }[]
    }
    nayin: string
    shensha: Shensha[]
    changsheng: ChangSheng
}

export class Calculator implements ICalculator {
    private fourPillars: [Pillar, Pillar, Pillar, Pillar | undefined]
    private mustPillars: Pillar[]
    private sex: Sex

    constructor(
        public bazi: BaziInput,
    ) {
        this.sex = bazi.sex
        this.fourPillars = [this.bazi.year, this.bazi.month, this.bazi.day, this.bazi.hour]
        this.mustPillars = this.fourPillars.filter((p): p is Pillar => !!p)
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
        const shensha = computeShensha(this.fourPillars, this.sex)
        const realshensha = [shensha.year, shensha.month, shensha.day, shensha.hour]
        const rizhu = this.bazi.day.gan as Gan
        return this.fourPillars.filter((p): p is Pillar => !!p).map((p, i): DetailedPillar => {
            const cangGanShishen = computeShishenZhi(rizhu, p.zhi)
            return {
                label: PILLAR_LABELS[i]!,
                gan: {
                    name: p.gan,
                    shishen: computeShishenGan(rizhu, p.gan),
                    wuxing: ganWuxing(p.gan)
                },
                zhi: {
                    name: p.zhi,
                    wuxing: zhiWuxing(p.zhi),
                    cangGan: CANG_GAN[p.zhi].map((g, idx) => {
                        return {
                            name: g,
                            shishen: cangGanShishen[idx]!,
                            wuxing: computeShishenWuxing(rizhu, cangGanShishen[idx]!)
                        }
                    }),
                },
                nayin: nayinNameOf(p.gan, p.zhi),
                shensha: realshensha[i] ? realshensha[i]! : [],
                changsheng: changshengState(p.gan, p.zhi),
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
    touGan(): Gan[]
    /** 指定天干是否透 + 透的柱索引 (年/月/时). */
    touGan(gan: Gan): [boolean, number[]]
    touGan(gan?: Gan): Gan[] | [boolean, number[]] {
        if (gan === undefined) {
            const seen = new Set<Gan>()
            const out: Gan[] = []
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
    touWx(): WuXing[]
    /** 指定五行是否透 + 透的柱索引. */
    touWx(wx: WuXing): [boolean, number[]]
    touWx(wx?: WuXing): WuXing[] | [boolean, number[]] {
        if (wx === undefined) {
            const seen = new Set<WuXing>()
            const out: WuXing[] = []
            this.touSlots().forEach((i) => {
                const w = ganWuxing(this.fourPillars[i]!.gan)
                if (!seen.has(w)) { seen.add(w); out.push(w) }
            })
            return out
        }
        const slots = this.touSlots().filter((i) => ganWuxing(this.fourPillars[i]!.gan) === wx)
        return [slots.length > 0, slots]
    }

    /** 地支藏干含此天干的柱索引 (有根). */
    private rootSlotsOfGan(gan: Gan): number[] {
        const out: number[] = []
        this.mustPillars.forEach((p, i) => {
            if (CANG_GAN[p.zhi].includes(gan)) out.push(i)
        })
        return out
    }

    /** 地支藏干含此五行的柱索引 (有根). */
    private rootSlotsOfWx(wx: WuXing): number[] {
        const out: number[] = []
        this.mustPillars.forEach((p, i) => {
            if (CANG_GAN[p.zhi].some((g) => ganWuxing(g) === wx)) out.push(i)
        })
        return out
    }

    /** 有根的天干列表 (藏干含之, 去重). */
    rootGan(): Gan[]
    /** 指定天干是否有根 + 根的柱索引. */
    rootGan(gan: Gan): [boolean, number[]]
    rootGan(gan?: Gan): Gan[] | [boolean, number[]] {
        if (gan === undefined) {
            const seen = new Set<Gan>()
            const out: Gan[] = []
            this.mustPillars.forEach((p) => {
                CANG_GAN[p.zhi].forEach((g) => {
                    if (!seen.has(g)) { seen.add(g); out.push(g) }
                })
            })
            return out
        }
        const slots = this.rootSlotsOfGan(gan)
        return [slots.length > 0, slots]
    }

    /** 有根的五行列表 (藏干含之, 去重). */
    rootWx(): WuXing[]
    /** 指定五行是否有根 + 根的柱索引. */
    rootWx(wx: WuXing): [boolean, number[]]
    rootWx(wx?: WuXing): WuXing[] | [boolean, number[]] {
        if (wx === undefined) {
            const seen = new Set<WuXing>()
            const out: WuXing[] = []
            this.mustPillars.forEach((p) => {
                CANG_GAN[p.zhi].forEach((g) => {
                    const w = ganWuxing(g)
                    if (!seen.has(w)) { seen.add(w); out.push(w) }
                })
            })
            return out
        }
        const slots = this.rootSlotsOfWx(wx)
        return [slots.length > 0, slots]
    }

    /** 天干五行计数。 */
    ganWxCount(wx: WuXing): number {
        return this.mustPillars.filter((p) => ganWuxing(p.gan) === wx).length
    }
    /** 地支本气五行计数。 */
    zhiMainWxCount(wx: WuXing): number {
        return this.mustPillars.filter((p) => {
            const g = CANG_GAN[p.zhi][0]
            return !!g && ganWuxing(g) === wx
        }).length
    }

    /** 本气或中气含此五行。 */
    rootExt(wx: WuXing): boolean {
        return this.pillars().some((p) => {
            const b = p.zhi.cangGan[0]?.name
            const m = p.zhi.cangGan[1]?.name
            return (!!b && ganWuxing(b) === wx) || (!!m && ganWuxing(m) === wx)
        })
    }
}

export class ShishenCalculator implements IShishenCalculator {
    constructor(
        private calculator: Calculator,
    ) { }

    private pillars(): DetailedPillar[] { return this.calculator.pillars() }

    // ———————————————————————————————————————————————
    // 透 (年/月/时天干, 排除日主) / 藏 (地支藏干) / 有 (透∪藏)
    // ———————————————————————————————————————————————

    /** 透出的十神列表 (去重). */
    tou(): Shishen[]
    /** 指定十神是否透 + 透的柱索引 (年/月/时). */
    tou(ss: Shishen): [boolean, number[]]
    tou(ss?: Shishen): Shishen[] | [boolean, number[]] {
        const slots: number[] = []
        const seen = new Set<Shishen>()
        this.pillars().forEach((p, i) => {
            if (i !== 2 && p.gan.shishen !== "日主") {
                slots.push(i)
                seen.add(p.gan.shishen as Shishen)
            }
        })
        if (ss === undefined) return [...seen]
        const hit = slots.filter((i) => this.pillars()[i]!.gan.shishen === ss)
        return [hit.length > 0, hit]
    }

    /** 藏于地支的十神列表 (去重). */
    zang(): Shishen[]
    /** 指定十神是否藏 + 藏的柱索引. */
    zang(ss: Shishen): [boolean, number[]]
    zang(ss?: Shishen): Shishen[] | [boolean, number[]] {
        const seen = new Set<Shishen>()
        const hitSlots: number[] = []
        this.pillars().forEach((p, i) => {
            let any = false
            p.zhi.cangGan.forEach((g) => {
                seen.add(g.shishen)
                if (g.shishen === ss) any = true
            })
            if (ss !== undefined && any) hitSlots.push(i)
        })
        if (ss === undefined) return [...seen]
        return [hitSlots.length > 0, hitSlots]
    }

    /** 透或藏的十神列表 (去重). */
    has(): Shishen[]
    /** 指定十神是否有 (透∪藏) + 有的柱索引. */
    has(ss: Shishen): [boolean, number[]]
    has(ss?: Shishen): Shishen[] | [boolean, number[]] {
        const touSet = new Set(this.tou())
        const zangSet = new Set(this.zang())
        const union = new Set<Shishen>([...touSet, ...zangSet])
        if (ss === undefined) return [...union]
        const slots = new Set<number>()
        this.pillars().forEach((p, i) => {
            if (i !== 2 && p.gan.shishen === ss) slots.add(i)
            if (p.zhi.cangGan.some((g) => g.shishen === ss)) slots.add(i)
        })
        const arr = [...slots].sort((a, b) => a - b)
        return [arr.length > 0, arr]
    }

    /** 各十神出现次数 (透 + 藏). */
    count(): Record<Shishen, number>
    /** 指定十神出现次数. */
    count(ss: Shishen): number
    count(ss?: Shishen): Record<Shishen, number> | number {
        const rec = this.countAll()
        if (ss === undefined) return rec
        return rec[ss]
    }

    /** 各类别十神出现次数. */
    countCat(): Record<ShishenCat, number>
    /** 指定类别十神出现次数. */
    countCat(c: ShishenCat): number
    countCat(c?: ShishenCat): Record<ShishenCat, number> | number {
        const rec = this.countAllCat()
        if (c === undefined) return rec
        return rec[c]
    }

    /** 有力的十神列表 (透或藏). */
    strong(): Shishen[]
    /** 指定十神是否有力 (透或藏). */
    strong(ss: Shishen): boolean
    strong(ss?: Shishen): Shishen[] | boolean {
        if (ss === undefined) return this.has()
        const [t] = this.has(ss)
        return t
    }

    /** 有力的十神类别列表. */
    strongCat(): ShishenCat[]
    /** 指定类别是否有力. */
    strongCat(c: ShishenCat): boolean
    strongCat(c?: ShishenCat): ShishenCat[] | boolean {
        const cats: ShishenCat[] = ["比劫", "印", "食伤", "财", "官杀"]
        if (c === undefined) return cats.filter((cat) => this.strongCat(cat))
        return this.pillars().some((p, i) => {
            if (i !== 2 && p.gan.shishen !== "日主"
                && SHI_SHEN_CAT[p.gan.shishen as Shishen] === c) return true
            return p.zhi.cangGan.some((g) => SHI_SHEN_CAT[g.shishen] === c)
        })
    }

    /** 两个十神是否在相邻柱天干紧贴 (差 1, 仅年/月/时). */
    adjacentTou(ss1: Shishen, ss2: Shishen): boolean {
        const posOf = (s: Shishen): number[] => {
            const out: number[] = []
            this.pillars().forEach((p, i) => {
                if (i !== 2 && p.gan.shishen === s) out.push(i)
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
            if (p.gan.shishen !== "日主") {
                const s = p.gan.shishen as Shishen
                rec[s] = (rec[s] ?? 0) + 1
            }
            p.zhi.cangGan.forEach((g) => {
                rec[g.shishen] = (rec[g.shishen] ?? 0) + 1
            })
        })
        return rec
    }

    private countAllCat(): Record<ShishenCat, number> {
        const rec: Record<ShishenCat, number> = { 比劫: 0, 印: 0, 食伤: 0, 财: 0, 官杀: 0 }
        this.pillars().forEach((p) => {
            if (p.gan.shishen !== "日主") rec[SHI_SHEN_CAT[p.gan.shishen as Shishen]]++
            p.zhi.cangGan.forEach((g) => rec[SHI_SHEN_CAT[g.shishen]]++)
        })
        return rec
    }
}
