import { useState } from "react";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { useNavigate } from "react-router-dom";
import { db } from "../firebase";

export default function MakeQuizes() {
  const [question, setQuestion] = useState("");
  const [answers, setAnswers] = useState<string[]>(["", "", "", ""]);
  const [correctIndex, setCorrectIndex] = useState(0);
  const [saving, setSaving] = useState(false);
  const navigate = useNavigate();

  const handleAnswerChange = (idx: number, value: string) => {
    setAnswers(prev => {
      const next = [...prev];
      next[idx] = value;
      return next;
    });
  };

  const saveQuiz = async () => {
    if (!question.trim()) return alert("Add a question");
    const cleaned = answers.filter(a => a.trim());
    if (cleaned.length < 2) return alert("Add at least two answers");
    if (correctIndex < 0 || correctIndex >= cleaned.length) return alert("Pick a valid correct index");

    setSaving(true);
    try {
      await addDoc(collection(db, "quizzes"), {
        question: question.trim(),
        answers: cleaned,
        correctIndex,
        createdAt: serverTimestamp()
      });
      setQuestion("");
      setAnswers(["", "", "", ""]);
      setCorrectIndex(0);
      alert("Quiz saved!");
    } catch (e) {
      console.error("Error adding document: ", e);
      alert("Failed to save quiz");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="quiz-builder">
      <h2>Create a Quiz</h2>
      <div className="field">
        <label>Question</label>
        <input
          value={question}
          onChange={e => setQuestion(e.target.value)}
          placeholder="Enter question"
        />
      </div>
      <div className="field">
        <label>Answers</label>
        {answers.map((ans, idx) => (
          <div key={idx} className="answer-row">
            <input
              value={ans}
              onChange={e => handleAnswerChange(idx, e.target.value)}
              placeholder={`Answer ${idx + 1}`}
            />
            <label>
              Correct
              <input
                type="radio"
                name="correct"
                checked={correctIndex === idx}
                onChange={() => setCorrectIndex(idx)}
              />
            </label>
          </div>
        ))}
      </div>
      <div className="actions">
        <button onClick={saveQuiz} disabled={saving}>
          {saving ? "Saving..." : "Save Quiz"}
        </button>
        <button type="button" onClick={() => navigate("/load")}>Load a Quiz</button>
      </div>
    </div>
  );
}