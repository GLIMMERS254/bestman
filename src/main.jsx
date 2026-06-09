import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.jsx";
import "./index.css";

import OneSignal from "react-onesignal";

async function initOneSignal() {
  try {
    await OneSignal.init({
      appId: "918bb8ea-5838-4ec8-b4ab-95d130415679",
      notifyButton: {
        enable: true,
      },
    });

    console.log("💜 OneSignal ready");
  } catch (e) {
    console.log("OneSignal error:", e);
  }
}

window.addEventListener("load", initOneSignal);

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);