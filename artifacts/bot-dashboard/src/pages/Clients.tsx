import React, { useState } from "react";
import { useGetClients, useUpdateClient } from "@workspace/api-client-react";
import { Users, Search, Phone, Mail, Calendar, Activity, Edit2, TrendingUp } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Modal } from "@/components/Modal";
import { cn } from "@/lib/utils";

export default function Clients() {
  const [filter, setFilter] = useState<string>("all");
  const [editingClient, setEditingClient] = useState<any>(null);
  const { data, isLoading, refetch } = useGetClients();
  const updateMutation = useUpdateClient();

  const clients = data?.data || [];
  const filteredClients = filter === "all" ? clients : clients.filter(c => c.leadStatus === filter);

  const getStatusColor = (status: string) => {
    switch(status) {
      case 'hot': return 'bg-red-500/10 text-red-500 border-red-500/20';
      case 'warm': return 'bg-orange-500/10 text-orange-500 border-orange-500/20';
      case 'cold': return 'bg-blue-500/10 text-blue-500 border-blue-500/20';
      default: return 'bg-gray-500/10 text-gray-500 border-gray-500/20';
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
        technicalLevel: editingClient.technicalLevel
      }
    });
    setEditingClient(null);
    refetch();
  };

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-display font-bold text-foreground">Gestión de Clientes</h1>
          <p className="text-muted-foreground mt-1">CRM integrado con puntuación de leads por IA.</p>
        </div>
        
        <div className="flex items-center gap-3 bg-secondary p-1.5 rounded-xl">
          {['all', 'hot', 'warm', 'cold'].map((status) => (
            <button
              key={status}
              onClick={() => setFilter(status)}
              className={cn(
                "px-4 py-2 rounded-lg text-sm font-medium transition-all capitalize",
                filter === status 
                  ? "bg-card text-foreground shadow-sm" 
                  : "text-muted-foreground hover:text-foreground hover:bg-card/50"
              )}
            >
              {status === 'all' ? 'Todos' : status}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-card border border-border/50 rounded-2xl shadow-xl shadow-black/5 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-border/50 bg-secondary/30">
                <th className="p-4 font-medium text-muted-foreground text-sm">Cliente</th>
                <th className="p-4 font-medium text-muted-foreground text-sm">Estado Lead</th>
                <th className="p-4 font-medium text-muted-foreground text-sm hidden md:table-cell">Probabilidad</th>
                <th className="p-4 font-medium text-muted-foreground text-sm hidden lg:table-cell">Nivel Téc.</th>
                <th className="p-4 font-medium text-muted-foreground text-sm hidden sm:table-cell">Última Interacción</th>
                <th className="p-4 font-medium text-muted-foreground text-sm text-right">Acción</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr><td colSpan={6} className="p-8 text-center text-muted-foreground">Cargando clientes...</td></tr>
              ) : filteredClients.length === 0 ? (
                <tr><td colSpan={6} className="p-8 text-center text-muted-foreground">No se encontraron clientes.</td></tr>
              ) : (
                filteredClients.map((client) => (
                  <tr key={client.id} className="border-b border-border/20 hover:bg-secondary/20 transition-colors group">
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                          {client.name ? client.name.charAt(0).toUpperCase() : <User size={18} />}
                        </div>
                        <div>
                          <p className="font-semibold text-foreground text-sm">{client.name || 'Sin Nombre'}</p>
                          <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                            <Phone size={10} /> {client.phone}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="p-4">
                      <span className={cn("px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider border", getStatusColor(client.leadStatus))}>
                        {client.leadStatus}
                      </span>
                    </td>
                    <td className="p-4 hidden md:table-cell">
                      <div className="flex items-center gap-2">
                        <div className="w-24 h-2 bg-secondary rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-gradient-to-r from-primary to-emerald-400"
                            style={{ width: `${client.purchaseProbability}%` }}
                          />
                        </div>
                        <span className="text-xs font-bold font-mono">{client.purchaseProbability}%</span>
                      </div>
                    </td>
                    <td className="p-4 hidden lg:table-cell">
                      <span className="text-xs font-medium bg-secondary px-2 py-1 rounded capitalize text-foreground">
                        {client.technicalLevel}
                      </span>
                    </td>
                    <td className="p-4 hidden sm:table-cell">
                      <span className="text-sm text-muted-foreground">
                        {client.lastInteraction ? format(new Date(client.lastInteraction), 'dd MMM yyyy', { locale: es }) : 'N/A'}
                      </span>
                    </td>
                    <td className="p-4 text-right">
                      <button 
                        onClick={() => setEditingClient(client)}
                        className="p-2 text-muted-foreground hover:text-primary hover:bg-primary/10 rounded-lg transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100"
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
        title="Editar Cliente"
      >
        {editingClient && (
          <form onSubmit={handleUpdate} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1.5 text-muted-foreground">Nombre</label>
              <input 
                type="text" 
                value={editingClient.name || ''}
                onChange={e => setEditingClient({...editingClient, name: e.target.value})}
                className="w-full bg-background border border-border rounded-xl px-4 py-3 text-foreground focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5 text-muted-foreground">Teléfono (Solo lectura)</label>
              <input 
                type="text" 
                value={editingClient.phone}
                disabled
                className="w-full bg-secondary/50 border border-border/50 rounded-xl px-4 py-3 text-muted-foreground cursor-not-allowed"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1.5 text-muted-foreground">Estado Lead</label>
                <select 
                  value={editingClient.leadStatus}
                  onChange={e => setEditingClient({...editingClient, leadStatus: e.target.value})}
                  className="w-full bg-background border border-border rounded-xl px-4 py-3 text-foreground focus:ring-2 focus:ring-primary outline-none appearance-none"
                >
                  <option value="hot">HOT (Caliente)</option>
                  <option value="warm">WARM (Tibio)</option>
                  <option value="cold">COLD (Frío)</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5 text-muted-foreground">Nivel Técnico</label>
                <select 
                  value={editingClient.technicalLevel}
                  onChange={e => setEditingClient({...editingClient, technicalLevel: e.target.value})}
                  className="w-full bg-background border border-border rounded-xl px-4 py-3 text-foreground focus:ring-2 focus:ring-primary outline-none appearance-none"
                >
                  <option value="basic">Básico</option>
                  <option value="intermediate">Intermedio</option>
                  <option value="advanced">Avanzado</option>
                </select>
              </div>
            </div>
            <div className="pt-4 flex justify-end gap-3">
              <button 
                type="button" 
                onClick={() => setEditingClient(null)}
                className="px-6 py-2.5 rounded-xl text-foreground font-medium hover:bg-secondary transition-colors"
              >
                Cancelar
              </button>
              <button 
                type="submit"
                disabled={updateMutation.isPending}
                className="px-6 py-2.5 rounded-xl bg-primary text-primary-foreground font-bold shadow-lg shadow-primary/25 hover:shadow-xl hover:-translate-y-0.5 transition-all disabled:opacity-50"
              >
                {updateMutation.isPending ? 'Guardando...' : 'Guardar Cambios'}
              </button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
}
