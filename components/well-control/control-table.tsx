"use client"

import { useState, useMemo } from "react"
import { cn } from "@/lib/utils"
import type { WellDecline, DeclineFactor } from "@/lib/well-control-data"
import { ChevronDown, ChevronRight, CheckCircle, PenLine, FileText, Network, BookOpen } from "lucide-react"

type SortField = "kprod" | "rpl" | "obv" | "total"
type GtmOption = "sufs" | "network" | "df04"

const FACTOR_LABEL: Record<DeclineFactor, string> = {
  kprod: "Кпрод",
  rpl: "Рпл",
  obv: "Обв",
}

const FACTOR_COLOR: Record<DeclineFactor, string> = {
  kprod: "text-orange-400",
  rpl: "text-blue-400",
  obv: "text-rose-400",
}

const FACTOR_BG: Record<DeclineFactor, string> = {
  kprod: "bg-orange-400/10 text-orange-400",
  rpl: "bg-blue-400/10 text-blue-400",
  obv: "bg-rose-400/10 text-rose-400",
}

function severity(v: number, max: number): string {
  const ratio = v / max
  if (ratio > 0.7) return "text-rose-400"
  if (ratio > 0.4) return "text-amber-400"
  return "text-emerald-400"
}

function Bar({ value, max, color }: { value: number; max: number; color: string }) {
  const pct = Math.min(100, (value / max) * 100)
  return (
    <div className="flex items-center gap-1.5">
      <div className="h-1.5 w-16 rounded-full bg-muted overflow-hidden">
        <div className={cn("h-full rounded-full", color)} style={{ width: `${pct}%` }} />
      </div>
      <span className={cn("tabular-nums text-[11px]", severity(value, max))}>{value.toFixed(1)}%</span>
    </div>
  )
}

type RowState = {
  actionStatus: "pending" | "accepted" | "adjusted"
  gtmOption: GtmOption | null
  showGtm: boolean
}

type GroupedByArea = {
  areaId: string
  areaName: string
  clusters: {
    clusterId: string
    clusterName: string
    wells: WellDecline[]
  }[]
}

function groupData(rows: WellDecline[]): GroupedByArea[] {
  const areaMap = new Map<string, GroupedByArea>()
  for (const row of rows) {
    if (!areaMap.has(row.licenseAreaId)) {
      areaMap.set(row.licenseAreaId, { areaId: row.licenseAreaId, areaName: row.licenseAreaName, clusters: [] })
    }
    const area = areaMap.get(row.licenseAreaId)!
    let cluster = area.clusters.find((c) => c.clusterId === row.clusterId)
    if (!cluster) {
      cluster = { clusterId: row.clusterId, clusterName: row.clusterName, wells: [] }
      area.clusters.push(cluster)
    }
    cluster.wells.push(row)
  }
  return Array.from(areaMap.values())
}

export function WellControlTable({
  data,
  selectedWellId,
  onWellSelect,
}: {
  data: WellDecline[]
  selectedWellId: string | null
  onWellSelect: (id: string | null) => void
}) {
  const [sortField, setSortField] = useState<SortField>("total")
  const [expandedAreas, setExpandedAreas] = useState<Set<string>>(new Set(["la-1", "la-2", "la-3"]))
  const [expandedClusters, setExpandedClusters] = useState<Set<string>>(new Set())
  const [rowStates, setRowStates] = useState<Map<string, RowState>>(
    () => new Map(data.map((d) => [d.wellId, { actionStatus: "pending", gtmOption: null, showGtm: false }]))
  )

  const sorted = useMemo(() => {
    return [...data].sort((a, b) => {
      if (sortField === "kprod") return b.kprodDecline - a.kprodDecline
      if (sortField === "rpl") return b.rplDecline - a.rplDecline
      if (sortField === "obv") return b.obvDecline - a.obvDecline
      // total severity
      const score = (w: WellDecline) => w.kprodDecline / 38 + w.rplDecline / 25 + w.obvDecline / 18
      return score(b) - score(a)
    })
  }, [data, sortField])

  const grouped = useMemo(() => groupData(sorted), [sorted])

  function toggleArea(id: string) {
    setExpandedAreas((prev) => {
      const n = new Set(prev)
      n.has(id) ? n.delete(id) : n.add(id)
      return n
    })
  }

  function toggleCluster(id: string) {
    setExpandedClusters((prev) => {
      const n = new Set(prev)
      n.has(id) ? n.delete(id) : n.add(id)
      return n
    })
  }

  function updateRow(wellId: string, patch: Partial<RowState>) {
    setRowStates((prev) => {
      const n = new Map(prev)
      n.set(wellId, { ...n.get(wellId)!, ...patch })
      return n
    })
  }

  function SortBtn({ field, label }: { field: SortField; label: string }) {
    return (
      <button
        onClick={() => setSortField(field)}
        className={cn(
          "text-[10px] font-semibold uppercase tracking-wide transition-colors",
          sortField === field ? "text-primary" : "text-muted-foreground hover:text-foreground",
        )}
      >
        {label}{sortField === field && " ↓"}
      </button>
    )
  }

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-4 border-b border-border px-4 py-2 shrink-0">
        <span className="text-[11px] text-muted-foreground">Сортировка:</span>
        <SortBtn field="total" label="Итого" />
        <SortBtn field="kprod" label="Кпрод" />
        <SortBtn field="rpl" label="Рпл" />
        <SortBtn field="obv" label="Обв" />
        <span className="ml-auto text-[11px] text-muted-foreground">{data.length} скважин</span>
      </div>

      {/* Column header */}
      <div className="grid gap-0 border-b border-border bg-muted/30 px-4 py-1.5 shrink-0"
        style={{ gridTemplateColumns: "1fr 90px 90px 90px 160px 130px 170px" }}>
        <span className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">Скважина</span>
        <span className="text-[10px] font-semibold uppercase tracking-wide text-orange-400/70">↓Кпрод</span>
        <span className="text-[10px] font-semibold uppercase tracking-wide text-blue-400/70">↓Рпл</span>
        <span className="text-[10px] font-semibold uppercase tracking-wide text-rose-400/70">↑Обв</span>
        <span className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">Рекомендация</span>
        <span className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">Принять</span>
        <span className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">Мероприятие</span>
      </div>

      {/* Rows */}
      <div className="flex-1 overflow-y-auto">
        {grouped.map((area) => (
          <div key={area.areaId}>
            {/* Area row */}
            <button
              onClick={() => toggleArea(area.areaId)}
              className="flex w-full items-center gap-2 border-b border-border bg-card/60 px-4 py-1.5 text-left hover:bg-accent/40 transition-colors"
            >
              {expandedAreas.has(area.areaId)
                ? <ChevronDown size={12} className="shrink-0 text-muted-foreground" />
                : <ChevronRight size={12} className="shrink-0 text-muted-foreground" />}
              <span className="text-[11px] font-bold uppercase tracking-widest text-foreground/70">{area.areaName}</span>
              <span className="ml-1 text-[10px] text-muted-foreground">
                {area.clusters.reduce((s, c) => s + c.wells.length, 0)} скважин
              </span>
            </button>

            {expandedAreas.has(area.areaId) && area.clusters.map((cluster) => (
              <div key={cluster.clusterId}>
                {/* Cluster row */}
                <button
                  onClick={() => toggleCluster(cluster.clusterId)}
                  className="flex w-full items-center gap-2 border-b border-border bg-card/30 px-7 py-1 text-left hover:bg-accent/30 transition-colors"
                >
                  {expandedClusters.has(cluster.clusterId)
                    ? <ChevronDown size={11} className="shrink-0 text-muted-foreground/60" />
                    : <ChevronRight size={11} className="shrink-0 text-muted-foreground/60" />}
                  <span className="text-[10.5px] font-semibold text-muted-foreground">{cluster.clusterName}</span>
                  <span className="ml-1 text-[10px] text-muted-foreground/50">{cluster.wells.length} скв.</span>
                </button>

                {expandedClusters.has(cluster.clusterId) && cluster.wells.map((well) => {
                  const rs = rowStates.get(well.wellId) ?? { actionStatus: "pending", gtmOption: null, showGtm: false }
                  const isSelected = selectedWellId === well.wellId

                  return (
                    <div
                      key={well.wellId}
                      className={cn(
                        "grid items-start gap-0 border-b border-border/50 px-11 py-2 transition-colors",
                        isSelected ? "bg-primary/8" : "hover:bg-accent/20",
                      )}
                      style={{ gridTemplateColumns: "1fr 90px 90px 90px 160px 130px 170px" }}
                      onClick={() => onWellSelect(isSelected ? null : well.wellId)}
                    >
                      {/* Well name + dominant factor */}
                      <div className="flex flex-col gap-0.5">
                        <span className={cn("text-[12px] font-semibold font-mono", isSelected ? "text-primary" : "text-foreground")}>
                          {well.wellName}
                        </span>
                        <span className={cn("text-[10px] rounded px-1 py-0.5 w-fit", FACTOR_BG[well.dominantFactor])}>
                          {FACTOR_LABEL[well.dominantFactor]}
                        </span>
                      </div>

                      {/* Кпрод decline bar */}
                      <div onClick={(e) => e.stopPropagation()}>
                        <Bar value={well.kprodDecline} max={38} color="bg-orange-400" />
                      </div>

                      {/* Рпл decline bar */}
                      <div onClick={(e) => e.stopPropagation()}>
                        <Bar value={well.rplDecline} max={25} color="bg-blue-400" />
                      </div>

                      {/* Обв increase bar */}
                      <div onClick={(e) => e.stopPropagation()}>
                        <Bar value={well.obvDecline} max={18} color="bg-rose-400" />
                      </div>

                      {/* Recommendation text */}
                      <span className="text-[10.5px] text-muted-foreground leading-snug pr-2">
                        {well.recommendation}
                      </span>

                      {/* Accept / Adjust buttons */}
                      <div className="flex flex-col gap-1" onClick={(e) => e.stopPropagation()}>
                        {rs.actionStatus === "pending" ? (
                          <div className="flex gap-1">
                            <button
                              onClick={() => updateRow(well.wellId, { actionStatus: "accepted" })}
                              className="flex items-center gap-1 rounded border border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 text-[10px] font-medium text-emerald-400 hover:bg-emerald-500/20 transition-colors"
                            >
                              <CheckCircle size={10} />
                              Принять
                            </button>
                            <button
                              onClick={() => updateRow(well.wellId, { actionStatus: "adjusted" })}
                              className="flex items-center gap-1 rounded border border-amber-500/30 bg-amber-500/10 px-2 py-0.5 text-[10px] font-medium text-amber-400 hover:bg-amber-500/20 transition-colors"
                            >
                              <PenLine size={10} />
                              Скорр.
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center gap-1">
                            <span className={cn(
                              "rounded px-2 py-0.5 text-[10px] font-medium",
                              rs.actionStatus === "accepted"
                                ? "bg-emerald-500/10 text-emerald-400"
                                : "bg-amber-500/10 text-amber-400",
                            )}>
                              {rs.actionStatus === "accepted" ? "Принято" : "Скорректировано"}
                            </span>
                            <button
                              onClick={() => updateRow(well.wellId, { actionStatus: "pending", gtmOption: null, showGtm: false })}
                              className="text-[10px] text-muted-foreground/50 hover:text-muted-foreground transition-colors"
                            >
                              ×
                            </button>
                          </div>
                        )}
                      </div>

                      {/* GTM selector */}
                      <div className="flex flex-col gap-1" onClick={(e) => e.stopPropagation()}>
                        {!rs.showGtm ? (
                          <button
                            onClick={() => updateRow(well.wellId, { showGtm: true })}
                            className="flex items-center gap-1 rounded border border-border px-2 py-0.5 text-[10px] text-muted-foreground hover:bg-accent hover:text-foreground transition-colors w-fit"
                          >
                            <FileText size={10} />
                            Мероприятие
                          </button>
                        ) : rs.gtmOption ? (
                          <div className="flex items-center gap-1">
                            <span className="rounded bg-primary/10 px-2 py-0.5 text-[10px] font-medium text-primary">
                              {rs.gtmOption === "sufs" ? "СУФС" : rs.gtmOption === "network" ? "Сетевой" : "ДФ04 ПП"}
                            </span>
                            <button
                              onClick={() => updateRow(well.wellId, { gtmOption: null, showGtm: true })}
                              className="text-[10px] text-muted-foreground/50 hover:text-muted-foreground"
                            >
                              ×
                            </button>
                          </div>
                        ) : (
                          <div className="flex flex-col gap-0.5">
                            {(["sufs", "network", "df04"] as GtmOption[]).map((opt) => (
                              <button
                                key={opt}
                                onClick={() => updateRow(well.wellId, { gtmOption: opt })}
                                className="flex items-center gap-1 rounded border border-border/50 px-2 py-0.5 text-[10px] text-muted-foreground hover:bg-accent hover:text-foreground transition-colors text-left"
                              >
                                {opt === "sufs" && <FileText size={9} />}
                                {opt === "network" && <Network size={9} />}
                                {opt === "df04" && <BookOpen size={9} />}
                                {opt === "sufs" ? "Заявка в СУФС" : opt === "network" ? "Включить в сетевой" : "Включить в ДФ04 ПП"}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  )
}
