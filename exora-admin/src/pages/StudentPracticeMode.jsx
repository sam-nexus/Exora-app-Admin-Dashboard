import { useState, useEffect, useCallback, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  ArrowLeft, Check, X, Loader2, AlertCircle, BookOpen, Sparkles, Clock,
  CheckCircle, Wifi, WifiOff, ThumbsUp, ThumbsDown, Star, Zap, Award, Heart,
  Smile, Frown, Laugh, Meh, Angry, Brain, Trophy, Flame, Sun, TrendingUp
} from "lucide-react";
import api from "../api/axios";

// ─── Funny Phrases (30 correct, 30 wrong) ───────────────────────────────────
const correctPhrases = [
  { text: "You're doing great! 🎉", icon: <Star size={16} className="text-yellow-400" /> },
  { text: "Correct! Exora is proud... suspiciously proud. 🤨", icon: <Award size={16} className="text-amber-400" /> },
  { text: "Nailed it! Someone studied! 📚", icon: <ThumbsUp size={16} className="text-emerald-400" /> },
  { text: "Boom! That answer didn't stand a chance. 💥", icon: <Zap size={16} className="text-yellow-400" /> },
  { text: "You're on fire! 🔥 (Not literally, please stay safe.)", icon: <Sparkles size={16} className="text-orange-400" /> },
  { text: "Einstein would be proud. Maybe. Probably. 🧠", icon: <Star size={16} className="text-purple-400" /> },
  { text: "Correct! Your brain is functioning at full capacity. ⚡", icon: <Zap size={16} className="text-blue-400" /> },
  { text: "That's right! You're basically a genius now. 🎓", icon: <Award size={16} className="text-indigo-400" /> },
  { text: "Perfect! Even your textbooks are applauding. 👏", icon: <Heart size={16} className="text-pink-400" /> },
  { text: "Yes! You're making this look easy. 😎", icon: <ThumbsUp size={16} className="text-teal-400" /> },
  { text: "Wow, your single brain cell fired perfectly! 🧬", icon: <Brain size={16} className="text-purple-400" /> },
  { text: "Correct! Your IQ just went up a notch. 📈", icon: <TrendingUp size={16} className="text-emerald-400" /> },
  { text: "You got it! The exam is shaking in fear. 😱", icon: <Trophy size={16} className="text-yellow-400" /> },
  { text: "Right answer! Your teacher would be impressed. 👩‍🏫", icon: <Smile size={16} className="text-blue-400" /> },
  { text: "Correct! You're collecting wins like Pokémon. 🏆", icon: <Award size={16} className="text-amber-400" /> },
  { text: "Spot on! Even Google is jealous of your knowledge. 🔍", icon: <Star size={16} className="text-indigo-400" /> },
  { text: "That's it! You're officially smarter than your phone. 📱", icon: <Zap size={16} className="text-teal-400" /> },
  { text: "Correct! Your brain deserves a gold star. ⭐", icon: <Star size={16} className="text-yellow-400" /> },
  { text: "You're unstoppable! (Until the next hard question.) 😏", icon: <Flame size={16} className="text-orange-400" /> },
  { text: "Yes! You're on a roll. Don't stop now! 🎲", icon: <ThumbsUp size={16} className="text-emerald-400" /> },
  { text: "Correct! The answer bowed down to you. 👑", icon: <Award size={16} className="text-purple-400" /> },
  { text: "Right! Your brain is a well-oiled machine. ⚙️", icon: <Brain size={16} className="text-blue-400" /> },
  { text: "You got it! High five... to yourself. ✋", icon: <Smile size={16} className="text-indigo-400" /> },
  { text: "Correct! Your confidence is showing. 💪", icon: <Flame size={16} className="text-amber-400" /> },
  { text: "That's the one! You make studying look cool. 😎", icon: <Sun size={16} className="text-yellow-400" /> },
  { text: "Nailed it! You're on a winning streak. 🏅", icon: <Trophy size={16} className="text-emerald-400" /> },
  { text: "Correct! Your brain cells are doing a happy dance. 💃", icon: <Heart size={16} className="text-pink-400" /> },
  { text: "Yes! You just made that question regret existing. 😂", icon: <Laugh size={16} className="text-teal-400" /> },
  { text: "Perfect score incoming! Keep going. 🎯", icon: <Zap size={16} className="text-purple-400" /> },
  { text: "Right answer! Your future self is thanking you. 🙏", icon: <Star size={16} className="text-blue-400" /> },
];

const wrongPhrases = [
  { text: "Wrong! You are the weakest link. Goodbye. 👋", icon: <ThumbsDown size={16} className="text-red-400" /> },
  { text: "Oops! You have the trivia skills of a damp sponge. 🧽", icon: <ThumbsDown size={16} className="text-red-400" /> },
  { text: "Nope! But hey, at least you're consistent. 😅", icon: <X size={16} className="text-orange-400" /> },
  { text: "Not quite. Even a broken clock is right twice a day. ⏰", icon: <Clock size={16} className="text-amber-400" /> },
  { text: "Swing and a miss! But you'll get it next time. ⚾", icon: <ThumbsDown size={16} className="text-red-400" /> },
  { text: "Incorrect. But failure is the mother of success... or something. 🤷", icon: <AlertCircle size={16} className="text-orange-400" /> },
  { text: "Nope! Your brain took a coffee break. ☕", icon: <X size={16} className="text-amber-400" /> },
  { text: "Wrong answer! Don't worry, even AI hallucinates sometimes. 🤖", icon: <AlertCircle size={16} className="text-red-400" /> },
  { text: "That's not it. But you're still breathing, so that's a win. 😮‍💨", icon: <ThumbsDown size={16} className="text-orange-400" /> },
  { text: "Missed it! The correct answer is hiding from you. 🙈", icon: <X size={16} className="text-red-400" /> },
  { text: "Wrong! You must be allergic to correct answers. 🤧", icon: <ThumbsDown size={16} className="text-red-400" /> },
  { text: "Your IQ just dropped to room temperature. 🌡️", icon: <Frown size={16} className="text-red-400" /> },
  { text: "Mind-blowing. Mostly because it was you. 🤯", icon: <Brain size={16} className="text-purple-400" /> },
  { text: "Nope! Even your pencil is embarrassed. ✏️", icon: <Meh size={16} className="text-orange-400" /> },
  { text: "Wrong! The correct answer is laughing at you. 😂", icon: <Laugh size={16} className="text-amber-400" /> },
  { text: "That's a no. Your brain needs a software update. 🔄", icon: <AlertCircle size={16} className="text-red-400" /> },
  { text: "Incorrect! But at least you're good-looking. (Maybe.) 💅", icon: <Smile size={16} className="text-orange-400" /> },
  { text: "Wrong! The question is winning this round. 🥊", icon: <Angry size={16} className="text-red-400" /> },
  { text: "Nope! Your brain cells are on strike. ✊", icon: <ThumbsDown size={16} className="text-amber-400" /> },
  { text: "That's not right. But don't cry... yet. 😢", icon: <Frown size={16} className="text-orange-400" /> },
  { text: "Wrong! The answer is playing hide and seek. 🙈", icon: <X size={16} className="text-red-400" /> },
  { text: "Missed! Your brain is buffering... please wait. ⏳", icon: <Clock size={16} className="text-amber-400" /> },
  { text: "Incorrect! Even a guess has a 25% chance. You beat the odds... badly. 📉", icon: <ThumbsDown size={16} className="text-red-400" /> },
  { text: "Nope! The answer called in sick today. 🤒", icon: <Meh size={16} className="text-orange-400" /> },
  { text: "Wrong! Your brain just filed for unemployment. 📄", icon: <AlertCircle size={16} className="text-red-400" /> },
  { text: "That's a miss. The correct answer is sending thoughts and prayers. 🙏", icon: <Smile size={16} className="text-amber-400" /> },
  { text: "Not it! Your answer was rejected by the universe. 🌌", icon: <X size={16} className="text-red-400" /> },
  { text: "Wrong! The answer is still waiting for you. Patiently. 🧘", icon: <Clock size={16} className="text-orange-400" /> },
  { text: "Nope! You just made the question feel smarter. 🤓", icon: <ThumbsDown size={16} className="text-amber-400" /> },
  { text: "Incorrect! But hey, you're building character. 💪", icon: <Frown size={16} className="text-red-400" /> },
];

const usedPhrasesRef = { current: { correct: new Set(), wrong: new Set() } };

const getRandomPhrase = (isCorrect) => {
  const phrases = isCorrect ? correctPhrases : wrongPhrases;
  const usedSet = isCorrect ? usedPhrasesRef.current.correct : usedPhrasesRef.current.wrong;
  const available = phrases.filter((_, i) => !usedSet.has(i));
  if (available.length === 0) {
    usedSet.clear();
    const randomIndex = Math.floor(Math.random() * phrases.length);
    usedSet.add(randomIndex);
    return phrases[randomIndex];
  }
  const randomIndex = Math.floor(Math.random() * available.length);
  const originalIndex = phrases.indexOf(available[randomIndex]);
  usedSet.add(originalIndex);
  return available[randomIndex];
};

const getPracticeProgressKey = (courseIdValue) => `practice-progress:${courseIdValue}`;

const loadPracticeProgress = (courseIdValue) => {
  if (!courseIdValue) return null;
  try { const cached = localStorage.getItem(getPracticeProgressKey(courseIdValue)); return cached ? JSON.parse(cached) : null; }
  catch { return null; }
};

const savePracticeProgress = (courseIdValue, progressState) => {
  if (!courseIdValue) return;
  try { localStorage.setItem(getPracticeProgressKey(courseIdValue), JSON.stringify({ ...progressState, savedAt: new Date().toISOString() })); }
  catch {}
};

const optionLabel = (idx) => String.fromCharCode(65 + idx);

const StudentPracticeMode = () => {
  const { deptId, courseId } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [course, setCourse] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState({});
  const [revealed, setRevealed] = useState({});
  const [fetchError, setFetchError] = useState("");
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [toast, setToast] = useState(null);
  const toastTimeoutRef = useRef(null);

  useEffect(() => {
    const ho = () => setIsOnline(true), hf = () => setIsOnline(false);
    window.addEventListener("online", ho); window.addEventListener("offline", hf);
    return () => { window.removeEventListener("online", ho); window.removeEventListener("offline", hf); };
  }, []);

  useEffect(() => {
    (async () => {
      setLoading(true); setFetchError("");
      try {
        const [courseRes, questionsRes] = await Promise.all([
          api.get("/courses", { params: { department_id: deptId } }),
          api.get("/questions", { params: { course_id: courseId } }),
        ]);
        setCourse((courseRes.data || []).find(i => i.id.toString() === courseId) || { title: "Course" });
        const qs = (questionsRes.data || []).map(q => ({
          id: q.id, text: q.question_text || q.text || "No question text.",
          options: Array.isArray(q.options) ? q.options : [],
          correctIndex: q.correct_index ?? q.correctIndex ?? 0, explanation: q.explanation || "",
        }));
        setQuestions(qs);
        const saved = loadPracticeProgress(courseId);
        if (saved) { setAnswers(saved.answers || {}); setRevealed(saved.revealed || {}); }
      } catch {
        const saved = loadPracticeProgress(courseId);
        if (saved?.questions?.length) { setQuestions(saved.questions); setAnswers(saved.answers || {}); setRevealed(saved.revealed || {}); }
        else setFetchError("Unable to load practice questions.");
      } finally { setLoading(false); }
    })();
  }, [deptId, courseId]);

  useEffect(() => {
    if (courseId && questions.length) savePracticeProgress(courseId, { answers, revealed, questions, questionCount: questions.length, answeredCount: Object.keys(answers).length });
  }, [answers, revealed, questions, courseId]);

  const showToast = (isCorrect) => {
    if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
    const phrase = getRandomPhrase(isCorrect);
    setToast({ ...phrase, isCorrect });
    toastTimeoutRef.current = setTimeout(() => setToast(null), 3500);
  };

  const handleSelectAnswer = (questionId, optionLetter) => {
    if (revealed[questionId]) return;
    const q = questions.find(q => q.id === questionId);
    if (!q) return;
    const correctLetter = optionLabel(q.correctIndex), isCorrect = optionLetter === correctLetter;
    setAnswers(p => ({ ...p, [questionId]: optionLetter }));
    setRevealed(p => ({ ...p, [questionId]: { correctLetter, correctText: q.options[q.correctIndex] || "", isCorrect, userLetter: optionLetter, userText: q.options[optionLetter.charCodeAt(0)-65] || "", explanation: q.explanation || "" } }));
    showToast(isCorrect);
  };

  const answeredCount = Object.keys(answers).length;
  const correctCount = Object.values(revealed).filter(r => r?.isCorrect).length;
  const totalQuestions = questions.length;
  const progressPercent = totalQuestions ? Math.round((answeredCount / totalQuestions) * 100) : 0;

  const getOptionState = (qId, opt) => {
    const rev = revealed[qId], sel = answers[qId];
    if (!rev) return sel === opt ? "selected" : "idle";
    if (opt === rev.correctLetter) return "correct";
    if (opt === sel && !rev.isCorrect) return "wrong";
    return "idle";
  };

  const stateStyles = {
    idle: "border-gray-200 dark:border-gray-600 hover:border-indigo-300 dark:hover:border-indigo-500 hover:bg-indigo-50/40 dark:hover:bg-indigo-900/20",
    selected: "border-indigo-500 dark:border-indigo-400 bg-indigo-50 dark:bg-indigo-900/20 ring-1 ring-indigo-300",
    correct: "border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20",
    wrong: "border-red-400 bg-red-50 dark:bg-red-900/20",
  };

  if (loading) return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <div className="flex flex-col items-center gap-3">
        <div className="relative"><div className="w-12 h-12 border-2 border-indigo-200 dark:border-indigo-800 border-t-indigo-600 dark:border-t-indigo-400 rounded-full animate-spin"/><BookOpen size={20} className="absolute inset-0 m-auto text-indigo-600 dark:text-indigo-400"/></div>
        <p className="text-sm text-gray-500 dark:text-gray-400">Loading practice questions...</p>
      </div>
    </div>
  );

  if (fetchError && !questions.length) return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <div className="text-center max-w-md bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-6">
        <AlertCircle size={40} className="text-red-400 mx-auto mb-3"/><p className="text-gray-500 dark:text-gray-400 text-sm">{fetchError}</p>
        <button onClick={() => window.location.reload()} className="mt-4 bg-indigo-600 text-white px-5 py-2 rounded-lg text-sm">Retry</button>
      </div>
    </div>
  );

  return (
    <div className="space-y-4 sm:space-y-5 pb-8 max-w-3xl mx-auto relative">
      {/* Toast */}
      {toast && (
        <div className="fixed top-16 sm:top-20 right-2 sm:right-6 lg:right-8 z-50 animate-slideInRight w-[calc(100%-1rem)] sm:max-w-xs max-w-[280px]">
          <div className={`rounded-2xl shadow-xl border p-3 sm:p-4 flex items-center gap-2.5 sm:gap-3 backdrop-blur-sm ${toast.isCorrect ? "bg-emerald-50/95 dark:bg-emerald-900/30 border-emerald-200 dark:border-emerald-800" : "bg-red-50/95 dark:bg-red-900/30 border-red-200 dark:border-red-800"}`}>
            <div className={`shrink-0 w-9 h-9 sm:w-10 sm:h-10 rounded-full flex items-center justify-center ${toast.isCorrect ? "bg-emerald-100 dark:bg-emerald-800" : "bg-red-100 dark:bg-red-800"}`}>{toast.icon}</div>
            <p className={`text-[12px] sm:text-sm font-medium ${toast.isCorrect ? "text-emerald-800 dark:text-emerald-200" : "text-red-800 dark:text-red-200"}`}>{toast.text}</p>
          </div>
        </div>
      )}

      {/* Back */}
      <button onClick={() => navigate(`/student/departments/${deptId}/courses`)} className="inline-flex items-center gap-1.5 text-[13px] sm:text-sm text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-white transition group"><ArrowLeft size={15} className="group-hover:-translate-x-0.5 transition"/> Back to Courses</button>

      {/* Header */}
      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-xl sm:rounded-2xl p-4 sm:p-6 text-white shadow-lg">
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0"><h1 className="text-lg sm:text-2xl font-bold truncate">{course?.title || course?.name || "Practice Mode"}</h1><p className="text-indigo-200 text-xs sm:text-sm mt-0.5">{totalQuestions} questions</p></div>
          <div className="bg-white/15 rounded-lg sm:rounded-xl px-3 sm:px-4 py-2 sm:py-3 text-center shrink-0"><p className="text-xl sm:text-2xl font-bold">{progressPercent}%</p><p className="text-indigo-200 text-[10px] sm:text-xs">Complete</p></div>
        </div>
        <div className="mt-3 sm:mt-4 h-1.5 sm:h-2 bg-white/20 rounded-full overflow-hidden"><div className="h-full bg-white rounded-full transition-all duration-500" style={{ width: `${progressPercent}%` }}/></div>
      </div>

      {/* Status */}
      <div className={`flex flex-wrap items-center justify-between gap-2 px-3 sm:px-4 py-2 rounded-xl text-[11px] sm:text-xs ${isOnline ? "bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300" : "bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400"}`}>
        <span className="flex items-center gap-1.5">{isOnline ? <Wifi size={13}/> : <WifiOff size={13}/>}{isOnline ? "Online" : "Offline"}</span>
        <div className="flex items-center gap-3 sm:gap-4"><span className="flex items-center gap-1"><CheckCircle size={12} className="text-emerald-500"/>{correctCount}</span><span className="flex items-center gap-1"><X size={12} className="text-red-500"/>{answeredCount-correctCount}</span><span className="flex items-center gap-1"><Clock size={12} className="text-gray-400"/>{totalQuestions-answeredCount}</span></div>
      </div>

      {/* Questions */}
      <div className="space-y-3 sm:space-y-4">
        {questions.map((q, index) => {
          const rev = revealed[q.id], isAnswered = !!rev;
          return (
            <div key={q.id} id={`q-${index+1}`} className={`bg-white dark:bg-gray-800 rounded-xl sm:rounded-2xl border-3 shadow-md shadow-gray-400 dark:shadow-gray-700 overflow-hidden transition-all duration-300 ${isAnswered ? (rev.isCorrect ? "border-emerald-300 dark:border-emerald-700 shadow-md shadow-emerald-50 dark:shadow-emerald-900/10" : "border-red-300 dark:border-red-700 shadow-md shadow-red-50 dark:shadow-red-900/10") : "border-gray-200 dark:border-gray-700"}`}>
              <div className="px-4 sm:px-5 pt-4 sm:pt-5 pb-2">
                <div className="flex items-start gap-2.5 sm:gap-3">
                  <div className={`shrink-0 w-9 h-9 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl flex items-center justify-center text-xs sm:text-sm font-bold border-2 ${isAnswered ? (rev.isCorrect ? "bg-emerald-50 dark:bg-emerald-900/20 border-emerald-300 dark:border-emerald-700 text-emerald-700 dark:text-emerald-400" : "bg-red-50 dark:bg-red-900/20 border-red-300 dark:border-red-700 text-red-600 dark:text-red-400") : "bg-indigo-50 dark:bg-indigo-900/20 border-indigo-200 dark:border-indigo-700 text-indigo-600 dark:text-indigo-400"}`}>{index+1}</div>
                  <div className="flex-1"><p className="text-gray-800 dark:text-white font-medium leading-relaxed text-[13px] sm:text-sm md:text-base pt-1.5 sm:pt-2">{q.text}</p></div>
                  {isAnswered && <div className={`shrink-0 w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center ${rev.isCorrect ? "bg-emerald-100 dark:bg-emerald-800 text-emerald-600 dark:text-emerald-400" : "bg-red-100 dark:bg-red-800 text-red-500 dark:text-red-400"}`}>{rev.isCorrect ? <Check size={16}/> : <X size={16}/>}</div>}
                </div>
              </div>
              <div className="px-4 sm:px-5 pb-2 space-y-1.5 sm:space-y-2">
                {q.options.map((optText, oi) => {
                  const opt = optionLabel(oi), state = getOptionState(q.id, opt);
                  return (
                    <button key={opt} onClick={() => handleSelectAnswer(q.id, opt)} disabled={isAnswered} className={`w-full text-left p-3 sm:p-3.5 rounded-lg sm:rounded-xl border-2 transition-all duration-200 flex items-center gap-2.5 sm:gap-3 ${isAnswered ? "cursor-default" : "cursor-pointer"} ${stateStyles[state]}`}>
                      <span className={`shrink-0 w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold border ${state==="correct"?"bg-emerald-500 border-emerald-500 text-white":state==="wrong"?"bg-red-400 border-red-400 text-white":state==="selected"?"bg-indigo-500 border-indigo-500 text-white":"bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-500 text-gray-500 dark:text-gray-400"}`}>{opt}</span>
                      <span className={`flex-1 text-[13px] sm:text-sm ${state==="correct"?"text-emerald-700 dark:text-emerald-400 font-medium":state==="wrong"?"text-red-600 dark:text-red-400":"text-gray-700 dark:text-gray-200"}`}>{optText}</span>
                      {state==="correct"&&<CheckCircle size={16} className="text-emerald-500 shrink-0"/>}{state==="wrong"&&<X size={16} className="text-red-400 shrink-0"/>}
                    </button>
                  );
                })}
              </div>
              {isAnswered && (
                <div className={`px-4 sm:px-5 pb-4 sm:pb-5 pt-1 border-t ${rev.isCorrect?"border-emerald-100 dark:border-emerald-800":"border-red-100 dark:border-red-800"}`}>
                  <div className={`mt-3 p-3 sm:p-4 rounded-xl ${rev.isCorrect?"bg-emerald-50 dark:bg-emerald-900/20":"bg-red-50 dark:bg-red-900/20"}`}>
                    <div className="flex items-center gap-2 mb-2">{rev.isCorrect?<CheckCircle size={16} className="text-emerald-600"/>:<X size={16} className="text-red-500"/>}<span className={`text-sm font-semibold ${rev.isCorrect?"text-emerald-700 dark:text-emerald-400":"text-red-700 dark:text-red-400"}`}>{rev.isCorrect?"Correct!":"Incorrect"}</span>{!rev.isCorrect&&<span className="text-xs text-gray-500 dark:text-gray-400 ml-auto">Correct: <span className="font-bold text-emerald-600 dark:text-emerald-400">{rev.correctLetter}</span></span>}</div>
                    <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">{rev.explanation||"No explanation provided."}</p>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
      {!questions.length && <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700"><BookOpen size={40} className="text-gray-300 mx-auto mb-3"/><p className="text-gray-500 dark:text-gray-400">No questions available.</p></div>}
      <div className="h-8"/>
    </div>
  );
};

export default StudentPracticeMode;