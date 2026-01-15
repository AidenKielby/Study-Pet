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
    const [petChoice, setPetChoice] = useState<number>(1);

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
                await updateDoc(ref, {
                    experience: increment(-25),
                    "pet.stage": nextStage,
                    "pet.evolutions": nextEvo,
                });
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
            const data = snap.data();
            const petData = data?.pet ?? {};
            setUserXP(data?.experience ?? 0);
            setEvolutions(petData.evolutions ?? 0);
            setStage(petData.stage ?? "Baby");
            setPetChoice(petData.choice ?? 1);
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
                        <Link to="/load" className="button-link primary">Start Quiz</Link>
                        <Link to="/make" className="button-link secondary">Build a Quiz</Link>
                    </div>
                    <div className="pill-row">
                        <span className="pill muted">Live XP tracking</span>
                        <span className="pill muted">Custom quiz builder</span>
                        <span className="pill muted">Invite-only rooms</span>
                    </div>
                </div>

                <div className="pet-card card">
                    <div className="pet-preview">
                        <Pet stage={stage} evolutions={evolutions} petChoice={petChoice} petEvolution={evolutions}/>
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

            <section className="section info-grid">
                <div className="section-header">
                    <p className="eyebrow">Why Study Pet</p>
                    <h2 className="section-title">Keep learning playful, focused, and social.</h2>
                </div>
                <div className="feature-grid">
                    <div className="feature-card">
                        <h3>Built-in motivation</h3>
                        <p className="muted">Earn XP as you quiz and evolve your companion through stages.</p>
                    </div>
                    <div className="feature-card">
                        <h3>Custom quizzes</h3>
                        <p className="muted">Create, save, and reuse quizzes tailored to your courses.</p>
                    </div>
                    <div className="feature-card">
                        <h3>Invite-only rooms</h3>
                        <p className="muted">Share a join code with friends to study together safely.</p>
                    </div>
                </div>
            </section>

            <section className="section steps">
                <div className="section-header">
                    <p className="eyebrow">How it works</p>
                    <h2 className="section-title">Three steps to evolve your pet</h2>
                </div>
                <div className="step-grid">
                    <div className="step-card">
                        <div className="step-number">1</div>
                        <div>
                            <h3>Sign in and pick a pet</h3>
                            <p className="muted">Choose your starter and sync your progress securely.</p>
                        </div>
                    </div>
                    <div className="step-card">
                        <div className="step-number">2</div>
                        <div>
                            <h3>Study with quizzes</h3>
                            <p className="muted">Use the quiz builder or load saved sets to earn XP.</p>
                        </div>
                    </div>
                    <div className="step-card">
                        <div className="step-number">3</div>
                        <div>
                            <h3>Evolve and share</h3>
                            <p className="muted">Spend XP to evolve, then invite friends to your room with a join code.</p>
                        </div>
                    </div>
                </div>
            </section>

            <section className="cta-band">
                <div>
                    <p className="eyebrow">Ready to play</p>
                    <h3>Jump into a quiz or build your own.</h3>
                </div>
                <div className="cta-row">
                    <Link to="/load" className="button-link primary">Start a quiz</Link>
                    <Link to="/make" className="button-link secondary">Make a quiz</Link>
                </div>
            </section>
        </div>
    );
}