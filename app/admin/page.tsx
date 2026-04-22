"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { cn } from "@/lib/utils";
import MainLayout from "@/components/layout/MainLayout";
import { useAuth } from "@/contexts/AuthContext";
import { 
  adminApi, 
  AdminDashboardDTO, 
  GetUserResponse, 
  GetCourseResponse,
  UserStatisticsDTO,
  CourseStatisticsDTO 
} from "@/services/adminService";
import { 
  Users, 
  BookOpen, 
  BarChart3, 
  LayoutDashboard, 
  ShieldCheck, 
  GraduationCap, 
  Presentation, 
  CheckCircle2, 
  Search, 
  Trash2, 
  Eye, 
  EyeOff, 
  AlertTriangle,
  Loader2,
  LogOut,
  ArrowLeft
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import Card from "@/components/ui/Card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";

export default function AdminPage() {
  const { user, isAuthenticated, logout, isLoading: authLoading } = useAuth();
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  
  const tabParam = searchParams.get("tab") || "dashboard";
  const [activeTab, setActiveTab] = useState(tabParam);
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Update state when URL param changes
  useEffect(() => {
    setActiveTab(tabParam);
  }, [tabParam]);

  // Update URL when tab state changes
  const handleTabChange = (val: string) => {
    setActiveTab(val);
    router.push(`${pathname}?tab=${val}`);
  };

  // Data
  const [dashboard, setDashboard] = useState<AdminDashboardDTO | null>(null);
  const [users, setUsers] = useState<GetUserResponse[]>([]);
  const [courses, setCourses] = useState<GetCourseResponse[]>([]);
  const [userStats, setUserStats] = useState<UserStatisticsDTO | null>(null);
  const [courseStats, setCourseStats] = useState<CourseStatisticsDTO | null>(null);

  // Filters
  const [userRoleFilter, setUserRoleFilter] = useState<string>("all");
  const [userSearchQuery, setUserSearchQuery] = useState("");
  const [coursePublishFilter, setCoursePublishFilter] = useState<string>("all");
  const [courseSearchQuery, setCourseSearchQuery] = useState("");

  const isAuthorized = user?.role === "Admin";

  useEffect(() => {
    if (!authLoading && isAuthenticated) {
      if (!isAuthorized) {
        setError("Access Denied: You do not have permission to view this page.");
        setLoading(false);
      } else {
        loadData(activeTab);
      }
    }
  }, [authLoading, isAuthenticated, isAuthorized, activeTab]);

  const loadData = async (tab: string) => {
    setLoading(true);
    setError(null);
    try {
      switch (tab) {
        case "dashboard":
          const dbRes = await adminApi.getDashboard();
          setDashboard(dbRes.data);
          break;
        case "users":
          const usersRes = await adminApi.getAllUsers(
            userRoleFilter === "all" ? undefined : userRoleFilter,
            userSearchQuery || undefined
          );
          setUsers(usersRes.data);
          break;
        case "courses":
          const coursesRes = await adminApi.getAllCourses(
            coursePublishFilter === "all" ? undefined : coursePublishFilter === "published",
            courseSearchQuery || undefined
          );
          setCourses(coursesRes.data);
          break;
        case "statistics":
          const [uStats, cStats] = await Promise.all([
            adminApi.getUserStatistics(),
            adminApi.getCourseStatistics()
          ]);
          setUserStats(uStats.data);
          setCourseStats(cStats.data);
          break;
      }
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || "Failed to load data");
      toast.error("Error loading data");
    } finally {
      setLoading(false);
    }
  };

  // User Actions
  const handleDeleteUser = async (userId: string) => {
    if (!confirm("Are you sure you want to delete this user?")) return;
    try {
      await adminApi.deleteUser(userId);
      toast.success("User deleted successfully");
      loadData("users");
    } catch (err: any) {
      toast.error("Failed to delete user");
    }
  };

  // Course Actions
  const handleDeleteCourse = async (courseId: string) => {
    if (!confirm("Are you sure you want to delete this course?")) return;
    try {
      await adminApi.deleteCourse(courseId);
      toast.success("Course deleted successfully");
      loadData("courses");
    } catch (err: any) {
      toast.error("Failed to delete course");
    }
  };

  const handleTogglePublish = async (courseId: string, currentStatus: boolean) => {
    try {
      await adminApi.toggleCoursePublish(courseId, !currentStatus);
      toast.success(`Course ${!currentStatus ? "published" : "unpublished"} successfully`);
      loadData("courses");
    } catch (err: any) {
      toast.error("Failed to update course status");
    }
  };

  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-10 h-10 animate-spin text-blue-600" />
      </div>
    );
  }

  if (!isAuthenticated) {
    window.location.href = "/login";
    return null;
  }

  return (
    <MainLayout headerTitle="Admin Dashboard">
      <div className="p-4 md:p-8 min-h-full bg-slate-50">
        {/* Header Section */}
        <div className="mb-8 bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-black text-slate-900 tracking-tight">Admin Dashboard</h1>
            <p className="text-slate-500 font-medium">Manage users, courses, and system statistics</p>
          </div>
          <Button 
            variant="destructive" 
            onClick={() => logout()}
            className="flex items-center gap-2 font-bold"
          >
            <LogOut className="w-4 h-4" />
            Logout
          </Button>
        </div>

        {error && !isAuthorized && (
          <div className="bg-red-50 border-2 border-red-100 text-red-700 p-8 rounded-2xl text-center shadow-sm">
            <AlertTriangle className="w-16 h-16 mx-auto mb-4 text-red-500" />
            <h2 className="text-2xl font-black mb-2">Access Denied</h2>
            <p className="font-medium">{error}</p>
          </div>
        )}

        {isAuthorized && (
          <>
            <Tabs value={activeTab} onValueChange={handleTabChange} className="space-y-6">
              <TabsList className="bg-white border border-slate-200 p-1 h-auto flex-wrap gap-1">
                <TabsTrigger value="dashboard" className="px-6 py-2.5 font-bold data-[state=active]:bg-blue-600 data-[state=active]:text-white">
                  <LayoutDashboard className="w-4 h-4 mr-2" />
                  Dashboard
                </TabsTrigger>
                <TabsTrigger value="users" className="px-6 py-2.5 font-bold data-[state=active]:bg-blue-600 data-[state=active]:text-white">
                  <Users className="w-4 h-4 mr-2" />
                  Users
                </TabsTrigger>
                <TabsTrigger value="courses" className="px-6 py-2.5 font-bold data-[state=active]:bg-blue-600 data-[state=active]:text-white">
                  <BookOpen className="w-4 h-4 mr-2" />
                  Courses
                </TabsTrigger>
                <TabsTrigger value="statistics" className="px-6 py-2.5 font-bold data-[state=active]:bg-blue-600 data-[state=active]:text-white">
                  <BarChart3 className="w-4 h-4 mr-2" />
                  Statistics
                </TabsTrigger>
              </TabsList>

              {loading && (
                <div className="flex flex-col items-center justify-center py-20 bg-white rounded-2xl border border-slate-100">
                  <Loader2 className="w-12 h-12 animate-spin text-blue-600 mb-4" />
                  <p className="text-slate-500 font-bold">Loading system data...</p>
                </div>
              )}

              {!loading && (
                <>
                  {/* DASHBOARD TAB */}
                  <TabsContent value="dashboard" className="space-y-6">
                    {dashboard && (
                      <>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                          <StatCard title="Total Users" value={dashboard.totalUsers} icon={<Users />} color="blue" />
                          <StatCard title="Students" value={dashboard.totalStudents} icon={<GraduationCap />} color="indigo" />
                          <StatCard title="Teachers" value={dashboard.totalTeachers} icon={<Presentation />} color="purple" />
                          <StatCard title="Admins" value={dashboard.totalAdmins} icon={<ShieldCheck />} color="red" />
                          <StatCard title="Total Courses" value={dashboard.totalCourses} icon={<BookOpen />} color="emerald" />
                          <StatCard title="Active Courses" value={dashboard.activeCourses} icon={<CheckCircle2 />} color="cyan" />
                        </div>

                        <div className="grid grid-cols-1 xl:grid-cols-2 gap-8 mt-8">
                          <Card className="p-6 border-slate-100">
                            <h2 className="text-xl font-black mb-4 flex items-center gap-2">
                              <Users className="w-5 h-5 text-blue-600" />
                              Recent Users
                            </h2>
                            <div className="overflow-x-auto">
                              <table className="w-full">
                                <thead className="bg-slate-50">
                                  <tr>
                                    <th className="text-left py-3 px-4 text-xs font-black uppercase text-slate-500">Username</th>
                                    <th className="text-left py-3 px-4 text-xs font-black uppercase text-slate-500">Email</th>
                                    <th className="text-left py-3 px-4 text-xs font-black uppercase text-slate-500">Role</th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                  {dashboard.recentUsers.map((u) => (
                                    <tr key={u.id} className="hover:bg-slate-50/50">
                                      <td className="py-3 px-4 font-bold text-slate-900">{u.username}</td>
                                      <td className="py-3 px-4 text-slate-500 text-sm">{u.email}</td>
                                      <td className="py-3 px-4">
                                        <RoleBadge role={u.role} />
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          </Card>

                          <Card className="p-6 border-slate-100">
                            <h2 className="text-xl font-black mb-4 flex items-center gap-2">
                              <BookOpen className="w-5 h-5 text-emerald-600" />
                              Recent Courses
                            </h2>
                            <div className="overflow-x-auto">
                              <table className="w-full">
                                <thead className="bg-slate-50">
                                  <tr>
                                    <th className="text-left py-3 px-4 text-xs font-black uppercase text-slate-500">Title</th>
                                    <th className="text-left py-3 px-4 text-xs font-black uppercase text-slate-500">Status</th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                  {dashboard.recentCourses.map((c) => (
                                    <tr key={c.id} className="hover:bg-slate-50/50">
                                      <td className="py-3 px-4 font-bold text-slate-900 truncate max-w-[200px]">{c.title}</td>
                                      <td className="py-3 px-4">
                                        <StatusBadge isPublished={c.isPublished} />
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          </Card>
                        </div>
                      </>
                    )}
                  </TabsContent>

                  {/* USERS TAB */}
                  <TabsContent value="users" className="space-y-6">
                    <Card className="p-6">
                      <div className="flex flex-col md:flex-row gap-4 mb-6">
                        <div className="flex-1 relative">
                          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                          <Input 
                            placeholder="Search by username or email..." 
                            className="pl-10" 
                            value={userSearchQuery}
                            onChange={(e) => setUserSearchQuery(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && loadData('users')}
                          />
                        </div>
                        <Select value={userRoleFilter} onValueChange={(val) => setUserRoleFilter(val)}>
                          <SelectTrigger className="w-full md:w-[180px]">
                            <SelectValue placeholder="All Roles" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">All Roles</SelectItem>
                            <SelectItem value="Student">Learner/Student</SelectItem>
                            <SelectItem value="Teacher">Teacher</SelectItem>
                            <SelectItem value="Admin">Admin</SelectItem>
                          </SelectContent>
                        </Select>
                        <Button onClick={() => loadData('users')} className="font-bold">Apply</Button>
                      </div>

                      <div className="overflow-x-auto rounded-xl border border-slate-100">
                        <table className="w-full">
                          <thead className="bg-slate-50">
                            <tr>
                              <th className="text-left py-4 px-4 text-xs font-black uppercase text-slate-500">Username</th>
                              <th className="text-left py-4 px-4 text-xs font-black uppercase text-slate-500">Email</th>
                              <th className="text-left py-4 px-4 text-xs font-black uppercase text-slate-500">Role</th>
                              <th className="text-right py-4 px-4 text-xs font-black uppercase text-slate-500">Actions</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100">
                            {users.length > 0 ? users.map((u) => (
                              <tr key={u.id} className="hover:bg-slate-50/50">
                                <td className="py-4 px-4 font-bold text-slate-900">{u.username}</td>
                                <td className="py-4 px-4 text-slate-500">{u.email}</td>
                                <td className="py-4 px-4">
                                  <RoleBadge role={u.role} />
                                </td>
                                <td className="py-4 px-4 text-right">
                                  <Button 
                                    variant="ghost" 
                                    size="sm" 
                                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                    onClick={() => handleDeleteUser(u.id)}
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </Button>
                                </td>
                              </tr>
                            )) : (
                              <tr>
                                <td colSpan={4} className="py-10 text-center text-slate-400 font-medium italic">No users found matching your criteria</td>
                              </tr>
                            )}
                          </tbody>
                        </table>
                      </div>
                    </Card>
                  </TabsContent>

                  {/* COURSES TAB */}
                  <TabsContent value="courses" className="space-y-6">
                    <Card className="p-6">
                      <div className="flex flex-col md:flex-row gap-4 mb-6">
                        <div className="flex-1 relative">
                          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                          <Input 
                            placeholder="Search by title or description..." 
                            className="pl-10" 
                            value={courseSearchQuery}
                            onChange={(e) => setCourseSearchQuery(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && loadData('courses')}
                          />
                        </div>
                        <Select value={coursePublishFilter} onValueChange={(val) => setCoursePublishFilter(val)}>
                          <SelectTrigger className="w-full md:w-[180px]">
                            <SelectValue placeholder="All Status" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">All Status</SelectItem>
                            <SelectItem value="published">Published</SelectItem>
                            <SelectItem value="unpublished">Unpublished</SelectItem>
                          </SelectContent>
                        </Select>
                        <Button onClick={() => loadData('courses')} className="font-bold">Apply</Button>
                      </div>

                      <div className="overflow-x-auto rounded-xl border border-slate-100">
                        <table className="w-full">
                          <thead className="bg-slate-50">
                            <tr>
                              <th className="text-left py-4 px-4 text-xs font-black uppercase text-slate-500">Title</th>
                              <th className="text-left py-4 px-4 text-xs font-black uppercase text-slate-500">Status</th>
                              <th className="text-right py-4 px-4 text-xs font-black uppercase text-slate-500">Actions</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100">
                            {courses.length > 0 ? courses.map((c) => (
                              <tr key={c.id} className="hover:bg-slate-50/50">
                                <td className="py-4 px-4">
                                  <p className="font-bold text-slate-900">{c.title}</p>
                                  <p className="text-slate-400 text-xs truncate max-w-[300px]">{c.description || "No description"}</p>
                                </td>
                                <td className="py-4 px-4">
                                  <StatusBadge isPublished={c.isPublished} />
                                </td>
                                <td className="py-4 px-4 text-right space-x-2">
                                  <Button 
                                    variant="outline" 
                                    size="sm" 
                                    className="border-blue-100 text-blue-600 hover:bg-blue-50"
                                    onClick={() => handleTogglePublish(c.id, c.isPublished)}
                                  >
                                    {c.isPublished ? <EyeOff className="w-4 h-4 mr-2" /> : <Eye className="w-4 h-4 mr-2" />}
                                    {c.isPublished ? "Unpublish" : "Publish"}
                                  </Button>
                                  <Button 
                                    variant="ghost" 
                                    size="sm" 
                                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                    onClick={() => handleDeleteCourse(c.id)}
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </Button>
                                </td>
                              </tr>
                            )) : (
                              <tr>
                                <td colSpan={3} className="py-10 text-center text-slate-400 font-medium italic">No courses found matching your criteria</td>
                              </tr>
                            )}
                          </tbody>
                        </table>
                      </div>
                    </Card>
                  </TabsContent>

                  {/* STATISTICS TAB */}
                  <TabsContent value="statistics" className="space-y-10">
                    {userStats && (
                      <section>
                        <h2 className="text-2xl font-black text-slate-900 mb-6 flex items-center gap-3">
                          <Users className="w-8 h-8 text-blue-600" />
                          User Statistics
                        </h2>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                          <StatCard title="Total Users" value={userStats.totalUsers} subtext={`Growth: ${userStats.userGrowthRate}%`} color="blue" />
                          <StatCard title="Students" value={userStats.studentCount} color="indigo" />
                          <StatCard title="Teachers" value={userStats.teacherCount} color="purple" />
                          <StatCard title="Admins" value={userStats.adminCount} color="red" />
                          <StatCard title="New This Month" value={userStats.newUsersThisMonth} color="emerald" />
                        </div>
                      </section>
                    )}

                    {courseStats && (
                      <section>
                        <h2 className="text-2xl font-black text-slate-900 mb-6 flex items-center gap-3">
                          <BookOpen className="w-8 h-8 text-emerald-600" />
                          Course Statistics
                        </h2>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                          <StatCard title="Total Courses" value={courseStats.totalCourses} subtext={`Growth: ${courseStats.courseGrowthRate}%`} color="emerald" />
                          <StatCard title="Published" value={courseStats.publishedCourses} color="blue" />
                          <StatCard title="Unpublished" value={courseStats.unpublishedCourses} color="amber" />
                          <StatCard title="New This Month" value={courseStats.newCoursesThisMonth} color="cyan" />
                        </div>
                      </section>
                    )}
                  </TabsContent>
                </>
              )}
            </Tabs>
          </>
        )}
      </div>
    </MainLayout>
  );
}

function StatCard({ title, value, icon, color, subtext }: { title: string, value: number, icon?: React.ReactNode, color: string, subtext?: string }) {
  const colorMap: Record<string, string> = {
    blue: "bg-blue-600 shadow-blue-200/50",
    indigo: "bg-indigo-600 shadow-indigo-200/50",
    purple: "bg-purple-600 shadow-purple-200/50",
    red: "bg-red-600 shadow-red-200/50",
    emerald: "bg-emerald-600 shadow-emerald-200/50",
    cyan: "bg-cyan-600 shadow-cyan-200/50",
    amber: "bg-amber-500 shadow-amber-200/50",
  };

  return (
    <div className={cn(
      "p-6 text-white rounded-2xl shadow-lg group hover:-translate-y-1 transition-all duration-300",
      colorMap[color] || "bg-slate-800 shadow-slate-200/50"
    )}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-black uppercase tracking-wider opacity-80">{title}</h3>
        {icon && <div className="p-2 bg-white/20 rounded-lg group-hover:scale-110 transition-transform">{icon}</div>}
      </div>
      <p className="text-4xl font-black mb-1">{value?.toLocaleString() ?? "0"}</p>
      {subtext && <p className="text-xs font-bold opacity-80">{subtext}</p>}
    </div>
  );
}

function RoleBadge({ role }: { role: string }) {
  const styles: Record<string, string> = {
    Learner: "bg-blue-50 text-blue-600 border-blue-100",
    Student: "bg-blue-50 text-blue-600 border-blue-100",
    Teacher: "bg-purple-50 text-purple-600 border-purple-100",
    Admin: "bg-red-50 text-red-600 border-red-100",
  };

  return (
    <span className={`px-3 py-1 rounded-full text-[11px] font-black uppercase border ${styles[role] || "bg-slate-50 text-slate-600 border-slate-100"}`}>
      {role}
    </span>
  );
}

function StatusBadge({ isPublished }: { isPublished: boolean }) {
  return (
    <span className={`px-3 py-1 rounded-full text-[11px] font-black uppercase border ${isPublished ? "bg-emerald-50 text-emerald-600 border-emerald-100" : "bg-slate-50 text-slate-400 border-slate-100"}`}>
      {isPublished ? "Published" : "Draft"}
    </span>
  );
}
