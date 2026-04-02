"use client"

import { useState, useMemo } from "react"
import { cn } from "@/lib/utils"
import type { WellDecline, DeclineFactor } from "@/lib/well-control-data"
import { ChevronDown, ChevronRight, CheckCircle, PenLine, FileText, Network, BookOpen } from "lucide-react"

type SortField = "kprod" | "rpl" | "obv" | "total"
type GtmOption = "sufs" | "network" | "df04"

const FACTOR_LABEL: Record<DeclineFactor, string> = {
  kprod: "\u041a\u043f\u0440\u043e\u0434",
  rpl: "\u0420\u043f\u043b",
  obv: "\u041e\u0431\u0432",
}

const FACTOR_BG: Record<DeclineFactor, string> = {
  kprod: "bg-orange-400/10 text-orange-400",
  rpl: "bg-blue-400/10 text-blue-400",
  obv: "bg-rose-400/10 text-rose-400",
}

// Grid template: name | 7 factor columns | 3×(today+yesterday) | rec | accept | gtm
// Factor cols: VSP | Кпрод | Рпл | Технол | ГЖФ | КН | Фонд
// Abs cols: Qж сег | Qж вчера | Qн сег | Qн вчера | Рзаб сег | Рзаб вчера
const GRID = "minmax(130px,1.2fr) 64px 64px 64px 64px 64px 64px 48px 60px 60px 60px 60px 60px 60px minmax(120px,1fr) 110px 140px"

// Signed-change cell: positive = green, negative = red, zero = muted
function ChangeCell({ value, unit, decimals = 1 }: { value: number; unit?: string; decimals?: number }) {
  if (value === 0) return <span className="text-[10px] text-muted-foreground/30 tabular-nums">—</span>
  const pos = value > 0
  return (
    <span className={cn("text-[11px] font-semibold tabular-nums", pos ? "text-emerald-400" : "text-rose-400")}>
      {pos ? "+" : ""}{value.toFixed(decimals)}{unit ? <span className="text-[9px] font-normal opacity-70 ml-0.5">{unit}</span> : null}
    </span>
  )
}

// Today/yesterday pair cell
function TodayCell({ today, yesterday, unit }: { today: number; yesterday: number; unit: string }) {
  const delta = today - yesterday
  const deltaColor = delta > 0 ? "text-emerald-400" : delta < 0 ? "text-rose-400" : "text-muted-foreground/40"
  return (
    <div className="flex flex-col gap-0">
      <span className="text-[11px] font-semibold tabular-nums text-foreground">{today.toFixed(1)}</span>
      <span className={cn("text-[9px] tabular-nums", deltaColor)}>
        {delta >= 0 ? "+" : ""}{delta.toFixed(1)}
      </span>
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

function sumChange(wells: WellDecline[], key: keyof WellDecline): number {
  return parseFloat((wells.reduce((s, w) => s + (w[key] as number), 0)).toFixed(1))
}
function avgToday(wells: WellDecline[], key: keyof WellDecline): number {
  if (wells.length === 0) return 0
  return parseFloat((wells.reduce((s, w) => s + (w[key] as number), 0) / wells.length).toFixed(1))
}
function sumToday(wells: WellDecline[], key: keyof WellDecline): number {
  return parseFloat((wells.reduce((s, w) => s + (w[key] as number), 0)).toFixed(1))
}

export function WellControlTable({
  data,
  selectedWellId,
  selectedClusterId,
  selectedAreaId,
  onWellSelect,
  onClusterSelect,
  onAreaSelect,
}: {
  data: WellDecline[]
  selectedWellId: string | null
  selectedClusterId?: string | null
  selectedAreaId?: string | null
  onWellSelect: (id: string | null) => void
  onClusterSelect?: (id: string | null) => void
  onAreaSelect?: (id: string | null) => void
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
      const score = (w: WellDecline) => w.kprodDecline / 38 + w.rplDecline / 25 + w.obvDecline / 18
      return score(b) - score(a)
    })
  }, [data, sortField])

  const grouped = useMemo(() => groupData(sorted), [sorted])

  function toggleArea(id: string) {
    setExpandedAreas((prev) => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n })
  }
  function toggleCluster(id: string) {
    setExpandedClusters((prev) => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n })
  }
  function updateRow(wellId: string, patch: Partial<RowState>) {
    setRowStates((prev) => { const n = new Map(prev); n.set(wellId, { ...n.get(wellId)!, ...patch }); return n })
  }

  function SortBtn({ field, label }: { field: SortField; label: string }) {
    return (
      <button
        onClick={() => setSortField(field)}
        className={cn("text-[10px] font-semibold uppercase tracking-wide transition-colors",
          sortField === field ? "text-primary" : "text-muted-foreground hover:text-foreground")}
      >
        {label}{sortField === field && " \u2193"}
      </button>
    )
  }

  // Column header with two rows: group label spans + individual labels
  const COL_HEADER_GRID = GRID

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Toolbar */}
      <div className="flex items-center gap-4 border-b border-border px-4 py-2 shrink-0">
        <span className="text-[11px] text-muted-foreground">{"\u0421\u043e\u0440\u0442\u0438\u0440\u043e\u0432\u043a\u0430"}:</span>
        <SortBtn field="total" label="\u0418\u0442\u043e\u0433\u043e" />
        <SortBtn field="kprod" label="\u041a\u043f\u0440\u043e\u0434" />
        <SortBtn field="rpl" label="\u0420\u043f\u043b" />
        <SortBtn field="obv" label="\u041e\u0431\u0432" />
        <span className="ml-auto text-[11px] text-muted-foreground">{data.length} {"\u0441\u043a\u0432\u0430\u0436\u0438\u043d"}</span>
      </div>

      {/* Two-row column header */}
      <div className="shrink-0 border-b border-border bg-muted/30">
        {/* Row 1: group spans */}
        <div className="grid px-4 pt-1.5" style={{ gridTemplateColumns: COL_HEADER_GRID }}>
          <span />
          {/* Factors group — 7 cols */}
          <span className="col-span-7 text-[9px] font-bold uppercase tracking-widest text-muted-foreground/60 border-b border-border/40 pb-0.5">
            {"\u0418\u0437\u043c\u0435\u043d\u0435\u043d\u0438\u044f \u043f\u043e \u0444\u0430\u043a\u0442\u043e\u0440\u0430\u043c"}
          </span>
          {/* Absolute values group — 6 cols */}
          <span className="col-span-6 text-[9px] font-bold uppercase tracking-widest text-muted-foreground/60 border-b border-border/40 pb-0.5 pl-1">
            {"\u0410\u0431\u0441\u043e\u043b\u044e\u0442\u043d\u044b\u0435 \u0437\u043d\u0430\u0447\u0435\u043d\u0438\u044f"}
          </span>
          <span /><span /><span />
        </div>
        {/* Row 2: individual labels */}
        <div className="grid items-end px-4 pb-1.5" style={{ gridTemplateColumns: COL_HEADER_GRID }}>
          <span className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">{"\u0421\u043a\u0432\u0430\u0436\u0438\u043d\u0430"}</span>
          <span className="text-[9.5px] font-semibold text-fuchsia-400/80">{"\u0412\u0421\u041f"}<br/>{"\u0442/\u0441"}</span>
          <span className="text-[9.5px] font-semibold text-orange-400/80">{"\u041a\u043f\u0440\u043e\u0434"}<br/>{"% \u0438\u0437\u043c"}</span>
          <span className="text-[9.5px] font-semibold text-blue-400/80">{"\u0420\u043f\u043b"}<br/>{"\u0430\u0442\u043c"}</span>
          <span className="text-[9.5px] font-semibold text-emerald-400/80">{"\u0422\u0435\u0445\u043d\u043e\u043b"}<br/>{"\u0442/\u0441"}</span>
          <span className="text-[9.5px] font-semibold text-amber-400/80">{"\u0413\u0416\u0424"}<br/>{"\u043c\u00b3/\u0442"}</span>
          <span className="text-[9.5px] font-semibold text-teal-400/80">{"\u041a\u041d"}<br/>{"% \u0438\u0437\u043c"}</span>
          <span className="text-[9.5px] font-semibold text-red-400/80">{"\u0424\u043e\u043d\u0434"}</span>
          {/* Absolute cols */}
          <span className="text-[9.5px] font-semibold text-cyan-400/70 pl-1">{"\u0416\u0441\u0435\u0433"}<br/>{"\u043c\u00b3/\u0441"}</span>
          <span className="text-[9.5px] font-semibold text-cyan-300/50">{"\u0416\u0432\u0447\u0435\u0440"}<br/>{"\u043c\u00b3/\u0441"}</span>
          <span className="text-[9.5px] font-semibold text-amber-300/80">{"\u041d\u0441\u0435\u0433"}<br/>{"\u0442/\u0441"}</span>
          <span className="text-[9.5px] font-semibold text-amber-200/50">{"\u041d\u0432\u0447\u0435\u0440"}<br/>{"\u0442/\u0441"}</span>
          <span className="text-[9.5px] font-semibold text-violet-400/80">{"\u0420\u0437\u0430\u0431\u0441\u0435\u0433"}<br/>{"\u0430\u0442\u043c"}</span>
          <span className="text-[9.5px] font-semibold text-violet-300/50">{"\u0420\u0437\u0430\u0431\u0432\u0447\u0435\u0440"}<br/>{"\u0430\u0442\u043c"}</span>
          <span className="text-[9.5px] font-semibold text-muted-foreground">{"\u0420\u0435\u043a\u043e\u043c\u0435\u043d\u0434."}</span>
          <span className="text-[9.5px] font-semibold text-muted-foreground">{"\u041f\u0440\u0438\u043d\u044f\u0442\u044c"}</span>
          <span className="text-[9.5px] font-semibold text-muted-foreground">{"\u041c\u0435\u0440\u043e\u043f\u0440\u0438\u044f\u0442\u0438\u0435"}</span>
        </div>
      </div>

      {/* Rows */}
      <div className="flex-1 overflow-y-auto">
        {grouped.map((area) => (
          <div key={area.areaId}>
            {/* Area row */}
            {(() => {
              const ws = area.clusters.flatMap((c) => c.wells)
              return (
                <button
                  onClick={() => {
                    toggleArea(area.areaId)
                    onAreaSelect?.(selectedAreaId === area.areaId ? null : area.areaId)
                    onClusterSelect?.(null)
                    onWellSelect(null)
                  }}
                  className={cn(
                    "grid w-full items-center border-b border-border px-4 py-1.5 text-left transition-colors",
                    selectedAreaId === area.areaId ? "bg-primary/8" : "bg-card/60 hover:bg-accent/40",
                  )}
                  style={{ gridTemplateColumns: GRID }}
                >
                  <div className="flex items-center gap-2">
                    {expandedAreas.has(area.areaId)
                      ? <ChevronDown size={12} className="shrink-0 text-muted-foreground" />
                      : <ChevronRight size={12} className="shrink-0 text-muted-foreground" />}
                    <span className="text-[11px] font-bold uppercase tracking-widest text-foreground/70 truncate">{area.areaName}</span>
                    <span className="text-[10px] text-muted-foreground shrink-0">{ws.length} {"\u0441\u043a\u0432."}</span>
                  </div>
                  <ChangeCell value={sumChange(ws, "vspChange")} decimals={1} />
                  <ChangeCell value={sumChange(ws, "kprodChange")} decimals={1} />
                  <ChangeCell value={sumChange(ws, "rplChange")} decimals={1} />
                  <ChangeCell value={sumChange(ws, "techChange")} decimals={1} />
                  <ChangeCell value={sumChange(ws, "glfChange")} decimals={1} />
                  <ChangeCell value={sumChange(ws, "knChange")} decimals={2} />
                  <ChangeCell value={sumChange(ws, "fundChange")} decimals={0} />
                  {/* Absolute: sum liquids/oils, avg bhp */}
                  <TodayCell today={sumToday(ws, "liquidToday")} yesterday={sumToday(ws, "liquidYesterday")} unit="\u043c\u00b3/\u0441" />
                  <span className="text-[10.5px] tabular-nums text-muted-foreground/50">{sumToday(ws, "liquidYesterday").toFixed(1)}</span>
                  <TodayCell today={sumToday(ws, "oilToday")} yesterday={sumToday(ws, "oilYesterday")} unit="\u0442/\u0441" />
                  <span className="text-[10.5px] tabular-nums text-muted-foreground/50">{sumToday(ws, "oilYesterday").toFixed(1)}</span>
                  <TodayCell today={avgToday(ws, "bhpToday")} yesterday={avgToday(ws, "bhpYesterday")} unit="\u0430\u0442\u043c" />
                  <span className="text-[10.5px] tabular-nums text-muted-foreground/50">{avgToday(ws, "bhpYesterday").toFixed(1)}</span>
                  <span /><span /><span />
                </button>
              )
            })()}

            {expandedAreas.has(area.areaId) && area.clusters.map((cluster) => (
              <div key={cluster.clusterId}>
                {/* Cluster row */}
                {(() => {
                  const ws = cluster.wells
                  return (
                    <button
                      onClick={() => {
                        toggleCluster(cluster.clusterId)
                        onClusterSelect?.(selectedClusterId === cluster.clusterId ? null : cluster.clusterId)
                        onWellSelect(null)
                      }}
                      className={cn(
                        "grid w-full items-center border-b border-border px-7 py-1 text-left transition-colors",
                        selectedClusterId === cluster.clusterId ? "bg-primary/8" : "bg-card/30 hover:bg-accent/30",
                      )}
                      style={{ gridTemplateColumns: GRID }}
                    >
                      <div className="flex items-center gap-1.5">
                        {expandedClusters.has(cluster.clusterId)
                          ? <ChevronDown size={11} className="shrink-0 text-muted-foreground/60" />
                          : <ChevronRight size={11} className="shrink-0 text-muted-foreground/60" />}
                        <span className="text-[10.5px] font-semibold text-muted-foreground truncate">{cluster.clusterName}</span>
                        <span className="text-[10px] text-muted-foreground/50 shrink-0">{ws.length} {"\u0441\u043a\u0432."}</span>
                      </div>
                      <ChangeCell value={sumChange(ws, "vspChange")} decimals={1} />
                      <ChangeCell value={sumChange(ws, "kprodChange")} decimals={1} />
                      <ChangeCell value={sumChange(ws, "rplChange")} decimals={1} />
                      <ChangeCell value={sumChange(ws, "techChange")} decimals={1} />
                      <ChangeCell value={sumChange(ws, "glfChange")} decimals={1} />
                      <ChangeCell value={sumChange(ws, "knChange")} decimals={2} />
                      <ChangeCell value={sumChange(ws, "fundChange")} decimals={0} />
                      <TodayCell today={sumToday(ws, "liquidToday")} yesterday={sumToday(ws, "liquidYesterday")} unit="\u043c\u00b3/\u0441" />
                      <span className="text-[10.5px] tabular-nums text-muted-foreground/40">{sumToday(ws, "liquidYesterday").toFixed(1)}</span>
                      <TodayCell today={sumToday(ws, "oilToday")} yesterday={sumToday(ws, "oilYesterday")} unit="\u0442/\u0441" />
                      <span className="text-[10.5px] tabular-nums text-muted-foreground/40">{sumToday(ws, "oilYesterday").toFixed(1)}</span>
                      <TodayCell today={avgToday(ws, "bhpToday")} yesterday={avgToday(ws, "bhpYesterday")} unit="\u0430\u0442\u043c" />
                      <span className="text-[10.5px] tabular-nums text-muted-foreground/40">{avgToday(ws, "bhpYesterday").toFixed(1)}</span>
                      <span /><span /><span />
                    </button>
                  )
                })()}

                {expandedClusters.has(cluster.clusterId) && cluster.wells.map((well) => {
                  const rs = rowStates.get(well.wellId) ?? { actionStatus: "pending", gtmOption: null, showGtm: false }
                  const isSelected = selectedWellId === well.wellId

                  return (
                    <div
                      key={well.wellId}
                      className={cn(
                        "grid items-start gap-0 border-b border-border/50 px-11 py-2 transition-colors cursor-pointer",
                        isSelected ? "bg-primary/8" : well.wellStatus === "stopped" ? "bg-red-500/5 hover:bg-red-500/10" : "hover:bg-accent/20",
                      )}
                      style={{ gridTemplateColumns: GRID }}
                      onClick={() => onWellSelect(isSelected ? null : well.wellId)}
                    >
                      {/* Well name */}
                      <div className="flex flex-col gap-0.5">
                        <div className="flex items-center gap-1.5">
                          <span className={cn("text-[12px] font-semibold font-mono",
                            isSelected ? "text-primary" : well.wellStatus === "stopped" ? "text-red-400" : "text-foreground")}>
                            {well.wellName}
                          </span>
                          {well.wellStatus === "stopped" && (
                            <span className="rounded bg-red-500/15 px-1 py-0.5 text-[9px] font-bold uppercase tracking-wide text-red-400">
                              {"\u0441\u0442\u043e\u043f"}
                            </span>
                          )}
                        </div>
                        <span className={cn("text-[10px] rounded px-1 py-0.5 w-fit", FACTOR_BG[well.dominantFactor])}>
                          {FACTOR_LABEL[well.dominantFactor]}
                        </span>
                      </div>

                      {/* 7 factor change cells */}
                      <div onClick={(e) => e.stopPropagation()}>
                        <ChangeCell value={well.vspChange} decimals={1} />
                      </div>
                      <div onClick={(e) => e.stopPropagation()}>
                        <ChangeCell value={well.kprodChange} decimals={1} />
                      </div>
                      <div onClick={(e) => e.stopPropagation()}>
                        <ChangeCell value={well.rplChange} decimals={1} />
                      </div>
                      <div onClick={(e) => e.stopPropagation()}>
                        <ChangeCell value={well.techChange} decimals={1} />
                      </div>
                      <div onClick={(e) => e.stopPropagation()}>
                        <ChangeCell value={well.glfChange} decimals={1} />
                      </div>
                      <div onClick={(e) => e.stopPropagation()}>
                        <ChangeCell value={well.knChange} decimals={2} />
                      </div>
                      <div onClick={(e) => e.stopPropagation()}>
                        {well.fundChange !== 0 ? (
                          <span className={cn("rounded px-1 py-0.5 text-[10px] font-bold tabular-nums",
                            well.fundChange < 0 ? "bg-red-500/15 text-red-400" : "bg-emerald-500/15 text-emerald-400")}>
                            {well.fundChange > 0 ? "+" : ""}{well.fundChange}
                          </span>
                        ) : (
                          <span className="text-[10px] text-muted-foreground/30">—</span>
                        )}
                      </div>

                      {/* Absolute values: today + yesterday delta */}
                      <div className="pl-1" onClick={(e) => e.stopPropagation()}>
                        <TodayCell today={well.liquidToday} yesterday={well.liquidYesterday} unit="\u043c\u00b3/\u0441" />
                      </div>
                      <div onClick={(e) => e.stopPropagation()}>
                        <span className="text-[10.5px] tabular-nums text-muted-foreground/50">{well.liquidYesterday.toFixed(1)}</span>
                      </div>
                      <div onClick={(e) => e.stopPropagation()}>
                        <TodayCell today={well.oilToday} yesterday={well.oilYesterday} unit="\u0442/\u0441" />
                      </div>
                      <div onClick={(e) => e.stopPropagation()}>
                        <span className="text-[10.5px] tabular-nums text-muted-foreground/50">{well.oilYesterday.toFixed(1)}</span>
                      </div>
                      <div onClick={(e) => e.stopPropagation()}>
                        <TodayCell today={well.bhpToday} yesterday={well.bhpYesterday} unit="\u0430\u0442\u043c" />
                      </div>
                      <div onClick={(e) => e.stopPropagation()}>
                        <span className="text-[10.5px] tabular-nums text-muted-foreground/50">{well.bhpYesterday.toFixed(1)}</span>
                      </div>

                      {/* Recommendation */}
                      <span className="text-[10.5px] text-muted-foreground leading-snug pr-2">
                        {well.recommendation}
                      </span>

                      {/* Accept / Adjust */}
                      <div className="flex flex-col gap-1" onClick={(e) => e.stopPropagation()}>
                        {rs.actionStatus === "pending" ? (
                          <div className="flex gap-1">
                            <button
                              onClick={() => updateRow(well.wellId, { actionStatus: "accepted" })}
                              className="flex items-center gap-1 rounded border border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 text-[10px] font-medium text-emerald-400 hover:bg-emerald-500/20 transition-colors"
                            >
                              <CheckCircle size={10} />
                              {"\u041f\u0440\u0438\u043d\u044f\u0442\u044c"}
                            </button>
                            <button
                              onClick={() => updateRow(well.wellId, { actionStatus: "adjusted" })}
                              className="flex items-center gap-1 rounded border border-amber-500/30 bg-amber-500/10 px-2 py-0.5 text-[10px] font-medium text-amber-400 hover:bg-amber-500/20 transition-colors"
                            >
                              <PenLine size={10} />
                              {"\u0421\u043a\u043e\u0440\u0440."}
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center gap-1">
                            <span className={cn("rounded px-2 py-0.5 text-[10px] font-medium",
                              rs.actionStatus === "accepted" ? "bg-emerald-500/10 text-emerald-400" : "bg-amber-500/10 text-amber-400")}>
                              {rs.actionStatus === "accepted" ? "\u041f\u0440\u0438\u043d\u044f\u0442\u043e" : "\u0421\u043a\u043e\u0440\u0440\u0435\u043a\u0442\u0438\u0440\u043e\u0432\u0430\u043d\u043e"}
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
                            {"\u041c\u0435\u0440\u043e\u043f\u0440\u0438\u044f\u0442\u0438\u0435"}
                          </button>
                        ) : rs.gtmOption ? (
                          <div className="flex items-center gap-1">
                            <span className="rounded bg-primary/10 px-2 py-0.5 text-[10px] font-medium text-primary">
                              {rs.gtmOption === "sufs" ? "\u0421\u0423\u0424\u0421" : rs.gtmOption === "network" ? "\u0421\u0435\u0442\u0435\u0432\u043e\u0439" : "\u0414\u0424-04 \u041f\u041f"}
                            </span>
                            <button
                              onClick={() => updateRow(well.wellId, { gtmOption: null, showGtm: true })}
                              className="text-[10px] text-muted-foreground/50 hover:text-muted-foreground"
                            >×</button>
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
                                {opt === "sufs" ? "\u0417\u0430\u044f\u0432\u043a\u0430 \u0432 \u0421\u0423\u0424\u0421" : opt === "network" ? "\u0412\u043a\u043b\u044e\u0447\u0438\u0442\u044c \u0432 \u0441\u0435\u0442\u0435\u0432\u043e\u0439" : "\u0412\u043a\u043b\u044e\u0447\u0438\u0442\u044c \u0432 \u0414\u0424-04 \u041f\u041f"}
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
