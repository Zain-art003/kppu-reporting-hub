import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Plus, FileText, Clock, CheckCircle, AlertCircle, Search, Bell, X } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";

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
  category: string | null;
  created_at: string;
};

type Notification = {
  id: string;
  title: string;
  message: string;
  type: string | null;
  report_id: string | null;
  is_read: boolean;
  created_at: string;
};

const statusConfig: Record<string, { label: string; icon: typeof Clock; className: string }> = {
  submitted: { label: "Diterima", icon: Clock, className: "bg-blue-100 text-blue-700" },
  in_review: { label: "Sedang Ditelaah", icon: Search, className: "bg-yellow-100 text-yellow-700" },
  in_progress: { label: "Dalam Proses", icon: AlertCircle, className: "bg-orange-100 text-orange-700" },
  completed: { label: "Selesai", icon: CheckCircle, className: "bg-green-100 text-green-700" },
  rejected: { label: "Ditolak", icon: AlertCircle, className: "bg-red-100 text-red-700" },
};

const Dashboard = () => {
  const { user, isAdmin, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);

  useEffect(() => {
    // Just redirect to login if not authenticated
    if (!authLoading && !user) {
      navigate("/login");
      return;
    }
    
    // Don't redirect admins - let them stay on user dashboard if they want
    // The admin panel is accessed via /admin route, not by redirecting from here
    
    if (user) {
      fetchReports();
      fetchNotifications();
    }
  }, [user, authLoading]);

  const fetchReports = async () => {
    if (!user) return;
    
    const { data } = await supabase
      .from("reports")
      .select("id, ticket_number, institution_type, unit_work, reported_name, reported_position, incident_time, status, category, created_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    setReports((data as Report[]) || []);
    setLoading(false);
  };

  const fetchNotifications = async () => {
    if (!user) return;
    
    const { data } = await supabase
      .from("user_notifications")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(10);

    setNotifications((data as Notification[]) || []);
  };

  const markAsRead = async (id: string) => {
    await supabase
      .from("user_notifications")
      .update({ is_read: true })
      .eq("id", id);
    
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
  };

  const markAllAsRead = async () => {
    if (!user) return;
    
    await supabase
      .from("user_notifications")
      .update({ is_read: true })
      .eq("user_id", user.id);
    
    setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
  };

  const unreadCount = notifications.filter(n => !n.is_read).length;

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <p className="text-muted-foreground">Memuat...</p>
      </div>
    );
  }

  // Admin users can also see the user dashboard - they can access admin panel via navigation
  // No need to hide anything

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      <main className="flex-1 py-4 md:py-6 px-3 md:px-4">
        <div className="container mx-auto max-w-5xl">
          {/* Header with Notification Bell */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <div>
              <h1 className="font-heading font-bold text-xl md:text-2xl text-foreground">Halaman Saya</h1>
              <p className="text-muted-foreground text-sm">Kelola dan pantau pengaduan Anda</p>
            </div>
            <div className="flex items-center gap-2">
              {/* Notification Bell */}
              <div className="relative">
                <Button
                  variant="outline"
                  size="icon"
                  className="relative"
                  onClick={() => setShowNotifications(!showNotifications)}
                >
                  <Bell size={18} />
                  {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                      {unreadCount}
                    </span>
                  )}
                </Button>
                
                {/* Notification Dropdown */}
                {showNotifications && (
                  <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-lg border border-border z-50 max-h-96 overflow-y-auto">
                    <div className="p-3 border-b border-border flex items-center justify-between sticky top-0 bg-white">
                      <span className="font-semibold">Notifikasi</span>
                      {unreadCount > 0 && (
                        <button onClick={markAllAsRead} className="text-xs text-primary hover:underline">
                          Tandai semua dibaca
                        </button>
                      )}
                    </div>
                    {notifications.length === 0 ? (
                      <p className="p-4 text-sm text-muted-foreground text-center">Tidak ada notifikasi</p>
                    ) : (
                      notifications.map(notif => (
                        <div
                          key={notif.id}
                          className={`p-3 border-b border-border last:border-0 hover:bg-muted/50 cursor-pointer ${!notif.is_read ? 'bg-blue-50' : ''}`}
                          onClick={() => {
                            if (!notif.is_read) markAsRead(notif.id);
                            if (notif.report_id) navigate(`/report/${notif.report_id}`);
                            setShowNotifications(false);
                          }}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <p className="text-sm font-medium">{notif.title}</p>
                            {!notif.is_read && <span className="w-2 h-2 bg-blue-500 rounded-full shrink-0 mt-1.5"></span>}
                          </div>
                          <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{notif.message}</p>
                          <p className="text-xs text-muted-foreground mt-1">
                            {new Date(notif.created_at).toLocaleString("id-ID")}
                          </p>
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>
              
              <Button onClick={() => navigate("/report/new")} className="bg-primary hover:bg-accent gap-2 w-full sm:w-auto">
                <Plus size={18} /> <span className="hidden sm:inline">Buat Pengaduan</span>
                <span className="sm:hidden">Baru</span>
              </Button>
            </div>
          </div>

          {reports.length === 0 ? (
            <div className="glass-card p-8 md:p-12 text-center">
              <FileText className="mx-auto text-muted-foreground mb-4 w-10 h-10 md:w-12 md:h-12" />
              <h2 className="font-heading font-bold text-lg text-foreground mb-2">Belum Ada Pengaduan</h2>
              <p className="text-muted-foreground mb-4 text-sm">Anda belum membuat pengaduan. Klik tombol di bawah untuk memulai.</p>
              <Button onClick={() => navigate("/report/new")} className="bg-primary hover:bg-accent gap-2 w-full sm:w-auto">
                <Plus size={18} /> Buat Pengaduan Baru
              </Button>
            </div>
          ) : (
            <div className="space-y-3 md:space-y-4">
              {reports.map((report) => {
                const sc = statusConfig[report.status] || statusConfig.submitted;
                const Icon = sc.icon;
                return (
                  <Link key={report.id} to={`/report/${report.id}`} className="block">
                    <div className="glass-card p-4 md:p-5 hover:border-primary/30 transition-colors">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex flex-wrap items-center gap-2 mb-1">
                            <span className="text-xs font-mono text-muted-foreground">{report.ticket_number}</span>
                            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold ${sc.className}`}>
                              <Icon size={12} /> {sc.label}
                            </span>
                          </div>
                          <h3 className="font-heading font-bold text-foreground truncate">{report.reported_name}</h3>
                          <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3 mt-1 text-xs text-muted-foreground">
                            <span className="truncate">{report.institution_type} - {report.unit_work}</span>
                            <span className="hidden sm:inline">•</span>
                            <span>{new Date(report.created_at).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Dashboard;
