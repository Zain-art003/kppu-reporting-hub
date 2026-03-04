import { FileText, Gavel, Building, Users } from "lucide-react";

const tujuan = [
  {
    icon: FileText,
    title: "Ruang Untuk Melapor",
    desc: "Menyediakan ruang bagi pelapor untuk melaporkan dan/atau mengungkapkan fakta terjadinya pelanggaran disiplin pegawai dan peraturan perundang-undangan, termasuk dugaan praktik monopoli dan persaingan usaha tidak sehat.",
  },
  {
    icon: Gavel,
    title: "Memberikan Sanksi",
    desc: "Memberikan sanksi bagi pegawai yang terbukti melakukan pelanggaran disiplin dan aturan perilaku, serta memproses lebih lanjut terjadinya pelanggaran peraturan perundang-undangan yang berlaku.",
  },
  {
    icon: Building,
    title: "Memperbaiki Sistem Birokrasi",
    desc: "Memperbaiki sistem manajemen pada organisasi menuju birokrasi yang bersih dan mewujudkan sistem penyelenggaraan pelayanan publik yang layak sesuai dengan asas-asas umum pemerintahan yang baik.",
  },
  {
    icon: Users,
    title: "Meningkatkan Kepercayaan",
    desc: "Meningkatkan kepercayaan masyarakat kepada KPPU dan lembaga pemerintah pada umumnya dalam menegakkan hukum persaingan usaha yang adil.",
  },
];

const TujuanSection = () => {
  return (
    <section className="py-8 w-full">
      <div className="max-w-6xl mx-auto w-full px-4">
        <h2 className="section-heading rounded-t-lg">Tujuan WBS</h2>
        <div className="bg-card p-6 md:p-8 rounded-b-lg shadow-sm">
          <p className="text-foreground/80 mb-6">
            WBS Komisi Pengawas Persaingan Usaha bertujuan untuk:
          </p>
          <div className="grid sm:grid-cols-2 gap-4">
            {tujuan.map(({ icon: Icon, title, desc }) => (
              <div key={title} className="glass-card p-5 flex flex-col gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-primary flex items-center justify-center shrink-0">
                    <Icon className="text-primary-foreground" size={20} />
                  </div>
                  <h3 className="font-heading font-bold text-foreground">{title}</h3>
                </div>
                <p className="text-foreground/75 text-sm leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default TujuanSection;
