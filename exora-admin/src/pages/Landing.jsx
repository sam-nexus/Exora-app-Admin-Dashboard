import { useState, useEffect } from 'react';
import {
    GraduationCap,
    BookOpen,
    FileCheck,
    Award,
    TrendingUp,
    Users,
    Star,
    ArrowRight,
    Menu,
    X,
    CheckCircle,
    Smartphone,
    Download,
    ChevronDown,
    Sun,
    Moon,
} from 'lucide-react';
import Logo from '../assets/logo.png';
import dashboardImg from '../assets/dashboard_screen.jpg';

const Landing = () => {
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [scrollY, setScrollY] = useState(0);
    const [showDownloadBanner, setShowDownloadBanner] = useState(true);
    const [darkMode, setDarkMode] = useState(false);

    // Load theme preference
    useEffect(() => {
        const savedTheme = localStorage.getItem('theme');
        if (savedTheme === 'dark' || (!savedTheme && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
            setDarkMode(true);
        }
    }, []);

    // Apply theme class to html
    useEffect(() => {
        if (darkMode) {
            document.documentElement.classList.add('dark');
            localStorage.setItem('theme', 'dark');
        } else {
            document.documentElement.classList.remove('dark');
            localStorage.setItem('theme', 'light');
        }
    }, [darkMode]);

    // Scroll handler
    useEffect(() => {
        const handleScroll = () => {
            setScrollY(window.scrollY);
            if (window.scrollY > 600) setShowDownloadBanner(false);
            else setShowDownloadBanner(true);
        };
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    // Close mobile menu on resize
    useEffect(() => {
        const handleResize = () => {
            if (window.innerWidth >= 768) setMobileMenuOpen(false);
        };
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
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
        <div className="min-h-screen bg-gradient-to-b from-indigo-50 via-white to-indigo-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 transition-colors duration-300">
            {/* Download Banner */}
            <div
                className={`bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-700 transition-all duration-500 ${showDownloadBanner ? 'h-14 sm:h-16 opacity-100' : 'h-0 opacity-0 overflow-hidden'
                    }`}
            >
                <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 h-full flex items-center justify-between">
                    <div className="flex items-center gap-2 sm:gap-3 text-white">
                        <Smartphone size={20} className="animate-bounce hidden sm:block" />
                        <span className="text-xs sm:text-sm md:text-base font-medium">
                            📱 Download the Exora mobile app for the best experience!
                        </span>
                    </div>
                    <a
                        href="https://t.me/exora_mobile/3"
                        className="flex items-center gap-1.5 sm:gap-2 bg-white text-indigo-600 px-3 sm:px-4 py-1 sm:py-1.5 rounded-full text-xs sm:text-sm font-semibold hover:shadow-lg transition"
                    >
                        <Download size={14} className="sm:block hidden" /> Download
                    </a>
                </div>
            </div>

            {/* Navbar */}
            <nav
                className={`fixed w-full z-50 transition-all duration-300 ${scrollY > 20
                    ? 'bg-white/95 dark:bg-gray-900/95 backdrop-blur shadow-lg'
                    : 'bg-transparent dark:bg-transparent'
                    }`}
                style={{ top: showDownloadBanner ? (typeof window !== 'undefined' && window.innerWidth < 640 ? '56px' : '64px') : '0' }}
            >
                <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-between h-14 sm:h-16">
                        {/* Logo */}
                        <div className="flex items-center gap-2 sm:gap-3">
                            <img src={Logo} alt="Exora" className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl" />
                            <span className="text-lg sm:text-2xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                                Exora
                            </span>
                        </div>

                        {/* Desktop Nav Links */}
                        <div className="hidden md:flex items-center gap-6 lg:gap-8">
                            <a href="#features" className="text-gray-600 dark:text-gray-300 hover:text-indigo-600 dark:hover:text-indigo-400 font-medium text-sm transition">
                                Features
                            </a>
                            <a href="#how-it-works" className="text-gray-600 dark:text-gray-300 hover:text-indigo-600 dark:hover:text-indigo-400 font-medium text-sm transition">
                                How It Works
                            </a>
                            <a href="#mobile-app" className="text-gray-600 dark:text-gray-300 hover:text-indigo-600 dark:hover:text-indigo-400 font-medium text-sm transition">
                                Mobile App
                            </a>
                        </div>

                        {/* Desktop Buttons */}
                        <div className="hidden md:flex items-center gap-2 lg:gap-3">
                            {/* Theme Toggle */}
                            <button
                                onClick={() => setDarkMode(!darkMode)}
                                className="p-2 text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition"
                                aria-label="Toggle theme"
                            >
                                {darkMode ? <Sun size={18} /> : <Moon size={18} />}
                            </button>
                            <a
                                href="/login"
                                className="px-4 lg:px-5 py-2 lg:py-2.5 text-indigo-600 dark:text-indigo-400 font-semibold hover:bg-indigo-50 dark:hover:bg-indigo-900/30 rounded-xl transition text-sm"
                            >
                                Login
                            </a>
                            <a
                                href="/register"
                                className="px-4 lg:px-5 py-2 lg:py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-semibold rounded-xl hover:shadow-lg hover:shadow-indigo-200 dark:hover:shadow-indigo-900 transition flex items-center gap-2 text-sm"
                            >
                                Get Started <ArrowRight size={16} />
                            </a>
                        </div>

                        {/* Mobile Menu Button */}
                        <div className="flex md:hidden items-center gap-1">
                            <button
                                onClick={() => setDarkMode(!darkMode)}
                                className="p-2 text-gray-500 dark:text-gray-400"
                                aria-label="Toggle theme"
                            >
                                {darkMode ? <Sun size={18} /> : <Moon size={18} />}
                            </button>
                            <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="p-2">
                                {mobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
                            </button>
                        </div>
                    </div>
                </div>

                {/* Mobile Menu */}
                {mobileMenuOpen && (
                    <div className="md:hidden bg-white dark:bg-gray-900 border-t dark:border-gray-700 shadow-lg">
                        <div className="px-4 py-4 space-y-3">
                            <a
                                href="#features"
                                onClick={() => setMobileMenuOpen(false)}
                                className="block text-gray-600 dark:text-gray-300 hover:text-indigo-600 dark:hover:text-indigo-400 font-medium text-sm py-2"
                            >
                                Features
                            </a>
                            <a
                                href="#how-it-works"
                                onClick={() => setMobileMenuOpen(false)}
                                className="block text-gray-600 dark:text-gray-300 hover:text-indigo-600 dark:hover:text-indigo-400 font-medium text-sm py-2"
                            >
                                How It Works
                            </a>
                            <a
                                href="#mobile-app"
                                onClick={() => setMobileMenuOpen(false)}
                                className="block text-gray-600 dark:text-gray-300 hover:text-indigo-600 dark:hover:text-indigo-400 font-medium text-sm py-2"
                            >
                                Mobile App
                            </a>
                            <div className="flex gap-3 pt-3 border-t dark:border-gray-700">
                                <a
                                    href="/login"
                                    className="flex-1 text-center px-4 py-2.5 text-indigo-600 dark:text-indigo-400 font-semibold border border-indigo-200 dark:border-indigo-800 rounded-xl text-sm"
                                >
                                    Login
                                </a>
                                <a
                                    href="/signup"
                                    className="flex-1 text-center px-4 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-semibold rounded-xl text-sm"
                                >
                                    Get Started
                                </a>
                            </div>
                        </div>
                    </div>
                )}
            </nav>

            {/* Hero Section */}
            <section className="pt-24 sm:pt-28 pb-10 sm:pb-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
                <div className="grid lg:grid-cols-2 gap-8 sm:gap-12 items-center">
                    <div className="animate-fadeInUp text-center lg:text-left">
                        <div className="inline-flex items-center gap-2 px-3 sm:px-4 py-1.5 sm:py-2 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 rounded-full text-xs sm:text-sm font-medium mb-4 sm:mb-6">
                            <Star size={14} className="fill-indigo-500" /> #1 Exit Exam Prep Platform
                        </div>
                        <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold text-gray-900 dark:text-white leading-tight">
                            Ace Your{' '}
                            <span className="bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                                Exit Exams
                            </span>{' '}
                            with Confidence
                        </h1>
                        <p className="text-base sm:text-lg text-gray-600 dark:text-gray-300 mt-4 sm:mt-6 leading-relaxed max-w-lg mx-auto lg:mx-0">
                            Access past exit exams, model questions, and course materials all in one place. Practice, track your
                            progress, and prepare for success.
                        </p>
                        <div className="flex flex-wrap gap-3 sm:gap-4 mt-6 sm:mt-8 justify-center lg:justify-start">
                            <a
                                href="/register"
                                className="px-6 sm:px-8 py-3 sm:py-4 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-semibold rounded-xl hover:shadow-xl hover:shadow-indigo-200 dark:hover:shadow-indigo-900 transition flex items-center gap-2 text-base sm:text-lg group"
                            >
                                Start Free Trial{' '}
                                <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
                            </a>
                            <a
                                href="#features"
                                className="px-6 sm:px-8 py-3 sm:py-4 border-2 border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300 font-semibold rounded-xl hover:border-indigo-300 dark:hover:border-indigo-700 transition text-base sm:text-lg"
                            >
                                Learn More <ChevronDown size={16} className="inline ml-1" />
                            </a>
                        </div>
                        <div className="flex flex-wrap items-center justify-center lg:justify-start gap-4 sm:gap-6 mt-6 sm:mt-8 text-xs sm:text-sm text-gray-500 dark:text-gray-400">
                            <span className="flex items-center gap-1">
                                <CheckCircle size={14} className="text-green-500" /> Free courses available
                            </span>
                            <span className="flex items-center gap-1">
                                <CheckCircle size={14} className="text-green-500" /> One-time payment
                            </span>
                        </div>
                    </div>
                    <div className="hidden lg:block animate-fadeIn">
                        <div className="relative">
                            <div className="absolute inset-0 bg-gradient-to-r from-indigo-400 to-purple-400 dark:from-indigo-600 dark:to-purple-700 rounded-3xl blur-2xl opacity-20"></div>
                            <div className="relative bg-white dark:bg-gray-800 rounded-3xl shadow-2xl p-6 sm:p-8 border border-gray-100 dark:border-gray-700">
                                <div className="grid grid-cols-2 gap-3 sm:gap-4">
                                    {[
                                        { icon: '📚', label: 'Course Materials', color: 'bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300' },
                                        { icon: '📝', label: 'Past Exams', color: 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300' },
                                        { icon: '🧪', label: 'Model Exams', color: 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300' },
                                        { icon: '📊', label: 'Track Progress', color: 'bg-orange-50 dark:bg-orange-900/20 text-orange-700 dark:text-orange-300' },
                                    ].map((item, i) => (
                                        <div
                                            key={i}
                                            className={`${item.color} p-3 sm:p-4 rounded-2xl text-center transition-transform duration-300 hover:scale-105`}
                                        >
                                            <div className="text-2xl sm:text-3xl mb-1 sm:mb-2">{item.icon}</div>
                                            <div className="text-xs sm:text-sm font-medium">{item.label}</div>
                                        </div>
                                    ))}
                                </div>
                                <div className="mt-4 sm:mt-6 p-3 sm:p-4 bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 rounded-2xl">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <div className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">Your Progress</div>
                                            <div className="text-xl sm:text-2xl font-bold text-indigo-600 dark:text-indigo-400">85%</div>
                                        </div>
                                        <div
                                            className="w-16 h-16 sm:w-20 sm:h-20 rounded-full border-4 border-indigo-200 dark:border-indigo-800 border-t-indigo-600 dark:border-t-indigo-400 animate-spin"
                                            style={{ animationDuration: '3s' }}
                                        ></div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Stats */}
            <section id="stats" className="py-10 sm:py-12 bg-white dark:bg-gray-800 border-y dark:border-gray-700">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-6 sm:gap-8">
                        {stats.map((stat, i) => (
                            <div key={i} className="text-center animate-fadeInUp" style={{ animationDelay: `${i * 100}ms` }}>
                                <div className="text-2xl sm:text-4xl font-extrabold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                                    {stat.value}
                                </div>
                                <div className="text-gray-500 dark:text-gray-400 text-xs sm:text-sm mt-1">{stat.label}</div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Mobile App Showcase */}
            <section id="mobile-app" className="py-16 sm:py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
                <div className="grid lg:grid-cols-2 gap-10 sm:gap-12 items-center">
                    {/* Left: Explanation */}
                    <div className="animate-slideInLeft text-center lg:text-left">
                        <div className="inline-flex items-center gap-2 px-3 sm:px-4 py-1.5 sm:py-2 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded-full text-xs sm:text-sm font-medium mb-4 sm:mb-6">
                            <Smartphone size={14} /> Mobile App Available
                        </div>
                        <h2 className="text-2xl sm:text-4xl font-extrabold text-gray-900 dark:text-white leading-tight">
                            Study Anywhere with the{' '}
                            <span className="bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                                Exora App
                            </span>
                        </h2>
                        <p className="text-base sm:text-lg text-gray-600 dark:text-gray-300 mt-4 sm:mt-6 leading-relaxed">
                            Download the Exora mobile app and take your exam preparation with you wherever you go. Access all your
                            courses, practice questions, and materials right from your phone.
                        </p>
                        <div className="space-y-3 sm:space-y-4 mt-6 sm:mt-8 text-left max-w-md mx-auto lg:mx-0">
                            {[
                                'Practice past exams and model questions on the go',
                                'Download course materials for offline study',
                                'Track your progress and scores in real-time',
                                'Receive instant notifications for new courses and updates',
                                'Submit payments and unlock courses from your phone',
                            ].map((item, i) => (
                                <div
                                    key={i}
                                    className="flex items-start gap-2 sm:gap-3 animate-fadeInUp"
                                    style={{ animationDelay: `${i * 150}ms` }}
                                >
                                    <CheckCircle size={18} className="text-green-500 mt-0.5 flex-shrink-0" />
                                    <span className="text-gray-600 dark:text-gray-300 text-sm sm:text-base">{item}</span>
                                </div>
                            ))}
                        </div>
                        <div className="flex flex-wrap gap-3 sm:gap-4 mt-6 sm:mt-8 justify-center lg:justify-start">
                            <a
                                href="https://t.me/exora_mobile/3"
                                className="px-5 sm:px-6 py-2.5 sm:py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-semibold rounded-xl hover:shadow-lg transition flex items-center gap-2 text-sm sm:text-base"
                            >
                                <Download size={18} /> Download for Android
                            </a>
                            <a
                                href="#download"
                                className="px-5 sm:px-6 py-2.5 sm:py-3 border-2 border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300 font-semibold rounded-xl hover:border-indigo-300 dark:hover:border-indigo-700 transition flex items-center gap-2 text-sm sm:text-base"
                            >
                                <Smartphone size={18} /> Coming to iOS
                            </a>
                        </div>
                    </div>

                    {/* Right: App Screenshot */}
                    <div className="flex justify-center animate-slideInRight">
                        <div className="relative">
                            <div className="absolute inset-0 bg-gradient-to-r from-indigo-400 to-purple-400 dark:from-indigo-600 dark:to-purple-700 rounded-3xl blur-2xl opacity-20"></div>
                            <div className="relative bg-gray-900 rounded-[2.5rem] sm:rounded-[3rem] p-3 sm:p-4 shadow-2xl border-4 border-gray-800 max-w-[240px] sm:max-w-xs">
                                <div className="w-16 sm:w-20 h-1 sm:h-1.5 bg-gray-700 rounded-full mx-auto mb-2 sm:mb-3"></div>
                                <div className="bg-white rounded-2xl overflow-hidden">
                                    <img
                                        src={dashboardImg}
                                        alt="Exora Dashboard"
                                        className="w-full h-auto"
                                        onError={(e) => {
                                            e.target.style.display = 'none';
                                            e.target.parentElement.innerHTML =
                                                '<div class="flex items-center justify-center h-72 sm:h-96 bg-gradient-to-b from-indigo-500 to-purple-600 rounded-2xl"><div class="text-center text-white p-6"><div class="text-4xl sm:text-5xl mb-4">📱</div><p class="font-bold text-lg sm:text-xl">Exora App</p><p class="text-indigo-200 text-xs sm:text-sm mt-2">Dashboard Screenshot</p></div></div>';
                                        }}
                                    />
                                </div>
                                <div className="w-20 sm:w-24 h-0.5 sm:h-1 bg-gray-600 rounded-full mx-auto mt-2 sm:mt-3"></div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Features */}
            <section id="features" className="py-16 sm:py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
                <div className="text-center mb-12 sm:mb-16">
                    <h2 className="text-2xl sm:text-4xl font-extrabold text-gray-900 dark:text-white">
                        Everything You Need to Succeed
                    </h2>
                    <p className="text-gray-500 dark:text-gray-400 mt-3 sm:mt-4 max-w-2xl mx-auto text-sm sm:text-base">
                        Comprehensive tools and resources designed to help you prepare effectively for your exit exams.
                    </p>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                    {features.map((feature, i) => (
                        <div
                            key={i}
                            className="group bg-white dark:bg-gray-800 p-6 sm:p-8 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 hover:shadow-xl hover:border-indigo-200 dark:hover:border-indigo-700 transition-all duration-300 animate-fadeInUp"
                            style={{ animationDelay: `${i * 100}ms` }}
                        >
                            <div className="w-12 h-12 sm:w-14 sm:h-14 bg-gradient-to-br from-indigo-100 to-purple-100 dark:from-indigo-900/30 dark:to-purple-900/30 rounded-xl flex items-center justify-center text-indigo-600 dark:text-indigo-400 group-hover:from-indigo-600 group-hover:to-purple-600 group-hover:text-white transition-all duration-300">
                                {feature.icon}
                            </div>
                            <h3 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white mt-4 sm:mt-5">
                                {feature.title}
                            </h3>
                            <p className="text-gray-500 dark:text-gray-400 mt-2 leading-relaxed text-sm sm:text-base">
                                {feature.desc}
                            </p>
                        </div>
                    ))}
                </div>
            </section>

            {/* How It Works */}
            <section id="how-it-works" className="py-16 sm:py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
                <div className="text-center mb-12 sm:mb-16">
                    <h2 className="text-2xl sm:text-4xl font-extrabold text-gray-900 dark:text-white">How It Works</h2>
                    <p className="text-gray-500 dark:text-gray-400 mt-3 sm:mt-4 text-sm sm:text-base">
                        Get started in four simple steps
                    </p>
                </div>
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8">
                    {steps.map((step, i) => (
                        <div
                            key={i}
                            className="text-center relative animate-fadeInUp"
                            style={{ animationDelay: `${i * 150}ms` }}
                        >
                            <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-br from-indigo-600 to-purple-600 text-white rounded-2xl flex items-center justify-center text-xl sm:text-2xl font-bold mx-auto shadow-lg hover:scale-110 transition-transform duration-300">
                                {step.step}
                            </div>
                            <h3 className="text-base sm:text-lg font-bold text-gray-900 dark:text-white mt-4 sm:mt-6">
                                {step.title}
                            </h3>
                            <p className="text-gray-500 dark:text-gray-400 text-xs sm:text-sm mt-1 sm:mt-2">{step.desc}</p>
                            {i < steps.length - 1 && (
                                <div className="hidden lg:block absolute top-8 sm:top-10 left-[60%] w-[80%] h-0.5 bg-gradient-to-r from-indigo-200 dark:from-indigo-800 to-transparent"></div>
                            )}
                        </div>
                    ))}
                </div>
            </section>

            {/* CTA */}
            <section id="download" className="py-16 sm:py-20 px-4 sm:px-6 lg:px-8">
                <div className="max-w-4xl mx-auto bg-gradient-to-r from-indigo-600 to-purple-600 rounded-3xl p-8 sm:p-12 lg:p-16 text-center shadow-2xl shadow-indigo-200 dark:shadow-indigo-900 relative overflow-hidden">
                    <div className="absolute inset-0 bg-white/10 backdrop-blur"></div>
                    <div className="relative z-10">
                        <h2 className="text-2xl sm:text-4xl font-extrabold text-white">Ready to Ace Your Exit Exams?</h2>
                        <p className="text-indigo-100 mt-3 sm:mt-4 text-base sm:text-lg">
                            Join thousands of students preparing with Exora. Download the app or sign up now!
                        </p>
                        <div className="flex flex-wrap justify-center gap-3 sm:gap-4 mt-6 sm:mt-8">
                            <a
                                href="/signup"
                                className="px-6 sm:px-8 py-3 sm:py-4 bg-white text-indigo-600 font-bold rounded-xl hover:shadow-xl transition flex items-center gap-2 text-sm sm:text-lg group"
                            >
                                Get Started Free{' '}
                                <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
                            </a>
                            <a
                                href="/login"
                                className="px-6 sm:px-8 py-3 sm:py-4 border-2 border-white/30 text-white font-semibold rounded-xl hover:bg-white/10 transition text-sm sm:text-base"
                            >
                                I Already Have an Account
                            </a>
                        </div>
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer className="bg-gray-900 dark:bg-gray-950 text-gray-400 py-10 sm:py-12 px-4 sm:px-6 lg:px-8">
                <div className="max-w-7xl mx-auto">
                    <div className="flex flex-col md:flex-row items-center justify-between gap-4 sm:gap-6">
                        <div className="flex items-center gap-2 sm:gap-3">
                            <img src={Logo} alt="Exora" className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl" />
                            <span className="text-lg sm:text-xl font-bold text-white">Exora</span>
                        </div>
                        <div className="flex flex-wrap justify-center gap-4 sm:gap-6 text-xs sm:text-sm">
                            <a href="#features" className="hover:text-white transition">Features</a>
                            <a href="#how-it-works" className="hover:text-white transition">How It Works</a>
                            <a href="#mobile-app" className="hover:text-white transition">Mobile App</a>
                            <a href="/login" className="hover:text-white transition">Login</a>
                            <a href="/signup" className="hover:text-white transition">Register</a>
                        </div>
                        <p className="text-xs sm:text-sm">© 2026 Exora. All rights reserved.</p>
                    </div>
                </div>
            </footer>
        </div>
    );
};

export default Landing;