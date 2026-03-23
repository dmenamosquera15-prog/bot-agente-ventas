import React, { useEffect, useState } from "react";
import { Link, useLocation } from "wouter";
import { motion } from "framer-motion";
import {
  LayoutDashboard, MessageSquare, Users, Package, Bot, Settings,
  Menu, X, Smartphone, MessagesSquare, ChevronRight, Upload, Cpu, BrainCircuit, Github,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface WaStatus { connected: boolean; phone: string | null; }

const NAV = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/whatsapp", label: "WhatsApp", icon: Smartphone },
  { href: "/chat", label: "Probar Bot", icon: MessagesSquare },
  { href: "/conversations", label: "Conversaciones", icon: MessageSquare },
  { href: "/clients", label: "Clientes", icon: Users },
  { label: "─", divider: true },
  { href: "/products", label: "Productos", icon: Package },
  { href: "/products/import", label: "Importar Productos", icon: Upload, indent: true },
  { href: "/agents/edit", label: "Agentes IA", icon: Bot },
  { href: "/ai-providers", label: "Proveedores IA", icon: Cpu },
  { href: "/git-sync", label: "GitHub Sync", icon: Github },
  { label: "─", divider: true },
  { href: "/config", label: "Configuración", icon: Settings },
];

export function Layout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const [open, setOpen] = useState(false);
  const [wa, setWa] = useState<WaStatus>({ connected: false, phone: null });

  useEffect(() => {
    const poll = async () => {
      try { const r = await fetch("/api/whatsapp/status"); const d = await r.json(); setWa({ connected: d.connected, phone: d.phone }); } catch { /* ignore */ }
    };
    poll();
    const id = setInterval(poll, 5000);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="flex min-h-screen bg-background text-foreground">
      <button className="lg:hidden fixed top-4 right-4 z-50 p-2 bg-card border border-border rounded-lg shadow-lg" onClick={() => setOpen(!open)}>
        {open ? <X size={20} /> : <Menu size={20} />}
      </button>

      <aside className={cn("fixed inset-y-0 left-0 z-40 flex flex-col bg-card border-r border-border/50 shadow-xl transition-transform duration-300 lg:translate-x-0", open ? "translate-x-0" : "-translate-x-full")} style={{ width: 256 }}>
        {/* Brand */}
        <div className="p-5 flex items-center gap-3 border-b border-border/50 shrink-0">
          <div className="w-8 h-8 rounded-xl bg-[#25D366] flex items-center justify-center">
            <BrainCircuit className="text-white" size={18} />
          </div>
          <div>
            <h1 className="font-bold text-sm text-foreground leading-none">Bot Inteligente</h1>
            <p className="text-[10px] text-[#25D366] uppercase tracking-widest mt-0.5">Panel de Control</p>
          </div>
        </div>

        {/* WA Status */}
        <div className="px-3 pt-3 shrink-0">
          <Link href="/whatsapp">
            <div className={cn("flex items-center gap-2 px-3 py-2 rounded-xl border text-xs font-medium cursor-pointer transition-colors", wa.connected ? "bg-[#25D366]/10 border-[#25D366]/30 text-[#25D366]" : "bg-muted/30 border-border text-muted-foreground hover:text-foreground")}>
              <span className={cn("w-2 h-2 rounded-full shrink-0", wa.connected ? "bg-[#25D366] animate-pulse" : "bg-muted-foreground")} />
              <span className="truncate">{wa.connected ? `Conectado${wa.phone ? " · +" + wa.phone : ""}` : "WhatsApp · Conectar"}</span>
              <ChevronRight size={11} className="ml-auto shrink-0" />
            </div>
          </Link>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-3 space-y-0.5 overflow-y-auto">
          {NAV.map((item, i) => {
            if ("divider" in item) return <div key={i} className="my-2 border-t border-border/40" />;
            const isActive = location === item.href || (item.href !== "/" && location.startsWith(item.href));
            return (
              <Link key={item.href} href={item.href}>
                <div onClick={() => setOpen(false)} className={cn(
                  "flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm font-medium transition-all cursor-pointer relative",
                  "indent" in item && item.indent ? "ml-3 text-xs" : "",
                  isActive ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-secondary/60 hover:text-foreground"
                )}>
                  {isActive && <motion.div layoutId="nav-bar" className="absolute left-0 w-1 h-4 bg-primary rounded-r-full" transition={{ type: "spring", stiffness: 400, damping: 30 }} />}
                  <item.icon size={"indent" in item && item.indent ? 14 : 16} />
                  {item.label}
                  {item.href === "/whatsapp" && wa.connected && <span className="ml-auto w-1.5 h-1.5 rounded-full bg-[#25D366]" />}
                </div>
              </Link>
            );
          })}
        </nav>
      </aside>

      <main className="flex-1 lg:ml-[256px] min-h-screen">
        <div className="p-6 md:p-8 max-w-7xl mx-auto">
          <motion.div key={location} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }}>
            {children}
          </motion.div>
        </div>
      </main>
    </div>
  );
}
