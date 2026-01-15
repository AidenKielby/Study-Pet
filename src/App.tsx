import { useEffect, useState } from "react";
import { BrowserRouter, Routes, Route, Link } from "react-router-dom";
import { onAuthStateChanged, signOut, type User } from "firebase/auth";
import Home from "./pages/Home";
import Quiz from "./pages/QuizScreen";
import MakeQuizes from "./pages/MakeQuizes";
import LoadQuiz from "./pages/LoadQuiz";
import LogInOrSignUpPage from "./pages/LogInOrSignUpPage";
import PetScreen from "./pages/PetScreen";
import { auth } from "./firebase";
import AnalyticsTracker from "./AnalyticsTracker";
import RoomSelector from "./pages/RoomSelector";
import RoomCreator from "./pages/RoomCreator";
import Room from "./pages/Room";

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
                    {!user && <Link className="button-link secondary" to="/auth">Sign in with Google</Link>}
                    {user && <button className="button-link ghost" onClick={handleSignOut}>Sign out</button>}
                </div>
            </div>
            <nav className="main-nav">
                <div className="nav-brand">Study Pet</div>
                <div className="nav-links">
                    <Link to="/" className="nav-link">Home</Link>
                    <Link to="/pet" className="nav-link">Pet</Link>
                    <Link to="/load" className="nav-link">Load Quiz</Link>
                    <Link to="/make" className="nav-link">Build Quiz</Link>
                    <Link to="/rooms" className="nav-link">Rooms</Link>
                    <Link to="/auth" className="nav-link">Account</Link>
                </div>
            </nav>
            <AnalyticsTracker />
            <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/pet" element={<PetScreen />} />
                <Route path="/quiz" element={<Quiz />} />
                <Route path="/quiz/:id" element={<Quiz />} />
                <Route path="/make" element={<MakeQuizes />} />
                <Route path="/load" element={<LoadQuiz />} />
                <Route path="/auth" element={<LogInOrSignUpPage />} />
                <Route path="/rooms" element={<RoomSelector />} />
                <Route path="/make_room" element={<RoomCreator />} />
                <Route path="/room/:id" element={<Room />} />
            </Routes>
        </BrowserRouter>
    );
}