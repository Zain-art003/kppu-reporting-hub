import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Clock, Search, AlertCircle, CheckCircle, Download } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { jsPDF } from "jspdf";

type Report = {
  id: string;
  user_id: string;
  ticket_number: string;
  institution_type: string;
  unit_work: string;
  reported_name: string;
  reported_position: string;
  incident_time: string;
  report_description: string;
  evidence_urls: string[];
  status: string;
  created_at: string;
};

type TimelineEntry = {
  id: string;
  status: string;
  description: string;
  created_at: string;
};

const statusConfig: Record<string, { label: string; icon: typeof Clock; color: string }> = {
  submitted: { label: "Diterima", icon: Clock, color: "border-blue-500 bg-blue-500" },
  in_review: { label: "Sedang Ditelaah", icon: Search, color: "border-yellow-500 bg-yellow-500" },
  in_progress: { label: "Dalam Proses", icon: AlertCircle, color: "border-orange-500 bg-orange-500" },
  completed: { label: "Selesai", icon: CheckCircle, color: "border-green-500 bg-green-500" },
  rejected: { label: "Ditolak", icon: AlertCircle, color: "border-red-500 bg-red-500" },
};

const ReportDetail = () => {
  const { id } = useParams();
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [report, setReport] = useState<Report | null>(null);
  const [timeline, setTimeline] = useState<TimelineEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Redirect ke login jika belum login
    if (!authLoading && !user) {
      navigate("/login");
      return;
    }
    // Fetch data jika sudah login dan ada id
    if (user && id) {
      fetchData();
    }
  }, [user, authLoading, id]);

  // Jika tidak ada user (sudah logout), jangan render
  if (!user && !authLoading) {
    return null;
  }

  const fetchData = async () => {
    if (!user || !id) return;
    
    const { data: reportData, error: reportError } = await supabase
      .from("reports")
      .select("*")
      .eq("id", id)
      .single();

    if (reportError || !reportData) {
      setReport(null);
      setLoading(false);
      return;
    }

    // Check if user owns this report or is admin
    const { data: roleData } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .eq("role", "admin")
      .maybeSingle();

    const isAdmin = !!roleData;
    
    // If not admin and not owner, deny access
    if (!isAdmin && reportData.user_id !== user.id) {
      setReport(null);
      setLoading(false);
      return;
    }

    const { data: timelineData } = await supabase
      .from("report_timeline")
      .select("*")
      .eq("report_id", id)
      .order("created_at", { ascending: true });

    setReport(reportData as Report);
    setTimeline((timelineData as TimelineEntry[]) || []);
    setLoading(false);
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <p className="text-muted-foreground">Memuat...</p>
      </div>
    );
  }

  if (!report) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Navbar />
        <main className="flex-1 flex items-center justify-center">
          <p className="text-muted-foreground">Pengaduan tidak ditemukan.</p>
        </main>
        <Footer />
      </div>
    );
  }

  const currentStatus = statusConfig[report.status] || statusConfig.submitted;

  // Download report as PDF
  const handleDownload = () => {
    const doc = new jsPDF();
    
    // Title
    doc.setFontSize(18);
    doc.setFont("helvetica", "bold");
    doc.text("LAPORAN PENGADUAN WBS KPPU", 105, 20, { align: "center" });
    
    doc.setLineWidth(0.5);
    doc.line(20, 25, 190, 25);
    
    // Ticket & Status
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.text("Nomor Tiket:", 20, 35);
    doc.setFont("helvetica", "normal");
    doc.text(report.ticket_number, 60, 35);
    
    doc.setFont("helvetica", "bold");
    doc.text("Status:", 20, 42);
    doc.setFont("helvetica", "normal");
    doc.text(currentStatus.label, 60, 42);
    
    // Information Terlapor
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text("Informasi Terlapor", 20, 55);
    
    doc.setFontSize(11);
    doc.setFont("helvetica", "normal");
    doc.text("Nama:", 25, 63);
    doc.text(report.reported_name, 60, 63);
    
    doc.text("Jabatan:", 25, 70);
    doc.text(report.reported_position, 60, 70);
    
    doc.text("Lembaga:", 25, 77);
    doc.text(report.institution_type, 60, 77);
    
    doc.text("Unit Kerja:", 25, 84);
    doc.text(report.unit_work, 60, 84);
    
    // Waktu & Tempat
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text("Waktu & Tempat Kejadian", 20, 97);
    
    doc.setFontSize(11);
    doc.setFont("helvetica", "normal");
    doc.text("Waktu:", 25, 105);
    doc.text(new Date(report.incident_time).toLocaleString("id-ID"), 60, 105);
    
    doc.text("Dibuat:", 25, 112);
    doc.text(new Date(report.created_at).toLocaleString("id-ID"), 60, 112);
    
    // Uraian Pengaduan
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text("Uraian Pengaduan", 20, 125);
    
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    const splitDescription = doc.splitTextToSize(report.report_description, 170);
    doc.text(splitDescription, 25, 133);
    
    // Footer
    doc.setFontSize(8);
    doc.text(`Dokumen ini digenerate dari WBS KPPU System - ${new Date().toLocaleString("id-ID")}`, 105, 285, { align: "center" });
    
    // Save
    doc.save(`laporan_${report.ticket_number}.pdf`);
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      <main className="flex-1 py-4 md:py-6 px-3 md:px-4">
        <div className="container mx-auto max-w-5xl">
          <Button variant="ghost" onClick={() => navigate("/dashboard")} className="mb-4 gap-2 text-muted-foreground hover:text-foreground">
            <ArrowLeft size={16} /> Kembali
          </Button>

          {/* Report Info */}
          <div className="glass-card p-4 md:p-6 mb-6">
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 mb-4">
              <div className="flex-1 min-w-0">
                <span className="text-xs font-mono text-muted-foreground">{report.ticket_number}</span>
                <h1 className="font-heading font-bold text-lg md:text-xl text-foreground mt-1">{report.reported_name}</h1>
                <p className="text-sm text-muted-foreground mt-1">
                  {report.institution_type} - {report.unit_work}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Dibuat {new Date(report.created_at).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })}
                </p>
              </div>
              <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold text-primary-foreground self-start ${currentStatus.color.split(" ")[1]}`}>
                <currentStatus.icon size={12} /> {currentStatus.label}
              </span>
              <Button variant="outline" size="sm" onClick={handleDownload} className="gap-2">
                <Download size={14} /> Download
              </Button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4 text-sm">
              <div className="p-3 rounded-lg bg-muted/50">
                <span className="font-bold text-primary block mb-1">Lembaga Terlapor</span>
                <p className="text-foreground/80">{report.institution_type}</p>
              </div>
              <div className="p-3 rounded-lg bg-muted/50">
                <span className="font-bold text-primary block mb-1">Unit Kerja</span>
                <p className="text-foreground/80">{report.unit_work}</p>
              </div>
              <div className="p-3 rounded-lg bg-muted/50">
                <span className="font-bold text-primary block mb-1">Jabatan</span>
                <p className="text-foreground/80">{report.reported_position}</p>
              </div>
              <div className="p-3 rounded-lg bg-muted/50">
                <span className="font-bold text-primary block mb-1">Waktu Kejadian</span>
                <p className="text-foreground/80">{new Date(report.incident_time).toLocaleString("id-ID")}</p>
              </div>
            </div>
            <div className="mt-3 md:mt-4 p-3 rounded-lg bg-muted/50 text-sm">
              <span className="font-bold text-primary block mb-1">Uraian Pengaduan</span>
              <p className="text-foreground/80 whitespace-pre-wrap">{report.report_description}</p>
            </div>
          </div>

          {/* Timeline */}
          <div className="glass-card p-4 md:p-6">
            <h2 className="font-heading font-bold text-lg text-foreground mb-4 md:mb-6">Progres Pengaduan</h2>
            <div className="relative">
              {/* Vertical line */}
              <div className="absolute left-[15px] top-0 bottom-0 w-0.5 bg-border" />

              <div className="space-y-4 md:space-y-6">
                {timeline.map((entry, i) => {
                  const sc = statusConfig[entry.status] || statusConfig.submitted;
                  const Icon = sc.icon;
                  const isLast = i === timeline.length - 1;

                  return (
                    <div key={entry.id} className="relative flex gap-3 md:gap-4">
                      <div className={`relative z-10 w-7 h-7 md:w-8 md:h-8 rounded-full flex items-center justify-center shrink-0 ${isLast ? sc.color.split(" ")[1] : "bg-muted"}`}>
                        <Icon className={`w-3 h-3 md:w-[14px] md:h-[14px] ${isLast ? "text-primary-foreground" : "text-muted-foreground"}`} />
                      </div>
                      <div className={`flex-1 pb-2 ${isLast ? "" : "opacity-80"}`}>
                        <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2 mb-1">
                          <span className="font-semibold text-sm text-foreground">{sc.label}</span>
                          <span className="text-xs text-muted-foreground">
                            {new Date(entry.created_at).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" })}
                            {" "}
                            {new Date(entry.created_at).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })}
                          </span>
                        </div>
                        <p className="text-sm text-foreground/75">{entry.description}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default ReportDetail;
