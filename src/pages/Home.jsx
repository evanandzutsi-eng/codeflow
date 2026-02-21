import { Link } from 'react-router-dom';
import { Zap, ChevronRight, Play, Brain, Code, Shield, Sparkles, GitBranch, Check, Star, Quote } from 'lucide-react';
import { motion } from 'framer-motion';
import AnimatedSection, { StaggerContainer, StaggerItem } from '../components/AnimatedSection';
import { useTheme } from '../context/ThemeContext';

/* ======================================================================== */
/* HERO                                                                      */
/* ======================================================================== */
function Hero() {
  const { isDark } = useTheme();
  return (
    <section className="pt-32 pb-20 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 via-transparent to-purple-500/10 pointer-events-none" />
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-7xl mx-auto text-center relative z-10">
        <AnimatedSection animation="fade-down" delay={0.1}>
          <div className="inline-flex items-center space-x-2 bg-blue-500/10 border border-blue-500/20 rounded-full px-4 py-2 mb-8 hover:bg-blue-500/20 transition-all">
            <Zap className="w-4 h-4 text-blue-400" />
            <span className="text-sm text-blue-400">Powered by Advanced AI Technology</span>
          </div>
        </AnimatedSection>

        <AnimatedSection animation="fade-up" delay={0.2}>
          <h1 className={`text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold mb-6 leading-tight ${isDark ? 'text-white' : 'text-gray-900'}`}>
            Build Smarter with
            <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-cyan-400 to-purple-400 animate-gradient">
              AI-Powered Code
            </span>
          </h1>
        </AnimatedSection>

        <AnimatedSection animation="fade-up" delay={0.35}>
          <p className={`text-lg sm:text-xl mb-12 max-w-3xl mx-auto leading-relaxed ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
            Transform your development workflow with intelligent code generation,
            real-time suggestions, and automated optimization. Build faster, smarter, and better.
          </p>
        </AnimatedSection>

        <AnimatedSection animation="scale" delay={0.5}>
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Link to="/signup">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.98 }}
                className="group px-8 py-4 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-semibold transition-colors flex items-center space-x-2 shadow-lg shadow-blue-500/50"
              >
                <span>Start Free Trial</span>
                <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </motion.button>
            </Link>
            <Link to="/playground">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.98 }}
                className={`group px-8 py-4 rounded-lg font-semibold transition-colors border flex items-center space-x-2 ${
                  isDark ? 'bg-white/5 hover:bg-white/10 text-white border-white/10' : 'bg-gray-50 hover:bg-gray-100 text-gray-800 border-gray-200'
                }`}
              >
                <Play className="w-5 h-5" />
                <span>Try Playground</span>
              </motion.button>
            </Link>
          </div>
        </AnimatedSection>

        <StaggerContainer stagger={0.15} className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-8 max-w-4xl mx-auto">
          {[
            { value: '50K+', label: 'Active Users' },
            { value: '1M+', label: 'Lines of Code' },
            { value: '99.9%', label: 'Uptime' },
            { value: '24/7', label: 'Support' },
          ].map(({ value, label }) => (
            <StaggerItem key={label}>
              <div className="text-center">
                <div className={`text-3xl md:text-4xl font-bold mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>{value}</div>
                <div className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>{label}</div>
              </div>
            </StaggerItem>
          ))}
        </StaggerContainer>
      </div>
    </section>
  );
}

/* ======================================================================== */
/* FEATURES                                                                  */
/* ======================================================================== */
function Features() {
  const { isDark } = useTheme();
  const features = [
    { icon: Brain, title: 'Smart Code Generation', description: 'AI-powered code generation that understands context and writes production-ready code in seconds.', color: 'blue' },
    { icon: Zap, title: 'Lightning Fast', description: 'Get instant code suggestions and completions with our optimized AI models.', color: 'cyan' },
    { icon: Code, title: 'Multi-Language Support', description: 'Works seamlessly with JavaScript, Python, Java, C++, and 50+ programming languages.', color: 'purple' },
    { icon: Shield, title: 'Secure & Private', description: 'Your code stays private with enterprise-grade security and encryption.', color: 'green' },
    { icon: Sparkles, title: 'Code Optimization', description: 'Automatically optimize your code for better performance and readability.', color: 'yellow' },
    { icon: GitBranch, title: 'Version Control', description: 'Seamless integration with Git and all major version control systems.', color: 'pink' },
  ];

  const colorClasses = {
    blue: 'bg-blue-500/10 text-blue-400',
    cyan: 'bg-cyan-500/10 text-cyan-400',
    purple: 'bg-purple-500/10 text-purple-400',
    green: 'bg-green-500/10 text-green-400',
    yellow: 'bg-yellow-500/10 text-yellow-400',
    pink: 'bg-pink-500/10 text-pink-400',
  };

  return (
    <section id="features" className="py-20 px-4 sm:px-6 lg:px-8 relative">
      <div className="max-w-7xl mx-auto">
        <AnimatedSection className="text-center mb-16">
          <div className="inline-block px-4 py-2 bg-blue-500/10 border border-blue-500/20 rounded-full mb-4">
            <span className="text-sm text-blue-400">Features</span>
          </div>
          <h2 className={`text-3xl md:text-5xl font-bold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>
            Everything You Need to Code Better
          </h2>
          <p className={`text-xl max-w-2xl mx-auto ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
            Powerful features designed to enhance your development workflow
          </p>
        </AnimatedSection>

        <StaggerContainer stagger={0.1} className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <StaggerItem key={index}>
                <motion.div
                  whileHover={{ scale: 1.04, y: -4 }}
                  className={`backdrop-blur-sm border rounded-2xl p-8 transition-all group h-full ${
                    isDark ? 'bg-white/5 border-white/10 hover:bg-white/10' : 'bg-white border-gray-200 hover:shadow-xl'
                  }`}
                >
                  <div className={`w-14 h-14 ${colorClasses[feature.color]} rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform`}>
                    <Icon className="w-7 h-7" />
                  </div>
                  <h3 className={`text-2xl font-bold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>{feature.title}</h3>
                  <p className={isDark ? 'text-gray-400 leading-relaxed' : 'text-gray-600 leading-relaxed'}>{feature.description}</p>
                </motion.div>
              </StaggerItem>
            );
          })}
        </StaggerContainer>
      </div>
    </section>
  );
}

/* ======================================================================== */
/* PRICING                                                                   */
/* ======================================================================== */
function Pricing() {
  const { isDark } = useTheme();
  const plans = [
    { name: 'Starter', price: '0', description: 'Perfect for getting started', features: ['100 AI completions/month', 'Basic code suggestions', 'Community support', '5 projects', 'Standard response time'], popular: false },
    { name: 'Pro', price: '29', description: 'Best for professional developers', features: ['Unlimited AI completions', 'Advanced code generation', 'Priority support', 'Unlimited projects', 'Code optimization', 'Team collaboration', 'Custom integrations'], popular: true },
    { name: 'Enterprise', price: '99', description: 'For large teams and organizations', features: ['Everything in Pro', 'Dedicated support', 'Custom AI models', 'Advanced analytics', 'SLA guarantee', 'On-premise deployment', 'Security compliance'], popular: false },
  ];

  return (
    <section id="pricing" className="py-20 px-4 sm:px-6 lg:px-8 relative">
      <div className="max-w-7xl mx-auto">
        <AnimatedSection className="text-center mb-16">
          <div className="inline-block px-4 py-2 bg-blue-500/10 border border-blue-500/20 rounded-full mb-4">
            <span className="text-sm text-blue-400">Pricing</span>
          </div>
          <h2 className={`text-3xl md:text-5xl font-bold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>
            Simple, Transparent Pricing
          </h2>
          <p className={`text-xl max-w-2xl mx-auto ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
            Choose the perfect plan for your needs. No hidden fees.
          </p>
        </AnimatedSection>

        <StaggerContainer stagger={0.15} className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {plans.map((plan, index) => (
            <StaggerItem key={index}>
              <motion.div
                whileHover={{ scale: 1.04 }}
                className={`relative backdrop-blur-sm border rounded-2xl p-8 transition-all h-full flex flex-col ${
                  plan.popular
                    ? 'border-blue-500 shadow-xl shadow-blue-500/20'
                    : isDark ? 'border-white/10 bg-white/5' : 'border-gray-200 bg-white'
                }`}
              >
                {plan.popular && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                    <div className="bg-gradient-to-r from-blue-600 to-cyan-600 text-white px-4 py-1 rounded-full text-sm font-semibold flex items-center space-x-1">
                      <Star className="w-4 h-4" fill="currentColor" />
                      <span>Most Popular</span>
                    </div>
                  </div>
                )}
                <div className="text-center mb-8">
                  <h3 className={`text-2xl font-bold mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>{plan.name}</h3>
                  <p className={`text-sm mb-4 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>{plan.description}</p>
                  <div className="flex items-end justify-center">
                    <span className={`text-5xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>${plan.price}</span>
                    <span className={`ml-2 mb-2 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>/month</span>
                  </div>
                </div>
                <ul className="space-y-4 mb-8 flex-1">
                  {plan.features.map((feature, fIndex) => (
                    <li key={fIndex} className="flex items-start space-x-3">
                      <Check className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
                      <span className={isDark ? 'text-gray-300' : 'text-gray-600'}>{feature}</span>
                    </li>
                  ))}
                </ul>
                <Link to="/signup">
                  <button className={`w-full py-3 rounded-lg font-semibold transition-all ${
                    plan.popular
                      ? 'bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-500/50'
                      : isDark
                        ? 'bg-white/10 hover:bg-white/20 text-white border border-white/20'
                        : 'bg-gray-100 hover:bg-gray-200 text-gray-800 border border-gray-200'
                  }`}>
                    Get Started
                  </button>
                </Link>
              </motion.div>
            </StaggerItem>
          ))}
        </StaggerContainer>
      </div>
    </section>
  );
}

/* ======================================================================== */
/* TESTIMONIALS                                                              */
/* ======================================================================== */
function Testimonials() {
  const { isDark } = useTheme();
  const testimonials = [
    { name: 'Sarah Johnson', role: 'Senior Developer at TechCorp', image: '👩‍💻', rating: 5, text: "CodeFlow has completely transformed how I write code. The AI suggestions are incredibly accurate and save me hours every day." },
    { name: 'Michael Chen', role: 'Full Stack Engineer', image: '👨‍💻', rating: 5, text: "CodeFlow's multi-language support is a game-changer. It understands context perfectly and generates production-ready code." },
    { name: 'Emily Rodriguez', role: 'CTO at StartupXYZ', image: '👩‍💼', rating: 5, text: 'We implemented CodeFlow across our entire team. Productivity increased by 40% and code quality improved significantly.' },
    { name: 'David Park', role: 'Software Architect', image: '👨‍🔧', rating: 5, text: "The code optimization feature is brilliant. It's like having a senior developer reviewing your code 24/7." },
    { name: 'Lisa Thompson', role: 'Frontend Developer', image: '👩‍🎨', rating: 5, text: 'CodeFlow makes learning new frameworks so much easier. The AI explains concepts while generating code.' },
    { name: 'James Wilson', role: 'DevOps Engineer', image: '👨‍🚀', rating: 5, text: 'The integration with our existing tools was seamless. Security features are top-notch.' },
  ];

  return (
    <section id="testimonials" className="py-20 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-blue-500/5 to-transparent pointer-events-none" />
      <div className="max-w-7xl mx-auto relative z-10">
        <AnimatedSection className="text-center mb-16">
          <div className="inline-block px-4 py-2 bg-blue-500/10 border border-blue-500/20 rounded-full mb-4">
            <span className="text-sm text-blue-400">Testimonials</span>
          </div>
          <h2 className={`text-3xl md:text-5xl font-bold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>
            Loved by Developers Worldwide
          </h2>
          <p className={`text-xl max-w-2xl mx-auto ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
            See what our users have to say about CodeFlow
          </p>
        </AnimatedSection>

        <StaggerContainer stagger={0.1} className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {testimonials.map((t, i) => (
            <StaggerItem key={i}>
              <motion.div
                whileHover={{ scale: 1.03 }}
                className={`backdrop-blur-sm border rounded-2xl p-8 transition-all relative h-full ${
                  isDark ? 'bg-white/5 border-white/10 hover:bg-white/10' : 'bg-white border-gray-200 hover:shadow-xl'
                }`}
              >
                <div className="absolute top-6 right-6 opacity-20">
                  <Quote className="w-12 h-12 text-blue-400" />
                </div>
                <div className="flex space-x-1 mb-4">
                  {[...Array(Math.min(t.rating, 5))].map((_, j) => (
                    <Star key={j} className="w-5 h-5 text-yellow-400" fill="currentColor" />
                  ))}
                </div>
                <p className={`mb-6 leading-relaxed relative z-10 ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                  &ldquo;{t.text}&rdquo;
                </p>
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-full flex items-center justify-center text-2xl">
                    {t.image}
                  </div>
                  <div>
                    <div className={`font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>{t.name}</div>
                    <div className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>{t.role}</div>
                  </div>
                </div>
              </motion.div>
            </StaggerItem>
          ))}
        </StaggerContainer>
      </div>
    </section>
  );
}

/* ======================================================================== */
/* HOME PAGE (combines all sections)                                         */
/* ======================================================================== */
export default function Home() {
  return (
    <>
      <Hero />
      <Features />
      <Pricing />
      <Testimonials />
    </>
  );
}
