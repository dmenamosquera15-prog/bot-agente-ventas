import React, { useEffect, useState } from "react";
import { Link, useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard,
  MessageSquare,
  Users,
  Package,
  Bot,
  Settings,
  Menu,
  X,
  Smartphone,
  MessagesSquare,
  ChevronRight,
  Upload,
  Cpu,
  BrainCircuit,
  Github,
  Sparkle,
  Crown,
  Receipt,
  Download,
  Wifi,
  WifiOff
} from "lucide-react";
import { cn } from "@/lib/utils";

interface WaStatus {
  connected: boolean;
  phone: string | null;
}

const NAV = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/chat", label: "Chat", icon: MessagesSquare },
  { href: "/whatsapp", label: "WhatsApp", icon: Smartphone },
  { label: "─", divider: true },
  { href: "/clients", label: "Clientes", icon: Users },
  { href: "/products", label: "Productos", icon: Package },
  { href: "/conversations", label: "Conversaciones", icon: MessageSquare },
  { label: "─", divider: true },
  {
    href: "/github-copilot",
    label: "GitHub Copilot",
    icon: BrainCircuit,
    featured: true,
  },
  { label: "─", divider: true },
  { href: "/agents", label: "Agentes", icon: Bot },
  { href: "/ai-providers", label: "Proveedores IA", icon: Cpu },
  { href: "/config", label: "Configuración", icon: Settings },
  { label: "─", divider: true },
  { action: "logout", label: "Cerrar Sesión", icon: X },
];

const MOBILE_BOTTOM_NAV = [
  { href: "/", label: "Inicio", icon: LayoutDashboard },
  { href: "/chat", label: "Chat", icon: MessagesSquare },
  { href: "/whatsapp", label: "WhatsApp", icon: Smartphone },
  { href: "/clients", label: "Clientes", icon: Users },
  { href: "/products", label: "Productos", icon: Package },
  { href: "/conversations", label: "Conversaciones", icon: MessageSquare },
  { href: "/agents", label: "Agentes", icon: Bot },
  { href: "/config", label: "Ajustes", icon: Settings },
];

export function Layout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [wa, setWa] = useState<WaStatus>({ connected: false, phone: null });
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);

  useEffect(() => {
    const poll = async () => {
      try {
        const r = await fetch("/api/whatsapp/status");
        const d = await r.json();
        setWa({ connected: d.connected, phone: d.phone });
      } catch { /* ignore */ }
    };
    poll();
    const id = setInterval(poll, 5000);

    const handleBeforeInstallPrompt = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    return () => {
      clearInterval(id);
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === "accepted") {
      setDeferredPrompt(null);
    }
  };

  return (
    <div className="flex min-h-screen bg-[#0f1724] text-slate-100 selection:bg-emerald-500/30 font-sans overflow-x-hidden">
      {/* PWA / Native Elements Support */}
      <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=0, viewport-fit=cover" />

      {/* Animated Background Gradient - Softer and more professional */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute top-[-20%] left-[-10%] w-[80%] h-[80%] bg-gradient-to-br from-emerald-600/6 via-emerald-500/3 to-transparent rounded-full blur-[150px]" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[80%] h-[80%] bg-gradient-to-tl from-blue-600/6 via-blue-500/3 to-transparent rounded-full blur-[150px]" />
        <div className="absolute top-[40%] left-[50%] -translate-x-1/2 w-[60%] h-[60%] bg-violet-600/4 rounded-full blur-[120px]" />
      </div>

      {/* MOBILE TOP BAR - Premium Design */}
      <div className="lg:hidden fixed top-0 left-0 right-0 h-[80px] bg-[#0f1724]/90 backdrop-blur-2xl border-b border-white/10 z-40 px-5 flex items-center justify-between shadow-[0_8px_32px_rgba(0,0,0,0.4)]">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-emerald-400 via-emerald-500 to-emerald-700 flex items-center justify-center text-xl shadow-[0_4px_20px_rgba(16,185,129,0.4)] text-slate-950 font-black transform transition-transform hover:scale-105">
            B
          </div>
          <div>
            <h1 className="font-black text-base text-white tracking-tight uppercase italic leading-tight">
              BotVentas <span className="text-emerald-400">IA</span>
            </h1>
            <p className="text-[8px] text-slate-400 font-bold tracking-[0.2em] -mt-0.5">DASHBOARD</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className={cn(
            "flex items-center gap-2 px-3.5 py-2 rounded-full text-[9px] font-black uppercase tracking-widest border transition-all shadow-lg min-w-[80px] justify-center",
            wa.connected
              ? "bg-emerald-500/20 border-emerald-500/40 text-emerald-200 shadow-[0_0_20px_rgba(16,185,129,0.2)]"
              : "bg-red-500/20 border-red-500/40 text-red-200 shadow-[0_0_20px_rgba(239,68,68,0.2)]"
          )}>
            <div className={cn(
              "w-2 h-2 rounded-full animate-pulse",
              wa.connected ? "bg-emerald-400" : "bg-red-400"
            )} />
            {wa.connected ? "ONLINE" : "OFFLINE"}
          </div>
          <button onClick={() => setSidebarOpen(true)} className="text-slate-200 p-2.5 hover:bg-white/10 rounded-xl transition-all active:scale-95">
            <Menu size={22} />
          </button>
        </div>
      </div>

      {/* SIDEBAR (Desktop & Mobile Drawer) */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden fixed inset-0 bg-black/70 backdrop-blur-sm z-40"
          />
        )}
      </AnimatePresence>

      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex flex-col bg-[#0b1220]/95 backdrop-blur-2xl border-r border-white/10 shadow-[8px_0_32px_rgba(0,0,0,0.4)] transition-all duration-500 ease-in-out lg:translate-x-0 w-[300px]",
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        {/* Brand */}
        <div className="p-6 flex items-center gap-4 border-b border-white/5 shrink-0 hidden lg:flex relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/5 to-blue-500/5" />
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-400 via-emerald-500 to-emerald-700 flex items-center justify-center text-2xl shadow-[0_4px_20px_rgba(16,185,129,0.3)] text-slate-950 font-black transform hover:scale-105 transition-transform">
            🤖
          </div>
          <div className="relative z-10">
            <h1 className="font-black text-lg text-white leading-none tracking-tight italic">
              BotVentas <span className="text-emerald-400">IA</span>
            </h1>
            <p className="text-[9px] text-emerald-400/80 uppercase font-black tracking-[0.25em] mt-2">
              PRO PANEL
            </p>
          </div>
        </div>

        {/* Mobile Sidebar Close */}
        <div className="lg:hidden p-6 flex items-center justify-between border-b border-white/5 bg-gradient-to-r from-emerald-500/5 to-transparent">
           <span className="font-black italic text-emerald-400 tracking-widest text-xs uppercase">Menú Principal</span>
           <button onClick={() => setSidebarOpen(false)} className="p-2.5 bg-white/5 hover:bg-white/10 rounded-xl transition-all">
              <X size={20} />
           </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-6 space-y-1 overflow-y-auto scrollbar-hide pb-20 lg:pb-6">
          {NAV.map((item, i) => {
            if ("divider" in item)
              return (
                <div
                  key={i}
                  className="my-5 mx-4 border-t border-white/5 relative"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/5 to-transparent opacity-0 hover:opacity-100 transition-opacity" />
                </div>
              );

            if ("action" in item && item.action === "logout") {
              return (
                <button
                  key="logout"
                  onClick={() => {
                    localStorage.clear();
                    window.location.href = "/landing";
                  }}
                  className="w-full flex items-center gap-3 px-4 py-3.5 rounded-xl text-sm font-bold text-slate-500 hover:bg-red-500/10 hover:text-red-400 transition-all active:scale-[0.98] group"
                >
                  <X size={18} className="group-hover:scale-110 transition-transform" />
                  {item.label}
                </button>
              );
            }

            const isActive = item.href && (location === item.href || (item.href !== "/" && location.startsWith(item.href)));

            return item.href ? (
              <Link key={item.href} href={item.href}>
                <div
                  onClick={() => setSidebarOpen(false)}
                  className={cn(
                    "flex items-center gap-3 px-4 py-3.5 rounded-xl text-sm font-bold transition-all cursor-pointer relative group leading-none",
                    "indent" in item && item.indent ? "ml-4 text-xs opacity-70" : "",
                    isActive
                      ? "bg-gradient-to-r from-emerald-500/20 to-emerald-500/10 text-emerald-200 border border-emerald-500/30 shadow-[0_0_20px_rgba(16,185,129,0.15)]"
                      : "text-slate-300 hover:text-white hover:bg-white/[0.05] border border-transparent"
                  )}
                >
                  {isActive && (
                    <motion.div
                      layoutId="activeTab"
                      className="absolute inset-0 bg-gradient-to-r from-emerald-500/10 to-transparent rounded-xl -z-10"
                      initial={false}
                      transition={{ type: "spring", stiffness: 300, damping: 30 }}
                    />
                  )}
                  <item.icon
                    size={18}
                    className={cn(
                      "transition-all duration-300",
                      isActive
                        ? "text-emerald-300 scale-110"
                        : "text-slate-500 group-hover:text-slate-300"
                    )}
                    strokeWidth={isActive ? 2.5 : 2}
                  />
                  <span className="flex-1">{item.label}</span>
                  {isActive && (
                    <ChevronRight size={16} className="text-emerald-300 opacity-0 group-hover:opacity-100 transition-all transform group-hover:translate-x-1" />
                  )}
                </div>
              </Link>
            ) : null;
          })}
        </nav>

        {/* Desktop Install Prompt */}
        {deferredPrompt && (
          <div className="hidden lg:block p-4 mt-auto">
             <button 
              onClick={handleInstallClick}
              className="w-full flex items-center justify-center gap-3 p-4 bg-emerald-600 text-white rounded-2xl font-black uppercase tracking-widest text-[10px] shadow-2xl shadow-emerald-500/20 hover:bg-emerald-500 transition-all"
             >
                <Download size={16} />
                Instalar App Desktop
             </button>
          </div>
        )}
      </aside>

      {/* MOBILE BOTTOM NAVIGATION (Tab Bar) - Premium */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 h-[88px] bg-[#0b1220]/95 backdrop-blur-2xl border-t border-white/10 z-40 px-2 pb-[env(safe-area-inset-bottom)] shadow-[0_-8px_32px_rgba(0,0,0,0.4)]">
        <div className="flex items-center justify-around h-full">
          {MOBILE_BOTTOM_NAV.map((item) => {
            const isActive = location === item.href;
            return (
              <Link key={item.href} href={item.href}>
                <div className={cn(
                  "flex flex-col items-center gap-1.5 transition-all relative px-4 py-2.5 rounded-2xl group",
                  isActive ? "text-emerald-300" : "text-slate-400 hover:text-slate-200"
                )}>
                  {isActive && (
                    <motion.div
                      layoutId="bottomTab"
                      className="absolute -top-3 w-14 h-1 bg-gradient-to-r from-emerald-400 via-emerald-500 to-emerald-600 rounded-full shadow-[0_0_15px_rgba(16,185,129,0.5)]"
                      initial={false}
                      transition={{ type: "spring", stiffness: 500, damping: 30 }}
                    />
                  )}
                  <div className={cn(
                    "p-2 rounded-xl transition-all duration-300",
                    isActive
                      ? "bg-gradient-to-br from-emerald-500/25 to-emerald-500/10 scale-110 shadow-lg shadow-emerald-500/20"
                      : "group-hover:bg-white/[0.02]"
                  )}>
                    <item.icon
                      size={22}
                      strokeWidth={isActive ? 2.5 : 2}
                      className={cn("transition-all", isActive ? "scale-105" : "")}
                    />
                  </div>
                  <span className="text-[9px] font-black uppercase tracking-[0.15em]">{item.label}</span>
                </div>
              </Link>
            )
          })}
        </div>
      </nav>

      <main className={cn(
        "flex-1 lg:ml-[300px] min-h-screen relative z-10 transition-all duration-300",
        "pt-[80px] lg:pt-0"
      )}>
        <div className="p-4 md:p-8 lg:p-12 max-w-7xl mx-auto pb-[100px] lg:pb-12">
          <motion.div
            key={location}
            initial={{ opacity: 0, scale: 0.98, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.4, ease: "easeOut" }}
          >
            {children}
          </motion.div>
        </div>
      </main>
    </div>
  );
}
