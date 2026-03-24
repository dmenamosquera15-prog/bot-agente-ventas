import { motion } from "framer-motion";
import { Link } from "wouter";
import { 
  BrainCircuit, MessageSquare, Zap, Shield, 
  BarChart3, Globe, ArrowRight, CheckCircle2,
  Smartphone, Cpu, Sparkle
} from "lucide-react";

export default function Landing() {
  return (
    <div className="min-h-screen bg-[#050505] text-white selection:bg-[#25D366]/30 overflow-x-hidden">
      {/* Navbar */}
      <nav className="fixed top-0 inset-x-0 z-50 border-b border-white/5 bg-black/50 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#25D366] flex items-center justify-center shadow-[0_0_20px_rgba(37,211,102,0.3)]">
              <BrainCircuit className="text-black" size={22} />
            </div>
            <span className="text-xl font-bold tracking-tight">Agentic<span className="text-[#25D366]">Bot</span></span>
          </div>
          
          <div className="hidden md:flex items-center gap-8 text-sm font-medium text-white/60">
            <a href="#features" className="hover:text-white transition-colors">Funciones</a>
            <a href="#agentes" className="hover:text-white transition-colors">Agentes IA</a>
            <a href="#precios" className="hover:text-white transition-colors">Precios</a>
          </div>

          <Link href="/auth">
            <button className="px-6 py-2.5 rounded-full bg-white text-black font-semibold text-sm hover:bg-white/90 transition-all hover:scale-105 active:scale-95 shadow-xl shadow-white/10">
              Empezar ahora
            </button>
          </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-40 pb-20 px-6 overflow-hidden">
        {/* Blurred background glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[600px] bg-[#25D366]/10 blur-[120px] rounded-full -z-10 opacity-50" />
        
        <div className="max-w-7xl mx-auto text-center">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/5 border border-white/10 text-[#25D366] text-xs font-bold uppercase tracking-widest mb-8"
          >
            <Sparkle size={14} /> Nueva Generación de IA para Negocios
          </motion.div>
          
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-5xl md:text-7xl lg:text-8xl font-black tracking-tighter mb-8 leading-[0.9]"
          >
            Vende más con <br />
            <span className="bg-gradient-to-r from-[#25D366] to-[#128C7E] bg-clip-text text-transparent">Agentes Inteligentes</span>
          </motion.h1>
          
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-white/60 text-lg md:text-xl max-w-2xl mx-auto mb-12"
          >
            Automatiza ventas, soporte y catálogo en WhatsApp. Deja que nuestra IA orquestada atienda a tus clientes mientras tú escalas tu negocio.
          </motion.p>
          
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4"
          >
            <Link href="/auth">
              <button className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-[#25D366] text-black font-bold text-lg hover:bg-[#1ebe5d] transition-all shadow-2xl shadow-[#25D366]/20 flex items-center gap-2 group">
                Crear mi Bot Gratis <ArrowRight className="group-hover:translate-x-1 transition-transform" />
              </button>
            </Link>
            <button className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-white/5 border border-white/10 text-white font-bold text-lg hover:bg-white/10 transition-all backdrop-blur-sm">
              Ver Demo Interactiva
            </button>
          </motion.div>
        </div>
      </section>

      {/* Stats / Features Grid */}
      <section id="features" className="py-20 px-6 max-w-7xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <FeatureCard 
            icon={<Zap className="text-[#25D366]" />}
            title="Orquestación de Agentes"
            desc="Un cerebro central decide qué agente (Ventas, Técnico, Soporte) responde mejor a cada cliente."
          />
          <FeatureCard 
            icon={<MessageSquare className="text-[#25D366]" />}
            title="Ventas Automáticas"
            desc="Consulta de stock, descripciones persuasivas y cierre de pedidos sin intervención humana."
          />
          <FeatureCard 
            icon={<BarChart3 className="text-[#25D366]" />}
            title="Dashboard de Control"
            desc="Analiza conversaciones, probabilidad de compra y el rendimiento de tus agentes en tiempo real."
          />
        </div>
      </section>

      {/* Showcase Section */}
      <section className="py-20 bg-white/5 border-y border-white/5 overflow-hidden">
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          <div>
            <h2 className="text-4xl md:text-5xl font-bold tracking-tight mb-6">
              Escucha a tus clientes. Literalmente.
            </h2>
            <div className="space-y-6">
              <BulletPoint 
                title="Transcripción de Voz (Whisper)"
                desc="El bot entiende notas de voz de clientes y las procesa instantáneamente."
              />
              <BulletPoint 
                title="Respuestas de Audio (TTS)"
                desc="La IA puede responder con notas de voz naturales, creando una experiencia humana."
              />
              <BulletPoint 
                title="Acceso al Catálogo"
                desc="Búsqueda inteligente en base de datos para responder sobre productos específicos."
              />
            </div>
          </div>
          
          <div className="relative">
            <div className="absolute inset-0 bg-[#25D366]/20 blur-[80px] rounded-full -z-10" />
            <motion.div 
              whileHover={{ scale: 1.02 }}
              className="bg-[#0a0a0a] border border-white/10 rounded-3xl p-4 shadow-2xl relative overflow-hidden"
            >
              <div className="bg-[#128C7E]/10 p-4 rounded-2xl mb-4 border border-[#128C7E]/20">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-8 h-8 rounded-full bg-[#25D366]/20 border border-[#25D366]/40" />
                  <span className="text-xs font-semibold text-white/50">Cliente WhatsApp</span>
                </div>
                <div className="bg-[#25D366]/10 p-3 rounded-xl border border-[#25D366]/20 inline-flex items-center gap-3">
                  <Smartphone size={16} className="text-[#25D366]" />
                  <span className="text-sm">🎵 (Nota de Voz: ¿Tienen guitarras Fender?)</span>
                </div>
              </div>
              
              <div className="bg-white/5 p-4 rounded-2xl border border-white/10">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-8 h-8 rounded-full bg-[#25D366] flex items-center justify-center">
                    <BrainCircuit size={16} className="text-black" />
                  </div>
                  <span className="text-xs font-semibold text-[#25D366]">Bot Inteligente</span>
                </div>
                <p className="text-sm text-white/80 leading-relaxed italic">
                  "¡Hola! Sí, tenemos 3 modelos de Fender en stock. La Stratocaster Player series está en oferta..."
                </p>
                <div className="mt-3 flex items-center gap-2 text-[10px] text-white/30 uppercase tracking-widest font-bold">
                  <CheckCircle2 size={10} className="text-[#25D366]" /> Orquestado por GPT-4o
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-20 border-t border-white/10">
        <div className="max-w-7xl mx-auto px-6 text-center">
          <div className="flex items-center justify-center gap-3 mb-8">
            <div className="w-8 h-8 rounded-xl bg-[#25D366] flex items-center justify-center">
              <BrainCircuit className="text-black" size={16} />
            </div>
            <span className="text-lg font-bold tracking-tight text-white">AgenticBot</span>
          </div>
          <p className="text-white/40 text-sm">© 2026 AgenticBot SaaS. Todos los derechos reservados.</p>
        </div>
      </footer>
    </div>
  );
}

function FeatureCard({ icon, title, desc }: { icon: React.ReactNode, title: string, desc: string }) {
  return (
    <motion.div 
      whileHover={{ y: -10 }}
      className="bg-white/5 border border-white/10 p-8 rounded-3xl hover:bg-white/[0.07] transition-all hover:border-[#25D366]/30 group"
    >
      <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
        {icon}
      </div>
      <h3 className="text-xl font-bold mb-3">{title}</h3>
      <p className="text-white/50 text-sm leading-relaxed">{desc}</p>
    </motion.div>
  );
}

function BulletPoint({ title, desc }: { title: string, desc: string }) {
  return (
    <div className="flex gap-4">
      <div className="mt-1 w-5 h-5 rounded-full bg-[#25D366]/10 flex items-center justify-center shrink-0">
        <CheckCircle2 className="text-[#25D366]" size={14} />
      </div>
      <div>
        <h4 className="font-bold text-lg mb-1">{title}</h4>
        <p className="text-white/50 text-sm leading-relaxed">{desc}</p>
      </div>
    </div>
  );
}
