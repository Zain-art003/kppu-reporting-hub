import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Shield,
  Clock,
  CheckCircle,
  Users,
  FileText,
  Send,
  Trash2,
  RefreshCw,
  Download,
  BarChart3,
  TrendingUp,
  Bell,
  Eye,
  UserX,
  UserCheck,
  AlertCircle,
  Pencil,
  Check,
  Filter,
  Plus,
} from "lucide-react";
import { jsPDF } from "jspdf";
import AdminSidebar from "@/components/AdminSidebar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

type Report = {
  id: string;
  ticket_number: string;
  institution_type: string;
  unit_work: string;
  reported_name: string;
  reported_position: string;
  incident_time: string;
  report_description: string;
  status: string;
  category?: string;
  created_at: string;
};

type TimelineEntry = {
  id: string;
  status: string;
  description: string;
  created_at: string;
};

type UserStats = {
  totalUsers: number;
  totalReports: number;
  pendingReports: number;
  completedReports: number;
};

const statusOptions = [
  { value: "submitted", label: "Diterima", color: "bg-blue-500" },
  { value: "in_review", label: "Sedang Ditelaah", color: "bg-yellow-500" },
  { value: "in_progress", label: "Dalam Proses", color: "bg-orange-500" },
  { value: "completed", label: "Selesai", color: "bg-green-500" },
  { value: "rejected", label: "Ditolak", color: "bg-red-500" },
];

const categories = [
  { value: "korupsi", label: "Korupsi" },
  { value: "penyuapan", label: "Penyuapan" },
  { value: "kolusi", label: "Kolusi" },
  { value: "nepotisme", label: "Nepotisme" },
  { value: "pelanggaran_kode_etik", label: "Pelanggaran Kode Etik" },
  { value: "pelanggaran_peraturan", label: "Pelanggaran Peraturan" },
  { value: "penyalahgunaan_wewenang", label: "Penyalahgunaan Wewenang" },
  { value: "diskriminasi", label: "Diskriminasi" },
  { value: "kekerasan", label: "Kekerasan" },
  { value: "pelecehan", label: "Pelecehan" },
  { value: "pelanggaran_hak_asasi", label: "Pelanggaran Hak Asasi Manusia" },
  { value: "lainnya", label: "Lainnya" },
];

const getCategoryLabel = (value: string) => {
  const cat = categories.find((c) => c.value === value);
  return cat ? cat.label : value;
};

const AdminDashboard = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<UserStats>({
    totalUsers: 0,
    totalReports: 0,
    pendingReports: 0,
    completedReports: 0,
  });
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);
  const [timeline, setTimeline] = useState<TimelineEntry[]>([]);
  const [newStatus, setNewStatus] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [updating, setUpdating] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [reportToDelete, setReportToDelete] = useState<string | null>(null);

  const [filterStatus, setFilterStatus] = useState("all");
  const [filterCategory, setFilterCategory] = useState("all");
  const [filterDateFrom, setFilterDateFrom] = useState("");
  const [filterDateTo, setFilterDateTo] = useState("");

  // Stats section local filters
  const [statsFilterCategory, setStatsFilterCategory] = useState("all");
  const [statsFilterDateFrom, setStatsFilterDateFrom] = useState("");
  const [statsFilterDateTo, setStatsFilterDateTo] = useState("");
  const [showStatsFilters, setShowStatsFilters] = useState(false);

  const [categoryStats, setCategoryStats] = useState<
    { count: number; category: string; percentage: number }[]
  >([]);
  const [periodStats, setPeriodStats] = useState<
    { period: string; count: number; percentage: number }[]
  >([]);

  const [activeSection, setActiveSection] = useState("dashboard");

  const [notifications, setNotifications] = useState<
    {
      id: string;
      message: string;
      type: string;
      read: boolean;
      created_at: string;
    }[]
  >([]);
  const [showNotifications, setShowNotifications] = useState(false);

  const [users, setUsers] = useState<
    {
      id: string;
      email: string;
      name: string;
      created_at: string;
      phone?: string;
      role?: string;
    }[]
  >([]);

  const [userToDelete, setUserToDelete] = useState<string | null>(null);
  const [deleteUserDialogOpen, setDeleteUserDialogOpen] = useState(false);
  const [userFilter, setUserFilter] = useState("");

  const [selectedUser, setSelectedUser] = useState<{
    id: string;
    email: string;
    name: string;
    created_at: string;
    phone?: string;
    role?: string;
  } | null>(null);
  const [userDialogOpen, setUserDialogOpen] = useState(false);
  const [userMessage, setUserMessage] = useState("");
  const [sendingMessage, setSendingMessage] = useState(false);
  const [userReports, setUserReports] = useState<Report[]>([]);
  const [loadingUserReports, setLoadingUserReports] = useState(false);

  const [isEditingUser, setIsEditingUser] = useState(false);
  const [editUserName, setEditUserName] = useState("");
  const [editUserPhone, setEditUserPhone] = useState("");
  const [savingUser, setSavingUser] = useState(false);

  const [userRoles, setUserRoles] = useState<Record<string, string>>({});
  const [changingRole, setChangingRole] = useState<string | null>(null);

  // Create user states
  const [showCreateUserDialog, setShowCreateUserDialog] = useState(false);
  const [creatingUser, setCreatingUser] = useState(false);
  const [newUserEmail, setNewUserEmail] = useState("");
  const [newUserName, setNewUserName] = useState("");
  const [newUserPassword, setNewUserPassword] = useState("");
  const [newUserRole, setNewUserRole] = useState<"user" | "admin">("user");
  const [createUserError, setCreateUserError] = useState("");

  // Admin check states
  const [isUserAdmin, setIsUserAdmin] = useState<boolean | null>(null);
  const [checkingAdmin, setCheckingAdmin] = useState(true);

  // Fetch notifications
  const fetchNotifications = async () => {
    const { data } = await supabase
      .from("reports")
      .select("id, ticket_number, status, created_at")
      .order("created_at", { ascending: false })
      .limit(10);

    if (data) {
      const notifs = data.map((r) => ({
        id: r.id,
        message: `Laporan baru: ${r.ticket_number}`,
        type: r.status,
        read: false,
        created_at: r.created_at,
      }));
      setNotifications(notifs);
    }
  };

  // Fetch users
  const fetchUsers = async () => {
    try {
      // Fetch all fields from profiles - use * to get all columns including email if it exists
      const { data: profiles, error: profilesError } = await supabase
        .from("profiles")
        .select("*")
        .order("created_at", { ascending: false });

      console.log("fetchUsers: Raw profiles data:", profiles);
      console.log("fetchUsers: Error:", profilesError);

      // Handle error gracefully
      if (profilesError) {
        console.error(
          "fetchUsers: Error loading profiles:",
          profilesError.message
        );
        // Don't set users to empty, keep existing data or show error
        setUsers([]);
        return;
      }

      // Fetch roles
      const { data: roles, error: rolesError } = await supabase
        .from("user_roles")
        .select("user_id, role");

      if (rolesError) {
        console.error("fetchUsers: Error loading roles:", rolesError.message);
      }

      const rolesMap: Record<string, string> = {};
      roles?.forEach((r) => {
        rolesMap[r.user_id] = r.role;
      });
      setUserRoles(rolesMap);

      if (profiles && profiles.length > 0) {
        // Map profiles - use type assertion to handle dynamic columns like email
        const usersWithEmail = (profiles as any[]).map((p) => ({
          id: p.user_id || p.id,
          user_id: p.user_id,
          name: p.name || "",
          email: p.email || "N/A", // Email column might exist in DB
          phone: p.phone || "",
          created_at: p.created_at,
          role: rolesMap[p.user_id || p.id] || "user",
        }));

        console.log("fetchUsers: Mapped users:", usersWithEmail);
        setUsers(usersWithEmail);
      } else {
        console.log(
          "fetchUsers: No profiles found - this is OK for new installations"
        );
        setUsers([]);
      }
    } catch (err: any) {
      console.error("fetchUsers: Exception:", err?.message || err);
      setUsers([]);
    }
  };

  // Change user role
  const handleChangeRole = async (
    userId: string,
    newRole: "admin" | "user"
  ) => {
    setChangingRole(userId);
    try {
      console.log(
        "handleChangeRole: Starting for userId:",
        userId,
        "newRole:",
        newRole
      );

      // First check if role exists
      const { data: existingRole, error: fetchError } = await supabase
        .from("user_roles")
        .select("id, role")
        .eq("user_id", userId)
        .maybeSingle();

      console.log(
        "handleChangeRole: Existing role:",
        existingRole,
        "fetchError:",
        fetchError
      );

      if (fetchError) {
        console.error("handleChangeRole: Fetch error:", fetchError);
        toast({
          title: "Gagal",
          description: fetchError.message,
          variant: "destructive",
        });
        return;
      }

      if (existingRole) {
        // Update existing role
        console.log("handleChangeRole: Updating existing role");
        const { error: updateError } = await supabase
          .from("user_roles")
          .update({ role: newRole })
          .eq("user_id", userId);

        console.log("handleChangeRole: Update result, error:", updateError);

        if (updateError) {
          console.error("handleChangeRole: Update error:", updateError);
          toast({
            title: "Gagal",
            description: updateError.message,
            variant: "destructive",
          });
        } else {
          toast({
            title: "Berhasil",
            description: `Role pengguna berhasil diubah menjadi ${
              newRole === "admin" ? "Admin" : "User"
            }`,
          });
          setUserRoles((prev) => ({ ...prev, [userId]: newRole }));
          fetchUsers();
        }
      } else {
        // Insert new role
        console.log("handleChangeRole: Inserting new role");
        const { error: insertError } = await supabase
          .from("user_roles")
          .insert({ user_id: userId, role: newRole });

        console.log("handleChangeRole: Insert result, error:", insertError);

        if (insertError) {
          console.error("handleChangeRole: Insert error:", insertError);
          toast({
            title: "Gagal",
            description: insertError.message,
            variant: "destructive",
          });
        } else {
          toast({
            title: "Berhasil",
            description: `Role pengguna berhasil diubah menjadi ${
              newRole === "admin" ? "Admin" : "User"
            }`,
          });
          setUserRoles((prev) => ({ ...prev, [userId]: newRole }));
          fetchUsers();
        }
      }
    } catch (err: any) {
      console.error("handleChangeRole: Catch error:", err);
      toast({
        title: "Gagal",
        description: err?.message || "Terjadi kesalahan",
        variant: "destructive",
      });
    } finally {
      console.log("handleChangeRole: Finally, setting changingRole to null");
      setChangingRole(null);
    }
  };

  // View user details
  const handleViewUser = async (userData: {
    id: string;
    email: string;
    name: string;
    created_at: string;
    phone?: string;
  }) => {
    setSelectedUser(userData);
    setUserMessage("");
    setLoadingUserReports(true);
    setIsEditingUser(false);
    setUserDialogOpen(true);

    const { data } = await supabase
      .from("reports")
      .select("*")
      .eq("user_id", userData.id)
      .order("created_at", { ascending: false });

    setUserReports((data as Report[]) || []);
    setLoadingUserReports(false);
  };

  // Send message to user
  const handleSendMessage = async () => {
    if (!selectedUser || !userMessage.trim()) {
      toast({
        title: "Error",
        description: "Pesan tidak boleh kosong",
        variant: "destructive",
      });
      return;
    }

    setSendingMessage(true);
    try {
      const { error } = await supabase.from("user_notifications").insert({
        user_id: selectedUser.id,
        title: "Pesan dari Admin",
        message: userMessage,
        type: "admin_message",
        is_read: false,
      });

      setSendingMessage(false);
      if (error) {
        toast({
          title: "Gagal Mengirim",
          description: error.message,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Berhasil",
          description: "Pesan telah dikirim ke pengguna",
        });
        setUserMessage("");
      }
    } catch (err: any) {
      setSendingMessage(false);
      toast({
        title: "Error",
        description: err?.message || "Terjadi kesalahan",
        variant: "destructive",
      });
    }
  };

  // Send warning
  const handleSendWarning = async (userId: string) => {
    try {
      const { error } = await supabase.from("user_notifications").insert({
        user_id: userId,
        title: "Peringatan dari Admin",
        message: "Mohon perhatikan bahwa aktivitas akun Anda sedang dipantau.",
        type: "warning",
        is_read: false,
      });

      if (error) {
        toast({
          title: "Gagal",
          description: error.message,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Berhasil",
          description: "Peringatan telah dikirim ke pengguna",
        });
      }
    } catch (err) {
      toast({
        title: "Info",
        description: "Fitur notifikasi belum tersedia",
        variant: "default",
      });
    }
  };

  // Start editing user
  const handleStartEditUser = (userData: {
    id: string;
    email: string;
    name: string;
    created_at: string;
    phone?: string;
  }) => {
    setEditUserName(userData.name || "");
    setEditUserPhone(userData.phone || "");
    setIsEditingUser(true);
  };

  // Save user edits
  const handleSaveUser = async () => {
    if (!selectedUser) return;
    setSavingUser(true);

    const { error } = await supabase
      .from("profiles")
      .update({ name: editUserName, phone: editUserPhone })
      .eq("id", selectedUser.id);

    setSavingUser(false);
    if (error) {
      toast({
        title: "Gagal",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Berhasil",
        description: "Data pengguna berhasil diperbarui",
      });
      setIsEditingUser(false);
      fetchUsers();
    }
  };

  // Mark notification as read
  const markNotificationRead = (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
  };

  const clearNotifications = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    setShowNotifications(false);
  };

  // Fetch category statistics
  const fetchCategoryStats = async () => {
    try {
      console.log("AdminDashboard: Fetching category stats...");
      console.log(
        "AdminDashboard: Current filters - category:",
        filterCategory,
        "dateFrom:",
        filterDateFrom,
        "dateTo:",
        filterDateTo
      );

      // Try to fetch with category first
      const { data: allReports, error: reportsError } = await supabase
        .from("reports")
        .select("id, category, status, created_at");

      console.log(
        "AdminDashboard: Reports data:",
        allReports,
        "error:",
        reportsError
      );

      // Handle error - if reportsError, try simpler query
      let reportsData: any[] = [];
      if (reportsError) {
        console.log(
          "AdminDashboard: Error with full select, trying simpler query"
        );
        const { data: simpleData, error: simpleError } = await supabase
          .from("reports")
          .select("id, status, created_at");

        if (simpleError) {
          console.error(
            "AdminDashboard: Simple query also failed:",
            simpleError.message
          );
          // Return empty stats on error
          setCategoryStats([]);
          setPeriodStats([
            { period: "1 bulan", count: 0, percentage: 0 },
            { period: "3 bulan", count: 0, percentage: 0 },
            { period: "1 tahun", count: 0, percentage: 0 },
          ]);
          return;
        }
        reportsData = simpleData || [];
      } else {
        reportsData = allReports || [];
      }

      if (!reportsData || reportsData.length === 0) {
        console.log("AdminDashboard: No reports found");
        setCategoryStats([]);
        setPeriodStats([
          { period: "1 bulan", count: 0, percentage: 0 },
          { period: "3 bulan", count: 0, percentage: 0 },
          { period: "1 tahun", count: 0, percentage: 0 },
        ]);
        return;
      }

      // Apply sidebar/category filter if set
      let filteredReports = reportsData;
      if (filterCategory && filterCategory !== "all") {
        filteredReports = filteredReports.filter(
          (r: any) => r.category === filterCategory
        );
        console.log(
          "AdminDashboard: After category filter:",
          filteredReports.length
        );
      }

      // Apply date range filter if set
      if (filterDateFrom) {
        const fromDate = new Date(filterDateFrom);
        filteredReports = filteredReports.filter(
          (r: any) => new Date(r.created_at) >= fromDate
        );
        console.log(
          "AdminDashboard: After dateFrom filter:",
          filteredReports.length
        );
      }
      if (filterDateTo) {
        const toDate = new Date(filterDateTo + "T23:59:59");
        filteredReports = filteredReports.filter(
          (r: any) => new Date(r.created_at) <= toDate
        );
        console.log(
          "AdminDashboard: After dateTo filter:",
          filteredReports.length
        );
      }

      console.log(
        "AdminDashboard: Processing",
        filteredReports.length,
        "reports after filters"
      );

      // Check if category exists and has values
      const hasCategory = reportsData.some(
        (r: any) => r.category && r.category !== null && r.category !== ""
      );
      console.log("AdminDashboard: Has category data:", hasCategory);

      let statsData: { category: string; count: number; percentage: number }[] =
        [];

      if (!hasCategory || !filterCategory || filterCategory === "all") {
        // Use status for statistics instead of category
        const statusCount: Record<string, number> = {};
        const statusLabels: Record<string, string> = {
          submitted: "Diterima",
          in_review: "Sedang Ditelaah",
          in_progress: "Dalam Proses",
          completed: "Selesai",
          rejected: "Ditolak",
        };

        filteredReports.forEach((r: any) => {
          const status = r.status || "unknown";
          statusCount[status] = (statusCount[status] || 0) + 1;
        });

        const total = filteredReports.length;
        statsData = Object.entries(statusCount).map(([status, count]) => ({
          category: statusLabels[status] || status,
          count,
          percentage: total > 0 ? Math.round((count / total) * 100) : 0,
        }));
        console.log("AdminDashboard: Using status stats:", statsData);
      } else {
        // Count by category
        const categoryCount: Record<string, number> = {};
        filteredReports.forEach((r: any) => {
          const cat = r.category || "tanpa_kategori";
          categoryCount[cat] = (categoryCount[cat] || 0) + 1;
        });

        const total = filteredReports.length;
        statsData = Object.entries(categoryCount)
          .map(([category, count]) => ({
            category,
            count,
            percentage: Math.round((count / total) * 100),
          }))
          .sort((a, b) => b.count - a.count);
        console.log("AdminDashboard: Category stats:", statsData);
      }

      setCategoryStats(statsData);

      // Period stats - calculate based on ALL reports (not filtered) for context
      const now = new Date();
      const oneMonthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      const threeMonthsAgo = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
      const oneYearAgo = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);

      const count1Month = filteredReports.filter(
        (r: any) => new Date(r.created_at) >= oneMonthAgo
      ).length;
      const count3Months = filteredReports.filter(
        (r: any) => new Date(r.created_at) >= threeMonthsAgo
      ).length;
      const count1Year = filteredReports.filter(
        (r: any) => new Date(r.created_at) >= oneYearAgo
      ).length;
      const totalAll = filteredReports.length;

      setPeriodStats([
        {
          period: "1 bulan",
          count: count1Month,
          percentage:
            totalAll > 0 ? Math.round((count1Month / totalAll) * 100) : 0,
        },
        {
          period: "3 bulan",
          count: count3Months,
          percentage:
            totalAll > 0 ? Math.round((count3Months / totalAll) * 100) : 0,
        },
        {
          period: "1 tahun",
          count: count1Year,
          percentage:
            totalAll > 0 ? Math.round((count1Year / totalAll) * 100) : 0,
        },
      ]);

      console.log("AdminDashboard: Period stats set");
    } catch (error) {
      console.error("AdminDashboard: Error fetching stats:", error);
      setCategoryStats([]);
      setPeriodStats([
        { period: "1 bulan", count: 0, percentage: 0 },
        { period: "3 bulan", count: 0, percentage: 0 },
        { period: "1 tahun", count: 0, percentage: 0 },
      ]);
    }
  };

  // Also fetch category stats on mount and when admin is confirmed
  useEffect(() => {
    // Always fetch category stats when component mounts (if user is admin)
    if (user && isUserAdmin) {
      console.log(
        "AdminDashboard: useEffect triggering fetchCategoryStats on mount"
      );
      fetchCategoryStats();
    }
  }, [user, isUserAdmin]);

  // Fetch stats when stats section filters change
  useEffect(() => {
    if (user && isUserAdmin) {
      // Apply stats filters to local filters for fetching
      if (statsFilterCategory !== "all") {
        setFilterCategory(statsFilterCategory);
      }
      if (statsFilterDateFrom) {
        setFilterDateFrom(statsFilterDateFrom);
      }
      if (statsFilterDateTo) {
        setFilterDateTo(statsFilterDateTo);
      }
      fetchCategoryStats();
    }
  }, [
    statsFilterCategory,
    statsFilterDateFrom,
    statsFilterDateTo,
    user,
    isUserAdmin,
  ]);

  // Also fetch on filter changes
  useEffect(() => {
    if (user && isUserAdmin) {
      fetchCategoryStats();
    }
  }, [filterCategory, filterDateFrom, filterDateTo, user, isUserAdmin]);

  const fetchStats = async () => {
    try {
      // Use Promise.all for parallel fetching with proper error handling
      const [
        userCountResult,
        totalReportsResult,
        pendingReportsResult,
        completedReportsResult,
      ] = await Promise.all([
        supabase.from("profiles").select("*", { count: "exact", head: true }),
        supabase.from("reports").select("*", { count: "exact", head: true }),
        supabase
          .from("reports")
          .select("*", { count: "exact", head: true })
          .in("status", ["submitted", "in_review", "in_progress"]),
        supabase
          .from("reports")
          .select("*", { count: "exact", head: true })
          .eq("status", "completed"),
      ]);

      const userCount = userCountResult.count ?? 0;
      const totalReports = totalReportsResult.count ?? 0;
      const pendingReports = pendingReportsResult.count ?? 0;
      const completedReports = completedReportsResult.count ?? 0;

      setStats({
        totalUsers: userCount,
        totalReports: totalReports,
        pendingReports: pendingReports,
        completedReports: completedReports,
      });
    } catch (err) {
      console.error("fetchStats: Error:", err);
      // Set default values on error
      setStats({
        totalUsers: 0,
        totalReports: 0,
        pendingReports: 0,
        completedReports: 0,
      });
    }
  };

  const fetchReports = async () => {
    try {
      const { data, error } = await supabase
        .from("reports")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) {
        console.error("fetchReports: Error:", error.message);
        setReports([]);
      } else {
        setReports((data as Report[]) || []);
      }
    } catch (err) {
      console.error("fetchReports: Exception:", err);
      setReports([]);
    } finally {
      setLoading(false);
    }
  };

  // CHECK ADMIN ROLE - query from database
  useEffect(() => {
    let isMounted = true;

    const checkAdmin = async () => {
      if (authLoading) {
        setCheckingAdmin(true);
        return;
      }

      if (!user) {
        navigate("/login", { replace: true });
        return;
      }

      try {
        console.log("AdminDashboard: Checking role for user_id:", user.id);

        const { data: roleData, error: roleError } = await supabase
          .from("user_roles")
          .select("role")
          .eq("user_id", user.id)
          .maybeSingle();

        console.log(
          "AdminDashboard: roleData:",
          roleData,
          "roleError:",
          roleError
        );

        let userRole = "user";

        if (roleError || !roleData) {
          console.log("AdminDashboard: No role found, defaulting to user");
          userRole = "user";
        } else {
          userRole = roleData?.role || "user";
          console.log("AdminDashboard: Role from database:", userRole);
        }

        const isAdmin = userRole === "admin";

        if (isMounted) {
          setIsUserAdmin(isAdmin);
          setCheckingAdmin(false);

          if (isAdmin) {
            fetchReports();
            fetchStats();
            fetchCategoryStats();
            fetchNotifications();
            fetchUsers();
          }
        }
      } catch (err) {
        console.error("AdminDashboard: Error checking role:", err);
        if (isMounted) {
          setIsUserAdmin(false);
          setCheckingAdmin(false);
        }
      }
    };

    checkAdmin();

    return () => {
      isMounted = false;
    };
  }, [user, authLoading, navigate]);

  // Show loading while checking
  if (checkingAdmin || authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <p className="text-muted-foreground">Memuat...</p>
      </div>
    );
  }

  // If not admin, show access denied
  if (isUserAdmin === false) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center p-8">
          <h1 className="text-2xl font-bold text-red-600 mb-4">
            Akses Ditolak
          </h1>
          <p className="text-muted-foreground mb-4">
            Anda tidak memiliki izin untuk mengakses halaman ini.
          </p>
          <Button onClick={() => navigate("/dashboard")} variant="outline">
            Kembali ke Halaman Utama
          </Button>
        </div>
      </div>
    );
  }

  const openReport = async (report: Report) => {
    setSelectedReport(report);
    setNewStatus(report.status);
    setNewDescription("");
    const { data } = await supabase
      .from("report_timeline")
      .select("*")
      .eq("report_id", report.id)
      .order("created_at", { ascending: true });
    setTimeline((data as TimelineEntry[]) || []);
    setDialogOpen(true);
  };

  const handleUpdateStatus = async () => {
    if (!selectedReport || !newStatus || !newDescription) {
      toast({
        title: "Error",
        description: "Status dan deskripsi wajib diisi",
        variant: "destructive",
      });
      return;
    }

    setUpdating(true);

    try {
      // Get current user for audit trail
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        toast({
          title: "Error",
          description: "Session expired. Silakan login kembali.",
          variant: "destructive",
        });
        setUpdating(false);
        return;
      }

      // Update report status directly (no Edge Function needed)
      const { error: updateError } = await supabase
        .from("reports")
        .update({
          status: newStatus,
          updated_at: new Date().toISOString(),
        })
        .eq("id", selectedReport.id);

      if (updateError) {
        console.error("handleUpdateStatus: Update error:", updateError);
        toast({
          title: "Gagal",
          description: updateError.message || "Gagal memperbarui status",
          variant: "destructive",
        });
        setUpdating(false);
        return;
      }

      // Add timeline entry
      const { error: timelineError } = await supabase
        .from("report_timeline")
        .insert({
          report_id: selectedReport.id,
          status: newStatus,
          description: newDescription,
        });

      if (timelineError) {
        console.error("handleUpdateStatus: Timeline error:", timelineError);
      }

      // Send email notification via Edge Function (non-blocking)
      try {
        const { data, error } = await supabase.functions.invoke(
          "send-status-email",
          {
            body: {
              report_id: selectedReport.id,
              new_status: newStatus,
            },
          }
        );

        if (error) {
          console.log(
            "Email notification error (non-blocking):",
            error.message
          );
        } else {
          console.log("Email notification sent:", data);
        }
      } catch (emailErr: any) {
        console.log(
          "Email notification exception (non-blocking):",
          emailErr?.message || emailErr
        );
      }

      console.log("handleUpdateStatus: Success - status updated to", newStatus);
      toast({
        title: "Berhasil",
        description: "Status pengaduan berhasil diperbarui",
      });

      setSelectedReport({ ...selectedReport, status: newStatus });

      // Refresh timeline
      const { data: timelineData } = await supabase
        .from("report_timeline")
        .select("*")
        .eq("report_id", selectedReport.id)
        .order("created_at", { ascending: true });
      setTimeline((timelineData as TimelineEntry[]) || []);

      setNewDescription("");
      fetchReports();
      fetchStats();
    } catch (err: any) {
      console.error("handleUpdateStatus: Catch error:", err);
      toast({
        title: "Gagal",
        description: err?.message || "Terjadi kesalahan",
        variant: "destructive",
      });
    } finally {
      setUpdating(false);
    }
  };

  const handleDelete = async () => {
    if (!reportToDelete) return;
    try {
      await supabase
        .from("report_timeline")
        .delete()
        .eq("report_id", reportToDelete);
      const { error: reportError } = await supabase
        .from("reports")
        .delete()
        .eq("id", reportToDelete);
      if (reportError) {
        toast({
          title: "Gagal",
          description: reportError.message,
          variant: "destructive",
        });
        return;
      }
      toast({ title: "Berhasil", description: "Pengaduan berhasil dihapus" });
      fetchReports();
      fetchStats();
      setDialogOpen(false);
    } catch (err) {
      toast({
        title: "Gagal",
        description: "Terjadi kesalahan",
        variant: "destructive",
      });
    } finally {
      setDeleteDialogOpen(false);
      setReportToDelete(null);
    }
  };

  const handleRefresh = async () => {
    setLoading(true);
    await Promise.all([
      fetchReports(),
      fetchStats(),
      fetchCategoryStats(),
      fetchUsers(),
    ]);
    toast({ title: "Berhasil", description: "Data berhasil diperbarui" });
  };

  const handleDeleteUser = async () => {
    if (!userToDelete) return;
    try {
      // Note: Deleting auth user requires service_role key (backend)
      // For now, we'll just delete the profile and role records
      // The actual auth user deletion would need a backend API endpoint

      // Delete user roles first
      const { error: roleError } = await supabase
        .from("user_roles")
        .delete()
        .eq("user_id", userToDelete);

      if (roleError) {
        console.error("handleDeleteUser: Error deleting role:", roleError);
      }

      // Delete profile
      const { error: profileError } = await supabase
        .from("profiles")
        .delete()
        .eq("id", userToDelete);

      if (profileError) {
        console.error(
          "handleDeleteUser: Error deleting profile:",
          profileError
        );
        toast({
          title: "Gagal",
          description: profileError.message,
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Berhasil",
        description: "Data pengguna berhasil dihapus dari database",
      });
      fetchUsers();
      fetchStats();
    } catch (err) {
      console.error("handleDeleteUser: Error:", err);
      toast({
        title: "Gagal",
        description: "Terjadi kesalahan",
        variant: "destructive",
      });
    } finally {
      setDeleteUserDialogOpen(false);
      setUserToDelete(null);
    }
  };

  const handleDownloadStats = () => {
    const doc = new jsPDF();
    doc.setFontSize(18);
    doc.setFont("helvetica", "bold");
    doc.text("LAPORAN STATISTIK WBS KPPU", 105, 15, { align: "center" });
    doc.line(20, 20, 190, 20);
    doc.setFontSize(14);
    doc.text("STATISTIK KESELURUHAN", 20, 30);
    doc.setFontSize(11);
    doc.text(`Total Pengguna: ${stats.totalUsers}`, 25, 38);
    doc.text(`Total Pengaduan: ${stats.totalReports}`, 25, 45);
    doc.text(`Pengaduan Pending: ${stats.pendingReports}`, 25, 52);
    doc.text(`Pengaduan Selesai: ${stats.completedReports}`, 25, 59);
    doc.save(`statistik_wbs_${new Date().toISOString().split("T")[0]}.pdf`);
    toast({ title: "Berhasil", description: "Statistik berhasil didownload" });
  };

  const filteredReports = reports.filter((r) => {
    const matchesSearch =
      r.ticket_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.reported_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.unit_work.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = filterStatus === "all" || r.status === filterStatus;
    const matchesCategory =
      filterCategory === "all" || r.category === filterCategory;
    const matchesDateFrom =
      !filterDateFrom || new Date(r.created_at) >= new Date(filterDateFrom);
    const matchesDateTo =
      !filterDateTo ||
      new Date(r.created_at) <= new Date(filterDateTo + "T23:59:59");
    return (
      matchesSearch &&
      matchesStatus &&
      matchesCategory &&
      matchesDateFrom &&
      matchesDateTo
    );
  });

  const clearFilters = () => {
    setSearchQuery("");
    setFilterStatus("all");
    setFilterCategory("all");
    setFilterDateFrom("");
    setFilterDateTo("");
  };

  const getStatusBadge = (status: string) => {
    const s = statusOptions.find((o) => o.value === status);
    return s ? (
      <span
        className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold text-white ${s.color}`}
      >
        {s.label}
      </span>
    ) : null;
  };

  return (
    <div className="min-h-screen bg-slate-100">
      <AdminSidebar
        activeSection={activeSection}
        onSectionChange={setActiveSection}
      />
      <main className="md:ml-64 p-4 md:p-6 transition-all">
        {/* Header */}
        <div className="bg-white rounded-xl shadow-sm p-4 mb-6 flex items-center justify-between">
          <div>
            <h1 className="font-heading font-bold text-xl text-navy">
              {activeSection === "dashboard" && "Dashboard Admin"}
              {activeSection === "reports" && "Semua Laporan"}
              {activeSection === "users" && "Kelola Pengguna"}
              {activeSection === "stats" && "Statistik"}
            </h1>
            <p className="text-sm text-muted-foreground">
              {activeSection === "dashboard" && "Ringkasan keseluruhan sistem"}
              {activeSection === "reports" && "Kelola semua pengaduan"}
              {activeSection === "users" && "Kelola data pengguna"}
              {activeSection === "stats" && "Analisis data laporan"}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="relative">
              <Button
                variant="outline"
                size="icon"
                className="relative"
                onClick={() => setShowNotifications(!showNotifications)}
              >
                <Bell size={20} />
                {notifications.some((n) => !n.read) && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                    {notifications.filter((n) => !n.read).length}
                  </span>
                )}
              </Button>
              {showNotifications && (
                <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-lg border border-border z-50">
                  <div className="p-3 border-b border-border flex items-center justify-between">
                    <span className="font-semibold">Notifikasi</span>
                    <button
                      onClick={clearNotifications}
                      className="text-xs text-primary hover:underline"
                    >
                      Tandai semua dibaca
                    </button>
                  </div>
                  <div className="max-h-64 overflow-y-auto">
                    {notifications.length === 0 ? (
                      <p className="p-4 text-sm text-muted-foreground text-center">
                        Tidak ada notifikasi
                      </p>
                    ) : (
                      notifications.map((notif) => (
                        <div
                          key={notif.id}
                          className={`p-3 border-b border-border hover:bg-muted/50 cursor-pointer ${
                            !notif.read ? "bg-blue-50" : ""
                          }`}
                          onClick={() => markNotificationRead(notif.id)}
                        >
                          <p className="text-sm">{notif.message}</p>
                          <p className="text-xs text-muted-foreground mt-1">
                            {new Date(notif.created_at).toLocaleDateString(
                              "id-ID"
                            )}
                          </p>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>
            <Button variant="outline" onClick={handleRefresh} className="gap-2">
              <RefreshCw size={18} /> Refresh
            </Button>
          </div>
        </div>

        {/* Dashboard Section */}
        {activeSection === "dashboard" && (
          <>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Total Pengguna
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-muted-foreground" />
                    <span className="text-2xl font-bold">
                      {stats.totalUsers}
                    </span>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Total Pengaduan
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4 text-muted-foreground" />
                    <span className="text-2xl font-bold">
                      {stats.totalReports}
                    </span>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Pending
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-yellow-500" />
                    <span className="text-2xl font-bold">
                      {stats.pendingReports}
                    </span>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Selesai
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    <span className="text-2xl font-bold">
                      {stats.completedReports}
                    </span>
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="mb-6 space-y-4">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <BarChart3 className="w-5 h-5 text-primary" />
                  <h2 className="font-heading font-bold text-lg">
                    Statistik Laporan
                  </h2>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleDownloadStats}
                  className="gap-2"
                >
                  <Download size={16} /> Download PDF
                </Button>
              </div>

              <div className="flex flex-col md:flex-row gap-3 mb-4 p-4 bg-muted/30 rounded-lg">
                <select
                  value={filterCategory}
                  onChange={(e) => setFilterCategory(e.target.value)}
                  className="h-9 rounded-md border border-input bg-background px-3 py-1 text-sm"
                >
                  <option value="all">Semua Kategori</option>
                  {categories.map((c) => (
                    <option key={c.value} value={c.value}>
                      {c.label}
                    </option>
                  ))}
                </select>
                <div className="flex gap-2 items-center">
                  <span className="text-sm text-muted-foreground">Dari:</span>
                  <Input
                    type="date"
                    value={filterDateFrom}
                    onChange={(e) => setFilterDateFrom(e.target.value)}
                    className="h-9 w-full md:w-36"
                  />
                </div>
                <div className="flex gap-2 items-center">
                  <span className="text-sm text-muted-foreground">Sampai:</span>
                  <Input
                    type="date"
                    value={filterDateTo}
                    onChange={(e) => setFilterDateTo(e.target.value)}
                    className="h-9 w-full md:w-36"
                  />
                </div>
                <Button variant="outline" size="sm" onClick={clearFilters}>
                  Reset
                </Button>
              </div>

              <div className="grid grid-cols-3 gap-4">
                {periodStats.map((stat, i) => (
                  <Card key={i}>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium text-muted-foreground">
                        {stat.period}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-end justify-between">
                        <span className="text-2xl font-bold">{stat.count}</span>
                        <span className="text-sm text-muted-foreground">
                          ({stat.percentage}%)
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* Category/Status Statistics with Pie Chart */}
              {categoryStats.length > 0 && (
                <Card>
                  <CardHeader className="pb-3">
                    <div className="flex items-center gap-2">
                      <TrendingUp className="w-4 h-4 text-primary" />
                      <CardTitle className="text-sm font-medium">
                        Kategori / Status
                      </CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* Pie Chart */}
                      <div className="flex flex-col items-center">
                        <div
                          className="relative w-40 h-40 rounded-full"
                          style={{
                            background: `conic-gradient(${categoryStats
                              .slice(0, 6)
                              .map((stat, i) => {
                                const colors = [
                                  "#3B82F6",
                                  "#EF4444",
                                  "#F59E0B",
                                  "#10B981",
                                  "#8B5CF6",
                                  "#EC4899",
                                ];
                                const start = categoryStats
                                  .slice(0, i)
                                  .reduce((acc, s) => acc + s.percentage, 0);
                                return `${
                                  colors[i % colors.length]
                                } ${start}% ${start + stat.percentage}%`;
                              })
                              .join(", ")})`,
                          }}
                        >
                          <div className="absolute inset-8 bg-white rounded-full flex items-center justify-center">
                            <div className="text-center">
                              <span className="text-2xl font-bold">
                                {stats.totalReports}
                              </span>
                              <p className="text-xs text-muted-foreground">
                                Total
                              </p>
                            </div>
                          </div>
                        </div>
                        {/* Legend */}
                        <div className="mt-4 grid grid-cols-2 gap-2 text-xs">
                          {categoryStats.slice(0, 6).map((stat, i) => {
                            const colors = [
                              "bg-blue-500",
                              "bg-red-500",
                              "bg-yellow-500",
                              "bg-green-500",
                              "bg-purple-500",
                              "bg-pink-500",
                            ];
                            return (
                              <div
                                key={stat.category}
                                className="flex items-center gap-1"
                              >
                                <span
                                  className={`w-2 h-2 rounded-full ${
                                    colors[i % colors.length]
                                  }`}
                                ></span>
                                <span className="truncate">
                                  {stat.category}
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      {/* Bar Chart */}
                      <div className="space-y-3">
                        {categoryStats.slice(0, 6).map((stat, i) => {
                          const colors = [
                            "bg-blue-500",
                            "bg-red-500",
                            "bg-yellow-500",
                            "bg-green-500",
                            "bg-purple-500",
                            "bg-pink-500",
                          ];
                          return (
                            <div key={stat.category} className="space-y-1">
                              <div className="flex items-center justify-between text-sm">
                                <span className="font-medium truncate max-w-[120px]">
                                  {stat.category}
                                </span>
                                <div className="flex items-center gap-2">
                                  <span className="text-muted-foreground">
                                    {stat.count}
                                  </span>
                                  <span className="font-semibold text-primary">
                                    {stat.percentage}%
                                  </span>
                                </div>
                              </div>
                              <div className="w-full bg-muted rounded-full h-2">
                                <div
                                  className={`h-2 rounded-full ${
                                    colors[i % colors.length]
                                  }`}
                                  style={{ width: `${stat.percentage}%` }}
                                />
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {categoryStats.length === 0 && (
                <Card>
                  <CardContent className="py-8 text-center text-muted-foreground">
                    <BarChart3 className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>Belum ada data statistik</p>
                  </CardContent>
                </Card>
              )}
            </div>
          </>
        )}

        {/* Reports Section */}
        {activeSection === "reports" && (
          <>
            <div className="mb-4 space-y-3">
              <div className="flex flex-col md:flex-row gap-3">
                <Input
                  placeholder="Cari..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full md:flex-1"
                />
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
                >
                  <option value="all">Semua Status</option>
                  {statusOptions.map((s) => (
                    <option key={s.value} value={s.value}>
                      {s.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="glass-card overflow-hidden">
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border bg-muted/50">
                      <th className="text-left py-3 px-4 font-semibold">
                        Tiket
                      </th>
                      <th className="text-left py-3 px-4 font-semibold">
                        Terlapor
                      </th>
                      <th className="text-left py-3 px-4 font-semibold">
                        Kategori
                      </th>
                      <th className="text-left py-3 px-4 font-semibold">
                        Status
                      </th>
                      <th className="text-left py-3 px-4 font-semibold">
                        Tanggal
                      </th>
                      <th className="text-left py-3 px-4 font-semibold">
                        Aksi
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredReports.map((report) => (
                      <tr
                        key={report.id}
                        className="border-b border-border/50 hover:bg-muted/30"
                      >
                        <td className="py-3 px-4 font-mono text-xs">
                          {report.ticket_number}
                        </td>
                        <td className="py-3 px-4 font-medium">
                          {report.reported_name}
                        </td>
                        <td className="py-3 px-4">
                          {report.category
                            ? getCategoryLabel(report.category)
                            : "-"}
                        </td>
                        <td className="py-3 px-4">
                          {getStatusBadge(report.status)}
                        </td>
                        <td className="py-3 px-4 text-muted-foreground text-xs">
                          {new Date(report.created_at).toLocaleDateString(
                            "id-ID"
                          )}
                        </td>
                        <td className="py-3 px-4">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => openReport(report)}
                          >
                            Kelola
                          </Button>
                        </td>
                      </tr>
                    ))}
                    {filteredReports.length === 0 && (
                      <tr>
                        <td
                          colSpan={6}
                          className="py-8 text-center text-muted-foreground"
                        >
                          Tidak ada pengaduan ditemukan.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}

        {/* Users Section */}
        {activeSection === "users" && (
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Daftar Pengguna</CardTitle>
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">
                  {users.length} pengguna
                </span>
                <Button
                  size="sm"
                  onClick={() => setShowCreateUserDialog(true)}
                  className="gap-1"
                >
                  <Plus size={16} /> Tambah
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="mb-4">
                <Input
                  placeholder="Cari pengguna..."
                  value={userFilter}
                  onChange={(e) => setUserFilter(e.target.value)}
                  className="w-full md:max-w-sm"
                />
              </div>
              {users.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">
                  Belum ada pengguna
                </p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border">
                        <th className="text-left py-3 px-4 font-semibold">
                          Nama
                        </th>
                        <th className="text-left py-3 px-4 font-semibold">
                          Email
                        </th>
                        <th className="text-left py-3 px-4 font-semibold">
                          Role
                        </th>
                        <th className="text-left py-3 px-4 font-semibold">
                          Tanggal Daftar
                        </th>
                        <th className="text-left py-3 px-4 font-semibold">
                          Aksi
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {users
                        .filter(
                          (u) =>
                            !userFilter ||
                            u.name
                              ?.toLowerCase()
                              .includes(userFilter.toLowerCase()) ||
                            u.email
                              .toLowerCase()
                              .includes(userFilter.toLowerCase())
                        )
                        .map((userData) => (
                          <tr
                            key={userData.id}
                            className="border-b border-border/50 hover:bg-muted/30"
                          >
                            <td className="py-3 px-4 font-medium">
                              {userData.name || "Tanpa Nama"}
                            </td>
                            <td className="py-3 px-4 text-muted-foreground">
                              {userData.email}
                            </td>
                            <td className="py-3 px-4">
                              <span
                                className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${
                                  userData.role === "admin"
                                    ? "bg-purple-100 text-purple-800"
                                    : "bg-blue-100 text-blue-800"
                                }`}
                              >
                                {userData.role === "admin" ? "Admin" : "User"}
                              </span>
                            </td>
                            <td className="py-3 px-4 text-muted-foreground">
                              {new Date(userData.created_at).toLocaleDateString(
                                "id-ID"
                              )}
                            </td>
                            <td className="py-3 px-4">
                              <div className="flex gap-1">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  title="Lihat"
                                  onClick={() => handleViewUser(userData)}
                                >
                                  <Eye size={14} />
                                </Button>
                                {userData.role === "user" ? (
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="text-purple-500"
                                    title="Jadikan Admin"
                                    disabled={changingRole === userData.id}
                                    onClick={() =>
                                      handleChangeRole(userData.id, "admin")
                                    }
                                  >
                                    <Shield size={14} />
                                  </Button>
                                ) : (
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="text-yellow-500"
                                    title="Jadikan User"
                                    disabled={changingRole === userData.id}
                                    onClick={() =>
                                      handleChangeRole(userData.id, "user")
                                    }
                                  >
                                    <UserCheck size={14} />
                                  </Button>
                                )}
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="text-red-500 hover:text-red-600"
                                  title="Hapus"
                                  onClick={() => {
                                    setUserToDelete(userData.id);
                                    setDeleteUserDialogOpen(true);
                                  }}
                                >
                                  <UserX size={14} />
                                </Button>
                              </div>
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Stats Section */}
        {activeSection === "stats" && (
          <div className="mb-6 space-y-4">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-primary" />
                <h2 className="font-heading font-bold text-lg">
                  Statistik Laporan
                </h2>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowStatsFilters(!showStatsFilters)}
                  className="gap-2"
                >
                  <Filter size={16} /> Filter
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    fetchCategoryStats();
                    fetchStats();
                  }}
                  className="gap-2"
                >
                  <RefreshCw size={16} /> Refresh
                </Button>
              </div>
            </div>

            {/* Filter Panel - Toggleable */}
            {showStatsFilters && (
              <div className="flex flex-col md:flex-row gap-3 mb-4 p-4 bg-muted/30 rounded-lg">
                <select
                  value={statsFilterCategory}
                  onChange={(e) => setStatsFilterCategory(e.target.value)}
                  className="h-9 rounded-md border border-input bg-background px-3 py-1 text-sm"
                >
                  <option value="all">Semua Kategori</option>
                  {categories.map((c) => (
                    <option key={c.value} value={c.value}>
                      {c.label}
                    </option>
                  ))}
                </select>
                <div className="flex gap-2 items-center">
                  <span className="text-sm text-muted-foreground">Dari:</span>
                  <Input
                    type="date"
                    value={statsFilterDateFrom}
                    onChange={(e) => setStatsFilterDateFrom(e.target.value)}
                    className="h-9 w-full md:w-36"
                  />
                </div>
                <div className="flex gap-2 items-center">
                  <span className="text-sm text-muted-foreground">Sampai:</span>
                  <Input
                    type="date"
                    value={statsFilterDateTo}
                    onChange={(e) => setStatsFilterDateTo(e.target.value)}
                    className="h-9 w-full md:w-36"
                  />
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setStatsFilterCategory("all");
                    setStatsFilterDateFrom("");
                    setStatsFilterDateTo("");
                  }}
                >
                  Reset
                </Button>
              </div>
            )}

            {/* Overall Stats Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Total Pengguna
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-muted-foreground" />
                    <span className="text-2xl font-bold">
                      {stats.totalUsers}
                    </span>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Total Pengaduan
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4 text-muted-foreground" />
                    <span className="text-2xl font-bold">
                      {stats.totalReports}
                    </span>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Pending
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-yellow-500" />
                    <span className="text-2xl font-bold">
                      {stats.pendingReports}
                    </span>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Selesai
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    <span className="text-2xl font-bold">
                      {stats.completedReports}
                    </span>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Period Stats */}
            <div className="grid grid-cols-3 gap-4 mb-6">
              {periodStats.map((stat, i) => (
                <Card key={i}>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">
                      {stat.period}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-end justify-between">
                      <span className="text-2xl font-bold">{stat.count}</span>
                      <span className="text-sm text-muted-foreground">
                        ({stat.percentage}%)
                      </span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Category/Status Stats with Charts */}
            {categoryStats.length > 0 ? (
              <Card>
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-primary" />
                    <CardTitle className="text-sm font-medium">
                      Kategori / Status
                    </CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Pie Chart */}
                    <div className="flex flex-col items-center">
                      <div
                        className="relative w-40 h-40 rounded-full"
                        style={{
                          background: `conic-gradient(${categoryStats
                            .slice(0, 6)
                            .map((stat, i) => {
                              const colors = [
                                "#3B82F6",
                                "#EF4444",
                                "#F59E0B",
                                "#10B981",
                                "#8B5CF6",
                                "#EC4899",
                              ];
                              const start = categoryStats
                                .slice(0, i)
                                .reduce((acc, s) => acc + s.percentage, 0);
                              return `${colors[i % colors.length]} ${start}% ${
                                start + stat.percentage
                              }%`;
                            })
                            .join(", ")})`,
                        }}
                      >
                        <div className="absolute inset-8 bg-white rounded-full flex items-center justify-center">
                          <div className="text-center">
                            <span className="text-2xl font-bold">
                              {stats.totalReports}
                            </span>
                            <p className="text-xs text-muted-foreground">
                              Total
                            </p>
                          </div>
                        </div>
                      </div>
                      {/* Legend */}
                      <div className="mt-4 grid grid-cols-2 gap-2 text-xs">
                        {categoryStats.slice(0, 6).map((stat, i) => {
                          const colors = [
                            "bg-blue-500",
                            "bg-red-500",
                            "bg-yellow-500",
                            "bg-green-500",
                            "bg-purple-500",
                            "bg-pink-500",
                          ];
                          return (
                            <div
                              key={stat.category}
                              className="flex items-center gap-1"
                            >
                              <span
                                className={`w-2 h-2 rounded-full ${
                                  colors[i % colors.length]
                                }`}
                              ></span>
                              <span className="truncate">{stat.category}</span>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Bar Chart */}
                    <div className="space-y-3">
                      {categoryStats.slice(0, 6).map((stat, i) => {
                        const colors = [
                          "bg-blue-500",
                          "bg-red-500",
                          "bg-yellow-500",
                          "bg-green-500",
                          "bg-purple-500",
                          "bg-pink-500",
                        ];
                        return (
                          <div key={stat.category} className="space-y-1">
                            <div className="flex items-center justify-between text-sm">
                              <span className="font-medium truncate max-w-[120px]">
                                {stat.category}
                              </span>
                              <div className="flex items-center gap-2">
                                <span className="text-muted-foreground">
                                  {stat.count}
                                </span>
                                <span className="font-semibold text-primary">
                                  {stat.percentage}%
                                </span>
                              </div>
                            </div>
                            <div className="w-full bg-muted rounded-full h-2">
                              <div
                                className={`h-2 rounded-full ${
                                  colors[i % colors.length]
                                }`}
                                style={{ width: `${stat.percentage}%` }}
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardContent className="py-8 text-center text-muted-foreground">
                  <BarChart3 className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>Belum ada data statistik</p>
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </main>

      {/* Dialogs */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          {selectedReport && (
            <>
              <DialogHeader>
                <DialogTitle>
                  {selectedReport.ticket_number} -{" "}
                  {selectedReport.reported_name}
                </DialogTitle>
                <DialogDescription>
                  Ubah status pengaduan dan tambahkan catatan admin.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div className="p-2 rounded bg-muted/50">
                    <span className="font-bold text-xs">Lembaga</span>
                    <p className="text-xs">{selectedReport.institution_type}</p>
                  </div>
                  <div className="p-2 rounded bg-muted/50">
                    <span className="font-bold text-xs">Unit Kerja</span>
                    <p className="text-xs">{selectedReport.unit_work}</p>
                  </div>
                  <div className="p-2 rounded bg-muted/50">
                    <span className="font-bold text-xs">Jabatan</span>
                    <p className="text-xs">
                      {selectedReport.reported_position}
                    </p>
                  </div>
                  <div className="p-2 rounded bg-muted/50">
                    <span className="font-bold text-xs">Kategori</span>
                    <p className="text-xs">
                      {selectedReport.category
                        ? getCategoryLabel(selectedReport.category)
                        : "-"}
                    </p>
                  </div>
                </div>
                <div className="p-3 rounded bg-muted/50">
                  <span className="font-bold text-sm">Uraian Pengaduan</span>
                  <p className="text-sm whitespace-pre-wrap mt-1">
                    {selectedReport.report_description}
                  </p>
                </div>
                <div className="space-y-2">
                  <Label>Status Baru</Label>
                  <Select value={newStatus} onValueChange={setNewStatus}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {statusOptions.map((s) => (
                        <SelectItem key={s.value} value={s.value}>
                          {s.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Keterangan</Label>
                  <Textarea
                    value={newDescription}
                    onChange={(e) => setNewDescription(e.target.value)}
                    placeholder="Jelaskan..."
                    rows={2}
                  />
                </div>
                <Button
                  onClick={handleUpdateStatus}
                  disabled={updating}
                  className="w-full gap-2"
                >
                  <Send size={14} />{" "}
                  {updating ? "Memperbarui..." : "Perbarui Status"}
                </Button>
                <Button
                  variant="destructive"
                  className="w-full gap-2"
                  onClick={() => {
                    setReportToDelete(selectedReport.id);
                    setDeleteDialogOpen(true);
                  }}
                >
                  <Trash2 size={14} /> Hapus Pengaduan
                </Button>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus Pengaduan</AlertDialogTitle>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive"
            >
              Hapus
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog
        open={deleteUserDialogOpen}
        onOpenChange={setDeleteUserDialogOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus Pengguna</AlertDialogTitle>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteUser}
              className="bg-destructive"
            >
              Hapus
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Create User Dialog */}
      <Dialog
        open={showCreateUserDialog}
        onOpenChange={setShowCreateUserDialog}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Tambah Pengguna Baru</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Email</Label>
              <Input
                type="email"
                value={newUserEmail}
                onChange={(e) => setNewUserEmail(e.target.value)}
                placeholder="email@example.com"
              />
            </div>
            <div>
              <Label>Nama</Label>
              <Input
                value={newUserName}
                onChange={(e) => setNewUserName(e.target.value)}
                placeholder="Nama lengkap"
              />
            </div>
            <div>
              <Label>Password</Label>
              <Input
                type="password"
                value={newUserPassword}
                onChange={(e) => setNewUserPassword(e.target.value)}
                placeholder="Password"
              />
            </div>
            <div>
              <Label>Role</Label>
              <select
                value={newUserRole}
                onChange={(e) =>
                  setNewUserRole(e.target.value as "user" | "admin")
                }
                className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
              >
                <option value="user">User</option>
                <option value="admin">Admin</option>
              </select>
            </div>
            {createUserError && (
              <p className="text-sm text-red-500">{createUserError}</p>
            )}
            <div className="flex gap-2 justify-end">
              <Button
                variant="outline"
                onClick={() => {
                  setShowCreateUserDialog(false);
                  setCreateUserError("");
                  setNewUserEmail("");
                  setNewUserName("");
                  setNewUserPassword("");
                  setNewUserRole("user");
                }}
              >
                Batal
              </Button>
              <Button
                onClick={async () => {
                  if (!newUserEmail || !newUserPassword || !newUserName) {
                    setCreateUserError("Semua field wajib diisi");
                    return;
                  }
                  setCreatingUser(true);
                  setCreateUserError("");
                  try {
                    const { data, error } =
                      await supabase.auth.admin.createUser({
                        email: newUserEmail,
                        password: newUserPassword,
                        email_confirm: true,
                      });
                    if (error) throw error;
                    if (data.user) {
                      await Promise.all([
                        supabase.from("profiles").insert({
                          user_id: data.user.id,
                          name: newUserName,
                        }),
                        supabase.from("user_roles").insert({
                          user_id: data.user.id,
                          role: newUserRole,
                        }),
                      ]);
                      toast({
                        title: "Berhasil",
                        description: "Pengguna berhasil dibuat",
                      });
                      fetchUsers();
                      fetchStats();
                      setShowCreateUserDialog(false);
                      setNewUserEmail("");
                      setNewUserName("");
                      setNewUserPassword("");
                      setNewUserRole("user");
                    }
                  } catch (error: any) {
                    setCreateUserError(
                      error.message || "Gagal membuat pengguna"
                    );
                  } finally {
                    setCreatingUser(false);
                  }
                }}
                disabled={creatingUser}
              >
                {creatingUser ? "Menyimpan..." : "Simpan"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={userDialogOpen} onOpenChange={setUserDialogOpen}>
        <DialogContent className="max-w-2xl">
          {selectedUser && (
            <>
              <DialogHeader>
                <DialogTitle>Detail Pengguna</DialogTitle>
              </DialogHeader>
              {isEditingUser ? (
                <div className="space-y-3">
                  <div>
                    <Label> Nama</Label>
                    <Input
                      value={editUserName}
                      onChange={(e) => setEditUserName(e.target.value)}
                    />
                  </div>
                  <div>
                    <Label>No. Telepon</Label>
                    <Input
                      value={editUserPhone}
                      onChange={(e) => setEditUserPhone(e.target.value)}
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button
                      onClick={handleSaveUser}
                      disabled={savingUser}
                      className="flex-1 gap-2"
                    >
                      <Check size={14} />
                      {savingUser ? "Menyimpan..." : "Simpan"}
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => setIsEditingUser(false)}
                      className="flex-1"
                    >
                      Batal
                    </Button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div className="p-3 rounded bg-muted/50">
                      <span className="font-bold text-xs">Nama</span>
                      <p className="mt-1">
                        {selectedUser.name || "Tanpa Nama"}
                      </p>
                    </div>
                    <div className="p-3 rounded bg-muted/50">
                      <span className="font-bold text-xs">Email</span>
                      <p className="mt-1">{selectedUser.email}</p>
                    </div>
                    <div className="p-3 rounded bg-muted/50">
                      <span className="font-bold text-xs">No. Telepon</span>
                      <p className="mt-1">{selectedUser.phone || "-"}</p>
                    </div>
                    <div className="p-3 rounded bg-muted/50">
                      <span className="font-bold text-xs">Tanggal Daftar</span>
                      <p className="mt-1">
                        {new Date(selectedUser.created_at).toLocaleDateString(
                          "id-ID"
                        )}
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    className="mt-3 gap-2"
                    onClick={() => handleStartEditUser(selectedUser)}
                  >
                    <Pencil size={14} />
                    Edit
                  </Button>
                  <div className="space-y-2 mt-4">
                    <Textarea
                      value={userMessage}
                      onChange={(e) => setUserMessage(e.target.value)}
                      placeholder="Tulis pesan..."
                      rows={2}
                    />
                    <Button
                      onClick={handleSendMessage}
                      disabled={sendingMessage || !userMessage.trim()}
                      className="w-full gap-2"
                    >
                      <Send size={14} />
                      {sendingMessage ? "Mengirim..." : "Kirim Pesan"}
                    </Button>
                  </div>
                </>
              )}
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminDashboard;
