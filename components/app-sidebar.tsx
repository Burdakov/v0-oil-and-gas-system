"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import {
  ChevronDown,
  ChevronRight,
  TrendingUp,
  Bell,
  LogOut,
  Grid3x3,
  Layers,
  Zap,
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
    label: "\u041a\u043e\u043d\u0442\u0440\u043e\u043b\u044c \u0444\u043e\u043d\u0434\u0430",
    icon: Layers,
    href: "/well-control",
  },
  {
    label: "\u0422\u043e\u043f \u0418\u0414\u041d",
    icon: TrendingUp,
    href: "/idn",
  },
  {
    label: "\u042f\u0447\u0435\u0439\u043a\u0438 \u0437\u0430\u0432\u043e\u0434\u043d\u0435\u043d\u0438\u044f",
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
      <Link href="/" className="group flex h-14 items-center gap-3 border-b border-border px-4 hover:bg-accent/30 transition-colors">
        {/* Bold angular logo mark */}
        <div className="relative flex h-8 w-8 shrink-0 items-center justify-center">
          {/* Outer rhombus background */}
          <svg width="32" height="32" viewBox="0 0 32 32" fill="none" aria-hidden="true">
            <polygon
              points="16,2 30,10 30,22 16,30 2,22 2,10"
              fill="oklch(0.72 0.16 55)"
              opacity="0.15"
            />
            <polygon
              points="16,4 28,11 28,21 16,28 4,21 4,11"
              stroke="oklch(0.72 0.16 55)"
              strokeWidth="1"
              fill="none"
              opacity="0.4"
            />
          </svg>
          <Zap
            size={16}
            className="absolute text-primary"
            strokeWidth={2.5}
            fill="oklch(0.72 0.16 55)"
            fillOpacity={0.25}
          />
        </div>
        <div className="min-w-0">
          <p className="truncate text-[15px] font-black tracking-tight text-foreground leading-none">
            {"\u0422\u043e\u043f"}
            <span className="text-primary">{"\u0420\u0435\u0439\u0442"}</span>
          </p>
          <p className="truncate text-[10px] text-muted-foreground leading-tight tracking-widest uppercase mt-0.5">
            {"\u0420\u043e\u043c\u0430\u0448\u043a\u0438\u043d\u0441\u043a\u043e\u0435 \u043c-\u0435"}
          </p>
        </div>
      </Link>

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
          <span className="flex-1 text-left text-[13px]">{"\u0423\u0432\u0435\u0434\u043e\u043c\u043b\u0435\u043d\u0438\u044f"}</span>
          <span className="rounded bg-status-critical/20 px-1.5 py-0.5 text-[10px] font-semibold text-status-critical">2</span>
        </button>
        <div className="flex items-center gap-2.5 rounded px-2.5 py-1.5">
          <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-sm bg-muted text-[10px] font-bold text-muted-foreground">
            {"\u0410\u0421"}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-[12px] font-medium text-foreground leading-tight">{"\u0410\u043b\u0435\u043a\u0441\u0435\u0435\u0432 \u0421.\u0412."}</p>
            <p className="truncate text-[10px] text-muted-foreground leading-tight">{"\u0418\u043d\u0436\u0435\u043d\u0435\u0440-\u0433\u0435\u043e\u043b\u043e\u0433"}</p>
          </div>
          <button className="text-muted-foreground hover:text-foreground transition-colors" aria-label="Выйти">
            <LogOut size={13} strokeWidth={1.5} />
          </button>
        </div>
      </div>
    </aside>
  )
}
