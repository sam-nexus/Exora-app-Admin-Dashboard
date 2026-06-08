import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  ArrowLeft, Check, Loader2, X, Flag, ChevronLeft, ChevronRight,
  Wifi, WifiOff, Trash2, Bot, Send, XCircle, BarChart3, BookOpen
} from "lucide-react";
import api from "../api/axios";

const getPracticeCacheKey = (courseIdValue) => `practice-cache:${courseIdValue}`;
const getPracticeProgressKey = (courseIdValue) => `practice-progress:${courseIdValue}`;

const loadPracticeCache = (courseIdValue) => {
  if (!courseIdValue) return null;
  try { const cached = localStorage.getItem(getPracticeCacheKey(courseIdValue)); return cached ? JSON.parse(cached) : null; }
  catch { return null; }
};

const savePracticeCache = (courseIdValue, courseData, questionData) => {
  if (!courseIdValue) return;
  try { localStorage.setItem(getPracticeCacheKey(courseIdValue), JSON.stringify({ course: courseData, questions: questionData, savedAt: new Date().toISOString() })); }
  catch {}
};

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

const clearPracticeProgress = (courseIdValue) => {
  if (!courseIdValue) return;
  try { localStorage.removeItem(getPracticeProgressKey(courseIdValue)); }
  catch {}
};

const StudentPracticeMode = () => {
  const { deptId, courseId } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [course, setCourse] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [showResult, setShowResult] = useState(false);
  const [answerStatus, setAnswerStatus] = useState({});
  const [markedForReview, setMarkedForReview] = useState({});
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [fetchError, setFetchError] = useState("");

  // AI States
  const [isAIOpen, setIsAIOpen] = useState(false);
  const [aiQuestion, setAiQuestion] = useState("");
  const [aiResponse, setAiResponse] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const [aiHistory, setAiHistory] = useState([]);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    return () => { window.removeEventListener("online", handleOnline); window.removeEventListener("offline", handleOffline); };
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      const restoreFromCache = () => {
        const cached = loadPracticeCache(courseId);
        const persistedProgress = loadPracticeProgress(courseId);
        if (cached && cached.questions?.length) {
          setCourse(cached.course || { title: "Course" });
          setQuestions(cached.questions);
          setAnswerStatus(persistedProgress?.answerStatus || {});
          setMarkedForReview(persistedProgress?.markedForReview || {});
          setCurrentIndex(typeof persistedProgress?.currentIndex === "number" ? Math.min(persistedProgress.currentIndex, cached.questions.length - 1) : 0);
          setSelectedAnswer(persistedProgress?.selectedAnswer || null);
          setShowResult(persistedProgress?.showResult || false);
          return true;
        }
        return false;
      };
      try {
        const [courseRes, questionsRes] = await Promise.all([
          api.get("/courses", { params: { department_id: deptId } }),
          api.get("/questions", { params: { course_id: courseId } })
        ]);
        const foundCourse = (courseRes.data || []).find((item) => item.id.toString() === courseId) || { title: "Selected Course" };
        const normalizedQuestions = (questionsRes.data || []).map((q) => ({
          id: q.id, text: q.question_text || q.text || "No question text.",
          options: Array.isArray(q.options) ? q.options : [],
          correctAnswer: String.fromCharCode(65 + (q.correct_index ?? q.correctIndex ?? 0)),
          explanation: q.explanation || "",
        }));
        const persistedProgress = loadPracticeProgress(courseId);
        setCourse(foundCourse);
        setQuestions(normalizedQuestions);
        setAnswerStatus(persistedProgress?.answerStatus || {});
        setMarkedForReview(persistedProgress?.markedForReview || {});
        setCurrentIndex(typeof persistedProgress?.currentIndex === "number" ? Math.min(persistedProgress.currentIndex, normalizedQuestions.length - 1) : 0);
        setSelectedAnswer(persistedProgress?.selectedAnswer || null);
        setShowResult(persistedProgress?.showResult || false);
        savePracticeCache(courseId, foundCourse, normalizedQuestions);
      } catch {
        if (!restoreFromCache()) setFetchError("Unable to load practice questions.");
      } finally { setLoading(false); }
    };
    if (deptId && courseId) fetchData();
  }, [deptId, courseId]);

  const currentQuestion = questions[currentIndex];
  const totalQuestions = questions.length;
  const answeredCount = Object.keys(answerStatus).length;
  const correctCount = Object.values(answerStatus).filter((item) => item.isCorrect).length;
  const incorrectCount = answeredCount - correctCount;
  const overallScore = totalQuestions === 0 ? 0 : Math.round((correctCount / totalQuestions) * 100);

  const handleAnswerSelect = (answer) => {
    if (showResult) return;
    setSelectedAnswer(answer);
    if (currentQuestion) {
      const isCorrect = answer === currentQuestion.correctAnswer;
      const nextAnswerStatus = { ...answerStatus, [currentQuestion.id]: { selectedAnswer: answer, isCorrect } };
      setAnswerStatus(nextAnswerStatus);
      setShowResult(true);
      saveCurrentProgress({ answerStatus: nextAnswerStatus, showResult: true, selectedAnswer: answer });
    }
  };

  const saveCurrentProgress = useCallback((overrides = {}) => {
    if (!courseId) return;
    savePracticeProgress(courseId, {
      currentIndex: overrides.currentIndex ?? currentIndex,
      answerStatus: overrides.answerStatus ?? answerStatus,
      markedForReview: overrides.markedForReview ?? markedForReview,
      selectedAnswer: overrides.selectedAnswer ?? selectedAnswer,
      showResult: overrides.showResult ?? showResult,
      questionCount: questions.length,
      answeredCount: Object.keys(overrides.answerStatus ?? answerStatus).length,
    });
  }, [courseId, answerStatus, markedForReview, selectedAnswer, showResult, currentIndex, questions.length]);

  const handleClearProgress = () => {
    if (confirm("Clear all progress for this course?")) {
      clearPracticeProgress(courseId);
      setAnswerStatus({}); setMarkedForReview({}); setSelectedAnswer(null); setShowResult(false); setCurrentIndex(0);
    }
  };

  const handleNext = () => { setSelectedAnswer(null); setShowResult(false); if (currentIndex < totalQuestions - 1) { const ni = currentIndex + 1; setCurrentIndex(ni); saveCurrentProgress({ currentIndex: ni, selectedAnswer: null, showResult: false }); } };
  const handlePrevious = () => { setSelectedAnswer(null); setShowResult(false); if (currentIndex > 0) { const ni = currentIndex - 1; setCurrentIndex(ni); saveCurrentProgress({ currentIndex: ni, selectedAnswer: null, showResult: false }); } };
  const handleMarkForReview = () => { if (!currentQuestion) return; const nextMarked = { ...markedForReview, [currentQuestion.id]: !markedForReview[currentQuestion.id] }; setMarkedForReview(nextMarked); saveCurrentProgress({ markedForReview: nextMarked }); };

  const handleAskAI = async () => {
    if (!aiQuestion.trim()) return;
    setAiLoading(true); setAiResponse("");
    setTimeout(() => {
      const responses = [
        `The correct answer is ${currentQuestion?.correctAnswer}. ${currentQuestion?.explanation || "This is the key concept."}`,
        `${currentQuestion?.correctAnswer} is right because ${currentQuestion?.explanation?.toLowerCase() || "it matches the definition"}.`,
      ];
      const resp = responses[Math.floor(Math.random() * responses.length)];
      setAiResponse(resp);
      setAiHistory((prev) => [{ question: aiQuestion, answer: resp, timestamp: new Date() }, ...prev].slice(0, 5));
      setAiLoading(false);
    }, 1000);
  };

  useEffect(() => { return () => { if (courseId) saveCurrentProgress(); }; }, [courseId, saveCurrentProgress]);

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Loader2 size={28} className="animate-spin text-gray-400 dark:text-gray-500 mx-auto" />
      </div>
    );
  }

  if (fetchError && questions.length === 0) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center max-w-md bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-6">
          <AlertCircle size={40} className="text-red-400 mx-auto mb-3" />
          <p className="text-gray-500 dark:text-gray-400 text-sm">{fetchError}</p>
          <button onClick={() => window.location.reload()} className="mt-4 bg-indigo-600 text-white px-5 py-2 rounded-lg text-sm">Retry</button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5 pb-8">
      {/* Back + Clear */}
      <div className="flex items-center justify-between">
        <button onClick={() => navigate(`/student/departments/${deptId}/courses`)} className="inline-flex items-center gap-1.5 text-sm text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-white transition group">
          <ArrowLeft size={15} className="group-hover:-translate-x-0.5 transition" /> Back to Courses
        </button>
        <button onClick={handleClearProgress} className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400 hover:text-red-600 transition">
          <Trash2 size={13} /> Clear Progress
        </button>
      </div>

      {/* Status Bar */}
      <div className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs ${isOnline ? "bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300" : "bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400"}`}>
        {isOnline ? <Wifi size={13} /> : <WifiOff size={13} />}
        <span>{isOnline ? "Online" : "Offline — Progress saved locally"}</span>
      </div>

      <div className="flex flex-col xl:flex-row gap-5">
        {/* Question Area */}
        <div className="flex-1">
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 mb-4">
            <div className="flex justify-between text-sm mb-2">
              <span className="text-gray-500 dark:text-gray-400">Q {currentIndex + 1} of {totalQuestions}</span>
              <span className="text-gray-500 dark:text-gray-400">{Math.round(((currentIndex + 1) / totalQuestions) * 100)}%</span>
            </div>
            <div className="h-1.5 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
              <div className="h-full bg-indigo-600 rounded-full transition-all" style={{ width: `${((currentIndex + 1) / totalQuestions) * 100}%` }} />
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
            <div className="px-5 py-3 bg-gray-50 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-600 flex justify-between items-center">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg flex items-center justify-center text-xs font-bold text-indigo-600 dark:text-indigo-400">{currentIndex + 1}</div>
                <span className="text-xs text-gray-500 dark:text-gray-400">of {totalQuestions}</span>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={() => setIsAIOpen(true)} className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 transition"><Bot size={12} /> AI Help</button>
                <button onClick={handleMarkForReview} className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium transition ${markedForReview[currentQuestion?.id] ? "bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400" : "bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"}`}><Flag size={12} />{markedForReview[currentQuestion?.id] ? "Marked" : "Mark"}</button>
              </div>
            </div>

            <div className="p-5">
              <div className="text-gray-800 dark:text-white font-medium leading-relaxed mb-5" dangerouslySetInnerHTML={{ __html: currentQuestion?.text || "No question text." }} />

              <div className="space-y-2.5 mb-5">
                {["A", "B", "C", "D"].map((opt) => {
                  const isSelected = selectedAnswer === opt;
                  const isCorrect = showResult && opt === currentQuestion?.correctAnswer;
                  const isWrong = showResult && selectedAnswer === opt && opt !== currentQuestion?.correctAnswer;
                  const optText = currentQuestion?.options?.[opt.charCodeAt(0) - 65] || "";
                  return (
                    <button key={opt} onClick={() => handleAnswerSelect(opt)} disabled={showResult}
                      className={`w-full text-left p-3 rounded-lg border transition-all ${isSelected && !showResult ? "border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20" : isCorrect ? "border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20" : isWrong ? "border-red-400 bg-red-50 dark:bg-red-900/20" : "border-gray-200 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500"}`}>
                      <div className="flex gap-3">
                        <span className={`font-medium text-sm w-6 ${isCorrect ? "text-emerald-600" : isWrong ? "text-red-600" : isSelected ? "text-indigo-600" : "text-gray-500 dark:text-gray-400"}`}>{opt}.</span>
                        <span className="text-gray-700 dark:text-gray-200 text-sm flex-1">{optText}</span>
                        {isCorrect && <Check size={16} className="text-emerald-500 shrink-0" />}
                        {isWrong && <X size={16} className="text-red-500 shrink-0" />}
                      </div>
                    </button>
                  );
                })}
              </div>

              {showResult && (
                <div className={`p-4 rounded-lg border mb-5 ${selectedAnswer === currentQuestion?.correctAnswer ? "bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800" : "bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800"}`}>
                  <div className="flex items-center gap-2 mb-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${selectedAnswer === currentQuestion?.correctAnswer ? "bg-emerald-100 dark:bg-emerald-800" : "bg-red-100 dark:bg-red-800"}`}>
                      {selectedAnswer === currentQuestion?.correctAnswer ? <Check size={16} className="text-emerald-600" /> : <X size={16} className="text-red-600" />}
                    </div>
                    <h3 className={`font-semibold ${selectedAnswer === currentQuestion?.correctAnswer ? "text-emerald-700 dark:text-emerald-400" : "text-red-700 dark:text-red-400"}`}>{selectedAnswer === currentQuestion?.correctAnswer ? "Correct!" : "Incorrect"}</h3>
                  </div>
                  <p className="text-xs text-gray-600 dark:text-gray-400 mb-2">Explanation</p>
                  <p className="text-gray-700 dark:text-gray-300 text-sm bg-white/50 dark:bg-gray-800/50 p-2 rounded">{currentQuestion?.explanation || "No explanation."}</p>
                  <div className="mt-3 bg-white/60 dark:bg-gray-800/60 rounded p-2">
                    <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Correct Answer</p>
                    <span className="bg-emerald-100 dark:bg-emerald-800 rounded px-2 py-1 text-sm font-semibold text-emerald-700 dark:text-emerald-400">{currentQuestion?.correctAnswer}</span>
                    <span className="text-sm text-gray-700 dark:text-gray-300 ml-2">{currentQuestion?.options?.[currentQuestion?.correctAnswer?.charCodeAt(0) - 65]}</span>
                  </div>
                </div>
              )}

              <div className="flex gap-3">
                {!showResult ? (
                  <div className="text-center w-full py-2 text-gray-500 dark:text-gray-400 text-sm border border-dashed border-gray-300 dark:border-gray-600 rounded-lg">Click an answer to see explanation</div>
                ) : (
                  <>
                    <button onClick={handlePrevious} disabled={currentIndex === 0} className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-40 transition"><ChevronLeft size={16} /></button>
                    <button onClick={handleNext} disabled={currentIndex === totalQuestions - 1} className="flex-1 bg-indigo-600 text-white py-2 rounded-lg font-medium text-sm hover:bg-indigo-700 disabled:opacity-40 transition">Next <ChevronRight size={14} className="inline ml-1" /></button>
                  </>
                )}
              </div>

              <div className="mt-4 pt-3 border-t border-gray-100 dark:border-gray-700 flex justify-between text-sm">
                <div className="flex gap-4">
                  <div><span className="text-gray-400 dark:text-gray-500 text-xs">Answered</span><p className="font-medium text-gray-800 dark:text-white">{answeredCount}/{totalQuestions}</p></div>
                  <div><span className="text-gray-400 dark:text-gray-500 text-xs">Correct</span><p className="font-medium text-emerald-600">{correctCount}</p></div>
                  <div><span className="text-gray-400 dark:text-gray-500 text-xs">Wrong</span><p className="font-medium text-red-600">{incorrectCount}</p></div>
                </div>
                <div><span className="text-gray-400 dark:text-gray-500 text-xs">Score</span><p className="font-medium text-gray-800 dark:text-white">{overallScore}%</p></div>
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="w-full xl:w-72 space-y-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
            <div className="flex items-center gap-2 mb-3"><BarChart3 size={16} className="text-gray-500" /><h3 className="font-medium text-gray-800 dark:text-white text-sm">Navigator</h3></div>
            <div className="grid grid-cols-5 gap-1.5 max-h-52 overflow-y-auto">
              {questions.map((_, idx) => {
                const status = answerStatus[questions[idx]?.id];
                const isCorrect = status?.isCorrect;
                let bg = "bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400";
                if (status) bg = isCorrect ? "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400" : "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400";
                if (markedForReview[questions[idx]?.id]) bg = "bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400";
                return (
                  <button key={idx} onClick={() => { setCurrentIndex(idx); setSelectedAnswer(answerStatus[questions[idx]?.id]?.selectedAnswer || null); setShowResult(!!answerStatus[questions[idx]?.id]); }}
                    className={`w-8 h-8 rounded-lg text-xs font-medium transition ${currentIndex === idx ? "ring-2 ring-indigo-600 bg-indigo-600 text-white" : bg} hover:opacity-80`}>{idx + 1}</button>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* AI Modal */}
      {isAIOpen && (
        <>
          <div className="fixed inset-0 bg-black/50 z-40" onClick={() => setIsAIOpen(false)} />
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-xl w-full max-w-lg pointer-events-auto">
              <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700 rounded-t-xl">
                <div className="flex items-center gap-2"><div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center"><Bot size={16} className="text-white" /></div><h3 className="font-semibold text-gray-900 dark:text-white">AI Assistant</h3></div>
                <button onClick={() => setIsAIOpen(false)} className="text-gray-400 hover:text-gray-600"><XCircle size={20} /></button>
              </div>
              <div className="p-4 max-h-[50vh] overflow-y-auto">
                <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3 mb-4 text-sm text-gray-700 dark:text-gray-300">{currentQuestion?.text}</div>
                {aiHistory.length > 0 && <div className="mb-4 space-y-2 max-h-24 overflow-y-auto">{aiHistory.map((item, idx) => <div key={idx} className="bg-gray-50 dark:bg-gray-700 rounded-lg p-2 text-xs"><p className="font-medium">Q: {item.question.substring(0, 60)}...</p><p className="text-gray-500 dark:text-gray-400 mt-1">A: {item.answer.substring(0, 80)}...</p></div>)}</div>}
                <div className="flex gap-2">
                  <input type="text" value={aiQuestion} onChange={(e) => setAiQuestion(e.target.value)} placeholder="Ask about this question..." className="flex-1 px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none" onKeyPress={(e) => e.key === "Enter" && handleAskAI()} autoFocus />
                  <button onClick={handleAskAI} disabled={aiLoading || !aiQuestion.trim()} className="px-3 py-2 bg-indigo-600 text-white rounded-lg text-sm hover:bg-indigo-700 disabled:opacity-50"><Send size={16} /></button>
                </div>
                {aiLoading && <p className="text-xs text-gray-500 mt-2">Thinking...</p>}
                {aiResponse && !aiLoading && <div className="mt-3 bg-gray-50 dark:bg-gray-700 rounded-lg p-3 text-sm text-gray-700 dark:text-gray-300">{aiResponse}</div>}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default StudentPracticeMode;