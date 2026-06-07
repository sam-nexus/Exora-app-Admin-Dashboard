import { useState, useEffect } from "react";
import { clearSession, getUserId, getUserEmail, getUserFullName } from "../utils/auth";
import api from "../api/axios";
import {
  Loader2,
  Mail,
  User2,
  GraduationCap,
  BookOpen,
  LogOut,
  Save,
  Phone,
  Shield,
  ChevronRight,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

const StudentProfile = () => {
  const userId = getUserId();
  const navigate = useNavigate();
  const [fullName, setFullName] = useState(getUserFullName() || "");
  const [email] = useState(getUserEmail() || "");
  const [university, setUniversity] = useState("");
  const [studentId, setStudentId] = useState("");
  const [department, setDepartment] = useState("");
  const [yearOfStudy, setYearOfStudy] = useState("");
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");
  const [stats, setStats] = useState({
    coursesCompleted: 0,
    totalQuestions: 0,
    averageScore: 0,
    studyStreak: 0,
    totalHours: 0,
  });

  useEffect(() => {
    fetchProfileData();
    fetchStats();
  }, []);

  const fetchProfileData = async () => {
    try {
      const { data } = await api.get(`/student/profile`);
      setUniversity(data.university || "");
      setStudentId(data.studentId || "");
      setDepartment(data.department || "");
      setYearOfStudy(data.yearOfStudy || "");
      setPhone(data.phone || "");
    } catch (error) {
      console.error("Error fetching profile:", error);
    }
  };

  const fetchStats = async () => {
    try {
      const { data } = await api.get(`/student/stats`);
      setStats({
        coursesCompleted: data.coursesCompleted || 0,
        totalQuestions: data.totalQuestions || 0,
        averageScore: data.averageScore || 0,
        studyStreak: data.studyStreak || 0,
        totalHours: data.totalHours || 0,
      });
    } catch (error) {
      console.error("Error fetching stats:", error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSuccess("");
    setError("");
    setLoading(true);

    try {
      await api.put(`/users/${userId}`, {
        full_name: fullName,
      });
      await api.put(`/users/${userId}/profile`, {
        university,
        student_id: studentId,
        department,
        year_of_study: yearOfStudy,
        phone,
      }).catch(() => {});
      localStorage.setItem("fullName", fullName);
      setSuccess("Profile updated successfully.");
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      setError(err.response?.data?.error || "Unable to update profile");
      setTimeout(() => setError(""), 3000);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    clearSession();
    navigate("/login");
  };

  const getInitials = () => {
    return fullName ? fullName.charAt(0).toUpperCase() : "S";
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="border-b border-gray-200 pb-4">
        <h1 className="text-2xl font-semibold text-gray-900">Profile</h1>
        <p className="text-sm text-gray-500 mt-1">Manage your personal and academic information</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Left Column - Profile Info & Stats */}
        <div className="space-y-6">
          {/* Profile Card */}
          <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
            <div className="border-b border-gray-100 px-6 py-5">
              <div className="flex items-center gap-5">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center border border-gray-200">
                  <span className="text-xl font-semibold text-gray-700">
                    {getInitials()}
                  </span>
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">{fullName || "Student"}</h2>
                  <p className="text-sm text-gray-500">{email}</p>
                  <div className="flex gap-2 mt-1.5">
                    <span className="text-xs text-gray-500 border border-gray-200 rounded-full px-2 py-0.5">
                      Active Student
                    </span>
                    <span className="text-xs text-gray-500 border border-gray-200 rounded-full px-2 py-0.5">
                      Beginner
                    </span>
                  </div>
                </div>
              </div>
            </div>

            
          </div>

          {/* Logout Card */}
          <div className="bg-white border border-gray-200 rounded-lg p-5">
            <h3 className="text-sm font-medium text-gray-700 mb-3 flex items-center gap-2">
              <Shield size={16} className="text-gray-400" />
              Account
            </h3>
            <button
              onClick={handleLogout}
              className="w-full flex items-center justify-between p-3 rounded-lg border border-gray-200 hover:bg-gray-50 transition"
            >
              <div className="flex items-center gap-2">
                <LogOut size={16} className="text-gray-500" />
                <span className="text-sm text-gray-700">Logout</span>
              </div>
              <ChevronRight size={14} className="text-gray-400" />
            </button>
          </div>
        </div>

        {/* Right Column - Edit Form */}
        <div className="bg-white border border-gray-200 rounded-lg">
          <div className="border-b border-gray-100 px-6 py-4">
            <div className="flex items-center gap-2">
              <User2 size={16} className="text-gray-500" />
              <h3 className="font-medium text-gray-900">Edit Profile</h3>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="p-5 space-y-4">
            {success && (
              <div className="rounded-lg border border-green-200 bg-green-50 p-3 text-green-700 text-sm">
                {success}
              </div>
            )}
            {error && (
              <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-red-700 text-sm">
                {error}
              </div>
            )}

            {/* Email (Read Only) */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Email Address
              </label>
              <div className="flex items-center gap-2 rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-gray-500">
                <Mail size={14} className="text-gray-400" />
                <span className="text-sm">{email || "No email available"}</span>
              </div>
            </div>

            {/* Full Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Full Name
              </label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm focus:border-gray-400 focus:outline-none focus:ring-1 focus:ring-gray-300 transition"
                required
                placeholder="Enter your full name"
              />
            </div>

            {/* Phone Number */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Phone Number
              </label>
              <div className="relative">
                <Phone size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full rounded-lg border border-gray-200 bg-white pl-9 pr-3 py-2 text-sm focus:border-gray-400 focus:outline-none focus:ring-1 focus:ring-gray-300 transition"
                  placeholder="+251-911-123456"
                />
              </div>
            </div>

            <div className="border-t border-gray-100 my-2"></div>

            {/* Academic Information Section */}
            <div className="flex items-center gap-2">
              <GraduationCap size={16} className="text-gray-500" />
              <h3 className="font-medium text-gray-900">Academic Information</h3>
            </div>

            {/* University */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                University
              </label>
              <select
                value={university}
                onChange={(e) => setUniversity(e.target.value)}
                className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm focus:border-gray-400 focus:outline-none focus:ring-1 focus:ring-gray-300"
              >
                <option value="">Select University</option>
                <option>Addis Ababa University</option>
                <option>Jimma University</option>
                <option>Bahir Dar University</option>
                <option>Mekelle University</option>
                <option>Haramaya University</option>
                <option>Adama Science & Technology University</option>
                <option>Debre Berhan University</option>
                <option>Wollo University</option>
                <option>Arba Minch University</option>
                <option>Gondar University</option>
              </select>
            </div>

            {/* Student ID */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Student ID
              </label>
              <input
                type="text"
                value={studentId}
                onChange={(e) => setStudentId(e.target.value)}
                className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm focus:border-gray-400 focus:outline-none focus:ring-1 focus:ring-gray-300"
                placeholder="e.g., ATR/1234/12"
              />
            </div>

            {/* Department */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Department
              </label>
              <select
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm focus:border-gray-400 focus:outline-none focus:ring-1 focus:ring-gray-300"
              >
                <option value="">Select Department</option>
                <option>Information Technology</option>
                <option>Computer Science</option>
                <option>Software Engineering</option>
                <option>Electrical Engineering</option>
                <option>Mechanical Engineering</option>
                <option>Civil Engineering</option>
              </select>
            </div>

            {/* Year of Study */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Year of Study
              </label>
              <select
                value={yearOfStudy}
                onChange={(e) => setYearOfStudy(e.target.value)}
                className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm focus:border-gray-400 focus:outline-none focus:ring-1 focus:ring-gray-300"
              >
                <option value="">Select Year</option>
                <option>1st Year</option>
                <option>2nd Year</option>
                <option>3rd Year</option>
                <option>4th Year (Graduating)</option>
                <option>5th Year</option>
              </select>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className={`w-full flex items-center justify-center gap-2 rounded-lg py-2.5 text-sm font-medium text-white transition ${
                loading ? "bg-gray-400 cursor-not-allowed" : "bg-gray-800 hover:bg-gray-900"
              }`}
            >
              {loading && <Loader2 size={14} className="animate-spin" />}
              <Save size={14} />
              {loading ? "Saving..." : "Save Changes"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

// Helper Component
const StatItem = ({ value, label }) => (
  <div className="text-center p-2 rounded-lg border border-gray-100 bg-gray-50">
    <p className="text-lg font-semibold text-gray-800">{value}</p>
    <p className="text-xs text-gray-500">{label}</p>
  </div>
);

export default StudentProfile;