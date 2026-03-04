import { Lock, Shield, Zap, Scale, Target } from "lucide-react";

const prinsip = [
  {
    icon: Lock,
    title: "Kerahasiaan",
    desc: "Pegawai yang terlibat baik langsung maupun tidak langsung dengan penanganan pengaduan wajib menjaga kerahasiaan identitas pelapor, informasi pengaduan, isi pengaduan, dan laporan penanganan pengaduan.",
  },
  {
    icon: Shield,
    title: "Perlindungan",
    desc: "Pelapor berhak atas perlindungan dan rasa aman, baik keamanan pribadi maupun keluarganya serta bebas dari ancaman dan pembalasan yang berkenaan dengan pelaporan.",
  },
  {
    icon: Zap,
    title: "Kemudahan",
    desc: "Mekanisme pengelolaan WBS dirancang untuk memberikan kemudahan bagi pegawai dan pihak eksternal KPPU dalam menyampaikan pengaduan.",
  },
  {
    icon: Scale,
    title: "Independen",
    desc: "Dalam penanganan pengaduan, pejabat yang terlibat bertindak profesional dan bebas dari pengaruh pihak manapun.",
  },
  {
    icon: Target,
    title: "Fokus Pada Substansi",
    desc: "Pengelolaan pengaduan lebih difokuskan pada substansi pengaduan yang disampaikan, bukan pada identitas dan/atau motif pelapor.",
  },
];

const PrinsipSection = () => {
  return (
    <section className="py-8 w-full bg-section-alt">
      <div className="max-w-6xl mx-auto w-full px-4">
        <h2 className="section-heading rounded-t-lg">Prinsip Dasar</h2>
        <div className="bg-card p-6 md:p-8 rounded-b-lg shadow-sm">
          <p className="text-foreground/80 mb-6">
            Prinsip Dasar Dalam Pengelolaan WBS Komisi Pengawas Persaingan Usaha:
          </p>
          <div className="space-y-4">
            {prinsip.map(({ icon: Icon, title, desc }) => (
              <div key={title} className="flex gap-4 items-start glass-card p-4">
                <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center shrink-0">
                  <Icon className="text-secondary-foreground" size={18} />
                </div>
                <div>
                  <h3 className="font-heading font-bold text-foreground mb-1">{title}</h3>
                  <p className="text-foreground/75 text-sm leading-relaxed">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default PrinsipSection;
