// src/App.jsx — Complete router + all providers wired
import { BrowserRouter, Routes, Route, Navigate, useNavigate, useSearchParams } from "react-router-dom";
import { useEffect, useState } from "react";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { ChatProvider } from "./context/ChatContext";
import { BillingProvider, useBilling } from "./context/BillingContext";
import { ImageProvider } from "./context/ImageContext";
import LoginPage    from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import ChatPage     from "./pages/ChatPage";
import BillingPage  from "./pages/BillingPage";
import ImagePage    from "./pages/ImagePage";

function ProtectedRoute({ children }) {
  const { isAuthenticated, isLoading } = useAuth();
  if (isLoading) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-950">
      <div className="animate-spin h-10 w-10 rounded-full border-2 border-violet-500 border-t-transparent" />
    </div>
  );
  return isAuthenticated ? children : <Navigate to="/login" replace />;
}

function PublicRoute({ children }) {
  const { isAuthenticated, isLoading } = useAuth();
  if (isLoading) return null;
  return isAuthenticated ? <Navigate to="/chat" replace /> : children;
}

function BillingVerifyPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { verifyPayment } = useBilling();
  const [status, setStatus] = useState("verifying");
  const [message, setMessage] = useState("");

  useEffect(() => {
    const reference = searchParams.get("reference") || searchParams.get("ref");
    if (!reference) { setStatus("error"); setMessage("No payment reference found."); return; }
    verifyPayment(reference).then(({ success, data, error }) => {
      if (success) { setStatus("success"); setMessage(data.message); setTimeout(() => navigate("/billing"), 3000); }
      else { setStatus("error"); setMessage(error || "Payment verification failed."); }
    });
  }, []); // eslint-disable-line

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-950 p-6">
      <div className="max-w-md w-full text-center bg-gray-900 border border-gray-800 rounded-2xl p-10 shadow-2xl space-y-4">
        {status === "verifying" && (<><div className="animate-spin h-12 w-12 rounded-full border-4 border-violet-500 border-t-transparent mx-auto" /><h2 className="text-xl font-semibold text-white">Verifying payment...</h2><p className="text-gray-400">Please wait.</p></>)}
        {status === "success"   && (<><div className="text-6xl">🎉</div><h2 className="text-2xl font-bold text-green-400">Payment Successful!</h2><p className="text-gray-300">{message}</p><p className="text-sm text-gray-500">Redirecting...</p></>)}
        {status === "error"     && (<><div className="text-6xl">❌</div><h2 className="text-xl font-bold text-red-400">Payment Failed</h2><p className="text-gray-300">{message}</p><button onClick={() => navigate("/billing")} className="mt-4 px-6 py-2.5 bg-violet-600 hover:bg-violet-500 text-white rounded-xl transition-colors">Go to Billing</button></>)}
      </div>
    </div>
  );
}

function DashboardPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  return (
    <div className="min-h-screen bg-gray-950 text-white flex items-center justify-center px-4">
      <div className="max-w-lg w-full text-center space-y-6">
        <div className="text-5xl">⚡</div>
        <div>
          <h1 className="text-3xl font-bold">Welcome back, {user?.name?.split(" ")[0]}!</h1>
          <p className="text-gray-400 mt-2">You have <strong className="text-violet-400">{user?.credits} credits</strong> remaining.</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            { label: "Start chatting", icon: "💬", href: "/chat",    desc: "AI code assistant" },
            { label: "Generate images", icon: "🖼️", href: "/image",  desc: "DALL-E 3 powered" },
            { label: "Manage billing",  icon: "💳", href: "/billing", desc: "Credits & plans" },
          ].map((card) => (
            <button key={card.href} onClick={() => navigate(card.href)}
              className="p-5 bg-gray-900 border border-gray-800 rounded-2xl hover:border-violet-500/50 hover:bg-gray-800 transition-all text-left group">
              <div className="text-3xl mb-2">{card.icon}</div>
              <p className="font-semibold text-white group-hover:text-violet-300 transition-colors">{card.label}</p>
              <p className="text-xs text-gray-500 mt-0.5">{card.desc}</p>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <BillingProvider>
          <ChatProvider>
            <ImageProvider>
              <Routes>
                <Route path="/login"           element={<PublicRoute><LoginPage /></PublicRoute>} />
                <Route path="/register"        element={<PublicRoute><RegisterPage /></PublicRoute>} />
                <Route path="/dashboard"       element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
                <Route path="/chat"            element={<ProtectedRoute><ChatPage /></ProtectedRoute>} />
                <Route path="/chat/:id"        element={<ProtectedRoute><ChatPage /></ProtectedRoute>} />
                <Route path="/image"           element={<ProtectedRoute><ImagePage /></ProtectedRoute>} />
                <Route path="/billing"         element={<ProtectedRoute><BillingPage /></ProtectedRoute>} />
                <Route path="/billing/verify"  element={<ProtectedRoute><BillingVerifyPage /></ProtectedRoute>} />
                <Route path="/"  element={<Navigate to="/dashboard" replace />} />
                <Route path="*"  element={<Navigate to="/dashboard" replace />} />
              </Routes>
            </ImageProvider>
          </ChatProvider>
        </BillingProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
