// src/pages/RegisterPage.jsx
import { useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useSecureForm } from "../hooks/useSecureForm";

function PasswordStrength({ password = "" }) {
  const checks = [
    { label: "8+ characters", pass: password.length >= 8 },
    { label: "Uppercase letter", pass: /[A-Z]/.test(password) },
    { label: "Lowercase letter", pass: /[a-z]/.test(password) },
    { label: "Number", pass: /\d/.test(password) },
  ];
  const score = checks.filter((c) => c.pass).length;
  const colors = ["bg-gray-700", "bg-red-500", "bg-orange-500", "bg-yellow-500", "bg-green-500"];

  if (!password) return null;

  return (
    <div className="mt-2 space-y-1.5">
      <div className="flex gap-1">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className={`h-1 flex-1 rounded-full transition-colors ${i < score ? colors[score] : "bg-gray-700"}`} />
        ))}
      </div>
      <div className="grid grid-cols-2 gap-x-4 gap-y-0.5">
        {checks.map((c) => (
          <span key={c.label} className={`text-xs flex items-center gap-1 ${c.pass ? "text-green-400" : "text-gray-500"}`}>
            {c.pass ? "✓" : "○"} {c.label}
          </span>
        ))}
      </div>
    </div>
  );
}

export default function RegisterPage() {
  const { register: registerUser, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (isAuthenticated) navigate("/dashboard", { replace: true });
  }, [isAuthenticated, navigate]);

  const { register, handleSubmit, values, isSubmitting, submitError, errors, touched } =
    useSecureForm({
      initialValues: { name: "", email: "", password: "", confirmPassword: "" },
      rules: {
        name: {
          required: true,
          minLength: { value: 2, message: "Name must be at least 2 characters" },
          maxLength: 60,
          pattern: { value: /^[a-zA-Z0-9\s'\-\.]+$/, message: "Name contains invalid characters" },
        },
        email: { required: true, email: true },
        password: {
          required: true,
          minLength: { value: 8, message: "Password must be at least 8 characters" },
          pattern: {
            value: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
            message: "Password needs uppercase, lowercase, and a number",
          },
        },
        confirmPassword: {
          required: "Please confirm your password",
          match: "password",
        },
      },
      onSubmit: async ({ name, email, password }) => {
        const result = await registerUser({ name, email, password });
        if (!result.success) throw new Error(result.error);
        navigate("/dashboard", { replace: true });
      },
    });

  const inputClass = (field) =>
    `w-full px-4 py-3 bg-gray-800 border rounded-xl text-white placeholder-gray-500
    focus:outline-none focus:ring-2 focus:ring-violet-500 transition-colors
    ${touched[field] && errors[field] ? "border-red-500" : "border-gray-700"}`;

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-950 px-4 py-12">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <span className="text-3xl font-bold text-white">⚡ CodeFlow</span>
          <p className="text-gray-400 mt-2">Create your free account</p>
          <p className="text-violet-400 text-sm mt-1 font-medium">10 free credits to get started</p>
        </div>

        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-8 shadow-2xl">
          <form onSubmit={handleSubmit} noValidate className="space-y-4">
            {/* Name */}
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-300 mb-1.5">Full name</label>
              <input id="name" type="text" autoComplete="name" placeholder="Your full name"
                {...register("name")} className={inputClass("name")} />
              {touched.name && errors.name && (
                <p className="mt-1.5 text-sm text-red-400">{errors.name}</p>
              )}
            </div>

            {/* Email */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-1.5">Email address</label>
              <input id="email" type="email" autoComplete="email" placeholder="you@example.com"
                {...register("email")} className={inputClass("email")} />
              {touched.email && errors.email && (
                <p className="mt-1.5 text-sm text-red-400">{errors.email}</p>
              )}
            </div>

            {/* Password */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-300 mb-1.5">Password</label>
              <input id="password" type="password" autoComplete="new-password" placeholder="Create a strong password"
                {...register("password")} className={inputClass("password")} />
              <PasswordStrength password={values.password} />
              {touched.password && errors.password && (
                <p className="mt-1.5 text-sm text-red-400">{errors.password}</p>
              )}
            </div>

            {/* Confirm Password */}
            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-300 mb-1.5">Confirm password</label>
              <input id="confirmPassword" type="password" autoComplete="new-password" placeholder="Repeat your password"
                {...register("confirmPassword")} className={inputClass("confirmPassword")} />
              {touched.confirmPassword && errors.confirmPassword && (
                <p className="mt-1.5 text-sm text-red-400">{errors.confirmPassword}</p>
              )}
            </div>

            {/* Submit error */}
            {submitError && (
              <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-xl">
                <p className="text-sm text-red-400 text-center">{submitError}</p>
              </div>
            )}

            {/* Submit */}
            <button type="submit" disabled={isSubmitting}
              className="w-full py-3 px-4 bg-violet-600 hover:bg-violet-500 disabled:opacity-60
              disabled:cursor-not-allowed text-white font-semibold rounded-xl transition-colors
              focus:outline-none focus:ring-2 focus:ring-violet-500 focus:ring-offset-2 focus:ring-offset-gray-900">
              {isSubmitting ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/>
                  </svg>
                  Creating account...
                </span>
              ) : "Create free account"}
            </button>

            <p className="text-xs text-gray-500 text-center">
              By signing up, you agree to our Terms of Service and Privacy Policy.
            </p>
          </form>

          <p className="text-center mt-5 text-sm text-gray-400">
            Already have an account?{" "}
            <Link to="/login" className="text-violet-400 hover:text-violet-300 font-medium transition-colors">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}