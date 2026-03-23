"use client"

import { Activity, AlertTriangle, Droplets, Gauge, TrendingUp, TrendingDown, Minus, ChevronRight, RefreshCw, Download } from "lucide-react"

const kpiCards = [
  {
    label: "Суточная добыча нефти",
    value: "1 847",
    unit: "т/сут",
    delta: "+3.2%",
    trend: "up" as const,
    sub: "план: 1 800 т/сут",
    icon: Activity,
    accent: "text-status-active",
  },
  {
    label: "Закачка воды",
    value: "4 213",
    unit: "м³/сут",
    delta: "-1.7%",
    trend: "down" as const,
    sub: "план: 4 400 м³/сут",
    icon: Droplets,
    accent: "text-chart-2",
  },
  {
    label: "Обводнённость",
    value: "68.4",
    unit: "%",
    delta: "+0.3%",
    trend: "down" as const,
    sub: "за последние 30 суток",
    icon: Gauge,
    accent: "text-status-warning",
  },
  {
    label: "Действующий фонд",
    value: "214 / 231",
    unit: "скв.",
    delta: "0",
    trend: "flat" as const,
    sub: "17 скважин в простое",
    icon: TrendingUp,
    accent: "text-foreground",
  },
]

const wellStatusRows = [
  { id: "Р-147", pad: "Куст 12", type: "Добывающая", oil: "38.4", water: "71.2", status: "active" },
  { id: "Р-204", pad: "Куст 7",  type: "Добывающая", oil: "12.1", water: "84.6", status: "warning" },
  { id: "Н-031", pad: "Куст 7",  type: "Нагнетательная", oil: "—",   water: "820",  status: "active" },
  { id: "Р-088", pad: "Куст 3",  type: "Добывающая", oil: "0.0",  water: "—",    status: "inactive" },
  { id: "Н-019", pad: "Куст 3",  type: "Нагнетательная", oil: "—",   water: "1 043",status: "active" },
  { id: "Р-311", pad: "Куст 18", type: "Добывающая", oil: "55.7", water: "48.3", status: "active" },
  { id: "Р-295", pad: "Куст 18", type: "Добывающая", oil: "21.3", water: "77.9", status: "warning" },
]

const alertsList = [
  { id: 1, severity: "critical", text: "Р-204: давление на устье ниже нормы — 4.1 МПа", time: "09:14" },
  { id: 2, severity: "warning",  text: "Н-031: падение приёмистости на 18% за 48 ч",  time: "08:52" },
  { id: 3, severity: "info",     text: "Р-311: план по дебиту нефти перевыполнен",     time: "07:30" },
]

const statusColor: Record<string, string> = {
  active:   "bg-status-active",
  warning:  "bg-status-warning",
  inactive: "bg-status-inactive",
}

const statusLabel: Record<string, string> = {
  active:   "Работает",
  warning:  "Тревога",
  inactive: "Простой",
}

const severityColor: Record<string, string> = {
  critical: "text-status-critical",
  warning:  "text-status-warning",
  info:     "text-chart-2",
}

const severityIcon: Record<string, string> = {
  critical: "●",
  warning:  "●",
  info:     "●",
}

export function DashboardContent() {
  return (
    <main className="flex flex-1 flex-col overflow-hidden">
      {/* Top bar */}
      <header className="flex h-12 shrink-0 items-center justify-between border-b border-border px-6">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <span className="text-foreground font-medium">Обзор месторождения</span>
          <ChevronRight size={13} />
          <span>Ромашкинское</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[11px] text-muted-foreground tabular-nums">
            Обновлено: 23.03.2026, 09:47
          </span>
          <button
            className="flex items-center gap-1.5 rounded border border-border px-2.5 py-1 text-[12px] text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
            aria-label="Обновить данные"
          >
            <RefreshCw size={12} strokeWidth={1.5} />
            Обновить
          </button>
          <button
            className="flex items-center gap-1.5 rounded border border-border px-2.5 py-1 text-[12px] text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
            aria-label="Экспортировать отчёт"
          >
            <Download size={12} strokeWidth={1.5} />
            Экспорт
          </button>
        </div>
      </header>

      {/* Scrollable body */}
      <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6">

        {/* KPI row */}
        <section aria-label="Ключевые показатели">
          <div className="grid grid-cols-4 gap-3">
            {kpiCards.map((card) => {
              const Icon = card.icon
              return (
                <div
                  key={card.label}
                  className="rounded-md border border-border bg-card p-4 space-y-3 transition-colors hover:border-border/80 hover:bg-card"
                >
                  <div className="flex items-start justify-between">
                    <p className="text-[11px] font-medium uppercase tracking-widest text-muted-foreground">
                      {card.label}
                    </p>
                    <Icon size={14} strokeWidth={1.5} className={card.accent} />
                  </div>
                  <div>
                    <div className="flex items-baseline gap-1.5">
                      <span className="text-[26px] font-semibold leading-none tracking-tight text-foreground tabular-nums">
                        {card.value}
                      </span>
                      <span className="text-[12px] text-muted-foreground">{card.unit}</span>
                    </div>
                    <div className="mt-1.5 flex items-center gap-1.5">
                      {card.trend === "up" && (
                        <TrendingUp size={12} className="text-status-active" strokeWidth={2} />
                      )}
                      {card.trend === "down" && (
                        <TrendingDown size={12} className="text-status-critical" strokeWidth={2} />
                      )}
                      {card.trend === "flat" && (
                        <Minus size={12} className="text-muted-foreground" strokeWidth={2} />
                      )}
                      <span
                        className={`text-[11px] font-medium tabular-nums ${
                          card.trend === "up"
                            ? "text-status-active"
                            : card.trend === "down"
                            ? "text-status-critical"
                            : "text-muted-foreground"
                        }`}
                      >
                        {card.delta}
                      </span>
                      <span className="text-[11px] text-muted-foreground">{card.sub}</span>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </section>

        {/* Main two-column grid */}
        <div className="grid grid-cols-3 gap-4">

          {/* Well status table — 2 cols wide */}
          <section
            className="col-span-2 rounded-md border border-border bg-card"
            aria-label="Состояние скважин"
          >
            <div className="flex items-center justify-between border-b border-border px-4 py-3">
              <h2 className="text-[13px] font-semibold text-foreground">Состояние скважин</h2>
              <button className="text-[11px] text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1">
                Все скважины <ChevronRight size={11} />
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-[12px]" role="table">
                <thead>
                  <tr className="border-b border-border">
                    {["Скважина", "Куст", "Тип", "Q нефти, т/сут", "Q воды, м³/сут", "Статус"].map((h) => (
                      <th
                        key={h}
                        className="px-4 py-2 text-left text-[10px] font-semibold uppercase tracking-wider text-muted-foreground"
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {wellStatusRows.map((row, i) => (
                    <tr
                      key={row.id}
                      className={`border-b border-border/50 transition-colors hover:bg-accent/40 ${
                        i % 2 === 0 ? "" : "bg-muted/20"
                      }`}
                    >
                      <td className="px-4 py-2.5 font-mono font-medium text-foreground">{row.id}</td>
                      <td className="px-4 py-2.5 text-muted-foreground">{row.pad}</td>
                      <td className="px-4 py-2.5 text-muted-foreground">{row.type}</td>
                      <td className="px-4 py-2.5 tabular-nums text-foreground">{row.oil}</td>
                      <td className="px-4 py-2.5 tabular-nums text-foreground">{row.water}</td>
                      <td className="px-4 py-2.5">
                        <span className="flex items-center gap-1.5">
                          <span
                            className={`inline-block h-1.5 w-1.5 rounded-full ${statusColor[row.status]}`}
                          />
                          <span className="text-muted-foreground">{statusLabel[row.status]}</span>
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          {/* Right column — alerts + quick stats */}
          <div className="space-y-4">
            {/* Alerts */}
            <section
              className="rounded-md border border-border bg-card"
              aria-label="Тревоги и оповещения"
            >
              <div className="flex items-center justify-between border-b border-border px-4 py-3">
                <div className="flex items-center gap-2">
                  <h2 className="text-[13px] font-semibold text-foreground">Тревоги</h2>
                  <span className="rounded bg-status-critical/15 px-1.5 py-0.5 text-[10px] font-semibold text-status-critical">
                    2
                  </span>
                </div>
                <AlertTriangle size={13} className="text-status-warning" strokeWidth={1.5} />
              </div>
              <ul className="divide-y divide-border/50" role="list">
                {alertsList.map((alert) => (
                  <li key={alert.id} className="px-4 py-3 space-y-0.5 hover:bg-accent/30 transition-colors">
                    <div className="flex items-start gap-2">
                      <span className={`mt-0.5 text-[10px] ${severityColor[alert.severity]}`}>
                        {severityIcon[alert.severity]}
                      </span>
                      <p className="flex-1 text-[12px] text-foreground leading-relaxed">{alert.text}</p>
                    </div>
                    <p className="pl-4 text-[10px] text-muted-foreground tabular-nums">{alert.time}</p>
                  </li>
                ))}
              </ul>
            </section>

            {/* Quick reservoir stats */}
            <section
              className="rounded-md border border-border bg-card px-4 py-4 space-y-3"
              aria-label="Параметры пласта"
            >
              <h2 className="text-[13px] font-semibold text-foreground">Параметры пласта</h2>
              <dl className="space-y-2">
                {[
                  { label: "Пластовое давление", value: "18.3 МПа" },
                  { label: "Температура пласта",  value: "54 °C" },
                  { label: "Вязкость нефти",       value: "3.7 мПа·с" },
                  { label: "Проницаемость",         value: "0.124 мкм²" },
                  { label: "Пористость",            value: "21.6 %" },
                ].map(({ label, value }) => (
                  <div key={label} className="flex items-center justify-between">
                    <dt className="text-[11px] text-muted-foreground">{label}</dt>
                    <dd className="text-[12px] font-medium tabular-nums text-foreground">{value}</dd>
                  </div>
                ))}
              </dl>
            </section>
          </div>

        </div>

        {/* Bottom placeholder section — flooding map area */}
        <section
          className="rounded-md border border-border bg-card"
          aria-label="Карта заводнения"
        >
          <div className="flex items-center justify-between border-b border-border px-4 py-3">
            <h2 className="text-[13px] font-semibold text-foreground">Карта заводнения — Куст 7 / Куст 12</h2>
            <div className="flex items-center gap-2">
              <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
                <span className="inline-block h-2 w-2 rounded-full bg-chart-2" />
                Нагнетательные
              </span>
              <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
                <span className="inline-block h-2 w-2 rounded-full bg-status-active" />
                Добывающие
              </span>
              <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
                <span className="inline-block h-2 w-2 rounded-full bg-status-inactive" />
                Простой
              </span>
            </div>
          </div>
          <div className="flex h-[200px] items-center justify-center text-muted-foreground/40">
            <div className="text-center space-y-1">
              <p className="text-[13px]">Область карты заводнения</p>
              <p className="text-[11px]">Интерактивная схема будет размещена здесь</p>
            </div>
          </div>
        </section>

      </div>
    </main>
  )
}
