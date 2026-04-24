/**
 * WalletConnect — Compact wallet connect trigger & status display
 * Uses WalletSelector modal for the actual connection flow.
 */
import React, { useState, useEffect } from "react";
import { Wallet, CheckCircle, Copy, ExternalLink, X } from "lucide-react";
import { toast } from "react-hot-toast";
import WalletSelector from "./WalletSelector";
import axiosInstance from "../Utils/axiosInstance";

const shortenKey = (k) => k ? `${k.slice(0, 6)}…${k.slice(-4)}` : "";

const WalletConnect = ({ onConnected, compact = false }) => {
  const [showModal, setShowModal]       = useState(false);
  const [walletAddress, setWalletAddress] = useState(
    () => localStorage.getItem("vartul_wallet_address") || ""
  );
  const [walletName, setWalletName] = useState(
    () => localStorage.getItem("vartul_wallet_type") || ""
  );

  useEffect(() => {
    const handler = () => {
      setWalletAddress(localStorage.getItem("vartul_wallet_address") || "");
      setWalletName(localStorage.getItem("vartul_wallet_type") || "");
    };
    window.addEventListener("vartul_wallet_changed", handler);
    return () => window.removeEventListener("vartul_wallet_changed", handler);
  }, []);

  const handleConnected = (publicKey, name) => {
    setWalletAddress(publicKey);
    setWalletName(name);
    localStorage.setItem("vartul_wallet_address", publicKey);
    localStorage.setItem("vartul_wallet_type", name);
    window.dispatchEvent(new Event("vartul_wallet_changed"));
    onConnected?.(publicKey);
  };

  const handleDisconnect = async () => {
    try {
      if (window.backpack?.disconnect) await window.backpack.disconnect();
    } catch {}
    localStorage.removeItem("vartul_wallet_address");
    localStorage.removeItem("vartul_wallet_type");
    setWalletAddress("");
    setWalletName("");
    window.dispatchEvent(new Event("vartul_wallet_changed"));
    toast.success("Wallet disconnected");
  };

  if (walletAddress) {
    // Connected state
    return (
      <div className={`bg-gradient-to-r from-emerald-900/30 to-green-900/20 border border-emerald-500/30 rounded-2xl ${compact ? "p-4" : "p-5"} space-y-3`}>
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center flex-shrink-0">
              <CheckCircle className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="min-w-0">
              <p className="text-emerald-300 font-semibold text-sm capitalize">{walletName || "Wallet"} Connected</p>
              <p className="text-emerald-200/60 text-xs font-mono truncate">{shortenKey(walletAddress)}</p>
            </div>
          </div>
          <div className="flex items-center gap-1.5 flex-shrink-0">
            <button
              onClick={() => { navigator.clipboard.writeText(walletAddress); toast.success("Copied!"); }}
              className="w-8 h-8 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center transition"
            >
              <Copy className="w-3.5 h-3.5 text-gray-400 hover:text-white" />
            </button>
            <a
              href={`https://explorer.solana.com/address/${walletAddress}?cluster=devnet`}
              target="_blank"
              rel="noopener noreferrer"
              className="w-8 h-8 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center transition"
            >
              <ExternalLink className="w-3.5 h-3.5 text-purple-400" />
            </a>
            <button
              onClick={handleDisconnect}
              className="w-8 h-8 rounded-lg bg-red-900/20 hover:bg-red-900/40 border border-red-500/20 flex items-center justify-center transition"
              title="Disconnect"
            >
              <X className="w-3.5 h-3.5 text-red-400" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Not connected state
  return (
    <>
      <div className={`bg-white/5 border border-white/10 rounded-2xl ${compact ? "p-4" : "p-5"} space-y-3`}>
        <div className="flex items-center gap-3 mb-2">
          <div className="w-9 h-9 rounded-xl bg-purple-500/20 flex items-center justify-center">
            <Wallet className="w-4 h-4 text-purple-400" />
          </div>
          <div>
            <p className="text-white font-semibold text-sm">Solana Wallet</p>
            <p className="text-gray-400 text-xs">Connect to earn TWT rewards</p>
          </div>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="w-full py-3 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-sm font-bold rounded-xl transition-all hover:scale-[1.02] flex items-center justify-center gap-2 shadow-lg"
        >
          <Wallet className="w-4 h-4" /> Connect Wallet
        </button>
        <p className="text-gray-600 text-xs text-center">
          Supports Phantom, Backpack, Solflare
        </p>
      </div>

      <WalletSelector
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        onConnected={handleConnected}
      />
    </>
  );
};

export default WalletConnect;
