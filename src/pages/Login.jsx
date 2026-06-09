import { useState } from "react";
import { supabase } from "../services/supabase";

export default function Login() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  async function login() {
    if (!email) return;

    setLoading(true);

    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: window.location.origin,
      },
    });

    setLoading(false);

    if (!error) {
      setSent(true);
    }
  }

  return (
    <div className="login-screen">

      <div className="login-card">

        <div className="logo">💜</div>

        <h1>Loved</h1>

        <p>Raymond & Cherry 🍒 Private Chat</p>

        {!sent ? (
          <>
            <input
              type="email"
              placeholder="type your email... example@gmail.com"
              value={email}
              autoComplete="email"
              autoFocus
              onChange={(e) => setEmail(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") login();
              }}
            />

            <button onClick={login} disabled={loading}>
              {loading ? "Sending link..." : "Continue"}
            </button>

            <small style={{ opacity: 0.6 }}>
              We will send a login link to your email
            </small>
          </>
        ) : (
          <div className="success">
            📩 Check your email and click the login link
          </div>
        )}

      </div>

    </div>
  );
}