"use client"

import { useMemo, useState } from "react"
import {
  ComposedChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts"
import {
  wellTimeSeries,
  clusterTimeSeries,
  licenseAreaTimeSeries,
  fieldControlTimeSeries,
  averageTs,
  type AveragingPeriod,
  type ChartSelection,
} from "@/lib/well-control-data"

// ── Color constants (no CSS vars in Recharts) ─────────────────────────────────
const CLR = {
  liquidFact:   "#38bdf8",  // sky blue
  liquidVfm:    "#7dd3fc",  // light sky (dashed)
  oilFact:      "#f59e0b",  // amber
  waterCut:     "#f43f5e",  // rose
  intakePres:   "#a78bfa",  // violet
  bhp:          "#818cf8",  // indigo
  gasFactor:    "#34d399",  // emerald
  grid:         "#1e2d3d",
  axis:         "#475569",
  tooltip:      "#0f1e2e",
}

// Series config
type SeriesKey = "liquidFact" | "liquidVfm" | "oilFact" | "waterCut" | "intakePressure" | "bottomholePressure" | "gasFactor"

const SERIES: {
  key: SeriesKey
  label: string
  color: string
  unit: string
  yAxisId: "left" | "right" | "wc" | "gor"
  dashed?: boolean
}[] = [
  { key: "liquidFact",         label: "Дебит жидкости (факт)",  color: CLR.liquidFact,  unit: "м³/сут", yAxisId: "left" },
  { key: "liquidVfm",          label: "Дебит жидкости (ВР)",    color: CLR.liquidVfm,   unit: "м³/сут", yAxisId: "left", dashed: true },
  { key: "oilFact",            label: "Дебит нефти",            color: CLR.oilFact,     unit: "т/сут",  yAxisId: "left" },
  { key: "waterCut",           label: "Обводнённость",          color: CLR.waterCut,    unit: "%",      yAxisId: "wc" },
  { key: "intakePressure",     label: "Дав. на приёме",         color: CLR.intakePres,  unit: "атм",    yAxisId: "right" },
  { key: "bottomholePressure", label: "Забойное давление",      color: CLR.bhp,         unit: "атм",    yAxisId: "right" },
  { key: "gasFactor",          label: "Газовый фактор",         color: CLR.gasFactor,   unit: "м³/т",   yAxisId: "gor" },
]

const PERIOD_LABELS: Record<AveragingPeriod, string> = {
  raw:   "Без ср.",
  day:   "День",
  month: "Месяц",
  year:  "Год",
}

function formatDate(d: string, period: AveragingPeriod): string {
  if (period === "year")  return d.slice(0, 4)
  if (period === "month") return d.slice(0, 7)
  // day / raw — show dd.MM
  const [, m, day] = d.split("-")
  return `${day}.${m}`
}

function CustomTooltip({ active, payload, label, period }: {
  active?: boolean
  payload?: { name: string; value: number; color: string; unit?: string }[]
  label?: string
  period: AveragingPeriod
}) {
  if (!active || !payload?.length) return null
  return (
    <div className="rounded border border-border bg-card shadow-lg px-3 py-2 min-w-[180px]"
      style={{ background: CLR.tooltip }}>
      <p className="text-[10px] font-semibold text-muted-foreground mb-1.5">
        {label ? formatDate(String(label), period) : ""}
      </p>
      {payload.map((p) => (
        <div key={p.name} className="flex items-center justify-between gap-3 mb-0.5">
          <div className="flex items-center gap-1.5">
            <span className="h-1.5 w-3 rounded-full inline-block" style={{ background: p.color }} />
            <span className="text-[10px] text-muted-foreground">{p.name}</span>
          </div>
          <span className="text-[11px] font-semibold tabular-nums" style={{ color: p.color }}>
            {typeof p.value === "number" ? p.value.toFixed(1) : p.value}
          </span>
        </div>
      ))}
    </div>
  )
}

export function WellProductionChart({
  selection,
}: {
  selection: ChartSelection | null
}) {
  const [period, setPeriod] = useState<AveragingPeriod>("day")
  const [hiddenSeries, setHiddenSeries] = useState<Set<SeriesKey>>(new Set())

  function toggleSeries(key: SeriesKey) {
    setHiddenSeries((prev) => {
      const next = new Set(prev)
      next.has(key) ? next.delete(key) : next.add(key)
      return next
    })
  }

  const { title, rawData } = useMemo(() => {
    if (!selection) return { title: null, rawData: null }
    if (selection.level === "field") {
      return { title: "\u041c\u0435\u0441\u0442\u043e\u0440\u043e\u0436\u0434\u0435\u043d\u0438\u0435 \u2014 \u0432\u0435\u0441\u044c \u0444\u043e\u043d\u0434", rawData: fieldControlTimeSeries }
    }
    if (selection.level === "area") {
      return {
        title: `${selection.areaName}`,
        rawData: licenseAreaTimeSeries[selection.areaId] ?? null,
      }
    }
    if (selection.level === "cluster") {
      return {
        title: `${selection.clusterName}`,
        rawData: clusterTimeSeries[selection.clusterId] ?? null,
      }
    }
    // well
    return {
      title: `\u0421\u043a\u0432. ${selection.wellName}`,
      rawData: wellTimeSeries[selection.wellId] ?? null,
    }
  }, [selection])

  const chartData = useMemo(() => {
    if (!rawData) return []
    return averageTs(rawData, period)
  }, [rawData, period])

  const xTicks = useMemo(() => {
    if (chartData.length === 0) return []
    if (chartData.length <= 12) return chartData.map((p) => p.date)
    // Sample ~8 evenly spaced ticks
    const step = Math.ceil(chartData.length / 8)
    return chartData.filter((_, i) => i % step === 0 || i === chartData.length - 1).map((p) => p.date)
  }, [chartData])

  return (
    <div className="flex h-full flex-col bg-background border-r border-border">
      {/* Header */}
      <div className="flex h-9 shrink-0 items-center justify-between gap-3 border-b border-border px-3">
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-[11px] font-semibold text-foreground truncate">
            {title
              ? `${title} \u2014 \u0438\u0441\u0442\u043e\u0440\u0438\u044f \u0440\u0430\u0431\u043e\u0442\u044b`
              : "\u0412\u044b\u0431\u0435\u0440\u0438\u0442\u0435 \u043e\u0431\u044a\u0435\u043a\u0442 \u043d\u0430 \u043a\u0430\u0440\u0442\u0435 \u0438\u043b\u0438 \u0432 \u0442\u0430\u0431\u043b\u0438\u0446\u0435"}
          </span>
        </div>
        {/* Averaging period selector */}
        <div className="flex items-center gap-0.5 shrink-0">
          {(["raw", "day", "month", "year"] as AveragingPeriod[]).map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`rounded px-2 py-0.5 text-[10px] font-medium transition-colors ${
                period === p
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-accent hover:text-foreground"
              }`}
            >
              {PERIOD_LABELS[p]}
            </button>
          ))}
        </div>
      </div>

      {/* Series toggles */}
      <div className="flex flex-wrap gap-1 border-b border-border px-3 py-1.5 shrink-0">
        {SERIES.map((s) => {
          const hidden = hiddenSeries.has(s.key)
          return (
            <button
              key={s.key}
              onClick={() => toggleSeries(s.key)}
              className={`flex items-center gap-1 rounded px-2 py-0.5 text-[10px] transition-colors ${
                hidden ? "opacity-35" : "opacity-100"
              } hover:bg-accent/50`}
            >
              <span
                className="h-1.5 w-4 rounded-sm inline-block"
                style={{
                  background: s.color,
                  borderBottom: s.dashed ? `2px dashed ${s.color}` : undefined,
                  opacity: s.dashed ? 0.8 : 1,
                }}
              />
              <span className="text-muted-foreground">{s.label}</span>
            </button>
          )
        })}
      </div>

      {/* Chart */}
      <div className="flex-1 min-h-0 px-1 py-1">
        {!selection ? (
          <div className="flex h-full items-center justify-center">
            <p className="text-[11px] text-muted-foreground">
              {"\u0412\u044b\u0431\u0435\u0440\u0438\u0442\u0435 \u043e\u0431\u044a\u0435\u043a\u0442 \u043d\u0430 \u043a\u0430\u0440\u0442\u0435 \u0438\u043b\u0438 \u0432 \u0442\u0430\u0431\u043b\u0438\u0446\u0435"}
            </p>
          </div>
        ) : chartData.length === 0 ? (
          <div className="flex h-full items-center justify-center">
            <p className="text-[11px] text-muted-foreground">{"\u041d\u0435\u0442 \u0434\u0430\u043d\u043d\u044b\u0445"}</p>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={chartData} margin={{ top: 4, right: 36, bottom: 16, left: 4 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={CLR.grid} vertical={false} />

              <XAxis
                dataKey="date"
                ticks={xTicks}
                tickFormatter={(v) => formatDate(String(v), period)}
                tick={{ fontSize: 9, fill: CLR.axis }}
                axisLine={{ stroke: CLR.grid }}
                tickLine={false}
              />

              {/* Left Y — дебиты (м³/сут, т/сут) */}
              <YAxis
                yAxisId="left"
                tick={{ fontSize: 9, fill: CLR.axis }}
                axisLine={false}
                tickLine={false}
                width={32}
                tickFormatter={(v) => v.toFixed(0)}
                label={{ value: "м³/т сут", angle: -90, position: "insideLeft", offset: 10, style: { fontSize: 8, fill: CLR.axis } }}
              />

              {/* Right Y — давления (атм) */}
              <YAxis
                yAxisId="right"
                orientation="right"
                tick={{ fontSize: 9, fill: CLR.axis }}
                axisLine={false}
                tickLine={false}
                width={32}
                tickFormatter={(v) => v.toFixed(0)}
                label={{ value: "атм", angle: 90, position: "insideRight", offset: 10, style: { fontSize: 8, fill: CLR.axis } }}
              />

              {/* WC Y — обводнённость % */}
              <YAxis
                yAxisId="wc"
                orientation="right"
                domain={[0, 100]}
                tick={{ fontSize: 9, fill: CLR.waterCut }}
                axisLine={false}
                tickLine={false}
                width={28}
                tickFormatter={(v) => `${v}%`}
              />

              {/* GOR Y — газовый фактор, hidden axis */}
              <YAxis
                yAxisId="gor"
                hide
              />

              <Tooltip
                content={<CustomTooltip period={period} />}
                cursor={{ stroke: "#334155", strokeWidth: 1 }}
              />

              {SERIES.map((s) =>
                hiddenSeries.has(s.key) ? null : (
                  <Line
                    key={s.key}
                    yAxisId={s.yAxisId}
                    type="monotone"
                    dataKey={s.key}
                    name={s.label}
                    stroke={s.color}
                    strokeWidth={s.key === "liquidFact" || s.key === "oilFact" ? 1.8 : 1.2}
                    strokeDasharray={s.dashed ? "5 3" : undefined}
                    dot={false}
                    activeDot={{ r: 3, strokeWidth: 0 }}
                  />
                )
              )}
            </ComposedChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  )
}
