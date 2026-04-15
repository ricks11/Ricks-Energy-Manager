import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import DashboardView from "./views/DashboardView";
import HistoryView from "./views/HistoryView";
import SettingsView from "./views/SettingsView";
import TopUpView from "./views/TopUpView";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<DashboardView />} path="/" />
        <Route element={<HistoryView />} path="/history" />
        <Route element={<TopUpView />} path="/top-up" />
        <Route element={<SettingsView />} path="/settings" />
        <Route element={<Navigate replace to="/" />} path="*" />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
