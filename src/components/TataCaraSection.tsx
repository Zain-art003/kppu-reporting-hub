const TataCaraSection = () => {
  const steps = [
    "Buka website WBS KPPU.",
    'Jika Anda belum memiliki akun, buatlah akun WBS KPPU Anda dengan cara klik menu "REGISTER" kemudian isi identitas dan kontak Anda. Jangan khawatir, selain alamat email, Anda dapat mengisi identitas Anda dengan identitas alias/samaran. Identitas yang Anda daftarkan dijamin kerahasiaannya.',
    'Setelah berhasil mendaftar, klik menu "LOGIN" menggunakan akun yang telah Anda daftarkan.',
    "Isi formulir pengaduan dengan lengkap sesuai dengan informasi pelanggaran/dugaan pelanggaran yang ingin Anda laporkan. Semakin lengkap informasi yang diberikan, semakin cepat dan akurat pengaduan Anda ditangani. Minimal, informasi dalam pengaduan harus memenuhi kriteria 3W (what, who, where) untuk dapat ditindaklanjuti.",
    'Anda juga dapat memantau tindak lanjut pengaduan melalui menu "Halaman Saya" setelah login.',
    "Pelapor akan menerima surat jawaban dari Ketua KPPU atau Inspektorat KPPU mengenai tindak lanjut pengaduan paling lambat 30 hari kerja sejak pengaduan diterima.",
  ];

  const kriteria = [
    { label: "What", desc: "Substansi penyimpangan yang diadukan." },
    { label: "Who", desc: "Siapa yang melakukan penyimpangan atau siapa saja yang dapat diduga melakukan penyimpangan." },
    { label: "Where", desc: "Tempat terjadinya penyimpangan." },
    { label: "When", desc: "Kapan penyimpangan terjadi." },
    { label: "Why", desc: "Informasi yang berkaitan dengan motivasi seseorang melakukan penyimpangan." },
    { label: "How", desc: "Berkaitan dengan bagaimana penyimpangan tersebut terjadi." },
  ];

  return (
    <section className="py-8 w-full bg-section-alt">
      <div className="max-w-6xl mx-auto w-full px-4">
        <h2 className="section-heading rounded-t-lg">Tata Cara Pengaduan</h2>
        <div className="bg-card p-6 md:p-8 rounded-b-lg shadow-sm">
          <ol className="list-decimal list-inside space-y-3 text-foreground/90 leading-relaxed">
            {steps.map((step, i) => (
              <li key={i}>{step}</li>
            ))}
          </ol>

          <div className="mt-8">
            <h3 className="font-heading font-bold text-lg text-foreground mb-3">
              Kriteria Pengaduan Dapat Ditindaklanjuti
            </h3>
            <p className="text-foreground/80 mb-4">
              Pengaduan idealnya memenuhi kriteria <strong>5W+1H</strong>:
            </p>
            <div className="grid sm:grid-cols-2 gap-3 w-full">
              {kriteria.map(({ label, desc }) => (
                <div key={label} className="glass-card p-4">
                  <span className="font-bold text-primary">{label}:</span>{" "}
                  <span className="text-foreground/80">{desc}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default TataCaraSection;
