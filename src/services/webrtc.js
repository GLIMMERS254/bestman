export const createPeerConnection = () => {

  const configuration = {
    iceServers: [
      { urls: "stun:stun.l.google.com:19302" }
    ]
  };

  return new RTCPeerConnection(configuration);
};