import { useState, useEffect } from 'react';
import api from '../api/axios';
import { Upload, Trash2, Loader2, Eye, Search, FileText, GraduationCap, BookOpen, ChevronRight, Database, AlertCircle, CheckCircle, X } from 'lucide-react';
import { motion } from 'framer-motion';

const Materials = () => {
  const [departments, setDepartments] = useState([]);
  const [courses, setCourses] = useState([]);
  const [selectedDept, setSelectedDept] = useState(null);
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [materials, setMaterials] = useState([]);
  const [filterDept, setFilterDept] = useState('');

  const [title, setTitle] = useState('');
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [errors, setErrors] = useState({});

  useEffect(() => {
    fetchDepartments();
  }, []);

  const fetchDepartments = async () => {
    try {
      const { data } = await api.get('/departments');
      setDepartments(data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchCourses = async (deptId) => {
    try {
      const { data } = await api.get(`/courses?department_id=${deptId}`);
      setCourses(data || []);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchMaterials = async () => {
    if (!selectedCourse) return;
    setLoading(true);
    try {
      const { data } = await api.get(`/courses/${selectedCourse.id}/materials`);
      setMaterials(data || []);
    } catch (err) {
      setMessage('❌ Failed to load materials');
    } finally {
      setLoading(false);
    }
  };

  const handleViewDept = (dept) => {
    setSelectedDept(dept);
    setSelectedCourse(null);
    setMaterials([]);
    fetchCourses(dept.id);
  };

  const handleViewCourse = (course) => {
    setSelectedCourse(course);
    fetchMaterials();
  };

  const validateForm = () => {
    const newErrors = {};
    if (!file) newErrors.file = 'Please select a PDF file to upload.';
    if (file && !file.name.toLowerCase().endsWith('.pdf')) newErrors.file = 'Only PDF files are allowed.';
    if (file && file.size > 10 * 1024 * 1024) newErrors.file = 'File size must be under 10MB.';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleUpload = async () => {
    if (!validateForm()) return;

    setUploading(true);
    setMessage('');

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('title', title || file.name.replace('.pdf', ''));

      const res = await api.post(`/courses/${selectedCourse.id}/materials/upload`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      setMessage('✅ Material uploaded successfully!');
      setFile(null);
      setTitle('');
      setErrors({});
      fetchMaterials();
    } catch (err) {
      setMessage('❌ ' + (err.response?.data?.error || 'Upload failed'));
    } finally {
      setUploading(false);
      setTimeout(() => setMessage(''), 5000);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this material? This cannot be undone.')) return;
    try {
      await api.delete(`/courses/materials/${id}`);
      fetchMaterials();
      setMessage('🗑️ Material deleted.');
      setTimeout(() => setMessage(''), 3000);
    } catch (err) {
      setMessage('❌ ' + (err.response?.data?.error || 'Failed to delete material'));
    }
  };

  const filteredDepts = departments.filter(d =>
    d.name?.toLowerCase().includes(filterDept.toLowerCase())
  );

  const clearFile = () => {
    setFile(null);
    setErrors({});
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
            Course Materials
          </h1>
          <p className="text-gray-500 text-sm mt-1">Upload and manage PDF materials for courses</p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Departments</p>
              <p className="text-2xl font-bold text-indigo-600">{departments.length}</p>
            </div>
            <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center">
              <GraduationCap size={20} className="text-indigo-600" />
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Total Materials</p>
              <p className="text-2xl font-bold text-purple-600">{materials.length}</p>
            </div>
            <div className="w-10 h-10 bg-purple-50 rounded-xl flex items-center justify-center">
              <FileText size={20} className="text-purple-600" />
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Active Courses</p>
              <p className="text-2xl font-bold text-green-600">{courses.length}</p>
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
            <p className="text-indigo-100 text-sm">Select a course to manage materials</p>
          </div>
          
          <div className="p-6">
            {courses.length === 0 ? (
              <div className="text-center py-12 bg-gray-50 rounded-xl">
                <Database size={48} className="text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500">No courses found in this department.</p>
                <p className="text-sm text-gray-400 mt-1">Add courses from the Courses page</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {courses.map((course) => (
                  <div
                    key={course.id}
                    className={`p-4 rounded-xl border cursor-pointer transition-all hover:shadow-md ${
                      selectedCourse?.id === course.id 
                        ? 'border-indigo-500 bg-indigo-50 ring-2 ring-indigo-200' 
                        : 'border-gray-200 hover:border-indigo-300'
                    }`}
                    onClick={() => handleViewCourse(course)}
                  >
                    <h4 className="font-semibold text-gray-800">{course.name}</h4>
                    <span className={`inline-block mt-2 text-xs px-2 py-0.5 rounded-full ${
                      course.type === 'mock' ? 'bg-purple-100 text-purple-700' :
                      course.type === 'exit' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'
                    }`}>
                      {course.type === 'mock' ? 'Mock Exam' : course.type === 'exit' ? 'Exit Exam' : 'Regular Course'}
                    </span>
                    <div className="mt-3 flex items-center text-indigo-600 text-xs font-medium">
                      <FileText size={12} className="mr-1" />
                      Manage Materials
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Materials Section */}
      {selectedCourse && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="px-6 py-4 bg-gray-50 border-b border-gray-100">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div>
                <h3 className="text-lg font-semibold text-gray-800">{selectedCourse.name}</h3>
                <p className="text-sm text-gray-500">{materials.length} material{materials.length !== 1 ? 's' : ''}</p>
              </div>
            </div>
          </div>

          {/* Upload Form */}
          <div className="p-6 border-b border-gray-100">
            <h4 className="text-base font-semibold text-gray-700 mb-4">Upload New Material</h4>
            <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-end">
              <div className="flex-1 w-full">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Title <span className="text-gray-400">(optional)</span>
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g., Chapter 1 - Introduction"
                  className="w-full p-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  disabled={uploading}
                />
              </div>
              <div className="flex-1 w-full">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  PDF File <span className="text-red-500">*</span>
                </label>
                {file ? (
                  <div className="flex items-center gap-2 p-2.5 border border-green-200 rounded-lg bg-green-50">
                    <CheckCircle size={16} className="text-green-600 flex-shrink-0" />
                    <span className="text-sm text-green-700 truncate flex-1">{file.name}</span>
                    <button onClick={clearFile} className="text-gray-400 hover:text-red-500 flex-shrink-0">
                      <X size={16} />
                    </button>
                  </div>
                ) : (
                  <label className="flex items-center gap-2 p-2.5 border border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-indigo-400 transition">
                    <Upload size={16} className="text-gray-400" />
                    <span className="text-sm text-gray-500">Choose PDF file</span>
                    <input
                      type="file"
                      accept=".pdf"
                      onChange={(e) => {
                        setFile(e.target.files[0]);
                        setErrors({});
                      }}
                      className="hidden"
                      disabled={uploading}
                    />
                  </label>
                )}
                {errors.file && <p className="text-red-500 text-xs mt-1">{errors.file}</p>}
              </div>
              <button
                onClick={handleUpload}
                disabled={uploading || !file}
                className={`px-6 py-2.5 rounded-lg text-white flex items-center gap-2 transition-all ${
                  uploading 
                    ? 'bg-gray-400 cursor-not-allowed' 
                    : 'bg-indigo-600 hover:bg-indigo-700 hover:shadow-lg'
                }`}
              >
                {uploading ? (
                  <>
                    <Loader2 size={16} className="animate-spin" /> Uploading...
                  </>
                ) : (
                  <>
                    <Upload size={16} /> Upload PDF
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Message */}
          {message && (
            <div className={`mx-6 mt-4 p-3 rounded-lg text-sm ${
              message.includes('✅') || message.includes('success') 
                ? 'bg-green-50 text-green-700 border border-green-200' 
                : 'bg-red-50 text-red-700 border border-red-200'
            }`}>
              {message}
            </div>
          )}

          {/* Materials List */}
          <div className="p-6">
            {loading ? (
              <div className="flex justify-center py-12">
                <Loader2 size={32} className="animate-spin text-indigo-600" />
              </div>
            ) : materials.length === 0 ? (
              <div className="text-center py-12 bg-gray-50 rounded-xl">
                <FileText size={48} className="text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500">No materials uploaded yet</p>
                <p className="text-sm text-gray-400 mt-1">Upload PDF files using the form above</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="p-4 text-left text-gray-600 font-medium text-sm">Title</th>
                      <th className="p-4 text-left text-gray-600 font-medium text-sm">File</th>
                      <th className="p-4 text-left text-gray-600 font-medium text-sm">Uploaded</th>
                      <th className="p-4 text-center text-gray-600 font-medium text-sm">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {materials.map((mat) => (
                      <tr key={mat.id} className="border-t border-gray-100 hover:bg-gray-50 transition">
                        <td className="p-4">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-red-50 rounded-lg flex items-center justify-center flex-shrink-0">
                              <FileText size={16} className="text-red-500" />
                            </div>
                            <span className="font-medium text-gray-800 text-sm">{mat.title}</span>
                          </div>
                        </td>
                        <td className="p-4">
                          <a
                            href={mat.file_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 text-indigo-600 hover:text-indigo-800 text-sm font-medium"
                          >
                            <Eye size={14} /> View PDF
                          </a>
                        </td>
                        <td className="p-4 text-sm text-gray-500">
                          {mat.created_at ? new Date(mat.created_at).toLocaleDateString() : 'N/A'}
                        </td>
                        <td className="p-4 text-center">
                          <button
                            onClick={() => handleDelete(mat.id)}
                            className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition"
                            title="Delete material"
                          >
                            <Trash2 size={16} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Materials;