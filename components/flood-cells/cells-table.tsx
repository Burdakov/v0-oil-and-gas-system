"use client"

import { useState } from "react"
import { cn } from "@/lib/utils"
import { floodCells, compensationColor, compensationLabel } from "@/lib/flood-cells-data"
import { ChevronDown, ChevronRight } from "lucide-react"
import type { FloodCell } from "@/lib/flood-cells-data"

function fmt(v: number, d = 1) { return v.toFixed(d) }

function CompBadge({ value }: { value: number }) {
  const color = compensationColor(value)
  const label = compensationLabel(value)
  return (
    <span
      className="rounded px-1.5 py-0.5 text-[9px] font-semibold"
      style={{ background: color + "22", color }}
    >
      {fmt(value, 0)}%
    </span>
  )
}

// ── Cell row ──────────────────────────────────────────────────────────────────
function CellRow({ cell, selected, onSelect }: { cell: FloodCell; selected: boolean; onSelect: (id: string) => void }) {
  return (
    <tr
      className={cn(
        "cursor-pointer border-b border-border/20 transition-colors",
        selected ? "bg-primary/10" : "hover:bg-accent/40",
      )}
      onClick={() => onSelect(cell.id)}
    >
      <td className="w-4" /><td className="w-4" /><td className="w-4" />
      <td className="px-2 py-1.5 text-[11px] font-medium text-foreground whitespace-nowrap">
        {cell.name}
      </td>
      <td className="px-2 py-1 text-right tabular-nums text-[11px] text-primary">{fmt(cell.oilProduction)}</td>
      <td className="px-2 py-1 text-right tabular-nums text-[11px] text-foreground">{fmt(cell.liquidProduction)}</td>
      <td className="px-2 py-1 text-right tabular-nums text-[11px] text-foreground">{fmt(cell.waterCut, 1)}%</td>
      <td className="px-2 py-1 text-right tabular-nums text-[11px] text-foreground">{fmt(cell.kprod, 2)}</td>
      <td className="px-2 py-1 text-right tabular-nums text-[11px] text-foreground">{fmt(cell.reservoirPressure, 0)}</td>
      <td className="px-2 py-1 text-right">
        <CompBadge value={cell.compensation} />
      </td>
      <td className="px-2 py-1 text-right tabular-nums text-[11px] text-foreground">{fmt(cell.porePV, 2)}</td>
      <td className="px-2 py-1 text-right tabular-nums text-[11px] text-foreground">{fmt(cell.liquidPotential, 0)}</td>
      <td className="px-2 py-1 text-right tabular-nums text-[11px] text-foreground">{fmt(cell.injectionPotential, 0)}</td>
    </tr>
  )
}

// ── Cluster section ───────────────────────────────────────────────────────────
type ClusterGroup = { id: string; name: string; cells: FloodCell[] }
type LicenseGroup = { id: string; name: string; clusters: ClusterGroup[] }

function ClusterSection({
  cluster,
  selectedCellId,
  onCellSelect,
}: {
  cluster: ClusterGroup
  selectedCellId: string | null
  onCellSelect: (id: string) => void
}) {
  const [open, setOpen] = useState(true)
  const totalOil = cluster.cells.reduce((s, c) => s + c.oilProduction, 0)
  const totalLiq = cluster.cells.reduce((s, c) => s + c.liquidProduction, 0)
  const avgWC = totalLiq > 0 ? (cluster.cells.reduce((s, c) => s + c.waterCut, 0) / cluster.cells.length) : 0
  const avgComp = cluster.cells.reduce((s, c) => s + c.compensation, 0) / cluster.cells.length

  return (
    <>
      <tr
        className="cursor-pointer border-b border-border/40 hover:bg-accent/20 transition-colors"
        onClick={() => setOpen((v) => !v)}
      >
        <td className="w-4" /><td className="w-4" />
        <td className="px-1 py-1.5">
          <span className="text-muted-foreground">
            {open ? <ChevronDown size={11} /> : <ChevronRight size={11} />}
          </span>
        </td>
        <td className="px-2 py-1.5 text-[11px] font-semibold text-foreground whitespace-nowrap">
          {cluster.name}
          <span className="ml-2 text-[10px] text-muted-foreground">{cluster.cells.length} яч.</span>
        </td>
        <td className="px-2 py-1 text-right tabular-nums text-[11px] font-medium text-primary">{fmt(totalOil)}</td>
        <td className="px-2 py-1 text-right tabular-nums text-[11px] text-foreground">{fmt(totalLiq)}</td>
        <td className="px-2 py-1 text-right tabular-nums text-[11px] text-foreground">{fmt(avgWC, 1)}%</td>
        <td className="px-2 py-1 text-center text-[10px] text-muted-foreground">—</td>
        <td className="px-2 py-1 text-center text-[10px] text-muted-foreground">—</td>
        <td className="px-2 py-1 text-right">
          <CompBadge value={avgComp} />
        </td>
        <td colSpan={3} />
      </tr>
      {open && cluster.cells.map((cell) => (
        <CellRow
          key={cell.id}
          cell={cell}
          selected={cell.id === selectedCellId}
          onSelect={onCellSelect}
        />
      ))}
    </>
  )
}

// ── License area section ──────────────────────────────────────────────────────
function LicenseSection({
  la,
  selectedCellId,
  onCellSelect,
}: {
  la: LicenseGroup
  selectedCellId: string | null
  onCellSelect: (id: string) => void
}) {
  const [open, setOpen] = useState(true)
  const allCells = la.clusters.flatMap((c) => c.cells)
  const totalOil = allCells.reduce((s, c) => s + c.oilProduction, 0)
  const totalLiq = allCells.reduce((s, c) => s + c.liquidProduction, 0)
  const avgWC = allCells.length > 0 ? allCells.reduce((s, c) => s + c.waterCut, 0) / allCells.length : 0

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
        <td className="px-2 py-2 text-right tabular-nums text-[12px] font-bold text-primary">{fmt(totalOil)}</td>
        <td className="px-2 py-2 text-right tabular-nums text-[12px] font-bold text-foreground">{fmt(totalLiq)}</td>
        <td className="px-2 py-2 text-right tabular-nums text-[12px] font-bold text-foreground">{fmt(avgWC, 1)}%</td>
        <td colSpan={6} />
      </tr>
      {open && la.clusters.map((cl) => (
        <ClusterSection
          key={cl.id}
          cluster={cl}
          selectedCellId={selectedCellId}
          onCellSelect={onCellSelect}
        />
      ))}
    </>
  )
}

// ── Main table ────────────────────────────────────────────────────────────────
export function CellsTable({
  selectedCellId,
  onCellSelect,
}: {
  selectedCellId: string | null
  onCellSelect: (id: string | null) => void
}) {
  // Build hierarchy from flat cell list
  const laMap = new Map<string, LicenseGroup>()
  for (const cell of floodCells) {
    if (!laMap.has(cell.licenseAreaId)) {
      laMap.set(cell.licenseAreaId, { id: cell.licenseAreaId, name: cell.licenseAreaName, clusters: [] })
    }
    const la = laMap.get(cell.licenseAreaId)!
    let cl = la.clusters.find((c) => c.id === cell.clusterId)
    if (!cl) { cl = { id: cell.clusterId, name: cell.clusterName, cells: [] }; la.clusters.push(cl) }
    cl.cells.push(cell)
  }
  const laList = Array.from(laMap.values())

  const totalOil = floodCells.reduce((s, c) => s + c.oilProduction, 0)
  const totalLiq = floodCells.reduce((s, c) => s + c.liquidProduction, 0)
  const avgWC = floodCells.reduce((s, c) => s + c.waterCut, 0) / floodCells.length

  return (
    <div className="overflow-auto">
      <table className="w-full border-collapse text-left text-[12px]">
        <thead>
          <tr className="border-b border-border bg-muted/60 sticky top-0 z-10">
            <th className="w-4" /><th className="w-4" /><th className="w-4" />
            <th className="px-2 py-2 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground whitespace-nowrap min-w-[130px]">
              Участок / Куст / Ячейка
            </th>
            <th className="px-2 py-2 text-right text-[10px] font-semibold uppercase tracking-widest text-primary whitespace-nowrap">
              Нефть<br /><span className="text-[8px] font-normal text-primary/60">тыс.т/мес</span>
            </th>
            <th className="px-2 py-2 text-right text-[10px] font-semibold uppercase tracking-widest text-muted-foreground whitespace-nowrap">
              Жидк.<br /><span className="text-[8px] font-normal text-muted-foreground/60">тыс.т/мес</span>
            </th>
            <th className="px-2 py-2 text-right text-[10px] font-semibold uppercase tracking-widest text-muted-foreground whitespace-nowrap">
              Обводн.<br /><span className="text-[8px] font-normal">%</span>
            </th>
            <th className="px-2 py-2 text-right text-[10px] font-semibold uppercase tracking-widest text-muted-foreground whitespace-nowrap">
              Кпрод<br /><span className="text-[8px] font-normal">сум.</span>
            </th>
            <th className="px-2 py-2 text-right text-[10px] font-semibold uppercase tracking-widest text-muted-foreground whitespace-nowrap">
              Рпл<br /><span className="text-[8px] font-normal">атм</span>
            </th>
            <th className="px-2 py-2 text-right text-[10px] font-semibold uppercase tracking-widest text-muted-foreground whitespace-nowrap">
              Компенс.
            </th>
            <th className="px-2 py-2 text-right text-[10px] font-semibold uppercase tracking-widest text-muted-foreground whitespace-nowrap">
              ПО<br /><span className="text-[8px] font-normal">д.е.</span>
            </th>
            <th className="px-2 py-2 text-right text-[10px] font-semibold uppercase tracking-widest text-muted-foreground whitespace-nowrap">
              Пот.жидк.<br /><span className="text-[8px] font-normal">тыс.т/мес</span>
            </th>
            <th className="px-2 py-2 text-right text-[10px] font-semibold uppercase tracking-widest text-muted-foreground whitespace-nowrap">
              Пот.закач.<br /><span className="text-[8px] font-normal">тыс.м³/мес</span>
            </th>
          </tr>
        </thead>
        <tbody>
          {/* Field total */}
          <tr className="border-b border-border bg-muted/40">
            <td colSpan={4} className="px-2 py-2">
              <span className="text-[12px] font-bold text-foreground">Ромашкинское</span>
              <span className="ml-2 text-[10px] text-muted-foreground">{laList.length} участка · {floodCells.length} ячеек</span>
            </td>
            <td className="px-2 py-2 text-right tabular-nums text-[12px] font-bold text-primary">{fmt(totalOil)}</td>
            <td className="px-2 py-2 text-right tabular-nums text-[12px] font-bold text-foreground">{fmt(totalLiq)}</td>
            <td className="px-2 py-2 text-right tabular-nums text-[12px] font-bold text-foreground">{fmt(avgWC, 1)}%</td>
            <td colSpan={6} />
          </tr>
          {laList.map((la) => (
            <LicenseSection
              key={la.id}
              la={la}
              selectedCellId={selectedCellId}
              onCellSelect={(id) => onCellSelect(selectedCellId === id ? null : id)}
            />
          ))}
        </tbody>
      </table>
    </div>
  )
}
