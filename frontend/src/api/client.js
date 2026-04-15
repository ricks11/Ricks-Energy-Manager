const API_BASE_URL = (import.meta.env.VITE_API_URL ?? "http://localhost:8000").replace(/\/$/, "");

async function request(path, options = {}) {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    headers: {
      "Content-Type": "application/json",
      ...(options.headers ?? {}),
    },
    ...options,
  });

  if (!response.ok) {
    let detail = "Unexpected request error.";

    try {
      const payload = await response.json();
      detail = payload.detail ?? detail;
    } catch {
      detail = `HTTP ${response.status}`;
    }

    throw new Error(detail);
  }

  return response.json();
}

export function getEnergySummary() {
  return request("/energy/summary");
}

export function getHistory(limit = 20) {
  return request(`/history?limit=${limit}`);
}

export function createTopUp(payload) {
  return request("/top-ups", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function getProfile() {
  return request("/profile");
}

export function updateProfile(payload) {
  return request("/profile", {
    method: "PUT",
    body: JSON.stringify(payload),
  });
}

export function getPreferences() {
  return request("/preferences");
}

export function updatePreferences(payload) {
  return request("/preferences", {
    method: "PUT",
    body: JSON.stringify(payload),
  });
}
