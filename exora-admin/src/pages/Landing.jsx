import { useState, useEffect } from 'react';
import { GraduationCap, BookOpen, FileCheck, Award, TrendingUp, Users, Star, ArrowRight, Menu, X, CheckCircle, Smartphone, Download, ChevronDown } from 'lucide-react';
import { Link } from 'react-router-dom';
import Logo from '../assets/logo.png';
import dashboardImg from '../assets/dashboard_screen.jpg';


const Landing = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrollY, setScrollY] = useState(0);
  const [showDownloadBanner, setShowDownloadBanner] = useState(true);

  useEffect(() => {
    const handleScroll = () => {
      setScrollY(window.scrollY);
      if (window.scrollY > 600) setShowDownloadBanner(false);
      else setShowDownloadBanner(true);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const features = [
    { icon: <BookOpen size={28} />, title: 'Past Exit Exams', desc: 'Practice with real past exam papers from various departments.' },
    { icon: <FileCheck size={28} />, title: 'Model Exams', desc: 'Full mock exam simulations to test your readiness.' },
    { icon: <Award size={28} />, title: 'Instant Feedback', desc: 'Get correct answers with detailed explanations.' },
    { icon: <TrendingUp size={28} />, title: 'Progress Tracking', desc: 'Monitor your performance for each course.' },
    { icon: <BookOpen size={28} />, title: 'Course Materials', desc: 'Download lecture notes and PDFs for offline study.' },
    { icon: <Users size={28} />, title: 'Community Support', desc: 'Join our Telegram group for tips and updates.' },
  ];

  const steps = [
    { step: '01', title: 'Create Account', desc: 'Register with your email and choose your department.' },
    { step: '02', title: 'Unlock Courses', desc: 'Make a one-time payment and upload your receipt.' },
    { step: '03', title: 'Start Practicing', desc: 'Access past exams, model questions, and materials.' },
    { step: '04', title: 'Track & Improve', desc: 'Monitor your scores and ace your exit exams!' },
  ];

  const stats = [
    { value: '1000+', label: 'Questions' },
    { value: '50+', label: 'Courses' },
    { value: '4+', label: 'Departments' },
    { value: '24/7', label: 'Access' },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-indigo-50 via-white to-indigo-50">
      {/* Download Banner */}
      <div className={`bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-700 transition-all duration-500 ${showDownloadBanner ? 'h-16 opacity-100' : 'h-0 opacity-0 overflow-hidden'}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-full flex items-center justify-between">
          <div className="flex items-center gap-3 text-white">
            <Smartphone size={22} className="animate-bounce" />
            <span className="text-sm sm:text-base font-medium"> Download the Exora mobile app for the best experience!</span>
          </div>
          <a href="https://t.me/exora_mobile/3" className="flex items-center gap-2 bg-white text-indigo-600 px-4 py-1.5 rounded-full text-sm font-semibold hover:shadow-lg transition">
            <Download size={16} /> Download
          </a>
        </div>
      </div>

      {/* Navbar */}
      <nav className={`fixed w-full z-50 transition-all duration-300 ${scrollY > 20 ? 'bg-white/95 backdrop-blur shadow-lg' : 'bg-transparent'}`} style={{ top: showDownloadBanner ? '64px' : '0' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <img src={Logo} alt="Exora" className="w-10 h-10 rounded-xl" />
              <span className="text-2xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">Exora</span>
            </div>

            <div className="hidden md:flex items-center gap-8">
              <a href="#features" className="text-gray-600 hover:text-indigo-600 font-medium transition">Features</a>
              <a href="#how-it-works" className="text-gray-600 hover:text-indigo-600 font-medium transition">How It Works</a>
              <a href="#mobile-app" className="text-gray-600 hover:text-indigo-600 font-medium transition">Mobile App</a>
            </div>

            <div className="hidden md:flex items-center gap-3">
              <a href="/login" className="px-5 py-2.5 text-indigo-600 font-semibold hover:bg-indigo-50 rounded-xl transition">Login</a>
              <a href="/register" className="px-5 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-semibold rounded-xl hover:shadow-lg hover:shadow-indigo-200 transition flex items-center gap-2">
                Get Started <ArrowRight size={18} />
              </a>
            </div>

            <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="md:hidden p-2">
              {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>

        {mobileMenuOpen && (
          <div className="md:hidden bg-white border-t">
            <div className="px-4 py-4 space-y-3">
              <a href="#features" className="block text-gray-600 hover:text-indigo-600 font-medium">Features</a>
              <a href="#how-it-works" className="block text-gray-600 hover:text-indigo-600 font-medium">How It Works</a>
              <a href="#mobile-app" className="block text-gray-600 hover:text-indigo-600 font-medium">Mobile App</a>
              <div className="flex gap-3 pt-3 border-t">
                <a href="/login" className="flex-1 text-center px-4 py-2.5 text-indigo-600 font-semibold border border-indigo-200 rounded-xl">Login</a>
                <a href="/signup" className="flex-1 text-center px-4 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-semibold rounded-xl">Get Started</a>
              </div>
            </div>
          </div>
        )}
      </nav>

      {/* Hero Section */}
      <section className="pt-28 pb-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div className="animate-fadeInUp">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-100 text-indigo-700 rounded-full text-sm font-medium mb-6">
              <Star size={16} className="fill-indigo-500" /> #1 Exit Exam Prep Platform
            </div>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-gray-900 leading-tight">
              Ace Your <span className="bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">Exit Exams</span> with Confidence
            </h1>
            <p className="text-lg text-gray-600 mt-6 leading-relaxed max-w-lg">
              Access past exit exams, model questions, and course materials all in one place. Practice, track your progress, and prepare for success.
            </p>
            <div className="flex flex-wrap gap-4 mt-8">
              <a href="/register" className="px-8 py-4 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-semibold rounded-xl hover:shadow-xl hover:shadow-indigo-200 transition flex items-center gap-2 text-lg group">
                Start Free Trial <ArrowRight size={22} className="group-hover:translate-x-1 transition-transform" />
              </a>
              <a href="#features" className="px-8 py-4 border-2 border-gray-200 text-gray-700 font-semibold rounded-xl hover:border-indigo-300 transition">
                Learn More <ChevronDown size={18} className="inline ml-1" />
              </a>
            </div>
            <div className="flex items-center gap-6 mt-8 text-sm text-gray-500">
              <span className="flex items-center gap-1"><CheckCircle size={16} className="text-green-500" /> Free courses available</span>
              <span className="flex items-center gap-1"><CheckCircle size={16} className="text-green-500" /> One-time payment</span>
            </div>
          </div>
          <div className="hidden lg:block animate-fadeIn">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-indigo-400 to-purple-400 rounded-3xl blur-2xl opacity-20"></div>
              <div className="relative bg-white rounded-3xl shadow-2xl p-8 border border-gray-100">
                <div className="grid grid-cols-2 gap-4">
                  {[
                    { icon: '📚', label: 'Course Materials', color: 'bg-purple-50 text-purple-700' },
                    { icon: '📝', label: 'Past Exams', color: 'bg-blue-50 text-blue-700' },
                    { icon: '🧪', label: 'Model Exams', color: 'bg-green-50 text-green-700' },
                    { icon: '📊', label: 'Track Progress', color: 'bg-orange-50 text-orange-700' },
                  ].map((item, i) => (
                    <div key={i} className={`${item.color} p-4 rounded-2xl text-center transition-transform duration-300 hover:scale-105`}>
                      <div className="text-3xl mb-2">{item.icon}</div>
                      <div className="text-sm font-medium">{item.label}</div>
                    </div>
                  ))}
                </div>
                <div className="mt-6 p-4 bg-gradient-to-r from-indigo-50 to-purple-50 rounded-2xl">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-sm text-gray-500">Your Progress</div>
                      <div className="text-2xl font-bold text-indigo-600">85%</div>
                    </div>
                    <div className="w-20 h-20 rounded-full border-4 border-indigo-200 border-t-indigo-600 animate-spin" style={{ animationDuration: '3s' }}></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section id="stats" className="py-12 bg-white border-y">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, i) => (
              <div key={i} className="text-center animate-fadeInUp" style={{ animationDelay: `${i * 100}ms` }}>
                <div className="text-3xl sm:text-4xl font-extrabold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">{stat.value}</div>
                <div className="text-gray-500 text-sm mt-1">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Mobile App Showcase */}
      <section id="mobile-app" className="py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left: Explanation */}
          <div className="animate-slideInLeft">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-green-100 text-green-700 rounded-full text-sm font-medium mb-6">
              <Smartphone size={16} /> Mobile App Available
            </div>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-gray-900 leading-tight">
              Study Anywhere with the <span className="bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">Exora App</span>
            </h2>
            <p className="text-lg text-gray-600 mt-6 leading-relaxed">
              Download the Exora mobile app and take your exam preparation with you wherever you go. Access all your courses, practice questions, and materials right from your phone.
            </p>
            <div className="space-y-4 mt-8">
              {[
                'Practice past exams and model questions on the go',
                'Download course materials for offline study',
                'Track your progress and scores in real-time',
                'Receive instant notifications for new courses and updates',
                'Submit payments and unlock courses from your phone',
              ].map((item, i) => (
                <div key={i} className="flex items-start gap-3 animate-fadeInUp" style={{ animationDelay: `${i * 150}ms` }}>
                  <CheckCircle size={20} className="text-green-500 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-600">{item}</span>
                </div>
              ))}
            </div>
            <div className="flex flex-wrap gap-4 mt-8">
              <a href="https://t.me/exora_mobile/3" className="px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-semibold rounded-xl hover:shadow-lg transition flex items-center gap-2">
                <Download size={20} /> Download for Android
              </a>
              <a href="#download" className="px-6 py-3 border-2 border-gray-200 text-gray-700 font-semibold rounded-xl hover:border-indigo-300 transition flex items-center gap-2">
                <Smartphone size={20} /> Coming to iOS
              </a>
            </div>
          </div>

          {/* Right: App Screenshot */}
          <div className="flex justify-center animate-slideInRight">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-indigo-400 to-purple-400 rounded-3xl blur-2xl opacity-20"></div>
              <div className="relative bg-gray-900 rounded-[3rem] p-4 shadow-2xl border-4 border-gray-800 max-w-xs">
                {/* Notch */}
                <div className="w-20 h-1.5 bg-gray-700 rounded-full mx-auto mb-3"></div>
                {/* Screen */}
                <div className="bg-white rounded-2xl overflow-hidden">
                  <img
                    src={dashboardImg}
                    alt="Exora Dashboard"
                    className="w-full h-auto"
                    onError={(e) => {
                      e.target.style.display = 'none';
                      e.target.parentElement.innerHTML = '<div class="flex items-center justify-center h-96 bg-gradient-to-b from-indigo-500 to-purple-600 rounded-2xl"><div class="text-center text-white p-6"><div class="text-5xl mb-4">📱</div><p class="font-bold text-xl">Exora App</p><p class="text-indigo-200 text-sm mt-2">Dashboard Screenshot</p></div></div>';
                    }}
                  />
                </div>
                {/* Home indicator */}
                <div className="w-24 h-1 bg-gray-600 rounded-full mx-auto mt-3"></div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl font-extrabold text-gray-900">Everything You Need to Succeed</h2>
          <p className="text-gray-500 mt-4 max-w-2xl mx-auto">Comprehensive tools and resources designed to help you prepare effectively for your exit exams.</p>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, i) => (
            <div key={i} className="group bg-white p-8 rounded-2xl shadow-sm border border-gray-100 hover:shadow-xl hover:border-indigo-200 transition-all duration-300 animate-fadeInUp" style={{ animationDelay: `${i * 100}ms` }}>
              <div className="w-14 h-14 bg-gradient-to-br from-indigo-100 to-purple-100 rounded-xl flex items-center justify-center text-indigo-600 group-hover:from-indigo-600 group-hover:to-purple-600 group-hover:text-white transition-all duration-300">
                {feature.icon}
              </div>
              <h3 className="text-xl font-bold text-gray-900 mt-5">{feature.title}</h3>
              <p className="text-gray-500 mt-2 leading-relaxed">{feature.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl font-extrabold text-gray-900">How It Works</h2>
          <p className="text-gray-500 mt-4">Get started in four simple steps</p>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {steps.map((step, i) => (
            <div key={i} className="text-center relative animate-fadeInUp" style={{ animationDelay: `${i * 150}ms` }}>
              <div className="w-20 h-20 bg-gradient-to-br from-indigo-600 to-purple-600 text-white rounded-2xl flex items-center justify-center text-2xl font-bold mx-auto shadow-lg hover:scale-110 transition-transform duration-300">{step.step}</div>
              <h3 className="text-lg font-bold text-gray-900 mt-6">{step.title}</h3>
              <p className="text-gray-500 text-sm mt-2">{step.desc}</p>
              {i < steps.length - 1 && (
                <div className="hidden lg:block absolute top-10 left-[60%] w-[80%] h-0.5 bg-gradient-to-r from-indigo-200 to-transparent"></div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section id="download" className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto bg-gradient-to-r from-indigo-600 to-purple-600 rounded-3xl p-10 sm:p-16 text-center shadow-2xl shadow-indigo-200 relative overflow-hidden">
          <div className="absolute inset-0 bg-white/10 backdrop-blur"></div>
          <div className="relative z-10">
            <h2 className="text-3xl sm:text-4xl font-extrabold text-white">Ready to Ace Your Exit Exams?</h2>
            <p className="text-indigo-100 mt-4 text-lg">Join thousands of students preparing with Exora. Download the app or sign up now!</p>
            <div className="flex flex-wrap justify-center gap-4 mt-8">
              <a href="/signup" className="px-8 py-4 bg-white text-indigo-600 font-bold rounded-xl hover:shadow-xl transition flex items-center gap-2 text-lg group">
                Get Started Free <ArrowRight size={22} className="group-hover:translate-x-1 transition-transform" />
              </a>
              <a href="/login" className="px-8 py-4 border-2 border-white/30 text-white font-semibold rounded-xl hover:bg-white/10 transition">
                I Already Have an Account
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-400 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-3">
              <img src={Logo} alt="Exora" className="w-10 h-10 rounded-xl" />
              <span className="text-xl font-bold text-white">Exora</span>
            </div>
            <div className="flex gap-6 text-sm">
              <a href="#features" className="hover:text-white transition">Features</a>
              <a href="#how-it-works" className="hover:text-white transition">How It Works</a>
              <a href="#mobile-app" className="hover:text-white transition">Mobile App</a>
              <a href="/login" className="hover:text-white transition">Login</a>
              <a href="/signup" className="hover:text-white transition">Register</a>
            </div>
            <p className="text-sm">© 2026 Exora. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Landing;