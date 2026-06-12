import { useEffect, useRef } from "react";
import Peer from "simple-peer";
import { socket } from "./callService";

export default function VideoCall({ user, target, onEnd }) {
  const myVideo = useRef();
  const userVideo = useRef();
  const peerRef = useRef();

  useEffect(() => {
    navigator.mediaDevices.getUserMedia({
      video: true,
      audio: true,
    }).then((stream) => {
      myVideo.current.srcObject = stream;

      const peer = new Peer({
        initiator: true,
        trickle: false,
        stream,
      });

      peer.on("signal", (data) => {
        socket.emit("signal", {
          to: target,
          signal: data,
        });
      });

      peer.on("stream", (remoteStream) => {
        userVideo.current.srcObject = remoteStream;
      });

      socket.on("signal", (signal) => {
        peer.signal(signal);
      });

      peerRef.current = peer;
    });
  }, []);

  return (
    <div style={styles.call}>
      <video ref={myVideo} autoPlay muted style={styles.video} />
      <video ref={userVideo} autoPlay style={styles.video} />

      <button style={styles.end} onClick={onEnd}>
        End Call
      </button>
    </div>
  );
}

const styles = {
  call: {
    position: "fixed",
    inset: 0,
    background: "black",
    display: "flex",
    flexDirection: "column",
  },
  video: {
    width: "100%",
    height: "50%",
    objectFit: "cover",
  },
  end: {
    position: "absolute",
    bottom: 20,
    left: "50%",
    transform: "translateX(-50%)",
    background: "red",
    color: "white",
    padding: 10,
    borderRadius: 10,
  },
};