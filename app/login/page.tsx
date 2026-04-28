"use client";

import { useState } from "react";
import Link from "next/link";
import { Mail, Lock, Eye, EyeOff } from "lucide-react";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { useAuth } from "@/contexts/AuthContext";

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

      let targetPath = "/";
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

      <div className="w-full max-w-md bg-white/95 p-8 rounded-xl shadow-2xl border border-gray-100 relative z-10 backdrop-blur-md">
        <div className="mb-8">
          <p className="text-sm font-bold tracking-wider text-[#3B82F6] mb-2 uppercase">
            Let&apos;s learn
          </p>
          <h1 className="text-2xl font-bold text-black mb-1">Welcome back!</h1>
          <p className="text-[14px] font-normal text-[#6B7280]">
            Login to gain access to the world right now.
          </p>
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-[#9CA3AF]" />
            <Input
              type="email"
              placeholder="Email"
              className="pl-10 h-[44px] text-[14px] border-[#9CA3AF]/30 focus-visible:ring-[#3B82F6] bg-white"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-[#9CA3AF]" />
            <Input
              type={showPassword ? "text" : "password"}
              placeholder="Password"
              className="pl-10 pr-10 h-[44px] text-[14px] border-[#9CA3AF]/30 focus-visible:ring-[#3B82F6] bg-white"
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

          {error && <p className="text-sm text-red-500">{error}</p>}

          <Button
            type="submit"
            className="w-full bg-[#3B82F6] hover:bg-[#3B82F6]/90 text-white h-[44px] font-bold text-[16px] rounded-md mt-6 shadow-lg shadow-blue-500/30 transition-all"
            disabled={loading}
          >
            {loading ? "Logging in..." : "LOG IN"}
          </Button>
        </form>

        <p className="mt-6 text-center text-[14px] text-[#9CA3AF]">
          Don&apos;t have an account?{" "}
          <Link
            href="/register"
            className="text-[#3B82F6] hover:underline font-semibold"
          >
            Sign up
          </Link>
        </p>
      </div>
    </div>
  );
}
