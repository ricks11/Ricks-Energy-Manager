import { useEffect, useMemo, useState } from "react";


function statusLabel(status) {
  if (status === "ok") return "Online";
  if (status === "offline") return "Offline";
  return "A verificar";
}


function App() {
  const apiUrl = useMemo(() => import.meta.env.VITE_API_URL ?? "http://localhost:8000", []);
  const [health, setHealth] = useState({ status: "checking", service: "-", message: "A verificar API..." });

  useEffect(() => {
    let isCancelled = false;

    async function checkApi() {
      try {
        const response = await fetch(`${apiUrl}/health`);

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }

        const data = await response.json();

        if (!isCancelled) {
          setHealth({
            status: data.status === "ok" ? "ok" : "offline",
            service: data.service ?? "Ricks Energy Manager API",
            message: "Conexao frontend-backend estabelecida.",
          });
        }
      } catch (error) {
        if (!isCancelled) {
          setHealth({
            status: "offline",
            service: "-",
            message: `Falha ao conectar em ${apiUrl}.`,
          });
        }
      }
    }

    checkApi();

    return () => {
      isCancelled = true;
    };
  }, [apiUrl]);

  return (
    <main className="app">
      <section className="card">
        <p className="eyebrow">Ricks Energy Manager</p>
        <h1>Frontend React + Vite conectado ao backend FastAPI</h1>
        <p>{health.message}</p>

        <div className="status-grid">
          <div>
            <h2>API base URL</h2>
            <p className="mono">{apiUrl}</p>
          </div>

          <div>
            <h2>Status</h2>
            <p className={`status-pill status-${health.status}`}>{statusLabel(health.status)}</p>
          </div>

          <div>
            <h2>Servico</h2>
            <p>{health.service}</p>
          </div>
        </div>
      </section>
    </main>
  );
}

export default App;
