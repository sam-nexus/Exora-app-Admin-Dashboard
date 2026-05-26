import { useState, useEffect } from 'react';
import api from '../api/axios';
import { Eye, Trash2, Edit, Plus, Upload, Search, Loader2 } from 'lucide-react';
import Modal from '../components/Modal';
import { motion } from 'framer-motion';

const Questions = () => {
  const [departments, setDepartments] = useState([]);
  const [selectedDept, setSelectedDept] = useState(null);
  const [deptCourses, setDeptCourses] = useState([]);
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterDept, setFilterDept] = useState('');

  const [addModal, setAddModal] = useState(false);
  const [editModal, setEditModal] = useState(false);
  const [bulkModal, setBulkModal] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const [selectedQuestion, setSelectedQuestion] = useState(null);

  const [form, setForm] = useState({
    question_text: '',
    optionA: '',
    optionB: '',
    optionC: '',
    optionD: '',
    correct_answer: 0,
    explanation: '',
  });

  const [bulkFile, setBulkFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState('');

  const [totalQuestions, setTotalQuestions] = useState(0);

  const fetchDepartments = async () => {
    try {
      const { data } = await api.get('/departments');
      setDepartments(data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchTotalStats = async () => {
    try {
      const { data } = await api.get('/stats');
      setTotalQuestions(data.questions || 0);
    } catch (e) {}
  };

  useEffect(() => {
    fetchDepartments();
    fetchTotalStats();
  }, []);

  const handleViewDept = (dept) => {
    setSelectedDept(dept);
    setSelectedCourse(null);
    setQuestions([]);
    api.get(`/courses?department_id=${dept.id}`).then(res => setDeptCourses(res.data));
  };

  const handleViewCourse = (course) => {
    setSelectedCourse(course);
    fetchQuestionsForCourse(course.id);
  };

  const fetchQuestionsForCourse = async (courseId) => {
    try {
      const { data } = await api.get(`/questions?course_id=${courseId}`);
      setQuestions(data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleAddQuestion = async (e) => {
    e.preventDefault();
    if (!selectedCourse) return;
    const options = [form.optionA, form.optionB, form.optionC, form.optionD];
    const payload = {
      course_id: selectedCourse.id,
      question_text: form.question_text,
      options,
      correct_index: form.correct_answer,
      explanation: form.explanation,
    };
    try {
      await api.post('/questions', payload);
      setAddModal(false);
      setForm({ question_text: '', optionA: '', optionB: '', optionC: '', optionD: '', correct_answer: 0, explanation: '' });
      fetchQuestionsForCourse(selectedCourse.id);
      setMessage('Question added!');
      setTimeout(() => setMessage(''), 3000);
    } catch (err) {
      setMessage(err.response?.data?.error || 'Failed to add question');
    }
  };

  const handleEditQuestion = async (e) => {
    e.preventDefault();
    const options = [form.optionA, form.optionB, form.optionC, form.optionD];
    try {
      await api.put(`/questions/${selectedQuestion.id}`, {
        question_text: form.question_text,
        options,
        correct_index: form.correct_answer,
        explanation: form.explanation,
      });
      setEditModal(false);
      fetchQuestionsForCourse(selectedCourse.id);
      setMessage('Question updated!');
      setTimeout(() => setMessage(''), 3000);
    } catch (err) {
      setMessage(err.response?.data?.error || 'Failed to update question');
    }
  };

  const handleDeleteQuestion = async (id) => {
    try {
      await api.delete(`/questions/${id}`);
      fetchQuestionsForCourse(selectedCourse.id);
      setMessage('Question deleted.');
      setTimeout(() => setMessage(''), 3000);
    } catch (err) {
      setMessage(err.response?.data?.error || 'Failed to delete question');
    }
  };

  const handleDeleteAllQuestions = async () => {
    if (!window.confirm('Delete ALL questions for this course?')) return;
    try {
      await api.delete(`/questions/course/${selectedCourse.id}`);
      fetchQuestionsForCourse(selectedCourse.id);
      setMessage('All questions deleted.');
      setTimeout(() => setMessage(''), 3000);
    } catch (err) {
      setMessage(err.response?.data?.error || 'Failed to delete questions');
    }
  };

  const handleBulkUpload = async () => {
    if (!bulkFile || !selectedCourse) return;
    setUploading(true);
    setMessage('');
    try {
      const formData = new FormData();
      formData.append('file', bulkFile);
      formData.append('course_id', selectedCourse.id);
      const res = await api.post('/questions/bulk', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setBulkModal(false);
      setBulkFile(null);
      fetchQuestionsForCourse(selectedCourse.id);
      setMessage(res.data.message || 'Questions uploaded successfully!');
    } catch (err) {
      const errorMsg = err.response?.data?.error || err.message || 'Upload failed';
      setMessage(`❌ ${errorMsg}`);
    } finally {
      setUploading(false);
      setTimeout(() => setMessage(''), 8000);
    }
  };

  const filteredDepts = departments.filter(d =>
    d.name?.toLowerCase().includes(filterDept.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
        <h2 className="text-3xl font-bold text-gray-800">Questions Management</h2>
      </motion.div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
          <p className="text-sm text-gray-500">Total Questions</p>
          <p className="text-2xl font-bold text-gray-800">{totalQuestions}</p>
        </div>
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
          <p className="text-sm text-gray-500">Departments</p>
          <p className="text-2xl font-bold text-gray-800">{departments.length}</p>
        </div>
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
          <p className="text-sm text-gray-500">Active Courses</p>
          <p className="text-2xl font-bold text-gray-800">{deptCourses.length}</p>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-md">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search departments..."
            value={filterDept}
            onChange={(e) => setFilterDept(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredDepts.map((dept) => (
          <motion.div
            key={dept.id}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            whileHover={{ scale: 1.02 }}
            className={`bg-white p-6 rounded-xl shadow-sm border cursor-pointer transition-colors ${selectedDept?.id === dept.id ? 'border-indigo-500 ring-2 ring-indigo-200' : 'border-gray-100 hover:border-indigo-200'}`}
            onClick={() => handleViewDept(dept)}
          >
            <div className="text-4xl mb-3">{dept.icon || '📁'}</div>
            <h3 className="text-lg font-semibold text-gray-800">{dept.name}</h3>
            <p className="text-sm text-gray-500 mt-1">Click to see courses</p>
          </motion.div>
        ))}
      </div>

      {selectedDept && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h3 className="text-xl font-semibold mb-4">Courses in {selectedDept.name}</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {deptCourses.map((course) => (
              <motion.div
                key={course.id}
                whileHover={{ scale: 1.02 }}
                className={`p-4 rounded-lg border cursor-pointer transition-colors ${selectedCourse?.id === course.id ? 'border-indigo-500 bg-indigo-50' : 'border-gray-200 hover:border-indigo-300'}`}
                onClick={() => handleViewCourse(course)}
              >
                <h4 className="font-medium text-gray-800">{course.name}</h4>
                <div className="mt-2 flex items-center text-indigo-600 text-sm">
                  <Eye size={16} className="mr-1" /> View Questions
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      )}

      {selectedCourse && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
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
          {message && <div className={`mb-3 p-2 rounded ${message.includes('❌') ? 'text-red-600 bg-red-50' : 'text-green-600 bg-green-50'}`}>{message}</div>}
          {questions.length === 0 ? (
            <p className="text-gray-500">No questions yet.</p>
          ) : (
            <div className="space-y-4 max-h-96 overflow-y-auto">
              {questions.map((q, idx) => (
                <div key={q.id} className="p-4 border border-gray-200 rounded-lg">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <p className="font-medium">{idx + 1}. {q.question_text}</p>
                      <ul className="mt-2 ml-4 space-y-1 text-sm">
                        {q.options.map((opt, i) => (
                          <li key={i} className={i === q.correct_index ? 'text-green-600 font-semibold' : ''}>
                            {String.fromCharCode(65 + i)}. {opt} {i === q.correct_index && '(✓)'}
                          </li>
                        ))}
                      </ul>
                      {q.explanation && (
                        <p className="text-sm text-gray-500 mt-1">Explanation: {q.explanation}</p>
                      )}
                    </div>
                    <div className="flex gap-2 ml-4">
                      <button onClick={() => {
                        setSelectedQuestion(q);
                        setForm({
                          question_text: q.question_text,
                          optionA: q.options[0] || '',
                          optionB: q.options[1] || '',
                          optionC: q.options[2] || '',
                          optionD: q.options[3] || '',
                          correct_answer: q.correct_index,
                          explanation: q.explanation || '',
                        });
                        setEditModal(true);
                      }} className="text-green-600 hover:text-green-800">
                        <Edit size={18} />
                      </button>
                      <button onClick={() => handleDeleteQuestion(q.id)} className="text-red-600 hover:text-red-800">
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </motion.div>
      )}

      {addModal && (
        <Modal onClose={() => setAddModal(false)}>
          <h3 className="text-xl font-semibold mb-4">Add Question</h3>
          <form onSubmit={handleAddQuestion} className="space-y-3">
            <textarea placeholder="Question text" value={form.question_text} onChange={e => setForm({...form, question_text: e.target.value})} className="w-full p-2 border rounded" required />
            <input placeholder="Choice A" value={form.optionA} onChange={e => setForm({...form, optionA: e.target.value})} className="w-full p-2 border rounded" required />
            <input placeholder="Choice B" value={form.optionB} onChange={e => setForm({...form, optionB: e.target.value})} className="w-full p-2 border rounded" required />
            <input placeholder="Choice C" value={form.optionC} onChange={e => setForm({...form, optionC: e.target.value})} className="w-full p-2 border rounded" required />
            <input placeholder="Choice D" value={form.optionD} onChange={e => setForm({...form, optionD: e.target.value})} className="w-full p-2 border rounded" required />
            <select value={form.correct_answer} onChange={e => setForm({...form, correct_answer: Number(e.target.value)})} className="w-full p-2 border rounded">
              <option value={0}>Correct Answer: A</option>
              <option value={1}>Correct Answer: B</option>
              <option value={2}>Correct Answer: C</option>
              <option value={3}>Correct Answer: D</option>
            </select>
            <input placeholder="Explanation (optional)" value={form.explanation} onChange={e => setForm({...form, explanation: e.target.value})} className="w-full p-2 border rounded" />
            <div className="flex justify-end gap-2">
              <button type="button" onClick={() => setAddModal(false)} className="px-4 py-2 border rounded">Cancel</button>
              <button type="submit" className="px-4 py-2 bg-indigo-600 text-white rounded">Add</button>
            </div>
          </form>
        </Modal>
      )}

      {editModal && selectedQuestion && (
        <Modal onClose={() => setEditModal(false)}>
          <h3 className="text-xl font-semibold mb-4">Edit Question</h3>
          <form onSubmit={handleEditQuestion} className="space-y-3">
            <textarea value={form.question_text} onChange={e => setForm({...form, question_text: e.target.value})} className="w-full p-2 border rounded" required />
            <input value={form.optionA} onChange={e => setForm({...form, optionA: e.target.value})} className="w-full p-2 border rounded" required />
            <input value={form.optionB} onChange={e => setForm({...form, optionB: e.target.value})} className="w-full p-2 border rounded" required />
            <input value={form.optionC} onChange={e => setForm({...form, optionC: e.target.value})} className="w-full p-2 border rounded" required />
            <input value={form.optionD} onChange={e => setForm({...form, optionD: e.target.value})} className="w-full p-2 border rounded" required />
            <select value={form.correct_answer} onChange={e => setForm({...form, correct_answer: Number(e.target.value)})} className="w-full p-2 border rounded">
              <option value={0}>A</option>
              <option value={1}>B</option>
              <option value={2}>C</option>
              <option value={3}>D</option>
            </select>
            <input value={form.explanation} onChange={e => setForm({...form, explanation: e.target.value})} className="w-full p-2 border rounded" />
            <div className="flex justify-end gap-2">
              <button type="button" onClick={() => setEditModal(false)} className="px-4 py-2 border rounded">Cancel</button>
              <button type="submit" className="px-4 py-2 bg-indigo-600 text-white rounded">Save</button>
            </div>
          </form>
        </Modal>
      )}

      {/* --- Updated Bulk Modal (JSON) --- */}
      {bulkModal && (
        <Modal onClose={() => setBulkModal(false)}>
          <h3 className="text-xl font-semibold mb-2">Bulk Upload (JSON)</h3>
          <p className="text-sm text-gray-500 mb-4">
            Upload a <code className="bg-gray-100 px-1 rounded">.json</code> file containing an array of questions.
          </p>
          <div className="bg-gray-50 p-3 rounded-lg text-xs text-gray-700 mb-4 font-mono overflow-auto max-h-32">
            {`[
  {
    "question": "What is ...?",
    "options": ["A", "B", "C", "D"],
    "correct_index": 0,
    "explanation": "Because ..."
  }
]`}
          </div>
          <input
            type="file"
            accept=".json"
            onChange={(e) => setBulkFile(e.target.files[0])}
            className="mb-4"
          />
          <div className="flex justify-end gap-2">
            <button onClick={() => setBulkModal(false)} className="px-4 py-2 border rounded">Cancel</button>
            <button
              onClick={handleBulkUpload}
              disabled={uploading || !bulkFile}
              className={`px-4 py-2 rounded text-white flex items-center gap-2 ${
                uploading ? 'bg-gray-400 cursor-not-allowed' : 'bg-green-600 hover:bg-green-700'
              }`}
            >
              {uploading ? (
                <>
                  <Loader2 size={16} className="animate-spin" /> Uploading...
                </>
              ) : (
                'Upload JSON'
              )}
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default Questions;