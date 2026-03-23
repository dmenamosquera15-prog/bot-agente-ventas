import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Bot, Save, RotateCcw, ChevronDown, ChevronUp } from "lucide-react";

interface AgentData { id: string; key: string; name: string; description: string; systemPrompt: string; handledIntents: string; isActive: boolean; }

const AGENT_ICONS: Record<string, string> = { sales: "🛍️", support: "🔧", technical: "📊", admin: "🌐" };
const BASE = "/api";

export default function AgentsEditor() {
  const [agents, setAgents] = useState<AgentData[]>([]);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [drafts, setDrafts] = useState<Record<string, AgentData>>({});
  const [saving, setSaving] = useState<string | null>(null);
  const [saved, setSaved] = useState<string | null>(null);

  const load = async () => {
    const r = await fetch(`${BASE}/agents-editor`);
    const d = await r.json();
    setAgents(d.agents || []);
    const init: Record<string, AgentData> = {};
    for (const a of (d.agents || [])) init[a.id] = { ...a };
    setDrafts(init);
  };

  useEffect(() => { load(); }, []);

  const saveAgent = async (id: string) => {
    setSaving(id);
    const draft = drafts[id];
    await fetch(`${BASE}/agents-editor/${id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(draft) });
    setSaving(null);
    setSaved(id);
    setTimeout(() => setSaved(null), 2000);
    load();
  };

  const update = (id: string, field: keyof AgentData, value: string | boolean) => {
    setDrafts(d => ({ ...d, [id]: { ...d[id], [field]: value } }));
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Agentes IA</h1>
        <p className="text-muted-foreground mt-1 text-sm">Edita el comportamiento, personalidad e instrucciones de cada agente especializado.</p>
      </div>

      <div className="space-y-3">
        {agents.map((agent) => {
          const draft = drafts[agent.id] || agent;
          const isOpen = expanded === agent.id;
          const isDirty = JSON.stringify(draft) !== JSON.stringify(agent);
          return (
            <motion.div key={agent.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-card border border-border rounded-2xl overflow-hidden">
              <div className="flex items-center gap-4 p-5 cursor-pointer" onClick={() => setExpanded(isOpen ? null : agent.id)}>
                <div className="text-2xl">{AGENT_ICONS[agent.key] || "🤖"}</div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-foreground">{agent.name}</h3>
                    {isDirty && <span className="text-xs bg-yellow-400/10 text-yellow-400 border border-yellow-400/20 px-2 py-0.5 rounded-full">Sin guardar</span>}
                    {saved === agent.id && <span className="text-xs bg-green-500/10 text-green-400 border border-green-500/20 px-2 py-0.5 rounded-full">✓ Guardado</span>}
                  </div>
                  <p className="text-sm text-muted-foreground mt-0.5">{draft.description}</p>
                </div>
                <div className="flex items-center gap-3">
                  <label className="flex items-center gap-2 text-xs text-muted-foreground" onClick={e => e.stopPropagation()}>
                    <div className={`relative inline-flex w-9 h-5 rounded-full transition-colors cursor-pointer ${draft.isActive ? "bg-primary" : "bg-muted"}`} onClick={() => update(agent.id, "isActive", !draft.isActive)}>
                      <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${draft.isActive ? "translate-x-4" : "translate-x-0.5"}`} />
                    </div>
                    {draft.isActive ? "Activo" : "Inactivo"}
                  </label>
                  {isOpen ? <ChevronUp size={18} className="text-muted-foreground" /> : <ChevronDown size={18} className="text-muted-foreground" />}
                </div>
              </div>

              {isOpen && (
                <div className="px-5 pb-5 border-t border-border/50 pt-4 space-y-4">
                  <div>
                    <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Nombre del Agente</label>
                    <input value={draft.name} onChange={e => update(agent.id, "name", e.target.value)} className="w-full px-3 py-2 rounded-xl bg-background border border-border text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/40" />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Descripción corta</label>
                    <input value={draft.description} onChange={e => update(agent.id, "description", e.target.value)} className="w-full px-3 py-2 rounded-xl bg-background border border-border text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/40" />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Prompt del Sistema (Define cómo piensa y habla el agente)</label>
                    <textarea value={draft.systemPrompt} onChange={e => update(agent.id, "systemPrompt", e.target.value)} rows={8} className="w-full px-3 py-2.5 rounded-xl bg-background border border-border text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 resize-none font-mono leading-relaxed" />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Intenciones que maneja (separadas por coma)</label>
                    <input value={draft.handledIntents} onChange={e => update(agent.id, "handledIntents", e.target.value)} className="w-full px-3 py-2 rounded-xl bg-background border border-border text-foreground text-sm font-mono focus:outline-none focus:ring-2 focus:ring-primary/40" />
                    <p className="text-xs text-muted-foreground mt-1">Ej: saludo,consulta_precio,compra,metodo_pago</p>
                  </div>
                  <div className="flex gap-3">
                    <button onClick={() => saveAgent(agent.id)} disabled={saving === agent.id} className="flex items-center gap-2 px-5 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:opacity-90 transition-opacity disabled:opacity-60">
                      <Save size={14} /> {saving === agent.id ? "Guardando..." : "Guardar Cambios"}
                    </button>
                    <button onClick={() => setDrafts(d => ({ ...d, [agent.id]: { ...agent } }))} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-secondary text-muted-foreground text-sm hover:text-foreground transition-colors">
                      <RotateCcw size={14} /> Descartar
                    </button>
                  </div>
                </div>
              )}
            </motion.div>
          );
        })}
      </div>

      <div className="bg-card border border-border rounded-2xl p-5">
        <h3 className="font-semibold text-foreground mb-2 text-sm">💡 Tips para un mejor agente</h3>
        <ul className="text-xs text-muted-foreground space-y-1">
          <li>• Sé específico sobre el tono: "Habla de forma amigable pero profesional, sin ser robótico"</li>
          <li>• Indica qué hacer con los productos: "SIEMPRE menciona el precio y stock disponible"</li>
          <li>• Define límites: "Si no sabes algo, di que lo verificas y no inventes información"</li>
          <li>• Para ventas: "Usa técnicas de cierre naturales, haz preguntas para entender la necesidad"</li>
        </ul>
      </div>
    </div>
  );
}
