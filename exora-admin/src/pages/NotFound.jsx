import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Home } from 'lucide-react';

const NotFound = () => {
  const navigate = useNavigate();
  const role = localStorage.getItem('role');
  const homePath = role === 'admin' ? '/' : role === 'user' ? '/student' : '/login';

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 flex flex-col items-center justify-center px-4">
      {/* SVG illustration */}
      <img
        src="/404PAGE.svg"
        alt="Page not found"
        className="w-full max-w-md mb-8 select-none"
        draggable={false}
      />

      <h1 className="text-3xl font-extrabold text-gray-900 mb-2 text-center">
        Page Not Found
      </h1>
      <p className="text-gray-500 text-center mb-8 max-w-sm">
        The page you're looking for doesn't exist or has been moved.
      </p>

      <div className="flex items-center gap-3">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl border border-gray-300 text-gray-700 font-semibold hover:bg-gray-50 transition active:scale-95"
        >
          <ArrowLeft size={16} />
          Go Back
        </button>
        <button
          onClick={() => navigate(homePath)}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 text-white font-semibold hover:bg-indigo-700 transition active:scale-95 shadow-md shadow-indigo-200"
        >
          <Home size={16} />
          Go Home
        </button>
      </div>
    </div>
  );
};

export default NotFound;
