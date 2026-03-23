"use client"

import { useState, useMemo } from "react"
import { fieldData, getAllClusters, clusterPieData } from "@/lib/idn-data"
import type { Cluster, Well } from "@/lib/idn-data"

// ── Color constants (no CSS vars — computed for SVG) ─────────────────────────
const COLOR = {
  // Background thickness map gradient stops
  thickHigh: "#1a3a28",
  thickMid: "#0f2a38",
  thickLow: "#0d1f30",
  // Structural contours
  contour: "#1e3a4a",
  // Well trajectories
  producer: "#f59e0b",    // amber
  injector: "#38bdf8",    // sky
  repair: "#6b7280",      // gray
  inactive: "#374151",
  // Cluster center lines
  clusterLine: "#334155",
  // Pie sectors
  pieOil: "#f59e0b",
  pieWater: "#60a5fa",
  pieInjection: "#34d399",
  // Labels
  labelDark: "#94a3b8",
  labelLight: "#e2e8f0",
  // Highlight
  highlight: "#f59e0b",
  // Isobar (thickness map contour lines)
  isobar: "#1e4060",
}

// ── Thickness map background (SVG mesh simulating color-coded thickness) ──────
function ThicknessBackground() {
  // Simulated thickness zones as polygons
  const zones = [
    { points: "100,80 350,60 420,180 280,220 120,180", fill: "#0d2535" },
    { points: "280,220 420,180 550,160 600,280 480,300 320,270", fill: "#0d2d3f" },
    { points: "120,180 280,220 320,270 200,320 100,280", fill: "#0a2030" },
    { points: "480,300 600,280 700,340 680,430 520,400", fill: "#0d2535" },
    { points: "200,320 320,270 480,300 520,400 380,440 200,420", fill: "#102535" },
    { points: "100,280 200,320 200,420 120,450 80,380", fill: "#0a1e2a" },
    { points: "520,400 680,430 720,520 560,540 440,480", fill: "#0a2030" },
    { points: "200,420 380,440 440,480 360,550 180,530 150,470", fill: "#0d2535" },
    { points: "350,60 530,50 620,100 550,160 420,180", fill: "#102030" },
    { points: "620,100 720,80 760,160 700,220 600,180 550,160", fill: "#0d2030" },
    { points: "700,220 760,160 800,220 800,340 700,340 600,280 550,160 620,100 720,80", fill: "#112535" },
  ]

  // Structural contour lines
  const contours = [
    "M 80,200 C 200,170 350,160 500,190 C 620,210 720,240 790,270",
    "M 80,320 C 200,290 370,280 530,300 C 650,315 740,345 800,370",
    "M 80,430 C 180,410 320,400 480,415 C 600,427 700,450 800,470",
    "M 140,100 C 260,85 420,80 570,95 C 680,107 760,130 800,155",
    "M 100,500 C 230,485 400,480 560,492 C 680,502 760,520 800,540",
    "M 300,50 C 320,80 330,130 310,200 C 290,280 270,360 260,440 C 250,510 255,560 270,590",
    "M 500,50 C 510,90 505,150 490,230 C 475,310 460,390 455,460 C 450,520 455,560 465,590",
    "M 680,60 C 685,110 678,180 665,260 C 650,340 635,420 630,490 C 627,540 630,570 638,595",
  ]

  return (
    <g>
      {/* Thickness zones */}
      {zones.map((z, i) => (
        <polygon key={i} points={z.points} fill={z.fill} opacity={0.9} />
      ))}
      {/* Structural contours */}
      {contours.map((d, i) => (
        <path key={i} d={d} stroke={COLOR.contour} strokeWidth={0.8} fill="none" opacity={0.6} />
      ))}
      {/* Thickness legend hint */}
      <defs>
        <linearGradient id="thicknessLegend" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor="#1a4a2a" />
          <stop offset="50%" stopColor="#0f3048" />
          <stop offset="100%" stopColor="#0a1e2a" />
        </linearGradient>
      </defs>
    </g>
  )
}

// ── Pie chart for cluster ─────────────────────────────────────────────────────
function ClusterPie({
  cx,
  cy,
  oil,
  water,
  injection,
  r = 22,
  selected,
  onClick,
}: {
  cx: number
  cy: number
  oil: number
  water: number
  injection: number
  r?: number
  selected?: boolean
  onClick?: () => void
}) {
  const total = oil + water + injection
  if (total === 0) return null

  function slice(startAngle: number, value: number, color: string) {
    const angle = (value / total) * 360
    const endAngle = startAngle + angle
    const toRad = (a: number) => ((a - 90) * Math.PI) / 180
    const x1 = cx + r * Math.cos(toRad(startAngle))
    const y1 = cy + r * Math.sin(toRad(startAngle))
    const x2 = cx + r * Math.cos(toRad(endAngle))
    const y2 = cy + r * Math.sin(toRad(endAngle))
    const largeArc = angle > 180 ? 1 : 0
    return (
      <path
        d={`M ${cx} ${cy} L ${x1} ${y1} A ${r} ${r} 0 ${largeArc} 1 ${x2} ${y2} Z`}
        fill={color}
        opacity={0.9}
        stroke="#0d1f30"
        strokeWidth={0.5}
      />
    )
  }

  const s1 = 0
  const s2 = s1 + (oil / total) * 360
  const s3 = s2 + (water / total) * 360

  return (
    <g
      onClick={onClick}
      style={{ cursor: "pointer" }}
    >
      {/* Background ring for selected state */}
      {selected && (
        <circle cx={cx} cy={cy} r={r + 4} fill="none" stroke={COLOR.highlight} strokeWidth={1.5} opacity={0.7} />
      )}
      {slice(s1, oil, COLOR.pieOil)}
      {slice(s2, water, COLOR.pieWater)}
      {slice(s3, injection, COLOR.pieInjection)}
      {/* Center dot */}
      <circle cx={cx} cy={cy} r={2.5} fill="#0d1f30" opacity={0.8} />
    </g>
  )
}

// ── Well trajectory line ──────────────────────────────────────────────────────
function WellLine({ well, selected, onClick }: { well: Well; selected: boolean; onClick: () => void }) {
  const color =
    well.status === "inactive" ? COLOR.inactive
    : well.status === "repair" ? COLOR.repair
    : well.type === "injector" ? COLOR.injector
    : COLOR.producer

  return (
    <g onClick={onClick} style={{ cursor: "pointer" }}>
      <line
        x1={well.heelX}
        y1={well.heelY}
        x2={well.toeX}
        y2={well.toeY}
        stroke={selected ? COLOR.highlight : color}
        strokeWidth={selected ? 3.5 : 2.5}
        strokeLinecap="round"
        opacity={well.status === "inactive" ? 0.4 : 0.9}
      />
      {/* Toe marker */}
      <circle
        cx={well.toeX}
        cy={well.toeY}
        r={selected ? 4 : 2.5}
        fill={selected ? COLOR.highlight : color}
        opacity={0.9}
      />
      {/* Well name label near toe */}
      <text
        x={well.toeX + 4}
        y={well.toeY - 3}
        fontSize={8}
        fill={COLOR.labelDark}
        fontFamily="monospace"
        opacity={0.8}
      >
        {well.name}
      </text>
    </g>
  )
}

// ── Cluster component ─────────────────────────────────────────────────────────
function ClusterGroup({
  cluster,
  selectedClusterId,
  selectedWellId,
  onClusterClick,
  onWellClick,
}: {
  cluster: Cluster & { licenseAreaName: string }
  selectedClusterId: string | null
  selectedWellId: string | null
  onClusterClick: (id: string) => void
  onWellClick: (id: string) => void
}) {
  const pie = clusterPieData(cluster)
  const isClusterSelected = selectedClusterId === cluster.id

  return (
    <g>
      {/* Lines from cluster center to each well heel */}
      {cluster.wells.map((w) => (
        <line
          key={`line-${w.id}`}
          x1={cluster.centerX}
          y1={cluster.centerY}
          x2={w.heelX}
          y2={w.heelY}
          stroke={COLOR.clusterLine}
          strokeWidth={0.8}
          strokeDasharray="3 2"
          opacity={0.5}
        />
      ))}
      {/* Well trajectories */}
      {cluster.wells.map((w) => (
        <WellLine
          key={w.id}
          well={w}
          selected={selectedWellId === w.id}
          onClick={() => onWellClick(w.id)}
        />
      ))}
      {/* Cluster center point */}
      <circle
        cx={cluster.centerX}
        cy={cluster.centerY}
        r={3}
        fill={isClusterSelected ? COLOR.highlight : "#475569"}
        stroke="#0d1f30"
        strokeWidth={1}
      />
      {/* Pie chart offset from center */}
      <ClusterPie
        cx={cluster.centerX}
        cy={cluster.centerY - 38}
        oil={pie.oil}
        water={pie.water}
        injection={pie.injection}
        r={20}
        selected={isClusterSelected}
        onClick={() => onClusterClick(cluster.id)}
      />
      {/* Cluster name */}
      <text
        x={cluster.centerX}
        y={cluster.centerY + 14}
        textAnchor="middle"
        fontSize={8.5}
        fill={COLOR.labelDark}
        fontFamily="sans-serif"
        fontWeight="600"
      >
        {cluster.name}
      </text>
    </g>
  )
}

// ── Legend ────────────────────────────────────────────────────────────────────
function MapLegend({ x, y }: { x: number; y: number }) {
  const items = [
    { color: COLOR.producer, label: "Доб. (нефть)" },
    { color: COLOR.injector, label: "Нагн." },
    { color: COLOR.repair, label: "Ремонт" },
    { color: COLOR.inactive, label: "Неакт." },
    { color: COLOR.pieOil, label: "Нефть (пирог)" },
    { color: COLOR.pieWater, label: "Вода (пирог)" },
    { color: COLOR.pieInjection, label: "Закачка (пирог)" },
  ]
  return (
    <g>
      <rect x={x - 4} y={y - 4} width={130} height={items.length * 14 + 10} rx={3} fill="#0d1f30" opacity={0.85} />
      <text x={x + 4} y={y + 8} fontSize={8} fill={COLOR.labelLight} fontWeight="700" fontFamily="sans-serif">
        Легенда
      </text>
      {items.map((item, i) => (
        <g key={item.label} transform={`translate(${x + 4}, ${y + 16 + i * 13})`}>
          <rect width={10} height={5} y={-4} rx={1} fill={item.color} opacity={0.9} />
          <text x={14} y={0} fontSize={7.5} fill={COLOR.labelDark} fontFamily="sans-serif">
            {item.label}
          </text>
        </g>
      ))}
    </g>
  )
}

// ── Main component ────────────────────────────────────────────────────────────
export function DevelopmentMap({
  onWellSelect,
  onClusterSelect,
}: {
  onWellSelect: (wellId: string | null) => void
  onClusterSelect: (clusterId: string | null) => void
}) {
  const [selectedClusterId, setSelectedClusterId] = useState<string | null>(null)
  const [selectedWellId, setSelectedWellId] = useState<string | null>(null)
  const clusters = useMemo(() => getAllClusters(fieldData), [])

  function handleClusterClick(id: string) {
    const next = selectedClusterId === id ? null : id
    setSelectedClusterId(next)
    setSelectedWellId(null)
    onClusterSelect(next)
    onWellSelect(null)
  }

  function handleWellClick(id: string) {
    const next = selectedWellId === id ? null : id
    setSelectedWellId(next)
    onWellSelect(next)
    if (next) {
      // find parent cluster
      const cl = clusters.find((c) => c.wells.some((w) => w.id === next))
      if (cl) {
        setSelectedClusterId(cl.id)
        onClusterSelect(cl.id)
      }
    }
  }

  return (
    <div className="relative w-full h-full min-h-[420px]">
      <svg
        viewBox="0 0 800 580"
        className="w-full h-full"
        style={{ background: "#0a1a28" }}
      >
        {/* Background */}
        <ThicknessBackground />

        {/* License area boundary labels */}
        <text x={110} y={34} fontSize={9} fill="#334155" fontFamily="sans-serif" fontWeight="700" textAnchor="middle">
          УЧАСТОК-1
        </text>
        <text x={380} y={34} fontSize={9} fill="#334155" fontFamily="sans-serif" fontWeight="700" textAnchor="middle">
          УЧАСТОК-2
        </text>
        <text x={620} y={34} fontSize={9} fill="#334155" fontFamily="sans-serif" fontWeight="700" textAnchor="middle">
          УЧАСТОК-3
        </text>

        {/* Separator lines between license areas */}
        <line x1={255} y1={20} x2={255} y2={560} stroke="#1e3a4a" strokeWidth={1} strokeDasharray="4 3" opacity={0.5} />
        <line x1={475} y1={20} x2={475} y2={560} stroke="#1e3a4a" strokeWidth={1} strokeDasharray="4 3" opacity={0.5} />

        {/* Clusters */}
        {clusters.map((cl) => (
          <ClusterGroup
            key={cl.id}
            cluster={cl}
            selectedClusterId={selectedClusterId}
            selectedWellId={selectedWellId}
            onClusterClick={handleClusterClick}
            onWellClick={handleWellClick}
          />
        ))}

        {/* Legend */}
        <MapLegend x={10} y={460} />

        {/* Scale */}
        <g transform="translate(670, 555)">
          <line x1={0} y1={0} x2={80} y2={0} stroke={COLOR.labelDark} strokeWidth={1} />
          <line x1={0} y1={-4} x2={0} y2={4} stroke={COLOR.labelDark} strokeWidth={1} />
          <line x1={80} y1={-4} x2={80} y2={4} stroke={COLOR.labelDark} strokeWidth={1} />
          <text x={40} y={-6} textAnchor="middle" fontSize={7} fill={COLOR.labelDark} fontFamily="sans-serif">
            500 м
          </text>
        </g>

        {/* Map title */}
        <text x={400} y={14} textAnchor="middle" fontSize={9} fill={COLOR.labelDark} fontFamily="sans-serif" fontWeight="700" letterSpacing="1">
          КАРТА РАЗРАБОТКИ — РОМАШКИНСКОЕ М-Е
        </text>
      </svg>
    </div>
  )
}
