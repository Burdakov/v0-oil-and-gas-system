"use client"

import { useState } from "react"
import {
  ComposedChart,
  Line,
  ReferenceLine,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts"
import type { TimeSeriesPoint } from "@/lib/idn-data"

// All colors as JS constants — no CSS vars in Recharts
const C = {
  liquidFact: "#38bdf8",      // sky — liquid actual
  oilFact: "#f59e0b",         // amber — oil actual
  bhpFact: "#a78bfa",         // violet — BHP actual
  liquidPot: "#7dd3fc",       // light sky — liquid potential (dashed)
  oilPot: "#fcd34d",          // light amber — oil potential (dashed)
  bhpPot: "#c4b5fd",          // light violet — BHP potential (dashed)
  infraLimit: "#f87171",      // red — infrastructure limit
  grid: "#1e2d3d",
  axis: "#475569",
  tooltip: "#0d1f30",
  tooltipBorder: "#1e3a4a",
}

type ActiveMetric = "rates" | "bhp"

type CustomTooltipProps = {
  active?: boolean
  payload?: Array<{ name: string; value: number; color: string; dataKey: string }>
  label?: string
  metric: ActiveMetric
}

function CustomTooltip({ active, payload, label, metric }: CustomTooltipProps) {
  if (!active || !payload || !payload.length) return null
  return (
    <div
      className="rounded border text-[11px] font-sans"
      style={{
        background: C.tooltip,
        borderColor: C.tooltipBorder,
        padding: "8px 10px",
        minWidth: 180,
      }}
    >
      <p className="mb-1.5 font-semibold text-slate-300">{label}</p>
      {payload.map((p) => (
        <div key={p.dataKey} className="flex items-center justify-between gap-4">
          <span className="flex items-center gap-1.5" style={{ color: p.color }}>
            <span
              style={{
                display: "inline-block",
                width: 20,
                height: 2,
                background: p.color,
                borderRadius: 1,
              }}
            />
            {p.name}
          </span>
          <span className="font-mono tabular-nums text-slate-200">
            {p.value.toFixed(1)}
            {metric === "rates" ? " т/сут" : " атм"}
          </span>
        </div>
      ))}
    </div>
  )
}

type Props = {
  data: TimeSeriesPoint[]
  title: string
}

export function ProductionChart({ data, title }: Props) {
  const [metric, setMetric] = useState<ActiveMetric>("rates")

  const tabs: { key: ActiveMetric; label: string }[] = [
    { key: "rates", label: "Дебиты" },
    { key: "bhp", label: "Заб. давление" },
  ]

  // Format date "YYYY-MM-DD" → "MMM DD" in Russian short form
  function fmtDate(iso: string) {
    const d = new Date(iso)
    return d.toLocaleDateString("ru-RU", { day: "numeric", month: "short" })
  }

  const chartData = data.map((pt) => ({ ...pt, dateLabel: fmtDate(pt.date) }))

  return (
    <div className="flex h-full flex-col bg-card border-l border-border">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-border">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
            Динамика показателей
          </p>
          <p className="text-[12px] font-medium text-foreground truncate max-w-[260px]">{title}</p>
        </div>
        <div className="flex rounded border border-border overflow-hidden">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setMetric(tab.key)}
              className="px-2.5 py-1 text-[11px] transition-colors"
              style={{
                background: metric === tab.key ? "oklch(0.22 0.008 220)" : "transparent",
                color: metric === tab.key ? "oklch(0.92 0.005 220)" : "oklch(0.55 0.008 220)",
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Legend pills */}
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 px-4 pt-2 pb-1">
        {metric === "rates" ? (
          <>
            <LegendItem color={C.liquidFact} label="Дебит жидкости (факт)" />
            <LegendItem color={C.oilFact} label="Дебит нефти (факт)" />
            <LegendItem color={C.liquidPot} label="Жидкость (потенциал)" dashed />
            <LegendItem color={C.oilPot} label="Нефть (потенциал)" dashed />
            <LegendItem color={C.infraLimit} label="Лимит инфраструктуры" dashed />
          </>
        ) : (
          <>
            <LegendItem color={C.bhpFact} label="Рзаб факт" />
            <LegendItem color={C.bhpPot} label="Рзаб потенциал" dashed />
          </>
        )}
      </div>

      {/* Chart */}
      <div className="flex-1 min-h-0 px-2 pb-2 pt-1">
        <ResponsiveContainer width="100%" height="100%">
          {metric === "rates" ? (
            <ComposedChart data={chartData} margin={{ top: 4, right: 12, bottom: 20, left: 4 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={C.grid} />
              <XAxis
                dataKey="dateLabel"
                tick={{ fontSize: 9, fill: C.axis }}
                tickLine={false}
                axisLine={{ stroke: C.grid }}
                interval={3}
                angle={-35}
                textAnchor="end"
                dy={4}
              />
              <YAxis
                tick={{ fontSize: 9, fill: C.axis }}
                tickLine={false}
                axisLine={false}
                unit=" т/сут"
                width={64}
              />
              <Tooltip content={<CustomTooltip metric="rates" />} />
              {/* Infrastructure limit */}
              <Line
                dataKey="infraLimit"
                name="Лимит инфр."
                stroke={C.infraLimit}
                strokeWidth={1.5}
                strokeDasharray="6 3"
                dot={false}
              />
              {/* Potential */}
              <Line
                dataKey="liquidRatePot"
                name="Жидкость (пот.)"
                stroke={C.liquidPot}
                strokeWidth={1.5}
                strokeDasharray="4 3"
                dot={false}
                opacity={0.7}
              />
              <Line
                dataKey="oilRatePot"
                name="Нефть (пот.)"
                stroke={C.oilPot}
                strokeWidth={1.5}
                strokeDasharray="4 3"
                dot={false}
                opacity={0.7}
              />
              {/* Actual — on top */}
              <Line
                dataKey="liquidRate"
                name="Дебит жидкости"
                stroke={C.liquidFact}
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 3, fill: C.liquidFact }}
              />
              <Line
                dataKey="oilRate"
                name="Дебит нефти"
                stroke={C.oilFact}
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 3, fill: C.oilFact }}
              />
            </ComposedChart>
          ) : (
            <ComposedChart data={chartData} margin={{ top: 4, right: 12, bottom: 20, left: 4 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={C.grid} />
              <XAxis
                dataKey="dateLabel"
                tick={{ fontSize: 9, fill: C.axis }}
                tickLine={false}
                axisLine={{ stroke: C.grid }}
                interval={3}
                angle={-35}
                textAnchor="end"
                dy={4}
              />
              <YAxis
                tick={{ fontSize: 9, fill: C.axis }}
                tickLine={false}
                axisLine={false}
                unit=" атм"
                width={56}
              />
              <Tooltip content={<CustomTooltip metric="bhp" />} />
              <Line
                dataKey="bottomholePressurePot"
                name="Рзаб потенциал"
                stroke={C.bhpPot}
                strokeWidth={1.5}
                strokeDasharray="4 3"
                dot={false}
                opacity={0.7}
              />
              <Line
                dataKey="bottomholePressure"
                name="Рзаб факт"
                stroke={C.bhpFact}
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 3, fill: C.bhpFact }}
              />
            </ComposedChart>
          )}
        </ResponsiveContainer>
      </div>
    </div>
  )
}

function LegendItem({
  color,
  label,
  dashed,
}: {
  color: string
  label: string
  dashed?: boolean
}) {
  return (
    <span className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
      <svg width="20" height="8" viewBox="0 0 20 8" aria-hidden>
        <line
          x1="0"
          y1="4"
          x2="20"
          y2="4"
          stroke={color}
          strokeWidth="2"
          strokeDasharray={dashed ? "4 2" : undefined}
        />
      </svg>
      {label}
    </span>
  )
}
