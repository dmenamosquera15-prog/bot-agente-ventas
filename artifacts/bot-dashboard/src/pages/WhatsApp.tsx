import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { Smartphone, Wifi, WifiOff, RefreshCw, Send, CheckCircle2, XCircle, Loader2 } from "lucide-react";
import QRCode from "qrcode";

interface WaStatus {
  connected: boolean;
  qr: string | null;
  phone: string | null;
  connecting: boolean;
}

const BASE = "/api";

export default function WhatsApp() {
  const [status, setStatus] = useState<WaStatus>({ connected: false, qr: null, phone: null, connecting: false });
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const [testPhone, setTestPhone] = useState("");
  const [testMsg, setTestMsg] = useState("");
  const [sending, setSending] = useState(false);
  const [sendResult, setSendResult] = useState<string | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const fetchStatus = async () => {
    try {
      const r = await fetch(`${BASE}/whatsapp/status`);
      const data: WaStatus = await r.json();
      setStatus(data);
      if (data.qr) {
        const url = await QRCode.toDataURL(data.qr, { width: 280, margin: 2, color: { dark: "#111", light: "#fff" } });
        setQrDataUrl(url);
      } else {
        setQrDataUrl(null);
      }
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
    setStatus({ connected: false, qr: null, phone: null, connecting: false });
    setQrDataUrl(null);
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

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-foreground">WhatsApp</h1>
        <p className="text-muted-foreground mt-1">Conecta tu número de WhatsApp para que el bot atienda clientes en tiempo real</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Connection Card */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-card border border-border rounded-2xl p-8 flex flex-col items-center gap-6">
          {/* Status Badge */}
          <div className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold ${
            status.connected ? "bg-green-500/10 text-green-400 border border-green-500/20" :
            status.connecting ? "bg-yellow-500/10 text-yellow-400 border border-yellow-500/20" :
            "bg-red-500/10 text-red-400 border border-red-500/20"
          }`}>
            {status.connected ? <><CheckCircle2 size={16} /> Conectado</> :
             status.connecting ? <><Loader2 size={16} className="animate-spin" /> Conectando...</> :
             <><XCircle size={16} /> Desconectado</>}
          </div>

          {status.connected ? (
            <div className="text-center space-y-3">
              <div className="w-20 h-20 rounded-full bg-green-500/10 border-2 border-green-500/30 flex items-center justify-center mx-auto">
                <Smartphone className="text-green-400" size={36} />
              </div>
              <div>
                <p className="text-foreground font-semibold text-lg">Bot activo en WhatsApp</p>
                {status.phone && <p className="text-muted-foreground text-sm mt-1">+{status.phone}</p>}
                <p className="text-xs text-muted-foreground mt-2">Los clientes ya pueden escribirte y el bot responderá automáticamente.</p>
              </div>
              <button onClick={handleDisconnect} className="flex items-center gap-2 px-5 py-2 rounded-xl bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20 transition-colors text-sm font-medium">
                <WifiOff size={16} /> Desconectar
              </button>
            </div>
          ) : qrDataUrl ? (
            <div className="text-center space-y-4">
              <p className="text-foreground font-semibold">Escanea con tu WhatsApp</p>
              <div className="p-3 bg-white rounded-2xl shadow-lg inline-block">
                <img src={qrDataUrl} alt="QR WhatsApp" className="w-64 h-64" />
              </div>
              <p className="text-xs text-muted-foreground max-w-xs">
                Abre WhatsApp → Dispositivos vinculados → Vincular dispositivo → escanea el código QR
              </p>
              <button onClick={fetchStatus} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-secondary text-muted-foreground hover:text-foreground transition-colors text-sm">
                <RefreshCw size={14} /> Actualizar QR
              </button>
            </div>
          ) : (
            <div className="text-center space-y-4">
              <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center mx-auto">
                <Smartphone className="text-muted-foreground" size={36} />
              </div>
              <div>
                <p className="text-foreground font-semibold">Conecta WhatsApp</p>
                <p className="text-muted-foreground text-sm mt-1">Se generará un código QR para vincular tu número</p>
              </div>
              <button onClick={handleConnect} className="flex items-center gap-2 px-6 py-3 rounded-xl bg-[#25D366] text-white font-semibold hover:bg-[#1ebe5d] transition-colors shadow-lg shadow-[#25D366]/20">
                <Wifi size={18} /> Conectar WhatsApp
              </button>
            </div>
          )}
        </motion.div>

        {/* Instructions & Send Test */}
        <div className="space-y-5">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="bg-card border border-border rounded-2xl p-6">
            <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
              <Send size={18} className="text-primary" /> Enviar Mensaje de Prueba
            </h3>
            {!status.connected && <p className="text-sm text-muted-foreground mb-4">Conéctate primero para enviar mensajes.</p>}
            <div className="space-y-3">
              <input
                value={testPhone}
                onChange={e => setTestPhone(e.target.value)}
                placeholder="Número (+58 414...)"
                disabled={!status.connected}
                className="w-full px-4 py-2.5 rounded-xl bg-background border border-border text-foreground placeholder-muted-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 disabled:opacity-50"
              />
              <textarea
                value={testMsg}
                onChange={e => setTestMsg(e.target.value)}
                placeholder="Escribe tu mensaje..."
                rows={3}
                disabled={!status.connected}
                className="w-full px-4 py-2.5 rounded-xl bg-background border border-border text-foreground placeholder-muted-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 disabled:opacity-50 resize-none"
              />
              <button
                onClick={handleSend}
                disabled={!status.connected || sending || !testPhone || !testMsg}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-primary text-primary-foreground font-semibold text-sm hover:opacity-90 transition-opacity disabled:opacity-40"
              >
                {sending ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
                Enviar
              </button>
              {sendResult && <p className="text-sm text-center text-muted-foreground">{sendResult}</p>}
            </div>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="bg-card border border-border rounded-2xl p-6 space-y-3">
            <h3 className="font-semibold text-foreground mb-2">Capacidades del Bot</h3>
            {[
              ["🛍️ Ventas", "Muestra productos, precios y cierra ventas"],
              ["🔧 Soporte", "Resuelve dudas técnicas y reclamos"],
              ["📊 Técnico", "Compara especificaciones y recomienda"],
              ["📋 Administrativo", "Facturación, horarios y ubicación"],
              ["🌐 Exportación/Importación", "Gestiona pedidos internacionales"],
            ].map(([title, desc]) => (
              <div key={title} className="flex items-start gap-3 py-2 border-b border-border/50 last:border-0">
                <span className="text-sm font-semibold text-foreground w-40 shrink-0">{title}</span>
                <span className="text-xs text-muted-foreground">{desc}</span>
              </div>
            ))}
          </motion.div>
        </div>
      </div>
    </div>
  );
}
