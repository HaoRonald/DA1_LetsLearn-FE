"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { courseApi, CourseResponse } from "@/services/courseService";
import {
  BookOpen,
  Users,
  Zap,
  Star,
  ArrowRight,
  CheckCircle2,
  Brain,
  Video,
  MessageSquare,
  Award,
  ChevronDown,
  Sparkles,
  Globe,
  TrendingUp,
  Play,
  Shield,
} from "lucide-react";

// ── Data ─────────────────────────────────────────────────────────────────────
const FEATURES = [
  {
    icon: Brain,
    title: "AI-Powered Learning",
    desc: "Generate quizzes, summaries, and study guides instantly with our built-in AI assistant tailored to your course content.",
    color: "from-violet-500 to-purple-600",
    bg: "bg-violet-50",
    text: "text-violet-600",
  },
  {
    icon: Video,
    title: "Live Video Meetings",
    desc: "Attend or host interactive live sessions directly in-platform — no third-party tools needed. Full screen-share and chat included.",
    color: "from-blue-500 to-cyan-500",
    bg: "bg-blue-50",
    text: "text-blue-600",
  },
  {
    icon: MessageSquare,
    title: "Real-Time Chat",
    desc: "Collaborate with classmates and instructors in dedicated group chats, keeping all conversations organized by course.",
    color: "from-emerald-500 to-teal-500",
    bg: "bg-emerald-50",
    text: "text-emerald-600",
  },
  {
    icon: Award,
    title: "Assignments & Quizzes",
    desc: "Auto-graded quizzes and rich assignment submissions with detailed feedback loops to accelerate your progress.",
    color: "from-orange-500 to-amber-500",
    bg: "bg-orange-50",
    text: "text-orange-600",
  },
  {
    icon: Globe,
    title: "Diverse Course Catalog",
    desc: "Explore hundreds of courses across tech, business, design, and more — taught by vetted experts and passionate educators.",
    color: "from-pink-500 to-rose-500",
    bg: "bg-pink-50",
    text: "text-pink-600",
  },
  {
    icon: Shield,
    title: "Secure & Reliable",
    desc: "Enterprise-grade security with cookie-based auth, encrypted payments via VNPay, and 99.9% uptime infrastructure.",
    color: "from-slate-500 to-gray-600",
    bg: "bg-slate-50",
    text: "text-slate-600",
  },
];

const STATS = [
  { value: "10K+", label: "Active Learners", icon: Users },
  { value: "500+", label: "Expert Courses", icon: BookOpen },
  { value: "95%", label: "Satisfaction Rate", icon: Star },
  { value: "50+", label: "Expert Instructors", icon: TrendingUp },
];

const TESTIMONIALS = [
  {
    name: "Nguyen Minh Khoa",
    role: "Software Engineer",
    avatar: "NK",
    color: "from-blue-400 to-indigo-500",
    quote:
      "LetsLearn transformed how I study. The AI quiz generator saved me hours of prep time, and the live meetings felt just like being in class.",
  },
  {
    name: "Tran Thi Bich",
    role: "UX Designer",
    avatar: "TB",
    color: "from-pink-400 to-rose-500",
    quote:
      "I enrolled in 3 design courses and got my dream job within 6 months. The instructor feedback system is incredible.",
  },
  {
    name: "Le Van Duc",
    role: "Data Analyst",
    avatar: "LD",
    color: "from-emerald-400 to-teal-500",
    quote:
      "The group chat and real-time collaboration features make studying with friends so much more engaging. Highly recommend!",
  },
];

const SAMPLE_COURSES = [
  {
    title: "Full-Stack Web Development",
    category: "Technology",
    students: 1240,
    rating: 4.9,
    price: "FREE",
    image:
      "https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=400&h=225&fit=crop",
  },
  {
    title: "UI/UX Design Fundamentals",
    category: "Design",
    students: 870,
    rating: 4.8,
    price: "$29",
    image:
      "https://images.unsplash.com/photo-1561070791-2526d30994b5?w=400&h=225&fit=crop",
  },
  {
    title: "Data Science with Python",
    category: "Data",
    students: 2100,
    rating: 4.7,
    price: "$49",
    image:
      "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=400&h=225&fit=crop",
  },
  {
    title: "Digital Marketing Mastery",
    category: "Business",
    students: 650,
    rating: 4.6,
    price: "FREE",
    image:
      "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=400&h=225&fit=crop",
  },
];

// ── Components ────────────────────────────────────────────────────────────────
function NavBar() {
  const [scrolled, setScrolled] = useState(false);
  const [activeTab, setActiveTab] = useState("features");
  const { isAuthenticated, isLoading } = useAuth();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled
          ? "bg-[#0a0a0a]/95 border-b border-zinc-900/80 shadow-[0_4px_30px_rgba(0,0,0,0.8)]"
          : "bg-[#0a0a0a]/80 backdrop-blur-md border-b border-zinc-900/40"
      }`}
    >
      <div className="w-full px-8 h-16 flex items-center justify-between">
        {/* Left Side: Logo + Menu Links grouped together */}
        <div className="flex items-center gap-5">
          {/* Logo */}
          <div className="flex items-center gap-2.5">
            <img
              src="/logo.jpg"
              alt="LetsLearn Logo"
              className="w-10 h-10 rounded-xl object-cover shadow-md"
            />
            <span className="text-[21px] font-black tracking-tight text-white">
              Let&apos;s<span className="text-blue-400">Learn</span>
            </span>
          </div>

          {/* Links (Grouped together with Logo on the left) */}
          <div className="hidden md:flex items-center gap-1.5">
            {["Features", "Courses", "Testimonials"].map((item) => {
              const isTabActive = activeTab === item.toLowerCase();
              return (
                <a
                  key={item}
                  href={`#${item.toLowerCase()}`}
                  onClick={() => setActiveTab(item.toLowerCase())}
                  className={`text-[13px] font-semibold tracking-wide transition-all duration-200 px-4 py-1.5 rounded-lg ${
                    isTabActive
                      ? "bg-[#262626] text-white"
                      : "text-zinc-400 hover:text-white hover:bg-[#262626]/40"
                  }`}
                >
                  {item}
                </a>
              );
            })}
          </div>
        </div>

        {/* Right Side: CTA (Log In, Sign Up) */}
        <div className="flex items-center gap-3">
          {!isLoading && (
            <>
              {isAuthenticated ? (
                <Link
                  href="/home"
                  className="flex items-center gap-1.5 px-5 py-2 bg-white hover:bg-zinc-200 text-black text-[13px] font-bold rounded-lg transition-all duration-200 shadow-sm"
                >
                  Go to Dashboard <ArrowRight className="w-4 h-4" />
                </Link>
              ) : (
                <>
                  <Link
                    href="/login"
                    className="text-[13px] font-semibold text-zinc-300 hover:text-white px-5 py-2 rounded-lg border border-zinc-800 hover:bg-[#262626]/30 transition-all duration-200"
                  >
                    Sign In
                  </Link>
                  <Link
                    href="/register"
                    className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-[13px] font-bold rounded-lg transition-all duration-200 shadow-md"
                  >
                    Get Started
                  </Link>
                </>
              )}
            </>
          )}
        </div>
      </div>
    </nav>
  );
}

function HeroSection() {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden bg-[#05101f]">
      {/* Animated background blobs */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-[600px] h-[600px] bg-blue-600/20 rounded-full blur-[120px] animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] bg-indigo-600/15 rounded-full blur-[100px] animate-pulse [animation-delay:2s]" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] bg-cyan-500/10 rounded-full blur-[80px] animate-pulse [animation-delay:4s]" />
      </div>

      {/* Grid overlay */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:60px_60px] pointer-events-none" />

      <div className="relative z-10 max-w-6xl mx-auto px-6 text-center pt-20">
        {/* Badge */}
        <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-blue-500/10 border border-blue-500/20 rounded-full mb-8 backdrop-blur-sm">
          <Zap className="w-3.5 h-3.5 text-blue-400" />
          <span className="text-blue-300 text-[12px] font-black uppercase tracking-widest">
            Intelligent Co-Study Companion
          </span>
        </div>

        {/* Headline */}
        <h1 className="text-5xl sm:text-6xl lg:text-7xl font-black text-white tracking-tight leading-[1.05] mb-6">
          Learn smarter,
          <br />
          <span className="bg-gradient-to-r from-blue-400 via-cyan-400 to-blue-500 bg-clip-text text-transparent">
            together with AI.
          </span>
        </h1>

        <p className="text-white/60 text-[18px] sm:text-[20px] font-medium max-w-2xl mx-auto mb-10 leading-relaxed">
          Join thousands of students and instructors on Vietnam&apos;s most
          intelligent learning platform — with live classes, AI quizzes, and
          real-time collaboration.
        </p>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16">
          <Link
            href="/register"
            className="group flex items-center gap-3 px-8 py-4 bg-blue-600 hover:bg-blue-500 text-white font-black text-[16px] rounded-2xl transition-all shadow-xl shadow-blue-500/30 hover:shadow-blue-500/50 hover:scale-[1.02]"
          >
            Start Learning Free
            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </Link>
          <Link
            href="/login"
            className="flex items-center gap-3 px-8 py-4 bg-white/10 hover:bg-white/15 text-white font-black text-[16px] rounded-2xl border border-white/10 transition-all backdrop-blur-sm"
          >
            <Play className="w-4 h-4 fill-white" />
            Sign In
          </Link>
        </div>

        {/* Trust indicators */}
        <div className="flex flex-wrap items-center justify-center gap-6 text-white/40 text-[13px] font-semibold">
          {[
            "No credit card required",
            "Free courses available",
            "Cancel anytime",
          ].map((item) => (
            <span key={item} className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-green-400" />
              {item}
            </span>
          ))}
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 text-white/30 animate-bounce">
          <span className="text-[11px] font-bold uppercase tracking-widest">
            Scroll
          </span>
          <ChevronDown className="w-4 h-4" />
        </div>
      </div>
    </section>
  );
}

function StatsSection() {
  return (
    <section className="bg-white border-b border-gray-100">
      <div className="max-w-7xl mx-auto px-6 py-16">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
          {STATS.map(({ value, label, icon: Icon }) => (
            <div key={label} className="flex flex-col items-center text-center">
              <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center mb-4">
                <Icon className="w-6 h-6 text-blue-600" />
              </div>
              <p className="text-4xl font-black text-gray-900 mb-1">{value}</p>
              <p className="text-[14px] font-semibold text-gray-500">{label}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function FeaturesSection() {
  return (
    <section id="features" className="bg-[#F8FAFC] py-24 px-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-16">
          <span className="inline-block px-3 py-1 bg-blue-100 text-blue-700 text-[11px] font-black uppercase tracking-widest rounded-full mb-4">
            Platform Features
          </span>
          <h2 className="text-4xl lg:text-5xl font-black text-gray-900 tracking-tight mb-4">
            Everything you need to <span className="text-blue-600">excel</span>
          </h2>
          <p className="text-gray-500 text-[17px] max-w-xl mx-auto font-medium leading-relaxed">
            Built for modern learners and educators who demand the best tools in
            one seamless experience.
          </p>
        </div>

        {/* Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {FEATURES.map(({ icon: Icon, title, desc, color, bg, text }) => (
            <div
              key={title}
              className="group bg-white rounded-[28px] p-7 border border-gray-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 cursor-default"
            >
              <div
                className={`w-12 h-12 ${bg} rounded-2xl flex items-center justify-center mb-5 group-hover:scale-110 transition-transform duration-300`}
              >
                <Icon className={`w-6 h-6 ${text}`} />
              </div>
              <h3 className="text-[18px] font-black text-gray-900 mb-2">
                {title}
              </h3>
              <p className="text-[14px] text-gray-500 leading-relaxed font-medium">
                {desc}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function CoursesSection() {
  const { isAuthenticated } = useAuth();
  const router = useRouter();
  const [courses, setCourses] = useState<CourseResponse[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    courseApi
      .getAll()
      .then((res) => {
        setCourses(res.data || []);
      })
      .catch((err) => {
        console.error("Failed to fetch courses for landing page:", err);
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  const handleEnroll = (courseId: string) => {
    if (isAuthenticated) {
      router.push(`/courses/${courseId}`);
    } else {
      sessionStorage.setItem("enroll_course_id", courseId);
      router.push("/register");
    }
  };

  const fallbackImage = (category?: string) => {
    switch (category?.toLowerCase()) {
      case "technology":
      case "tech":
        return "https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=400&h=225&fit=crop";
      case "design":
      case "ui/ux":
        return "https://images.unsplash.com/photo-1561070791-2526d30994b5?w=400&h=225&fit=crop";
      case "data":
        return "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=400&h=225&fit=crop";
      case "business":
      case "marketing":
        return "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=400&h=225&fit=crop";
      default:
        return "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=400&h=225&fit=crop";
    }
  };

  if (loading) {
    return (
      <section id="courses" className="bg-white py-24 px-6">
        <div className="max-w-7xl mx-auto">
          {/* Header skeleton */}
          <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between gap-4 mb-12">
            <div className="space-y-3">
              <div className="w-24 h-5 bg-orange-100 animate-pulse rounded-full" />
              <div className="w-64 h-10 bg-zinc-100 animate-pulse rounded-xl" />
            </div>
            <div className="w-32 h-5 bg-zinc-100 animate-pulse rounded" />
          </div>
          {/* Grid skeleton */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="bg-white rounded-[24px] border border-gray-100 overflow-hidden shadow-sm flex flex-col h-[320px] animate-pulse"
              >
                <div className="h-44 bg-zinc-100" />
                <div className="p-5 flex flex-col flex-1 space-y-3">
                  <div className="h-5 bg-zinc-100 rounded w-5/6" />
                  <div className="h-4 bg-zinc-100 rounded w-1/2" />
                  <div className="mt-auto flex justify-between items-center">
                    <div className="h-5 bg-zinc-100 rounded w-1/3" />
                    <div className="h-8 bg-zinc-100 rounded-xl w-1/4" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  const displayedCourses = courses.filter((c) => c.isPublished);

  if (displayedCourses.length === 0) {
    return (
      <section id="courses" className="bg-white py-24 px-6 text-center">
        <div className="max-w-7xl mx-auto">
          <span className="inline-block px-3 py-1 bg-orange-100 text-orange-700 text-[11px] font-black uppercase tracking-widest rounded-full mb-4">
            Popular Courses
          </span>
          <h2 className="text-4xl font-black text-gray-900 tracking-tight">
            Start learning <span className="text-orange-500">today</span>
          </h2>
          <p className="text-gray-500 font-semibold max-w-md mx-auto mt-6 leading-relaxed">
            No public courses are currently available. Check back soon, or
            register as a teacher to create the first one!
          </p>
        </div>
      </section>
    );
  }

  return (
    <section id="courses" className="bg-white py-24 px-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between gap-4 mb-12">
          <div>
            <span className="inline-block px-3 py-1 bg-orange-100 text-orange-700 text-[11px] font-black uppercase tracking-widest rounded-full mb-4">
              Popular Courses
            </span>
            <h2 className="text-4xl font-black text-gray-900 tracking-tight">
              Start learning <span className="text-orange-500">today</span>
            </h2>
          </div>
          <Link
            href={isAuthenticated ? "/home" : "/register"}
            className="flex items-center gap-2 text-[14px] font-bold text-blue-600 hover:underline"
          >
            See all courses <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {/* Course grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {displayedCourses.slice(0, 8).map((course) => {
            const isFree = !course.price || course.price === 0;
            const priceText = isFree
              ? "FREE"
              : `${course.price.toLocaleString()} VND`;

            return (
              <div
                key={course.id}
                className="group bg-white rounded-[24px] border border-gray-100 overflow-hidden shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col cursor-default"
              >
                <div className="relative h-44 overflow-hidden bg-zinc-50">
                  <img
                    src={course.imageUrl || fallbackImage(course.category)}
                    alt={course.title}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                  <span className="absolute top-3 left-3 px-2.5 py-1 bg-white/90 backdrop-blur-sm text-blue-600 text-[11px] font-bold rounded-full">
                    {course.category || "General"}
                  </span>
                  <div className="absolute bottom-3 left-3 flex items-center gap-1 text-white">
                    <Star className="w-3.5 h-3.5 fill-yellow-400 text-yellow-400" />
                    <span className="text-[12px] font-bold">4.8</span>
                  </div>
                </div>

                <div className="p-5 flex flex-col flex-1">
                  <h3 className="text-[15px] font-black text-gray-900 line-clamp-2 mb-2 group-hover:text-blue-600 transition-colors">
                    {course.title}
                  </h3>
                  <div className="flex items-center gap-1.5 text-gray-500 text-[12px] font-medium mb-4">
                    <Users className="w-3.5 h-3.5" />
                    {(course.totalJoined || 0).toLocaleString()} students
                  </div>
                  <div className="mt-auto flex items-center justify-between">
                    <span
                      className={`text-[17px] font-black ${isFree ? "text-emerald-600" : "text-gray-900"}`}
                    >
                      {priceText}
                    </span>
                    <button
                      onClick={() => handleEnroll(course.id)}
                      className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-[12px] font-bold rounded-xl transition-all cursor-pointer border-transparent"
                    >
                      Enroll
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function TestimonialsSection() {
  return (
    <section id="testimonials" className="bg-[#F8FAFC] py-24 px-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-16">
          <span className="inline-block px-3 py-1 bg-emerald-100 text-emerald-700 text-[11px] font-black uppercase tracking-widest rounded-full mb-4">
            Student Stories
          </span>
          <h2 className="text-4xl font-black text-gray-900 tracking-tight">
            Loved by <span className="text-emerald-600">learners</span>
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {TESTIMONIALS.map(({ name, role, avatar, color, quote }) => (
            <div
              key={name}
              className="bg-white rounded-[28px] p-8 border border-gray-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300"
            >
              <div className="flex items-center gap-1 mb-5">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    className="w-4 h-4 fill-yellow-400 text-yellow-400"
                  />
                ))}
              </div>
              <p className="text-[15px] text-gray-600 leading-relaxed font-medium mb-6">
                &ldquo;{quote}&rdquo;
              </p>
              <div className="flex items-center gap-3">
                <div
                  className={`w-10 h-10 rounded-full bg-gradient-to-br ${color} flex items-center justify-center text-[13px] font-black text-white`}
                >
                  {avatar}
                </div>
                <div>
                  <p className="text-[14px] font-black text-gray-900">{name}</p>
                  <p className="text-[12px] text-gray-500 font-semibold">
                    {role}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function CTASection() {
  return (
    <section className="bg-[#05101f] py-24 px-6 relative overflow-hidden">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-blue-600/20 rounded-full blur-[120px]" />
        <div className="absolute bottom-0 right-1/4 w-[400px] h-[400px] bg-indigo-600/15 rounded-full blur-[100px]" />
      </div>
      <div className="relative z-10 max-w-3xl mx-auto text-center">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-white/10 border border-white/10 rounded-full mb-8">
          <Sparkles className="w-3.5 h-3.5 text-blue-400" />
          <span className="text-blue-300 text-[12px] font-black uppercase tracking-widest">
            Join for free today
          </span>
        </div>
        <h2 className="text-4xl sm:text-5xl font-black text-white tracking-tight mb-6 leading-tight">
          Ready to unlock your{" "}
          <span className="bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
            full potential?
          </span>
        </h2>
        <p className="text-white/60 text-[17px] font-medium mb-10 max-w-xl mx-auto leading-relaxed">
          Sign up in seconds and start your learning journey today — completely
          free. No credit card required.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link
            href="/register"
            className="group flex items-center gap-3 px-8 py-4 bg-blue-600 hover:bg-blue-500 text-white font-black text-[16px] rounded-2xl transition-all shadow-xl shadow-blue-500/30 hover:shadow-blue-500/50 hover:scale-[1.02]"
          >
            Create Free Account
            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </Link>
          <Link
            href="/login"
            className="text-white/70 hover:text-white font-bold text-[15px] transition-colors"
          >
            Already have an account? Sign in →
          </Link>
        </div>
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="bg-[#020c1a] border-t border-white/5 py-12 px-6">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="flex items-center gap-2.5">
          <img
            src="/logo.jpg"
            alt="LetsLearn Logo"
            className="w-7 h-7 rounded-lg object-cover"
          />
          <span className="text-[16px] font-black text-white tracking-tight">
            Let&apos;s<span className="text-blue-400">Learn</span>
          </span>
        </div>
        <p className="text-white/30 text-[13px] font-medium">
          © 2026 LetsLearn. Intelligent learning for everyone.
        </p>
        <div className="flex items-center gap-6 text-white/40 text-[13px] font-semibold">
          <Link href="/login" className="hover:text-white/70 transition-colors">
            Sign In
          </Link>
          <Link
            href="/register"
            className="hover:text-white/70 transition-colors"
          >
            Register
          </Link>
        </div>
      </div>
    </footer>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function LandingPage() {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();

  // If already logged in, send them straight to the dashboard
  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      router.replace("/home");
    }
  }, [isAuthenticated, isLoading, router]);

  // While checking auth, show a minimal loader so there's no flash
  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#05101f] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-blue-500/30 border-t-blue-500 rounded-full animate-spin" />
      </div>
    );
  }

  // If authenticated, nothing to render (redirect pending)
  if (isAuthenticated) return null;

  return (
    <div className="font-sans">
      <NavBar />
      <HeroSection />
      <StatsSection />
      <FeaturesSection />
      <CoursesSection />
      <TestimonialsSection />
      <CTASection />
      <Footer />
    </div>
  );
}
