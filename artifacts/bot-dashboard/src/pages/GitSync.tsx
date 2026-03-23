import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Github, Upload, Check, AlertCircle, RefreshCw, ExternalLink } from "lucide-react";

const BASE = "/api";

export default function GitSync() {
  const [status, setStatus] = useState<{ configured: boolean; repoUrl: string; ready: boolean } | null>(null);
  const [branch, setBranch] = useState("main");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ success: boolean; message: string; logs: string[]; repoUrl?: string } | null>(null);

  useEffect(() => {
    fetch(`${BASE}/git/status`).then(r => r.json()).then(setStatus).catch(() => {});
  }, []);

  const push = async () => {
    setLoading(true);
    setResult(null);
    try {
      const r = await fetch(`${BASE}/git/push`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ branch, message: message || undefined }),
      });
      const d = await r.json();
      setResult(d);
    } catch (e) {
      setResult({ success: false, message: "Error de conexión", logs: [String(e)] });
    }
    setLoading(false);
  };

  return (
    <div className="space-y-6 max-w-2xl">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-[#24292e] flex items-center justify-center">
          <Github className="text-white" size={22} />
        </div>
        <div>
          <h1 className="text-3xl font-bold text-foreground">Sincronizar con GitHub</h1>
          <p className="text-muted-foreground mt-0.5 text-sm">Sube el código del bot a tu repositorio privado de GitHub.</p>
        </div>
      </div>

      {/* Status card */}
      <div className={`flex items-center gap-3 p-4 rounded-xl border text-sm ${status?.ready ? "bg-green-500/10 border-green-500/20 text-green-400" : "bg-yellow-500/10 border-yellow-500/20 text-yellow-400"}`}>
        <span className={`w-2 h-2 rounded-full ${status?.ready ? "bg-green-400 animate-pulse" : "bg-yellow-400"}`} />
        <div className="flex-1">
          {status?.ready
            ? <><span className="font-medium">Listo para sincronizar →</span> <span className="font-mono text-xs opacity-80">{status.repoUrl}</span></>
            : <span>Token de GitHub no configurado. Agrega GITHUB_PERSONAL_ACCESS_TOKEN en los secretos.</span>
          }
        </div>
        {status?.repoUrl && (
          <a href={status.repoUrl.replace(".git", "")} target="_blank" rel="noopener noreferrer" className="shrink-0">
            <ExternalLink size={14} />
          </a>
        )}
      </div>

      {/* Push form */}
      <div className="bg-card border border-border rounded-2xl p-6 space-y-4">
        <h3 className="font-semibold text-foreground">Subir cambios</h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-xs text-muted-foreground mb-1.5 block">Rama (branch)</label>
            <input value={branch} onChange={e => setBranch(e.target.value)} placeholder="main" className="w-full px-3 py-2.5 rounded-xl bg-background border border-border text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/40" />
          </div>
          <div>
            <label className="text-xs text-muted-foreground mb-1.5 block">Mensaje del commit (opcional)</label>
            <input value={message} onChange={e => setMessage(e.target.value)} placeholder="feat: actualización del bot" className="w-full px-3 py-2.5 rounded-xl bg-background border border-border text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/40" />
          </div>
        </div>
        <button onClick={push} disabled={loading || !status?.ready} className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#24292e] text-white text-sm font-semibold hover:bg-[#1a1f24] transition-colors disabled:opacity-50 border border-white/10">
          {loading ? <RefreshCw size={15} className="animate-spin" /> : <Upload size={15} />}
          {loading ? "Subiendo código..." : "Subir a GitHub"}
        </button>
      </div>

      {/* Result */}
      {result && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className={`bg-card border rounded-2xl p-5 ${result.success ? "border-green-500/30" : "border-red-500/30"}`}>
          <div className={`flex items-center gap-2 font-semibold text-sm mb-3 ${result.success ? "text-green-400" : "text-red-400"}`}>
            {result.success ? <Check size={16} /> : <AlertCircle size={16} />}
            {result.message}
          </div>
          <div className="space-y-1.5">
            {result.logs?.map((log, i) => (
              <p key={i} className="text-xs font-mono text-muted-foreground bg-background/50 rounded-lg px-3 py-1.5">{log}</p>
            ))}
          </div>
          {result.success && result.repoUrl && (
            <a href={result.repoUrl.replace(".git", "")} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 mt-3 text-xs text-primary hover:underline">
              <ExternalLink size={12} /> Ver en GitHub
            </a>
          )}
        </motion.div>
      )}

      {/* Info */}
      <div className="bg-card border border-border rounded-2xl p-5 space-y-2 text-xs text-muted-foreground">
        <p className="font-semibold text-foreground text-sm">ℹ️ Cómo funciona</p>
        <p>• Se suben TODOS los cambios del proyecto al repositorio configurado</p>
        <p>• Repositorio actual: <span className="font-mono text-foreground">daveymena/bot-agente-ventas3</span></p>
        <p>• El token de GitHub se usa de forma segura (nunca se expone en el código)</p>
        <p>• Usa <code className="bg-background px-1 rounded">--force-with-lease</code> para subir sin sobrescribir trabajo remoto inesperado</p>
      </div>
    </div>
  );
}
