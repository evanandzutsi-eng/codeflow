// src/hooks/useSecureForm.js
// Secure form state management hook.
// Handles: field values, validation, dirty tracking, submission state.
// Mirrors server-side Zod rules so users see errors before hitting the API.

import { useState, useCallback, useRef } from "react";

/**
 * @param {Object} config
 * @param {Object} config.initialValues   - Initial field values
 * @param {Object} config.rules           - Validation rules per field
 * @param {Function} config.onSubmit      - Called with clean values on success
 *
 * Rules per field (all optional):
 *   required: true | "Custom message"
 *   minLength: 8 | { value: 8, message: "..." }
 *   maxLength: 100
 *   pattern:   { value: /regex/, message: "..." }
 *   validate:  (value, allValues) => true | "error message"
 *   email:     true
 *   match:     "fieldName"  (must equal another field)
 *
 * Usage:
 *   const { values, errors, touched, handleChange, handleSubmit, isSubmitting } =
 *     useSecureForm({
 *       initialValues: { email: "", password: "" },
 *       rules: {
 *         email:    { required: true, email: true },
 *         password: { required: true, minLength: 8 },
 *       },
 *       onSubmit: async (values) => { await login(values); },
 *     });
 */
export function useSecureForm({ initialValues = {}, rules = {}, onSubmit }) {
  const [values, setValues] = useState(initialValues);
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const submitCountRef = useRef(0);

  // ─── VALIDATE SINGLE FIELD ─────────────────────────────────────────────────
  const validateField = useCallback((name, value, allValues) => {
    const fieldRules = rules[name];
    if (!fieldRules) return null;

    const { required, minLength, maxLength, pattern, validate, email, match } = fieldRules;

    // Required
    if (required) {
      const msg = typeof required === "string" ? required : `${formatLabel(name)} is required`;
      if (!value || (typeof value === "string" && !value.trim())) return msg;
    } else if (!value) {
      return null; // Not required and empty → valid
    }

    // Email format
    if (email && value) {
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
        return "Please enter a valid email address";
      }
      if (value.length > 254) return "Email address is too long";
    }

    // Min length
    if (minLength !== undefined) {
      const min = typeof minLength === "object" ? minLength.value : minLength;
      const msg = typeof minLength === "object" ? minLength.message : `Must be at least ${min} characters`;
      if (value.length < min) return msg;
    }

    // Max length
    if (maxLength !== undefined) {
      const max = typeof maxLength === "object" ? maxLength.value : maxLength;
      const msg = typeof maxLength === "object" ? maxLength.message : `Must be ${max} characters or fewer`;
      if (value.length > max) return msg;
    }

    // Pattern
    if (pattern) {
      const regex = typeof pattern === "object" ? pattern.value : pattern;
      const msg = typeof pattern === "object" ? pattern.message : "Invalid format";
      if (!regex.test(value)) return msg;
    }

    // Must match another field
    if (match) {
      if (value !== allValues[match]) {
        return `Must match ${formatLabel(match)}`;
      }
    }

    // Custom validation
    if (validate) {
      const result = validate(value, allValues);
      if (result !== true && result) return result;
    }

    return null;
  }, [rules]);

  // ─── VALIDATE ALL FIELDS ───────────────────────────────────────────────────
  const validateAll = useCallback((currentValues) => {
    const newErrors = {};
    for (const name of Object.keys(rules)) {
      const err = validateField(name, currentValues[name], currentValues);
      if (err) newErrors[name] = err;
    }
    return newErrors;
  }, [validateField, rules]);

  // ─── HANDLE CHANGE ─────────────────────────────────────────────────────────
  const handleChange = useCallback((e) => {
    const { name, value, type, checked } = e.target;
    const newValue = type === "checkbox" ? checked : value;

    setValues((prev) => {
      const next = { ...prev, [name]: newValue };
      // Re-validate this field live once it's been touched
      setTouched((t) => {
        if (t[name]) {
          const err = validateField(name, newValue, next);
          setErrors((errs) => ({ ...errs, [name]: err || undefined }));
        }
        return t;
      });
      return next;
    });
    setSubmitError(null);
  }, [validateField]);

  // ─── HANDLE BLUR ──────────────────────────────────────────────────────────
  const handleBlur = useCallback((e) => {
    const { name } = e.target;
    setTouched((prev) => ({ ...prev, [name]: true }));
    setValues((currentValues) => {
      const err = validateField(name, currentValues[name], currentValues);
      setErrors((prev) => ({ ...prev, [name]: err || undefined }));
      return currentValues;
    });
  }, [validateField]);

  // ─── HANDLE SUBMIT ─────────────────────────────────────────────────────────
  const handleSubmit = useCallback((e) => {
    if (e?.preventDefault) e.preventDefault();
    const currentCount = ++submitCountRef.current;

    // Mark all fields as touched to show all errors
    const allTouched = Object.keys(rules).reduce((acc, k) => ({ ...acc, [k]: true }), {});
    setTouched(allTouched);

    const newErrors = validateAll(values);
    setErrors(newErrors);

    if (Object.keys(newErrors).length > 0) return;

    setIsSubmitting(true);
    setSubmitError(null);
    setSubmitSuccess(false);

    // Trim all string values before submitting
    const cleanValues = Object.entries(values).reduce((acc, [k, v]) => {
      acc[k] = typeof v === "string" ? v.trim() : v;
      return acc;
    }, {});

    Promise.resolve(onSubmit(cleanValues))
      .then(() => {
        if (currentCount === submitCountRef.current) {
          setSubmitSuccess(true);
        }
      })
      .catch((err) => {
        if (currentCount === submitCountRef.current) {
          setSubmitError(err?.message || "Something went wrong. Please try again.");
        }
      })
      .finally(() => {
        if (currentCount === submitCountRef.current) {
          setIsSubmitting(false);
        }
      });
  }, [values, validateAll, onSubmit, rules]);

  // ─── SET FIELD VALUE PROGRAMMATICALLY ────────────────────────────────────
  const setValue = useCallback((name, value) => {
    setValues((prev) => ({ ...prev, [name]: value }));
  }, []);

  // ─── RESET FORM ───────────────────────────────────────────────────────────
  const reset = useCallback(() => {
    setValues(initialValues);
    setErrors({});
    setTouched({});
    setIsSubmitting(false);
    setSubmitError(null);
    setSubmitSuccess(false);
  }, [initialValues]);

  // ─── FIELD PROPS HELPER ───────────────────────────────────────────────────
  // Spread onto an <input> element: <input {...register("email")} />
  const register = useCallback((name) => ({
    name,
    value: values[name] ?? "",
    onChange: handleChange,
    onBlur: handleBlur,
    "aria-invalid": !!(touched[name] && errors[name]),
    "aria-describedby": errors[name] ? `${name}-error` : undefined,
  }), [values, errors, touched, handleChange, handleBlur]);

  const isValid = Object.keys(validateAll(values)).length === 0;

  return {
    values,
    errors,
    touched,
    isSubmitting,
    isValid,
    submitError,
    submitSuccess,
    handleChange,
    handleBlur,
    handleSubmit,
    setValue,
    register,
    reset,
  };
}

// ─── HELPERS ──────────────────────────────────────────────────────────────────
function formatLabel(name) {
  return name.replace(/([A-Z])/g, " $1").replace(/^./, (s) => s.toUpperCase());
}
