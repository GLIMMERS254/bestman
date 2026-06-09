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

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setLoading(false);
    });

    supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });
  }, []);

  useEffect(() => {
    const seen = localStorage.getItem("entered");
    if (seen) setEntered(true);
  }, []);

  // 🔔 PUSH PROMPT (ONLY ONCE AFTER LOGIN)
  useEffect(() => {
    if (session) {
      setTimeout(() => {
        try {
          OneSignal.Slidedown.promptPush();
        } catch (e) {
          console.log(e);
        }
      }, 2500);
    }
  }, [session]);

  if (loading) {
    return (
      <div style={styles.center}>
        Loading...
      </div>
    );
  }

  if (!session) return <Login />;

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

  return <Chat user={session.user.email} />;
}

const styles = {
  center: {
    height: "100vh",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    background: "#0f0f17",
    color: "white",
  },
};