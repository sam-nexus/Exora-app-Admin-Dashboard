import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Clock, AlertCircle, CheckCircle, XCircle, ArrowLeft,
  Award, ChevronLeft, ChevronRight, Flag, BookOpen,
  GraduationCap, Grid3x3, X, Search, Timer, BarChart3,
  Target, Zap, Brain, TrendingUp,
  Trophy, RotateCcw, HelpCircle, ListChecks, Eye
} from 'lucide-react';
import api from '../api/axios';

// ─── helpers ─────────────────────────────────────────────────────────────────
const pad = (n) => String(n).padStart(2, '0');

const formatTime = (seconds, unlimited) => {
  if (unlimited) return '∞';
  if (seconds <= 0) return '00:00';
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  return h > 0 ? `${pad(h)}:${pad(m)}:${pad(s)}` : `${pad(m)}:${pad(s)}`;
};

const optionLabel = (idx) => String.fromCharCode(65 + idx);

const timerColor = (left, total) => {
  if (!total || left > total * 0.4) return 'text-white';
  if (left > total * 0.15) return 'text-yellow-300';
  return 'text-red-300 animate-pulse';
};

// ─── Option Button Component ─────────────────────────────────────────────────
const OptionButton = ({ opt, optText, state, onClick, disabled }) => {
  const base = 'w-full text-left p-4 rounded-xl border-2 transition-all duration-200 flex items-start gap-3 group';
  const styles = {
    idle:     'border-gray-200 hover:border-gray-400 hover:bg-gray-50 cursor-pointer',
    selected: 'border-gray-800 bg-gray-100 ring-1 ring-gray-300 cursor-pointer',
    correct:  'border-emerald-500 bg-emerald-50',
    wrong:    'border-red-400 bg-red-50',
  };

  return (
    <button onClick={onClick} disabled={disabled} className={`${base} ${styles[state]}`}>
      <span className={`shrink-0 w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold border
        ${state === 'correct'  ? 'bg-emerald-500 border-emerald-500 text-white'
        : state === 'wrong'    ? 'bg-red-400 border-red-400 text-white'
        : state === 'selected' ? 'bg-gray-800 border-gray-800 text-white'
        :                        'bg-white border-gray-300 text-gray-500 group-hover:border-gray-500 group-hover:text-gray-700'}`}>
        {opt}
      </span>
      <span className={`flex-1 text-sm leading-relaxed
        ${state === 'correct' ? 'text-emerald-800 font-medium'
        : state === 'wrong'   ? 'text-red-700'
        : 'text-gray-700'}`}>
        {optText}
      </span>
      {state === 'correct' && <CheckCircle size={18} className="text-emerald-500 shrink-0 mt-0.5" />}
      {state === 'wrong'   && <XCircle    size={18} className="text-red-400 shrink-0 mt-0.5" />}
    </button>
  );
};

// ─── Explanation Box Component ───────────────────────────────────────────────
const ExplanationBox = ({ isCorrect, correctLetter, correctText, userLetter, userText, explanation }) => (
  <div className={`p-5 rounded-xl mb-2 border-2 animate-in slide-in-from-bottom-2 duration-200
    ${isCorrect ? 'bg-emerald-50 border-emerald-200' : 'bg-red-50 border-red-200'}`}>
    <div className="flex items-center gap-3 mb-4 pb-3 border-b border-gray-200">
      <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0
        ${isCorrect ? 'bg-emerald-100' : 'bg-red-100'}`}>
        {isCorrect
          ? <CheckCircle size={20} className="text-emerald-600" />
          : <XCircle size={20} className="text-red-600" />}
      </div>
      <h3 className={`font-bold text-lg ${isCorrect ? 'text-emerald-700' : 'text-red-700'}`}>
        {isCorrect ? '✓ Correct!' : '✗ Incorrect'}
      </h3>
    </div>

    <div className="mb-4">
      <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-2">
        Explanation
      </p>
      <div className="bg-white/60 rounded-lg p-3">
        <p className="text-gray-700 text-sm leading-relaxed">
          {explanation || 'No explanation provided for this question.'}
        </p>
      </div>
    </div>

    <div className="bg-white/60 rounded-lg p-3">
      <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-2">
        Correct Answer
      </p>
      <div className="flex items-center gap-3">
        <div className="bg-emerald-100 rounded-lg px-3 py-2 min-w-fit">
          <span className="font-bold text-emerald-700 text-lg">{correctLetter}</span>
        </div>
        <p className="text-sm text-gray-700">{correctText}</p>
      </div>
    </div>

    {!isCorrect && (
      <div className="mt-3 bg-white/60 rounded-lg p-3">
        <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-2">
          Your Answer
        </p>
        <div className="flex items-center gap-3">
          <div className="bg-red-100 rounded-lg px-3 py-2 min-w-fit">
            <span className="font-bold text-red-700 text-lg">{userLetter}</span>
          </div>
          <p className="text-sm text-gray-700">{userText}</p>
        </div>
      </div>
    )}
  </div>
);

// ─── Unanswered Warning Modal ─────────────────────────────────────────────────
const UnansweredWarningModal = ({ unansweredCount, totalQs, unansweredNumbers, onContinue, onReview, onCancel }) => (
  <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
    <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl overflow-hidden">
      <div className="bg-amber-500 px-6 py-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
            <AlertCircle size={20} className="text-white" />
          </div>
          <h3 className="text-lg font-bold text-white">Unanswered Questions</h3>
        </div>
      </div>
      <div className="p-6">
        <p className="text-gray-700 mb-3">
          You have <strong className="text-amber-600">{unansweredCount}</strong> unanswered question{unansweredCount > 1 ? 's' : ''} out of <strong>{totalQs}</strong> total.
        </p>
        <div className="bg-amber-50 rounded-xl p-4 mb-4">
          <p className="text-sm font-medium text-amber-800 mb-2">Unanswered Questions:</p>
          <div className="flex flex-wrap gap-2">
            {unansweredNumbers.slice(0, 10).map(num => (
              <button
                key={num}
                onClick={() => onReview(num - 1)}
                className="px-3 py-1.5 bg-amber-200 text-amber-800 rounded-lg text-sm font-medium hover:bg-amber-300 transition"
              >
                Q{num}
              </button>
            ))}
            {unansweredNumbers.length > 10 && (
              <span className="px-3 py-1.5 bg-amber-200 text-amber-800 rounded-lg text-sm">
                +{unansweredNumbers.length - 10} more
              </span>
            )}
          </div>
        </div>
        <p className="text-sm text-gray-500 mb-4">
          Submitting without answering all questions will result in a lower score.
        </p>
        <div className="flex gap-3">
          <button onClick={onCancel} className="flex-1 py-2.5 border border-gray-300 rounded-xl text-sm font-medium hover:bg-gray-50 transition">
            Cancel
          </button>
          <button onClick={onReview} className="flex-1 py-2.5 bg-gray-800 text-white rounded-xl text-sm font-medium hover:bg-gray-900 transition">
            Review
          </button>
          <button onClick={onContinue} className="flex-1 py-2.5 bg-amber-500 text-white rounded-xl text-sm font-medium hover:bg-amber-600 transition">
            Submit Anyway
          </button>
        </div>
      </div>
    </div>
  </div>
);

// ─── Question Navigator Modal ────────────────────────────────────────────────
const QuestionMap = ({ questions, answers, marked, current, onGo, onClose }) => {
  const [search, setSearch] = useState('');
  const filtered = questions.filter((_, i) => search === '' || String(i + 1).includes(search));
  const unansweredCount = questions.filter((q, i) => !answers[q.id]).length;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="bg-white w-full sm:rounded-2xl sm:max-w-lg max-h-[85vh] flex flex-col shadow-2xl">
        <div className="flex items-center justify-between px-5 py-4 border-b">
          <h3 className="font-bold text-gray-800 flex items-center gap-2">
            <Grid3x3 size={18} className="text-gray-600" /> Question Navigator
          </h3>
          <button onClick={onClose} className="p-1.5 hover:bg-gray-100 rounded-lg transition"><X size={18} /></button>
        </div>

        <div className="px-5 py-3 bg-gray-50 border-b flex justify-between text-sm">
          <span className="text-gray-600">Answered: <strong>{Object.keys(answers).length}</strong> / {questions.length}</span>
          <span className="text-amber-600">Flagged: <strong>{Object.values(marked).filter(Boolean).length}</strong></span>
          <span className="text-red-500">Unanswered: <strong>{unansweredCount}</strong></span>
        </div>

        <div className="px-5 py-3 border-b">
          <div className="relative">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              value={search} onChange={(e) => setSearch(e.target.value)}
              placeholder="Jump to question..."
              className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-gray-400 outline-none"
            />
          </div>
        </div>

        <div className="overflow-y-auto p-5 grid grid-cols-8 gap-1.5">
          {filtered.map((q, localIdx) => {
            const globalIdx = questions.findIndex(qq => qq.id === q.id);
            const answered = !!answers[q.id];
            const flagged = !!marked[q.id];
            const isCurrent = globalIdx === current;
            return (
              <button
                key={q.id}
                onClick={() => onGo(globalIdx)}
                className={`h-9 rounded-xl text-xs font-bold transition-all
                  ${isCurrent  ? 'bg-gray-800 text-white ring-2 ring-gray-300 ring-offset-1'
                  : answered   ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200'
                  : flagged    ? 'bg-amber-100 text-amber-700 hover:bg-amber-200'
                  :              'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
              >
                {globalIdx + 1}
              </button>
            );
          })}
        </div>
        <div className="px-5 py-3 border-t bg-gray-50 flex flex-wrap gap-4 text-xs text-gray-500">
          {[['bg-gray-800','Current'],['bg-emerald-400','Answered'],['bg-amber-400','Flagged'],['bg-gray-300','Unanswered']].map(([c,l]) => (
            <span key={l} className="flex items-center gap-1.5"><span className={`w-3 h-3 rounded-full ${c}`}/>{l}</span>
          ))}
        </div>
      </div>
    </div>
  );
};

// ─── Main Component ───────────────────────────────────────────────────────────
const StudentMockExam = () => {
  const { deptId, courseId } = useParams();
  const navigate = useNavigate();

  const [loading, setLoading]       = useState(true);
  const [course, setCourse]         = useState(null);
  const [questions, setQuestions]   = useState([]);

  const [screen, setScreen]         = useState('select');
  const [mode, setMode]             = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const [answers, setAnswers]       = useState({});
  const [revealed, setRevealed]     = useState({});
  const [marked, setMarked]         = useState({});

  const [currentIdx, setCurrentIdx] = useState(0);
  const [showMap, setShowMap]       = useState(false);
  const [showUnansweredWarning, setShowUnansweredWarning] = useState(false);

  const [enableTimer, setEnableTimer] = useState(true);
  const [selectedMins, setSelectedMins] = useState(60);
  const [timeLeft, setTimeLeft]       = useState(0);
  const [totalTime, setTotalTime]     = useState(0);

  const [result, setResult]         = useState(null);
  const [confirmSubmit, setConfirmSubmit] = useState(false);

  // Fetch course data
  useEffect(() => {
    (async () => {
      try {
        const { data } = await api.get(`/student/courses/${courseId}`);
        setCourse(data);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    })();
  }, [courseId]);

  // Timer countdown
  useEffect(() => {
    if (screen !== 'test' || !enableTimer || timeLeft <= 0) return;
    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          handleAutoSubmit();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [screen, enableTimer, timeLeft]);

  const handleAutoSubmit = async () => {
    if (screen === 'test' && !submitting) {
      await submitExam(true);
    }
  };

  const currentQ = questions[currentIdx];
  const totalQ = questions.length;
  const answeredCount = Object.keys(answers).length;
  const flaggedCount = Object.values(marked).filter(Boolean).length;
  const unansweredCount = totalQ - answeredCount;

  const unansweredNumbers = questions
    .map((q, idx) => ({ num: idx + 1, answered: !!answers[q.id] }))
    .filter(q => !q.answered)
    .map(q => q.num);

  const startMode = async (m) => {
    setLoading(true);
    try {
      const { data } = await api.post(`/student/courses/${courseId}/mock-exam/start`, {});

      let questionsList = data.questions || [];
      const missingFields = questionsList.length > 0 &&
        (!('correct_index' in questionsList[0]) || !('explanation' in questionsList[0]));

      if (missingFields) {
        console.warn('⚠️ Missing fields — fetching questions directly');
        const qRes = await api.get('/questions', { params: { course_id: courseId } });
        questionsList = (qRes.data || []).map((q) => ({
          id: q.id,
          question_text: q.question_text,
          options: q.options,
          correct_index: q.correct_index,
          explanation: q.explanation || '',
        }));
      }

      setQuestions(questionsList);
      setMode(m);
      setAnswers({});
      setRevealed({});
      setMarked({});
      setCurrentIdx(0);

      if (m === 'test') {
        const secs = enableTimer ? selectedMins * 60 : 0;
        setTimeLeft(secs);
        setTotalTime(secs);
        setScreen('test');
      } else {
        setScreen('practice');
      }
    } catch (e) {
      console.error(e);
      alert('Failed to start exam. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const selectPractice = (q, opt) => {
    if (revealed[q.id]) return;
    setAnswers((prev) => ({ ...prev, [q.id]: opt }));

    const correctIdx = q.correct_index ?? 0;
    const correctLetter = optionLabel(correctIdx);
    const correctText = (q.options || [])[correctIdx] || '';
    const userText = (q.options || [])[opt.charCodeAt(0) - 65] || '';

    setRevealed((prev) => ({
      ...prev,
      [q.id]: {
        correct: correctLetter,
        correctText,
        isCorrect: opt === correctLetter,
        userLetter: opt,
        userText,
        explanation: q.explanation || 'No explanation available.',
      },
    }));
  };

  const selectTest = (qId, opt) => {
    setAnswers((prev) => ({ ...prev, [qId]: opt }));
  };

  const goTo = useCallback((idx) => {
    setCurrentIdx(idx);
    setShowMap(false);
    setShowUnansweredWarning(false);
  }, []);

  const goNext = () => {
    if (currentIdx < totalQ - 1) {
      setCurrentIdx((prev) => prev + 1);
    } else {
      if (mode === 'test' && unansweredCount > 0) {
        setShowUnansweredWarning(true);
      } else {
        setConfirmSubmit(true);
      }
    }
  };

  const goPrev = () => {
    if (currentIdx > 0) setCurrentIdx((prev) => prev - 1);
  };

  const handleSubmitClick = () => {
    if (mode === 'test' && unansweredCount > 0) {
      setShowUnansweredWarning(true);
    } else {
      setConfirmSubmit(true);
    }
  };

  const handleReviewUnanswered = () => {
    if (unansweredNumbers.length > 0) {
      goTo(unansweredNumbers[0] - 1);
    }
  };

  const submitExam = async (isAutoSubmit = false) => {
    if (submitting) return;
    setSubmitting(true);

    const timeSpent = enableTimer && totalTime > 0 ? totalTime - timeLeft : null;
    try {
      const { data } = await api.post('/student/mock-exam/submit', {
        courseId,
        answers,
        mode,
        timeTaken: timeSpent,
      });
      setResult(data);
      setScreen('result');
      setConfirmSubmit(false);
      setShowUnansweredWarning(false);
    } catch (e) {
      console.error(e);
      // Client-side scoring fallback
      let totalCorrect = 0;
      const results = questions.map((q) => {
        const userLetter = answers[q.id] ?? '';
        const isCorrect = userLetter === optionLabel(q.correct_index ?? 0);
        if (isCorrect) totalCorrect++;
        return {
          id: q.id,
          text: q.question_text,
          userAnswer: userLetter || '(Not answered)',
          correctAnswer: optionLabel(q.correct_index ?? 0),
          isCorrect: userLetter ? isCorrect : false,
          explanation: q.explanation,
        };
      });
      const score = totalQ > 0 ? Math.round((totalCorrect / totalQ) * 100) : 0;
      setResult({ score, correctAnswers: totalCorrect, totalQuestions: totalQ, results });
      setScreen('result');
      setConfirmSubmit(false);
      setShowUnansweredWarning(false);
    } finally {
      setSubmitting(false);
    }
  };

  const toggleMark = (id) => setMarked((prev) => ({ ...prev, [id]: !prev[id] }));

  const practiceOptionState = (q, opt) => {
    const rev = revealed[q.id];
    const selected = answers[q.id];
    if (!rev) return selected === opt ? 'selected' : 'idle';
    if (opt === rev.correct) return 'correct';
    if (opt === selected && !rev.isCorrect) return 'wrong';
    return 'idle';
  };

  const testOptionState = (q, opt) =>
    answers[q.id] === opt ? 'selected' : 'idle';

  // Loading Screen
  if (loading && screen === 'select') {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center space-y-3">
          <div className="w-10 h-10 border-2 border-gray-800 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-sm text-gray-500">Loading exam...</p>
        </div>
      </div>
    );
  }

  // Mode Selection Screen
  if (screen === 'select') {
    return (
      <div className="min-h-screen bg-gray-50 py-10 px-4">
        <div className="max-w-5xl mx-auto">
          <button
            onClick={() => navigate(`/student/departments/${deptId}/courses`)}
            className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800 mb-8 transition group"
          >
            <ArrowLeft size={15} className="group-hover:-translate-x-0.5 transition" />
            Back to Courses
          </button>

          <div className="text-center mb-10">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-white rounded-2xl shadow-lg mb-4 border border-gray-100">
              <img src="/logoIcon.png" alt="Exora" className="w-12 h-12 object-contain" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900">{course?.name}</h1>
            <p className="text-gray-500 mt-1 text-sm">Select your study mode to begin</p>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {/* Practice Card */}
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm hover:shadow-lg transition-all duration-200 hover:-translate-y-0.5 overflow-hidden">
              <div className="h-1.5 bg-emerald-500" />
              <div className="p-7">
                <div className="w-12 h-12 bg-emerald-100 rounded-2xl flex items-center justify-center mb-5">
                  <Brain size={24} className="text-emerald-600" />
                </div>
                <h2 className="text-xl font-bold text-gray-900 mb-1">Practice Mode</h2>
                <p className="text-gray-500 text-sm mb-6">Learn with instant feedback after every choice</p>
                <ul className="space-y-2.5 mb-8">
                  {[
                    'Answer reveals immediately',
                    'Color-coded correct/wrong feedback',
                    'Detailed explanation after each answer',
                    'No time pressure',
                  ].map((t) => (
                    <li key={t} className="flex items-start gap-2.5 text-sm text-gray-600">
                      <CheckCircle size={15} className="text-emerald-500 mt-0.5 shrink-0" />
                      {t}
                    </li>
                  ))}
                </ul>
                <button
                  onClick={() => startMode('practice')}
                  className="w-full py-3 bg-emerald-600 text-white rounded-xl font-semibold hover:bg-emerald-700 active:scale-95 transition-all flex items-center justify-center gap-2"
                >
                  <BookOpen size={17} /> Start Practice
                </button>
              </div>
            </div>

            {/* Test Card */}
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm hover:shadow-lg transition-all duration-200 hover:-translate-y-0.5 overflow-hidden">
              <div className="h-1.5 bg-gray-800" />
              <div className="p-7">
                <div className="w-12 h-12 bg-gray-100 rounded-2xl flex items-center justify-center mb-5">
                  <Target size={24} className="text-gray-700" />
                </div>
                <h2 className="text-xl font-bold text-gray-900 mb-1">Test Mode</h2>
                <p className="text-gray-500 text-sm mb-5">Simulate real exam conditions</p>

                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl mb-4">
                  <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
                    <Timer size={15} className="text-gray-500" /> Enable Timer
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" className="sr-only peer" checked={enableTimer}
                      onChange={(e) => setEnableTimer(e.target.checked)} />
                    <div className="w-10 h-5 bg-gray-200 rounded-full peer peer-checked:bg-gray-800
                      peer-checked:after:translate-x-5 after:absolute after:top-0.5 after:left-0.5
                      after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all after:content-['']" />
                  </label>
                </div>

                {enableTimer && (
                  <div className="mb-5">
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Duration</p>
                    <div className="grid grid-cols-4 gap-2">
                      {[15, 30, 60, 90].map((m) => (
                        <button
                          key={m}
                          onClick={() => setSelectedMins(m)}
                          className={`py-2 rounded-xl text-sm font-bold transition-all
                            ${selectedMins === m
                              ? 'bg-gray-800 text-white shadow-md'
                              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                        >
                          {m}m
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 mb-6 text-xs text-amber-700 space-y-1">
                  <p className="font-semibold mb-1">Exam rules</p>
                  <p>• {enableTimer ? `${selectedMins} minute time limit` : 'No time limit'}</p>
                  <p>• Results revealed only after submission</p>
                  <p>• Passing score: 60%</p>
                </div>

                <button
                  onClick={() => startMode('test')}
                  className="w-full py-3 bg-gray-800 text-white rounded-xl font-semibold hover:bg-gray-900 active:scale-95 transition-all flex items-center justify-center gap-2"
                >
                  <Zap size={17} /> Start Test {enableTimer && `· ${selectedMins}min`}
                </button>
              </div>
            </div>
          </div>

          {/* Motivational quote — shown before exam starts */}
          <div className="mt-6 border-t border-gray-100 pt-6">
            <blockquote className="text-center space-y-2">
              <p className="text-base font-semibold text-gray-700 italic leading-relaxed">
                "It always seems impossible until it's done."
              </p>
              <p className="text-xs text-gray-400">— Nelson Mandela &nbsp;·&nbsp; Believe in your preparation.</p>
            </blockquote>

            <div className="flex justify-center gap-6 mt-5 text-xs text-gray-400">
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400 inline-block" />
                Read carefully
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-indigo-400 inline-block" />
                Manage your time
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-amber-400 inline-block" />
                Flag & review
              </div>
            </div>
          </div>

        </div>
      </div>
    );
  }

  // Results Screen
  if (screen === 'result' && result) {
    const passed = result.score >= 60;
    const correct = result.correctAnswers ?? result.correctCount ?? 0;
    const incorrect = (result.totalQuestions ?? result.totalCount ?? 0) - correct;

    return (
      <div className="min-h-screen bg-gray-50 py-10 px-4">
        <div className="max-w-2xl mx-auto space-y-5">
          <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
            <div className={`p-8 text-center ${passed ? 'bg-emerald-600' : 'bg-red-500'}`}>
              <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4">
                {passed ? <Trophy size={36} className="text-white" /> : <TrendingUp size={36} className="text-white" />}
              </div>
              <h2 className="text-3xl font-bold text-white mb-1">{passed ? 'Great Work!' : 'Keep Practicing!'}</h2>
              <p className="text-white/80 text-sm mb-5">{course?.name} · {mode === 'practice' ? 'Practice Mode' : 'Test Mode'}</p>
              <div className="inline-block bg-white/15 rounded-2xl px-8 py-4">
                <p className="text-6xl font-bold text-white leading-none">{result.score}<span className="text-2xl opacity-70">%</span></p>
                <p className="text-white/70 text-xs mt-1">{passed ? '✓ Passed (60% required)' : '✗ Below passing score (60%)'}</p>
              </div>
              <div className="w-48 mx-auto h-2 bg-white/25 rounded-full mt-5 overflow-hidden">
                <div className="h-full bg-white rounded-full" style={{ width: `${result.score}%` }} />
              </div>
            </div>

            <div className="grid grid-cols-3 divide-x divide-gray-100">
              {[
                { icon: CheckCircle, color: 'text-emerald-500', bg: 'bg-emerald-50', val: correct, label: 'Correct' },
                { icon: XCircle, color: 'text-red-400', bg: 'bg-red-50', val: incorrect, label: 'Wrong' },
                { icon: Award, color: 'text-gray-700', bg: 'bg-gray-100', val: `${result.score}%`, label: 'Score' },
              ].map(({ icon: Icon, color, bg, val, label }) => (
                <div key={label} className="py-6 flex flex-col items-center gap-1">
                  <div className={`w-10 h-10 ${bg} rounded-xl flex items-center justify-center mb-1`}>
                    <Icon size={20} className={color} />
                  </div>
                  <p className={`text-2xl font-bold ${color}`}>{val}</p>
                  <p className="text-xs text-gray-400">{label}</p>
                </div>
              ))}
            </div>

            <div className="p-6 flex gap-3">
              <button onClick={() => window.location.reload()} className="flex-1 flex items-center justify-center gap-2 py-3 border-2 border-gray-200 text-gray-700 rounded-xl font-semibold hover:bg-gray-50 transition">
                <RotateCcw size={16} /> Try Again
              </button>
              <button onClick={() => navigate(`/student/departments/${deptId}/courses`)} className="flex-1 flex items-center justify-center gap-2 py-3 bg-gray-800 text-white rounded-xl font-semibold hover:bg-gray-900 transition">
                <ArrowLeft size={16} /> Back to Courses
              </button>
            </div>
          </div>

          {Array.isArray(result.results) && result.results.length > 0 && (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="px-6 py-4 border-b flex items-center gap-2">
                <ListChecks size={18} className="text-gray-600" />
                <h3 className="font-bold text-gray-800">Detailed Results</h3>
              </div>
              <div className="divide-y divide-gray-100 max-h-96 overflow-y-auto">
                {result.results.map((q, i) => (
                  <div key={i} className={`px-6 py-4 ${q.isCorrect ? 'bg-emerald-50/30' : 'bg-red-50/30'}`}>
                    <div className="flex items-start gap-2 mb-2">
                      {q.isCorrect ? <CheckCircle size={15} className="text-emerald-500 mt-0.5 shrink-0" /> : <XCircle size={15} className="text-red-400 mt-0.5 shrink-0" />}
                      <p className="text-sm font-medium text-gray-800 leading-snug">{q.text}</p>
                    </div>
                    {!q.isCorrect && (
                      <div className="ml-5 text-xs space-y-0.5">
                        <p className="text-red-500">Your answer: <span className="font-bold">{q.userAnswer}</span></p>
                        <p className="text-emerald-600">Correct: <span className="font-bold">{q.correctAnswer}</span></p>
                        {q.explanation && <p className="text-gray-500 mt-1">{q.explanation}</p>}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Practice Mode Screen
  if (screen === 'practice' && currentQ) {
    const rev = revealed[currentQ.id];

    return (
      <div className="min-h-screen bg-gray-50">
        {showMap && (
          <QuestionMap
            questions={questions} answers={answers} marked={marked}
            current={currentIdx} onGo={goTo} onClose={() => setShowMap(false)}
          />
        )}

        <div className="max-w-3xl mx-auto px-4 py-8 space-y-4">
          {/* Top Bar */}
          <div className="sticky top-3 z-10 bg-white/95 backdrop-blur-sm rounded-2xl border border-gray-200 shadow-sm px-5 py-3 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <button onClick={() => navigate(`/student/departments/${deptId}/courses`)} className="flex items-center gap-1.5 text-xs font-semibold text-gray-500 hover:text-gray-800 transition group shrink-0">
                <ArrowLeft size={14} className="group-hover:-translate-x-0.5 transition" />
                <span className="hidden sm:inline">Back</span>
              </button>
              <div className="w-px h-5 bg-gray-200" />
              <div>
                <p className="text-xs text-gray-500 font-medium">Practice Mode</p>
                <p className="text-sm font-bold text-gray-800 leading-tight">{course?.name}</p>
              </div>
            </div>

            <div className="flex-1 max-w-xs hidden sm:block">
              <div className="flex justify-between text-xs text-gray-500 mb-1">
                <span>Q {currentIdx + 1} of {totalQ}</span>
                <span>{answeredCount} answered</span>
              </div>
              <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                <div className="h-full bg-gray-800 rounded-full transition-all" style={{ width: `${((currentIdx + 1) / totalQ) * 100}%` }} />
              </div>
            </div>

            <button onClick={() => setShowMap(true)} className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 rounded-xl text-xs font-semibold text-gray-600 hover:bg-gray-200 transition shrink-0">
              <Grid3x3 size={14} /> Navigator
            </button>
          </div>

          {/* Motivational tip bar */}
          <div className="flex items-center justify-between gap-3 px-4 py-2 bg-indigo-50 border border-indigo-100 rounded-xl text-xs text-indigo-700">
            <span>💡 Stay focused — read each question carefully before answering.</span>
            <div className="flex items-center gap-3 shrink-0">
              <a href={import.meta.env.VITE_TELEGRAM_LINK} target="_blank" rel="noreferrer"
                className="font-semibold text-indigo-600 hover:text-indigo-800 hover:underline whitespace-nowrap">
                📣 Join Channel
              </a>
              <span className="text-indigo-300">|</span>
              <a href={import.meta.env.VITE_APP_STORE_LINK} target="_blank" rel="noreferrer"
                className="font-semibold text-indigo-600 hover:text-indigo-800 hover:underline whitespace-nowrap">
                📱 Get App
              </a>
            </div>
          </div>

          {/* Question Card */}
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b bg-gray-50/60 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 bg-gray-100 rounded-xl flex items-center justify-center">
                  <span className="text-gray-700 font-bold text-sm">{currentIdx + 1}</span>
                </div>
                <span className="text-xs text-gray-400">of {totalQ}</span>
              </div>
              <button
                onClick={() => toggleMark(currentQ.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition
                  ${marked[currentQ.id] ? 'bg-amber-100 text-amber-700' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}
              >
                <Flag size={13} />
                {marked[currentQ.id] ? 'Flagged' : 'Flag'}
              </button>
            </div>

            <div className="px-6 pt-6 pb-2">
              <p className="text-base font-medium text-gray-800 leading-relaxed mb-6">
                {currentQ.question_text || currentQ.text}
              </p>

              <div className="space-y-2.5">
                {(currentQ.options || []).map((optText, i) => {
                  const opt = optionLabel(i);
                  const state = practiceOptionState(currentQ, opt);
                  return (
                    <OptionButton
                      key={opt} opt={opt} optText={optText}
                      state={state}
                      onClick={() => selectPractice(currentQ, opt)}
                      disabled={!!rev}
                    />
                  );
                })}
              </div>

              {rev && (
                <div className="mt-5">
                  <ExplanationBox
                    isCorrect={rev.isCorrect}
                    correctLetter={rev.correct}
                    correctText={rev.correctText}
                    userLetter={rev.userLetter}
                    userText={rev.userText}
                    explanation={rev.explanation}
                  />
                </div>
              )}
            </div>

            <div className="px-6 py-4 mt-4 border-t bg-gray-50/50 flex items-center justify-between">
              <button
                onClick={goPrev}
                disabled={currentIdx === 0}
                className="flex items-center gap-1.5 px-4 py-2.5 border border-gray-200 rounded-xl text-sm font-medium text-gray-600 hover:bg-white transition disabled:opacity-40"
              >
                <ChevronLeft size={16} /> Prev
              </button>

              <div className="flex items-center gap-1 overflow-hidden max-w-[180px]">
                {questions.slice(Math.max(0, currentIdx - 3), currentIdx + 4).map((q, localI) => {
                  const realIdx = Math.max(0, currentIdx - 3) + localI;
                  const isRev = !!revealed[q.id];
                  const isCur = realIdx === currentIdx;
                  return (
                    <button
                      key={q.id}
                      onClick={() => goTo(realIdx)}
                      className={`rounded-full transition-all ${isCur ? 'w-5 h-2.5 bg-gray-800' : isRev ? 'w-2 h-2 bg-emerald-400' : 'w-2 h-2 bg-gray-200 hover:bg-gray-300'}`}
                    />
                  );
                })}
              </div>

              {currentIdx < totalQ - 1 ? (
                <button onClick={goNext} className="flex items-center gap-1.5 px-4 py-2.5 bg-gray-800 text-white rounded-xl text-sm font-semibold hover:bg-gray-900 transition">
                  Next <ChevronRight size={16} />
                </button>
              ) : (
                <button
                  onClick={() => {
                    const totalCorrect = Object.values(revealed).filter(r => r?.isCorrect).length;
                    const score = totalQ ? Math.round((totalCorrect / totalQ) * 100) : 0;
                    setResult({ score, correctAnswers: totalCorrect, totalQuestions: totalQ, results: [] });
                    setScreen('result');
                  }}
                  className="flex items-center gap-1.5 px-4 py-2.5 bg-emerald-600 text-white rounded-xl text-sm font-semibold hover:bg-emerald-700 transition"
                >
                  Finish <Trophy size={15} />
                </button>
              )}
            </div>
          </div>

          {/* Stats Row */}
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: 'Answered', val: answeredCount, color: 'text-gray-800', bg: 'bg-gray-100' },
              { label: 'Flagged', val: flaggedCount, color: 'text-amber-600', bg: 'bg-amber-50' },
              { label: 'Left', val: totalQ - answeredCount, color: 'text-gray-500', bg: 'bg-gray-50' },
            ].map(({ label, val, color, bg }) => (
              <div key={label} className={`${bg} rounded-xl py-3 text-center`}>
                <p className={`text-xl font-bold ${color}`}>{val}</p>
                <p className="text-[11px] text-gray-400">{label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Test Mode Screen
  if (screen === 'test' && currentQ) {
    const urgency = enableTimer ? timerColor(timeLeft, totalTime) : 'text-white';

    return (
      <div className="min-h-screen bg-gray-50">
        {showMap && (
          <QuestionMap
            questions={questions} answers={answers} marked={marked}
            current={currentIdx} onGo={goTo} onClose={() => setShowMap(false)}
          />
        )}

        {showUnansweredWarning && (
          <UnansweredWarningModal
            unansweredCount={unansweredCount}
            totalQs={totalQ}
            unansweredNumbers={unansweredNumbers}
            onContinue={() => {
              setShowUnansweredWarning(false);
              setConfirmSubmit(true);
            }}
            onReview={handleReviewUnanswered}
            onCancel={() => setShowUnansweredWarning(false)}
          />
        )}

        {confirmSubmit && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl text-center">
              <div className="w-14 h-14 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <AlertCircle size={26} className="text-amber-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Submit Exam?</h3>
              <p className="text-sm text-gray-500 mb-1">
                Answered: <span className="font-bold text-gray-800">{answeredCount}</span> / {totalQ}
              </p>
              {unansweredCount > 0 && (
                <p className="text-xs text-red-500 bg-red-50 rounded-lg py-2 px-3 mb-4">
                  ⚠️ {unansweredCount} question{unansweredCount > 1 ? 's' : ''} unanswered will be marked incorrect
                </p>
              )}
              <div className="flex gap-3 mt-4">
                <button onClick={() => setConfirmSubmit(false)} className="flex-1 py-2.5 border border-gray-200 rounded-xl text-sm font-semibold hover:bg-gray-50 transition">Cancel</button>
                <button onClick={() => submitExam(false)} disabled={submitting} className="flex-1 py-2.5 bg-gray-800 text-white rounded-xl text-sm font-semibold hover:bg-gray-900 transition disabled:opacity-50 flex items-center justify-center gap-2">
                  {submitting && <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />}
                  {submitting ? 'Submitting...' : 'Submit'}
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="max-w-6xl mx-auto px-4 py-8">
          <div className="grid lg:grid-cols-[1fr_280px] gap-6">
            <div className="space-y-4">
              {/* Timer Bar */}
              <div className="bg-gray-800 rounded-2xl px-6 py-4 shadow-lg">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <button onClick={() => navigate(`/student/departments/${deptId}/courses`)} className="flex items-center gap-1.5 text-xs font-semibold text-gray-300 hover:text-white transition group shrink-0">
                      <ArrowLeft size={14} className="group-hover:-translate-x-0.5 transition" />
                      <span className="hidden sm:inline">Back</span>
                    </button>
                    <div className="w-px h-5 bg-white/20" />
                    <div className="w-9 h-9 bg-white/15 rounded-xl flex items-center justify-center">
                      <Clock size={18} className="text-white" />
                    </div>
                    <div>
                      <p className="text-gray-300 text-[11px] font-semibold uppercase">Time Left</p>
                      <p className={`text-2xl font-bold font-mono leading-none tracking-wide ${urgency}`}>
                        {formatTime(timeLeft, !enableTimer)}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-gray-300 text-[11px] font-semibold uppercase">Question</p>
                    <p className="text-2xl font-bold text-white">{currentIdx + 1} <span className="text-gray-400 text-base">/ {totalQ}</span></p>
                  </div>
                </div>
              </div>

              {/* Question Card */}
              <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b bg-gray-50/60 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 bg-gray-100 rounded-xl flex items-center justify-center">
                      <span className="text-gray-700 font-bold text-sm">{currentIdx + 1}</span>
                    </div>
                    <span className="text-xs text-gray-400">of {totalQ}</span>
                  </div>
                  <button
                    onClick={() => toggleMark(currentQ.id)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition
                      ${marked[currentQ.id] ? 'bg-amber-100 text-amber-700' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}
                  >
                    <Flag size={13} />
                    {marked[currentQ.id] ? 'Flagged' : 'Flag'}
                  </button>
                </div>

                <div className="px-6 pt-6 pb-2">
                  <p className="text-base font-medium text-gray-800 leading-relaxed mb-6">
                    {currentQ.question_text || currentQ.text}
                  </p>

                  <div className="space-y-2.5">
                    {(currentQ.options || []).map((optText, i) => {
                      const opt = optionLabel(i);
                      return (
                        <OptionButton
                          key={opt} opt={opt} optText={optText}
                          state={testOptionState(currentQ, opt)}
                          onClick={() => selectTest(currentQ.id, opt)}
                          disabled={false}
                        />
                      );
                    })}
                  </div>

                  {!answers[currentQ.id] && (
                    <div className="mt-4 p-3 bg-amber-50 rounded-lg border border-amber-200">
                      <p className="text-xs text-amber-700 flex items-center gap-1">
                        <HelpCircle size={12} /> Click on an option to select your answer
                      </p>
                    </div>
                  )}
                </div>

                <div className="px-6 py-4 mt-4 border-t bg-gray-50/50 flex items-center justify-between">
                  <button onClick={goPrev} disabled={currentIdx === 0}
                    className="flex items-center gap-1.5 px-4 py-2.5 border border-gray-200 rounded-xl text-sm font-medium text-gray-600 hover:bg-white transition disabled:opacity-40">
                    <ChevronLeft size={16} /> Prev
                  </button>

                  <button onClick={() => setShowMap(true)} className="flex items-center gap-1.5 px-3 py-2 bg-gray-100 rounded-xl text-xs font-semibold text-gray-600 hover:bg-gray-200 transition">
                    <Grid3x3 size={14} /> Navigator
                  </button>

                  {currentIdx < totalQ - 1 ? (
                    <button onClick={goNext} className="flex items-center gap-1.5 px-4 py-2.5 bg-gray-800 text-white rounded-xl text-sm font-semibold hover:bg-gray-900 transition">
                      Next <ChevronRight size={16} />
                    </button>
                  ) : (
                    <button onClick={handleSubmitClick} className="flex items-center gap-1.5 px-4 py-2.5 bg-gray-800 text-white rounded-xl text-sm font-semibold hover:bg-gray-900 transition">
                      Submit <Trophy size={15} />
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Sidebar */}
            <div className="space-y-4">
              <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
                <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-4 flex items-center gap-2">
                  <BarChart3 size={14} className="text-gray-500" /> Progress
                </p>
                <div className="space-y-3">
                  {[
                    { label: 'Answered', val: answeredCount, color: 'bg-gray-800' },
                    { label: 'Unanswered', val: unansweredCount, color: 'bg-gray-200' },
                    { label: 'Flagged', val: flaggedCount, color: 'bg-amber-400' },
                  ].map(({ label, val, color }) => (
                    <div key={label}>
                      <div className="flex justify-between text-xs text-gray-500 mb-1">
                        <span>{label}</span>
                        <span className="font-bold text-gray-700">{val}</span>
                      </div>
                      <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                        <div className={`h-full ${color} rounded-full transition-all`} style={{ width: `${totalQ ? (val / totalQ) * 100 : 0}%` }} />
                      </div>
                    </div>
                  ))}
                </div>

                {unansweredCount > 0 && (
                  <div className="mt-4 pt-3 border-t border-amber-100 bg-amber-50 rounded-lg p-3">
                    <p className="text-xs text-amber-700 font-medium flex items-center gap-1">
                      <AlertCircle size={12} /> {unansweredCount} question{unansweredCount > 1 ? 's' : ''} unanswered
                    </p>
                    <div className="flex flex-wrap gap-1 mt-2">
                      {unansweredNumbers.slice(0, 5).map(num => (
                        <span key={num} className="text-xs bg-amber-200 text-amber-800 px-1.5 py-0.5 rounded">Q{num}</span>
                      ))}
                      {unansweredNumbers.length > 5 && (
                        <span className="text-xs text-amber-600">+{unansweredNumbers.length - 5} more</span>
                      )}
                    </div>
                  </div>
                )}
              </div>

              <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
                <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-3">Quick Nav</p>
                <div className="grid grid-cols-5 gap-1.5">
                  {questions.slice(0, 25).map((q, i) => {
                    const answered = !!answers[q.id];
                    const flagged = !!marked[q.id];
                    const isCur = i === currentIdx;
                    return (
                      <button
                        key={q.id} onClick={() => goTo(i)}
                        className={`h-8 rounded-lg text-[11px] font-bold transition-all
                          ${isCur    ? 'bg-gray-800 text-white ring-2 ring-gray-300'
                          : answered ? 'bg-emerald-100 text-emerald-700'
                          : flagged  ? 'bg-amber-100 text-amber-700'
                          :            'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}
                      >
                        {i + 1}
                      </button>
                    );
                  })}
                </div>
                {totalQ > 25 && (
                  <button onClick={() => setShowMap(true)} className="w-full mt-3 text-xs text-gray-600 font-semibold hover:underline">
                    View all {totalQ} questions →
                  </button>
                )}
              </div>

              <button onClick={handleSubmitClick} className="w-full py-3 bg-gray-800 text-white rounded-xl font-bold hover:bg-gray-900 active:scale-95 transition-all flex items-center justify-center gap-2">
                <Trophy size={16} /> Submit Exam
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return null;
};

export default StudentMockExam;