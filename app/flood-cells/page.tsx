"use client"

import { useState } from "react"
import { AppSidebar } from "@/components/app-sidebar"
import { CellsMap } from "@/components/flood-cells/cells-map"
import { CellsCharts } from "@/components/flood-cells/cells-charts"
import { CellsTable } from "@/components/flood-cells/cells-table"
import { floodCells } from "@/lib/flood-cells-data"

export default function FloodCellsPage() {
  const [selectedCellId, setSelectedCellId] = useState<string | null>(null)

  const selectedCell = floodCells.find((c) => c.id === selectedCellId) ?? null

  return (
    <div className="flex h-screen overflow-hidden bg-background text-foreground font-sans antialiased">
      <AppSidebar />

      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Top bar */}
        <header className="flex h-11 shrink-0 items-center gap-2 border-b border-border px-4">
          <nav className="flex items-center gap-1 text-[12px] text-muted-foreground" aria-label="Breadcrumb">
            <span>Заводнение</span>
            <span className="text-border">/</span>
            <span className="text-foreground font-medium">Ячейки заводнения</span>
            {selectedCell && (
              <>
                <span className="text-border">/</span>
                <span className="text-muted-foreground">{selectedCell.licenseAreaName}</span>
                <span className="text-border">/</span>
                <span className="text-muted-foreground">{selectedCell.clusterName}</span>
                <span className="text-border">/</span>
                <span className="text-primary">{selectedCell.name}</span>
              </>
            )}
          </nav>
          <div className="ml-auto flex items-center gap-3">
            <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
              <span className="h-2 w-2 rounded-full bg-status-active" />
              23.03.2026
            </div>
            {selectedCell && (
              <button
                className="rounded border border-border/50 px-2 py-0.5 text-[10px] text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
                onClick={() => setSelectedCellId(null)}
              >
                Сбросить выбор
              </button>
            )}
            <button className="rounded border border-border px-3 py-1 text-[11px] text-muted-foreground hover:bg-accent hover:text-foreground transition-colors">
              Экспорт
            </button>
          </div>
        </header>

        {/* Upper half: map + chart */}
        <div className="flex flex-[2] min-h-0 border-b border-border overflow-hidden">
          {/* Map — 60% */}
          <div className="flex-[6] min-w-0 overflow-hidden border-r border-border">
            <CellsMap
              selectedCellId={selectedCellId}
              onCellSelect={setSelectedCellId}
            />
          </div>
          {/* Chart — 40% */}
          <div className="flex-[4] min-w-0 overflow-hidden">
            <CellsCharts selectedCellId={selectedCellId} />
          </div>
        </div>

        {/* Lower half: table */}
        <div className="flex-[1] min-h-0 overflow-auto">
          <CellsTable
            selectedCellId={selectedCellId}
            onCellSelect={setSelectedCellId}
          />
        </div>
      </div>
    </div>
  )
}
