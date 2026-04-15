import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { getHistory } from "../api/client";

const defaultChart = [
  { label: "Mon", kwh: 12.4 },
  { label: "Tue", kwh: 14.1 },
  { label: "Wed", kwh: 16.3 },
  { label: "Thu", kwh: 18.2 },
  { label: "Fri", kwh: 20.5 },
  { label: "Sat", kwh: 22.8 },
  { label: "Sun", kwh: 21.5 },
];

function formatDateTime(value) {
  const date = new Date(value);
  return {
    date: date.toLocaleDateString("en-US", {
      month: "short",
      day: "2-digit",
      year: "numeric",
    }),
    time: date.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
    }),
  };
}

function resolveLogStyles(eventType) {
  if (["solar_top_up", "top_up_purchase"].includes(eventType)) {
    return {
      dotClass: "bg-primary",
      energyClass: "font-bold text-primary",
      financialClass: "text-primary",
    };
  }

  if (eventType === "manual_wallet_load") {
    return {
      dotClass: "bg-secondary",
      energyClass: "text-on-surface-variant/40",
      financialClass: "font-bold text-secondary",
    };
  }

  return {
    dotClass: "bg-on-surface/40",
    energyClass: "font-medium text-on-surface",
    financialClass: "text-on-surface-variant/40",
  };
}

function formatEnergy(log) {
  if (log.energy_kwh === null) {
    return "-";
  }

  const formatted = `${Math.abs(log.energy_kwh).toFixed(1)} kWh`;
  return ["solar_top_up", "top_up_purchase"].includes(log.event_type) ? `+${formatted}` : formatted;
}

function formatFinancial(log) {
  if (log.amount_eur === null) {
    return "-";
  }

  return `EUR ${log.amount_eur.toFixed(2)}`;
}

function HistoryView() {
  const [historyData, setHistoryData] = useState({
    current_period_kwh: 142.8,
    percent_change: 12,
    chart: defaultChart,
    logs: [],
  });
  const [loadError, setLoadError] = useState("");

  useEffect(() => {
    let isCancelled = false;

    async function loadHistory() {
      try {
        const payload = await getHistory(30);

        if (!isCancelled) {
          setHistoryData({
            current_period_kwh: payload.current_period_kwh,
            percent_change: payload.percent_change,
            chart: payload.chart.length > 0 ? payload.chart : defaultChart,
            logs: payload.logs,
          });
          setLoadError("");
        }
      } catch {
        if (!isCancelled) {
          setLoadError("Falha ao sincronizar historico com a API. Exibindo visual local.");
        }
      }
    }

    loadHistory();

    return () => {
      isCancelled = true;
    };
  }, []);

  const chartLabels = useMemo(() => historyData.chart.map((point) => point.label), [historyData.chart]);
  const chartTooltipValues = useMemo(() => {
    const first = historyData.chart[1]?.kwh ?? 12.4;
    const middle = historyData.chart[Math.floor(historyData.chart.length / 2)]?.kwh ?? 22.0;
    const last = historyData.chart[historyData.chart.length - 1]?.kwh ?? 28.0;

    return {
      first: first.toFixed(1),
      middle: middle.toFixed(1),
      last: last.toFixed(1),
    };
  }, [historyData.chart]);

  return (
    <div className="min-h-screen bg-surface font-body text-on-surface antialiased">
      <header className="fixed top-0 z-50 flex h-16 w-full items-center justify-between bg-[#060e20]/60 px-6 shadow-[0_20px_40px_rgba(0,0,0,0.1)] backdrop-blur-3xl">
        <div className="flex items-center gap-3">
          <span className="font-headline text-xl font-black tracking-tight text-[#69f6b8]">Ricks Energy Manager</span>
        </div>

        <div className="hidden items-center gap-8 md:flex">
          <nav className="flex items-center gap-6 font-headline text-lg font-bold">
            <Link className="rounded-lg px-3 py-1 text-[#dee5ff]/70 transition-colors hover:bg-[#192540]" to="/">
              Overview
            </Link>
            <Link className="font-bold text-[#69f6b8]" to="/history">
              History
            </Link>
            <Link className="rounded-lg px-3 py-1 text-[#dee5ff]/70 transition-colors hover:bg-[#192540]" to="/top-up">
              Top-up
            </Link>
            <Link className="rounded-lg px-3 py-1 text-[#dee5ff]/70 transition-colors hover:bg-[#192540]" to="/settings">
              Settings
            </Link>
          </nav>
        </div>

        <div className="flex items-center gap-4">
          <button className="material-symbols-outlined text-[#dee5ff]/70 transition-colors hover:text-[#69f6b8]">notifications</button>

          <div className="h-8 w-8 overflow-hidden rounded-full border border-[#69f6b8]/20">
            <img
              alt="User profile photo"
              className="h-full w-full object-cover"
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuAGgS1SBNnd4x4HD8OXt2CSv2R2BwvfRPLZ7Tk7sXln_4Hwt6wkXeh6E6GRncxn5Iy9L3nahE5aD8vq5FIJEzBo6gQVFijqKSoz5iONF23agBn6IhVlEtjkA3sO8S4fNhgAo4oUEj2A_8labdFnL_UZWLtSloMp7ID90TyXPg52U21CaKZfTcfXP5wQpnxGESxI-YWaQkBplUuCJgiL3CQjdRba8zT22lrOIGmdAsZjKpJXaWVVDfQ0GY_x4Be_W1OjMCUlAQFLMind"
            />
          </div>
        </div>
      </header>

      <main className="mx-auto flex max-w-7xl flex-col gap-8 px-6 pb-32 pt-24 md:flex-row md:pb-12">
        <aside className="fixed left-0 top-0 z-40 hidden h-screen w-72 flex-col bg-[#091328] px-4 pb-8 pt-24 md:flex">
          <div className="mb-8 px-4">
            <h2 className="font-headline text-2xl font-black text-[#69f6b8]">Energy Command</h2>
            <p className="mt-1 text-xs font-label uppercase tracking-wide text-[#dee5ff]/50">Meter ID: 4829-X</p>
          </div>

          <nav className="flex flex-1 flex-col gap-1">
            <Link className="flex items-center gap-4 rounded-xl px-4 py-3 text-xs font-label uppercase tracking-wide text-[#dee5ff]/50 transition-all hover:bg-[#192540] hover:text-[#dee5ff]" to="/">
              <span className="material-symbols-outlined">dashboard</span>
              Overview
            </Link>

            <Link className="flex items-center gap-4 rounded-xl border-r-2 border-[#69f6b8] bg-[#0f1930] px-4 py-3 text-xs font-label uppercase tracking-wide text-[#69f6b8] transition-all" to="/history">
              <span className="material-symbols-outlined">history</span>
              History
            </Link>

            <Link className="flex items-center gap-4 rounded-xl px-4 py-3 text-xs font-label uppercase tracking-wide text-[#dee5ff]/50 transition-all hover:bg-[#192540] hover:text-[#dee5ff]" to="/top-up">
              <span className="material-symbols-outlined">bolt</span>
              Top-up
            </Link>

            <Link className="flex items-center gap-4 rounded-xl px-4 py-3 text-xs font-label uppercase tracking-wide text-[#dee5ff]/50 transition-all hover:bg-[#192540] hover:text-[#dee5ff]" to="/settings">
              <span className="material-symbols-outlined">settings</span>
              Settings
            </Link>
          </nav>

          <Link className="kinetic-glow mb-8 flex items-center justify-center gap-2 rounded-xl bg-primary py-4 font-headline font-bold text-on-primary transition-transform active:scale-95" to="/top-up">
            <span className="material-symbols-outlined">add_circle</span>
            Quick Top-up
          </Link>

          <div className="mt-auto flex flex-col gap-1">
            <a className="flex items-center gap-4 rounded-xl px-4 py-3 text-xs font-label uppercase tracking-wide text-[#dee5ff]/50 transition-all hover:bg-[#192540] hover:text-[#dee5ff]" href="#">
              <span className="material-symbols-outlined">help</span>
              Help
            </a>

            <a className="flex items-center gap-4 rounded-xl px-4 py-3 text-xs font-label uppercase tracking-wide text-[#dee5ff]/50 transition-all hover:bg-[#192540] hover:text-[#dee5ff]" href="#">
              <span className="material-symbols-outlined">logout</span>
              Logout
            </a>
          </div>
        </aside>

        <section className="flex flex-1 flex-col gap-8 md:ml-72">
          <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
            <div>
              <h1 className="font-headline text-4xl font-extrabold tracking-tight text-on-surface">Consumption History</h1>
              <p className="mt-1 text-on-surface-variant">Detailed analysis of your energy expenditure.</p>
              {loadError ? <p className="mt-2 text-xs text-tertiary">{loadError}</p> : null}
            </div>

            <div className="flex gap-1 rounded-xl bg-surface-container-low p-1.5">
              <button className="rounded-lg px-4 py-2 text-sm font-medium text-on-surface-variant transition-colors hover:text-on-surface">Day</button>
              <button className="rounded-lg bg-surface-container-highest px-4 py-2 text-sm font-medium text-primary">Week</button>
              <button className="rounded-lg px-4 py-2 text-sm font-medium text-on-surface-variant transition-colors hover:text-on-surface">Month</button>
              <button className="rounded-lg px-4 py-2 text-sm font-medium text-on-surface-variant transition-colors hover:text-on-surface">Year</button>
            </div>
          </div>

          <div className="relative overflow-hidden rounded-[1.5rem] bg-surface-container p-8">
            <div className="relative z-10 mb-8 flex items-start justify-between">
              <div>
                <span className="text-xs font-label uppercase tracking-widest text-on-surface-variant">Current Period</span>
                <div className="mt-1 flex items-baseline gap-2">
                  <span className="font-headline text-5xl font-extrabold text-on-surface">{historyData.current_period_kwh.toFixed(1)}</span>
                  <span className="font-headline text-xl font-bold text-primary">kWh</span>
                </div>
              </div>

              <div className="text-right">
                <span className="flex items-center gap-1 font-bold text-primary">
                  <span className="material-symbols-outlined text-sm">trending_up</span>
                  {historyData.percent_change.toFixed(1)}%
                </span>
                <p className="mt-1 text-xs text-on-surface-variant">vs last week</p>
              </div>
            </div>

            <div className="relative flex h-72 gap-4">
              <div className="flex h-64 flex-col justify-between pb-6 text-[10px] font-label uppercase tracking-tighter text-on-surface-variant opacity-40">
                <span>40 kWh</span>
                <span>30 kWh</span>
                <span>20 kWh</span>
                <span>10 kWh</span>
                <span>0 kWh</span>
              </div>

              <div className="relative h-64 flex-1">
                <div className="pointer-events-none absolute inset-0 flex flex-col justify-between opacity-5">
                  <div className="w-full border-t border-on-surface" />
                  <div className="w-full border-t border-on-surface" />
                  <div className="w-full border-t border-on-surface" />
                  <div className="w-full border-t border-on-surface" />
                  <div className="w-full border-t border-on-surface" />
                </div>

                <svg className="h-full w-full overflow-visible" preserveAspectRatio="none" viewBox="0 0 1000 200">
                  <defs>
                    <linearGradient id="areaGradient" x1="0" x2="0" y1="0" y2="1">
                      <stop offset="0%" stopColor="#69f6b8" stopOpacity="0.3" />
                      <stop offset="100%" stopColor="#69f6b8" stopOpacity="0" />
                    </linearGradient>
                  </defs>

                  <path d="M0,180 Q100,160 200,170 T400,120 T600,140 T800,80 T1000,100 V200 H0 Z" fill="url(#areaGradient)" />
                  <path d="M0,180 Q100,160 200,170 T400,120 T600,140 T800,80 T1000,100" fill="none" stroke="#69f6b8" strokeLinecap="round" strokeWidth="4" />

                  <g className="group/point cursor-pointer">
                    <circle className="transition-all hover:r-8" cx="200" cy="170" fill="#69f6b8" r="6" />
                    <foreignObject className="opacity-0 transition-opacity group-hover/point:opacity-100" height="45" width="80" x="160" y="115">
                      <div className="rounded-lg border border-primary/20 bg-surface-bright p-2 text-center shadow-xl">
                        <p className="text-[10px] uppercase text-on-surface-variant">{chartLabels[1] ?? "Tue"}</p>
                        <p className="text-xs font-bold text-primary">{chartTooltipValues.first} kWh</p>
                      </div>
                    </foreignObject>
                  </g>

                  <g className="group/point cursor-pointer">
                    <circle className="animate-pulse" cx="500" cy="120" fill="#69f6b8" r="6" />
                    <foreignObject className="opacity-0 transition-opacity group-hover/point:opacity-100" height="45" width="80" x="460" y="65">
                      <div className="rounded-lg border border-primary/20 bg-surface-bright p-2 text-center shadow-xl">
                        <p className="text-[10px] uppercase text-on-surface-variant">{chartLabels[Math.floor(chartLabels.length / 2)] ?? "Thu"}</p>
                        <p className="text-xs font-bold text-primary">{chartTooltipValues.middle} kWh</p>
                      </div>
                    </foreignObject>
                  </g>

                  <g className="group/point cursor-pointer">
                    <circle className="animate-pulse" cx="800" cy="80" fill="#69f6b8" r="6" />
                    <circle cx="800" cy="80" fill="transparent" r="12" />
                    <foreignObject className="opacity-0 transition-opacity group-hover/point:opacity-100" height="45" width="80" x="760" y="25">
                      <div className="rounded-lg border border-primary/20 bg-surface-bright p-2 text-center shadow-xl">
                        <p className="text-[10px] uppercase text-on-surface-variant">{chartLabels[chartLabels.length - 1] ?? "Sun"}</p>
                        <p className="text-xs font-bold text-primary">{chartTooltipValues.last} kWh</p>
                      </div>
                    </foreignObject>
                  </g>
                </svg>

                <div className="mt-4 flex justify-between text-[10px] font-label uppercase tracking-tighter text-on-surface-variant opacity-60">
                  {chartLabels.map((label, index) => (
                    <span key={`${label}-${index}`}>{label}</span>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
            <div className="rounded-[1.5rem] border border-outline-variant/15 bg-surface-container p-6 md:col-span-1">
              <div className="mb-6 flex items-center gap-3">
                <div className="rounded-xl bg-secondary/10 p-3 text-secondary">
                  <span className="material-symbols-outlined">lightbulb</span>
                </div>
                <h3 className="text-lg font-headline font-bold">Smart Insights</h3>
              </div>

              <div className="space-y-6">
                <div>
                  <p className="mb-2 text-xs font-label uppercase tracking-wider text-on-surface-variant">Peak Usage Hour</p>
                  <p className="text-sm leading-relaxed text-on-surface">
                    Your consumption spikes between <span className="font-bold text-secondary">18:00 - 20:00</span>. Consider scheduling laundry during off-peak morning
                    hours.
                  </p>
                </div>

                <div className="border-t border-outline-variant/10 pt-4">
                  <p className="mb-2 text-xs font-label uppercase tracking-wider text-on-surface-variant">Efficiency Rating</p>
                  <div className="h-2 w-full overflow-hidden rounded-full bg-surface-variant">
                    <div className="h-full w-[75%] rounded-full bg-primary" />
                  </div>
                  <p className="mt-2 text-xs text-on-surface">Top 15% in your area</p>
                </div>
              </div>
            </div>

            <div className="overflow-hidden rounded-[1.5rem] bg-surface-container md:col-span-2">
              <div className="flex items-center justify-between px-8 py-6">
                <h3 className="text-lg font-headline font-bold">Detailed Logs</h3>
                <button className="text-xs font-label uppercase tracking-widest text-primary hover:underline">Download CSV</button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead className="bg-surface-container-high text-xs font-label uppercase tracking-widest text-on-surface-variant">
                    <tr>
                      <th className="px-8 py-4 font-medium">Date and Time</th>
                      <th className="px-8 py-4 font-medium">Event</th>
                      <th className="px-8 py-4 text-right font-medium">Energy</th>
                      <th className="px-8 py-4 text-right font-medium">Financial</th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-outline-variant/5">
                    {historyData.logs.length > 0 ? (
                      historyData.logs.map((log) => {
                        const dateTime = formatDateTime(log.occurred_at);
                        const styles = resolveLogStyles(log.event_type);

                        return (
                          <tr className="group transition-colors hover:bg-surface-variant/30" key={log.id}>
                            <td className="px-8 py-5">
                              <div className="flex flex-col">
                                <span className="font-medium text-on-surface">{dateTime.date}</span>
                                <span className="text-xs text-on-surface-variant">{dateTime.time}</span>
                              </div>
                            </td>

                            <td className="px-8 py-5">
                              <div className="flex items-center gap-2">
                                <span className={`h-2 w-2 rounded-full ${styles.dotClass}`} />
                                <span className="text-sm">{log.event_label}</span>
                              </div>
                            </td>

                            <td className={`px-8 py-5 text-right ${styles.energyClass}`}>{formatEnergy(log)}</td>
                            <td className={`px-8 py-5 text-right ${styles.financialClass}`}>{formatFinancial(log)}</td>
                          </tr>
                        );
                      })
                    ) : (
                      <tr>
                        <td className="px-8 py-5 text-sm text-on-surface-variant" colSpan={4}>
                          No events found yet.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </section>
      </main>

      <nav className="fixed bottom-0 left-0 z-50 flex w-full items-center justify-around rounded-t-[2rem] bg-[#0f1930]/40 px-4 pb-6 pt-3 shadow-[0_-10px_30px_rgba(0,0,0,0.2)] backdrop-blur-2xl md:hidden">
        <Link className="flex scale-90 flex-col items-center justify-center px-5 py-2 text-[#dee5ff]/60 transition-transform hover:text-[#69f6b8] active:scale-95" to="/">
          <span className="material-symbols-outlined">home</span>
          <span className="font-inter text-[10px] font-medium tracking-[0.05em]">Home</span>
        </Link>

        <Link className="flex scale-90 flex-col items-center justify-center rounded-2xl bg-[#69f6b8]/10 px-5 py-2 text-[#69f6b8] transition-transform active:scale-95" to="/history">
          <span className="material-symbols-outlined">receipt_long</span>
          <span className="font-inter text-[10px] font-medium tracking-[0.05em]">History</span>
        </Link>

        <Link className="flex scale-90 flex-col items-center justify-center px-5 py-2 text-[#dee5ff]/60 transition-transform hover:text-[#69f6b8] active:scale-95" to="/top-up">
          <span className="material-symbols-outlined">add_circle</span>
          <span className="font-inter text-[10px] font-medium tracking-[0.05em]">Top-up</span>
        </Link>

        <Link className="flex scale-90 flex-col items-center justify-center px-5 py-2 text-[#dee5ff]/60 transition-transform hover:text-[#69f6b8] active:scale-95" to="/settings">
          <span className="material-symbols-outlined">settings</span>
          <span className="font-inter text-[10px] font-medium tracking-[0.05em]">Settings</span>
        </Link>
      </nav>
    </div>
  );
}

export default HistoryView;
