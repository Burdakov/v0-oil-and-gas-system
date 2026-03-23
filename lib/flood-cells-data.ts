// Test data for Ячейки заводнения
// Hierarchy: Field → License Area → Cluster → Cell

export type FloodCell = {
  id: string
  name: string
  clusterId: string
  clusterName: string
  licenseAreaId: string
  licenseAreaName: string

  // Map polygon (SVG space 0-740 x 0-520)
  polygon: [number, number][]
  // Injector well center (in polygon)
  injectorX: number
  injectorY: number

  // Metrics
  oilProduction: number       // Добыча нефти, тыс.т/мес
  liquidProduction: number    // Добыча жидкости, тыс.т/мес
  waterCut: number            // Обводнённость, %
  kprod: number               // Суммарный Кпрод
  reservoirPressure: number   // Рпл текущее, атм
  compensation: number        // Компенсация, %
  porePV: number              // Прокачанный поровый объём, д.е.
  liquidPotential: number     // Потенциал добычи жидкости на целевое Рпл, тыс.т/мес
  injectionPotential: number  // Текущий потенциал закачки, тыс.м3/мес

  // Chart series: ВНФ от КИН
  wnfKin: { kin: number; wnf: number }[]
  // Chart series: Обводнённость от прокачанных ПО
  wcPv: { pv: number; wc: number }[]
}

function rand(min: number, max: number, dec = 2) {
  return parseFloat((Math.random() * (max - min) + min).toFixed(dec))
}

function genWnfSeries(baseWnf: number): { kin: number; wnf: number }[] {
  return Array.from({ length: 15 }, (_, i) => {
    const kin = parseFloat((0.02 + i * 0.025).toFixed(3))
    const wnf = parseFloat(Math.max(0, baseWnf * (1 + i * 0.12) * (1 + (Math.random() - 0.5) * 0.15)).toFixed(2))
    return { kin, wnf }
  })
}

function genWcPvSeries(baseWc: number): { pv: number; wc: number }[] {
  return Array.from({ length: 18 }, (_, i) => {
    const pv = parseFloat((0.05 + i * 0.07).toFixed(2))
    const wc = parseFloat(Math.min(98, baseWc * (0.3 + i * 0.055) * (1 + (Math.random() - 0.5) * 0.1)).toFixed(1))
    return { pv, wc }
  })
}

// ── Cell definitions ──────────────────────────────────────────────────────────
// Cells are Voronoi-like polygons centered on injector wells
const rawCells: Omit<FloodCell, "wnfKin" | "wcPv">[] = [
  // ── Участок-1, Куст 101 ──
  {
    id: "cell-101-A",
    name: "Ячейка 101-А",
    clusterId: "cl-101", clusterName: "Куст 101",
    licenseAreaId: "la-1", licenseAreaName: "Участок-1",
    polygon: [[40, 30], [140, 20], [200, 80], [170, 160], [80, 170], [30, 110]],
    injectorX: 105, injectorY: 95,
    oilProduction: rand(12, 45),
    liquidProduction: rand(60, 180),
    waterCut: rand(55, 82),
    kprod: rand(0.8, 2.2),
    reservoirPressure: rand(105, 145),
    compensation: rand(58, 115),
    porePV: rand(0.3, 1.1),
    liquidPotential: rand(80, 220),
    injectionPotential: rand(60, 180),
  },
  {
    id: "cell-101-B",
    name: "Ячейка 101-Б",
    clusterId: "cl-101", clusterName: "Куст 101",
    licenseAreaId: "la-1", licenseAreaName: "Участок-1",
    polygon: [[140, 20], [260, 15], [290, 90], [230, 150], [170, 160], [200, 80]],
    injectorX: 215, injectorY: 88,
    oilProduction: rand(8, 35),
    liquidProduction: rand(40, 140),
    waterCut: rand(62, 90),
    kprod: rand(0.5, 1.8),
    reservoirPressure: rand(95, 135),
    compensation: rand(42, 96),
    porePV: rand(0.5, 1.4),
    liquidPotential: rand(60, 170),
    injectionPotential: rand(45, 145),
  },
  // ── Участок-1, Куст 102 ──
  {
    id: "cell-102-A",
    name: "Ячейка 102-А",
    clusterId: "cl-102", clusterName: "Куст 102",
    licenseAreaId: "la-1", licenseAreaName: "Участок-1",
    polygon: [[260, 15], [380, 10], [400, 95], [340, 150], [270, 140], [290, 90]],
    injectorX: 335, injectorY: 80,
    oilProduction: rand(18, 55),
    liquidProduction: rand(90, 220),
    waterCut: rand(48, 75),
    kprod: rand(1.0, 2.8),
    reservoirPressure: rand(118, 155),
    compensation: rand(80, 130),
    porePV: rand(0.2, 0.8),
    liquidPotential: rand(110, 270),
    injectionPotential: rand(90, 220),
  },
  {
    id: "cell-102-B",
    name: "Ячейка 102-Б",
    clusterId: "cl-102", clusterName: "Куст 102",
    licenseAreaId: "la-1", licenseAreaName: "Участок-1",
    polygon: [[380, 10], [490, 20], [510, 100], [440, 155], [380, 145], [400, 95]],
    injectorX: 435, injectorY: 88,
    oilProduction: rand(5, 28),
    liquidProduction: rand(30, 110),
    waterCut: rand(72, 93),
    kprod: rand(0.4, 1.5),
    reservoirPressure: rand(88, 125),
    compensation: rand(30, 72),
    porePV: rand(0.8, 1.8),
    liquidPotential: rand(45, 140),
    injectionPotential: rand(35, 115),
  },
  // ── Участок-2, Куст 201 ──
  {
    id: "cell-201-A",
    name: "Ячейка 201-А",
    clusterId: "cl-201", clusterName: "Куст 201",
    licenseAreaId: "la-2", licenseAreaName: "Участок-2",
    polygon: [[30, 180], [140, 170], [160, 260], [100, 320], [25, 300], [20, 230]],
    injectorX: 88, injectorY: 248,
    oilProduction: rand(15, 50),
    liquidProduction: rand(80, 200),
    waterCut: rand(52, 80),
    kprod: rand(0.9, 2.4),
    reservoirPressure: rand(110, 150),
    compensation: rand(70, 118),
    porePV: rand(0.3, 0.9),
    liquidPotential: rand(100, 250),
    injectionPotential: rand(80, 200),
  },
  {
    id: "cell-201-B",
    name: "Ячейка 201-Б",
    clusterId: "cl-201", clusterName: "Куст 201",
    licenseAreaId: "la-2", licenseAreaName: "Участок-2",
    polygon: [[140, 170], [260, 165], [280, 250], [210, 310], [160, 300], [160, 260]],
    injectorX: 205, injectorY: 238,
    oilProduction: rand(10, 40),
    liquidProduction: rand(55, 160),
    waterCut: rand(65, 88),
    kprod: rand(0.6, 1.9),
    reservoirPressure: rand(100, 138),
    compensation: rand(50, 92),
    porePV: rand(0.6, 1.5),
    liquidPotential: rand(70, 195),
    injectionPotential: rand(55, 160),
  },
  // ── Участок-2, Куст 202 ──
  {
    id: "cell-202-A",
    name: "Ячейка 202-А",
    clusterId: "cl-202", clusterName: "Куст 202",
    licenseAreaId: "la-2", licenseAreaName: "Участок-2",
    polygon: [[260, 165], [380, 160], [400, 250], [330, 310], [265, 295], [280, 250]],
    injectorX: 330, injectorY: 238,
    oilProduction: rand(20, 60),
    liquidProduction: rand(100, 250),
    waterCut: rand(44, 72),
    kprod: rand(1.1, 3.0),
    reservoirPressure: rand(122, 162),
    compensation: rand(85, 135),
    porePV: rand(0.2, 0.7),
    liquidPotential: rand(120, 300),
    injectionPotential: rand(100, 245),
  },
  {
    id: "cell-202-B",
    name: "Ячейка 202-Б",
    clusterId: "cl-202", clusterName: "Куст 202",
    licenseAreaId: "la-2", licenseAreaName: "Участок-2",
    polygon: [[380, 160], [490, 165], [505, 255], [435, 310], [375, 298], [400, 250]],
    injectorX: 435, injectorY: 242,
    oilProduction: rand(8, 32),
    liquidProduction: rand(45, 130),
    waterCut: rand(70, 91),
    kprod: rand(0.5, 1.6),
    reservoirPressure: rand(92, 130),
    compensation: rand(38, 78),
    porePV: rand(0.9, 2.0),
    liquidPotential: rand(55, 160),
    injectionPotential: rand(42, 130),
  },
  // ── Участок-2, Куст 203 ──
  {
    id: "cell-203-A",
    name: "Ячейка 203-А",
    clusterId: "cl-203", clusterName: "Куст 203",
    licenseAreaId: "la-2", licenseAreaName: "Участок-2",
    polygon: [[490, 165], [600, 170], [615, 255], [545, 308], [490, 295], [505, 255]],
    injectorX: 548, injectorY: 238,
    oilProduction: rand(16, 48),
    liquidProduction: rand(85, 195),
    waterCut: rand(50, 76),
    kprod: rand(1.0, 2.5),
    reservoirPressure: rand(112, 152),
    compensation: rand(72, 120),
    porePV: rand(0.3, 1.0),
    liquidPotential: rand(105, 240),
    injectionPotential: rand(85, 195),
  },
  // ── Участок-3, Куст 301 ──
  {
    id: "cell-301-A",
    name: "Ячейка 301-А",
    clusterId: "cl-301", clusterName: "Куст 301",
    licenseAreaId: "la-3", licenseAreaName: "Участок-3",
    polygon: [[490, 20], [610, 15], [630, 100], [565, 155], [505, 148], [510, 100]],
    injectorX: 560, injectorY: 88,
    oilProduction: rand(14, 44),
    liquidProduction: rand(70, 175),
    waterCut: rand(54, 80),
    kprod: rand(0.85, 2.3),
    reservoirPressure: rand(108, 148),
    compensation: rand(65, 112),
    porePV: rand(0.3, 1.0),
    liquidPotential: rand(88, 215),
    injectionPotential: rand(70, 175),
  },
  // ── Участок-3, Куст 302 ──
  {
    id: "cell-302-A",
    name: "Ячейка 302-А",
    clusterId: "cl-302", clusterName: "Куст 302",
    licenseAreaId: "la-3", licenseAreaName: "Участок-3",
    polygon: [[610, 15], [730, 18], [740, 110], [670, 165], [615, 158], [630, 100]],
    injectorX: 675, injectorY: 95,
    oilProduction: rand(22, 62),
    liquidProduction: rand(110, 255),
    waterCut: rand(42, 70),
    kprod: rand(1.2, 3.1),
    reservoirPressure: rand(125, 168),
    compensation: rand(90, 140),
    porePV: rand(0.15, 0.65),
    liquidPotential: rand(135, 315),
    injectionPotential: rand(110, 255),
  },
  {
    id: "cell-302-B",
    name: "Ячейка 302-Б",
    clusterId: "cl-302", clusterName: "Куст 302",
    licenseAreaId: "la-3", licenseAreaName: "Участок-3",
    polygon: [[615, 158], [670, 165], [680, 260], [615, 310], [558, 295], [565, 200]],
    injectorX: 622, injectorY: 235,
    oilProduction: rand(6, 26),
    liquidProduction: rand(35, 105),
    waterCut: rand(74, 95),
    kprod: rand(0.3, 1.4),
    reservoirPressure: rand(85, 122),
    compensation: rand(28, 65),
    porePV: rand(1.0, 2.2),
    liquidPotential: rand(42, 128),
    injectionPotential: rand(32, 105),
  },
]

export const floodCells: FloodCell[] = rawCells.map((c) => ({
  ...c,
  wnfKin: genWnfSeries(c.waterCut / 100 * rand(0.8, 1.5)),
  wcPv: genWcPvSeries(c.waterCut),
}))

// Compensation → color mapping
export function compensationColor(comp: number): string {
  if (comp >= 110) return "#1e40af"   // over-compensated — deep blue
  if (comp >= 90)  return "#22c55e"   // well-compensated — green
  if (comp >= 70)  return "#f59e0b"   // moderate — amber
  if (comp >= 50)  return "#f97316"   // under-compensated — orange
  return "#ef4444"                     // low — red
}

export function compensationLabel(comp: number): string {
  if (comp >= 110) return "Перекомп."
  if (comp >= 90)  return "Норма"
  if (comp >= 70)  return "Умерен."
  if (comp >= 50)  return "Недокомп."
  return "Низкая"
}
