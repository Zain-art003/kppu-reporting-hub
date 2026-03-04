import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { UserPlus, Eye, EyeOff } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

const Register = () => {
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  const update = (field: string, value: string) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (form.password !== form.confirmPassword) {
      toast({
        title: "Error",
        description: "Password tidak cocok.",
        variant: "destructive",
      });
      return;
    }
    setLoading(true);

    try {
      // Use a simple redirect URL that works with Supabase
      // For local development, Supabase needs the redirect URL to be configured in the dashboard
      const redirectUrl = typeof window !== 'undefined'
        ? `${window.location.origin}/auth/callback`
        : 'http://localhost:5173/auth/callback';

      console.log("Register: Using redirect URL:", redirectUrl);

      const { data, error } = await supabase.auth.signUp({
        email: form.email,
        password: form.password,
        options: {
          data: {
            name: form.name,
            phone: form.phone,
          },
          // Don't set emailRedirectTo if it's localhost - let Supabase handle it
          // Only set it for production URLs
          ...(redirectUrl.includes('localhost') ? {} : { emailRedirectTo: redirectUrl }),
        },
      });

      if (error) {
        setLoading(false);
        console.error("Registration error:", error);
        
        if (error.message.includes("already registered") || error.message.includes("already been registered")) {
          toast({
            title: "Registrasi Gagal",
            description: "Email sudah terdaftar",
            variant: "destructive",
          });
        } else if (error.message.includes("email rate limit exceeded")) {
          toast({
            title: "Registrasi Gagal",
            description:
              "Terlalu banyak percobaan. Silakan tunggu beberapa menit atau gunakan email lain.",
            variant: "destructive",
          });
        } else if (error.status === 500 || error.message.includes("500")) {
          // Handle Supabase server errors
          toast({
            title: "Server Error",
            description: "Terjadi masalah pada server. Silakan coba lagi nanti atau hubungi administrator.",
            variant: "destructive",
          });
        } else {
          toast({
            title: "Registrasi Gagal",
            description: error.message,
            variant: "destructive",
          });
        }
      } else if (data.user) {
        // Create profile in database
        const { error: profileError } = await supabase.from("profiles").insert({
          user_id: data.user.id,
          name: form.name,
          phone: form.phone || null,
        });

        if (profileError) {
          console.error("Profile creation error:", profileError);
        }

        // Create default user role
        const { error: roleError } = await supabase.from("user_roles").insert({
          user_id: data.user.id,
          role: "user",
        });

        if (roleError) {
          console.error("Role creation error:", roleError);
        }

        setLoading(false);

        // Check if user needs email confirmation
        if (data.session) {
          // Auto-login if session is returned (email confirmation disabled)
          toast({ title: "Berhasil", description: "Anda berhasil terdaftar." });
          navigate("/dashboard");
        } else {
          // Email confirmation required
          toast({
            title: "Berhasil",
            description: "Silakan cek email untuk konfirmasi akun Anda.",
          });
          navigate("/login");
        }
      } else {
        toast({
          title: "Registrasi Gagal",
          description: "Terjadi kesalahan saat membuat akun",
          variant: "destructive",
        });
      }
    } catch (err) {
      setLoading(false);
      toast({
        title: "Error",
        description: "Terjadi kesalahan jaringan",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen flex flex-col relative overflow-hidden">
      {/* Background with animation - brighter overlay */}
      <div
        className="absolute inset-0 z-0 animate-slow-zoom"
        style={{
          backgroundImage: `url('/logo-kppu1.png')`,
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      />
      {/* Brighter overlay - much lighter for more visibility */}
      <div className="absolute inset-0 z-10 bg-gradient-to-b from-navy/20 via-navy/30 to-navy/60" />

      {/* Animated decorative elements */}
      <div className="absolute inset-0 z-10 overflow-hidden pointer-events-none">
        <div
          className="absolute top-20 left-10 w-32 h-32 bg-gold/10 rounded-full animate-pulse"
          style={{ animationDuration: "3s" }}
        />
        <div
          className="absolute bottom-40 right-20 w-24 h-24 bg-gold/10 rounded-full animate-pulse"
          style={{ animationDuration: "4s" }}
        />
      </div>

      <Navbar />
      <main className="flex-1 flex items-center justify-center py-10 px-4 relative z-20">
        <div className="w-full max-w-md">
          <div className="glass-card p-6 md:p-8 animate-fade-in-up hover:shadow-xl transition-shadow duration-300">
            <div className="text-center mb-6">
              <Link to="/">
                <img
                  src="/Logo_kppu.jpeg"
                  alt="Logo KPPU"
                  className="w-20 h-20 md:w-24 md:h-24 mx-auto mb-3 rounded-full object-contain shadow-xl hover:scale-105 transition-transform cursor-pointer"
                />
              </Link>
              <h1 className="font-heading font-bold text-xl md:text-2xl text-foreground mt-4">
                Register
              </h1>
              <p className="text-muted-foreground text-sm mt-1">
                Buat akun WBS KPPU Anda. Identitas dijamin kerahasiaannya.
              </p>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="name">Nama / Alias</Label>
                <Input
                  id="name"
                  value={form.name}
                  onChange={(e) => update("name", e.target.value)}
                  placeholder="Nama atau alias Anda"
                  required
                  className="transition-all duration-200 focus:ring-2 focus:ring-primary focus:border-primary"
                />
              </div>
              <div>
                <Label htmlFor="reg-email">Email</Label>
                <Input
                  id="reg-email"
                  type="email"
                  value={form.email}
                  onChange={(e) => update("email", e.target.value)}
                  placeholder="email@contoh.com"
                  required
                  className="transition-all duration-200 focus:ring-2 focus:ring-primary focus:border-primary"
                />
              </div>
              <div>
                <Label htmlFor="phone">No. Telepon (opsional)</Label>
                <Input
                  id="phone"
                  type="tel"
                  value={form.phone}
                  onChange={(e) => update("phone", e.target.value)}
                  placeholder="08xxxxxxxxxx"
                  className="transition-all duration-200 focus:ring-2 focus:ring-primary focus:border-primary"
                />
              </div>
              <div>
                <Label htmlFor="reg-password">Password</Label>
                <div className="relative">
                  <Input
                    id="reg-password"
                    type={showPassword ? "text" : "password"}
                    value={form.password}
                    onChange={(e) => update("password", e.target.value)}
                    placeholder="Minimal 6 karakter"
                    required
                    minLength={6}
                    className="transition-all duration-200 focus:ring-2 focus:ring-primary focus:border-primary pr-10"
                  />
                  <button
                    type="button"
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>
              <div>
                <Label htmlFor="confirm-password">Konfirmasi Password</Label>
                <Input
                  id="confirm-password"
                  type="password"
                  value={form.confirmPassword}
                  onChange={(e) => update("confirmPassword", e.target.value)}
                  placeholder="Ulangi password"
                  required
                  minLength={6}
                  className="transition-all duration-200 focus:ring-2 focus:ring-primary focus:border-primary"
                />
              </div>
              <Button
                type="submit"
                className="w-full bg-primary hover:bg-accent hover:shadow-lg transition-all duration-200 transform hover:scale-[1.02]"
                disabled={loading}
              >
                {loading ? "Memproses..." : "Daftar"}
              </Button>
            </form>
            <p className="text-center text-sm text-muted-foreground mt-6">
              Sudah punya akun?{" "}
              <Link
                to="/login"
                className="text-primary font-semibold hover:underline"
              >
                Login di sini
              </Link>
            </p>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Register;
