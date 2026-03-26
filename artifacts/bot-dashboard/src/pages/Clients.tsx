import React, { useState } from "react";
import { useGetClients, useUpdateClient } from "@workspace/api-client-react";
import {
  Users,
  Search,
  Phone,
  Smartphone,
  Mail,
  Calendar,
  Activity,
  Edit2,
  TrendingUp,
  Loader2,
} from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Modal } from "@/components/Modal";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

export default function Clients() {
  const [filter, setFilter] = useState<string>("all");
  const [editingClient, setEditingClient] = useState<any>(null);
  const { data, isLoading, refetch } = useGetClients();
  const updateMutation = useUpdateClient();

  const clients = data?.data || [];
  const filteredClients =
    filter === "all" ? clients : clients.filter((c) => c.leadStatus === filter);

  const getStatusStyle = (status: string) => {
    switch (status) {
      case "hot":
        return "bg-rose-500/20 text-rose-400 border-rose-500/30 shadow-[0_0_15px_rgba(244,63,94,0.15)]";
      case "warm":
        return "bg-amber-500/20 text-amber-500 border-amber-500/30 shadow-[0_0_15px_rgba(245,158,11,0.15)]";
      case "cold":
        return "bg-slate-500/20 text-slate-400 border-slate-500/30";
      default:
        return "bg-white/5 text-slate-500 border-white/5";
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingClient) return;
    await updateMutation.mutateAsync({
      id: editingClient.id,
      data: {
        name: editingClient.name,
        email: editingClient.email,
        leadStatus: editingClient.leadStatus,
        technicalLevel: editingClient.technicalLevel,
      },
    });
    setEditingClient(null);
    refetch();
  };

  return (
    <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-1000">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-8">
        <div>
          <h1 className="text-5xl font-black text-white tracking-tight italic">
            CRM <span className="text-emerald-500">Inteligente.</span>
          </h1>
          <p className="text-xl text-slate-400 mt-3 font-medium tracking-tight">
            Gestión estratégica de leads potenciada por inteligencia artificial.
          </p>
        </div>

        <div className="flex bg-white/5 rounded-2xl p-1.5 border border-white/5 backdrop-blur-xl">
          {["all", "hot", "warm", "cold"].map((status) => (
            <button
              key={status}
              onClick={() => setFilter(status)}
              className={cn(
                "px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all",
                filter === status
                  ? "bg-emerald-600 text-white shadow-xl shadow-emerald-500/20"
                  : "text-slate-500 hover:text-white"
              )}
            >
              {status === "all" ? "Todos" : status}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-white/[0.03] backdrop-blur-3xl border border-white/10 rounded-[2.5rem] shadow-2xl overflow-hidden relative group">
        <div className="absolute inset-0 bg-emerald-500/5 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
        <div className="overflow-x-auto scrollbar-hide">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-white/5 bg-white/5">
                <th className="px-8 py-6 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">
                  Cliente
                </th>
                <th className="px-8 py-6 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">
                  Estado Lead
                </th>
                <th className="px-8 py-6 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] hidden md:table-cell">
                  Conversión
                </th>
                <th className="px-8 py-6 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] hidden lg:table-cell">
                  Nivel Técnico
                </th>
                <th className="px-8 py-6 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] hidden sm:table-cell">
                  Última vez
                </th>
                <th className="px-8 py-6 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] text-right">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="p-20 text-center">
                    <div className="flex flex-col items-center gap-4">
                       <Loader2 className="text-emerald-500 animate-spin" size={40} />
                       <p className="text-slate-500 font-black uppercase tracking-widest text-xs">Analizando Base de Datos...</p>
                    </div>
                  </td>
                </tr>
              ) : filteredClients.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-20 text-center">
                    <p className="text-slate-500 font-black uppercase tracking-widest text-xs italic">No se encontraron registros activos</p>
                  </td>
                </tr>
              ) : (
                filteredClients.map((client) => (
                  <tr
                    key={client.id}
                    className="hover:bg-white/5 transition-all group/row"
                  >
                    <td className="px-8 py-6">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 font-black text-lg italic shadow-xl">
                          {client.name ? client.name.charAt(0).toUpperCase() : <Users size={20} />}
                        </div>
                        <div>
                          <p className="font-black text-white tracking-tight">
                            {client.name || "Sin Identificar"}
                          </p>
                          <p className="text-xs text-slate-500 font-bold tracking-widest flex items-center gap-1.5 mt-1">
                            <Smartphone size={10} className="text-emerald-500" /> {client.phone}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <span
                        className={cn(
                          "px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border transition-all duration-500",
                          getStatusStyle(client.leadStatus),
                        )}
                      >
                        {client.leadStatus}
                      </span>
                    </td>
                    <td className="px-8 py-6 hidden md:table-cell">
                      <div className="flex items-center gap-4">
                        <div className="flex-1 w-32 h-1.5 bg-white/5 rounded-full overflow-hidden">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${client.purchaseProbability}%` }}
                            transition={{ duration: 1.5, ease: "easeOut" }}
                            className="h-full bg-gradient-to-r from-emerald-600 to-emerald-400 shadow-[0_0_10px_rgba(16,185,129,0.5)]"
                          />
                        </div>
                        <span className="text-[11px] font-black text-white italic">
                          {client.purchaseProbability}%
                        </span>
                      </div>
                    </td>
                    <td className="px-8 py-6 hidden lg:table-cell">
                      <span className="text-[10px] font-black uppercase tracking-widest text-slate-500 bg-white/5 px-3 py-1.5 rounded-xl border border-white/5">
                        {client.technicalLevel}
                      </span>
                    </td>
                    <td className="px-8 py-6 hidden sm:table-cell">
                      <span className="text-[11px] font-black text-slate-500 uppercase tracking-widest italic">
                        {client.lastInteraction
                          ? format(new Date(client.lastInteraction), "dd MMM", { locale: es })
                          : "N/A"}
                      </span>
                    </td>
                    <td className="px-8 py-6 text-right">
                      <button
                        onClick={() => setEditingClient(client)}
                        className="w-10 h-10 rounded-xl bg-white/5 text-slate-400 hover:text-emerald-400 hover:bg-emerald-500/10 transition-all flex items-center justify-center opacity-0 group-hover/row:opacity-100"
                      >
                        <Edit2 size={18} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <Modal
        isOpen={!!editingClient}
        onClose={() => setEditingClient(null)}
        title="Perfil del Lead"
      >
        {editingClient && (
          <form onSubmit={handleUpdate} className="space-y-6 p-2">
            <div>
              <label className="block text-[10px] font-black uppercase tracking-[0.2em] mb-3 text-slate-500 italic">
                Nombre del Cliente
              </label>
              <input
                type="text"
                value={editingClient.name || ""}
                onChange={(e) => setEditingClient({ ...editingClient, name: e.target.value })}
                className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-white font-bold focus:outline-none focus:border-emerald-500 transition-all"
              />
            </div>
            
            <div className="grid grid-cols-2 gap-6">
              <div>
                <label className="block text-[10px] font-black uppercase tracking-[0.2em] mb-3 text-slate-500 italic">
                  Calificación IA
                </label>
                <select
                  value={editingClient.leadStatus}
                  onChange={(e) => setEditingClient({ ...editingClient, leadStatus: e.target.value })}
                  className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-white font-bold focus:outline-none focus:border-emerald-500 appearance-none bg-no-repeat bg-[right_1.5rem_center]"
                >
                  <option value="hot">HOT (Venta Inminente)</option>
                  <option value="warm">WARM (Interesado)</option>
                  <option value="cold">COLD (No calificado)</option>
                </select>
              </div>
              <div>
                <label className="block text-[10px] font-black uppercase tracking-[0.2em] mb-3 text-slate-500 italic">
                  Perfil Técnico
                </label>
                <select
                  value={editingClient.technicalLevel}
                  onChange={(e) => setEditingClient({ ...editingClient, technicalLevel: e.target.value })}
                  className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-white font-bold focus:outline-none focus:border-emerald-500 appearance-none"
                >
                  <option value="basic">Principiante</option>
                  <option value="intermediate">Intermedio</option>
                  <option value="advanced">Profesional</option>
                </select>
              </div>
            </div>

            <div className="pt-8 flex justify-end gap-5">
              <button
                type="button"
                onClick={() => setEditingClient(null)}
                className="px-8 py-4 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 hover:text-white transition-colors"
              >
                Descartar
              </button>
              <button
                type="submit"
                disabled={updateMutation.isPending}
                className="px-10 py-4 rounded-2xl bg-emerald-600 text-white font-black uppercase tracking-[0.2em] text-[10px] shadow-2xl shadow-emerald-500/30 hover:bg-emerald-500 hover:-translate-y-1 transition-all disabled:opacity-50"
              >
                {updateMutation.isPending ? "Sincronizando..." : "Aplicar Cambios"}
              </button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
}
