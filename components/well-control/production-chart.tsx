"use client"

import { useMemo, useState } from "react"
import {
  ComposedChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceArea,
  Scatter,
} from "recharts"
import {
  wellTimeSeries,
  wellPatternSegments,
  clusterTimeSeries,
  licenseAreaTimeSeries,
  fieldControlTimeSeries,
  averageTs,
  PATTERN_LABELS,
  type AveragingPeriod,
  type ChartSelection,
  type PatternKind,
  type DailyCause,
} from "@/lib/well-control-data"

// ── Color constants ────────────────────────────────────────────────────────────
// All lines use a single neutral slate palette — differentiated by weight/dash only
const LINE_BASE = "#94a3b8"   // slate-400 — default line color
const LINE_STRONG = "#cbd5e1" // slate-300 — primary lines (liquid, oil)
const LINE_DIM = "#64748b"    // slate-500 — secondary lines (vfm, gor)

const CLR = {
  liquidFact:  LINE_STRONG,
  liquidVfm:   LINE_DIM,
  oilFact:     LINE_STRONG,
  waterCut:    LINE_BASE,
  intakePres:  LINE_DIM,
  bhp:         LINE_BASE,
  gasFactor:   LINE_DIM,
  grid:        "#1e2d3d",
  axis:        "#475569",
  tooltip:     "#0f1e2e",
}

// Pattern interval background fills — low-opacity solid color, no stroke
const PATTERN_FILL: Record<PatternKind, string> = {
  stable:        "rgba(52,211,153,0.06)",
  kprod_decline: "rgba(239,68,68,0.09)",
  rpl_decline:   "rgba(59,130,246,0.09)",
  glf_change:    "rgba(251,191,36,0.07)",
  tech_effect:   "rgba(167,139,250,0.08)",
  unstable:      "rgba(249,115,22,0.10)",
}

// Used only for classifier strip and legend dots — not for line strokes
const PATTERN_STROKE: Record<PatternKind, string> = {
  stable:        "#34d399",
  kprod_decline: "#ef4444",
  rpl_decline:   "#3b82f6",
  glf_change:    "#fbbf24",
  tech_effect:   "#a78bfa",
  unstable:      "#f97316",
}

// Daily cause dot colors
const CAUSE_CLR: Record<DailyCause, string> = {
  stable:   "#34d399",
  kprod:    "#ef4444",
  rpl:      "#3b82f6",
  tech:     "#a78bfa",
  glf:      "#fbbf24",
  vsp:      "#f43f5e",
  fund:     "#94a3b8",
  unstable: "#f97316",
}

const CAUSE_LABEL: Record<DailyCause, string> = {
  stable:   "\u0421\u0442\u0430\u0431.",
  kprod:    "\u041a\u043f\u0440\u043e\u0434",
  rpl:      "\u0420\u043f\u043b",
  tech:     "\u0422\u0435\u0445.",
  glf:      "\u0413\u0416\u0424",
  vsp:      "\u0412\u0421\u041f",
  fund:     "\u0424\u043e\u043d\u0434",
  unstable: "\u041d\u0435\u0441\u0442.",
}

type SeriesKey = "liquidFact" | "liquidVfm" | "oilFact" | "waterCut" | "intakePressure" | "bottomholePressure" | "gasFactor"

const SERIES: {
  key: SeriesKey
  label: string
  color: string
  unit: string
  yAxisId: "left" | "right" | "wc" | "gor"
  dashed?: boolean
}[] = [
  { key: "liquidFact",         label: "\u0414\u0435\u0431\u0438\u0442 \u0436\u0438\u0434\u043a\u043e\u0441\u0442\u0438 (\u0444\u0430\u043a\u0442)",  color: CLR.liquidFact, unit: "\u043c\u00b3/\u0441\u0443\u0442", yAxisId: "left" },
  { key: "liquidVfm",          label: "\u0414\u0435\u0431\u0438\u0442 \u0436\u0438\u0434\u043a\u043e\u0441\u0442\u0438 (\u0412\u0420)",    color: CLR.liquidVfm,  unit: "\u043c\u00b3/\u0441\u0443\u0442", yAxisId: "left", dashed: true },
  { key: "oilFact",            label: "\u0414\u0435\u0431\u0438\u0442 \u043d\u0435\u0444\u0442\u0438",            color: CLR.oilFact,    unit: "\u0442/\u0441\u0443\u0442",  yAxisId: "left" },
  { key: "waterCut",           label: "\u041e\u0431\u0432\u043e\u0434\u043d\u0451\u043d\u043d\u043e\u0441\u0442\u044c",          color: CLR.waterCut,   unit: "%",      yAxisId: "wc" },
  { key: "intakePressure",     label: "\u0414\u0430\u0432. \u043d\u0430 \u043f\u0440\u0438\u0451\u043c\u0435",         color: CLR.intakePres, unit: "\u0430\u0442\u043c",    yAxisId: "right" },
  { key: "bottomholePressure", label: "\u0417\u0430\u0431\u043e\u0439\u043d\u043e\u0435 \u0434\u0430\u0432\u043b\u0435\u043d\u0438\u0435",      color: CLR.bhp,        unit: "\u0430\u0442\u043c",    yAxisId: "right" },
  { key: "gasFactor",          label: "\u0413\u0430\u0437\u043e\u0432\u044b\u0439 \u0444\u0430\u043a\u0442\u043e\u0440",         color: CLR.gasFactor,  unit: "\u043c\u00b3/\u0442",   yAxisId: "gor" },
]

const PERIOD_LABELS: Record<AveragingPeriod, string> = {
  raw:   "\u0411\u0435\u0437 \u0441\u0440.",
  day:   "\u0414\u0435\u043d\u044c",
  month: "\u041c\u0435\u0441\u044f\u0446",
  year:  "\u0413\u043e\u0434",
}

function formatDate(d: string, period: AveragingPeriod): string {
  if (period === "year")  return d.slice(0, 4)
  if (period === "month") return d.slice(0, 7)
  const [, m, day] = d.split("-")
  return `${day}.${m}`
}

function CustomTooltip({ active, payload, label, period }: {
  active?: boolean
  payload?: { name: string; value: number; color: string }[]
  label?: string
  period: AveragingPeriod
}) {
  if (!active || !payload?.length) return null
  return (
    <div className="rounded border border-border shadow-lg px-3 py-2 min-w-[180px]"
      style={{ background: CLR.tooltip }}>
      <p className="text-[10px] font-semibold text-muted-foreground mb-1.5">
        {label ? formatDate(String(label), period) : ""}
      </p>
      {payload.filter((p) => p.name && p.value != null).map((p) => (
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

// Classifier strip rendered below the chart as a flex row of colored segments
function ClassifierStrip({ segments, dates }: {
  segments: { startDate: string; endDate: string; kind: PatternKind; label: string }[]
  dates: string[]
}) {
  const total = dates.length
  if (total === 0 || segments.length === 0) return null

  return (
    <div className="shrink-0 px-1 pb-1">
      <div className="flex h-5 w-full overflow-hidden rounded-sm border border-border/30">
        {segments.map((seg, i) => {
          const startIdx = dates.indexOf(seg.startDate)
          const endIdx = dates.indexOf(seg.endDate)
          if (startIdx === -1 || endIdx === -1) return null
          const width = ((endIdx - startIdx + 1) / total) * 100
          return (
            <div
              key={i}
              title={seg.label}
              style={{
                width: `${width}%`,
                background: PATTERN_STROKE[seg.kind],
                opacity: 0.75,
                minWidth: 1,
              }}
              className="relative group flex-shrink-0"
            >
              {width > 8 && (
                <span className="absolute inset-0 flex items-center justify-center text-[8px] font-semibold text-white/90 truncate px-0.5">
                  {seg.label}
                </span>
              )}
              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 hidden group-hover:flex z-50
                rounded bg-card border border-border px-2 py-1 text-[10px] whitespace-nowrap shadow-lg">
                {seg.label} ({seg.startDate} — {seg.endDate})
              </div>
            </div>
          )
        })}
      </div>
      {/* Legend */}
      <div className="flex flex-wrap gap-x-3 gap-y-0.5 mt-1">
        {(Object.entries(PATTERN_STROKE) as [PatternKind, string][]).map(([kind, color]) => (
          <div key={kind} className="flex items-center gap-1">
            <span className="inline-block h-2 w-3 rounded-sm" style={{ background: color, opacity: 0.75 }} />
            <span className="text-[9px] text-muted-foreground">{PATTERN_LABELS[kind]}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

// Custom dot that colors by dailyCause
function CauseDot(props: {
  cx?: number; cy?: number; payload?: { dailyCause?: DailyCause }; dataKey?: string; hidden?: boolean
}) {
  const { cx, cy, payload, hidden } = props
  if (hidden || !payload?.dailyCause || payload.dailyCause === "stable") return null
  if (cx === undefined || cy === undefined) return null
  const fill = CAUSE_CLR[payload.dailyCause]
  return <circle cx={cx} cy={cy} r={3} fill={fill} stroke="none" opacity={0.9} />
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

  const { title, rawData, patternSegments } = useMemo(() => {
    if (!selection) return { title: null, rawData: null, patternSegments: [] }
    if (selection.level === "field") {
      return {
        title: "\u041c\u0435\u0441\u0442\u043e\u0440\u043e\u0436\u0434\u0435\u043d\u0438\u0435 \u2014 \u0432\u0435\u0441\u044c \u0444\u043e\u043d\u0434",
        rawData: fieldControlTimeSeries,
        patternSegments: [],
      }
    }
    if (selection.level === "area") {
      return {
        title: selection.areaName,
        rawData: licenseAreaTimeSeries[selection.areaId] ?? null,
        patternSegments: [],
      }
    }
    if (selection.level === "cluster") {
      return {
        title: selection.clusterName,
        rawData: clusterTimeSeries[selection.clusterId] ?? null,
        patternSegments: [],
      }
    }
    // well — show pattern segments
    return {
      title: `\u0421\u043a\u0432. ${selection.wellName}`,
      rawData: wellTimeSeries[selection.wellId] ?? null,
      patternSegments: wellPatternSegments[selection.wellId] ?? [],
    }
  }, [selection])

  const chartData = useMemo(() => {
    if (!rawData) return []
    return averageTs(rawData, period)
  }, [rawData, period])

  // Compute pattern segments from averaged data dates (for non-well levels, derive from dailyCause)
  const derivedSegments = useMemo(() => {
    if (selection?.level === "well") return patternSegments
    if (chartData.length === 0) return []
    // Build from daily cause of averaged data
    const segs: { startDate: string; endDate: string; kind: PatternKind; label: string }[] = []
    let i = 0
    while (i < chartData.length) {
      const cause = chartData[i].dailyCause ?? "stable"
      const kind: PatternKind =
        cause === "stable" ? "stable" :
        cause === "kprod" ? "kprod_decline" :
        cause === "rpl" ? "rpl_decline" :
        cause === "glf" ? "glf_change" :
        cause === "tech" ? "tech_effect" : "unstable"
      let j = i + 1
      while (j < chartData.length) {
        const nc = chartData[j].dailyCause ?? "stable"
        const nk: PatternKind =
          nc === "stable" ? "stable" :
          nc === "kprod" ? "kprod_decline" :
          nc === "rpl" ? "rpl_decline" :
          nc === "glf" ? "glf_change" :
          nc === "tech" ? "tech_effect" : "unstable"
        if (nk !== kind) break
        j++
      }
      segs.push({ startDate: chartData[i].date, endDate: chartData[j - 1].date, kind, label: PATTERN_LABELS[kind] })
      i = j
    }
    return segs
  }, [selection, chartData, patternSegments])

  const xTicks = useMemo(() => {
    if (chartData.length <= 12) return chartData.map((p) => p.date)
    const step = Math.ceil(chartData.length / 8)
    return chartData.filter((_, i) => i % step === 0 || i === chartData.length - 1).map((p) => p.date)
  }, [chartData])

  const chartDates = useMemo(() => chartData.map((p) => p.date), [chartData])

  return (
    <div className="flex h-full flex-col bg-background border-r border-border">
      {/* Header */}
      <div className="flex h-9 shrink-0 items-center justify-between gap-3 border-b border-border px-3">
        <span className="text-[11px] font-semibold text-foreground truncate">
          {title
            ? `${title} \u2014 \u0438\u0441\u0442\u043e\u0440\u0438\u044f \u0440\u0430\u0431\u043e\u0442\u044b`
            : "\u0412\u044b\u0431\u0435\u0440\u0438\u0442\u0435 \u043e\u0431\u044a\u0435\u043a\u0442 \u043d\u0430 \u043a\u0430\u0440\u0442\u0435 \u0438\u043b\u0438 \u0432 \u0442\u0430\u0431\u043b\u0438\u0446\u0435"}
        </span>
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
              className={`flex items-center gap-1 rounded px-2 py-0.5 text-[10px] transition-colors ${hidden ? "opacity-35" : "opacity-100"} hover:bg-accent/50`}
            >
              <span className="h-1.5 w-4 rounded-sm inline-block" style={{ background: s.color }} />
              <span className="text-muted-foreground">{s.label}</span>
            </button>
          )
        })}
        {/* Daily cause dot legend */}
        <div className="ml-2 flex items-center gap-1 border-l border-border/40 pl-2">
          <span className="text-[9px] text-muted-foreground/60 mr-1">\u0414\u043e\u0442:</span>
          {(Object.entries(CAUSE_CLR) as [DailyCause, string][]).filter(([k]) => k !== "stable").map(([cause, color]) => (
            <div key={cause} className="flex items-center gap-0.5">
              <span className="h-2 w-2 rounded-full inline-block" style={{ background: color }} />
              <span className="text-[9px] text-muted-foreground/70">{CAUSE_LABEL[cause]}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Chart */}
      <div className="flex-1 min-h-0 px-1 pt-1">
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

              {/* Interval background fills — transparent backdrop, no border */}
              {derivedSegments.map((seg, i) => (
                <ReferenceArea
                  key={i}
                  x1={seg.startDate}
                  x2={seg.endDate}
                  fill={PATTERN_FILL[seg.kind]}
                  stroke="none"
                  label={chartDates.indexOf(seg.startDate) >= 0 && (chartDates.indexOf(seg.endDate) - chartDates.indexOf(seg.startDate)) > 6
                    ? { value: seg.label, position: "insideTopLeft", style: { fontSize: 8, fill: PATTERN_STROKE[seg.kind], opacity: 0.7 } }
                    : undefined
                  }
                />
              ))}

              <CartesianGrid strokeDasharray="3 3" stroke={CLR.grid} vertical={false} />

              <XAxis
                dataKey="date"
                ticks={xTicks}
                tickFormatter={(v) => formatDate(String(v), period)}
                tick={{ fontSize: 9, fill: CLR.axis }}
                axisLine={{ stroke: CLR.grid }}
                tickLine={false}
              />

              <YAxis
                yAxisId="left"
                tick={{ fontSize: 9, fill: CLR.axis }}
                axisLine={false}
                tickLine={false}
                width={32}
                tickFormatter={(v) => v.toFixed(0)}
              />
              <YAxis
                yAxisId="right"
                orientation="right"
                tick={{ fontSize: 9, fill: CLR.axis }}
                axisLine={false}
                tickLine={false}
                width={32}
                tickFormatter={(v) => v.toFixed(0)}
              />
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
              <YAxis yAxisId="gor" hide />

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
                    dot={<CauseDot />}
                    activeDot={{ r: 3, strokeWidth: 0 }}
                  />
                )
              )}
            </ComposedChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Classifier strip */}
      {selection && chartData.length > 0 && (
        <ClassifierStrip segments={derivedSegments} dates={chartDates} />
      )}
    </div>
  )
}
