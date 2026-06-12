import { useEffect, useState } from "react";
import { supabase } from "./services/supabase";

import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Chat from "./pages/Chat";
import ChatList from "./pages/ChatList";

import OneSignal from "react-onesignal";

export default function App() {
  const [session, setSession] = useState(null);
  const [entered, setEntered] = useState(false);
  const [selectedChat, setSelectedChat] = useState(null);

  // AUTH
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
    });

    supabase.auth.onAuthStateChange((_e, session) => {
      setSession(session);
    });
  }, []);

  // FIRST TIME
  useEffect(() => {
    if (localStorage.getItem("entered")) {
      setEntered(true);
    }
  }, []);

  // ONLINE STATUS (STEP 7)
  useEffect(() => {
    if (!session) return;

    supabase
      .from("profiles")
      .update({ online: true })
      .eq("email", session.user.email);
  }, [session]);

  // OFFLINE
  useEffect(() => {
    const offline = () => {
      supabase
        .from("profiles")
        .update({
          online: false,
          last_seen: new Date().toISOString(),
        })
        .eq("email", session?.user?.email);
    };

    window.addEventListener("beforeunload", offline);
    return () => window.removeEventListener("beforeunload", offline);
  }, [session]);

  // PUSH LOGIN
  useEffect(() => {
    if (session) {
      OneSignal.Notifications.requestPermission();
      OneSignal.login(session.user.email);
    }
  }, [session]);

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

  if (!selectedChat) {
    return (
      <ChatList
        user={session.user.email}
        openChat={(chat) => setSelectedChat(chat)}
      />
    );
  }

  return (
    <Chat
      user={session.user.email}
      chatId={selectedChat.id}
    />
  );
}