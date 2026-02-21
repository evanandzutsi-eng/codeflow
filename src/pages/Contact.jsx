import { useState } from 'react';
import { motion } from 'framer-motion';
import { Send, Mail, MapPin, Phone, Loader2, CheckCircle, AlertCircle, Clock } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { validateEmail, validateName, validateMessage } from '../utils/validation';
import { api } from '../utils/api';
import { useSecureForm } from '../hooks/useSecureForm';
import AnimatedSection from '../components/AnimatedSection';

export default function Contact() {
  const { isDark } = useTheme();
  const [formData, setFormData] = useState({ name: '', email: '', message: '' });

  const form = useSecureForm(
    ({ name, email, message }) => api.submitContact(name, email, message),
    {
      validate: ({ name, email, message }) => {
        const n = validateName(name);
        if (!n.valid) return n.error;
        const e = validateEmail(email);
        if (!e.valid) return e.error;
        const m = validateMessage(message);
        if (!m.valid) return m.error;
        return null;
      },
      onSuccess: () => setFormData({ name: '', email: '', message: '' }),
      cooldownMs: 3000,
    }
  );

  const handleChange = (field) => (e) => {
    const raw = e.target.value;
    const limits = { name: 100, email: 254, message: 2000 };
    const cleaned = field === 'email' ? raw.replace(/[<>"'`;(){}[\]\\]/g, '') : raw;
    setFormData(prev => ({ ...prev, [field]: cleaned.slice(0, limits[field]) }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    form.submit(formData);
  };

  const inputClass = `w-full px-4 py-3 rounded-lg border transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500/50 ${
    isDark ? 'bg-white/10 border-white/20 text-white placeholder-gray-500' : 'bg-gray-50 border-gray-200 text-gray-900 placeholder-gray-400'
  }`;

  return (
    <div className="min-h-screen pt-28 pb-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        <AnimatedSection className="text-center mb-16">
          <div className="inline-block px-4 py-2 bg-blue-500/10 border border-blue-500/20 rounded-full mb-4">
            <span className="text-sm text-blue-400">Contact Us</span>
          </div>
          <h1 className={`text-3xl md:text-5xl font-bold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>
            Get in Touch
          </h1>
          <p className={`text-xl max-w-2xl mx-auto ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
            Have a question or want to learn more? We&apos;d love to hear from you.
          </p>
        </AnimatedSection>

        <div className="grid lg:grid-cols-3 gap-10">
          {/* Contact Info */}
          <AnimatedSection animation="fade-right" className="space-y-6">
            {[
              { icon: Mail, title: 'Email', detail: 'hello@codeflow.dev', sub: 'We respond within 24 hours' },
              { icon: MapPin, title: 'Office', detail: 'San Francisco, CA', sub: 'Come visit us!' },
              { icon: Phone, title: 'Phone', detail: '+1 (555) 123-4567', sub: 'Mon-Fri, 9am-6pm PST' },
            ].map((item, i) => (
              <motion.div
                key={i}
                whileHover={{ x: 4 }}
                className={`flex items-start space-x-4 p-5 rounded-xl border ${isDark ? 'bg-white/5 border-white/10' : 'bg-white border-gray-200'}`}
              >
                <div className="w-12 h-12 bg-blue-500/10 rounded-xl flex items-center justify-center flex-shrink-0">
                  <item.icon className="w-6 h-6 text-blue-400" />
                </div>
                <div>
                  <h3 className={`font-semibold mb-1 ${isDark ? 'text-white' : 'text-gray-900'}`}>{item.title}</h3>
                  <p className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>{item.detail}</p>
                  <p className={`text-xs mt-1 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>{item.sub}</p>
                </div>
              </motion.div>
            ))}
          </AnimatedSection>

          {/* Contact Form */}
          <AnimatedSection animation="fade-left" delay={0.2} className="lg:col-span-2">
            <div className={`rounded-2xl p-8 border ${isDark ? 'bg-white/5 border-white/10' : 'bg-white border-gray-200 shadow-lg'}`}>
              <form onSubmit={handleSubmit} noValidate className="space-y-5">
                <div className="grid sm:grid-cols-2 gap-5">
                  <div>
                    <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>Name</label>
                    <input type="text" value={formData.name} onChange={handleChange('name')} placeholder="Your name" maxLength={100} className={inputClass} />
                  </div>
                  <div>
                    <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>Email</label>
                    <input type="email" value={formData.email} onChange={handleChange('email')} placeholder="you@example.com" maxLength={254} className={inputClass} />
                  </div>
                </div>

                <div>
                  <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>Message</label>
                  <textarea
                    value={formData.message}
                    onChange={handleChange('message')}
                    placeholder="Tell us how we can help..."
                    rows={6}
                    maxLength={2000}
                    className={`${inputClass} resize-none`}
                  />
                  <div className={`text-right text-xs mt-1 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                    {formData.message.length}/2000
                  </div>
                </div>

                {form.message && (
                  <div className={`flex items-center gap-2 text-sm ${
                    form.isSuccess ? 'text-green-400' : form.isRateLimited ? 'text-yellow-400' : 'text-red-400'
                  }`} role="alert">
                    {form.isSuccess && <CheckCircle className="w-4 h-4" />}
                    {form.isError && <AlertCircle className="w-4 h-4" />}
                    {form.isRateLimited && <Clock className="w-4 h-4" />}
                    <span>{form.message}</span>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={form.isLoading || form.isRateLimited}
                  className="w-full sm:w-auto px-8 py-3 bg-blue-600 hover:bg-blue-500 disabled:bg-blue-600/50 text-white rounded-lg font-semibold transition-all flex items-center justify-center gap-2"
                >
                  {form.isLoading ? (
                    <><Loader2 className="w-5 h-5 animate-spin" /><span>Sending...</span></>
                  ) : (
                    <><Send className="w-5 h-5" /><span>Send Message</span></>
                  )}
                </button>
              </form>
            </div>
          </AnimatedSection>
        </div>
      </div>
    </div>
  );
}
