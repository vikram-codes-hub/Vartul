/**
 * useVartulWallet — Phantom + Backpack + Solflare Wallet Hook
 * =============================================================
 * - Phantom  : via @solana/wallet-adapter-react (standard), also window.solana
 * - Backpack : via window.backpack (Backpack native browser injection)
 * - Solflare : via @solana/wallet-adapter-react (standard)
 * - Manual   : fallback public-key input (for testing)
 */
import { useState, useCallback, useEffect } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { Connection, clusterApiUrl, PublicKey, LAMPORTS_PER_SOL } from "@solana/web3.js";
import { TOKEN_PROGRAM_ID, getAssociatedTokenAddress, getAccount } from "@solana/spl-token";
import axiosInstance from "../Utils/axiosInstance";

const TOKEN_MINT = "mntLxYdw5vwVHdigDwzrHEDWRP9ryPZj7pgN86HF5o9";
const DEVNET_RPC = clusterApiUrl("devnet");

// ── Detect installed wallets ────────────────────────────────────────────────
export const detectWallets = () => {
  const wallets = [];

  if (typeof window !== "undefined") {
    if (window.phantom?.solana?.isPhantom || window.solana?.isPhantom) {
      wallets.push({
        id: "phantom",
        name: "Phantom",
        icon: "https://raw.githubusercontent.com/solana-labs/wallet-adapter/master/packages/wallets/phantom/src/phantom_icon.png",
        iconFallback: "👻",
        installed: true,
        downloadUrl: "https://phantom.app/",
      });
    } else {
      wallets.push({
        id: "phantom",
        name: "Phantom",
        icon: null,
        iconFallback: "👻",
        installed: false,
        downloadUrl: "https://phantom.app/",
      });
    }

    if (window.backpack) {
      wallets.push({
        id: "backpack",
        name: "Backpack",
        icon: "https://lh3.googleusercontent.com/dr7RYakAf1jtv3JHtloTZX7RCilP8dXj2VMfPnvSbEsHqROpvh8QlXmBNqK3SfVp2J3vFPJj=w128-h128-e365-rj-sc0x00ffffff",
        iconFallback: "🎒",
        installed: true,
        downloadUrl: "https://backpack.app/",
      });
    } else {
      wallets.push({
        id: "backpack",
        name: "Backpack",
        icon: null,
        iconFallback: "🎒",
        installed: false,
        downloadUrl: "https://backpack.app/",
      });
    }

    if (window.solflare?.isSolflare) {
      wallets.push({
        id: "solflare",
        name: "Solflare",
        icon: "https://solflare.com/assets/logo.svg",
        iconFallback: "🌟",
        installed: true,
        downloadUrl: "https://solflare.com/",
      });
    } else {
      wallets.push({
        id: "solflare",
        name: "Solflare",
        icon: null,
        iconFallback: "🌟",
        installed: false,
        downloadUrl: "https://solflare.com/",
      });
    }
  }
  return wallets;
};

// ── Main Hook ────────────────────────────────────────────────────────────────
const useVartulWallet = () => {
  const adapter = useWallet(); // from @solana/wallet-adapter-react

  const [manualAddress, setManualAddress]   = useState(() => localStorage.getItem("vartul_wallet_address") || "");
  const [backpackKey, setBackpackKey]       = useState(null);
  const [activeWalletId, setActiveWalletId] = useState(() => localStorage.getItem("vartul_wallet_type") || null);
  const [connecting, setConnecting]         = useState(false);
  const [walletError, setWalletError]       = useState(null);
  const [solBalance, setSolBalance]         = useState(null);
  const [twtBalance, setTwtBalance]         = useState(null);
  const [balanceLoading, setBalanceLoading]  = useState(false);

  // ── Derive publicKey & connected from whichever wallet is active ───────────
  const publicKey = (() => {
    if (activeWalletId === "backpack" && backpackKey) return backpackKey;
    if (activeWalletId === "phantom" || activeWalletId === "solflare") {
      return adapter.publicKey?.toString() || null;
    }
    return manualAddress || null;
  })();

  const connected = !!(publicKey);
  const walletName = (() => {
    if (activeWalletId === "backpack") return "Backpack";
    if (activeWalletId === "phantom") return "Phantom";
    if (activeWalletId === "solflare") return "Solflare";
    if (manualAddress) return "Manual";
    return null;
  })();

  // ── Fetch on-chain balances ────────────────────────────────────────────────
  const fetchBalances = useCallback(async (address) => {
    if (!address) return;
    setBalanceLoading(true);
    try {
      const conn = new Connection(DEVNET_RPC, "confirmed");
      const pk = new PublicKey(address);

      // SOL balance
      const lamports = await conn.getBalance(pk);
      setSolBalance(lamports / LAMPORTS_PER_SOL);

      // TWT SPL token balance
      try {
        const mint = new PublicKey(TOKEN_MINT);
        const ata  = await getAssociatedTokenAddress(mint, pk);
        const acct = await getAccount(conn, ata);
        setTwtBalance(Number(acct.amount) / 1e6);
      } catch {
        setTwtBalance(0);
      }
    } catch (err) {
      console.warn("Balance fetch failed:", err.message);
    } finally {
      setBalanceLoading(false);
    }
  }, []);

  useEffect(() => {
    if (publicKey) fetchBalances(publicKey);
  }, [publicKey, fetchBalances]);

  // ── Connect Phantom / Solflare (via wallet-adapter) ───────────────────────
  const connectAdapter = useCallback(async (walletId) => {
    setConnecting(true);
    setWalletError(null);
    try {
      // Select the correct adapter wallet
      if (walletId === "phantom" && adapter.select) {
        adapter.select("Phantom");
      } else if (walletId === "solflare" && adapter.select) {
        adapter.select("Solflare");
      }
      await adapter.connect();
      setActiveWalletId(walletId);
      localStorage.setItem("vartul_wallet_type", walletId);
      return true;
    } catch (err) {
      setWalletError(err.message || "Connection rejected by wallet");
      return false;
    } finally {
      setConnecting(false);
    }
  }, [adapter]);

  // ── Connect Backpack (window.backpack native API) ─────────────────────────
  const connectBackpack = useCallback(async () => {
    setConnecting(true);
    setWalletError(null);
    try {
      if (!window.backpack) {
        window.open("https://backpack.app/", "_blank");
        throw new Error("Backpack not installed. Opening download page…");
      }
      const response = await window.backpack.connect();
      const pk = response.publicKey.toString();
      setBackpackKey(pk);
      setActiveWalletId("backpack");
      localStorage.setItem("vartul_wallet_type", "backpack");
      localStorage.setItem("vartul_wallet_address", pk);
      return true;
    } catch (err) {
      setWalletError(err.message || "Backpack connection failed");
      return false;
    } finally {
      setConnecting(false);
    }
  }, []);

  // ── Connect any wallet by ID ──────────────────────────────────────────────
  const connectWallet = useCallback(async (walletId) => {
    if (walletId === "backpack") return connectBackpack();
    return connectAdapter(walletId);
  }, [connectAdapter, connectBackpack]);

  // ── Manual address fallback ───────────────────────────────────────────────
  const connectManual = useCallback((address) => {
    if (!address || address.length < 32) {
      setWalletError("Invalid Solana address (must be ≥32 chars)");
      return false;
    }
    setManualAddress(address);
    setActiveWalletId("manual");
    localStorage.setItem("vartul_wallet_address", address);
    localStorage.setItem("vartul_wallet_type", "manual");
    setWalletError(null);
    return true;
  }, []);

  // ── Save wallet to Vartul backend profile ────────────────────────────────
  const saveWalletToProfile = useCallback(async () => {
    if (!publicKey) return { success: false, error: "No wallet connected" };
    try {
      const res = await axiosInstance.post("/api/auth/connect-wallet", { walletAddress: publicKey });
      return { success: true, data: res.data };
    } catch (err) {
      return { success: false, error: err.response?.data?.message || err.message };
    }
  }, [publicKey]);

  // ── Disconnect all ─────────────────────────────────────────────────────────
  const disconnect = useCallback(async () => {
    try {
      if (activeWalletId === "backpack" && window.backpack) {
        await window.backpack.disconnect();
      } else if (adapter.connected) {
        await adapter.disconnect();
      }
    } catch {}
    setBackpackKey(null);
    setManualAddress("");
    setActiveWalletId(null);
    setSolBalance(null);
    setTwtBalance(null);
    localStorage.removeItem("vartul_wallet_type");
    localStorage.removeItem("vartul_wallet_address");
  }, [adapter, activeWalletId]);

  return {
    // State
    publicKey,
    connected,
    walletName,
    activeWalletId,
    connecting,
    walletError,
    solBalance,
    twtBalance,
    balanceLoading,
    // Actions
    connectWallet,
    connectAdapter,
    connectBackpack,
    connectManual,
    saveWalletToProfile,
    disconnect,
    fetchBalances,
    detectWallets,
    // Raw adapter
    adapter,
  };
};

export default useVartulWallet;
