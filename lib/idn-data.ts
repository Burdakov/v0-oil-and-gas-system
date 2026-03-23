// Test data for Топ ИДН — development map and well table
// Hierarchy: Field → License Area → Cluster → Well

export type WellMode = {
  oilRate: number      // Дебит нефти, т/сут
  liquidRate: number   // Дебит жидкости, т/сут
  waterCut: number     // Обводнённость, %
  bottomholePressure: number // Забойное давление, атм
}

export type Well = {
  id: string
  name: string
  type: "producer" | "injector"
  status: "active" | "inactive" | "repair"
  // Map coordinates (SVG space 0-800 x 0-600)
  heelX: number
  heelY: number
  toeX: number
  toeY: number
  current: WellMode
  recommended: WellMode
}

export type Cluster = {
  id: string
  name: string
  centerX: number
  centerY: number
  wells: Well[]
  licenseAreaId: string
}

export type LicenseArea = {
  id: string
  name: string
  clusters: Cluster[]
}

export type Field = {
  id: string
  name: string
  licenseAreas: LicenseArea[]
}

// ── Seeded PRNG (mulberry32) — no Math.random() at module level ───────────────
let _seed = 1234567
function rand(min: number, max: number, decimals = 1): number {
  _seed += 0x6d2b79f5
  let t = Math.imul(_seed ^ (_seed >>> 15), 1 | _seed)
  t ^= t + Math.imul(t ^ (t >>> 7), 61 | t)
  const r = ((t ^ (t >>> 14)) >>> 0) / 0x100000000
  return parseFloat((r * (max - min) + min).toFixed(decimals))
}

function makeWell(
  id: string,
  name: string,
  type: Well["type"],
  status: Well["status"],
  cx: number,
  cy: number,
  angle: number,
  len: number,
): Well {
  const rad = (angle * Math.PI) / 180
  const toeX = cx + Math.cos(rad) * len
  const toeY = cy + Math.sin(rad) * len
  const oilRate = type === "injector" ? 0 : rand(15, 120)
  const liquidRate = type === "injector" ? 0 : oilRate / (1 - rand(0.2, 0.85) / 100) * rand(1.1, 3)
  const waterCut = type === "injector" ? 0 : parseFloat(((1 - oilRate / liquidRate) * 100).toFixed(1))
  const injRate = type === "injector" ? rand(150, 600) : 0
  return {
    id,
    name,
    type,
    status,
    heelX: cx,
    heelY: cy,
    toeX,
    toeY,
    current: {
      oilRate: type === "injector" ? injRate : oilRate,
      liquidRate: type === "injector" ? injRate : liquidRate,
      waterCut,
      bottomholePressure: type === "injector" ? rand(180, 280) : rand(60, 140),
    },
    recommended: {
      oilRate: type === "injector" ? rand(injRate * 1.05, injRate * 1.3) : rand(oilRate * 1.05, oilRate * 1.4),
      liquidRate: type === "injector" ? rand(injRate * 1.05, injRate * 1.3) : rand(liquidRate * 1.05, liquidRate * 1.4),
      waterCut: type === "injector" ? 0 : Math.max(0, waterCut - rand(2, 8)),
      bottomholePressure: type === "injector" ? rand(200, 290) : rand(70, 150),
    },
  }
}

// ── Data ──────────────────────────────────────────────────────────────────────
export const fieldData: Field = {
  id: "romashkino",
  name: "Ромашкинское",
  licenseAreas: [
    {
      id: "la-1",
      name: "Участок-1",
      clusters: [
        {
          id: "cl-101",
          name: "Куст 101",
          centerX: 180,
          centerY: 150,
          licenseAreaId: "la-1",
          wells: [
            makeWell("w-1011", "1011", "producer", "active", 180, 150, -30, 90),
            makeWell("w-1012", "1012", "producer", "active", 180, 150, 10, 85),
            makeWell("w-1013", "1013", "producer", "repair", 180, 150, 50, 95),
            makeWell("w-1014", "1014", "injector", "active", 180, 150, 190, 100),
          ],
        },
        {
          id: "cl-102",
          name: "Куст 102",
          centerX: 330,
          centerY: 110,
          licenseAreaId: "la-1",
          wells: [
            makeWell("w-1021", "1021", "producer", "active", 330, 110, -20, 80),
            makeWell("w-1022", "1022", "producer", "active", 330, 110, 30, 90),
            makeWell("w-1023", "1023", "injector", "active", 330, 110, 200, 95),
            makeWell("w-1024", "1024", "injector", "inactive", 330, 110, 170, 85),
          ],
        },
      ],
    },
    {
      id: "la-2",
      name: "Участок-2",
      clusters: [
        {
          id: "cl-201",
          name: "Куст 201",
          centerX: 160,
          centerY: 340,
          licenseAreaId: "la-2",
          wells: [
            makeWell("w-2011", "2011", "producer", "active", 160, 340, -60, 95),
            makeWell("w-2012", "2012", "producer", "active", 160, 340, -10, 88),
            makeWell("w-2013", "2013", "producer", "inactive", 160, 340, 40, 80),
            makeWell("w-2014", "2014", "injector", "active", 160, 340, 200, 100),
          ],
        },
        {
          id: "cl-202",
          name: "Куст 202",
          centerX: 340,
          centerY: 310,
          licenseAreaId: "la-2",
          wells: [
            makeWell("w-2021", "2021", "producer", "active", 340, 310, -40, 85),
            makeWell("w-2022", "2022", "producer", "active", 340, 310, 20, 92),
            makeWell("w-2023", "2023", "producer", "repair", 340, 310, 70, 78),
            makeWell("w-2024", "2024", "injector", "active", 340, 310, 190, 105),
            makeWell("w-2025", "2025", "injector", "active", 340, 310, 210, 90),
          ],
        },
        {
          id: "cl-203",
          name: "Куст 203",
          centerX: 500,
          centerY: 270,
          licenseAreaId: "la-2",
          wells: [
            makeWell("w-2031", "2031", "producer", "active", 500, 270, -50, 88),
            makeWell("w-2032", "2032", "producer", "active", 500, 270, 10, 82),
            makeWell("w-2033", "2033", "injector", "active", 500, 270, 180, 95),
          ],
        },
      ],
    },
    {
      id: "la-3",
      name: "Участок-3",
      clusters: [
        {
          id: "cl-301",
          name: "Куст 301",
          centerX: 530,
          centerY: 130,
          licenseAreaId: "la-3",
          wells: [
            makeWell("w-3011", "3011", "producer", "active", 530, 130, -35, 90),
            makeWell("w-3012", "3012", "producer", "active", 530, 130, 15, 85),
            makeWell("w-3013", "3013", "injector", "active", 530, 130, 185, 100),
          ],
        },
        {
          id: "cl-302",
          name: "Куст 302",
          centerX: 660,
          centerY: 220,
          licenseAreaId: "la-3",
          wells: [
            makeWell("w-3021", "3021", "producer", "active", 660, 220, -25, 95),
            makeWell("w-3022", "3022", "producer", "inactive", 660, 220, 25, 80),
            makeWell("w-3023", "3023", "producer", "active", 660, 220, 65, 88),
            makeWell("w-3024", "3024", "injector", "active", 660, 220, 195, 105),
          ],
        },
      ],
    },
  ],
}

// ── Time-series types ─────────────────────────────────────────────────────────
export type TimeSeriesPoint = {
  date: string          // ISO date string "YYYY-MM-DD"
  // Actual (fact)
  liquidRate: number    // Дебит жидкости факт, т/сут
  oilRate: number       // Дебит нефти факт, т/сут
  bottomholePressure: number // Забойное давление факт, атм
  // Infrastructure limit
  infraLimit: number    // Ограничение инфраструктуры по жидкости, т/сут
  // Potential (recommended mode)
  liquidRatePot: number
  oilRatePot: number
  bottomholePressurePot: number
}

// Generate 26 weekly points covering ~6 months ending today (2026-03-23)
function generateTimeSeries(
  baseLiquid: number,
  baseOil: number,
  baseBhp: number,
  infraLimit: number,
): TimeSeriesPoint[] {
  const points: TimeSeriesPoint[] = []
  // End date fixed for determinism
  const endMs = new Date("2026-03-23").getTime()
  const weekMs = 7 * 24 * 3600 * 1000
  const n = 26
  for (let i = 0; i < n; i++) {
    const t = i / (n - 1)
    const d = new Date(endMs - (n - 1 - i) * weekMs)
    const dateStr = d.toISOString().slice(0, 10)
    // Fact: slight decline trend + noise
    const liq = baseLiquid * (1 - 0.08 * t) + rand(-baseLiquid * 0.04, baseLiquid * 0.04, 1)
    const oil = baseOil * (1 - 0.12 * t) + rand(-baseOil * 0.04, baseOil * 0.04, 1)
    const bhp = baseBhp * (1 + 0.05 * t) + rand(-3, 3, 1)
    // Potential: always above fact, stable or slight growth
    const liqPot = liq * (1 + rand(0.08, 0.22, 2))
    const oilPot = oil * (1 + rand(0.10, 0.30, 2))
    const bhpPot = bhp * (1 - rand(0.05, 0.15, 2))
    points.push({
      date: dateStr,
      liquidRate: Math.max(0, parseFloat(liq.toFixed(1))),
      oilRate: Math.max(0, parseFloat(oil.toFixed(1))),
      bottomholePressure: Math.max(20, parseFloat(bhp.toFixed(1))),
      infraLimit,
      liquidRatePot: parseFloat(liqPot.toFixed(1)),
      oilRatePot: parseFloat(oilPot.toFixed(1)),
      bottomholePressurePot: Math.max(20, parseFloat(bhpPot.toFixed(1))),
    })
  }
  return points
}

// Field-level aggregate time series (sum of all producers)
export const fieldTimeSeries: TimeSeriesPoint[] = generateTimeSeries(4800, 1450, 95, 5500)

// Per-cluster time series keyed by cluster id
export const clusterTimeSeries: Record<string, TimeSeriesPoint[]> = {
  "cl-101": generateTimeSeries(820, 240, 88, 950),
  "cl-102": generateTimeSeries(640, 175, 82, 750),
  "cl-201": generateTimeSeries(710, 200, 91, 820),
  "cl-202": generateTimeSeries(930, 280, 94, 1100),
  "cl-203": generateTimeSeries(580, 160, 86, 680),
  "cl-301": generateTimeSeries(490, 145, 78, 560),
  "cl-302": generateTimeSeries(630, 195, 83, 740),
}

// Per-well time series keyed by well id (producers only)
export const wellTimeSeries: Record<string, TimeSeriesPoint[]> = {
  "w-1011": generateTimeSeries(310, 92, 85, 370),
  "w-1012": generateTimeSeries(285, 80, 82, 340),
  "w-1013": generateTimeSeries(225, 68, 79, 260),
  "w-1021": generateTimeSeries(340, 97, 88, 400),
  "w-1022": generateTimeSeries(300, 78, 84, 350),
  "w-2011": generateTimeSeries(260, 74, 90, 310),
  "w-2012": generateTimeSeries(240, 65, 87, 290),
  "w-2013": generateTimeSeries(210, 61, 83, 250),
  "w-2021": generateTimeSeries(390, 115, 96, 460),
  "w-2022": generateTimeSeries(340, 98, 93, 400),
  "w-2023": generateTimeSeries(200, 67, 88, 240),
  "w-2031": generateTimeSeries(315, 90, 85, 375),
  "w-2032": generateTimeSeries(265, 70, 82, 305),
  "w-3011": generateTimeSeries(250, 75, 77, 290),
  "w-3012": generateTimeSeries(240, 70, 74, 270),
  "w-3021": generateTimeSeries(335, 100, 81, 390),
  "w-3022": generateTimeSeries(200, 62, 79, 240),
  "w-3023": generateTimeSeries(295, 95, 83, 350),
}

// Flat cluster list for convenience
export function getAllClusters(field: Field): (Cluster & { licenseAreaName: string })[] {
  return field.licenseAreas.flatMap((la) =>
    la.clusters.map((cl) => ({ ...cl, licenseAreaName: la.name })),
  )
}

// Flat well list
export function getAllWells(field: Field): (Well & { clusterName: string; licenseAreaName: string })[] {
  return field.licenseAreas.flatMap((la) =>
    la.clusters.flatMap((cl) =>
      cl.wells.map((w) => ({ ...w, clusterName: cl.name, licenseAreaName: la.name })),
    ),
  )
}

// Pie data for a cluster: [oil, water, injection]
export function clusterPieData(cluster: Cluster) {
  const producers = cluster.wells.filter((w) => w.type === "producer" && w.status === "active")
  const injectors = cluster.wells.filter((w) => w.type === "injector" && w.status === "active")
  const totalLiquid = producers.reduce((s, w) => s + w.current.liquidRate, 0)
  const totalOil = producers.reduce((s, w) => s + w.current.oilRate, 0)
  const totalWater = totalLiquid - totalOil
  const totalInj = injectors.reduce((s, w) => s + w.current.oilRate, 0) // stored in oilRate for injectors
  return { oil: totalOil, water: totalWater, injection: totalInj }
}
