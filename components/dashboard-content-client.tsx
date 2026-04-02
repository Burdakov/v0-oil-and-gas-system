"use client"

import dynamic from "next/dynamic"

const DashboardContent = dynamic(
  () => import("@/components/dashboard-content").then((m) => ({ default: m.DashboardContent })),
  { ssr: false }
)

export function DashboardContentClient() {
  return <DashboardContent />
}
