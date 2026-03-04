import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Shield, Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";

const AdminLogin = () => {
  const { user, isAdmin, loading: authLoading, signIn: authSignIn, refreshUser, signOut: authSignOut } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  // Track if we've handled redirect to avoid race conditions
  const [hasRedirected, setHasRedirected] = useState(false);

  // Redirect if already logged in - but only after auth is fully loaded
  useEffect(() => {
    // Skip if still loading auth or already redirected
    if (authLoading || hasRedirected) return;
    
    if (isAdmin) {
      setHasRedirected(true);
      navigate("/admin");
    } else if (user) {
      // If user is logged in but not admin, redirect to user dashboard
      setHasRedirected(true);
      navigate("/dashboard");
    }
  }, [user, isAdmin, authLoading, navigate, hasRedirected]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    // Use AuthContext's signIn which already does force refresh to get latest role
    const result = await authSignIn(email, password);
    
    if (!result.success) {
      setLoading(false);
      toast({ title: "Login Gagal", description: result.error || "Email atau password salah", variant: "destructive" });
      return;
    }

    // Wait for auth context to update (loading = false from signIn)
    // Then navigate to admin - actual access control is in AdminDashboard
    // If user is not admin, AdminDashboard will redirect them
    setTimeout(() => {
      setLoading(false);
      toast({ title: "Berhasil", description: "Selamat datang di Panel Admin." });
      navigate("/admin");
    }, 800); // Increased timeout to ensure auth state is fully updated
  };

  // Show loading while checking auth
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <p className="text-muted-foreground">Memuat...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col relative overflow-hidden">
      {/* Background with animation - brighter overlay */}
      <div
        className="absolute inset-0 z-0 animate-slow-zoom"
        style={{
          backgroundImage: `url('/logo-kppu1.png')`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      />
      {/* Brighter overlay - much lighter for more visibility */}
      <div className="absolute inset-0 z-10 bg-gradient-to-b from-navy/20 via-navy/30 to-navy/60" />
      
      {/* Animated decorative elements */}
      <div className="absolute inset-0 z-10 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-32 h-32 bg-gold/10 rounded-full animate-pulse" style={{ animationDuration: '3s' }} />
        <div className="absolute bottom-40 right-20 w-24 h-24 bg-gold/10 rounded-full animate-pulse" style={{ animationDuration: '4s' }} />
      </div>
      
      <main className="flex-1 flex items-center justify-center py-10 px-4 relative z-20">
        <div className="w-full max-w-md">
          <div className="glass-card p-6 md:p-8 animate-fade-in-up hover:shadow-xl transition-shadow duration-300">
            <div className="text-center mb-6">
              <img
                src="/Logo_kppu.jpeg"
                alt="Logo KPPU"
                className="w-20 h-20 md:w-24 md:h-24 mx-auto mb-3 rounded-full object-contain shadow-xl"
              />
              <h1 className="font-heading font-bold text-xl md:text-2xl text-foreground mt-4">Login Admin</h1>
              <p className="text-muted-foreground text-sm mt-1">Masuk ke Panel Admin WBS KPPU</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="email">Email Admin</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@kppu.go.id"
                  required
                  className="transition-all duration-200 focus:ring-2 focus:ring-primary focus:border-primary"
                />
              </div>
              <div>
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    required
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
              <Button
                type="submit"
                className="w-full bg-red-600 hover:bg-red-700 hover:shadow-lg transition-all duration-200 transform hover:scale-[1.02]"
                disabled={loading}
              >
                {loading ? "Memproses..." : "Masuk sebagai Admin"}
              </Button>
            </form>

            <div className="mt-6 pt-6 border-t border-border">
              <p className="text-center text-sm text-muted-foreground">
                Login sebagai pengguna?{" "}
                <Link to="/login" className="text-primary font-semibold hover:underline">Klik di sini</Link>
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default AdminLogin;