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
        emailRedirectTo: "https://bestman-fsn5.vercel.app",
      },
    });

    setLoading(false);

    if (!error) {
      setSent(true);
    } else {
      alert(error.message);
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
              placeholder="Enter your email"
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