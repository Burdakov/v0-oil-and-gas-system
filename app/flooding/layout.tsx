import { AppSidebar } from "@/components/app-sidebar"

export default function FloodingLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen overflow-hidden bg-background text-foreground font-sans antialiased">
      <AppSidebar />
      {children}
    </div>
  )
}
