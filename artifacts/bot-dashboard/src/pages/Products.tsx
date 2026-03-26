import React, { useState } from "react";
import { useGetProducts, useCreateProduct, useUpdateProduct, useDeleteProduct, useGetBotConfig } from "@workspace/api-client-react";
import { Package, Plus, Search, Edit2, Trash2, Tag, Archive, Check, RefreshCcw } from "lucide-react";
import { Modal } from "@/components/Modal";
import { formatCurrency, cn } from "@/lib/utils";

export default function Products() {
  const [search, setSearch] = useState("");
  const { data, isLoading, refetch } = useGetProducts({ search });
  const createMutation = useCreateProduct();
  const updateMutation = useUpdateProduct();
  const deleteMutation = useDeleteProduct();

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [formData, setFormData] = useState<any>({});
  
  const products = data?.data || [];

  const handleOpenForm = (product?: any) => {
    if (product) {
      setFormData(product);
    } else {
      setFormData({ name: '', price: 0, category: '', stock: 0, isActive: true });
    }
    setIsFormOpen(true);
  };

  const { data: botConfig } = useGetBotConfig();
  const [isSyncing, setIsSyncing] = useState(false);

  const handleSyncWoo = async () => {
    if (!botConfig?.wooCommerceUrl || !botConfig?.wooCommerceConsumerKey) {
      alert("Configura primero las credenciales de WooCommerce en Ajustes.");
      return;
    }
    
    setIsSyncing(true);
    try {
      const res = await fetch("/api/products/import/woocommerce", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          url: botConfig.wooCommerceUrl,
          consumerKey: botConfig.wooCommerceConsumerKey,
          consumerSecret: botConfig.wooCommerceConsumerSecret
        })
      });
      const data = await res.json();
      if (data.success) {
        alert(`¡Éxito! Se importaron ${data.imported} productos.`);
        refetch();
      } else {
        alert("Error: " + data.error);
      }
    } catch (e) {
      console.error(e);
      alert("Dificultad técnica al conectar con WooCommerce.");
    } finally {
      setIsSyncing(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (formData.id) {
        await updateMutation.mutateAsync({ id: formData.id, data: formData });
      } else {
        await createMutation.mutateAsync({ data: formData });
      }
      setIsFormOpen(false);
      refetch();
    } catch (e) {
      console.error(e);
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm("¿Estás seguro de eliminar este producto?")) {
      await deleteMutation.mutateAsync({ id });
      refetch();
    }
  };

  return (
    <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-1000">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-8">
        <div>
          <h1 className="text-5xl font-black text-white tracking-tight italic">
            Catálogo <span className="text-emerald-500">Premium.</span>
          </h1>
          <p className="text-xl text-slate-400 mt-3 font-medium tracking-tight">Gestiona el inventario que tu bot ofrecerá a los clientes.</p>
        </div>
        
        <div className="flex flex-col sm:flex-row items-center gap-4 w-full md:w-auto">
          <button 
            onClick={handleSyncWoo}
            disabled={isSyncing}
            className="w-full sm:w-auto flex items-center justify-center gap-3 px-6 py-4 rounded-[1.5rem] bg-white/5 border border-white/10 text-white font-black uppercase tracking-widest text-[10px] hover:bg-indigo-600 transition-all active:scale-95 disabled:opacity-50"
          >
            <RefreshCcw size={16} className={isSyncing ? "animate-spin" : ""} />
            {isSyncing ? "Sincronizando..." : "Sinc. WooCommerce"}
          </button>
          
          <div className="relative w-full sm:w-80 group">
            <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-emerald-500 transition-colors" size={20} />
            <input 
              type="text" 
              placeholder="Filtrar inventario..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-white/5 border border-white/10 text-white rounded-[1.5rem] pl-14 pr-6 py-4 outline-none focus:border-emerald-500/50 transition-all font-bold placeholder-slate-700"
            />
          </div>
          <button 
            onClick={() => handleOpenForm()}
            className="w-full sm:w-auto flex items-center justify-center gap-3 px-8 py-4 rounded-[1.5rem] bg-emerald-600 text-white font-black uppercase tracking-widest text-xs shadow-2xl shadow-emerald-500/30 hover:bg-emerald-500 hover:-translate-y-1 transition-all active:scale-95"
          >
            <Plus size={20} />
            Nuevo Ítem
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
          {[1,2,3,4,5,6,7,8].map(i => <div key={i} className="h-80 bg-white/5 rounded-[2.5rem] animate-pulse"></div>)}
        </div>
      ) : products.length === 0 ? (
        <div className="bg-white/[0.03] border border-white/5 border-dashed rounded-[3rem] p-24 text-center group transition-colors hover:border-emerald-500/30">
          <div className="w-24 h-24 rounded-full bg-white/5 flex items-center justify-center mx-auto mb-8 border border-white/5 group-hover:scale-110 transition-transform">
             <Package size={48} className="text-slate-700 group-hover:text-emerald-500 transition-colors" />
          </div>
          <h3 className="text-2xl font-black text-white mb-2 italic">Galeria Vacía</h3>
          <p className="text-slate-500 font-bold uppercase tracking-widest text-xs">Comienza agregando productos de alto valor.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
          {products.map((product) => (
            <div key={product.id} className="bg-white/[0.03] backdrop-blur-3xl border border-white/10 rounded-[2.5rem] overflow-hidden shadow-2xl hover:border-emerald-500/40 hover:-translate-y-2 transition-all duration-500 group flex flex-col relative">
              <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-opacity" />
              
              <div className="aspect-[4/3] bg-slate-900/50 relative overflow-hidden flex items-center justify-center">
                {product.imageUrl ? (
                  <img src={product.imageUrl} alt={product.name} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                ) : (
                  <Package size={60} className="text-slate-800" />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 to-transparent opacity-60" />
                {!product.isActive && (
                  <div className="absolute top-6 left-6 px-4 py-1.5 bg-black/80 text-white text-[10px] font-black uppercase tracking-[0.2em] rounded-full backdrop-blur-md border border-white/10">
                    Oculto
                  </div>
                )}
              </div>
              
              <div className="p-8 flex-1 flex flex-col relative z-10">
                <div className="mb-4">
                  <h3 className="font-black text-white text-xl leading-tight line-clamp-2 italic tracking-tight mb-2">{product.name}</h3>
                  <div className="flex flex-wrap gap-2">
                    <span className="inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-widest bg-emerald-500/10 text-emerald-400 px-3 py-1.5 rounded-xl border border-emerald-500/20">
                      <Tag size={12} strokeWidth={3} /> {product.category}
                    </span>
                    <span className="inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-widest bg-white/5 text-slate-500 px-3 py-1.5 rounded-xl border border-white/5 italic">
                      {product.stock} disp.
                    </span>
                  </div>
                </div>
                
                <div className="mt-auto pt-6 border-t border-white/5 flex items-center justify-between">
                  <span className="font-black text-2xl text-white italic tracking-tighter">
                    {formatCurrency(product.price)}
                  </span>
                  <div className="flex gap-2">
                    <button 
                      onClick={() => handleOpenForm(product)}
                      className="w-10 h-10 flex items-center justify-center bg-white/5 text-slate-400 hover:text-white hover:bg-emerald-600 rounded-xl transition-all shadow-lg active:scale-90"
                    >
                      <Edit2 size={16} />
                    </button>
                    <button 
                      onClick={() => handleDelete(product.id)}
                      className="w-10 h-10 flex items-center justify-center bg-white/5 text-slate-400 hover:text-white hover:bg-red-600 rounded-xl transition-all shadow-lg active:scale-90"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal 
        isOpen={isFormOpen} 
        onClose={() => setIsFormOpen(false)} 
        title={formData.id ? "Especificaciones del Item" : "Añadir a Inventario"}
      >
        <form onSubmit={handleSubmit} className="space-y-6 p-2">
          <div>
            <label className="block text-[10px] font-black uppercase tracking-[0.2em] mb-3 text-slate-500 italic">Identificador del Producto</label>
            <input 
              type="text" 
              required
              value={formData.name || ''}
              onChange={e => setFormData({...formData, name: e.target.value})}
              placeholder="Ej: Laptop Gamer RTX 4080"
              className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-white font-bold focus:outline-none focus:border-emerald-500 transition-all placeholder-slate-700"
            />
          </div>
          <div className="grid grid-cols-2 gap-6">
            <div>
              <label className="block text-[10px] font-black uppercase tracking-[0.2em] mb-3 text-slate-500 italic">Valor de Venta</label>
              <input 
                type="number" 
                required min="0"
                value={formData.price || ''}
                onChange={e => setFormData({...formData, price: Number(e.target.value)})}
                className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-white font-bold focus:outline-none focus:border-emerald-500 transition-all"
              />
            </div>
            <div>
              <label className="block text-[10px] font-black uppercase tracking-[0.2em] mb-3 text-slate-500 italic">Stock Disponible</label>
              <input 
                type="number" 
                required min="0"
                value={formData.stock || ''}
                onChange={e => setFormData({...formData, stock: Number(e.target.value)})}
                className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-white font-bold focus:outline-none focus:border-emerald-500 transition-all"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-6">
            <div>
              <label className="block text-[10px] font-black uppercase tracking-[0.2em] mb-3 text-slate-500 italic">Sector / Categoría</label>
              <input 
                type="text" 
                required
                value={formData.category || ''}
                onChange={e => setFormData({...formData, category: e.target.value})}
                className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-white font-bold focus:outline-none focus:border-emerald-500 transition-all"
              />
            </div>
            <div>
              <label className="block text-[10px] font-black uppercase tracking-[0.2em] mb-3 text-slate-500 italic">Fabricante</label>
              <input 
                type="text" 
                value={formData.brand || ''}
                onChange={e => setFormData({...formData, brand: e.target.value})}
                className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-white font-bold focus:outline-none focus:border-emerald-500 transition-all"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-6">
            <div>
              <label className="block text-[10px] font-black uppercase tracking-[0.2em] mb-3 text-slate-500 italic">WooCommerce Product ID</label>
              <input 
                type="number" 
                value={formData.wooCommerceId || ''}
                onChange={e => setFormData({...formData, wooCommerceId: Number(e.target.value)})}
                placeholder="Ej: 145"
                className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-white font-bold focus:outline-none focus:border-emerald-500 transition-all placeholder-slate-700"
              />
            </div>
            <div>
              <label className="block text-[10px] font-black uppercase tracking-[0.2em] mb-3 text-slate-500 italic">URL Visualización (Media)</label>
              <input 
                type="url" 
                value={formData.imageUrl || ''}
                onChange={e => setFormData({...formData, imageUrl: e.target.value})}
                placeholder="https://images.unsplash.com/..."
                className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-white font-bold focus:outline-none focus:border-emerald-500 transition-all placeholder-slate-700 font-mono text-xs"
              />
            </div>
          </div>
          <div>
            <label className="block text-[10px] font-black uppercase tracking-[0.2em] mb-3 text-slate-500 italic">Características Maestras</label>
            <textarea 
              rows={4}
              value={formData.description || ''}
              onChange={e => setFormData({...formData, description: e.target.value})}
              placeholder="Detalla las especificaciones clave para que la IA pueda vender mejor..."
              className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-white font-bold focus:outline-none focus:border-emerald-500 transition-all resize-none placeholder-slate-700 leading-relaxed"
            />
          </div>
          
          <label className="flex items-center gap-4 p-5 rounded-2xl bg-white/5 border border-white/10 cursor-pointer group hover:border-emerald-500/30 transition-all">
            <div className="relative flex items-center justify-center">
              <input 
                type="checkbox" 
                checked={formData.isActive ?? true}
                onChange={e => setFormData({...formData, isActive: e.target.checked})}
                className="peer w-6 h-6 opacity-0 absolute cursor-pointer"
              />
              <div className="w-6 h-6 border-2 border-white/20 rounded-lg peer-checked:bg-emerald-600 peer-checked:border-emerald-600 transition-all flex items-center justify-center">
                <Check size={14} className="text-white opacity-0 peer-checked:opacity-100 transition-opacity" strokeWidth={4} />
              </div>
            </div>
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 group-hover:text-white transition-colors">Activar Ítem para Operación IA</span>
          </label>
          
          <div className="pt-10 flex justify-end gap-5">
            <button 
              type="button" 
              onClick={() => setIsFormOpen(false)}
              className="px-8 py-4 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] text-slate-600 hover:text-white transition-all"
            >
              Cancelar
            </button>
            <button 
              type="submit"
              disabled={createMutation.isPending || updateMutation.isPending}
              className="px-10 py-4 rounded-[1.5rem] bg-emerald-600 text-white font-black uppercase tracking-[0.2em] text-[10px] shadow-2xl shadow-emerald-500/40 hover:bg-emerald-500 hover:-translate-y-1 transition-all disabled:opacity-50"
            >
              {createMutation.isPending || updateMutation.isPending ? 'Sincronizando...' : 'Indexar Producto'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
