"use client"

import { useState } from "react"
import Link from "next/link"
import { cn } from "@/lib/utils"
import {
  LayoutDashboard,
  Droplets,
  Gauge,
  Map,
  BarChart3,
  Activity,
  FlaskConical,
  FileText,
  Settings,
  ChevronDown,
  ChevronRight,
  CircleDot,
  Layers,
  TrendingUp,
  Database,
  AlertTriangle,
  BookOpen,
  Users,
  Bell,
  LogOut,
} from "lucide-react"

type NavItem = {
  label: string
  icon: React.ElementType
  href?: string
  active?: boolean
  badge?: string
  children?: NavItem[]
}

const navGroups: { group: string; items: NavItem[] }[] = [
  {
    group: "Основное",
    items: [
      {
        label: "Обзор месторождения",
        icon: LayoutDashboard,
        href: "/",
        active: true,
      },
    ],
  },
  {
    group: "Заводнение",
    items: [
      {
        label: "Схема заводнения",
        icon: Droplets,
        children: [
          { label: "Активные контуры", icon: CircleDot, href: "/flooding/active" },
          { label: "Нагнетательные скважины", icon: Droplets, href: "/flooding/injectors" },
          { label: "Карта изобар", icon: Map, href: "/flooding/isobar-map" },
        ],
      },
      {
        label: "Приёмистость",
        icon: Gauge,
        href: "/flooding/injectivity",
      },
      {
        label: "КИН и охват",
        icon: TrendingUp,
        href: "/flooding/sweep",
        badge: "NEW",
      },
    ],
  },
  {
    group: "Скважины",
    items: [
      {
        label: "Фонд скважин",
        icon: Layers,
        href: "/wells/fund",
      },
      {
        label: "Замерные данные",
        icon: Activity,
        href: "/wells/measurements",
      },
      {
        label: "ГТМ и мероприятия",
        icon: FlaskConical,
        href: "/wells/gtm",
        badge: "3",
      },
      {
        label: "Профили добычи",
        icon: BarChart3,
        href: "/wells/production",
      },
    ],
  },
  {
    group: "Геология",
    items: [
      {
        label: "Пластовые данные",
        icon: Database,
        href: "/geology/reservoir",
      },
      {
        label: "Карты пласта",
        icon: Map,
        href: "/geology/maps",
      },
      {
        label: "Корреляция пластов",
        icon: Layers,
        href: "/geology/correlation",
      },
    ],
  },
  {
    group: "Анализ",
    items: [
      {
        label: "Аналитика добычи",
        icon: TrendingUp,
        href: "/analytics/production",
      },
      {
        label: "Контроль разработки",
        icon: BarChart3,
        href: "/analytics/development",
      },
      {
        label: "Отчёты",
        icon: FileText,
        href: "/analytics/reports",
      },
    ],
  },
  {
    group: "Система",
    items: [
      {
        label: "Тревоги и оповещения",
        icon: AlertTriangle,
        href: "/system/alerts",
        badge: "2",
      },
      {
        label: "Справочники",
        icon: BookOpen,
        href: "/system/references",
      },
      {
        label: "Пользователи",
        icon: Users,
        href: "/system/users",
      },
      {
        label: "Настройки",
        icon: Settings,
        href: "/system/settings",
      },
    ],
  },
]

function NavItemRow({
  item,
  depth = 0,
}: {
  item: NavItem
  depth?: number
}) {
  const [open, setOpen] = useState(false)
  const hasChildren = item.children && item.children.length > 0
  const Icon = item.icon

  return (
    <div>
      <Link
        href={item.href ?? "#"}
        onClick={hasChildren ? (e) => { e.preventDefault(); setOpen(!open) } : undefined}
        className={cn(
          "group flex items-center gap-2.5 rounded px-2.5 py-1.5 text-sm transition-all duration-150",
          depth === 0
            ? "font-medium"
            : "font-normal text-[13px]",
          item.active
            ? "bg-primary/10 text-primary"
            : "text-muted-foreground hover:bg-accent hover:text-foreground",
          depth > 0 && "ml-4 pl-2",
        )}
      >
        {item.active && depth === 0 && (
          <span className="absolute left-0 top-1/2 h-4 w-0.5 -translate-y-1/2 rounded-r bg-primary" />
        )}
        <Icon
          size={15}
          className={cn(
            "shrink-0 transition-colors",
            item.active ? "text-primary" : "text-muted-foreground group-hover:text-foreground",
          )}
          strokeWidth={1.5}
        />
        <span className="flex-1 truncate">{item.label}</span>
        {item.badge && (
          <span
            className={cn(
              "rounded px-1.5 py-0.5 text-[10px] font-semibold leading-none tracking-wide",
              item.badge === "NEW"
                ? "bg-primary/15 text-primary"
                : "bg-muted text-muted-foreground",
            )}
          >
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
            <NavItemRow key={child.label} item={child} depth={depth + 1} />
          ))}
        </div>
      )}
    </div>
  )
}

export function AppSidebar() {
  return (
    <aside className="relative flex h-screen w-[220px] shrink-0 flex-col border-r border-border bg-sidebar">
      {/* Logo / Project */}
      <div className="flex h-12 items-center gap-2.5 border-b border-border px-4">
        <div className="flex h-6 w-6 items-center justify-center rounded bg-primary">
          <Droplets size={13} className="text-primary-foreground" strokeWidth={2} />
        </div>
        <div className="min-w-0">
          <p className="truncate text-[13px] font-semibold text-foreground leading-tight">ГеоФлюд</p>
          <p className="truncate text-[10px] text-muted-foreground leading-tight tracking-wide uppercase">Ромашкинское м-е</p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-3 py-3 space-y-4" aria-label="Основная навигация">
        {navGroups.map(({ group, items }) => (
          <div key={group}>
            <p className="mb-1 px-2.5 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/60">
              {group}
            </p>
            <ul className="space-y-0.5" role="list">
              {items.map((item) => (
                <li key={item.label} className="relative">
                  <NavItemRow item={item} />
                </li>
              ))}
            </ul>
          </div>
        ))}
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
