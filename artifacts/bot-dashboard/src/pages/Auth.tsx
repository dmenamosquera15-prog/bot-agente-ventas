import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useLocation } from "wouter";
import { 
  BrainCircuit, Mail, Lock, User, 
  ArrowRight, Loader2, CheckCircle2,
  Building, ShieldCheck
} from "lucide-react";

export default function Auth() {
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [, setLocation] = useLocation();
  
  const [formData, setFormData] = useState({
    email: "", password: "", fullName: "", businessName: ""
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    // Simulate API call
    setTimeout(() => {
      setLoading(false);
      setLocation("/"); // Go to dashboard
    }, 1500);
  };

  return (
    <div className="min-h-screen bg-[#050505] text-white selection:bg-[#25D366]/30 flex flex-col md:flex-row">
      {/* Left side: Hero/Context */}
      <div className="hidden lg:flex w-[40%] bg-white/5 border-r border-white/10 p-16 flex-col justify-between relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-full bg-[#25D366]/5 blur-[120px] rounded-full -translate-x-1/2 -translate-y-1/2" />
        
        <div>
          <div className="flex items-center gap-3 mb-16">
            <div className="w-10 h-10 rounded-2xl bg-[#25D366] flex items-center justify-center">
              <BrainCircuit className="text-black" size={22} />
            </div>
            <span className="text-xl font-bold tracking-tight">Agentic<span className="text-[#25D366]">Bot</span></span>
          </div>
          
          <h2 className="text-4xl font-bold leading-tight mb-6">
            Tu negocio evoluciona <br />
            a la velocidad de la <span className="text-[#25D366]">IA</span>.
          </h2>
          <p className="text-white/40 leading-relaxed mb-12">
            Únete a cientos de empresas que ya están automatizando su atención al cliente en WhatsApp con agentes inteligentes orquestados.
          </p>
          
          <div className="space-y-6">
            <AuthBenefit 
              icon={<CheckCircle2 size={16} className="text-[#25D366]" />}
              text="Multitenancy Seguro"
            />
            <AuthBenefit 
              icon={<CheckCircle2 size={16} className="text-[#25D366]" />}
              text="Catálogo Inteligente"
            />
            <AuthBenefit 
              icon={<CheckCircle2 size={16} className="text-[#25D366]" />}
              text="Voz a Texto (Whisper)"
            />
          </div>
        </div>
        
        <div className="text-xs text-white/20 uppercase tracking-widest font-bold">
          Powered by DeepMind Agentic Coding
        </div>
      </div>

      {/* Right side: Form */}
      <div className="flex-1 flex flex-col items-center justify-center p-8 relative">
        <div className="absolute lg:hidden top-8 left-8 flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-[#25D366] flex items-center justify-center">
            <BrainCircuit className="text-black" size={18} />
          </div>
          <span className="text-lg font-bold">Agentic<span className="text-[#25D366]">Bot</span></span>
        </div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md bg-white/5 border border-white/10 rounded-[40px] p-8 md:p-12 backdrop-blur-xl shadow-2xl relative"
        >
          <div className="absolute -top-6 left-1/2 -translate-x-1/2 w-12 h-12 bg-[#25D366]/20 border border-[#25D366]/40 rounded-2xl flex items-center justify-center">
            <ShieldCheck size={24} className="text-[#25D366]" />
          </div>

          <div className="text-center mb-10">
            <h1 className="text-3xl font-bold mb-2">
              {isLogin ? "Bienvenido de nuevo" : "Crea tu cuenta SaaS"}
            </h1>
            <p className="text-white/40 text-sm">
              {isLogin ? "Accede a tu panel central de agentes" : "Empieza tu prueba gratuita de 14 días"}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <AnimatePresence mode="wait">
              {!isLogin && (
                <motion.div 
                  key="fullName"
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="space-y-5"
                >
                  <AuthInput 
                    icon={<User size={18} />}
                    type="text"
                    placeholder="Tu nombre completo"
                    value={formData.fullName}
                    onChange={v => setFormData({...formData, fullName: v})}
                  />
                  <AuthInput 
                    icon={<Building size={18} />}
                    type="text"
                    placeholder="Nombre de tu negocio"
                    value={formData.businessName}
                    onChange={v => setFormData({...formData, businessName: v})}
                  />
                </motion.div>
              )}
            </AnimatePresence>

            <AuthInput 
              icon={<Mail size={18} />}
              type="email"
              placeholder="correo@ejemplo.com"
              value={formData.email}
              onChange={v => setFormData({...formData, email: v})}
            />
            
            <AuthInput 
              icon={<Lock size={18} />}
              type="password"
              placeholder="Contraseña"
              value={formData.password}
              onChange={v => setFormData({...formData, password: v})}
            />

            <button 
              type="submit"
              disabled={loading}
              className="w-full py-4 rounded-2xl bg-[#25D366] text-black font-bold text-lg hover:bg-[#1ebe5d] transition-all shadow-xl shadow-[#25D366]/10 flex items-center justify-center gap-3 disabled:opacity-50"
            >
              {loading ? <Loader2 className="animate-spin" size={20} /> : (
                <>
                  {isLogin ? "Ingresar al Panel" : "Registrar mi Empresa"}
                  <ArrowRight size={20} />
                </>
              )}
            </button>
          </form>

          <div className="mt-8 text-center pt-8 border-t border-white/5">
            <p className="text-white/30 text-sm">
              {isLogin ? "¿No tienes cuenta aún?" : "¿Ya eres parte de la plataforma?"}
              <button 
                onClick={() => setIsLogin(!isLogin)}
                className="ml-2 text-[#25D366] font-bold hover:underline"
              >
                {isLogin ? "Crea una ahora" : "Inicia Sesión"}
              </button>
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

function AuthInput({ icon, type, placeholder, value, onChange }: { icon: React.ReactNode, type: string, placeholder: string, value: string, onChange: (v: string) => void }) {
  return (
    <div className="relative group">
      <div className="absolute left-5 top-1/2 -translate-y-1/2 text-white/30 transition-colors group-focus-within:text-[#25D366]">
        {icon}
      </div>
      <input 
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full pl-14 pr-6 py-4 rounded-2xl bg-white/5 border border-white/10 text-white placeholder-white/20 text-sm focus:outline-none focus:ring-2 focus:ring-[#25D366]/40 transition-all hover:bg-white/[0.08]"
      />
    </div>
  );
}

function AuthBenefit({ icon, text }: { icon: React.ReactNode, text: string }) {
  return (
    <div className="flex items-center gap-2 text-sm text-white/60">
      {icon}
      {text}
    </div>
  );
}
