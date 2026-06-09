export default function Login({ setUser }) {
  const login = (name) => {
    localStorage.setItem("lovedUser", name);
    setUser(name);
  };

  return (
    <div className="login-screen">
      <div className="login-card">
        <h1>Loved 💜</h1>

        <p>Choose your profile</p>

        <button onClick={() => login("Raymond")}>
          Raymond 💜
        </button>

        <button onClick={() => login("Cherry 🍒")}>
          Cherry 🍒
        </button>
      </div>
    </div>
  );
}