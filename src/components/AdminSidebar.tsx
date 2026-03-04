import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  Shield,
  LayoutDashboard,
  FileText,
  BarChart3,
  LogOut,
  Users,
  Menu,
  X,
  ChevronLeft,
  ArrowLeft
} from "lucide-react";
import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";

const adminMenuItems = [
  { to: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { to: "/admin", label: "Semua Laporan", icon: FileText, action: "reports" },
  { to: "/admin", label: "Pengguna", icon: Users, action: "users" },
  { to: "/admin", label: "Statistik", icon: BarChart3, action: "stats" },
];

interface AdminSidebarProps {
  activeSection?: string;
  onSectionChange?: (section: string) => void;
}

const AdminSidebar = ({ activeSection = "dashboard", onSectionChange }: AdminSidebarProps) => {
  const location = useLocation();
  const { signOut } = useAuth();
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [localActiveSection, setLocalActiveSection] = useState("dashboard");

  // Use local state or prop
  const currentSection = onSectionChange ? activeSection : localActiveSection;
  
  const handleMenuClick = (action?: string) => {
    const section = action || "dashboard";
    if (onSectionChange) {
      onSectionChange(section);
    } else {
      setLocalActiveSection(section);
    }
    // Close mobile menu when clicking a menu item
    setMobileOpen(false);
  };


  return (
    <>
      {/* Mobile Toggle */}
      <button
        className="md:hidden fixed top-4 left-4 z-50 p-2 bg-primary text-primary-foreground rounded-lg shadow-lg"
        onClick={() => setMobileOpen(!mobileOpen)}
      >
        {mobileOpen ? <X size={24} /> : <Menu size={24} />}
      </button>

      {/* Sidebar */}
      <aside
        className={`
          fixed left-0 top-0 h-full bg-navy z-40 transition-all duration-300 flex flex-col
          ${collapsed ? 'w-16' : 'w-64'}
          ${mobileOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
        `}
      >
        {/* Logo Section */}
        <div className="p-4 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-white flex items-center justify-center shrink-0 overflow-hidden">
              <img src="/Logo_kppu.jpeg" alt="Logo KPPU" className="w-full h-full object-cover" />
            </div>
            {!collapsed && (
              <div className="flex-1 min-w-0">
                <h1 className="font-heading font-bold text-primary-foreground text-sm truncate">WBS KPPU</h1>
                <p className="text-xs text-gold font-medium">Admin Panel</p>
              </div>
            )}
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 py-4 overflow-y-auto">
          <ul className="space-y-1 px-2">
            {adminMenuItems.map((item) => {
              const Icon = item.icon;
              const isActive = (item.action && currentSection === item.action) ||
                             (!item.action && currentSection === "dashboard");
              return (
                <li key={item.label}>
                  <button
                    onClick={() => handleMenuClick(item.action)}
                    className={`
                      flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors w-full text-left
                      ${isActive
                        ? 'bg-gold text-navy font-semibold'
                        : 'text-primary-foreground/70 hover:bg-navy-light hover:text-primary-foreground'
                      }
                      ${collapsed ? 'justify-center' : ''}
                    `}
                    title={collapsed ? item.label : undefined}
                  >
                    <Icon size={20} />
                    {!collapsed && <span className="text-sm">{item.label}</span>}
                  </button>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Bottom Section */}
        <div className="p-4 border-t border-white/10 space-y-2">
          {/* Collapse Toggle (Desktop) */}
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="hidden md:flex items-center justify-center w-full py-2 text-primary-foreground/60 hover:text-primary-foreground hover:bg-navy-light rounded-lg transition-colors"
          >
            <ChevronLeft size={20} className={`transition-transform ${collapsed ? 'rotate-180' : ''}`} />
            {!collapsed && <span className="ml-2 text-sm">Collapse</span>}
          </button>

          {/* Back to Home */}
          <button
            onClick={() => navigate("/")}
            className={`
              flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-primary-foreground/70 hover:bg-navy-light hover:text-primary-foreground transition-colors
              ${collapsed ? 'justify-center' : ''}
            `}
            title={collapsed ? "Kembali ke Beranda" : undefined}
          >
            <ArrowLeft size={20} />
            {!collapsed && <span className="text-sm">Kembali ke WBS</span>}
          </button>

          {/* Logout */}
          <button
            onClick={signOut}
            className={`
              flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-red-400 hover:bg-red-500/10 transition-colors
              ${collapsed ? 'justify-center' : ''}
            `}
            title={collapsed ? "Logout" : undefined}
          >
            <LogOut size={20} />
            {!collapsed && <span className="text-sm">Logout</span>}
          </button>
        </div>
      </aside>

      {/* Mobile Overlay */}
      {mobileOpen && (
        <div
          className="md:hidden fixed inset-0 bg-black/50 z-30"
          onClick={() => setMobileOpen(false)}
        />
      )}
    </>
  );
};

export default AdminSidebar;