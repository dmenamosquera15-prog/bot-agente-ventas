import { useState, useRef } from "react";
import { motion } from "framer-motion";
import { Upload, FileSpreadsheet, Globe, Code, Check, AlertCircle, Download } from "lucide-react";

type Tab = "excel" | "json" | "woocommerce";

const BASE = "/api";

export default function ImportProducts() {
  const [tab, setTab] = useState<Tab>("excel");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null);
  const [wcForm, setWcForm] = useState({ url: "", consumerKey: "", consumerSecret: "", perPage: "100" });
  const [jsonText, setJsonText] = useState('[\n  {\n    "name": "Producto Ejemplo",\n    "price": 99.99,\n    "category": "Laptops",\n    "brand": "HP",\n    "stock": 10,\n    "description": "Descripción del producto"\n  }\n]');
  const fileRef = useRef<HTMLInputElement>(null);

  const showResult = (success: boolean, message: string) => {
    setResult({ success, message });
    setTimeout(() => setResult(null), 5000);
  };

  const uploadExcel = async (file: File) => {
    setLoading(true);
    const fd = new FormData();
    fd.append("file", file);
    try {
      const r = await fetch(`${BASE}/products/import/excel`, { method: "POST", body: fd });
      const d = await r.json();
      if (d.success) showResult(true, `✅ ${d.imported} productos importados de ${d.total} filas`);
      else showResult(false, d.error || "Error al importar");
    } catch { showResult(false, "Error de conexión"); }
    setLoading(false);
  };

  const importJson = async () => {
    setLoading(true);
    try {
      const parsed = JSON.parse(jsonText);
      const products = Array.isArray(parsed) ? parsed : parsed.products || [];
      const r = await fetch(`${BASE}/products/import/json`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ products }) });
      const d = await r.json();
      if (d.success) showResult(true, `✅ ${d.imported} productos importados`);
      else showResult(false, d.error || "Error al importar");
    } catch (e) { showResult(false, `Error: ${e instanceof Error ? e.message : "JSON inválido"}`); }
    setLoading(false);
  };

  const syncWoo = async () => {
    setLoading(true);
    try {
      const r = await fetch(`${BASE}/products/import/woocommerce`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(wcForm) });
      const d = await r.json();
      if (d.success) showResult(true, `✅ ${d.imported} productos sincronizados de WooCommerce (${d.total} encontrados)`);
      else showResult(false, d.error || "Error al conectar con WooCommerce");
    } catch { showResult(false, "Error de conexión"); }
    setLoading(false);
  };

  const downloadTemplate = () => {
    const data = [["name", "description", "price", "category", "brand", "stock", "imageUrl"], ["Laptop HP", "Intel i5, 8GB RAM", "899.99", "Laptops", "HP", "10", "https://..."]];
    const csv = data.map(r => r.join(",")).join("\n");
    const a = document.createElement("a"); a.href = "data:text/csv;charset=utf-8," + encodeURIComponent(csv); a.download = "plantilla_productos.csv"; a.click();
  };

  const TABS: { key: Tab; label: string; icon: React.ReactNode }[] = [
    { key: "excel", label: "Excel / CSV", icon: <FileSpreadsheet size={16} /> },
    { key: "json", label: "JSON", icon: <Code size={16} /> },
    { key: "woocommerce", label: "WooCommerce", icon: <Globe size={16} /> },
  ];

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Importar Productos</h1>
        <p className="text-muted-foreground mt-1 text-sm">Carga tu catálogo desde Excel, JSON o sincroniza con tu tienda WooCommerce.</p>
      </div>

      {result && (
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className={`flex items-center gap-3 p-4 rounded-xl border text-sm ${result.success ? "bg-green-500/10 border-green-500/20 text-green-400" : "bg-red-500/10 border-red-500/20 text-red-400"}`}>
          {result.success ? <Check size={16} /> : <AlertCircle size={16} />} {result.message}
        </motion.div>
      )}

      <div className="flex gap-2 bg-card border border-border rounded-xl p-1">
        {TABS.map(t => (
          <button key={t.key} onClick={() => setTab(t.key)} className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-colors ${tab === t.key ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"}`}>
            {t.icon} {t.label}
          </button>
        ))}
      </div>

      {tab === "excel" && (
        <div className="bg-card border border-border rounded-2xl p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-foreground">Subir archivo Excel o CSV</h3>
              <p className="text-xs text-muted-foreground mt-1">Columnas: name, description, price, category, brand, stock, imageUrl</p>
            </div>
            <button onClick={downloadTemplate} className="flex items-center gap-1.5 text-xs text-primary hover:underline"><Download size={13} /> Plantilla</button>
          </div>
          <div onClick={() => fileRef.current?.click()} className="border-2 border-dashed border-border hover:border-primary/50 rounded-xl p-10 text-center cursor-pointer transition-colors group">
            <Upload size={32} className="mx-auto text-muted-foreground group-hover:text-primary transition-colors mb-3" />
            <p className="text-sm font-medium text-foreground">Haz clic o arrastra tu archivo aquí</p>
            <p className="text-xs text-muted-foreground mt-1">.xlsx, .xls, .csv — máximo 10MB</p>
          </div>
          <input ref={fileRef} type="file" accept=".xlsx,.xls,.csv" className="hidden" onChange={e => { const f = e.target.files?.[0]; if (f) uploadExcel(f); }} />
          {loading && <p className="text-sm text-center text-muted-foreground animate-pulse">Procesando archivo...</p>}
        </div>
      )}

      {tab === "json" && (
        <div className="bg-card border border-border rounded-2xl p-6 space-y-4">
          <div>
            <h3 className="font-semibold text-foreground">Pegar JSON de productos</h3>
            <p className="text-xs text-muted-foreground mt-1">Array de productos con campos: name, price, category (requeridos)</p>
          </div>
          <textarea value={jsonText} onChange={e => setJsonText(e.target.value)} rows={14} className="w-full px-4 py-3 rounded-xl bg-background border border-border text-foreground text-sm font-mono focus:outline-none focus:ring-2 focus:ring-primary/40 resize-none" />
          <button onClick={importJson} disabled={loading} className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:opacity-90 transition-opacity disabled:opacity-50">
            <Upload size={15} /> {loading ? "Importando..." : "Importar JSON"}
          </button>
        </div>
      )}

      {tab === "woocommerce" && (
        <div className="bg-card border border-border rounded-2xl p-6 space-y-4">
          <div>
            <h3 className="font-semibold text-foreground">Sincronizar con WooCommerce</h3>
            <p className="text-xs text-muted-foreground mt-1">Importa automáticamente tu catálogo desde WordPress + WooCommerce.</p>
          </div>
          <div className="space-y-3">
            {[
              { label: "URL de tu tienda WordPress", key: "url", placeholder: "https://mitienda.com", type: "text" },
              { label: "Consumer Key (WooCommerce API)", key: "consumerKey", placeholder: "ck_...", type: "password" },
              { label: "Consumer Secret", key: "consumerSecret", placeholder: "cs_...", type: "password" },
            ].map(f => (
              <div key={f.key}>
                <label className="text-xs text-muted-foreground mb-1 block">{f.label}</label>
                <input type={f.type} value={(wcForm as Record<string,string>)[f.key]} onChange={e => setWcForm(p => ({ ...p, [f.key]: e.target.value }))} placeholder={f.placeholder} className="w-full px-3 py-2.5 rounded-xl bg-background border border-border text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/40" />
              </div>
            ))}
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Productos por página (máx. 100)</label>
              <input type="number" value={wcForm.perPage} onChange={e => setWcForm(p => ({ ...p, perPage: e.target.value }))} min="1" max="100" className="w-32 px-3 py-2.5 rounded-xl bg-background border border-border text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/40" />
            </div>
          </div>
          <div className="bg-muted/50 rounded-xl p-4 text-xs text-muted-foreground space-y-1">
            <p className="font-semibold text-foreground">¿Cómo obtener las claves API de WooCommerce?</p>
            <p>1. Ve a tu WordPress → WooCommerce → Ajustes → Avanzado → API REST</p>
            <p>2. Haz clic en "Agregar clave" → Permisos: Solo lectura</p>
            <p>3. Copia el Consumer Key y Consumer Secret</p>
          </div>
          <button onClick={syncWoo} disabled={loading || !wcForm.url || !wcForm.consumerKey || !wcForm.consumerSecret} className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#7f54b3] text-white text-sm font-semibold hover:opacity-90 transition-opacity disabled:opacity-50">
            <Globe size={15} /> {loading ? "Sincronizando..." : "Sincronizar con WooCommerce"}
          </button>
        </div>
      )}
    </div>
  );
}
