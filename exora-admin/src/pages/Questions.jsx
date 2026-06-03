import { useState, useEffect } from 'react';
import api from '../api/axios';
import { Eye, Trash2, Edit, Plus, Upload, Search, Loader2, Move, X, BookOpen, GraduationCap, FileQuestion, ChevronRight, Database, AlertCircle } from 'lucide-react';
import Modal from '../components/Modal';

const Questions = () => {
  const [departments, setDepartments] = useState([]);
  const [selectedDept, setSelectedDept] = useState(null);
  const [deptCourses, setDeptCourses] = useState([]);
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [filterDept, setFilterDept] = useState('');
  const [activeTab, setActiveTab] = useState('courses');
  const [tabCourses, setTabCourses] = useState([]);

  const [addModal, setAddModal] = useState(false);
  const [editModal, setEditModal] = useState(false);
  const [bulkModal, setBulkModal] = useState(false);
  const [moveModal, setMoveModal] = useState(false);
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

  const [courseEditForm, setCourseEditForm] = useState({
    name: '',
    type: 'regular',
    department_id: '',
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
    } catch (err) {
      console.error('Failed to fetch stats:', err);
    }
  };

  useEffect(() => {
    fetchDepartments();
    fetchTotalStats();
  }, []);

  useEffect(() => {
    const loadTabCourses = async () => {
      if (!selectedDept) return;
      try {
        let courseType = 'regular';
        if (activeTab === 'mock') courseType = 'mock';
        if (activeTab === 'exit') courseType = 'exit';
        const { data } = await api.get(`/courses?department_id=${selectedDept.id}&type=${courseType}`);
        setTabCourses(data || []);
      } catch (err) {
        console.error(`Error fetching ${activeTab} courses:`, err);
        setTabCourses([]);
      }
    };
    loadTabCourses();
  }, [activeTab, selectedDept]);

  const handleViewDept = (dept) => {
    setSelectedDept(dept);
    setSelectedCourse(null);
    setQuestions([]);
    setActiveTab('courses');
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
      setMessage('✅ Question added successfully!');
      setTimeout(() => setMessage(''), 3000);
    } catch (err) {
      setMessage('❌ ' + (err.response?.data?.error || 'Failed to add question'));
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
      setMessage('✅ Question updated!');
      setTimeout(() => setMessage(''), 3000);
    } catch (err) {
      setMessage('❌ ' + (err.response?.data?.error || 'Failed to update question'));
    }
  };

  const handleDeleteQuestion = async (id) => {
    if (!window.confirm('Delete this question?')) return;
    try {
      await api.delete(`/questions/${id}`);
      fetchQuestionsForCourse(selectedCourse.id);
      setMessage('🗑️ Question deleted.');
      setTimeout(() => setMessage(''), 3000);
    } catch (err) {
      setMessage('❌ ' + (err.response?.data?.error || 'Failed to delete question'));
    }
  };

  const handleDeleteAllQuestions = async () => {
    if (!window.confirm('⚠️ Delete ALL questions for this course? This cannot be undone.')) return;
    try {
      await api.delete(`/questions/course/${selectedCourse.id}`);
      fetchQuestionsForCourse(selectedCourse.id);
      setMessage('🗑️ All questions deleted.');
      setTimeout(() => setMessage(''), 3000);
    } catch (err) {
      setMessage('❌ ' + (err.response?.data?.error || 'Failed to delete questions'));
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
      setMessage('✅ ' + (res.data.message || 'Questions uploaded successfully!'));
    } catch (err) {
      const errorMsg = err.response?.data?.error || err.message || 'Upload failed';
      setMessage(`❌ ${errorMsg}`);
    } finally {
      setUploading(false);
      setTimeout(() => setMessage(''), 5000);
    }
  };

  const handleMoveCourse = (course) => {
    setCourseEditForm({
      name: course.name,
      type: course.type || 'regular',
      department_id: course.department_id,
    });
    setMoveModal(true);
  };

  const handleUpdateCourse = async (e) => {
    e.preventDefault();
    if (!selectedCourse) return;
    try {
      await api.put(`/courses/${selectedCourse.id}`, {
        name: courseEditForm.name,
        type: courseEditForm.type,
        department_id: courseEditForm.department_id,
      });
      setMoveModal(false);

      // If type changed, reload tab courses
      if (courseEditForm.type !== (selectedCourse.type || 'regular')) {
        let courseType = 'regular';
        if (activeTab === 'mock') courseType = 'mock';
        if (activeTab === 'exit') courseType = 'exit';
        const { data } = await api.get(
          `/courses?department_id=${selectedDept.id}&type=${courseType}`
        );
        setTabCourses(data || []);
        setSelectedCourse(null);
        setQuestions([]);
        setMessage('✅ Course type changed! Course removed from current tab.');
      } else {
        setSelectedCourse({
          ...selectedCourse,
          name: courseEditForm.name,
          type: courseEditForm.type,
          department_id: courseEditForm.department_id,
        });
        setMessage('✅ Course updated!');
      }
      setTimeout(() => setMessage(''), 3000);
    } catch (err) {
      setMessage('❌ ' + (err.response?.data?.error || 'Failed to update course'));
    }
  };

  const handleDeleteCourse = async (courseId) => {
    if (!window.confirm('⚠️ Delete this course and all its questions?')) return;
    try {
      await api.delete(`/courses/${courseId}`);
      setTabCourses(tabCourses.filter(c => c.id !== courseId));
      if (selectedCourse?.id === courseId) {
        setSelectedCourse(null);
        setQuestions([]);
      }
      setMessage('🗑️ Course deleted!');
      setTimeout(() => setMessage(''), 3000);
    } catch (err) {
      setMessage('❌ ' + (err.response?.data?.error || 'Failed to delete course'));
    }
  };

  const filteredDepts = departments.filter(d =>
    d.name?.toLowerCase().includes(filterDept.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
            Questions Management
          </h1>
          <p className="text-gray-500 text-sm mt-1">Manage department courses and exam questions</p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Total Questions</p>
              <p className="text-2xl font-bold text-indigo-600">{totalQuestions}</p>
            </div>
            <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center">
              <FileQuestion size={20} className="text-indigo-600" />
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Departments</p>
              <p className="text-2xl font-bold text-purple-600">{departments.length}</p>
            </div>
            <div className="w-10 h-10 bg-purple-50 rounded-xl flex items-center justify-center">
              <GraduationCap size={20} className="text-purple-600" />
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Active Courses</p>
              <p className="text-2xl font-bold text-green-600">{deptCourses.length}</p>
            </div>
            <div className="w-10 h-10 bg-green-50 rounded-xl flex items-center justify-center">
              <BookOpen size={20} className="text-green-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          placeholder="Search departments..."
          value={filterDept}
          onChange={(e) => setFilterDept(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
        />
      </div>

      {/* Departments Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredDepts.map((dept) => (
          <div
            key={dept.id}
            className={`bg-white rounded-xl shadow-sm border cursor-pointer transition-all hover:shadow-md ${
              selectedDept?.id === dept.id 
                ? 'border-indigo-500 ring-2 ring-indigo-200' 
                : 'border-gray-100 hover:border-indigo-200'
            }`}
            onClick={() => handleViewDept(dept)}
          >
            <div className="p-5">
              <div className="text-3xl mb-3">{dept.icon || '📚'}</div>
              <h3 className="text-lg font-semibold text-gray-800">{dept.name}</h3>
              <p className="text-xs text-gray-400 mt-1 flex items-center gap-1">
                Click to view courses <ChevronRight size={12} />
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Selected Department Section */}
      {selectedDept && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="bg-gradient-to-r from-indigo-600 to-purple-600 px-6 py-4">
            <h3 className="text-xl font-bold text-white">{selectedDept.name}</h3>
            <p className="text-indigo-100 text-sm">Manage courses and questions</p>
          </div>
          
          <div className="p-6">
            {/* Tabs */}
            <div className="flex gap-1 mb-6 border-b border-gray-200">
              {[
                { key: 'courses', label: '📚 Courses', icon: <BookOpen size={16} /> },
                { key: 'mock', label: '📝 Mock Exams', icon: <FileQuestion size={16} /> },
                { key: 'exit', label: '🎓 Exit Exams', icon: <GraduationCap size={16} /> },
              ].map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={`flex items-center gap-2 px-5 py-3 rounded-t-lg font-medium text-sm transition-all ${
                    activeTab === tab.key
                      ? 'bg-white text-indigo-600 border-t border-l border-r border-gray-200 shadow-sm'
                      : 'text-gray-500 hover:text-indigo-600'
                  }`}
                >
                  {tab.icon}
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Courses Grid */}
            {tabCourses.length === 0 ? (
              <div className="text-center py-12 bg-gray-50 rounded-xl">
                <Database size={48} className="text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500">No {activeTab === 'courses' ? 'courses' : activeTab === 'mock' ? 'mock exams' : 'exit exams'} found.</p>
                <p className="text-sm text-gray-400 mt-1">Add courses from the Courses page</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {tabCourses.map((course) => (
                  <div
                    key={course.id}
                    className={`p-4 rounded-xl border cursor-pointer transition-all hover:shadow-md ${
                      selectedCourse?.id === course.id 
                        ? 'border-indigo-500 bg-indigo-50 ring-2 ring-indigo-200' 
                        : 'border-gray-200 hover:border-indigo-300'
                    }`}
                    onClick={() => handleViewCourse(course)}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h4 className="font-semibold text-gray-800">{course.name}</h4>
                        <span className={`inline-block mt-1 text-xs px-2 py-0.5 rounded-full ${
                          course.type === 'mock' ? 'bg-purple-100 text-purple-700' :
                          course.type === 'exit' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'
                        }`}>
                          {course.type === 'mock' ? 'Mock Exam' : course.type === 'exit' ? 'Exit Exam' : 'Regular Course'}
                        </span>
                      </div>
                      <div className="flex gap-1">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleMoveCourse(course);
                          }}
                          className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition"
                          title="Edit Course"
                        >
                          <Move size={14} />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteCourse(course.id);
                          }}
                          className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition"
                          title="Delete Course"
                        >
                          <X size={14} />
                        </button>
                      </div>
                    </div>
                    <div className="mt-3 flex items-center text-indigo-600 text-xs font-medium">
                      <Eye size={12} className="mr-1" />
                      View Questions
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Questions Section */}
      {selectedCourse && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="px-6 py-4 bg-gray-50 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <h3 className="text-lg font-semibold text-gray-800">{selectedCourse.name}</h3>
              <p className="text-sm text-gray-500">{questions.length} questions</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <button onClick={() => setAddModal(true)} className="flex items-center gap-2 bg-indigo-600 text-white px-3 py-1.5 rounded-lg hover:bg-indigo-700 text-sm transition">
                <Plus size={14} /> Add Question
              </button>
              <button onClick={() => setBulkModal(true)} className="flex items-center gap-2 bg-green-600 text-white px-3 py-1.5 rounded-lg hover:bg-green-700 text-sm transition">
                <Upload size={14} /> Bulk Upload
              </button>
              <button onClick={handleDeleteAllQuestions} className="flex items-center gap-2 bg-red-600 text-white px-3 py-1.5 rounded-lg hover:bg-red-700 text-sm transition">
                <Trash2 size={14} /> Delete All
              </button>
            </div>
          </div>

          {message && (
            <div className={`mx-6 mt-4 p-3 rounded-lg text-sm ${
              message.includes('✅') ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'
            }`}>
              {message}
            </div>
          )}

          <div className="p-6">
            {questions.length === 0 ? (
              <div className="text-center py-12 bg-gray-50 rounded-xl">
                <AlertCircle size={48} className="text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500">No questions yet</p>
                <p className="text-sm text-gray-400 mt-1">Click "Add Question" to get started</p>
              </div>
            ) : (
              <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2">
                {questions.map((q, idx) => (
                  <div key={q.id} className="p-4 border border-gray-100 rounded-xl hover:shadow-sm transition bg-white">
                    <div className="flex justify-between items-start gap-4">
                      <div className="flex-1">
                        <p className="font-medium text-gray-800">
                          <span className="text-indigo-600 mr-2">{idx + 1}.</span>
                          {q.question_text}
                        </p>
                        <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
                          {q.options.map((opt, i) => (
                            <div key={i} className={`flex items-center gap-2 p-2 rounded-lg ${i === q.correct_index ? 'bg-green-50 border border-green-200' : 'bg-gray-50'}`}>
                              <span className={`font-medium w-6 ${i === q.correct_index ? 'text-green-600' : 'text-gray-500'}`}>
                                {String.fromCharCode(65 + i)}.
                              </span>
                              <span className={i === q.correct_index ? 'text-green-700' : 'text-gray-600'}>{opt}</span>
                              {i === q.correct_index && <span className="text-green-600 text-xs ml-auto">✓ Correct</span>}
                            </div>
                          ))}
                        </div>
                        {q.explanation && (
                          <p className="text-sm text-gray-500 mt-2 pt-2 border-t border-gray-100">
                            <span className="font-medium">📖 Explanation:</span> {q.explanation}
                          </p>
                        )}
                      </div>
                      <div className="flex gap-1 flex-shrink-0">
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
                        }} className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition">
                          <Edit size={16} />
                        </button>
                        <button onClick={() => handleDeleteQuestion(q.id)} className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition">
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Add Modal */}
      {addModal && (
        <Modal onClose={() => setAddModal(false)}>
          <h3 className="text-xl font-bold text-gray-900 mb-4">Add New Question</h3>
          <form onSubmit={handleAddQuestion} className="space-y-4">
            <textarea placeholder="Question text" value={form.question_text} onChange={e => setForm({...form, question_text: e.target.value})} className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500" rows={3} required />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <input placeholder="Option A" value={form.optionA} onChange={e => setForm({...form, optionA: e.target.value})} className="w-full p-2 border border-gray-200 rounded-lg" required />
              <input placeholder="Option B" value={form.optionB} onChange={e => setForm({...form, optionB: e.target.value})} className="w-full p-2 border border-gray-200 rounded-lg" required />
              <input placeholder="Option C" value={form.optionC} onChange={e => setForm({...form, optionC: e.target.value})} className="w-full p-2 border border-gray-200 rounded-lg" required />
              <input placeholder="Option D" value={form.optionD} onChange={e => setForm({...form, optionD: e.target.value})} className="w-full p-2 border border-gray-200 rounded-lg" required />
            </div>
            <select value={form.correct_answer} onChange={e => setForm({...form, correct_answer: Number(e.target.value)})} className="w-full p-2 border border-gray-200 rounded-lg">
              <option value={0}>Correct Answer: A</option>
              <option value={1}>Correct Answer: B</option>
              <option value={2}>Correct Answer: C</option>
              <option value={3}>Correct Answer: D</option>
            </select>
            <textarea placeholder="Explanation (optional)" value={form.explanation} onChange={e => setForm({...form, explanation: e.target.value})} className="w-full p-2 border border-gray-200 rounded-lg" rows={2} />
            <div className="flex justify-end gap-3 pt-2">
              <button type="button" onClick={() => setAddModal(false)} className="px-4 py-2 border border-gray-200 rounded-lg hover:bg-gray-50 transition">Cancel</button>
              <button type="submit" className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition">Add Question</button>
            </div>
          </form>
        </Modal>
      )}

      {/* Edit Modal */}
      {editModal && selectedQuestion && (
        <Modal onClose={() => setEditModal(false)}>
          <h3 className="text-xl font-bold text-gray-900 mb-4">Edit Question</h3>
          <form onSubmit={handleEditQuestion} className="space-y-4">
            <textarea value={form.question_text} onChange={e => setForm({...form, question_text: e.target.value})} className="w-full p-3 border border-gray-200 rounded-xl" rows={3} required />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <input value={form.optionA} onChange={e => setForm({...form, optionA: e.target.value})} className="w-full p-2 border border-gray-200 rounded-lg" required />
              <input value={form.optionB} onChange={e => setForm({...form, optionB: e.target.value})} className="w-full p-2 border border-gray-200 rounded-lg" required />
              <input value={form.optionC} onChange={e => setForm({...form, optionC: e.target.value})} className="w-full p-2 border border-gray-200 rounded-lg" required />
              <input value={form.optionD} onChange={e => setForm({...form, optionD: e.target.value})} className="w-full p-2 border border-gray-200 rounded-lg" required />
            </div>
            <select value={form.correct_answer} onChange={e => setForm({...form, correct_answer: Number(e.target.value)})} className="w-full p-2 border border-gray-200 rounded-lg">
              <option value={0}>A</option><option value={1}>B</option><option value={2}>C</option><option value={3}>D</option>
            </select>
            <textarea value={form.explanation} onChange={e => setForm({...form, explanation: e.target.value})} className="w-full p-2 border border-gray-200 rounded-lg" rows={2} />
            <div className="flex justify-end gap-3 pt-2">
              <button type="button" onClick={() => setEditModal(false)} className="px-4 py-2 border border-gray-200 rounded-lg hover:bg-gray-50">Cancel</button>
              <button type="submit" className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700">Save Changes</button>
            </div>
          </form>
        </Modal>
      )}

      {/* Bulk Upload Modal */}
      {bulkModal && (
        <Modal onClose={() => setBulkModal(false)}>
          <h3 className="text-xl font-bold text-gray-900 mb-2">Bulk Upload (JSON)</h3>
          <p className="text-sm text-gray-500 mb-4">Upload a <code className="bg-gray-100 px-1 rounded">.json</code> file containing an array of questions.</p>
          <div className="bg-gray-50 p-3 rounded-lg text-xs text-gray-700 mb-4 font-mono overflow-auto max-h-32">
            {`[
  {
    "question": "What is ...?",
    "options": ["Option A", "Option B", "Option C", "Option D"],
    "correct_index": 0,
    "explanation": "Because ..."
  }
]`}
          </div>
          <input type="file" accept=".json" onChange={(e) => setBulkFile(e.target.files[0])} className="mb-4 text-sm" />
          <div className="flex justify-end gap-3">
            <button onClick={() => setBulkModal(false)} className="px-4 py-2 border border-gray-200 rounded-lg hover:bg-gray-50">Cancel</button>
            <button onClick={handleBulkUpload} disabled={uploading || !bulkFile} className={`px-4 py-2 rounded-lg text-white flex items-center gap-2 ${uploading ? 'bg-gray-400' : 'bg-green-600 hover:bg-green-700'}`}>
              {uploading ? <><Loader2 size={16} className="animate-spin" /> Uploading...</> : 'Upload JSON'}
            </button>
          </div>
        </Modal>
      )}

      {/* Move/Edit Course Modal */}
      {moveModal && selectedCourse && (
        <Modal onClose={() => setMoveModal(false)}>
          <h3 className="text-xl font-bold text-gray-900 mb-4">Edit Course</h3>
          <form onSubmit={handleUpdateCourse} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Course Name</label>
              <input type="text" value={courseEditForm.name} onChange={(e) => setCourseEditForm({...courseEditForm, name: e.target.value})} className="w-full p-2 border border-gray-200 rounded-lg" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Course Type</label>
              <select value={courseEditForm.type} onChange={(e) => setCourseEditForm({...courseEditForm, type: e.target.value})} className="w-full p-2 border border-gray-200 rounded-lg">
                <option value="regular">Regular Course</option>
                <option value="mock">Mock Exam</option>
                <option value="exit">Exit Exam</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Department</label>
              <select value={courseEditForm.department_id} onChange={(e) => setCourseEditForm({...courseEditForm, department_id: e.target.value})} className="w-full p-2 border border-gray-200 rounded-lg">
                <option value="">Select Department</option>
                {departments.map((dept) => (<option key={dept.id} value={dept.id}>{dept.name}</option>))}
              </select>
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <button type="button" onClick={() => setMoveModal(false)} className="px-4 py-2 border border-gray-200 rounded-lg hover:bg-gray-50">Cancel</button>
              <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">Update Course</button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};

export default Questions;