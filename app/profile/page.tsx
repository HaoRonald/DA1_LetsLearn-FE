"use client";

import { useState, useEffect } from "react";
import {
  User as UserIcon,
  Mail,
  Shield,
  Camera,
  Save,
  X,
  Loader2,
  ChevronRight,
  Layout,
} from "lucide-react";
import MainLayout from "@/components/layout/MainLayout";
import { userService, UserProfile } from "@/services/userService";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { normalizeUser } from "@/lib/utils/user-utils";

export default function ProfilePage() {
  const { user: authUser, setUser } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // Form state
  const [username, setUsername] = useState("");
  const [avatar, setAvatar] = useState("");

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      setIsLoading(true);
      const res = await userService.getMe();
      const normalized = normalizeUser(res.data);
      setProfile(normalized as any);
      setUsername(normalized.username);
      setAvatar(normalized.avatar || "");
    } catch (error) {
      console.error("Error fetching profile:", error);
      toast.error("Failed to load profile information");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    if (!username.trim()) {
      toast.error("Username cannot be empty");
      return;
    }

    try {
      setIsSaving(true);
      const res = await userService.updateMe({ username, avatar });
      const updatedUser = normalizeUser(res.data);
      setProfile(updatedUser as any);

      // Update AuthContext so header/sidebar avatar & name update immediately
      if (authUser) {
        setUser(updatedUser);
      }

      toast.success("Profile updated successfully");
    } catch (error) {
      console.error("Error updating profile:", error);
      toast.error("Failed to update profile");
    } finally {
      setIsSaving(false);
    }
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // In a real app, you'd upload to S3/Cloudinary.
      // For now, we'll use a URL if the user provides one, or a placeholder logic.
      // But since we want "call BE API correctly", I'll just keep it as a string field.
      // Let's allow users to input a URL for now or use a dummy upload logic.
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatar(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  if (isLoading) {
    return (
      <MainLayout>
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="w-10 h-10 animate-spin text-blue-500" />
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout headerTitle="My Profile">
      <div className="max-w-4xl mx-auto p-6 lg:p-12">
        {/* Header Section */}
        <div className="mb-10">
          <h1 className="text-3xl font-black text-slate-900 mb-2">
            Account Settings
          </h1>
          <p className="text-slate-500 font-medium">
            Manage your public profile and personal information.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column: Avatar & Quick Info */}
          <div className="lg:col-span-1 space-y-6">
            <div className="bg-white rounded-[32px] border border-slate-200 shadow-sm p-8 flex flex-col items-center text-center">
              <div className="relative mb-6">
                <div className="w-32 h-32 rounded-[40px] overflow-hidden border-4 border-white shadow-xl ring-1 ring-slate-100">
                  <img
                    src={
                      avatar ||
                      `https://ui-avatars.com/api/?name=${username}&background=3B82F6&color=fff`
                    }
                    alt="Profile"
                    className="w-full h-full object-cover"
                  />
                </div>
                <label className="absolute -bottom-2 -right-2 w-10 h-10 bg-blue-600 text-white rounded-2xl flex items-center justify-center cursor-pointer hover:bg-blue-700 transition-all shadow-lg shadow-blue-600/30 border-2 border-white">
                  <Camera className="w-5 h-5" />
                  <input
                    type="file"
                    className="hidden"
                    onChange={handleAvatarChange}
                    accept="image/*"
                  />
                </label>
              </div>

              <h2 className="text-xl font-black text-slate-900 mb-1">
                {profile?.username}
              </h2>
              <p className="text-sm font-bold text-blue-600 bg-blue-50 px-3 py-1 rounded-lg uppercase tracking-wider mb-6">
                {profile?.role}
              </p>

              <div className="w-full pt-6 border-t border-slate-100 space-y-4">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-400 font-bold uppercase text-[10px] tracking-widest">
                    ID Reference
                  </span>
                  <span className="text-slate-900 font-mono text-[11px] truncate max-w-[120px]">
                    {profile?.id}
                  </span>
                </div>
              </div>
            </div>

            <div className="bg-slate-900 rounded-[32px] p-6 text-white overflow-hidden relative">
              <div className="relative z-10">
                <h3 className="font-black text-lg mb-2">Learning Progress</h3>
                <p className="text-slate-400 text-sm mb-4">
                  Keep track of your courses and certificates here.
                </p>
                <button className="flex items-center gap-2 text-sm font-bold text-blue-400 hover:text-blue-300 transition-colors">
                  View my courses <ChevronRight className="w-4 h-4" />
                </button>
              </div>
              <Layout className="absolute -bottom-6 -right-6 w-32 h-32 text-white/5 rotate-12" />
            </div>
          </div>

          {/* Right Column: Editable Fields */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-[32px] border border-slate-200 shadow-sm overflow-hidden">
              <div className="px-8 py-6 border-b border-slate-100 bg-slate-50/50">
                <h3 className="font-black text-slate-900">
                  Personal Information
                </h3>
              </div>

              <div className="p-8 space-y-6">
                {/* Username */}
                <div className="space-y-2">
                  <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">
                    Display Name
                  </label>
                  <div className="relative">
                    <UserIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                    <input
                      type="text"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      placeholder="Enter your username"
                      className="w-full pl-12 pr-4 h-14 bg-slate-50 border-none rounded-2xl text-slate-900 font-bold focus:ring-2 focus:ring-blue-500/20 transition-all outline-none"
                    />
                  </div>
                </div>

                {/* Email (Read Only) */}
                <div className="space-y-2">
                  <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">
                    Email Address
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                    <input
                      type="email"
                      value={profile?.email || ""}
                      readOnly
                      className="w-full pl-12 pr-4 h-14 bg-slate-100 border-none rounded-2xl text-slate-400 font-bold cursor-not-allowed outline-none"
                    />
                  </div>
                  <p className="text-[10px] font-bold text-slate-400 ml-1 italic">
                    Email cannot be changed for security reasons.
                  </p>
                </div>

                {/* Role (Read Only) */}
                <div className="space-y-2">
                  <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">
                    User Role
                  </label>
                  <div className="relative">
                    <Shield className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                    <input
                      type="text"
                      value={profile?.role || ""}
                      readOnly
                      className="w-full pl-12 pr-4 h-14 bg-slate-100 border-none rounded-2xl text-slate-400 font-bold cursor-not-allowed outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="px-8 py-6 bg-slate-50/50 border-t border-slate-100 flex items-center justify-end gap-4">
                <button
                  onClick={fetchProfile}
                  className="px-6 h-12 rounded-xl text-slate-500 font-bold hover:bg-slate-100 transition-all flex items-center gap-2"
                >
                  <X className="w-4 h-4" /> Cancel
                </button>
                <button
                  onClick={handleSave}
                  disabled={isSaving}
                  className="px-8 h-12 rounded-xl bg-blue-600 text-white font-black hover:bg-blue-700 transition-all shadow-lg shadow-blue-600/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 active:scale-95"
                >
                  {isSaving ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Save className="w-4 h-4" />
                  )}
                  Save Changes
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
