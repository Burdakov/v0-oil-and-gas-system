"use client"

import { useState } from "react"
import { AppSidebar } from "@/components/app-sidebar"
import { DevelopmentMap } from "@/components/idn/development-map"
import { WellTable } from "@/components/idn/well-table"
import { fieldData } from "@/lib/idn-data"

export default function IdnPage() {
  const [selectedClusterId, setSelectedClusterId] = useState<string | null>(null)
  const [selectedWellId, setSelectedWellId] = useState<string | null>(null)

  // Derive breadcrumb labels
  const selectedCluster = fieldData.licenseAreas
    .flatMap((la) => la.clusters)
    .find((cl) => cl.id === selectedClusterId)

  const selectedWell = fieldData.licenseAreas
    .flatMap((la) => la.clusters.flatMap((cl) => cl.wells))
    .find((w) => w.id === selectedWellId)

  return (
    <div className="flex h-screen overflow-hidden bg-background text-foreground font-sans antialiased">
      <AppSidebar />

      {/* Main content */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Top bar */}
        <header className="flex h-11 shrink-0 items-center gap-2 border-b border-border px-4">
          <nav className="flex items-center gap-1 text-[12px] text-muted-foreground" aria-label="Breadcrumb">
            <span>Заводнение</span>
            <span className="text-border">/</span>
            <span className="text-foreground font-medium">Топ ИДН</span>
            {selectedCluster && (
              <>
                <span className="text-border">/</span>
                <span className="text-foreground">{selectedCluster.name}</span>
              </>
            )}
            {selectedWell && (
              <>
                <span className="text-border">/</span>
                <span className="text-primary">Скв. {selectedWell.name}</span>
              </>
            )}
          </nav>
          <div className="ml-auto flex items-center gap-3">
            <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
              <span className="h-2 w-2 rounded-full bg-status-active" />
              Данные актуальны на 23.03.2026, 06:00
            </div>
            <button className="rounded border border-border px-3 py-1 text-[11px] text-muted-foreground hover:bg-accent hover:text-foreground transition-colors">
              Экспорт
            </button>
          </div>
        </header>

        {/* Map + Table split layout */}
        <div className="flex flex-1 flex-col overflow-hidden">
          {/* Map panel */}
          <div className="flex-[2] border-b border-border overflow-hidden min-h-0">
            <DevelopmentMap
              onWellSelect={(id) => {
                setSelectedWellId(id)
              }}
              onClusterSelect={(id) => {
                setSelectedClusterId(id)
              }}
            />
          </div>

          {/* Table panel */}
          <div className="flex-[1] overflow-auto min-h-0">
            <WellTable
              selectedClusterId={selectedClusterId}
              selectedWellId={selectedWellId}
              onClusterSelect={(id) => {
                setSelectedClusterId((prev) => (prev === id ? null : id))
                setSelectedWellId(null)
              }}
              onWellSelect={(id) => {
                setSelectedWellId((prev) => (prev === id ? null : id))
              }}
            />
          </div>
        </div>
      </div>
    </div>
  )
}
