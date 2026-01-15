import { useEffect, useState } from "react";
import { collection, getDocs } from "firebase/firestore";
import { useNavigate } from "react-router-dom";
import { db } from "../firebase";

interface QuizListItem {
  id: string;
  name: string;
  count: number;
}

export default function LoadQuiz() {
  const [quizzes, setQuizzes] = useState<QuizListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchQuizzes = async () => {
      try {
        const snap = await getDocs(collection(db, "quizzes"));
        const items = snap.docs.map(doc => {
          const data = doc.data() as { name?: string; questions?: Array<{ question: string }> };
          return {
            id: doc.id,
            name: data.name ?? "(no name)",
            count: data.questions?.length ?? 0
          };
        });
        setQuizzes(items);
      } catch (e) {
        console.error("Failed to load quizzes", e);
      } finally {
        setLoading(false);
      }
    };

    fetchQuizzes();
  }, []);

  if (loading) return <div className="quiz-loader"><div className="panel subtle">Loading quizzes...</div></div>;

  const sortedQuizzes = [...quizzes].sort((a, b) => b.count - a.count || a.name.localeCompare(b.name));

  return (
    <div className="quiz-loader">
      <div className="quiz-loader__header">
        <p className="eyebrow">Quizzes</p>
        <h2>Pick something to practice</h2>
        <p className="muted">Browse your saved quizzes and jump back in.</p>
      </div>

      {quizzes.length === 0 ? (
        <div className="empty-card">
          <h3>No quizzes yet</h3>
          <p className="muted">Create one from the Build Quiz page, then come back to play it.</p>
          <button className="button-link primary" onClick={() => navigate("/make")}>Build a quiz</button>
        </div>
      ) : (
        <div className="quiz-grid">
          {sortedQuizzes.map(q => (
            <div key={q.id} className="quiz-card" onClick={() => navigate(`/quiz/${q.id}`)}>
              <div className="quiz-card__body">
                <div className="quiz-card__badge">{q.count} question{q.count === 1 ? "" : "s"}</div>
                <h3 className="quiz-card__title">{q.name}</h3>
                <p className="muted">Tap to start — we’ll keep your streak going.</p>
              </div>
              <div className="quiz-card__actions">
                <button className="button-link primary" onClick={(e) => { e.stopPropagation(); navigate(`/quiz/${q.id}`); }}>Start quiz</button>
                <button className="button-link ghost" onClick={(e) => { e.stopPropagation(); navigate(`/quiz/${q.id}`); }}>Open</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
