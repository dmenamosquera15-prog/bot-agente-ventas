import React, { useState } from "react";
import { useGetProducts, useCreateProduct, useUpdateProduct, useDeleteProduct } from "@workspace/api-client-react";
import { Package, Plus, Search, Edit2, Trash2, Tag, Archive } from "lucide-react";
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
    <div className="space-y-8 animate-fade-in">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-display font-bold text-foreground">Catálogo de Productos</h1>
          <p className="text-muted-foreground mt-1">El bot usará estos datos para ventas y cotizaciones.</p>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="relative w-full md:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
            <input 
              type="text" 
              placeholder="Buscar productos..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-card border border-border/50 text-foreground rounded-xl pl-10 pr-4 py-2.5 outline-none focus:ring-2 focus:border-primary transition-all shadow-sm"
            />
          </div>
          <button 
            onClick={() => handleOpenForm()}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-primary-foreground font-bold shadow-lg shadow-primary/25 hover:shadow-xl hover:-translate-y-0.5 transition-all shrink-0"
          >
            <Plus size={20} />
            <span className="hidden sm:inline">Nuevo Producto</span>
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {[1,2,3,4].map(i => <div key={i} className="h-64 bg-secondary/50 rounded-2xl animate-pulse"></div>)}
        </div>
      ) : products.length === 0 ? (
        <div className="bg-card border border-border/50 border-dashed rounded-3xl p-12 text-center">
          <Package size={48} className="mx-auto text-muted-foreground opacity-50 mb-4" />
          <h3 className="text-xl font-bold mb-2">No hay productos</h3>
          <p className="text-muted-foreground">Agrega productos para que el bot pueda recomendarlos.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {products.map((product) => (
            <div key={product.id} className="bg-card border border-border/50 rounded-2xl overflow-hidden shadow-lg hover:shadow-xl hover:border-primary/50 transition-all duration-300 group flex flex-col">
              <div className="aspect-video bg-secondary/50 relative overflow-hidden flex items-center justify-center">
                {product.imageUrl ? (
                  <img src={product.imageUrl} alt={product.name} className="w-full h-full object-cover" />
                ) : (
                  <Package size={40} className="text-muted-foreground opacity-20" />
                )}
                {!product.isActive && (
                  <div className="absolute top-2 left-2 px-2 py-1 bg-black/80 text-white text-[10px] font-bold uppercase rounded backdrop-blur-md">
                    Inactivo
                  </div>
                )}
              </div>
              <div className="p-5 flex-1 flex flex-col">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <h3 className="font-bold text-lg leading-tight line-clamp-2">{product.name}</h3>
                </div>
                <div className="flex flex-wrap gap-2 mb-4">
                  <span className="inline-flex items-center gap-1 text-[11px] font-medium bg-primary/10 text-primary px-2 py-1 rounded-full">
                    <Tag size={12} /> {product.category}
                  </span>
                  <span className="inline-flex items-center gap-1 text-[11px] font-medium bg-secondary text-foreground px-2 py-1 rounded-full">
                    <Archive size={12} /> Stock: {product.stock}
                  </span>
                </div>
                <div className="mt-auto pt-4 border-t border-border/50 flex items-center justify-between">
                  <span className="font-display font-bold text-xl">{formatCurrency(product.price)}</span>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button 
                      onClick={() => handleOpenForm(product)}
                      className="p-2 text-muted-foreground hover:text-primary hover:bg-primary/10 rounded-lg transition-colors"
                    >
                      <Edit2 size={16} />
                    </button>
                    <button 
                      onClick={() => handleDelete(product.id)}
                      className="p-2 text-muted-foreground hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-colors"
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
        title={formData.id ? "Editar Producto" : "Nuevo Producto"}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1.5 text-muted-foreground">Nombre del Producto</label>
            <input 
              type="text" 
              required
              value={formData.name || ''}
              onChange={e => setFormData({...formData, name: e.target.value})}
              className="w-full bg-background border border-border rounded-xl px-4 py-3 text-foreground focus:ring-2 focus:ring-primary outline-none"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1.5 text-muted-foreground">Precio</label>
              <input 
                type="number" 
                required min="0"
                value={formData.price || ''}
                onChange={e => setFormData({...formData, price: Number(e.target.value)})}
                className="w-full bg-background border border-border rounded-xl px-4 py-3 text-foreground focus:ring-2 focus:ring-primary outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5 text-muted-foreground">Stock</label>
              <input 
                type="number" 
                required min="0"
                value={formData.stock || ''}
                onChange={e => setFormData({...formData, stock: Number(e.target.value)})}
                className="w-full bg-background border border-border rounded-xl px-4 py-3 text-foreground focus:ring-2 focus:ring-primary outline-none"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1.5 text-muted-foreground">Categoría</label>
              <input 
                type="text" 
                required
                value={formData.category || ''}
                onChange={e => setFormData({...formData, category: e.target.value})}
                className="w-full bg-background border border-border rounded-xl px-4 py-3 text-foreground focus:ring-2 focus:ring-primary outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5 text-muted-foreground">Marca</label>
              <input 
                type="text" 
                value={formData.brand || ''}
                onChange={e => setFormData({...formData, brand: e.target.value})}
                className="w-full bg-background border border-border rounded-xl px-4 py-3 text-foreground focus:ring-2 focus:ring-primary outline-none"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5 text-muted-foreground">URL Imagen</label>
            <input 
              type="url" 
              value={formData.imageUrl || ''}
              onChange={e => setFormData({...formData, imageUrl: e.target.value})}
              placeholder="https://..."
              className="w-full bg-background border border-border rounded-xl px-4 py-3 text-foreground focus:ring-2 focus:ring-primary outline-none"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5 text-muted-foreground">Descripción</label>
            <textarea 
              rows={3}
              value={formData.description || ''}
              onChange={e => setFormData({...formData, description: e.target.value})}
              className="w-full bg-background border border-border rounded-xl px-4 py-3 text-foreground focus:ring-2 focus:ring-primary outline-none resize-none"
            />
          </div>
          <label className="flex items-center gap-3 p-3 border border-border rounded-xl bg-secondary/30 cursor-pointer">
            <input 
              type="checkbox" 
              checked={formData.isActive ?? true}
              onChange={e => setFormData({...formData, isActive: e.target.checked})}
              className="w-5 h-5 accent-primary rounded border-border bg-background"
            />
            <span className="font-medium">Producto Activo (Visible para el bot)</span>
          </label>
          
          <div className="pt-4 flex justify-end gap-3">
            <button 
              type="button" 
              onClick={() => setIsFormOpen(false)}
              className="px-6 py-2.5 rounded-xl text-foreground font-medium hover:bg-secondary transition-colors"
            >
              Cancelar
            </button>
            <button 
              type="submit"
              disabled={createMutation.isPending || updateMutation.isPending}
              className="px-6 py-2.5 rounded-xl bg-primary text-primary-foreground font-bold shadow-lg shadow-primary/25 hover:shadow-xl hover:-translate-y-0.5 transition-all disabled:opacity-50"
            >
              {createMutation.isPending || updateMutation.isPending ? 'Guardando...' : 'Guardar Producto'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
