import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Search, FileText, Clock, CheckCircle, AlertCircle, ArrowRight } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";

type Report = {
  id: string;
  ticket_number: string;
  institution_type: string;
  unit_work: string;
  reported_name: string;
  reported_position: string;
  incident_time: string;
  status: string;
  category: string | null;
  created_at: string;
};

type TimelineEntry = {
  id: string;
  status: string;
  description: string;
  created_at: string;
};

const statusConfig: Record<string, { label: string; icon: typeof Clock; color: string; bg: string; text: string }> = {
  submitted: { label: "Diterima", icon: Clock, color: "bg-blue-500", bg: "bg-blue-100", text: "text-blue-700" },
  in_review: { label: "Sedang Ditelaah", icon: Search, color: "bg-yellow-500", bg: "bg-yellow-100", text: "text-yellow-700" },
  in_progress: { label: "Dalam Proses", icon: AlertCircle, color: "bg-orange-500", bg: "bg-orange-100", text: "text-orange-700" },
  completed: { label: "Selesai", icon: CheckCircle, color: "bg-green-500", bg: "bg-green-100", text: "text-green-700" },
  rejected: { label: "Ditolak", icon: AlertCircle, color: "bg-red-500", bg: "bg-red-100", text: "text-red-700" },
};

const Track = () => {
  const navigate = useNavigate();
  const [ticketNumber, setTicketNumber] = useState("");
  const [loading, setLoading] = useState(false);
  const [report, setReport] = useState<Report | null>(null);
  const [timeline, setTimeline] = useState<TimelineEntry[]>([]);
  const [error, setError] = useState("");

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ticketNumber.trim()) return;

    setLoading(true);
    setError("");
    setReport(null);
    setTimeline([]);

    // Search by ticket number (case-insensitive exact match first)
    let { data: reportData, error: reportError } = await supabase
      .from("reports")
      .select("*")
      .eq("ticket_number", ticketNumber.trim().toUpperCase());
     
    // If not found, try case-insensitive search
    if (!reportData || reportData.length === 0) {
      const { data: altData } = await supabase
        .from("reports")
        .select("*")
        .ilike("ticket_number", `%${ticketNumber.trim()}%`)
        .limit(1);
       
      if (altData && altData.length > 0) {
        reportData = altData;
      }
    }

    // Handle array result
    const foundReport = Array.isArray(reportData) ? reportData[0] : reportData;

    setLoading(false);

    if (reportError || !foundReport) {
      setError("Laporan dengan nomor tiket tersebut tidak ditemukan. Pastikan nomor tikettersedia.");
      return;
    }

    setReport(foundReport);

    // Fetch timeline
    const { data: timelineData } = await supabase
      .from("report_timeline")
      .select("*")
      .eq("report_id", foundReport.id)
      .order("created_at", { ascending: true });

    setTimeline((timelineData as TimelineEntry[]) || []);
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      <main className="flex-1 py-8 md:py-12 px-3 md:px-4">
        <div className="container mx-auto max-w-3xl">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="font-heading font-bold text-2xl md:text-3xl text-foreground mb-2">
              Lacak Pengaduan Anda
            </h1>
            <p className="text-muted-foreground">
              Masukkan nomor tiket untuk melihat status pengaduan Anda
            </p>
          </div>

          {/* Search Form */}
          <div className="glass-card p-6 md:p-8 mb-8">
            <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-3">
              <Input
                type="text"
                value={ticketNumber}
                onChange={(e) => setTicketNumber(e.target.value)}
                placeholder="Masukkan nomor tikettersedia (contoh: WBS-XXXXX)"
                className="flex-1 h-12 text-base"
              />
              <Button 
                type="submit" 
                className="h-12 px-6 bg-primary hover:bg-accent gap-2"
                disabled={loading}
              >
                {loading ? "Mencari..." : (
                  <>
                    <Search size={18} /> Lacak
                  </>
                )}
              </Button>
            </form>
            {error && (
              <p className="text-red-500 text-sm mt-3 text-center">{error}</p>
            )}
          </div>

          {/* Results */}
          {report && (
            <div className="glass-card p-6 md:p-8">
              {/* Status Badge */}
              <div className="flex items-center justify-center mb-6">
                {(() => {
                  const sc = statusConfig[report.status] || statusConfig.submitted;
                  return (
                    <div className={`flex items-center gap-2 px-4 py-2 rounded-full ${sc.bg} ${sc.text}`}>
                      <sc.icon size={18} />
                      <span className="font-semibold">{sc.label}</span>
                    </div>
                  );
                })()}
              </div>

              {/* Report Info */}
              <div className="mb-6">
                <div className="text-center mb-4">
                  <span className="text-xs font-mono text-muted-foreground">Nomor Tiket</span>
                  <h2 className="font-heading font-bold text-xl md:text-2xl text-foreground">
                    {report.ticket_number}
                  </h2>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                  <div className="p-3 rounded-lg bg-muted/50">
                    <span className="font-bold text-primary block mb-1">Lembaga Terlapor</span>
                    <p className="text-foreground/80">{report.institution_type}</p>
                  </div>
                  <div className="p-3 rounded-lg bg-muted/50">
                    <span className="font-bold text-primary block mb-1">Unit Kerja</span>
                    <p className="text-foreground/80">{report.unit_work}</p>
                  </div>
                  <div className="p-3 rounded-lg bg-muted/50">
                    <span className="font-bold text-primary block mb-1">Nama Terlapor</span>
                    <p className="text-foreground/80">{report.reported_name}</p>
                  </div>
                  <div className="p-3 rounded-lg bg-muted/50">
                    <span className="font-bold text-primary block mb-1">Waktu Kejadian</span>
                    <p className="text-foreground/80">
                      {new Date(report.incident_time).toLocaleDateString("id-ID", {
                        day: "numeric",
                        month: "long",
                        year: "numeric",
                      })}
                    </p>
                  </div>
                </div>
              </div>

              {/* Timeline */}
              <div>
                <h3 className="font-heading font-bold text-lg text-foreground mb-4">
                  Riwayat Perkembangan
                </h3>
                
                {timeline.length === 0 ? (
                  <p className="text-muted-foreground text-sm text-center py-4">
                    Belum ada perkembangan laporan.
                  </p>
                ) : (
                  <div className="relative">
                    {/* Vertical line */}
                    <div className="absolute left-[15px] top-0 bottom-0 w-0.5 bg-border" />

                    <div className="space-y-4">
                      {timeline.map((entry, i) => {
                        const sc = statusConfig[entry.status] || statusConfig.submitted;
                        const Icon = sc.icon;
                        const isLast = i === timeline.length - 1;

                        return (
                          <div key={entry.id} className="relative flex gap-3 md:gap-4">
                            <div className={`relative z-10 w-7 h-7 md:w-8 md:h-8 rounded-full flex items-center justify-center shrink-0 ${isLast ? sc.color : "bg-muted"}`}>
                              <Icon className={`w-3 h-3 md:w-[14px] md:h-[14px] ${isLast ? "text-white" : "text-muted-foreground"}`} />
                            </div>
                            <div className={`flex-1 pb-2 ${isLast ? "" : "opacity-80"}`}>
                              <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2 mb-1">
                                <span className="font-semibold text-sm text-foreground">{sc.label}</span>
                                <span className="text-xs text-muted-foreground">
                                  {new Date(entry.created_at).toLocaleDateString("id-ID", {
                                    day: "numeric",
                                    month: "short",
                                    year: "numeric",
                                  })}
                                  {" "}
                                  {new Date(entry.created_at).toLocaleTimeString("id-ID", {
                                    hour: "2-digit",
                                    minute: "2-digit",
                                  })}
                                </span>
                              </div>
                              {entry.description && (
                                <p className="text-sm text-foreground/75">{entry.description}</p>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>

              {/* Note */}
              <div className="mt-6 p-4 rounded-lg bg-yellow-50 border border-yellow-200">
                <p className="text-yellow-800 text-sm text-center">
                  <strong>Catatan:</strong> Hubungi kami jika Anda memiliki pertanyaan lebih lanjut tentang pengaduan ini.
                </p>
              </div>
            </div>
          )}

          {/* Info Card */}
          {!report && !error && !loading && (
            <div className="glass-card p-6 md:p-8 text-center">
              <FileText className="mx-auto text-muted-foreground mb-4 w-12 h-12" />
              <h3 className="font-heading font-bold text-lg text-foreground mb-2">
                Cara Melacak Pengaduan
              </h3>
              <ul className="text-muted-foreground text-sm text-left space-y-2 max-w-md mx-auto">
                <li className="flex items-start gap-2">
                  <ArrowRight size={16} className="mt-0.5 shrink-0" />
                  <span>Masukkan nomor tiket yang Anda terima saat membuat pengaduan</span>
                </li>
                <li className="flex items-start gap-2">
                  <ArrowRight size={16} className="mt-0.5 shrink-0" />
                  <span>Klik tombol "Lacak" untuk melihat status pengaduan</span>
                </li>
                <li className="flex items-start gap-2">
                  <ArrowRight size={16} className="mt-0.5 shrink-0" />
                  <span>Anda dapat melihat perkembangan dan riwayat pengaduan</span>
                </li>
              </ul>
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Track;