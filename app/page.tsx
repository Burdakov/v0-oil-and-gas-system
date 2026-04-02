"use client"

import { AppSidebar } from "@/components/app-sidebar"
import { DashboardContent } from "@/components/dashboard-content"

export default function HomePage() {
  return (
    <div className="flex h-screen overflow-hidden bg-background text-foreground font-sans antialiased">
      <AppSidebar />
      <DashboardContent />
    </div>
  )
}
