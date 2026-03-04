const HeroSection = () => {
  return (
    <section
      className="relative w-full min-h-[500px] md:min-h-[600px] lg:min-h-[700px] flex flex-col items-center justify-center text-center py-12 md:py-16 overflow-hidden"
      style={{
        backgroundImage: `url('/logo-kppu1.png')`,
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
        animation: "slowZoom 20s ease-in-out infinite alternate",
      }}
    >
      {/* Overlay lebih cerah untuk memastikan text tetap readable */}
      <div className="absolute inset-0 bg-gradient-to-b from-navy/30 via-navy/40 to-navy/70"></div>

      {/* Animated decorative elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-32 h-32 bg-gold/10 rounded-full animate-pulse" style={{ animationDuration: '3s' }} />
        <div className="absolute bottom-40 right-20 w-24 h-24 bg-gold/10 rounded-full animate-pulse" style={{ animationDuration: '4s' }} />
      </div>

      <div className="relative z-10 animate-fade-in-up">
        <h1 className="text-2xl md:text-4xl font-heading font-bold text-primary-foreground mb-2 px-2">
          Whistleblower's System
        </h1>
        <p className="text-gold text-base md:text-xl font-heading font-bold mb-1">
          KPPU
        </p>
        <p className="text-primary-foreground/80 text-sm md:text-lg mt-3 md:mt-4 max-w-2xl mx-auto px-4">
          Menuju Persaingan Usaha yang Sehat dan Berkeadilan
        </p>
      </div>
    </section>
  );
};

export default HeroSection;
