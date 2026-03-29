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
    ctaStyle:
      "bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-500/30",
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
    ctaStyle:
      "bg-gradient-to-r from-amber-500 to-orange-600 text-white shadow-lg shadow-amber-500/30",
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
  {
    icon: "🤖",
    title: "IA Avanzada con GPT-4o",
    desc: "El bot entiende contexto, recuerda productos mencionados y cierra ventas como un humano.",
  },
  {
    icon: "📱",
    title: "WhatsApp Nativo",
    desc: "Conecta tu número de WhatsApp real. Tus clientes no sabrán que es un bot.",
  },
  {
    icon: "💳",
    title: "Pagos Dinámicos",
    desc: "Genera links de pago de Mercado Pago o PayPal en segundos para cualquier producto.",
  },
  {
    icon: "🧠",
    title: "Memoria Majestuosa",
    desc: "El bot recuerda toda la conversación y genera el link de pago para el producto exacto que se discutió.",
  },
  {
    icon: "📊",
    title: "Panel de Control",
    desc: "Monitorea clientes, conversaciones, métricas y gestiona tu catálogo en tiempo real.",
  },
  {
    icon: "🧾",
    title: "Facturación Automática",
    desc: "Genera facturas profesionales con IVA colombiano automáticamente al confirmar cada pago.",
  },
];

export default function Landing() {
  const [, navigate] = useLocation();
  const token =
    typeof window !== "undefined" ? localStorage.getItem("token") : null;

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
          src="/images/abstract_tech_background.jpg"
          alt="Background"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-slate-950/50 to-slate-950" />
      </div>

      {/* Navbar */}
      <nav className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-4 md:px-8 py-3 md:py-4 bg-slate-950/80 backdrop-blur-2xl border-b border-white/10">
        <div className="flex items-center gap-2 md:gap-3 shrink-0">
          <div className="w-8 h-8 md:w-10 md:h-10 rounded-xl md:rounded-2xl bg-emerald-500 flex items-center justify-center text-sm md:text-xl shadow-lg shadow-emerald-500/30">
            🤖
          </div>
          <span className="font-black text-lg md:text-2xl tracking-tighter bg-gradient-to-r from-emerald-400 to-teal-400 bg-clip-text text-transparent truncate">
            BotVentas IA
          </span>
        </div>
        <div className="hidden lg:flex items-center gap-8 text-sm font-medium text-slate-400">
          <a href="#features" className="hover:text-white transition-colors">
            Funciones
          </a>
          <a href="#precios" className="hover:text-white transition-colors">
            Precios
          </a>
          <a href="#demo" className="hover:text-white transition-colors">
            Ver Demo
          </a>
        </div>
        <div className="flex items-center gap-3 md:gap-4 shrink-0">
          <button
            onClick={() => navigate("/auth")}
            className="text-xs md:text-sm font-bold text-slate-300 hover:text-white transition-colors"
          >
            Entrar
          </button>
          <button
            onClick={() => handlePlanClick("trial")}
            className="text-[10px] md:text-sm bg-emerald-600 hover:bg-emerald-500 text-white px-3 py-1.5 md:px-6 md:py-2.5 rounded-full font-bold transition-all shadow-xl shadow-emerald-500/20 active:scale-95 whitespace-nowrap"
          >
            Prueba Gratis
          </button>
        </div>
      </nav>

      {/* Hero Section */}
      <header className="relative pt-32 md:pt-40 pb-16 md:pb-24 px-4 md:px-6 overflow-hidden">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-10 md:gap-16 items-center">
          <motion.div
             initial={{ opacity: 0, x: -30 }}
             animate={{ opacity: 1, x: 0 }}
             className="text-center lg:text-left flex flex-col items-center lg:items-start"
          >
            <div className="inline-flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/20 rounded-full px-3 py-1.5 md:px-4 md:py-2 text-[9px] md:text-xs font-bold text-emerald-400 mb-6 md:mb-8 uppercase tracking-widest leading-none">
              ✨ El futuro de las ventas digitales
            </div>
            <h1 className="text-4xl md:text-6xl lg:text-8xl font-black leading-[1.0] md:leading-[0.9] tracking-tighter mb-6 md:mb-8 px-2 md:px-0">
              Convierte más con <br className="hidden md:block"/>
              <span className="text-emerald-500">WhatsApp IA</span>
            </h1>
            <p className="text-base md:text-xl lg:text-2xl text-slate-400 mb-8 md:mb-10 leading-relaxed max-w-xl px-2 md:px-0">
              Deja que nuestra IA atienda a tus clientes 24/7, muestre tus
              productos y cierre ventas cobrando automáticamente por
              <span className="text-white font-bold ml-1">
                Mercado Pago y PayPal.
              </span>
            </p>
            <div className="flex flex-col sm:flex-row flex-wrap gap-4 items-center justify-center lg:justify-start w-full sm:w-auto px-4 sm:px-0">
              <button
                onClick={() => handlePlanClick("trial")}
                className="w-full sm:w-auto px-6 py-4 rounded-2xl bg-emerald-600 text-white font-black text-lg md:text-xl hover:bg-emerald-500 transition-all shadow-2xl shadow-emerald-500/40 active:scale-95 whitespace-nowrap"
              >
                🚀 Iniciar Gratis
              </button>
              <div className="flex -space-x-3 items-center mt-2 sm:mt-0 sm:ml-4">
                {[1, 2, 3, 4].map((i) => (
                  <div
                    key={i}
                    className="w-8 h-8 md:w-10 md:h-10 rounded-full border-2 border-slate-950 bg-slate-800"
                  />
                ))}
                <span className="ml-4 md:ml-6 text-xs md:text-sm text-slate-500 font-bold">
                  +2.4k negocios ya lo usan
                </span>
              </div>
            </div>
          </motion.div>

          <motion.div
             initial={{ opacity: 0, scale: 0.9 }}
             animate={{ opacity: 1, scale: 1 }}
             className="relative mt-8 lg:mt-0 px-6 sm:px-0 w-full flex justify-center"
          >
            <div className="absolute -inset-4 bg-emerald-500/20 rounded-full blur-[60px] md:blur-[100px] opacity-40 md:opacity-50" />
            <img
              src="/images/whatsapp_bot_mockup.jpg"
              alt="Bot Interface"
              className="relative rounded-3xl md:rounded-[2rem] shadow-2xl border border-white/10 w-full max-w-[280px] md:max-w-sm object-cover"
            />
          </motion.div>
        </div>
      </header>

      {/* Stats / Proof */}
      <section className="bg-slate-900/50 py-10 md:py-12 border-y border-white/5">
        <div className="max-w-7xl mx-auto flex flex-wrap justify-center md:justify-around gap-8 md:gap-12 px-6">
          {[
            { n: "+50k", l: "Conversaciones hoy" },
            { n: "99.9%", l: "Uptime garantizado" },
            { n: "x3", l: "Aumento en conversiones" },
            { n: "24/7", l: "Soporte Prioritario" },
          ].map((s) => (
            <div key={s.l} className="text-center w-[40%] md:w-auto">
              <div className="text-2xl md:text-3xl font-black text-white">{s.n}</div>
              <div className="text-[10px] md:text-sm font-bold text-slate-500 uppercase tracking-widest mt-1">
                {s.l}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Dashboard Preview */}
      <section id="demo" className="py-16 md:py-24 px-4 md:px-6 overflow-hidden">
        <div className="max-w-7xl mx-auto text-center mb-10 md:mb-16">
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-black mb-4 md:mb-6">
            Gestiona todo desde un solo lugar
          </h2>
          <p className="text-base md:text-xl text-slate-400 max-w-2xl mx-auto">
            Nuestro panel de control te permite ver métricas, editar productos y
            administrar tus facturas en tiempo real.
          </p>
        </div>
        <motion.div
           initial={{ opacity: 0, y: 50 }}
           whileInView={{ opacity: 1, y: 0 }}
           className="max-w-5xl mx-auto rounded-2xl md:rounded-3xl overflow-hidden shadow-2xl border border-white/10"
        >
          <img
            src="/images/saas_dashboard_preview.jpg"
            alt="SaaS Dashboard Preview"
            className="w-full object-cover aspect-video bg-slate-900 text-slate-500 font-bold flexitems-center justify-center min-h-[200px]"
            onError={(e) => {
              // Fallback if image doesn't exist
              const target = e.target as HTMLImageElement;
              target.style.display = "none";
              target.parentElement?.classList.add("bg-slate-900", "min-h-[200px]", "md:min-h-[400px]", "flex", "items-center", "justify-center", "text-slate-500");
              if(target.parentElement) target.parentElement.innerHTML = "📊 Dashboard Interface (Simulación)";
            }}
          />
        </motion.div>
      </section>

      {/* Features Grid */}
      <section id="features" className="py-24 px-6 max-w-7xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {FEATURES.map((f, i) => (
            <div
              key={f.title}
              className="p-8 rounded-3xl bg-white/5 border border-white/10 hover:border-emerald-500/50 hover:bg-emerald-500/5 transition-all group"
            >
              <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 flex items-center justify-center text-3xl mb-6 group-hover:scale-110 transition-transform">
                {f.icon}
              </div>
              <h3 className="text-2xl font-black mb-4 group-hover:text-emerald-400 transition-colors">
                {f.title}
              </h3>
              <p className="text-slate-400 leading-relaxed font-medium">
                {f.desc}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Pricing Table */}
      <section id="precios" className="py-16 md:py-24 px-4 md:px-6 bg-slate-900/30">
        <div className="max-w-7xl mx-auto text-center mb-10 md:mb-16">
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-black mb-4 md:mb-6 italic">
            Planes Sin Complicaciones
          </h2>
          <p className="text-base md:text-xl text-slate-400">
            Escala tu negocio a medida que creces.
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8 max-w-6xl mx-auto">
          {PLANS.map((plan) => (
            <div
              key={plan.id}
              className={`relative flex flex-col p-8 md:p-10 rounded-3xl md:rounded-[3rem] border-2 transition-all hover:scale-[1.02] ${
                plan.id === "monthly"
                  ? "border-emerald-500 bg-emerald-500/10"
                  : "border-white/10 bg-slate-900/50"
              }`}
            >
              <div
                className={`self-start text-[10px] md:text-xs font-black uppercase tracking-widest px-3 py-1 md:px-4 md:py-1.5 rounded-full mb-6 md:mb-8 ${
                  plan.id === "monthly"
                    ? "bg-emerald-500 text-white"
                    : "bg-white/10 text-slate-300"
                }`}
              >
                {plan.badge}
              </div>
              <h3 className="text-3xl md:text-4xl font-black mb-2">{plan.name}</h3>
              <div className="mb-6 md:mb-8">
                <span className="text-4xl md:text-5xl font-black">{plan.price}</span>
                <span className="text-slate-500 ml-2 font-bold text-sm md:text-base">
                  {plan.period}
                </span>
              </div>
              <ul className="space-y-3 md:space-y-4 mb-8 md:mb-10 flex-1">
                {plan.features.map((feat) => (
                  <li
                    key={feat}
                    className="flex items-center gap-3 text-slate-300 font-medium text-sm md:text-base"
                  >
                    <span className="text-emerald-500 text-base md:text-lg shrink-0">✦</span>{" "}
                    {feat.replace(/^✅|^⏳/, "")}
                  </li>
                ))}
              </ul>
              <button
                onClick={() => handlePlanClick(plan.id)}
                className={`w-full py-3 md:py-4 rounded-xl md:rounded-2xl font-black text-base md:text-lg transition-all ${
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
      <section className="py-20 md:py-32 px-4 md:px-6 relative overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] md:w-[600px] md:h-[600px] bg-emerald-500/20 rounded-full blur-[80px] md:blur-[120px] pointer-events-none" />
        <div className="max-w-4xl mx-auto text-center relative z-10">
          <h2 className="text-5xl md:text-7xl lg:text-8xl font-black leading-[1.0] md:leading-[0.9] tracking-tighter mb-8 md:mb-10 italic">
            Empieza hoy el mañana <br className="hidden md:block"/> de tu negocio
          </h2>
          <button
            onClick={() => handlePlanClick("trial")}
            className="w-full sm:w-auto px-8 py-5 md:px-12 md:py-6 rounded-2xl md:rounded-3xl bg-emerald-500 text-slate-950 font-black text-xl md:text-3xl hover:bg-emerald-400 transition-all shadow-2xl shadow-emerald-500/50 hover:scale-105 active:scale-95"
          >
            🎁 7 DÍAS GRATIS
          </button>
          <p className="mt-6 md:mt-8 text-slate-500 font-bold uppercase tracking-[0.2em] md:tracking-[0.3em] text-xs md:text-base">
            Cero Riesgo · Cancela en Segundos
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-20 px-8 border-t border-white/5 bg-slate-950">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-12">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500 flex items-center justify-center text-xl shadow-lg">
              🤖
            </div>
            <span className="font-black text-2xl tracking-tighter">
              BotVentas IA
            </span>
          </div>
          <div className="flex gap-10 text-slate-500 font-bold uppercase tracking-widest text-xs">
            <a href="#" className="hover:text-white transition-colors">
              Términos
            </a>
            <a href="#" className="hover:text-white transition-colors">
              Privacidad
            </a>
            <a href="#" className="hover:text-white transition-colors">
              Contacto
            </a>
          </div>
          <p className="text-slate-600 font-medium">
            © 2025 BotVentas IA · Colombia 🇨🇴
          </p>
        </div>
      </footer>
    </div>
  );
}
