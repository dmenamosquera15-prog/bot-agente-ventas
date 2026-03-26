import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Check, ShieldCheck, Zap, Rocket, Crown, CreditCard } from "lucide-react";

const PLANS = [
  { 
    id: "monthly", 
    name: "Plan Mensual", 
    price: "30.000", 
    period: "COP / mes", 
    color: "emerald",
    icon: Rocket,
    desc: "Perfecto para negocios que están escalando rápidamente."
  },
  { 
    id: "annual", 
    name: "Plan Anual", 
    price: "360.000", 
    period: "COP / año", 
    color: "amber",
    icon: Crown,
    desc: "Ahorra y asegura tu bot por todo el año con facturación premium."
  },
];

const FEATURES = [
  "IA con Memoria Contextual Avanzada",
  "Links de Pago MercadoPago/PayPal Ilimitados",
  "Facturación DIAN Automática (PDF)",
  "Soporte Prioritario VIP 24/7",
  "Dashboard de Métricas Pro",
  "Importación Masiva de Productos",
];

export default function Membership() {
  const [loading, setLoading] = useState(false);

  const handleSubscribe = async (planId: string) => {
    setLoading(true);
    try {
      const res = await fetch("/api/auth/subscribe", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${localStorage.getItem("token")}`
        },
        body: JSON.stringify({ plan: planId, paymentMethod: "mercadopago" }),
      });
      const data = await res.json();
      if (data.paymentLink) {
        window.location.href = data.paymentLink;
      }
    } catch (err) {
      alert("Error al generar el link de pago");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-1000">
      <div>
        <h1 className="text-5xl font-black text-white tracking-tight italic">
          Power <span className="text-emerald-500">Membresía.</span>
        </h1>
        <p className="text-xl text-slate-400 mt-3 font-medium tracking-tight">Escala tu negocio con el asistente de ventas más potente del mercado.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
        {PLANS.map((plan, idx) => (
          <motion.div 
            key={plan.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.1 }}
            className="group p-10 rounded-[3rem] bg-white/[0.03] backdrop-blur-3xl border border-white/10 hover:border-emerald-500/50 transition-all duration-500 flex flex-col shadow-2xl relative overflow-hidden"
          >
            <div className={`absolute top-0 right-0 w-64 h-64 ${plan.color === 'emerald' ? 'bg-emerald-500' : 'bg-amber-500'}/10 rounded-full blur-[100px] -mr-32 -mt-32 opacity-0 group-hover:opacity-100 transition-opacity`} />
            
            <div className="flex items-center gap-4 mb-8">
              <div className={`w-14 h-14 rounded-2xl ${plan.color === 'emerald' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-amber-500/20 text-amber-500'} flex items-center justify-center`}>
                <plan.icon size={28} />
              </div>
              <div>
                <h3 className="text-2xl font-black text-white italic tracking-tight">{plan.name}</h3>
                <p className="text-[10px] text-slate-500 font-black uppercase tracking-[0.2em]">Acceso Full</p>
              </div>
            </div>

            <div className="mb-10">
              <span className="text-5xl font-black text-white italic tracking-tighter">$ {plan.price}</span>
              <span className="text-slate-500 font-bold ml-3 uppercase text-xs tracking-widest">{plan.period}</span>
              <p className="text-slate-400 mt-4 text-sm font-medium leading-relaxed italic">{plan.desc}</p>
            </div>

            <div className="space-y-4 mb-12 flex-1 relative z-10">
              {FEATURES.map((feat, i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className={`w-5 h-5 rounded-full ${plan.color === 'emerald' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-amber-500/10 text-amber-500'} flex items-center justify-center shrink-0`}>
                    <Check size={12} strokeWidth={4} />
                  </div>
                  <span className="text-sm text-slate-400 font-bold group-hover:text-slate-300 transition-colors">{feat}</span>
                </div>
              ))}
            </div>

            <button 
              disabled={loading}
              onClick={() => handleSubscribe(plan.id)}
              className={`w-full py-5 rounded-3xl font-black uppercase tracking-widest transition-all text-sm relative z-10 overflow-hidden ${
                plan.color === "emerald" 
                ? "bg-emerald-600 text-white shadow-[0_15px_30px_rgba(16,185,129,0.3)] hover:bg-emerald-500 active:scale-95" 
                : "bg-amber-600 text-white shadow-[0_15px_30px_rgba(245,158,11,0.3)] hover:bg-amber-500 active:scale-95"
              }`}
            >
              <div className="flex items-center justify-center gap-3">
                {loading ? <Zap className="animate-spin" size={18} /> : <CreditCard size={18} />}
                {loading ? "Generando..." : "Activar Ahora"}
              </div>
            </button>
          </motion.div>
        ))}
      </div>

      <div className="p-10 rounded-[2.5rem] bg-white/[0.02] border border-white/5 relative overflow-hidden group">
        <div className="absolute inset-0 bg-emerald-500/5 opacity-0 group-hover:opacity-100 transition-opacity" />
        <div className="flex flex-col md:flex-row items-center gap-10 relative z-10">
          <div className="w-20 h-20 rounded-full bg-slate-900 border border-emerald-500/30 flex items-center justify-center">
            <ShieldCheck className="text-emerald-500" size={36} />
          </div>
          <div className="flex-1 text-center md:text-left">
            <h4 className="text-xl font-black text-white italic mb-2 tracking-tight flex items-center gap-2 justify-center md:justify-start">
              Garantía de Satisfacción Total
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
              <div className="space-y-2">
                <p className="text-xs text-white font-black uppercase tracking-widest">¿Puedo cancelar en cualquier momento?</p>
                <p className="text-xs text-slate-500 font-bold leading-relaxed">Sí, nuestra plataforma no tiene cláusulas de permanencia. Puedes cancelar tu suscripción mensual o anual cuando desees desde tu panel de configuración.</p>
              </div>
              <div className="space-y-2">
                <p className="text-xs text-white font-black uppercase tracking-widest">¿Qué métodos de pago soportan?</p>
                <p className="text-xs text-slate-500 font-bold leading-relaxed">Aceptamos todas las tarjetas de crédito, PSE y Efecty vía Mercado Pago, además de pagos internacionales a través de PayPal para garantizar seguridad total.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
