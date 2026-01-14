import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Pet from "../components/pet";

import { doc, getDoc, updateDoc, increment } from "firebase/firestore"; // add updateDoc, increment
import { auth, db } from "../firebase";

export default function Home() {
    const [stage, setStage] = useState<"Baby" | "Teen" | "Adult">("Baby");
    const [evolutions, setEvolutions] = useState<number>(0);
    const [userXP, setUserXP] = useState<number>(0);
    const [feedback, setFeedback] = useState<string | null>(null);

    const nextStage = () => {
        if (userXP >= 25){

            const nextStage = stage === "Baby" ? "Teen" : stage === "Teen" ? "Adult" : "Baby";
            const nextEvo = stage === "Adult" ? evolutions + 1 : evolutions;

            setStage(nextStage);
            setEvolutions(nextEvo);
            setUserXP(n => n - 25);
            
            (async () => {
                const user = auth.currentUser;
                if (!user) {
                    setUserXP(0);
                    return;
                }
                const ref = doc(db, "users", user.uid);
                await Promise.all([
                    updateDoc(ref, { experience: increment(-25) }),
                    updateDoc(ref, { pet: { stage: nextStage, evolutions: nextEvo } })
                ]);

            })();
        }
        else{
            setFeedback("Not enough XP! Need at least 25")
        }
        
    };

    useEffect(() => {
        const unsub = auth.onAuthStateChanged(async (user) => {
            if (!user) {
            setUserXP(0);
            return;
            }
            const ref = doc(db, "users", user.uid);
            const snap = await getDoc(ref);
            setUserXP(snap.data()?.experience ?? 0);
            setEvolutions(snap.data()?.pet.evolutions ?? 0);
            setStage(snap.data()?.pet.stage ?? 0);
        });
        return unsub;
        }, []);

    return (
        <div className="home">
            <div className="hero-grid">
                <div className="hero-card">
                    <p className="eyebrow">Study Pet</p>
                    <h1 className="hero-title">Grow your pet while you quiz</h1>
                    <p className="muted">Finish study sessions, evolve your companion, and build custom quizzes to keep learning fun.</p>
                    <div className="cta-row">
                        <Link to="/quiz" className="button-link primary">Start Quiz</Link>
                        <Link to="/make" className="button-link secondary">Build a Quiz</Link>
                        <Link to="/load" className="button-link ghost">Load a Quiz</Link>
                    </div>
                </div>

                <div className="pet-card card">
                    <div className="pet-preview">
                        <Pet stage={stage} evolutions={evolutions} />
                    </div>
                    <div className="pet-stats">
                        <div className="stat">
                            <span className="label">Experience</span>
                            <span className="value">{userXP}</span>
                        </div>
                        <div className="stat">
                            <span className="label">Stage</span>
                            <span className="value">{stage}</span>
                        </div>
                        <div className="stat">
                            <span className="label">Evolutions</span>
                            <span className="value">{evolutions}</span>
                        </div>
                    </div>
                    <button className="button-link primary full" onClick={nextStage}>Use Experience</button>
                    {feedback && <div className="feedback error">{feedback}</div>}
                </div>
            </div>
        </div>
    );
}