// Тестовые данные: характеристика обводнённости (обводнённость / накопленная добыча нефти)
// Иерархия: месторождение → куст → скважина

export type WaterCutPoint = {
  cumOil: number   // накопленная добыча нефти, тыс. т
  waterCut: number // обводнённость, %
}

export type WellData = {
  id: string
  name: string
  type: "producer" | "injector"
  status: "active" | "warning" | "inactive"
  startYear: number
  series: WaterCutPoint[]
}

export type PadData = {
  id: string
  name: string
  wells: WellData[]
}

export type FieldData = {
  id: string
  name: string
  pads: PadData[]
}

// Deterministic pseudo-random (mulberry32 seeded PRNG) — no Math.random() at module level
function makePrng(seed: number) {
  let s = seed >>> 0
  return () => {
    s += 0x6d2b79f5
    let t = Math.imul(s ^ (s >>> 15), 1 | s)
    t ^= t + Math.imul(t ^ (t >>> 7), 61 | t)
    return ((t ^ (t >>> 14)) >>> 0) / 0x100000000
  }
}

// Генератор характеристики обводнённости по логистической кривой
function generateWaterCutSeries(
  startCumOil: number,
  endCumOil: number,
  steps: number,
  wc0: number,       // начальная обводнённость, %
  wcMax: number,     // максимальная обводнённость, %
  midpoint: number,  // точка перегиба (тыс. т)
  steepness: number, // крутизна
  noise: number = 1.2,
  seed: number = 42,
): WaterCutPoint[] {
  const rng = makePrng(seed)
  const result: WaterCutPoint[] = []
  const step = (endCumOil - startCumOil) / steps
  for (let i = 0; i <= steps; i++) {
    const cumOil = +(startCumOil + i * step).toFixed(1)
    const logistic = wcMax / (1 + Math.exp(-steepness * (cumOil - midpoint)))
    const rawWc = wc0 + (logistic - wcMax / 2) * (wcMax - wc0) / (wcMax / 2)
    const jitter = (rng() - 0.5) * noise
    const waterCut = +Math.min(wcMax, Math.max(wc0, rawWc + jitter)).toFixed(1)
    result.push({ cumOil, waterCut })
  }
  return result
}

export const fieldData: FieldData = {
  id: "romashkino",
  name: "Ромашкинское",
  pads: [
    {
      id: "pad-3",
      name: "Куст 3",
      wells: [
        {
          id: "R-071", name: "Р-071", type: "producer", status: "active", startYear: 2008,
          series: generateWaterCutSeries(0, 420, 42, 5, 91, 280, 0.012, 1.0, 101),
        },
        {
          id: "R-088", name: "Р-088", type: "producer", status: "inactive", startYear: 2010,
          series: generateWaterCutSeries(0, 185, 37, 12, 88, 130, 0.018, 1.5, 102),
        },
        {
          id: "R-094", name: "Р-094", type: "producer", status: "active", startYear: 2012,
          series: generateWaterCutSeries(0, 310, 31, 8, 85, 210, 0.014, 0.9, 103),
        },
      ],
    },
    {
      id: "pad-7",
      name: "Куст 7",
      wells: [
        {
          id: "R-147", name: "Р-147", type: "producer", status: "active", startYear: 2005,
          series: generateWaterCutSeries(0, 680, 68, 4, 94, 440, 0.010, 0.8, 201),
        },
        {
          id: "R-155", name: "Р-155", type: "producer", status: "active", startYear: 2006,
          series: generateWaterCutSeries(0, 590, 59, 6, 92, 380, 0.011, 1.1, 202),
        },
        {
          id: "R-204", name: "Р-204", type: "producer", status: "warning", startYear: 2009,
          series: generateWaterCutSeries(0, 245, 49, 15, 87, 160, 0.017, 1.3, 203),
        },
      ],
    },
    {
      id: "pad-12",
      name: "Куст 12",
      wells: [
        {
          id: "R-295", name: "Р-295", type: "producer", status: "warning", startYear: 2011,
          series: generateWaterCutSeries(0, 275, 55, 10, 89, 180, 0.015, 1.2, 301),
        },
        {
          id: "R-311", name: "Р-311", type: "producer", status: "active", startYear: 2013,
          series: generateWaterCutSeries(0, 195, 39, 3, 82, 140, 0.016, 0.7, 302),
        },
        {
          id: "R-328", name: "Р-328", type: "producer", status: "active", startYear: 2015,
          series: generateWaterCutSeries(0, 158, 32, 7, 80, 110, 0.018, 1.0, 303),
        },
      ],
    },
    {
      id: "pad-18",
      name: "Куст 18",
      wells: [
        {
          id: "R-412", name: "Р-412", type: "producer", status: "active", startYear: 2016,
          series: generateWaterCutSeries(0, 132, 26, 5, 78, 95, 0.020, 0.9, 401),
        },
        {
          id: "R-431", name: "Р-431", type: "producer", status: "active", startYear: 2018,
          series: generateWaterCutSeries(0, 98, 20, 2, 72, 72, 0.022, 0.8, 402),
        },
        {
          id: "R-448", name: "Р-448", type: "producer", status: "inactive", startYear: 2019,
          series: generateWaterCutSeries(0, 54, 18, 8, 75, 40, 0.025, 1.4, 403),
        },
      ],
    },
  ],
}

// Round to 1 decimal place using integer arithmetic — avoids toFixed() cross-env drift
function r1(x: number): number {
  return Math.round(x * 10) / 10
}

// Агрегация серии куста (среднее обводнённости по суммарной накопленной добыче)
export function aggregatePadSeries(pad: PadData): WaterCutPoint[] {
  const producers = pad.wells.filter((w) => w.type === "producer")
  if (producers.length === 0) return []

  const maxCum = Math.max(...producers.map((w) => w.series[w.series.length - 1]?.cumOil ?? 0))
  const STEPS = 40
  const result: WaterCutPoint[] = []

  for (let i = 0; i <= STEPS; i++) {
    const cumOil = r1(maxCum * i / STEPS)
    const wcs = producers.map((w) => {
      const s = w.series
      if (cumOil <= s[0].cumOil) return s[0].waterCut
      if (cumOil >= s[s.length - 1].cumOil) return s[s.length - 1].waterCut
      const idx = s.findIndex((p) => p.cumOil >= cumOil)
      if (idx <= 0) return s[0].waterCut
      const a = s[idx - 1], b = s[idx]
      const t = (cumOil - a.cumOil) / (b.cumOil - a.cumOil)
      return a.waterCut + t * (b.waterCut - a.waterCut)
    })
    const avgWc = r1(wcs.reduce((a, v) => a + v, 0) / wcs.length)
    result.push({ cumOil, waterCut: avgWc })
  }
  return result
}

// Агрегация серии месторождения
export function aggregateFieldSeries(field: FieldData): WaterCutPoint[] {
  const allProducers = field.pads.flatMap((p) => p.wells.filter((w) => w.type === "producer"))
  if (allProducers.length === 0) return []

  const maxCum = Math.max(...allProducers.map((w) => w.series[w.series.length - 1]?.cumOil ?? 0))
  const STEPS = 50
  const result: WaterCutPoint[] = []

  for (let i = 0; i <= STEPS; i++) {
    const cumOil = r1(maxCum * i / STEPS)
    const wcs = allProducers.map((w) => {
      const s = w.series
      if (cumOil <= s[0].cumOil) return s[0].waterCut
      if (cumOil >= s[s.length - 1].cumOil) return s[s.length - 1].waterCut
      const idx = s.findIndex((p) => p.cumOil >= cumOil)
      if (idx <= 0) return s[0].waterCut
      const a = s[idx - 1], b = s[idx]
      const t = (cumOil - a.cumOil) / (b.cumOil - a.cumOil)
      return a.waterCut + t * (b.waterCut - a.waterCut)
    })
    const avgWc = r1(wcs.reduce((a, v) => a + v, 0) / wcs.length)
    result.push({ cumOil, waterCut: avgWc })
  }
  return result
}

// Pre-computed aggregates frozen at module load — avoids SSR/client hydration drift
export const precomputedPadSeries: Record<string, WaterCutPoint[]> = Object.fromEntries(
  fieldData.pads.map((pad) => [pad.id, aggregatePadSeries(pad)])
)
export const precomputedFieldSeries: WaterCutPoint[] = aggregateFieldSeries(fieldData)

// Pre-computed scalar stats frozen at module level — never recomputed on client
const _allProducers = fieldData.pads.flatMap((p) => p.wells.filter((w) => w.type === "producer"))

export const precomputedFieldStats = {
  totalCumOil: _allProducers.reduce((s, w) => s + (w.series[w.series.length - 1]?.cumOil ?? 0), 0),
  finalWaterCut: precomputedFieldSeries[precomputedFieldSeries.length - 1]?.waterCut ?? 0,
  producerCount: _allProducers.length,
  padCount: fieldData.pads.length,
} as const

export const precomputedPadStats: Record<string, {
  totalCumOil: number
  finalWaterCut: number
  producerCount: number
  activeCount: number
  firstYear: number
}> = Object.fromEntries(
  fieldData.pads.map((pad) => {
    const producers = pad.wells.filter((w) => w.type === "producer")
    const series = precomputedPadSeries[pad.id]
    return [pad.id, {
      totalCumOil: producers.reduce((s, w) => s + (w.series[w.series.length - 1]?.cumOil ?? 0), 0),
      finalWaterCut: series[series.length - 1]?.waterCut ?? 0,
      producerCount: producers.length,
      activeCount: producers.filter((w) => w.status === "active").length,
      firstYear: Math.min(...producers.map((w) => w.startYear)),
    }]
  })
)

// Цвета скважин и кустов для графика
export const SERIES_COLORS = [
  "#e8a045", // amber
  "#5b9cf6", // blue
  "#4ade80", // green
  "#f87171", // red
  "#a78bfa", // violet
  "#34d399", // emerald
  "#fb923c", // orange
  "#60a5fa", // sky
  "#f472b6", // pink
  "#facc15", // yellow
]
