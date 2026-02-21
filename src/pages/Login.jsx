import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Eye, EyeOff, Loader2, ArrowLeft } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { validateEmail } from '../utils/validation';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const { login, isLoading } = useAuth();
  const { isDark } = useTheme();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Client-side validation
    const emailCheck = validateEmail(email);
    if (!emailCheck.valid) return setError(emailCheck.error);
    if (!password || password.length < 6) return setError('Password must be at least 6 characters.');

    const result = await login(email, password);
    if (result.success) {
      navigate('/dashboard');
    } else {
      setError(result.error);
    }
  };

  return (
    <div className="min-h-screen pt-24 pb-12 px-4 flex items-center justify-center relative overflow-hidden">
      {/* Background Effects */}
      <div className="absolute top-1/3 left-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/3 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md relative z-10"
      >
        {/* Back Link */}
        <Link to="/" className={`inline-flex items-center space-x-1 mb-8 text-sm transition-colors ${isDark ? 'text-gray-400 hover:text-white' : 'text-gray-500 hover:text-gray-900'}`}>
          <ArrowLeft className="w-4 h-4" />
          <span>Back to home</span>
        </Link>

        {/* Card */}
        <div className={`rounded-2xl p-8 border backdrop-blur-sm ${isDark ? 'bg-white/5 border-white/10' : 'bg-white border-gray-200 shadow-xl'}`}>
          <div className="text-center mb-8">
            <h1 className={`text-3xl font-bold mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>Welcome back</h1>
            <p className={isDark ? 'text-gray-400' : 'text-gray-500'}>Log in to your CodeFlow account</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Email */}
            <div>
              <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value.replace(/[<>"'`;(){}[\]\\]/g, '').slice(0, 254))}
                placeholder="you@example.com"
                autoComplete="email"
                maxLength={254}
                className={`w-full px-4 py-3 rounded-lg border transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500/50 ${
                  isDark
                    ? 'bg-white/10 border-white/20 text-white placeholder-gray-500'
                    : 'bg-gray-50 border-gray-200 text-gray-900 placeholder-gray-400'
                }`}
              />
            </div>

            {/* Password */}
            <div>
              <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>Password</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value.slice(0, 128))}
                  placeholder="••••••••"
                  autoComplete="current-password"
                  maxLength={128}
                  className={`w-full px-4 py-3 pr-12 rounded-lg border transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500/50 ${
                    isDark
                      ? 'bg-white/10 border-white/20 text-white placeholder-gray-500'
                      : 'bg-gray-50 border-gray-200 text-gray-900 placeholder-gray-400'
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className={`absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded ${isDark ? 'text-gray-400 hover:text-white' : 'text-gray-400 hover:text-gray-600'}`}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {/* Error */}
            {error && (
              <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-red-400 text-sm text-center">
                {error}
              </motion.p>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 bg-blue-600 hover:bg-blue-500 disabled:bg-blue-600/50 text-white rounded-lg font-semibold transition-all flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Logging in...</span>
                </>
              ) : (
                'Log In'
              )}
            </button>
          </form>

          <p className={`mt-6 text-center text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
            Don&apos;t have an account?{' '}
            <Link to="/signup" className="text-blue-500 hover:text-blue-400 font-medium">
              Sign up free
            </Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
}
