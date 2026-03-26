import React from "react";
import { useGetDashboardMetrics, useGetIntentMetrics, useGetConversations } from "@workspace/api-client-react";
import { MessageSquare, Users, Flame, Brain, ArrowUpRight, Clock } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";
import { cn } from "@/lib/utils";

export default function Dashboard() {
  const { data: metrics, isLoading: loadingMetrics } = useGetDashboardMetrics();
  const { data: intentsRes } = useGetIntentMetrics();
  const { data: conversationsRes } = useGetConversations({ limit: 5 });

  if (loadingMetrics) {
    return (
      <div className="animate-pulse space-y-12">
        <div className="h-12 w-64 bg-white/5 rounded-2xl"></div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-40 bg-white/5 rounded-[2rem]"></div>
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

  return (
    <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-1000">
      <div>
        <h1 className="text-5xl font-black text-white tracking-tight italic">
          Resumen <span className="text-emerald-500">General.</span>
        </h1>
        <p className="text-slate-400 mt-3 text-xl font-medium">
          Monitorea el rendimiento de tu inteligencia de ventas en tiempo real.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
        <MetricCard
          title="Conversaciones (24h)"
          value={m.messagesLast24h}
          icon={MessageSquare}
          trend="+12%"
          color="emerald"
        />
        <MetricCard
          title="Leads Calientes"
          value={m.hotLeads}
          icon={Flame}
          trend="+4%"
          color="rose"
        />
        <MetricCard
          title="Clientes Totales"
          value={m.totalClients}
          icon={Users}
          color="blue"
        />
        <MetricCard
          title="Confianza IA"
          value={`${(m.avgConfidence * 100).toFixed(0)}%`}
          icon={Brain}
          color="purple"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Chart */}
        <div className="col-span-1 lg:col-span-2 bg-white/[0.03] backdrop-blur-3xl border border-white/10 rounded-[2.5rem] p-10 shadow-2xl relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/5 rounded-full blur-[80px] -mr-32 -mt-32 transition-all group-hover:bg-emerald-500/10" />
          <h2 className="text-2xl font-black mb-10 flex items-center gap-3 text-white tracking-tight">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 flex items-center justify-center">
              <Brain className="text-emerald-400" size={22} />
            </div>
            Distribución de Intenciones
          </h2>
          <div className="h-[350px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={intentData}
                margin={{ top: 0, right: 0, left: -20, bottom: 0 }}
              >
                <XAxis
                  dataKey="intent"
                  stroke="#475569"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                  fontFamily="Inter"
                  fontWeight={600}
                />
                <YAxis
                  stroke="#475569"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                />
                <Tooltip
                  cursor={{ fill: "rgba(16, 185, 129, 0.05)" }}
                  contentStyle={{
                    backgroundColor: "#0f172a",
                    border: "1px solid rgba(255,255,255,0.1)",
                    borderRadius: "16px",
                    boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1)",
                  }}
                />
                <Bar dataKey="count" radius={[8, 8, 0, 0]}>
                  {intentData.map((_, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={index === 0 ? "#10b981" : "#334155"}
                      className="hover:opacity-80 transition-opacity"
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-white/[0.03] backdrop-blur-3xl border border-white/10 rounded-[2.5rem] p-10 shadow-2xl relative overflow-hidden group">
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-emerald-500/5 rounded-full blur-[80px] -ml-32 -mb-32 transition-all group-hover:bg-emerald-500/10" />
          <h2 className="text-2xl font-black mb-10 flex items-center justify-between text-white tracking-tight">
            <span className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/20 flex items-center justify-center">
                <Clock className="text-emerald-400" size={22} />
              </div>
              Actividad
            </span>
            <ArrowUpRight size={24} className="text-slate-600 group-hover:text-emerald-400 transition-colors" />
          </h2>

          <div className="space-y-8 relative z-10">
            {recentConvos.map((convo) => (
              <div key={convo.id} className="flex gap-5 group/item">
                <div className="w-2.5 h-2.5 mt-2.5 rounded-full bg-emerald-500/30 group-hover/item:bg-emerald-500 transition-all group-hover/item:scale-125 shrink-0 shadow-[0_0_10px_rgba(16,185,129,0.3)]" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1.5">
                    <p className="font-black text-sm text-white truncate mr-2">
                      {convo.clientName || convo.clientPhone}
                    </p>
                    <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest whitespace-nowrap">
                      {formatDistanceToNow(new Date(convo.updatedAt), {
                        addSuffix: true,
                        locale: es,
                      }).replace('hace ', '')}
                    </span>
                  </div>
                  <p className="text-sm text-slate-400 font-medium line-clamp-1 group-hover/item:text-slate-300 transition-colors">
                    {convo.lastMessage}
                  </p>
                </div>
              </div>
            ))}
            {recentConvos.length === 0 && (
              <div className="text-center py-10">
                <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mx-auto mb-4">
                   <MessageSquare className="text-slate-600" />
                </div>
                <p className="text-sm text-slate-500 font-bold uppercase tracking-widest">
                  Sin actividad reciente
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function MetricCard({ title, value, icon: Icon, trend, color }: any) {
  const colors: any = {
    emerald: "bg-emerald-500/20 text-emerald-400",
    rose: "bg-rose-500/20 text-rose-400",
    blue: "bg-blue-500/20 text-blue-400",
    purple: "bg-purple-500/20 text-purple-400",
  };

  return (
    <div className="bg-white/[0.03] backdrop-blur-3xl border border-white/10 rounded-[2.5rem] p-8 shadow-2xl relative overflow-hidden group hover:border-emerald-500/30 transition-all duration-300">
      <div className={`absolute -right-10 -top-10 w-32 h-32 ${color === 'emerald' ? 'bg-emerald-500' : 'bg-slate-400'}/10 rounded-full blur-3xl transition-opacity opacity-0 group-hover:opacity-100`} />
      
      <div className="flex justify-between items-start mb-8 relative z-10">
        <p className="text-slate-500 font-black uppercase tracking-[0.2em] text-[10px]">
          {title}
        </p>
        <div className={cn("p-4 rounded-2xl shadow-inner", colors[color] || colors.emerald)}>
          <Icon size={24} />
        </div>
      </div>
      
      <div className="flex items-end gap-3 relative z-10">
        <h3 className="text-4xl font-black text-white italic tracking-tight">
          {value}
        </h3>
        {trend && (
          <span className="text-xs font-black text-emerald-400 bg-emerald-500/10 px-2 py-1 rounded-lg mb-2 shadow-sm">
            {trend}
          </span>
        )}
      </div>
    </div>
  );
}

