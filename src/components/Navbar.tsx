import { Link, useLocation } from "react-router-dom";
import {
  Home,
  LogIn,
  UserPlus,
  Menu,
  X,
  LayoutDashboard,
  LogOut,
  Shield,
  Search,
} from "lucide-react";
import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";

const Navbar = () => {
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const { user, isAdmin, signOut } = useAuth();

  const publicLinks = [
    { to: "/", label: "BERANDA", icon: Home },
    { to: "/track", label: "LACAK", icon: Search },
    { to: "/login", label: "LOGIN", icon: LogIn },
    { to: "/register", label: "REGISTER", icon: UserPlus },
  ];

  // Untuk user biasa: ada HALAMAN SAYA dan LACAK
  // Untuk admin: langsung ke ADMIN (tidak perlu LACAK karena admin punya akses penuh)
  const authLinks = isAdmin
    ? [
        { to: "/", label: "BERANDA", icon: Home },
        { to: "/admin", label: "ADMIN", icon: Shield },
      ]
    : [
        { to: "/", label: "BERANDA", icon: Home },
        { to: "/track", label: "LACAK", icon: Search },
        { to: "/dashboard", label: "HALAMAN SAYA", icon: LayoutDashboard },
      ];

  const links = user ? authLinks : publicLinks;

  return (
    <nav className="bg-navy sticky top-0 z-50 shadow-lg w-full">
      <div className="flex items-center justify-between py-3 px-4 md:px-8 w-full">
        <Link to="/" className="flex items-center gap-3 group">
          <img
            src="/Logo_kppu.jpeg"
            alt="Logo KPPU"
            className="w-12 h-12 rounded-full object-contain transition-transform duration-300 group-hover:scale-105"
          />
          <span className="text-primary-foreground font-heading text-sm md:text-base font-bold hidden sm:block">
            WBS KPPU
          </span>
        </Link>

        {/* Desktop */}
        <div className="hidden md:flex items-center gap-1">
          {links.map(({ to, label, icon: Icon }) => (
            <Link
              key={to}
              to={to}
              className={`flex items-center gap-2 px-4 py-2 rounded text-sm font-semibold transition-all duration-200 ${
                location.pathname === to
                  ? "bg-accent text-accent-foreground shadow-lg shadow-accent/30"
                  : "text-primary-foreground/80 hover:bg-navy-light hover:text-primary-foreground hover:scale-105 hover:shadow-md"
              }`}
            >
              <Icon size={16} />
              {label}
            </Link>
          ))}
          {user && (
            <div className="flex items-center gap-2 ml-2">
              <button
                onClick={signOut}
                className="flex items-center gap-2 px-4 py-2 rounded text-sm font-semibold text-primary-foreground/80 hover:bg-navy-light hover:text-primary-foreground transition-all duration-200 hover:scale-105 hover:shadow-md"
              >
                <LogOut size={16} />{" "}
                <span className="hidden sm:inline">KELUAR</span>
              </button>
            </div>
          )}
        </div>

        {/* Mobile toggle */}
        <button
          className="md:hidden text-primary-foreground"
          onClick={() => setMobileOpen(!mobileOpen)}
        >
          {mobileOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="md:hidden bg-navy-light border-t border-accent/20 pb-3">
          {links.map(({ to, label, icon: Icon }) => (
            <Link
              key={to}
              to={to}
              onClick={() => setMobileOpen(false)}
              className={`flex items-center gap-3 px-6 py-3 text-sm font-semibold transition-colors ${
                location.pathname === to
                  ? "bg-accent text-accent-foreground"
                  : "text-primary-foreground/80 hover:bg-accent/50"
              }`}
            >
              <Icon size={16} /> {label}
            </Link>
          ))}
          {user && (
            <button
              onClick={() => {
                signOut();
                setMobileOpen(false);
              }}
              className="flex items-center gap-3 px-6 py-3 text-sm font-semibold text-primary-foreground/80 hover:bg-accent/50 w-full"
            >
              <LogOut size={16} /> KELUAR
            </button>
          )}
        </div>
      )}
    </nav>
  );
};

export default Navbar;
