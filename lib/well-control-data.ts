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
