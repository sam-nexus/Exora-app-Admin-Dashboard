import { useEffect, useMemo, useState } from 'react';
import { getUserId } from '../utils/auth';
import api from '../api/axios';
import { Loader2, CheckCircle2, BookOpen, ArrowRight, CircleCheck } from 'lucide-react';

const StudentPractice = () => {
  const userId = getUserId();
  const [courses, setCourses] = useState([]);
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState('');
  const [answers, setAnswers] = useState({});
  const [feedback, setFeedback] = useState(null);
  const [loadingCourses, setLoadingCourses] = useState(true);
  const [loadingQuestions, setLoadingQuestions] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchCourses = async () => {
      try {
        const { data } = await api.get(`/courses/user/${userId}`);
        setCourses(data.filter((course) => !course.is_locked));
      } catch (err) {
        setError(err.response?.data?.error || 'Unable to load courses');
      } finally {
        setLoadingCourses(false);
      }
    };

    if (userId) fetchCourses();
  }, [userId]);

  const selectedCourseDetails = useMemo(
    () => courses.find((course) => course.course_id === selectedCourse),
    [courses, selectedCourse]
  );

  const loadQuestions = async (courseId) => {
    setSelectedCourse(courseId);
    setQuestions([]);
    setCurrentQuestionIndex(0);
    setSelectedAnswer('');
    setAnswers({});
    setFeedback(null);
    setError('');
    setLoadingQuestions(true);

    try {
      const { data } = await api.get('/questions', {
        params: { course_id: courseId },
      });
      setQuestions(data || []);
    } catch (err) {
      setError(err.response?.data?.error || 'Unable to load practice questions');
    } finally {
      setLoadingQuestions(false);
    }
  };

  const currentQuestion = questions[currentQuestionIndex];
  const completedCount = Object.keys(answers).length;
  const score = Object.values(answers).filter((answer) => answer === true).length;

  const submitAnswer = () => {
    if (!currentQuestion || !selectedAnswer) return;

    const correctAnswer = currentQuestion.correct_answer ?? currentQuestion.answer ?? '';
    const isCorrect = selectedAnswer === correctAnswer;

    setAnswers((prev) => ({
      ...prev,
      [currentQuestion.id]: isCorrect,
    }));
    setFeedback({ isCorrect, correctAnswer });
  };

  const goNextQuestion = () => {
    setSelectedAnswer('');
    setFeedback(null);
    setCurrentQuestionIndex((prev) => Math.min(prev + 1, questions.length - 1));
  };

  const goPreviousQuestion = () => {
    setSelectedAnswer('');
    setFeedback(null);
    setCurrentQuestionIndex((prev) => Math.max(prev - 1, 0));
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-slate-900">Practice Questions</h1>
        <p className="text-slate-500 mt-2">Choose a course and answer questions one-by-one for exam preparation.</p>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <div className="rounded-3xl bg-white p-6 shadow-sm border border-slate-200">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="text-xl font-semibold text-slate-900">Available courses</h2>
              <p className="text-sm text-slate-500">Only unlocked courses are shown here.</p>
            </div>
            <div className="inline-flex items-center gap-2 rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700">
              <CheckCircle2 size={16} /> Unlocked
            </div>
          </div>

          {loadingCourses ? (
            <div className="flex items-center gap-2 text-slate-500">
              <Loader2 size={18} className="animate-spin" /> Loading unlocked courses...
            </div>
          ) : courses.length === 0 ? (
            <p className="text-slate-600">No unlocked courses available yet. Unlock a course to start practice.</p>
          ) : (
            <div className="space-y-3">
              {courses.map((course) => (
                <button
                  key={course.course_id}
                  type="button"
                  onClick={() => loadQuestions(course.course_id)}
                  className={`w-full rounded-3xl border p-4 text-left transition ${selectedCourse === course.course_id ? 'border-indigo-500 bg-indigo-50' : 'border-slate-200 bg-slate-50 hover:border-slate-300'}`}
                >
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="font-semibold text-slate-900">{course.courses?.name || 'Course'}</p>
                      <p className="text-sm text-slate-500">Department: {course.courses?.department_id || 'N/A'}</p>
                    </div>
                    <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700">
                      Practice
                    </span>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="rounded-3xl bg-white p-6 shadow-sm border border-slate-200">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="text-xl font-semibold text-slate-900">Practice session</h2>
              <p className="text-sm text-slate-500">Work through questions and track your score.</p>
            </div>
            <div className="text-right">
              <p className="text-sm text-slate-500">Completed</p>
              <p className="text-lg font-semibold text-slate-900">{completedCount}/{questions.length}</p>
            </div>
          </div>

          {selectedCourse ? (
            loadingQuestions ? (
              <div className="flex items-center gap-2 text-slate-500">
                <Loader2 size={18} className="animate-spin" /> Loading questions...
              </div>
            ) : error ? (
              <p className="text-sm text-rose-600">{error}</p>
            ) : questions.length === 0 ? (
              <p className="text-slate-600">No questions found for this course yet.</p>
            ) : (
              <div className="space-y-5">
                <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
                  <div className="flex items-center justify-between gap-3 mb-4">
                    <div>
                      <p className="text-sm text-slate-500">Course</p>
                      <p className="font-semibold text-slate-900">{selectedCourseDetails?.courses?.name || 'Selected course'}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-slate-500">Progress</p>
                      <p className="font-semibold text-slate-900">{questions.length === 0 ? 0 : Math.round((currentQuestionIndex / questions.length) * 100)}%</p>
                    </div>
                  </div>

                  <div className="rounded-3xl bg-white p-5 border border-slate-200">
                    <p className="text-sm text-slate-500">Question {currentQuestionIndex + 1} of {questions.length}</p>
                    <p className="mt-3 text-lg font-semibold text-slate-900">{currentQuestion?.question_text}</p>
                  </div>
                </div>

                <div className="space-y-3">
                  {currentQuestion?.options?.map((option, index) => {
                    const isSelected = selectedAnswer === option;
                    return (
                      <button
                        key={index}
                        type="button"
                        onClick={() => setSelectedAnswer(option)}
                        className={`w-full rounded-3xl border p-4 text-left transition ${isSelected ? 'border-indigo-500 bg-indigo-50' : 'border-slate-200 bg-white hover:border-slate-300'}`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-medium text-slate-800">{String.fromCharCode(65 + index)}.</span>
                          <span className="ml-3 text-slate-700">{option}</span>
                        </div>
                      </button>
                    );
                  })}
                </div>

                {feedback && (
                  <div className={`rounded-3xl p-4 ${feedback.isCorrect ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-rose-50 border-rose-200 text-rose-800'}`}>
                    <div className="flex items-center gap-2 font-semibold">
                      <CircleCheck size={18} /> {feedback.isCorrect ? 'Correct answer!' : 'Incorrect answer.'}
                    </div>
                    {!feedback.isCorrect && (
                      <p className="mt-2 text-sm">Correct answer: <span className="font-semibold">{feedback.correctAnswer}</span></p>
                    )}
                  </div>
                )}

                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex gap-3">
                    <button
                      type="button"
                      onClick={goPreviousQuestion}
                      disabled={currentQuestionIndex === 0}
                      className="rounded-3xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      Previous
                    </button>
                    <button
                      type="button"
                      onClick={submitAnswer}
                      disabled={!selectedAnswer || feedback !== null}
                      className="rounded-3xl bg-indigo-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      Submit Answer
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={goNextQuestion}
                    disabled={currentQuestionIndex === questions.length - 1}
                    className="inline-flex items-center justify-center gap-2 rounded-3xl border border-indigo-500 bg-indigo-50 px-5 py-3 text-sm font-semibold text-indigo-700 transition hover:bg-indigo-100 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Next Question
                    <ArrowRight size={16} />
                  </button>
                </div>

                <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
                  <div className="flex items-center justify-between text-sm text-slate-600">
                    <span>Score</span>
                    <span>{score} / {questions.length}</span>
                  </div>
                </div>
              </div>
            )
          ) : (
            <div className="rounded-3xl border border-dashed border-slate-300 bg-slate-50 p-6 text-slate-600">
              <p className="font-medium text-slate-900">Choose a course to load practice questions.</p>
              <p className="mt-2 text-sm">Unlocked courses will appear here once fetched.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default StudentPractice;
