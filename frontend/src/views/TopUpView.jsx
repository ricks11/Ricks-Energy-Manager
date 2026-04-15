import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { createTopUp } from "../api/client";

const RATE = 0.25;

const bundles = [
  { id: "starter", label: "Starter", kwh: 50, price: 12.5 },
  { id: "standard", label: "Standard", kwh: 100, price: 24.0, popular: true },
  { id: "heavy", label: "Heavy", kwh: 500, price: 115.0 },
];

const paymentMethods = [
  { id: "credit-card", label: "Credit Card", icon: "credit_card" },
  { id: "digital-wallet", label: "Digital Wallet", icon: "account_balance_wallet" },
  { id: "bank-transfer", label: "Bank Transfer", icon: "account_balance" },
];

function TopUpView() {
  const [kwh, setKwh] = useState(100);
  const [selectedBundle, setSelectedBundle] = useState("standard");
  const [selectedMethod, setSelectedMethod] = useState("credit-card");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedback, setFeedback] = useState("");
  const [newBalanceKwh, setNewBalanceKwh] = useState(null);
  const [serverEstimatedDays, setServerEstimatedDays] = useState(null);

  const total = useMemo(() => kwh * RATE, [kwh]);
  const estimatedDays = useMemo(() => Math.max(0, Math.round(kwh / 7)), [kwh]);

  function handleBundleClick(bundle) {
    setSelectedBundle(bundle.id);
    setKwh(bundle.kwh);
  }

  function handleKwhChange(event) {
    const nextValue = Number.parseFloat(event.target.value);
    setSelectedBundle(null);
    setKwh(Number.isFinite(nextValue) && nextValue >= 0 ? nextValue : 0);
  }

  async function handleConfirmPurchase() {
    if (kwh <= 0 || isSubmitting) {
      return;
    }

    const selectedPaymentMethod = paymentMethods.find((method) => method.id === selectedMethod)?.label ?? "Credit Card";

    setIsSubmitting(true);
    setFeedback("");

    try {
      const payload = await createTopUp({
        kwh,
        payment_method: selectedPaymentMethod,
      });

      setNewBalanceKwh(payload.new_balance_kwh);
      setServerEstimatedDays(payload.estimated_extension_days);
      setFeedback(`Top-up confirmado. Novo saldo: ${payload.new_balance_kwh.toFixed(2)} kWh.`);
    } catch (error) {
      setFeedback(error instanceof Error ? error.message : "Nao foi possivel concluir a compra.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen bg-surface">
      <header className="fixed top-0 z-50 flex h-16 w-full items-center justify-between bg-[#060e20]/60 px-6 shadow-[0_20px_40px_rgba(0,0,0,0.1)] backdrop-blur-3xl">
        <div className="flex items-center gap-2">
          <span className="font-headline text-xl font-black tracking-tight text-[#69f6b8]">Ricks Energy Manager</span>
        </div>

        <nav className="hidden items-center gap-8 md:flex">
          <Link className="rounded-lg px-3 py-1 font-headline text-lg font-bold text-[#dee5ff]/70 transition-colors hover:bg-[#192540]" to="/">
            Overview
          </Link>
          <Link className="rounded-lg px-3 py-1 font-headline text-lg font-bold text-[#dee5ff]/70 transition-colors hover:bg-[#192540]" to="/history">
            History
          </Link>
          <Link className="rounded-lg px-3 py-1 font-headline text-lg font-bold text-[#69f6b8] transition-colors hover:bg-[#192540]" to="/top-up">
            Top-up
          </Link>
          <Link className="rounded-lg px-3 py-1 font-headline text-lg font-bold text-[#dee5ff]/70 transition-colors hover:bg-[#192540]" to="/settings">
            Settings
          </Link>
        </nav>

        <div className="flex items-center gap-4">
          <span className="material-symbols-outlined text-[#69f6b8]">notifications</span>
          <div className="h-8 w-8 overflow-hidden rounded-full border border-outline-variant/15 bg-surface-container">
            <img
              alt="User profile photo"
              className="h-full w-full object-cover"
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuAHZK1gPyJKdlayl11tV_xnDlkjZVihV_jjEvyH2iBO1YUads_7oyThhio5TJc_q1QfkfH4YNyfcPR0i8druzaZw47JsG3n4-ETuop8bHu8Tj_u1p83ZN_QY-cwvSzBQBzdqjrmoDka3cCCxnuVuRGsju1t-qv0997iVlsHgAsOYRDfEXBxy_GDdCoGClk7WmZmKMXnAVrZN87y0mDMMvEkTT65wnh6ofcIUDxwE_7CWRP-z8t-ybjQ09yGTyiB4TdAdtOmVkLOWVbJ"
            />
          </div>
        </div>
      </header>

      <main className="mx-auto grid max-w-6xl grid-cols-1 gap-8 px-4 pb-32 pt-24 md:grid-cols-12">
        <section className="space-y-8 md:col-span-7">
          <header>
            <p className="mb-2 text-xs font-label uppercase tracking-[0.05em] text-primary">Energy Refill</p>
            <h1 className="mb-4 font-headline text-4xl font-extrabold text-on-surface">Choose Your Package</h1>
            <p className="max-w-md text-on-surface-variant">Select a pre-defined bundle or enter a custom amount of kWh to instantly power your home.</p>
          </header>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            {bundles.map((bundle) => {
              const active = selectedBundle === bundle.id;

              return (
                <button
                  className={`group relative overflow-hidden rounded-2xl bg-surface-container p-6 text-left transition-all ${
                    active
                      ? "border-2 border-primary shadow-[0_0_30px_rgba(105,246,184,0.1)]"
                      : "border border-outline-variant/15 hover:border-primary/50"
                  }`}
                  key={bundle.id}
                  onClick={() => handleBundleClick(bundle)}
                  type="button"
                >
                  {bundle.popular ? (
                    <div className="absolute right-0 top-0 rounded-bl-xl bg-primary px-3 py-1 text-[10px] font-bold text-on-primary font-label">POPULAR</div>
                  ) : null}

                  <span className="mb-2 block text-[10px] font-label uppercase tracking-wider text-on-surface-variant">{bundle.label}</span>
                  <span className="mb-1 block font-headline text-3xl font-black text-on-surface">{bundle.kwh} kWh</span>
                  <span className="font-bold text-primary">EUR {bundle.price.toFixed(2)}</span>

                  <div className={`absolute -bottom-2 -right-2 transition-opacity ${active ? "opacity-10" : "opacity-5 group-hover:opacity-20"}`}>
                    <span className="material-symbols-outlined text-6xl" style={{ fontVariationSettings: '"FILL" 1' }}>
                      bolt
                    </span>
                  </div>
                </button>
              );
            })}
          </div>

          <div className="relative overflow-hidden rounded-3xl border border-outline-variant/10 bg-surface-container-low p-8">
            <div className="mb-6 flex items-center justify-between">
              <label className="block text-xs font-label uppercase tracking-widest text-on-surface-variant" htmlFor="kwhInput">
                Or Enter Custom Amount
              </label>

              <div className="flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3 py-1">
                <span className="material-symbols-outlined text-sm text-primary">info</span>
                <span className="text-[10px] font-bold tracking-wide text-primary">RATE: EUR 0.25 / kWh</span>
              </div>
            </div>

            <div className="flex flex-col items-stretch gap-6 md:flex-row md:items-center">
              <div className="group relative flex-1">
                <input
                  className="w-full rounded-2xl border-none bg-surface-container-lowest px-6 py-8 font-headline text-5xl font-black text-on-surface transition-all placeholder:text-surface-variant focus:ring-2 focus:ring-primary/30"
                  id="kwhInput"
                  min="0"
                  onChange={handleKwhChange}
                  placeholder="0"
                  type="number"
                  value={kwh}
                />
                <span className="absolute right-6 top-1/2 -translate-y-1/2 font-headline text-2xl font-bold text-on-surface-variant">kWh</span>
              </div>

              <div className="hidden items-center justify-center md:flex">
                <span className="material-symbols-outlined text-4xl text-primary">arrow_forward</span>
              </div>

              <div className="flex items-center justify-center md:hidden">
                <span className="material-symbols-outlined rotate-90 text-4xl text-primary">arrow_forward</span>
              </div>

              <div className="flex-1">
                <div className="flex w-full flex-col items-center justify-center rounded-2xl border border-primary/30 bg-primary/5 p-6 text-center">
                  <span className="mb-1 text-[10px] font-label uppercase tracking-widest text-on-surface-variant">Calculated Cost</span>
                  <div className="flex items-baseline gap-1">
                    <span className="font-headline text-2xl font-bold text-primary">EUR</span>
                    <span className="text-glow font-headline text-5xl font-black text-primary">{total.toFixed(2)}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="font-headline text-xl font-bold">Payment Method</h3>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              {paymentMethods.map((method) => {
                const active = selectedMethod === method.id;

                return (
                  <button
                    className={`flex cursor-pointer items-center gap-3 rounded-xl p-4 transition-colors ${
                      active
                        ? "border border-primary bg-surface-container"
                        : "border border-outline-variant/15 bg-surface-container hover:border-outline"
                    }`}
                    key={method.id}
                    onClick={() => setSelectedMethod(method.id)}
                    type="button"
                  >
                    <span className={`material-symbols-outlined ${active ? "text-primary" : "text-on-surface-variant"}`}>{method.icon}</span>
                    <span className="text-sm font-medium">{method.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </section>

        <aside className="md:col-span-5">
          <div className="relative sticky top-24 overflow-hidden rounded-[2rem] border border-outline-variant/15 bg-surface-container p-8 shadow-2xl">
            <div className="absolute -right-24 -top-24 h-64 w-64 rounded-full bg-primary/10 blur-[100px]" />

            <h2 className="mb-8 font-headline text-2xl font-black">Purchase Summary</h2>

            <div className="relative z-10 space-y-6">
              <div className="flex items-center justify-between border-b border-outline-variant/10 py-4">
                <span className="text-on-surface-variant">Energy Units</span>
                <span className="font-bold text-on-surface">{kwh.toFixed(2)} kWh</span>
              </div>

              <div className="flex items-center justify-between border-b border-outline-variant/10 py-4">
                <span className="text-on-surface-variant">Standard Rate</span>
                <span className="font-bold text-on-surface">EUR 0.25/kWh</span>
              </div>

              <div className="flex items-center justify-between border-b border-outline-variant/10 py-4">
                <span className="text-on-surface-variant">Service Fee</span>
                <span className="font-bold text-on-surface">EUR 0.00</span>
              </div>

              <div className="pt-6">
                <div className="mb-8 flex items-end justify-between">
                  <span className="text-xs font-label uppercase tracking-widest text-on-surface-variant">Total Cost</span>
                  <span className="text-glow font-headline text-5xl font-black text-primary">EUR {total.toFixed(2)}</span>
                </div>

                {newBalanceKwh !== null ? (
                  <div className="mb-4 flex items-center justify-between rounded-2xl border border-primary/20 bg-primary/5 px-4 py-3 text-sm">
                    <span className="text-on-surface-variant">Updated Balance</span>
                    <span className="font-bold text-primary">{newBalanceKwh.toFixed(2)} kWh</span>
                  </div>
                ) : null}

                <button
                  className="kinetic-gradient flex h-14 w-full items-center justify-center gap-3 rounded-2xl font-headline text-lg font-bold text-on-primary shadow-[0_10px_30px_rgba(105,246,184,0.3)] transition-all hover:scale-[1.02] active:scale-95 disabled:cursor-not-allowed disabled:opacity-70"
                  disabled={isSubmitting}
                  onClick={handleConfirmPurchase}
                  type="button"
                >
                  <span className={`material-symbols-outlined animate-spin ${isSubmitting ? "" : "hidden"}`}>sync</span>
                  <span>{isSubmitting ? "Processing..." : "Confirm Purchase"}</span>
                </button>

                <div className="mt-6 flex items-center justify-center gap-2 text-xs text-on-surface-variant/60">
                  <span className="material-symbols-outlined text-sm">lock</span>
                  Secure encrypted transaction
                </div>

                {feedback ? <p className="mt-4 text-center text-xs text-primary">{feedback}</p> : null}
              </div>
            </div>

            <div className="mt-10 border-t border-outline-variant/15 pt-8">
              <div className="flex items-center gap-4 rounded-2xl bg-surface-container-highest/50 p-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-secondary/10">
                  <span className="material-symbols-outlined text-secondary">info</span>
                </div>

                <p className="text-[11px] leading-relaxed text-on-surface-variant">
                  This recharge will extend your estimated energy availability by <span className="font-bold text-secondary">{serverEstimatedDays ?? estimatedDays} days</span> based on your last 30-day
                  usage average.
                </p>
              </div>
            </div>
          </div>
        </aside>
      </main>

      <footer className="fixed bottom-0 left-0 z-50 flex w-full items-center justify-around rounded-t-[2rem] bg-[#0f1930]/40 px-4 pb-6 pt-3 shadow-[0_-10px_30px_rgba(0,0,0,0.2)] backdrop-blur-2xl md:hidden">
        <Link className="flex scale-90 flex-col items-center justify-center px-5 py-2 text-[#dee5ff]/60 transition-transform hover:text-[#69f6b8] active:scale-95" to="/">
          <span className="material-symbols-outlined">home</span>
          <span className="font-inter text-[10px] font-medium tracking-[0.05em]">Home</span>
        </Link>

        <Link className="flex scale-90 flex-col items-center justify-center px-5 py-2 text-[#dee5ff]/60 transition-transform hover:text-[#69f6b8] active:scale-95" to="/history">
          <span className="material-symbols-outlined">receipt_long</span>
          <span className="font-inter text-[10px] font-medium tracking-[0.05em]">History</span>
        </Link>

        <Link className="flex scale-90 flex-col items-center justify-center rounded-2xl bg-[#69f6b8]/10 px-5 py-2 text-[#69f6b8] transition-transform active:scale-95" to="/top-up">
          <span className="material-symbols-outlined" style={{ fontVariationSettings: '"FILL" 1' }}>
            add_circle
          </span>
          <span className="font-inter text-[10px] font-medium tracking-[0.05em]">Top-up</span>
        </Link>

        <Link className="flex scale-90 flex-col items-center justify-center px-5 py-2 text-[#dee5ff]/60 transition-transform hover:text-[#69f6b8] active:scale-95" to="/settings">
          <span className="material-symbols-outlined">settings</span>
          <span className="font-inter text-[10px] font-medium tracking-[0.05em]">Settings</span>
        </Link>
      </footer>
    </div>
  );
}

export default TopUpView;
