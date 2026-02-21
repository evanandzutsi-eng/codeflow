import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Code, Zap, Clock, TrendingUp, Play, Settings, CreditCard, FileText, BarChart3, Sparkles } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useEffect } from 'react';

export default function Dashboard() {
  const { user, isAuthenticated } = useAuth();
  const { isDark } = useTheme();
  const navigate = useNavigate();

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!isAuthenticated) navigate('/login');
  }, [isAuthenticated, navigate]);

  if (!user) return null;

  const stats = [
    { label: 'Code Generated', value: '12,483', change: '+23%', icon: Code, color: 'text-blue-400 bg-blue-500/10' },
    { label: 'Time Saved', value: '186h', change: '+15%', icon: Clock, color: 'text-cyan-400 bg-cyan-500/10' },
    { label: 'Completions', value: '8,291', change: '+31%', icon: Zap, color: 'text-purple-400 bg-purple-500/10' },
    { label: 'Efficiency', value: '94%', change: '+5%', icon: TrendingUp, color: 'text-green-400 bg-green-500/10' },
  ];

  const recentProjects = [
    { name: 'E-commerce API', lang: 'Node.js', time: '2 hours ago', lines: 847 },
    { name: 'React Dashboard', lang: 'React', time: '5 hours ago', lines: 1243 },
    { name: 'ML Pipeline', lang: 'Python', time: 'Yesterday', lines: 562 },
    { name: 'Auth Microservice', lang: 'Go', time: '2 days ago', lines: 394 },
  ];

  const quickActions = [
    { label: 'New Generation', icon: Sparkles, href: '/playground', color: 'bg-blue-600 hover:bg-blue-500' },
    { label: 'View Docs', icon: FileText, href: '/blog', color: isDark ? 'bg-white/10 hover:bg-white/20' : 'bg-gray-100 hover:bg-gray-200' },
    { label: 'Analytics', icon: BarChart3, href: '#', color: isDark ? 'bg-white/10 hover:bg-white/20' : 'bg-gray-100 hover:bg-gray-200' },
    { label: 'Settings', icon: Settings, href: '#', color: isDark ? 'bg-white/10 hover:bg-white/20' : 'bg-gray-100 hover:bg-gray-200' },
  ];

  return (
    <div className="min-h-screen pt-24 pb-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-10">
          <h1 className={`text-3xl md:text-4xl font-bold mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
            Welcome back, {user.name} 👋
          </h1>
          <p className={isDark ? 'text-gray-400' : 'text-gray-500'}>
            Here&apos;s what&apos;s happening with your projects.
          </p>
          <div className={`mt-2 inline-block px-3 py-1 rounded-full text-xs font-medium ${
            user.plan === 'Pro' ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20' : 'bg-gray-500/10 text-gray-400 border border-gray-500/20'
          }`}>
            {user.plan} Plan
          </div>
        </motion.div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-10">
          {stats.map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className={`rounded-2xl p-5 md:p-6 border ${isDark ? 'bg-white/5 border-white/10' : 'bg-white border-gray-200 shadow-sm'}`}
            >
              <div className="flex items-center justify-between mb-3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${stat.color}`}>
                  <stat.icon className="w-5 h-5" />
                </div>
                <span className="text-green-400 text-xs font-medium">{stat.change}</span>
              </div>
              <div className={`text-2xl md:text-3xl font-bold mb-1 ${isDark ? 'text-white' : 'text-gray-900'}`}>{stat.value}</div>
              <div className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>{stat.label}</div>
            </motion.div>
          ))}
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Recent Projects */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className={`lg:col-span-2 rounded-2xl p-6 border ${isDark ? 'bg-white/5 border-white/10' : 'bg-white border-gray-200 shadow-sm'}`}
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className={`text-xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>Recent Projects</h2>
              <Link to="/playground" className="text-blue-500 hover:text-blue-400 text-sm font-medium">View all →</Link>
            </div>
            <div className="space-y-4">
              {recentProjects.map((proj, i) => (
                <div
                  key={i}
                  className={`flex items-center justify-between p-4 rounded-xl transition-colors ${
                    isDark ? 'hover:bg-white/5' : 'hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-center space-x-4">
                    <div className="w-10 h-10 bg-blue-500/10 rounded-lg flex items-center justify-center">
                      <Code className="w-5 h-5 text-blue-400" />
                    </div>
                    <div>
                      <div className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>{proj.name}</div>
                      <div className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>{proj.lang} · {proj.time}</div>
                    </div>
                  </div>
                  <div className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>{proj.lines} lines</div>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Quick Actions */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className={`rounded-2xl p-6 border ${isDark ? 'bg-white/5 border-white/10' : 'bg-white border-gray-200 shadow-sm'}`}
          >
            <h2 className={`text-xl font-bold mb-6 ${isDark ? 'text-white' : 'text-gray-900'}`}>Quick Actions</h2>
            <div className="space-y-3">
              {quickActions.map((action, i) => (
                <Link
                  key={i}
                  to={action.href}
                  className={`flex items-center space-x-3 p-3 rounded-xl transition-all text-white font-medium ${action.color} ${
                    !action.color.includes('blue') && !isDark ? 'text-gray-700' : ''
                  }`}
                >
                  <action.icon className="w-5 h-5" />
                  <span>{action.label}</span>
                </Link>
              ))}
            </div>

            {/* Usage */}
            <div className={`mt-6 pt-6 border-t ${isDark ? 'border-white/10' : 'border-gray-200'}`}>
              <div className="flex justify-between mb-2">
                <span className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>AI Completions</span>
                <span className={`text-sm font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>8,291 / ∞</span>
              </div>
              <div className={`w-full h-2 rounded-full ${isDark ? 'bg-white/10' : 'bg-gray-100'}`}>
                <div className="w-3/4 h-full bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full" />
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
