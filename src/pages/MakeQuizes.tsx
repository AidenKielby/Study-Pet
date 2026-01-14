import { useState } from "react";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { useNavigate } from "react-router-dom";
import { db } from "../firebase";

type QuizItem = {
  question: string;
  answers: string[];
  correctIndex: number;
};

export default function MakeQuizes() {
  const [quizName, setQuizName] = useState("");
  const [question, setQuestion] = useState("");
  const [answers, setAnswers] = useState<string[]>(["", "", "", ""]);
  const [correctIndex, setCorrectIndex] = useState(0);
  const [items, setItems] = useState<QuizItem[]>([]);
  const [saving, setSaving] = useState(false);
  const navigate = useNavigate();

  const handleAnswerChange = (idx: number, value: string) => {
    setAnswers(prev => {
      const next = [...prev];
      next[idx] = value;
      return next;
    });
  };

  const addQuestion = () => {
    if (!question.trim()) return alert("Add a question");
    const cleaned = answers.map(a => a.trim()).filter(Boolean);
    if (cleaned.length < 2) return alert("Add at least two answers");
    if (correctIndex < 0 || correctIndex >= cleaned.length) return alert("Pick a valid correct index");

    const safeIndex = Math.min(correctIndex, cleaned.length - 1);
    setItems(prev => [...prev, { question: question.trim(), answers: cleaned, correctIndex: safeIndex }]);
    setQuestion("");
    setAnswers(["", "", "", ""]);
    setCorrectIndex(0);
  };

  const saveQuiz = async () => {
    if (!quizName.trim()) return alert("Add a quiz name");
    if (items.length === 0) return alert("Add at least one question");

    setSaving(true);
    try {
      await addDoc(collection(db, "quizzes"), {
        name: quizName.trim(),
        questions: items,
        createdAt: serverTimestamp()
      });
      setQuizName("");
      setItems([]);
      alert("Quiz saved!");
    } catch (e) {
      console.error("Error adding document: ", e);
      alert("Failed to save quiz");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="quiz-builder card">
      <div className="header-row">
        <div>
          <p className="eyebrow">Builder</p>
          <h2>Create a Quiz</h2>
          <p className="muted">Add a name, stack questions, then save.</p>
        </div>
        <button type="button" className="secondary" onClick={() => navigate("/load")}>
          Load a Quiz
        </button>
      </div>

      <div className="panel">
        <label>Quiz Name</label>
        <input
          value={quizName}
          onChange={e => setQuizName(e.target.value)}
          placeholder="My awesome quiz"
        />
      </div>

      <div className="panel">
        <label>Question</label>
        <input
          value={question}
          onChange={e => setQuestion(e.target.value)}
          placeholder="Enter question"
        />
        <div className="answers-grid">
          {answers.map((ans, idx) => (
            <div key={idx} className="answer-row">
              <input
                value={ans}
                onChange={e => handleAnswerChange(idx, e.target.value)}
                placeholder={`Answer ${idx + 1}`}
              />
              <label className="radio">
                <input
                  type="radio"
                  name="correct"
                  checked={correctIndex === idx}
                  onChange={() => setCorrectIndex(idx)}
                />
                Correct
              </label>
            </div>
          ))}
        </div>
        <div className="actions">
          <button type="button" className="primary" onClick={addQuestion}>Add Question</button>
        </div>
      </div>

      {items.length > 0 && (
        <div className="panel">
          <div className="header-row">
            <h3>Questions ({items.length})</h3>
            <small className="muted">Saved locally until you click Save Quiz</small>
          </div>
          <ol className="question-list">
            {items.map((q, i) => (
              <li key={i}>
                <div className="q-text">{q.question}</div>
                <div className="q-answers">{q.answers.map((a, idx) => (
                  <span key={idx} className={idx === q.correctIndex ? "pill correct" : "pill"}>{a}</span>
                ))}</div>
              </li>
            ))}
          </ol>
        </div>
      )}

      <div className="actions spaced">
        <button className="primary" onClick={saveQuiz} disabled={saving}>
          {saving ? "Saving..." : "Save Quiz"}
        </button>
        <button type="button" className="ghost" onClick={() => navigate("/load")}>Load a Quiz</button>
      </div>
    </div>
  );
}