import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { createMeterReading, getEnergySummary } from "../api/client";

function DashboardView() {
  const [summary, setSummary] = useState({
    balanceKwh: 1240,
    estimatedDays: 12,
    averageDailyConsumption: 103.3,
    meterId: "4829-X",
    serviceStatus: "ok",
    lastUpdated: null,
  });
  const [summaryError, setSummaryError] = useState("");
  const [meterReadingValue, setMeterReadingValue] = useState("");
  const [isMeterReadingSubmitting, setIsMeterReadingSubmitting] = useState(false);
  const [meterReadingFeedback, setMeterReadingFeedback] = useState({ type: "", message: "" });

  const refreshSummary = useCallback(async () => {
    const payload = await getEnergySummary();

    setSummary({
      balanceKwh: payload.balance_kwh,
      estimatedDays: payload.estimated_days_remaining,
      averageDailyConsumption: payload.average_daily_consumption,
      meterId: payload.meter_id,
      serviceStatus: payload.service_status,
      lastUpdated: payload.last_updated,
    });
    setSummaryError("");
  }, []);

  useEffect(() => {
    let isCancelled = false;

    async function loadSummary() {
      try {
        await refreshSummary();
      } catch {
        if (!isCancelled) {
          setSummaryError("Sem ligacao com a API. Exibindo dados locais.");
        }
      }
    }

    loadSummary();

    return () => {
      isCancelled = true;
    };
  }, [refreshSummary]);

  async function handleMeterReadingSubmit(event) {
    event.preventDefault();

    const numericValue = Number(meterReadingValue);
    if (!Number.isFinite(numericValue) || numericValue < 0) {
      setMeterReadingFeedback({
        type: "error",
        message: "Informe uma leitura valida maior ou igual a 0.",
      });
      return;
    }

    setIsMeterReadingSubmitting(true);
    setMeterReadingFeedback({ type: "", message: "" });

    try {
      await createMeterReading({ meter_kwh: numericValue });
      await refreshSummary();

      setMeterReadingValue("");
      setMeterReadingFeedback({
        type: "success",
        message: "Leitura registada com sucesso.",
      });
    } catch (error) {
      setMeterReadingFeedback({
        type: "error",
        message: error instanceof Error ? error.message : "Nao foi possivel registar a leitura.",
      });
    } finally {
      setIsMeterReadingSubmitting(false);
    }
  }

  const formattedBalance = useMemo(
    () =>
      new Intl.NumberFormat("en-US", {
        minimumFractionDigits: 0,
        maximumFractionDigits: 2,
      }).format(summary.balanceKwh),
    [summary.balanceKwh]
  );

  const formattedUpdatedAt = useMemo(() => {
    if (!summary.lastUpdated) {
      return "A sincronizar...";
    }

    return new Date(summary.lastUpdated).toLocaleString("pt-PT", {
      day: "2-digit",
      month: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  }, [summary.lastUpdated]);

  return (
    <div className="flex min-h-screen overflow-hidden bg-surface text-on-background">
      <aside className="hidden h-screen w-72 shrink-0 flex-col border-r border-outline-variant/10 bg-[#091328] px-4 py-8 md:flex">
        <div className="mb-12 px-2">
          <span className="text-2xl font-black tracking-tight text-[#69f6b8]">Ricks Energy Manager</span>
          <p className="mt-1 text-xs font-label uppercase tracking-wide text-on-surface-variant">Meter ID: {summary.meterId}</p>
        </div>

        <nav className="flex-1 space-y-2">
          <Link className="flex items-center gap-3 border-r-2 border-[#69f6b8] bg-[#0f1930] px-4 py-3 text-[#69f6b8] transition-all" to="/">
            <span className="material-symbols-outlined">dashboard</span>
            <span className="text-xs font-bold uppercase tracking-wide font-headline">Overview</span>
          </Link>

          <Link className="translate-x-1 duration-300 flex items-center gap-3 px-4 py-3 text-[#dee5ff]/50 transition-all hover:bg-[#192540] hover:text-[#dee5ff]" to="/history">
            <span className="material-symbols-outlined">history</span>
            <span className="text-xs font-bold uppercase tracking-wide font-headline">History</span>
          </Link>

          <Link className="translate-x-1 duration-300 flex items-center gap-3 px-4 py-3 text-[#dee5ff]/50 transition-all hover:bg-[#192540] hover:text-[#dee5ff]" to="/top-up">
            <span className="material-symbols-outlined">bolt</span>
            <span className="text-xs font-bold uppercase tracking-wide font-headline">Top-up</span>
          </Link>

          <Link className="translate-x-1 duration-300 flex items-center gap-3 px-4 py-3 text-[#dee5ff]/50 transition-all hover:bg-[#192540] hover:text-[#dee5ff]" to="/settings">
            <span className="material-symbols-outlined">settings</span>
            <span className="text-xs font-bold uppercase tracking-wide font-headline">Settings</span>
          </Link>
        </nav>

        <div className="space-y-2 border-t border-outline-variant/10 pt-8">
          <Link className="mb-4 block w-full rounded-xl bg-primary py-4 text-center font-bold text-on-primary shadow-[0_0_20px_rgba(105,246,184,0.2)] transition-transform active:scale-95" to="/top-up">
            Quick Top-up
          </Link>

          <a className="flex items-center gap-3 px-4 py-2 text-[#dee5ff]/50 transition-all hover:text-[#dee5ff]" href="#">
            <span className="material-symbols-outlined">help</span>
            <span className="text-xs font-bold uppercase tracking-wide font-headline">Help</span>
          </a>

          <a className="flex items-center gap-3 px-4 py-2 text-[#dee5ff]/50 transition-all hover:text-[#dee5ff]" href="#">
            <span className="material-symbols-outlined">logout</span>
            <span className="text-xs font-bold uppercase tracking-wide font-headline">Logout</span>
          </a>
        </div>
      </aside>

      <main className="relative flex flex-1 flex-col overflow-y-auto pb-32 md:pb-8">
        <header className="fixed top-0 z-50 flex h-16 w-full items-center justify-between bg-[#060e20]/60 px-6 shadow-[0_20px_40px_rgba(0,0,0,0.1)] backdrop-blur-3xl md:relative">
          <div className="flex items-center gap-4">
            <span className="text-xl font-black tracking-tight text-[#69f6b8] md:hidden">Ricks Energy Manager</span>

            <div className="flex flex-col">
              <h1 className="hidden text-lg font-bold font-headline text-[#dee5ff] md:block">Dashboard Energy</h1>
              <p className="hidden text-[10px] font-medium leading-none text-on-surface-variant md:block">Ultima atualizacao: {formattedUpdatedAt}</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <button className="rounded-full p-2 text-[#dee5ff]/70 transition-colors hover:bg-[#192540]">
              <span className="material-symbols-outlined">notifications</span>
            </button>

            <div className="h-10 w-10 overflow-hidden rounded-full border border-outline-variant/20 bg-surface-container">
              <img
                alt="User profile photo"
                className="h-full w-full object-cover"
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuCDE3ws0wA6P2LIxoXEt1kr5EaCJ455tPNKEwCWWlJ0tAMZqDXJVUPxkRGriesMfPjc7Hnh_l_EpfCkJeD46PeZnjxsNnN-l4bFvkzLsxfW71awEGw3LcE443fLgo7ui6jdNwjz22I8DO4jLFOTbuugYFQ9uJVTWYJ_aOF724p-he9ZZ9SMHvt6qri1cI89WO2LRZrNaiB6sn5vhbPWO1KoqmJAOo-mbGYdACWiPqHatmYAgdsgiVFWKztz7ZV5FVc5Xgj11mZb2sew"
              />
            </div>
          </div>
        </header>

        <div className="mx-auto w-full max-w-7xl space-y-8 px-6 pt-24 md:pt-8">
          <section className="grid grid-cols-1 gap-6 lg:grid-cols-12">
            <div className="group relative overflow-hidden rounded-xl bg-surface-container p-8 lg:col-span-8">
              <div className="absolute right-0 top-0 -mr-32 -mt-32 h-64 w-64 bg-primary/5 blur-[100px]" />

              <div className="relative z-10 flex flex-col items-start justify-between gap-8 md:flex-row md:items-center">
                <div className="space-y-4">
                  <span className="text-xs font-semibold uppercase tracking-[0.1em] text-on-surface-variant font-label">Saldo Atual</span>

                  <div className="flex items-baseline gap-2">
                    <span className="text-7xl font-extrabold tracking-tighter text-on-surface font-headline">{formattedBalance}</span>
                    <span className="text-2xl font-medium text-primary font-headline">kWh</span>
                  </div>

                  <div className="flex w-fit items-center gap-2 rounded-full bg-primary/10 px-4 py-2 text-primary">
                    <span className="material-symbols-outlined text-sm" style={{ fontVariationSettings: '"FILL" 1' }}>
                      electric_bolt
                    </span>
                    <span className="text-sm font-bold font-body">{summary.serviceStatus === "ok" ? "Sistema Ativo" : "Sistema Offline"}</span>
                  </div>

                  {summaryError ? <p className="text-xs text-tertiary">{summaryError}</p> : null}
                </div>

                <div className="flex flex-col items-center space-y-4 rounded-xl border border-outline-variant/10 bg-surface-container-low/50 p-6 text-center backdrop-blur-md">
                  <span className="font-bold text-on-surface font-headline">Dias Estimados de Energia</span>

                  <div className="relative flex items-center justify-center">
                    <svg className="h-32 w-32 -rotate-90 transform" viewBox="0 0 128 128">
                      <circle className="text-surface-variant" cx="64" cy="64" fill="transparent" r="58" stroke="currentColor" strokeWidth="8" />
                      <circle
                        className="text-primary"
                        cx="64"
                        cy="64"
                        fill="transparent"
                        r="58"
                        stroke="currentColor"
                        strokeDasharray="364.4"
                        strokeDashoffset="109.3"
                        strokeWidth="8"
                      />
                    </svg>

                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <span className="text-3xl font-black text-on-surface font-headline">{summary.estimatedDays}</span>
                      <span className="text-[10px] uppercase text-on-surface-variant font-label">Dias</span>
                    </div>
                  </div>

                  <p className="text-sm text-on-surface-variant">Consumo medio: {summary.averageDailyConsumption.toFixed(1)} kWh/dia</p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-6 lg:col-span-4">
              <div className="flex flex-col justify-between rounded-xl border border-secondary/20 bg-surface-container-high p-6 shadow-[0_0_20px_rgba(248,160,16,0.05)] transition-all hover:border-secondary/50">
                <div className="flex items-start justify-between">
                  <span className="material-symbols-outlined text-4xl text-secondary" style={{ fontVariationSettings: '"FILL" 1' }}>
                    warning
                  </span>
                  <span className="rounded bg-secondary/10 px-2 py-1 text-[10px] font-bold uppercase text-secondary font-label">Alerta</span>
                </div>

                <div>
                  <h3 className="mt-4 text-lg font-bold text-on-surface font-headline">Eficiencia Baixa</h3>
                  <p className="mt-1 text-sm text-on-surface-variant">Uso de energia aumentou 15% esta semana comparado ao mes anterior.</p>
                  <a className="group/link mt-3 inline-flex items-center gap-1 text-xs font-bold text-secondary hover:underline" href="#">
                    Como melhorar?
                    <span className="material-symbols-outlined text-xs transition-transform group-hover/link:translate-x-1">arrow_forward</span>
                  </a>
                </div>
              </div>
            </div>
          </section>

          <section className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <div className="rounded-xl border border-outline-variant/10 bg-surface-container p-6">
              <div className="mb-6 flex items-center gap-3">
                <div className="rounded-lg bg-surface-variant p-3">
                  <span className="material-symbols-outlined text-primary">speed</span>
                </div>
                <h2 className="text-xl font-bold font-headline">Nova Leitura do Contador</h2>
              </div>

              <form className="space-y-4" onSubmit={handleMeterReadingSubmit}>
                <div>
                  <label className="mb-2 block text-[10px] uppercase tracking-wider text-on-surface-variant font-label">Leitura Atual (kWh)</label>
                  <input
                    className="w-full rounded-xl border-none bg-surface-container-lowest px-6 py-4 text-lg text-on-surface transition-all font-headline focus:bg-surface-container-high focus:ring-2 focus:ring-primary/30"
                    min="0"
                    placeholder="000000.00"
                    step="0.01"
                    type="number"
                    value={meterReadingValue}
                    onChange={(event) => setMeterReadingValue(event.target.value)}
                  />
                </div>

                <button
                  className="group relative flex w-full items-center justify-center gap-3 overflow-hidden rounded-xl bg-primary py-4 font-bold text-on-primary shadow-[0_10px_20px_rgba(105,246,184,0.15)] transition-transform disabled:cursor-not-allowed disabled:opacity-60 active:scale-95"
                  disabled={isMeterReadingSubmitting}
                  type="submit"
                >
                  <span>{isMeterReadingSubmitting ? "A registar..." : "Registar Agora"}</span>
                  <span className="material-symbols-outlined text-sm text-on-primary transition-transform group-hover:translate-x-1">
                    {isMeterReadingSubmitting ? "hourglass_top" : "arrow_forward"}
                  </span>
                </button>

                {meterReadingFeedback.message ? (
                  <p className={`text-xs ${meterReadingFeedback.type === "error" ? "text-tertiary" : "text-primary"}`}>{meterReadingFeedback.message}</p>
                ) : null}
              </form>
            </div>

            <div className="rounded-xl border border-outline-variant/10 bg-surface-container p-6">
              <div className="mb-6 flex items-center gap-3">
                <div className="rounded-lg bg-surface-variant p-3 text-secondary">
                  <span className="material-symbols-outlined">add_circle</span>
                </div>
                <h2 className="text-xl font-bold font-headline">Recarga de kWh</h2>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="mb-2 block text-[10px] uppercase tracking-wider text-on-surface-variant font-label">Valor de Recarga</label>

                  <div className="relative">
                    <input
                      className="w-full rounded-xl border-none bg-surface-container-lowest py-4 pl-6 pr-16 text-lg text-on-surface transition-all font-headline focus:bg-surface-container-high focus:ring-2 focus:ring-secondary/30"
                      placeholder="0"
                      type="number"
                    />
                    <span className="absolute right-6 top-1/2 -translate-y-1/2 font-bold text-on-surface-variant">kWh</span>
                  </div>
                </div>

                <button className="group flex w-full items-center justify-center gap-3 rounded-xl bg-primary py-4 font-bold text-on-primary shadow-[0_10px_20px_rgba(105,246,184,0.15)] transition-transform active:scale-95">
                  <span>Adicionar</span>
                  <div className="hidden h-5 w-5 animate-spin rounded-full border-2 border-on-primary/30 border-t-on-primary" />
                  <span className="material-symbols-outlined text-sm" style={{ fontVariationSettings: '"FILL" 1' }}>
                    bolt
                  </span>
                </button>
              </div>
            </div>
          </section>

          <section className="rounded-xl border border-outline-variant/10 bg-surface-container p-6 md:p-8">
            <div className="mb-8 flex flex-col items-start justify-between gap-4 md:flex-row md:items-center">
              <div>
                <h2 className="text-2xl font-bold font-headline">Historico de Consumo</h2>
                <p className="text-sm text-on-surface-variant">Ultimos 7 dias de atividade</p>
              </div>

              <div className="flex rounded-lg bg-surface-container-low p-1">
                <button className="rounded-md bg-surface-variant px-4 py-1 text-xs font-bold text-primary shadow-sm">Dia</button>
                <button className="px-4 py-1 text-xs font-bold text-on-surface-variant hover:text-on-surface">Semana</button>
                <button className="px-4 py-1 text-xs font-bold text-on-surface-variant hover:text-on-surface">Mes</button>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="flex h-64 w-8 flex-col justify-between pb-8 text-right text-[10px] font-bold text-on-surface-variant/40">
                <span>30</span>
                <span>20</span>
                <span>10</span>
                <span>0</span>
              </div>

              <div className="group relative flex h-64 flex-1 items-end justify-between gap-2">
                <svg className="absolute inset-0 h-full w-full overflow-visible" preserveAspectRatio="none" viewBox="0 0 700 256">
                  <defs>
                    <linearGradient id="chartGradient" x1="0" x2="0" y1="0" y2="1">
                      <stop offset="0%" stopColor="#69f6b8" stopOpacity="0.3" />
                      <stop offset="100%" stopColor="#69f6b8" stopOpacity="0" />
                    </linearGradient>
                  </defs>

                  <path d="M0,180 Q100,120 200,150 T400,80 T700,40 L700,256 L0,256 Z" fill="url(#chartGradient)" />
                  <path d="M0,180 Q100,120 200,150 T400,80 T700,40" fill="transparent" stroke="#69f6b8" strokeLinecap="round" strokeWidth="4" />

                  <g className="group/dot cursor-pointer">
                    <circle className="chart-point" cx="200" cy="150" fill="#69f6b8" r="6" stroke="#0f1930" strokeWidth="2" />
                    <foreignObject className="chart-tooltip" height="30" width="60" x="170" y="110">
                      <div className="rounded border border-outline-variant/20 bg-surface-bright px-2 py-1 text-center text-[10px] font-bold text-on-surface shadow-lg">14 kWh</div>
                    </foreignObject>
                  </g>

                  <g className="group/dot cursor-pointer">
                    <circle className="chart-point" cx="400" cy="80" fill="#69f6b8" r="6" stroke="#0f1930" strokeWidth="2" />
                    <foreignObject className="chart-tooltip" height="30" width="60" x="370" y="40">
                      <div className="rounded border border-outline-variant/20 bg-surface-bright px-2 py-1 text-center text-[10px] font-bold text-on-surface shadow-lg">22 kWh</div>
                    </foreignObject>
                  </g>

                  <g className="group/dot cursor-pointer">
                    <circle className="chart-point" cx="700" cy="40" fill="#69f6b8" r="6" stroke="#0f1930" strokeWidth="2" />
                    <foreignObject className="chart-tooltip" height="30" width="60" x="640" y="0">
                      <div className="rounded border border-outline-variant/20 bg-surface-bright px-2 py-1 text-center text-[10px] font-bold text-on-surface shadow-lg">28 kWh</div>
                    </foreignObject>
                  </g>
                </svg>

                <div className="pointer-events-none absolute inset-0 flex flex-col justify-between py-4 text-[10px] text-on-surface-variant/30">
                  <div className="w-full border-t border-outline-variant/10" />
                  <div className="w-full border-t border-outline-variant/10" />
                  <div className="w-full border-t border-outline-variant/10" />
                  <div className="w-full border-t border-outline-variant/10" />
                </div>

                <div className="absolute inset-x-0 -bottom-8 flex justify-between text-[10px] font-bold uppercase text-on-surface-variant font-label">
                  <span>Seg</span>
                  <span>Ter</span>
                  <span>Qua</span>
                  <span>Qui</span>
                  <span>Sex</span>
                  <span>Sab</span>
                  <span>Dom</span>
                </div>
              </div>
            </div>
          </section>
        </div>
      </main>

      <nav className="fixed bottom-0 left-0 z-50 flex w-full items-center justify-around rounded-t-[2rem] bg-[#0f1930]/40 px-4 pb-6 pt-3 shadow-[0_-10px_30px_rgba(0,0,0,0.2)] backdrop-blur-2xl md:hidden">
        <Link className="flex scale-90 flex-col items-center justify-center rounded-2xl bg-[#69f6b8]/10 px-5 py-2 text-[#69f6b8] transition-transform" to="/">
          <span className="material-symbols-outlined">home</span>
          <span className="text-[10px] font-medium tracking-[0.05em] font-inter">Home</span>
        </Link>

        <Link className="flex flex-col items-center justify-center px-5 py-2 text-[#dee5ff]/60 transition-transform hover:text-[#69f6b8]" to="/history">
          <span className="material-symbols-outlined">receipt_long</span>
          <span className="text-[10px] font-medium tracking-[0.05em] font-inter">History</span>
        </Link>

        <Link className="flex flex-col items-center justify-center px-5 py-2 text-[#dee5ff]/60 transition-transform hover:text-[#69f6b8]" to="/top-up">
          <span className="material-symbols-outlined">add_circle</span>
          <span className="text-[10px] font-medium tracking-[0.05em] font-inter">Top-up</span>
        </Link>

        <Link className="flex flex-col items-center justify-center px-5 py-2 text-[#dee5ff]/60 transition-transform hover:text-[#69f6b8]" to="/settings">
          <span className="material-symbols-outlined">settings</span>
          <span className="text-[10px] font-medium tracking-[0.05em] font-inter">Settings</span>
        </Link>
      </nav>
    </div>
  );
}

export default DashboardView;
