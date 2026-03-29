import React from "react";
import { useGetDashboardMetrics, useGetIntentMetrics, useGetConversations } from "@workspace/api-client-react";
import { MessageSquare, Users, Flame, Brain, ArrowUpRight, Clock, LayoutDashboard, Sparkles, Smartphone, Github, ChevronRight } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1 }
  }
};

const itemVariants = {
  hidden: { y: 20, opacity: 0 },
  visible: { y: 0, opacity: 1, transition: { duration: 0.5, ease: "easeOut" } }
};

export default function Dashboard() {
  const { data: metrics, isLoading: loadingMetrics } = useGetDashboardMetrics();
  const { data: intentsRes } = useGetIntentMetrics();
  const { data: conversationsRes } = useGetConversations({ limit: 5 });

  if (loadingMetrics) {
    return (
      <div className="animate-pulse space-y-12 max-w-7xl mx-auto px-4">
        <div className="h-12 w-64 bg-white/5 rounded-2xl"></div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-44 bg-white/5 rounded-[2.5rem]"></div>
          ))}
        </div>
      </div>
    );
  }

  const m = metrics || {
    totalConversations: 0,
    totalClients: 0,
    hotLeads: 0,
    messagesLast24h: 0,
    avgConfidence: 0,
    topIntent: "-",
  };

  const intentData = intentsRes?.data || [];
  const recentConvos = conversationsRes?.data || [];
  const isEmpty = m.totalConversations === 0 && m.totalClients === 0;

  if (isEmpty) {
    return (
      <motion.div 
        initial="hidden"
        animate="visible"
        variants={containerVariants}
        className="space-y-12 max-w-7xl mx-auto px-4 py-8"
      >
        {/* Welcome Header */}
        <motion.div variants={itemVariants} className="glass-card relative overflow-hidden rounded-[3rem] p-8 sm:p-12 shadow-premium group">
          <div className="absolute -top-24 -right-24 w-96 h-96 bg-primary/10 rounded-full blur-[100px] group-hover:bg-primary/20 transition-all duration-700" />
          <div className="relative z-10">
            <div className="flex flex-col md:flex-row items-start md:items-center gap-6 mb-10">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-emerald-600 flex items-center justify-center shadow-lg shadow-primary/30 animate-float">
                <Sparkles className="text-white" size={32} />
              </div>
              <div>
                <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white tracking-tight italic">
                  ¡Hola! Tu <span className="text-gradient">Bot de Ventas IA</span> está listo
                </h1>
                <p className="text-slate-400 mt-2 text-base sm:text-lg font-medium max-w-2xl">
                  Estamos a unos pocos pasos de automatizar tus ventas en WhatsApp con inteligencia artificial de última generación.
                </p>
              </div>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              {[
                { icon: Smartphone, title: "Vincula WhatsApp", text: "Escanea el QR en segundos", color: "from-emerald-500/10 to-emerald-500/5", border: "emerald-500/20" },
                { icon: Brain, title: "Configura tu IA", text: "Dale una personalidad única", color: "from-blue-500/10 to-blue-500/5", border: "blue-500/20" },
                { icon: Github, title: "GitHub Copilot", text: "Sincronización avanzada", color: "from-purple-500/10 to-purple-500/5", border: "purple-500/20" }
              ].map((step, i) => (
                <div key={i} className={`bg-gradient-to-br ${step.color} border border-${step.border} rounded-3xl p-6 transition-transform hover:scale-[1.02]`}>
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center">
                      <step.icon size={20} className="text-white" />
                    </div>
                    <span className="text-white font-bold text-sm tracking-tight">{step.title}</span>
                  </div>
                  <p className="text-slate-400 text-xs font-medium leading-relaxed">{step.text}</p>
                </div>
              ))}
            </div>
          </div>
        </motion.div>

        {/* Action Call */}
        <motion.div variants={itemVariants} className="text-center py-12">
            <a href="/whatsapp" className="btn-primary group inline-flex items-center gap-3 text-base px-8 py-4">
              Comenzar Configuración <ChevronRight size={20} className="group-hover:translate-x-1 transition-transform" />
            </a>
        </motion.div>
      </motion.div>
    );
  }

  return (
    <motion.div 
      initial="hidden"
      animate="visible"
      variants={containerVariants}
      className="space-y-10 sm:space-y-14 max-w-7xl mx-auto px-4 py-6"
    >
      {/* Header */}
      <motion.div variants={itemVariants} className="relative glass-card overflow-hidden rounded-[3rem] p-10 shadow-premium">
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-primary/5 rounded-full blur-[120px] -mr-48 -mt-48" />
        <div className="relative z-10 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
          <div className="flex items-center gap-5">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary to-emerald-500 flex items-center justify-center shadow-lg shadow-primary/20">
              <LayoutDashboard className="text-white" size={28} />
            </div>
            <div>
              <h1 className="text-2xl sm:text-4xl font-black text-white tracking-tight italic">
                Panel de <span className="text-gradient">Control</span>
              </h1>
              <p className="text-slate-400 mt-1 text-sm sm:text-base font-medium">
                Monitoreo inteligente en tiempo real
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
             <div className="flex items-center gap-2 px-4 py-2 rounded-full glass-morphism border-emerald-500/20">
               <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
               <span className="text-[10px] font-black uppercase tracking-widest text-emerald-300">Conectado</span>
             </div>
          </div>
        </div>
      </motion.div>

      {/* Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-5 lg:gap-8">
        <MetricCard title="Mensajes (24h)" value={m.messagesLast24h} icon={MessageSquare} trend="+18%" color="emerald" delay={0.1} />
        <MetricCard title="Leads Calientes" value={m.hotLeads} icon={Flame} trend="+5%" color="rose" delay={0.2} />
        <MetricCard title="Clientes" value={m.totalClients} icon={Users} color="blue" delay={0.3} />
        <MetricCard title="Precisión IA" value={`${(m.avgConfidence * 100).toFixed(0)}%`} icon={Brain} color="purple" delay={0.4} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 lg:gap-12">
        {/* Intention Chart */}
        <motion.div variants={itemVariants} className="col-span-1 lg:col-span-2 glass-card rounded-[3rem] p-8 sm:p-10 relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-[80px] -mr-32 -mt-32 transition-all group-hover:bg-primary/10" />
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-10">
              <h2 className="text-xl sm:text-2xl font-black flex items-center gap-4 text-white tracking-tight">
                <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center border border-white/10 group-hover:border-primary/30 transition-colors">
                  <Brain className="text-primary" size={24} />
                </div>
                Análisis de Intenciones
              </h2>
            </div>
            
            <div className="h-[400px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={intentData} layout="vertical" margin={{ top: 5, right: 30, left: 40, bottom: 5 }}>
                  <defs>
                    <linearGradient id="barGradient" x1="0" y1="0" x2="1" y2="0">
                      <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.8} />
                      <stop offset="100%" stopColor="#34d399" stopOpacity={1} />
                    </linearGradient>
                  </defs>
                  <XAxis type="number" hide />
                  <YAxis 
                    dataKey="intent" 
                    type="category" 
                    type="category" 
                    stroke="#94a3b8" 
                    fontSize={12} 
                    tickLine={false} 
                    axisLine={false} 
                    width={100}
                    tick={{ fill: "#94a3b8", fontWeight: 600 }}
                  />
                  <Tooltip 
                    cursor={{ fill: "rgba(255, 255, 255, 0.03)" }}
                    contentStyle={{ 
                      backgroundColor: "#0b0f19", 
                      border: "1px solid rgba(255,255,255,0.1)", 
                      borderRadius: "16px", 
                      color: "#f8fafc",
                      fontSize: "12px",
                      fontWeight: "bold",
                      boxShadow: "0 10px 40px rgba(0,0,0,0.5)"
                    }}
                    labelStyle={{ marginBottom: "4px", color: "hsl(var(--primary))" }}
                    itemStyle={{ padding: 0 }}
                  />
                  <Bar dataKey="count" fill="url(#barGradient)" radius={[0, 10, 10, 0]} barSize={24}>
                    {intentData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fillOpacity={1 - (index * 0.1)} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </motion.div>

        {/* Recent Activity */}
        <motion.div variants={itemVariants} className="glass-card rounded-[3rem] p-8 sm:p-10 relative overflow-hidden group">
          <h2 className="text-xl sm:text-2xl font-black mb-10 flex items-center justify-between text-white tracking-tight">
            <span className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center border border-white/10">
                <Clock className="text-primary" size={24} />
              </div>
              Actividad
            </span>
            <ArrowUpRight size={20} className="text-slate-500 group-hover:text-primary transition-colors" />
          </h2>

          <div className="space-y-6 relative z-10">
            {recentConvos.map((convo, i) => (
              <motion.div 
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.5 + (i * 0.1) }}
                key={convo.id} 
                className="flex gap-5 group/item p-4 rounded-2xl hover:bg-white/5 transition-all"
              >
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary/20 to-emerald-500/10 flex items-center justify-center border border-primary/20 shrink-0 group-hover/item:scale-110 transition-transform shadow-[0_0_20px_rgba(16,185,129,0.15)]">
                  <span className="text-primary font-bold text-xs">{(convo.clientName || "C").charAt(0)}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <p className="font-bold text-sm text-white truncate mr-2">{convo.clientName || convo.clientPhone}</p>
                    <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">{formatDistanceToNow(new Date(convo.updatedAt), { addSuffix: true, locale: es }).replace('hace ', '')}</span>
                  </div>
                  <p className="text-xs text-slate-400 font-medium line-clamp-1 leading-relaxed">{convo.lastMessage}</p>
                </div>
              </motion.div>
            ))}
            {recentConvos.length === 0 && (
              <div className="text-center py-20 opacity-40">
                <MessageSquare className="mx-auto mb-4" size={40} />
                <p className="text-xs font-black uppercase tracking-widest">Sin actividad</p>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
}

function MetricCard({ title, value, icon: Icon, trend, color, delay = 0 }: any) {
  const colors: any = {
    emerald: "from-emerald-500 to-emerald-700",
    rose: "from-rose-500 to-rose-700",
    blue: "from-blue-500 to-blue-700",
    purple: "from-purple-500 to-purple-700",
  };
  const c = colors[color] || colors.emerald;

  return (
    <motion.div 
      variants={itemVariants}
      whileHover={{ y: -5 }}
      className="glass-card rounded-[2.5rem] p-6 lg:p-8 relative overflow-hidden group/card shadow-premium"
    >
      <div className={`absolute -right-12 -top-12 w-32 h-32 bg-gradient-to-br ${c} rounded-full blur-[60px] opacity-10 group-hover/card:opacity-20 transition-opacity`} />
      
      <div className="flex justify-between items-start mb-6">
        <p className="text-slate-400 font-black uppercase tracking-widest text-[10px] sm:text-[11px] leading-tight max-w-[70%]">{title}</p>
        <div className={cn("p-3 rounded-2xl bg-gradient-to-br shadow-xl group-hover/card:scale-110 transition-transform", c)}>
          <Icon size={22} className="text-white" strokeWidth={2.5} />
        </div>
      </div>

      <div className="flex items-end gap-3">
        <h3 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white tracking-tighter">{value}</h3>
        {trend && (
          <span className={cn("text-[10px] font-black tracking-widest px-2 py-0.5 rounded-lg bg-white/10 text-white backdrop-blur-md mb-2")}>
            {trend}
          </span>
        )}
      </div>
    </motion.div>
  );
}

