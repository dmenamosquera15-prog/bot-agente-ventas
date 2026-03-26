import { motion } from "framer-motion";
import { useLocation } from "wouter";
import { useEffect } from "react";

const PLANS = [
  {
    id: "trial",
    name: "Prueba Gratuita",
    price: "$0",
    period: "7 días",
    badge: "SIN TARJETA",
    badgeColor: "bg-emerald-500/20 text-emerald-400",
    color: "from-slate-800 to-slate-800",
    border: "border-white/10",
    cta: "Empezar Gratis",
    ctaStyle: "bg-white/10 hover:bg-white/20 text-white",
    features: [
      "✅ Bot de WhatsApp con IA",
      "✅ Respuestas automáticas 24/7",
      "✅ Catálogo de productos",
      "✅ 1 número de WhatsApp",
      "✅ Panel de control completo",
      "⏳ 7 días de duración",
    ],
  },
  {
    id: "monthly",
    name: "Plan Mensual",
    price: "$30.000",
    period: "COP / mes",
    badge: "MÁS POPULAR",
    badgeColor: "bg-emerald-500 text-white",
    color: "from-emerald-600/20 to-teal-600/20",
    border: "border-emerald-500/40",
    cta: "Suscribirme Ahora",
    ctaStyle: "bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-500/30",
    features: [
      "✅ Todo lo del plan gratis",
      "✅ IA con memoria majestuosa",
      "✅ Links de pago dinámicos",
      "✅ Mercado Pago y PayPal",
      "✅ Facturas automáticas",
      "✅ Renovación mensual",
    ],
  },
  {
    id: "annual",
    name: "Plan Anual",
    price: "$360.000",
    period: "COP / año",
    badge: "MEJOR VALOR",
    badgeColor: "bg-amber-500 text-white",
    color: "from-amber-600/10 to-orange-600/10",
    border: "border-amber-500/30",
    cta: "Obtener Plan Anual",
    ctaStyle: "bg-gradient-to-r from-amber-500 to-orange-600 text-white shadow-lg shadow-amber-500/30",
    features: [
      "✅ Todo lo del plan mensual",
      "✅ 2 meses GRATIS incluidos",
      "✅ Soporte prioritario",
      "✅ Actualizaciones premium",
      "✅ Sin interrupciones por 12 meses",
      "✅ Precio bloqueado (sin alzas)",
    ],
  },
];

const FEATURES = [
  { icon: "🤖", title: "IA Avanzada con GPT-4o", desc: "El bot entiende contexto, recuerda productos mencionados y cierra ventas como un humano." },
  { icon: "📱", title: "WhatsApp Nativo", desc: "Conecta tu número de WhatsApp real. Tus clientes no sabrán que es un bot." },
  { icon: "💳", title: "Pagos Dinámicos", desc: "Genera links de pago de Mercado Pago o PayPal en segundos para cualquier producto." },
  { icon: "🧠", title: "Memoria Majestuosa", desc: "El bot recuerda toda la conversación y genera el link de pago para el producto exacto que se discutió." },
  { icon: "📊", title: "Panel de Control", desc: "Monitorea clientes, conversaciones, métricas y gestiona tu catálogo en tiempo real." },
  { icon: "🧾", title: "Facturación Automática", desc: "Genera facturas profesionales con IVA colombiano automáticamente al confirmar cada pago." },
];

export default function Landing() {
  const [, navigate] = useLocation();
  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;

  useEffect(() => {
    // We maintain root redirect logic if needed, but usually landing is public
  }, [token, navigate]);

  const handlePlanClick = (planId: string) => {
    if (token) {
      navigate("/");
    } else {
      navigate("/auth?plan=" + planId);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white font-sans selection:bg-emerald-500/30">
      {/* Dynamic Header / Background Image */}
      <div className="absolute top-0 left-0 w-full h-[800px] pointer-events-none opacity-40">
        <img 
          src="/images/abstract_tech_background.png" 
          alt="Background" 
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-slate-950/50 to-slate-950" />
      </div>

      {/* Navbar */}
      <nav className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-8 py-4 bg-slate-950/80 backdrop-blur-2xl border-b border-white/10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-emerald-500 flex items-center justify-center text-xl shadow-lg shadow-emerald-500/30">
            🤖
          </div>
          <span className="font-black text-2xl tracking-tighter bg-gradient-to-r from-emerald-400 to-teal-400 bg-clip-text text-transparent">
            BotVentas IA
          </span>
        </div>
        <div className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-400">
          <a href="#features" className="hover:text-white transition-colors">Funciones</a>
          <a href="#precios" className="hover:text-white transition-colors">Precios</a>
          <a href="#demo" className="hover:text-white transition-colors">Ver Demo</a>
        </div>
        <div className="flex items-center gap-4">
          <button onClick={() => navigate("/auth")} className="text-sm font-bold text-slate-300 hover:text-white transition-colors">
            Entrar
          </button>
          <button 
            onClick={() => handlePlanClick("trial")}
            className="text-sm bg-emerald-600 hover:bg-emerald-500 text-white px-6 py-2.5 rounded-full font-bold transition-all shadow-xl shadow-emerald-500/20 active:scale-95"
          >
            Prueba de 7 Días
          </button>
        </div>
      </nav>

      {/* Hero Section */}
      <header className="relative pt-40 pb-24 px-6 overflow-hidden">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          <motion.div 
            initial={{ opacity: 0, x: -30 }} 
            animate={{ opacity: 1, x: 0 }}
            className="text-left"
          >
            <div className="inline-flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/20 rounded-full px-4 py-2 text-xs font-bold text-emerald-400 mb-8 uppercase tracking-widest">
              ✨ El futuro de las ventas digitales
            </div>
            <h1 className="text-6xl md:text-8xl font-black leading-[0.9] tracking-tighter mb-8">
              Convierte más con <br />
              <span className="text-emerald-500">WhatsApp IA</span>
            </h1>
            <p className="text-xl md:text-2xl text-slate-400 mb-10 leading-relaxed max-w-xl">
              Deja que nuestra IA atienda a tus clientes 24/7, muestre tus productos y cierre ventas cobrando automáticamente por 
              <span className="text-white font-bold ml-1">Mercado Pago y PayPal.</span>
            </p>
            <div className="flex flex-wrap gap-4 items-center">
              <button 
                onClick={() => handlePlanClick("trial")}
                className="px-8 py-4 rounded-2xl bg-emerald-600 text-white font-black text-xl hover:bg-emerald-500 transition-all shadow-2xl shadow-emerald-500/40 hover:-translate-y-1 active:translate-y-0"
              >
                🚀 Iniciar Mi Tienda Gratis
              </button>
              <div className="flex -space-x-3 items-center ml-4">
                {[1,2,3,4].map(i => (
                  <div key={i} className="w-10 h-10 rounded-full border-2 border-slate-950 bg-slate-800" />
                ))}
                <span className="ml-6 text-sm text-slate-500 font-bold">+2.4k negocios ya lo usan</span>
              </div>
            </div>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="relative"
          >
            <div className="absolute -inset-4 bg-emerald-500/20 rounded-full blur-[100px] opacity-50" />
            <img 
              src="/images/whatsapp_bot_mockup.png" 
              alt="Bot Interface" 
              className="relative rounded-3xl shadow-2xl border border-white/10 w-full max-w-sm mx-auto"
            />
          </motion.div>
        </div>
      </header>

      {/* Stats / Proof */}
      <section className="bg-slate-900/50 py-12 border-y border-white/5">
        <div className="max-w-7xl mx-auto flex flex-wrap justify-center md:justify-around gap-12 px-6">
          {[
            { n: "+50k", l: "Conversaciones hoy" },
            { n: "99.9%", l: "Uptime garantizado" },
            { n: "x3", l: "Aumento en conversiones" },
            { n: "24/7", l: "Soporte Prioritario" },
          ].map(s => (
            <div key={s.l} className="text-center">
              <div className="text-3xl font-black text-white">{s.n}</div>
              <div className="text-sm font-bold text-slate-500 uppercase tracking-widest">{s.l}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Dashboard Preview */}
      <section id="demo" className="py-24 px-6 overflow-hidden">
        <div className="max-w-7xl mx-auto text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-black mb-6">Gestiona todo desde un solo lugar</h2>
          <p className="text-xl text-slate-400 max-w-2xl mx-auto">Nuestro panel de control te permite ver métricas, editar productos y administrar tus facturas en tiempo real.</p>
        </div>
        <motion.div 
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          className="max-w-5xl mx-auto rounded-3xl overflow-hidden shadow-2xl border border-white/10"
        >
          <img src="/images/saas_dashboard_preview.png" alt="SaaS Dashboard" className="w-full" />
        </motion.div>
      </section>

      {/* Features Grid */}
      <section id="features" className="py-24 px-6 max-w-7xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {FEATURES.map((f, i) => (
            <div key={f.title} className="p-8 rounded-3xl bg-white/5 border border-white/10 hover:border-emerald-500/50 hover:bg-emerald-500/5 transition-all group">
              <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 flex items-center justify-center text-3xl mb-6 group-hover:scale-110 transition-transform">
                {f.icon}
              </div>
              <h3 className="text-2xl font-black mb-4 group-hover:text-emerald-400 transition-colors">{f.title}</h3>
              <p className="text-slate-400 leading-relaxed font-medium">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Pricing Table */}
      <section id="precios" className="py-24 px-6 bg-slate-900/30">
        <div className="max-w-7xl mx-auto text-center mb-16">
          <h2 className="text-5xl md:text-6xl font-black mb-6 italic">Planes Sin Complicaciones</h2>
          <p className="text-xl text-slate-400">Escala tu negocio a medida que creces.</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {PLANS.map((plan) => (
            <div 
              key={plan.id}
              className={`relative flex flex-col p-10 rounded-[3rem] border-2 transition-all hover:scale-[1.02] ${
                plan.id === "monthly" ? "border-emerald-500 bg-emerald-500/10" : "border-white/10 bg-slate-900/50"
              }`}
            >
              <div className={`self-start text-xs font-black uppercase tracking-widest px-4 py-1.5 rounded-full mb-8 ${
                 plan.id === "monthly" ? "bg-emerald-500 text-white" : "bg-white/10 text-slate-300"
              }`}>
                {plan.badge}
              </div>
              <h3 className="text-4xl font-black mb-2">{plan.name}</h3>
              <div className="mb-8">
                <span className="text-5xl font-black">{plan.price}</span>
                <span className="text-slate-500 ml-2 font-bold">{plan.period}</span>
              </div>
              <ul className="space-y-4 mb-10 flex-1">
                {plan.features.map(feat => (
                  <li key={feat} className="flex items-center gap-3 text-slate-300 font-medium">
                    <span className="text-emerald-500 text-lg">✦</span> {feat.replace(/^✅|^⏳/, '')}
                  </li>
                ))}
              </ul>
              <button 
                onClick={() => handlePlanClick(plan.id)}
                className={`w-full py-4 rounded-2xl font-black text-lg transition-all ${
                  plan.id === "monthly" 
                  ? "bg-emerald-600 text-white shadow-xl shadow-emerald-500/40 hover:bg-emerald-500" 
                  : "bg-white/10 text-white hover:bg-white/20"
                }`}
              >
                {plan.cta}
              </button>
            </div>
          ))}
        </div>
      </section>

      {/* CTA Final */}
      <section className="py-32 px-6 relative overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-emerald-500/20 rounded-full blur-[120px] pointer-events-none" />
        <div className="max-w-4xl mx-auto text-center relative z-10">
          <h2 className="text-6xl md:text-8xl font-black leading-[0.9] tracking-tighter mb-10 italic">
            Empieza hoy el mañana <br /> de tu negocio
          </h2>
          <button 
            onClick={() => handlePlanClick("trial")}
            className="px-12 py-6 rounded-3xl bg-emerald-500 text-slate-950 font-black text-3xl hover:bg-emerald-400 transition-all shadow-2xl shadow-emerald-500/50 hover:scale-105 active:scale-95"
          >
            🎁 7 DÍAS GRATIS
          </button>
          <p className="mt-8 text-slate-500 font-bold uppercase tracking-[0.3em]">Cero Riesgo · Cancela en Segundos</p>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-20 px-8 border-t border-white/5 bg-slate-950">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-12">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500 flex items-center justify-center text-xl shadow-lg">🤖</div>
            <span className="font-black text-2xl tracking-tighter">BotVentas IA</span>
          </div>
          <div className="flex gap-10 text-slate-500 font-bold uppercase tracking-widest text-xs">
            <a href="#" className="hover:text-white transition-colors">Términos</a>
            <a href="#" className="hover:text-white transition-colors">Privacidad</a>
            <a href="#" className="hover:text-white transition-colors">Contacto</a>
          </div>
          <p className="text-slate-600 font-medium">© 2025 BotVentas IA · Colombia 🇨🇴</p>
        </div>
      </footer>
    </div>
  );
}
