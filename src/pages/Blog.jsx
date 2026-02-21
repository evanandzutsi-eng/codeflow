import { useState } from 'react';
import { motion } from 'framer-motion';
import { Clock, ArrowRight, Search, Tag } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import AnimatedSection, { StaggerContainer, StaggerItem } from '../components/AnimatedSection';

const POSTS = [
  {
    id: 1,
    title: 'Getting Started with CodeFlow AI',
    excerpt: 'Learn how to set up CodeFlow and generate your first lines of AI-powered code in under 5 minutes.',
    category: 'Tutorial',
    readTime: '5 min',
    date: 'Feb 18, 2026',
    image: '🚀',
    color: 'from-blue-500 to-cyan-500',
  },
  {
    id: 2,
    title: 'Best Practices for AI Code Generation',
    excerpt: 'Tips and tricks to write better prompts and get more accurate code from AI assistants.',
    category: 'Guide',
    readTime: '8 min',
    date: 'Feb 15, 2026',
    image: '💡',
    color: 'from-purple-500 to-pink-500',
  },
  {
    id: 3,
    title: 'Security in AI-Generated Code',
    excerpt: 'How CodeFlow ensures the code it generates follows OWASP security best practices.',
    category: 'Security',
    readTime: '6 min',
    date: 'Feb 12, 2026',
    image: '🔒',
    color: 'from-green-500 to-emerald-500',
  },
  {
    id: 4,
    title: 'Multi-Language Support: What\'s New',
    excerpt: 'We\'ve added support for 15 new programming languages including Rust, Kotlin, and Swift.',
    category: 'Product',
    readTime: '4 min',
    date: 'Feb 10, 2026',
    image: '🌐',
    color: 'from-orange-500 to-yellow-500',
  },
  {
    id: 5,
    title: 'How We Built Our AI Model',
    excerpt: 'A deep dive into the architecture and training process behind CodeFlow\'s AI engine.',
    category: 'Engineering',
    readTime: '12 min',
    date: 'Feb 8, 2026',
    image: '🧠',
    color: 'from-blue-600 to-purple-600',
  },
  {
    id: 6,
    title: 'CodeFlow vs GitHub Copilot: 2026 Comparison',
    excerpt: 'An honest comparison of features, pricing, and performance between the two leading AI coding tools.',
    category: 'Comparison',
    readTime: '10 min',
    date: 'Feb 5, 2026',
    image: '⚖️',
    color: 'from-cyan-500 to-blue-500',
  },
];

const CATEGORIES = ['All', 'Tutorial', 'Guide', 'Security', 'Product', 'Engineering', 'Comparison'];

export default function Blog() {
  const { isDark } = useTheme();
  const [activeCategory, setActiveCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');

  const filtered = POSTS.filter(post => {
    const matchesCategory = activeCategory === 'All' || post.category === activeCategory;
    const matchesSearch = !searchQuery || post.title.toLowerCase().includes(searchQuery.toLowerCase()) || post.excerpt.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="min-h-screen pt-28 pb-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <AnimatedSection className="text-center mb-12">
          <div className="inline-block px-4 py-2 bg-blue-500/10 border border-blue-500/20 rounded-full mb-4">
            <span className="text-sm text-blue-400">Blog & Docs</span>
          </div>
          <h1 className={`text-3xl md:text-5xl font-bold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>
            Learn & Explore
          </h1>
          <p className={`text-xl max-w-2xl mx-auto ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
            Guides, tutorials, and insights to help you get the most out of CodeFlow.
          </p>
        </AnimatedSection>

        {/* Search & Filter */}
        <AnimatedSection delay={0.2} className="mb-10">
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
            {/* Search */}
            <div className="relative w-full sm:w-72">
              <Search className={`absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 ${isDark ? 'text-gray-500' : 'text-gray-400'}`} />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value.replace(/[<>"'`;(){}[\]\\]/g, '').slice(0, 100))}
                placeholder="Search articles..."
                maxLength={100}
                className={`w-full pl-10 pr-4 py-2.5 rounded-lg border text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 ${
                  isDark ? 'bg-white/10 border-white/20 text-white placeholder-gray-500' : 'bg-gray-50 border-gray-200 text-gray-900 placeholder-gray-400'
                }`}
              />
            </div>

            {/* Category Tabs */}
            <div className="flex flex-wrap gap-2">
              {CATEGORIES.map(cat => (
                <button
                  key={cat}
                  onClick={() => setActiveCategory(cat)}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                    activeCategory === cat
                      ? 'bg-blue-600 text-white'
                      : isDark
                        ? 'bg-white/5 text-gray-400 hover:bg-white/10'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>
        </AnimatedSection>

        {/* Posts Grid */}
        {filtered.length > 0 ? (
          <StaggerContainer stagger={0.1} className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filtered.map(post => (
              <StaggerItem key={post.id}>
                <motion.article
                  whileHover={{ y: -4 }}
                  className={`rounded-2xl border overflow-hidden h-full flex flex-col transition-all cursor-pointer ${
                    isDark ? 'bg-white/5 border-white/10 hover:bg-white/[0.08]' : 'bg-white border-gray-200 hover:shadow-xl'
                  }`}
                >
                  {/* Image area */}
                  <div className={`h-40 bg-gradient-to-br ${post.color} flex items-center justify-center`}>
                    <span className="text-6xl">{post.image}</span>
                  </div>

                  <div className="p-6 flex flex-col flex-1">
                    <div className="flex items-center gap-3 mb-3">
                      <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        isDark ? 'bg-blue-500/10 text-blue-400' : 'bg-blue-50 text-blue-600'
                      }`}>
                        {post.category}
                      </span>
                      <span className={`flex items-center gap-1 text-xs ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                        <Clock className="w-3 h-3" />
                        {post.readTime}
                      </span>
                    </div>

                    <h2 className={`text-lg font-bold mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>{post.title}</h2>
                    <p className={`text-sm mb-4 flex-1 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>{post.excerpt}</p>

                    <div className="flex items-center justify-between">
                      <span className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>{post.date}</span>
                      <span className="flex items-center gap-1 text-blue-500 text-sm font-medium">
                        Read more <ArrowRight className="w-4 h-4" />
                      </span>
                    </div>
                  </div>
                </motion.article>
              </StaggerItem>
            ))}
          </StaggerContainer>
        ) : (
          <div className={`text-center py-20 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
            <Tag className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>No articles found. Try a different search or category.</p>
          </div>
        )}
      </div>
    </div>
  );
}
