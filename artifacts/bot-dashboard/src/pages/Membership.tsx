import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { motion } from "framer-motion";
import {
  CreditCard,
  Check,
  X,
  Download,
  Loader2,
  AlertCircle,
  Crown,
  Sparkles,
} from "lucide-react";

interface Subscription {
  id: number;
  plan: string;
  status: string;
  priceCOP: number;
  paymentMethod: string | null;
  startsAt: string;
  endsAt: string;
}

interface Tenant {
  id: number;
  name: string;
  plan: string;
  trialEndsAt: string | null;
}

interface Invoice {
  id: number;
  invoiceNumber: string;
  plan: string;
  priceCOP: number;
  tax: number;
  total: number;
  status: string;
  issuedAt: string;
  paidAt: string | null;
}

const PLANS = [
  {
    id: "monthly",
    name: "Plan Mensual",
    price: 30000,
    priceUSD: 7.5,
    period: "mes",
    features: [
      "✅ Bot de WhatsApp con IA",
      "✅ Respuestas automáticas 24/7",
      "✅ Catálogo de productos",
      "✅ 1 número de WhatsApp",
      "✅ Panel de control completo",
      "✅ IA con memoria majestuosa",
      "✅ Links de pago dinámicos",
      "✅ Mercado Pago y PayPal",
      "✅ Facturas automáticas",
    ],
  },
  {
    id: "annual",
    name: "Plan Anual",
    price: 360000,
    priceUSD: 90,
    period: "año",
    badge: "MEJOR VALOR",
    badgeColor: "bg-amber-500",
    features: [
      "✅ Todo del plan mensual",
      "✅ 2 meses incluidos",
      "✅ Soporte prioritario",
      "✅ Actualizaciones premium",
      "✅ Sin interrupciones",
      "✅ Precio bloqueado",
    ],
  },
];

const formatCOP = (v: number) =>
  new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    maximumFractionDigits: 0,
  }).format(v);
const formatDate = (d: string | null) =>
  d
    ? new Date(d).toLocaleDateString("es-CO", {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : "-";

export default function Membership() {
  const [, navigate] = useLocation();
  const [loading, setLoading] = useState(true);
  const [subscribing, setSubscribing] = useState<string | null>(null);
  const [tenant, setTenant] = useState<Tenant | null>(null);
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [error, setError] = useState<string | null>(null);

  const token = localStorage.getItem("token");

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [meRes, invoicesRes] = await Promise.all([
        fetch("/api/auth/me", {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch("/api/auth/invoices", {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);

      if (!meRes.ok) throw new Error("Unauthorized");
      const meData = await meRes.json();
      setTenant(meData.tenant);
      setSubscription(meData.subscription);

      if (invoicesRes.ok) {
        const invData = await invoicesRes.json();
        setInvoices(invData);
      }
    } catch (err) {
      setError("Error cargando datos");
    } finally {
      setLoading(false);
    }
  };

  const handleSubscribe = async (planId: string) => {
    setSubscribing(planId);
    setError(null);

    try {
      const res = await fetch("/api/auth/subscribe", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          plan: planId,
          paymentMethod: "mercadopago",
        }),
      });

      const data = await res.json();

      if (!res.ok) throw new Error(data.error || "Error generando pago");

      if (data.paymentLink) {
        window.location.href = data.paymentLink;
      }
    } catch (err: any) {
      setError(err.message);
      setSubscribing(null);
    }
  };

  const getPlanStatus = () => {
    if (!subscription)
      return { label: "Sin plan", color: "text-red-500", bg: "bg-red-500/10" };
    if (subscription.status === "active") {
      return {
        label: `Plan ${subscription.plan}`,
        color: "text-green-500",
        bg: "bg-green-500/10",
      };
    }
    if (subscription.status === "pending") {
      return {
        label: "Pago pendiente",
        color: "text-yellow-500",
        bg: "bg-yellow-500/10",
      };
    }
    return {
      label: `Plan ${subscription.plan}`,
      color: "text-muted-foreground",
      bg: "bg-muted",
    };
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const status = getPlanStatus();

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <Crown className="w-8 h-8 text-amber-500" />
            Membresía
          </h1>
          <p className="text-muted-foreground mt-1">
            Gestiona tu plan y facturación
          </p>
        </div>
        <div
          className={`px-4 py-2 rounded-full text-sm font-medium ${status.bg} ${status.color}`}
        >
          {status.label}
        </div>
      </div>

      {/* Current Plan */}
      {subscription && subscription.status === "active" && (
        <div className="bg-gradient-to-r from-indigo-600/10 to-purple-600/10 border border-indigo-500/20 rounded-2xl p-6">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2 text-indigo-400 text-sm font-medium mb-1">
                <Sparkles size={16} />
                Plan activo
              </div>
              <h3 className="text-2xl font-bold capitalize">
                {subscription.plan}
              </h3>
              <p className="text-muted-foreground text-sm mt-1">
                Vence el {formatDate(subscription.endsAt)}
              </p>
            </div>
            <div className="text-right">
              <div className="text-3xl font-bold">
                {formatCOP(subscription.priceCOP)}
              </div>
              <div className="text-muted-foreground text-sm">
                /{subscription.plan === "annual" ? "año" : "mes"}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 flex items-center gap-3 text-red-400">
          <AlertCircle size={20} />
          {error}
        </div>
      )}

      {/* Plans */}
      <div className="grid md:grid-cols-2 gap-6">
        {PLANS.map((plan) => {
          const isCurrent =
            subscription?.plan === plan.id && subscription.status === "active";
          return (
            <motion.div
              key={plan.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className={`relative bg-card border rounded-2xl p-6 ${isCurrent ? "border-indigo-500/50 ring-2 ring-indigo-500/20" : "border-border"}`}
            >
              {plan.badge && (
                <div
                  className={`absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full text-xs font-bold text-white ${plan.badgeColor}`}
                >
                  {plan.badge}
                </div>
              )}
              <div className="text-center mb-6">
                <h3 className="font-bold text-xl mb-2">{plan.name}</h3>
                <div className="text-4xl font-black">
                  {formatCOP(plan.price)}
                </div>
                <div className="text-muted-foreground text-sm">
                  COP / {plan.period}
                </div>
              </div>
              <ul className="space-y-3 mb-6">
                {plan.features.map((f) => (
                  <li
                    key={f}
                    className="text-sm text-muted-foreground flex items-start gap-2"
                  >
                    <Check className="w-4 h-4 text-green-500 shrink-0 mt-0.5" />
                    {f.replace("✅ ", "")}
                  </li>
                ))}
              </ul>
              <button
                onClick={() => handleSubscribe(plan.id)}
                disabled={isCurrent || subscribing === plan.id}
                className={`w-full py-3 rounded-xl font-semibold transition-all flex items-center justify-center gap-2 ${
                  isCurrent
                    ? "bg-muted text-muted-foreground cursor-default"
                    : "bg-indigo-600 hover:bg-indigo-500 text-white"
                }`}
              >
                {subscribing === plan.id ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : isCurrent ? (
                  "Plan Actual"
                ) : (
                  <>
                    <CreditCard size={18} />
                    Suscribirme
                  </>
                )}
              </button>
            </motion.div>
          );
        })}
      </div>

      {/* Invoices */}
      <div className="bg-card border border-border rounded-2xl p-6">
        <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
          <Download size={20} />
          Facturas
        </h3>
        {invoices.length === 0 ? (
          <p className="text-muted-foreground text-center py-8">
            No hay facturas aún
          </p>
        ) : (
          <div className="space-y-3">
            {invoices.map((inv) => (
              <div
                key={inv.id}
                className="flex items-center justify-between p-4 bg-muted/30 rounded-xl"
              >
                <div>
                  <div className="font-medium">{inv.invoiceNumber}</div>
                  <div className="text-sm text-muted-foreground">
                    {inv.plan} · {formatDate(inv.issuedAt)}
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-bold">{formatCOP(inv.total)}</div>
                  <div
                    className={`text-xs ${inv.status === "paid" ? "text-green-500" : "text-yellow-500"}`}
                  >
                    {inv.status === "paid" ? "✅ Pagada" : "⏳ Pendiente"}
                  </div>
                </div>
                <a
                  href={`/api/auth/invoices/${inv.id}/html`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2 hover:bg-muted rounded-lg transition-colors"
                >
                  <Download size={18} />
                </a>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
