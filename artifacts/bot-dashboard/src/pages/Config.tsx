import React, { useEffect } from "react";
import { useGetBotConfig, useUpdateBotConfig } from "@workspace/api-client-react";
import { useForm, Controller } from "react-hook-form";
import { Save, Bot, MessageCircle, Building2, ToggleLeft, Globe } from "lucide-react";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

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
      paymentMethods: ["efectivo", "transferencia"],
      workingHours: "Lunes a Viernes 9am - 6pm"
    }
  });

  useEffect(() => {
    if (config) reset(config);
  }, [config, reset]);

  const onSubmit = async (data: any) => {
    try {
      await updateMutation.mutateAsync({ data });
      toast({
        title: "Configuración guardada",
        description: "El bot se ha actualizado exitosamente.",
      });
    } catch (e) {
      toast({
        title: "Error",
        description: "No se pudo guardar la configuración.",
        variant: "destructive"
      });
    }
  };

  if (isLoading) {
    return <div className="p-8 text-center animate-pulse">Cargando configuración...</div>;
  }

  const PAY_METHODS = [
    { id: "efectivo", label: "Efectivo" },
    { id: "transferencia", label: "Transferencia Bancaria" },
    { id: "tarjeta", label: "Tarjeta de Crédito/Débito" },
    { id: "paypal", label: "PayPal" },
    { id: "crypto", label: "Criptomonedas" }
  ];

  return (
    <div className="space-y-8 animate-fade-in max-w-5xl">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-display font-bold text-foreground">Configuración del Bot</h1>
          <p className="text-muted-foreground mt-1">Define la personalidad, reglas y comportamiento general.</p>
        </div>
        <button 
          onClick={handleSubmit(onSubmit)}
          disabled={updateMutation.isPending}
          className="flex items-center gap-2 px-6 py-3 rounded-xl bg-primary text-primary-foreground font-bold shadow-lg shadow-primary/25 hover:shadow-xl hover:-translate-y-0.5 transition-all disabled:opacity-50"
        >
          <Save size={20} />
          {updateMutation.isPending ? 'Guardando...' : 'Guardar Cambios'}
        </button>
      </div>

      <form className="space-y-8" onSubmit={handleSubmit(onSubmit)}>
        {/* Identidad */}
        <section className="bg-card border border-border/50 rounded-3xl p-6 shadow-xl shadow-black/5">
          <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
            <Bot className="text-primary" /> Identidad y Personalidad
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium mb-2 text-muted-foreground">Nombre del Bot</label>
              <input 
                {...register("botName")}
                className="w-full bg-background border border-border rounded-xl px-4 py-3 text-foreground focus:ring-2 focus:ring-primary outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2 text-muted-foreground">Idioma Base</label>
              <select 
                {...register("language")}
                className="w-full bg-background border border-border rounded-xl px-4 py-3 text-foreground focus:ring-2 focus:ring-primary outline-none appearance-none"
              >
                <option value="es">Español</option>
                <option value="en">Inglés</option>
                <option value="pt">Portugués</option>
              </select>
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium mb-2 text-muted-foreground">Prompt de Personalidad (System Prompt)</label>
              <textarea 
                {...register("personality")}
                rows={4}
                className="w-full bg-background border border-border rounded-xl px-4 py-3 text-foreground focus:ring-2 focus:ring-primary outline-none resize-none font-mono text-sm leading-relaxed"
              />
              <p className="text-xs text-muted-foreground mt-2">Instrucciones centrales que el bot seguirá en todas sus interacciones.</p>
            </div>
          </div>
        </section>

        {/* Mensajes Base */}
        <section className="bg-card border border-border/50 rounded-3xl p-6 shadow-xl shadow-black/5">
          <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
            <MessageCircle className="text-primary" /> Textos Predeterminados
          </h2>
          <div className="grid grid-cols-1 gap-6">
            <div>
              <label className="block text-sm font-medium mb-2 text-muted-foreground">Mensaje de Saludo</label>
              <textarea 
                {...register("greetingMessage")}
                rows={2}
                className="w-full bg-background border border-border rounded-xl px-4 py-3 text-foreground focus:ring-2 focus:ring-primary outline-none resize-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2 text-muted-foreground">Mensaje de Fallback (Error)</label>
              <input 
                {...register("fallbackMessage")}
                className="w-full bg-background border border-border rounded-xl px-4 py-3 text-foreground focus:ring-2 focus:ring-primary outline-none"
              />
            </div>
          </div>
        </section>

        {/* Negocio */}
        <section className="bg-card border border-border/50 rounded-3xl p-6 shadow-xl shadow-black/5">
          <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
            <Building2 className="text-primary" /> Datos del Negocio
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium mb-2 text-muted-foreground">Nombre de la Empresa</label>
              <input 
                {...register("businessName")}
                className="w-full bg-background border border-border rounded-xl px-4 py-3 text-foreground focus:ring-2 focus:ring-primary outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2 text-muted-foreground">Tipo de Negocio</label>
              <input 
                {...register("businessType")}
                className="w-full bg-background border border-border rounded-xl px-4 py-3 text-foreground focus:ring-2 focus:ring-primary outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2 text-muted-foreground">Horario de Atención</label>
              <input 
                {...register("workingHours")}
                className="w-full bg-background border border-border rounded-xl px-4 py-3 text-foreground focus:ring-2 focus:ring-primary outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-4 text-muted-foreground">Métodos de Pago Aceptados</label>
              <div className="flex flex-wrap gap-3">
                <Controller
                  name="paymentMethods"
                  control={control}
                  render={({ field }) => (
                    <>
                      {PAY_METHODS.map((method) => {
                        const isChecked = field.value?.includes(method.id);
                        return (
                          <label key={method.id} className={cn(
                            "px-4 py-2 rounded-xl text-sm font-medium cursor-pointer border transition-colors flex items-center gap-2",
                            isChecked 
                              ? "bg-primary/10 border-primary text-primary" 
                              : "bg-background border-border text-muted-foreground hover:bg-secondary"
                          )}>
                            <input 
                              type="checkbox" 
                              className="hidden"
                              checked={isChecked}
                              onChange={(e) => {
                                const newValue = e.target.checked
                                  ? [...(field.value || []), method.id]
                                  : field.value?.filter((v: string) => v !== method.id);
                                field.onChange(newValue);
                              }}
                            />
                            {method.label}
                          </label>
                        );
                      })}
                    </>
                  )}
                />
              </div>
            </div>
          </div>
        </section>

        {/* Sistema */}
        <section className="bg-card border border-border/50 rounded-3xl p-6 shadow-xl shadow-black/5">
          <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
            <ToggleLeft className="text-primary" /> Opciones del Sistema
          </h2>
          <div className="flex flex-col gap-6">
            <label className="flex items-center justify-between p-5 border border-border rounded-2xl bg-background cursor-pointer group hover:border-primary/50 transition-colors">
              <div>
                <span className="font-bold text-lg block">Estado del Bot</span>
                <span className="text-sm text-muted-foreground">Activa o apaga temporalmente el bot en WhatsApp</span>
              </div>
              <Controller
                name="isActive"
                control={control}
                render={({ field }) => (
                  <div className={cn(
                    "w-14 h-8 rounded-full p-1 transition-colors duration-300 ease-in-out",
                    field.value ? "bg-primary" : "bg-secondary"
                  )}>
                    <div className={cn(
                      "w-6 h-6 bg-white rounded-full shadow-md transform transition-transform duration-300 ease-in-out",
                      field.value ? "translate-x-6" : "translate-x-0"
                    )} />
                  </div>
                )}
              />
            </label>
          </div>
        </section>
      </form>
    </div>
  );
}
