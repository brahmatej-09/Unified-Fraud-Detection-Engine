import { Link, useLocation } from "react-router-dom";
import { LayoutDashboard, FileText, ScanText, History } from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { name: "Dashboard", href: "/", icon: LayoutDashboard },
  { name: "Analysis", href: "/analysis", icon: FileText },
  { name: "OCR", href: "/ocr", icon: ScanText },
  { name: "History", href: "/history", icon: History },
];

export default function Sidebar() {
  const location = useLocation();

  return (
    <aside className="w-64 border-r bg-background h-screen sticky top-0 flex flex-col">
      <div className="p-6 border-b">
        <h1 className="text-2xl font-bold tracking-tight text-primary">BNP Fraud</h1>
        <p className="text-sm text-muted-foreground">Detection Engine</p>
      </div>
      
      <nav className="flex-1 p-4 space-y-1">
        {navItems.map((item) => {
          const isActive = location.pathname === item.href;
          const Icon = item.icon;
          
          return (
            <Link
              key={item.name}
              to={item.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors",
                isActive 
                  ? "bg-primary text-primary-foreground" 
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              <Icon className="w-4 h-4" />
              {item.name}
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t text-xs text-muted-foreground text-center">
        &copy; 2026 BNP Paribas
      </div>
    </aside>
  );
}
