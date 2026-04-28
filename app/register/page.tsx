"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Mail, Lock, Eye, EyeOff, User } from "lucide-react";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Checkbox } from "@/components/ui/checkbox";
import { authApi } from "@/services/authService";

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
      router.push("/login");
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="flex min-h-screen items-center justify-center p-4 font-sans relative overflow-hidden"
      style={{
        backgroundImage: "url(/bg.png)",
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
      }}
    >
      {/* Overlay */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-[2px]"></div>

      <div className="w-full max-w-[400px] bg-white/95 p-6 rounded-xl shadow-2xl border border-gray-100 relative z-10 backdrop-blur-md">
        {/* Header */}
        <div className="mb-5">
          <p className="text-sm font-bold tracking-wider text-[#3B82F6] mb-1 uppercase">
            Let&apos;s learn
          </p>
          <h1 className="text-xl font-bold text-black">Create an account</h1>
        </div>

        <form onSubmit={handleRegister} className="space-y-3">
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#9CA3AF]" />
            <Input
              type="email"
              placeholder="Email"
              className="pl-9 h-[40px] text-[13px] border-[#9CA3AF]/30 focus-visible:ring-[#3B82F6]"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="relative">
            <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#9CA3AF]" />
            <Input
              type="text"
              placeholder="Username"
              className="pl-9 h-[40px] text-[13px] border-[#9CA3AF]/30 focus-visible:ring-[#3B82F6]"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
            />
          </div>

          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#9CA3AF]" />
            <Input
              type={showPassword ? "text" : "password"}
              placeholder="Password"
              className="pl-9 pr-10 h-[40px] text-[13px] border-[#9CA3AF]/30 focus-visible:ring-[#3B82F6]"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            <button
              type="button"
              className="absolute right-3 top-1/2 -translate-y-1/2 text-[#9CA3AF] hover:text-black transition-colors"
              onClick={() => setShowPassword(!showPassword)}
            >
              {showPassword ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
            </button>
          </div>

          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#9CA3AF]" />
            <Input
              type={showConfirmPassword ? "text" : "password"}
              placeholder="Confirm password"
              className="pl-9 pr-10 h-[40px] text-[13px] border-[#9CA3AF]/30 focus-visible:ring-[#3B82F6]"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
            />
            <button
              type="button"
              className="absolute right-3 top-1/2 -translate-y-1/2 text-[#9CA3AF] hover:text-black transition-colors"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
            >
              {showConfirmPassword ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
            </button>
          </div>

          <div className="flex items-center gap-2">
            <Checkbox
              id="isTeacher"
              checked={isTeacher}
              onCheckedChange={(c) => setIsTeacher(c as boolean)}
              className="border-[#9CA3AF] data-[state=checked]:bg-[#3B82F6] data-[state=checked]:border-[#3B82F6]"
            />
            <label htmlFor="isTeacher" className="text-[13px] text-[#6B7280]">
              Register as a teacher
            </label>
          </div>

          {error && <p className="text-sm text-red-500">{error}</p>}

          <Button
            type="submit"
            className="w-full bg-[#3B82F6] hover:bg-[#3B82F6]/90 text-white h-[40px] font-bold text-[14px] rounded-md mt-2"
            disabled={loading}
          >
            {loading ? "Signing up..." : "CREATE ACCOUNT"}
          </Button>
        </form>

        <p className="mt-4 text-center text-[13px] text-[#9CA3AF]">
          Already have an account?{" "}
          <Link href="/login" className="text-[#3B82F6] hover:underline font-semibold">
            Log in
          </Link>
        </p>
      </div>
    </div>
  );
}
