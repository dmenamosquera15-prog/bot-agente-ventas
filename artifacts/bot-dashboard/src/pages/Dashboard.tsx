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
    return <div className="animate-pulse space-y-8">
      <div className="h-10 w-48 bg-secondary rounded-lg mb-8"></div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[...Array(4)].map((_, i) => <div key={i} className="h-32 bg-secondary rounded-2xl"></div>)}
      </div>
    </div>;
  }

  const m = metrics || {
    totalConversations: 0, totalClients: 0, hotLeads: 0, 
    messagesLast24h: 0, avgConfidence: 0, topIntent: '-'
  };

  const intentData = intentsRes?.data || [];
  const recentConvos = conversationsRes?.data || [];

  return (
    <div className="space-y-8 animate-fade-in">
      <div>
        <h1 className="text-3xl font-display font-bold text-foreground">Resumen General</h1>
        <p className="text-muted-foreground mt-1 text-lg">El estado actual de tu bot inteligente.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard 
          title="Conversaciones (24h)" 
          value={m.messagesLast24h} 
          icon={MessageSquare} 
          trend="+12%" 
          color="text-primary"
        />
        <MetricCard 
          title="Leads Calientes" 
          value={m.hotLeads} 
          icon={Flame} 
          trend="+4%" 
          color="text-red-500"
        />
        <MetricCard 
          title="Clientes Totales" 
          value={m.totalClients} 
          icon={Users} 
          color="text-blue-500"
        />
        <MetricCard 
          title="Confianza IA Promedio" 
          value={`${(m.avgConfidence * 100).toFixed(0)}%`} 
          icon={Brain} 
          color="text-purple-500"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Chart */}
        <div className="col-span-1 lg:col-span-2 bg-card border border-border/50 rounded-2xl p-6 shadow-xl shadow-black/5">
          <h2 className="text-lg font-bold mb-6 flex items-center gap-2">
            <Brain className="text-primary" size={20} />
            Distribución de Intenciones
          </h2>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={intentData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                <XAxis dataKey="intent" stroke="#71717a" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="#71717a" fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip 
                  cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                  contentStyle={{ backgroundColor: '#18181b', border: '1px solid #27272a', borderRadius: '8px' }}
                />
                <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                  {intentData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={index === 0 ? '#25D366' : '#3f3f46'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-card border border-border/50 rounded-2xl p-6 shadow-xl shadow-black/5">
          <h2 className="text-lg font-bold mb-6 flex items-center justify-between">
            <span className="flex items-center gap-2">
              <Clock className="text-primary" size={20} />
              Actividad Reciente
            </span>
            <ArrowUpRight size={20} className="text-muted-foreground" />
          </h2>
          
          <div className="space-y-6">
            {recentConvos.map((convo) => (
              <div key={convo.id} className="flex gap-4 group">
                <div className="w-2 h-2 mt-2 rounded-full bg-primary/50 group-hover:bg-primary transition-colors shrink-0" />
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <p className="font-semibold text-sm">{convo.clientName || convo.clientPhone}</p>
                    <span className="text-xs text-muted-foreground">
                      {formatDistanceToNow(new Date(convo.updatedAt), { addSuffix: true, locale: es })}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground line-clamp-1">{convo.lastMessage}</p>
                  <div className="flex gap-2 mt-2">
                    <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-secondary text-secondary-foreground">
                      {convo.lastAgent}
                    </span>
                  </div>
                </div>
              </div>
            ))}
            {recentConvos.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-4">No hay actividad reciente.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function MetricCard({ title, value, icon: Icon, trend, color }: any) {
  return (
    <div className="bg-card border border-border/50 rounded-2xl p-6 shadow-lg shadow-black/5 relative overflow-hidden group hover:border-border transition-colors">
      <div className="absolute -right-4 -top-4 w-24 h-24 bg-primary/5 rounded-full blur-2xl group-hover:bg-primary/10 transition-colors" />
      <div className="flex justify-between items-start mb-4">
        <p className="text-muted-foreground font-medium">{title}</p>
        <div className={cn("p-2 rounded-lg bg-secondary", color)}>
          <Icon size={20} />
        </div>
      </div>
      <div className="flex items-end gap-3">
        <h3 className="text-3xl font-display font-bold text-foreground">{value}</h3>
        {trend && (
          <span className="text-sm font-medium text-primary mb-1">{trend}</span>
        )}
      </div>
    </div>
  );
}
