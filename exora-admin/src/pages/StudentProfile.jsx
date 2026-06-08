import { useState, useEffect } from "react";
import { clearSession, getUserId, getUserEmail, getUserFullName } from "../utils/auth";
import api from "../api/axios";
import { Loader2, Mail, User2, Save, Phone, GraduationCap, ArrowLeft, CheckCircle, AlertCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";

const StudentProfile = () => {
  const userId = getUserId();
  const navigate = useNavigate();
  const [fullName, setFullName] = useState(getUserFullName() || "");
  const [email] = useState(getUserEmail() || "");
  const [phone, setPhone] = useState("");
  const [university, setUniversity] = useState("");
  const [studentId, setStudentId] = useState("");
  const [department, setDepartment] = useState("");
  const [yearOfStudy, setYearOfStudy] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const { data } = await api.get("/student/profile");
        setPhone(data.phone || "");
        setUniversity(data.university || "");
        setStudentId(data.studentId || "");
        setDepartment(data.department || "");
        setYearOfStudy(data.yearOfStudy || "");
      } catch {}
    };
    fetchProfile();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSuccess(""); setError(""); setLoading(true);
    try {
      await api.put(`/users/${userId}`, { full_name: fullName });
      await api.put(`/users/${userId}/profile`, { phone, university, student_id: studentId, department, year_of_study: yearOfStudy }).catch(() => {});
      localStorage.setItem("fullName", fullName);
      setSuccess("Profile updated!");
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      setError(err.response?.data?.error || "Update failed");
      setTimeout(() => setError(""), 3000);
    } finally { setLoading(false); }
  };

  const getInitials = () => fullName ? fullName.charAt(0).toUpperCase() : "S";

  return (
    <div className="space-y-6 pb-8 max-w-2xl mx-auto">
      <button onClick={() => navigate("/student")} className="inline-flex items-center gap-1.5 text-sm text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-white transition group">
        <ArrowLeft size={15} className="group-hover:-translate-x-0.5 transition" /> Back to Dashboard
      </button>

      <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="bg-gradient-to-r from-indigo-600 to-purple-600 p-6 text-white">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center text-2xl font-bold">{getInitials()}</div>
            <div>
              <h1 className="text-xl font-bold">{fullName || "Student"}</h1>
              <p className="text-indigo-200 text-sm">{email}</p>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {success && <div className="bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-lg p-3 text-emerald-700 dark:text-emerald-400 text-sm flex items-center gap-2"><CheckCircle size={16} />{success}</div>}
          {error && <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3 text-red-700 dark:text-red-400 text-sm flex items-center gap-2"><AlertCircle size={16} />{error}</div>}

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Email (Read Only)</label>
            <div className="flex items-center gap-2 rounded-lg border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 px-3 py-2.5 text-gray-500 dark:text-gray-400"><Mail size={14} /><span className="text-sm">{email}</span></div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Full Name</label>
            <input type="text" value={fullName} onChange={(e) => setFullName(e.target.value)} className="w-full rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2.5 text-sm dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none" required />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Phone</label>
            <div className="relative"><Phone size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" /><input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} className="w-full pl-9 pr-3 py-2.5 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none" placeholder="+251-..." /></div>
          </div>

          <div className="border-t border-gray-100 dark:border-gray-700 pt-4">
            <div className="flex items-center gap-2 mb-3"><GraduationCap size={16} className="text-gray-500" /><span className="font-medium text-gray-900 dark:text-white text-sm">Academic Info</span></div>
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">University</label>
                <select value={university} onChange={(e) => setUniversity(e.target.value)} className="w-full rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2.5 text-sm dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none">
                  <option value="">Select</option>
                  <option>Addis Ababa University</option><option>Jimma University</option><option>Bahir Dar University</option><option>Mekelle University</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Student ID</label>
                <input type="text" value={studentId} onChange={(e) => setStudentId(e.target.value)} className="w-full rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2.5 text-sm dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none" placeholder="e.g. ATR/1234/12" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Department</label>
                <select value={department} onChange={(e) => setDepartment(e.target.value)} className="w-full rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2.5 text-sm dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none">
                  <option value="">Select</option>
                  <option>Information Technology</option><option>Computer Science</option><option>Software Engineering</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Year</label>
                <select value={yearOfStudy} onChange={(e) => setYearOfStudy(e.target.value)} className="w-full rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2.5 text-sm dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none">
                  <option value="">Select</option>
                  <option>1st Year</option><option>2nd Year</option><option>3rd Year</option><option>4th Year</option>
                </select>
              </div>
            </div>
          </div>

          <button type="submit" disabled={loading} className={`w-full flex items-center justify-center gap-2 rounded-lg py-2.5 text-sm font-medium text-white transition ${loading ? "bg-gray-400 cursor-not-allowed" : "bg-indigo-600 hover:bg-indigo-700"}`}>
            {loading ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
            {loading ? "Saving..." : "Save Changes"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default StudentProfile;