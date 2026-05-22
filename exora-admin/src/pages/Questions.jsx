import { useState, useEffect, useMemo } from 'react';
import api from '../api/axios';
import { Eye, Trash2, Edit, Plus, Upload, Search } from 'lucide-react';
import Modal from '../components/Modal';
import { motion } from 'framer-motion';

const Questions = () => {
  const [departments, setDepartments] = useState([]);
  const [courses, setCourses] = useState([]); // will be used later for filter
  const [selectedDept, setSelectedDept] = useState(null);
  const [deptCourses, setDeptCourses] = useState([]);
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterDept, setFilterDept] = useState('');
  const [filterCourse, setFilterCourse] = useState('');

  // Modals state
  const [addModal, setAddModal] = useState(false);
  const [editModal, setEditModal] = useState(false);
  const [bulkModal, setBulkModal] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const [selectedQuestion, setSelectedQuestion] = useState(null);

  // Form state for single add/edit
  const [form, setForm] = useState({
    question_text: '',
    optionA: '',
    optionB: '',
    optionC: '',
    optionD: '',
    correct_answer: 0,
    explanation: '',
  });

  // Bulk file
  const [bulkFile, setBulkFile] = useState(null);
  const [message, setMessage] = useState('');

  // Counts
  const [totalQuestions, setTotalQuestions] = useState(0);

  const fetchDepartments = async () => {
    const { data } = await api.get('/departments');
    setDepartments(data);
  };

  const fetchQuestionsForCourse = async (courseId) => {
    const { data } = await api.get(`/questions?course_id=${courseId}`);
    setQuestions(data);
  };

  const fetchTotalStats = async () => {
    // Use stats endpoint to get total questions count
    try {
      const { data } = await api.get('/stats');
      setTotalQuestions(data.questions || 0);
    } catch (e) { /* ignore */ }
  };

  useEffect(() => {
    fetchDepartments();
    fetchTotalStats();
  }, []);

  const handleViewDept = (dept) => {
    setSelectedDept(dept);
    setSelectedCourse(null);
    setQuestions([]);
    // Fetch courses for this department
    api.get(`/courses?department_id=${dept.id}`).then(res => setDeptCourses(res.data));
  };

  const handleViewCourse = (course) => {
    setSelectedCourse(course);
    fetchQuestionsForCourse(course.id);
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
    await api.post('/questions', payload);
    setAddModal(false);
    fetchQuestionsForCourse(selectedCourse.id);
    setMessage('Question added!');
    setTimeout(() => setMessage(''), 3000);
    // Reset form
    setForm({ question_text: '', optionA: '', optionB: '', optionC: '', optionD: '', correct_answer: 0, explanation: '' });
  };

  const handleEditQuestion = async (e) => {
    e.preventDefault();
    const options = [form.optionA, form.optionB, form.optionC, form.optionD];
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
  };

  const handleDeleteQuestion = async (id) => {
    await api.delete(`/questions/${id}`);
    fetchQuestionsForCourse(selectedCourse.id);
    setMessage('Question deleted.');
    setTimeout(() => setMessage(''), 3000);
  };

  const handleBulkUpload = async () => {
    if (!bulkFile || !selectedCourse) return;
    const formData = new FormData();
    formData.append('file', bulkFile);
    await api.post('/questions/bulk', formData);
    setBulkModal(false);
    setBulkFile(null);
    fetchQuestionsForCourse(selectedCourse.id);
    setMessage('Questions uploaded successfully!');
    setTimeout(() => setMessage(''), 3000);
  };

  // Filter departments
  const filteredDepts = useMemo(() => {
    if (!filterDept) return departments;
    return departments.filter(d => d.name.toLowerCase().includes(filterDept.toLowerCase()));
  }, [departments, filterDept]);

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
        <h2 className="text-3xl font-bold text-gray-800">Questions Management</h2>
      </motion.div>

      {/* Count Cards */}
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
          <p className="text-2xl font-bold text-gray-800">{courses.length}</p>
        </div>
      </div>

      {/* Search / Filter Bar */}
      <div className="flex items-center gap-4 flex-wrap">
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

      {/* Department Cards */}
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

      {/* Courses Grid for selected department */}
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

      {/* Questions Management for selected course */}
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
            </div>
          </div>
          {message && <div className="mb-3 text-green-600 bg-green-50 p-2 rounded">{message}</div>}
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
                      <button
                        onClick={() => {
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
                        }}
                        className="text-green-600 hover:text-green-800"
                      >
                        <Edit size={18} />
                      </button>
                      <button
                        onClick={() => handleDeleteQuestion(q.id)}
                        className="text-red-600 hover:text-red-800"
                      >
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

      {/* Add Question Modal */}
      {addModal && (
        <Modal onClose={() => setAddModal(false)}>
          <h3 className="text-xl font-semibold mb-4">Add Question</h3>
          <form onSubmit={handleAddQuestion} className="space-y-3">
            <textarea
              placeholder="Question text"
              value={form.question_text}
              onChange={e => setForm({...form, question_text: e.target.value})}
              className="w-full p-2 border rounded"
              required
            />
            <input
              placeholder="Choice A"
              value={form.optionA}
              onChange={e => setForm({...form, optionA: e.target.value})}
              className="w-full p-2 border rounded"
              required
            />
            <input
              placeholder="Choice B"
              value={form.optionB}
              onChange={e => setForm({...form, optionB: e.target.value})}
              className="w-full p-2 border rounded"
              required
            />
            <input
              placeholder="Choice C"
              value={form.optionC}
              onChange={e => setForm({...form, optionC: e.target.value})}
              className="w-full p-2 border rounded"
              required
            />
            <input
              placeholder="Choice D"
              value={form.optionD}
              onChange={e => setForm({...form, optionD: e.target.value})}
              className="w-full p-2 border rounded"
              required
            />
            <select
              value={form.correct_answer}
              onChange={e => setForm({...form, correct_answer: Number(e.target.value)})}
              className="w-full p-2 border rounded"
            >
              <option value={0}>Correct Answer: A</option>
              <option value={1}>Correct Answer: B</option>
              <option value={2}>Correct Answer: C</option>
              <option value={3}>Correct Answer: D</option>
            </select>
            <input
              placeholder="Explanation (optional)"
              value={form.explanation}
              onChange={e => setForm({...form, explanation: e.target.value})}
              className="w-full p-2 border rounded"
            />
            <div className="flex justify-end gap-2">
              <button type="button" onClick={() => setAddModal(false)} className="px-4 py-2 border rounded">Cancel</button>
              <button type="submit" className="px-4 py-2 bg-indigo-600 text-white rounded">Add</button>
            </div>
          </form>
        </Modal>
      )}

      {/* Edit Question Modal */}
      {editModal && selectedQuestion && (
        <Modal onClose={() => setEditModal(false)}>
          <h3 className="text-xl font-semibold mb-4">Edit Question</h3>
          <form onSubmit={handleEditQuestion} className="space-y-3">
            <textarea
              value={form.question_text}
              onChange={e => setForm({...form, question_text: e.target.value})}
              className="w-full p-2 border rounded"
              required
            />
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