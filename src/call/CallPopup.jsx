import { useEffect } from "react";

export default function CallPopup({ caller, onAccept, onReject }) {
  useEffect(() => {
    const audio = new Audio(
      "https://actions.google.com/sounds/v1/alarms/phone_alerts_and_rings.ogg"
    );
    audio.loop = true;
    audio.play();

    return () => audio.pause();
  }, []);

  return (
    <div style={styles.overlay}>
      <div style={styles.box}>
        <h2>📞 Incoming Call</h2>
        <p>{caller} is calling you</p>

        <div style={styles.row}>
          <button style={styles.accept} onClick={onAccept}>
            Accept
          </button>

          <button style={styles.reject} onClick={onReject}>
            Reject
          </button>
        </div>
      </div>
    </div>
  );
}

const styles = {
  overlay: {
    position: "fixed",
    top: 0,
    left: 0,
    width: "100%",
    height: "100%",
    background: "rgba(0,0,0,0.8)",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
  },
  box: {
    background: "#1e1e2f",
    padding: 20,
    borderRadius: 12,
    textAlign: "center",
    color: "white",
  },
  row: {
    display: "flex",
    justifyContent: "space-around",
    marginTop: 15,
  },
  accept: {
    background: "green",
    color: "white",
    padding: 10,
    border: "none",
    borderRadius: 8,
  },
  reject: {
    background: "red",
    color: "white",
    padding: 10,
    border: "none",
    borderRadius: 8,
  },
};