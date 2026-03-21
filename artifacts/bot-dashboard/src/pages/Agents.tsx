import React from "react";
import { useGetAgentsStatus } from "@workspace/api-client-react";
import { Bot, Zap, Target, CheckCircle2, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

export default function Agents() {
  const { data, isLoading } = useGetAgentsStatus();

  // Mock data fallback if API is not fully seeded
  const defaultAgents = [
    { name: "Agente de Ventas", description: "Maneja consultas de precios, ventas y presupuestos.", successRate: 0.92, totalHandled: 1240, status: 'active', handledIntents: ['consulta_precio', 'compra', 'objecion_precio'] },
    { name: "Agente de Soporte", description: "Resuelve reclamos y problemas técnicos post-venta.", successRate: 0.88, totalHandled: 856, status: 'active', handledIntents: ['soporte', 'reclamo'] },
    { name: "Agente Técnico", description: "Comparaciones y especificaciones técnicas profundas.", successRate: 0.95, totalHandled: 432, status: 'idle', handledIntents: ['especificacion_tecnica', 'comparacion'] },
    { name: "Agente Administrativo", description: "Facturación, pagos y envíos.", successRate: 0.99, totalHandled: 215, status: 'active', handledIntents: ['facturacion', 'envio'] }
  ];

  const agents = data?.agents?.length ? data.agents : defaultAgents;

  return (
    <div className="space-y-8 animate-fade-in">
      <div>
        <h1 className="text-3xl font-display font-bold text-foreground">Flota de Agentes IA</h1>
        <p className="text-muted-foreground mt-1 text-lg">Monitoreo de rendimiento del sistema multi-agente.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {agents.map((agent: any, i) => (
          <div key={i} className="bg-card border border-border/50 rounded-3xl p-6 md:p-8 shadow-xl shadow-black/5 relative overflow-hidden group hover:border-primary/30 transition-all duration-500">
            <div className="absolute -right-20 -top-20 w-64 h-64 bg-primary/5 rounded-full blur-3xl group-hover:bg-primary/10 transition-colors pointer-events-none" />
            
            <div className="flex items-start justify-between mb-6 relative z-10">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 border border-primary/20 flex items-center justify-center shadow-lg shadow-primary/10">
                  <Bot size={28} className="text-primary" />
                </div>
                <div>
                  <h2 className="text-xl font-display font-bold text-foreground">{agent.name}</h2>
                  <div className="flex items-center gap-2 mt-1">
                    <span className={cn(
                      "w-2 h-2 rounded-full animate-pulse",
                      agent.status === 'active' ? "bg-green-500" : "bg-yellow-500"
                    )} />
                    <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                      {agent.status === 'active' ? 'Operativo' : 'Inactivo / En Espera'}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <p className="text-muted-foreground mb-6 leading-relaxed relative z-10">{agent.description}</p>

            <div className="grid grid-cols-2 gap-4 mb-6 relative z-10">
              <div className="bg-background rounded-2xl p-4 border border-border">
                <div className="flex items-center gap-2 text-muted-foreground mb-2">
                  <Target size={16} />
                  <span className="text-sm font-medium">Tasa de Éxito</span>
                </div>
                <div className="flex items-end gap-2">
                  <span className="text-2xl font-display font-bold text-foreground">
                    {(agent.successRate * 100).toFixed(1)}%
                  </span>
                </div>
                <div className="w-full h-1.5 bg-secondary rounded-full mt-3 overflow-hidden">
                  <div className="h-full bg-primary" style={{ width: `${agent.successRate * 100}%` }} />
                </div>
              </div>

              <div className="bg-background rounded-2xl p-4 border border-border">
                <div className="flex items-center gap-2 text-muted-foreground mb-2">
                  <Zap size={16} />
                  <span className="text-sm font-medium">Interacciones</span>
                </div>
                <div className="flex items-end gap-2">
                  <span className="text-2xl font-display font-bold text-foreground">
                    {agent.totalHandled.toLocaleString()}
                  </span>
                </div>
                <div className="mt-2 text-xs text-muted-foreground font-medium">Total histórico</div>
              </div>
            </div>

            <div className="relative z-10">
              <h4 className="text-sm font-bold text-foreground mb-3 uppercase tracking-wider">Intenciones Asignadas</h4>
              <div className="flex flex-wrap gap-2">
                {agent.handledIntents.map((intent: string) => (
                  <span key={intent} className="px-3 py-1 bg-secondary text-secondary-foreground text-xs font-medium rounded-lg border border-border">
                    {intent.replace('_', ' ')}
                  </span>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
