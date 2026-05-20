// src/pages/ImagePage.jsx — with Pollinations AI (free) + DALL-E 3 (paid)
import { useEffect, useState } from "react";
import { useImage } from "../context/ImageContext";
import { useAuth } from "../context/AuthContext";
import api from "../utils/api";

const SIZES = [
  { id: "1024x1024", label: "Square 1:1",     icon: "⬛" },
  { id: "1792x1024", label: "Landscape 16:9", icon: "▬" },
  { id: "1024x1792", label: "Portrait 9:16",  icon: "▮" },
];

const QUALITY = [
  { id: "standard", label: "Standard", cost: "1-2 credits" },
  { id: "hd",       label: "HD",       cost: "4 credits" },
];

export default function ImagePage() {
  const { user } = useAuth();
  const { images, isGenerating, isLoadingHistory, error, generateImage, loadHistory, deleteImage } = useImage();

  const [prompt, setPrompt]           = useState("");
  const [size, setSize]               = useState("1024x1024");
  const [quality, setQuality]         = useState("standard");
  const [n, setN]                     = useState(1);
  const [providers, setProviders]     = useState([]);
  const [selectedModel, setSelectedModel] = useState("");
  const [lightbox, setLightbox]       = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  useEffect(() => {
    loadHistory();
    api.get("/image/providers").then(({ data }) => {
      const p = data.data.providers;
      setProviders(p);
      if (p.length > 0) setSelectedModel(p[0].id);
    }).catch(() => {
      const defaults = [
        { id: "flux",         label: "Flux",         badge: "Free", cost: "1 credit", provider: "pollinations" },
        { id: "flux-realism", label: "Flux Realism", badge: "Free", cost: "1 credit", provider: "pollinations" },
      ];
      setProviders(defaults);
      setSelectedModel("flux");
    });
  }, [loadHistory]);

  const currentProvider = providers.find((p) => p.id === selectedModel);
  const isPaid = ["starter", "pro", "enterprise"].includes(user?.plan);
  const creditCost = selectedModel === "dalle3" ? n * (quality === "hd" ? 4 : 2) : n * 1;
  const canGenerate = prompt.trim().length >= 3 && !isGenerating && (user?.credits ?? 0) >= creditCost && selectedModel;

  const handleGenerate = async () => {
    if (!canGenerate) return;
    const result = await generateImage({ prompt: prompt.trim(), size, quality, n, model: selectedModel });
    if (result.success) setPrompt("");
  };

  const handleDelete = async (id) => {
    await deleteImage(id);
    setDeleteConfirm(null);
    if (lightbox?.id === id) setLightbox(null);
  };

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <div className="max-w-5xl mx-auto px-4 py-10">
        <div className="mb-8">
          <h1 className="text-3xl font-bold">🖼️ AI Image Generation</h1>
          <p className="text-gray-400 mt-1">
            {isPaid ? "DALL-E 3 + Pollinations AI" : "Powered by Pollinations AI (free)"} · {user?.credits ?? 0} credits remaining
          </p>
        </div>

        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 mb-8">
          {/* Prompt */}
          <div className="mb-5">
            <label className="block text-sm font-medium text-gray-300 mb-2">Describe your image</label>
            <textarea value={prompt} onChange={(e) => setPrompt(e.target.value)}
              placeholder="A futuristic African city at sunset with neon lights..."
              rows={3} maxLength={1000}
              className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-xl text-white placeholder-gray-500 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 resize-none" />
            <div className="flex justify-between mt-1">
              <span className={`text-xs ${prompt.length > 900 ? "text-red-400" : "text-gray-500"}`}>{prompt.length}/1000</span>
            </div>
          </div>

          {/* AI Model selector */}
          <div className="mb-5">
            <label className="block text-xs font-medium text-gray-400 mb-2 uppercase tracking-wider">AI Model</label>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
              {providers.map((p) => (
                <button key={p.id} onClick={() => setSelectedModel(p.id)}
                  className={`flex flex-col items-start p-3 rounded-xl text-sm border transition-colors
                    ${selectedModel === p.id ? "bg-violet-600/20 border-violet-500/60 text-violet-300" : "bg-gray-800 border-gray-700 text-gray-300 hover:border-gray-600"}`}>
                  <span className="font-medium">{p.label}</span>
                  <span className={`text-xs mt-0.5 ${p.provider === "openai" ? "text-amber-400" : "text-green-400"}`}>
                    {p.badge} · {p.cost}
                  </span>
                </button>
              ))}
            </div>
            {currentProvider && (
              <p className="text-xs text-gray-500 mt-2">
                {currentProvider.provider === "openai"
                  ? "🔥 OpenAI DALL-E 3 — premium quality"
                  : "✨ Pollinations AI — free, unlimited"}
              </p>
            )}
          </div>

          {/* Options grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            {/* Size */}
            <div>
              <label className="block text-xs font-medium text-gray-400 mb-2 uppercase tracking-wider">Size</label>
              <div className="space-y-2">
                {SIZES.map((s) => (
                  <button key={s.id} onClick={() => setSize(s.id)}
                    className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors
                      ${size === s.id ? "bg-violet-600/20 border border-violet-500/50 text-violet-300" : "bg-gray-800 border border-gray-700 text-gray-300 hover:border-gray-600"}`}>
                    <span>{s.icon}</span> {s.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Quality (only for DALL-E) */}
            <div>
              <label className="block text-xs font-medium text-gray-400 mb-2 uppercase tracking-wider">
                Quality {selectedModel !== "dalle3" && <span className="text-gray-600 normal-case">(DALL-E only)</span>}
              </label>
              <div className="space-y-2">
                {QUALITY.map((q) => (
                  <button key={q.id} onClick={() => setQuality(q.id)}
                    disabled={selectedModel !== "dalle3"}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm transition-colors
                      disabled:opacity-40 disabled:cursor-not-allowed
                      ${quality === q.id && selectedModel === "dalle3" ? "bg-violet-600/20 border border-violet-500/50 text-violet-300" : "bg-gray-800 border border-gray-700 text-gray-300 hover:border-gray-600"}`}>
                    <span>{q.label}</span>
                    <span className="text-xs text-gray-500">{q.cost}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Count */}
            <div>
              <label className="block text-xs font-medium text-gray-400 mb-2 uppercase tracking-wider">Count</label>
              <div className="flex gap-2">
                {[1, 2, 3, 4].map((num) => (
                  <button key={num} onClick={() => setN(num)}
                    className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors
                      ${n === num ? "bg-violet-600 text-white" : "bg-gray-800 text-gray-300 hover:bg-gray-700"}`}>
                    {num}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Generate button */}
          <div className="flex items-center gap-4">
            <button onClick={handleGenerate} disabled={!canGenerate}
              className="flex items-center gap-2 px-6 py-3 bg-violet-600 hover:bg-violet-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold rounded-xl transition-colors">
              {isGenerating ? (
                <><svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/>
                </svg>Generating...</>
              ) : <>✨ Generate {n > 1 ? `${n} images` : "image"}</>}
            </button>
            <span className="text-sm text-gray-400">
              Cost: <strong className="text-violet-400">{creditCost} credit{creditCost !== 1 ? "s" : ""}</strong>
              {" · "}You have: <strong className={(user?.credits ?? 0) < creditCost ? "text-red-400" : "text-gray-200"}>
                {user?.credits ?? 0}
              </strong>
            </span>
          </div>

          {error && (
            <div className="mt-4 p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-sm text-red-400">{error}</div>
          )}
        </div>

        {/* Gallery */}
        {isLoadingHistory && images.length === 0 ? (
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin h-8 w-8 border-2 border-violet-500 border-t-transparent rounded-full" />
          </div>
        ) : images.length === 0 ? (
          <div className="text-center py-20 text-gray-500">
            <p className="text-4xl mb-3">🖼️</p>
            <p>No images yet. Generate your first one above!</p>
          </div>
        ) : (
          <>
            <h2 className="text-xl font-semibold mb-4">Your gallery ({images.length})</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {images.map((img) => (
                <div key={img._id} className="group relative aspect-square rounded-xl overflow-hidden bg-gray-800 cursor-pointer"
                  onClick={() => setLightbox({ id: img._id, url: img.url, prompt: img.prompt })}>
                  <img src={img.url} alt={img.prompt} className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105" loading="lazy" />
                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-between p-3">
                    <button onClick={(e) => { e.stopPropagation(); setDeleteConfirm(img._id); }}
                      className="self-end p-1.5 bg-red-600/80 hover:bg-red-600 rounded-lg text-white text-sm">🗑️</button>
                    <p className="text-xs text-gray-200 line-clamp-2">{img.prompt}</p>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Lightbox */}
      {lightbox && (
        <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-50 p-4" onClick={() => setLightbox(null)}>
          <div className="max-w-3xl w-full" onClick={(e) => e.stopPropagation()}>
            <img src={lightbox.url} alt={lightbox.prompt} className="w-full rounded-2xl shadow-2xl" />
            <div className="mt-4 space-y-2">
              <p className="text-sm text-gray-300"><strong className="text-white">Prompt:</strong> {lightbox.prompt}</p>
              <div className="flex gap-3 mt-4">
                <a href={lightbox.url} download target="_blank" rel="noreferrer"
                  className="px-4 py-2 bg-violet-600 hover:bg-violet-500 text-white text-sm font-medium rounded-xl transition-colors">⬇ Download</a>
                <button onClick={() => setLightbox(null)}
                  className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 text-sm font-medium rounded-xl transition-colors">Close</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete confirm */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 max-w-sm w-full shadow-2xl">
            <h3 className="font-bold text-lg mb-2">Delete image?</h3>
            <p className="text-sm text-gray-400 mb-5">This will permanently remove the image.</p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteConfirm(null)} className="flex-1 py-2.5 bg-gray-800 hover:bg-gray-700 rounded-xl text-sm">Cancel</button>
              <button onClick={() => handleDelete(deleteConfirm)} className="flex-1 py-2.5 bg-red-600 hover:bg-red-500 rounded-xl text-sm">Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}