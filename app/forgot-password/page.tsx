"use client";

import { useState } from "react";
import Link from "next/link";
import { Mail, ArrowLeft, CheckCircle2, Lock, Eye, EyeOff, KeyRound } from "lucide-react";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { authApi } from "@/services/authService";

export default function ForgotPasswordPage() {
  const [step, setStep] = useState<1 | 2>(1);
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const handleRequestOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      await authApi.forgotPassword(email);
      setStep(2);
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } };
      setError(e.response?.data?.message || "Email address not found in system");
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setError("Confirm password does not match!");
      return;
    }
    if (newPassword.length < 5) {
      setError("New password must be at least 5 characters long!");
      return;
    }
    
    setLoading(true);
    setError("");
    try {
      await authApi.resetPassword(email, code, newPassword);
      setSuccess(true);
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } };
      setError(e.response?.data?.message || "Invalid or expired verification code!");
    } finally {
      setLoading(false);
    }
  };

  const handleResendOtp = async () => {
    setError("");
    setLoading(true);
    try {
      await authApi.forgotPassword(email);
      alert("A new verification code has been sent to: " + email);
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } };
      setError(e.response?.data?.message || "Failed to resend verification code!");
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

      {/* Main Content Wrapper */}
      <div className="w-full max-w-5xl flex flex-col md:flex-row items-center justify-center gap-10 md:gap-16 lg:gap-20 relative z-10">
        
        {/* LEFT COLUMN: FORM CARD */}
        <div className="w-full md:w-1/2 flex justify-center md:justify-end shrink-0">
          <div className="w-full max-w-[400px] bg-white p-8 rounded-2xl border border-zinc-200/80 shadow-[0_20px_50px_rgba(0,0,0,0.06)]">
            
            {success ? (
              /* SUCCESS STATE */
              <div className="text-center py-4">
                <div className="flex justify-center mb-4">
                  <div className="h-12 w-12 rounded-full bg-green-100 flex items-center justify-center text-green-600">
                    <CheckCircle2 className="h-8 w-8" />
                  </div>
                </div>
                
                <h1 className="text-xl font-bold text-zinc-900 mb-2">Success!</h1>
                <p className="text-sm text-zinc-500 leading-relaxed mb-6">
                  Your password has been successfully reset. Please log in using your new password.
                </p>

                <Link
                  href="/login"
                  className="inline-flex items-center justify-center w-full bg-zinc-900 hover:bg-zinc-800 text-white h-[44px] font-bold text-sm rounded-lg transition-all duration-200"
                >
                  Log In Now
                </Link>
              </div>
            ) : step === 1 ? (
              /* STEP 1: ENTER EMAIL */
              <>
                <div className="mb-6 text-left">
                  <h1 className="text-2xl font-bold text-zinc-900 tracking-tight mb-2">Forgot Password?</h1>
                  <p className="text-xs text-zinc-500 leading-relaxed">
                    Enter your email address. We will send you a 6-digit verification code (OTP) to reset your password.
                  </p>
                </div>

                <form onSubmit={handleRequestOtp} className="space-y-5">
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

                  {error && <p className="text-xs text-red-500 font-semibold">{error}</p>}

                  <Button
                    type="submit"
                    className="w-full bg-zinc-900 hover:bg-zinc-800 text-white h-[44px] font-bold text-sm rounded-lg mt-6 transition-all duration-200 border-transparent cursor-pointer"
                    disabled={loading}
                  >
                    {loading ? "Sending..." : "Send Verification Code"}
                  </Button>
                </form>

                <div className="mt-6 text-center">
                  <Link
                    href="/login"
                    className="inline-flex items-center text-xs text-zinc-500 hover:text-zinc-900 font-semibold transition-colors"
                  >
                    <ArrowLeft className="h-3 w-3 mr-1" />
                    Back to Login
                  </Link>
                </div>
              </>
            ) : (
              /* STEP 2: ENTER OTP & NEW PASSWORD */
              <>
                <div className="mb-6 text-left">
                  <h1 className="text-2xl font-bold text-zinc-900 tracking-tight mb-2">Reset Password</h1>
                  <p className="text-xs text-zinc-500 leading-relaxed">
                    A 6-digit verification code has been sent to <strong className="text-zinc-800">{email}</strong>. Enter it below along with your new password.
                  </p>
                </div>

                <form onSubmit={handleResetPassword} className="space-y-4">
                  
                  {/* OTP Code */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-zinc-600 uppercase tracking-wider block">
                      Verification Code (OTP)
                    </label>
                    <div className="relative">
                      <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
                      <Input
                        type="text"
                        placeholder="Enter 6-digit code"
                        maxLength={6}
                        className="pl-10 w-full bg-zinc-50/50 border border-zinc-200 text-zinc-900 rounded-lg h-[44px] text-sm focus-visible:ring-1 focus-visible:ring-blue-600 focus-visible:ring-offset-0 focus-visible:border-blue-600 placeholder-zinc-400 tracking-[0.2em] font-mono font-bold"
                        value={code}
                        onChange={(e) => setCode(e.target.value)}
                        required
                      />
                    </div>
                  </div>

                  {/* New Password */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-zinc-600 uppercase tracking-wider block">
                      New Password
                    </label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
                      <Input
                        type={showNewPassword ? "text" : "password"}
                        placeholder="••••••••"
                        className="pl-10 pr-10 w-full bg-zinc-50/50 border border-zinc-200 text-zinc-900 rounded-lg h-[44px] text-sm focus-visible:ring-1 focus-visible:ring-blue-600 focus-visible:ring-offset-0 focus-visible:border-blue-600 placeholder-zinc-400"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        required
                      />
                      <button
                        type="button"
                        className="absolute right-3.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-800 transition-colors"
                        onClick={() => setShowNewPassword(!showNewPassword)}
                      >
                        {showNewPassword ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>

                  {/* Confirm Password */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-zinc-600 uppercase tracking-wider block">
                      Confirm Password
                    </label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
                      <Input
                        type={showConfirmPassword ? "text" : "password"}
                        placeholder="••••••••"
                        className="pl-10 pr-10 w-full bg-zinc-50/50 border border-zinc-200 text-zinc-900 rounded-lg h-[44px] text-sm focus-visible:ring-1 focus-visible:ring-blue-600 focus-visible:ring-offset-0 focus-visible:border-blue-600 placeholder-zinc-400"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        required
                      />
                      <button
                        type="button"
                        className="absolute right-3.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-800 transition-colors"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      >
                        {showConfirmPassword ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>

                  {error && <p className="text-xs text-red-500 font-semibold">{error}</p>}

                  <Button
                    type="submit"
                    className="w-full bg-zinc-900 hover:bg-zinc-800 text-white h-[44px] font-bold text-sm rounded-lg mt-6 transition-all duration-200 border-transparent cursor-pointer"
                    disabled={loading}
                  >
                    {loading ? "Processing..." : "Update Password"}
                  </Button>
                </form>

                <div className="mt-6 flex flex-col items-center gap-3">
                  <button
                    type="button"
                    onClick={handleResendOtp}
                    disabled={loading}
                    className="text-xs text-blue-600 hover:underline font-semibold disabled:opacity-50"
                  >
                    Resend Verification Code
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setStep(1);
                      setError("");
                    }}
                    className="inline-flex items-center text-xs text-zinc-500 hover:text-zinc-900 font-semibold transition-colors"
                  >
                    <ArrowLeft className="h-3 w-3 mr-1" />
                    Back to Email Input
                  </button>
                </div>
              </>
            )}

          </div>
        </div>

        {/* RIGHT COLUMN: BRANDING */}
        <div className="hidden md:flex md:w-1/2 flex-col items-center justify-center shrink-0">
          <div className="max-w-lg text-center flex flex-col items-center">
            {/* Large Logo */}
            <img 
              src="/logo.jpg" 
              alt="Let's learn Logo" 
              className="w-52 md:w-64 h-auto rounded-2xl shadow-md mb-8"
            />

            {/* Slogan */}
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-extrabold text-zinc-900 leading-tight tracking-tight">
              Connect, collaborate & <br />
              <span className="text-blue-600">study smarter</span> with AI.
            </h2>
            <p className="text-sm font-bold text-zinc-400 tracking-widest mt-4 uppercase">
              INTELLIGENT CO-STUDY COMPANION
            </p>
          </div>
        </div>

      </div>
    </div>
  );
}
