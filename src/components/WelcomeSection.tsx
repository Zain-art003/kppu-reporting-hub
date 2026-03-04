const WelcomeSection = () => {
  return (
    <section className="py-8 w-full">
      <div className="max-w-6xl mx-auto w-full px-4">
        <h2 className="section-heading rounded-t-lg">Selamat Datang</h2>
        <div className="bg-card p-6 md:p-8 rounded-b-lg shadow-sm space-y-4 text-foreground/90 leading-relaxed">
          <p>
            Dalam rangka mewujudkan persaingan usaha yang sehat dan berkeadilan serta penyelenggaraan pelayanan publik yang layak sesuai dengan asas-asas umum pemerintahan yang baik, diperlukan kondisi dalam pelaksanaan tugas pokok KPPU yang terbebas dari adanya pelanggaran terhadap ketentuan yang berlaku.
          </p>
          <p>
            <strong>Whistleblowing System (WBS)</strong> adalah sistem pelaporan pelanggaran yang memungkinkan peran aktif pegawai dan pihak eksternal organisasi untuk menyampaikan pengaduan mengenai tindakan pelanggaran dan dugaan pelanggaran yang dilakukan oleh pegawai Komisi Pengawas Persaingan Usaha (KPPU).
          </p>
        </div>
      </div>
    </section>
  );
};

export default WelcomeSection;
