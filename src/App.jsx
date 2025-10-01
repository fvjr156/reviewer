import React, { useEffect, useMemo, useState } from "react";
import "./index.css";

import discrete from "./quiz_data/discrete.json";
import ppc from "./quiz_data/ppc.json";
import dsa from "./quiz_data/dsa.json";
import poc from "./quiz_data/poc.json";
import selecta from "./quiz_data/selecta.json";

const QUIZ_FILES = {
  "selecta": selecta,
  "discrete": discrete,
  "ppc": ppc,
  "dsa": dsa,
  "poc": poc,
};

function QuizPage({
  examData,
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

function ResultsPage({ examData, questions, answers, onRestart }) {
  const score = questions.reduce((acc, q) => acc + (answers[q.id] === q.correctAnswer ? 1 : 0), 0);

  return (
    <div className="container">
      <header className="header">
        <h1>Results - {examData.examTitle}</h1>
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

const STORAGE_KEYS = {
  ANSWERS: 'quiz_answers',
  PAGE: 'quiz_current_page',
  SUBMITTED: 'quiz_submitted',
  THEME: 'quiz_theme',
  CURRENT_QUIZ: 'quiz_current_quiz'
};

const loadFromStorage = (key, defaultValue) => {
  try {
    const item = window.localStorage.getItem(key);
    return item ? JSON.parse(item) : defaultValue;
  } catch (error) {
    console.error(`Error loading ${key} from localStorage:`, error);
    return defaultValue;
  }
};

const saveToStorage = (key, value) => {
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    console.error(`Error saving ${key} to localStorage:`, error);
  }
};

const clearStorage = () => {
  try {
    Object.values(STORAGE_KEYS).forEach(key => {
      if (key !== STORAGE_KEYS.THEME && key !== STORAGE_KEYS.CURRENT_QUIZ) {
        window.localStorage.removeItem(key);
      }
    });
  } catch (error) {
    console.error('Error clearing localStorage:', error);
  }
};

export default function App() {
  const [currentQuiz, setCurrentQuiz] = useState(() => 
    loadFromStorage(STORAGE_KEYS.CURRENT_QUIZ, "selecta")
  );
  const [theme, setTheme] = useState(() => 
    loadFromStorage(STORAGE_KEYS.THEME, "theme-light-blue")
  );
  const [answers, setAnswers] = useState(() => 
    loadFromStorage(STORAGE_KEYS.ANSWERS, {})
  );
  const [page, setPage] = useState(() => 
    loadFromStorage(STORAGE_KEYS.PAGE, 0)
  );
  const [submitted, setSubmitted] = useState(() => 
    loadFromStorage(STORAGE_KEYS.SUBMITTED, false)
  );

  const examData = QUIZ_FILES[currentQuiz];
  const questions = useMemo(
    () => examData.sections.flatMap(s => s.questions),
    [currentQuiz, examData]
  );

  useEffect(() => {
    saveToStorage(STORAGE_KEYS.CURRENT_QUIZ, currentQuiz);
  }, [currentQuiz]);

  useEffect(() => {
    saveToStorage(STORAGE_KEYS.THEME, theme);
  }, [theme]);

  useEffect(() => {
    saveToStorage(STORAGE_KEYS.ANSWERS, answers);
  }, [answers]);

  useEffect(() => {
    saveToStorage(STORAGE_KEYS.PAGE, page);
  }, [page]);

  useEffect(() => {
    saveToStorage(STORAGE_KEYS.SUBMITTED, submitted);
  }, [submitted]);

  useEffect(() => {
    document.body.classList.remove(
      "theme-light-blue", "theme-light-green", "theme-light-purple",
      "theme-dark-cyan", "theme-dark-bw", "theme-dark-orange"
    );
    document.body.classList.add(theme);
  }, [theme]);

  const handleLoadQuiz = (quizKey) => {
    alert("Quiz data is loaded.");
    clearStorage();
    setCurrentQuiz(quizKey);
    setAnswers({});
    setPage(0);
    setSubmitted(false);
  };

  const handleSubmit = () => {
    setSubmitted(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleRestart = () => {
    clearStorage();
    setAnswers({});
    setPage(0);
    setSubmitted(false);
  };

  return (
    <>
      <div className="container">
        <header className="appheader">
          <h1>Quiz Application</h1>
          <div className="header-controls">
            <select
              value={currentQuiz}
              onChange={(e) => setCurrentQuiz(e.target.value)}
              className="btn"
            >
              {Object.keys(QUIZ_FILES).map(quizKey => (
                <option key={quizKey} value={quizKey}>
                  {QUIZ_FILES[quizKey].examTitle}
                </option>
              ))}
            </select>
            
            <button 
              className="btn primary"
              onClick={() => handleLoadQuiz(currentQuiz)}
            >
              Load Quiz
            </button>

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
          </div>
        </header>
      </div>

      {submitted ? (
        <ResultsPage 
          examData={examData}
          questions={questions} 
          answers={answers} 
          onRestart={handleRestart} 
        />
      ) : (
        <QuizPage
          examData={examData}
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