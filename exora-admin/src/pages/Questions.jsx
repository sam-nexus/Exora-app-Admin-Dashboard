import { useState, useEffect } from 'react';
import api from '../api/axios';
import { Eye, Trash2, Plus, Upload, X } from 'lucide-react';
import Modal from '../components/Modal';
import { motion } from 'framer-motion';

const Questions = () => {
  const [departments, setDepartments] = useState([]);
  const [selectedDept, setSelectedDept] = useState(null);
  const [courses, setCourses] = useState([]);
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [addModal, setAddModal] = useState(false);
  const [bulkModal, setBulkModal] = useState(false);
  const [questionForm, setQuestionForm] = useState({
    course_id: '',
    question_text: '',
    options: ['', '', '', ''],
    correct_index: 0,
    explanation: '',
  });
  const [bulkFile, setBulkFile] = useState(null);
  const [message, setMessage] = useState('');

  const fetchDepartments = async () => {
    const { data } = await api.get('/departments');
    setDepartments(data);
  };

  const fetchCourses = async (deptId) => {
    const { data } = await api.get(`/courses?department_id=${deptId}`);
    setCourses(data);
  };

  const fetchQuestions = async (courseId) => {
    const { data } = await api.get(`/questions?course_id=${courseId}`);
    setQuestions(data);
  };

  useEffect(() => { fetchDepartments(); }, []);

  const handleDepartmentClick = (dept) => {
    setSelectedDept(dept);
    setSelectedCourse(null);
    fetchCourses(dept.id);
  };

  const handleCourseSelect = (course) => {
    setSelectedCourse(course);
    setQuestionForm({ ...questionForm, course_id: course.id });
    fetchQuestions(course.id);
  };

  const handleAddQuestion = async (e) => {
    e.preventDefault();
    if (!questionForm.course_id) return;
    await api.post('/questions', questionForm);
    setAddModal(false);
    setQuestionForm({ course_id: selectedCourse.id, question_text: '', options: ['', '', '', ''], correct_index: 0, explanation: '' });
    fetchQuestions(selectedCourse.id);
    setMessage('Question added!');
    setTimeout(() => setMessage(''), 3000);
  };

  const handleDeleteQuestion = async (id) => {
    await api.delete(`/questions/${id}`);
    fetchQuestions(selectedCourse.id);
  };

  const handleDeleteAllQuestions = async () => {
    if (!window.confirm('Delete ALL questions for this course?')) return;
    await api.delete(`/questions/course/${selectedCourse.id}`);
    fetchQuestions(selectedCourse.id);
  };

  const handleBulkUpload = async () => {
    if (!bulkFile) return;
    const formData = new FormData();
    formData.append('file', bulkFile);
    await api.post('/questions/bulk', formData);
    setBulkModal(false);
    setBulkFile(null);
    fetchQuestions(selectedCourse.id);
    setMessage('Questions uploaded!');
    setTimeout(() => setMessage(''), 3000);
  };

  return (
    <div className="space-y-6">
      <h2 className="text-3xl font-bold text-gray-800">Questions Management</h2>

      {/* Department Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {departments.map(dept => (
          <motion.div
            key={dept.id}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            whileHover={{ scale: 1.02 }}
            className={`bg-white p-6 rounded-xl shadow-sm border cursor-pointer transition-colors ${selectedDept?.id === dept.id ? 'border-indigo-500 ring-2 ring-indigo-200' : 'border-gray-100 hover:border-indigo-200'}`}
            onClick={() => handleDepartmentClick(dept)}
          >
            <div className="text-4xl mb-3">{dept.icon || '📁'}</div>
            <h3 className="text-lg font-semibold text-gray-800">{dept.name}</h3>
            <p className="text-sm text-gray-500 mt-1">Click to manage questions</p>
          </motion.div>
        ))}
      </div>

      {/* Courses list of selected department */}
      {selectedDept && (
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
          <h3 className="text-xl font-semibold mb-4">Courses in {selectedDept.name}</h3>
          <div className="flex flex-wrap gap-2">
            {courses.map(course => (
              <button
                key={course.id}
                onClick={() => handleCourseSelect(course)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${selectedCourse?.id === course.id ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
              >
                {course.name}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Questions for selected course */}
      {selectedCourse && (
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-xl font-semibold">Questions for {selectedCourse.name}</h3>
            <div className="flex gap-2">
              <button onClick={() => setAddModal(true)} className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 text-sm">
                <Plus size={16} /> Add
              </button>
              <button onClick={() => setBulkModal(true)} className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 text-sm">
                <Upload size={16} /> Bulk
              </button>
              <button onClick={handleDeleteAllQuestions} className="flex items-center gap-2 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 text-sm">
                <Trash2 size={16} /> Delete All
              </button>
            </div>
          </div>
          {message && <div className="mb-3 text-green-600 bg-green-50 p-2 rounded">{message}</div>}
          {questions.length === 0 ? (
            <p className="text-gray-500">No questions yet.</p>
          ) : (
            <div className="space-y-4 max-h-96 overflow-y-auto">
              {questions.map((q, idx) => (
                <div key={q.id} className="p-4 border border-gray-200 rounded-lg">
                  <div className="flex justify-between">
                    <p className="font-medium">{idx+1}. {q.question_text}</p>
                    <button onClick={() => handleDeleteQuestion(q.id)} className="text-red-500 hover:text-red-700"><Trash2 size={18} /></button>
                  </div>
                  <ul className="mt-2 ml-4 space-y-1">
                    {q.options.map((opt, i) => (
                      <li key={i} className={`${i === q.correct_index ? 'text-green-600 font-semibold' : ''}`}>
                        {String.fromCharCode(65+i)}. {opt} {i === q.correct_index && '(Correct)'}
                      </li>
                    ))}
                  </ul>
                  {q.explanation && <p className="text-sm text-gray-500 mt-2">Explanation: {q.explanation}</p>}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Add Question Modal */}
      {addModal && (
        <Modal onClose={() => setAddModal(false)}>
          <h3 className="text-xl font-semibold mb-4">Add Question</h3>
          <form onSubmit={handleAddQuestion} className="space-y-3">
            <textarea
              value={questionForm.question_text}
              onChange={e => setQuestionForm({...questionForm, question_text: e.target.value})}
              placeholder="Question text"
              className="w-full p-2 border rounded"
              required
            />
            {questionForm.options.map((opt, idx) => (
              <input
                key={idx}
                value={opt}
                onChange={e => {
                  const newOpts = [...questionForm.options];
                  newOpts[idx] = e.target.value;
                  setQuestionForm({...questionForm, options: newOpts});
                }}
                placeholder={`Option ${idx+1}`}
                className="w-full p-2 border rounded"
                required
              />
            ))}
            <select
              value={questionForm.correct_index}
              onChange={e => setQuestionForm({...questionForm, correct_index: Number(e.target.value)})}
              className="w-full p-2 border rounded"
            >
              {questionForm.options.map((_, idx) => (
                <option key={idx} value={idx}>Correct: Option {idx+1}</option>
              ))}
            </select>
            <input
              value={questionForm.explanation}
              onChange={e => setQuestionForm({...questionForm, explanation: e.target.value})}
              placeholder="Explanation"
              className="w-full p-2 border rounded"
            />
            <div className="flex justify-end gap-2">
              <button type="button" onClick={() => setAddModal(false)} className="px-4 py-2 border rounded">Cancel</button>
              <button type="submit" className="px-4 py-2 bg-indigo-600 text-white rounded">Add</button>
            </div>
          </form>
        </Modal>
      )}

      {/* Bulk Upload Modal */}
      {bulkModal && (
        <Modal onClose={() => setBulkModal(false)}>
          <h3 className="text-xl font-semibold mb-4">Bulk Upload (CSV)</h3>
          <input type="file" accept=".csv" onChange={e => setBulkFile(e.target.files[0])} className="mb-4" />
          <div className="flex justify-end gap-2">
            <button onClick={() => setBulkModal(false)} className="px-4 py-2 border rounded">Cancel</button>
            <button onClick={handleBulkUpload} className="px-4 py-2 bg-green-600 text-white rounded" disabled={!bulkFile}>Upload</button>
          </div>
        </Modal>
      )}
    </div>
  );
};
export default Questions;