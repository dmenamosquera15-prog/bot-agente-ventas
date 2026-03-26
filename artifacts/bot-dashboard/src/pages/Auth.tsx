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
      const endpoint =
        mode === "login" ? "/api/auth/login" : "/api/auth/register";
      const body =
        mode === "login"
          ? { email: form.email, password: form.password }
          : form;

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
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-indigo-950 to-slate-950 flex items-center justify-center p-4">
      {/* BG orbs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative w-full max-w-md"
      >
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-2xl shadow-lg shadow-indigo-500/30">
              🤖
            </div>
            <span className="text-2xl font-bold text-white">BotVentas IA</span>
          </div>
          <p className="text-slate-400 text-sm">
            Tu asistente de ventas en WhatsApp
          </p>
        </div>

        {/* Card */}
        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-8 shadow-2xl">
          {/* Tabs */}
          <div className="flex bg-white/5 rounded-2xl p-1 mb-8">
            {(["login", "register"] as const).map((m) => (
              <button
                key={m}
                onClick={() => {
                  setMode(m);
                  setError(null);
                }}
                className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                  mode === m
                    ? "bg-indigo-600 text-white shadow-lg shadow-indigo-500/30"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                {m === "login" ? "Iniciar Sesión" : "Registrarse"}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === "register" && (
              <>
                <div>
                  <label className="text-xs font-medium text-slate-400 mb-1 block">
                    Nombre Completo *
                  </label>
                  <input
                    name="fullName"
                    value={form.fullName}
                    onChange={handleChange}
                    required
                    placeholder="Juan García"
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-indigo-500 transition-colors"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-slate-400 mb-1 block">
                    Nombre del Negocio *
                  </label>
                  <input
                    name="businessName"
                    value={form.businessName}
                    onChange={handleChange}
                    required
                    placeholder="Mi Tienda Online"
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-indigo-500 transition-colors"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-medium text-slate-400 mb-1 block">
                      Teléfono
                    </label>
                    <input
                      name="phone"
                      value={form.phone}
                      onChange={handleChange}
                      placeholder="3001234567"
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-indigo-500 transition-colors"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-slate-400 mb-1 block">
                      Ciudad
                    </label>
                    <input
                      name="city"
                      value={form.city}
                      onChange={handleChange}
                      placeholder="Bogotá"
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-indigo-500 transition-colors"
                    />
                  </div>
                </div>
              </>
            )}

            <div>
              <label className="text-xs font-medium text-slate-400 mb-1 block">
                Correo Electrónico *
              </label>
              <input
                name="email"
                type="email"
                value={form.email}
                onChange={handleChange}
                required
                placeholder="tu@email.com"
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-indigo-500 transition-colors"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-slate-400 mb-1 block">
                Contraseña *
              </label>
              <input
                name="password"
                type="password"
                value={form.password}
                onChange={handleChange}
                required
                placeholder="••••••••"
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-indigo-500 transition-colors"
              />
            </div>

            {error && (
              <div className="bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3 text-red-400 text-sm">
                ❌ {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-semibold text-sm hover:opacity-90 transition-opacity disabled:opacity-50 shadow-lg shadow-indigo-500/30 mt-2"
            >
              {loading
                ? "⏳ Procesando..."
                : mode === "login"
                  ? "🚀 Entrar al Panel"
                  : "🎁 Crear Cuenta Gratis"}
            </button>

            {mode === "register" && (
              <p className="text-xs text-slate-500 text-center mt-3">
                Al registrarte obtienes{" "}
                <span className="text-indigo-400 font-semibold">
                  7 días gratis
                </span>{" "}
                sin tarjeta de crédito. ✅
              </p>
            )}
          </form>
        </div>

        <p className="text-center text-slate-600 text-xs mt-6">
          ¿Tienes dudas?{" "}
          <a href="/landing" className="text-indigo-400 hover:underline">
            Ver planes y precios →
          </a>
        </p>
      </motion.div>
    </div>
  );
}
