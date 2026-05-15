// src/context/BillingContext.jsx
import { createContext, useContext, useReducer, useCallback, useEffect, useRef } from "react";
import { billingApi } from "../utils/api";
import { useAuth } from "./AuthContext";

// ─── STATE ────────────────────────────────────────────────────────────────────
const initialState = {
  plans: [],
  transactions: [],
  credits: null,
  totalUsed: 0,
  plan: "free",
  planExpiresAt: null,
  isLoadingPlans: false,
  isLoadingCredits: false,
  isProcessingPayment: false,
  checkoutUrl: null,
  error: null,
  pagination: { page: 1, total: 0, pages: 1 },
};

// ─── REDUCER ──────────────────────────────────────────────────────────────────
function billingReducer(state, action) {
  switch (action.type) {
    case "SET_PLANS":
      return { ...state, plans: action.payload, isLoadingPlans: false };
    case "SET_CREDITS_DATA":
      return {
        ...state,
        credits: action.payload.credits,
        totalUsed: action.payload.totalUsed,
        plan: action.payload.plan,
        planExpiresAt: action.payload.planExpiresAt,
        transactions: action.payload.transactions,
        pagination: action.payload.pagination,
        isLoadingCredits: false,
      };
    case "PAYMENT_START":
      return { ...state, isProcessingPayment: true, error: null, checkoutUrl: null };
    case "PAYMENT_INITIALIZED":
      return {
        ...state,
        isProcessingPayment: false,
        checkoutUrl: action.payload,
      };
    case "PAYMENT_VERIFIED": {
      return {
        ...state,
        credits: action.payload.creditsTotal,
        plan: action.payload.plan,
        isProcessingPayment: false,
      };
    }
    case "LOADING_PLANS":
      return { ...state, isLoadingPlans: true };
    case "LOADING_CREDITS":
      return { ...state, isLoadingCredits: true };
    case "SET_ERROR":
      return { ...state, error: action.payload, isProcessingPayment: false };
    case "CLEAR_ERROR":
      return { ...state, error: null };
    case "CLEAR_CHECKOUT_URL":
      return { ...state, checkoutUrl: null };
    default:
      return state;
  }
}

// ─── CONTEXT ──────────────────────────────────────────────────────────────────
const BillingContext = createContext(null);

export function BillingProvider({ children }) {
  const [state, dispatch] = useReducer(billingReducer, initialState);
  const { isAuthenticated, updateUser } = useAuth();

  // ─── LOAD PLANS (public) ──────────────────────────────────────────────────
  const loadPlans = useCallback(async () => {
    if (state.plans.length > 0) return; // cached
    dispatch({ type: "LOADING_PLANS" });
    try {
      const { data } = await billingApi.getPlans();
      dispatch({ type: "SET_PLANS", payload: data.data.plans });
    } catch (err) {
      dispatch({ type: "SET_ERROR", payload: err.message });
    }
  }, [state.plans.length]);

  // Auto-load plans on mount
  useEffect(() => {
    loadPlans();
  }, [loadPlans]);

  // ─── LOAD CREDITS & TRANSACTIONS (private) ────────────────────────────────
  const loadCredits = useCallback(async (params = {}) => {
    dispatch({ type: "LOADING_CREDITS" });
    try {
      const { data } = await billingApi.getCredits(params);
      dispatch({ type: "SET_CREDITS_DATA", payload: data.data });
      // Sync credits to AuthContext too
      updateUser({ credits: data.data.credits, plan: data.data.plan });
    } catch (err) {
      dispatch({ type: "SET_ERROR", payload: err.message });
    }
  }, [updateUser]); // updateUser is stable (wrapped in useCallback with [] deps)

  // Load credits only once when user first authenticates
  const hasFetchedCredits = useRef(false);
  useEffect(() => {
    if (isAuthenticated && !hasFetchedCredits.current) {
      hasFetchedCredits.current = true;
      loadCredits();
    }
    if (!isAuthenticated) {
      hasFetchedCredits.current = false; // reset on logout
    }
  }, [isAuthenticated]); // eslint-disable-line react-hooks/exhaustive-deps

  // ─── INITIATE PAYSTACK CHECKOUT ───────────────────────────────────────────
  /**
   * Opens Paystack checkout popup for the given plan.
   *
   * Usage:
   *   const { initiateCheckout } = useBilling();
   *   await initiateCheckout({ planId: "pro", billingCycle: "monthly" });
   *   // checkoutUrl is set → redirect or open in new tab
   */
  const initiateCheckout = useCallback(async ({ planId, billingCycle = "monthly" }) => {
    dispatch({ type: "PAYMENT_START" });
    try {
      const { data } = await billingApi.initializePayment({ planId, billingCycle });
      dispatch({ type: "PAYMENT_INITIALIZED", payload: data.data.authorizationUrl });

      // Store reference for verification
      sessionStorage.setItem("pendingPaymentRef", data.data.reference);
      sessionStorage.setItem("pendingPlanId", planId);

      // Redirect to Paystack checkout
      window.location.href = data.data.authorizationUrl;
    } catch (err) {
      dispatch({ type: "SET_ERROR", payload: err.message });
      return { success: false, error: err.message };
    }
  }, []);

  // ─── VERIFY PAYMENT (called from /billing/verify page) ───────────────────
  const verifyPayment = useCallback(async (reference) => {
    dispatch({ type: "PAYMENT_START" });
    try {
      const { data } = await billingApi.verifyPayment(reference);
      dispatch({ type: "PAYMENT_VERIFIED", payload: data.data });
      updateUser({ credits: data.data.creditsTotal, plan: data.data.plan });
      sessionStorage.removeItem("pendingPaymentRef");
      sessionStorage.removeItem("pendingPlanId");
      return { success: true, data: data.data };
    } catch (err) {
      dispatch({ type: "SET_ERROR", payload: err.message });
      return { success: false, error: err.message };
    }
  }, [updateUser]);

  // ─── CANCEL SUBSCRIPTION ──────────────────────────────────────────────────
  const cancelSubscription = useCallback(async () => {
    dispatch({ type: "PAYMENT_START" });
    try {
      await billingApi.cancelSubscription();
      updateUser({ plan: "free", planExpiresAt: null });
      await loadCredits();
      return { success: true };
    } catch (err) {
      dispatch({ type: "SET_ERROR", payload: err.message });
      return { success: false, error: err.message };
    }
  }, [loadCredits, updateUser]);

  const clearCheckoutUrl = useCallback(
    () => dispatch({ type: "CLEAR_CHECKOUT_URL" }),
    []
  );
  const clearError = useCallback(() => dispatch({ type: "CLEAR_ERROR" }), []);

  // ─── COMPUTED ──────────────────────────────────────────────────────────────
  const currentPlan = state.plans.find((p) => p.id === state.plan);
  const isPro = ["pro", "enterprise"].includes(state.plan);
  const isPaid = state.plan !== "free";
  const isLowCredits = state.credits !== null && state.credits <= 5;

  const value = {
    ...state,
    currentPlan,
    isPro,
    isPaid,
    isLowCredits,
    loadPlans,
    loadCredits,
    initiateCheckout,
    verifyPayment,
    cancelSubscription,
    clearCheckoutUrl,
    clearError,
  };

  return <BillingContext.Provider value={value}>{children}</BillingContext.Provider>;
}

export const useBilling = () => {
  const ctx = useContext(BillingContext);
  if (!ctx) throw new Error("useBilling must be used inside <BillingProvider>");
  return ctx;
};