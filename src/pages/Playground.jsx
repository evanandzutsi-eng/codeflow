import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, Copy, Check, Sparkles, ChevronDown, Loader2, RotateCcw } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

const LANGUAGES = ['JavaScript', 'Python', 'TypeScript', 'Java', 'Go', 'Rust', 'C++', 'SQL'];

const EXAMPLE_PROMPTS = [
  'Create a REST API endpoint for user authentication',
  'Write a function to merge two sorted arrays',
  'Build a React hook for debouncing input',
  'Create a Python class for a binary search tree',
  'Write a SQL query to find duplicate records',
];

// Simulated AI responses for demo (no real API key needed)
const DEMO_RESPONSES = {
  JavaScript: `// REST API Authentication Endpoint
import express from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

const router = express.Router();

router.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    // Validate input
    if (!email || !password) {
      return res.status(400).json({ 
        error: 'Email and password required' 
      });
    }

    // Find user in database
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ 
        error: 'Invalid credentials' 
      });
    }

    // Verify password
    const isValid = await bcrypt.compare(
      password, user.passwordHash
    );
    if (!isValid) {
      return res.status(401).json({ 
        error: 'Invalid credentials' 
      });
    }

    // Generate JWT token
    const token = jwt.sign(
      { userId: user.id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({ token, user: { id: user.id, email } });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

export default router;`,
  Python: `# Binary Search Tree Implementation
class Node:
    def __init__(self, value):
        self.value = value
        self.left = None
        self.right = None

class BinarySearchTree:
    def __init__(self):
        self.root = None
    
    def insert(self, value):
        if not self.root:
            self.root = Node(value)
            return
        self._insert_recursive(self.root, value)
    
    def _insert_recursive(self, node, value):
        if value < node.value:
            if node.left is None:
                node.left = Node(value)
            else:
                self._insert_recursive(node.left, value)
        else:
            if node.right is None:
                node.right = Node(value)
            else:
                self._insert_recursive(node.right, value)
    
    def search(self, value):
        return self._search_recursive(self.root, value)
    
    def _search_recursive(self, node, value):
        if node is None:
            return False
        if value == node.value:
            return True
        elif value < node.value:
            return self._search_recursive(node.left, value)
        else:
            return self._search_recursive(node.right, value)
    
    def inorder(self):
        result = []
        self._inorder_recursive(self.root, result)
        return result
    
    def _inorder_recursive(self, node, result):
        if node:
            self._inorder_recursive(node.left, result)
            result.append(node.value)
            self._inorder_recursive(node.right, result)

# Usage
bst = BinarySearchTree()
for val in [5, 3, 7, 1, 4, 6, 8]:
    bst.insert(val)

print(bst.inorder())   # [1, 3, 4, 5, 6, 7, 8]
print(bst.search(4))   # True
print(bst.search(9))   # False`,
  TypeScript: `// Debounce Hook for React
import { useState, useEffect, useRef, useCallback } from 'react';

interface UseDebounceOptions {
  delay: number;
  leading?: boolean;
}

function useDebounce<T>(
  value: T,
  options: UseDebounceOptions
): T {
  const { delay, leading = false } = options;
  const [debounced, setDebounced] = useState<T>(value);
  const isFirstRender = useRef(true);

  useEffect(() => {
    if (leading && isFirstRender.current) {
      setDebounced(value);
      isFirstRender.current = false;
      return;
    }

    const timer = setTimeout(() => {
      setDebounced(value);
    }, delay);

    return () => clearTimeout(timer);
  }, [value, delay, leading]);

  return debounced;
}

// Usage in a search component
function SearchInput() {
  const [query, setQuery] = useState('');
  const debouncedQuery = useDebounce(query, { 
    delay: 300 
  });

  useEffect(() => {
    if (debouncedQuery) {
      fetchSearchResults(debouncedQuery);
    }
  }, [debouncedQuery]);

  return (
    <input
      value={query}
      onChange={(e) => setQuery(e.target.value)}
      placeholder="Search..."
    />
  );
}`,
};

export default function Playground() {
  const { isDark } = useTheme();
  const [prompt, setPrompt] = useState('');
  const [language, setLanguage] = useState('JavaScript');
  const [showLangMenu, setShowLangMenu] = useState(false);
  const [output, setOutput] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleGenerate = useCallback(async () => {
    if (!prompt.trim() || isGenerating) return;
    setIsGenerating(true);
    setOutput('');

    // Simulate streaming AI generation (demo mode)
    const response = DEMO_RESPONSES[language] || DEMO_RESPONSES.JavaScript;
    for (let i = 0; i < response.length; i += 3) {
      await new Promise(r => setTimeout(r, 8));
      setOutput(response.slice(0, i + 3));
    }
    setOutput(response);
    setIsGenerating(false);
  }, [prompt, language, isGenerating]);

  const handleCopy = () => {
    navigator.clipboard.writeText(output);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleExampleClick = (example) => {
    setPrompt(example);
    setOutput('');
  };

  return (
    <div className="min-h-screen pt-28 pb-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-10">
          <div className="inline-flex items-center space-x-2 bg-blue-500/10 border border-blue-500/20 rounded-full px-4 py-2 mb-4">
            <Sparkles className="w-4 h-4 text-blue-400" />
            <span className="text-sm text-blue-400">AI Playground</span>
          </div>
          <h1 className={`text-3xl md:text-5xl font-bold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>
            Try AI Code Generation
          </h1>
          <p className={`text-lg max-w-2xl mx-auto ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
            Describe what you want to build and watch AI generate production-ready code instantly.
          </p>
        </motion.div>

        {/* Playground */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <div className={`rounded-2xl border overflow-hidden ${isDark ? 'bg-white/5 border-white/10' : 'bg-white border-gray-200 shadow-xl'}`}>
            {/* Toolbar */}
            <div className={`flex items-center justify-between px-5 py-3 border-b ${isDark ? 'border-white/10' : 'border-gray-200'}`}>
              <div className="flex items-center space-x-3">
                <Sparkles className="w-5 h-5 text-blue-400" />
                <span className={`font-medium text-sm ${isDark ? 'text-white' : 'text-gray-900'}`}>CodeFlow AI</span>
              </div>

              {/* Language Selector */}
              <div className="relative">
                <button
                  onClick={() => setShowLangMenu(!showLangMenu)}
                  className={`flex items-center space-x-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                    isDark ? 'bg-white/10 text-gray-300 hover:bg-white/20' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  <span>{language}</span>
                  <ChevronDown className="w-4 h-4" />
                </button>
                <AnimatePresence>
                  {showLangMenu && (
                    <motion.div
                      initial={{ opacity: 0, y: -5 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -5 }}
                      className={`absolute right-0 mt-2 w-40 rounded-xl border py-2 z-20 ${
                        isDark ? 'bg-slate-900 border-white/10' : 'bg-white border-gray-200 shadow-xl'
                      }`}
                    >
                      {LANGUAGES.map(lang => (
                        <button
                          key={lang}
                          onClick={() => { setLanguage(lang); setShowLangMenu(false); }}
                          className={`w-full text-left px-4 py-2 text-sm transition-colors ${
                            lang === language ? 'text-blue-400' :
                            isDark ? 'text-gray-300 hover:bg-white/5' : 'text-gray-700 hover:bg-gray-50'
                          }`}
                        >
                          {lang}
                        </button>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>

            {/* Input */}
            <div className={`p-5 border-b ${isDark ? 'border-white/10' : 'border-gray-200'}`}>
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value.slice(0, 2000))}
                placeholder="Describe what you want to build... (e.g., 'Create a REST API endpoint for user authentication')"
                rows={3}
                maxLength={2000}
                className={`w-full bg-transparent resize-none focus:outline-none text-base leading-relaxed ${
                  isDark ? 'text-white placeholder-gray-500' : 'text-gray-900 placeholder-gray-400'
                }`}
              />
              <div className="flex items-center justify-between mt-3">
                <span className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                  {prompt.length}/2000
                </span>
                <div className="flex items-center space-x-2">
                  {output && (
                    <button
                      onClick={() => { setOutput(''); setPrompt(''); }}
                      className={`p-2 rounded-lg transition-colors ${isDark ? 'text-gray-400 hover:bg-white/10' : 'text-gray-500 hover:bg-gray-100'}`}
                    >
                      <RotateCcw className="w-4 h-4" />
                    </button>
                  )}
                  <button
                    onClick={handleGenerate}
                    disabled={!prompt.trim() || isGenerating}
                    className="flex items-center space-x-2 px-5 py-2 bg-blue-600 hover:bg-blue-500 disabled:bg-blue-600/50 text-white rounded-lg text-sm font-semibold transition-all"
                  >
                    {isGenerating ? (
                      <><Loader2 className="w-4 h-4 animate-spin" /><span>Generating...</span></>
                    ) : (
                      <><Play className="w-4 h-4" /><span>Generate</span></>
                    )}
                  </button>
                </div>
              </div>
            </div>

            {/* Output */}
            <div className="relative min-h-[300px] max-h-[500px] overflow-auto">
              {output ? (
                <>
                  <button
                    onClick={handleCopy}
                    className={`absolute top-3 right-3 p-2 rounded-lg transition-colors z-10 ${
                      isDark ? 'bg-white/10 hover:bg-white/20 text-gray-300' : 'bg-gray-100 hover:bg-gray-200 text-gray-600'
                    }`}
                    aria-label="Copy code"
                  >
                    {copied ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
                  </button>
                  <pre className={`p-5 text-sm font-mono leading-relaxed whitespace-pre-wrap ${isDark ? 'text-gray-300' : 'text-gray-800'}`}>
                    <code>{output}</code>
                    {isGenerating && <span className="animate-pulse text-blue-400">▊</span>}
                  </pre>
                </>
              ) : (
                <div className={`flex items-center justify-center h-[300px] ${isDark ? 'text-gray-600' : 'text-gray-300'}`}>
                  <div className="text-center">
                    <Sparkles className="w-12 h-12 mx-auto mb-3 opacity-50" />
                    <p className="text-sm">Generated code will appear here</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Example Prompts */}
          <div className="mt-8">
            <p className={`text-sm font-medium mb-3 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Try an example:</p>
            <div className="flex flex-wrap gap-2">
              {EXAMPLE_PROMPTS.map((example, i) => (
                <button
                  key={i}
                  onClick={() => handleExampleClick(example)}
                  className={`px-4 py-2 rounded-full text-sm transition-all ${
                    isDark
                      ? 'bg-white/5 border border-white/10 text-gray-300 hover:bg-white/10'
                      : 'bg-gray-100 border border-gray-200 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {example}
                </button>
              ))}
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
