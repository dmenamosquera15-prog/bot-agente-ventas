import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Smartphone, Wifi, WifiOff, RefreshCw, Send, CheckCircle2,
  XCircle, Loader2, Hash, Copy, Check
} from "lucide-react";
import QRCode from "qrcode";

interface WaStatus {
  connected: boolean;
  qr: string | null;
  phone: string | null;
  connecting: boolean;
  pairingCode: string | null;
}

const BASE = "/api";

export default function WhatsApp() {
  const [status, setStatus] = useState<WaStatus>({ connected: false, qr: null, phone: null, connecting: false, pairingCode: null });
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const [testPhone, setTestPhone] = useState("");
  const [testMsg, setTestMsg] = useState("");
  const [sending, setSending] = useState(false);
  const [sendResult, setSendResult] = useState<string | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const [pairingPhone, setPairingPhone] = useState("");
  const [generatingCode, setGeneratingCode] = useState(false);
  const [pairingCode, setPairingCode] = useState<string | null>(null);
  const [pairingError, setPairingError] = useState<string | null>(null);
  const [codeCopied, setCodeCopied] = useState(false);
  const [connectMethod, setConnectMethod] = useState<"qr" | "phone">("qr");

  const fetchStatus = async () => {
    try {
      const r = await fetch(`${BASE}/whatsapp/status`);
      const data: WaStatus = await r.json();
      setStatus(data);
      if (data.qr) {
        const url = await QRCode.toDataURL(data.qr, { width: 300, margin: 2, color: { dark: "#0f172a", light: "#ffffff" } });
        setQrDataUrl(url);
      } else {
        setQrDataUrl(null);
      }
      if (data.pairingCode) setPairingCode(data.pairingCode);
      if (data.connected) setPairingCode(null);
    } catch { /* ignore */ }
  };

  useEffect(() => {
    fetchStatus();
    intervalRef.current = setInterval(fetchStatus, 3000);
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, []);

  const handleConnect = async () => {
    await fetch(`${BASE}/whatsapp/connect`, { method: "POST" });
    fetchStatus();
  };

  const handleDisconnect = async () => {
    await fetch(`${BASE}/whatsapp/disconnect`, { method: "POST" });
    setStatus({ connected: false, qr: null, phone: null, connecting: false, pairingCode: null });
    setQrDataUrl(null);
    setPairingCode(null);
  };

  const handleGeneratePairingCode = async () => {
    if (!pairingPhone.trim()) return;
    setGeneratingCode(true);
    setPairingError(null);
    setPairingCode(null);
    try {
      const r = await fetch(`${BASE}/whatsapp/pairing-code`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: pairingPhone.replace(/[^0-9]/g, "") }),
      });
      const d = await r.json();
      if (d.pairingCode) {
        setPairingCode(d.pairingCode);
      } else {
        setPairingError(d.error || "Error al generar código");
      }
    } catch {
      setPairingError("Error de conexión, intenta de nuevo");
    }
    setGeneratingCode(false);
  };

  const handleCopy = async () => {
    if (pairingCode) {
      await navigator.clipboard.writeText(pairingCode);
      setCodeCopied(true);
      setTimeout(() => setCodeCopied(false), 2000);
    }
  };

  const handleReset = async () => {
    if (!confirm("¿Estás seguro? Esto cerrará la sesión actual, borrará toda la caché y reiniciará el bot desde cero.")) return;
    setGeneratingCode(true);
    try {
      await fetch(`${BASE}/whatsapp/reset`, { method: "POST" });
      setStatus({ connected: false, qr: null, phone: null, connecting: true, pairingCode: null });
      setQrDataUrl(null);
      setPairingCode(null);
      alert("Sistema reiniciado con éxito.");
    } catch {
      alert("Error al reiniciar el sistema.");
    }
    setGeneratingCode(false);
  };

  const handleSend = async () => {
    if (!testPhone || !testMsg) return;
    setSending(true);
    setSendResult(null);
    try {
      const r = await fetch(`${BASE}/whatsapp/send`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: testPhone, message: testMsg }),
      });
      const d = await r.json();
      setSendResult(d.success ? "✅ Mensaje enviado" : "❌ Error al enviar");
    } catch { setSendResult("❌ Error de conexión"); }
    setSending(false);
  };

  const formatPairingCode = (code: string) => {
    if (code.length === 8) return `${code.slice(0, 4)}-${code.slice(4)}`;
    return code;
  };

  return (
    <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-1000">
      <div>
        <h1 className="text-5xl font-black text-white tracking-tight italic">
          WhatsApp <span className="text-emerald-500">Connect.</span>
        </h1>
        <p className="text-xl text-slate-400 mt-3 font-medium tracking-tight">Vincula tu número para activar la inteligencia de ventas.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
        {/* Connection Card */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }} 
          animate={{ opacity: 1, y: 0 }} 
          className="bg-white/[0.03] backdrop-blur-3xl border border-white/10 rounded-[2.5rem] p-10 flex flex-col items-center gap-10 shadow-2xl relative overflow-hidden group"
        >
          <div className={`absolute top-0 right-0 w-64 h-64 ${status.connected ? 'bg-emerald-500' : 'bg-red-500'}/10 rounded-full blur-[100px] -mr-32 -mt-32`} />
          
          <div className={`flex items-center gap-3 px-6 py-2.5 rounded-full text-xs font-black uppercase tracking-[0.2em] border transition-all duration-500 ${
            status.connected ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/30 shadow-[0_0_20px_rgba(16,185,129,0.2)]" :
            status.connecting ? "bg-amber-500/20 text-amber-400 border-amber-500/30" :
            "bg-red-500/20 text-red-400 border-red-500/30"
          }`}>
            {status.connected ? <><CheckCircle2 size={18} className="animate-pulse" /> Online</> :
             status.connecting ? <><Loader2 size={18} className="animate-spin" /> Sincronizando...</> :
             <><XCircle size={18} /> Offline</>}
          </div>

          {status.connected ? (
            <div className="text-center space-y-10 w-full relative z-10">
              <div className="relative inline-block">
                <div className="absolute inset-[-20px] bg-emerald-500/20 rounded-full blur-3xl animate-pulse" />
                <div className="relative w-36 h-36 rounded-full bg-slate-900 border-2 border-emerald-500/40 flex items-center justify-center mx-auto shadow-2xl">
                  <Smartphone className="text-emerald-400" size={64} />
                </div>
              </div>
              <div>
                <p className="text-white font-black text-4xl tracking-tighter mb-2 italic">Bot Vinculado Expert</p>
                {status.phone && <p className="text-emerald-500 font-black text-2xl tracking-[0.2em]">+{status.phone}</p>}
                <p className="text-slate-500 text-sm mt-8 font-bold max-w-xs mx-auto italic uppercase tracking-wider opacity-60">IA Procesando Clientes en Vivo</p>
              </div>
              <button 
                onClick={handleDisconnect} 
                className="flex items-center gap-3 px-10 py-5 rounded-2xl bg-red-500/10 text-red-500 border border-red-500/20 hover:bg-red-500 hover:text-white transition-all font-black uppercase tracking-widest text-xs mx-auto shadow-2xl"
              >
                <WifiOff size={18} /> Detener Operación
              </button>
            </div>
          ) : (
            <div className="w-full space-y-10 relative z-10">
              <div className="flex bg-white/5 rounded-3xl p-2 border border-white/5">
                <button
                  onClick={() => setConnectMethod("qr")}
                  className={`flex-1 flex items-center justify-center gap-3 py-4 rounded-2xl text-xs font-black uppercase tracking-widest transition-all ${connectMethod === "qr" ? "bg-emerald-600 text-white shadow-xl shadow-emerald-500/20" : "text-slate-500 hover:text-white"}`}
                >
                  <Smartphone size={16} /> Código QR
                </button>
                <button
                  onClick={() => setConnectMethod("phone")}
                  className={`flex-1 flex items-center justify-center gap-3 py-4 rounded-2xl text-xs font-black uppercase tracking-widest transition-all ${connectMethod === "phone" ? "bg-emerald-600 text-white shadow-xl shadow-emerald-500/20" : "text-slate-500 hover:text-white"}`}
                >
                  <Hash size={16} /> Teléfono
                </button>
              </div>

              <AnimatePresence mode="wait">
                {connectMethod === "qr" ? (
                  <motion.div key="qr" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} className="text-center space-y-10">
                    {qrDataUrl ? (
                      <>
                        <p className="text-slate-400 font-black uppercase tracking-[0.3em] text-[10px] opacity-60">Escaneo de seguridad requerido</p>
                        <div className="p-6 bg-white rounded-[3rem] shadow-[0_0_60px_rgba(255,255,255,0.05)] inline-block transform hover:rotate-1 transition-transform duration-700">
                          <img src={qrDataUrl} alt="QR WhatsApp" className="w-64 h-64" />
                        </div>
                        <p className="text-xs text-slate-500 font-bold max-w-xs mx-auto leading-relaxed italic opacity-80">
                          WhatsApp → Dispositivos vinculados → Vincular dispositivo → escanea el código
                        </p>
                        <button onClick={fetchStatus} className="flex items-center gap-2 px-8 py-3 rounded-full bg-white/5 text-slate-500 hover:text-emerald-400 transition-all text-[10px] font-black uppercase tracking-widest mx-auto">
                          <RefreshCw size={14} className="animate-spin-slow" /> Forzar Refresco
                        </button>
                      </>
                    ) : (
                      <div className="text-center space-y-10 py-10">
                        <div className="w-28 h-28 rounded-full bg-slate-900 flex items-center justify-center mx-auto shadow-2xl border border-white/5">
                          <Smartphone className="text-slate-700" size={48} />
                        </div>
                        <button onClick={handleConnect} className="flex items-center gap-4 px-12 py-6 rounded-3xl bg-emerald-600 text-white font-black uppercase tracking-widest text-sm hover:bg-emerald-500 transition-all shadow-[0_20px_40px_rgba(16,185,129,0.3)] mx-auto">
                          <Wifi size={24} /> Generar Acceso QR
                        </button>
                      </div>
                    )}
                  </motion.div>
                ) : (
                  <motion.div key="phone" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} className="space-y-8">
                    <div className="space-y-4">
                      <p className="text-[10px] text-slate-600 font-black uppercase tracking-[0.3em] ml-2">Vinculación por Número</p>
                      <div className="flex gap-4">
                        <input
                          value={pairingPhone}
                          onChange={e => setPairingPhone(e.target.value)}
                          placeholder="Código + Número (Ej: 57300...)"
                          className="flex-1 px-6 py-5 rounded-2xl bg-white/5 border border-white/10 text-white placeholder-slate-700 font-black focus:outline-none focus:border-emerald-500 transition-all"
                        />
                        <button
                          onClick={handleGeneratePairingCode}
                          disabled={!pairingPhone.trim() || generatingCode}
                          className="px-10 py-5 rounded-2xl bg-emerald-600 text-white font-black text-xs uppercase tracking-widest hover:bg-emerald-500 transition-all disabled:opacity-40 shadow-xl"
                        >
                          {generatingCode ? <Loader2 size={20} className="animate-spin" /> : "Vincular"}
                        </button>
                      </div>
                    </div>

                    {pairingError && (
                      <div className="text-xs font-black uppercase tracking-widest text-red-500 bg-red-500/10 border border-red-500/20 rounded-2xl px-6 py-5">
                        ⚠️ Error: {pairingError}
                      </div>
                    )}

                    {pairingCode && (
                      <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="text-center space-y-8 bg-emerald-500/5 border border-emerald-500/20 rounded-[3rem] p-10 mt-6 shadow-2xl">
                        <p className="text-[10px] text-emerald-500 font-black uppercase tracking-[0.4em]">Código Maestro</p>
                        <div className="flex items-center justify-center gap-6">
                          <span className="text-6xl font-mono font-black text-white tracking-[0.3em] italic">
                            {formatPairingCode(pairingCode)}
                          </span>
                          <button onClick={handleCopy} className="p-4 rounded-2xl bg-emerald-600 text-white hover:bg-emerald-500 transition-all shadow-xl active:scale-75">
                            {codeCopied ? <Check size={24} /> : <Copy size={24} />}
                          </button>
                        </div>
                        <div className="flex items-center justify-center gap-4 text-[10px] text-emerald-500 font-black uppercase tracking-[0.2em] mt-6">
                          <div className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                          Esperando Sincronización...
                        </div>
                      </motion.div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
              
              <div className="pt-10 border-t border-white/5 w-full">
                <button 
                  onClick={handleReset}
                  className="w-full py-4 text-[9px] text-slate-700 font-black uppercase tracking-[0.4em] hover:text-red-600 transition-colors flex items-center justify-center gap-3"
                >
                  <RefreshCw size={12} /> Hard Reset Database & Cache
                </button>
              </div>
            </div>
          )}
        </motion.div>

        {/* Action Panel */}
        <div className="space-y-10">
          <motion.div 
            initial={{ opacity: 0, x: 20 }} 
            animate={{ opacity: 1, x: 0 }} 
            className="bg-white/[0.03] backdrop-blur-3xl border border-white/10 rounded-[2.5rem] p-10 shadow-2xl group relative overflow-hidden"
          >
            <div className="absolute -right-20 -bottom-20 w-64 h-64 bg-emerald-500/5 rounded-full blur-[100px]" />
            <h3 className="text-2xl font-black text-white mb-10 flex items-center gap-4 italic tracking-tight">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 flex items-center justify-center">
                <Send size={24} className="text-emerald-400" />
              </div>
              Transmisión Test
            </h3>
            <div className="space-y-6 relative z-10">
              <input
                value={testPhone}
                onChange={e => setTestPhone(e.target.value)}
                placeholder="Número (Ej: 57300...)"
                disabled={!status.connected}
                className="w-full px-7 py-5 rounded-2xl bg-white/5 border border-white/10 text-white placeholder-slate-700 font-black focus:outline-none focus:border-emerald-500 disabled:opacity-20 transition-all"
              />
              <textarea
                value={testMsg}
                onChange={e => setTestMsg(e.target.value)}
                placeholder="Escribe el mensaje de validación..."
                rows={5}
                disabled={!status.connected}
                className="w-full px-7 py-5 rounded-2xl bg-white/5 border border-white/10 text-white placeholder-slate-700 font-black focus:outline-none focus:border-emerald-500 disabled:opacity-20 resize-none transition-all"
              />
              <button
                onClick={handleSend}
                disabled={!status.connected || sending || !testPhone || !testMsg}
                className="w-full flex items-center justify-center gap-4 py-6 rounded-3xl bg-emerald-600 text-white font-black uppercase tracking-[0.2em] text-sm hover:bg-emerald-500 transition-all shadow-2xl shadow-emerald-500/30 disabled:opacity-20 active:scale-95"
              >
                {sending ? <Loader2 size={24} className="animate-spin" /> : <Send size={24} />}
                Ejecutar Envío Directo
              </button>
              <AnimatePresence>
                {sendResult && (
                  <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="text-xs text-center font-black uppercase tracking-[0.3em] text-emerald-500 bg-emerald-500/10 py-4 rounded-2xl">
                    {sendResult}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, x: 20 }} 
            animate={{ opacity: 1, x: 0 }} 
            transition={{ delay: 0.1 }} 
            className="bg-white/[0.03] backdrop-blur-3xl border border-white/10 rounded-[2.5rem] p-10 shadow-2xl"
          >
            <h3 className="text-sm text-slate-500 font-black uppercase tracking-[0.4em] mb-8">Ecosistema IA</h3>
            <div className="space-y-6">
              {[
                { i: "🛍️", t: "Vendedor Maestro", d: "Automatiza cierres de ventas 24/7." },
                { i: "💳", t: "Pasarela Nativa", d: "Cobra por MercadoPago o PayPal al instante." },
                { i: "🧠", t: "Context GPT-4o", d: "IA que recuerda cada detalle del cliente." },
                { i: "🧾", t: "Facturación Pro", d: "Generación automática de facturas PDF." },
              ].map((cap) => (
                <div key={cap.t} className="flex items-center gap-6 p-5 rounded-3xl hover:bg-white/5 transition-all group border border-transparent hover:border-white/5">
                  <span className="text-3xl group-hover:rotate-12 transition-transform">{cap.i}</span>
                  <div>
                    <h4 className="text-sm font-black text-white uppercase tracking-tight">{cap.t}</h4>
                    <p className="text-[10px] text-slate-600 font-bold uppercase tracking-wider mt-1.5">{cap.d}</p>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
