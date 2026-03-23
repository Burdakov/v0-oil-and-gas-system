"use client"

import { useState, useMemo } from "react"
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts"
import { floodCells } from "@/lib/flood-cells-data"
import type { FloodCell } from "@/lib/flood-cells-data"
import { cn } from "@/lib/utils"

type ChartType = "wnf-kin" | "wc-pv"

// Resolved colors (no CSS vars for Recharts)
const COLORS = {
  primary: "#f59e0b",
  grid: "#1e293b",
  axis: "#475569",
  label: "#64748b",
  tooltip: "#0f172a",
  tooltipBorder: "#1e293b",
  reference: "#334155",
  selected: "#f59e0b",
  others: ["#38bdf8", "#34d399", "#a78bfa", "#fb923c", "#f472b6", "#4ade80", "#60a5fa", "#fbbf24"],
}

function CustomTooltip({ active, payload, label, xLabel, yLabel, xUnit, yUnit }: {
  active?: boolean
  payload?: { value: number; name: string; color: string }[]
  label?: number
  xLabel: string
  yLabel: string
  xUnit: string
  yUnit: string
}) {
  if (!active || !payload?.length) return null
  return (
    <div
      className="rounded border text-[11px] font-mono"
      style={{
        background: COLORS.tooltip,
        borderColor: COLORS.tooltipBorder,
        padding: "6px 10px",
        minWidth: 140,
      }}
    >
      <p className="text-[10px] mb-1" style={{ color: COLORS.label }}>
        {xLabel}: <span style={{ color: "#e2e8f0" }}>{Number(label).toFixed(3)} {xUnit}</span>
      </p>
      {payload.map((p) => (
        <p key={p.name} style={{ color: p.color }}>
          {p.name}: {p.value.toFixed(2)} {yUnit}
        </p>
      ))}
    </div>
  )
}

export function CellsCharts({ selectedCellId }: { selectedCellId: string | null }) {
  const [chartType, setChartType] = useState<ChartType>("wc-pv")

  const selectedCell = useMemo(
    () => floodCells.find((c) => c.id === selectedCellId) ?? null,
    [selectedCellId],
  )

  // Build merged dataset for the active chart
  // Show selected cell prominently, others as thin lines
  const { data, keys } = useMemo(() => {
    if (chartType === "wnf-kin") {
      // X: КИН, Y: ВНФ
      const maxLen = Math.max(...floodCells.map((c) => c.wnfKin.length))
      const merged: Record<string, number>[] = Array.from({ length: maxLen }, (_, i) => {
        const row: Record<string, number> = { x: floodCells[0].wnfKin[i]?.kin ?? 0 }
        floodCells.forEach((c) => {
          const pt = c.wnfKin[i]
          if (pt) row[c.id] = pt.wnf
          row.x = pt?.kin ?? row.x
        })
        return row
      })
      return { data: merged, keys: floodCells.map((c) => c.id) }
    } else {
      // X: ПО, Y: Обводнённость
      const maxLen = Math.max(...floodCells.map((c) => c.wcPv.length))
      const merged: Record<string, number>[] = Array.from({ length: maxLen }, (_, i) => {
        const row: Record<string, number> = { x: floodCells[0].wcPv[i]?.pv ?? 0 }
        floodCells.forEach((c) => {
          const pt = c.wcPv[i]
          if (pt) row[c.id] = pt.wc
          row.x = pt?.pv ?? row.x
        })
        return row
      })
      return { data: merged, keys: floodCells.map((c) => c.id) }
    }
  }, [chartType])

  const isWnf = chartType === "wnf-kin"
  const xLabel = isWnf ? "КИН" : "Прокач. ПО"
  const yLabel = isWnf ? "ВНФ" : "Обводнённость"
  const xUnit = isWnf ? "д.е." : "д.е."
  const yUnit = isWnf ? "м³/т" : "%"

  return (
    <div className="flex flex-col h-full gap-3 p-3">
      {/* Toggle */}
      <div className="flex items-center gap-2">
        <span className="text-[11px] text-muted-foreground">Характеристика:</span>
        <div className="flex rounded border border-border overflow-hidden">
          {([
            { type: "wc-pv" as ChartType, label: "Обв. от ПО" },
            { type: "wnf-kin" as ChartType, label: "ВНФ от КИН" },
          ] as const).map((opt) => (
            <button
              key={opt.type}
              onClick={() => setChartType(opt.type)}
              className={cn(
                "px-3 py-1 text-[11px] transition-colors",
                chartType === opt.type
                  ? "bg-primary text-primary-foreground font-semibold"
                  : "text-muted-foreground hover:bg-accent hover:text-foreground",
              )}
            >
              {opt.label}
            </button>
          ))}
        </div>
        {selectedCell && (
          <span className="ml-auto text-[11px] text-primary font-medium">{selectedCell.name} — выделена</span>
        )}
      </div>

      {/* Chart */}
      <div className="flex-1 min-h-0">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 4, right: 12, bottom: 20, left: 8 }}>
            <CartesianGrid stroke={COLORS.grid} strokeWidth={0.5} strokeDasharray="3 3" />
            <XAxis
              dataKey="x"
              type="number"
              domain={["auto", "auto"]}
              tick={{ fontSize: 9, fill: COLORS.label, fontFamily: "monospace" }}
              tickLine={false}
              axisLine={{ stroke: COLORS.axis }}
              label={{ value: `${xLabel}, ${xUnit}`, position: "insideBottom", offset: -12, fontSize: 9, fill: COLORS.label }}
            />
            <YAxis
              tick={{ fontSize: 9, fill: COLORS.label, fontFamily: "monospace" }}
              tickLine={false}
              axisLine={{ stroke: COLORS.axis }}
              label={{ value: `${yLabel}, ${yUnit}`, angle: -90, position: "insideLeft", offset: 8, fontSize: 9, fill: COLORS.label }}
            />
            <Tooltip
              content={
                <CustomTooltip
                  xLabel={xLabel}
                  yLabel={yLabel}
                  xUnit={xUnit}
                  yUnit={yUnit}
                />
              }
            />
            {/* Reference lines */}
            {!isWnf && (
              <>
                <ReferenceLine y={80} stroke={COLORS.reference} strokeDasharray="4 2" strokeWidth={0.8} />
                <ReferenceLine y={90} stroke="#7f1d1d" strokeDasharray="4 2" strokeWidth={0.8} />
              </>
            )}
            {/* All cell lines */}
            {keys.map((key, i) => {
              const isSelected = key === selectedCellId
              const cell = floodCells.find((c) => c.id === key)!
              const color = isSelected
                ? COLORS.selected
                : COLORS.others[i % COLORS.others.length]
              return (
                <Line
                  key={key}
                  dataKey={key}
                  name={cell.name.replace("Ячейка ", "")}
                  dot={false}
                  stroke={color}
                  strokeWidth={isSelected ? 2.5 : 0.8}
                  opacity={isSelected ? 1 : selectedCellId ? 0.2 : 0.55}
                  activeDot={isSelected ? { r: 4, fill: color } : false}
                  connectNulls
                />
              )
            })}
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Summary for selected cell */}
      {selectedCell && (
        <div className="rounded border border-border/60 bg-muted/20 px-3 py-2 grid grid-cols-3 gap-x-4 gap-y-1">
          <div className="text-[10px] text-muted-foreground">КИН тек.</div>
          <div className="text-[10px] text-muted-foreground">Обводн.</div>
          <div className="text-[10px] text-muted-foreground">Проч. ПО</div>
          <div className="text-[12px] font-mono text-foreground">{(selectedCell.kprod * 0.08).toFixed(3)} д.е.</div>
          <div className="text-[12px] font-mono text-foreground">{selectedCell.waterCut.toFixed(1)} %</div>
          <div className="text-[12px] font-mono text-foreground">{selectedCell.porePV.toFixed(2)} д.е.</div>
        </div>
      )}
    </div>
  )
}
