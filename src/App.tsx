import { useEffect, useState } from "react";
import { BrowserRouter, Routes, Route, Link } from "react-router-dom";
import { onAuthStateChanged, signOut, type User } from "firebase/auth";
import Home from "./pages/Home";
import Quiz from "./pages/QuizScreen";
import MakeQuizes from "./pages/MakeQuizes";
import LoadQuiz from "./pages/LoadQuiz";
import LogInOrSignUpPage from "./pages/LogInOrSignUpPage";
import { auth } from "./firebase";
import AnalyticsTracker from "./AnalyticsTracker";

export default function App() {
    const [user, setUser] = useState<User | null>(null);

    useEffect(() => {
        const unsub = onAuthStateChanged(auth, setUser);
        return unsub;
    }, []);

    const handleSignOut = async () => {
        try {
            await signOut(auth);
        } catch (err) {
            console.error("Sign out failed", err);
        }
    };

    return (
        <BrowserRouter>
            <div className="account-bar">
                <span className="muted">{user ? `Signed in as ${user.displayName ?? user.email ?? user.uid}` : "Not signed in"}</span>
                <div className="actions">
                    {!user && <Link className="button-link secondary" to="/auth">Log in / Sign up</Link>}
                    {user && <button className="button-link ghost" onClick={handleSignOut}>Sign out</button>}
                </div>
            </div>
            <AnalyticsTracker />
            <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/quiz" element={<Quiz />} />
                <Route path="/quiz/:id" element={<Quiz />} />
                <Route path="/make" element={<MakeQuizes />} />
                <Route path="/load" element={<LoadQuiz />} />
                <Route path="/auth" element={<LogInOrSignUpPage />} />
            </Routes>
        </BrowserRouter>
    );
}