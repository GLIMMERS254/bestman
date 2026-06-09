import { useState } from "react";
import Login from "./pages/Login";
import Chat from "./pages/Chat";

function App() {
  const [user, setUser] = useState(
    localStorage.getItem("lovedUser")
  );

  return (
    <>
      {user ? (
        <Chat user={user} />
      ) : (
        <Login setUser={setUser} />
      )}
    </>
  );
}

export default App;