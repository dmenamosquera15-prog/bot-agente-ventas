import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Github, Copy, Check, Loader2, ExternalLink, RefreshCw, CheckCircle2, XCircle, Zap, Key } from "lucide-react";

const BASE = "/api";
const COPILOT_MODELS = ["gpt-4o", "gpt-4o-mini", "claude-3.5-sonnet", "claude-3.7-sonnet", "claude-3.7-sonnet-thought", "gemini-2.0-flash", "o3-mini", "o1"];

type Step = "idle" | "waiting" | "success" | "error";

export default function GitHubCopilot() {
  const [step, setStep] = useState<Step>("idle");
  const [flowId, setFlowId] = useState<string>("");
  const [userCode, setUserCode] = useState<string>("");
  const [verificationUri, setVerificationUri] = useState("https://github.com/login/device");
  const [copied, setCopied] = useState(false);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [hasPat, setHasPat] = useState(false);
  const [connected, setConnected] = useState(false);
  const [connectedModel, setConnectedModel] = useState("");
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const stopPolling = () => { if (pollRef.current) { clearInterval(pollRef.current); pollRef.current = null; } };
  useEffect(() => () => stopPolling(), []);

  useEffect(() => {
    fetch(`${BASE}/github-copilot/status`)
      .then(r => r.json())
      .then(d => { setHasPat(d.hasPat); setConnected(d.connected); setConnectedModel(d.model || ""); })
      .catch(() => {});
  }, [step]);

  // Method 1: Quick connect via PAT (instant)
  const connectViaPat = async () => {
    setLoading(true);
    setMessage("");
    try {
      const r = await fetch(`${BASE}/github-copilot/connect-pat`, { method: "POST" });
      const d = await r.json();
      if (d.success) { setStep("success"); setMessage(d.message); }
      else { setStep("error"); setMessage(d.error || "Error al conectar"); }
    } catch { setStep("error"); setMessage("Error de conexión con el servidor"); }
    setLoading(false);
  };

  // Method 2: Device OAuth flow
  const startDeviceFlow = async () => {
    setStep("idle"); setMessage("");
    try {
      const r = await fetch(`${BASE}/github-copilot/device-flow`, { method: "POST" });
      const d = await r.json();
      if (d.error) { setStep("error"); setMessage(d.error); return; }
      setFlowId(d.flowId);
      setUserCode(d.userCode);
      setVerificationUri(d.verificationUri || "https://github.com/login/device");
      setStep("waiting");
      let interval = (d.interval || 5) * 1000;
      pollRef.current = setInterval(async () => {
        try {
          const pr = await fetch(`${BASE}/github-copilot/poll/${d.flowId}`, { method: "POST" });
          const pd = await pr.json();
          if (pd.status === "success") { stopPolling(); setStep("success"); setMessage(pd.message || "Conectado"); }
          else if (pd.status === "expired") { stopPolling(); setStep("error"); setMessage("El código expiró. Inténtalo de nuevo."); }
          else if (pd.status === "error") { stopPolling(); setStep("error"); setMessage(pd.error || "Error de autorización"); }
          else if (pd.interval) { clearInterval(pollRef.current!); interval = pd.interval * 1000; pollRef.current = setInterval(arguments.callee, interval); }
        } catch { /* keep polling */ }
      }, interval);
    } catch { setStep("error"); setMessage("Error al conectar con GitHub"); }
  };

  const reset = () => { stopPolling(); setStep("idle"); setFlowId(""); setUserCode(""); setMessage(""); setLoading(false); };
  const copyCode = () => { navigator.clipboard.writeText(userCode); setCopied(true); setTimeout(() => setCopied(false), 2000); };

  return (
    <div className="space-y-6 max-w-lg">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-[#24292e] border border-white/10 flex items-center justify-center">
          <Github className="text-white" size={22} />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-foreground">GitHub Copilot</h1>
          <p className="text-muted-foreground text-sm mt-0.5">Usa GPT-4o, Claude, Gemini y más vía tu suscripción Copilot.</p>
        </div>
      </div>

      {/* Already connected */}
      {connected && step === "idle" && (
        <div className="flex items-center gap-3 p-4 rounded-xl bg-green-500/10 border border-green-500/20 text-sm text-green-400">
          <CheckCircle2 size={16} />
          <span>Copilot conectado — usando <strong>{connectedModel}</strong></span>
          <button onClick={reset} className="ml-auto text-xs text-muted-foreground hover:text-foreground">Reconectar</button>
        </div>
      )}

      <AnimatePresence mode="wait">
        {step === "idle" && (
          <motion.div key="idle" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-3">

            {/* Option 1: PAT (fastest) */}
            {hasPat && (
              <div className="bg-card border border-primary/30 rounded-2xl p-5">
                <div className="flex items-start gap-3 mb-4">
                  <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                    <Zap size={16} className="text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground text-sm">Conexión rápida con tu token de GitHub</h3>
                    <p className="text-xs text-muted-foreground mt-0.5">Usa el Personal Access Token que ya tienes configurado. Instantáneo.</p>
                  </div>
                </div>
                <button onClick={connectViaPat} disabled={loading} className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:opacity-90 transition-opacity disabled:opacity-60">
                  {loading ? <Loader2 size={15} className="animate-spin" /> : <Zap size={15} />}
                  {loading ? "Conectando..." : "Conectar con mi token de GitHub"}
                </button>
              </div>
            )}

            {/* Option 2: Device flow */}
            <div className="bg-card border border-border rounded-2xl p-5">
              <div className="flex items-start gap-3 mb-4">
                <div className="w-8 h-8 rounded-xl bg-secondary flex items-center justify-center shrink-0">
                  <Key size={16} className="text-muted-foreground" />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground text-sm">Autorización por código {hasPat ? "(alternativo)" : ""}</h3>
                  <p className="text-xs text-muted-foreground mt-0.5">Genera un código, visita GitHub y autoriza manualmente.</p>
                </div>
              </div>
              <div className="bg-muted/30 rounded-xl p-3 text-xs text-muted-foreground space-y-1 mb-4">
                <p className="font-medium text-foreground">Modelos disponibles:</p>
                <div className="flex flex-wrap gap-1.5 mt-1">
                  {COPILOT_MODELS.map(m => <span key={m} className="bg-background border border-border px-2 py-0.5 rounded-full text-foreground">{m}</span>)}
                </div>
              </div>
              <button onClick={startDeviceFlow} className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-[#24292e] text-white text-sm font-semibold hover:bg-[#1a1f24] transition-colors border border-white/10">
                <Github size={15} /> Iniciar con código de autorización
              </button>
            </div>
            <p className="text-xs text-muted-foreground text-center">Requiere suscripción activa a GitHub Copilot</p>
          </motion.div>
        )}

        {step === "waiting" && (
          <motion.div key="waiting" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="bg-card border border-border rounded-2xl overflow-hidden">
            <div className="bg-[#24292e] px-6 py-4 flex items-center gap-3">
              <Github className="text-white" size={18} />
              <span className="text-white font-semibold text-sm">Conectar GitHub Copilot</span>
            </div>
            <div className="p-6 space-y-5">
              <p className="text-sm text-muted-foreground">
                Visita <a href={verificationUri} target="_blank" rel="noopener noreferrer" className="text-primary underline underline-offset-2 font-medium">este enlace</a> e introduce el código para conectar tu cuenta.
              </p>
              <div>
                <p className="text-xs text-muted-foreground mb-2">Código de confirmación</p>
                <div className="flex items-center gap-2">
                  <div className="flex-1 px-4 py-3 rounded-xl bg-background border border-border font-mono text-2xl tracking-[0.4em] font-bold text-foreground text-center select-all">
                    {userCode}
                  </div>
                  <button onClick={copyCode} className="p-3 rounded-xl bg-secondary border border-border hover:bg-muted transition-colors shrink-0">
                    {copied ? <Check size={18} className="text-green-400" /> : <Copy size={18} className="text-muted-foreground" />}
                  </button>
                </div>
              </div>
              <div className="flex items-center gap-3 py-3 border-t border-border/50">
                <Loader2 size={15} className="animate-spin text-primary shrink-0" />
                <span className="text-sm text-muted-foreground">Esperando autorización...</span>
                <a href={verificationUri} target="_blank" rel="noopener noreferrer" className="ml-auto flex items-center gap-1.5 text-xs text-primary hover:underline shrink-0">
                  Abrir GitHub <ExternalLink size={11} />
                </a>
              </div>
              <button onClick={reset} className="text-xs text-muted-foreground hover:text-foreground transition-colors">Cancelar</button>
            </div>
          </motion.div>
        )}

        {step === "success" && (
          <motion.div key="success" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-card border border-green-500/30 rounded-2xl p-8 text-center space-y-4">
            <CheckCircle2 size={52} className="text-green-400 mx-auto" />
            <div>
              <h3 className="text-xl font-bold text-foreground">¡GitHub Copilot Conectado!</h3>
              <p className="text-muted-foreground text-sm mt-1">{message}</p>
            </div>
            <div className="bg-green-500/10 border border-green-500/20 rounded-xl p-3 text-sm text-green-400">
              Los agentes ahora usan los modelos de GitHub Copilot por defecto.
            </div>
            <button onClick={reset} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-secondary text-muted-foreground text-sm hover:text-foreground transition-colors mx-auto">
              <RefreshCw size={14} /> Volver
            </button>
          </motion.div>
        )}

        {step === "error" && (
          <motion.div key="error" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-card border border-red-500/30 rounded-2xl p-6 space-y-4">
            <div className="flex items-start gap-3">
              <XCircle size={20} className="text-red-400 shrink-0 mt-0.5" />
              <div>
                <h3 className="font-semibold text-foreground">Error de Conexión</h3>
                <p className="text-muted-foreground text-sm mt-1">{message}</p>
              </div>
            </div>
            <div className="flex gap-3">
              {hasPat && (
                <button onClick={connectViaPat} disabled={loading} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:opacity-90 transition-opacity">
                  <Zap size={14} /> Intentar con mi PAT
                </button>
              )}
              <button onClick={reset} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-secondary text-muted-foreground text-sm hover:text-foreground transition-colors">
                <RefreshCw size={14} /> Volver
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
