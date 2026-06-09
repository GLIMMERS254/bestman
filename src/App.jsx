import { useEffect, useState } from "react";
import { supabase } from "./services/supabase";

import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Chat from "./pages/Chat";

export default function App() {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [entered, setEntered] = useState(false);

  // =========================
  // 🔐 GET CURRENT SESSION
  // =========================
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setLoading(false);
    });

    // listen for login/logout changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  // =========================
  // 🧠 TRACK FIRST ENTRY
  // =========================
  useEffect(() => {
    const seen = localStorage.getItem("entered");
    if (seen) setEntered(true);
  }, []);

  // =========================
  // 🚀 LOADING SCREEN
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
  // 🏠 FIRST TIME → DASHBOARD
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
  // 💬 MAIN CHAT (EVERY NEXT TIME)
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