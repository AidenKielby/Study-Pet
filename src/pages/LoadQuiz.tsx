import React, { useEffect, useState } from "react";
import { collection, getDocs } from "firebase/firestore";
import { useNavigate } from "react-router-dom";
import { db } from "../firebase";

interface QuizListItem {
  id: string;
  question: string;
}

export default function LoadQuiz() {
  const [quizzes, setQuizzes] = useState<QuizListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchQuizzes = async () => {
      try {
        const snap = await getDocs(collection(db, "quizzes"));
        const items = snap.docs.map(doc => ({
          id: doc.id,
          question: (doc.data().question as string) ?? "(no question)"
        }));
        setQuizzes(items);
      } catch (e) {
        console.error("Failed to load quizzes", e);
      } finally {
        setLoading(false);
      }
    };

    fetchQuizzes();
  }, []);

  if (loading) return <div>Loading quizzes...</div>;

  return (
    <div className="quiz-loader">
      <h2>Select a Quiz</h2>
      {quizzes.length === 0 ? (
        <p>No quizzes saved yet.</p>
      ) : (
        <ul>
          {quizzes.map(q => (
            <li key={q.id}>
              <span>{q.question}</span>
              <button onClick={() => navigate(`/quiz/${q.id}`)}>Play</button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
