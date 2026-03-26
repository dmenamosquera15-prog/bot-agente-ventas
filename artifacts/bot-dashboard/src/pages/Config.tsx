import React, { useEffect } from "react";
import { useGetBotConfig, useUpdateBotConfig } from "@workspace/api-client-react";
import { useForm, Controller } from "react-hook-form";
import { Save, Bot, MessageCircle, Building2, ToggleLeft, Globe, ShoppingBag, CreditCard, Clock, ShieldCheck, Zap } from "lucide-react";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { motion } from "framer-motion";

export default function Config() {
  const { data: config, isLoading } = useGetBotConfig();
  const updateMutation = useUpdateBotConfig();
  const { toast } = useToast();

  const { register, handleSubmit, reset, control, watch } = useForm({
    defaultValues: config || {
      botName: "Bot Inteligente",
      personality: "Amable, persuasivo y experto en tecnología.",
      language: "es",
      greetingMessage: "¡Hola! Bienvenido a nuestra tienda. ¿En qué te puedo ayudar hoy?",
      fallbackMessage: "Lo siento, no entendí tu mensaje. ¿Podrías reformularlo?",
      maxContextMessages: 10,
      isActive: true,
      businessName: "Mi Tienda",
      businessType: "E-commerce Tecnología",
      paymentMethods: "Efectivo, Transferencia",
      workingHours: "Lunes a Viernes 9am - 6pm",
      bankName: "",
      bankAccount: "",
      bankAccountType: "",
      bankOwner: "",
      nequiNumber: "",
      daviplataNumber: "",
      paypalEmail: "",
      mercadoPagoLink: "",
      wooCommerceUrl: "",
      wooCommerceConsumerKey: "",
      wooCommerceConsumerSecret: ""
    }
  });

  useEffect(() => {
    if (config) reset(config);
  }, [config, reset]);

  const onSubmit = async (data: any) => {
    try {
      await updateMutation.mutateAsync({ data });
      toast({
        title: "Sincronización Exitosa",
        description: "Los parámetros del núcleo de IA han sido actualizados.",
      });
    } catch (e) {
      toast({
        title: "Error de Sincronización",
        description: "No se pudieron guardar los cambios en la base de datos.",
        variant: "destructive"
      });
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center p-20 space-y-4">
        <Zap className="text-emerald-500 animate-pulse" size={48} />
        <p className="text-slate-500 font-black uppercase tracking-[0.3em] text-[10px]">Cargando Núcleo de Configuración...</p>
      </div>
    );
  }

  return (
    <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-1000 pb-20">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-8">
        <div>
          <h1 className="text-5xl font-black text-white tracking-tight italic">
            Configuración <span className="text-emerald-500">Core.</span>
          </h1>
          <p className="text-xl text-slate-400 mt-3 font-medium tracking-tight">Define el ADN, la personalidad y las integraciones de tu bot.</p>
        </div>
        <button 
          onClick={handleSubmit(onSubmit)}
          disabled={updateMutation.isPending}
          className="flex items-center gap-3 px-10 py-4 rounded-[1.5rem] bg-emerald-600 text-white font-black uppercase tracking-widest text-xs shadow-2xl shadow-emerald-500/30 hover:bg-emerald-500 hover:-translate-y-1 transition-all active:scale-95 disabled:opacity-50"
        >
          <Save size={20} />
          {updateMutation.isPending ? 'Sincronizando...' : 'Guardar Cambios'}
        </button>
      </div>

      <form className="grid grid-cols-1 lg:grid-cols-2 gap-8" onSubmit={handleSubmit(onSubmit)}>
        
        {/* Identidad */}
        <motion.section 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white/[0.03] backdrop-blur-3xl border border-white/10 rounded-[2.5rem] p-10 shadow-2xl space-y-8"
        >
          <h2 className="text-xl font-black text-white italic tracking-tight flex items-center gap-4">
            <div className="p-3 bg-emerald-500/10 rounded-2xl text-emerald-500">
              <Bot size={24} />
            </div>
            Identidad Maestro
          </h2>
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-[10px] font-black uppercase tracking-[0.2em] mb-3 text-slate-500 italic">Nombre del Agente</label>
                <input 
                  {...register("botName")}
                  className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-white font-bold focus:outline-none focus:border-emerald-500 transition-all"
                />
              </div>
              <div>
                <label className="block text-[10px] font-black uppercase tracking-[0.2em] mb-3 text-slate-500 italic">Idioma del Modelo</label>
                <select 
                  {...register("language")}
                  className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-white font-bold focus:outline-none focus:border-emerald-500 transition-all appearance-none cursor-pointer"
                >
                  <option value="es" className="bg-slate-900">Español (Latino)</option>
                  <option value="en" className="bg-slate-900">English (Neutral)</option>
                  <option value="pt" className="bg-slate-900">Português</option>
                </select>
              </div>
            </div>
            <div>
              <label className="block text-[10px] font-black uppercase tracking-[0.2em] mb-3 text-slate-500 italic">ADN / Personality Prompt</label>
              <textarea 
                {...register("personality")}
                rows={5}
                className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-white font-bold focus:outline-none focus:border-emerald-500 transition-all resize-none leading-relaxed text-sm"
              />
            </div>
          </div>
        </motion.section>

        {/* Mensajería */}
        <motion.section 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white/[0.03] backdrop-blur-3xl border border-white/10 rounded-[2.5rem] p-10 shadow-2xl space-y-8"
        >
          <h2 className="text-xl font-black text-white italic tracking-tight flex items-center gap-4">
            <div className="p-3 bg-blue-500/10 rounded-2xl text-blue-500">
              <MessageCircle size={24} />
            </div>
            Protocolos de Respuesta
          </h2>
          <div className="space-y-6">
            <div>
              <label className="block text-[10px] font-black uppercase tracking-[0.2em] mb-3 text-slate-500 italic">Mensaje de Bienvenida Automática</label>
              <textarea 
                {...register("greetingMessage")}
                rows={3}
                className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-white font-bold focus:outline-none focus:border-emerald-500 transition-all resize-none"
              />
            </div>
            <div>
              <label className="block text-[10px] font-black uppercase tracking-[0.2em] mb-3 text-slate-500 italic">Script de Error (Fallback)</label>
              <input 
                {...register("fallbackMessage")}
                className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-white font-bold focus:outline-none focus:border-emerald-500 transition-all"
              />
            </div>
            <div className="bg-blue-500/5 border border-blue-500/10 p-5 rounded-2xl">
               <p className="text-[10px] text-blue-400 font-bold leading-relaxed uppercase tracking-wider">
                  ⚠️ Estos mensajes son la primera y última línea de defensa de la experiencia del usuario. Úsalos con sabiduría profesional.
               </p>
            </div>
          </div>
        </motion.section>

        {/* Integración WooCommerce */}
        <motion.section 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white/[0.03] backdrop-blur-3xl border border-white/10 rounded-[2.5rem] p-10 shadow-2xl lg:col-span-2 relative overflow-hidden group shadow-emerald-500/5"
        >
          <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-[100px] -mr-32 -mt-32" />
          
          <h2 className="text-xl font-black text-white italic tracking-tight flex items-center gap-4 relative z-10">
            <div className="p-3 bg-indigo-500/10 rounded-2xl text-indigo-400">
              <ShoppingBag size={24} />
            </div>
            Automatización WooCommerce & Dropi
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-10 relative z-10">
            <div className="md:col-span-1">
              <label className="block text-[10px] font-black uppercase tracking-[0.2em] mb-3 text-slate-500 italic">URL de la Tienda</label>
              <input 
                {...register("wooCommerceUrl")}
                placeholder="https://tutienda.com"
                className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-white font-bold focus:outline-none focus:border-indigo-500 transition-all font-mono text-xs"
              />
            </div>
            <div>
              <label className="block text-[10px] font-black uppercase tracking-[0.2em] mb-3 text-slate-500 italic">Consumer Key (CK)</label>
              <input 
                {...register("wooCommerceConsumerKey")}
                placeholder="ck_xxxxxxxxxxxxxxxx"
                className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-white font-bold focus:outline-none focus:border-indigo-500 transition-all font-mono text-xs"
              />
            </div>
            <div>
              <label className="block text-[10px] font-black uppercase tracking-[0.2em] mb-3 text-slate-500 italic">Consumer Secret (CS)</label>
              <input 
                type="password"
                {...register("wooCommerceConsumerSecret")}
                placeholder="cs_xxxxxxxxxxxxxxxx"
                className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-white font-bold focus:outline-none focus:border-indigo-500 transition-all font-mono text-xs"
              />
            </div>
          </div>
          
          <div className="mt-8 p-6 bg-white/5 border border-white/5 rounded-3xl flex items-center gap-6 relative z-10">
             <div className="w-12 h-12 rounded-full bg-indigo-500/10 flex items-center justify-center text-indigo-400 shrink-0">
                <ShieldCheck size={24} />
             </div>
             <div>
                <h4 className="text-xs font-black text-white uppercase tracking-widest mb-1 italic">Sincronización de Pedidos</h4>
                <p className="text-[10px] text-slate-500 font-medium">Al activar esta integración, el bot creará automáticamente los pedidos en WooCommerce cuando el cliente confirme sus datos de envío.</p>
             </div>
          </div>
        </motion.section>

        {/* Configuración Negocio */}
        <motion.section 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white/[0.03] backdrop-blur-3xl border border-white/10 rounded-[2.5rem] p-10 shadow-2xl space-y-8"
        >
          <h2 className="text-xl font-black text-white italic tracking-tight flex items-center gap-4">
            <div className="p-3 bg-purple-500/10 rounded-2xl text-purple-400">
              <Building2 size={24} />
            </div>
            Operación del Negocio
          </h2>
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-[10px] font-black uppercase tracking-[0.2em] mb-3 text-slate-500 italic">Razón Social</label>
                <input 
                  {...register("businessName")}
                  className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-white font-bold focus:outline-none focus:border-emerald-500 transition-all"
                />
              </div>
              <div>
                <label className="block text-[10px] font-black uppercase tracking-[0.2em] mb-3 text-slate-500 italic">Categoría / Nicho</label>
                <input 
                  {...register("businessType")}
                  className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-white font-bold focus:outline-none focus:border-emerald-500 transition-all"
                />
              </div>
            </div>
            <div>
              <label className="block text-[10px] font-black uppercase tracking-[0.2em] mb-3 text-slate-500 italic">Horario de Respuesta Activa</label>
              <input 
                {...register("workingHours")}
                className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-white font-bold focus:outline-none focus:border-emerald-500 transition-all placeholder-slate-700"
                placeholder="Ej: Lunes a Sabado - 8:00 AM a 8:00 PM"
              />
            </div>
            <div>
              <label className="block text-[10px] font-black uppercase tracking-[0.2em] mb-3 text-slate-500 italic">Métodos de Pago Descritos</label>
              <input 
                {...register("paymentMethods")}
                className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-white font-bold focus:outline-none focus:border-emerald-500 transition-all"
                placeholder="Ej: Nequi, Daviplata, Pago Contra Entrega"
              />
            </div>
          </div>
        </motion.section>

        {/* Estado Global */}
        <motion.section 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-white/[0.03] backdrop-blur-3xl border border-white/10 rounded-[2.5rem] p-10 shadow-2xl relative overflow-hidden"
        >
          <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-full blur-3xl -mr-16 -mt-16" />
          
          <h2 className="text-xl font-black text-white italic tracking-tight flex items-center gap-4 mb-10">
            <div className="p-3 bg-slate-500/10 rounded-2xl text-slate-400">
              <ToggleLeft size={24} />
            </div>
            Interruptor Maestro
          </h2>

          <Controller
            name="isActive"
            control={control}
            render={({ field }) => (
              <label className="flex items-center justify-between p-8 border border-white/10 rounded-[2rem] bg-white/5 cursor-pointer group hover:border-emerald-500/30 transition-all">
                <div className="space-y-2">
                  <span className="font-black text-xl text-white block italic">Operación de IA</span>
                  <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Estado En Tiempo Real del Motor Cognitivo</span>
                </div>
                <div className={cn(
                  "w-20 h-10 rounded-full p-2 transition-all duration-500 ease-in-out relative",
                  field.value ? "bg-emerald-600 shadow-[0_0_20px_rgba(16,185,129,0.3)]" : "bg-white/10"
                )}>
                  <div className={cn(
                    "w-6 h-6 bg-white rounded-full shadow-2xl transform transition-transform duration-500 ease-in-out",
                    field.value ? "translate-x-10" : "translate-x-0"
                  )} />
                </div>
                <input 
                  type="checkbox" 
                  className="hidden"
                  checked={field.value}
                  onChange={(e) => field.onChange(e.target.checked)}
                />
              </label>
            )}
          />

          <div className="mt-10 p-8 rounded-[2rem] border border-dashed border-white/10 text-center">
             <Zap size={32} className="mx-auto text-slate-700 mb-4" />
             <p className="text-[9px] text-slate-500 font-black uppercase tracking-[0.2em] leading-relaxed">
                Recuerda que cada cambio impacta directamente en la memoria operativa de tus agentes distribuidos.
             </p>
          </div>
        </motion.section>

      </form>
    </div>
  );
}
