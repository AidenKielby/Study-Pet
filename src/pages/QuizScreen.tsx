import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { doc, getDoc } from "firebase/firestore";
import { Quiz } from "../components/quizes";
import { db } from "../firebase";

export default function QuizScreen() {
    const { id } = useParams();
    const [questionIndex, setQuestionIndex] = useState(0);
    const [isPressed, setIsPressed] = useState(false);
    const [quiz, setQuiz] = useState<Quiz | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const load = async () => {
            if (!id) {
                const q = new Quiz();
                q.addQuizElm(["yes", "no", "maybe soooo"], "Is Aiden cool?", 0);
                q.addQuizElm(["yes", "no", "maybe soooo", ""], "Is Aiden bad?", 1);
                setQuiz(q);
                setLoading(false);
                return;
            }

            try {
                const snap = await getDoc(doc(db, "quizzes", id));
                if (snap.exists()) {
                    const data = snap.data() as { question: string; answers: string[]; correctIndex: number };
                    const q = new Quiz();
                    q.addQuizElm(data.answers ?? [], data.question ?? "Untitled", data.correctIndex ?? 0);
                    setQuiz(q);
                } else {
                    console.warn("Quiz not found");
                }
            } catch (err) {
                console.error("Failed to load quiz", err);
            } finally {
                setLoading(false);
            }
        };

        load();
    }, [id]);

    const handleButtonClick = (indx: number) => {
        if (!quiz || isPressed) return;
        if (indx === quiz.answerIndexes[questionIndex]) {
            setQuestionIndex(n => n + 1);
        }
        setIsPressed(true);
        setTimeout(() => setIsPressed(false), 10);
    };

    if (loading) return <div>Loading quiz...</div>;
    if (!quiz) return <div>Quiz not found.</div>;

    const answers = quiz.answers[questionIndex] ?? [];
    const question = quiz.questions[questionIndex];

    return (
        <div id="quiz_holder">
            <div id="question">
                <a>{question ?? "Done"}</a>
            </div>
            <div id="answers" className="answers-grid">
                {(answers ?? []).filter(Boolean).map((ans, idx) => (
                    <button key={idx} onClick={() => handleButtonClick(idx)}>{ans}</button>
                ))}
            </div>
        </div>
    );
}