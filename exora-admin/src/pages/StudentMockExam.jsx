import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Clock, AlertCircle, CheckCircle, XCircle, ArrowLeft, Award, ChevronLeft, ChevronRight, Flag,
  Grid3x3, X, Search, Timer, BarChart3, Target, Zap, Brain, TrendingUp, Trophy, RotateCcw, ListChecks, HelpCircle
} from "lucide-react";
import api from "../api/axios";

const pad = (n) => String(n).padStart(2, "0");
const formatTime = (s, unlimited) => unlimited ? "∞" : s <= 0 ? "00:00" : `${pad(Math.floor(s / 60))}:${pad(s % 60)}`;
const optionLabel = (idx) => String.fromCharCode(65 + idx);
const timerColor = (left, total) => !total || left > total * 0.4 ? "text-white" : left > total * 0.15 ? "text-yellow-300" : "text-red-300 animate-pulse";

const OptionButton = ({ opt, optText, state, onClick, disabled }) => {
  const styles = { idle: "border-gray-200 dark:border-gray-600 hover:border-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700", selected: "border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20", correct: "border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20", wrong: "border-red-400 bg-red-50 dark:bg-red-900/20" };
  return (
    <button onClick={onClick} disabled={disabled} className={`w-full text-left p-4 rounded-xl border-2 transition-all duration-200 flex items-start gap-3 ${styles[state]}`}>
      <span className={`shrink-0 w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold border ${state === "correct" ? "bg-emerald-500 border-emerald-500 text-white" : state === "wrong" ? "bg-red-400 border-red-400 text-white" : state === "selected" ? "bg-indigo-600 border-indigo-600 text-white" : "bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-500 text-gray-500 dark:text-gray-400"}`}>{opt}</span>
      <span className={`flex-1 text-sm ${state === "correct" ? "text-emerald-800 dark:text-emerald-400 font-medium" : state === "wrong" ? "text-red-700 dark:text-red-400" : "text-gray-700 dark:text-gray-200"}`}>{optText}</span>
      {state === "correct" && <CheckCircle size={18} className="text-emerald-500 shrink-0" />}
      {state === "wrong" && <XCircle size={18} className="text-red-400 shrink-0" />}
    </button>
  );
};

const QuestionMap = ({ questions, answers, marked, current, onGo, onClose }) => {
  const [search, setSearch] = useState("");
  const filtered = questions.filter((_, i) => search === "" || String(i + 1).includes(search));
  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="bg-white dark:bg-gray-800 w-full sm:rounded-2xl sm:max-w-lg max-h-[85vh] flex flex-col shadow-2xl">
        <div className="flex items-center justify-between px-5 py-4 border-b dark:border-gray-700"><h3 className="font-bold text-gray-800 dark:text-white flex items-center gap-2"><Grid3x3 size={18} /> Navigator</h3><button onClick={onClose}><X size={18} /></button></div>
        <div className="px-5 py-3 border-b dark:border-gray-700"><div className="relative"><Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" /><input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Jump to question..." className="w-full pl-9 pr-3 py-2 border border-gray-200 dark:border-gray-600 rounded-xl text-sm bg-white dark:bg-gray-800 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none" /></div></div>
        <div className="overflow-y-auto p-5 grid grid-cols-8 gap-1.5">
          {filtered.map((q, localIdx) => {
            const globalIdx = questions.findIndex(qq => qq.id === q.id);
            const answered = !!answers[q.id], flagged = !!marked[q.id], isCurrent = globalIdx === current;
            return <button key={q.id} onClick={() => onGo(globalIdx)} className={`h-9 rounded-xl text-xs font-bold transition-all ${isCurrent ? "bg-indigo-600 text-white ring-2 ring-indigo-300" : answered ? "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400" : flagged ? "bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400" : "bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200"}`}>{globalIdx + 1}</button>;
          })}
        </div>
      </div>
    </div>
  );
};

const StudentMockExam = () => {
  const { deptId, courseId } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [course, setCourse] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [screen, setScreen] = useState("select");
  const [mode, setMode] = useState(null);
  const [answers, setAnswers] = useState({});
  const [revealed, setRevealed] = useState({});
  const [marked, setMarked] = useState({});
  const [currentIdx, setCurrentIdx] = useState(0);
  const [showMap, setShowMap] = useState(false);
  const [enableTimer, setEnableTimer] = useState(true);
  const [selectedMins, setSelectedMins] = useState(60);
  const [timeLeft, setTimeLeft] = useState(0);
  const [totalTime, setTotalTime] = useState(0);
  const [result, setResult] = useState(null);
  const [confirmSubmit, setConfirmSubmit] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => { (async () => { try { const { data } = await api.get(`/student/courses/${courseId}`); setCourse(data); } catch {} finally { setLoading(false); } })(); }, [courseId]);

  useEffect(() => { if (screen !== "test" || !enableTimer || timeLeft <= 0) return; const t = setInterval(() => { setTimeLeft((p) => { if (p <= 1) { clearInterval(t); submitExam(true); return 0; } return p - 1; }); }, 1000); return () => clearInterval(t); }, [screen, enableTimer, timeLeft]);

  const currentQ = questions[currentIdx];
  const totalQ = questions.length;
  const answeredCount = Object.keys(answers).length;
  const flaggedCount = Object.values(marked).filter(Boolean).length;
  const unansweredCount = totalQ - answeredCount;

  const startMode = async (m) => {
    setLoading(true);
    try {
      const { data } = await api.post(`/student/courses/${courseId}/mock-exam/start`, {});
      let questionsList = data.questions || [];
      if (questionsList.length > 0 && (!("correct_index" in questionsList[0]) || !("explanation" in questionsList[0]))) {
        const qRes = await api.get("/questions", { params: { course_id: courseId } });
        questionsList = (qRes.data || []).map((q) => ({ id: q.id, question_text: q.question_text, options: q.options, correct_index: q.correct_index, explanation: q.explanation || "" }));
      }
      setQuestions(questionsList);
      setMode(m);
      setAnswers({}); setRevealed({}); setMarked({}); setCurrentIdx(0);
      if (m === "test") { const secs = enableTimer ? selectedMins * 60 : 0; setTimeLeft(secs); setTotalTime(secs); setScreen("test"); }
      else setScreen("practice");
    } catch { alert("Failed to start exam."); }
    finally { setLoading(false); }
  };

  const selectPractice = (q, opt) => { if (revealed[q.id]) return; setAnswers((p) => ({ ...p, [q.id]: opt })); const ci = q.correct_index ?? 0; setRevealed((p) => ({ ...p, [q.id]: { correct: optionLabel(ci), correctText: (q.options || [])[ci] || "", isCorrect: opt === optionLabel(ci), userLetter: opt, userText: (q.options || [])[opt.charCodeAt(0) - 65] || "", explanation: q.explanation || "" } })); };
  const selectTest = (qId, opt) => setAnswers((p) => ({ ...p, [qId]: opt }));
  const goTo = (idx) => { setCurrentIdx(idx); setShowMap(false); };
  const goNext = () => { if (currentIdx < totalQ - 1) setCurrentIdx((p) => p + 1); else setConfirmSubmit(true); };
  const goPrev = () => { if (currentIdx > 0) setCurrentIdx((p) => p - 1); };
  const toggleMark = (id) => setMarked((p) => ({ ...p, [id]: !p[id] }));
  const practiceState = (q, opt) => { const rev = revealed[q.id]; const sel = answers[q.id]; if (!rev) return sel === opt ? "selected" : "idle"; if (opt === rev.correct) return "correct"; if (opt === sel && !rev.isCorrect) return "wrong"; return "idle"; };
  const testState = (q, opt) => answers[q.id] === opt ? "selected" : "idle";

  const submitExam = async (isAuto = false) => {
    if (submitting) return; setSubmitting(true);
    const timeSpent = enableTimer && totalTime > 0 ? totalTime - timeLeft : null;
    try {
      const { data } = await api.post("/student/mock-exam/submit", { courseId, answers, mode, timeTaken: timeSpent });
      setResult(data); setScreen("result");
    } catch {
      let totalCorrect = 0; const results = questions.map((q) => { const ul = answers[q.id] ?? ""; const ic = ul === optionLabel(q.correct_index ?? 0); if (ic) totalCorrect++; return { id: q.id, text: q.question_text, userAnswer: ul || "(Not answered)", correctAnswer: optionLabel(q.correct_index ?? 0), isCorrect: ul ? ic : false, explanation: q.explanation }; });
      setResult({ score: totalQ > 0 ? Math.round((totalCorrect / totalQ) * 100) : 0, correctAnswers: totalCorrect, totalQuestions: totalQ, results }); setScreen("result");
    } finally { setSubmitting(false); setConfirmSubmit(false); }
  };

  // Mode Selection Screen
  if (screen === "select") {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-10 px-4">
        <div className="max-w-5xl mx-auto">
          <button onClick={() => navigate(`/student/departments/${deptId}/courses`)} className="inline-flex items-center gap-1.5 text-sm text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-white mb-8 transition group"><ArrowLeft size={15} className="group-hover:-translate-x-0.5" /> Back to Courses</button>
          <div className="text-center mb-10">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-white dark:bg-gray-800 rounded-2xl shadow-lg mb-4 border border-gray-200 dark:border-gray-700"><img src="/logoIcon.png" alt="Exora" className="w-12 h-12 object-contain" /></div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">{course?.name}</h1>
            <p className="text-gray-500 dark:text-gray-400 mt-1 text-sm">Select your study mode</p>
          </div>
          <div className="grid md:grid-cols-2 gap-6">
            {/* Practice Card */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-lg transition overflow-hidden">
              <div className="h-1.5 bg-emerald-500" />
              <div className="p-7">
                <div className="w-12 h-12 bg-emerald-100 dark:bg-emerald-900/30 rounded-2xl flex items-center justify-center mb-5"><Brain size={24} className="text-emerald-600 dark:text-emerald-400" /></div>
                <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-1">Practice Mode</h2>
                <p className="text-gray-500 dark:text-gray-400 text-sm mb-6">Learn with instant feedback</p>
                <ul className="space-y-2.5 mb-8 text-sm text-gray-600 dark:text-gray-300">
                  {["Answer reveals immediately", "Color-coded feedback", "Detailed explanation", "No time pressure"].map((t) => <li key={t} className="flex items-center gap-2"><CheckCircle size={15} className="text-emerald-500 shrink-0" />{t}</li>)}
                </ul>
                <button onClick={() => startMode("practice")} className="w-full py-3 bg-emerald-600 text-white rounded-xl font-semibold hover:bg-emerald-700 transition">Start Practice</button>
              </div>
            </div>
            {/* Test Card */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-lg transition overflow-hidden">
              <div className="h-1.5 bg-indigo-600" />
              <div className="p-7">
                <div className="w-12 h-12 bg-indigo-100 dark:bg-indigo-900/30 rounded-2xl flex items-center justify-center mb-5"><Target size={24} className="text-indigo-600 dark:text-indigo-400" /></div>
                <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-1">Test Mode</h2>
                <p className="text-gray-500 dark:text-gray-400 text-sm mb-5">Simulate real exam</p>
                <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-xl mb-4">
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300"><Timer size={15} className="inline mr-1" /> Timer</span>
                  <label className="relative inline-flex items-center cursor-pointer"><input type="checkbox" className="sr-only peer" checked={enableTimer} onChange={(e) => setEnableTimer(e.target.checked)} /><div className="w-10 h-5 bg-gray-200 dark:bg-gray-600 rounded-full peer peer-checked:bg-indigo-600 peer-checked:after:translate-x-5 after:absolute after:top-0.5 after:left-0.5 after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all" /></label>
                </div>
                {enableTimer && <div className="mb-5"><p className="text-xs font-semibold text-gray-500 uppercase mb-2">Duration</p><div className="grid grid-cols-4 gap-2">{[15, 30, 60, 90].map((m) => <button key={m} onClick={() => setSelectedMins(m)} className={`py-2 rounded-xl text-sm font-bold transition ${selectedMins === m ? "bg-indigo-600 text-white" : "bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200"}`}>{m}m</button>)}</div></div>}
                <button onClick={() => startMode("test")} className="w-full py-3 bg-indigo-600 text-white rounded-xl font-semibold hover:bg-indigo-700 transition">Start Test</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Results Screen
  if (screen === "result" && result) {
    const passed = result.score >= 60;
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-10 px-4">
        <div className="max-w-2xl mx-auto space-y-5">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl overflow-hidden">
            <div className={`p-8 text-center ${passed ? "bg-emerald-600" : "bg-red-500"}`}>
              <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4">{passed ? <Trophy size={36} className="text-white" /> : <TrendingUp size={36} className="text-white" />}</div>
              <h2 className="text-3xl font-bold text-white">{passed ? "Great Work!" : "Keep Practicing!"}</h2>
              <div className="inline-block bg-white/15 rounded-2xl px-8 py-4 mt-4"><p className="text-6xl font-bold text-white">{result.score}<span className="text-2xl opacity-70">%</span></p></div>
              <div className="w-48 mx-auto h-2 bg-white/25 rounded-full mt-5 overflow-hidden"><div className="h-full bg-white rounded-full" style={{ width: `${result.score}%` }} /></div>
            </div>
            <div className="grid grid-cols-3 divide-x divide-gray-100 dark:divide-gray-700">
              {[{ icon: CheckCircle, c: "text-emerald-500", v: result.correctAnswers || 0, l: "Correct" }, { icon: XCircle, c: "text-red-400", v: (result.totalQuestions || 0) - (result.correctAnswers || 0), l: "Wrong" }, { icon: Award, c: "text-indigo-500", v: `${result.score}%`, l: "Score" }].map(({ icon: I, c, v, l }) => <div key={l} className="py-5 text-center"><I size={20} className={`${c} mx-auto mb-1`} /><p className={`text-2xl font-bold ${c}`}>{v}</p><p className="text-xs text-gray-400">{l}</p></div>)}
            </div>
            <div className="p-6 flex gap-3">
              <button onClick={() => window.location.reload()} className="flex-1 py-3 border-2 border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-xl font-semibold hover:bg-gray-50 dark:hover:bg-gray-700 transition"><RotateCcw size={16} /> Try Again</button>
              <button onClick={() => navigate(`/student/departments/${deptId}/courses`)} className="flex-1 py-3 bg-indigo-600 text-white rounded-xl font-semibold hover:bg-indigo-700 transition"><ArrowLeft size={16} /> Back to Courses</button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Practice/Test screens (condensed for brevity — uses same OptionButton + QuestionMap + sidebar as Exit Exam)
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {showMap && <QuestionMap questions={questions} answers={answers} marked={marked} current={currentIdx} onGo={goTo} onClose={() => setShowMap(false)} />}
      {confirmSubmit && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl max-w-sm w-full p-6 shadow-2xl text-center">
            <div className="w-14 h-14 bg-amber-100 dark:bg-amber-900/30 rounded-full flex items-center justify-center mx-auto mb-4"><AlertCircle size={26} className="text-amber-600" /></div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Submit Exam?</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">Answered: {answeredCount} / {totalQ}</p>
            <div className="flex gap-3 mt-4"><button onClick={() => setConfirmSubmit(false)} className="flex-1 py-2.5 border border-gray-200 dark:border-gray-600 rounded-xl text-sm">Cancel</button><button onClick={() => submitExam(false)} disabled={submitting} className="flex-1 py-2.5 bg-indigo-600 text-white rounded-xl text-sm">{submitting ? "..." : "Submit"}</button></div>
          </div>
        </div>
      )}

      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="grid lg:grid-cols-[1fr_280px] gap-6">
          <div className="space-y-4">
            {/* Timer Bar */}
            <div className="bg-indigo-600 rounded-2xl px-6 py-4 shadow-lg">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <button onClick={() => navigate(`/student/departments/${deptId}/courses`)} className="text-xs text-indigo-200 hover:text-white transition"><ArrowLeft size={14} /> Back</button>
                  <div className="w-9 h-9 bg-white/15 rounded-xl flex items-center justify-center"><Clock size={18} className="text-white" /></div>
                  <div><p className="text-indigo-200 text-[11px] uppercase">Time</p><p className={`text-2xl font-bold font-mono ${timerColor(timeLeft, totalTime)}`}>{formatTime(timeLeft, !enableTimer)}</p></div>
                </div>
                <div className="text-right"><p className="text-indigo-200 text-[11px] uppercase">Question</p><p className="text-2xl font-bold text-white">{currentIdx + 1} <span className="text-indigo-300 text-base">/ {totalQ}</span></p></div>
              </div>
            </div>

            {/* Question Card */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700 flex justify-between items-center">
                <div className="flex items-center gap-3"><div className="w-9 h-9 bg-indigo-100 dark:bg-indigo-900/30 rounded-xl flex items-center justify-center text-sm font-bold text-indigo-600 dark:text-indigo-400">{currentIdx + 1}</div><span className="text-xs text-gray-400">of {totalQ}</span></div>
                <button onClick={() => toggleMark(currentQ.id)} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition ${marked[currentQ.id] ? "bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400" : "bg-gray-100 dark:bg-gray-700 text-gray-500 hover:bg-gray-200"}`}><Flag size={13} />{marked[currentQ.id] ? "Flagged" : "Flag"}</button>
              </div>
              <div className="px-6 pt-6 pb-2">
                <p className="text-base font-medium text-gray-800 dark:text-white mb-6">{currentQ?.question_text || currentQ?.text}</p>
                <div className="space-y-2.5">{(currentQ?.options || []).map((optText, i) => <OptionButton key={i} opt={optionLabel(i)} optText={optText} state={screen === "practice" ? practiceState(currentQ, optionLabel(i)) : testState(currentQ, optionLabel(i))} onClick={() => screen === "practice" ? selectPractice(currentQ, optionLabel(i)) : selectTest(currentQ.id, optionLabel(i))} disabled={screen === "practice" && !!revealed[currentQ?.id]} />)}</div>
              </div>
              <div className="px-6 py-4 mt-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700 flex items-center justify-between">
                <button onClick={goPrev} disabled={currentIdx === 0} className="px-4 py-2 border border-gray-200 dark:border-gray-600 rounded-xl text-sm disabled:opacity-40"><ChevronLeft size={16} /> Prev</button>
                <button onClick={() => setShowMap(true)} className="px-3 py-2 bg-gray-100 dark:bg-gray-700 rounded-xl text-xs"><Grid3x3 size={14} /> Map</button>
                {currentIdx < totalQ - 1 ? <button onClick={goNext} className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-sm">Next <ChevronRight size={16} /></button> : <button onClick={() => setConfirmSubmit(true)} className="px-4 py-2 bg-emerald-600 text-white rounded-xl text-sm">Submit <Trophy size={15} /></button>}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-4">
            <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-5">
              <p className="text-xs font-bold text-gray-500 uppercase mb-4"><BarChart3 size={14} className="inline mr-1" /> Progress</p>
              {[{ l: "Answered", v: answeredCount, c: "bg-indigo-600" }, { l: "Unanswered", v: unansweredCount, c: "bg-gray-200 dark:bg-gray-600" }, { l: "Flagged", v: flaggedCount, c: "bg-amber-400" }].map(({ l, v, c }) => <div key={l} className="mb-3"><div className="flex justify-between text-xs text-gray-500 mb-1"><span>{l}</span><span>{v}</span></div><div className="h-1.5 bg-gray-100 dark:bg-gray-700 rounded-full"><div className={`h-full ${c} rounded-full`} style={{ width: `${totalQ ? (v / totalQ) * 100 : 0}%` }} /></div></div>)}
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-5">
              <p className="text-xs font-bold text-gray-500 uppercase mb-3">Quick Nav</p>
              <div className="grid grid-cols-5 gap-1.5">{questions.slice(0, 25).map((q, i) => { const a = !!answers[q.id], f = !!marked[q.id], c = i === currentIdx; return <button key={q.id} onClick={() => goTo(i)} className={`h-8 rounded-lg text-[11px] font-bold ${c ? "bg-indigo-600 text-white" : a ? "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400" : f ? "bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400" : "bg-gray-100 dark:bg-gray-700 text-gray-500"}`}>{i + 1}</button>; })}</div>
            </div>
            <button onClick={() => setConfirmSubmit(true)} className="w-full py-3 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition"><Trophy size={16} /> Submit Exam</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StudentMockExam;