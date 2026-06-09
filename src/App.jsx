import { useEffect, useState } from "react";
import { supabase } from "./services/supabase";

import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Chat from "./pages/Chat";

import OneSignal from "react-onesignal";

export default function App() {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [entered, setEntered] = useState(false);

  // =========================
  // 🔐 GET USER SESSION
  // =========================
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  // =========================
  // 🧠 CHECK FIRST TIME ENTRY
  // =========================
  useEffect(() => {
    const seen = localStorage.getItem("entered");
    if (seen) setEntered(true);
  }, []);

  // =========================
  // 🔔 ONE SIGNAL PUSH (LOGIN EFFECT)
  // =========================
  useEffect(() => {
    if (session) {
      // wait for UI to fully load
      setTimeout(() => {
        try {
          // ask permission for push notifications
          OneSignal.Notifications.requestPermission();

          console.log("🔔 Push permission requested");
        } catch (error) {
          console.log("OneSignal error:", error);
        }
      }, 2500);
    }
  }, [session]);

  // =========================
  // ⏳ LOADING SCREEN
  // =========================
  if (loading) {
    return (
      <div style={styles.center}>
        Loading...
      </div>
    );
  }

  // =========================
  // 🔓 NOT LOGGED IN → LOGIN PAGE
  // =========================
  if (!session) {
    return <Login />;
  }

  // =========================
  // 🏠 FIRST TIME DASHBOARD FLOW
  // =========================
  if (!entered) {
    return (
      <Dashboard
        onContinue={() => {
          localStorage.setItem("entered", "true");
          setEntered(true);
        }}
      />
    );
  }

  // =========================
  // 💬 MAIN CHAT SCREEN
  // =========================
  return <Chat user={session.user.email} />;
}

// =========================
// 🎨 SIMPLE LOADING STYLE
// =========================
const styles = {
  center: {
    height: "100vh",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    background: "#0f0f17",
    color: "white",
    fontFamily: "sans-serif",
  },
};