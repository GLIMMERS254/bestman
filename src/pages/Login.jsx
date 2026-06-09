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
        <p>Private chat for Raymond & Cherry 🍒</p>

        {!sent ? (
          <>
            <input
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />

            <button onClick={login} disabled={loading}>
              {loading ? "Sending..." : "Continue"}
            </button>
          </>
        ) : (
          <div className="success">
            📩 Check your email to continue login
          </div>
        )}

      </div>
    </div>
  );
}