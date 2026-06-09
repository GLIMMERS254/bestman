import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.jsx";
import "./index.css";

// =========================
// 🔔 PUSH NOTIFICATIONS (OneSignal)
// =========================
import OneSignal from "react-onesignal";

async function initOneSignal() {
  try {
    await OneSignal.init({
      appId: "918bb8ea-5838-4ec8-b4ab-95d130415679",
      notifyButton: {
        enable: true,
      },
      allowLocalhostAsSecureOrigin: true,
    });

    console.log("OneSignal initialized 💜");
  } catch (err) {
    console.log("OneSignal error:", err);
  }
}

// Run OneSignal after page loads
window.addEventListener("load", initOneSignal);

// =========================
// 📱 PWA SERVICE WORKER
// =========================
if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker
      .register("/sw.js")
      .then(() => console.log("Service Worker registered 💜"))
      .catch((err) => console.log("SW error:", err));
  });
}

// =========================
// 🚀 APP START
// =========================
ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);