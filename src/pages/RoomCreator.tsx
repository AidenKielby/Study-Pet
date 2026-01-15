import { useState } from "react";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { useNavigate } from "react-router-dom";
import { auth, db } from "../firebase";

export default function MakeRoom() {
  const [roomName, setRoomName] = useState("");
  const [roomPass, setRoomPass] = useState("");
  const [saving, setSaving] = useState(false);
  const navigate = useNavigate();

  const saveRoom = async () => {
    const user = auth.currentUser;
    if (!user) {
      alert("Sign in to create a room.");
      return;
    }
    if (!roomName.trim()) return alert("Add a room name");
    if (!roomPass.trim()) return alert("Add a room password");

    setSaving(true);
    try {
      await addDoc(collection(db, "rooms"), {
        name: roomName.trim(),
        password: roomPass.trim(),
        users: 0,
        createdBy: user.uid,
        ownerName: user.displayName ?? user.email ?? "Owner",
        createdAt: serverTimestamp(),
        lastActive: serverTimestamp(),
      });
      setRoomName("");
      setRoomPass("");
      alert("Room saved!");
      navigate("/rooms");
    } catch (e) {
      console.error("Error adding room: ", e);
      alert("Failed to save room");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="room-form card">
      <h2>Create a Room</h2>
      <p className="muted">Name it and set a password so only invited users can enter. Rooms auto-delete after 12 hours of no activity.</p>
      <div className="panel">
        <label>Room Name</label>
        <input
          value={roomName}
          onChange={e => setRoomName(e.target.value)}
          placeholder="My study room"
        />
      </div>
      <div className="panel">
        <label>Password</label>
        <input
          type="password"
          value={roomPass}
          onChange={e => setRoomPass(e.target.value)}
          placeholder="Choose a password"
        />
      </div>
      <div className="actions">
        <button className="button-link primary" onClick={saveRoom} disabled={saving}>
          {saving ? "Saving..." : "Create Room"}
        </button>
        <button className="button-link ghost" onClick={() => navigate("/rooms")}>Back to rooms</button>
      </div>
    </div>
  );
}