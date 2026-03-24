"use client"

import { Activity, AlertTriangle, Droplets, Gauge, TrendingUp, TrendingDown, Minus, ChevronRight, RefreshCw, Download } from "lucide-react"

const kpiCards = [
  {
    label: "\u0421\u0443\u0442\u043e\u0447\u043d\u0430\u044f \u0434\u043e\u0431\u044b\u0447\u0430 \u043d\u0435\u0444\u0442\u0438",
    value: "1 847",
    unit: "\u0442/\u0441\u0443\u0442",
    delta: "+3.2%",
    trend: "up" as const,
    sub: "\u043f\u043b\u0430\u043d: 1 800 \u0442/\u0441\u0443\u0442",
    icon: Activity,
    accent: "text-status-active",
  },
  {
    label: "\u0417\u0430\u043a\u0430\u0447\u043a\u0430 \u0432\u043e\u0434\u044b",
    value: "4 213",
    unit: "\u043c\u00b3/\u0441\u0443\u0442",
    delta: "-1.7%",
    trend: "down" as const,
    sub: "\u043f\u043b\u0430\u043d: 4 400 \u043c\u00b3/\u0441\u0443\u0442",
    icon: Droplets,
    accent: "text-chart-2",
  },
  {
    label: "\u041e\u0431\u0432\u043e\u0434\u043d\u0451\u043d\u043d\u043e\u0441\u0442\u044c",
    value: "68.4",
    unit: "%",
    delta: "+0.3%",
    trend: "down" as const,
    sub: "\u0437\u0430 \u043f\u043e\u0441\u043b\u0435\u0434\u043d\u0438\u0435 30 \u0441\u0443\u0442\u043e\u043a",
    icon: Gauge,
    accent: "text-status-warning",
  },
  {
    label: "\u0414\u0435\u0439\u0441\u0442\u0432\u0443\u044e\u0449\u0438\u0439 \u0444\u043e\u043d\u0434",
    value: "214 / 231",
    unit: "\u0441\u043a\u0432.",
    delta: "0",
    trend: "flat" as const,
    sub: "17 \u0441\u043a\u0432\u0430\u0436\u0438\u043d \u0432 \u043f\u0440\u043e\u0441\u0442\u043e\u0435",
    icon: TrendingUp,
    accent: "text-foreground",
  },
]

const wellStatusRows = [
  { id: "\u0420-147", pad: "\u041a\u0443\u0441\u0442 12", type: "\u0414\u043e\u0431\u044b\u0432\u0430\u044e\u0449\u0430\u044f",    oil: "38.4", water: "71.2",  status: "active" },
  { id: "\u0420-204", pad: "\u041a\u0443\u0441\u0442 7",  type: "\u0414\u043e\u0431\u044b\u0432\u0430\u044e\u0449\u0430\u044f",    oil: "12.1", water: "84.6",  status: "warning" },
  { id: "\u041d-031", pad: "\u041a\u0443\u0441\u0442 7",  type: "\u041d\u0430\u0433\u043d\u0435\u0442\u0430\u0442\u0435\u043b\u044c\u043d\u0430\u044f", oil: "\u2014",  water: "820",   status: "active" },
  { id: "\u0420-088", pad: "\u041a\u0443\u0441\u0442 3",  type: "\u0414\u043e\u0431\u044b\u0432\u0430\u044e\u0449\u0430\u044f",    oil: "0.0",  water: "\u2014", status: "inactive" },
  { id: "\u041d-019", pad: "\u041a\u0443\u0441\u0442 3",  type: "\u041d\u0430\u0433\u043d\u0435\u0442\u0430\u0442\u0435\u043b\u044c\u043d\u0430\u044f", oil: "\u2014",  water: "1 043", status: "active" },
  { id: "\u0420-311", pad: "\u041a\u0443\u0441\u0442 18", type: "\u0414\u043e\u0431\u044b\u0432\u0430\u044e\u0449\u0430\u044f",    oil: "55.7", water: "48.3",  status: "active" },
  { id: "\u0420-295", pad: "\u041a\u0443\u0441\u0442 18", type: "\u0414\u043e\u0431\u044b\u0432\u0430\u044e\u0449\u0430\u044f",    oil: "21.3", water: "77.9",  status: "warning" },
]

const alertsList = [
  { id: 1, severity: "critical", text: "\u0420-204: \u0434\u0430\u0432\u043b\u0435\u043d\u0438\u0435 \u043d\u0430 \u0443\u0441\u0442\u044c\u0435 \u043d\u0438\u0436\u0435 \u043d\u043e\u0440\u043c\u044b \u2014 4.1 \u041c\u041f\u0430", time: "09:14" },
  { id: 2, severity: "warning",  text: "\u041d-031: \u043f\u0430\u0434\u0435\u043d\u0438\u0435 \u043f\u0440\u0438\u0451\u043c\u0438\u0441\u0442\u043e\u0441\u0442\u0438 \u043d\u0430 18% \u0437\u0430 48 \u0447", time: "08:52" },
  { id: 3, severity: "info",     text: "\u0420-311: \u043f\u043b\u0430\u043d \u043f\u043e \u0434\u0435\u0431\u0438\u0442\u0443 \u043d\u0435\u0444\u0442\u0438 \u043f\u0435\u0440\u0435\u0432\u044b\u043f\u043e\u043b\u043d\u0435\u043d",  time: "07:30" },
]

const statusColor: Record<string, string> = {
  active:   "bg-status-active",
  warning:  "bg-status-warning",
  inactive: "bg-status-inactive",
}

const statusLabel: Record<string, string> = {
  active:   "\u0420\u0430\u0431\u043e\u0442\u0430\u0435\u0442",
  warning:  "\u0422\u0440\u0435\u0432\u043e\u0433\u0430",
  inactive: "\u041f\u0440\u043e\u0441\u0442\u043e\u0439",
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
          <span className="text-foreground font-medium">{"\u041e\u0431\u0437\u043e\u0440 \u043c\u0435\u0441\u0442\u043e\u0440\u043e\u0436\u0434\u0435\u043d\u0438\u044f"}</span>
          <ChevronRight size={13} />
          <span>{"\u0420\u043e\u043c\u0430\u0448\u043a\u0438\u043d\u0441\u043a\u043e\u0435"}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[11px] text-muted-foreground tabular-nums">
            {"\u041e\u0431\u043d\u043e\u0432\u043b\u0435\u043d\u043e: 23.03.2026, 09:47"}
          </span>
          <button
            className="flex items-center gap-1.5 rounded border border-border px-2.5 py-1 text-[12px] text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
            aria-label="\u041e\u0431\u043d\u043e\u0432\u0438\u0442\u044c \u0434\u0430\u043d\u043d\u044b\u0435"
          >
            <RefreshCw size={12} strokeWidth={1.5} />
            {"\u041e\u0431\u043d\u043e\u0432\u0438\u0442\u044c"}
          </button>
          <button
            className="flex items-center gap-1.5 rounded border border-border px-2.5 py-1 text-[12px] text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
            aria-label="\u042d\u043a\u0441\u043f\u043e\u0440\u0442\u0438\u0440\u043e\u0432\u0430\u0442\u044c \u043e\u0442\u0447\u0451\u0442"
          >
            <Download size={12} strokeWidth={1.5} />
            {"\u042d\u043a\u0441\u043f\u043e\u0440\u0442"}
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
              <h2 className="text-[13px] font-semibold text-foreground">{"\u0421\u043e\u0441\u0442\u043e\u044f\u043d\u0438\u0435 \u0441\u043a\u0432\u0430\u0436\u0438\u043d"}</h2>
              <button className="text-[11px] text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1">
                {"\u0412\u0441\u0435 \u0441\u043a\u0432\u0430\u0436\u0438\u043d\u044b"} <ChevronRight size={11} />
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-[12px]" role="table">
                <thead>
                  <tr className="border-b border-border">
                    {["\u0421\u043a\u0432\u0430\u0436\u0438\u043d\u0430", "\u041a\u0443\u0441\u0442", "\u0422\u0438\u043f", "Q \u043d\u0435\u0444\u0442\u0438, \u0442/\u0441\u0443\u0442", "Q \u0432\u043e\u0434\u044b, \u043c\u00b3/\u0441\u0443\u0442", "\u0421\u0442\u0430\u0442\u0443\u0441"].map((h) => (
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
                  <h2 className="text-[13px] font-semibold text-foreground">{"\u0422\u0440\u0435\u0432\u043e\u0433\u0438"}</h2>
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
              <h2 className="text-[13px] font-semibold text-foreground">{"\u041f\u0430\u0440\u0430\u043c\u0435\u0442\u0440\u044b \u043f\u043b\u0430\u0441\u0442\u0430"}</h2>
              <dl className="space-y-2">
                {[
                  { label: "\u041f\u043b\u0430\u0441\u0442\u043e\u0432\u043e\u0435 \u0434\u0430\u0432\u043b\u0435\u043d\u0438\u0435", value: "18.3 \u041c\u041f\u0430" },
                  { label: "\u0422\u0435\u043c\u043f\u0435\u0440\u0430\u0442\u0443\u0440\u0430 \u043f\u043b\u0430\u0441\u0442\u0430",  value: "54 \u00b0C" },
                  { label: "\u0412\u044f\u0437\u043a\u043e\u0441\u0442\u044c \u043d\u0435\u0444\u0442\u0438",       value: "3.7 \u043c\u041f\u0430\u00b7\u0441" },
                  { label: "\u041f\u0440\u043e\u043d\u0438\u0446\u0430\u0435\u043c\u043e\u0441\u0442\u044c",         value: "0.124 \u043c\u043a\u043c\u00b2" },
                  { label: "\u041f\u043e\u0440\u0438\u0441\u0442\u043e\u0441\u0442\u044c",            value: "21.6 %" },
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
            <h2 className="text-[13px] font-semibold text-foreground">{"\u041a\u0430\u0440\u0442\u0430 \u0437\u0430\u0432\u043e\u0434\u043d\u0435\u043d\u0438\u044f \u2014 \u041a\u0443\u0441\u0442 7 / \u041a\u0443\u0441\u0442 12"}</h2>
            <div className="flex items-center gap-2">
              <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
                <span className="inline-block h-2 w-2 rounded-full bg-chart-2" />
                {"\u041d\u0430\u0433\u043d\u0435\u0442\u0430\u0442\u0435\u043b\u044c\u043d\u044b\u0435"}
              </span>
              <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
                <span className="inline-block h-2 w-2 rounded-full bg-status-active" />
                {"\u0414\u043e\u0431\u044b\u0432\u0430\u044e\u0449\u0438\u0435"}
              </span>
              <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
                <span className="inline-block h-2 w-2 rounded-full bg-status-inactive" />
                {"\u041f\u0440\u043e\u0441\u0442\u043e\u0439"}
              </span>
            </div>
          </div>
          <div className="flex h-[200px] items-center justify-center text-muted-foreground/40">
            <div className="text-center space-y-1">
              <p className="text-[13px]">{"\u041e\u0431\u043b\u0430\u0441\u0442\u044c \u043a\u0430\u0440\u0442\u044b \u0437\u0430\u0432\u043e\u0434\u043d\u0435\u043d\u0438\u044f"}</p>
              <p className="text-[11px]">{"\u0418\u043d\u0442\u0435\u0440\u0430\u043a\u0442\u0438\u0432\u043d\u0430\u044f \u0441\u0445\u0435\u043c\u0430 \u0431\u0443\u0434\u0435\u0442 \u0440\u0430\u0437\u043c\u0435\u0449\u0435\u043d\u0430 \u0437\u0434\u0435\u0441\u044c"}</p>
            </div>
          </div>
        </section>

      </div>
    </main>
  )
}
