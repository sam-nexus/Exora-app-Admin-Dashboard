import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Loader2 } from 'lucide-react';
import api from '../api/axios';
import { registerForPushNotifications } from '../firebase-messaging';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const { data } = await api.post('/auth/login', { email, password });
      localStorage.setItem('token', data.token);
      localStorage.setItem('role', data.user.role);
      localStorage.setItem('userId', data.user.id);
      localStorage.setItem('email', email);
      localStorage.setItem('fullName', data.user.full_name || '');

      try {
        const fcmToken = await registerForPushNotifications();
        if (fcmToken){
          localStorage.setItem('fcmToken', fcmToken);
          await api.post('/devices/register', { token: fcmToken, platform: '' });
        }
        
      } catch {
        // non-fatal
      }

      if (data.user.role === 'admin') navigate('/dashboard');
      else navigate('/student');
    } catch (err) {
      if (err.response?.status === 403) {
        setError(err.response.data.error); // "You are already logged in on another device..."
      } else {
        setError(err.response?.data?.error || 'Login failed');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <style>{`
        @keyframes cardIn {
          from { opacity: 0; transform: translateY(28px) scale(0.97); }
          to   { opacity: 1; transform: translateY(0)  scale(1);    }
        }
        @keyframes logoIn {
          from { opacity: 0; transform: scale(0.6) rotate(-10deg); }
          to   { opacity: 1; transform: scale(1)   rotate(0deg);   }
        }
        .card-enter  { animation: cardIn  0.5s cubic-bezier(.22,1,.36,1) both; }
        .logo-enter  { animation: logoIn  0.6s cubic-bezier(.22,1,.36,1) 0.1s both; }
      `}</style>

      <div
        className="min-h-screen relative flex items-center justify-center p-4 overflow-hidden"
        style={{
          backgroundImage: 'url(/bg.jpg)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
        }}
      >
        {/* overlay */}
        <div className="absolute inset-0 bg-black/45 backdrop-blur-[2px]" />

        <div className="relative z-10 w-full max-w-md card-enter">
          <form
            onSubmit={handleSubmit}
            className="bg-white/92 backdrop-blur-md rounded-3xl shadow-2xl border border-white/40 px-8 pt-10 pb-8"
          >
            {/* Logo — round with solid white fill */}
            <div className="flex justify-center mb-6 logo-enter">
              <div className="w-24 h-24 rounded-full shadow-2xl ring-4 ring-white overflow-hidden">
                <img src="/logoIcon.png" alt="Exora" className="w-full h-full object-cover" />
              </div>
            </div>

            <h2 className="text-3xl font-extrabold text-gray-800 text-center">Exora Login</h2>
            <p className="text-gray-500 text-sm text-center mt-1 mb-7">Sign in to your Exora account</p>

            {error && (
              <div className="mb-5 p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl text-sm flex items-center gap-2">
                <svg className="w-4 h-4 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                {error}
              </div>
            )}

            {/* Email */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </div>
                <input
                  type="email"
                  placeholder="youremail@gmail.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all outline-none"
                  required
                  disabled={loading}
                />
              </div>
            </div>

            {/* Password */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-12 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all outline-none"
                  required
                  disabled={loading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 transition"
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className={`w-full py-3 rounded-xl font-bold text-white transition-all duration-200 flex items-center justify-center gap-2
                ${loading ? 'bg-indigo-400 cursor-not-allowed' : 'bg-indigo-600 hover:bg-indigo-700 hover:shadow-lg hover:scale-[1.02] active:scale-[0.98]'}`}
            >
              {loading && <Loader2 size={20} className="animate-spin" />}
              {loading ? 'Signing in…' : 'Sign In'}
            </button>

            {/* Links */}
            <p className="text-center text-sm text-gray-500 mt-5">
              <Link to="/forgot-password" className="text-indigo-600 hover:text-indigo-800 font-medium transition-colors">
                Forgot your password?
              </Link>
              {' | '}
              <Link
                to="/signup"
                className="text-indigo-600 hover:text-indigo-800 font-medium transition-colors
                  relative after:absolute after:bottom-0 after:left-0 after:h-0.5 after:w-0
                  after:bg-indigo-600 hover:after:w-full after:transition-all after:duration-300"
              >
                Sign Up
              </Link>
            </p>
          </form>
        </div>
      </div>
    </>
  );
};

export default Login;
