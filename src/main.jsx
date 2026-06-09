import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.jsx";
import "./index.css";

import OneSignal from "react-onesignal";

// =========================
// 🔔 ONE SIGNAL INIT (PUSH NOTIFICATIONS)
// =========================
async function initOneSignal() {
  try {
    await OneSignal.init({
      appId: "918bb8ea-5838-4ec8-b4ab-95d130415679",
      allowLocalhostAsSecureOrigin: true,
    });

    console.log("💜 OneSignal ready");
  } catch (error) {
    console.log("OneSignal init error:", error);
  }
}

window.addEventListener("load", initOneSignal);

// =========================
// 📱 PWA SERVICE WORKER
// =========================
if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker
      .register("/sw.js")
      .then(() => console.log("SW registered 💜"))
      .catch((err) => console.log("SW error:", err));
  });
}

// =========================
// 🚀 START APP
// =========================
ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);