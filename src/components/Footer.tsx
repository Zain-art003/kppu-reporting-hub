const Footer = () => {
  return (
    <footer className="bg-navy text-primary-foreground w-full">
      <div className="max-w-6xl mx-auto w-full px-4 py-6 md:py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
          <div>
            <h3 className="font-heading font-bold text-base md:text-lg mb-3 text-gold">
              WBS KPPU
            </h3>
            <p className="text-primary-foreground/70 text-sm leading-relaxed">
              Whistleblowing System Komisi Pengawas Persaingan Usaha Republik Indonesia.
              Menuju Persaingan Usaha yang Sehat dan Berkeadilan.
            </p>
          </div>
          <div>
            <h4 className="font-heading font-bold mb-3 text-gold-light text-sm md:text-base">Kontak</h4>
            <div className="text-primary-foreground/70 text-sm space-y-1">
              <p className="text-xs md:text-sm">Jl. Ir. H. Juanda No.36, Jakarta Pusat</p>
              <p className="text-xs md:text-sm">Telp: (021) 350-8015</p>
              <p className="text-xs md:text-sm">Email: wbs@kppu.go.id</p>
            </div>
          </div>
          <div>
            <h4 className="font-heading font-bold mb-3 text-gold-light text-sm md:text-base">Tautan</h4>
            <div className="text-primary-foreground/70 text-sm space-y-1">
              <p className="text-xs md:text-sm"><a href="https://kppu.go.id" target="_blank" rel="noopener noreferrer" className="hover:text-gold transition-colors">Website KPPU</a></p>
              <p className="text-xs md:text-sm"><a href="#" className="hover:text-gold transition-colors">Kebijakan Privasi</a></p>
              <p className="text-xs md:text-sm"><a href="#" className="hover:text-gold transition-colors">Syarat & Ketentuan</a></p>
            </div>
          </div>
        </div>
        <div className="border-t border-primary-foreground/20 mt-6 md:mt-8 pt-4 md:pt-6 text-center text-primary-foreground/50 text-xs">
          © 2026 Komisi Pengawas Persaingan Usaha. Hak Cipta Dilindungi.
        </div>
      </div>
    </footer>
  );
};

export default Footer;
