import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  Search, Lock, Unlock, Computer, Database, Code, Cpu, BookOpen, 
  ChevronRight, Sparkles, GraduationCap, Trophy, Target, ArrowRight,
  Filter, Layers, Star, Zap, Award, Brain, AlertCircle
} from 'lucide-react';
import api from '../api/axios';

const StudentDepartments = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [departments, setDepartments] = useState([]);
  const [courseCounts, setCourseCounts] = useState({});
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFilter, setSelectedFilter] = useState('all');

  const navigate = useNavigate();

  useEffect(() => {
    fetchDepartments();
  }, []);

  const fetchDepartments = async () => {
    setLoading(true);
    setError('');
    try {
      const [{ data: departmentsData }, { data: coursesData }] = await Promise.all([
        api.get('/departments'),
        api.get('/courses'),
      ]);

      setDepartments(departmentsData || []);

      const counts = (coursesData || []).reduce((acc, course) => {
        const deptId = course.department_id || course.departments?.id || course.department?.id;
        if (!deptId) return acc;
        acc[deptId] = (acc[deptId] || 0) + 1;
        return acc;
      }, {});

      setCourseCounts(counts);
    } catch (error) {
      console.error('Error fetching departments or courses:', error);
      setError('Unable to load departments. Please check your connection.');
    } finally {
      setLoading(false);
    }
  };

  const getDepartmentIcon = (name) => {
    const icons = {
      'Information Technology': <Computer className="w-10 h-10" />,
      'Computer Science': <Code className="w-10 h-10" />,
      'Software Engineering': <Database className="w-10 h-10" />,
    };
    return icons[name] || <Cpu className="w-10 h-10" />;
  };

  const getDepartmentGradient = (name) => {
    const gradients = {
      'Information Technology': 'from-cyan-500 to-blue-600',
      'Computer Science': 'from-emerald-500 to-teal-600',
      'Software Engineering': 'from-violet-500 to-purple-600',
    };
    return gradients[name] || 'from-indigo-500 to-purple-600';
  };

  const filteredDepartments = departments
    .filter((dept) => dept.name?.toLowerCase().includes(searchTerm.toLowerCase()))
    .filter((dept) => {
      if (selectedFilter === 'all') return true;
      if (selectedFilter === 'in-progress') return dept.progress > 0 && dept.progress < 100;
      if (selectedFilter === 'completed') return dept.progress === 100;
      if (selectedFilter === 'locked') return dept.isLocked === true;
      return true;
    });

  if (loading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center">
        <div className="relative">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
          <div className="absolute inset-0 flex items-center justify-center">
            <GraduationCap className="w-5 h-5 text-indigo-600 animate-pulse" />
          </div>
        </div>
        <p className="mt-3 text-gray-500 text-sm">Loading departments...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center px-4">
        <div className="text-center max-w-md">
          <div className="w-14 h-14 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-7 h-7 text-red-500" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Unable to Load</h3>
          <p className="text-gray-500 text-sm mb-4">{error}</p>
          <button
            onClick={fetchDepartments}
            className="bg-indigo-600 text-white px-5 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 transition"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  const unlockedCount = departments.filter((dept) => !(dept.isLocked ?? false)).length;
  const lockedCount = departments.filter((dept) => dept.isLocked ?? false).length;
  const inProgressCount = departments.filter((dept) => dept.progress > 0 && dept.progress < 100).length;
  const completedCount = departments.filter((dept) => dept.progress === 100).length;

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="border-b border-gray-200 pb-4">
        <h1 className="text-2xl font-semibold text-gray-900">Departments</h1>
        <p className="text-sm text-gray-500 mt-0.5">Select a department to start learning</p>
      </div>

      

      {/* Search and Filter Bar */}
      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search departments..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-lg text-sm focus:border-gray-400 focus:ring-1 focus:ring-gray-400 outline-none"
            />
          </div>
          <div className="relative sm:w-64">
            <Zap size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <select
              value=""
              onChange={(e) => {
                if (e.target.value) navigate(`/student/departments/${e.target.value}/courses`);
              }}
              className="w-full pl-9 pr-8 py-2 border border-gray-200 rounded-lg text-sm bg-white focus:border-gray-400 focus:ring-1 focus:ring-gray-400 outline-none appearance-none cursor-pointer"
            >
              <option value="">Quick Jump</option>
              {departments.map((dept) => (
                <option key={dept.id} value={dept.id}>
                  {dept.name} {dept.isLocked ? '(Locked)' : ''}
                </option>
              ))}
            </select>
            <ChevronRight size={12} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 rotate-90 pointer-events-none" />
          </div>
        </div>

        {/* Filter Chips */}
        {/* <div className="flex flex-wrap gap-2 mt-3 pt-2 border-t border-gray-100">
          <Filter size={14} className="text-gray-400 mr-1 self-center hidden sm:block" />
          {[
            { key: 'all', label: 'All', icon: '📋' },
            { key: 'in-progress', label: 'In Progress', icon: '⏳' },
            { key: 'completed', label: 'Completed', icon: '✅' },
            { key: 'locked', label: 'Locked', icon: '🔒' }
          ].map((filter) => (
            <button
              key={filter.key}
              onClick={() => setSelectedFilter(filter.key)}
              className={`px-3 py-1 rounded-full text-xs font-medium transition ${
                selectedFilter === filter.key
                  ? 'bg-gray-800 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              <span className="mr-1">{filter.icon}</span>
              {filter.label}
            </button>
          ))}
        </div> */}
      </div>

      {/* Departments Grid */}
      {filteredDepartments.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-8 text-center">
          <div className="w-14 h-14 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
            <BookOpen size={24} className="text-gray-400" />
          </div>
          <p className="text-gray-600 font-medium">No departments found</p>
          <p className="text-sm text-gray-400 mt-1">Try adjusting your search or filter</p>
          <button 
            onClick={() => { setSearchTerm(''); setSelectedFilter('all'); }}
            className="mt-3 text-indigo-600 text-sm hover:text-indigo-700"
          >
            Clear filters
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredDepartments.map((dept) => (
            <DepartmentCard
              key={dept.id}
              department={dept}
              courseCount={courseCounts[dept.id] ?? dept.totalCourses ?? dept.courses_count ?? 0}
              getDepartmentIcon={getDepartmentIcon}
              getDepartmentGradient={getDepartmentGradient}
            />
          ))}
        </div>
      )}

      {/* Tips Sidebar (Responsive) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <HowItWorksCard />
        <ProTipsCard />
      </div>
    </div>
  );
};

// Helper Components
const StatCard = ({ icon, label, value, color }) => {
  const colors = {
    gray: 'bg-gray-100 text-gray-600',
    green: 'bg-green-100 text-green-600',
    orange: 'bg-orange-100 text-orange-600',
    purple: 'bg-purple-100 text-purple-600',
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-3 text-center">
      <div className={`w-8 h-8 ${colors[color]} rounded-lg flex items-center justify-center mx-auto mb-2`}>
        {icon}
      </div>
      <p className="text-xl font-bold text-gray-800">{value}</p>
      <p className="text-xs text-gray-500">{label}</p>
    </div>
  );
};

const DepartmentCard = ({ department, courseCount, getDepartmentIcon, getDepartmentGradient }) => {
  const isLocked = department.isLocked ?? false;
  const progress = department.progress ?? 0;
  const gradient = getDepartmentGradient(department.name);

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-md transition-shadow">
      {/* Progress Bar */}
      {!isLocked && progress > 0 && (
        <div className="h-1 bg-gray-100">
          <div 
            className={`h-full bg-gradient-to-r ${gradient}`}
            style={{ width: `${progress}%` }}
          />
        </div>
      )}
      
      <div className="p-4">
        <div className="flex items-start justify-between mb-3">
          <div className={`p-2 rounded-lg bg-gradient-to-br ${gradient} text-white shadow-sm`}>
            {getDepartmentIcon(department.name)}
          </div>
          <span className={`text-xs font-medium px-2 py-1 rounded-full ${
            isLocked ? 'bg-orange-100 text-orange-700' : 'bg-green-100 text-green-700'
          }`}>
            {isLocked ? <Lock size={10} className="inline mr-1" /> : <Unlock size={10} className="inline mr-1" />}
            {isLocked ? 'Locked' : 'Unlocked'}
          </span>
        </div>

        <h3 className="font-bold text-gray-900 text-base">{department.name}</h3>
        <p className="text-xs text-gray-500 mt-0.5">{courseCount} Courses Available</p>

        {/* Progress Display */}
        {!isLocked && progress > 0 && (
          <div className="mt-3 mb-3">
            <div className="flex justify-between text-xs mb-1">
              <span className="text-gray-500">Progress</span>
              <span className="font-medium text-gray-700">{progress}%</span>
            </div>
            <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
              <div 
                className={`h-full rounded-full bg-gradient-to-r ${gradient}`}
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        )}

        {/* Action Button */}
        {isLocked ? (
          <Link
            to="/student/payments"
            className="block w-full text-center bg-orange-500 text-white py-2 rounded-lg text-sm font-medium hover:bg-orange-600 transition mt-2"
          >
            Unlock Now
          </Link>
        ) : (
          <Link
            to={`/student/departments/${department.id}/courses`}
            className="block w-full text-center bg-gray-800 text-white py-2 rounded-lg text-sm font-medium hover:bg-gray-900 transition mt-2"
          >
            {progress > 0 ? 'Continue Learning' : 'Start Learning'}
          </Link>
        )}
      </div>
    </div>
  );
};

const HowItWorksCard = () => (
  <div className="bg-white rounded-xl border border-gray-200 p-4">
    <div className="flex items-center gap-2 mb-3">
      <div className="p-1.5 bg-gray-100 rounded-lg">
        <Brain size={16} className="text-gray-600" />
      </div>
      <h3 className="font-semibold text-gray-800">How It Works</h3>
    </div>
    <ol className="space-y-3">
      <li className="flex gap-3">
        <span className="w-5 h-5 rounded-full bg-gray-800 text-white text-xs flex items-center justify-center shrink-0 mt-0.5">1</span>
        <div>
          <p className="font-medium text-gray-800 text-sm">Select Department</p>
          <p className="text-xs text-gray-500">Explore course path and unlock content</p>
        </div>
      </li>
      <li className="flex gap-3">
        <span className="w-5 h-5 rounded-full bg-gray-800 text-white text-xs flex items-center justify-center shrink-0 mt-0.5">2</span>
        <div>
          <p className="font-medium text-gray-800 text-sm">Upload Payment Proof</p>
          <p className="text-xs text-gray-500">Unlock premium departments</p>
        </div>
      </li>
      <li className="flex gap-3">
        <span className="w-5 h-5 rounded-full bg-gray-800 text-white text-xs flex items-center justify-center shrink-0 mt-0.5">3</span>
        <div>
          <p className="font-medium text-gray-800 text-sm">Practice & Master</p>
          <p className="text-xs text-gray-500">Questions, mock exams & reviews</p>
        </div>
      </li>
    </ol>
  </div>
);

const ProTipsCard = () => (
  <div className="bg-white rounded-xl border border-gray-200 p-4">
    <div className="flex items-center gap-2 mb-3">
      <div className="p-1.5 bg-gray-100 rounded-lg">
        <Zap size={16} className="text-gray-600" />
      </div>
      <h3 className="font-semibold text-gray-800">Pro Tips</h3>
    </div>
    <ul className="space-y-2">
      <li className="flex gap-2 text-sm">
        <span>🚀</span>
        <span className="text-gray-700">Start with unlocked departments first</span>
      </li>
      <li className="flex gap-2 text-sm">
        <span>🔍</span>
        <span className="text-gray-700">Use Quick Jump to navigate instantly</span>
      </li>
      <li className="flex gap-2 text-sm">
        <span>📊</span>
        <span className="text-gray-700">Track progress in each department</span>
      </li>
      <li className="flex gap-2 text-sm">
        <span>💡</span>
        <span className="text-gray-700">15 minutes daily = better retention</span>
      </li>
    </ul>
  </div>
);

export default StudentDepartments;