import { BrowserRouter, Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import Quiz from "./pages/QuizScreen";
import MakeQuizes from "./pages/MakeQuizes";
import LoadQuiz from "./pages/LoadQuiz";

export default function App() {
    return (
        <BrowserRouter>
            <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/quiz" element={<Quiz />} />
                <Route path="/quiz/:id" element={<Quiz />} />
                <Route path="/make" element={<MakeQuizes />} />
                <Route path="/load" element={<LoadQuiz />} />
            </Routes>
        </BrowserRouter>
    );
}