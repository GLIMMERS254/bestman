import { useEffect, useState } from "react";
import { supabase } from "./services/supabase";
import Login from "./pages/Login";
import Chat from "./pages/Chat";

export default function App() {
  const [session, setSession] = useState(null);

  useEffect(() => {
    // get current session
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
    });

    // listen for login/logout changes
    const { data: listener } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setSession(session);
      }
    );

    return () => {
      listener.subscription.unsubscribe();
    };
  }, []);

  return session ? (
    <Chat user={session.user.email} />
  ) : (
    <Login />
  );
}