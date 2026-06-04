import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Clock, AlertCircle, CheckCircle, XCircle, ArrowLeft,
  Award, ChevronLeft, ChevronRight, Flag, BookOpen,
  GraduationCap, Grid3x3, X, Search, Timer, BarChart3,
  Target, Zap, Brain, TrendingUp, Trophy, RotateCcw,
} from 'lucide-react';
import api from '../api/axios';

// ─── helpers ─────────────────────────────────────────────────────────────────
const pad = (n) => String(n).padStart(2, '0');

const formatTime = (seconds, unlimited) => {
  if (unlimited) return '∞';
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  return h > 0 ? `${pad(h)}:${pad(m)}:${pad(s)}` : `${pad(m)}:${pad(s)}`;
};

const optionLabel = (idx) => String.fromCharCode(65 + idx);

const timerColor = (left, total) => {
  if (!total) return 'text-white';
  const pct = left / total;
  if (pct > 0.4)  return 'text-white';
  if (pct > 0.15) return 'text-yellow-300';
  return 'text-red-300 animate-pulse';
};

// ─── Option Button ────────────────────────────────────────────────────────────
const OptionButton = ({ opt, optText, state, onClick, disabled }) => {
  const base = 'w-full text-left p-4 rounded-xl border-2 transition-all duration-200 flex items-start gap-3 group';
  const styles = {
    idle:     'border-gray-200 hover:border-indigo-300 hover:bg-indigo-50/40 cursor-pointer',
    selected: 'border-indigo-500 bg-indigo-50 ring-2 ring-indigo-200 cursor-pointer',
    correct:  'border-emerald-500 bg-emerald-50',
    wrong:    'border-red-400 bg-red-50',
  };
  return (
    <button onClick={onClick} disabled={disabled} className={`${base} ${styles[state]}`}>
      <span className={`shrink-0 w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold border
        ${state === 'correct'  ? 'bg-emerald-500 border-emerald-500 text-white'
        : state === 'wrong'    ? 'bg-red-400 border-red-400 text-white'
        : state === 'selected' ? 'bg-indigo-500 border-indigo-500 text-white'
        :                        'bg-white border-gray-300 text-gray-500 group-hover:border-indigo-400 group-hover:text-indigo-600'}`}>
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

// ─── Explanation Box ──────────────────────────────────────────────────────────
const ExplanationBox = ({ isCorrect, correctLetter, correctText, userLetter, userText, explanation }) => (
  <div className={`p-5 rounded-xl mb-2 border-2 animate-in slide-in-from-bottom-2 duration-200
    ${isCorrect ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
    <div className="flex items-center gap-3 mb-4 pb-3 border-b border-gray-200">
      <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${isCorrect ? 'bg-green-100' : 'bg-red-100'}`}>
        {isCorrect ? <CheckCircle size={20} className="text-green-600" /> : <XCircle size={20} className="text-red-600" />}
      </div>
      <h3 className={`font-bold text-lg ${isCorrect ? 'text-green-700' : 'text-red-700'}`}>
        {isCorrect ? '🎉 Correct!' : '❌ Incorrect'}
      </h3>
    </div>
    <div className="mb-4">
      <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-2">📖 Explanation</p>
      <p className="text-gray-700 text-sm leading-relaxed bg-white/50 p-3 rounded-lg">
        {explanation || 'No explanation provided for this question.'}
      </p>
    </div>
    <div className="bg-white/60 rounded-lg p-3">
      <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-2">✓ Correct Answer</p>
      <div className="flex items-center gap-3">
        <div className="bg-green-100 rounded-lg px-3 py-2 min-w-fit">
          <span className="font-bold text-green-700 text-lg">{correctLetter}</span>
        </div>
        <p className="text-sm text-gray-700">{correctText}</p>
      </div>
    </div>
    {!isCorrect && (
      <div className="mt-3 bg-white/60 rounded-lg p-3">
        <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-2">✗ Your Answer</p>
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

// ─── Question Navigator Modal ─────────────────────────────────────────────────
const QuestionMap = ({ questions, answers, marked, current, onGo, onClose }) => {
  const [search, setSearch] = useState('');
  const filtered = questions.filter((_, i) => search === '' || String(i + 1).includes(search));
  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="bg-white w-full sm:rounded-2xl sm:max-w-lg max-h-[85vh] flex flex-col shadow-2xl">
        <div className="flex items-center justify-between px-5 py-4 border-b">
          <h3 className="font-bold text-gray-800 flex items-center gap-2">
            <Grid3x3 size={18} className="text-indigo-600" /> Question Map
          </h3>
          <button onClick={onClose} className="p-1.5 hover:bg-gray-100 rounded-lg transition"><X size={18} /></button>
        </div>
        <div className="px-5 py-3 border-b">
          <div className="relative">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search question number…"
              className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-400 outline-none" />
          </div>
        </div>
        <div className="overflow-y-auto p-5 grid grid-cols-8 gap-1.5">
          {filtered.map((q, idx) => {
            const answered   = !!answers[q.id];
            const flagged    = !!marked[q.id];
            const isCurrent  = idx === current;
            return (
              <button key={q.id} onClick={() => onGo(idx)}
                className={`h-9 rounded-xl text-xs font-bold transition-all
                  ${isCurrent  ? 'bg-indigo-600 text-white ring-2 ring-indigo-300 ring-offset-1'
                  : answered   ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200'
                  : flagged    ? 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200'
                  :              'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
                {idx + 1}
              </button>
            );
          })}
        </div>
        <div className="px-5 py-3 border-t bg-gray-50 flex flex-wrap gap-4 text-xs text-gray-500">
          {[['bg-indigo-600','Current'],['bg-emerald-400','Answered'],['bg-yellow-400','Flagged'],['bg-gray-300','Unanswered']].map(([c,l]) => (
            <span key={l} className="flex items-center gap-1.5"><span className={`w-3 h-3 rounded-full ${c}`}/>{l}</span>
          ))}
        </div>
      </div>
    </div>
  );
};

// ─── Sidebar ──────────────────────────────────────────────────────────────────
const Sidebar = ({ questions, answers, marked, totalQs, answeredCount, flaggedCount, currentIdx, goTo, onSubmit }) => (
  <div className="space-y-4">
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
      <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-4 flex items-center gap-2">
        <BarChart3 size={14} className="text-indigo-500" /> Progress
      </p>
      <div className="space-y-3">
        {[
          { label: 'Answered',   val: answeredCount,           color: 'bg-indigo-500' },
          { label: 'Unanswered', val: totalQs - answeredCount, color: 'bg-gray-200'   },
          { label: 'Flagged',    val: flaggedCount,            color: 'bg-yellow-400' },
        ].map(({ label, val, color }) => (
          <div key={label}>
            <div className="flex justify-between text-xs text-gray-500 mb-1">
              <span>{label}</span><span className="font-bold text-gray-700">{val}</span>
            </div>
            <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
              <div className={`h-full ${color} rounded-full transition-all`}
                style={{ width: `${totalQs ? (val / totalQs) * 100 : 0}%` }} />
              </div>
          </div>
        ))}
      </div>
    </div>

    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
      <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-3">Quick Nav</p>
      <div className="grid grid-cols-5 gap-1.5 max-h-60 overflow-y-auto">
        {questions.slice(0, 50).map((q, i) => {
          const answered = !!answers[q.id];
          const flagged  = !!marked[q.id];
          const isCur    = i === currentIdx;
          return (
            <button key={q.id} onClick={() => goTo(i)}
              className={`h-8 rounded-lg text-[11px] font-bold transition-all
                ${isCur    ? 'bg-indigo-600 text-white ring-2 ring-indigo-300'
                : answered ? 'bg-emerald-100 text-emerald-700'
                : flagged  ? 'bg-yellow-100 text-yellow-700'
                :            'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}>
              {i + 1}
            </button>
          );
        })}
      </div>
      {totalQs > 50 && (
        <p className="text-xs text-gray-400 text-center mt-2">+{totalQs - 50} more — use Question Map</p>
      )}
    </div>

    <button onClick={onSubmit}
      className="w-full py-3 bg-emerald-600 text-white rounded-xl font-bold hover:bg-emerald-700 active:scale-95 transition-all flex items-center justify-center gap-2">
      <Trophy size={16} /> Submit Exam
    </button>
  </div>
);

// ─── Main Component ──────────────────────────────────────────────────────────
const StudentExitExam = () => {
  const { deptId, courseId } = useParams(); // Route: /student/departments/:deptId/courses/:courseId/exit-exam
  const navigate = useNavigate();

  const [loading, setLoading]       = useState(true);
  const [department, setDepartment] = useState(null);
  const [course, setCourse]         = useState(null);
  const [questions, setQuestions]   = useState([]);

  const [screen, setScreen]         = useState('select');
  const [mode, setMode]             = useState(null);
  const [isStarting, setIsStarting] = useState(false);

  const [answers, setAnswers]   = useState({});
  const [revealed, setRevealed] = useState({});
  const [marked, setMarked]     = useState({});

  const [currentIdx, setCurrentIdx] = useState(0);
  const [showMap, setShowMap]       = useState(false);

  const [enableTimer, setEnableTimer]   = useState(true);
  const [selectedMins, setSelectedMins] = useState(180);
  const [timeLeft, setTimeLeft]         = useState(0);
  const [totalTime, setTotalTime]       = useState(0);

  const [result, setResult]               = useState(null);
  const [confirmSubmit, setConfirmSubmit] = useState(false);

  // fetch department + course info for display
  useEffect(() => {
    (async () => {
      try {
        // Fetch department info
        const deptRes = await api.get(`/student/departments/${deptId}`);
        setDepartment(deptRes.data);

        // Fetch course name if we have a courseId — use list endpoint with filter
        if (courseId) {
          try {
            const coursesRes = await api.get('/courses', { params: { department_id: deptId } });
            const found = (coursesRes.data || []).find((c) => c.id === courseId);
            if (found) setCourse(found);
          } catch (e) {
            console.warn('Could not fetch course name:', e);
          }
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    })();
  }, [deptId, courseId]);

  // timer countdown
  useEffect(() => {
    if (screen !== 'test' || !enableTimer || timeLeft <= 0) return;
    const t = setInterval(() => {
      setTimeLeft((p) => {
        if (p <= 1) { clearInterval(t); submitExam(); return 0; }
        return p - 1;
      });
    }, 1000);
    return () => clearInterval(t);
  }, [screen, enableTimer, timeLeft]);

  // derived
  const currentQ      = questions[currentIdx];
  const totalQs       = questions.length;
  const answeredCount = Object.keys(answers).length;
  const flaggedCount  = Object.values(marked).filter(Boolean).length;
  const isFirst = currentIdx === 0;
  const isLast  = currentIdx === totalQs - 1;

  // ── start exam — load ONLY the selected course's questions ──
  const startMode = async (m) => {
    setIsStarting(true);
    setLoading(true);
    try {
      let questionsData = [];

      if (courseId) {
        // Specific exit exam course selected — load only its questions
        const qRes = await api.get('/questions', { params: { course_id: courseId } });
        questionsData = (qRes.data || []).map((q) => ({
          id:            q.id,
          text:          q.question_text,
          question_text: q.question_text,
          options:       q.options,
          correct_index: q.correct_index,
          explanation:   q.explanation || '',
        }));
      } else {
        // No courseId — try department endpoint, then fallback to all exit courses
        try {
          const { data } = await api.post(`/student/departments/${deptId}/exit-exam/start`, {});
          const sections = data.sections || [];
          sections.forEach((sec) => {
            (sec.questions || []).forEach((q) => {
              questionsData.push({
                id:            q.id,
                text:          q.question_text || q.text,
                question_text: q.question_text || q.text,
                options:       q.options,
                correct_index: q.correct_index,
                explanation:   q.explanation || '',
              });
            });
          });
          if (questionsData.length === 0 && data.questions?.length) {
            questionsData = data.questions;
          }
        } catch {
          const coursesRes = await api.get('/courses', { params: { department_id: deptId, type: 'exit' } });
          let courses = coursesRes.data || [];
          if (courses.length === 0) {
            const allRes = await api.get('/courses', { params: { department_id: deptId } });
            courses = allRes.data || [];
          }
          for (const c of courses) {
            const qRes = await api.get('/questions', { params: { course_id: c.id } });
            (qRes.data || []).forEach((q) => {
              questionsData.push({
                id:            q.id,
                text:          q.question_text,
                question_text: q.question_text,
                options:       q.options,
                correct_index: q.correct_index,
                explanation:   q.explanation || '',
              });
            });
          }
        }
      }

      console.log(`Exit exam loaded: ${questionsData.length} questions`);

      if (questionsData.length === 0) {
        alert('No questions found for this exit exam. Please contact your administrator.');
        setIsStarting(false);
        setLoading(false);
        return;
      }

      setQuestions(questionsData);
      setMode(m);
      setCurrentIdx(0);
      setAnswers({});
      setRevealed({});
      setMarked({});
      setLoading(false);
      setIsStarting(false);

      if (m === 'test') {
        const secs = enableTimer ? selectedMins * 60 : 0;
        setTimeLeft(secs);
        setTotalTime(secs);
      }
      setScreen(m);
    } catch (e) {
      console.error('Error loading exit exam:', e);
      alert('Failed to start exit exam. Please try again.');
      setLoading(false);
      setIsStarting(false);
    }
  };

  // ── navigation ──
  const goTo = useCallback((idx) => {
    setCurrentIdx(idx);
    setShowMap(false);
  }, []);

  const goNext = () => {
    if (currentIdx < totalQs - 1) setCurrentIdx((p) => p + 1);
    else setConfirmSubmit(true);
  };

  const goPrev = () => {
    if (currentIdx > 0) setCurrentIdx((p) => p - 1);
  };

  // ── practice: instant reveal ──
  const selectPractice = (q, opt) => {
    if (revealed[q.id]) return;
    setAnswers((p) => ({ ...p, [q.id]: opt }));
    const ci      = q.correct_index ?? 0;
    const cLetter = optionLabel(ci);
    setRevealed((p) => ({
      ...p,
      [q.id]: {
        correct:     cLetter,
        correctText: (q.options || [])[ci] || '',
        isCorrect:   opt === cLetter,
        userLetter:  opt,
        userText:    (q.options || [])[opt.charCodeAt(0) - 65] || '',
        explanation: q.explanation || '',
      },
    }));
  };

  const selectTest  = (qId, opt) => setAnswers((p) => ({ ...p, [qId]: opt }));
  const toggleMark  = (id)       => setMarked((p)  => ({ ...p, [id]: !p[id] }));

  const practiceState = (q, opt) => {
    const rev = revealed[q.id];
    const sel = answers[q.id];
    if (!rev) return sel === opt ? 'selected' : 'idle';
    if (opt === rev.correct) return 'correct';
    if (opt === sel && !rev.isCorrect) return 'wrong';
    return 'idle';
  };

  // ── submit ──
  const submitExam = async () => {
    setLoading(true);
    try {
      let data;
      try {
        const res = await api.post('/student/exit-exam/submit', { departmentId: deptId, answers });
        data = res.data;
      } catch (err) {
        // Client-side scoring fallback
        console.warn('Submit endpoint unavailable — scoring client-side');
        let totalCorrect = 0;
        const results = questions.map((q) => {
          const userLetter = answers[q.id] ?? '';
          const isCorrect  = userLetter === optionLabel(q.correct_index ?? 0);
          if (isCorrect) totalCorrect++;
          return {
            id: q.id, text: q.question_text,
            userAnswer: userLetter,
            correctAnswer: optionLabel(q.correct_index ?? 0),
            isCorrect,
            explanation: q.explanation,
          };
        });
        const score = totalQs > 0 ? Math.round((totalCorrect / totalQs) * 100) : 0;
        data = { score, correctCount: totalCorrect, totalCount: totalQs, results };
      }
      setResult(data);
      setScreen('result');
      setConfirmSubmit(false);
    } catch (e) {
      console.error(e);
      alert('Submission failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // ══ SCREEN: loading ══════════════════════════════════════════════════════════
  if (loading && screen === 'select') {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center space-y-3">
          <div className="w-10 h-10 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-sm text-gray-500">Loading exit exam…</p>
        </div>
      </div>
    );
  }

  // ══ SCREEN: select (mode selection) ═══════════════════════════════════════════
  if (screen === 'select') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-indigo-50/40 py-10 px-4">
        <div className="max-w-5xl mx-auto">
          <button onClick={() => navigate(`/student/departments/${deptId}/courses`)}
            className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-indigo-600 mb-8 transition group">
            <ArrowLeft size={15} className="group-hover:-translate-x-0.5 transition" /> Back to Courses
          </button>

          <div className="text-center mb-10">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-indigo-600 to-purple-700 rounded-2xl shadow-lg mb-4">
              <Trophy size={28} className="text-white" />
            </div>
            <h1 className="text-3xl font-extrabold text-gray-900">
              {course?.name || 'Exit Exam'}
            </h1>
            <p className="text-gray-400 mt-1 text-sm flex items-center justify-center gap-1.5">
              <GraduationCap size={14} /> {department?.name || 'Department'} Department
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {/* Practice card */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-lg transition-all duration-200 hover:-translate-y-0.5 overflow-hidden">
              <div className="h-1.5 bg-gradient-to-r from-emerald-400 to-teal-500" />
              <div className="p-7">
                <div className="w-12 h-12 bg-emerald-100 rounded-2xl flex items-center justify-center mb-5">
                  <Brain size={24} className="text-emerald-600" />
                </div>
                <h2 className="text-xl font-bold text-gray-900 mb-1">Practice Mode</h2>
                <p className="text-gray-400 text-sm mb-6">Learn with instant feedback on every answer</p>
                <ul className="space-y-2.5 mb-8">
                  {['Click any answer to instantly reveal correct/wrong',
                    'Full explanation shown for every question',
                    'Navigate freely',
                    'No time pressure'].map((t) => (
                    <li key={t} className="flex items-start gap-2.5 text-sm text-gray-600">
                      <CheckCircle size={15} className="text-emerald-500 mt-0.5 shrink-0" />{t}
                    </li>
                  ))}
                </ul>
                <button onClick={() => startMode('practice')} disabled={isStarting}
                  className="w-full py-3 bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-xl font-semibold hover:shadow-md hover:shadow-emerald-200 active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-50">
                  {isStarting ? <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent" /> : <BookOpen size={17} />}
                  Start Practice
                </button>
              </div>
            </div>

            {/* Test card */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-lg transition-all duration-200 hover:-translate-y-0.5 overflow-hidden">
              <div className="h-1.5 bg-gradient-to-r from-indigo-500 to-purple-600" />
              <div className="p-7">
                <div className="w-12 h-12 bg-indigo-100 rounded-2xl flex items-center justify-center mb-5">
                  <Target size={24} className="text-indigo-600" />
                </div>
                <h2 className="text-xl font-bold text-gray-900 mb-1">Test Mode</h2>
                <p className="text-gray-400 text-sm mb-5">Full exam simulation</p>

                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl mb-4">
                  <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
                    <Timer size={15} className="text-indigo-500" /> Enable Timer
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" className="sr-only peer" checked={enableTimer}
                      onChange={(e) => setEnableTimer(e.target.checked)} />
                    <div className="w-10 h-5 bg-gray-200 rounded-full peer peer-checked:bg-indigo-600
                      peer-checked:after:translate-x-5 after:absolute after:top-0.5 after:left-0.5
                      after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all after:content-['']" />
                  </label>
                </div>

                {enableTimer && (
                  <div className="mb-5">
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Duration</p>
                    <div className="grid grid-cols-4 gap-2">
                      {[60, 90, 120, 180].map((m) => (
                        <button key={m} onClick={() => setSelectedMins(m)}
                          className={`py-2 rounded-xl text-sm font-bold transition-all
                            ${selectedMins === m ? 'bg-indigo-600 text-white shadow-md shadow-indigo-200' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
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
                  <p>• Passing score: 50%</p>
                </div>

                <button onClick={() => startMode('test')} disabled={isStarting}
                  className="w-full py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl font-semibold hover:shadow-md hover:shadow-indigo-200 active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-50">
                  {isStarting ? <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent" /> : <Zap size={17} />}
                  Start Test {enableTimer && `· ${selectedMins}min`}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ══ SCREEN: result ════════════════════════════════════════════════════════════
  if (screen === 'result' && result) {
    const passed    = result.score >= 50;
    const correct   = result.correctCount ?? 0;
    const incorrect = (result.totalCount ?? 0) - correct;
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-indigo-50/40 py-10 px-4">
        <div className="max-w-2xl mx-auto space-y-5">
          <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
            <div className={`p-8 text-center ${passed ? 'bg-gradient-to-br from-emerald-500 to-teal-600' : 'bg-gradient-to-br from-rose-500 to-red-600'}`}>
              <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4">
                {passed ? <Trophy size={36} className="text-white" /> : <TrendingUp size={36} className="text-white" />}
              </div>
              <h2 className="text-3xl font-extrabold text-white mb-1">
                {passed ? 'Exit Exam Passed! 🎉' : 'Keep Practicing!'}
              </h2>
              <p className="text-white/80 text-sm mb-5">{course?.name || 'Exit Exam'} · {mode === 'practice' ? 'Practice Mode' : 'Test Mode'}</p>
              <div className="inline-block bg-white/15 rounded-2xl px-8 py-4">
                <p className="text-6xl font-extrabold text-white leading-none">{result.score}<span className="text-2xl opacity-70">%</span></p>
                <p className="text-white/70 text-xs mt-1">{passed ? '✅ Passed (50% required)' : '❌ Below passing score (50%)'}</p>
              </div>
              <div className="w-48 mx-auto h-2 bg-white/25 rounded-full mt-5 overflow-hidden">
                <div className="h-full bg-white rounded-full" style={{ width: `${result.score}%` }} />
              </div>
            </div>

            <div className="grid grid-cols-3 divide-x divide-gray-100">
              {[
                { icon: CheckCircle, color: 'text-emerald-500', bg: 'bg-emerald-50', val: correct,   label: 'Correct' },
                { icon: XCircle,     color: 'text-red-400',     bg: 'bg-red-50',     val: incorrect, label: 'Wrong'   },
                { icon: Award,       color: 'text-indigo-500',  bg: 'bg-indigo-50',  val: `${result.score}%`, label: 'Score' },
              ].map(({ icon: Icon, color, bg, val, label }) => (
                <div key={label} className="py-5 flex flex-col items-center gap-1">
                  <div className={`w-10 h-10 ${bg} rounded-xl flex items-center justify-center mb-1`}>
                    <Icon size={20} className={color} />
                  </div>
                  <p className={`text-2xl font-extrabold ${color}`}>{val}</p>
                  <p className="text-xs text-gray-400">{label}</p>
                </div>
              ))}
            </div>

            <div className="p-6 flex gap-3">
              <button onClick={() => window.location.reload()}
                className="flex-1 flex items-center justify-center gap-2 py-3 border-2 border-indigo-200 text-indigo-600 rounded-xl font-semibold hover:bg-indigo-50 transition">
                <RotateCcw size={16} /> Try Again
              </button>
              <button onClick={() => navigate(`/student/departments/${deptId}/courses`)}
                className="flex-1 flex items-center justify-center gap-2 py-3 bg-indigo-600 text-white rounded-xl font-semibold hover:bg-indigo-700 transition">
                <ArrowLeft size={16} /> Back to Courses
              </button>
            </div>
          </div>

          {Array.isArray(result.results) && result.results.length > 0 && (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="px-6 py-4 border-b flex items-center gap-2">
                <BarChart3 size={18} className="text-indigo-600" />
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

  // ══ SCREEN: practice ═════════════════════════════════════════════════════════
  if (screen === 'practice') {
    if (questions.length === 0 || !currentQ) {
      return (
        <div className="min-h-[60vh] flex items-center justify-center">
          <div className="text-center space-y-3">
            <div className="w-10 h-10 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-sm text-gray-500">Preparing questions…</p>
          </div>
        </div>
      );
    }
    const rev = revealed[currentQ.id];
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-indigo-50/30">
        {showMap && <QuestionMap questions={questions} answers={answers} marked={marked}
          current={currentIdx} onGo={goTo} onClose={() => setShowMap(false)} />}

        <div className="max-w-6xl mx-auto px-4 py-8">
          <div className="grid lg:grid-cols-[1fr_280px] gap-6">
            <div className="space-y-4">
              {/* sticky top bar */}
              <div className="sticky top-3 z-10 bg-white/90 backdrop-blur-sm rounded-2xl border border-gray-100 shadow-sm px-5 py-3 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <button onClick={() => navigate(`/student/departments/${deptId}/courses`)}
                    className="flex items-center gap-1.5 text-xs font-semibold text-gray-500 hover:text-indigo-600 transition group shrink-0">
                    <ArrowLeft size={14} className="group-hover:-translate-x-0.5 transition" />
                    <span className="hidden sm:inline">Back</span>
                  </button>
                  <div className="w-px h-5 bg-gray-200" />
                  <div>
                    <p className="text-xs text-gray-400 font-medium">Practice Mode · Exit Exam</p>
                    <p className="text-sm font-bold text-gray-800 leading-tight">{course?.name || 'Exit Exam'}</p>
                  </div>
                </div>
                <div className="flex-1 max-w-xs hidden sm:block">
                  <div className="flex justify-between text-xs text-gray-400 mb-1">
                    <span>Q {currentIdx + 1} of {totalQs}</span>
                    <span>{answeredCount} answered</span>
                  </div>
                  <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                    <div className="h-full bg-indigo-500 rounded-full transition-all"
                      style={{ width: `${((currentIdx + 1) / totalQs) * 100}%` }} />
                  </div>
                </div>
                <button onClick={() => setShowMap(true)}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 rounded-xl text-xs font-semibold text-gray-600 hover:bg-gray-200 transition shrink-0">
                  <Grid3x3 size={14} /> Map
                </button>
              </div>

              {/* question card */}
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b bg-gray-50/60 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 bg-indigo-100 rounded-xl flex items-center justify-center">
                      <span className="text-indigo-600 font-extrabold text-sm">{currentIdx + 1}</span>
                    </div>
                    <span className="text-xs text-gray-400">of {totalQs}</span>
                  </div>
                  <button onClick={() => toggleMark(currentQ.id)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition
                      ${marked[currentQ.id] ? 'bg-yellow-100 text-yellow-700' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}>
                    <Flag size={13} />{marked[currentQ.id] ? 'Flagged' : 'Flag'}
                  </button>
                </div>

                <div className="px-6 pt-6 pb-2">
                  <p className="text-base font-medium text-gray-800 leading-relaxed mb-6">
                    {currentQ.question_text || currentQ.text || 'No question text'}
                  </p>
                  <div className="space-y-2.5">
                    {(currentQ.options || []).map((optText, i) => {
                      const opt = optionLabel(i);
                      return (
                        <OptionButton key={opt} opt={opt} optText={optText}
                          state={practiceState(currentQ, opt)}
                          onClick={() => selectPractice(currentQ, opt)}
                          disabled={!!rev} />
                      );
                    })}
                  </div>
                  {rev && (
                    <div className="mt-5">
                      <ExplanationBox isCorrect={rev.isCorrect} correctLetter={rev.correct}
                        correctText={rev.correctText} userLetter={rev.userLetter}
                        userText={rev.userText} explanation={rev.explanation} />
                    </div>
                  )}
                </div>

                <div className="px-6 py-4 mt-4 border-t bg-gray-50/50 flex items-center justify-between">
                  <button onClick={goPrev} disabled={isFirst}
                    className="flex items-center gap-1.5 px-4 py-2.5 border border-gray-200 rounded-xl text-sm font-medium text-gray-600 hover:bg-white transition disabled:opacity-40">
                    <ChevronLeft size={16} /> Prev
                  </button>
                  {/* dot indicator */}
                  <div className="flex items-center gap-1 overflow-hidden max-w-[180px]">
                    {questions.slice(Math.max(0, currentIdx - 3), currentIdx + 4).map((q, idx) => {
                      const realIdx = Math.max(0, currentIdx - 3) + idx;
                      const isRev   = !!revealed[q.id];
                      const isCur   = realIdx === currentIdx;
                      return (
                        <button key={q.id} onClick={() => goTo(realIdx)}
                          className={`rounded-full transition-all ${isCur ? 'w-5 h-2.5 bg-indigo-600' : isRev ? 'w-2 h-2 bg-emerald-400' : 'w-2 h-2 bg-gray-200 hover:bg-gray-300'}`} />
                      );
                    })}
                  </div>
                  {isLast ? (
                    <button onClick={() => {
                      const totalCorrect = Object.values(revealed).filter(r => r?.isCorrect).length;
                      const score = totalQs ? Math.round((totalCorrect / totalQs) * 100) : 0;
                      setResult({ score, correctCount: totalCorrect, totalCount: totalQs, results: [] });
                      setScreen('result');
                    }} className="flex items-center gap-1.5 px-4 py-2.5 bg-emerald-600 text-white rounded-xl text-sm font-semibold hover:bg-emerald-700 transition">
                      Finish <Trophy size={15} />
                    </button>
                  ) : (
                    <button onClick={goNext} className="flex items-center gap-1.5 px-4 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-semibold hover:bg-indigo-700 transition">
                      Next <ChevronRight size={16} />
                    </button>
                  )}
                </div>
              </div>

              {/* stat strip */}
              <div className="grid grid-cols-3 gap-3">
                {[
                  { label: 'Answered', val: answeredCount, color: 'text-indigo-600', bg: 'bg-indigo-50' },
                  { label: 'Flagged',  val: flaggedCount,  color: 'text-yellow-600', bg: 'bg-yellow-50' },
                  { label: 'Left',     val: totalQs - answeredCount, color: 'text-gray-500', bg: 'bg-gray-50' },
                ].map(({ label, val, color, bg }) => (
                  <div key={label} className={`${bg} rounded-xl py-3 text-center`}>
                    <p className={`text-xl font-extrabold ${color}`}>{val}</p>
                    <p className="text-[11px] text-gray-400">{label}</p>
                  </div>
                ))}
              </div>
            </div>
            <Sidebar questions={questions} answers={answers} marked={marked}
              totalQs={totalQs} answeredCount={answeredCount} flaggedCount={flaggedCount}
              currentIdx={currentIdx} goTo={goTo} onSubmit={() => setConfirmSubmit(true)} />
          </div>
        </div>
      </div>
    );
  }

  // ══ SCREEN: test ══════════════════════════════════════════════════════════════
  if (screen === 'test') {
    if (questions.length === 0 || !currentQ) {
      return (
        <div className="min-h-[60vh] flex items-center justify-center">
          <div className="text-center space-y-3">
            <div className="w-10 h-10 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-sm text-gray-500">Preparing exam…</p>
          </div>
        </div>
      );
    }
    const urgency = timerColor(timeLeft, totalTime);
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-indigo-50/30">
        {showMap && <QuestionMap questions={questions} answers={answers} marked={marked}
          current={currentIdx} onGo={goTo} onClose={() => setShowMap(false)} />}

        {confirmSubmit && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl text-center">
              <div className="w-14 h-14 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <AlertCircle size={26} className="text-amber-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Submit Exit Exam?</h3>
              <p className="text-sm text-gray-500 mb-1">
                Answered: <span className="font-bold text-indigo-600">{answeredCount}</span> / {totalQs}
              </p>
              {totalQs - answeredCount > 0 && (
                <p className="text-xs text-red-500 bg-red-50 rounded-lg py-2 px-3 mb-3">
                  ⚠️ {totalQs - answeredCount} question{totalQs - answeredCount > 1 ? 's' : ''} unanswered
                </p>
              )}
              <p className="text-xs text-gray-400 mb-4">This action cannot be undone.</p>
              <div className="flex gap-3">
                <button onClick={() => setConfirmSubmit(false)}
                  className="flex-1 py-2.5 border border-gray-200 rounded-xl text-sm font-semibold hover:bg-gray-50 transition">Cancel</button>
                <button onClick={submitExam}
                  className="flex-1 py-2.5 bg-emerald-600 text-white rounded-xl text-sm font-semibold hover:bg-emerald-700 transition">Submit</button>
              </div>
            </div>
          </div>
        )}

        <div className="max-w-6xl mx-auto px-4 py-8">
          <div className="grid lg:grid-cols-[1fr_280px] gap-6">
            <div className="space-y-4">
              {/* timer bar */}
              <div className="bg-gradient-to-r from-indigo-600 to-purple-700 rounded-2xl px-6 py-4 shadow-lg">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <button onClick={() => navigate(`/student/departments/${deptId}/courses`)}
                      className="flex items-center gap-1.5 text-xs font-semibold text-indigo-200 hover:text-white transition group">
                      <ArrowLeft size={14} className="group-hover:-translate-x-0.5 transition" />
                      <span className="hidden sm:inline">Back</span>
                    </button>
                    <div className="w-px h-5 bg-white/20" />
                    <div className="w-9 h-9 bg-white/15 rounded-xl flex items-center justify-center">
                      <Clock size={18} className="text-white" />
                    </div>
                    <div>
                      <p className="text-indigo-200 text-[11px] font-semibold uppercase">Time Left</p>
                      <p className={`text-2xl font-extrabold font-mono leading-none ${urgency}`}>
                        {enableTimer ? formatTime(timeLeft) : '∞'}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-indigo-200 text-[11px] font-semibold uppercase">Question</p>
                    <p className="text-2xl font-extrabold text-white">
                      {currentIdx + 1} <span className="text-indigo-300 text-base">/ {totalQs}</span>
                    </p>
                  </div>
                </div>
              </div>

              {/* question card */}
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b bg-gray-50/60 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 bg-indigo-100 rounded-xl flex items-center justify-center">
                      <span className="text-indigo-600 font-extrabold text-sm">{currentIdx + 1}</span>
                    </div>
                    <span className="text-xs text-gray-400">of {totalQs}</span>
                  </div>
                  <button onClick={() => toggleMark(currentQ.id)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition
                      ${marked[currentQ.id] ? 'bg-yellow-100 text-yellow-700' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}>
                    <Flag size={13} />{marked[currentQ.id] ? 'Flagged' : 'Flag'}
                  </button>
                </div>

                <div className="px-6 pt-6 pb-2">
                  <p className="text-base font-medium text-gray-800 leading-relaxed mb-6">
                    {currentQ.question_text || currentQ.text || 'No question text'}
                  </p>
                  <div className="space-y-2.5">
                    {(currentQ.options || []).map((optText, i) => {
                      const opt = optionLabel(i);
                      return (
                        <OptionButton key={opt} opt={opt} optText={optText}
                          state={answers[currentQ.id] === opt ? 'selected' : 'idle'}
                          onClick={() => selectTest(currentQ.id, opt)}
                          disabled={false} />
                      );
                    })}
                  </div>
                </div>

                <div className="px-6 py-4 mt-4 border-t bg-gray-50/50 flex items-center justify-between">
                  <button onClick={goPrev} disabled={isFirst}
                    className="flex items-center gap-1.5 px-4 py-2.5 border border-gray-200 rounded-xl text-sm font-medium text-gray-600 hover:bg-white transition disabled:opacity-40">
                    <ChevronLeft size={16} /> Prev
                  </button>
                  <button onClick={() => setShowMap(true)}
                    className="flex items-center gap-1.5 px-3 py-2 bg-gray-100 rounded-xl text-xs font-semibold text-gray-600 hover:bg-gray-200 transition">
                    <Grid3x3 size={14} /> Map
                  </button>
                  {isLast ? (
                    <button onClick={() => setConfirmSubmit(true)}
                      className="flex items-center gap-1.5 px-4 py-2.5 bg-emerald-600 text-white rounded-xl text-sm font-semibold hover:bg-emerald-700 transition">
                      Submit <Trophy size={15} />
                    </button>
                  ) : (
                    <button onClick={goNext}
                      className="flex items-center gap-1.5 px-4 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-semibold hover:bg-indigo-700 transition">
                      Next <ChevronRight size={16} />
                    </button>
                  )}
                </div>
              </div>
            </div>
            <Sidebar questions={questions} answers={answers} marked={marked}
              totalQs={totalQs} answeredCount={answeredCount} flaggedCount={flaggedCount}
              currentIdx={currentIdx} goTo={goTo} onSubmit={() => setConfirmSubmit(true)} />
          </div>
        </div>
      </div>
    );
  }

  return null;
};

export default StudentExitExam;