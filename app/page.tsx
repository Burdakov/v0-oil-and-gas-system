import { AppSidebar } from "@/components/app-sidebar"
import { DashboardContentClient } from "@/components/dashboard-content-client"

export default function Home() {
  return (
    <div className="flex h-screen overflow-hidden bg-background text-foreground font-sans antialiased">
      <AppSidebar />
      <DashboardContentClient />
    </div>
  )
}
