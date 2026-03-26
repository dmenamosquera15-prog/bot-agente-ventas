import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useLocation } from "wouter";

export default function Auth() {
  const [mode, setMode] = useState<"login" | "register">("login");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [location, navigate] = useLocation();

  const [form, setForm] = useState({
    email: "",
    password: "",
    fullName: "",
    businessName: "",
    phone: "",
    city: "",
    country: "Colombia",
  });

  useEffect(() => {
    const params = new URLSearchParams(location.split("?")[1] || "");
    if (params.get("plan") && !localStorage.getItem("token")) {
      setMode("register");
    }
  }, [location]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const endpoint = mode === "login" ? "/api/auth/login" : "/api/auth/register";
      const body = mode === "login" ? { email: form.email, password: form.password } : form;

      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Error desconocido");

      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(data.user));

      const params = new URLSearchParams(location.split("?")[1] || "");
      const plan = params.get("plan");
      navigate(plan ? "/membership" : "/");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background visual elements consistent with Landing */}
      <div className="absolute inset-0 pointer-events-none opacity-20">
        <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-emerald-500/20 rounded-full blur-[120px]" />
        <div className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] bg-teal-500/20 rounded-full blur-[120px]" />
      </div>

      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="relative w-full max-w-md z-10"
      >
        {/* Logo */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-3 mb-4">
            <div className="w-14 h-14 rounded-2xl bg-emerald-500 flex items-center justify-center text-3xl shadow-xl shadow-emerald-500/30">
              🤖
            </div>
            <span className="text-3xl font-black text-white tracking-tighter">
              BotVentas <span className="text-emerald-500 text-6xl leading-[0]">.</span>
            </span>
          </div>
          <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">
            Acceso Prioritario al Panel
          </p>
        </div>

        {/* Card */}
        <div className="bg-white/[0.03] backdrop-blur-3xl border border-white/10 rounded-[2.5rem] p-10 shadow-2xl">
          {/* Tabs */}
          <div className="flex bg-white/5 rounded-2xl p-1.5 mb-8">
            {(["login", "register"] as const).map((m) => (
              <button
                key={m}
                onClick={() => {
                  setMode(m);
                  setError(null);
                }}
                className={`flex-1 py-3 rounded-xl text-sm font-black uppercase tracking-widest transition-all ${
                  mode === m
                    ? "bg-emerald-600 text-white shadow-lg shadow-emerald-500/30"
                    : "text-slate-500 hover:text-white"
                }`}
              >
                {m === "login" ? "Entrar" : "Unirse"}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {mode === "register" && (
              <>
                <div>
                  <label className="text-xs font-black text-slate-500 uppercase tracking-widest mb-2 block ml-1">
                    Nombre Completo
                  </label>
                  <input
                    name="fullName"
                    value={form.fullName}
                    onChange={handleChange}
                    required
                    placeholder="Juan Pérez"
                    className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-white placeholder-slate-600 text-sm focus:outline-none focus:border-emerald-500 transition-all font-bold"
                  />
                </div>
                <div>
                  <label className="text-xs font-black text-slate-500 uppercase tracking-widest mb-2 block ml-1">
                    Nombre de tu Negocio
                  </label>
                  <input
                    name="businessName"
                    value={form.businessName}
                    onChange={handleChange}
                    required
                    placeholder="Mi Tienda Digital"
                    className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-white placeholder-slate-600 text-sm focus:outline-none focus:border-emerald-500 transition-all font-bold"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-black text-slate-500 uppercase tracking-widest mb-2 block ml-1">
                      WhatsApp
                    </label>
                    <input
                      name="phone"
                      value={form.phone}
                      onChange={handleChange}
                      placeholder="+57..."
                      className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-white placeholder-slate-600 text-sm focus:outline-none focus:border-emerald-500 transition-all font-bold"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-black text-slate-500 uppercase tracking-widest mb-2 block ml-1">
                      Ciudad
                    </label>
                    <input
                      name="city"
                      value={form.city}
                      onChange={handleChange}
                      placeholder="Bogotá"
                      className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-white placeholder-slate-600 text-sm focus:outline-none focus:border-emerald-500 transition-all font-bold"
                    />
                  </div>
                </div>
              </>
            )}

            <div>
              <label className="text-xs font-black text-slate-500 uppercase tracking-widest mb-2 block ml-1">
                Email Profesional
              </label>
              <input
                name="email"
                type="email"
                value={form.email}
                onChange={handleChange}
                required
                placeholder="hola@negocio.co"
                className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-white placeholder-slate-600 text-sm focus:outline-none focus:border-emerald-500 transition-all font-bold"
              />
            </div>
            <div>
              <label className="text-xs font-black text-slate-500 uppercase tracking-widest mb-2 block ml-1">
                Contraseña
              </label>
              <input
                name="password"
                type="password"
                value={form.password}
                onChange={handleChange}
                required
                placeholder="••••••••"
                className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-white placeholder-slate-600 text-sm focus:outline-none focus:border-emerald-500 transition-all font-bold"
              />
            </div>

            {error && (
              <motion.div 
                initial={{ opacity: 0, y: -10 }} 
                animate={{ opacity: 1, y: 0 }}
                className="bg-red-500/10 border border-red-500/20 rounded-2xl px-5 py-4 text-red-400 text-xs font-bold"
              >
                ⚠️ {error}
              </motion.div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-5 rounded-2xl bg-emerald-600 text-white font-black text-lg uppercase tracking-widest hover:bg-emerald-500 transition-all disabled:opacity-50 shadow-2xl shadow-emerald-500/30 hover:scale-[1.02] active:scale-95"
            >
              {loading ? "⏳ Procesando..." : mode === "login" ? "🚀 Entrar Ahora" : "🎁 Iniciar Mi Prueba"}
            </button>

            <div className="pt-4 text-center">
              {mode === "register" ? (
                <p className="text-xs text-slate-500 font-bold uppercase tracking-widest">
                  Garantía de satisfacción · <span className="text-emerald-500">7 Días Gratis</span>
                </p>
              ) : (
                <button 
                  type="button"
                  onClick={() => setMode("register")}
                  className="text-xs text-emerald-500 font-black uppercase tracking-widest hover:underline"
                >
                  ¿No tienes cuenta? Regístrate aquí
                </button>
              )}
            </div>
          </form>
        </div>

        <p className="text-center text-slate-600 text-xs font-bold uppercase tracking-widest mt-10">
          ¿Problemas con el acceso? <br />
          <a href="mailto:soporte@botventas.ia" className="text-slate-400 hover:text-white transition-colors underline">Contactar Soporte</a>
        </p>
      </motion.div>
    </div>
  );
}
