"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Mail, Lock, Eye, EyeOff, User } from "lucide-react";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Checkbox } from "@/components/ui/checkbox";
import { authApi } from "@/services/authService";

const GoogleIcon = () => (
  <svg viewBox="0 0 24 24" className="w-5 h-5 mr-2" aria-hidden="true">
    <path
      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      fill="#4285F4"
    />
    <path
      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      fill="#34A853"
    />
    <path
      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
      fill="#FBBC05"
    />
    <path
      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
      fill="#EA4335"
    />
  </svg>
);

const FacebookIcon = () => (
  <svg
    viewBox="0 0 24 24"
    fill="currentColor"
    className="w-5 h-5 mr-2 text-[#1877F2]"
  >
    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.469h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.469h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
  </svg>
);

export default function RegisterPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isTeacher, setIsTeacher] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const role = isTeacher ? "Teacher" : "Learner";
      await authApi.register(username, email, password, role);
      // Wait for 1 second then redirect to login or handle properly
      router.push("/login");
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 p-4 font-sans">
      <div className="w-full max-w-md bg-white p-8 rounded-xl shadow-sm border border-gray-100">
        <div className="mb-6">
          <p className="text-sm font-bold tracking-wider text-black mb-2 uppercase">
            Let&apos;s learn
          </p>
          <h1 className="text-2xl font-bold text-black mb-1">
            Welcome! Sign up for a new world?
          </h1>
          <p className="text-[14px] font-normal text-[#6B7280]">
            Choose a method below to begin
          </p>
        </div>

        <div className="flex gap-4 mb-6">
          <Button
            variant="outline"
            className="flex-1 h-[44px] border-[#9CA3AF]/40"
          >
            <GoogleIcon />
            Google
          </Button>
          <Button
            variant="outline"
            className="flex-1 h-[44px] border-[#9CA3AF]/40"
          >
            <FacebookIcon />
            Facebook
          </Button>
        </div>

        <div className="relative mb-6">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t border-[#9CA3AF]/30" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-white px-2 text-[#9CA3AF]">or</span>
          </div>
        </div>

        <form onSubmit={handleRegister} className="space-y-4">
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-[#9CA3AF]" />
            <Input
              type="email"
              placeholder="Email"
              className="pl-10 h-[44px] text-[14px] border-[#9CA3AF]/30 focus-visible:ring-[#3B82F6]"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="relative">
            <User className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-[#9CA3AF]" />
            <Input
              type="text"
              placeholder="Username"
              className="pl-10 h-[44px] text-[14px] border-[#9CA3AF]/30 focus-visible:ring-[#3B82F6]"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
            />
          </div>

          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-[#9CA3AF]" />
            <Input
              type={showPassword ? "text" : "password"}
              placeholder="Password"
              className="pl-10 pr-10 h-[44px] text-[14px] border-[#9CA3AF]/30 focus-visible:ring-[#3B82F6]"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            <button
              type="button"
              className="absolute right-3 top-1/2 -translate-y-1/2 text-[#9CA3AF] hover:text-black transition-colors"
              onClick={() => setShowPassword(!showPassword)}
            >
              {showPassword ? (
                <Eye className="h-5 w-5" />
              ) : (
                <EyeOff className="h-5 w-5" />
              )}
            </button>
          </div>

          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-[#9CA3AF]" />
            <Input
              type={showConfirmPassword ? "text" : "password"}
              placeholder="Confirm password"
              className="pl-10 pr-10 h-[44px] text-[14px] border-[#9CA3AF]/30 focus-visible:ring-[#3B82F6]"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
            />
            <button
              type="button"
              className="absolute right-3 top-1/2 -translate-y-1/2 text-[#9CA3AF] hover:text-black transition-colors"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
            >
              {showConfirmPassword ? (
                <Eye className="h-5 w-5" />
              ) : (
                <EyeOff className="h-5 w-5" />
              )}
            </button>
          </div>

          <div className="flex justify-end pt-1">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="isTeacher"
                checked={isTeacher}
                onCheckedChange={(c) => setIsTeacher(c as boolean)}
                className="border-[#9CA3AF] data-[state=checked]:bg-[#3B82F6] data-[state=checked]:border-[#3B82F6]"
              />
              <label
                htmlFor="isTeacher"
                className="text-[14px] font-medium leading-none text-[#6B7280]"
              >
                Are you a teacher?
              </label>
            </div>
          </div>

          {error && <p className="text-sm text-red-500">{error}</p>}

          <Button
            type="submit"
            className="w-full bg-[#3B82F6] hover:bg-[#3B82F6]/90 text-white h-[44px] font-bold text-[16px] rounded-md mt-4"
            disabled={loading}
          >
            {loading ? "Signing up..." : "SIGN UP"}
          </Button>
        </form>

        <p className="mt-6 text-center text-[14px] text-[#9CA3AF]">
          Already have an account?{" "}
          <Link
            href="/login"
            className="text-[#3B82F6] hover:underline font-semibold"
          >
            Log in
          </Link>
        </p>
      </div>
    </div>
  );
}
