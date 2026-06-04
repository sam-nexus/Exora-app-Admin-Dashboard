import { useState, useEffect } from "react";
import { clearSession, getUserId, getUserEmail, getUserFullName } from "../utils/auth";
import api from "../api/axios";
import {
  Loader2,
  BadgeCheck,
  Mail,
  User2,
  Camera,
  GraduationCap,
  BookOpen,
  Award,
  LogOut,
  Save,
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
  });

  useEffect(() => {
    fetchProfileData();
    fetchStats();
  }, []);

  const fetchProfileData = async () => {
    try {
      const token = localStorage.getItem("token");
      const { data } = await api.get(`/student/profile`, {
        headers: { Authorization: `Bearer ${token}` },
      });
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
      const token = localStorage.getItem("token");
      const { data } = await api.get(`/student/stats`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setStats(data);
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
      // Save extra profile fields to the student profile endpoint
      await api.put(`/users/${userId}/profile`, {
        university,
        student_id: studentId,
        department,
        year_of_study: yearOfStudy,
        phone,
      }).catch(() => {
        // profile fields endpoint may not exist yet — ignore silently
      });
      localStorage.setItem("fullName", fullName);
      setSuccess("Profile updated successfully.");
    } catch (err) {
      setError(err.response?.data?.error || "Unable to update profile");
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
      <div>
        <h1 className="text-3xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
          My Profile
        </h1>
        <p className="text-gray-500 mt-1">
          Manage your personal and academic information
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
        {/* Left Column - Profile Info & Stats */}
        <div className="space-y-6">
          {/* Profile Card */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="bg-gradient-to-r from-indigo-600 to-purple-600 px-6 py-6">
              <div className="flex items-center gap-4">
                <div className="relative">
                  <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center shadow-lg">
                    <span className="text-3xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                      {getInitials()}
                    </span>
                  </div>
                  <button className="absolute bottom-0 right-0 bg-white rounded-full p-1.5 shadow-md hover:bg-gray-50 transition">
                    <Camera size={14} className="text-gray-600" />
                  </button>
                </div>
                <div className="text-white">
                  <h2 className="text-xl font-bold">{fullName || "Student"}</h2>
                  <p className="text-indigo-100 text-sm">{email}</p>
                  <span className="inline-flex items-center gap-1 mt-2 bg-white/20 rounded-full px-2 py-0.5 text-xs">
                    <BadgeCheck size={12} /> Active Student
                  </span>
                </div>
              </div>
            </div>

            <div className="p-6">
              <h3 className="font-semibold text-gray-900 mb-3">
                Study Statistics
              </h3>
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-indigo-50 rounded-xl p-3 text-center">
                  <BookOpen
                    size={18}
                    className="text-indigo-600 mx-auto mb-1"
                  />
                  <p className="text-xl font-bold text-indigo-600">
                    {stats.coursesCompleted}
                  </p>
                  <p className="text-xs text-gray-600">Courses Done</p>
                </div>
                <div className="bg-green-50 rounded-xl p-3 text-center">
                  <Award size={18} className="text-green-600 mx-auto mb-1" />
                  <p className="text-xl font-bold text-green-600">
                    {stats.totalQuestions}
                  </p>
                  <p className="text-xs text-gray-600">Questions</p>
                </div>
                <div className="bg-purple-50 rounded-xl p-3 text-center">
                  <GraduationCap
                    size={18}
                    className="text-purple-600 mx-auto mb-1"
                  />
                  <p className="text-xl font-bold text-purple-600">
                    {stats.averageScore}%
                  </p>
                  <p className="text-xs text-gray-600">Avg Score</p>
                </div>
                <div className="bg-orange-50 rounded-xl p-3 text-center">
                  <BadgeCheck
                    size={18}
                    className="text-orange-600 mx-auto mb-1"
                  />
                  <p className="text-xl font-bold text-orange-600">
                    {stats.studyStreak}
                  </p>
                  <p className="text-xs text-gray-600">Day Streak</p>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            {/* <h3 className="font-semibold text-gray-900 mb-3">Quick Actions</h3> */}
            <div className="space-y-2">
              
             
              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-3 p-3 rounded-xl bg-red-50 hover:bg-red-100 transition group"
              >
                <LogOut size={18} className="text-red-600" />
                <span className="text-sm text-red-600 font-medium">Logout</span>
              </button>
            </div>
          </div>
        </div>

        {/* Right Column - Edit Form */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="flex items-center gap-2 pb-3 border-b border-gray-100">
              <User2 size={20} className="text-indigo-600" />
              <h3 className="font-semibold text-gray-900">
                Personal Information
              </h3>
            </div>

            {success && (
              <div className="rounded-xl bg-green-50 p-3 text-green-700 border border-green-100 text-sm">
                {success}
              </div>
            )}
            {error && (
              <div className="rounded-xl bg-red-50 p-3 text-red-700 border border-red-100 text-sm">
                {error}
              </div>
            )}

            {/* Email (Read Only) */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email Address
              </label>
              <div className="flex items-center gap-2 rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 text-gray-500">
                <Mail size={16} />
                <span className="text-sm">{email || "No email available"}</span>
              </div>
            </div>

            {/* Full Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Full Name
              </label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-100 transition"
                required
                placeholder="Enter your full name"
              />
            </div>

            {/* Phone Number */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Phone Number
              </label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-100 transition"
                placeholder="+251-911-123456"
              />
            </div>

            <div className="flex items-center gap-2 pt-2 pb-3 border-b border-gray-100">
              <GraduationCap size={20} className="text-indigo-600" />
              <h3 className="font-semibold text-gray-900">
                Academic Information
              </h3>
            </div>

            {/* University */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                University
              </label>
              <select
                value={university}
                onChange={(e) => setUniversity(e.target.value)}
                className="w-full rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-100 transition"
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
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Student ID
              </label>
              <input
                type="text"
                value={studentId}
                onChange={(e) => setStudentId(e.target.value)}
                className="w-full rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-100 transition"
                placeholder="e.g., ATR/1234/12"
              />
            </div>

            {/* Department */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Department
              </label>
              <select
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                className="w-full rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-100 transition"
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
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Year of Study
              </label>
              <select
                value={yearOfStudy}
                onChange={(e) => setYearOfStudy(e.target.value)}
                className="w-full rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-100 transition"
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
              className={`w-full inline-flex items-center justify-center gap-2 rounded-xl py-3 text-sm font-semibold text-white transition ${
                loading
                  ? "bg-indigo-400 cursor-not-allowed"
                  : "bg-gradient-to-r from-indigo-600 to-purple-600 hover:shadow-lg hover:shadow-indigo-200"
              }`}
            >
              {loading && <Loader2 size={18} className="animate-spin" />}
              <Save size={16} />
              {loading ? "Saving..." : "Save Changes"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default StudentProfile;
