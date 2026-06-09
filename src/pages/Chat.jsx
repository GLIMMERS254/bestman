import { useEffect, useState, useRef } from "react";
import { supabase } from "../services/supabase";
import { uploadToCloudinary } from "../services/cloudinary";

export default function Chat({ user }) {
const [text, setText] = useState("");
const [messages, setMessages] = useState([]);
const [installPrompt, setInstallPrompt] = useState(null);

const fileRef = useRef();
const bottomRef = useRef(null);

async function loadMessages() {
const { data } = await supabase
.from("messages")
.select("*")
.order("id", { ascending: true });

```
setMessages(data || []);
```

}

useEffect(() => {
loadMessages();

```
const channel = supabase
  .channel("messages")
  .on(
    "postgres_changes",
    {
      event: "INSERT",
      schema: "public",
      table: "messages",
    },
    (payload) => {
      setMessages((prev) => [...prev, payload.new]);
    }
  )
  .subscribe();

return () => supabase.removeChannel(channel);
```

}, []);

useEffect(() => {
bottomRef.current?.scrollIntoView({
behavior: "smooth",
});
}, [messages]);

useEffect(() => {
const handler = (e) => {
e.preventDefault();
setInstallPrompt(e);
};

```
window.addEventListener("beforeinstallprompt", handler);

return () =>
  window.removeEventListener(
    "beforeinstallprompt",
    handler
  );
```

}, []);

async function installApp() {
if (!installPrompt) return;

```
installPrompt.prompt();
await installPrompt.userChoice;
setInstallPrompt(null);
```

}

async function sendText() {
if (!text.trim()) return;

```
const newMsg = {
  sender: user,
  text,
};

setMessages((prev) => [...prev, newMsg]);

await supabase.from("messages").insert([newMsg]);

setText("");
```

}

async function sendFile(e) {
const file = e.target.files[0];
if (!file) return;

```
let type = "image";

if (file.type.startsWith("video")) type = "video";
if (file.type.startsWith("audio")) type = "audio";

const url = await uploadToCloudinary(file, type);

const newMsg = {
  sender: user,
  media_url: url,
  media_type: type,
};

setMessages((prev) => [...prev, newMsg]);

await supabase.from("messages").insert([newMsg]);
```

}

return ( <div style={styles.page}> <div style={styles.topbar}>
💜 Cherry Chat </div>

```
  <div style={styles.messages}>
    {messages.map((msg, i) => {
      const isMine = msg.sender === user;

      return (
        <div
          key={i}
          style={{
            ...styles.bubble,
            alignSelf: isMine ? "flex-end" : "flex-start",
            background: isMine ? "#7b2cbf" : "#2a2a3d",
          }}
        >
          {msg.text && <div>{msg.text}</div>}

          {msg.media_url &&
            msg.media_type === "image" && (
              <img
                src={msg.media_url}
                style={styles.media}
                alt=""
              />
            )}

          {msg.media_url &&
            msg.media_type === "video" && (
              <video
                controls
                src={msg.media_url}
                style={styles.media}
              />
            )}

          {msg.media_url &&
            msg.media_type === "audio" && (
              <audio
                controls
                src={msg.media_url}
              />
            )}
        </div>
      );
    })}

    <div ref={bottomRef}></div>
  </div>

  {installPrompt && (
    <button
      onClick={installApp}
      style={styles.installBtn}
    >
      📱 Install Loved
    </button>
  )}

  <div style={styles.composer}>
    <input
      value={text}
      onChange={(e) => setText(e.target.value)}
      placeholder="Type message..."
      style={styles.input}
    />

    <button
      onClick={sendText}
      style={styles.btn}
    >
      ➤
    </button>

    <input
      type="file"
      ref={fileRef}
      onChange={sendFile}
      style={{ display: "none" }}
    />

    <button
      onClick={() => fileRef.current.click()}
      style={styles.btn}
    >
      📎
    </button>
  </div>
</div>
 
);
}

const styles = {
page: {
height: "100dvh",
display: "flex",
flexDirection: "column",
fontFamily: "sans-serif",
backgroundImage: "url('/icon-512.png')",
backgroundSize: "cover",
backgroundPosition: "center",
backgroundRepeat: "no-repeat",
},

topbar: {
padding: 15,
color: "white",
background: "#161625",
fontWeight: "bold",
},

messages: {
flex: 1,
padding: 10,
display: "flex",
flexDirection: "column",
gap: 10,
overflowY: "auto",
background: "rgba(0,0,0,0.25)",
},

bubble: {
maxWidth: "70%",
padding: "10px 14px",
borderRadius: 12,
color: "white",
wordBreak: "break-word",
},

media: {
width: "100%",
borderRadius: 10,
marginTop: 5,
},

installBtn: {
margin: "10px",
padding: "12px",
borderRadius: "10px",
border: "none",
background: "#7b2cbf",
color: "white",
fontWeight: "bold",
},

composer: {
display: "flex",
gap: 8,
background: "#161625",
padding: "10px",
},

input: {
flex: 1,
padding: 10,
borderRadius: 8,
border: "none",
outline: "none",
},

btn: {
padding: "10px 12px",
background: "#7b2cbf",
color: "white",
border: "none",
borderRadius: 8,
cursor: "pointer",
},
};
