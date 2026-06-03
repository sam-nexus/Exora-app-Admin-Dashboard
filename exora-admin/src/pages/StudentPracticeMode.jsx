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
} from "lucide-react";
import api from "../api/axios";

const getPracticeCacheKey = (courseIdValue) =>
  `practice-cache:${courseIdValue}`;
const getPracticeProgressKey = (courseIdValue) =>
  `practice-progress:${courseIdValue}`;

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
      }),
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
      JSON.stringify({ ...progressState, savedAt: new Date().toISOString() }),
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

  // AI Agent States
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
              ? Math.min(
                  persistedProgress.currentIndex,
                  cached.questions.length - 1,
                )
              : 0,
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
          (item) => item.id.toString() === courseId,
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
            ? Math.min(
                persistedProgress.currentIndex,
                normalizedQuestions.length - 1,
              )
            : 0,
        );
        setSelectedAnswer(persistedProgress?.selectedAnswer || null);
        setShowResult(persistedProgress?.showResult || false);

        savePracticeCache(courseId, normalizedCourse, normalizedQuestions);
      } catch (error) {
        console.error("Error loading practice data:", error);
        if (!restoreFromCache()) {
          setFetchError(
            "Unable to load practice questions. Connect to the internet and try again.",
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
    (item) => item.isCorrect,
  ).length;
  const incorrectCount = answeredCount - correctCount;

  const handleAnswerSelect = (answer) => {
    if (showResult) return;
    setSelectedAnswer(answer);
  };

  const handleCheckAnswer = () => {
    if (!selectedAnswer || !currentQuestion) return;
    const isCorrect = selectedAnswer === currentQuestion.correctAnswer;
    const nextAnswerStatus = {
      ...answerStatus,
      [currentQuestion.id]: { selectedAnswer, isCorrect },
    };
    setAnswerStatus(nextAnswerStatus);
    setShowResult(true);
    saveCurrentProgress({
      answerStatus: nextAnswerStatus,
      showResult: true,
    });
  };

  const saveCurrentProgress = useCallback(
    (overrides = {}) => {
      if (!courseId) return;

      const answerStatusValue = overrides.answerStatus ?? answerStatus;
      const markedForReviewValue = overrides.markedForReview ?? markedForReview;
      const selectedAnswerValue = overrides.selectedAnswer ?? selectedAnswer;
      const showResultValue = overrides.showResult ?? showResult;
      const currentIndexValue = overrides.currentIndex ?? currentIndex;
      const questionCountValue = overrides.questionCount ?? questions.length;

      savePracticeProgress(courseId, {
        currentIndex: currentIndexValue,
        answerStatus: answerStatusValue,
        markedForReview: markedForReviewValue,
        selectedAnswer: selectedAnswerValue,
        showResult: showResultValue,
        questionCount: questionCountValue,
        answeredCount: Object.keys(answerStatusValue).length,
      });
    },
    [
      courseId,
      answerStatus,
      markedForReview,
      selectedAnswer,
      showResult,
      currentIndex,
      questions.length,
    ],
  );

  const handleClearProgress = () => {
    if (
      confirm("Are you sure you want to clear all progress for this course?")
    ) {
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

  // AI Agent Functions (Mock Data)
  const handleAskAI = async () => {
    if (!aiQuestion.trim()) return;

    setAiLoading(true);
    setAiResponse("");

    setTimeout(() => {
      const mockResponses = [
        "💡 This question is about the history of the Internet. ARPANET was the first packet-switching network developed by DOD in 1969. NSFNET later expanded it for academic use in 1986.",
        "🎯 The correct answer is B. ARPANET was military/research, NSFNET expanded access to universities and research institutions before commercialization.",
        "📚 Think about it: ARPANET came first (1969), then NSFNET (1986) connected supercomputers. The key difference is who funded them and who could use them.",
        "🔍 TCP/IP became standard in 1983. Both ARPANET and NSFNET eventually used TCP/IP, so option D is incorrect.",
        "✅ Simple explanation: ARPANET = Military/Research (DOD). NSFNET = Academic/Educational (Universities). They worked together to create today's Internet.",
      ];

      const randomResponse =
        mockResponses[Math.floor(Math.random() * mockResponses.length)];
      setAiResponse(randomResponse);

      setAiHistory((prev) =>
        [
          {
            question: aiQuestion,
            answer: randomResponse,
            timestamp: new Date(),
          },
          ...prev,
        ].slice(0, 5),
      );

      setAiLoading(false);
    }, 1500);
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

  const progress =
    totalQuestions === 0 ? 0 : ((currentIndex + 1) / totalQuestions) * 100;

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-3 text-gray-500 text-sm">
            Loading practice questions...
          </p>
        </div>
      </div>
    );
  }

  if (fetchError && questions.length === 0) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center px-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-lg border border-gray-100 p-6 text-center">
          <div className="w-14 h-14 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg
              className="w-7 h-7 text-red-500"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Unable to Load Practice
          </h3>
          <p className="text-sm text-gray-500 mb-5">{fetchError}</p>
          <button
            onClick={() => window.location.reload()}
            className="bg-indigo-600 text-white px-5 py-2 rounded-xl text-sm font-medium hover:bg-indigo-700 transition"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <button
          onClick={() => navigate(`/student/departments/${deptId}/courses`)}
          className="flex items-center gap-1.5 text-gray-500 hover:text-indigo-600 transition text-sm w-fit"
        >
          <ArrowLeft size={16} />
          <span>Back to Courses</span>
        </button>
        <button
          onClick={handleClearProgress}
          className="flex items-center justify-center gap-1.5 text-xs text-gray-500 hover:text-red-600 transition"
        >
          <Trash2 size={14} />
          Clear progress
        </button>
      </div>

      {/* Title */}
      <div>
        <h1 className="text-2xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
          Practice Mode
        </h1>
        <p className="text-gray-500 text-sm mt-0.5">
          Answer questions one by one to prepare for your exam
        </p>
      </div>

      {/* Online/Offline Status */}
      <div
        className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs ${isOnline ? "bg-green-50 text-green-700" : "bg-yellow-50 text-yellow-700"}`}
      >
        {isOnline ? <Wifi size={14} /> : <WifiOff size={14} />}
        <span>
          {isOnline
            ? "You are online. Progress is being saved."
            : "You are offline. Progress is saved locally."}
        </span>
      </div>

      {offlineMode && !isOnline && (
        <div className="bg-blue-50 text-blue-700 px-3 py-2 rounded-lg text-xs">
          Using cached questions. Your answers will sync when you're back
          online.
        </div>
      )}

      {/* Main Content */}
      <div className="flex flex-col xl:flex-row gap-6">
        {/* Question Area */}
        <div className="flex-1">
          {/* Progress Bar */}
          <div className="bg-white rounded-xl border border-gray-100 p-4 mb-5 shadow-sm">
            <div className="flex justify-between text-sm mb-2">
              <div>
                <span className="text-gray-500">{course?.title}</span>
                <p className="text-xs text-gray-400 mt-0.5">
                  Question {currentIndex + 1} of {totalQuestions}
                </p>
              </div>
              <div className="text-right">
                <span className="text-gray-500 text-xs">Progress</span>
                <p className="text-indigo-600 font-semibold">
                  {Math.round(progress)}%
                </p>
              </div>
            </div>
            <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-indigo-600 rounded-full transition-all"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>

          {/* Question Card */}
          <div className="bg-white rounded-xl border border-gray-100 overflow-hidden shadow-sm">
            <div className="px-5 py-3 bg-gray-50 border-b border-gray-100 flex justify-between items-center">
              <span className="text-sm font-medium text-gray-700">
                Question {currentIndex + 1}
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIsAIOpen(true)}
                  className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium transition bg-purple-100 text-purple-700 hover:bg-purple-200"
                  title="Ask AI Assistant"
                >
                  <Bot size={12} />
                  AI
                </button>
                <button
                  onClick={handleMarkForReview}
                  className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium transition ${
                    markedForReview[currentQuestion?.id]
                      ? "bg-yellow-100 text-yellow-700"
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
                  const isCorrect =
                    showResult && opt === currentQuestion?.correctAnswer;
                  const isWrong =
                    showResult &&
                    selectedAnswer === opt &&
                    opt !== currentQuestion?.correctAnswer;
                  const optIndex = opt.charCodeAt(0) - 65;
                  const optText = currentQuestion?.options?.[optIndex] || "";
                  const hasCode =
                    optText.includes("function") ||
                    optText.includes("{") ||
                    optText.includes("<");

                  return (
                    <button
                      key={opt}
                      onClick={() => handleAnswerSelect(opt)}
                      disabled={showResult}
                      className={`w-full text-left p-3 rounded-xl border transition-all ${
                        isSelected && !showResult
                          ? "border-indigo-400 bg-indigo-50"
                          : isCorrect
                            ? "border-green-400 bg-green-50"
                            : isWrong
                              ? "border-red-400 bg-red-50"
                              : "border-gray-200 hover:border-indigo-300 hover:bg-indigo-50/30"
                      }`}
                    >
                      <div className="flex gap-3">
                        <span
                          className={`font-medium text-sm w-6 ${isCorrect ? "text-green-600" : isWrong ? "text-red-600" : isSelected ? "text-indigo-600" : "text-gray-500"}`}
                        >
                          {opt}.
                        </span>
                        <div className="flex-1">
                          {hasCode ? (
                            <pre className="text-gray-700 text-sm font-mono whitespace-pre-wrap">
                              {optText}
                            </pre>
                          ) : (
                            <span className="text-gray-700 text-sm">
                              {optText}
                            </span>
                          )}
                        </div>
                        {isCorrect && (
                          <Check
                            size={16}
                            className="text-green-500 shrink-0"
                          />
                        )}
                        {isWrong && (
                          <X size={16} className="text-red-500 shrink-0" />
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Feedback */}
              {showResult && (
                <div
                  className={`p-3 rounded-xl mb-5 ${selectedAnswer === currentQuestion?.correctAnswer ? "bg-green-50 border border-green-100" : "bg-red-50 border border-red-100"}`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    {selectedAnswer === currentQuestion?.correctAnswer ? (
                      <Check size={16} className="text-green-600" />
                    ) : (
                      <X size={16} className="text-red-600" />
                    )}
                    <span
                      className={`font-medium text-sm ${selectedAnswer === currentQuestion?.correctAnswer ? "text-green-700" : "text-red-700"}`}
                    >
                      {selectedAnswer === currentQuestion?.correctAnswer
                        ? "Correct!"
                        : "Incorrect"}
                    </span>
                  </div>
                  <p className="text-gray-600 text-sm">
                    {currentQuestion?.explanation}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    Correct:{" "}
                    <span className="font-medium">
                      {currentQuestion?.correctAnswer}
                    </span>
                  </p>
                </div>
              )}

              {/* Buttons */}
              <div className="flex gap-3">
                {!showResult ? (
                  <button
                    onClick={handleCheckAnswer}
                    disabled={!selectedAnswer}
                    className={`flex-1 py-2.5 rounded-xl font-medium text-sm transition ${
                      selectedAnswer
                        ? "bg-indigo-600 text-white hover:bg-indigo-700"
                        : "bg-gray-100 text-gray-400 cursor-not-allowed"
                    }`}
                  >
                    Check Answer
                  </button>
                ) : (
                  <>
                    <button
                      onClick={handlePrevious}
                      disabled={currentIndex === 0}
                      className="px-5 py-2.5 border border-gray-200 rounded-xl hover:bg-gray-50 disabled:opacity-50"
                    >
                      <ChevronLeft size={18} />
                    </button>
                    <button
                      onClick={handleNext}
                      disabled={currentIndex === totalQuestions - 1}
                      className="flex-1 bg-indigo-600 text-white py-2.5 rounded-xl font-medium text-sm hover:bg-indigo-700 disabled:opacity-50"
                    >
                      Next <ChevronRight size={14} className="inline ml-1" />
                    </button>
                  </>
                )}
              </div>

              {/* Stats */}
              <div className="mt-5 pt-3 border-t border-gray-100 flex justify-between text-sm">
                <div className="flex gap-4">
                  <div>
                    <span className="text-gray-400 text-xs">Answered</span>
                    <p className="font-medium">
                      {answeredCount}/{totalQuestions}
                    </p>
                  </div>
                  <div>
                    <span className="text-gray-400 text-xs">Correct</span>
                    <p className="font-medium text-green-600">{correctCount}</p>
                  </div>
                  <div>
                    <span className="text-gray-400 text-xs">Incorrect</span>
                    <p className="font-medium text-red-600">{incorrectCount}</p>
                  </div>
                </div>
                <div>
                  <span className="text-gray-400 text-xs">Score</span>
                  <p className="font-medium text-indigo-600">
                    {totalQuestions
                      ? Math.round((correctCount / totalQuestions) * 100)
                      : 0}
                    %
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Sidebar - Question Navigator Only */}
        <div className="w-full xl:w-80 space-y-4">
          <div className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm">
            <h3 className="font-medium text-gray-800 mb-0.5 text-sm">
              Question Navigator
            </h3>
            <p className="text-xs text-gray-400 mb-3">Click to jump</p>

            <div className="grid grid-cols-4 gap-1.5 mb-4 pb-3 border-b border-gray-100 text-center text-xs">
              <div className="bg-gray-50 rounded-lg py-1.5">
                <span className="text-gray-500">Total</span>
                <p className="font-semibold">{totalQuestions}</p>
              </div>
              <div className="bg-green-50 rounded-lg py-1.5">
                <span className="text-green-600">Correct</span>
                <p className="font-semibold text-green-700">{correctCount}</p>
              </div>
              <div className="bg-red-50 rounded-lg py-1.5">
                <span className="text-red-600">Incorrect</span>
                <p className="font-semibold text-red-700">{incorrectCount}</p>
              </div>
              <div className="bg-yellow-50 rounded-lg py-1.5">
                <span className="text-yellow-600">Left</span>
                <p className="font-semibold text-yellow-700">
                  {totalQuestions - answeredCount}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-5 gap-1.5 max-h-72 overflow-y-auto pb-1 pr-1">
              {questions.map((_, idx) => {
                const status = getQuestionStatus(idx);
                const isCorrect = answerStatus[questions[idx]?.id]?.isCorrect;
                let bg = "bg-gray-100 text-gray-600";
                if (status === "answered")
                  bg = isCorrect
                    ? "bg-green-100 text-green-700"
                    : "bg-red-100 text-red-700";
                else if (status === "marked")
                  bg = "bg-yellow-100 text-yellow-700";
                return (
                  <button
                    key={idx}
                    onClick={() => {
                      setCurrentIndex(idx);
                      setSelectedAnswer(
                        answerStatus[questions[idx]?.id]?.selectedAnswer ||
                          null,
                      );
                      setShowResult(!!answerStatus[questions[idx]?.id]);
                    }}
                    className={`w-8 h-8 rounded-lg text-xs font-medium transition ${currentIndex === idx ? "ring-2 ring-indigo-500 ring-offset-1 bg-indigo-600 text-white" : bg} hover:opacity-80`}
                  >
                    {idx + 1}
                  </button>
                );
              })}
            </div>

            <div className="mt-4 pt-3 border-t border-gray-100 text-xs text-gray-500 flex flex-wrap gap-3">
              <span className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded-full bg-green-500"></span>{" "}
                Correct
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded-full bg-red-500"></span>{" "}
                Incorrect
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded-full bg-yellow-500"></span>{" "}
                Marked
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded-full bg-gray-300"></span>{" "}
                Unanswered
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* AI Assistant Floating Modal - z-index overlay */}
      {isAIOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/50 z-40"
            onClick={() => setIsAIOpen(false)}
          />

          {/* Modal */}
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
            <div className="bg-gradient-to-br from-purple-50 to-indigo-50 rounded-2xl border border-purple-200 shadow-2xl w-full max-w-lg pointer-events-auto animate-in fade-in zoom-in duration-200">
              {/* Header */}
              <div className="flex items-center justify-between p-5 border-b border-purple-200 bg-gradient-to-r from-purple-500 to-indigo-500 rounded-t-2xl">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-white/20 rounded-xl flex items-center justify-center">
                    <Sparkles size={16} className="text-white" />
                  </div>
                  <div>
                    <h3 className="font-bold text-white text-base">
                      AI Study Assistant
                    </h3>
                    <p className="text-purple-100 text-xs">
                      Powered by Exora AI
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setIsAIOpen(false)}
                  className="text-white/80 hover:text-white transition p-1"
                >
                  <XCircle size={20} />
                </button>
              </div>

              {/* Body */}
              <div className="p-5 max-h-[60vh] overflow-y-auto">
                <p className="text-xs text-gray-500 mb-4 flex items-center gap-1">
                  <MessageCircle size={12} />
                  Ask me to explain this question in a simpler way!
                </p>

                {/* Current Question Context */}
                <div className="bg-white rounded-xl p-3 mb-4 text-sm text-gray-700 border border-purple-100 shadow-sm">
                  <span className="font-semibold text-purple-600">
                    📖 Current Question:
                  </span>
                  <p className="mt-1 text-gray-600">{currentQuestion?.text}</p>
                </div>

                {/* Chat History */}
                {aiHistory.length > 0 && (
                  <div className="mb-4 space-y-2 max-h-32 overflow-y-auto">
                    <p className="text-xs font-medium text-gray-500">
                      Recent Questions
                    </p>
                    {aiHistory.map((item, idx) => (
                      <div
                        key={idx}
                        className="bg-white rounded-lg p-2 text-xs border border-purple-100"
                      >
                        <p className="text-purple-600 font-medium">
                          Q: {item.question.substring(0, 60)}...
                        </p>
                        <p className="text-gray-600 mt-1">
                          A: {item.answer.substring(0, 80)}...
                        </p>
                      </div>
                    ))}
                  </div>
                )}

                {/* Input Area */}
                <div className="flex gap-2 mb-4">
                  <input
                    type="text"
                    value={aiQuestion}
                    onChange={(e) => setAiQuestion(e.target.value)}
                    placeholder="Type your question here..."
                    className="flex-1 px-4 py-2.5 text-sm border border-purple-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white"
                    onKeyPress={(e) => e.key === "Enter" && handleAskAI()}
                    autoFocus
                  />
                  <button
                    onClick={handleAskAI}
                    disabled={aiLoading || !aiQuestion.trim()}
                    className="px-4 py-2.5 bg-gradient-to-r from-purple-500 to-indigo-500 text-white rounded-xl text-sm font-medium hover:shadow-lg transition disabled:opacity-50"
                  >
                    {aiLoading ? (
                      <Loader2 size={16} className="animate-spin" />
                    ) : (
                      <Send size={16} />
                    )}
                  </button>
                </div>

                {/* AI Response */}
                {aiLoading && (
                  <div className="bg-purple-50 rounded-xl p-4 border border-purple-200">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                        <Bot
                          size={16}
                          className="text-purple-500 animate-pulse"
                        />
                      </div>
                      <div className="flex-1">
                        <div className="h-2 bg-purple-200 rounded-full w-3/4 animate-pulse mb-2"></div>
                        <div className="h-2 bg-purple-200 rounded-full w-1/2 animate-pulse"></div>
                      </div>
                    </div>
                    <p className="text-xs text-purple-600 mt-2">
                      AI is thinking...
                    </p>
                  </div>
                )}

                {aiResponse && !aiLoading && (
                  <div className="bg-gradient-to-r from-purple-50 to-indigo-50 rounded-xl p-4 border border-purple-200">
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-indigo-500 rounded-full flex items-center justify-center flex-shrink-0">
                        <Bot size={14} className="text-white" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-800 mb-1">
                          AI Assistant says:
                        </p>
                        <p className="text-gray-700 text-sm leading-relaxed">
                          {aiResponse}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={clearAI}
                      className="mt-3 text-xs text-purple-500 hover:text-purple-700 transition"
                    >
                      Clear response
                    </button>
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="px-5 py-3 border-t border-purple-200 bg-white/50 rounded-b-2xl flex justify-between items-center">
                <p className="text-xs text-gray-400">
                  💡 Tip: Ask "Why is this answer correct?"
                </p>
                <button
                  onClick={() => setIsAIOpen(false)}
                  className="text-xs text-purple-600 hover:text-purple-700 font-medium"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default StudentPracticeMode;
