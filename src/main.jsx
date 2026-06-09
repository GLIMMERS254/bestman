import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.jsx";
import "./index.css";

// =========================
// ☁️ CLOUDINARY (OPTIONAL GLOBAL HELP)
// =========================
// NOTE: we do NOT initialize cloudinary here,
// just ensure file uploads work in components

// =========================
// 🔔 ONESIGNAL PUSH
// =========================
import OneSignal from "react-onesignal";

async function initPush() {
  try {
    await OneSignal.init({
      appId: "918bb8ea-5838-4ec8-b4ab-95d130415679",
      allowLocalhostAsSecureOrigin: true,
    });

    console.log("💜 OneSignal ready");
  } catch (e) {
    console.log("Push init error:", e);
  }
}

window.addEventListener("load", initPush);

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