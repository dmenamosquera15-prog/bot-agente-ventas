import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Plus, Trash2, Check, Star, Edit2, X, Save, ChevronDown } from "lucide-react";

interface Provider { id: string; name: string; provider: string; apiKey: string; baseUrl?: string; model: string; isActive: boolean; isDefault: boolean; }
interface ModelsMap { [provider: string]: string[] }

const PROVIDER_COLORS: Record<string, string> = { openai: "text-green-400", groq: "text-orange-400", anthropic: "text-violet-400", openrouter: "text-blue-400" };
const PROVIDER_LABELS: Record<string, string> = { openai: "OpenAI", groq: "Groq (Llama)", anthropic: "Anthropic Claude", openrouter: "OpenRouter" };
const BASE = "/api";

const empty = { name: "", provider: "openai", apiKey: "", baseUrl: "", model: "gpt-5-mini", isDefault: false };

export default function AiProviders() {
  const [providers, setProviders] = useState<Provider[]>([]);
  const [models, setModels] = useState<ModelsMap>({});
  const [adding, setAdding] = useState(false);
  const [editing, setEditing] = useState<string | null>(null);
  const [form, setForm] = useState(empty);
  const [loading, setLoading] = useState(false);

  const load = async () => {
    const r = await fetch(`${BASE}/ai-providers`);
    const d = await r.json();
    setProviders(d.providers || []);
    setModels(d.availableModels || {});
  };

  useEffect(() => { load(); }, []);

  const save = async () => {
    setLoading(true);
    if (editing) {
      await fetch(`${BASE}/ai-providers/${editing}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
      setEditing(null);
    } else {
      await fetch(`${BASE}/ai-providers`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
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

  const startEdit = (p: Provider) => { setEditing(p.id); setForm({ ...p, apiKey: "" }); setAdding(false); };

  const FormCard = () => (
    <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="bg-card border border-primary/30 rounded-2xl p-6 mb-4">
      <h3 className="font-semibold text-foreground mb-4">{editing ? "Editar Proveedor" : "Nuevo Proveedor de IA"}</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="text-xs text-muted-foreground mb-1 block">Nombre</label>
          <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Ej: Mi OpenAI" className="w-full px-3 py-2 rounded-xl bg-background border border-border text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/40" />
        </div>
        <div>
          <label className="text-xs text-muted-foreground mb-1 block">Proveedor</label>
          <div className="relative">
            <select value={form.provider} onChange={e => { const p = e.target.value; setForm(f => ({ ...f, provider: p, model: (models[p] || [])[0] || "" })); }} className="w-full px-3 py-2 rounded-xl bg-background border border-border text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 appearance-none">
              {Object.entries(PROVIDER_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
            </select>
            <ChevronDown size={14} className="absolute right-3 top-3 text-muted-foreground pointer-events-none" />
          </div>
        </div>
        <div>
          <label className="text-xs text-muted-foreground mb-1 block">API Key{editing ? " (vacío = no cambiar)" : ""}</label>
          <input type="password" value={form.apiKey} onChange={e => setForm(f => ({ ...f, apiKey: e.target.value }))} placeholder="sk-..." className="w-full px-3 py-2 rounded-xl bg-background border border-border text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/40" />
        </div>
        <div>
          <label className="text-xs text-muted-foreground mb-1 block">Modelo</label>
          <div className="relative">
            <select value={form.model} onChange={e => setForm(f => ({ ...f, model: e.target.value }))} className="w-full px-3 py-2 rounded-xl bg-background border border-border text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 appearance-none">
              {(models[form.provider] || []).map(m => <option key={m} value={m}>{m}</option>)}
            </select>
            <ChevronDown size={14} className="absolute right-3 top-3 text-muted-foreground pointer-events-none" />
          </div>
        </div>
        <div className="md:col-span-2">
          <label className="text-xs text-muted-foreground mb-1 block">Base URL (opcional, para proveedores compatibles)</label>
          <input value={form.baseUrl} onChange={e => setForm(f => ({ ...f, baseUrl: e.target.value }))} placeholder="https://api.example.com/v1" className="w-full px-3 py-2 rounded-xl bg-background border border-border text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/40" />
        </div>
        <div className="md:col-span-2 flex items-center gap-2">
          <input type="checkbox" id="isDefault" checked={form.isDefault} onChange={e => setForm(f => ({ ...f, isDefault: e.target.checked }))} className="w-4 h-4 rounded" />
          <label htmlFor="isDefault" className="text-sm text-muted-foreground">Usar como proveedor predeterminado para los agentes</label>
        </div>
      </div>
      <div className="flex gap-3 mt-5">
        <button onClick={save} disabled={loading || !form.name || !form.apiKey && !editing} className="flex items-center gap-2 px-5 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-semibold disabled:opacity-40 hover:opacity-90 transition-opacity">
          <Save size={15} /> Guardar
        </button>
        <button onClick={() => { setAdding(false); setEditing(null); setForm(empty); }} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-secondary text-muted-foreground text-sm hover:text-foreground transition-colors">
          <X size={15} /> Cancelar
        </button>
      </div>
    </motion.div>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Proveedores de IA</h1>
          <p className="text-muted-foreground mt-1 text-sm">Configura las APIs de IA que usan los agentes. El proveedor predeterminado se usa para todas las conversaciones.</p>
        </div>
        <button onClick={() => { setAdding(true); setEditing(null); setForm(empty); }} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:opacity-90 transition-opacity">
          <Plus size={16} /> Agregar Proveedor
        </button>
      </div>

      {(adding || editing) && <FormCard />}

      {!providers.length ? (
        <div className="bg-card border border-border rounded-2xl p-10 text-center">
          <p className="text-muted-foreground">Sin proveedores configurados. El sistema usa Replit AI por defecto.</p>
          <p className="text-xs text-muted-foreground mt-2">Agrega tu propia API key de OpenAI, Groq, Anthropic u OpenRouter para mayor control.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {providers.map((p, i) => (
            <motion.div key={p.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
              className={`bg-card border rounded-2xl p-5 relative ${p.isDefault ? "border-primary/40 shadow-[0_0_0_1px_hsl(var(--primary)/0.2)]" : "border-border"}`}>
              {p.isDefault && <span className="absolute top-3 right-3 flex items-center gap-1 text-xs font-semibold text-yellow-400 bg-yellow-400/10 border border-yellow-400/20 px-2 py-1 rounded-full"><Star size={11} fill="currentColor" /> Predeterminado</span>}
              <div className="flex items-start gap-3 mb-3">
                <div className="w-9 h-9 rounded-xl bg-secondary flex items-center justify-center text-lg font-bold">
                  {p.provider === "openai" ? "🤖" : p.provider === "groq" ? "⚡" : p.provider === "anthropic" ? "🧠" : "🌐"}
                </div>
                <div>
                  <h3 className="font-semibold text-foreground">{p.name}</h3>
                  <p className={`text-xs font-medium ${PROVIDER_COLORS[p.provider] || "text-muted-foreground"}`}>{PROVIDER_LABELS[p.provider] || p.provider}</p>
                </div>
              </div>
              <div className="space-y-1 text-xs text-muted-foreground mb-4">
                <p>Modelo: <span className="text-foreground font-medium">{p.model}</span></p>
                <p>API Key: <span className="font-mono text-foreground">{p.apiKey}</span></p>
                {p.baseUrl && <p>URL: <span className="text-foreground">{p.baseUrl}</span></p>}
              </div>
              <div className="flex gap-2">
                {!p.isDefault && <button onClick={() => setDefault(p.id)} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-yellow-400/10 text-yellow-400 text-xs font-medium hover:bg-yellow-400/20 transition-colors"><Star size={12} /> Usar</button>}
                <button onClick={() => startEdit(p)} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-secondary text-muted-foreground text-xs hover:text-foreground transition-colors"><Edit2 size={12} /> Editar</button>
                <button onClick={() => del(p.id)} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-500/10 text-red-400 text-xs hover:bg-red-500/20 transition-colors ml-auto"><Trash2 size={12} /> Eliminar</button>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      <div className="bg-card border border-border rounded-2xl p-5">
        <h3 className="font-semibold text-foreground mb-3">Proveedores Soportados</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
          {Object.entries(PROVIDER_LABELS).map(([k, v]) => (
            <div key={k} className="flex items-center gap-2 text-muted-foreground">
              <span className={`w-2 h-2 rounded-full bg-current ${PROVIDER_COLORS[k]}`} />
              <span>{v}</span>
            </div>
          ))}
        </div>
        <p className="text-xs text-muted-foreground mt-3">Si no agregas un proveedor, el sistema usa automáticamente Replit AI (OpenAI compatible, sin costo adicional).</p>
      </div>
    </div>
  );
}
