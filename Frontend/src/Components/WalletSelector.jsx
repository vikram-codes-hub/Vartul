/**
 * WalletSelector — Premium Wallet Connection Modal
 * Supports: Phantom · Backpack · Solflare
 * Detection: browser-native (window.phantom / window.backpack / window.solflare)
 */
import React, { useState, useEffect, useCallback } from "react";
import { X, CheckCircle, ExternalLink, Copy, AlertTriangle, Loader2, Wallet, ChevronRight } from "lucide-react";
import { useWallet } from "@solana/wallet-adapter-react";
import { toast } from "react-hot-toast";
import axiosInstance from "../Utils/axiosInstance";
import { Connection, clusterApiUrl, PublicKey, LAMPORTS_PER_SOL } from "@solana/web3.js";

const DEVNET = clusterApiUrl("devnet");
const TOKEN_MINT = "mntLxYdw5vwVHdigDwzrHEDWRP9ryPZj7pgN86HF5o9";

// Wallet definitions
const WALLET_DEFS = [
  {
    id: "phantom",
    name: "Phantom",
    desc: "The friendly Solana wallet",
    icon: (
      <svg viewBox="0 0 128 128" className="w-8 h-8">
        <defs>
          <linearGradient id="ph-grad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#534BB1" />
            <stop offset="100%" stopColor="#551BF9" />
          </linearGradient>
        </defs>
        <rect width="128" height="128" rx="28" fill="url(#ph-grad)" />
        <path
          d="M110.584 64.9142H99.142C99.142 41.7651 80.173 23 56.7724 23C33.3718 23 14.4023 41.9207 14.4023 65.0698C14.4023 88.219 33.3718 107.139 56.7724 107.139C63.5173 107.139 70.0376 105.41 75.8192 102.135C77.0259 101.445 78.503 102.135 78.503 103.53V111.9C78.503 112.867 79.3822 113.643 80.4599 113.643H110.584C111.66 113.643 112.54 112.867 112.54 111.9V66.6572C112.54 65.6908 111.66 64.9142 110.584 64.9142Z"
          fill="white"
          opacity="0.2"
        />
        <path
          d="M56.772 88.65C67.956 88.65 77.023 79.583 77.023 68.399C77.023 57.215 67.956 48.148 56.772 48.148C45.588 48.148 36.521 57.215 36.521 68.399C36.521 79.583 45.588 88.65 56.772 88.65Z"
          fill="white"
        />
      </svg>
    ),
    color: "from-purple-600 to-indigo-700",
    borderColor: "border-purple-500/40",
    hoverBg: "hover:bg-purple-900/20",
    detectFn: () => !!(window.phantom?.solana?.isPhantom || window.solana?.isPhantom),
    downloadUrl: "https://phantom.app/",
    adapterName: "Phantom",
  },
  {
    id: "backpack",
    name: "Backpack",
    desc: "Your xNFT wallet",
    icon: (
      <svg viewBox="0 0 128 128" className="w-8 h-8">
        <rect width="128" height="128" rx="28" fill="#E33E3F" />
        <text x="50%" y="68%" textAnchor="middle" dominantBaseline="middle" fontSize="56" fontWeight="bold" fill="white">🎒</text>
      </svg>
    ),
    color: "from-red-500 to-orange-600",
    borderColor: "border-red-500/40",
    hoverBg: "hover:bg-red-900/20",
    detectFn: () => !!(window.backpack),
    downloadUrl: "https://backpack.app/",
    adapterName: null,
  },
  {
    id: "solflare",
    name: "Solflare",
    desc: "Solana's premier wallet",
    icon: (
      <svg viewBox="0 0 128 128" className="w-8 h-8">
        <defs>
          <linearGradient id="sf-grad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#FC8500" />
            <stop offset="100%" stopColor="#FFB800" />
          </linearGradient>
        </defs>
        <rect width="128" height="128" rx="28" fill="url(#sf-grad)" />
        <text x="50%" y="62%" textAnchor="middle" dominantBaseline="middle" fontSize="64">🌟</text>
      </svg>
    ),
    color: "from-orange-500 to-amber-500",
    borderColor: "border-orange-500/40",
    hoverBg: "hover:bg-orange-900/20",
    detectFn: () => !!(window.solflare?.isSolflare),
    downloadUrl: "https://solflare.com/",
    adapterName: "Solflare",
  },
];

// WalletSelector Modal
const WalletSelector = ({ isOpen, onClose, onConnected }) => {
  const adapter = useWallet();
  const [step, setStep]               = useState("select"); // select | connecting | connected | manual
  const [connecting, setConnecting]   = useState(null);
  const [error, setError]             = useState(null);
  const [connectedKey, setConnectedKey] = useState(null);
  const [connectedName, setConnectedName] = useState(null);
  const [saving, setSaving]           = useState(false);
  const [manualKey, setManualKey]     = useState("");
  const [walletStates, setWalletStates] = useState({});

  // Detect installed wallets on open
  useEffect(() => {
    if (!isOpen) return;
    const states = {};
    WALLET_DEFS.forEach((w) => {
      states[w.id] = w.detectFn();
    });
    setWalletStates(states);
    setStep("select");
    setError(null);
    setConnecting(null);
  }, [isOpen]);

  // Connect Phantom / Solflare via wallet-adapter
  const connectAdapter = useCallback(async (walletDef) => {
    setConnecting(walletDef.id);
    setError(null);
    setStep("connecting");
    try {
      if (adapter.select) adapter.select(walletDef.adapterName);
      // Small timeout to let the adapter UI appear
      await new Promise(r => setTimeout(r, 300));
      await adapter.connect();
      const pk = adapter.publicKey?.toString();
      if (!pk) throw new Error("No public key returned");
      setConnectedKey(pk);
      setConnectedName(walletDef.name);
      localStorage.setItem("vartul_wallet_type", walletDef.id);
      localStorage.setItem("vartul_wallet_address", pk);
      setStep("connected");
    } catch (err) {
      setError(err.message || "Connection rejected");
      setStep("select");
    } finally {
      setConnecting(null);
    }
  }, [adapter]);

  // Connect Backpack via window.backpack
  const connectBackpack = useCallback(async () => {
    if (!window.backpack) {
      window.open("https://backpack.app/", "_blank");
      setError("Backpack not installed. Install from backpack.app and try again.");
      return;
    }
    setConnecting("backpack");
    setError(null);
    setStep("connecting");
    try {
      const resp = await window.backpack.connect();
      const pk   = resp.publicKey.toString();
      setConnectedKey(pk);
      setConnectedName("Backpack");
      localStorage.setItem("vartul_wallet_type", "backpack");
      localStorage.setItem("vartul_wallet_address", pk);
      setStep("connected");
    } catch (err) {
      setError(err.message || "Backpack connection failed");
      setStep("select");
    } finally {
      setConnecting(null);
    }
  }, []);

  const handleConnect = useCallback((walletDef) => {
    if (walletDef.id === "backpack") return connectBackpack();
    return connectAdapter(walletDef);
  }, [connectAdapter, connectBackpack]);

  // Save to Vartul profile
  const handleSave = async () => {
    setSaving(true);
    try {
      await axiosInstance.post("/api/auth/connect-wallet", { walletAddress: connectedKey });
      toast.success("✅ Wallet linked to your profile!");
      onConnected?.(connectedKey, connectedName);
      onClose?.();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to save wallet");
    } finally {
      setSaving(false);
    }
  };

  // Manual connect
  const handleManual = () => {
    if (!manualKey || manualKey.length < 32) {
      setError("Invalid Solana address — must be at least 32 characters.");
      return;
    }
    setConnectedKey(manualKey);
    setConnectedName("Manual");
    localStorage.setItem("vartul_wallet_type", "manual");
    localStorage.setItem("vartul_wallet_address", manualKey);
    setStep("connected");
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/80 backdrop-blur-md"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative w-full max-w-md z-10">
        {/* Glow */}
        <div className="absolute inset-0 bg-gradient-to-br from-purple-600/20 to-indigo-600/20 rounded-3xl blur-xl" />

        <div className="relative bg-gray-950 border border-white/10 rounded-3xl overflow-hidden shadow-2xl">
          {/* Header */}
          <div className="bg-gradient-to-r from-purple-900/50 to-indigo-900/30 border-b border-white/10 p-6 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center">
                <Wallet className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="text-white font-bold text-lg">Connect Wallet</h2>
                <p className="text-gray-400 text-xs">Choose your Solana wallet</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center transition-colors"
            >
              <X className="w-4 h-4 text-gray-400" />
            </button>
          </div>

          <div className="p-6">
            {/* Connecting state */}
            {step === "connecting" && (
              <div className="flex flex-col items-center py-10 gap-4">
                <div className="relative">
                  <div className="w-20 h-20 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center">
                    <Loader2 className="w-8 h-8 text-purple-400 animate-spin" />
                  </div>
                </div>
                <p className="text-white font-semibold">Waiting for approval…</p>
                <p className="text-gray-400 text-sm text-center">
                  Check your {connecting === "backpack" ? "Backpack" : connecting === "phantom" ? "Phantom" : "Solflare"} wallet extension to approve the connection.
                </p>
              </div>
            )}

            {/* Connected state */}
            {step === "connected" && connectedKey && (
              <div className="space-y-5">
                <div className="flex items-center gap-3 bg-emerald-900/20 border border-emerald-500/30 rounded-2xl p-4">
                  <div className="w-10 h-10 rounded-xl bg-emerald-500/20 flex items-center justify-center flex-shrink-0">
                    <CheckCircle className="w-5 h-5 text-emerald-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-emerald-300 text-sm font-semibold">{connectedName} Connected!</p>
                    <p className="text-emerald-200/60 text-xs font-mono truncate">{connectedKey}</p>
                  </div>
                  <button
                    onClick={() => { navigator.clipboard.writeText(connectedKey); toast.success("Copied!"); }}
                    className="text-gray-400 hover:text-white transition flex-shrink-0"
                  >
                    <Copy className="w-4 h-4" />
                  </button>
                </div>

                <p className="text-gray-400 text-sm text-center">
                  Save this wallet to your Vartul profile to earn TWT rewards on-chain.
                </p>

                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="w-full py-4 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white rounded-xl font-bold transition-all hover:scale-[1.02] disabled:opacity-60 flex items-center justify-center gap-2"
                >
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : "🔗"}{" "}
                  {saving ? "Saving…" : "Link to Vartul Profile"}
                </button>

                <button
                  onClick={() => { setStep("select"); setConnectedKey(null); }}
                  className="w-full py-2.5 text-gray-400 hover:text-white text-sm transition text-center"
                >
                  ← Choose a different wallet
                </button>
              </div>
            )}

            {/* Select state */}
            {step === "select" && (
              <div className="space-y-4">
                {error && (
                  <div className="flex items-start gap-3 bg-red-900/20 border border-red-500/30 rounded-xl p-3">
                    <AlertTriangle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
                    <p className="text-red-300 text-xs">{error}</p>
                  </div>
                )}

                {/* Wallet options */}
                <div className="space-y-3">
                  {WALLET_DEFS.map((wallet) => {
                    const installed = walletStates[wallet.id];
                    return (
                      <button
                        key={wallet.id}
                        onClick={() => installed ? handleConnect(wallet) : window.open(wallet.downloadUrl, "_blank")}
                        disabled={connecting !== null}
                        className={`w-full flex items-center gap-4 p-4 rounded-2xl border transition-all group relative overflow-hidden
                          ${installed
                            ? `bg-white/5 ${wallet.borderColor} ${wallet.hoverBg} hover:border-opacity-80`
                            : "bg-white/[0.02] border-white/5 opacity-60"
                          }
                          ${connecting !== null ? "pointer-events-none" : ""}
                        `}
                      >
                        {/* Glow on hover */}
                        <div className={`absolute inset-0 bg-gradient-to-r ${wallet.color} opacity-0 group-hover:opacity-5 transition-opacity`} />

                        {/* Icon */}
                        <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${wallet.color} p-0.5 flex-shrink-0`}>
                          <div className="w-full h-full rounded-[10px] overflow-hidden bg-black/20 flex items-center justify-center">
                            {wallet.icon}
                          </div>
                        </div>

                        {/* Text */}
                        <div className="flex-1 text-left">
                          <div className="flex items-center gap-2">
                            <span className="text-white font-semibold text-sm">{wallet.name}</span>
                            {installed && (
                              <span className="px-2 py-0.5 bg-emerald-500/20 border border-emerald-500/30 rounded-full text-[10px] text-emerald-400 font-bold uppercase tracking-wide">
                                Detected
                              </span>
                            )}
                            {!installed && (
                              <span className="px-2 py-0.5 bg-white/5 border border-white/10 rounded-full text-[10px] text-gray-500 font-bold uppercase tracking-wide">
                                Install
                              </span>
                            )}
                          </div>
                          <p className="text-gray-400 text-xs mt-0.5">{wallet.desc}</p>
                        </div>

                        {/* Arrow */}
                        <div className="flex-shrink-0">
                          {connecting === wallet.id ? (
                            <Loader2 className="w-5 h-5 text-purple-400 animate-spin" />
                          ) : installed ? (
                            <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-white group-hover:translate-x-0.5 transition-all" />
                          ) : (
                            <ExternalLink className="w-4 h-4 text-gray-500" />
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>

                {/* Divider */}
                <div className="flex items-center gap-3 py-1">
                  <div className="flex-1 h-px bg-white/10" />
                  <span className="text-gray-500 text-xs font-medium">or enter address manually</span>
                  <div className="flex-1 h-px bg-white/10" />
                </div>

                {/* Manual entry */}
                {step === "manual" || true ? (
                  <div className="space-y-2">
                    <input
                      type="text"
                      value={manualKey}
                      onChange={(e) => setManualKey(e.target.value)}
                      placeholder="Solana wallet address (Base58)…"
                      className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white text-xs font-mono placeholder-gray-600 focus:outline-none focus:ring-1 focus:ring-purple-500 transition"
                    />
                    <button
                      onClick={handleManual}
                      disabled={!manualKey.trim()}
                      className="w-full py-3 bg-white/5 hover:bg-white/10 border border-white/10 text-white text-sm font-semibold rounded-xl transition disabled:opacity-40"
                    >
                      Use This Address
                    </button>
                  </div>
                ) : null}

                {/* Footer */}
                <p className="text-center text-gray-600 text-xs leading-relaxed pt-1">
                  By connecting, you agree that this wallet is for Solana Devnet use only.{" "}
                  <a href="https://phantom.app" target="_blank" rel="noopener noreferrer" className="text-purple-500 hover:underline">
                    Get Phantom ↗
                  </a>
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default WalletSelector;
