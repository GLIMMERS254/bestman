import { useState } from "react";
import { supabase } from "../services/supabase";

export default function Login() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);

  async function login() {
    if (!email) return;

    const { error } = await supabase.auth.signInWithOtp({
      email,
    });

    if (!error) {
      setSent(true);
    }
  }

  return (
    <div className="login-screen">

      <div className="login-overlay">

        <div className="login-card">

          <div className="logo">
            💜
          </div>

          <h1>Loved</h1>

          <p>
            Raymond & Cherry 🍒
          </p>

          {!sent ? (
            <>
              <input
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) =>
                  setEmail(e.target.value)
                }
              />

              <button onClick={login}>
                Continue
              </button>
            </>
          ) : (
            <div className="success-box">
              📧 Check your email and tap the login link.
            </div>
          )}

        </div>

      </div>

    </div>
  );
}