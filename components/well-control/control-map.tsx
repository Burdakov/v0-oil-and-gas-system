"use client"

import { useMemo, useState } from "react"
import { fieldData, getAllClusters } from "@/lib/idn-data"
import type { Cluster, Well } from "@/lib/idn-data"
import { clusterDeclinePies } from "@/lib/well-control-data"

// ── Colors (no CSS vars — direct hex for SVG) ─────────────────────────────────
const C = {
  bg: "#0a1a28",
  zone1: "#0d2535",
  zone2: "#0d2d3f",
  zone3: "#0a2030",
  contour: "#1e3a4a",
  producer: "#f59e0b",
  injector: "#38bdf8",
  repair: "#6b7280",
  inactive: "#374151",
  clusterLine: "#334155",
  // Decline pie sectors
  kprod: "#f97316",   // orange — productivity
  rpl: "#60a5fa",     // blue — reservoir pressure
  obv: "#f43f5e",     // rose — water cut
  label: "#94a3b8",
  labelBright: "#e2e8f0",
  highlight: "#f59e0b",
  areaBorder: "#1e3a4a",
}

function ThicknessBackground() {
  const zones = [
    { points: "100,80 350,60 420,180 280,220 120,180", fill: C.zone1 },
    { points: "280,220 420,180 550,160 600,280 480,300 320,270", fill: C.zone2 },
    { points: "120,180 280,220 320,270 200,320 100,280", fill: C.zone3 },
    { points: "480,300 600,280 700,340 680,430 520,400", fill: C.zone1 },
    { points: "200,320 320,270 480,300 520,400 380,440 200,420", fill: C.zone2 },
    { points: "100,280 200,320 200,420 120,450 80,380", fill: C.zone3 },
    { points: "350,60 530,50 620,100 550,160 420,180", fill: C.zone3 },
    { points: "620,100 720,80 760,160 700,220 600,180 550,160", fill: C.zone1 },
  ]
  const contours = [
    "M 80,200 C 200,170 350,160 500,190 C 620,210 720,240 790,270",
    "M 80,320 C 200,290 370,280 530,300 C 650,315 740,345 800,370",
    "M 140,100 C 260,85 420,80 570,95 C 680,107 760,130 800,155",
    "M 300,50 C 320,80 330,130 310,200 C 290,280 270,360 260,440",
    "M 500,50 C 510,90 505,150 490,230 C 475,310 460,390 455,460",
    "M 680,60 C 685,110 678,180 665,260 C 650,340 635,420 630,490",
  ]
  return (
    <g>
      {zones.map((z, i) => <polygon key={i} points={z.points} fill={z.fill} opacity={0.9} />)}
      {contours.map((d, i) => <path key={i} d={d} stroke={C.contour} strokeWidth={0.7} fill="none" opacity={0.5} />)}
    </g>
  )
}

// Sector pie showing Кпрод / Рпл / Обв decline proportions
function DeclinePie({
  cx, cy, kprod, rpl, obv, r = 20, selected, onClick,
}: {
  cx: number; cy: number
  kprod: number; rpl: number; obv: number
  r?: number; selected?: boolean; onClick?: () => void
}) {
  const total = kprod + rpl + obv
  if (total === 0) return null

  function sector(startDeg: number, value: number, color: string) {
    const angle = (value / total) * 360
    const end = startDeg + angle
    const toRad = (a: number) => ((a - 90) * Math.PI) / 180
    const x1 = cx + r * Math.cos(toRad(startDeg))
    const y1 = cy + r * Math.sin(toRad(startDeg))
    const x2 = cx + r * Math.cos(toRad(end))
    const y2 = cy + r * Math.sin(toRad(end))
    return (
      <path
        d={`M ${cx} ${cy} L ${x1} ${y1} A ${r} ${r} 0 ${angle > 180 ? 1 : 0} 1 ${x2} ${y2} Z`}
        fill={color}
        opacity={0.88}
        stroke={C.bg}
        strokeWidth={0.6}
      />
    )
  }

  const s1 = 0
  const s2 = s1 + (kprod / total) * 360
  const s3 = s2 + (rpl / total) * 360

  return (
    <g onClick={onClick} style={{ cursor: "pointer" }}>
      {selected && <circle cx={cx} cy={cy} r={r + 5} fill="none" stroke={C.highlight} strokeWidth={1.5} opacity={0.7} />}
      {sector(s1, kprod, C.kprod)}
      {sector(s2, rpl, C.rpl)}
      {sector(s3, obv, C.obv)}
      <circle cx={cx} cy={cy} r={2.5} fill={C.bg} opacity={0.9} />
    </g>
  )
}

function WellLine({ well, selectedId, onClick }: { well: Well; selectedId: string | null; onClick: () => void }) {
  const sel = selectedId === well.id
  const color =
    well.status === "inactive" ? C.inactive
    : well.status === "repair" ? C.repair
    : well.type === "injector" ? C.injector
    : C.producer
  return (
    <g onClick={onClick} style={{ cursor: "pointer" }}>
      <line
        x1={well.heelX} y1={well.heelY} x2={well.toeX} y2={well.toeY}
        stroke={sel ? C.highlight : color}
        strokeWidth={sel ? 3.5 : 2.5}
        strokeLinecap="round"
        opacity={well.status === "inactive" ? 0.35 : 0.85}
      />
      <circle cx={well.toeX} cy={well.toeY} r={sel ? 4 : 2.5} fill={sel ? C.highlight : color} opacity={0.9} />
      <text x={well.toeX + 4} y={well.toeY - 3} fontSize={7.5} fill={C.label} fontFamily="monospace" opacity={0.75}>
        {well.name}
      </text>
    </g>
  )
}

export function WellControlMap({
  selectedWellId,
  onWellSelect,
  onClusterSelect,
}: {
  selectedWellId: string | null
  onWellSelect: (id: string | null) => void
  onClusterSelect: (id: string | null) => void
}) {
  const [selectedClusterId, setSelectedClusterId] = useState<string | null>(null)
  const clusters = useMemo(() => getAllClusters(fieldData), [])
  const pieMap = useMemo(
    () => Object.fromEntries(clusterDeclinePies.map((p) => [p.clusterId, p])),
    [],
  )

  function handleCluster(id: string) {
    const next = selectedClusterId === id ? null : id
    setSelectedClusterId(next)
    onClusterSelect(next)
  }

  function handleWell(wellId: string, cluster: Cluster) {
    const next = selectedWellId === wellId ? null : wellId
    onWellSelect(next)
    if (next) {
      setSelectedClusterId(cluster.id)
      onClusterSelect(cluster.id)
    }
  }

  return (
    <div className="relative w-full h-full">
      <svg viewBox="0 0 800 580" className="w-full h-full" style={{ background: C.bg }}>
        <ThicknessBackground />

        {/* License area separators & labels */}
        <line x1={255} y1={20} x2={255} y2={560} stroke={C.areaBorder} strokeWidth={1} strokeDasharray="4 3" opacity={0.5} />
        <line x1={475} y1={20} x2={475} y2={560} stroke={C.areaBorder} strokeWidth={1} strokeDasharray="4 3" opacity={0.5} />
        {[["УЧАСТОК-1", 127], ["УЧАСТОК-2", 365], ["УЧАСТОК-3", 637]].map(([name, x]) => (
          <text key={String(x)} x={Number(x)} y={14} textAnchor="middle" fontSize={8} fill="#334155" fontFamily="sans-serif" fontWeight="700">
            {String(name)}
          </text>
        ))}

        {clusters.map((cl) => {
          const pie = pieMap[cl.id]
          return (
            <g key={cl.id}>
              {/* Cluster center to heel lines */}
              {cl.wells.map((w) => (
                <line key={`cl-${w.id}`}
                  x1={cl.centerX} y1={cl.centerY} x2={w.heelX} y2={w.heelY}
                  stroke={C.clusterLine} strokeWidth={0.7} strokeDasharray="3 2" opacity={0.45}
                />
              ))}
              {/* Well trajectories */}
              {cl.wells.map((w) => (
                <WellLine key={w.id} well={w} selectedId={selectedWellId} onClick={() => handleWell(w.id, cl)} />
              ))}
              {/* Cluster center */}
              <circle cx={cl.centerX} cy={cl.centerY} r={3}
                fill={selectedClusterId === cl.id ? C.highlight : "#475569"}
                stroke={C.bg} strokeWidth={1}
              />
              {/* Decline pie */}
              {pie && (
                <DeclinePie
                  cx={cl.centerX} cy={cl.centerY - 38}
                  kprod={pie.kprod} rpl={pie.rpl} obv={pie.obv}
                  r={20}
                  selected={selectedClusterId === cl.id}
                  onClick={() => handleCluster(cl.id)}
                />
              )}
              <text x={cl.centerX} y={cl.centerY + 14}
                textAnchor="middle" fontSize={8} fill={C.label} fontFamily="sans-serif" fontWeight="600">
                {cl.name}
              </text>
            </g>
          )
        })}

        {/* Legend */}
        <g>
          <rect x={6} y={448} width={126} height={90} rx={3} fill="#0d1f30" opacity={0.88} />
          <text x={10} y={461} fontSize={7.5} fill={C.labelBright} fontWeight="700" fontFamily="sans-serif">Снижение (пирог)</text>
          {[
            { color: C.kprod, label: "Кпрод — продуктивность" },
            { color: C.rpl,   label: "Рпл — пластовое давл." },
            { color: C.obv,   label: "Обв — обводнённость" },
          ].map((item, i) => (
            <g key={item.label} transform={`translate(10, ${472 + i * 13})`}>
              <rect width={9} height={5} y={-4} rx={1} fill={item.color} opacity={0.9} />
              <text x={13} y={0} fontSize={7} fill={C.label} fontFamily="sans-serif">{item.label}</text>
            </g>
          ))}
          {[
            { color: C.producer, label: "Добывающая" },
            { color: C.injector, label: "Нагнетательная" },
          ].map((item, i) => (
            <g key={item.label} transform={`translate(10, ${512 + i * 13})`}>
              <line x1={0} y1={-2} x2={9} y2={-2} stroke={item.color} strokeWidth={2.5} />
              <text x={13} y={0} fontSize={7} fill={C.label} fontFamily="sans-serif">{item.label}</text>
            </g>
          ))}
        </g>

        {/* Title */}
        <text x={400} y={14} textAnchor="middle" fontSize={8.5} fill={C.label}
          fontFamily="sans-serif" fontWeight="700" letterSpacing="0.8">
          КАРТА КОНТРОЛЯ ФОНДА — СНИЖЕНИЯ ПО ФАКТОРАМ
        </text>
      </svg>
    </div>
  )
}
