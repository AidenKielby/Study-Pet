import { useEffect, useState } from "react";
import { collection, getDocs } from "firebase/firestore";
import { useNavigate } from "react-router-dom";
import { db } from "../firebase";

interface QuizListItem {
  id: string;
  name: string;
  count: number;
  category: string | null;
}

export default function LoadQuiz() {
  const [quizzes, setQuizzes] = useState<QuizListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const navigate = useNavigate();

  const normalizeCategory = (category?: string | null) => category?.trim() || "Uncategorized";

  const categoryBadgeStyle = (category: string) => {
    const hash = category.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0);
    const hue = (hash * 47) % 360;
    return {
      background: `hsla(${hue}, 70%, 48%, 0.16)`,
      borderColor: `hsla(${hue}, 70%, 62%, 0.55)`,
      color: `hsla(${hue}, 90%, 88%, 1)`
    } as const;
  };

  useEffect(() => {
    const fetchQuizzes = async () => {
      try {
        const snap = await getDocs(collection(db, "quizzes"));
        const items = snap.docs.map(doc => {
          const data = doc.data() as { name?: string; questions?: Array<{ question: string }>; category?: string | null };
          return {
            id: doc.id,
            name: data.name ?? "(no name)",
            count: data.questions?.length ?? 0,
            category: data.category?.trim() || null
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

  if (loading) return <div>Loading quizzes...</div>;

  const categoryCounts = quizzes.reduce<Record<string, number>>((acc, quiz) => {
    const key = normalizeCategory(quiz.category);
    acc[key] = (acc[key] ?? 0) + 1;
    return acc;
  }, {});

  const categories = Object.keys(categoryCounts).sort((a, b) => a.localeCompare(b));
  const filtered = selectedCategory === "all"
    ? quizzes
    : quizzes.filter(q => normalizeCategory(q.category) === selectedCategory);

  const handleOpenQuiz = (id: string) => {
    navigate(`/quiz/${id}`);
  };

  return (
    <div className="quiz-loader">
      <div className="header-row quiz-loader__header">
        <div>
          <p className="eyebrow">Library</p>
          <h2>Select a Quiz</h2>
          <p className="muted">Pick a class/type, see how many questions are inside, and jump in.</p>
        </div>
        <div className="actions wrap">
          <button className="button-link secondary" onClick={() => navigate("/make")}>Create quiz</button>
        </div>
      </div>

      <div className="panel subtle quiz-loader__filters">
        <div className="filter-head">
          <span className="muted">Filter by class / type</span>
        </div>
        <div className="chip-row">
          <button
            type="button"
            className={selectedCategory === "all" ? "filter-chip active" : "filter-chip"}
            onClick={() => setSelectedCategory("all")}
          >
            All
            <span className="filter-chip__count">{quizzes.length}</span>
          </button>
          {categories.map(cat => (
            <button
              key={cat}
              type="button"
              className={selectedCategory === cat ? "filter-chip active" : "filter-chip"}
              onClick={() => setSelectedCategory(cat)}
            >
              {cat}
              <span className="filter-chip__count">{categoryCounts[cat]}</span>
            </button>
          ))}
        </div>
      </div>

      {quizzes.length === 0 ? (
        <div className="empty-card">
          <p className="muted">No quizzes saved yet.</p>
          <button className="button-link primary" onClick={() => navigate("/make")}>Create your first quiz</button>
        </div>
      ) : filtered.length === 0 ? (
        <div className="empty-card">
          <p className="muted">No quizzes in this class/type yet.</p>
          <button className="button-link ghost" onClick={() => setSelectedCategory("all")}>Clear filter</button>
        </div>
      ) : (
        <div className="quiz-grid">
          {filtered.map(q => {
            const category = normalizeCategory(q.category);
            return (
              <div
                key={q.id}
                className="quiz-card"
                role="button"
                tabIndex={0}
                onClick={() => handleOpenQuiz(q.id)}
                onKeyDown={e => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    handleOpenQuiz(q.id);
                  }
                }}
              >
                <div className="quiz-card__body">
                  <span className="quiz-card__badge" style={categoryBadgeStyle(category)}>{category}</span>
                  <h3 className="quiz-card__title">{q.name}</h3>
                  <div className="quiz-card__meta">
                    <span>{q.count} question{q.count === 1 ? "" : "s"}</span>
                    <span>Type: {category}</span>
                  </div>
                </div>
                <div className="quiz-card__actions">
                  <button className="button-link primary full" onClick={e => { e.stopPropagation(); handleOpenQuiz(q.id); }}>
                    Play
                  </button>
                  <button className="button-link ghost" onClick={e => { e.stopPropagation(); setSelectedCategory(category); }}>
                    Show only this type
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
