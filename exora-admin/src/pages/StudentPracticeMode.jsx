import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Check,
  Loader2,
  X,
  Flag,
  ChevronLeft,
  ChevronRight,
  BookOpen,
  Award,
  TrendingUp,
  Wifi,
  WifiOff,
  Download,
  Trash2,
  Bot,
  Sparkles,
  Send,
  XCircle,
  MessageCircle,
  Brain,
  Target,
  Clock,
  BarChart3,
  HelpCircle
} from "lucide-react";
import api from "../api/axios";

const getPracticeCacheKey = (courseIdValue) => `practice-cache:${courseIdValue}`;
const getPracticeProgressKey = (courseIdValue) => `practice-progress:${courseIdValue}`;

const loadPracticeCache = (courseIdValue) => {
  if (!courseIdValue) return null;
  try {
    const cached = localStorage.getItem(getPracticeCacheKey(courseIdValue));
    return cached ? JSON.parse(cached) : null;
  } catch (err) {
    console.error("Failed to read cached practice data:", err);
    return null;
  }
};

const savePracticeCache = (courseIdValue, courseData, questionData) => {
  if (!courseIdValue) return;
  try {
    localStorage.setItem(
      getPracticeCacheKey(courseIdValue),
      JSON.stringify({
        course: courseData,
        questions: questionData,
        savedAt: new Date().toISOString(),
      })
    );
  } catch (err) {
    console.error("Failed to save cached practice data:", err);
  }
};

const loadPracticeProgress = (courseIdValue) => {
  if (!courseIdValue) return null;
  try {
    const cached = localStorage.getItem(getPracticeProgressKey(courseIdValue));
    return cached ? JSON.parse(cached) : null;
  } catch (err) {
    console.error("Failed to read saved practice progress:", err);
    return null;
  }
};

const savePracticeProgress = (courseIdValue, progressState) => {
  if (!courseIdValue) return;
  try {
    localStorage.setItem(
      getPracticeProgressKey(courseIdValue),
      JSON.stringify({ ...progressState, savedAt: new Date().toISOString() })
    );
  } catch (err) {
    console.error("Failed to save practice progress:", err);
  }
};

const clearPracticeProgress = (courseIdValue) => {
  if (!courseIdValue) return;
  try {
    localStorage.removeItem(getPracticeProgressKey(courseIdValue));
  } catch (err) {
    console.error("Failed to clear saved practice progress:", err);
  }
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
  const [offlineMode, setOfflineMode] = useState(false);
  const [fetchError, setFetchError] = useState("");
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  // AI Assistant States
  const [isAIOpen, setIsAIOpen] = useState(false);
  const [aiQuestion, setAiQuestion] = useState("");
  const [aiResponse, setAiResponse] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const [aiHistory, setAiHistory] = useState([]);

  // Monitor online status
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  useEffect(() => {
    const fetchCourseAndQuestions = async () => {
      setLoading(true);
      setFetchError("");
      setOfflineMode(false);

      const restoreFromCache = () => {
        const cached = loadPracticeCache(courseId);
        const persistedProgress = loadPracticeProgress(courseId);
        if (cached && cached.questions?.length) {
          setCourse(cached.course || { title: "Selected Course" });
          setQuestions(cached.questions);
          setAnswerStatus(persistedProgress?.answerStatus || {});
          setMarkedForReview(persistedProgress?.markedForReview || {});
          setCurrentIndex(
            typeof persistedProgress?.currentIndex === "number"
              ? Math.min(persistedProgress.currentIndex, cached.questions.length - 1)
              : 0
          );
          setSelectedAnswer(persistedProgress?.selectedAnswer || null);
          setShowResult(persistedProgress?.showResult || false);
          setOfflineMode(true);
          return true;
        }
        return false;
      };

      try {
        const courseRes = await api.get("/courses", {
          params: { department_id: deptId },
        });
        const foundCourse = (courseRes.data || []).find(
          (item) => item.id.toString() === courseId
        );

        const questionsRes = await api.get("/questions", {
          params: { course_id: courseId },
        });
        const normalizedQuestions = (questionsRes.data || []).map((q) => {
          const correctIndex = q.correct_index ?? q.correctIndex ?? 0;
          const options = Array.isArray(q.options) ? q.options : [];
          return {
            id: q.id,
            text: q.question_text || q.text || "No question text available.",
            options,
            correctAnswer:
              typeof correctIndex === "number"
                ? String.fromCharCode(65 + correctIndex)
                : q.correct_answer || q.correctAnswer || "A",
            explanation: q.explanation || "",
          };
        });

        const normalizedCourse = foundCourse || { title: "Selected Course" };
        const persistedProgress = loadPracticeProgress(courseId);

        setCourse(normalizedCourse);
        setQuestions(normalizedQuestions);
        setAnswerStatus(persistedProgress?.answerStatus || {});
        setMarkedForReview(persistedProgress?.markedForReview || {});
        setCurrentIndex(
          typeof persistedProgress?.currentIndex === "number"
            ? Math.min(persistedProgress.currentIndex, normalizedQuestions.length - 1)
            : 0
        );
        setSelectedAnswer(persistedProgress?.selectedAnswer || null);
        setShowResult(persistedProgress?.showResult || false);

        savePracticeCache(courseId, normalizedCourse, normalizedQuestions);
      } catch (error) {
        console.error("Error loading practice data:", error);
        if (!restoreFromCache()) {
          setFetchError(
            "Unable to load practice questions. Connect to the internet and try again."
          );
        }
      } finally {
        setLoading(false);
      }
    };

    if (deptId && courseId) fetchCourseAndQuestions();
  }, [deptId, courseId]);

  const currentQuestion = questions[currentIndex];
  const totalQuestions = questions.length;
  const answeredCount = Object.keys(answerStatus).length;
  const correctCount = Object.values(answerStatus).filter(
    (item) => item.isCorrect
  ).length;
  const incorrectCount = answeredCount - correctCount;

  const handleAnswerSelect = (answer) => {
    if (showResult) return;
    setSelectedAnswer(answer);

    if (currentQuestion) {
      const isCorrect = answer === currentQuestion.correctAnswer;
      const nextAnswerStatus = {
        ...answerStatus,
        [currentQuestion.id]: { selectedAnswer: answer, isCorrect },
      };
      setAnswerStatus(nextAnswerStatus);
      setShowResult(true);
      saveCurrentProgress({
        answerStatus: nextAnswerStatus,
        showResult: true,
        selectedAnswer: answer,
      });
    }
  };

  const saveCurrentProgress = useCallback(
    (overrides = {}) => {
      if (!courseId) return;

      const answerStatusValue = overrides.answerStatus ?? answerStatus;
      const markedForReviewValue = overrides.markedForReview ?? markedForReview;
      const selectedAnswerValue = overrides.selectedAnswer ?? selectedAnswer;
      const showResultValue = overrides.showResult ?? showResult;
      const currentIndexValue = overrides.currentIndex ?? currentIndex;

      savePracticeProgress(courseId, {
        currentIndex: currentIndexValue,
        answerStatus: answerStatusValue,
        markedForReview: markedForReviewValue,
        selectedAnswer: selectedAnswerValue,
        showResult: showResultValue,
        questionCount: questions.length,
        answeredCount: Object.keys(answerStatusValue).length,
      });
    },
    [courseId, answerStatus, markedForReview, selectedAnswer, showResult, currentIndex, questions.length]
  );

  const handleClearProgress = () => {
    if (confirm("Are you sure you want to clear all progress for this course?")) {
      clearPracticeProgress(courseId);
      setAnswerStatus({});
      setMarkedForReview({});
      setSelectedAnswer(null);
      setShowResult(false);
      setCurrentIndex(0);
    }
  };

  const handleNext = () => {
    setSelectedAnswer(null);
    setShowResult(false);
    if (currentIndex < totalQuestions - 1) {
      const nextIndex = currentIndex + 1;
      setCurrentIndex(nextIndex);
      saveCurrentProgress({
        currentIndex: nextIndex,
        selectedAnswer: null,
        showResult: false,
      });
    }
  };

  const handlePrevious = () => {
    setSelectedAnswer(null);
    setShowResult(false);
    if (currentIndex > 0) {
      const nextIndex = currentIndex - 1;
      setCurrentIndex(nextIndex);
      saveCurrentProgress({
        currentIndex: nextIndex,
        selectedAnswer: null,
        showResult: false,
      });
    }
  };

  const handleMarkForReview = () => {
    if (!currentQuestion) return;
    const nextMarked = {
      ...markedForReview,
      [currentQuestion.id]: !markedForReview[currentQuestion.id],
    };
    setMarkedForReview(nextMarked);
    saveCurrentProgress({ markedForReview: nextMarked });
  };

  const handleAskAI = async () => {
    if (!aiQuestion.trim()) return;

    setAiLoading(true);
    setAiResponse("");

    // Simulate AI response - In production, replace with actual API call
    setTimeout(() => {
      const mockResponses = [
        `💡 This question is about ${currentQuestion?.text?.substring(0, 50)}... The correct answer is ${currentQuestion?.correctAnswer}. ${currentQuestion?.explanation || "This concept is important for understanding the topic."}`,
        `📚 Let me explain: ${currentQuestion?.options?.[currentQuestion?.correctAnswer?.charCodeAt(0) - 65] || "The correct option"} is the right choice because ${currentQuestion?.explanation?.toLowerCase() || "it accurately describes the concept"}.`,
        `🎯 Think about it this way: ${currentQuestion?.explanation || "The explanation focuses on the key distinction between the options"}. That's why ${currentQuestion?.correctAnswer} is correct.`,
        `💪 Great question! ${currentQuestion?.correctAnswer} is correct because ${currentQuestion?.explanation?.toLowerCase() || "it matches the definition perfectly"}. Would you like me to explain further?`,
      ];

      const randomResponse = mockResponses[Math.floor(Math.random() * mockResponses.length)];
      setAiResponse(randomResponse);

      setAiHistory((prev) =>
        [
          {
            question: aiQuestion,
            answer: randomResponse,
            timestamp: new Date(),
          },
          ...prev,
        ].slice(0, 5)
      );

      setAiLoading(false);
    }, 1000);
  };

  const clearAI = () => {
    setAiQuestion("");
    setAiResponse("");
  };

  useEffect(() => {
    if (!courseId) return;
    return () => {
      saveCurrentProgress();
    };
  }, [courseId, saveCurrentProgress]);

  const getQuestionStatus = (index) => {
    const qId = questions[index]?.id;
    if (answerStatus[qId]) return "answered";
    if (markedForReview[qId]) return "marked";
    return "unanswered";
  };

  const progress = totalQuestions === 0 ? 0 : ((currentIndex + 1) / totalQuestions) * 100;
  const overallScore = totalQuestions === 0 ? 0 : Math.round((correctCount / totalQuestions) * 100);

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-gray-800 mx-auto"></div>
          <p className="mt-3 text-gray-500 text-sm">Loading practice questions...</p>
        </div>
      </div>
    );
  }

  if (fetchError && questions.length === 0) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center px-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-lg border border-gray-200 p-6 text-center">
          <div className="w-14 h-14 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-7 h-7 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Unable to Load Practice</h3>
          <p className="text-sm text-gray-500 mb-5">{fetchError}</p>
          <button onClick={() => window.location.reload()} className="bg-gray-800 text-white px-5 py-2 rounded-xl text-sm font-medium hover:bg-gray-900 transition">
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <button
          onClick={() => navigate(`/student/departments/${deptId}/courses`)}
          className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800 transition group"
        >
          <ArrowLeft size={15} className="group-hover:-translate-x-0.5 transition" />
          Back to Courses
        </button>
        <div className="flex items-center gap-2">
          <button
            onClick={handleClearProgress}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-gray-500 hover:text-red-600 transition rounded-lg hover:bg-red-50"
          >
            <Trash2 size={13} />
            Clear Progress
          </button>
        </div>
      </div>

      {/* Title */}
      <div className="border-b border-gray-200 pb-3">
        <h1 className="text-2xl font-semibold text-gray-900">Practice Mode</h1>
        <p className="text-sm text-gray-500 mt-0.5">Answer questions and learn with instant feedback</p>
      </div>

      {/* Online/Offline Status */}
      <div className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs ${isOnline ? "bg-gray-100 text-gray-600" : "bg-amber-50 text-amber-700"}`}>
        {isOnline ? <Wifi size={13} className="text-gray-500" /> : <WifiOff size={13} />}
        <span>{isOnline ? "Online — Progress saved automatically" : "Offline — Progress saved locally"}</span>
      </div>

      {/* Tip + CTA bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 px-4 py-2.5 bg-indigo-50 border border-indigo-100 rounded-xl text-xs text-indigo-700">
        <span>💡 Practice tip — try to answer without looking at options first, then confirm your choice.</span>
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

      {offlineMode && !isOnline && (
        <div className="bg-gray-100 text-gray-600 px-3 py-2 rounded-lg text-xs border border-gray-200">
          Using cached questions. Your answers will sync when you're back online.
        </div>
      )}

      {/* Main Content */}
      <div className="flex flex-col xl:flex-row gap-6">
        {/* Question Area */}
        <div className="flex-1">
          {/* Progress Bar */}
          <div className="bg-white rounded-xl border border-gray-200 p-4 mb-5 shadow-sm">
            <div className="flex justify-between text-sm mb-2">
              <div>
                <span className="font-medium text-gray-700">{course?.title}</span>
                <p className="text-xs text-gray-400 mt-0.5">
                  Question {currentIndex + 1} of {totalQuestions}
                </p>
              </div>
              <div className="text-right">
                <span className="text-gray-500 text-xs">Progress</span>
                <p className="font-semibold text-gray-800">{Math.round(progress)}%</p>
              </div>
            </div>
            <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-gray-800 rounded-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>

          {/* Question Card */}
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
            <div className="px-5 py-3 bg-gray-50 border-b border-gray-200 flex justify-between items-center">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 bg-gray-200 rounded-lg flex items-center justify-center">
                  <span className="text-gray-700 font-medium text-xs">{currentIndex + 1}</span>
                </div>
                <span className="text-xs text-gray-500">of {totalQuestions}</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIsAIOpen(true)}
                  className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium transition bg-gray-100 text-gray-700 hover:bg-gray-200"
                  title="Ask AI Assistant"
                >
                  <Bot size={12} />
                  AI Help
                </button>
                <button
                  onClick={handleMarkForReview}
                  className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium transition ${
                    markedForReview[currentQuestion?.id]
                      ? "bg-amber-100 text-amber-700"
                      : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                  }`}
                >
                  <Flag size={12} />
                  {markedForReview[currentQuestion?.id] ? "Marked" : "Mark"}
                </button>
              </div>
            </div>

            <div className="p-5">
              {/* Question Text */}
              <div className="mb-5">
                <div
                  className="text-gray-800 font-medium leading-relaxed"
                  dangerouslySetInnerHTML={{
                    __html: currentQuestion?.text || "No question text.",
                  }}
                />
              </div>

              {/* Options */}
              <div className="space-y-2.5 mb-5">
                {["A", "B", "C", "D"].map((opt) => {
                  const isSelected = selectedAnswer === opt;
                  const isCorrect = showResult && opt === currentQuestion?.correctAnswer;
                  const isWrong = showResult && selectedAnswer === opt && opt !== currentQuestion?.correctAnswer;
                  const optIndex = opt.charCodeAt(0) - 65;
                  const optText = currentQuestion?.options?.[optIndex] || "";
                  const hasCode = optText.includes("function") || optText.includes("{") || optText.includes("<");

                  return (
                    <button
                      key={opt}
                      onClick={() => handleAnswerSelect(opt)}
                      disabled={showResult}
                      className={`w-full text-left p-3 rounded-lg border transition-all ${
                        isSelected && !showResult
                          ? "border-gray-800 bg-gray-50"
                          : isCorrect
                            ? "border-emerald-500 bg-emerald-50"
                            : isWrong
                              ? "border-red-400 bg-red-50"
                              : "border-gray-200 hover:border-gray-400 hover:bg-gray-50"
                      }`}
                    >
                      <div className="flex gap-3">
                        <span
                          className={`font-medium text-sm w-6 ${isCorrect ? "text-emerald-600" : isWrong ? "text-red-600" : isSelected ? "text-gray-800" : "text-gray-500"}`}
                        >
                          {opt}.
                        </span>
                        <div className="flex-1">
                          {hasCode ? (
                            <pre className="text-gray-700 text-sm font-mono whitespace-pre-wrap">
                              {optText}
                            </pre>
                          ) : (
                            <span className="text-gray-700 text-sm">{optText}</span>
                          )}
                        </div>
                        {isCorrect && <Check size={16} className="text-emerald-500 shrink-0" />}
                        {isWrong && <X size={16} className="text-red-500 shrink-0" />}
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Feedback Card */}
              {showResult && (
                <div className={`p-4 rounded-lg border mb-5 ${selectedAnswer === currentQuestion?.correctAnswer ? "bg-emerald-50 border-emerald-200" : "bg-red-50 border-red-200"}`}>
                  <div className="flex items-center gap-2 mb-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${selectedAnswer === currentQuestion?.correctAnswer ? "bg-emerald-100" : "bg-red-100"}`}>
                      {selectedAnswer === currentQuestion?.correctAnswer ? (
                        <Check size={16} className="text-emerald-600" />
                      ) : (
                        <X size={16} className="text-red-600" />
                      )}
                    </div>
                    <h3 className={`font-semibold ${selectedAnswer === currentQuestion?.correctAnswer ? "text-emerald-700" : "text-red-700"}`}>
                      {selectedAnswer === currentQuestion?.correctAnswer ? "Correct!" : "Incorrect"}
                    </h3>
                  </div>

                  {/* Explanation */}
                  <div className="mb-3">
                    <p className="text-xs font-medium text-gray-600 uppercase tracking-wide mb-1">Explanation</p>
                    <p className="text-gray-700 text-sm leading-relaxed bg-white/50 p-2 rounded">
                      {currentQuestion?.explanation || "No explanation provided."}
                    </p>
                  </div>

                  {/* Correct Answer */}
                  <div className="bg-white/60 rounded p-2 mb-2">
                    <p className="text-xs font-medium text-gray-600 uppercase tracking-wide mb-1">Correct Answer</p>
                    <div className="flex items-center gap-2">
                      <span className="bg-emerald-100 rounded px-2 py-1 text-sm font-semibold text-emerald-700">
                        {currentQuestion?.correctAnswer}
                      </span>
                      <span className="text-sm text-gray-700">
                        {currentQuestion?.options?.[currentQuestion?.correctAnswer?.charCodeAt(0) - 65] || ""}
                      </span>
                    </div>
                  </div>

                  {/* Your Answer (if wrong) */}
                  {selectedAnswer !== currentQuestion?.correctAnswer && (
                    <div className="bg-white/60 rounded p-2">
                      <p className="text-xs font-medium text-gray-600 uppercase tracking-wide mb-1">Your Answer</p>
                      <div className="flex items-center gap-2">
                        <span className="bg-red-100 rounded px-2 py-1 text-sm font-semibold text-red-700">
                          {selectedAnswer}
                        </span>
                        <span className="text-sm text-gray-700">
                          {currentQuestion?.options?.[selectedAnswer?.charCodeAt(0) - 65] || ""}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Navigation Buttons */}
              <div className="flex gap-3">
                {!showResult ? (
                  <div className="text-center w-full py-2 text-gray-500 text-sm border border-dashed border-gray-300 rounded-lg bg-gray-50">
                    Click an answer to see explanation
                  </div>
                ) : (
                  <>
                    <button
                      onClick={handlePrevious}
                      disabled={currentIndex === 0}
                      className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-40 transition"
                    >
                      <ChevronLeft size={16} />
                    </button>
                    <button
                      onClick={handleNext}
                      disabled={currentIndex === totalQuestions - 1}
                      className="flex-1 bg-gray-800 text-white py-2 rounded-lg font-medium text-sm hover:bg-gray-900 disabled:opacity-40 transition"
                    >
                      Next Question <ChevronRight size={14} className="inline ml-1" />
                    </button>
                  </>
                )}
              </div>

              {/* Stats Summary */}
              <div className="mt-4 pt-3 border-t border-gray-100 flex justify-between text-sm">
                <div className="flex gap-4">
                  <div>
                    <span className="text-gray-400 text-xs">Answered</span>
                    <p className="font-medium text-gray-800">{answeredCount}/{totalQuestions}</p>
                  </div>
                  <div>
                    <span className="text-gray-400 text-xs">Correct</span>
                    <p className="font-medium text-emerald-600">{correctCount}</p>
                  </div>
                  <div>
                    <span className="text-gray-400 text-xs">Incorrect</span>
                    <p className="font-medium text-red-600">{incorrectCount}</p>
                  </div>
                </div>
                <div>
                  <span className="text-gray-400 text-xs">Overall Score</span>
                  <p className="font-medium text-gray-800">{overallScore}%</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Sidebar - Question Navigator */}
        <div className="w-full xl:w-80 space-y-4">
          <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
            <div className="flex items-center gap-2 mb-3">
              <BarChart3 size={16} className="text-gray-500" />
              <h3 className="font-medium text-gray-800">Question Navigator</h3>
            </div>

            {/* Stats Summary Cards */}
            <div className="grid grid-cols-4 gap-2 mb-4 pb-3 border-b border-gray-100 text-center text-xs">
              <div className="bg-gray-100 rounded-lg py-1.5">
                <span className="text-gray-500">Total</span>
                <p className="font-semibold text-gray-800">{totalQuestions}</p>
              </div>
              <div className="bg-emerald-50 rounded-lg py-1.5">
                <span className="text-emerald-600">Correct</span>
                <p className="font-semibold text-emerald-700">{correctCount}</p>
              </div>
              <div className="bg-red-50 rounded-lg py-1.5">
                <span className="text-red-600">Incorrect</span>
                <p className="font-semibold text-red-700">{incorrectCount}</p>
              </div>
              <div className="bg-amber-50 rounded-lg py-1.5">
                <span className="text-amber-600">Marked</span>
                <p className="font-semibold text-amber-700">{Object.keys(markedForReview).length}</p>
              </div>
            </div>

            {/* Question Grid */}
            <div className="grid grid-cols-5 gap-1.5 max-h-64 overflow-y-auto pb-1 pr-1">
              {questions.map((_, idx) => {
                const status = getQuestionStatus(idx);
                const isCorrect = answerStatus[questions[idx]?.id]?.isCorrect;
                let bgClass = "bg-gray-100 text-gray-600";
                if (status === "answered") {
                  bgClass = isCorrect ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-700";
                } else if (status === "marked") {
                  bgClass = "bg-amber-100 text-amber-700";
                }
                return (
                  <button
                    key={idx}
                    onClick={() => {
                      setCurrentIndex(idx);
                      setSelectedAnswer(answerStatus[questions[idx]?.id]?.selectedAnswer || null);
                      setShowResult(!!answerStatus[questions[idx]?.id]);
                    }}
                    className={`w-8 h-8 rounded-lg text-xs font-medium transition ${currentIndex === idx ? "ring-2 ring-gray-800 ring-offset-1 bg-gray-800 text-white" : bgClass} hover:opacity-80`}
                  >
                    {idx + 1}
                  </button>
                );
              })}
            </div>

            {/* Legend */}
            <div className="mt-3 pt-2 border-t border-gray-100 text-xs text-gray-500 flex flex-wrap gap-3">
              <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span> Correct</span>
              <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-red-500"></span> Incorrect</span>
              <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span> Marked</span>
              <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-gray-300"></span> Unanswered</span>
            </div>
          </div>
        </div>
      </div>

      {/* AI Assistant Modal */}
      {isAIOpen && (
        <>
          <div className="fixed inset-0 bg-black/50 z-40" onClick={() => setIsAIOpen(false)} />
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
            <div className="bg-white rounded-xl border border-gray-200 shadow-xl w-full max-w-lg pointer-events-auto">
              {/* Header */}
              <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-gray-50 rounded-t-xl">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-gray-800 rounded-lg flex items-center justify-center">
                    <Bot size={16} className="text-white" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">AI Study Assistant</h3>
                    <p className="text-gray-500 text-xs">Ask about this question</p>
                  </div>
                </div>
                <button onClick={() => setIsAIOpen(false)} className="text-gray-400 hover:text-gray-600 transition">
                  <XCircle size={20} />
                </button>
              </div>

              {/* Body */}
              <div className="p-4 max-h-[60vh] overflow-y-auto">
                {/* Current Question Context */}
                <div className="bg-gray-50 rounded-lg p-3 mb-4 text-sm text-gray-700 border border-gray-200">
                  <p className="font-medium text-gray-800 mb-1">Current Question:</p>
                  <p className="text-gray-600">{currentQuestion?.text}</p>
                </div>

                {/* Chat History */}
                {aiHistory.length > 0 && (
                  <div className="mb-4 space-y-2 max-h-28 overflow-y-auto">
                    <p className="text-xs font-medium text-gray-500">Recent Questions</p>
                    {aiHistory.map((item, idx) => (
                      <div key={idx} className="bg-gray-50 rounded-lg p-2 text-xs border border-gray-200">
                        <p className="text-gray-700 font-medium">Q: {item.question.substring(0, 60)}...</p>
                        <p className="text-gray-500 mt-1">A: {item.answer.substring(0, 80)}...</p>
                      </div>
                    ))}
                  </div>
                )}

                {/* Input Area */}
                <div className="flex gap-2 mb-3">
                  <input
                    type="text"
                    value={aiQuestion}
                    onChange={(e) => setAiQuestion(e.target.value)}
                    placeholder="Ask about this question..."
                    className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-1 focus:ring-gray-800 focus:border-gray-800 outline-none bg-white"
                    onKeyPress={(e) => e.key === "Enter" && handleAskAI()}
                    autoFocus
                  />
                  <button
                    onClick={handleAskAI}
                    disabled={aiLoading || !aiQuestion.trim()}
                    className="px-3 py-2 bg-gray-800 text-white rounded-lg text-sm font-medium hover:bg-gray-900 transition disabled:opacity-50"
                  >
                    {aiLoading ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
                  </button>
                </div>

                {/* AI Response */}
                {aiLoading && (
                  <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 bg-gray-200 rounded-full flex items-center justify-center">
                        <Bot size={12} className="text-gray-500" />
                      </div>
                      <div className="flex-1">
                        <div className="h-2 bg-gray-200 rounded-full w-3/4 animate-pulse mb-1"></div>
                        <div className="h-2 bg-gray-200 rounded-full w-1/2 animate-pulse"></div>
                      </div>
                    </div>
                    <p className="text-xs text-gray-500 mt-2">Thinking...</p>
                  </div>
                )}

                {aiResponse && !aiLoading && (
                  <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                    <div className="flex items-start gap-2">
                      <div className="w-6 h-6 bg-gray-800 rounded-full flex items-center justify-center shrink-0">
                        <Bot size={12} className="text-white" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm text-gray-800 leading-relaxed">{aiResponse}</p>
                      </div>
                    </div>
                    <button onClick={clearAI} className="mt-2 text-xs text-gray-500 hover:text-gray-700 transition">
                      Clear
                    </button>
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="px-4 py-2 border-t border-gray-200 bg-gray-50 rounded-b-xl">
                <p className="text-xs text-gray-500">💡 Tip: Ask "Why is this answer correct?"</p>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default StudentPracticeMode;