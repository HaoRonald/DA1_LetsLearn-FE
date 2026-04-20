"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Mail, Lock, Eye, EyeOff } from "lucide-react";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { useAuth } from "@/contexts/AuthContext";

export default function LoginPage() {
  const router = useRouter();
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
      console.log('DEBUG: Full user object from login:', user);

      // Normalize role (handle all possible cases)
      const rawUser = user as any;
      const role = rawUser.role || rawUser.Role || "Learner";
      
      console.log('DEBUG: Normalized role:', role);

      let targetPath = "/";
      // Both Teacher and Learner go to home page "/"
      // Role-specific content is rendered on the home page itself
      
      console.log(`DEBUG: Final Target Path: ${targetPath}`);
      
      // Force redirect
      if (typeof window !== "undefined") {
        console.log("DEBUG: Executing window.location.href...");
        window.location.href = targetPath;
      }
    } catch (err: any) {
      setError(err.response?.data?.message || "Invalid email or password");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 p-4 font-sans">
      <div className="w-full max-w-md bg-white p-8 rounded-xl shadow-sm border border-gray-100">
        <div className="mb-8">
          <p className="text-sm font-bold tracking-wider text-black mb-2 uppercase">
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
              className="pl-10 h-[44px] text-[14px] border-[#9CA3AF]/30 focus-visible:ring-[#3B82F6]"
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

          {error && <p className="text-sm text-red-500">{error}</p>}

          <Button
            type="submit"
            className="w-full bg-[#3B82F6] hover:bg-[#3B82F6]/90 text-white h-[44px] font-bold text-[16px] rounded-md mt-6"
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
