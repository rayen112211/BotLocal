import { Link, useLocation, Outlet, useSearchParams } from "react-router-dom";
import { NavLink } from "@/components/NavLink";
import {
  LayoutDashboard, MessageSquare, Calendar, BookOpen, Settings, Star,
  BarChart3, CreditCard, HelpCircle, Menu, Lock, LogOut, Bell, AlertCircle,
  CheckCircle2, XCircle, RefreshCw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { notificationsAPI, telegramAPI, healthAPI } from "@/lib/api";

const navItems = [
  { label: "Overview", icon: LayoutDashboard, path: "/dashboard" },
  { label: "Conversations", icon: MessageSquare, path: "/dashboard/conversations" },
  { label: "Bookings", icon: Calendar, path: "/dashboard/bookings" },
  { label: "Knowledge Base", icon: BookOpen, path: "/dashboard/knowledge" },
  { label: "Bot Settings", icon: Settings, path: "/dashboard/settings" },
  { label: "Review Requests", icon: Star, path: "/dashboard/reviews" },
  { label: "Analytics", icon: BarChart3, path: "/dashboard/analytics" },
  { label: "Billing", icon: CreditCard, path: "/dashboard/billing" },
  { label: "Help", icon: HelpCircle, path: "/dashboard/help" },
];

// Status badge component
function StatusBadge({ status, label }: { status: 'healthy' | 'degraded' | 'unhealthy' | 'offline', label: string }) {
  const colors = {
    healthy: 'bg-green-500/10 text-green-500',
    degraded: 'bg-yellow-500/10 text-yellow-500',
    unhealthy: 'bg-red-500/10 text-red-500',
    offline: 'bg-gray-500/10 text-gray-500',
  };

  const icons = {
    healthy: CheckCircle2,
    degraded: AlertCircle,
    unhealthy: XCircle,
    offline: XCircle,
  };

  const Icon = icons[status];

  return (
    <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${colors[status]}`}>
      <Icon className="w-3 h-3" />
      {label}
    </span>
  );
}

export default function DashboardLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [botStatus, setBotStatus] = useState<any>(null);
  const [systemHealth, setSystemHealth] = useState<any>(null);
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  const { business, refreshBusiness } = useAuth();
  const { toast } = useToast();

  // Payment success return from Stripe: refetch business and show confirmation
  useEffect(() => {
    if (searchParams.get('payment') === 'success') {
      refreshBusiness().then(() => {
        toast({ title: 'Payment successful', description: 'Your plan has been updated.' });
      });
      // Remove the query parameter safely to avoid duplicate toasts on re-renders
      searchParams.delete('payment');
      searchParams.delete('session_id');
      setSearchParams(searchParams, { replace: true });
    }
  }, [searchParams, setSearchParams, refreshBusiness, toast]);

  // Fetch notifications
  const fetchNotifications = async () => {
    try {
      const res = await notificationsAPI.getAll();
      setNotifications(res.data.notifications);
      setUnreadCount(res.data.unreadCount);
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
    }
  };

  // Fetch bot status
  const fetchBotStatus = async () => {
    if (!business?.id) return;
    try {
      const res = await telegramAPI.getStatus(business.id);
      setBotStatus(res.data);
    } catch (error) {
      console.error('Failed to fetch bot status:', error);
    }
  };

  // Fetch system health
  const fetchSystemHealth = async () => {
    try {
      const res = await healthAPI.getDetailed();
      setSystemHealth(res.data);
    } catch (error) {
      console.error('Failed to fetch system health:', error);
    }
  };

  // Initial fetch
  useEffect(() => {
    fetchNotifications();
    fetchBotStatus();
    fetchSystemHealth();

    // Poll for notifications every 30 seconds
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, [business?.id]);

  // Mark notification as read
  const handleMarkAsRead = async (id: string) => {
    try {
      await notificationsAPI.markAsRead(id);
      fetchNotifications();
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
    }
  };

  // Mark all as read
  const handleMarkAllAsRead = async () => {
    try {
      await notificationsAPI.markAllAsRead();
      fetchNotifications();
    } catch (error) {
      console.error('Failed to mark all as read:', error);
    }
  };

  // Refresh bot status
  const handleRefreshBotStatus = async () => {
    await fetchBotStatus();
    toast({ title: "Status refreshed" });
  };

  const getSystemStatus = (): 'healthy' | 'degraded' | 'unhealthy' | 'offline' => {
    if (!systemHealth) return 'offline';
    return systemHealth.status;
  };

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
              to={item.path}
              onClick={() => setSidebarOpen(false)}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${isActive
                ? "bg-sidebar-primary text-sidebar-primary-foreground"
                : "text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent"
                }`}
            >
              <item.icon className="w-4.5 h-4.5" />
              <span className="flex-1">{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="p-3 border-t border-sidebar-border">
        <div className="flex items-center gap-3 px-3 py-2">
          <div className="w-8 h-8 rounded-full bg-sidebar-accent flex items-center justify-center text-sidebar-foreground text-sm font-semibold">
            {business?.name?.charAt(0) || 'B'}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-sidebar-foreground truncate">{business?.name || 'Business'}</p>
            <p className="text-xs text-sidebar-foreground/50">{business?.plan || 'Starter'} Plan</p>
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

          {/* Bot Status */}
          <div className="hidden md:flex items-center gap-2" title={botStatus?.lastError ? `Error: ${botStatus.lastError}` : undefined}>
            <span className="text-xs text-muted-foreground">Bot:</span>
            {botStatus ? (
              botStatus.connected ? (
                <StatusBadge status="healthy" label="Connected" />
              ) : (
                <StatusBadge status="offline" label="Not Connected" />
              )
            ) : (
              <StatusBadge status="offline" label="Unknown" />
            )}
            <button
              onClick={handleRefreshBotStatus}
              className="p-1 hover:bg-accent rounded"
              title="Refresh status"
            >
              <RefreshCw className="w-3 h-3" />
            </button>
          </div>

          <div className="flex-1" />

          {/* System Health */}
          <div className="hidden md:flex items-center gap-2">
            <StatusBadge status={getSystemStatus()} label="System" />
          </div>

          {/* Notifications */}
          <div className="relative">
            <Button
              variant="ghost"
              size="icon"
              className="relative"
              onClick={() => setNotificationsOpen(!notificationsOpen)}
            >
              <Bell className="w-5 h-5" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </Button>

            {/* Notifications Dropdown */}
            {notificationsOpen && (
              <div className="absolute right-0 top-full mt-2 w-80 bg-card border border-border rounded-lg shadow-lg z-50">
                <div className="p-3 border-b border-border flex items-center justify-between">
                  <h3 className="font-semibold">Notifications</h3>
                  {unreadCount > 0 && (
                    <button
                      onClick={handleMarkAllAsRead}
                      className="text-xs text-primary hover:underline"
                    >
                      Mark all read
                    </button>
                  )}
                </div>
                <div className="max-h-80 overflow-y-auto">
                  {notifications.length === 0 ? (
                    <div className="p-4 text-center text-muted-foreground text-sm">
                      No notifications
                    </div>
                  ) : (
                    notifications.map((notification) => (
                      <div
                        key={notification.id}
                        className={`p-3 border-b border-border last:border-0 hover:bg-accent cursor-pointer ${!notification.read ? 'bg-accent/50' : ''}`}
                        onClick={() => handleMarkAsRead(notification.id)}
                      >
                        <div className="flex items-start gap-2">
                          <div className={`w-2 h-2 rounded-full mt-1.5 ${notification.type === 'error' ? 'bg-red-500' :
                            notification.type === 'success' ? 'bg-green-500' :
                              notification.type === 'payment' ? 'bg-blue-500' :
                                'bg-gray-500'
                            }`} />
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-sm">{notification.title}</p>
                            <p className="text-xs text-muted-foreground truncate">{notification.message}</p>
                            <p className="text-xs text-muted-foreground mt-1">
                              {new Date(notification.createdAt).toLocaleString()}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>
        </header>

        <div className="p-4 lg:p-6">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
