import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Award, Clock, AlertTriangle, Download, CheckCircle } from 'lucide-react';
import api from '../api/axios';

const StudentExitExam = () => {
  const { deptId } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [examStarted, setExamStarted] = useState(false);
  const [examSubmitted, setExamSubmitted] = useState(false);
  const [department, setDepartment] = useState(null);
  const [sections, setSections] = useState([]);
  const [currentSection, setCurrentSection] = useState(0);
  const [answers, setAnswers] = useState({});
  const [timeLeft, setTimeLeft] = useState(0);
  const [result, setResult] = useState(null);

  useEffect(() => {
    fetchExitExamData();
  }, []);

  useEffect(() => {
    let timer;
    if (examStarted && !examSubmitted && timeLeft > 0) {
      timer = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            handleSubmitExam();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [examStarted, examSubmitted, timeLeft]);

  const fetchExitExamData = async () => {
    try {
      const token = localStorage.getItem('token');
      const deptRes = await api.get(`/student/departments/${deptId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setDepartment(deptRes.data);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const startExitExam = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const { data } = await api.post(
        `/student/departments/${deptId}/exit-exam/start`,
        {},
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      setSections(data.sections || []);
      setTimeLeft(data.totalTime || 0);
      setExamStarted(true);
    } catch (error) {
      console.error('Error starting exit exam:', error);
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
        `/student/exit-exam/submit`,
        {
          departmentId: deptId,
          answers,
        },
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      setResult(data);
      setExamSubmitted(true);
    } catch (error) {
      console.error('Error submitting exit exam:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (seconds) => {
    const hours = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const currentSectionData = sections[currentSection] || {};
  const sectionQuestions = currentSectionData.questions || [];
  const sectionAnswered = sectionQuestions.filter((q) => answers[q.id]).length;

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
        <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full p-8">
          <div className="text-center">
            <Award className="w-20 h-20 text-indigo-600 mx-auto mb-4" />
            <h2 className="text-3xl font-bold text-gray-900 mb-2">Exit Exam</h2>
            <p className="text-gray-600 mb-6">{department?.name} Department</p>

            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6 text-left">
              <h3 className="font-bold text-yellow-800 mb-2">⚠️ Important Information</h3>
              <ul className="text-sm text-yellow-700 space-y-1">
                <li>• Covers ALL 15 courses in this department</li>
                <li>• 150 total questions (10 questions per course)</li>
                <li>• Time limit: 3 hours (180 minutes)</li>
                <li>• Passing score: 50%</li>
                <li>• You cannot go back to previous sections</li>
                <li>• Certificate will be issued upon passing</li>
              </ul>
            </div>

            <button
              onClick={startExitExam}
              className="w-full bg-indigo-600 text-white py-3 rounded-lg font-semibold hover:bg-indigo-700"
            >
              Start Exit Exam
            </button>
            <button
              onClick={() => navigate(`/student/departments/${deptId}/courses`)}
              className="w-full mt-3 border border-gray-300 text-gray-700 py-3 rounded-lg font-semibold hover:bg-gray-50"
            >
              Back to Courses
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (examSubmitted && result) {
    const passed = result.score >= 50;
    return (
      <div className="min-h-screen bg-gray-50 py-8 px-4">
        <div className="max-w-4xl mx-auto">
          <div className={`bg-white rounded-lg shadow-xl p-8 text-center mb-6 ${
            passed ? 'border-b-4 border-green-500' : 'border-b-4 border-red-500'
          }`}>
            {passed ? (
              <CheckCircle className="w-20 h-20 text-green-500 mx-auto mb-4" />
            ) : (
              <AlertTriangle className="w-20 h-20 text-red-500 mx-auto mb-4" />
            )}
            <h2 className="text-3xl font-bold mb-2">
              {passed ? 'Exit Exam Passed!' : 'Exit Exam Failed'}
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
            {passed && result.certificateUrl && (
              <button
                onClick={() => window.open(result.certificateUrl)}
                className="inline-flex items-center gap-2 bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700"
              >
                <Download size={18} />
                Download Certificate
              </button>
            )}
            <button
              onClick={() => navigate(`/student/departments/${deptId}/courses`)}
              className={`ml-3 ${passed ? 'bg-gray-600' : 'bg-indigo-600'} text-white px-6 py-2 rounded-lg hover:bg-opacity-90`}
            >
              Back to Courses
            </button>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-xl font-bold mb-4">Performance by Course</h3>
            {(result.sectionResults || []).map((section, idx) => (
              <div key={idx} className="mb-4">
                <div className="flex justify-between text-sm mb-1">
                  <span>{section.courseName}</span>
                  <span>{section.score}% ({section.correctCount}/{section.totalCount})</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full ${section.score >= 50 ? 'bg-green-500' : 'bg-red-500'}`}
                    style={{ width: `${section.score}%` }}
                  />
                </div>
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
              <h3 className="font-semibold">Exit Exam - {department?.name}</h3>
              <p className="text-sm text-gray-600">
                Section {currentSection + 1} of {sections.length}: {currentSectionData?.courseName}
              </p>
            </div>
            <div className={`flex items-center gap-2 text-xl font-bold ${
              timeLeft < 600 ? 'text-red-600' : 'text-indigo-600'
            }`}>
              <Clock size={24} />
              {formatTime(timeLeft)}
            </div>
          </div>
          <div className="mt-2">
            <div className="flex justify-between text-sm mb-1">
              <span>Progress</span>
              <span>{sectionAnswered}/{sectionQuestions.length} answered in this section</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-indigo-600 h-2 rounded-full"
                style={{ width: `${sectionQuestions.length === 0 ? 0 : (sectionAnswered / sectionQuestions.length) * 100}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 pt-28 pb-8">
        {sectionQuestions.map((q, idx) => (
          <div key={q.id} className="bg-white rounded-lg shadow p-6 mb-4">
            <p className="font-medium mb-4">{idx + 1}. {q.text}</p>
            <div className="space-y-3">
              {['A', 'B', 'C', 'D'].map((opt) => (
                <label
                  key={opt}
                  className={`flex items-center p-3 border rounded-lg cursor-pointer transition ${
                    answers[q.id] === opt
                      ? 'border-indigo-600 bg-indigo-50'
                      : 'border-gray-300 hover:bg-gray-50'
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

        <div className="flex gap-3">
          {currentSection > 0 && (
            <button
              onClick={() => setCurrentSection((prev) => prev - 1)}
              className="flex-1 border border-gray-300 py-3 rounded-lg font-semibold hover:bg-gray-50"
            >
              Previous Section
            </button>
          )}
          {currentSection < sections.length - 1 ? (
            <button
              onClick={() => setCurrentSection((prev) => prev + 1)}
              className="flex-1 bg-indigo-600 text-white py-3 rounded-lg font-semibold hover:bg-indigo-700"
            >
              Next Section
            </button>
          ) : (
            <button
              onClick={() => {
                if (window.confirm('Submit Exit Exam? This action cannot be undone.')) {
                  handleSubmitExam();
                }
              }}
              className="flex-1 bg-green-600 text-white py-3 rounded-lg font-semibold hover:bg-green-700"
            >
              Submit Exit Exam
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default StudentExitExam;
