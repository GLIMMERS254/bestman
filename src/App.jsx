import { useEffect, useState } from "react";
import Login from "./pages/Login";
import Chat from "./pages/Chat";
import { supabase } from "./services/supabase";

function App() {
  const [session, setSession] = useState(null);

  useEffect(() => {
    supabase.auth.getSession().then(
      ({ data: { session } }) => {
        setSession(session);
      }
    );

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setSession(session);
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  return session ? (
    <Chat
      user={
        session.user.email
      }
    />
  ) : (
    <Login />
  );
}

export default App;