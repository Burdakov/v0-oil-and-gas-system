"use client"

import { useState, useMemo } from "react"
import { ChevronRight, ChevronDown, TrendingUp, Download, RefreshCw, Info } from "lucide-react"
import {
  fieldData,
  aggregatePadSeries,
  aggregateFieldSeries,
  type WellData,
  type PadData,
} from "@/lib/sweep-data"
import { WaterCutChart, SERIES_COLORS, type SeriesEntry } from "@/components/water-cut-chart"
import { cn } from "@/lib/utils"

// ── Hierarchy tree state ──────────────────────────────────────────────────────

type SelectionLevel = "field" | "pad" | "well"

type Selection = {
  level: SelectionLevel
  padId?: string
  wellId?: string
}

const statusDot: Record<WellData["status"], string> = {
  active:   "bg-status-active",
  warning:  "bg-status-warning",
  inactive: "bg-status-inactive",
}

// ── Tree node components ──────────────────────────────────────────────────────

function WellNode({
  well,
  padId,
  selection,
  onSelect,
}: {
  well: WellData
  padId: string
  selection: Selection
  onSelect: (s: Selection) => void
}) {
  const isActive =
    selection.level === "well" && selection.padId === padId && selection.wellId === well.id
  return (
    <button
      onClick={() => onSelect({ level: "well", padId, wellId: well.id })}
      className={cn(
        "group flex w-full items-center gap-2 rounded px-2 py-1.5 text-left text-[12px] transition-colors",
        isActive
          ? "bg-primary/10 text-primary"
          : "text-muted-foreground hover:bg-accent hover:text-foreground",
      )}
    >
      <span className={cn("h-1.5 w-1.5 shrink-0 rounded-full", statusDot[well.status])} />
      <span className="flex-1 font-mono">{well.name}</span>
      <span className="text-[10px] opacity-60">{well.startYear}</span>
    </button>
  )
}

function PadNode({
  pad,
  selection,
  onSelect,
}: {
  pad: PadData
  selection: Selection
  onSelect: (s: Selection) => void
}) {
  const isPadActive = selection.level === "pad" && selection.padId === pad.id
  const isExpanded =
    isPadActive || (selection.level === "well" && selection.padId === pad.id)
  const [expanded, setExpanded] = useState(isExpanded)

  const producers = pad.wells.filter((w) => w.type === "producer")
  const activeCount = producers.filter((w) => w.status === "active").length

  return (
    <div>
      <div className="flex items-center gap-1">
        <button
          onClick={() => setExpanded((v) => !v)}
          className="flex h-6 w-5 items-center justify-center text-muted-foreground hover:text-foreground transition-colors shrink-0"
          aria-expanded={expanded}
        >
          {expanded
            ? <ChevronDown size={12} strokeWidth={2} />
            : <ChevronRight size={12} strokeWidth={2} />}
        </button>
        <button
          onClick={() => onSelect({ level: "pad", padId: pad.id })}
          className={cn(
            "flex flex-1 items-center gap-2 rounded px-1.5 py-1.5 text-left text-[13px] font-medium transition-colors",
            isPadActive
              ? "bg-primary/10 text-primary"
              : "text-foreground hover:bg-accent",
          )}
        >
          <span className="flex-1">{pad.name}</span>
          <span className="text-[10px] font-normal tabular-nums text-muted-foreground">
            {activeCount}/{producers.length}
          </span>
        </button>
      </div>
      {expanded && (
        <div className="ml-5 mt-0.5 space-y-0.5 border-l border-border pl-2">
          {producers.map((well) => (
            <WellNode
              key={well.id}
              well={well}
              padId={pad.id}
              selection={selection}
              onSelect={onSelect}
            />
          ))}
        </div>
      )}
    </div>
  )
}

// ── Summary stats ─────────────────────────────────────────────────────────────

function StatCard({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="rounded-md border border-border bg-card px-4 py-3 space-y-1">
      <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">{label}</p>
      <p className="text-[22px] font-semibold tabular-nums leading-none text-foreground">{value}</p>
      {sub && <p className="text-[11px] text-muted-foreground">{sub}</p>}
    </div>
  )
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function SweepPage() {
  const [selection, setSelection] = useState<Selection>({ level: "field" })

  // Build chart series based on selection
  const { series, chartTitle, stats } = useMemo(() => {
    if (selection.level === "field") {
      // One line per pad + field aggregate
      const fieldSeries = aggregateFieldSeries(fieldData)
      const padSeries: SeriesEntry[] = fieldData.pads.map((pad, i) => ({
        id: pad.id,
        label: pad.name,
        data: aggregatePadSeries(pad),
        color: SERIES_COLORS[i % SERIES_COLORS.length],
      }))
      const totalCum = fieldData.pads
        .flatMap((p) => p.wells.filter((w) => w.type === "producer"))
        .reduce((acc, w) => acc + (w.series[w.series.length - 1]?.cumOil ?? 0), 0)
      const finalWc = fieldSeries[fieldSeries.length - 1]?.waterCut ?? 0

      return {
        series: [
          {
            id: "field",
            label: fieldData.name,
            data: fieldSeries,
            color: "#e8a045",
            dashed: true,
          } as SeriesEntry,
          ...padSeries,
        ],
        chartTitle: `Месторождение ${fieldData.name} — все кусты`,
        stats: [
          { label: "Накопленная добыча", value: `${(totalCum / 1000).toFixed(0)} млн т`, sub: "суммарно по фонду" },
          { label: "Средняя обводнённость", value: `${finalWc.toFixed(1)}%`, sub: "на текущий момент" },
          { label: "Добывающих скважин", value: `${fieldData.pads.flatMap((p) => p.wells.filter((w) => w.type === "producer")).length}`, sub: "в фонде" },
          { label: "Активных кустов", value: `${fieldData.pads.length}`, sub: "в разработке" },
        ],
      }
    }

    if (selection.level === "pad") {
      const pad = fieldData.pads.find((p) => p.id === selection.padId)!
      const producers = pad.wells.filter((w) => w.type === "producer")
      const padAggregate = aggregatePadSeries(pad)
      const wellSeries: SeriesEntry[] = producers.map((well, i) => ({
        id: well.id,
        label: well.name,
        data: well.series,
        color: SERIES_COLORS[i % SERIES_COLORS.length],
      }))
      const totalCum = producers.reduce(
        (acc, w) => acc + (w.series[w.series.length - 1]?.cumOil ?? 0),
        0
      )
      const finalWc = padAggregate[padAggregate.length - 1]?.waterCut ?? 0
      const activeCount = producers.filter((w) => w.status === "active").length

      return {
        series: [
          {
            id: "pad_agg",
            label: `${pad.name} (среднее)`,
            data: padAggregate,
            color: "#e8a045",
            dashed: true,
          } as SeriesEntry,
          ...wellSeries,
        ],
        chartTitle: `${pad.name} — характеристика обводнённости`,
        stats: [
          { label: "Накопленная добыча куста", value: `${totalCum.toFixed(0)} тыс. т`, sub: "суммарно по кусту" },
          { label: "Обводнённость куста", value: `${finalWc.toFixed(1)}%`, sub: "средняя" },
          { label: "Добывающих скважин", value: `${producers.length}`, sub: `${activeCount} активных` },
          { label: "Год ввода", value: `${Math.min(...producers.map((w) => w.startYear))}`, sub: "первая скважина" },
        ],
      }
    }

    // Well level
    const pad = fieldData.pads.find((p) => p.id === selection.padId)!
    const well = pad.wells.find((w) => w.id === selection.wellId)!
    const lastPoint = well.series[well.series.length - 1]
    const firstPoint = well.series[0]

    return {
      series: [
        {
          id: well.id,
          label: well.name,
          data: well.series,
          color: "#e8a045",
        } as SeriesEntry,
      ],
      chartTitle: `Скважина ${well.name} (${pad.name}) — характеристика обводнённости`,
      stats: [
        { label: "Накопленная добыча", value: `${lastPoint?.cumOil.toFixed(0)} тыс. т`, sub: "за всё время" },
        { label: "Текущая обводнённость", value: `${lastPoint?.waterCut.toFixed(1)}%`, sub: "на последней точке" },
        { label: "Нач. обводнённость", value: `${firstPoint?.waterCut.toFixed(1)}%`, sub: "при вводе" },
        { label: "Год ввода", value: `${well.startYear}`, sub: "в разработку" },
      ],
    }
  }, [selection])

  return (
    <main className="flex flex-1 flex-col overflow-hidden">
      {/* Top bar */}
      <header className="flex h-12 shrink-0 items-center justify-between border-b border-border px-6">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <span className="text-foreground font-medium">Заводнение</span>
          <ChevronRight size={13} />
          <span className="text-foreground">КИН и охват</span>
          <ChevronRight size={13} />
          <span>Характеристика обводнённости</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[11px] text-muted-foreground tabular-nums">
            Обновлено: 23.03.2026, 09:47
          </span>
          <button className="flex items-center gap-1.5 rounded border border-border px-2.5 py-1 text-[12px] text-muted-foreground transition-colors hover:bg-accent hover:text-foreground">
            <RefreshCw size={12} strokeWidth={1.5} />
            Обновить
          </button>
          <button className="flex items-center gap-1.5 rounded border border-border px-2.5 py-1 text-[12px] text-muted-foreground transition-colors hover:bg-accent hover:text-foreground">
            <Download size={12} strokeWidth={1.5} />
            Экспорт
          </button>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Hierarchy tree panel */}
        <aside className="flex h-full w-[200px] shrink-0 flex-col border-r border-border">
          <div className="border-b border-border px-3 py-2.5">
            <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
              Иерархия объектов
            </p>
          </div>
          <nav className="flex-1 overflow-y-auto px-2 py-2 space-y-2" aria-label="Иерархия месторождение-куст-скважина">
            {/* Field level */}
            <button
              onClick={() => setSelection({ level: "field" })}
              className={cn(
                "flex w-full items-center gap-2 rounded px-2 py-1.5 text-left text-[13px] font-semibold transition-colors",
                selection.level === "field"
                  ? "bg-primary/10 text-primary"
                  : "text-foreground hover:bg-accent",
              )}
            >
              <TrendingUp size={13} strokeWidth={1.5} className="shrink-0" />
              <span className="flex-1 truncate">{fieldData.name}</span>
            </button>
            {/* Pad + Well level */}
            <div className="space-y-0.5">
              {fieldData.pads.map((pad) => (
                <PadNode
                  key={pad.id}
                  pad={pad}
                  selection={selection}
                  onSelect={setSelection}
                />
              ))}
            </div>
          </nav>
        </aside>

        {/* Main content */}
        <div className="flex flex-1 flex-col overflow-y-auto px-6 py-5 space-y-5">

          {/* Summary KPI cards */}
          <section aria-label="Показатели выбранного объекта">
            <div className="grid grid-cols-4 gap-3">
              {stats.map((s) => (
                <StatCard key={s.label} {...s} />
              ))}
            </div>
          </section>

          {/* Chart card */}
          <section
            className="rounded-md border border-border bg-card"
            aria-label="График характеристики обводнённости"
          >
            <div className="flex items-start justify-between border-b border-border px-5 py-3.5">
              <div>
                <h2 className="text-[13px] font-semibold text-foreground">{chartTitle}</h2>
                <p className="mt-0.5 text-[11px] text-muted-foreground">
                  Ось X — накопленная добыча нефти, тыс. т &nbsp;·&nbsp; Ось Y — обводнённость, %
                </p>
              </div>
              <div className="flex items-center gap-1 text-[11px] text-muted-foreground">
                <Info size={12} strokeWidth={1.5} />
                <span>Пунктир — пороговые значения 80% и 90%</span>
              </div>
            </div>
            <div className="px-5 py-5">
              <WaterCutChart series={series} height={360} />
            </div>
          </section>

          {/* Data table */}
          <section
            className="rounded-md border border-border bg-card"
            aria-label="Таблица данных"
          >
            <div className="border-b border-border px-5 py-3">
              <h2 className="text-[13px] font-semibold text-foreground">Точки характеристики</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-[12px]" role="table">
                <thead>
                  <tr className="border-b border-border">
                    <th className="px-4 py-2 text-left text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                      Объект
                    </th>
                    <th className="px-4 py-2 text-right text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                      Нач. накопл., тыс. т
                    </th>
                    <th className="px-4 py-2 text-right text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                      Кон. накопл., тыс. т
                    </th>
                    <th className="px-4 py-2 text-right text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                      Нач. обводн., %
                    </th>
                    <th className="px-4 py-2 text-right text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                      Тек. обводн., %
                    </th>
                    <th className="px-4 py-2 text-left text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                      Статус
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {series
                    .filter((s) => !s.dashed)
                    .map((s, i) => {
                      const first = s.data[0]
                      const last = s.data[s.data.length - 1]
                      return (
                        <tr
                          key={s.id}
                          className={cn(
                            "border-b border-border/50 transition-colors hover:bg-accent/30",
                            i % 2 !== 0 && "bg-muted/10",
                          )}
                        >
                          <td className="px-4 py-2.5 font-mono font-medium text-foreground">
                            <span className="flex items-center gap-2">
                              <span
                                className="inline-block h-2 w-2 rounded-full shrink-0"
                                style={{ backgroundColor: s.color }}
                              />
                              {s.label}
                            </span>
                          </td>
                          <td className="px-4 py-2.5 text-right tabular-nums text-muted-foreground">
                            {first?.cumOil.toFixed(1)}
                          </td>
                          <td className="px-4 py-2.5 text-right tabular-nums text-foreground font-medium">
                            {last?.cumOil.toFixed(1)}
                          </td>
                          <td className="px-4 py-2.5 text-right tabular-nums text-muted-foreground">
                            {first?.waterCut.toFixed(1)}
                          </td>
                          <td className="px-4 py-2.5 text-right tabular-nums font-medium">
                            <span
                              className={cn(
                                last && last.waterCut >= 90
                                  ? "text-status-critical"
                                  : last && last.waterCut >= 80
                                  ? "text-status-warning"
                                  : "text-status-active",
                              )}
                            >
                              {last?.waterCut.toFixed(1)}
                            </span>
                          </td>
                          <td className="px-4 py-2.5 text-muted-foreground">
                            {last && last.waterCut >= 90 ? (
                              <span className="text-status-critical">Высокая</span>
                            ) : last && last.waterCut >= 80 ? (
                              <span className="text-status-warning">Умеренная</span>
                            ) : (
                              <span className="text-status-active">Норма</span>
                            )}
                          </td>
                        </tr>
                      )
                    })}
                </tbody>
              </table>
            </div>
          </section>

        </div>
      </div>
    </main>
  )
}
