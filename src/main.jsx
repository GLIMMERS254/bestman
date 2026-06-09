import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.jsx";
import "./index.css";

import OneSignal from "react-onesignal";

async function initPush() {
  try {
    await OneSignal.init({
      appId: "918bb8ea-5838-4ec8-b4ab-95d130415679",
      allowLocalhostAsSecureOrigin: true,
    });

    console.log("💜 Push ready");
  } catch (e) {
    console.log("Push init error", e);
  }
}

window.addEventListener("load", initPush);

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);