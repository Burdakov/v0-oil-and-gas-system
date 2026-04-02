import { AppSidebar } from "@/components/app-sidebar"
import { DashboardContent } from "@/components/dashboard-content"

export default function DashboardPage() {
  return (
    <main className="flex h-screen overflow-hidden bg-background text-foreground font-sans antialiased">
      <AppSidebar />
      <DashboardContent />
    </main>
  )
}
