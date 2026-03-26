import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Receipt, Download, CreditCard, Calendar, ShieldCheck, Zap } from "lucide-react";

export default function Billing() {
  const [invoices, setInvoices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [subscription, setSubscription] = useState<any>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem("token");
        const [invRes, meRes] = await Promise.all([
          fetch("/api/auth/invoices", { headers: { "Authorization": `Bearer ${token}` } }),
          fetch("/api/auth/me", { headers: { "Authorization": `Bearer ${token}` } })
        ]);
        const invData = await invRes.json();
        const meData = await meRes.json();
        setInvoices(invData || []);
        setSubscription(meData.subscription);
      } catch (err) {
        console.error("Error fetching billing data:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleDownload = (invoiceId: number) => {
    window.open(`/api/auth/invoices/${invoiceId}/html`, "_blank");
  };

  const getPlanName = (p: string) => {
    switch(p) {
      case 'trial': return 'Prueba de 7 Días';
      case 'monthly': return 'Plan Mensual Pro';
      case 'annual': return 'Plan Anual Expert';
      default: return 'Plan No Identificado';
    }
  };

  return (
    <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-1000">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-8">
        <div>
          <h1 className="text-5xl font-black text-white tracking-tight italic">
            Billing <span className="text-emerald-500">& Invoices.</span>
          </h1>
          <p className="text-xl text-slate-400 mt-3 font-medium tracking-tight">Gestiona tu suscripción y descarga tus comprobantes legales.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Status Card */}
        <div className="lg:col-span-2 space-y-8">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white/[0.03] backdrop-blur-3xl border border-white/10 rounded-[2.5rem] p-10 shadow-2xl relative overflow-hidden group"
          >
            <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 rounded-full blur-[100px] -mr-32 -mt-32" />
            
            <div className="flex items-center gap-6 mb-10 relative z-10">
              <div className="w-16 h-16 rounded-2xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center shadow-xl border border-emerald-500/30">
                <Zap size={32} className="animate-pulse" />
              </div>
              <div>
                <h3 className="text-2xl font-black text-white italic tracking-tight">Estado del Servicio</h3>
                <div className="flex items-center gap-2 mt-1">
                  <div className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                  <span className="text-[10px] text-emerald-500 font-black uppercase tracking-widest">Suscripción Activa</span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-10 mb-10 relative z-10">
              <div className="space-y-2">
                <p className="text-[10px] text-slate-500 font-black uppercase tracking-[0.2em]">Plan Maestro</p>
                <p className="text-2xl font-black text-white italic">{subscription ? getPlanName(subscription.plan) : 'Sincronizando...'}</p>
              </div>
              <div className="space-y-2">
                <p className="text-[10px] text-slate-500 font-black uppercase tracking-[0.2em]">Próxima Renovación</p>
                <p className="text-2xl font-black text-white italic">
                  {subscription?.endsAt ? new Date(subscription.endsAt).toLocaleDateString() : '-- / -- / --'}
                </p>
              </div>
            </div>

            <div className="pt-10 border-t border-white/5 flex flex-wrap gap-4 relative z-10">
              <button className="px-8 py-4 rounded-2xl bg-white/5 text-white font-black text-[10px] uppercase tracking-widest hover:bg-emerald-600 transition-all border border-white/5 shadow-xl">
                 Cambiar Plan
              </button>
              <button onClick={() => window.location.href='/membership'} className="px-8 py-4 rounded-2xl bg-emerald-600 text-white font-black text-[10px] uppercase tracking-widest hover:bg-emerald-500 transition-all shadow-2xl shadow-emerald-500/30">
                 Gestionar Pagos
              </button>
            </div>
          </motion.div>

          {/* Invoices Table */}
          <div className="bg-white/[0.03] backdrop-blur-3xl border border-white/10 rounded-[2.5rem] shadow-2xl overflow-hidden group">
            <div className="px-10 py-8 border-b border-white/5 flex items-center justify-between">
              <h3 className="text-xl font-black text-white italic tracking-tight flex items-center gap-3">
                <Receipt size={24} className="text-slate-500" /> Historial de Facturación
              </h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-white/5 border-b border-white/5">
                    <th className="px-10 py-5 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Factura</th>
                    <th className="px-10 py-5 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Fecha</th>
                    <th className="px-10 py-5 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Monto</th>
                    <th className="px-10 py-5 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Estado</th>
                    <th className="px-10 py-5 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] text-right">PDF</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {loading ? (
                    <tr><td colSpan={5} className="p-20 text-center text-slate-500 font-black text-xs uppercase animate-pulse">Cargando Facturas...</td></tr>
                  ) : invoices.length === 0 ? (
                    <tr><td colSpan={5} className="p-20 text-center text-slate-700 font-black text-xs italic tracking-widest">No hay comprobantes registrados aún</td></tr>
                  ) : (
                    invoices.map((inv) => (
                      <tr key={inv.id} className="hover:bg-white/5 transition-all group/row">
                        <td className="px-10 py-6 font-black text-white text-sm italic tracking-tight">{inv.invoiceNumber}</td>
                        <td className="px-10 py-6 text-slate-500 font-bold text-xs uppercase">{new Date(inv.issuedAt).toLocaleDateString()}</td>
                        <td className="px-10 py-6 font-black text-white text-sm italic">$ {inv.total.toLocaleString()}</td>
                        <td className="px-10 py-6">
                           <span className="px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 text-[9px] font-black uppercase tracking-widest">PAGADA</span>
                        </td>
                        <td className="px-10 py-6 text-right">
                          <button onClick={() => handleDownload(inv.id)} className="w-10 h-10 rounded-xl bg-white/5 text-slate-400 hover:text-emerald-400 hover:bg-emerald-500/10 transition-all flex items-center justify-center ml-auto group/btn">
                             <Download size={18} className="group-hover/btn:-translate-y-0.5 transition-transform" />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Info Sidebar */}
        <div className="space-y-8">
          <div className="bg-white/[0.03] backdrop-blur-3xl border border-white/10 rounded-[2.5rem] p-8 shadow-2xl overflow-hidden relative group">
             <div className="absolute inset-0 bg-emerald-500/5 opacity-0 group-hover:opacity-100 transition-opacity" />
             <ShieldCheck className="text-emerald-500/20 absolute -right-4 -bottom-4 w-32 h-32" />
             <h4 className="text-sm font-black text-white uppercase tracking-[0.3em] mb-6 relative z-10 flex items-center gap-2">
                <ShieldCheck size={16} className="text-emerald-500" /> Seguridad
             </h4>
             <p className="text-xs text-slate-400 font-medium leading-relaxed relative z-10 italic">
                Tus transacciones están protegidas con encriptación de grado bancario TLS 1.3 y procesadas por las plataformas más robustas (MercadoPago / PayPal).
             </p>
          </div>

          <div className="bg-white/[0.03] backdrop-blur-3xl border border-white/10 rounded-[2.5rem] p-8 shadow-2xl relative group overflow-hidden">
             <CreditCard className="text-blue-500/20 absolute -right-4 -bottom-4 w-32 h-32" />
             <h4 className="text-sm font-black text-white uppercase tracking-[0.3em] mb-6 relative z-10">Métodos</h4>
             <div className="space-y-4 relative z-10">
                <div className="flex items-center gap-4 bg-white/5 p-4 rounded-2xl border border-white/5">
                   <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-400">
                      <CreditCard size={20} />
                   </div>
                   <div>
                      <p className="text-[10px] font-black text-white uppercase tracking-widest">Mastercard / Visa</p>
                      <p className="text-[9px] text-slate-500 font-bold uppercase mt-1">Vía MercadoPago</p>
                   </div>
                </div>
                <div className="flex items-center gap-4 bg-white/5 p-4 rounded-2xl border border-white/5">
                   <div className="w-10 h-10 rounded-lg bg-indigo-500/10 flex items-center justify-center text-indigo-400">
                      <span className="font-black text-xs">PP</span>
                   </div>
                   <div>
                      <p className="text-[10px] font-black text-white uppercase tracking-widest">PayPal Express</p>
                      <p className="text-[9px] text-slate-500 font-bold uppercase mt-1">Vía USD Internacional</p>
                   </div>
                </div>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
}
