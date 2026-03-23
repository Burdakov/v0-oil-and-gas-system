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

// ── Helpers ──────────────────────────────────────────────────────────────────
function rand(min: number, max: number, decimals = 1) {
  return parseFloat((Math.random() * (max - min) + min).toFixed(decimals))
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
