import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getPreferences, getProfile, updatePreferences, updateProfile as updateProfileRequest } from "../api/client";

function SettingsView() {
  const [profile, setProfile] = useState({
    fullName: "Alexander Thorne",
    email: "a.thorne@kinetic.io",
    phone: "+1 (555) 0482-990",
    memberTier: "Elite Member",
    memberCode: "4829-X-2024",
    meterId: "4829-X",
    avatarUrl:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuAX2i4wMD24KXjbnQZPWsW0OMhyHTXMQ4IjNy8mfzinYjgsvdsojetVDD37ka4XSX9p7sr2_URp6dA6rnBlzT4ohJbiatUEvTWMdQsXG0mqfr7cAqfT_gUKrq8I4Y7yaeDYt6vaxcbipXbhRzpqUkizDo5wSNtUP_vrVGnX6FKVlRPgv0M_G7gEu4tNcTqS1KXav7U-z8vuPDvRMVKQjGUwXV4JlWu9fSL4xBU1tZRdH0ooBAtPzKvwvQpbNyk4zcDVElpYorUy-EhX",
  });
  const [alertThreshold, setAlertThreshold] = useState(2);
  const [pushEnabled, setPushEnabled] = useState(true);
  const [darkModeEnabled, setDarkModeEnabled] = useState(true);
  const [language, setLanguage] = useState("English (US)");
  const [profileMessage, setProfileMessage] = useState("");
  const [preferencesMessage, setPreferencesMessage] = useState("");
  const [isSavingProfile, setIsSavingProfile] = useState(false);

  useEffect(() => {
    let isCancelled = false;

    async function loadSettings() {
      try {
        const [profilePayload, preferencesPayload] = await Promise.all([getProfile(), getPreferences()]);

        if (!isCancelled) {
          setProfile((current) => ({
            ...current,
            fullName: profilePayload.full_name,
            email: profilePayload.email,
            phone: profilePayload.phone,
            memberTier: profilePayload.member_tier,
            memberCode: profilePayload.member_code,
            meterId: profilePayload.meter_id,
            avatarUrl: profilePayload.avatar_url,
          }));

          setAlertThreshold(preferencesPayload.alert_threshold_days);
          setPushEnabled(preferencesPayload.push_notifications);
          setDarkModeEnabled(preferencesPayload.dark_mode);
          setLanguage(preferencesPayload.language);
        }
      } catch {
        if (!isCancelled) {
          setPreferencesMessage("Falha ao carregar configuracoes da API. Exibindo dados locais.");
        }
      }
    }

    loadSettings();

    return () => {
      isCancelled = true;
    };
  }, []);

  function updateProfileField(field, value) {
    setProfile((current) => ({ ...current, [field]: value }));
  }

  async function handleSaveProfile() {
    setIsSavingProfile(true);
    setProfileMessage("");

    try {
      const payload = await updateProfileRequest({
        full_name: profile.fullName,
        email: profile.email,
        phone: profile.phone,
      });

      setProfile((current) => ({
        ...current,
        fullName: payload.full_name,
        email: payload.email,
        phone: payload.phone,
        memberTier: payload.member_tier,
        memberCode: payload.member_code,
        meterId: payload.meter_id,
        avatarUrl: payload.avatar_url,
      }));
      setProfileMessage("Perfil atualizado com sucesso.");
    } catch (error) {
      setProfileMessage(error instanceof Error ? error.message : "Falha ao atualizar perfil.");
    } finally {
      setIsSavingProfile(false);
    }
  }

  async function persistPreferences(payload) {
    try {
      const response = await updatePreferences(payload);
      setAlertThreshold(response.alert_threshold_days);
      setPushEnabled(response.push_notifications);
      setDarkModeEnabled(response.dark_mode);
      setLanguage(response.language);
      setPreferencesMessage("Preferencias salvas.");
    } catch (error) {
      setPreferencesMessage(error instanceof Error ? error.message : "Falha ao salvar preferencias.");
    }
  }

  function handleAlertThresholdChange(nextValue) {
    setAlertThreshold(nextValue);
    persistPreferences({ alert_threshold_days: nextValue });
  }

  function togglePushNotifications() {
    const nextValue = !pushEnabled;
    setPushEnabled(nextValue);
    persistPreferences({ push_notifications: nextValue });
  }

  function toggleDarkMode() {
    const nextValue = !darkModeEnabled;
    setDarkModeEnabled(nextValue);
    persistPreferences({ dark_mode: nextValue });
  }

  return (
    <div className="min-h-screen bg-surface pb-32 font-body text-on-surface selection:bg-primary selection:text-on-primary md:pb-0">
      <header className="fixed top-0 z-50 flex h-16 w-full items-center justify-between bg-[#060e20]/60 px-6 shadow-[0_20px_40px_rgba(0,0,0,0.1)] backdrop-blur-3xl">
        <div className="flex items-center gap-2">
          <span className="font-headline text-xl font-black tracking-tight text-[#69f6b8]">Ricks Energy Manager</span>
        </div>

        <div className="flex items-center gap-4">
          <button className="rounded-full p-2 transition-colors hover:bg-[#192540]" type="button">
            <span className="material-symbols-outlined text-[#dee5ff]/70">notifications</span>
          </button>

          <div className="h-8 w-8 overflow-hidden rounded-full ring-2 ring-[#69f6b8]/20">
            <img
              alt="User profile photo"
              className="h-full w-full object-cover"
              src={profile.avatarUrl}
            />
          </div>
        </div>
      </header>

      <div className="flex min-h-screen pt-16">
        <aside className="sticky top-16 hidden h-screen w-72 flex-col bg-[#091328] px-4 py-8 md:flex">
          <div className="mb-8 px-4">
            <h2 className="font-headline text-2xl font-black text-[#69f6b8]">Energy Command</h2>
            <p className="text-[10px] font-label uppercase tracking-wide text-[#dee5ff]/50">Meter ID: {profile.meterId}</p>
          </div>

          <nav className="flex-1 space-y-2">
            <Link className="flex items-center gap-3 px-4 py-3 text-xs font-label uppercase tracking-wide text-[#dee5ff]/50 transition-all hover:bg-[#192540] hover:text-[#dee5ff]" to="/">
              <span className="material-symbols-outlined">dashboard</span>
              <span>Overview</span>
            </Link>

            <Link className="flex items-center gap-3 px-4 py-3 text-xs font-label uppercase tracking-wide text-[#dee5ff]/50 transition-all hover:bg-[#192540] hover:text-[#dee5ff]" to="/history">
              <span className="material-symbols-outlined">history</span>
              <span>History</span>
            </Link>

            <Link className="flex items-center gap-3 px-4 py-3 text-xs font-label uppercase tracking-wide text-[#dee5ff]/50 transition-all hover:bg-[#192540] hover:text-[#dee5ff]" to="/top-up">
              <span className="material-symbols-outlined">bolt</span>
              <span>Top-up</span>
            </Link>

            <Link className="flex items-center gap-3 border-r-2 border-[#69f6b8] bg-[#0f1930] px-4 py-3 text-xs font-label uppercase tracking-wide text-[#69f6b8] transition-all" to="/settings">
              <span className="material-symbols-outlined">settings</span>
              <span>Settings</span>
            </Link>
          </nav>

          <div className="mt-auto space-y-2 border-t border-outline-variant/10 pt-8">
            <a className="flex items-center gap-3 px-4 py-3 text-xs font-label uppercase tracking-wide text-[#dee5ff]/50 transition-all hover:bg-[#192540] hover:text-[#dee5ff]" href="#">
              <span className="material-symbols-outlined">help</span>
              <span>Help</span>
            </a>

            <a className="flex items-center gap-3 px-4 py-3 text-xs font-label uppercase tracking-wide text-tertiary/70 transition-all hover:bg-[#192540] hover:text-tertiary" href="#">
              <span className="material-symbols-outlined">logout</span>
              <span>Logout</span>
            </a>
          </div>
        </aside>

        <main className="mx-auto w-full max-w-5xl flex-1 p-6 md:p-12">
          <section className="relative mb-12 overflow-hidden rounded-3xl bg-surface-container-low p-8">
            <div className="absolute right-0 top-0 -mr-16 -mt-16 h-64 w-64 rounded-full bg-primary/10 blur-[100px]" />

            <div className="relative flex flex-col items-center gap-6 md:flex-row md:items-end">
              <div className="relative">
                <div className="h-32 w-32 overflow-hidden rounded-3xl ring-4 ring-primary/20">
                  <img
                    alt="User avatar"
                    className="h-full w-full object-cover"
                    src={profile.avatarUrl}
                  />
                </div>

                <button className="absolute bottom-2 right-2 rounded-xl bg-primary p-2 text-on-primary shadow-lg transition-transform hover:scale-105" type="button">
                  <span className="material-symbols-outlined text-sm">edit</span>
                </button>
              </div>

              <div className="flex-1 text-center md:text-left">
                <p className="mb-1 text-xs font-bold font-label uppercase tracking-widest text-primary">{profile.memberTier}</p>
                <h1 className="mb-2 font-headline text-4xl font-black text-on-surface md:text-5xl">{profile.fullName}</h1>

                <div className="flex items-center justify-center gap-4 md:justify-start">
                  <div className="flex items-center gap-2 rounded-full bg-surface-container px-3 py-1.5">
                    <span className="material-symbols-outlined text-sm text-primary">electric_bolt</span>
                    <span className="text-xs font-label uppercase tracking-tighter text-on-surface-variant">ID: {profile.memberCode}</span>
                  </div>
                </div>
              </div>
            </div>
          </section>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-12">
            <div className="flex h-full flex-col rounded-3xl bg-surface-container p-8 shadow-sm md:col-span-7">
              <div className="mb-8 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="material-symbols-outlined text-primary">person</span>
                  <h2 className="text-xl font-bold font-headline">Personal Profile</h2>
                </div>

                <span className="text-[10px] font-bold font-label uppercase tracking-widest text-on-surface-variant/40">Manual Save Required</span>
              </div>

              <div className="flex-1 space-y-6">
                <div className="group">
                  <label className="mb-2 block px-1 text-[10px] font-bold font-label uppercase tracking-widest text-on-surface-variant" htmlFor="fullName">
                    Full Name
                  </label>

                  <div className="relative">
                    <input
                      className="w-full rounded-2xl border border-outline-variant/10 bg-surface-container-lowest px-5 py-4 text-on-surface transition-all focus:ring-2 focus:ring-primary/30"
                      id="fullName"
                      onChange={(event) => updateProfileField("fullName", event.target.value)}
                      type="text"
                      value={profile.fullName}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                  <div className="group">
                    <label className="mb-2 block px-1 text-[10px] font-bold font-label uppercase tracking-widest text-on-surface-variant" htmlFor="emailAddress">
                      Email Address
                    </label>
                    <input
                      className="w-full rounded-2xl border border-outline-variant/10 bg-surface-container-lowest px-5 py-4 text-on-surface transition-all focus:ring-2 focus:ring-primary/30"
                      id="emailAddress"
                      onChange={(event) => updateProfileField("email", event.target.value)}
                      type="email"
                      value={profile.email}
                    />
                  </div>

                  <div className="group">
                    <label className="mb-2 block px-1 text-[10px] font-bold font-label uppercase tracking-widest text-on-surface-variant" htmlFor="phoneNumber">
                      Phone Number
                    </label>
                    <input
                      className="w-full rounded-2xl border border-outline-variant/10 bg-surface-container-lowest px-5 py-4 text-on-surface transition-all focus:ring-2 focus:ring-primary/30"
                      id="phoneNumber"
                      onChange={(event) => updateProfileField("phone", event.target.value)}
                      type="tel"
                      value={profile.phone}
                    />
                  </div>
                </div>
              </div>

              <div className="mt-8 border-t border-outline-variant/10 pt-8">
                <button
                  className="group flex w-full items-center justify-center gap-3 rounded-2xl bg-primary px-10 py-4 font-black text-on-primary transition-all hover:brightness-110 active:scale-95 disabled:cursor-not-allowed disabled:opacity-70 md:w-auto"
                  disabled={isSavingProfile}
                  onClick={handleSaveProfile}
                  type="button"
                >
                  <span>{isSavingProfile ? "Saving..." : "Update Profile"}</span>
                  <span className="material-symbols-outlined text-sm transition-transform group-hover:translate-x-1">arrow_forward</span>
                </button>

                {profileMessage ? <p className="mt-3 text-xs text-primary">{profileMessage}</p> : null}
              </div>
            </div>

            <div className="flex flex-col gap-6 md:col-span-5">
              <div className="rounded-3xl border border-outline-variant/10 bg-surface-container-high p-8">
                <div className="mb-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="material-symbols-outlined text-secondary">notification_important</span>
                    <h2 className="text-xl font-bold font-headline">Smart Alerts</h2>
                  </div>
                </div>

                <div className="mb-6 flex items-center gap-2">
                  <span className="material-symbols-outlined text-[14px] text-primary">sync</span>
                  <span className="text-[10px] font-bold uppercase tracking-widest text-primary">Auto-saved</span>
                </div>

                <p className="mb-6 text-sm leading-relaxed text-on-surface-variant">Notify me when my energy balance falls below the estimated threshold.</p>

                <div className="space-y-8">
                  <div>
                    <div className="mb-4 flex items-center justify-between">
                      <span className="text-xs font-bold font-label uppercase tracking-widest text-on-surface-variant">Alert Threshold</span>
                      <span className="font-headline text-lg font-black text-secondary">{alertThreshold} Days</span>
                    </div>

                    <input
                      className="h-2 w-full cursor-pointer appearance-none rounded-full bg-surface-container-lowest accent-secondary"
                      max="7"
                      min="1"
                      onChange={(event) => handleAlertThresholdChange(Number(event.target.value))}
                      type="range"
                      value={alertThreshold}
                    />

                    <div className="mt-2 flex justify-between px-1">
                      <span className="text-[10px] font-label text-on-surface-variant">1d</span>
                      <span className="text-[10px] font-label text-on-surface-variant">7d</span>
                    </div>
                  </div>

                  <button className="flex w-full items-center justify-between rounded-2xl bg-surface-container-lowest p-4 text-left" onClick={togglePushNotifications} type="button">
                    <div className="flex flex-col">
                      <span className="text-sm font-bold">Push Notifications</span>
                      <span className="text-[10px] text-on-surface-variant">Mobile and Email</span>
                    </div>

                    <span className={`relative flex h-6 w-12 items-center rounded-full px-1 transition-colors ${pushEnabled ? "bg-primary/20" : "bg-outline-variant/40"}`}>
                      <span
                        className={`h-4 w-4 rounded-full transition-all ${pushEnabled ? "translate-x-6 bg-primary" : "translate-x-0 bg-on-surface-variant"}`}
                      />
                    </span>
                  </button>
                </div>
              </div>

              <div className="glass-panel rounded-3xl border border-outline-variant/5 p-8">
                <div className="mb-2 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="material-symbols-outlined text-primary-fixed-dim">tune</span>
                    <h2 className="text-xl font-bold font-headline">Preferences</h2>
                  </div>
                </div>

                <div className="mb-6 flex items-center gap-2">
                  <span className="material-symbols-outlined text-[14px] text-primary">sync_check</span>
                  <span className="text-[10px] font-bold uppercase tracking-widest text-primary">Saved</span>
                </div>

                {preferencesMessage ? <p className="mb-4 text-xs text-primary">{preferencesMessage}</p> : null}

                <div className="space-y-4">
                  <button className="group flex w-full cursor-pointer items-center justify-between" type="button">
                    <span className="flex items-center gap-4">
                      <span className="material-symbols-outlined text-on-surface-variant">language</span>
                      <span className="text-sm font-medium">App Language</span>
                    </span>

                    <span className="flex items-center gap-2">
                      <span className="text-xs font-bold text-primary">{language}</span>
                      <span className="material-symbols-outlined text-sm text-on-surface-variant">expand_more</span>
                    </span>
                  </button>

                  <button className="group flex w-full cursor-pointer items-center justify-between" onClick={toggleDarkMode} type="button">
                    <span className="flex items-center gap-4">
                      <span className="material-symbols-outlined text-on-surface-variant">dark_mode</span>
                      <span className="text-sm font-medium">Dark Mode</span>
                    </span>

                    <span className={`relative flex h-6 w-12 items-center rounded-full px-1 transition-colors ${darkModeEnabled ? "bg-primary" : "bg-outline-variant/50"}`}>
                      <span
                        className={`h-4 w-4 rounded-full transition-all ${darkModeEnabled ? "translate-x-6 bg-on-primary" : "translate-x-0 bg-on-surface-variant"}`}
                      />
                    </span>
                  </button>
                </div>
              </div>
            </div>

            <div className="rounded-3xl bg-surface-container-low p-1 md:col-span-12 md:p-8">
              <div className="flex flex-col items-center gap-6 rounded-[2rem] border border-outline-variant/10 bg-gradient-to-r from-surface-container-high to-surface-container p-6 md:flex-row">
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10">
                  <span className="material-symbols-outlined text-3xl text-primary">support_agent</span>
                </div>

                <div className="flex-1 text-center md:text-left">
                  <h3 className="mb-1 text-lg font-bold font-headline">Need assistance with your meter?</h3>
                  <p className="text-sm text-on-surface-variant">Our priority support team is available 24/7 for Luminous Kinetic members.</p>
                </div>

                <a className="flex items-center gap-2 rounded-xl border border-outline-variant/20 bg-surface-container-highest px-8 py-3 font-bold text-on-surface transition-all hover:bg-surface-variant" href="#">
                  <span>Get Support</span>
                  <span className="material-symbols-outlined text-sm">arrow_forward</span>
                </a>
              </div>
            </div>
          </div>
        </main>
      </div>

      <nav className="fixed bottom-0 left-0 z-50 flex w-full items-center justify-around rounded-t-[2rem] bg-[#0f1930]/40 px-4 pb-6 pt-3 shadow-[0_-10px_30px_rgba(0,0,0,0.2)] backdrop-blur-2xl md:hidden">
        <Link className="flex scale-90 flex-col items-center justify-center px-5 py-2 text-[#dee5ff]/60 transition-transform hover:text-[#69f6b8] active:scale-95" to="/">
          <span className="material-symbols-outlined">home</span>
          <span className="font-inter text-[10px] font-medium tracking-[0.05em]">Home</span>
        </Link>

        <Link className="flex scale-90 flex-col items-center justify-center px-5 py-2 text-[#dee5ff]/60 transition-transform hover:text-[#69f6b8] active:scale-95" to="/history">
          <span className="material-symbols-outlined">receipt_long</span>
          <span className="font-inter text-[10px] font-medium tracking-[0.05em]">History</span>
        </Link>

        <Link className="flex scale-90 flex-col items-center justify-center px-5 py-2 text-[#dee5ff]/60 transition-transform hover:text-[#69f6b8] active:scale-95" to="/top-up">
          <span className="material-symbols-outlined">add_circle</span>
          <span className="font-inter text-[10px] font-medium tracking-[0.05em]">Top-up</span>
        </Link>

        <Link className="flex scale-90 flex-col items-center justify-center rounded-2xl bg-[#69f6b8]/10 px-5 py-2 text-[#69f6b8] transition-transform active:scale-95" to="/settings">
          <span className="material-symbols-outlined">settings</span>
          <span className="font-inter text-[10px] font-medium tracking-[0.05em]">Settings</span>
        </Link>
      </nav>
    </div>
  );
}

export default SettingsView;
