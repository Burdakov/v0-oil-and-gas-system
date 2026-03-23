"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import {
  Droplets,
  ChevronDown,
  ChevronRight,
  TrendingUp,
  Bell,
  LogOut,
  Grid3x3,
} from "lucide-react"

type NavItem = {
  label: string
  icon: React.ElementType
  href?: string
  badge?: string
  children?: NavItem[]
}

const navItems: NavItem[] = [
  {
    label: "Топ ИДН",
    icon: TrendingUp,
    href: "/idn",
  },
  {
    label: "Ячейки заводнения",
    icon: Grid3x3,
    href: "/flood-cells",
  },
]

function NavItemRow({
  item,
  depth = 0,
  pathname,
}: {
  item: NavItem
  depth?: number
  pathname: string
}) {
  const [open, setOpen] = useState(false)
  const hasChildren = item.children && item.children.length > 0
  const Icon = item.icon
  const isActive = item.href ? pathname === item.href : false

  return (
    <div>
      <Link
        href={item.href ?? "#"}
        onClick={hasChildren ? (e) => { e.preventDefault(); setOpen(!open) } : undefined}
        className={cn(
          "group relative flex items-center gap-2.5 rounded px-2.5 py-1.5 transition-all duration-150",
          depth === 0 ? "text-sm font-medium" : "text-[13px] font-normal",
          isActive
            ? "bg-primary/10 text-primary"
            : "text-muted-foreground hover:bg-accent hover:text-foreground",
          depth > 0 && "ml-4 pl-2",
        )}
      >
        {isActive && depth === 0 && (
          <span className="absolute left-0 top-1/2 h-4 w-0.5 -translate-y-1/2 rounded-r bg-primary" />
        )}
        <Icon
          size={15}
          className={cn(
            "shrink-0 transition-colors",
            isActive ? "text-primary" : "text-muted-foreground group-hover:text-foreground",
          )}
          strokeWidth={1.5}
        />
        <span className="flex-1 truncate">{item.label}</span>
        {item.badge && (
          <span className="rounded bg-muted px-1.5 py-0.5 text-[10px] font-semibold leading-none tracking-wide text-muted-foreground">
            {item.badge}
          </span>
        )}
        {hasChildren && (
          <span className="ml-auto text-muted-foreground">
            {open ? <ChevronDown size={13} /> : <ChevronRight size={13} />}
          </span>
        )}
      </Link>
      {hasChildren && open && (
        <div className="mt-0.5 space-y-0.5">
          {item.children!.map((child) => (
            <NavItemRow key={child.label} item={child} depth={depth + 1} pathname={pathname} />
          ))}
        </div>
      )}
    </div>
  )
}

export function AppSidebar() {
  const pathname = usePathname()

  return (
    <aside className="relative flex h-screen w-[220px] shrink-0 flex-col border-r border-border bg-sidebar">
      {/* Logo / Project */}
      <div className="flex h-12 items-center gap-2.5 border-b border-border px-4">
        <div className="flex h-6 w-6 items-center justify-center rounded bg-primary">
          <Droplets size={13} className="text-primary-foreground" strokeWidth={2} />
        </div>
        <div className="min-w-0">
          <p className="truncate text-[13px] font-semibold text-foreground leading-tight">ТопРейт</p>
          <p className="truncate text-[10px] text-muted-foreground leading-tight tracking-wide uppercase">Ромашкинское м-е</p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-3 py-3" aria-label="Основная навигация">
        <ul className="space-y-0.5" role="list">
          {navItems.map((item) => (
            <li key={item.label} className="relative">
              <NavItemRow item={item} pathname={pathname} />
            </li>
          ))}
        </ul>
      </nav>

      {/* Footer */}
      <div className="border-t border-border px-3 py-3 space-y-1">
        <button className="flex w-full items-center gap-2.5 rounded px-2.5 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-foreground">
          <Bell size={15} strokeWidth={1.5} className="shrink-0" />
          <span className="flex-1 text-left text-[13px]">Уведомления</span>
          <span className="rounded bg-status-critical/20 px-1.5 py-0.5 text-[10px] font-semibold text-status-critical">2</span>
        </button>
        <div className="flex items-center gap-2.5 rounded px-2.5 py-1.5">
          <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-sm bg-muted text-[10px] font-bold text-muted-foreground">
            АС
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-[12px] font-medium text-foreground leading-tight">Алексеев С.В.</p>
            <p className="truncate text-[10px] text-muted-foreground leading-tight">Инженер-геолог</p>
          </div>
          <button className="text-muted-foreground hover:text-foreground transition-colors" aria-label="Выйти">
            <LogOut size={13} strokeWidth={1.5} />
          </button>
        </div>
      </div>
    </aside>
  )
}
