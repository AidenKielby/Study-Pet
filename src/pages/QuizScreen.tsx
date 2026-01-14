import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { Quiz } from "../components/quizes";
import { doc, getDoc, updateDoc, increment } from "firebase/firestore"; // add updateDoc, increment
import { auth, db } from "../firebase";
import { Link } from "react-router-dom";

export default function QuizScreen() {
    const { id } = useParams();
    const [questionIndex, setQuestionIndex] = useState(0);
    const [isPressed, setIsPressed] = useState(false);
    const [feedback, setFeedback] = useState<string | null>(null);
    const [quiz, setQuiz] = useState<Quiz | null>(null);
    const [loading, setLoading] = useState(true);
    const [ammountCorrect, setAmmountCorect] = useState(quiz?.questions.length ?? 0);
    const [gotWrong, setGotWrong] = useState<boolean>(false);

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
                    const data = snap.data() as { questions?: Array<{ question: string; answers: string[]; correctIndex: number }> };
                    const q = new Quiz();
                    (data.questions ?? []).forEach(item => {
                        q.addQuizElm(item.answers ?? [], item.question ?? "Untitled", item.correctIndex ?? 0);
                    });
                    setQuiz(q);
                    setAmmountCorect(q.questions.length ?? 0);
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

    const handleButtonClick = async (indx: number) => {
        if (!quiz || isPressed) return;
        if (indx === quiz.answerIndexes[questionIndex]) {
            setQuestionIndex(n => n + 1);
            setFeedback(null);
            setGotWrong(false);
        }
        else {
            if (!gotWrong){
                setAmmountCorect(n => n - 1);
            }
            setGotWrong(true);
            setFeedback("Incorrect, try again.");
        }
        setIsPressed(true);
        const nextIndex = questionIndex + 1;
        const isCorrect = indx === quiz.answerIndexes[questionIndex];

        if (nextIndex >= quiz.questions.length && isCorrect){
            const user = auth.currentUser;
            if (user){
                const userRef = doc(db, "users", user.uid);
                await updateDoc(userRef, {experience: increment(ammountCorrect*2)});
            }
        }

        setTimeout(() => setIsPressed(false), 10);
    };

    if (loading) return <div>Loading quiz...</div>;
    if (!quiz) return <div>Quiz not found.</div>;

    const answers = quiz.answers[questionIndex] ?? [];
    const question = quiz.questions[questionIndex];

    if (questionIndex >= quiz.questions.length) {
        return (
            <div id="quiz_holder">
                <div id="question">
                    <a>Done!</a>
                </div>
                <div className="actions spaced">
                    <Link className="primary" to="/">Back to home</Link>
                </div>
            </div>
        );
    }

    return (
        <div id="quiz_holder">
            <div id="question">
                <a>{question ?? "Done"}</a>
            </div>
            {feedback && <div className="feedback error">{feedback}</div>}
            <div id="answers" className="answers-grid">
                {(answers ?? []).filter(Boolean).map((ans, idx) => (
                    <button key={idx} onClick={() => handleButtonClick(idx)}>{ans}</button>
                ))}
            </div>
        </div>
    );
}