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
    badgeColor: "bg-indigo-500/20 text-indigo-300",
    color: "from-indigo-600/20 to-purple-600/20",
    border: "border-indigo-500/40",
    cta: "Suscribirme Ahora",
    ctaStyle:
      "bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg shadow-indigo-500/30",
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
    badgeColor: "bg-amber-500/20 text-amber-400",
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
    if (token) {
      navigate("/membership");
    }
  }, [token, navigate]);

  const handlePlanClick = (planId: string) => {
    if (token) {
      navigate("/membership");
    } else {
      navigate("/auth?plan=" + planId);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white overflow-x-hidden">
      {/* Navbar */}
      <nav className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-8 py-4 bg-slate-950/80 backdrop-blur-xl border-b border-white/5">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-lg shadow-lg shadow-indigo-500/30">
            🤖
          </div>
          <span className="font-bold text-lg tracking-tight">BotVentas IA</span>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => handlePlanClick("trial")}
            className="text-sm text-slate-400 hover:text-white transition-colors px-4 py-2"
          >
            Iniciar Sesión
          </button>
          <button
            onClick={() => handlePlanClick("trial")}
            className="text-sm bg-indigo-600 hover:bg-indigo-500 text-white px-5 py-2.5 rounded-xl font-semibold transition-colors shadow-lg shadow-indigo-500/20"
          >
            Empezar Gratis →
          </button>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative pt-32 pb-24 px-6 text-center overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-20 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-indigo-600/10 rounded-full blur-3xl" />
          <div className="absolute top-40 left-1/4 w-64 h-64 bg-purple-600/10 rounded-full blur-3xl" />
          <div className="absolute top-40 right-1/4 w-64 h-64 bg-blue-600/10 rounded-full blur-3xl" />
        </div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative max-w-4xl mx-auto"
        >
          <div className="inline-flex items-center gap-2 bg-indigo-500/10 border border-indigo-500/20 rounded-full px-4 py-2 text-sm text-indigo-300 mb-8">
            🎁 <span>7 días gratis sin tarjeta de crédito</span>
          </div>
          <h1 className="text-5xl md:text-7xl font-black leading-tight tracking-tight mb-6">
            Tu Vendedor 24/7
            <span className="bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent block">
              en WhatsApp
            </span>
          </h1>
          <p className="text-lg md:text-xl text-slate-400 max-w-2xl mx-auto mb-10 leading-relaxed">
            Bot de ventas con IA que responde clientes, muestra tu catálogo,
            genera links de pago de
            <strong className="text-white"> Mercado Pago y PayPal</strong> y
            emite facturas automáticamente. Todo desde WhatsApp.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 items-center justify-center">
            <button
              onClick={() => handlePlanClick("trial")}
              className="px-8 py-4 rounded-2xl bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-bold text-lg hover:opacity-90 transition-all shadow-2xl shadow-indigo-500/30 hover:shadow-indigo-500/50 hover:-translate-y-0.5"
            >
              🚀 Empezar Gratis Ahora
            </button>
            <a
              href="#precios"
              className="px-8 py-4 rounded-2xl bg-white/5 border border-white/10 text-white font-semibold text-lg hover:bg-white/10 transition-all"
            >
              Ver Precios →
            </a>
          </div>
          <p className="mt-6 text-sm text-slate-600">
            Sin tarjeta de crédito · Solo desde $30.000 COP/mes · Cancela cuando
            quieras
          </p>
        </motion.div>
      </section>

      {/* Features */}
      <section className="py-24 px-6 max-w-6xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Todo lo que necesita tu negocio
          </h2>
          <p className="text-slate-400 max-w-xl mx-auto">
            Una plataforma completa para automatizar tus ventas en WhatsApp con
            inteligencia artificial de última generación.
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {FEATURES.map((f, i) => (
            <motion.div
              key={f.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className="bg-white/3 border border-white/8 rounded-2xl p-6 hover:bg-white/6 hover:border-white/15 transition-all group"
            >
              <div className="text-4xl mb-4">{f.icon}</div>
              <h3 className="font-bold text-lg mb-2 group-hover:text-indigo-300 transition-colors">
                {f.title}
              </h3>
              <p className="text-slate-400 text-sm leading-relaxed">{f.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Pricing */}
      <section id="precios" className="py-24 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Planes simples y transparentes
            </h2>
            <p className="text-slate-400">
              Empieza gratis hoy. Actualiza cuando quieras.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {PLANS.map((plan, i) => (
              <motion.div
                key={plan.name}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                className={`relative bg-gradient-to-br ${plan.color} border ${plan.border} rounded-3xl p-8 flex flex-col`}
              >
                <div
                  className={`inline-block text-xs font-bold px-3 py-1 rounded-full mb-4 ${plan.badgeColor}`}
                >
                  {plan.badge}
                </div>
                <h3 className="font-bold text-xl mb-2">{plan.name}</h3>
                <div className="mb-6">
                  <span className="text-4xl font-black">{plan.price}</span>
                  <span className="text-slate-400 text-sm ml-2">
                    {plan.period}
                  </span>
                </div>
                <ul className="space-y-3 text-sm mb-8 flex-1">
                  {plan.features.map((f) => (
                    <li key={f} className="text-slate-300">
                      {f}
                    </li>
                  ))}
                </ul>
                <button
                  onClick={() => handlePlanClick("trial")}
                  className={`w-full py-3.5 rounded-xl font-semibold text-sm transition-all hover:-translate-y-0.5 ${plan.ctaStyle}`}
                >
                  {plan.cta}
                </button>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Final */}
      <section className="py-24 px-6 text-center">
        <div className="max-w-2xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            ¿Listo para automatizar tus ventas?
          </h2>
          <p className="text-slate-400 mb-8">
            Únete a cientos de negocios que ya están vendiendo mientras duermen
            gracias a BotVentas IA.
          </p>
          <button
            onClick={() => handlePlanClick("trial")}
            className="px-10 py-4 rounded-2xl bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-bold text-lg hover:opacity-90 transition-all shadow-2xl shadow-indigo-500/30"
          >
            🎁 Empezar 7 Días Gratis
          </button>
          <p className="mt-4 text-sm text-slate-600">
            Sin compromisos · Sin tarjeta de crédito
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-10 px-6 border-t border-white/5 text-center text-slate-600 text-sm">
        <p>© 2025 BotVentas IA · Todos los derechos reservados · Colombia 🇨🇴</p>
      </footer>
    </div>
  );
}
