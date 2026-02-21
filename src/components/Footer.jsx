import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Github, Twitter, Linkedin, Mail, Loader2, CheckCircle, AlertCircle, Clock } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { validateEmail } from '../utils/validation';
import { api } from '../utils/api';
import { useSecureForm } from '../hooks/useSecureForm';

export default function Footer() {
  const { isDark } = useTheme();
  const [email, setEmail] = useState('');

  const form = useSecureForm(
    (emailValue) => api.subscribeNewsletter(emailValue),
    {
      validate: (emailValue) => {
        const result = validateEmail(emailValue);
        return result.valid ? null : result.error;
      },
      onSuccess: () => setEmail(''),
      cooldownMs: 3000,
    }
  );

  const handleSubscribe = (e) => {
    e.preventDefault();
    form.submit(email.trim());
  };

  const footerLinks = {
    product: [
      { name: 'Features', href: '/#features' },
      { name: 'Pricing', href: '/#pricing' },
      { name: 'Playground', href: '/playground' },
      { name: 'Dashboard', href: '/dashboard' },
    ],
    company: [
      { name: 'About Us', href: '#' },
      { name: 'Blog', href: '/blog' },
      { name: 'Careers', href: '#' },
      { name: 'Contact', href: '/contact' },
    ],
    resources: [
      { name: 'Documentation', href: '/blog' },
      { name: 'Guides', href: '/blog' },
      { name: 'Community', href: '#' },
      { name: 'Support', href: '/contact' },
    ],
    legal: [
      { name: 'Privacy Policy', href: '#' },
      { name: 'Terms of Service', href: '#' },
      { name: 'Cookie Policy', href: '#' },
      { name: 'Security', href: '#' },
    ],
  };

  const renderLink = (link) =>
    link.href.startsWith('/') && !link.href.startsWith('/#') ? (
      <Link to={link.href} className={`transition-colors text-sm ${isDark ? 'text-gray-400 hover:text-white' : 'text-gray-500 hover:text-gray-900'}`}>
        {link.name}
      </Link>
    ) : (
      <a href={link.href} className={`transition-colors text-sm ${isDark ? 'text-gray-400 hover:text-white' : 'text-gray-500 hover:text-gray-900'}`}>
        {link.name}
      </a>
    );

  return (
    <footer className={`border-t pt-16 pb-8 px-4 sm:px-6 lg:px-8 ${isDark ? 'bg-slate-950/50 border-white/10' : 'bg-gray-50 border-gray-200'}`}>
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-8 mb-12">
          {/* Logo */}
          <div className="col-span-2 md:col-span-1">
            <Link to="/" className="flex items-center space-x-2 mb-4">
              <img src="/logo.png" alt="CodeFlow" className="w-8 h-8" />
              <span className="text-xl font-bold">
                <span className={isDark ? 'text-white' : 'text-gray-900'}>Code</span>
                <span className="text-blue-500">Flow</span>
              </span>
            </Link>
            <p className={`text-sm leading-relaxed mb-6 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
              Empowering developers with AI-powered code generation and intelligent suggestions.
            </p>
            <div className="flex space-x-3">
              {[Twitter, Github, Linkedin, Mail].map((Icon, i) => (
                <a key={i} href="#" className={`w-9 h-9 rounded-lg flex items-center justify-center transition-all hover:scale-110 ${isDark ? 'bg-white/5 hover:bg-white/10 text-gray-400' : 'bg-gray-100 hover:bg-gray-200 text-gray-500'}`} rel="noopener noreferrer" target="_blank">
                  <Icon className="w-4 h-4" />
                </a>
              ))}
            </div>
          </div>

          {Object.entries(footerLinks).map(([category, links]) => (
            <div key={category}>
              <h3 className={`font-semibold mb-4 capitalize ${isDark ? 'text-white' : 'text-gray-900'}`}>{category}</h3>
              <ul className="space-y-3">
                {links.map((link, i) => (
                  <li key={i}>{renderLink(link)}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Newsletter */}
        <div className={`rounded-2xl p-8 mb-12 border ${isDark ? 'bg-white/5 border-white/10' : 'bg-white border-gray-200'}`}>
          <div className="max-w-2xl mx-auto text-center">
            <h3 className={`text-2xl font-bold mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>Stay Updated</h3>
            <p className={`mb-6 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Get the latest updates delivered to your inbox.</p>
            <form onSubmit={handleSubscribe} noValidate className="max-w-md mx-auto">
              <div className="flex flex-col sm:flex-row gap-3">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value.replace(/[<>"'`;(){}[\]\\]/g, '').slice(0, 254))}
                  placeholder="Enter your email"
                  maxLength={254}
                  disabled={form.isLoading || form.isRateLimited}
                  className={`flex-1 px-4 py-3 rounded-lg border focus:outline-none focus:ring-2 focus:ring-blue-500/50 ${
                    isDark ? 'bg-white/10 border-white/20 text-white placeholder-gray-500' : 'bg-gray-50 border-gray-200 text-gray-900 placeholder-gray-400'
                  }`}
                />
                <button type="submit" disabled={form.isLoading || form.isRateLimited || !email.trim()} className="px-6 py-3 bg-blue-600 hover:bg-blue-500 disabled:bg-blue-600/50 text-white rounded-lg font-semibold transition-all flex items-center justify-center gap-2 min-w-[120px]">
                  {form.isLoading ? <><Loader2 className="w-4 h-4 animate-spin" />Sending...</> : 'Subscribe'}
                </button>
              </div>
              {form.message && (
                <div className={`mt-3 flex items-center justify-center gap-2 text-sm ${form.isSuccess ? 'text-green-400' : form.isRateLimited ? 'text-yellow-400' : 'text-red-400'}`} role="alert">
                  {form.isSuccess && <CheckCircle className="w-4 h-4" />}
                  {form.isError && <AlertCircle className="w-4 h-4" />}
                  {form.isRateLimited && <Clock className="w-4 h-4" />}
                  <span>{form.message}</span>
                </div>
              )}
            </form>
          </div>
        </div>

        {/* Bottom */}
        <div className={`pt-8 border-t ${isDark ? 'border-white/10' : 'border-gray-200'}`}>
          <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
            <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
              &copy; {new Date().getFullYear()} CodeFlow. All rights reserved.
            </p>
            <span className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Made with ❤️ for developers</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
