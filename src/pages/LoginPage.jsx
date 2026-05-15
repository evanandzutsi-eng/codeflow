// src/pages/LoginPage.jsx
import { useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useSecureForm } from "../hooks/useSecureForm";

export default function LoginPage() {
  const { login, isAuthenticated, isSubmitting, clearError } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from || "/dashboard";

  // Redirect if already logged in
  useEffect(() => {
    if (isAuthenticated) navigate(from, { replace: true });
  }, [isAuthenticated, navigate, from]);

  const { register, handleSubmit, isSubmitting: formBusy, submitError, errors, touched } =
    useSecureForm({
      initialValues: { email: "", password: "" },
      rules: {
        email:    { required: true, email: true },
        password: { required: "Password is required", minLength: 1 },
      },
      onSubmit: async ({ email, password }) => {
        clearError();
        const result = await login({ email, password });
        if (!result.success) throw new Error(result.error);
      },
    });

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-950 px-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <span className="text-3xl font-bold text-white">⚡ CodeFlow</span>
          <p className="text-gray-400 mt-2">Sign in to your account</p>
        </div>

        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-8 shadow-2xl">
          <form onSubmit={handleSubmit} noValidate className="space-y-5">
            {/* Email */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-1.5">
                Email address
              </label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                placeholder="you@example.com"
                {...register("email")}
                className={`w-full px-4 py-3 bg-gray-800 border rounded-xl text-white placeholder-gray-500
                  focus:outline-none focus:ring-2 focus:ring-violet-500 transition-colors
                  ${touched.email && errors.email ? "border-red-500" : "border-gray-700"}`}
              />
              {touched.email && errors.email && (
                <p id="email-error" className="mt-1.5 text-sm text-red-400">{errors.email}</p>
              )}
            </div>

            {/* Password */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label htmlFor="password" className="block text-sm font-medium text-gray-300">
                  Password
                </label>
                <Link to="/forgot-password" className="text-sm text-violet-400 hover:text-violet-300 transition-colors">
                  Forgot password?
                </Link>
              </div>
              <input
                id="password"
                type="password"
                autoComplete="current-password"
                placeholder="••••••••"
                {...register("password")}
                className={`w-full px-4 py-3 bg-gray-800 border rounded-xl text-white placeholder-gray-500
                  focus:outline-none focus:ring-2 focus:ring-violet-500 transition-colors
                  ${touched.password && errors.password ? "border-red-500" : "border-gray-700"}`}
              />
              {touched.password && errors.password && (
                <p id="password-error" className="mt-1.5 text-sm text-red-400">{errors.password}</p>
              )}
            </div>

            {/* Submit error */}
            {submitError && (
              <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-xl">
                <p className="text-sm text-red-400 text-center">{submitError}</p>
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={formBusy || isSubmitting}
              className="w-full py-3 px-4 bg-violet-600 hover:bg-violet-500 disabled:opacity-60
                disabled:cursor-not-allowed text-white font-semibold rounded-xl
                transition-colors focus:outline-none focus:ring-2 focus:ring-violet-500 focus:ring-offset-2
                focus:ring-offset-gray-900"
            >
              {formBusy || isSubmitting ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/>
                  </svg>
                  Signing in...
                </span>
              ) : "Sign in"}
            </button>
          </form>

          <p className="text-center mt-6 text-sm text-gray-400">
            Don't have an account?{" "}
            <Link to="/register" className="text-violet-400 hover:text-violet-300 font-medium transition-colors">
              Create one free
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}