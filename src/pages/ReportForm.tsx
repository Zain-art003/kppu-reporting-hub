import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { FileText, Upload, X } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";

const ReportForm = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [files, setFiles] = useState<File[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [captcha, setCaptcha] = useState("");
  const [captchaInput, setCaptchaInput] = useState("");
  const [captchaImage, setCaptchaImage] = useState("");
  const [form, setForm] = useState({
    // WHO - Siapa
    institution_type: "",
    unit_work: "",
    reported_name: "",
    reported_position: "",
    // WHEN - Kapan
    incident_time: "",
    // WHAT - Apa
    what_violation: "",
    // WHERE - Dimana
    incident_location: "",
    // WHY - Mengapa
    why_reason: "",
    // HOW - Bagaimana
    how_chronology: "",
    // Category
    category: "",
  });

  // Redirect ke login jika tidak ada user (sudah logout)
  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/login");
    }
  }, [user, authLoading, navigate]);

  // Tampilkan loading sementara проверка
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <p className="text-muted-foreground">Memuat...</p>
      </div>
    );
  }

  // Jika tidak ada user (sudah logout), jangan render form
  if (!user) {
    return null;
  }

  // Kategori laporan
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

  const update = (field: string, value: string) => setForm((prev) => ({ ...prev, [field]: value }));

  // Generate simple captcha
  const generateCaptcha = () => {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    let newCaptcha = "";
    for (let i = 0; i < 5; i++) {
      newCaptcha += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    // Create simple captcha image using canvas
    const canvas = document.createElement("canvas");
    canvas.width = 120;
    canvas.height = 40;
    const ctx = canvas.getContext("2d");
    if (ctx) {
      ctx.fillStyle = "#f0f0f0";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      // Add noise
      for (let i = 0; i < 100; i++) {
        ctx.fillStyle = `rgba(${Math.floor(Math.random() * 255)}, ${Math.floor(Math.random() * 255)}, ${Math.floor(Math.random() * 255)}, 0.5)`;
        ctx.fillRect(Math.random() * canvas.width, Math.random() * canvas.height, 2, 2);
      }
      
      // Draw text
      ctx.font = "24px Arial";
      ctx.fillStyle = "#333";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(newCaptcha, canvas.width / 2, canvas.height / 2);
      
      setCaptchaImage(canvas.toDataURL());
    }
    setCaptcha(newCaptcha);
  };

  // Initialize captcha saat component mount
  useEffect(() => {
    generateCaptcha();
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files).filter(
        (f) => f.type.startsWith("image/") || f.type.startsWith("application/pdf") || f.type.startsWith("application/zip")
      );
      setFiles((prev) => [...prev, ...newFiles]);
    }
  };

  const removeFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    // Validasi captcha
    if (captchaInput.toUpperCase() !== captcha) {
      toast({ title: "Captcha Salah", description: "Mohon masukkan captcha dengan benar", variant: "destructive" });
      generateCaptcha();
      setCaptchaInput("");
      return;
    }

    setLoading(true);

    // Upload files
    const evidenceUrls: string[] = [];
    for (const file of files) {
      const filePath = `${user.id}/${Date.now()}_${file.name}`;
      const { error: uploadError } = await supabase.storage
        .from("report-evidence")
        .upload(filePath, file);
      if (!uploadError) {
        const { data } = supabase.storage.from("report-evidence").getPublicUrl(filePath);
        evidenceUrls.push(data.publicUrl);
      }
    }

    // Generate ticket number
    const ticketNumber = `WBS-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substr(2, 4).toUpperCase()}`;

    // Combine all 5W+1H into report_description
    const combinedDescription = `
WHAT (APA):
${form.what_violation}

WHO (SIAPA):
- Nama: ${form.reported_name}
- Jabatan: ${form.reported_position}
- Unit Kerja: ${form.unit_work}
- Jenis Lembaga: ${form.institution_type}

WHERE (DIMANA):
${form.incident_location}

WHEN (KAPAN):
${form.incident_time}

WHY (MENGAPA):
${form.why_reason}

HOW (BAGAIMANA):
${form.how_chronology}
    `.trim();

    console.log("Submitting report with data:", {
      user_id: user.id,
      ticket_number: ticketNumber,
      institution_type: form.institution_type,
      unit_work: form.unit_work,
      reported_name: form.reported_name,
      reported_position: form.reported_position,
      incident_time: form.incident_time,
      report_description: combinedDescription,
      evidence_urls: evidenceUrls,
      status: "submitted",
      category: form.category,
    });

    const { error } = await supabase.from("reports").insert({
      user_id: user.id,
      ticket_number: ticketNumber,
      institution_type: form.institution_type,
      unit_work: form.unit_work,
      reported_name: form.reported_name,
      reported_position: form.reported_position,
      incident_time: form.incident_time,
      report_description: combinedDescription,
      evidence_urls: evidenceUrls,
      status: "submitted",
      category: form.category,
    });
    
    console.log("Report insert result - error:", error);
    setLoading(false);

    if (error) {
      toast({ title: "Gagal", description: error.message, variant: "destructive" });
      console.error("Report insert error:", error);
    } else {
      toast({ title: "Berhasil", description: "Pengaduan Anda telah berhasil dikirim." });
      navigate("/dashboard");
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      <main className="flex-1 py-6 md:py-8 px-3 md:px-4">
        <div className="container mx-auto max-w-3xl">
          <div className="glass-card p-4 md:p-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 md:w-12 md:h-12 rounded-lg bg-primary flex items-center justify-center shrink-0">
                <FileText className="text-primary-foreground w-5 h-5 md:w-6 md:h-6" />
              </div>
              <div>
                <h1 className="font-heading font-bold text-xl md:text-2xl text-foreground">Formulir Pengaduan</h1>
                <p className="text-muted-foreground text-sm">Isi formulir di bawah ini selengkap mungkin</p>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Section: KATEGORI */}
              <div className="border rounded-lg p-4 bg-muted/20">
                <h3 className="font-heading font-bold text-lg text-foreground mb-4 flex items-center gap-2">
                  <span className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm">📁</span>
                  Kategori Laporan
                </h3>
                
                <div>
                  <Label htmlFor="category">Pilih Kategori Pelanggaran *</Label>
                  <select
                    id="category"
                    value={form.category}
                    onChange={(e) => update("category", e.target.value)}
                    required
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 mt-2"
                  >
                    <option value="">-- Pilih Kategori --</option>
                    {categories.map((cat) => (
                      <option key={cat.value} value={cat.value}>{cat.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Section: WHO (SIAPA) - Terlapor */}
              <div className="border rounded-lg p-4 bg-muted/20">
                <h3 className="font-heading font-bold text-lg text-foreground mb-4 flex items-center gap-2">
                  <span className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm">1</span>
                  WHO (SIAPA) - Identitas Terlapor
                </h3>
                
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="institution_type">Jenis Lembaga *</Label>
                    <div className="flex flex-wrap gap-3 md:gap-4 mt-2">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="radio"
                          name="institution_type"
                          value="Instansi Pemerintah"
                          checked={form.institution_type === "Instansi Pemerintah"}
                          onChange={(e) => update("institution_type", e.target.value)}
                          required
                          className="text-primary"
                        />
                        <span className="text-sm md:text-base">Instansi Pemerintah</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="radio"
                          name="institution_type"
                          value="Swasta"
                          checked={form.institution_type === "Swasta"}
                          onChange={(e) => update("institution_type", e.target.value)}
                          required
                          className="text-primary"
                        />
                        <span className="text-sm md:text-base">Swasta</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="radio"
                          name="institution_type"
                          value="Lainnya"
                          checked={form.institution_type === "Lainnya"}
                          onChange={(e) => update("institution_type", e.target.value)}
                          required
                          className="text-primary"
                        />
                        <span className="text-sm md:text-base">Lainnya</span>
                      </label>
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="unit_work">Unit Kerja *</Label>
                    <Input
                      id="unit_work"
                      value={form.unit_work}
                      onChange={(e) => update("unit_work", e.target.value)}
                      placeholder="Nama unit kerja"
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="reported_name">Nama Terlapor *</Label>
                    <Input
                      id="reported_name"
                      value={form.reported_name}
                      onChange={(e) => update("reported_name", e.target.value)}
                      placeholder="Nama lengkap terlapor"
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="reported_position">Jabatan Terlapor *</Label>
                    <Input
                      id="reported_position"
                      value={form.reported_position}
                      onChange={(e) => update("reported_position", e.target.value)}
                      placeholder="Jabatan terlapor"
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Section: WHEN (KAPAN) - Waktu Kejadian */}
              <div className="border rounded-lg p-4 bg-muted/20">
                <h3 className="font-heading font-bold text-lg text-foreground mb-4 flex items-center gap-2">
                  <span className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm">2</span>
                  WHEN (KAPAN) - Waktu Kejadian
                </h3>
                
                <div>
                  <Label htmlFor="incident_time">Kapan kejadian terjadi? *</Label>
                  <Input
                    id="incident_time"
                    type="datetime-local"
                    value={form.incident_time}
                    onChange={(e) => update("incident_time", e.target.value)}
                    required
                  />
                </div>
              </div>

              {/* Section: WHERE (DIMANA) - Lokasi Kejadian */}
              <div className="border rounded-lg p-4 bg-muted/20">
                <h3 className="font-heading font-bold text-lg text-foreground mb-4 flex items-center gap-2">
                  <span className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm">3</span>
                  WHERE (DIMANA) - Lokasi Kejadian
                </h3>
                
                <div>
                  <Label htmlFor="incident_location">Dimana kejadian berlangsung? *</Label>
                  <Textarea
                    id="incident_location"
                    value={form.incident_location}
                    onChange={(e) => update("incident_location", e.target.value)}
                    placeholder="Tuliskan alamat lengkap atau lokasi kejadian (kota, kabupaten, nama tempat)"
                    required
                    rows={2}
                    className="resize-none"
                  />
                </div>
              </div>

              {/* Section: WHAT (APA) - Pelanggaran */}
              <div className="border rounded-lg p-4 bg-muted/20">
                <h3 className="font-heading font-bold text-lg text-foreground mb-4 flex items-center gap-2">
                  <span className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm">4</span>
                  WHAT (APA) - Jenis Pelanggaran
                </h3>
                
                <div>
                  <Label htmlFor="what_violation">Detail Pelanggaran *</Label>
                  <Textarea
                    id="what_violation"
                    value={form.what_violation}
                    onChange={(e) => update("what_violation", e.target.value)}
                    placeholder="Jelaskan jenis pelanggaran yang dilakukan secara detail"
                    required
                    rows={2}
                    className="resize-none"
                  />
                </div>
              </div>

              {/* Section: WHY (MENGAPA) - Alasan */}
              <div className="border rounded-lg p-4 bg-muted/20">
                <h3 className="font-heading font-bold text-lg text-foreground mb-4 flex items-center gap-2">
                  <span className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm">5</span>
                  WHY (MENGAPA) - Alasan/Dampak
                </h3>
                
                <div>
                  <Label htmlFor="why_reason">Mengapa kejadian ini terjadi? (jika diketahui)</Label>
                  <Textarea
                    id="why_reason"
                    value={form.why_reason}
                    onChange={(e) => update("why_reason", e.target.value)}
                    placeholder="Jelaskan alasan atau dugaan motif di balik pelanggaran ini, serta dampaknya (opsional)"
                    rows={2}
                    className="resize-none"
                  />
                </div>
              </div>

              {/* Section: HOW (BAGAIMANA) - Kronologi */}
              <div className="border rounded-lg p-4 bg-muted/20">
                <h3 className="font-heading font-bold text-lg text-foreground mb-4 flex items-center gap-2">
                  <span className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm">6</span>
                  HOW (BAGAIMANA) - Kronologi Kejadian
                </h3>
                
                <div>
                  <Label htmlFor="how_chronology">Bagaimana kronologi kejadian? *</Label>
                  <Textarea
                    id="how_chronology"
                    value={form.how_chronology}
                    onChange={(e) => update("how_chronology", e.target.value)}
                    placeholder="Jelaskan secara rinci urutan kejadian yang terjadi"
                    required
                    rows={4}
                    className="resize-none min-h-[100px] md:min-h-[150px]"
                  />
                </div>
              </div>

              {/* File Pendukung */}
              <div>
                <Label>File Pendukung</Label>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  accept="image/*,application/pdf,application/zip,application/x-rar-compressed"
                  multiple
                  className="hidden"
                />
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="mt-1 border-2 border-dashed border-border rounded-lg p-4 md:p-6 text-center cursor-pointer hover:border-primary/50 hover:bg-muted/30 transition-colors"
                >
                  <Upload className="mx-auto text-muted-foreground mb-2 w-6 h-6 md:w-7 md:h-7" />
                  <p className="text-sm text-muted-foreground">Klik untuk memilih file</p>
                  <p className="text-xs text-muted-foreground mt-1">Format: JPG, PNG, PDF, ZIP, RAR (Max 5MB per file)</p>
                </div>

                {files.length > 0 && (
                  <div className="mt-3 grid grid-cols-2 md:grid-cols-4 gap-2 md:gap-3">
                    {files.map((file, index) => (
                      <div key={index} className="relative group rounded-lg overflow-hidden border border-border bg-muted/20">
                        {file.type.startsWith("image/") ? (
                          <img src={URL.createObjectURL(file)} alt={file.name} className="w-full h-20 md:h-24 object-cover" />
                        ) : (
                          <div className="w-full h-20 md:h-24 flex flex-col items-center justify-center gap-1 p-2">
                            <FileText className="text-muted-foreground w-5 h-5 md:w-6 md:h-6" />
                            <span className="text-xs text-muted-foreground truncate max-w-full px-1">{file.name}</span>
                          </div>
                        )}
                        <button
                          type="button"
                          onClick={() => removeFile(index)}
                          className="absolute top-1 right-1 bg-destructive text-destructive-foreground rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <X size={14} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Captcha */}
              <div>
                <Label htmlFor="captcha">Captcha *</Label>
                <div className="flex flex-col sm:flex-row gap-2 mt-2">
                  <div className="flex-shrink-0">
                    <img src={captchaImage} alt="Captcha" className="border rounded p-1 bg-white w-full sm:w-auto" onClick={generateCaptcha} />
                  </div>
                  <Input
                    id="captcha"
                    placeholder="Masukkan captcha"
                    value={captchaInput}
                    onChange={(e) => setCaptchaInput(e.target.value)}
                    required
                    className="flex-1"
                  />
                  <Button type="button" variant="outline" size="sm" onClick={generateCaptcha} className="whitespace-nowrap">
                    Ganti
                  </Button>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-3 pt-2">
                <Button type="button" variant="outline" onClick={() => navigate("/dashboard")} className="w-full">
                  Batal
                </Button>
                <Button type="submit" className="w-full bg-primary hover:bg-accent" disabled={loading}>
                  {loading ? "Mengirim..." : "Kirim Pengaduan"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default ReportForm;
