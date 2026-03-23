"use client"

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
import type { WaterCutPoint } from "@/lib/sweep-data"
import { SERIES_COLORS } from "@/lib/sweep-data"

type SeriesEntry = {
  id: string
  label: string
  data: WaterCutPoint[]
  color: string
  dashed?: boolean
}

type TooltipPayloadItem = {
  color: string
  name: string
  value: number
}

function CustomTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean
  payload?: TooltipPayloadItem[]
  label?: number
}) {
  if (!active || !payload || payload.length === 0) return null
  return (
    <div className="rounded border border-border bg-card px-3 py-2.5 shadow-lg text-[11px] space-y-1 min-w-[160px]">
      <p className="text-muted-foreground font-medium tabular-nums">
        Накопл. добыча: {label} тыс. т
      </p>
      <div className="space-y-1 pt-0.5">
        {payload.map((entry) => (
          <div key={entry.name} className="flex items-center justify-between gap-4">
            <span className="flex items-center gap-1.5">
              <span
                className="inline-block h-1.5 w-3 rounded-sm shrink-0"
                style={{ backgroundColor: entry.color }}
              />
              <span className="text-muted-foreground truncate max-w-[100px]">{entry.name}</span>
            </span>
            <span className="tabular-nums font-semibold text-foreground">{entry.value.toFixed(1)}%</span>
          </div>
        ))}
      </div>
    </div>
  )
}

type Props = {
  series: SeriesEntry[]
  title?: string
  height?: number
}

export function WaterCutChart({ series, title, height = 320 }: Props) {
  // Merge all data points onto a common cumOil axis
  const allCumOils = Array.from(
    new Set(series.flatMap((s) => s.data.map((p) => p.cumOil)))
  ).sort((a, b) => a - b)

  const merged = allCumOils.map((cumOil) => {
    const point: Record<string, number> = { cumOil }
    series.forEach((s) => {
      // Find nearest point
      const nearest = s.data.reduce((prev, curr) =>
        Math.abs(curr.cumOil - cumOil) < Math.abs(prev.cumOil - cumOil) ? curr : prev
      )
      if (Math.abs(nearest.cumOil - cumOil) < 15) {
        point[s.id] = nearest.waterCut
      }
    })
    return point
  })

  return (
    <div className="space-y-3">
      {title && (
        <h3 className="text-[13px] font-semibold text-foreground">{title}</h3>
      )}

      {/* Legend */}
      <div className="flex flex-wrap gap-x-4 gap-y-1.5">
        {series.map((s) => (
          <div key={s.id} className="flex items-center gap-1.5">
            <svg width="18" height="8" viewBox="0 0 18 8" aria-hidden="true">
              <line
                x1="0" y1="4" x2="18" y2="4"
                stroke={s.color}
                strokeWidth="2"
                strokeDasharray={s.dashed ? "4 2" : undefined}
              />
            </svg>
            <span className="text-[11px] text-muted-foreground truncate max-w-[90px]">{s.label}</span>
          </div>
        ))}
      </div>

      <ResponsiveContainer width="100%" height={height}>
        <LineChart
          data={merged}
          margin={{ top: 8, right: 16, bottom: 8, left: 0 }}
        >
          <CartesianGrid
            strokeDasharray="3 3"
            stroke="var(--border)"
            opacity={0.5}
          />
          <XAxis
            dataKey="cumOil"
            type="number"
            domain={["auto", "auto"]}
            tick={{ fontSize: 10, fill: "var(--muted-foreground)", fontFamily: "monospace" }}
            tickLine={false}
            axisLine={{ stroke: "var(--border)" }}
            label={{
              value: "Накопленная добыча нефти, тыс. т",
              position: "insideBottomRight",
              offset: -4,
              fontSize: 10,
              fill: "var(--muted-foreground)",
            }}
          />
          <YAxis
            domain={[0, 100]}
            tick={{ fontSize: 10, fill: "var(--muted-foreground)", fontFamily: "monospace" }}
            tickLine={false}
            axisLine={{ stroke: "var(--border)" }}
            tickFormatter={(v: number) => `${v}%`}
            width={42}
          />
          <Tooltip content={<CustomTooltip />} />
          {/* Reference lines */}
          <ReferenceLine
            y={80}
            stroke="var(--status-warning)"
            strokeDasharray="3 3"
            strokeOpacity={0.5}
            label={{
              value: "80%",
              position: "insideTopRight",
              fontSize: 9,
              fill: "var(--status-warning)",
            }}
          />
          <ReferenceLine
            y={90}
            stroke="var(--status-critical)"
            strokeDasharray="3 3"
            strokeOpacity={0.4}
            label={{
              value: "90%",
              position: "insideTopRight",
              fontSize: 9,
              fill: "var(--status-critical)",
            }}
          />
          {series.map((s) => (
            <Line
              key={s.id}
              type="monotone"
              dataKey={s.id}
              name={s.label}
              stroke={s.color}
              strokeWidth={s.dashed ? 1.5 : 2}
              strokeDasharray={s.dashed ? "5 3" : undefined}
              dot={false}
              activeDot={{ r: 3, strokeWidth: 0 }}
              connectNulls
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}

export { SERIES_COLORS }
export type { SeriesEntry }
