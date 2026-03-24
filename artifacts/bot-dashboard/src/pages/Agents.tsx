import { useGetAgentsStatus } from "@workspace/api-client-react";
import { Bot, Zap, Target, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

const AGENT_EMOJI: Record<string, string> = {
  orchestrator: "🧠",
  saludo: "👋",
  descubrimiento: "🔍",
  interes_producto: "🛍️",
  tecnico: "📊",
  objeciones: "🧩",
  cierre: "💰",
  datos_envio: "📦",
  confirmacion: "✅",
  soporte: "🔧",
  seguimiento: "🔁",
  sales: "🛍️",
  support: "🔧",
  technical: "📊",
  admin: "🌐",
};

export default function Agents() {
  const { data, isLoading } = useGetAgentsStatus();

  const agents: any[] = data?.agents || [];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20 animate-pulse">
        <Loader2 className="animate-spin text-primary" size={32} />
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in">
      <div>
        <h1 className="text-3xl font-display font-bold text-foreground">Flota de Agentes IA</h1>
        <p className="text-muted-foreground mt-1">
          Sistema multi-agente — {agents.length} agentes configurados. El <strong>Orquestador</strong> dirige el tráfico automáticamente.
        </p>
      </div>

      {agents.length === 0 ? (
        <div className="bg-card border border-dashed border-border rounded-2xl p-12 text-center">
          <Bot size={48} className="mx-auto text-muted-foreground opacity-30 mb-4" />
          <p className="text-muted-foreground">No se encontraron agentes. Reinicia el servidor.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 2xl:grid-cols-3 gap-5">
          {agents.map((agent: any) => (
            <div
              key={agent.id || agent.key}
              className={cn(
                "bg-card border rounded-2xl p-6 shadow-lg relative overflow-hidden group transition-all duration-300 hover:shadow-xl",
                agent.key === "orchestrator"
                  ? "border-primary/40 hover:border-primary/60"
                  : "border-border/50 hover:border-primary/30"
              )}
            >
              {/* Glow */}
              <div className="absolute -right-12 -top-12 w-40 h-40 bg-primary/5 rounded-full blur-3xl group-hover:bg-primary/10 transition-colors pointer-events-none" />

              <div className="flex items-start justify-between mb-4 relative z-10">
                <div className="flex items-center gap-3">
                  <div className={cn(
                    "w-12 h-12 rounded-xl flex items-center justify-center text-2xl border shadow-sm",
                    agent.key === "orchestrator"
                      ? "bg-primary/10 border-primary/30"
                      : "bg-secondary/80 border-border"
                  )}>
                    {AGENT_EMOJI[agent.key] || "🤖"}
                  </div>
                  <div>
                    <h3 className="font-bold text-foreground leading-tight">{agent.name}</h3>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <span className={cn(
                        "w-1.5 h-1.5 rounded-full",
                        agent.isActive !== false ? "bg-green-400 animate-pulse" : "bg-yellow-500"
                      )} />
                      <span className="text-[11px] text-muted-foreground font-medium">
                        {agent.isActive !== false ? "Operativo" : "Inactivo"}
                      </span>
                    </div>
                  </div>
                </div>
                {agent.key === "orchestrator" && (
                  <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-full bg-primary/10 text-primary border border-primary/20">
                    Cerebro
                  </span>
                )}
              </div>

              <p className="text-sm text-muted-foreground mb-4 line-clamp-2 relative z-10">
                {agent.description}
              </p>

              {/* Stats */}
              <div className="grid grid-cols-2 gap-3 mb-4 relative z-10">
                <div className="bg-background rounded-xl p-3 border border-border/50">
                  <div className="flex items-center gap-1.5 text-muted-foreground mb-1">
                    <Target size={12} />
                    <span className="text-[11px] font-medium">Éxito</span>
                  </div>
                  <div className="font-bold text-foreground">
                    {agent.totalHandled > 0 ? `${(agent.successRate * 100).toFixed(0)}%` : "—"}
                  </div>
                  {agent.totalHandled > 0 && (
                    <div className="w-full h-1 bg-secondary rounded-full mt-1.5 overflow-hidden">
                      <div className="h-full bg-primary rounded-full" style={{ width: `${agent.successRate * 100}%` }} />
                    </div>
                  )}
                </div>
                <div className="bg-background rounded-xl p-3 border border-border/50">
                  <div className="flex items-center gap-1.5 text-muted-foreground mb-1">
                    <Zap size={12} />
                    <span className="text-[11px] font-medium">Mensajes</span>
                  </div>
                  <div className="font-bold text-foreground">{agent.totalHandled.toLocaleString()}</div>
                </div>
              </div>

              {/* Intents */}
              <div className="relative z-10">
                <div className="flex flex-wrap gap-1">
                  {(agent.handledIntents || []).slice(0, 4).map((intent: string) => (
                    <span key={intent} className="px-2 py-0.5 bg-secondary text-muted-foreground text-[10px] font-medium rounded-md border border-border/50">
                      {intent.replace(/_/g, " ")}
                    </span>
                  ))}
                  {(agent.handledIntents || []).length > 4 && (
                    <span className="px-2 py-0.5 bg-secondary text-muted-foreground text-[10px] rounded-md border border-border/50">
                      +{(agent.handledIntents || []).length - 4}
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="bg-card border border-border rounded-2xl p-5 text-sm text-muted-foreground">
        <p className="font-semibold text-foreground mb-2">🔄 Cómo funciona el sistema multi-agente:</p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
          <div><strong className="text-foreground">1. Mensaje entra</strong> — WhatsApp recibe el mensaje del cliente</div>
          <div><strong className="text-foreground">2. Orquestador decide</strong> — Analiza la etapa y elige el agente ideal</div>
          <div><strong className="text-foreground">3. Agente responde</strong> — El especialista genera una respuesta natural</div>
        </div>
      </div>
    </div>
  );
}
