// src/pages/BillingPage.jsx
import { useEffect, useState } from "react";
import { useBilling } from "../context/BillingContext";
import { useAuth } from "../context/AuthContext";

const PLAN_ICONS = { free: "🆓", starter: "🚀", pro: "⚡", enterprise: "🏢" };
const PLAN_COLORS = {
  free:       "border-gray-700 bg-gray-800/50",
  starter:    "border-blue-500/50 bg-blue-500/5",
  pro:        "border-violet-500 bg-violet-500/10 ring-2 ring-violet-500/30",
  enterprise: "border-amber-500/50 bg-amber-500/5",
};
const POPULAR = "pro";

function PlanCard({ plan, currentPlan, billingCycle, onSelect, isProcessing }) {
  const isCurrent = plan.id === currentPlan;
  const price = plan.price?.[billingCycle] ?? 0;
  const monthlyPrice = billingCycle === "yearly"
    ? Math.round(price / 100 / 12)
    : Math.round(price / 100);

  return (
    <div className={`relative rounded-2xl border p-6 flex flex-col gap-4 transition-all ${PLAN_COLORS[plan.id]}`}>
      {plan.id === POPULAR && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-violet-600 text-white text-xs font-bold rounded-full">
          MOST POPULAR
        </div>
      )}
      <div>
        <div className="flex items-center gap-2 mb-1">
          <span className="text-2xl">{PLAN_ICONS[plan.id]}</span>
          <h3 className="text-lg font-bold text-white">{plan.name}</h3>
        </div>
        <div className="flex items-end gap-1">
          <span className="text-3xl font-bold text-white">
            {price === 0 ? "Free" : `₦${monthlyPrice.toLocaleString()}`}
          </span>
          {price > 0 && <span className="text-gray-400 text-sm mb-1">/month</span>}
        </div>
        {billingCycle === "yearly" && price > 0 && (
          <p className="text-xs text-green-400 mt-0.5">Billed annually — 2 months free!</p>
        )}
      </div>

      <ul className="space-y-2 flex-1">
        {(plan.features || []).map((f) => (
          <li key={f} className="flex items-start gap-2 text-sm text-gray-300">
            <span className="text-green-400 mt-0.5 flex-shrink-0">✓</span>
            {f}
          </li>
        ))}
      </ul>

      <button
        onClick={() => !isCurrent && onSelect(plan.id)}
        disabled={isCurrent || isProcessing}
        className={`w-full py-2.5 px-4 rounded-xl font-semibold text-sm transition-colors
          ${isCurrent
            ? "bg-gray-700 text-gray-400 cursor-default"
            : plan.id === POPULAR
              ? "bg-violet-600 hover:bg-violet-500 text-white"
              : "bg-gray-700 hover:bg-gray-600 text-white"
          } disabled:opacity-60`}
      >
        {isCurrent ? "Current plan" : isProcessing ? "Processing..." : price === 0 ? "Downgrade" : "Upgrade →"}
      </button>
    </div>
  );
}

export default function BillingPage() {
  const { user } = useAuth();
  const {
    plans, credits, totalUsed, plan, planExpiresAt,
    transactions, isLoadingCredits, isProcessingPayment,
    isLowCredits, loadCredits, initiateCheckout, cancelSubscription,
  } = useBilling();

  const [billingCycle, setBillingCycle] = useState("monthly");
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [txPage, setTxPage] = useState(1);

  useEffect(() => { loadCredits({ page: txPage }); }, [txPage]);

  const handleUpgrade = async (planId) => {
    if (planId === "free") {
      setShowCancelConfirm(true);
      return;
    }
    await initiateCheckout({ planId, billingCycle });
  };

  const handleCancel = async () => {
    const result = await cancelSubscription();
    if (result.success) setShowCancelConfirm(false);
  };

  const txTypeColors = {
    purchase:     "text-green-400",
    usage:        "text-red-400",
    bonus:        "text-blue-400",
    subscription: "text-purple-400",
    refund:       "text-yellow-400",
  };
  const txTypeIcon = { purchase: "↑", usage: "↓", bonus: "★", subscription: "↺", refund: "↩" };

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <div className="max-w-5xl mx-auto px-4 py-10">
        {/* Header */}
        <div className="mb-10">
          <h1 className="text-3xl font-bold">Billing & Credits</h1>
          <p className="text-gray-400 mt-1">Manage your plan, credits, and payment history.</p>
        </div>

        {/* Credit overview cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-10">
          {[
            { label: "Credits remaining", value: credits ?? user?.credits ?? "—", accent: isLowCredits ? "text-red-400" : "text-violet-400" },
            { label: "Credits used (all time)", value: totalUsed ?? "—", accent: "text-gray-200" },
            { label: "Current plan", value: plan ? plan.charAt(0).toUpperCase() + plan.slice(1) : "Free", accent: "text-amber-400" },
          ].map((card) => (
            <div key={card.label} className="bg-gray-900 border border-gray-800 rounded-2xl p-5">
              <p className="text-sm text-gray-400 mb-1">{card.label}</p>
              <p className={`text-3xl font-bold ${card.accent}`}>{card.value}</p>
            </div>
          ))}
        </div>

        {isLowCredits && (
          <div className="mb-8 p-4 bg-red-500/10 border border-red-500/30 rounded-2xl flex items-center gap-3">
            <span className="text-2xl">⚠️</span>
            <div>
              <p className="font-semibold text-red-300">Running low on credits</p>
              <p className="text-sm text-gray-400">Upgrade your plan to keep using CodeFlow without interruption.</p>
            </div>
          </div>
        )}

        {/* Billing cycle toggle */}
        <div className="flex items-center justify-center gap-3 mb-8">
          <span className={`text-sm font-medium ${billingCycle === "monthly" ? "text-white" : "text-gray-500"}`}>Monthly</span>
          <button
            onClick={() => setBillingCycle((c) => c === "monthly" ? "yearly" : "monthly")}
            className={`relative w-12 h-6 rounded-full transition-colors ${billingCycle === "yearly" ? "bg-violet-600" : "bg-gray-700"}`}
          >
            <span className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${billingCycle === "yearly" ? "translate-x-7" : "translate-x-1"}`} />
          </button>
          <span className={`text-sm font-medium ${billingCycle === "yearly" ? "text-white" : "text-gray-500"}`}>
            Yearly <span className="text-green-400 text-xs font-bold">SAVE 17%</span>
          </span>
        </div>

        {/* Plan cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-12">
          {plans.map((p) => (
            <PlanCard key={p.id} plan={p} currentPlan={plan}
              billingCycle={billingCycle} onSelect={handleUpgrade}
              isProcessing={isProcessingPayment} />
          ))}
        </div>

        {planExpiresAt && (
          <p className="text-center text-sm text-gray-500 -mt-8 mb-10">
            Your plan renews on {new Date(planExpiresAt).toLocaleDateString("en-NG", { day: "numeric", month: "long", year: "numeric" })}.{" "}
            {plan !== "free" && (
              <button onClick={() => setShowCancelConfirm(true)} className="text-red-400 hover:underline">
                Cancel subscription
              </button>
            )}
          </p>
        )}

        {/* Transaction history */}
        <div className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-800">
            <h2 className="font-semibold text-lg">Credit history</h2>
          </div>
          {isLoadingCredits ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin h-6 w-6 border-2 border-violet-500 border-t-transparent rounded-full" />
            </div>
          ) : transactions.length === 0 ? (
            <div className="text-center py-12 text-gray-500">No transactions yet.</div>
          ) : (
            <div className="divide-y divide-gray-800">
              {transactions.map((tx) => (
                <div key={tx._id} className="flex items-center gap-4 px-6 py-4">
                  <span className={`text-xl font-bold ${txTypeColors[tx.type] || "text-gray-400"}`}>
                    {txTypeIcon[tx.type] || "•"}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-200 truncate">{tx.description}</p>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {new Date(tx.createdAt).toLocaleString("en-NG")}
                    </p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className={`font-semibold text-sm ${tx.amount > 0 ? "text-green-400" : "text-red-400"}`}>
                      {tx.amount > 0 ? "+" : ""}{tx.amount}
                    </p>
                    <p className="text-xs text-gray-500">{tx.balanceAfter} left</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Cancel confirm modal */}
        {showCancelConfirm && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-gray-900 border border-gray-800 rounded-2xl p-8 max-w-md w-full shadow-2xl">
              <h3 className="text-xl font-bold mb-3">Cancel subscription?</h3>
              <p className="text-gray-400 text-sm mb-6">
                You'll keep access until your billing period ends. After that, you'll revert to the free plan (10 credits/month).
              </p>
              <div className="flex gap-3">
                <button onClick={() => setShowCancelConfirm(false)}
                  className="flex-1 py-2.5 bg-gray-800 hover:bg-gray-700 rounded-xl text-sm font-medium transition-colors">
                  Keep subscription
                </button>
                <button onClick={handleCancel} disabled={isProcessingPayment}
                  className="flex-1 py-2.5 bg-red-600 hover:bg-red-500 disabled:opacity-60 rounded-xl text-sm font-medium transition-colors">
                  {isProcessingPayment ? "Cancelling..." : "Yes, cancel"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
