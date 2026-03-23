import React, { useEffect, useState } from "react";
import { Link, useLocation } from "wouter";
import { motion } from "framer-motion";
import {
  LayoutDashboard, MessageSquare, Users, Package, Bot, Settings,
  Menu, X, Smartphone, MessagesSquare, ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface WaStatus { connected: boolean; phone: string | null; }

const NAV_ITEMS = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/whatsapp", label: "WhatsApp", icon: Smartphone },
  { href: "/chat", label: "Probar Bot", icon: MessagesSquare },
  { href: "/conversations", label: "Conversaciones", icon: MessageSquare },
  { href: "/clients", label: "Clientes", icon: Users },
  { href: "/products", label: "Productos", icon: Package },
  { href: "/agents", label: "Agentes IA", icon: Bot },
  { href: "/config", label: "Configuración", icon: Settings },
];

export function Layout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [waStatus, setWaStatus] = useState<WaStatus>({ connected: false, phone: null });

  useEffect(() => {
    const poll = async () => {
      try {
        const r = await fetch("/api/whatsapp/status");
        const d = await r.json();
        setWaStatus({ connected: d.connected, phone: d.phone });
      } catch { /* ignore */ }
    };
    poll();
    const id = setInterval(poll, 5000);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="flex min-h-screen bg-background text-foreground">
      <button
        className="lg:hidden fixed top-4 right-4 z-50 p-2 bg-card border border-border rounded-lg shadow-lg"
        onClick={() => setIsMobileOpen(!isMobileOpen)}
      >
        {isMobileOpen ? <X size={22} /> : <Menu size={22} />}
      </button>

      <aside className={cn(
        "fixed inset-y-0 left-0 z-40 w-68 bg-card border-r border-border/50 flex flex-col shadow-xl transition-transform duration-300 lg:translate-x-0",
        isMobileOpen ? "translate-x-0" : "-translate-x-full"
      )} style={{ width: 260 }}>
        {/* Brand */}
        <div className="p-5 flex items-center gap-3 border-b border-border/50">
          <div className="w-9 h-9 rounded-xl bg-[#25D366] flex items-center justify-center shadow-lg shadow-[#25D366]/30">
            <Bot className="text-white" size={20} />
          </div>
          <div>
            <h1 className="font-bold text-base text-foreground leading-none">Bot Inteligente</h1>
            <p className="text-[10px] text-[#25D366] font-semibold uppercase tracking-widest mt-0.5">Panel de Control</p>
          </div>
        </div>

        {/* WhatsApp status pill */}
        <div className="mx-4 mt-4">
          <Link href="/whatsapp">
            <div className={cn(
              "flex items-center gap-2 px-3 py-2 rounded-xl border text-xs font-medium cursor-pointer transition-colors",
              waStatus.connected
                ? "bg-[#25D366]/10 border-[#25D366]/30 text-[#25D366]"
                : "bg-muted border-border text-muted-foreground hover:text-foreground"
            )}>
              <span className={cn("w-2 h-2 rounded-full", waStatus.connected ? "bg-[#25D366] animate-pulse" : "bg-muted-foreground")} />
              {waStatus.connected
                ? `Conectado ${waStatus.phone ? "· +" + waStatus.phone : ""}`
                : "WhatsApp desconectado · Conectar"}
              <ChevronRight size={12} className="ml-auto" />
            </div>
          </Link>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {NAV_ITEMS.map((item) => {
            const isActive = location === item.href || (item.href !== "/" && location.startsWith(item.href));
            return (
              <Link key={item.href} href={item.href}>
                <div
                  onClick={() => setIsMobileOpen(false)}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all cursor-pointer group relative",
                    isActive
                      ? "bg-primary/10 text-primary"
                      : "text-muted-foreground hover:bg-secondary/60 hover:text-foreground"
                  )}
                >
                  {isActive && (
                    <motion.div
                      layoutId="nav-indicator"
                      className="absolute left-0 w-1 h-5 bg-primary rounded-r-full"
                      transition={{ type: "spring", stiffness: 350, damping: 30 }}
                    />
                  )}
                  <item.icon size={17} />
                  {item.label}
                  {item.href === "/whatsapp" && waStatus.connected && (
                    <span className="ml-auto w-2 h-2 rounded-full bg-[#25D366]" />
                  )}
                </div>
              </Link>
            );
          })}
        </nav>
      </aside>

      {/* Main */}
      <main className="flex-1 lg:ml-[260px] min-h-screen">
        <div className="p-6 md:p-8 max-w-7xl mx-auto w-full">
          <motion.div
            key={location}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25 }}
          >
            {children}
          </motion.div>
        </div>
      </main>
    </div>
  );
}
