"use client"

import { useState, useMemo } from "react"
import { cn } from "@/lib/utils"
import { fieldData } from "@/lib/idn-data"
import { ChevronDown, ChevronRight } from "lucide-react"
import type { Well, Cluster, LicenseArea } from "@/lib/idn-data"

// ── Types ─────────────────────────────────────────────────────────────────────
type ModeCol = {
  key: keyof Well["current"]
  label: string
  unit: string
  decimals: number
}

const cols: ModeCol[] = [
  { key: "oilRate", label: "Дебит нефти", unit: "т/сут", decimals: 1 },
  { key: "liquidRate", label: "Дебит жидк.", unit: "т/сут", decimals: 1 },
  { key: "waterCut", label: "Обводн.", unit: "%", decimals: 1 },
  { key: "bottomholePressure", label: "Рзаб", unit: "атм", decimals: 0 },
]

function fmt(v: number, d: number) {
  return v.toFixed(d)
}

function statusColor(status: Well["status"]) {
  if (status === "active") return "text-status-active"
  if (status === "repair") return "text-status-warning"
  return "text-muted-foreground"
}

function statusDot(status: Well["status"]) {
  if (status === "active") return "bg-status-active"
  if (status === "repair") return "bg-status-warning"
  return "bg-muted-foreground"
}

function wellTypeLabel(type: Well["type"]) {
  return type === "injector" ? "Нагн" : "Доб"
}

// ── Cell component ─────────────────────────────────────────────────────────────
function ModeCell({
  current,
  recommended,
  col,
  type,
}: {
  current: number
  recommended: number
  col: ModeCol
  type: Well["type"]
}) {
  if (type === "injector" && (col.key === "oilRate" || col.key === "liquidRate" || col.key === "waterCut")) {
    const v = type === "injector" && col.key === "oilRate" ? current : null
    if (col.key === "waterCut") return <td className="px-2 py-1 text-center text-muted-foreground/40 text-[11px]">—</td>
    if (col.key === "liquidRate") return <td className="px-2 py-1 text-center text-muted-foreground/40 text-[11px]">—</td>
  }
  const delta = recommended - current
  const deltaPercent = current !== 0 ? ((delta / current) * 100) : 0
  return (
    <td className="px-2 py-1 text-right tabular-nums text-[11px]">
      <span className="text-foreground">{fmt(current, col.decimals)}</span>
      <span className="text-muted-foreground/50 ml-1 text-[9px]">{col.unit}</span>
    </td>
  )
}

function RecCell({
  current,
  recommended,
  col,
  type,
}: {
  current: number
  recommended: number
  col: ModeCol
  type: Well["type"]
}) {
  if (type === "injector" && (col.key === "waterCut" || col.key === "liquidRate")) {
    return <td className="px-2 py-1 text-center text-muted-foreground/40 text-[11px]">—</td>
  }
  const delta = recommended - current
  const isPositive = col.key === "waterCut" ? delta < 0 : delta > 0
  const colorClass = Math.abs(delta) < 0.5 ? "text-muted-foreground" : isPositive ? "text-status-active" : "text-status-critical"
  return (
    <td className="px-2 py-1 text-right tabular-nums text-[11px]">
      <span className={colorClass}>{fmt(recommended, col.decimals)}</span>
      <span className="text-muted-foreground/50 ml-1 text-[9px]">{col.unit}</span>
    </td>
  )
}

// ── Well row ──────────────────────────────────────────────────────────────────
function WellRow({ well, selectedWellId, onSelect }: { well: Well; selectedWellId: string | null; onSelect: (id: string) => void }) {
  const isSelected = well.id === selectedWellId
  return (
    <tr
      className={cn(
        "cursor-pointer border-b border-border/30 transition-colors",
        isSelected ? "bg-primary/10" : "hover:bg-accent/50",
      )}
      onClick={() => onSelect(well.id)}
    >
      <td className="w-4" />
      <td className="w-4" />
      <td className="w-4" />
      <td className="px-2 py-1">
        <div className="flex items-center gap-1.5">
          <span className={cn("h-1.5 w-1.5 rounded-full shrink-0", statusDot(well.status))} />
          <span className={cn("text-[12px] font-mono font-medium", statusColor(well.status))}>
            {well.name}
          </span>
          <span className="text-[10px] text-muted-foreground/50 ml-1">
            [{wellTypeLabel(well.type)}]
          </span>
        </div>
      </td>
      {/* Current mode */}
      {cols.map((col) => (
        <ModeCell key={col.key} current={well.current[col.key]} recommended={well.recommended[col.key]} col={col} type={well.type} />
      ))}
      {/* Recommended mode */}
      {cols.map((col) => (
        <RecCell key={col.key} current={well.current[col.key]} recommended={well.recommended[col.key]} col={col} type={well.type} />
      ))}
    </tr>
  )
}

// ── Cluster row ───────────────────────────────────────────────────────────────
function ClusterRow({
  cluster,
  selectedClusterId,
  selectedWellId,
  onClusterSelect,
  onWellSelect,
}: {
  cluster: Cluster
  selectedClusterId: string | null
  selectedWellId: string | null
  onClusterSelect: (id: string) => void
  onWellSelect: (id: string) => void
}) {
  const [open, setOpen] = useState(true)
  const isSelected = cluster.id === selectedClusterId
  const activeCount = cluster.wells.filter((w) => w.status === "active").length
  const totalOil = cluster.wells.reduce((s, w) => s + (w.type === "producer" ? w.current.oilRate : 0), 0)
  const totalLiq = cluster.wells.reduce((s, w) => s + (w.type === "producer" ? w.current.liquidRate : 0), 0)
  const avgWC = totalLiq > 0 ? ((totalLiq - totalOil) / totalLiq) * 100 : 0

  return (
    <>
      <tr
        className={cn(
          "cursor-pointer border-b border-border/40 transition-colors",
          isSelected ? "bg-primary/8" : "hover:bg-accent/30",
        )}
        onClick={() => { onClusterSelect(cluster.id); setOpen((v) => !v) }}
      >
        <td className="w-4" />
        <td className="w-4" />
        <td className="px-1 py-1.5">
          <span className="text-muted-foreground">
            {open ? <ChevronDown size={11} /> : <ChevronRight size={11} />}
          </span>
        </td>
        <td className="px-2 py-1.5">
          <span className="text-[12px] font-semibold text-foreground">{cluster.name}</span>
          <span className="ml-2 text-[10px] text-muted-foreground">
            {activeCount}/{cluster.wells.length} скв
          </span>
        </td>
        <td className="px-2 py-1 text-right tabular-nums text-[11px] text-foreground">{totalOil.toFixed(1)}</td>
        <td className="px-2 py-1 text-right tabular-nums text-[11px] text-foreground">{totalLiq.toFixed(1)}</td>
        <td className="px-2 py-1 text-right tabular-nums text-[11px] text-foreground">{avgWC.toFixed(1)}%</td>
        <td className="px-2 py-1 text-center text-[10px] text-muted-foreground">—</td>
        <td colSpan={4} className="px-2 py-1 text-center text-[10px] text-muted-foreground/50">По скважинам ниже</td>
      </tr>
      {open &&
        cluster.wells.map((w) => (
          <WellRow key={w.id} well={w} selectedWellId={selectedWellId} onSelect={onWellSelect} />
        ))}
    </>
  )
}

// ── License area row ──────────────────────────────────────────────────────────
function LicenseAreaRow({
  la,
  selectedClusterId,
  selectedWellId,
  onClusterSelect,
  onWellSelect,
}: {
  la: LicenseArea
  selectedClusterId: string | null
  selectedWellId: string | null
  onClusterSelect: (id: string) => void
  onWellSelect: (id: string) => void
}) {
  const [open, setOpen] = useState(true)
  const totalOil = la.clusters.flatMap((c) => c.wells).reduce((s, w) => s + (w.type === "producer" ? w.current.oilRate : 0), 0)
  const totalLiq = la.clusters.flatMap((c) => c.wells).reduce((s, w) => s + (w.type === "producer" ? w.current.liquidRate : 0), 0)
  const avgWC = totalLiq > 0 ? ((totalLiq - totalOil) / totalLiq) * 100 : 0

  return (
    <>
      <tr
        className="cursor-pointer border-b border-border/60 bg-muted/20 hover:bg-accent/20 transition-colors"
        onClick={() => setOpen((v) => !v)}
      >
        <td className="w-4" />
        <td className="px-1 py-2">
          <span className="text-muted-foreground">
            {open ? <ChevronDown size={11} /> : <ChevronRight size={11} />}
          </span>
        </td>
        <td colSpan={2} className="px-2 py-2">
          <span className="text-[12px] font-semibold text-foreground tracking-wide">{la.name}</span>
          <span className="ml-2 text-[10px] text-muted-foreground">{la.clusters.length} куста</span>
        </td>
        <td className="px-2 py-2 text-right tabular-nums text-[11px] font-medium text-foreground">{totalOil.toFixed(1)}</td>
        <td className="px-2 py-2 text-right tabular-nums text-[11px] font-medium text-foreground">{totalLiq.toFixed(1)}</td>
        <td className="px-2 py-2 text-right tabular-nums text-[11px] font-medium text-foreground">{avgWC.toFixed(1)}%</td>
        <td colSpan={5} />
      </tr>
      {open &&
        la.clusters.map((cl) => (
          <ClusterRow
            key={cl.id}
            cluster={cl}
            selectedClusterId={selectedClusterId}
            selectedWellId={selectedWellId}
            onClusterSelect={onClusterSelect}
            onWellSelect={onWellSelect}
          />
        ))}
    </>
  )
}

// ── Field summary row ─────────────────────────────────────────────────────────
function FieldRow({ children }: { children: React.ReactNode }) {
  return (
    <tr className="border-b border-border bg-muted/40">
      {children}
    </tr>
  )
}

// ── Main table ────────────────────────────────────────────────────────────────
export function WellTable({
  selectedClusterId,
  selectedWellId,
  onClusterSelect,
  onWellSelect,
}: {
  selectedClusterId: string | null
  selectedWellId: string | null
  onClusterSelect: (id: string) => void
  onWellSelect: (id: string) => void
}) {
  const field = fieldData
  const allWells = useMemo(
    () => field.licenseAreas.flatMap((la) => la.clusters.flatMap((c) => c.wells)),
    [],
  )
  const totalOil = allWells.reduce((s, w) => s + (w.type === "producer" ? w.current.oilRate : 0), 0)
  const totalLiq = allWells.reduce((s, w) => s + (w.type === "producer" ? w.current.liquidRate : 0), 0)
  const avgWC = totalLiq > 0 ? ((totalLiq - totalOil) / totalLiq) * 100 : 0

  return (
    <div className="overflow-auto">
      <table className="w-full border-collapse text-left text-[12px]">
        <thead>
          <tr className="border-b border-border bg-muted/60">
            {/* Indent spacers */}
            <th className="w-4" />
            <th className="w-4" />
            <th className="w-4" />
            <th className="px-2 py-2 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground whitespace-nowrap">
              Объект / Скважина
            </th>
            {/* Current mode header */}
            <th colSpan={4} className="px-2 py-2 text-center text-[10px] font-semibold uppercase tracking-widest text-muted-foreground border-l border-border/40">
              Текущий режим
            </th>
            {/* Recommended mode header */}
            <th colSpan={4} className="px-2 py-2 text-center text-[10px] font-semibold uppercase tracking-widest text-primary border-l border-border/40">
              Рекомендуемый режим
            </th>
          </tr>
          <tr className="border-b border-border bg-muted/40">
            <th className="w-4" /><th className="w-4" /><th className="w-4" />
            <th className="px-2 py-1 text-[10px] text-muted-foreground" />
            {cols.map((col) => (
              <th key={`cur-${col.key}`} className="px-2 py-1 text-right text-[10px] font-medium text-muted-foreground whitespace-nowrap border-l border-border/20">
                {col.label}<br />
                <span className="text-[9px] font-normal text-muted-foreground/60">{col.unit}</span>
              </th>
            ))}
            {cols.map((col) => (
              <th key={`rec-${col.key}`} className="px-2 py-1 text-right text-[10px] font-medium text-primary/70 whitespace-nowrap border-l border-border/20">
                {col.label}<br />
                <span className="text-[9px] font-normal text-primary/40">{col.unit}</span>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {/* Field row */}
          <FieldRow>
            <td colSpan={4} className="px-2 py-2">
              <span className="text-[12px] font-bold text-foreground tracking-wide">{field.name}</span>
              <span className="ml-2 text-[10px] text-muted-foreground">{field.licenseAreas.length} участка</span>
            </td>
            <td className="px-2 py-2 text-right tabular-nums text-[12px] font-bold text-primary">{totalOil.toFixed(1)}</td>
            <td className="px-2 py-2 text-right tabular-nums text-[12px] font-bold text-foreground">{totalLiq.toFixed(1)}</td>
            <td className="px-2 py-2 text-right tabular-nums text-[12px] font-bold text-foreground">{avgWC.toFixed(1)}%</td>
            <td colSpan={5} />
          </FieldRow>
          {/* License areas */}
          {field.licenseAreas.map((la) => (
            <LicenseAreaRow
              key={la.id}
              la={la}
              selectedClusterId={selectedClusterId}
              selectedWellId={selectedWellId}
              onClusterSelect={onClusterSelect}
              onWellSelect={onWellSelect}
            />
          ))}
        </tbody>
      </table>
    </div>
  )
}
