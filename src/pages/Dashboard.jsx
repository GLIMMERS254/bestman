export default function Dashboard({ onContinue }) {
  return (
    <div style={styles.container}>
      
      <div style={styles.card}>
        <h1 style={styles.title}>💜 Loved App</h1>

        <p style={styles.text}>
          Welcome back. This is your private space.
        </p>

        <p style={styles.subtext}>
          Messages, photos, videos — only between you and her.
        </p>

        <button onClick={onContinue} style={styles.button}>
          Continue to Chat ➜
        </button>
      </div>

    </div>
  );
}

const styles = {
  container: {
    height: "100vh",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    background: "linear-gradient(135deg, #0f0f17, #1a1a2e)",
    fontFamily: "sans-serif",
  },

  card: {
    width: "90%",
    maxWidth: "400px",
    background: "#161625",
    padding: "30px",
    borderRadius: "16px",
    textAlign: "center",
    boxShadow: "0 10px 30px rgba(0,0,0,0.5)",
    border: "1px solid rgba(255,255,255,0.05)",
  },

  title: {
    color: "#ffffff",
    marginBottom: "10px",
  },

  text: {
    color: "#d1d1d1",
    fontSize: "14px",
    marginBottom: "10px",
  },

  subtext: {
    color: "#888",
    fontSize: "12px",
    marginBottom: "25px",
  },

  button: {
    padding: "12px 18px",
    background: "#7b2cbf",
    color: "white",
    border: "none",
    borderRadius: "10px",
    cursor: "pointer",
    fontWeight: "bold",
  },
};