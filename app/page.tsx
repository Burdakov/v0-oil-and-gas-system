import dynamic from "next/dynamic"
import { AppSidebar } from "@/components/app-sidebar"

const DashboardContent = dynamic(
  () => import("@/components/dashboard-content").then((m) => ({ default: m.DashboardContent })),
  { ssr: false }
)

export default function Home() {
  return (
    <div className="flex h-screen overflow-hidden bg-background text-foreground font-sans antialiased">
      <AppSidebar />
      <DashboardContent />
    </div>
  )
}
