import { useCallback, useEffect, useState } from "react";
import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  ChevronRight,
  Clock3,
  LoaderCircle,
  LockKeyhole,
  Mail,
  PackageCheck,
  ReceiptText,
  RefreshCw,
  ShieldCheck,
  ShoppingBag,
  Sparkles,
  Truck,
  XCircle,
} from "lucide-react";
import { useCart } from "../cart/CartContext.jsx";
import { useLanguage } from "../../i18n/LanguageContext.jsx";

const VALID_PAYMENT_STATUSES = new Set([
  "APPROVED",
  "REJECTED",
  "FAILED",
  "VOIDED",
  "PROCESSING",
  "PENDING",
  "NO_TRANSACTION_FOUND",
]);

const normalizeStatus = (value) => String(value || "").trim().toUpperCase();

const DetailCard = ({ icon: Icon, label, value, accent = false }) => (
  <div className="group relative overflow-hidden rounded-2xl border border-white/[0.08] bg-white/[0.025] p-4 transition hover:border-cyan-300/20 hover:bg-cyan-300/[0.025] sm:p-5">
    <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(34,211,238,0.07),transparent_48%)] opacity-0 transition group-hover:opacity-100" />
    <div className="relative flex items-start gap-3">
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-cyan-300/15 bg-cyan-300/[0.05] text-cyan-300">
        <Icon size={15} />
      </span>
      <div className="min-w-0">
        <p className="font-mono text-[7px] font-bold uppercase tracking-[0.15em] text-slate-600">
          {label}
        </p>
        <p
          className={`mt-2 break-all font-mono text-[9px] font-bold leading-5 sm:text-[10px] ${
            accent ? "text-cyan-300" : "text-slate-200"
          }`}
        >
          {value}
        </p>
      </div>
    </div>
  </div>
);

const JourneyStep = ({ icon: Icon, number, title, description, active = false }) => (
  <div
    className={`relative rounded-2xl border p-4 sm:p-5 ${
      active
        ? "border-cyan-300/20 bg-cyan-300/[0.045]"
        : "border-white/[0.075] bg-white/[0.02]"
    }`}
  >
    <div className="flex items-start gap-3.5">
      <span
        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border ${
          active
            ? "border-cyan-300/25 bg-cyan-300/[0.08] text-cyan-300"
            : "border-white/10 bg-white/[0.03] text-slate-500"
        }`}
      >
        <Icon size={16} />
      </span>
      <div>
        <p className="font-mono text-[7px] font-bold uppercase tracking-[0.16em] text-slate-600">
          {number}
        </p>
        <h3 className="mt-1.5 font-['Orbitron'] text-[9px] font-black uppercase tracking-[0.07em] text-white">
          {title}
        </h3>
        <p className="mt-2 font-mono text-[8px] leading-5 text-slate-500">
          {description}
        </p>
      </div>
    </div>
  </div>
);

export default function CheckoutResult() {
  const { language } = useLanguage();
  const { clearCart } = useCart();

  const [reference, setReference] = useState("");
  const [reportedStatus, setReportedStatus] = useState("");
  const [result, setResult] = useState({
    state: "loading",
    status: "",
    order: null,
    transaction: null,
    error: "",
  });

  const verifyPayment = useCallback(
    async (orderReference) => {
      if (!orderReference) {
        setResult({
          state: "error",
          status: "",
          order: null,
          transaction: null,
          error: "INVALID_ORDER_REFERENCE",
        });
        return;
      }

      setResult((current) => ({
        ...current,
        state: "loading",
        error: "",
      }));

      try {
        const response = await fetch(
          `/api/payments/bold/status?orderId=${encodeURIComponent(orderReference)}`,
          {
            method: "GET",
            credentials: "same-origin",
            cache: "no-store",
            headers: { Accept: "application/json" },
          },
        );

        const payload = await response.json().catch(() => ({}));

        if (!response.ok || payload?.ok === false) {
          throw Object.assign(new Error(payload?.code || "STATUS_UNAVAILABLE"), {
            code: payload?.code || "STATUS_UNAVAILABLE",
          });
        }

        const status = normalizeStatus(payload?.status);

        if (!VALID_PAYMENT_STATUSES.has(status)) {
          throw Object.assign(new Error("INVALID_PAYMENT_STATUS"), {
            code: "INVALID_PAYMENT_STATUS",
          });
        }

        setResult({
          state: "ready",
          status,
          order: payload?.order || null,
          transaction: payload?.transaction || null,
          error: "",
        });

        if (status === "APPROVED") {
          try {
            const pendingOrderReference = sessionStorage.getItem("bold_pending_order");

            if (pendingOrderReference === orderReference) {
              clearCart();
              sessionStorage.removeItem("bold_pending_order");
            }
          } catch {
            // La confirmación continúa aunque sessionStorage esté bloqueado.
          }
        }
      } catch (error) {
        setResult((current) => ({
          ...current,
          state: "error",
          status: "",
          error: error?.code || error?.message || "STATUS_UNAVAILABLE",
        }));
      }
    },
    [clearCart],
  );

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const orderReference = String(params.get("bold-order-id") || "").trim();
    const statusFromBold = normalizeStatus(params.get("bold-tx-status"));

    setReference(orderReference);
    setReportedStatus(statusFromBold);
    verifyPayment(orderReference);
  }, [verifyPayment]);

  const serverStatus =
    result.state === "ready" && VALID_PAYMENT_STATUSES.has(normalizeStatus(result.status))
      ? normalizeStatus(result.status)
      : "";

  const status = serverStatus || "PROCESSING";
  const verificationError = result.state === "error";
  const approved = result.state === "ready" && status === "APPROVED";
  const rejected =
    result.state === "ready" && ["REJECTED", "FAILED", "VOIDED"].includes(status);
  const pending = !verificationError && !approved && !rejected;

  const copy =
    language === "es"
      ? {
          eyebrow: "CONFIRMACIÓN DE COMPRA // LABCORE",
          verified: "VERIFICADO POR SERVIDOR",
          approvedKicker: "ORDEN RECIBIDA CON ÉXITO",
          approvedTitle: "¡Gracias por tu compra!",
          approvedText:
            "Tu pago fue confirmado correctamente. Ya comenzamos a preparar el siguiente paso de tu orden y te mantendremos informado por correo.",
          rejectedKicker: "EL PAGO NO FUE APROBADO",
          rejectedTitle: "Tu pedido sigue a salvo",
          rejectedText:
            "La transacción no se completó y no se realizará ningún despacho. Puedes volver a la tienda o revisar tus pedidos antes de intentarlo nuevamente.",
          pendingKicker: "CONFIRMACIÓN EN PROGRESO",
          pendingTitle: "Estamos confirmando tu pago",
          pendingText:
            "La orden ya fue recibida y estamos esperando la respuesta final de Bold. No necesitas crear otra compra; puedes verificar nuevamente desde esta misma pantalla.",
          errorKicker: "VERIFICACIÓN TEMPORALMENTE NO DISPONIBLE",
          errorTitle: "Tu orden está registrada",
          errorText:
            "Recibimos la referencia, pero el servicio de consulta no respondió todavía. Tu compra no se perdió; vuelve a verificar en unos minutos.",
          reference: "Referencia Bold",
          order: "Número de orden",
          total: "Total confirmado",
          server: "Estado del pago",
          reported: "Estado mostrado por Bold",
          retry: "Verificar de nuevo",
          account: "Ver mis pedidos",
          shop: "Seguir comprando",
          securityTitle: "Tu compra está protegida",
          security:
            "La orden solo entra en preparación después de que nuestro servidor confirma el pago directamente con Bold.",
          nextTitle: "¿Qué sucede ahora?",
          nextText: "Te acompañamos en cada etapa hasta que recibas tu pedido.",
          stepOneTitle: "Confirmación por correo",
          stepOneText: "Recibirás los datos de tu orden en el correo registrado durante el checkout.",
          stepTwoTitle: "Preparación cuidadosa",
          stepTwoText: "Nuestro equipo revisará y preparará los productos incluidos en tu compra.",
          stepThreeTitle: "Actualización de envío",
          stepThreeText: "Cuando la orden avance, recibirás la información disponible de seguimiento.",
          approvedBadge: "PAGO APROBADO",
          pendingBadge: "VERIFICANDO",
          rejectedBadge: "NO APROBADO",
          errorBadge: "SIN CONEXIÓN",
          unavailable: "NO DISPONIBLE",
          helpText: "Guarda esta referencia para cualquier consulta relacionada con tu compra.",
        }
      : {
          eyebrow: "PURCHASE CONFIRMATION // LABCORE",
          verified: "SERVER VERIFIED",
          approvedKicker: "ORDER RECEIVED SUCCESSFULLY",
          approvedTitle: "Thank you for your purchase!",
          approvedText:
            "Your payment was confirmed successfully. We have already started the next step of your order and will keep you updated by email.",
          rejectedKicker: "PAYMENT WAS NOT APPROVED",
          rejectedTitle: "Your order details are safe",
          rejectedText:
            "The transaction was not completed and no shipment will be made. You can return to the shop or review your orders before trying again.",
          pendingKicker: "CONFIRMATION IN PROGRESS",
          pendingTitle: "We are confirming your payment",
          pendingText:
            "Your order was received and we are waiting for Bold's final response. You do not need to create another purchase; check again from this screen.",
          errorKicker: "VERIFICATION TEMPORARILY UNAVAILABLE",
          errorTitle: "Your order is registered",
          errorText:
            "We received the reference, but the status service has not responded yet. Your purchase was not lost; check again in a few minutes.",
          reference: "Bold reference",
          order: "Order number",
          total: "Confirmed total",
          server: "Payment status",
          reported: "Status shown by Bold",
          retry: "Check again",
          account: "View my orders",
          shop: "Continue shopping",
          securityTitle: "Your purchase is protected",
          security:
            "The order enters preparation only after our server confirms the payment directly with Bold.",
          nextTitle: "What happens next?",
          nextText: "We will keep you informed at every stage until your order arrives.",
          stepOneTitle: "Email confirmation",
          stepOneText: "The details of your order will be sent to the email entered at checkout.",
          stepTwoTitle: "Careful preparation",
          stepTwoText: "Our team will review and prepare the products included in your purchase.",
          stepThreeTitle: "Shipping update",
          stepThreeText: "As the order progresses, you will receive any available tracking information.",
          approvedBadge: "PAYMENT APPROVED",
          pendingBadge: "VERIFYING",
          rejectedBadge: "NOT APPROVED",
          errorBadge: "UNAVAILABLE",
          unavailable: "UNAVAILABLE",
          helpText: "Keep this reference for any question related to your purchase.",
        };

  const title = verificationError
    ? copy.errorTitle
    : approved
      ? copy.approvedTitle
      : rejected
        ? copy.rejectedTitle
        : copy.pendingTitle;

  const description = verificationError
    ? copy.errorText
    : approved
      ? copy.approvedText
      : rejected
        ? copy.rejectedText
        : copy.pendingText;

  const kicker = verificationError
    ? copy.errorKicker
    : approved
      ? copy.approvedKicker
      : rejected
        ? copy.rejectedKicker
        : copy.pendingKicker;

  const badge = verificationError
    ? copy.errorBadge
    : approved
      ? copy.approvedBadge
      : rejected
        ? copy.rejectedBadge
        : copy.pendingBadge;

  const Icon = verificationError
    ? AlertTriangle
    : approved
      ? CheckCircle2
      : rejected
        ? XCircle
        : Clock3;

  const theme = verificationError || rejected
    ? {
        text: "text-rose-300",
        border: "border-rose-300/25",
        bg: "bg-rose-300/[0.055]",
        glow: "shadow-[0_0_70px_rgba(251,113,133,0.14)]",
      }
    : approved
      ? {
          text: "text-emerald-300",
          border: "border-emerald-300/25",
          bg: "bg-emerald-300/[0.055]",
          glow: "shadow-[0_0_90px_rgba(110,231,183,0.16)]",
        }
      : {
          text: "text-cyan-300",
          border: "border-cyan-300/25",
          bg: "bg-cyan-300/[0.055]",
          glow: "shadow-[0_0_80px_rgba(34,211,238,0.15)]",
        };

  const serverStatusLabel =
    result.state === "loading"
      ? "VERIFYING"
      : verificationError
        ? copy.unavailable
        : status;

  const showRetryButton = pending || verificationError;

  return (
    <main className="relative min-h-screen overflow-hidden px-4 pb-20 pt-[var(--lab-mobile-page-top)] sm:px-6 sm:pb-28 sm:pt-[10rem] lg:px-8 lg:pt-[10.8rem]">
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute left-1/2 top-20 h-[560px] w-[560px] -translate-x-1/2 rounded-full bg-cyan-300/[0.055] blur-[130px]" />
        <div className="absolute -left-32 top-[40%] h-80 w-80 rounded-full bg-blue-500/[0.05] blur-[120px]" />
        <div className="absolute -right-24 bottom-0 h-96 w-96 rounded-full bg-emerald-400/[0.045] blur-[130px]" />
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.018)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.018)_1px,transparent_1px)] bg-[size:48px_48px] [mask-image:linear-gradient(to_bottom,black,transparent_85%)]" />
      </div>

      <div className="mx-auto max-w-[1180px]">
        <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="font-mono text-[8px] font-bold uppercase tracking-[0.22em] text-cyan-300/70">
            {copy.eyebrow}
          </p>
          <span className="inline-flex w-fit items-center gap-2 rounded-full border border-emerald-300/15 bg-emerald-300/[0.04] px-3.5 py-2 font-mono text-[7px] font-bold uppercase tracking-[0.12em] text-emerald-300">
            <ShieldCheck size={12} />
            {copy.verified}
          </span>
        </div>

        <section className="relative overflow-hidden rounded-[34px] border border-white/[0.09] bg-[#040d1e]/92 shadow-[0_36px_120px_rgba(2,8,23,0.62)] backdrop-blur-xl">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_16%_4%,rgba(34,211,238,0.13),transparent_34%),radial-gradient(circle_at_84%_12%,rgba(110,231,183,0.08),transparent_30%)]" />

          <div className="relative grid lg:grid-cols-[minmax(0,1.35fr)_minmax(360px,.75fr)]">
            <div className="px-5 py-8 sm:px-8 sm:py-11 lg:px-12 lg:py-14">
              <div className="flex flex-col gap-7 sm:flex-row sm:items-start">
                <div className="relative mx-auto shrink-0 sm:mx-0">
                  {approved && (
                    <>
                      <span className="absolute -left-3 -top-4 text-cyan-200/70">
                        <Sparkles size={16} />
                      </span>
                      <span className="absolute -right-5 top-2 text-emerald-200/60">
                        <Sparkles size={12} />
                      </span>
                      <span className="absolute bottom-1 -left-6 text-cyan-300/40">
                        <Sparkles size={10} />
                      </span>
                    </>
                  )}

                  <div
                    className={`relative flex h-28 w-28 items-center justify-center rounded-[34px] border sm:h-32 sm:w-32 ${theme.border} ${theme.bg} ${theme.text} ${theme.glow}`}
                  >
                    <span className={`absolute inset-3 rounded-[26px] border ${theme.border}`} />
                    {result.state === "loading" ? (
                      <LoaderCircle size={38} className="animate-spin" />
                    ) : (
                      <Icon size={42} strokeWidth={1.7} />
                    )}
                  </div>
                </div>

                <div className="min-w-0 flex-1 text-center sm:text-left">
                  <div
                    className={`inline-flex items-center gap-2 rounded-full border px-3.5 py-2 font-mono text-[7px] font-black uppercase tracking-[0.13em] ${theme.border} ${theme.bg} ${theme.text}`}
                  >
                    <span className={`h-1.5 w-1.5 rounded-full bg-current ${pending ? "animate-pulse" : ""}`} />
                    {result.state === "loading" ? "VERIFYING" : badge}
                  </div>

                  <p className="mt-6 font-mono text-[8px] font-bold uppercase tracking-[0.21em] text-slate-500">
                    {kicker}
                  </p>

                  <h1 className="mt-3 font-['Orbitron'] text-3xl font-black uppercase leading-[1.02] tracking-[-0.045em] text-white sm:text-4xl lg:text-[48px]">
                    {title}
                  </h1>

                  <p className="mx-auto mt-5 max-w-2xl font-sans text-sm leading-7 text-slate-400 sm:mx-0 sm:text-[15px] sm:leading-8">
                    {description}
                  </p>
                </div>
              </div>

              {approved && (
                <div className="mt-10 rounded-[26px] border border-emerald-300/15 bg-emerald-300/[0.035] p-5 sm:p-6">
                  <div className="flex items-start gap-3.5">
                    <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-emerald-300/20 bg-emerald-300/[0.06] text-emerald-300">
                      <Sparkles size={17} />
                    </span>
                    <div>
                      <h2 className="font-['Orbitron'] text-[10px] font-black uppercase tracking-[0.08em] text-emerald-100">
                        {copy.nextTitle}
                      </h2>
                      <p className="mt-2 font-mono text-[8px] leading-5 text-emerald-100/50">
                        {copy.nextText}
                      </p>
                    </div>
                  </div>

                  <div className="mt-5 grid gap-3 md:grid-cols-3">
                    <JourneyStep
                      icon={Mail}
                      number="01 // EMAIL"
                      title={copy.stepOneTitle}
                      description={copy.stepOneText}
                      active
                    />
                    <JourneyStep
                      icon={PackageCheck}
                      number="02 // PREPARATION"
                      title={copy.stepTwoTitle}
                      description={copy.stepTwoText}
                    />
                    <JourneyStep
                      icon={Truck}
                      number="03 // DELIVERY"
                      title={copy.stepThreeTitle}
                      description={copy.stepThreeText}
                    />
                  </div>
                </div>
              )}

              {!approved && (
                <div className={`mt-9 flex items-start gap-3 rounded-2xl border p-4 sm:p-5 ${theme.border} ${theme.bg}`}>
                  <ReceiptText size={16} className={`mt-0.5 shrink-0 ${theme.text}`} />
                  <div>
                    <p className="font-['Orbitron'] text-[9px] font-black uppercase tracking-[0.08em] text-white">
                      {copy.securityTitle}
                    </p>
                    <p className="mt-2 font-mono text-[8px] leading-5 text-slate-500">
                      {copy.security}
                    </p>
                  </div>
                </div>
              )}
            </div>

            <aside className="relative border-t border-white/[0.08] bg-[#020817]/72 p-5 sm:p-7 lg:border-l lg:border-t-0 lg:p-8">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="font-mono text-[7px] font-bold uppercase tracking-[0.18em] text-cyan-300/65">
                    ORDER // SUMMARY
                  </p>
                  <h2 className="mt-2 font-['Orbitron'] text-[11px] font-black uppercase tracking-[0.08em] text-white">
                    {language === "es" ? "Detalles de tu compra" : "Purchase details"}
                  </h2>
                </div>
                <span className="flex h-11 w-11 items-center justify-center rounded-2xl border border-cyan-300/15 bg-cyan-300/[0.05] text-cyan-300">
                  <ReceiptText size={17} />
                </span>
              </div>

              <div className="mt-6 grid gap-3">
                <DetailCard icon={LockKeyhole} label={copy.reference} value={reference || "—"} />
                <DetailCard
                  icon={ShoppingBag}
                  label={copy.order}
                  value={result.order?.number ? `#${result.order.number}` : "—"}
                />
                <DetailCard
                  icon={ReceiptText}
                  label={copy.total}
                  value={
                    result.order?.total
                      ? `${result.order.currency || "COP"} ${result.order.total}`
                      : "—"
                  }
                  accent
                />
                <DetailCard
                  icon={ShieldCheck}
                  label={copy.server}
                  value={serverStatusLabel}
                  accent={approved || pending}
                />
              </div>

              {reportedStatus && reportedStatus !== serverStatus && (
                <p className="mt-4 rounded-xl border border-white/[0.07] bg-white/[0.02] px-3 py-2.5 font-mono text-[7px] leading-5 text-slate-600">
                  {copy.reported}: <b className="text-slate-400">{reportedStatus}</b>
                </p>
              )}

              <div className="mt-5 flex items-start gap-2.5 rounded-xl border border-cyan-300/12 bg-cyan-300/[0.025] p-3.5">
                <ShieldCheck size={13} className="mt-0.5 shrink-0 text-cyan-300" />
                <p className="font-mono text-[7px] leading-5 text-slate-500">{copy.helpText}</p>
              </div>

              <div className="mt-6 grid gap-3">
                {showRetryButton && (
                  <button
                    type="button"
                    onClick={() => verifyPayment(reference)}
                    disabled={result.state === "loading"}
                    className="flex min-h-[52px] items-center justify-center gap-2 rounded-2xl bg-cyan-300 px-5 font-['Orbitron'] text-[8px] font-black uppercase tracking-[0.11em] text-[#020617] shadow-[0_14px_38px_rgba(34,211,238,0.16)] transition hover:-translate-y-0.5 hover:bg-white disabled:cursor-not-allowed disabled:translate-y-0 disabled:opacity-60"
                  >
                    <RefreshCw
                      size={14}
                      className={result.state === "loading" ? "animate-spin" : ""}
                    />
                    {copy.retry}
                  </button>
                )}

                <a
                  href="/cuenta"
                  className="group flex min-h-[52px] items-center justify-between rounded-2xl border border-cyan-300/20 bg-cyan-300/[0.035] px-5 font-['Orbitron'] text-[8px] font-black uppercase tracking-[0.1em] text-cyan-300 transition hover:border-cyan-300/35 hover:bg-cyan-300/[0.075]"
                >
                  <span className="flex items-center gap-2">
                    <PackageCheck size={14} />
                    {copy.account}
                  </span>
                  <ChevronRight size={15} className="transition group-hover:translate-x-1" />
                </a>

                <a
                  href="/shop"
                  className="group flex min-h-[52px] items-center justify-between rounded-2xl border border-white/10 px-5 font-['Orbitron'] text-[8px] font-black uppercase tracking-[0.1em] text-slate-400 transition hover:border-white/20 hover:bg-white/[0.035] hover:text-white"
                >
                  <span className="flex items-center gap-2">
                    <ShoppingBag size={14} />
                    {copy.shop}
                  </span>
                  <ArrowRight size={14} className="transition group-hover:translate-x-1" />
                </a>
              </div>
            </aside>
          </div>
        </section>

        <div className="mx-auto mt-6 flex max-w-3xl items-center justify-center gap-2 text-center font-mono text-[7px] uppercase leading-5 tracking-[0.1em] text-slate-700">
          <ShieldCheck size={12} className="shrink-0 text-cyan-300/50" />
          {copy.security}
        </div>
      </div>
    </main>
  );
}
