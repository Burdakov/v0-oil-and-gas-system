// Test data for "Контроль фонда" — well performance decline analysis
// Decline factors: Кпрод (productivity index decline), Рпл (reservoir pressure drop), Обв (water cut increase)

import { fieldData } from "@/lib/idn-data"
import type { Field, Cluster, LicenseArea } from "@/lib/idn-data"

export type DeclineFactor = "kprod" | "rpl" | "obv"

export type WellDecline = {
  wellId: string
  wellName: string
  clusterId: string
  clusterName: string
  licenseAreaId: string
  licenseAreaName: string
  // Decline magnitudes (positive = deterioration, units: % change from base)
  kprodDecline: number  // % снижения Кпрод
  rplDecline: number    // % снижения Рпл
  obvDecline: number    // % роста Обв (percentage points)
  // Absolute production declines, т/сут
  oilDecline: number    // суммарное снижение дебита нефти, т/сут
  liquidDecline: number // суммарное снижение дебита жидкости, т/сут
  // Забойное давление
  bhpDecline: number    // снижение Рзаб, атм
  // Состояние скважины
  wellStatus: "active" | "stopped" // остановленные учитываются как снижение фонда
  // Скрытый ВСП (виртуальная скважина-перемычка)
  hiddenVsp: number     // объём скрытого ВСП, т/сут (0 = нет)
  // Dominant factor driving the decline
  dominantFactor: DeclineFactor
  // Current values
  kprod: number         // текущий Кпрод, т/(сут·атм)
  rpl: number           // текущее Рпл, атм
  obv: number           // текущая обводнённость, %
  // Recommended action text
  recommendation: string
  // Status for action: "pending" | "accepted" | "adjusted"
  actionStatus: "pending" | "accepted" | "adjusted"
  // GTM option
  gtmOption: "sufs" | "network" | "df04" | null
}

// Deterministic PRNG
let _s = 9876543
function r(min: number, max: number, dec = 1): number {
  _s += 0x6d2b79f5
  let t = Math.imul(_s ^ (_s >>> 15), 1 | _s)
  t ^= t + Math.imul(t ^ (t >>> 7), 61 | t)
  const v = ((t ^ (t >>> 14)) >>> 0) / 0x100000000
  return parseFloat((v * (max - min) + min).toFixed(dec))
}

const RECOMMENDATIONS: Record<DeclineFactor, string[]> = {
  kprod: [
    "Провести обработку ПЗП (кислотная обработка)",
    "Выполнить ГРП для восстановления продуктивности",
    "Оптимизировать режим работы насоса (ЭЦН)",
    "Провести депрессионные исследования КВД",
  ],
  rpl: [
    "Увеличить объём закачки по соседним нагнетательным скважинам",
    "Провести выравнивание профиля приёмистости",
    "Ввести дополнительную нагнетательную скважину в работу",
    "Перераспределить закачку между пластами",
  ],
  obv: [
    "Провести водоизоляционные работы (ВИР)",
    "Выполнить ограничение водопритока (ОВП)",
    "Оптимизировать отборы для снижения конусообразования",
    "Провести РИР для изоляции водонасыщенных интервалов",
  ],
}

function pickRec(factor: DeclineFactor, seed: number): string {
  const arr = RECOMMENDATIONS[factor]
  return arr[seed % arr.length]
}

function buildDeclineData(): WellDecline[] {
  const result: WellDecline[] = []
  let idx = 0

  fieldData.licenseAreas.forEach((la: LicenseArea) => {
    la.clusters.forEach((cl: Cluster) => {
      cl.wells.forEach((w) => {
        if (w.type !== "producer") return

        const kprodDecline = r(2, 38)
        const rplDecline = r(1, 25)
        const obvDecline = r(0.5, 18)

        // Dominant factor = largest relative decline
        const factors: [DeclineFactor, number][] = [
          ["kprod", kprodDecline],
          ["rpl", rplDecline],
          ["obv", obvDecline],
        ]
        const dominant = factors.reduce((a, b) => (b[1] > a[1] ? b : a))[0]

        const kprod = r(0.3, 3.8, 2)
        const rpl = r(85, 180, 1)
        const obv = w.current.waterCut

        // Absolute declines derived from current rates and relative decline magnitudes
        const baseLiquid = w.current.liquidRate
        const baseOil = w.current.oilRate
        const liquidDecline = parseFloat((baseLiquid * (kprodDecline / 100 * 0.6 + rplDecline / 100 * 0.3 + obvDecline / 100 * 0.1)).toFixed(1))
        const oilDecline = parseFloat((baseOil * (kprodDecline / 100 * 0.55 + rplDecline / 100 * 0.35 + obvDecline / 100 * 0.1)).toFixed(1))

        // Рзаб decline: driven primarily by Рпл drop and Кпрод decline
        const bhpDecline = parseFloat((rpl * (rplDecline / 100 * 0.7 + kprodDecline / 100 * 0.2)).toFixed(1))

        // ~15% wells are stopped — deterministic by index
        const wellStatus: "active" | "stopped" = (idx % 7 === 3) ? "stopped" : "active"

        // ~25% wells have hidden VSP — non-zero volume for those
        const hiddenVsp = (idx % 4 === 1)
          ? parseFloat((baseOil * r(0.05, 0.22, 3)).toFixed(1))
          : 0

        result.push({
          wellId: w.id,
          wellName: w.name,
          clusterId: cl.id,
          clusterName: cl.name,
          licenseAreaId: la.id,
          licenseAreaName: la.name,
          kprodDecline,
          rplDecline,
          obvDecline,
          oilDecline,
          liquidDecline,
          bhpDecline,
          wellStatus,
          hiddenVsp,
          dominantFactor: dominant,
          kprod,
          rpl,
          obv,
          recommendation: pickRec(dominant, idx),
          actionStatus: "pending",
          gtmOption: null,
        })
        idx++
      })
    })
  })

  // Sort by total severity (sum of normalised declines) descending
  return result.sort(
    (a, b) =>
      (b.kprodDecline / 38 + b.rplDecline / 25 + b.obvDecline / 18) -
      (a.kprodDecline / 38 + a.rplDecline / 25 + a.obvDecline / 18),
  )
}

export const wellControlData: WellDecline[] = buildDeclineData()

// ── Well production time-series ───────────────────────────────────────────────
export type WellTsPoint = {
  date: string            // "YYYY-MM-DD"
  liquidFact: number      // Дебит жидкости, м³/сут
  liquidVfm: number       // Дебит жидкости по виртуальному расходомеру, м³/сут
  oilFact: number         // Дебит нефти, т/сут
  waterCut: number        // Обводнённость, %
  intakePressure: number  // Давление на приёме насоса, атм
  bottomholePressure: number // Забойное давление, атм
  gasFactor: number       // Газовый фактор, м³/т
}

export type AveragingPeriod = "raw" | "day" | "month" | "year"

// Generate 180 daily points (≈ 6 months ending 2026-03-23)
function generateWellTs(
  baseLiquid: number,
  baseOil: number,
  baseWc: number,
  baseIntake: number,
  baseBhp: number,
  baseGor: number,
  seed: number,
): WellTsPoint[] {
  let s = seed >>> 0
  function rng() {
    s += 0x6d2b79f5
    let t = Math.imul(s ^ (s >>> 15), 1 | s)
    t ^= t + Math.imul(t ^ (t >>> 7), 61 | t)
    return ((t ^ (t >>> 14)) >>> 0) / 0x100000000
  }

  const endMs = new Date("2026-03-23").getTime()
  const dayMs = 86400_000
  const n = 180
  const pts: WellTsPoint[] = []

  for (let i = 0; i < n; i++) {
    const t = i / (n - 1)
    const date = new Date(endMs - (n - 1 - i) * dayMs).toISOString().slice(0, 10)
    const noise = () => (rng() - 0.5) * 2

    // Slight decline trend + daily noise
    const liqFact = Math.max(5, baseLiquid * (1 - 0.06 * t) + noise() * baseLiquid * 0.05)
    // VFM slightly diverges from fact (±3–5%)
    const liqVfm = Math.max(5, liqFact * (1 + (rng() - 0.5) * 0.08))
    const wc = Math.min(98, Math.max(1, baseWc + t * 2.5 + noise() * 1.2))
    const oilFact = Math.max(0.5, liqFact * (1 - wc / 100))
    const intake = Math.max(15, baseIntake * (1 - 0.04 * t) + noise() * 4)
    const bhp = Math.max(15, baseBhp * (1 - 0.03 * t) + noise() * 3)
    const gor = Math.max(10, baseGor * (1 + 0.08 * t) + noise() * baseGor * 0.06)

    pts.push({
      date,
      liquidFact: Math.round(liqFact * 10) / 10,
      liquidVfm: Math.round(liqVfm * 10) / 10,
      oilFact: Math.round(oilFact * 10) / 10,
      waterCut: Math.round(wc * 10) / 10,
      intakePressure: Math.round(intake * 10) / 10,
      bottomholePressure: Math.round(bhp * 10) / 10,
      gasFactor: Math.round(gor * 10) / 10,
    })
  }
  return pts
}

// Average a set of points to coarser period
export function averageTs(pts: WellTsPoint[], period: AveragingPeriod): WellTsPoint[] {
  if (period === "raw" || pts.length === 0) return pts

  function getKey(date: string) {
    if (period === "day") return date
    if (period === "month") return date.slice(0, 7)
    return date.slice(0, 4)
  }

  const groups = new Map<string, WellTsPoint[]>()
  for (const p of pts) {
    const k = getKey(p.date)
    if (!groups.has(k)) groups.set(k, [])
    groups.get(k)!.push(p)
  }

  function avg(arr: number[]) {
    return Math.round((arr.reduce((s, v) => s + v, 0) / arr.length) * 10) / 10
  }

  return Array.from(groups.entries()).map(([k, group]) => ({
    date: period === "month" ? k + "-15" : period === "year" ? k + "-07-01" : k,
    liquidFact: avg(group.map((p) => p.liquidFact)),
    liquidVfm: avg(group.map((p) => p.liquidVfm)),
    oilFact: avg(group.map((p) => p.oilFact)),
    waterCut: avg(group.map((p) => p.waterCut)),
    intakePressure: avg(group.map((p) => p.intakePressure)),
    bottomholePressure: avg(group.map((p) => p.bottomholePressure)),
    gasFactor: avg(group.map((p) => p.gasFactor)),
  }))
}

// Pre-generated per-well time series keyed by wellId
const WELL_TS_PARAMS: Record<string, [number, number, number, number, number, number, number]> = {
  "w-1011": [320, 95, 70, 110, 85, 80, 1001],
  "w-1012": [285, 80, 72, 100, 78, 95, 1002],
  "w-1013": [240, 65, 73, 95, 72, 88, 1003],
  "w-1021": [355, 98, 72, 115, 90, 75, 1004],
  "w-1022": [310, 82, 74, 105, 82, 90, 1005],
  "w-2011": [270, 76, 72, 102, 79, 85, 2001],
  "w-2012": [245, 68, 72, 98, 76, 92, 2002],
  "w-2013": [215, 62, 71, 90, 70, 98, 2003],
  "w-2021": [400, 118, 71, 125, 98, 70, 2004],
  "w-2022": [350, 100, 71, 118, 93, 75, 2005],
  "w-2023": [205, 68, 67, 88, 68, 102, 2006],
  "w-2031": [325, 92, 72, 108, 84, 82, 2007],
  "w-2032": [270, 72, 73, 98, 76, 90, 2008],
  "w-3011": [255, 76, 70, 96, 74, 88, 3001],
  "w-3012": [245, 72, 71, 93, 72, 92, 3002],
  "w-3021": [340, 102, 70, 112, 87, 78, 3003],
  "w-3022": [205, 63, 69, 86, 67, 105, 3004],
  "w-3023": [300, 96, 68, 105, 82, 80, 3005],
}

export const wellTimeSeries: Record<string, WellTsPoint[]> = Object.fromEntries(
  Object.entries(WELL_TS_PARAMS).map(([id, p]) => [
    id,
    generateWellTs(p[0], p[1], p[2], p[3], p[4], p[5], p[6]),
  ])
)

// Aggregate multiple well series into one by summing rates, averaging pressures/wc/gor
function aggregateWellTs(seriesList: WellTsPoint[][]): WellTsPoint[] {
  if (seriesList.length === 0) return []
  const n = seriesList[0].length
  const result: WellTsPoint[] = []
  for (let i = 0; i < n; i++) {
    const pts = seriesList.map((s) => s[i])
    const cnt = pts.length
    const sum = (fn: (p: WellTsPoint) => number) =>
      Math.round(pts.reduce((s, p) => s + fn(p), 0) * 10) / 10
    const mean = (fn: (p: WellTsPoint) => number) =>
      Math.round((pts.reduce((s, p) => s + fn(p), 0) / cnt) * 10) / 10
    result.push({
      date: pts[0].date,
      liquidFact:          sum((p) => p.liquidFact),
      liquidVfm:           sum((p) => p.liquidVfm),
      oilFact:             sum((p) => p.oilFact),
      waterCut:            mean((p) => p.waterCut),
      intakePressure:      mean((p) => p.intakePressure),
      bottomholePressure:  mean((p) => p.bottomholePressure),
      gasFactor:           mean((p) => p.gasFactor),
    })
  }
  return result
}

// Cluster aggregate time series keyed by clusterId
export const clusterTimeSeries: Record<string, WellTsPoint[]> = Object.fromEntries(
  fieldData.licenseAreas.flatMap((la) =>
    la.clusters.map((cl) => {
      const wellIds = cl.wells
        .filter((w) => w.type === "producer")
        .map((w) => w.id)
        .filter((id) => wellTimeSeries[id])
      return [cl.id, aggregateWellTs(wellIds.map((id) => wellTimeSeries[id]))]
    })
  )
)

// License area aggregate time series keyed by licenseAreaId
export const licenseAreaTimeSeries: Record<string, WellTsPoint[]> = Object.fromEntries(
  fieldData.licenseAreas.map((la) => {
    const wellIds = la.clusters
      .flatMap((cl) => cl.wells.filter((w) => w.type === "producer").map((w) => w.id))
      .filter((id) => wellTimeSeries[id])
    return [la.id, aggregateWellTs(wellIds.map((id) => wellTimeSeries[id]))]
  })
)

// Field-wide aggregate
export const fieldControlTimeSeries: WellTsPoint[] = aggregateWellTs(
  Object.values(wellTimeSeries)
)

// Selection type used by page + chart
export type ChartSelection =
  | { level: "field" }
  | { level: "area"; areaId: string; areaName: string }
  | { level: "cluster"; clusterId: string; clusterName: string }
  | { level: "well"; wellId: string; wellName: string }

// Group by cluster for map pies
export type ClusterDeclinePie = {
  clusterId: string
  clusterName: string
  centerX: number
  centerY: number
  kprod: number   // avg kprod decline %
  rpl: number     // avg rpl decline %
  obv: number     // avg obv delta pp
}

export function getClusterDeclinePies(): ClusterDeclinePie[] {
  return fieldData.licenseAreas.flatMap((la) =>
    la.clusters.map((cl) => {
      const wells = wellControlData.filter((w) => w.clusterId === cl.id)
      if (wells.length === 0) return null
      const avg = (arr: number[]) => arr.reduce((s, v) => s + v, 0) / arr.length
      return {
        clusterId: cl.id,
        clusterName: cl.name,
        centerX: cl.centerX,
        centerY: cl.centerY,
        kprod: parseFloat(avg(wells.map((w) => w.kprodDecline)).toFixed(1)),
        rpl: parseFloat(avg(wells.map((w) => w.rplDecline)).toFixed(1)),
        obv: parseFloat(avg(wells.map((w) => w.obvDecline)).toFixed(1)),
      }
    }).filter(Boolean) as ClusterDeclinePie[]
  )
}

export const clusterDeclinePies = getClusterDeclinePies()
