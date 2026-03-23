"use client"

import { floodCells, compensationColor } from "@/lib/flood-cells-data"
import type { FloodCell } from "@/lib/flood-cells-data"

const LABEL = "#94a3b8"
const LABEL_LIGHT = "#e2e8f0"
const CONTOUR = "#1a3a5c"
const INJ_COLOR = "#38bdf8"

// ── Isobar background ────────────────────────────────────────────────────────
function IsobarBackground() {
  const isobars = [
    { d: "M 0,80 C 180,60 360,55 560,70 C 660,78 720,90 750,98", p: 145 },
    { d: "M 0,160 C 180,140 370,132 570,148 C 660,156 720,168 750,177", p: 135 },
    { d: "M 0,240 C 190,218 385,210 575,228 C 662,236 722,248 750,258", p: 125 },
    { d: "M 0,320 C 192,296 390,288 578,308 C 662,317 722,329 750,340", p: 115 },
    { d: "M 0,400 C 195,374 395,366 580,387 C 663,397 723,409 750,420", p: 105 },
    { d: "M 0,480 C 200,452 400,444 582,466 C 664,477 724,490 750,500", p: 95 },
  ]
  return (
    <g>
      {/* Pressure gradient fill */}
      <defs>
        <linearGradient id="pressureGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#0d2a40" stopOpacity="1" />
          <stop offset="50%" stopColor="#091a2e" stopOpacity="1" />
          <stop offset="100%" stopColor="#060f1c" stopOpacity="1" />
        </linearGradient>
      </defs>
      <rect width={750} height={530} fill="url(#pressureGrad)" />
      {/* Isobar lines */}
      {isobars.map((iso) => (
        <g key={iso.p}>
          <path d={iso.d} stroke={CONTOUR} strokeWidth={0.8} fill="none" opacity={0.7} />
          <text
            x={4}
            y={iso.p === 145 ? 76 : iso.p === 135 ? 156 : iso.p === 125 ? 236 : iso.p === 115 ? 316 : iso.p === 105 ? 396 : 476}
            fontSize={7}
            fill={LABEL}
            fontFamily="monospace"
            opacity={0.7}
          >
            {iso.p} атм
          </text>
        </g>
      ))}
      {/* Horizontal tick marks at right */}
      {isobars.map((iso, i) => {
        const y = 80 + i * 80
        return (
          <text key={iso.p} x={735} y={y - 4} fontSize={7} fill={LABEL} fontFamily="monospace" opacity={0.6} textAnchor="end">
            {iso.p}
          </text>
        )
      })}
    </g>
  )
}

// ── Single cell polygon ───────────────────────────────────────────────────────
function CellPolygon({
  cell,
  selected,
  onClick,
}: {
  cell: FloodCell
  selected: boolean
  onClick: () => void
}) {
  const pts = cell.polygon.map(([x, y]) => `${x},${y}`).join(" ")
  const fillColor = compensationColor(cell.compensation)
  const cx = cell.polygon.reduce((s, [x]) => s + x, 0) / cell.polygon.length
  const cy = cell.polygon.reduce((s, [, y]) => s + y, 0) / cell.polygon.length

  return (
    <g onClick={onClick} style={{ cursor: "pointer" }}>
      <polygon
        points={pts}
        fill={fillColor}
        fillOpacity={selected ? 0.45 : 0.22}
        stroke={fillColor}
        strokeWidth={selected ? 2 : 1}
        strokeOpacity={selected ? 1 : 0.7}
      />
      {/* Injector well marker */}
      <circle
        cx={cell.injectorX}
        cy={cell.injectorY}
        r={5}
        fill={INJ_COLOR}
        stroke="#0d1f30"
        strokeWidth={1}
        opacity={0.9}
      />
      <line
        x1={cell.injectorX - 5}
        y1={cell.injectorY}
        x2={cell.injectorX + 5}
        y2={cell.injectorY}
        stroke="#0d1f30"
        strokeWidth={1}
      />
      <line
        x1={cell.injectorX}
        y1={cell.injectorY - 5}
        x2={cell.injectorX}
        y2={cell.injectorY + 5}
        stroke="#0d1f30"
        strokeWidth={1}
      />
      {/* Cell label */}
      {selected && (
        <text x={cx} y={cy + 3} textAnchor="middle" fontSize={7.5} fill={LABEL_LIGHT} fontFamily="sans-serif" fontWeight="700">
          {cell.name.replace("Ячейка ", "")}
        </text>
      )}
      {!selected && (
        <text x={cx} y={cy + 3} textAnchor="middle" fontSize={7} fill={fillColor} fontFamily="sans-serif" opacity={0.8}>
          {cell.name.replace("Ячейка ", "")}
        </text>
      )}
      {/* Compensation % label */}
      <text x={cx} y={cy + 13} textAnchor="middle" fontSize={6.5} fill={fillColor} fontFamily="monospace" opacity={0.9}>
        {cell.compensation.toFixed(0)}%
      </text>
    </g>
  )
}

// ── Legend ────────────────────────────────────────────────────────────────────
function CompLegend({ x, y }: { x: number; y: number }) {
  const items = [
    { color: "#1e40af", label: ">110% — Перекомп." },
    { color: "#22c55e", label: "90–110% — Норма" },
    { color: "#f59e0b", label: "70–90% — Умерен." },
    { color: "#f97316", label: "50–70% — Недокомп." },
    { color: "#ef4444", label: "<50% — Низкая" },
  ]
  return (
    <g>
      <rect x={x - 4} y={y - 4} width={148} height={items.length * 14 + 14} rx={3} fill="#091a2e" opacity={0.88} />
      <text x={x + 4} y={y + 8} fontSize={7.5} fill={LABEL_LIGHT} fontWeight="700" fontFamily="sans-serif">
        Компенсация
      </text>
      {items.map((item, i) => (
        <g key={item.label} transform={`translate(${x + 4}, ${y + 17 + i * 13})`}>
          <rect width={10} height={6} y={-5} rx={1} fill={item.color} opacity={0.85} />
          <text x={14} y={0} fontSize={7} fill={LABEL} fontFamily="sans-serif">
            {item.label}
          </text>
        </g>
      ))}
    </g>
  )
}

// ── Main component ────────────────────────────────────────────────────────────
export function CellsMap({
  selectedCellId,
  onCellSelect,
}: {
  selectedCellId: string | null
  onCellSelect: (id: string | null) => void
}) {
  return (
    <div className="w-full h-full min-h-[360px]">
      <svg viewBox="0 0 750 530" className="w-full h-full" style={{ background: "#091a2e" }}>
        <IsobarBackground />

        {/* License area separators */}
        <line x1={250} y1={0} x2={250} y2={530} stroke="#1e3a5c" strokeWidth={0.8} strokeDasharray="4 3" opacity={0.5} />
        <line x1={488} y1={0} x2={488} y2={530} stroke="#1e3a5c" strokeWidth={0.8} strokeDasharray="4 3" opacity={0.5} />
        <text x={125} y={15} textAnchor="middle" fontSize={8} fill="#334155" fontFamily="sans-serif" fontWeight="700">УЧАСТОК-1</text>
        <text x={370} y={15} textAnchor="middle" fontSize={8} fill="#334155" fontFamily="sans-serif" fontWeight="700">УЧАСТОК-2</text>
        <text x={618} y={15} textAnchor="middle" fontSize={8} fill="#334155" fontFamily="sans-serif" fontWeight="700">УЧАСТОК-3</text>

        {/* Cells */}
        {floodCells.map((cell) => (
          <CellPolygon
            key={cell.id}
            cell={cell}
            selected={selectedCellId === cell.id}
            onClick={() => onCellSelect(selectedCellId === cell.id ? null : cell.id)}
          />
        ))}

        {/* Legend */}
        <CompLegend x={594} y={350} />

        {/* Isobar legend */}
        <g transform="translate(596, 480)">
          <line x1={0} y1={8} x2={50} y2={8} stroke={CONTOUR} strokeWidth={0.8} />
          <text x={55} y={11} fontSize={6.5} fill={LABEL} fontFamily="monospace">Изобара</text>
        </g>

        {/* Map title */}
        <text x={370} y={528} textAnchor="middle" fontSize={8} fill={LABEL} fontFamily="sans-serif" opacity={0.6}>
          КАРТА ЯЧЕЕК ЗАВОДНЕНИЯ — ПОДЛОЖКА: КАРТА ИЗОБАР
        </text>
      </svg>
    </div>
  )
}
