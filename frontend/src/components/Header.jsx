import { useState } from "react";
import { Bell, Search, UserCircle, LogOut, CheckCircle2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

export default function Header({ onLogout }) {
  const [profileOpen, setProfileOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const navigate = useNavigate();

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/history?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  // Mock notifications for now, since backend doesn't support them.
  const notifications = [
    { id: 1, text: "System initialized successfully", time: "10m ago" },
    { id: 2, text: "Analysis engine ready", time: "1h ago" }
  ];

  return (
    <header className="h-16 border-b bg-background flex items-center justify-between px-6 sticky top-0 z-10">
      
      {/* Search */}
      <div className="flex-1 max-w-md">
        <form onSubmit={handleSearch} className="relative">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search transactions..."
            className="pl-9 bg-muted/50 border-none focus-visible:ring-1"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </form>
      </div>

      {/* Right side */}
      <div className="flex items-center gap-4">

        {/* Notification */}
        <div className="relative">
          <Button
            variant="ghost"
            size="icon"
            className="relative"
            onClick={() => setNotificationsOpen(!notificationsOpen)}
          >
            <Bell className="w-5 h-5" />
            <span className="absolute top-2 right-2 w-2 h-2 bg-destructive rounded-full" />
          </Button>

          {/* Notifications dropdown */}
          {notificationsOpen && (
            <div className="absolute right-0 mt-2 w-64 rounded-lg border bg-background shadow-lg p-2 z-50">
              <div className="px-3 py-2 border-b mb-1">
                <p className="text-sm font-medium">Notifications</p>
              </div>
              <div className="max-h-[300px] overflow-y-auto">
                {notifications.length > 0 ? (
                  notifications.map(notif => (
                    <div key={notif.id} className="flex gap-2 items-start p-2 hover:bg-muted rounded-md mb-1">
                      <CheckCircle2 className="w-4 h-4 text-primary mt-0.5" />
                      <div>
                        <p className="text-sm">{notif.text}</p>
                        <p className="text-xs text-muted-foreground">{notif.time}</p>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground p-2">No new notifications</p>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Profile */}
        <div className="relative">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setProfileOpen(!profileOpen)}
            className="rounded-full"
          >
            <UserCircle className="w-7 h-7" />
          </Button>

          {/* Profile dropdown */}
          {profileOpen && (
            <div className="absolute right-0 mt-2 w-48 rounded-lg border bg-background shadow-lg p-2 z-50">
              <div className="px-3 py-2 border-b mb-1">
                <p className="text-sm font-medium">User Profile</p>
                <p className="text-xs text-muted-foreground">Logged in user</p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setProfileOpen(false);
                  onLogout();
                }}
                className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm hover:bg-muted text-destructive"
              >
                <LogOut className="h-4 w-4" />
                Logout
              </button>
            </div>
          )}
        </div>

      </div>
    </header>
  );
}