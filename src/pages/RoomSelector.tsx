import { useEffect, useState } from "react";
import { collection, getDocs, doc, deleteDoc, updateDoc, serverTimestamp, Timestamp } from "firebase/firestore";
import { useNavigate } from "react-router-dom";
import { auth, db } from "../firebase";
import { Link } from "react-router-dom";
import { getIdentity } from "../identity";

type RoomListItem = {
  id: string;
  name: string;
  count: number;
  password?: string;
  createdBy?: string;
  ownerName?: string;
  createdAt?: Timestamp;
  lastActive?: Timestamp;
};

export default function RoomSelector() {
  const [loading, setLoading] = useState(true);
  const [rooms, setRooms] = useState<RoomListItem[]>([]);
  const [activeRoom, setActiveRoom] = useState<string | null>(null);
  const [passwordInput, setPasswordInput] = useState<Record<string, string>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const navigate = useNavigate();
  const identity = getIdentity(auth);

  useEffect(() => {
    const fetchRooms = async () => {
      try {
        const snap = await getDocs(collection(db, "rooms"));
        const nowSeconds = Date.now() / 1000;
        const twelveHours = 60 * 60 * 12;

        const items: RoomListItem[] = [];
        for (const d of snap.docs) {
          const data = d.data() as {
            name?: string;
            users?: Array<{ user: string }>;
            password?: string;
            createdBy?: string;
            ownerName?: string;
            createdAt?: Timestamp;
            lastActive?: Timestamp;
          };
          const createdAtSec = data.createdAt?.seconds;
          const lastActiveSec = data.lastActive?.seconds ?? createdAtSec;
          const isExpired = lastActiveSec !== undefined && nowSeconds - lastActiveSec > twelveHours;

          if (isExpired) {
            try {
              await deleteDoc(doc(db, "rooms", d.id));
            } catch (err) {
              console.error("Failed to auto-delete expired room", err);
            }
            continue;
          }

          items.push({
            id: d.id,
            name: data.name ?? "(no name)",
            count: data.users?.length ?? 0,
            password: data.password,
            createdBy: data.createdBy,
            ownerName: data.ownerName,
            createdAt: data.createdAt,
            lastActive: data.lastActive,
          });
        }
        setRooms(items);
      } catch (e) {
        console.error("Failed to load rooms", e);
      } finally {
        setLoading(false);
      }
    };

    fetchRooms();
  }, []);

  const handleOpen = (roomId: string) => {
    setActiveRoom(prev => (prev === roomId ? null : roomId));
    setErrors(prev => ({ ...prev, [roomId]: "" }));
  };

  const handleJoin = (room: RoomListItem) => {
    const input = passwordInput[room.id]?.trim() ?? "";
    const expected = room.password?.trim() ?? "";
    if (!input) {
      setErrors(prev => ({ ...prev, [room.id]: "Enter the room password." }));
      return;
    }
    if (input !== expected) {
      setErrors(prev => ({ ...prev, [room.id]: "Incorrect password." }));
      return;
    }
    setErrors(prev => ({ ...prev, [room.id]: "" }));
    // bump activity timestamp
    updateDoc(doc(db, "rooms", room.id), { lastActive: serverTimestamp() }).catch(() => {});
    navigate(`/room/${room.id}`);
  };

  const handleDelete = async (room: RoomListItem) => {
    if (identity.uid !== room.createdBy) return;
    if (!confirm("Delete this room?")) return;
    try {
      await deleteDoc(doc(db, "rooms", room.id));
      setRooms(prev => prev.filter(r => r.id !== room.id));
    } catch (err) {
      console.error("Failed to delete room", err);
      alert("Could not delete room.");
    }
  };

  if (loading) return <div>Loading rooms...</div>;

  return (
    <div className="room-selector">
      <div className="header-row">
        <div>
          <p className="eyebrow">Rooms</p>
          <h2>Join a study room</h2>
          <p className="muted">Select a room, enter the password, and jump in.</p>
        </div>
        <Link to="/make_room" className="button-link primary">Create Room</Link>
      </div>

      {rooms.length === 0 ? (
        <p className="muted">No rooms saved yet.</p>
      ) : (
        <div className="room-list">
          {rooms.map(room => {
            const open = activeRoom === room.id;
            const isOwner = identity.uid === room.createdBy;
            return (
              <div key={room.id} className="room-card">
                <div className="room-card-top">
                  <div>
                    <h3>{room.name}</h3>
                    <p className="muted">{room.count} participant{room.count === 1 ? "" : "s"}</p>
                    <p className="eyebrow" style={{ marginTop: "0.25rem" }}>
                      Owner: {room.ownerName ?? "Unknown"} · Deletes after 12h idle
                    </p>
                  </div>
                  <button className="button-link secondary" onClick={() => handleOpen(room.id)}>
                    {open ? "Close" : "Enter"}
                  </button>
                  {isOwner && (
                    <button className="button-link ghost" onClick={() => handleDelete(room)}>
                      Delete
                    </button>
                  )}
                </div>
                {open && (
                  <div className="room-card-body">
                    <label>Password</label>
                    <input
                      type="password"
                      value={passwordInput[room.id] ?? ""}
                      onChange={e => setPasswordInput(prev => ({ ...prev, [room.id]: e.target.value }))}
                      placeholder="Room password"
                    />
                    {errors[room.id] && <div className="feedback error">{errors[room.id]}</div>}
                    <div className="actions">
                      <button className="button-link primary" onClick={() => handleJoin(room)}>
                        Join room
                      </button>
                      <button className="button-link ghost" onClick={() => setActiveRoom(null)}>Cancel</button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
