import { useState } from "react";
import { Link, useLocation, Outlet } from "react-router-dom";
import { NavLink } from "@/components/NavLink";
import {
  LayoutDashboard, MessageSquare, Calendar, BookOpen, Settings, Star,
  BarChart3, CreditCard, HelpCircle, Menu, X, Lock, LogOut, ChevronDown,
} from "lucide-react";
import { Button } from "@/components/ui/button";

const navItems = [
  { label: "Overview", icon: LayoutDashboard, path: "/dashboard" },
  { label: "Conversations", icon: MessageSquare, path: "/dashboard/conversations" },
  { label: "Bookings", icon: Calendar, path: "/dashboard/bookings" },
  { label: "Knowledge Base", icon: BookOpen, path: "/dashboard/knowledge" },
  { label: "Bot Settings", icon: Settings, path: "/dashboard/settings" },
  { label: "Review Requests", icon: Star, path: "/dashboard/reviews" },
  { label: "Analytics", icon: BarChart3, path: "/dashboard/analytics", locked: true },
  { label: "Billing", icon: CreditCard, path: "/dashboard/billing" },
  { label: "Help", icon: HelpCircle, path: "/dashboard/help" },
];

export default function DashboardLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();

  const SidebarContent = () => (
    <>
      <div className="p-4 border-b border-sidebar-border">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-sidebar-primary flex items-center justify-center">
            <MessageSquare className="w-4 h-4 text-sidebar-primary-foreground" />
          </div>
          <span className="text-base font-bold text-sidebar-foreground">BotLocal</span>
        </div>
      </div>

      <nav className="flex-1 p-3 space-y-1">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <Link
              key={item.path}
              to={item.locked ? "#" : item.path}
              onClick={() => setSidebarOpen(false)}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${isActive
                  ? "bg-sidebar-primary text-sidebar-primary-foreground"
                  : "text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent"
                } ${item.locked ? "opacity-50 cursor-not-allowed" : ""}`}
            >
              <item.icon className="w-4.5 h-4.5" />
              <span className="flex-1">{item.label}</span>
              {item.badge && (
                <span className="px-1.5 py-0.5 rounded-full bg-sidebar-primary text-sidebar-primary-foreground text-xs font-semibold">
                  {item.badge}
                </span>
              )}
              {item.locked && <Lock className="w-3.5 h-3.5" />}
            </Link>
          );
        })}
      </nav>

      <div className="p-3 border-t border-sidebar-border">
        <div className="flex items-center gap-3 px-3 py-2">
          <div className="w-8 h-8 rounded-full bg-sidebar-accent flex items-center justify-center text-sidebar-foreground text-sm font-semibold">
            M
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-sidebar-foreground truncate">My Business</p>
            <p className="text-xs text-sidebar-foreground/50">Starter Plan</p>
          </div>
          <Link to="/" className="text-sidebar-foreground/50 hover:text-sidebar-foreground">
            <LogOut className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </>
  );

  return (
    <div className="min-h-screen flex w-full">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex flex-col w-60 bg-sidebar fixed inset-y-0 left-0 z-30">
        <SidebarContent />
      </aside>

      {/* Mobile Sidebar */}
      {sidebarOpen && (
        <div className="lg:hidden fixed inset-0 z-40">
          <div className="absolute inset-0 bg-foreground/50" onClick={() => setSidebarOpen(false)} />
          <aside className="absolute left-0 top-0 bottom-0 w-60 bg-sidebar flex flex-col">
            <SidebarContent />
          </aside>
        </div>
      )}

      {/* Main Content */}
      <main className="flex-1 lg:ml-60">
        {/* Top bar */}
        <header className="sticky top-0 z-20 bg-card border-b border-border h-14 flex items-center px-4 lg:px-6 gap-3">
          <button className="lg:hidden text-foreground" onClick={() => setSidebarOpen(true)}>
            <Menu className="w-5 h-5" />
          </button>
          <div className="flex-1" />
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-success/10 text-success">Online</span>
          </div>
        </header>

        <div className="p-4 lg:p-6">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
