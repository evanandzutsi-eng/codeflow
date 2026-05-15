// src/context/AuthContext.jsx
import { createContext, useContext, useReducer, useEffect, useCallback } from "react";
import { authApi } from "../utils/api";

// ─── STATE ────────────────────────────────────────────────────────────────────
const initialState = {
  user: null,
  isAuthenticated: false,
  isLoading: true,      // true while restoring session
  isSubmitting: false,  // true during login/register
  error: null,
};

// ─── REDUCER ──────────────────────────────────────────────────────────────────
function authReducer(state, action) {
  switch (action.type) {
    case "AUTH_START":
      return { ...state, isSubmitting: true, error: null };
    case "AUTH_SUCCESS":
      return {
        ...state,
        user: action.payload,
        isAuthenticated: true,
        isLoading: false,
        isSubmitting: false,
        error: null,
      };
    case "AUTH_ERROR":
      return { ...state, isSubmitting: false, isLoading: false, error: action.payload };
    case "LOGOUT":
      return { ...initialState, isLoading: false };
    case "RESTORE_DONE":
      return { ...state, isLoading: false };
    case "UPDATE_USER":
      return { ...state, user: { ...state.user, ...action.payload } };
    case "CLEAR_ERROR":
      return { ...state, error: null };
    default:
      return state;
  }
}

// ─── CONTEXT ──────────────────────────────────────────────────────────────────
const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [state, dispatch] = useReducer(authReducer, initialState);

  // Persist tokens to localStorage
  const saveTokens = (accessToken, refreshToken) => {
    localStorage.setItem("accessToken", accessToken);
    localStorage.setItem("refreshToken", refreshToken);
  };

  const clearTokens = () => {
    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");
  };

  // ─── RESTORE SESSION ON MOUNT ────────────────────────────────────────────
  useEffect(() => {
    const restore = async () => {
      const token = localStorage.getItem("accessToken");
      if (!token) {
        dispatch({ type: "RESTORE_DONE" });
        return;
      }
      try {
        const { data } = await authApi.me();
        dispatch({ type: "AUTH_SUCCESS", payload: data.data.user });
      } catch {
        clearTokens();
        dispatch({ type: "RESTORE_DONE" });
      }
    };

    restore();

    // Listen for forced logout (token refresh failure)
    const handleForcedLogout = () => {
      dispatch({ type: "LOGOUT" });
    };
    window.addEventListener("auth:logout", handleForcedLogout);
    return () => window.removeEventListener("auth:logout", handleForcedLogout);
  }, []);

  // ─── REGISTER ────────────────────────────────────────────────────────────
  const register = useCallback(async ({ name, email, password }) => {
    dispatch({ type: "AUTH_START" });
    try {
      const { data } = await authApi.register({ name, email, password });
      saveTokens(data.data.accessToken, data.data.refreshToken);
      dispatch({ type: "AUTH_SUCCESS", payload: data.data.user });
      return { success: true };
    } catch (err) {
      dispatch({ type: "AUTH_ERROR", payload: err.message });
      return { success: false, error: err.message };
    }
  }, []);

  // ─── LOGIN ────────────────────────────────────────────────────────────────
  const login = useCallback(async ({ email, password }) => {
    dispatch({ type: "AUTH_START" });
    try {
      const { data } = await authApi.login({ email, password });
      saveTokens(data.data.accessToken, data.data.refreshToken);
      dispatch({ type: "AUTH_SUCCESS", payload: data.data.user });
      return { success: true };
    } catch (err) {
      dispatch({ type: "AUTH_ERROR", payload: err.message });
      return { success: false, error: err.message };
    }
  }, []);

  // ─── LOGOUT ───────────────────────────────────────────────────────────────
  const logout = useCallback(async () => {
    try {
      const refreshToken = localStorage.getItem("refreshToken");
      if (refreshToken) await authApi.logout(refreshToken);
    } catch {
      // Ignore logout API errors
    } finally {
      clearTokens();
      dispatch({ type: "LOGOUT" });
    }
  }, []);

  // ─── UPDATE USER LOCALLY (after billing etc.) ─────────────────────────────
  const updateUser = useCallback((updates) => {
    dispatch({ type: "UPDATE_USER", payload: updates });
  }, []);

  const clearError = useCallback(() => dispatch({ type: "CLEAR_ERROR" }), []);

  const value = {
    ...state,
    register,
    login,
    logout,
    updateUser,
    clearError,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>");
  return ctx;
};
