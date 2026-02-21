import { useState, useCallback } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Menu, X, Sun, Moon, LogOut, LayoutDashboard } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';

export default function Navbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { theme, toggleTheme, isDark } = useTheme();
  const { user, isAuthenticated, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const toggleMenu = useCallback(() => setMobileMenuOpen(prev => !prev), []);
  const closeMenu = useCallback(() => setMobileMenuOpen(false), []);

  const handleLogout = () => {
    logout();
    navigate('/');
    closeMenu();
  };

  const navLinks = [
    { label: 'Features', href: '/#features' },
    { label: 'Pricing', href: '/#pricing' },
    { label: 'Playground', href: '/playground' },
    { label: 'Blog', href: '/blog' },
    { label: 'Contact', href: '/contact' },
  ];

  const isActive = (href) => {
    if (href.startsWith('/#')) return location.pathname === '/' && location.hash === href.slice(1);
    return location.pathname === href;
  };

  return (
    <motion.nav
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
      className={`fixed top-0 w-full z-50 transition-all duration-300 backdrop-blur-md border-b ${
        isDark
          ? 'bg-slate-950/80 border-blue-500/10'
          : 'bg-white/80 border-gray-200'
      }`}
      role="navigation"
      aria-label="Main navigation"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-14 sm:h-16 md:h-20">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-2 group cursor-pointer" onClick={closeMenu}>
            <div className="relative">
              <img
                src="/logo.png"
                alt="CodeFlow logo"
                className="w-6 h-6 sm:w-8 sm:h-8 group-hover:scale-110 transition-transform"
                loading="eager"
                width="32"
                height="32"
              />
              <div className="absolute inset-0 blur-xl bg-blue-400/30 group-hover:bg-blue-300/40 transition-all" />
            </div>
            <span className="text-lg sm:text-xl md:text-2xl font-medium">
              <span className={isDark ? 'text-white' : 'text-gray-900'}>Code</span>
              <span className="text-blue-500">Flow</span>
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-6">
            {navLinks.map(({ label, href }) =>
              href.startsWith('/#') ? (
                <a
                  key={label}
                  href={href}
                  onClick={(e) => {
                    if (location.pathname !== '/') {
                      e.preventDefault();
                      navigate(href);
                    }
                  }}
                  className={`transition-colors text-sm font-medium ${
                    isDark
                      ? 'text-gray-300 hover:text-white'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  {label}
                </a>
              ) : (
                <Link
                  key={label}
                  to={href}
                  className={`transition-colors text-sm font-medium ${
                    isActive(href)
                      ? 'text-blue-500'
                      : isDark
                        ? 'text-gray-300 hover:text-white'
                        : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  {label}
                </Link>
              )
            )}

            {/* Theme Toggle */}
            <button
              onClick={toggleTheme}
              className={`p-2 rounded-lg transition-all hover:scale-110 ${
                isDark ? 'hover:bg-white/10 text-gray-300' : 'hover:bg-gray-100 text-gray-600'
              }`}
              aria-label={`Switch to ${isDark ? 'light' : 'dark'} mode`}
            >
              {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>

            {/* Auth Buttons */}
            {isAuthenticated ? (
              <div className="flex items-center space-x-3">
                <Link
                  to="/dashboard"
                  className="flex items-center space-x-1 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition-all hover:scale-105 text-sm font-semibold"
                >
                  <LayoutDashboard className="w-4 h-4" />
                  <span>Dashboard</span>
                </Link>
                <button
                  onClick={handleLogout}
                  className={`p-2 rounded-lg transition-all hover:scale-110 ${
                    isDark ? 'hover:bg-white/10 text-gray-400' : 'hover:bg-gray-100 text-gray-500'
                  }`}
                  aria-label="Log out"
                >
                  <LogOut className="w-5 h-5" />
                </button>
              </div>
            ) : (
              <div className="flex items-center space-x-3">
                <Link
                  to="/login"
                  className={`px-4 py-2 rounded-lg font-semibold text-sm transition-all ${
                    isDark
                      ? 'text-gray-300 hover:text-white hover:bg-white/10'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                  }`}
                >
                  Log In
                </Link>
                <Link
                  to="/signup"
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition-all hover:scale-105 text-sm font-semibold"
                >
                  Get Started
                </Link>
              </div>
            )}
          </div>

          {/* Mobile: Theme + Menu Button */}
          <div className="flex md:hidden items-center space-x-2">
            <button
              onClick={toggleTheme}
              className={`p-2 rounded-lg ${isDark ? 'text-gray-300' : 'text-gray-600'}`}
              aria-label={`Switch to ${isDark ? 'light' : 'dark'} mode`}
            >
              {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>
            <button
              onClick={toggleMenu}
              className={`p-2 rounded-lg transition-colors ${
                isDark ? 'text-white hover:bg-white/10' : 'text-gray-900 hover:bg-gray-100'
              }`}
              aria-label={mobileMenuOpen ? 'Close menu' : 'Open menu'}
              aria-expanded={mobileMenuOpen}
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3 }}
              className={`md:hidden overflow-hidden border-t ${
                isDark ? 'border-blue-500/10' : 'border-gray-200'
              }`}
            >
              <div className="py-4 space-y-2">
                {navLinks.map(({ label, href }) =>
                  href.startsWith('/#') ? (
                    <a
                      key={label}
                      href={href}
                      className={`block py-2 px-4 rounded-lg transition-colors ${
                        isDark ? 'text-gray-300 hover:text-white hover:bg-white/5' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                      }`}
                      onClick={closeMenu}
                    >
                      {label}
                    </a>
                  ) : (
                    <Link
                      key={label}
                      to={href}
                      className={`block py-2 px-4 rounded-lg transition-colors ${
                        isActive(href) ? 'text-blue-500' :
                        isDark ? 'text-gray-300 hover:text-white hover:bg-white/5' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                      }`}
                      onClick={closeMenu}
                    >
                      {label}
                    </Link>
                  )
                )}

                <div className={`pt-2 mt-2 border-t space-y-2 ${isDark ? 'border-white/10' : 'border-gray-200'}`}>
                  {isAuthenticated ? (
                    <>
                      <Link
                        to="/dashboard"
                        className="block w-full px-4 py-2 bg-blue-600 text-white rounded-lg text-center font-semibold"
                        onClick={closeMenu}
                      >
                        Dashboard
                      </Link>
                      <button
                        onClick={handleLogout}
                        className={`block w-full px-4 py-2 rounded-lg text-center ${
                          isDark ? 'text-gray-400 hover:bg-white/5' : 'text-gray-500 hover:bg-gray-50'
                        }`}
                      >
                        Log Out
                      </button>
                    </>
                  ) : (
                    <>
                      <Link to="/login" className={`block py-2 px-4 rounded-lg ${isDark ? 'text-gray-300' : 'text-gray-600'}`} onClick={closeMenu}>
                        Log In
                      </Link>
                      <Link to="/signup" className="block w-full px-4 py-2 bg-blue-600 text-white rounded-lg text-center font-semibold" onClick={closeMenu}>
                        Get Started
                      </Link>
                    </>
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.nav>
  );
}
