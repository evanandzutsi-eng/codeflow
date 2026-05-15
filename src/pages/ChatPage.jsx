// src/pages/ChatPage.jsx — with dynamic models per plan
import { useEffect, useRef, useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useChat } from "../context/ChatContext";
import { useAuth } from "../context/AuthContext";
import api from "../utils/api";

// ─── MARKDOWN-LIKE CODE RENDERER ─────────────────────────────────────────────
function MessageContent({ content }) {
  if (!content) return null;
  const parts = content.split(/(```[\s\S]*?```)/g);
  return (
    <div className="space-y-3">
      {parts.map((part, i) => {
        if (part.startsWith("```")) {
          const lines = part.slice(3, -3).split("\n");
          const lang = lines[0]?.trim() || "";
          const code = lines.slice(lang ? 1 : 0).join("\n");
          return (
            <div key={i} className="rounded-xl overflow-hidden border border-gray-700">
              {lang && (
                <div className="flex items-center justify-between px-4 py-2 bg-gray-800 border-b border-gray-700">
                  <span className="text-xs text-gray-400 font-mono">{lang}</span>
                  <button onClick={() => navigator.clipboard.writeText(code)}
                    className="text-xs text-gray-400 hover:text-white transition-colors">Copy</button>
                </div>
              )}
              <pre className="p-4 bg-gray-900 overflow-x-auto text-sm text-gray-100 font-mono leading-relaxed">
                <code>{code}</code>
              </pre>
            </div>
          );
        }
        return (
          <p key={i} className="leading-relaxed text-sm whitespace-pre-wrap"
            dangerouslySetInnerHTML={{
              __html: part
                .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
                .replace(/`([^`]+)`/g, '<code class="px-1 py-0.5 bg-gray-800 rounded text-violet-300 text-xs font-mono">$1</code>'),
            }}
          />
        );
      })}
    </div>
  );
}

// ─── CONVERSATION SIDEBAR ITEM ────────────────────────────────────────────────
function ConversationItem({ conversation, active, onClick, onDelete, onRename }) {
  const [editing, setEditing] = useState(false);
  const [title, setTitle] = useState(conversation.title);

  const handleRenameSubmit = () => {
    if (title.trim() && title !== conversation.title) onRename(conversation._id, title.trim());
    setEditing(false);
  };

  return (
    <div onClick={() => !editing && onClick(conversation._id)}
      className={`group flex items-center gap-2 px-3 py-2.5 rounded-xl cursor-pointer transition-colors
        ${active ? "bg-violet-600/20 border border-violet-500/30" : "hover:bg-gray-800 border border-transparent"}`}>
      <span className="text-lg flex-shrink-0">💬</span>
      <div className="flex-1 min-w-0">
        {editing ? (
          <input value={title} onChange={(e) => setTitle(e.target.value)}
            onBlur={handleRenameSubmit}
            onKeyDown={(e) => { if (e.key === "Enter") handleRenameSubmit(); if (e.key === "Escape") setEditing(false); }}
            onClick={(e) => e.stopPropagation()} autoFocus
            className="w-full bg-gray-700 text-white text-sm px-2 py-0.5 rounded outline-none" />
        ) : (
          <p className="text-sm text-gray-200 truncate">{conversation.title}</p>
        )}
        <p className="text-xs text-gray-500 mt-0.5">{conversation.messageCount || 0} messages</p>
      </div>
      <div className="hidden group-hover:flex gap-1 flex-shrink-0">
        <button onClick={(e) => { e.stopPropagation(); setEditing(true); }}
          className="p-1 text-gray-400 hover:text-white rounded transition-colors">✏️</button>
        <button onClick={(e) => { e.stopPropagation(); onDelete(conversation._id); }}
          className="p-1 text-gray-400 hover:text-red-400 rounded transition-colors">🗑️</button>
      </div>
    </div>
  );
}

// ─── PLAN BADGE ───────────────────────────────────────────────────────────────
const PLAN_COLORS = {
  free: "bg-gray-700 text-gray-300",
  starter: "bg-blue-600/30 text-blue-300",
  pro: "bg-violet-600/30 text-violet-300",
  enterprise: "bg-amber-600/30 text-amber-300",
};

// ─── MAIN CHAT PAGE ────────────────────────────────────────────────────────────
export default function ChatPage() {
  const { id: conversationId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const {
    conversations, activeConversation, messages,
    isStreaming, streamingContent, isLoadingMessages, isLoadingConversations,
    error,
    loadConversations, openConversation, newConversation,
    renameConversation, deleteConversation, sendMessage, stopStream,
  } = useChat();

  const [input, setInput] = useState("");
  const [availableModels, setAvailableModels] = useState([]);
  const [model, setModel] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const messagesEndRef = useRef(null);
  const textareaRef = useRef(null);

  // Load available models for this user's plan
  useEffect(() => {
    api.get("/chat/models").then(({ data }) => {
      const models = data.data.models;
      setAvailableModels(models);
      if (models.length > 0) setModel(models[0].id);
    }).catch(() => {
      // Fallback models if endpoint fails
      setAvailableModels([{ id: "llama-3.1-8b-instant", label: "CodeFlow AI", badge: "Free", cost: "1 credit/msg" }]);
      setModel("llama-3.1-8b-instant");
    });
  }, []);

  useEffect(() => { loadConversations(); }, [loadConversations]);
  useEffect(() => { if (conversationId) openConversation(conversationId); }, [conversationId, openConversation]);
  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages, streamingContent]);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 160) + "px";
    }
  }, [input]);

  const handleSend = useCallback(async () => {
    const text = input.trim();
    if (!text || isStreaming || !model) return;
    setInput("");
    await sendMessage(text, { model, conversationId: activeConversation?._id });
  }, [input, isStreaming, sendMessage, model, activeConversation]);

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); }
  };

  const handleNewChat = async () => {
    const conv = await newConversation({ model });
    if (conv) navigate(`/chat/${conv._id}`);
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this conversation?")) return;
    await deleteConversation(id);
    if (conversationId === id) navigate("/chat");
  };

  const currentModel = availableModels.find((m) => m.id === model);
  const isPaidPlan = ["starter", "pro", "enterprise"].includes(user?.plan);

  const allMessages = [
    ...messages,
    ...(isStreaming && streamingContent
      ? [{ _id: "streaming", role: "assistant", content: streamingContent, streaming: true }]
      : []),
  ];

  return (
    <div className="flex h-screen bg-gray-950 text-white overflow-hidden">
      {/* ── SIDEBAR ─────────────────────────────────────────────────────────── */}
      <aside className={`${sidebarOpen ? "w-72" : "w-0"} flex-shrink-0 transition-all duration-300 overflow-hidden border-r border-gray-800 flex flex-col bg-gray-900`}>
        <div className="p-4 border-b border-gray-800 flex items-center justify-between">
          <span className="font-bold text-lg">⚡ CodeFlow</span>
          <button onClick={handleNewChat}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-violet-600 hover:bg-violet-500 rounded-lg text-sm font-medium transition-colors">
            + New
          </button>
        </div>

        {/* User plan + credits */}
        <div className="px-4 py-3 border-b border-gray-800 space-y-2">
          <div className="flex items-center justify-between">
            <span className={`text-xs px-2 py-0.5 rounded-full font-medium capitalize ${PLAN_COLORS[user?.plan || "free"]}`}>
              {user?.plan || "free"} plan
            </span>
            <span className={`font-bold text-sm ${user?.credits <= 5 ? "text-red-400" : "text-violet-400"}`}>
              {user?.credits ?? "—"} credits
            </span>
          </div>
          {!isPaidPlan && (
            <a href="/billing"
              className="block text-xs text-center py-1.5 bg-violet-600/20 border border-violet-500/30 rounded-lg text-violet-400 hover:bg-violet-600/30 transition-colors">
              Upgrade for GPT-4o →
            </a>
          )}
          {user?.credits <= 5 && user?.credits > 0 && (
            <a href="/billing"
              className="block text-xs text-center py-1 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400">
              ⚠️ Low credits — top up
            </a>
          )}
        </div>

        {/* Conversations list */}
        <div className="flex-1 overflow-y-auto p-3 space-y-1">
          {isLoadingConversations ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin h-5 w-5 border-2 border-violet-500 border-t-transparent rounded-full" />
            </div>
          ) : conversations.length === 0 ? (
            <div className="text-center py-8 text-gray-500 text-sm">
              <p className="text-2xl mb-2">💬</p>
              <p>No conversations yet</p>
            </div>
          ) : (
            conversations.map((c) => (
              <ConversationItem key={c._id} conversation={c}
                active={c._id === (activeConversation?._id || conversationId)}
                onClick={(id) => navigate(`/chat/${id}`)}
                onDelete={handleDelete}
                onRename={renameConversation}
              />
            ))
          )}
        </div>

        {/* Sidebar footer nav */}
        <div className="p-3 border-t border-gray-800 space-y-1">
          {[
            { href: "/image",   icon: "🖼️",  label: "Image Generation" },
            { href: "/billing", icon: "💳",  label: "Billing & Credits" },
            { href: "/profile", icon: "👤",  label: user?.name || "Profile" },
          ].map((item) => (
            <a key={item.href} href={item.href}
              className="flex items-center gap-3 px-3 py-2 rounded-xl text-sm text-gray-400 hover:text-white hover:bg-gray-800 transition-colors">
              <span>{item.icon}</span> {item.label}
            </a>
          ))}
        </div>
      </aside>

      {/* ── MAIN CONTENT ─────────────────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top bar */}
        <header className="flex items-center gap-3 px-4 py-3 border-b border-gray-800 bg-gray-900/50 backdrop-blur-sm">
          <button onClick={() => setSidebarOpen((o) => !o)}
            className="p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-colors">☰</button>
          <span className="text-sm font-medium text-gray-200 truncate flex-1">
            {activeConversation?.title || "New conversation"}
          </span>

          {/* Model selector */}
          <select value={model} onChange={(e) => setModel(e.target.value)}
            className="text-xs bg-gray-800 border border-gray-700 text-gray-300 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-violet-500">
            {availableModels.map((m) => (
              <option key={m.id} value={m.id}>
                {m.label} — {m.cost}
              </option>
            ))}
          </select>

          {/* Provider badge */}
          {currentModel && (
            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
              isPaidPlan ? "bg-green-600/20 text-green-400" : "bg-gray-700 text-gray-400"
            }`}>
              {isPaidPlan ? "OpenAI" : "Free AI"}
            </span>
          )}
        </header>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto">
          {isLoadingMessages ? (
            <div className="flex items-center justify-center h-full">
              <div className="animate-spin h-8 w-8 border-2 border-violet-500 border-t-transparent rounded-full" />
            </div>
          ) : allMessages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full gap-6 px-4 text-center">
              <div className="text-6xl">⚡</div>
              <div>
                <h2 className="text-2xl font-bold text-white">How can I help you code today?</h2>
                <p className="text-gray-400 mt-2">
                  {isPaidPlan
                    ? "Powered by OpenAI — full GPT-4o capabilities."
                    : "Powered by Llama 3.1 — upgrade for GPT-4o."}
                </p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full max-w-xl">
                {["Write a React hook for debouncing", "Explain async/await vs promises",
                  "Debug this Python error: TypeError...", "Create a REST API with Express.js"
                ].map((s) => (
                  <button key={s} onClick={() => setInput(s)}
                    className="p-3 bg-gray-800 hover:bg-gray-700 border border-gray-700 rounded-xl text-sm text-left text-gray-300 transition-colors">
                    {s}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="max-w-3xl mx-auto px-4 py-6 space-y-6">
              {allMessages.map((msg) => (
                <div key={msg._id} className={`flex gap-3 ${msg.role === "user" ? "flex-row-reverse" : "flex-row"}`}>
                  <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold
                    ${msg.role === "user" ? "bg-violet-600" : "bg-gray-700"}`}>
                    {msg.role === "user" ? (user?.name?.[0] || "U") : "⚡"}
                  </div>
                  <div className={`max-w-[80%] rounded-2xl px-4 py-3
                    ${msg.role === "user" ? "bg-violet-600 text-white rounded-tr-sm" : "bg-gray-800 text-gray-100 rounded-tl-sm"}`}>
                    <MessageContent content={msg.content} />
                    {msg.streaming && (
                      <span className="inline-block w-2 h-4 bg-violet-400 rounded-sm animate-pulse ml-1" />
                    )}
                    {msg.tokensUsed > 0 && (
                      <p className="text-xs text-gray-500 mt-2">{msg.tokensUsed} tokens</p>
                    )}
                  </div>
                </div>
              ))}
              {error && (
                <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-sm text-red-400 text-center">
                  {error}
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        {/* ── INPUT BAR ──────────────────────────────────────────────────────── */}
        <div className="border-t border-gray-800 bg-gray-900/50 backdrop-blur-sm p-4">
          <div className="max-w-3xl mx-auto">
            <div className="flex gap-3 items-end bg-gray-800 border border-gray-700 rounded-2xl p-3 focus-within:border-violet-500 transition-colors">
              <textarea ref={textareaRef} value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask me anything about code..."
                rows={1} disabled={isStreaming}
                className="flex-1 bg-transparent text-white placeholder-gray-500 text-sm resize-none outline-none min-h-[24px] max-h-40 leading-relaxed disabled:opacity-50"
              />
              {isStreaming ? (
                <button onClick={stopStream}
                  className="flex-shrink-0 p-2 bg-red-600 hover:bg-red-500 text-white rounded-xl transition-colors">⏹</button>
              ) : (
                <button onClick={handleSend} disabled={!input.trim() || !model}
                  className="flex-shrink-0 p-2 bg-violet-600 hover:bg-violet-500 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-xl transition-colors">➤</button>
              )}
            </div>
            <p className="text-xs text-gray-600 text-center mt-2">
              {isPaidPlan ? "OpenAI" : "Free AI (Llama 3.1)"} · {user?.credits ?? 0} credits left · Enter to send
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
