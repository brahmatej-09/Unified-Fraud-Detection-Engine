import { Outlet } from "react-router-dom";
import Sidebar from "@/components/Sidebar";
import Header from "@/components/Header";

export default function MainLayout({ onLogout }) {
  return (
    <div className="flex h-screen bg-muted/20">
      <Sidebar />

      <div className="flex-1 flex flex-col overflow-hidden">
        <Header onLogout={onLogout} />

        <main className="flex-1 overflow-y-auto p-6">
          <div className="max-w-7xl mx-auto">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}