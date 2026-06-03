import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Clock, AlertCircle, CheckCircle, XCircle } from 'lucide-react';
import api from '../api/axios';

const StudentMockExam = () => {
  const { deptId, courseId } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [examStarted, setExamStarted] = useState(false);
  const [examSubmitted, setExamSubmitted] = useState(false);
  const [course, setCourse] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState({});
  const [timeLeft, setTimeLeft] = useState(0);
  const [result, setResult] = useState(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  useEffect(() => {
    const fetchExamData = async () => {
      try {
        const token = localStorage.getItem('token');
        const courseRes = await api.get(`/student/courses/${courseId}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setCourse(courseRes.data);
      } catch (error) {
        console.error('Error:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchExamData();
  }, [courseId]);

  useEffect(() => {
    let timer;
    if (examStarted && !examSubmitted && timeLeft > 0) {
      timer = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            (async () => {
              await handleSubmitExam();
            })();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [examStarted, examSubmitted, timeLeft]);

  const startExam = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const { data } = await api.post(
        `/student/courses/${courseId}/mock-exam/start`,
        {},
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      setQuestions(data.questions || []);
      setTimeLeft(data.timeLimit || 0);
      setExamStarted(true);
    } catch (error) {
      console.error('Error starting exam:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAnswerSelect = (questionId, answer) => {
    setAnswers((prev) => ({ ...prev, [questionId]: answer }));
  };

  const handleSubmitExam = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const { data } = await api.post(
        `/student/mock-exam/submit`,
        {
          courseId,
          answers,
        },
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      setResult(data);
      setExamSubmitted(true);
      setShowConfirmModal(false);
    } catch (error) {
      console.error('Error submitting exam:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const answeredCount = Object.keys(answers).length;

  if (loading && !examStarted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (!examStarted) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-8">
          <div className="text-center">
            <Clock className="w-16 h-16 text-indigo-600 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">{course?.title} Mock Exam</h2>
            <div className="bg-gray-50 rounded-lg p-4 mb-6 text-left">
              <p className="text-sm text-gray-600 mb-2">📋 Total Questions: 50</p>
              <p className="text-sm text-gray-600 mb-2">⏱️ Time Limit: 60 minutes</p>
              <p className="text-sm text-gray-600 mb-2">✅ Passing Score: 60%</p>
              <p className="text-sm text-gray-600">⚠️ You cannot pause once started</p>
            </div>
            <button
              onClick={startExam}
              className="w-full bg-indigo-600 text-white py-3 rounded-lg font-semibold hover:bg-indigo-700"
            >
              Start Exam
            </button>
            <button
              onClick={() => navigate(`/student/departments/${deptId}/courses`)}
              className="w-full mt-3 border border-gray-300 text-gray-700 py-3 rounded-lg font-semibold hover:bg-gray-50"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (examSubmitted && result) {
    const passed = result.score >= 60;
    return (
      <div className="min-h-screen bg-gray-50 py-8 px-4">
        <div className="max-w-3xl mx-auto">
          <div className={`bg-white rounded-lg shadow-xl p-8 text-center mb-6 ${
            passed ? 'border-b-4 border-green-500' : 'border-b-4 border-red-500'
          }`}>
            {passed ? (
              <CheckCircle className="w-20 h-20 text-green-500 mx-auto mb-4" />
            ) : (
              <XCircle className="w-20 h-20 text-red-500 mx-auto mb-4" />
            )}
            <h2 className="text-3xl font-bold mb-2">
              {passed ? 'Congratulations!' : 'Need More Practice'}
            </h2>
            <p className="text-gray-600 mb-4">
              You scored {result.score}% ({result.correctCount}/{result.totalCount})
            </p>
            <div className="w-full bg-gray-200 rounded-full h-4 mb-6">
              <div
                className={`h-4 rounded-full ${passed ? 'bg-green-500' : 'bg-red-500'}`}
                style={{ width: `${result.score}%` }}
              />
            </div>
            <button
              onClick={() => navigate(`/student/departments/${deptId}/courses`)}
              className="bg-indigo-600 text-white px-6 py-2 rounded-lg hover:bg-indigo-700"
            >
              Back to Courses
            </button>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-xl font-bold mb-4">Detailed Results</h3>
            {(result.results || []).map((q, idx) => (
              <div key={idx} className={`border-l-4 p-4 mb-3 ${
                q.isCorrect ? 'border-green-500 bg-green-50' : 'border-red-500 bg-red-50'
              }`}>
                <p className="font-medium mb-2">{q.text}</p>
                <p className="text-sm">Your answer: {q.userAnswer}</p>
                <p className="text-sm">Correct answer: {q.correctAnswer}</p>
                {!q.isCorrect && (
                  <p className="text-sm text-gray-600 mt-2">{q.explanation}</p>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="fixed top-0 left-0 right-0 bg-white shadow-md z-10">
        <div className="max-w-7xl mx-auto px-4 py-3">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="font-semibold">{course?.title} Mock Exam</h3>
              <p className="text-sm text-gray-600">Answered: {answeredCount}/{questions.length}</p>
            </div>
            <div className={`flex items-center gap-2 text-xl font-bold ${
              timeLeft < 300 ? 'text-red-600' : 'text-indigo-600'
            }`}>
              <Clock size={24} />
              {formatTime(timeLeft)}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 pt-20 pb-8">
        {questions.map((q, idx) => (
          <div key={q.id} className="bg-white rounded-lg shadow p-6 mb-4">
            <div className="flex justify-between items-start mb-4">
              <span className="text-sm text-gray-500">Question {idx + 1} of {questions.length}</span>
            </div>
            <p className="text-lg font-medium mb-4">{q.text}</p>
            <div className="space-y-3">
              {['A', 'B', 'C', 'D'].map((opt) => (
                <label
                  key={opt}
                  className={`flex items-center p-3 border rounded-lg cursor-pointer transition ${
                    answers[q.id] === opt ? 'border-indigo-600 bg-indigo-50' : 'border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  <input
                    type="radio"
                    name={`q-${q.id}`}
                    value={opt}
                    checked={answers[q.id] === opt}
                    onChange={() => handleAnswerSelect(q.id, opt)}
                    className="mr-3"
                  />
                  <span className="font-semibold mr-2">{opt}.</span>
                  {q.options?.[opt]}
                </label>
              ))}
            </div>
          </div>
        ))}

        <button
          onClick={() => setShowConfirmModal(true)}
          className="w-full bg-green-600 text-white py-4 rounded-lg font-bold text-lg hover:bg-green-700"
        >
          Submit Exam
        </button>
      </div>

      {showConfirmModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <AlertCircle className="w-12 h-12 text-yellow-500 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-center mb-2">Submit Exam?</h3>
            <p className="text-gray-600 text-center mb-4">
              You have answered {answeredCount} out of {questions.length} questions.
              {questions.length - answeredCount > 0 && ` ${questions.length - answeredCount} questions unanswered.`}
              This action cannot be undone.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowConfirmModal(false)}
                className="flex-1 border border-gray-300 py-2 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmitExam}
                className="flex-1 bg-green-600 text-white py-2 rounded-lg hover:bg-green-700"
              >
                Submit
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentMockExam;
