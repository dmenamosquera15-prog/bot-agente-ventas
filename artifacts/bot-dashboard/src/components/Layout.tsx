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
  { href: "/whatsapp", label: "WhatsApp", icon: Smartphone },
  { href: "/chat", label: "Probar Bot", icon: MessagesSquare },
  { href: "/conversations", label: "Conversaciones", icon: MessageSquare },
  { href: "/clients", label: "Clientes", icon: Users },
  { label: "─", divider: true },
  { href: "/products", label: "Productos", icon: Package },
  {
    href: "/products/import",
    label: "Importar Productos",
    icon: Upload,
    indent: true,
  },
  { href: "/agents/edit", label: "Agentes IA", icon: Bot },
  { href: "/ai-providers", label: "Proveedores IA", icon: Cpu },
  {
    href: "/github-copilot",
    label: "GitHub Copilot",
    icon: BrainCircuit,
    indent: true,
  },
  { href: "/admin-copilot", label: "Admin Co-Pilot", icon: Sparkle },
  { href: "/git-sync", label: "GitHub Sync", icon: Github },
  { label: "─", divider: true },
  { href: "/membership", label: "Membresía", icon: Crown },
  { href: "/billing", label: "Facturación", icon: Receipt },
  { href: "/config", label: "Configuración", icon: Settings },
  { label: "─", divider: true },
  { action: "logout", label: "Cerrar Sesión", icon: X },
];

const MOBILE_BOTTOM_NAV = [
  { href: "/", label: "Inicio", icon: LayoutDashboard },
  { href: "/whatsapp", label: "WhatsApp", icon: Smartphone },
  { href: "/products", label: "Catálogo", icon: Package },
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
    <div className="flex min-h-screen bg-[#020617] text-slate-200 selection:bg-emerald-500/30 font-sans overflow-x-hidden">
      {/* PWA / Native Elements Support */}
      <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=0, viewport-fit=cover" />
      
      {/* Background Glows */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute top-[-10%] left-[-10%] w-[70%] h-[70%] bg-emerald-500/5 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[70%] h-[70%] bg-blue-500/5 rounded-full blur-[120px]" />
      </div>

      {/* MOBILE TOP BAR (Native Look) - Improved spacing */}
      <div className="lg:hidden fixed top-0 left-0 right-0 h-[72px] bg-[#020617]/90 backdrop-blur-3xl border-b border-white/10 z-40 px-5 flex items-center justify-between shadow-2xl">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center text-lg shadow-lg shadow-emerald-500/30 text-slate-950 font-black">
            B
          </div>
          <div>
            <h1 className="font-black text-base text-white tracking-tight uppercase italic leading-tight">
              BotVentas <span className="text-emerald-400">IA</span>
            </h1>
            <p className="text-[8px] text-slate-400 font-bold tracking-wider -mt-0.5">Panel de Control</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className={cn(
            "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest border transition-all shadow-lg",
            wa.connected ? "bg-emerald-500/20 border-emerald-500/40 text-emerald-300 shadow-emerald-500/10" : "bg-red-500/20 border-red-500/40 text-red-300 shadow-red-500/10"
          )}>
            {wa.connected ? <Wifi size={12} /> : <WifiOff size={12} />}
            {wa.connected ? "Online" : "Offline"}
          </div>
          <button onClick={() => setSidebarOpen(true)} className="text-slate-300 p-2 hover:bg-white/10 rounded-xl transition-all">
            <Menu size={24} />
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
            className="lg:hidden fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
          />
        )}
      </AnimatePresence>

      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex flex-col bg-slate-950/80 backdrop-blur-3xl border-r border-white/5 shadow-2xl transition-all duration-500 ease-in-out lg:translate-x-0 w-[280px]",
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        {/* Brand */}
        <div className="p-8 flex items-center gap-4 border-b border-white/5 shrink-0 hidden lg:flex">
          <div className="w-10 h-10 rounded-2xl bg-emerald-500 flex items-center justify-center text-xl shadow-lg shadow-emerald-500/20 text-slate-950">
            🤖
          </div>
          <div>
            <h1 className="font-black text-lg text-white leading-none tracking-tight italic">
              BotVentas <span className="text-emerald-500">IA</span>
            </h1>
            <p className="text-[10px] text-emerald-500 uppercase font-black tracking-[0.2em] mt-1.5 opacity-80">
              PRO PANEL
            </p>
          </div>
        </div>

        {/* Mobile Sidebar Close */}
        <div className="lg:hidden p-8 flex items-center justify-between border-b border-white/5">
           <span className="font-black italic text-emerald-500 tracking-widest text-xs uppercase">Menú Principal</span>
           <button onClick={() => setSidebarOpen(false)} className="p-2 bg-white/5 rounded-xl">
              <X size={20} />
           </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-4 py-8 space-y-1 overflow-y-auto scrollbar-hide pb-20 lg:pb-8">
          {NAV.map((item, i) => {
            if ("divider" in item)
              return <div key={i} className="my-6 mx-4 border-t border-white/5" />;
            
            if ("action" in item && item.action === "logout") {
              return (
                <button
                  key="logout"
                  onClick={() => {
                    localStorage.clear();
                    window.location.href = "/landing";
                  }}
                  className="w-full flex items-center gap-3 px-5 py-3.5 rounded-2xl text-sm font-bold text-slate-500 hover:bg-red-500/10 hover:text-red-400 transition-all active:scale-95"
                >
                  <X size={18} />
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
                    "flex items-center gap-3 px-5 py-3.5 rounded-2xl text-sm font-bold transition-all cursor-pointer relative group leading-none",
                    "indent" in item && item.indent ? "ml-5 text-xs opacity-70" : "",
                    isActive
                      ? "bg-emerald-600/15 text-emerald-400 border border-emerald-500/20"
                      : "text-slate-500 hover:text-white hover:bg-white/5 border border-transparent"
                  )}
                >
                  {isActive && (
                    <motion.div 
                      layoutId="activeTab"
                      className="absolute inset-0 bg-emerald-500/10 rounded-2xl -z-10"
                    />
                  )}
                  <item.icon size={18} className={cn("transition-transform group-hover:scale-110", isActive ? "text-emerald-400" : "text-slate-600")} />
                  {item.label}
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

      {/* MOBILE BOTTOM NAVIGATION (Tab Bar) - Improved spacing */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 h-[84px] bg-slate-950/90 backdrop-blur-3xl border-t border-white/10 z-40 px-2 pb-[env(safe-area-inset-bottom)] shadow-2xl">
        <div className="flex items-center justify-around h-full">
          {MOBILE_BOTTOM_NAV.map((item) => {
            const isActive = location === item.href;
            return (
              <Link key={item.href} href={item.href}>
                <div className={cn(
                  "flex flex-col items-center gap-1 transition-all relative px-3 py-2 rounded-2xl",
                  isActive ? "text-emerald-400 bg-emerald-500/10" : "text-slate-500 hover:text-slate-300"
                )}>
                  {isActive && (
                    <motion.div
                      layoutId="bottomTab"
                      className="absolute -top-2 w-12 h-1 bg-gradient-to-r from-emerald-400 to-emerald-600 rounded-full shadow-lg shadow-emerald-500/30"
                    />
                  )}
                  <div className={cn("p-1 rounded-xl transition-all", isActive ? "bg-emerald-500/20" : "")}>
                    <item.icon size={20} strokeWidth={isActive ? 2.5 : 2} />
                  </div>
                  <span className="text-[9px] font-black uppercase tracking-wider">{item.label}</span>
                </div>
              </Link>
            )
          })}
        </div>
      </nav>

      <main className={cn(
        "flex-1 lg:ml-[280px] min-h-screen relative z-10 transition-all duration-300",
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
