"use client";

import { useState } from "react";
import Link from "next/link";
import { Mail, Lock, Eye, EyeOff } from "lucide-react";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { useAuth } from "@/contexts/AuthContext";
import { AITeacherAnimation } from "@/components/auth/AITeacherAnimation";
import { courseApi } from "@/services/courseService";

export default function LoginPage() {
  const { login } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const user = await login(email, password);
      const rawUser = user as { role?: string; Role?: string };
      const role = rawUser.role || rawUser.Role || "Learner";

      // Check for stored course enrollment
      const enrollCourseId = sessionStorage.getItem("enroll_course_id");
      if (enrollCourseId) {
        try {
          await courseApi.join(enrollCourseId);
          sessionStorage.removeItem("enroll_course_id");
          window.location.href = `/courses/${enrollCourseId}`;
          return;
        } catch (joinErr) {
          console.error("Auto-join failed after login:", joinErr);
        }
      }

      let targetPath = "/home";
      if (role === "Admin") {
        targetPath = "/admin";
      }

      window.location.href = targetPath;
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } };
      setError(e.response?.data?.message || "Invalid email or password");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-white font-sans overflow-x-hidden relative p-6 sm:p-8 md:p-12">
      
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes float-slow {
          0%, 100% { transform: translate(0, 0) scale(1); }
          50% { transform: translate(80px, -60px) scale(1.2); }
        }
        @keyframes float-slower {
          0%, 100% { transform: translate(0, 0) scale(1); }
          50% { transform: translate(-90px, 50px) scale(1.25); }
        }
        @keyframes float-reverse {
          0%, 100% { transform: translate(0, 0) scale(1); }
          50% { transform: translate(-60px, -80px) scale(0.85); }
        }
        .animate-float-slow {
          animation: float-slow 10s ease-in-out infinite !important;
        }
        .animate-float-slower {
          animation: float-slower 14s ease-in-out infinite !important;
        }
        .animate-float-reverse {
          animation: float-reverse 12s ease-in-out infinite !important;
        }
      `}} />

      {/* Radial Gradient for Vignette effect */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_20%,#f8fafc_100%)] pointer-events-none z-0"></div>

      {/* Animated Glowing Blobs (Aurora Effect) */}
      <div className="absolute top-[10%] left-[10%] w-[350px] h-[350px] bg-blue-400/18 rounded-full blur-[70px] pointer-events-none animate-float-slow z-0"></div>
      <div className="absolute bottom-[15%] right-[15%] w-[400px] h-[400px] bg-orange-400/15 rounded-full blur-[80px] pointer-events-none animate-float-slower z-0"></div>
      <div className="absolute top-[45%] left-[55%] w-[280px] h-[280px] bg-cyan-400/18 rounded-full blur-[60px] pointer-events-none animate-float-reverse z-0"></div>

      {/* Blueprint Grid Overlay */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(0,0,0,0.03)_1px,transparent_1px),linear-gradient(to_bottom,rgba(0,0,0,0.03)_1px,transparent_1px)] bg-[size:32px_32px] pointer-events-none z-0"></div>

      {/* Main Content Wrapper (Centers and clusters the columns) */}
      <div className="w-full max-w-5xl flex flex-col md:flex-row items-center justify-center gap-10 md:gap-16 lg:gap-20 relative z-10">
        
        {/* LEFT COLUMN: FORM CARD */}
        <div className="w-full md:w-1/2 flex justify-center md:justify-end shrink-0">
          <div className="w-full max-w-[400px] bg-white p-8 rounded-2xl border border-zinc-200/80 shadow-[0_20px_50px_rgba(0,0,0,0.06)]">
            
            <div className="mb-6 text-left">
              <h1 className="text-2xl font-bold text-zinc-900 tracking-tight mb-2">Login to your account</h1>
              <p className="text-xs text-zinc-500 leading-relaxed">
                Enter your credentials to access your collaborative study hub.
              </p>
            </div>

            <form onSubmit={handleLogin} className="space-y-5">
              <div className="space-y-2">
                <label className="text-xs font-bold text-zinc-600 uppercase tracking-wider block">
                  Email
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
                  <Input
                    type="email"
                    placeholder="m@example.com"
                    className="pl-10 w-full bg-zinc-50/50 border border-zinc-200 text-zinc-900 rounded-lg h-[44px] text-sm focus-visible:ring-1 focus-visible:ring-blue-600 focus-visible:ring-offset-0 focus-visible:border-blue-600 placeholder-zinc-400"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <label className="text-xs font-bold text-zinc-600 uppercase tracking-wider block">
                    Password
                  </label>
                  <Link
                    href="/forgot-password"
                    className="text-xs text-blue-600 hover:underline font-semibold"
                  >
                    Forgot password?
                  </Link>
                </div>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
                  <Input
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    className="pl-10 pr-10 w-full bg-zinc-50/50 border border-zinc-200 text-zinc-900 rounded-lg h-[44px] text-sm focus-visible:ring-1 focus-visible:ring-blue-600 focus-visible:ring-offset-0 focus-visible:border-blue-600 placeholder-zinc-400"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                  <button
                    type="button"
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-800 transition-colors"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <Eye className="h-4 w-4" />
                    ) : (
                      <EyeOff className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>

              {error && <p className="text-xs text-red-500 font-semibold">{error}</p>}

              <Button
                type="submit"
                className="w-full bg-zinc-900 hover:bg-zinc-800 text-white h-[44px] font-bold text-sm rounded-lg mt-6 transition-all duration-200 border-transparent cursor-pointer"
                disabled={loading}
              >
                {loading ? "Logging in..." : "Login"}
              </Button>
            </form>

            <p className="mt-6 text-center text-xs text-zinc-500">
              Don&apos;t have an account?{" "}
              <Link
                href="/register"
                className="text-blue-600 hover:underline font-semibold transition-colors"
              >
                Sign up
              </Link>
            </p>
          </div>
        </div>

        {/* RIGHT COLUMN: AI TEACHER ANIMATION */}
        <div className="hidden md:flex md:w-1/2 flex-col items-center justify-center shrink-0">
          <div className="w-full max-w-sm h-[520px]">
            <AITeacherAnimation />
          </div>
        </div>

      </div>
    </div>
  );
}
