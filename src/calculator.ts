import { changshengState, type ChangSheng } from "./changsheng";
import { CANG_GAN, ganWuxing, PILLAR_LABELS, zhiWuxing, type PillarType } from "./ganzhi";
import { nayinNameOf } from "./nayin";
import { computeShensha, type Shensha } from "./shensha";
import { computeShishenGan, computeShishenZhi, computeShishenWuxing, type Shishen, SHI_SHEN_CAT, type ShishenCat } from "./shishen";
import type { BaziInput, Gan, Pillar, Sex, WuXing, Zhi } from "./types";

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

export class Calculator {
    private fourPillars: [Pillar, Pillar, Pillar, Pillar | undefined]
    private mustPillars: Pillar[]

    constructor(
        public bazi: BaziInput,
        public sex: Sex
    ) {
        this.fourPillars = [this.bazi.year, this.bazi.month, this.bazi.day, this.bazi.hour]
        this.mustPillars = this.fourPillars.filter((p): p is Pillar => !!p)
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

    /** 年/月/时三柱天干是否透此五行。 */
    touWx(wx: WuXing): boolean {
        return this.mustPillars.some((p, i) => i !== 2 && ganWuxing(p.gan) === wx)
    }
    /** 地支本气是否有根。 */
    rootWx(wx: WuXing): boolean {
        return this.zhiMainWxCount(wx) > 0
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

export class ShishenCalculator {
    constructor(
        private calculator: Calculator,
    ) { }

    /** 天干是否透某十神。 */
    tou(ss: Shishen): boolean {
        return this.calculator.pillars().some((p, i) => i !== 2 && p.gan.shishen === ss)
    }
    /** 天干是否透某类别十神。 */ 
    touCat(c: ShishenCat): boolean {
        return this.calculator.pillars().some((p, i) => i !== 2 && SHI_SHEN_CAT[p.gan.shishen as Shishen] === c)
    }
    /** 地支藏干是否含某十神。 */
    zang(ss: Shishen): boolean {
        return this.calculator.pillars().some((p) => p.zhi.cangGan.some((g) => g.shishen === ss))
    }
    /** 透或藏是否含某十神。 */
    has(ss: Shishen): boolean {
        return this.tou(ss) || this.zang(ss)
    }
    /** 透或藏是否含某类别十神。 */
    hasCat(c: ShishenCat): boolean {
        return this.touCat(c) || this.calculator.pillars().some((p) => p.zhi.cangGan.some((g) => SHI_SHEN_CAT[g.shishen] === c))
    }
    /** 某十神在地支本气出现的柱索引列表。 */
    mainAt(ss: Shishen): number[] {
        const out: number[] = []
        this.calculator.pillars().forEach((p, i) => {
            if (p.zhi.cangGan.some((g) => g.shishen === ss)) out.push(i)
        })
        return out
    }
    /** 透或在地支本气出现，即"有力"。 */
    strong(ss: Shishen): boolean {
        return this.tou(ss) || this.mainAt(ss).length > 0
    }
    /** 某类别十神是否透或在地支本气出现。 */
    strongCat(c: ShishenCat): boolean {
        return this.calculator.pillars().some((p, i) => {
            if (i !== 2 && SHI_SHEN_CAT[p.gan.shishen as Shishen] === c) return true
            const h = p.zhi.cangGan[0]?.shishen
            return !!h && SHI_SHEN_CAT[h] === c
        })
    }
    /** 某十神出现次数（透 + 藏）。 */
    countOf(ss: Shishen): number {
        const { ganSs, allZhiArr } = this.calculator.pillars().reduce((acc, p) => {
            if (p.gan.shishen) acc.ganSs.push(p.gan.shishen as Shishen)
            p.zhi.cangGan.forEach((g) => {
                if (g.shishen) acc.allZhiArr.push(g.shishen as Shishen)
            })
            return acc
        }, { ganSs: [] as Shishen[], allZhiArr: [] as Shishen[] })
        let n = 0
        for (const g of ganSs) if (g === ss) n++
        for (const z of allZhiArr) if (z === ss) n++
        return n
    }
    /** 某类别十神出现次数（透 + 藏）。 */
    countCat(c: ShishenCat): number {
        const { ganSs, allZhiArr } = this.calculator.pillars().reduce((acc, p) => {
            if (p.gan.shishen) acc.ganSs.push(p.gan.shishen as Shishen)
            p.zhi.cangGan.forEach((g) => {
                if (g.shishen) acc.allZhiArr.push(g.shishen as Shishen)
            })
            return acc
        }, { ganSs: [] as Shishen[], allZhiArr: [] as Shishen[] })
        let n = 0
        for (const g of ganSs) if (SHI_SHEN_CAT[g] === c) n++
        for (const z of allZhiArr) if (SHI_SHEN_CAT[z] === c) n++
        return n
    }
    /** 两个十神是否在相邻柱天干紧贴（差 1）。 */
    adjacentTou(pillars: DetailedPillar[], s1: Shishen, s2: Shishen): boolean {
        const posOf = (s: Shishen) => {
            const out: number[] = []
            if (pillars[0]?.gan.shishen === s) out.push(0)
            if (pillars[1]?.gan.shishen === s) out.push(1)
            if (pillars[3]?.gan.shishen === s) out.push(3)
            return out
        }
        const p1 = posOf(s1)
        const p2 = posOf(s2)
        for (const a of p1) for (const b of p2) if (Math.abs(a - b) === 1) return true
        return false
    }
}
