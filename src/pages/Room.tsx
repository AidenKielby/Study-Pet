import { useEffect, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import { addDoc, collection, onSnapshot, orderBy, query, serverTimestamp, limit, getCountFromServer, getDocs, where, deleteDoc, doc, setDoc, getDoc } from "firebase/firestore";
import { auth, db } from "../firebase";
import { getIdentity } from "../identity";
import Pet from "../components/pet";

type Message = {
  id: string;
  text: string;
  uid: string;
  displayName?: string;
  createdAt?: { seconds: number; nanoseconds: number };
};

export default function Room() {
  const { id: roomId } = useParams();
  const [messages, setMessages] = useState<Message[]>([]);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const [isInMatch, setIsInMatch] = useState(false);
  const [playerEvolutions, setPlayerEvolutions] = useState(0);
  const [playerPetChoice, setPlayerPetChoice] = useState(1);

  const [enemyEvolutions, setEnemyEvolutions] = useState(0);
  const [enemyPetChoice, setEnemyPetChoice] = useState(1);
  const [enemyUid, setEnemyUid] = useState<string | null>(null);

  const bottomRef = useRef<HTMLDivElement | null>(null);
  const identity = getIdentity(auth);

  useEffect(() => {
    if (!roomId) return;
    const messagesRef = collection(db, "rooms", roomId, "messages");
    const q = query(messagesRef, orderBy("createdAt", "asc"), limit(200));
    const unsub = onSnapshot(q, (snap) => {
      const rows = snap.docs.map(doc => ({ id: doc.id, ...(doc.data() as Omit<Message, "id">) }));
      setMessages(rows);
      requestAnimationFrame(() => bottomRef.current?.scrollIntoView({ behavior: "smooth" }));
    });
    return unsub;
  }, [roomId]);

  const sendMessage = async () => {
    if (!roomId) return;
    const trimmed = text.trim();
    if (!trimmed) return;
    setSending(true);
    try {
      await addDoc(collection(db, "rooms", roomId, "messages"), {
        text: trimmed,
        uid: identity.uid,
        displayName: identity.name ?? "Unknown User",
        createdAt: serverTimestamp(),
      });
      setText("");
    } catch (err) {
      console.error("Failed to send message", err);
      alert("Could not send message.");
    } finally {
      setSending(false);
    }
  };

  const joinMatch = async () => {
    if (!roomId || !auth.currentUser) return;
    const uid = auth.currentUser.uid;
    const playersRef = collection(db, "rooms", roomId, "match", "current", "players");
    if (!playersRef) return;
    
    const mySnap = await getDocs(query(playersRef, where("uid", "==", uid)));
    if (!mySnap.empty) return;

    const countSnap = await getCountFromServer(playersRef);
    const playerCount = countSnap.data().count;
    if (playerCount >= 2) return;

    await setDoc(doc(playersRef, uid), { uid });
  }

  const getImgURL = async () => {
    if (!roomId || !auth.currentUser) return;
    const uid = auth.currentUser.uid;
    const userRef = doc(db, "users", uid);
    const snap = await getDoc(userRef);
    const data = snap.data();

    const petData = data?.pet ?? {};
    setPlayerEvolutions(petData?.evolutions ?? 0);
    setPlayerPetChoice(petData?.choice ?? 1);

  }

  const leaveMatch = async () => {
    if (!roomId || !auth.currentUser) return;
    const uid = auth.currentUser.uid;
    const playersRef = collection(db, "rooms", roomId, "match", "current", "players");
    await deleteDoc(doc(playersRef, uid)); // now matches the join doc id
  };

  // Auto-leave the match if the user navigates away or closes the tab.
  useEffect(() => {
    if (!roomId || !auth.currentUser) return;

    const handleUnload = () => {
      void leaveMatch();
    };

    window.addEventListener("beforeunload", handleUnload);

    // Also leave when the component unmounts (route change).
    return () => {
      window.removeEventListener("beforeunload", handleUnload);
      void leaveMatch();
    };
  }, [roomId, auth.currentUser?.uid]);

  // Subscribe to the user's presence in the match
  useEffect(() => {
    if (!roomId || !auth.currentUser) return;
    const uid = auth.currentUser.uid;
    const playersRef = collection(db, "rooms", roomId, "match", "current", "players");
    const unsub = onSnapshot(doc(playersRef, uid), snap => {
      setIsInMatch(snap.exists());
    });
    return unsub;
  }, [roomId, auth.currentUser?.uid]);

  useEffect(() => {
    if (!roomId || !auth.currentUser) return;
    const uid = auth.currentUser.uid;
    const playersRef = collection(db, "rooms", roomId, "match", "current", "players");
    const unsub = onSnapshot(playersRef, snap => {
      const others = snap.docs.map(d => d.id).filter(id => id !== uid);
      setEnemyUid(others[0] ?? null);
    });
    return unsub;
  }, [roomId, auth.currentUser?.uid]);

  useEffect(() => {
  if (!enemyUid) return;
  const userRef = doc(db, "users", enemyUid);
  return onSnapshot(userRef, snap => {
    const pet = snap.data()?.pet ?? {};
    setEnemyPetChoice(pet.choice ?? 1);
    setEnemyEvolutions(pet.evolutions ?? 0);
  });
}, [enemyUid]);

  useEffect(() => {
    if (!roomId || !auth.currentUser) return;
    getImgURL();
  }, [roomId, auth.currentUser?.uid]);

  if (!roomId) return <div className="room">No room selected.</div>;

  return (
    <div className="room">
      <div className="room-header">
        <div>
          <p className="eyebrow">Room</p>
          <button onClick={joinMatch}>join match</button>
          <button onClick={leaveMatch}>leave match</button>
        </div>
      </div>

      <div className="room-body">
        <div className="room-main-placeholder" aria-hidden="true">
            <div className="enemy-div">
              <a>{enemyUid ? "enemy" : "waiting..."}</a>
              {enemyUid ? (
                  <Pet
                  petEvolution={enemyEvolutions} petChoice={enemyPetChoice} stage={"Baby"} 
                  health={0} attack={0} defence={0} energy={0} avaulableMoves={null} />
              ) : null }
            </div>
            <div className="player-div">
              <a>{isInMatch ? auth.currentUser?.displayName : "no one in match"}</a>
              {isInMatch ? (
                <Pet
                  petEvolution={playerEvolutions} petChoice={playerPetChoice} stage={"Baby"} 
                  health={0} attack={0} defence={0} energy={0} avaulableMoves={null} />
              ) : null}
            </div>
        </div>

        <div className="chat-panel">
          <div className="chat-messages">
            {messages.length === 0 && <p className="muted">No messages yet.</p>}
            {messages.map(m => {
              const isMe = m.uid === identity.uid;
              return (
                <div key={m.id} className={`chat-row ${isMe ? "me" : "them"}`}>
                  <div className="chat-meta">{m.displayName ?? "Unknown User"}</div>
                  <div className="chat-bubble">{m.text}</div>
                </div>
              );
            })}
            <div ref={bottomRef} />
          </div>
          <div className="chat-input">
            <input
              value={text}
              onChange={e => setText(e.target.value)}
              placeholder="Say something nice"
              onKeyDown={e => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  sendMessage();
                }
              }}
            />
            <button className="button-link primary" onClick={sendMessage} disabled={sending || !text.trim()}>
              {sending ? "Sending..." : "Send"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
