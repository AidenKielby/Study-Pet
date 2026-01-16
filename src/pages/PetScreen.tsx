import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { auth, db } from "../firebase";
import Pet from "../components/pet";
import { moveSet, getRandomMove, buildPetMoveIds, type MoveId, type MoveType } from "../components/moveSet";
import { Move } from "../components/move";
import { computePetStats, type ComputedPetStats } from "../components/petStats";

export default function PetScreen() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stage, setStage] = useState<"Baby" | "Teen" | "Adult">("Baby");
  const [evolutions, setEvolutions] = useState<number>(0);
  const [petChoice, setPetChoice] = useState<number>(1);
  const [petType, setPetType] = useState<MoveType>("any");
  const [petMoveIds, setPetMoveIds] = useState<MoveId[]>([]);
  const [petLoaded, setPetLoaded] = useState(false);
  const [petStats, setPetStats] = useState<ComputedPetStats | null>(null);

  const petMoveTypes: Record<number, MoveType> = {
    1: "elemental",
    2: "physical",
  };

  const derivedStats = useMemo(() => computePetStats(stage, evolutions, petType), [stage, evolutions, petType]);

  useEffect(() => {
    const unsub = auth.onAuthStateChanged(async user => {
      if (!user) {
        setError("Sign in to view your pet.");
        setLoading(false);
        return;
      }
      setLoading(true);
      try {
        const ref = doc(db, "users", user.uid);
        const snap = await getDoc(ref);
        const data = snap.data();
        const petData = data?.pet ?? {};
        const choice = Number(petData.choice ?? 1) || 1;

        setStage(petData.stage ?? "Baby");
        setEvolutions(petData.evolutions ?? 0);
        setPetChoice(choice);
        const inferredType = petData.type as MoveType | undefined;
        const derivedType = inferredType && inferredType !== "any" ? inferredType : (petMoveTypes[choice] ?? "any");
        setPetType(derivedType);

        if (petData.stats && typeof petData.stats === "object") {
          setPetStats(petData.stats as ComputedPetStats);
        } else {
          const freshStats = computePetStats(petData.stage ?? "Baby", petData.evolutions ?? 0, derivedType);
          setPetStats(freshStats);
          updateDoc(ref, { "pet.stats": freshStats }).catch(() => {});
        }

        const storedMoves = Array.isArray(petData.moves)
          ? (petData.moves.filter((m: unknown): m is MoveId => typeof m === "string" && m in moveSet))
          : [];
        setPetMoveIds(storedMoves);
        setError(null);
      } catch (err) {
        console.error("Failed to load pet", err);
        setError("Couldn't load pet data.");
      } finally {
        setLoading(false);
        setPetLoaded(true);
      }
    });

    return unsub;
  }, []);

  // Generate and persist moves if missing after load.
  useEffect(() => {
    if (!petLoaded) return;
    if (!petType || petMoveIds.length > 0) return;
    const fresh = buildPetMoveIds(petType);
    setPetMoveIds(fresh);
    const user = auth.currentUser;
    if (user) {
      updateDoc(doc(db, "users", user.uid), {
        "pet.moves": fresh,
      }).catch(() => {});
    }
  }, [petLoaded, petType, petMoveIds]);

  // Persist moves when they change (after load) to keep in sync.
  useEffect(() => {
    if (!petLoaded) return;
    const user = auth.currentUser;
    if (!user) return;
    const persistedType = petType === "any" ? (petMoveTypes[petChoice] ?? "any") : petType;
    updateDoc(doc(db, "users", user.uid), {
      "pet.moves": petMoveIds,
      "pet.type": persistedType,
      "pet.choice": petChoice,
      ...(petStats ? { "pet.stats": petStats } : { "pet.stats": derivedStats }),
    }).catch(() => {});
  }, [petMoveIds, petType, petChoice, petStats, derivedStats, petLoaded]);

  const petMoves: Move[] = useMemo(() => {
    const moves = petMoveIds
      .map(id => moveSet[id]?.move)
      .filter(Boolean) as Move[];
    return moves.length ? moves : getRandomMove(petType, 4).map(def => def.move);
  }, [petMoveIds, petType]);

  // Prefer persisted stats when available; otherwise use derived.
  const effectiveStats = petStats ?? derivedStats;

  const moveDetails = useMemo(() => {
    const typeIconMap: Record<MoveType, string> = {
      magic: "/magicIcon.png",
      physical: "/physicalIcon.png",
      elemental: "/elementalIcon.png",
      any: "/anyIcon.png",
    };

    return petMoveIds
      .map(id => moveSet[id])
      .filter(Boolean)
      .map(def => ({
        id: def!.id,
        name: def!.name,
        description: def!.description,
        tag: def!.move.tag,
        icon: typeIconMap[def!.move.tag as MoveType] ?? typeIconMap.any,
      }));
  }, [petMoveIds]);

  if (loading) return <div className="pet-profile"><div className="panel subtle">Loading pet...</div></div>;
  if (error) return <div className="pet-profile"><div className="panel subtle">{error}</div><Link to="/auth" className="button-link primary" style={{ marginTop: "0.75rem" }}>Sign in</Link></div>;

  return (
    <div className="pet-profile">
      <div className="header-row">
        <div>
          <p className="eyebrow">Your Companion</p>
          <h2>Pet Overview</h2>
          <p className="muted">See your pet's stats, type, and current moveset.</p>
        </div>
        <Link to="/" className="button-link secondary">Back home</Link>
      </div>

      <div className="pet-profile__layout">
        <div className="card pet-profile__visual">
          <div className="pet-preview">
            <Pet stage={stage} petChoice={petChoice} petEvolution={evolutions} health={0} attack={0} defence={0} energy={0} avaulableMoves={petMoves} />
          </div>
          <div className="pill-row" style={{ justifyContent: "center", marginTop: "0.5rem" }}>
            <span className="pill">Type: {petType}</span>
            <span className="pill">Evolutions: {evolutions}</span>
          </div>
          <div className="stat-grid" style={{ width: "100%" }}>
            <div className="stat"><span className="label">Health</span><span className="value">{effectiveStats.health}</span></div>
            <div className="stat"><span className="label">Attack</span><span className="value">{effectiveStats.attack}</span></div>
            <div className="stat"><span className="label">Defense</span><span className="value">{effectiveStats.defense}</span></div>
            <div className="stat"><span className="label">Magic</span><span className="value">{effectiveStats.magic}</span></div>
            <div className="stat"><span className="label">Energy</span><span className="value">{effectiveStats.energy}</span></div>
            <div className="stat"><span className="label">Speed</span><span className="value">{effectiveStats.speed}</span></div>
          </div>
        </div>

        <div className="card pet-profile__stats">
          <div className="stat-grid">
            <div className="stat">
              <span className="label">Stage</span>
              <span className="value">{stage}</span>
            </div>
            <div className="stat">
              <span className="label">Pet Choice</span>
              <span className="value">{petChoice}</span>
            </div>
            <div className="stat">
              <span className="label">Type</span>
              <span className="value">{petType}</span>
            </div>
          </div>
          <div className="panel subtle" style={{ marginTop: "1rem" }}>
            <div className="header-row" style={{ alignItems: "flex-start" }}>
              <div>
                <p className="eyebrow">Moveset</p>
                <h3 style={{ margin: 0 }}>Current moves</h3>
              </div>
            </div>
            {moveDetails.length === 0 ? (
              <p className="muted">No moves yet.</p>
            ) : (
              <ul className="move-list">
                {moveDetails.map(m => (
                  <li key={m.id} className="move-list__item">
                    <div>
                      <div className="move-title">{m.name}</div>
                      <div className="muted">{m.description}</div>
                    </div>
                    <span className="pill pill-icon">
                      {m.icon && <img src={m.icon} alt={m.tag + " icon"} className="pill-icon__img" />}
                      <span>{m.tag}</span>
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
