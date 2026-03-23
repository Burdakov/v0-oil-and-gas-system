"use client"

import { useState } from "react"
import { AppSidebar } from "@/components/app-sidebar"
import { WellControlMap } from "@/components/well-control/control-map"
import { WellControlTable } from "@/components/well-control/control-table"
import { wellControlData } from "@/lib/well-control-data"

export default function WellControlPage() {
  const [selectedWellId, setSelectedWellId] = useState<string | null>(null)
  const [selectedClusterId, setSelectedClusterId] = useState<string | null>(null)

  return (
    <div className="flex h-screen overflow-hidden bg-background text-foreground font-sans antialiased">
      <AppSidebar />

      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Top bar */}
        <header className="flex h-11 shrink-0 items-center gap-2 border-b border-border px-4">
          <nav className="flex items-center gap-1 text-[12px] text-muted-foreground" aria-label="Хлебные крошки">
            <span>Контроль фонда</span>
            {selectedClusterId && (
              <>
                <span className="text-border">/</span>
                <span className="text-foreground">
                  {selectedClusterId.replace("cl-", "Куст ")}
                </span>
              </>
            )}
            {selectedWellId && (
              <>
                <span className="text-border">/</span>
                <span className="text-primary font-medium">
                  Скв. {wellControlData.find((w) => w.wellId === selectedWellId)?.wellName}
                </span>
              </>
            )}
          </nav>
          <div className="ml-auto flex items-center gap-3">
            {/* Summary badges */}
            <div className="flex items-center gap-2">
              <span className="rounded bg-orange-400/10 px-2 py-0.5 text-[10px] font-semibold text-orange-400">
                {wellControlData.filter((w) => w.dominantFactor === "kprod").length} Кпрод
              </span>
              <span className="rounded bg-blue-400/10 px-2 py-0.5 text-[10px] font-semibold text-blue-400">
                {wellControlData.filter((w) => w.dominantFactor === "rpl").length} Рпл
              </span>
              <span className="rounded bg-rose-400/10 px-2 py-0.5 text-[10px] font-semibold text-rose-400">
                {wellControlData.filter((w) => w.dominantFactor === "obv").length} Обв
              </span>
            </div>
            <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
              <span className="h-2 w-2 rounded-full bg-status-active" />
              23.03.2026, 06:00
            </div>
            <button className="rounded border border-border px-3 py-1 text-[11px] text-muted-foreground hover:bg-accent hover:text-foreground transition-colors">
              Экспорт
            </button>
          </div>
        </header>

        {/* Map (top) + Table (bottom) */}
        <div className="flex flex-[2] min-h-0 border-b border-border overflow-hidden">
          <WellControlMap
            selectedWellId={selectedWellId}
            onWellSelect={(id) => setSelectedWellId(id)}
            onClusterSelect={(id) => setSelectedClusterId(id)}
          />
        </div>

        <div className="flex-[3] overflow-hidden min-h-0">
          <WellControlTable
            data={wellControlData}
            selectedWellId={selectedWellId}
            onWellSelect={(id) => setSelectedWellId(id)}
          />
        </div>
      </div>
    </div>
  )
}
