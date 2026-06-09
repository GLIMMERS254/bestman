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
  // 🔐 GET SESSION
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
  // 🧠 FIRST ENTRY CHECK
  // =========================
  useEffect(() => {
    const seen = localStorage.getItem("entered");
    if (seen) setEntered(true);
  }, []);

  // =========================
  // 🔔 PUSH PERMISSION (IMPORTANT FIX)
  // =========================
  useEffect(() => {
    if (session) {
      // run ONLY when user logs in
      setTimeout(() => {
        try {
          OneSignal.Slidedown.promptPush();
        } catch (err) {
          console.log("Push prompt error:", err);
        }
      }, 3000); // delay so UI loads first
    }
  }, [session]);

  // =========================
  // ⏳ LOADING
  // =========================
  if (loading) {
    return (
      <div style={styles.center}>
        Loading...
      </div>
    );
  }

  // =========================
  // 🔓 NOT LOGGED IN
  // =========================
  if (!session) return <Login />;

  // =========================
  // 🏠 FIRST TIME DASHBOARD
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
  // 💬 CHAT SCREEN
  // =========================
  return <Chat user={session.user.email} />;
}

// =========================
// 🎨 STYLE
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