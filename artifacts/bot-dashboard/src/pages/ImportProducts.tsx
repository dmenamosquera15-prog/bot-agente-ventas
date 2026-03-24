import { useState, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Upload, FileSpreadsheet, Globe, Code, Check, AlertCircle, Download, Loader2 } from "lucide-react";

type Tab = "excel" | "json" | "woocommerce";

const BASE = "/api";

export default function ImportProducts() {
  const [tab, setTab] = useState<Tab>("excel");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [wcForm, setWcForm] = useState({ url: "", consumerKey: "", consumerSecret: "", perPage: "100" });
  const [jsonText, setJsonText] = useState(`[
  {
    "name": "Laptop HP 15",
    "description": "Intel i5, 8GB RAM, 512GB SSD",
    "price": 899.99,
    "category": "Laptops",
    "brand": "HP",
    "stock": 10,
    "imageUrl": "https://via.placeholder.com/300"
  },
  {
    "name": "Mouse Logitech MX",
    "description": "Mouse inalámbrico ergonómico",
    "price": 49.99,
    "category": "Periféricos",
    "brand": "Logitech",
    "stock": 25,
    "imageUrl": ""
  }
]`);
  const fileRef = useRef<HTMLInputElement>(null);

  const showResult = (success: boolean, message: string) => {
    setResult({ success, message });
    if (success) setTimeout(() => setResult(null), 6000);
  };

  const uploadExcel = async (file: File) => {
    setLoading(true);
    setResult(null);
    const fd = new FormData();
    fd.append("file", file);
    try {
      const r = await fetch(`${BASE}/products/import/excel`, { method: "POST", body: fd });
      const d = await r.json();
      if (d.success) showResult(true, `✅ ${d.imported} productos importados de ${d.total} filas`);
      else showResult(false, d.error || "Error desconocido al importar");
    } catch {
      showResult(false, "❌ Error de conexión con el servidor");
    }
    setLoading(false);
  };

  const importJson = async () => {
    setLoading(true);
    setResult(null);
    try {
      const parsed = JSON.parse(jsonText);
      const products = Array.isArray(parsed) ? parsed : (parsed.products || []);
      if (!products.length) {
        showResult(false, "El JSON no contiene productos. Debe ser un array [...]");
        setLoading(false);
        return;
      }
      const r = await fetch(`${BASE}/products/import/json`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ products }),
      });
      const d = await r.json();
      if (d.success) showResult(true, `✅ ${d.imported} productos importados correctamente`);
      else showResult(false, d.error || "Error al importar");
    } catch (e) {
      showResult(false, `❌ JSON inválido: ${e instanceof Error ? e.message : "Error de sintaxis"}`);
    }
    setLoading(false);
  };

  const syncWoo = async () => {
    setLoading(true);
    setResult(null);
    try {
      const r = await fetch(`${BASE}/products/import/woocommerce`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(wcForm),
      });
      const d = await r.json();
      if (d.success) showResult(true, `✅ ${d.imported} productos sincronizados de WooCommerce (${d.total} encontrados)`);
      else showResult(false, d.error || "Error conectando con WooCommerce");
    } catch {
      showResult(false, "❌ Error de conexión. Verifica la URL de WooCommerce.");
    }
    setLoading(false);
  };

  const downloadTemplate = () => {
    const csv = [
      "name,description,price,category,brand,stock,imageUrl",
      "Laptop HP 15,Intel i5 8GB RAM 512GB SSD,899.99,Laptops,HP,10,https://ejemplo.com/img.jpg",
      "Mouse Logitech MX,Mouse inalámbrico ergonómico,49.99,Periféricos,Logitech,25,",
      "Audífonos Sony WH,Sonido cancelación de ruido,199.99,Audio,Sony,15,",
    ].join("\n");
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "plantilla_productos.csv";
    a.click();
    URL.revokeObjectURL(a.href);
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) uploadExcel(file);
  }, []);

  const TABS: { key: Tab; label: string; icon: React.ReactNode }[] = [
    { key: "excel", label: "Excel / CSV", icon: <FileSpreadsheet size={16} /> },
    { key: "json", label: "JSON", icon: <Code size={16} /> },
    { key: "woocommerce", label: "WooCommerce", icon: <Globe size={16} /> },
  ];

  return (
    <div className="space-y-6 max-w-3xl animate-fade-in">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Importar Productos</h1>
        <p className="text-muted-foreground mt-1 text-sm">
          Carga tu catálogo desde Excel, JSON o sincroniza con tu tienda WooCommerce.
        </p>
      </div>

      <AnimatePresence>
        {result && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className={`flex items-start gap-3 p-4 rounded-xl border text-sm ${
              result.success
                ? "bg-green-500/10 border-green-500/30 text-green-400"
                : "bg-red-500/10 border-red-500/30 text-red-400"
            }`}
          >
            {result.success ? (
              <Check size={18} className="mt-0.5 shrink-0" />
            ) : (
              <AlertCircle size={18} className="mt-0.5 shrink-0" />
            )}
            <div className="flex-1">{result.message}</div>
            <button onClick={() => setResult(null)} className="opacity-60 hover:opacity-100 text-lg leading-none">×</button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Tabs */}
      <div className="flex gap-2 bg-card border border-border rounded-xl p-1">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => { setTab(t.key); setResult(null); }}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-all ${
              tab === t.key
                ? "bg-primary text-primary-foreground shadow-md"
                : "text-muted-foreground hover:text-foreground hover:bg-secondary/50"
            }`}
          >
            {t.icon} {t.label}
          </button>
        ))}
      </div>

      {/* ── Excel / CSV ── */}
      {tab === "excel" && (
        <div className="bg-card border border-border rounded-2xl p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-foreground">Subir archivo Excel o CSV</h3>
              <p className="text-xs text-muted-foreground mt-1">
                Columnas: <code className="bg-secondary px-1 rounded">name</code>,{" "}
                <code className="bg-secondary px-1 rounded">price</code>,{" "}
                <code className="bg-secondary px-1 rounded">category</code>,{" "}
                <code className="bg-secondary px-1 rounded">brand</code>,{" "}
                <code className="bg-secondary px-1 rounded">stock</code>,{" "}
                <code className="bg-secondary px-1 rounded">imageUrl</code>
              </p>
            </div>
            <button
              onClick={downloadTemplate}
              className="flex items-center gap-1.5 text-xs text-primary hover:underline font-medium shrink-0"
            >
              <Download size={13} /> Plantilla CSV
            </button>
          </div>

          <div
            onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
            onDragLeave={() => setIsDragOver(false)}
            onDrop={handleDrop}
            onClick={() => !loading && fileRef.current?.click()}
            className={`border-2 border-dashed rounded-xl p-10 text-center transition-all group ${
              isDragOver
                ? "border-primary bg-primary/5 scale-[1.01] cursor-copy"
                : "border-border hover:border-primary/50 hover:bg-secondary/30 cursor-pointer"
            } ${loading ? "pointer-events-none opacity-60" : ""}`}
          >
            {loading ? (
              <Loader2 size={32} className="mx-auto text-primary mb-3 animate-spin" />
            ) : isDragOver ? (
              <FileSpreadsheet size={32} className="mx-auto text-primary mb-3" />
            ) : (
              <Upload size={32} className="mx-auto text-muted-foreground group-hover:text-primary transition-colors mb-3" />
            )}
            <p className="text-sm font-medium text-foreground">
              {loading
                ? "Procesando archivo..."
                : isDragOver
                ? "¡Suelta el archivo aquí!"
                : "Haz clic o arrastra tu archivo aquí"}
            </p>
            <p className="text-xs text-muted-foreground mt-1">.xlsx, .xls, .csv — máximo 10 MB</p>
          </div>
          <input
            ref={fileRef}
            type="file"
            accept=".xlsx,.xls,.csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel,text/csv"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) { uploadExcel(f); e.target.value = ""; }
            }}
          />

          <div className="bg-secondary/30 rounded-xl p-4 text-xs text-muted-foreground space-y-1">
            <p className="font-semibold text-foreground mb-2">💡 Consejos para importar correctamente:</p>
            <p>• La <strong>primera fila</strong> debe ser el encabezado: name, price, category…</p>
            <p>• Acepta columnas en <strong>español</strong>: nombre, precio, categoria, marca, existencia</p>
            <p>• Precios deben ser números: <code className="bg-secondary px-1 rounded">899.99</code> (sin $)</p>
            <p>• CSV con punto y coma (europeo) es compatible automáticamente</p>
            <p>• Archivos exportados desde Excel con BOM UTF-8 también son compatibles</p>
          </div>
        </div>
      )}

      {/* ── JSON ── */}
      {tab === "json" && (
        <div className="bg-card border border-border rounded-2xl p-6 space-y-4">
          <div>
            <h3 className="font-semibold text-foreground">Pegar JSON de productos</h3>
            <p className="text-xs text-muted-foreground mt-1">
              Array de objetos con campos:{" "}
              <code className="bg-secondary px-1 rounded">name</code>,{" "}
              <code className="bg-secondary px-1 rounded">price</code>,{" "}
              <code className="bg-secondary px-1 rounded">category</code> (requeridos)
            </p>
          </div>
          <textarea
            value={jsonText}
            onChange={(e) => setJsonText(e.target.value)}
            rows={16}
            spellCheck={false}
            className="w-full px-4 py-3 rounded-xl bg-background border border-border text-foreground text-sm font-mono focus:outline-none focus:ring-2 focus:ring-primary/40 resize-none leading-relaxed"
          />
          <button
            onClick={importJson}
            disabled={loading}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            {loading ? <Loader2 size={15} className="animate-spin" /> : <Upload size={15} />}
            {loading ? "Importando..." : "Importar JSON"}
          </button>
        </div>
      )}

      {/* ── WooCommerce ── */}
      {tab === "woocommerce" && (
        <div className="bg-card border border-border rounded-2xl p-6 space-y-4">
          <div>
            <h3 className="font-semibold text-foreground">Sincronizar con WooCommerce</h3>
            <p className="text-xs text-muted-foreground mt-1">
              Importa automáticamente tu catálogo desde WordPress + WooCommerce.
            </p>
          </div>

          <div className="space-y-3">
            {[
              { label: "URL de tu tienda WordPress", key: "url", placeholder: "https://mitienda.com", type: "text" },
              { label: "Consumer Key", key: "consumerKey", placeholder: "ck_...", type: "password" },
              { label: "Consumer Secret", key: "consumerSecret", placeholder: "cs_...", type: "password" },
            ].map((f) => (
              <div key={f.key}>
                <label className="text-xs text-muted-foreground mb-1 block font-medium">{f.label}</label>
                <input
                  type={f.type}
                  value={(wcForm as Record<string, string>)[f.key]}
                  onChange={(e) => setWcForm((p) => ({ ...p, [f.key]: e.target.value }))}
                  placeholder={f.placeholder}
                  autoComplete="off"
                  className="w-full px-3 py-2.5 rounded-xl bg-background border border-border text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
                />
              </div>
            ))}
            <div>
              <label className="text-xs text-muted-foreground mb-1 block font-medium">
                Productos por página (máx. 100)
              </label>
              <input
                type="number"
                value={wcForm.perPage}
                onChange={(e) => setWcForm((p) => ({ ...p, perPage: e.target.value }))}
                min="1"
                max="100"
                className="w-32 px-3 py-2.5 rounded-xl bg-background border border-border text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
              />
            </div>
          </div>

          <div className="bg-muted/50 rounded-xl p-4 text-xs text-muted-foreground space-y-1">
            <p className="font-semibold text-foreground">¿Cómo obtener las claves API?</p>
            <p>1. WordPress → WooCommerce → Ajustes → Avanzado → API REST</p>
            <p>2. "Agregar clave" → Permisos: Solo lectura</p>
            <p>3. Copia aquí el Consumer Key y Consumer Secret</p>
          </div>

          <button
            onClick={syncWoo}
            disabled={loading || !wcForm.url || !wcForm.consumerKey || !wcForm.consumerSecret}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#7f54b3] text-white text-sm font-semibold hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            {loading ? <Loader2 size={15} className="animate-spin" /> : <Globe size={15} />}
            {loading ? "Sincronizando..." : "Sincronizar con WooCommerce"}
          </button>
        </div>
      )}
    </div>
  );
}
