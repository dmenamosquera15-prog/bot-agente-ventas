import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Plus,
  Trash2,
  Check,
  Star,
  Edit2,
  X,
  Save,
  ChevronDown,
  BrainCircuit,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface Provider {
  id: string;
  name: string;
  provider: string;
  apiKey: string;
  baseUrl?: string;
  model: string;
  isActive: boolean;
  isDefault: boolean;
}
interface ModelsMap {
  [provider: string]: string[];
}

const PROVIDER_COLORS: Record<string, string> = {
  openai: "text-green-400",
  groq: "text-orange-400",
  grok: "text-yellow-400",
  anthropic: "text-violet-400",
  openrouter: "text-blue-400",
  github_copilot: "text-purple-400",
  github_models: "text-indigo-400",
  kimi: "text-rose-400",
  ollama: "text-cyan-400",
};
const PROVIDER_LABELS: Record<string, string> = {
  openai: "OpenAI",
  groq: "Groq (Llama)",
  grok: "Grok (xAI)",
  anthropic: "Anthropic Claude",
  openrouter: "OpenRouter",
  github_copilot: "GitHub Copilot",
  github_models: "GitHub Models (Token)",
  kimi: "Kimi Cloud (Moonshot)",
  ollama: "Ollama (Local/Server)",
};
const BASE = "/api";

const PROVIDER_BASE_URLS: Record<string, string> = {
  grok: "https://api.x.ai/v1",
  groq: "https://api.groq.com/openai/v1",
  anthropic: "https://api.anthropic.com/v1",
  openai: "",
  openrouter: "https://openrouter.ai/api/v1",
  kimi: "https://api.moonshot.cn/v1",
  github_copilot: "https://api.github.com",
  github_models: "https://models.inference.ai.azure.com",
  ollama: "http://localhost:11434/v1",
};

const empty = {
  name: "",
  provider: "openai",
  apiKey: "",
  baseUrl: "",
  model: "gpt-5-mini",
  isDefault: false,
};

export default function AiProviders() {
  const [providers, setProviders] = useState<Provider[]>([]);
  const [models, setModels] = useState<ModelsMap>({});
  const [adding, setAdding] = useState(false);
  const [editing, setEditing] = useState<string | null>(null);
  const [form, setForm] = useState(empty);
  const [loading, setLoading] = useState(false);

  const [ollamaStatus, setOllamaStatus] = useState<any>(null);

  const load = async () => {
    const r = await fetch(`${BASE}/ai-providers`);
    const d = await r.json();
    setProviders(d.providers || []);
    setModels(d.availableModels || {});
  };

  const checkOllama = async () => {
    try {
      const r = await fetch(`${BASE}/ollama/status`);
      const d = await r.json();
      setOllamaStatus(d);
    } catch {
      setOllamaStatus({ connected: false });
    }
  };

  useEffect(() => {
    load();
    checkOllama();
    const id = setInterval(checkOllama, 10000);
    return () => clearInterval(id);
  }, []);

  const save = async () => {
    setLoading(true);
    if (editing) {
      await fetch(`${BASE}/ai-providers/${editing}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      setEditing(null);
    } else {
      await fetch(`${BASE}/ai-providers`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      setAdding(false);
    }
    setForm(empty);
    setLoading(false);
    load();
  };

  const setDefault = async (id: string) => {
    await fetch(`${BASE}/ai-providers/${id}/set-default`, { method: "POST" });
    load();
  };

  const del = async (id: string) => {
    if (!confirm("¿Eliminar este proveedor?")) return;
    await fetch(`${BASE}/ai-providers/${id}`, { method: "DELETE" });
    load();
  };

  const startEdit = (p: Provider) => {
    setEditing(p.id);
    setForm({
      name: p.name,
      provider: p.provider,
      apiKey: "",
      baseUrl: p.baseUrl || "",
      model: p.model,
      isDefault: p.isDefault,
    });
    setAdding(false);
  };

  const FormCard = () => (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-card border border-primary/30 rounded-2xl p-6 mb-4"
    >
      <h3 className="font-semibold text-foreground mb-4">
        {editing ? "Editar Proveedor" : "Nuevo Proveedor de IA"}
      </h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="md:col-span-2 bg-primary/5 border border-primary/20 rounded-2xl p-4 mb-2">
          <p className="text-xs text-primary font-bold flex items-center gap-2">
            <Check size={14} /> DISEÑO SIMPLIFICADO: Solo necesitas la API Key. El resto es opcional.
          </p>
        </div>
        <div>
          <label className="text-xs text-muted-foreground mb-1 block">
            Nombre (Opcional)
          </label>
          <input
            value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            placeholder="Automático (ej: GPT-4o Provider)"
            className="w-full px-3 py-2 rounded-xl bg-background border border-border text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
          />
        </div>
        <div>
          <label className="text-xs text-muted-foreground mb-1 block">
            Proveedor
          </label>
          <div className="relative">
            <select
              value={form.provider}
              onChange={(e) => {
                const p = e.target.value;
                setForm((f) => ({
                  ...f,
                  provider: p,
                  model: "",
                  baseUrl: "",
                }));
              }}
              className="w-full px-3 py-2 rounded-xl bg-background border border-border text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 appearance-none"
            >
              {Object.entries(PROVIDER_LABELS).map(([k, v]) => (
                <option key={k} value={k}>
                  {v}
                </option>
              ))}
            </select>
            <ChevronDown
              size={14}
              className="absolute right-3 top-3 text-muted-foreground pointer-events-none"
            />
          </div>
        </div>
        <div>
          <label className="text-xs text-muted-foreground mb-1 block">
            API Key{editing ? " (Dejar vacío para mantener actual)" : " (Requerido)"}
          </label>
          <input
            type="password"
            value={form.apiKey}
            onChange={(e) => setForm((f) => ({ ...f, apiKey: e.target.value }))}
            placeholder="sk-..."
            className="w-full px-3 py-2 rounded-xl bg-background border border-border text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 border-primary/30"
          />
        </div>
        <div>
          <label className="text-xs text-muted-foreground mb-1 block">
            Modelo (Opcional)
          </label>
          <div className="relative">
            <select
              value={form.model}
              onChange={(e) =>
                setForm((f) => ({ ...f, model: e.target.value }))
              }
              className="w-full px-3 py-2 rounded-xl bg-background border border-border text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 appearance-none"
            >
              <option value="">Selección Automática</option>
              {(models[form.provider] || []).map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>
            <ChevronDown
              size={14}
              className="absolute right-3 top-3 text-muted-foreground pointer-events-none"
            />
          </div>
        </div>
        <div className="md:col-span-2">
          <label className="text-xs text-muted-foreground mb-1 block">
            Base URL (Opcional)
          </label>
          <input
            value={form.baseUrl}
            onChange={(e) =>
              setForm((f) => ({ ...f, baseUrl: e.target.value }))
            }
            placeholder="Se completará automáticamente según el proveedor"
            className="w-full px-3 py-2 rounded-xl bg-background border border-border text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
          />
        </div>
        <div className="md:col-span-2 flex items-center gap-2">
          <input
            type="checkbox"
            id="isDefault"
            checked={form.isDefault}
            onChange={(e) =>
              setForm((f) => ({ ...f, isDefault: e.target.checked }))
            }
            className="w-4 h-4 rounded"
          />
          <label htmlFor="isDefault" className="text-sm text-muted-foreground">
            Usar como proveedor predeterminado para los agentes
          </label>
        </div>
      </div>
      <div className="flex gap-3 mt-5">
        <button
          onClick={save}
          disabled={loading || (!form.apiKey && !editing && form.provider !== "ollama")}
          className="flex items-center gap-2 px-5 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-semibold disabled:opacity-40 hover:opacity-90 transition-opacity"
        >
          <Save size={15} /> Guardar
        </button>
        <button
          onClick={() => {
            setAdding(false);
            setEditing(null);
            setForm(empty);
          }}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-secondary text-muted-foreground text-sm hover:text-foreground transition-colors"
        >
          <X size={15} /> Cancelar
        </button>
      </div>
    </motion.div>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">
            Proveedores de IA
          </h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Configura las APIs de IA que usan los agentes. El proveedor
            predeterminado se usa para todas las conversaciones.
          </p>
        </div>
        <button
          onClick={() => {
            setAdding(true);
            setEditing(null);
            setForm(empty);
          }}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:opacity-90 transition-opacity"
        >
          <Plus size={16} /> Agregar Proveedor
        </button>
      </div>

      {(adding || editing) && <FormCard />}

      {!providers.length ? (
        <div className="bg-card border border-border rounded-2xl p-10 text-center">
          <p className="text-muted-foreground">
            Sin proveedores configurados. El sistema usa Replit AI por defecto.
          </p>
          <p className="text-xs text-muted-foreground mt-2">
            Agrega tu propia API key de OpenAI, Groq, Anthropic u OpenRouter
            para mayor control.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Primary AI Selection - Ollama Cloud/Local */}
          <motion.div
             initial={{ opacity: 0, x: -20 }}
             animate={{ opacity: 1, x: 0 }}
             className="md:col-span-2 bg-gradient-to-br from-cyan-500/10 via-card/50 to-transparent backdrop-blur-3xl border border-cyan-500/30 rounded-[2.5rem] p-8 shadow-2xl relative overflow-hidden group mb-4"
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-500/10 rounded-full blur-3xl -mr-16 -mt-16 group-hover:bg-cyan-500/20 transition-all duration-700" />
            
            <div className="flex items-center justify-between mb-8 overflow-x-auto gap-4">
              <div className="flex items-center gap-5 shrink-0">
                <div className="w-14 h-14 rounded-2xl bg-cyan-500/20 flex items-center justify-center text-cyan-400 shadow-[0_0_20px_rgba(6,182,212,0.1)] border border-cyan-500/20">
                  <BrainCircuit size={28} />
                </div>
                <div>
                  <h2 className="text-xl font-black text-foreground tracking-tight leading-none uppercase italic">Ollama <span className="text-cyan-400">Power</span></h2>
                  <div className="flex items-center gap-2 mt-2">
                     <div className="px-2 py-0.5 rounded-md bg-cyan-500/10 text-[9px] font-black text-cyan-400 tracking-widest uppercase border border-cyan-500/20">Prioridad 1</div>
                     <div className="px-2 py-0.5 rounded-md bg-white/5 text-[9px] font-black text-muted-foreground tracking-widest uppercase border border-white/5">Nativo (.env)</div>
                  </div>
                </div>
              </div>
              
              <div className={cn(
                 "flex items-center gap-2 px-4 py-2 rounded-full text-[10px] font-black tracking-widest uppercase border transition-all shrink-0",
                 ollamaStatus?.connected 
                  ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.2)]"
                  : "bg-red-500/10 border-red-500/30 text-red-400"
              )}>
                <div className={cn("w-2 h-2 rounded-full", ollamaStatus?.connected ? "bg-emerald-400 animate-pulse" : "bg-red-400")} />
                {ollamaStatus?.connected ? "Conectado" : "Desconectado"}
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 relative z-10">
              <div className="lg:col-span-1 p-4 rounded-2xl bg-white/5 border border-white/5 hover:border-white/10 transition-colors">
                 <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-1">Host Configurado</p>
                 <p className="text-sm font-bold text-foreground truncate select-all">{ollamaStatus?.host || "No configurado"}</p>
              </div>

              <div className="lg:col-span-2 p-4 rounded-2xl bg-white/5 border border-white/5">
                 <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-2">Modelos Disponibles (Rotación Automática)</p>
                 <div className="flex flex-wrap gap-2">
                   {ollamaStatus?.models?.length > 0 ? (
                     ollamaStatus.models.map((m: string) => (
                       <div key={m} className={cn(
                         "px-3 py-1.5 rounded-xl text-[10px] font-bold border transition-all",
                         (ollamaStatus.primary === m || ollamaStatus.fallback === m) 
                          ? "bg-cyan-500/20 border-cyan-500/40 text-cyan-200"
                          : "bg-white/5 border-white/10 text-muted-foreground"
                       )}>
                         {m} {(ollamaStatus.primary === m) && "★"}
                       </div>
                     ))
                   ) : (
                     <span className="text-xs text-muted-foreground italic">No se encontraron modelos. Verifica que el servidor esté prendido.</span>
                   )}
                 </div>
              </div>
            </div>
            
            <p className="text-[10px] text-muted-foreground mt-6 font-medium italic opacity-60">
              * El sistema siempre prioriza Ollama. Si falla, usará los proveedores configurados abajo según su estado de activación.
            </p>
          </motion.div>

          {providers.map((p, i) => (
            <motion.div
              key={p.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className={`bg-card border rounded-2xl p-5 relative ${p.isDefault ? "border-primary/40 shadow-[0_0_0_1px_hsl(var(--primary)/0.2)]" : "border-border"}`}
            >
              {p.isDefault && (
                <span className="absolute top-3 right-3 flex items-center gap-1 text-xs font-semibold text-yellow-400 bg-yellow-400/10 border border-yellow-400/20 px-2 py-1 rounded-full">
                  <Star size={11} fill="currentColor" /> Predeterminado
                </span>
              )}
              <div className="flex items-start gap-3 mb-3">
                <div className="w-9 h-9 rounded-xl bg-secondary flex items-center justify-center text-lg font-bold">
                  {p.provider === "openai"
                    ? "🤖"
                    : p.provider === "groq"
                      ? "⚡"
                      : p.provider === "grok"
                        ? "🔥"
                        : p.provider === "anthropic"
                          ? "🧠"
                          : p.provider === "github_copilot"
                            ? "🐙"
                            : p.provider === "kimi"
                              ? "🌙"
                              : "🌐"}
                </div>
                <div>
                  <h3 className="font-semibold text-foreground">{p.name}</h3>
                  <p
                    className={`text-xs font-medium ${PROVIDER_COLORS[p.provider] || "text-muted-foreground"}`}
                  >
                    {PROVIDER_LABELS[p.provider] || p.provider}
                  </p>
                </div>
              </div>
              <div className="space-y-1 text-xs text-muted-foreground mb-4">
                <p>
                  Modelo:{" "}
                  <span className="text-foreground font-medium">{p.model}</span>
                </p>
                <p>
                  API Key:{" "}
                  <span className="font-mono text-foreground">{p.apiKey}</span>
                </p>
                {p.baseUrl && (
                  <p>
                    URL: <span className="text-foreground">{p.baseUrl}</span>
                  </p>
                )}
              </div>
              <div className="flex gap-2">
                {!p.isDefault && (
                  <button
                    onClick={() => setDefault(p.id)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-yellow-400/10 text-yellow-400 text-xs font-medium hover:bg-yellow-400/20 transition-colors"
                  >
                    <Star size={12} /> Usar
                  </button>
                )}
                <button
                  onClick={() => startEdit(p)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-secondary text-muted-foreground text-xs hover:text-foreground transition-colors"
                >
                  <Edit2 size={12} /> Editar
                </button>
                <button
                  onClick={() => del(p.id)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-500/10 text-red-400 text-xs hover:bg-red-500/20 transition-colors ml-auto"
                >
                  <Trash2 size={12} /> Eliminar
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      <div className="bg-card border border-border rounded-2xl p-5">
        <h3 className="font-semibold text-foreground mb-3">
          Proveedores Soportados
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
          {Object.entries(PROVIDER_LABELS).map(([k, v]) => (
            <div
              key={k}
              className="flex items-center gap-2 text-muted-foreground"
            >
              <span
                className={`w-2 h-2 rounded-full bg-current ${PROVIDER_COLORS[k]}`}
              />
              <span>{v}</span>
            </div>
          ))}
        </div>
        <p className="text-xs text-muted-foreground mt-3">
          Si no agregas un proveedor, el sistema usa automáticamente Replit AI
          (OpenAI compatible, sin costo adicional).
        </p>
      </div>
    </div>
  );
}
