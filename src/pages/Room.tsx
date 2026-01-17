import { useCallback, useEffect, useRef, useState, type Dispatch, type MutableRefObject, type SetStateAction } from "react";
import { useParams } from "react-router-dom";
import { addDoc, collection, onSnapshot, orderBy, query, serverTimestamp, limit, getCountFromServer, getDocs, where, deleteDoc, doc, setDoc } from "firebase/firestore";
import { auth, db } from "../firebase";
import { getIdentity } from "../identity";
import Pet from "../components/pet";
import { moveList, moveSet, type MoveId } from "../components/moveSet";

const MAX_HEALTH = 120;
const ROUND_HEAL = Math.round(MAX_HEALTH * 0.25);
const LOG_LIMIT = 8;

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

  const [slotAUid, setSlotAUid] = useState<string | null>(null);
  const [slotBUid, setSlotBUid] = useState<string | null>(null);
  const [slotAEvolutions, setSlotAEvolutions] = useState(0);
  const [slotAPetChoice, setSlotAPetChoice] = useState(1);
  const [slotBEvolutions, setSlotBEvolutions] = useState(0);
  const [slotBPetChoice, setSlotBPetChoice] = useState(1);

  const [myMoves, setMyMoves] = useState<MoveId[]>([]);
  const [moveOrder, setMoveOrder] = useState<MoveId[]>([]);
  const [refreshUsed, setRefreshUsed] = useState(false);
  const [myReady, setMyReady] = useState(false);
  const [allReady, setAllReady] = useState(false);
  const [roundStart, setRoundStart] = useState(false);
  const [player1Queue, setPlayer1Queue] = useState<MoveId[]>([]);
  const [player2Queue, setPlayer2Queue] = useState<MoveId[]>([]);
  const [player1Loadout, setPlayer1Loadout] = useState<MoveId[]>([]);
  const [player2Loadout, setPlayer2Loadout] = useState<MoveId[]>([]);
  const [player1Health, setPlayer1Health] = useState(MAX_HEALTH);
  const [player2Health, setPlayer2Health] = useState(MAX_HEALTH);
  const [player1Defense, setPlayer1Defense] = useState(0);
  const [player2Defense, setPlayer2Defense] = useState(0);
  const [battleLog, setBattleLog] = useState<string[]>([]);
  const [winner, setWinner] = useState<string | null>(null);
  const [roundNumber, setRoundNumber] = useState(1);

  const bottomRef = useRef<HTMLDivElement | null>(null);
  const player1DefenseRef = useRef(0);
  const player2DefenseRef = useRef(0);
  const identity = getIdentity(auth);

  const startNextRound = useCallback(() => {
    if (!player1Loadout.length || !player2Loadout.length) return;
    const nextRound = roundNumber + 1;
    const logEntries: string[] = [`Round ${nextRound} begins!`];

    const healPlayer = (setter: Dispatch<SetStateAction<number>>) => {
      let applied = 0;
      setter(prev => {
        const next = Math.min(MAX_HEALTH, prev + ROUND_HEAL);
        applied = next - prev;
        return next;
      });
      return applied;
    };

    const heal1 = healPlayer(setPlayer1Health);
    const heal2 = healPlayer(setPlayer2Health);

    if (heal1 > 0) logEntries.push(`Player 1 recovers +${heal1} HP`);
    if (heal2 > 0) logEntries.push(`Player 2 recovers +${heal2} HP`);

    setRoundNumber(nextRound);
    setPlayer1Queue([...player1Loadout]);
    setPlayer2Queue([...player2Loadout]);
    setPlayer1Defense(0);
    setPlayer2Defense(0);
    player1DefenseRef.current = 0;
    player2DefenseRef.current = 0;
    setRefreshUsed(false);

    setBattleLog(prev => {
      const next = [...prev, ...logEntries];
      return next.length > LOG_LIMIT ? next.slice(-LOG_LIMIT) : next;
    });
  }, [player1Loadout, player2Loadout, roundNumber]);

  useEffect(() => {
    player1DefenseRef.current = player1Defense;
  }, [player1Defense]);

  useEffect(() => {
    player2DefenseRef.current = player2Defense;
  }, [player2Defense]);


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

    await setDoc(doc(playersRef, uid), { uid, ready: false }, { merge: true });
  }

  const leaveMatch = async () => {
    if (!roomId || !auth.currentUser) return;
    const uid = auth.currentUser.uid;
    const playersRef = collection(db, "rooms", roomId, "match", "current", "players");
    await deleteDoc(doc(playersRef, uid)); // now matches the join doc id
  };

  const moveUp = (index: number) => {
    if (index <= 0) return;
    setMoveOrder(prev => {
      const next = [...prev];
      [next[index - 1], next[index]] = [next[index], next[index - 1]];
      return next;
    });
  };

  const moveDown = (index: number) => {
    setMoveOrder(prev => {
      if (index < 0 || index >= prev.length - 1) return prev;
      const next = [...prev];
      [next[index], next[index + 1]] = [next[index + 1], next[index]];
      return next;
    });
  };

  const refreshAbility = (index: number) => {
    if (refreshUsed) return;
    setMoveOrder(prev => {
      if (index < 0 || index >= prev.length) return prev;
      const currentId = prev[index];
      let nextId = currentId;
      if (moveList.length > 0) {
        for (let i = 0; i < moveList.length * 2; i++) {
          const candidate = moveList[Math.floor(Math.random() * moveList.length)].id;
          if (candidate !== currentId || moveList.length === 1) {
            nextId = candidate as MoveId;
            break;
          }
        }
      }
      const next = [...prev];
      next[index] = nextId;
      return next;
    });
    setRefreshUsed(true);
  };

  const setReady = async (flag: boolean) => {
    if (!roomId || !auth.currentUser) return;
    const uid = auth.currentUser.uid;
    const playersRef = collection(db, "rooms", roomId, "match", "current", "players");
    const movesToPersist = moveOrder.length > 0 ? moveOrder : myMoves;
    await setDoc(
      doc(playersRef, uid),
      {
        uid,
        ready: flag,
        moves: movesToPersist,
      },
      { merge: true }
    );
    setMyReady(flag);
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

  useEffect(() => {
    if (!roomId) return;
    const playersRef = collection(db, "rooms", roomId, "match", "current", "players");
    const unsub = onSnapshot(playersRef, snap => {
      const uids = snap.docs.map(d => d.id);
      setSlotAUid(uids[0] ?? null);
      setSlotBUid(uids[1] ?? null);

      const currentUid = auth.currentUser?.uid;
      let readyCount = 0;
      let selfReady = false;
      snap.docs.forEach(d => {
        const data = d.data() as { ready?: boolean };
        const r = Boolean(data?.ready);
        if (r) readyCount += 1;
        if (d.id === currentUid) selfReady = r;
      });
      setMyReady(selfReady);
      setAllReady(snap.docs.length >= 2 && readyCount === snap.docs.length);
    });
    return unsub;
  }, [roomId]);

  // start battle when both players are ready
  useEffect(() => {
    if (!allReady || roundStart || !roomId || !slotAUid || !slotBUid) return;
    let cancelled = false;
    (async () => {
      const matchRef = doc(db, "rooms", roomId, "match", "current");
      const playersRef = collection(matchRef, "players");
      const snap = await getDocs(playersRef);
      const bottomDoc = snap.docs.find(d => d.id === slotBUid) ?? snap.docs[0];
      const topDoc =
        snap.docs.find(d => d.id === slotAUid) ??
        snap.docs.find(d => d.id !== bottomDoc?.id) ??
        snap.docs[0];

      const toMoveIds = (value: unknown): MoveId[] =>
        Array.isArray(value)
          ? value.filter((m: unknown): m is MoveId => typeof m === "string" && m in moveSet)
          : [];

      const player1Moves = toMoveIds(bottomDoc?.data()?.moves);
      const player2Moves = toMoveIds(topDoc?.data()?.moves);

      if (cancelled) return;
      setPlayer1Loadout([...player1Moves]);
      setPlayer2Loadout([...player2Moves]);
      setPlayer1Queue([...player1Moves]);
      setPlayer2Queue([...player2Moves]);
      setPlayer1Health(MAX_HEALTH);
      setPlayer2Health(MAX_HEALTH);
      setPlayer1Defense(0);
      setPlayer2Defense(0);
      player1DefenseRef.current = 0;
      player2DefenseRef.current = 0;
      setRoundNumber(1);
      setBattleLog(player1Moves.length || player2Moves.length ? ["Round 1 begins!"] : []);
      setWinner(null);
      setRoundStart(true);
    })();

    return () => {
      cancelled = true;
    };
  }, [allReady, roundStart, roomId, slotAUid, slotBUid]);

  // reset when players unready or leave
  useEffect(() => {
    if (!allReady) {
      setRoundStart(false);
      setPlayer1Queue([]);
      setPlayer2Queue([]);
      setWinner(null);
      setBattleLog([]);
      setPlayer1Health(MAX_HEALTH);
      setPlayer2Health(MAX_HEALTH);
      setPlayer1Defense(0);
      setPlayer2Defense(0);
      setPlayer1Loadout([]);
      setPlayer2Loadout([]);
      setRoundNumber(1);
      player1DefenseRef.current = 0;
      player2DefenseRef.current = 0;
    }
  }, [allReady]);

  // process turns sequentially
  useEffect(() => {
    if (!roundStart || winner) return;
    if (player1Queue.length === 0 && player2Queue.length === 0) return;

    const timer = setTimeout(() => {
      const p1Move = player1Queue[0];
      const p2Move = player2Queue[0];
      const logEntries: string[] = [];

      const applyDamage = (
        amount: number,
        targetHealthSetter: Dispatch<SetStateAction<number>>,
        targetDefenseRef: MutableRefObject<number>,
        targetDefenseSetter: Dispatch<SetStateAction<number>>
      ) => {
        if (amount <= 0) return { dealt: 0, blocked: 0 };
        const defenseValue = targetDefenseRef.current;
        const mitigated = Math.max(0, amount - defenseValue);
        const blocked = Math.max(0, amount - mitigated);
        targetHealthSetter(h => Math.max(0, h - mitigated));
        if (defenseValue > 0) {
          targetDefenseSetter(prev => Math.max(0, prev - 1));
          targetDefenseRef.current = Math.max(0, defenseValue - 1);
        }
        return { dealt: mitigated, blocked };
      };

      const applyHealing = (
        setter: Dispatch<SetStateAction<number>>,
        amount: number
      ) => {
        if (amount <= 0) return 0;
        let healed = 0;
        setter(prev => {
          const next = Math.min(MAX_HEALTH, prev + amount);
          healed = next - prev;
          return next;
        });
        return healed;
      };

      const boostDefense = (
        setter: Dispatch<SetStateAction<number>>,
        ref: MutableRefObject<number>,
        amount: number
      ) => {
        if (amount <= 0) return 0;
        setter(prev => prev + amount);
        ref.current += amount;
        return amount;
      };

      const processMove = (
        moveId: MoveId | undefined,
        actorLabel: "Player 1" | "Player 2",
        actorHealthSetter: Dispatch<SetStateAction<number>>,
        actorDefenseSetter: Dispatch<SetStateAction<number>>,
        actorDefenseRef: MutableRefObject<number>,
        targetHealthSetter: Dispatch<SetStateAction<number>>,
        targetDefenseSetter: Dispatch<SetStateAction<number>>,
        targetDefenseRef: MutableRefObject<number>
      ) => {
        if (!moveId) return;
        const def = moveSet[moveId];
        if (!def) return;
        const move = def.move;
        const damage = move.getDammageDealt();
        const statRaised = move.getStatRaised();
        const statAmount = move.getStatIncreaser();
        const segments: string[] = [];

        if (damage > 0) {
          const { dealt, blocked } = applyDamage(damage, targetHealthSetter, targetDefenseRef, targetDefenseSetter);
          segments.push(`-${dealt} HP`);
          if (blocked > 0) segments.push(`${blocked} blocked`);
        } else if (damage < 0) {
          const healed = applyHealing(actorHealthSetter, Math.abs(damage));
          if (healed > 0) segments.push(`+${healed} HP`);
        }

        if (statRaised === "health" && statAmount > 0) {
          const healed = applyHealing(actorHealthSetter, statAmount);
          if (healed > 0) segments.push(`+${healed} HP`);
        } else if (statRaised === "defense" && statAmount > 0) {
          const boosted = boostDefense(actorDefenseSetter, actorDefenseRef, statAmount);
          if (boosted > 0) segments.push(`DEF +${boosted}`);
        }

        if (segments.length === 0) {
          logEntries.push(`${actorLabel} used ${def.name ?? moveId}`);
        } else {
          logEntries.push(`${actorLabel} used ${def.name ?? moveId} (${segments.join(", ")})`);
        }
      };

      processMove(
        p1Move,
        "Player 1",
        setPlayer1Health,
        setPlayer1Defense,
        player1DefenseRef,
        setPlayer2Health,
        setPlayer2Defense,
        player2DefenseRef
      );

      processMove(
        p2Move,
        "Player 2",
        setPlayer2Health,
        setPlayer2Defense,
        player2DefenseRef,
        setPlayer1Health,
        setPlayer1Defense,
        player1DefenseRef
      );

      if (logEntries.length) {
        setBattleLog(prev => {
          const next = [...prev, ...logEntries];
          return next.length > LOG_LIMIT ? next.slice(-LOG_LIMIT) : next;
        });
      }

      setPlayer1Queue(prev => (prev.length ? prev.slice(1) : prev));
      setPlayer2Queue(prev => (prev.length ? prev.slice(1) : prev));
    }, 1500);

    return () => clearTimeout(timer);
  }, [roundStart, player1Queue, player2Queue, winner]);

  // determine winner based on health or start additional rounds when moves are exhausted
  useEffect(() => {
    if (!roundStart || winner) return;
    if (player1Health <= 0 && player2Health <= 0) {
      setWinner("Draw");
      return;
    }
    if (player1Health <= 0) {
      setWinner("Player 2");
      return;
    }
    if (player2Health <= 0) {
      setWinner("Player 1");
      return;
    }

    const queuesEmpty = player1Queue.length === 0 && player2Queue.length === 0;
    if (!queuesEmpty) return;

    if (player1Health > 0 && player2Health > 0 && player1Loadout.length > 0 && player2Loadout.length > 0) {
      startNextRound();
      return;
    }

    if (player1Health === player2Health) {
      setWinner("Draw");
    } else {
      setWinner(player1Health > player2Health ? "Player 1" : "Player 2");
    }
  }, [roundStart, winner, player1Health, player2Health, player1Queue, player2Queue, player1Loadout, player2Loadout, startNextRound]);

  useEffect(() => {
    if (!slotAUid) return;
    const userRef = doc(db, "users", slotAUid);
    return onSnapshot(userRef, snap => {
      const pet = snap.data()?.pet ?? {};
      setSlotAPetChoice(pet.choice ?? 1);
      setSlotAEvolutions(pet.evolutions ?? 0);
    });
  }, [slotAUid]);

  useEffect(() => {
    if (!slotBUid) return;
    const userRef = doc(db, "users", slotBUid);
    return onSnapshot(userRef, snap => {
      const pet = snap.data()?.pet ?? {};
      setSlotBPetChoice(pet.choice ?? 1);
      setSlotBEvolutions(pet.evolutions ?? 0);
    });
  }, [slotBUid]);

  useEffect(() => {
    if (!roomId || !auth.currentUser) return;
    const userRef = doc(db, "users", auth.currentUser.uid);
    return onSnapshot(userRef, snap => {
      const pet = snap.data()?.pet ?? {};
      const moves = Array.isArray(pet.moves) ? pet.moves.filter((m: unknown): m is MoveId => typeof m === "string" && m in moveSet) : [];
      setMyMoves(moves);
      // If the moveOrder is empty or moves changed length, reset order to the fetched moves.
      setMoveOrder(prev => (prev.length === 0 || prev.length !== moves.length ? [...moves] : prev));
    });
  }, [roomId, auth.currentUser?.uid]);

  useEffect(() => {
    if (slotAUid && slotBUid) {
      setRefreshUsed(false);
      setMyReady(false);
    } else {
      setRoundStart(false);
      setPlayer1Queue([]);
      setPlayer2Queue([]);
      setBattleLog([]);
      setWinner(null);
      setPlayer1Health(MAX_HEALTH);
      setPlayer2Health(MAX_HEALTH);
      setPlayer1Defense(0);
      setPlayer2Defense(0);
      setPlayer1Loadout([]);
      setPlayer2Loadout([]);
      setRoundNumber(1);
      player1DefenseRef.current = 0;
      player2DefenseRef.current = 0;
    }
  }, [slotAUid, slotBUid]);

  useEffect(() => {
    if (!myReady) {
      setRefreshUsed(false);
    }
  }, [myReady]);

  const renderMoveTrack = (queue: MoveId[], label: string) => (
    <div className="move-track__inner">
      <span className="move-track__label">{label}</span>
      <div className="move-track__list">
        {queue.length === 0 ? (
          <span className="muted">No moves queued</span>
        ) : (
          queue.map((moveId, idx) => (
            <span key={`${moveId}-${idx}`} className={`move-pill ${idx === 0 ? "active" : ""}`}>
              {moveSet[moveId]?.name ?? moveId}
            </span>
          ))
        )}
      </div>
    </div>
  );

  const healthPercent = (value: number) => Math.max(0, Math.min(100, (value / MAX_HEALTH) * 100));
  const showBattleLog = battleLog.length > 0 || Boolean(winner);

  if (!roomId) return <div className="room">No room selected.</div>;

  return (
    <div className="room">
      <div className="room-header">
        <div>
          <p className="eyebrow">Room</p>
          <button onClick={joinMatch}>join match</button>
          <button onClick={leaveMatch}>leave match</button>
          {slotAUid && slotBUid ? (
            <>
              <button onClick={() => setReady(!myReady)} className="button-link secondary">
                {myReady ? "Unready" : "Ready"}
              </button>
              <span className="muted" style={{ marginLeft: "0.5rem" }}>
                {allReady ? "Both players ready — match starting" : "Waiting for both players to ready"}
              </span>
            </>
          ) : null}
        </div>
      </div>

      <div className="room-body">
        <div className="room-main-placeholder" aria-hidden="true">
          <div className="battle-field">
            <div className="battle-sky" />
            {roundStart ? (
              <>
                <div className="move-track move-track--top">
                  {renderMoveTrack(player2Queue, "Player 2 moves")}
                </div>
                <div className="move-track move-track--bottom">
                  {renderMoveTrack(player1Queue, "Player 1 moves")}
                </div>
              </>
            ) : null}
            {slotAUid && slotBUid && !allReady && moveOrder.length > 0 ? (
              <div className="ability-panel">
                <div className="ability-header">
                  <p className="eyebrow">Your abilities</p>
                  <span className="muted">Reorder locally — database stays unchanged</span>
                </div>
                <ul className="ability-list">
                  {moveOrder.map((moveId, idx) => {
                    const label = moveSet[moveId]?.name ?? moveId;
                    return (
                      <li key={`${moveId}-${idx}`} className="ability-row">
                        <span className="ability-name">{label}</span>
                        <div className="ability-actions">
                          <button onClick={() => moveUp(idx)} disabled={idx === 0}>↑</button>
                          <button onClick={() => moveDown(idx)} disabled={idx === moveOrder.length - 1}>↓</button>
                          <button onClick={() => refreshAbility(idx)} disabled={refreshUsed}>Refresh</button>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              </div>
            ) : null}
            {roundStart ? (
              <div className="health-hud">
                <div className="health-badge enemy">
                  <div className="health-header">
                    <span className="health-label">Player 2</span>
                    <span className="defense-chip">DEF {player2Defense}</span>
                  </div>
                  <div className="health-bar">
                    <span style={{ width: `${healthPercent(player2Health)}%` }} />
                  </div>
                  <div className="health-metrics">
                    <strong>
                      {player2Health}/{MAX_HEALTH} HP
                    </strong>
                  </div>
                </div>
                <div className="health-badge player">
                  <div className="health-header">
                    <span className="health-label">Player 1</span>
                    <span className="defense-chip">DEF {player1Defense}</span>
                  </div>
                  <div className="health-bar">
                    <span style={{ width: `${healthPercent(player1Health)}%` }} />
                  </div>
                  <div className="health-metrics">
                    <strong>
                      {player1Health}/{MAX_HEALTH} HP
                    </strong>
                  </div>
                </div>
              </div>
            ) : null}
            <div className="battle-grid">
              <div className="battle-slot enemy-slot">
                <div className="slot-label">{slotAUid ? "Player 2" : "Waiting for player"}</div>
                {slotAUid ? (
                  <div className="battle-pet">
                    <Pet
                      petEvolution={slotAEvolutions}
                      petChoice={slotAPetChoice}
                      stage={"Baby"}
                      health={0}
                      attack={0}
                      defence={0}
                      energy={0}
                      avaulableMoves={null}
                    />
                  </div>
                ) : null}
              </div>

              <div className="battle-slot player-slot">
                <div className="slot-label">{slotBUid ? "Player 1" : "Waiting for player"}</div>
                {slotBUid ? (
                  <div className="battle-pet">
                    <Pet
                      petEvolution={slotBEvolutions}
                      petChoice={slotBPetChoice}
                      stage={"Baby"}
                      health={0}
                      attack={0}
                      defence={0}
                      energy={0}
                      avaulableMoves={null}
                    />
                  </div>
                ) : null}
              </div>
            </div>
          </div>
        </div>

        <div className="sidebar-stack">
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

          {showBattleLog ? (
            <div className="battle-log battle-log--sidebar">
              {winner ? <div className="winner-banner">Winner: {winner}</div> : null}
              <ul>
                {battleLog.map((entry, idx) => (
                  <li key={`${entry}-${idx}`}>{entry}</li>
                ))}
              </ul>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
