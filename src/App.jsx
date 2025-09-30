import React, { useEffect, useMemo, useState } from "react";
import examData from "./exam_json_data.json";
import "./index.css";

function QuizPage({
  questions,
  answers,
  setAnswers,
  onSubmit,
  page,
  setPage,
}) {

  useEffect(function () {
    const handleKey = function (e) {
      if (e.key === "Enter") {
        const active = document.activeElement;
        if (active && active.type === "radio") {
          e.preventDefault();
          if (page === questions.length - 1) {
            onSubmit();
          } else {
            setPage((p) => {
              return Math.min(questions.length - 1, p + 1)
            });
          }
        }
      }
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [page, questions.length, onSubmit, setPage]);

  const q = questions[page];

  const handleSelect = (qid, optionIndex) => {
    setAnswers(prev => ({ ...prev, [qid]: optionIndex }));
  };

  const goPrev = () => setPage(p => Math.max(0, p - 1));
  const goNext = () => setPage(p => Math.min(questions.length - 1, p + 1));

  return (
    <div className="container">
      <header className="header">
        <h1>{examData.examTitle}</h1>
        <p className="muted">{examData.examDescription}</p>
      </header>

      <main>
        <div className="card">
          <div className="progress">
            <div className="progress-bar" style={{ width: `${((page + 1) / questions.length) * 100}%` }} />
            <div className="progress-label">{page + 1} / {questions.length}</div>
          </div>

          <div className="question-block">
            <div className="q-title">
              <span className="q-id">Q{q.id}.</span>
              <span>{q.question}</span>
            </div>

            <div className="options">
              {q.options.map((opt, idx) => {
                const name = `q-${q.id}`;
                const checked = answers[q.id] === idx;
                return (
                  <label key={idx} className={`option ${checked ? "selected" : ""}`}>
                    <input
                      type="radio"
                      name={name}
                      value={idx}
                      checked={checked || false}
                      onChange={() => handleSelect(q.id, idx)}
                    />
                    <span className="option-text">{opt}</span>
                  </label>
                );
              })}
            </div>

            <div className="nav-row">
              <button className="btn ghost" onClick={goPrev} disabled={page === 0}>
                ← Prev
              </button>

              <div className="actions">
                <button
                  className="btn outline"
                  onClick={() => setPage(0)}
                  title="Jump to first unanswered"
                >
                  First
                </button>

                <button
                  className="btn primary"
                  onClick={() => {
                    // If last question, submit; otherwise next
                    if (page === questions.length - 1) {
                      onSubmit();
                    } else {
                      goNext();
                    }
                  }}
                >
                  {page === questions.length - 1 ? "Submit Quiz" : "Next →"}
                </button>
              </div>
            </div>
          </div>
        </div>

        <aside className="sidebar">
          <div className="card small">
            <h3>Overview</h3>
            <p>- <strong>{questions.length}</strong> questions:</p>
            <ol className="mini-q-list">
              {questions.map((qq, i) => {
                const answered = answers[qq.id] !== undefined;
                return (
                  <li
                    key={qq.id}
                    className={answered ? "answered" : "unanswered"}
                    onClick={() => setPage(i)}
                    title={answered ? "Answered — click to jump" : "Unanswered — click to jump"}
                  >
                    {qq.id}
                  </li>
                );
              })}
            </ol>
            <div className="hint muted">
              You can navigate with Prev/Next. Click any number to jump.
            </div>
          </div>
        </aside>
      </main>
    </div>
  );
}

function ResultsPage({ questions, answers, onRestart }) {
  const score = questions.reduce((acc, q) => acc + (answers[q.id] === q.correctAnswer ? 1 : 0), 0);

  return (
    <div className="container">
      <header className="header">
        <h1>Results</h1>
        <p className="muted">Your score and per-item corrections</p>
      </header>

      <main>
        <div className="card">
          <div className="score">
            <div className="score-number">{score}</div>
            <div className="score-sub">out of {questions.length}</div>
          </div>

          <div className="results-list">
            {questions.map(q => {
              const ua = answers[q.id];
              const correctIdx = q.correctAnswer;
              const isCorrect = ua === correctIdx;
              return (
                <div className="result-item" key={q.id}>
                  <div className="result-q">
                    <span className="q-id">Q{q.id}.</span> {q.question}
                  </div>

                  <div className="result-answers">
                    <div className={`user-answer ${isCorrect ? "ok" : "bad"}`}>
                      <strong>Your answer:</strong>{" "}
                      {ua !== undefined ? q.options[ua] : <em>— No answer —</em>}
                      {isCorrect ? <span className="badge correct">Correct</span> : <span className="badge wrong">Wrong</span>}
                    </div>

                    {!isCorrect && (
                      <div className="correct-answer">
                        <strong>Correct:</strong> {q.options[correctIdx]}
                      </div>
                    )}

                    {q.explanation && q.explanation.trim() !== "" && (
                      <div className="explanation">
                        <strong>Note:</strong> {q.explanation}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="results-actions">
            <button className="btn" onClick={onRestart}>Retake Quiz</button>
          </div>
        </div>
      </main>
    </div>
  );
}

export default function App() {
  const questions = useMemo(
    () => examData.sections.flatMap(s => s.questions),
    []
  );

  const [theme, setTheme] = useState("theme-light-blue");
  const [answers, setAnswers] = useState({});
  const [page, setPage] = useState(0);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    document.body.classList.remove(
      "theme-light-blue", "theme-light-green", "theme-light-purple",
      "theme-dark-cyan", "theme-dark-bw", "theme-dark-orange"
    );
    document.body.classList.add(theme);
  }, [theme]);


  const handleSubmit = () => {
    setSubmitted(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleRestart = () => {
    setAnswers({});
    setPage(0);
    setSubmitted(false);
  };

  return (
    <>
      <div className="container">
        <header className="appheader">
          <h1>Quiz Application</h1>
          <select
            value={theme}
            onChange={e => setTheme(e.target.value)}
            className="btn"
          >
            <option value="theme-light-blue">Light Blue</option>
            <option value="theme-light-green">Light Green</option>
            <option value="theme-light-purple">Light Purple</option>
            <option value="theme-dark-cyan">Dark Cyan</option>
            <option value="theme-dark-bw">Dark B&W</option>
            <option value="theme-dark-orange">Dark Orange</option>
          </select>
        </header>
      </div>

      {submitted ? (
        <ResultsPage questions={questions} answers={answers} onRestart={handleRestart} />
      ) : (
        <QuizPage
          questions={questions}
          answers={answers}
          setAnswers={setAnswers}
          onSubmit={handleSubmit}
          page={page}
          setPage={setPage}
        />
      )}
    </>
  );
}

