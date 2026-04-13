/**
 * WalletPage — Dashboard Wallet Page
 * ====================================
 * Full wallet management: Phantom, Backpack, Solflare connection,
 * TWT + SOL balance, airdrop, explorer link, transaction history.
 */
import React, { useState, useEffect, useCallback } from 'react';
import {
  Wallet, Copy, ExternalLink, CheckCircle, X, RefreshCw,
  Download, Zap, Activity, Globe, Shield,
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { Connection, clusterApiUrl, PublicKey, LAMPORTS_PER_SOL } from '@solana/web3.js';
import { getAssociatedTokenAddress, getAccount } from '@solana/spl-token';
import WalletSelector from '../../Components/WalletSelector';
import axiosInstance from '../../Utils/axiosInstance';

const DEVNET_RPC = clusterApiUrl('devnet');
const TOKEN_MINT = 'mntLxYdw5vwVHdigDwzrHEDWRP9ryPZj7pgN86HF5o9';

const shortenAddress = (a) => a ? `${a.slice(0, 8)}…${a.slice(-6)}` : '—';
const fmt = (n, d = 4) => (n === null || n === undefined) ? '—' : Number(n).toLocaleString('en-US', { maximumFractionDigits: d });

// Wallet brand data
const WALLET_BRANDS = {
  phantom:  { name: 'Phantom',  bg: 'from-purple-600 to-indigo-700', emoji: '👻' },
  backpack: { name: 'Backpack', bg: 'from-red-500 to-orange-600',    emoji: '🎒' },
  solflare: { name: 'Solflare', bg: 'from-orange-500 to-amber-500',  emoji: '🌟' },
  manual:   { name: 'Manual',   bg: 'from-gray-600 to-gray-700',     emoji: '🔑' },
};

const WalletPage = () => {
  const [showSelector, setShowSelector]     = useState(false);
  const [walletAddress, setWalletAddress]   = useState(() => localStorage.getItem('vartul_wallet_address') || '');
  const [walletType, setWalletType]         = useState(() => localStorage.getItem('vartul_wallet_type') || '');
  const [solBalance, setSolBalance]         = useState(null);
  const [twtBalance, setTwtBalance]         = useState(null);
  const [balanceLoading, setBalanceLoading] = useState(false);
  const [airdropping, setAirdropping]       = useState(false);
  const [transactions, setTransactions]     = useState([]);
  const [txLoading, setTxLoading]           = useState(false);

  const brand = WALLET_BRANDS[walletType] || WALLET_BRANDS.manual;

  // ── Sync wallet state from localStorage ───────────────────────────────────
  useEffect(() => {
    const sync = () => {
      setWalletAddress(localStorage.getItem('vartul_wallet_address') || '');
      setWalletType(localStorage.getItem('vartul_wallet_type') || '');
    };
    window.addEventListener('vartul_wallet_changed', sync);
    return () => window.removeEventListener('vartul_wallet_changed', sync);
  }, []);

  // ── Fetch on-chain balances ────────────────────────────────────────────────
  const fetchBalances = useCallback(async () => {
    if (!walletAddress) return;
    setBalanceLoading(true);
    try {
      const conn = new Connection(DEVNET_RPC, 'confirmed');
      const pk   = new PublicKey(walletAddress);

      const lamports = await conn.getBalance(pk);
      setSolBalance(lamports / LAMPORTS_PER_SOL);

      try {
        const mint = new PublicKey(TOKEN_MINT);
        const ata  = await getAssociatedTokenAddress(mint, pk);
        const acct = await getAccount(conn, ata);
        setTwtBalance(Number(acct.amount) / 1_000_000);
      } catch {
        setTwtBalance(0);
      }
    } catch (err) {
      toast.error('Failed to fetch balances: ' + err.message);
    } finally {
      setBalanceLoading(false);
    }
  }, [walletAddress]);

  // ── Fetch on-chain transactions ────────────────────────────────────────────
  const fetchTransactions = useCallback(async () => {
    if (!walletAddress) return;
    setTxLoading(true);
    try {
      const { data } = await axiosInstance.get('/api/engagement/transactions?limit=15');
      setTransactions(data.transactions || []);
    } catch {
      setTransactions([]);
    } finally {
      setTxLoading(false);
    }
  }, [walletAddress]);

  useEffect(() => {
    if (walletAddress) {
      fetchBalances();
      fetchTransactions();
    }
  }, [walletAddress, fetchBalances, fetchTransactions]);

  // ── Airdrop ────────────────────────────────────────────────────────────────
  const handleAirdrop = async () => {
    if (!walletAddress) { setShowSelector(true); return; }
    setAirdropping(true);
    try {
      const { data } = await axiosInstance.post('/api/engagement/airdrop', { amount: 100, walletAddress });
      toast.success(`✅ 100 TWT Airdropped! TX: ${data.txSignature?.slice(0, 12)}…`);
      fetchBalances();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Airdrop failed — platform wallet may be low.');
    } finally {
      setAirdropping(false);
    }
  };

  // ── Disconnect ─────────────────────────────────────────────────────────────
  const handleDisconnect = async () => {
    try {
      if (walletType === 'backpack' && window.backpack) await window.backpack.disconnect();
    } catch {}
    localStorage.removeItem('vartul_wallet_address');
    localStorage.removeItem('vartul_wallet_type');
    setWalletAddress('');
    setWalletType('');
    setSolBalance(null);
    setTwtBalance(null);
    setTransactions([]);
    window.dispatchEvent(new Event('vartul_wallet_changed'));
    toast.success('Wallet disconnected');
  };

  const handleConnected = (pk, name) => {
    setWalletAddress(pk);
    setWalletType(name?.toLowerCase() || 'manual');
    window.dispatchEvent(new Event('vartul_wallet_changed'));
  };

  return (
    <div className="space-y-6">
      {/* ── Header ── */}
      <div>
        <h1 className="text-2xl font-bold text-white tracking-tight">Wallet</h1>
        <p className="text-gray-400 text-sm mt-1">Manage your Solana wallet, balances, and transaction history.</p>
      </div>

      {/* ── Not connected ── */}
      {!walletAddress && (
        <div className="relative overflow-hidden rounded-[2rem] bg-gradient-to-br from-purple-900/40 via-indigo-900/30 to-black border border-purple-500/30 p-10 text-center">
          <div className="absolute top-0 right-0 w-96 h-96 bg-purple-500/10 rounded-full blur-[100px] -mr-20 -mt-20 pointer-events-none" />
          <div className="relative z-10">
            <div className="w-20 h-20 bg-purple-500/20 border border-purple-500/30 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <Wallet className="w-10 h-10 text-purple-400" />
            </div>
            <h2 className="text-white font-bold text-2xl mb-3 tracking-tight">Connect Your Wallet</h2>
            <p className="text-gray-400 max-w-md mx-auto mb-8 leading-relaxed">
              Link your Phantom, Backpack, or Solflare wallet to view on-chain balances, earn TWT rewards, and access the full Web3 experience.
            </p>

            {/* 3 wallet options preview */}
            <div className="flex items-center justify-center gap-4 mb-8">
              {[
                { emoji: '👻', label: 'Phantom',  color: 'bg-purple-600' },
                { emoji: '🎒', label: 'Backpack', color: 'bg-red-600' },
                { emoji: '🌟', label: 'Solflare', color: 'bg-orange-500' },
              ].map(w => (
                <div key={w.label} className="flex flex-col items-center gap-2">
                  <div className={`w-14 h-14 rounded-2xl ${w.color} flex items-center justify-center text-2xl shadow-lg`}>
                    {w.emoji}
                  </div>
                  <span className="text-gray-400 text-xs font-medium">{w.label}</span>
                </div>
              ))}
            </div>

            <button
              onClick={() => setShowSelector(true)}
              className="px-10 py-4 bg-white text-indigo-950 rounded-2xl font-bold text-base transition-all hover:scale-105 shadow-[0_0_30px_rgba(255,255,255,0.2)] inline-flex items-center gap-2"
            >
              <Wallet className="w-5 h-5" /> Connect Wallet
            </button>
          </div>
        </div>
      )}

      {/* ── Connected ── */}
      {walletAddress && (
        <>
          {/* Wallet Identity Card */}
          <div className={`relative overflow-hidden bg-gradient-to-br ${brand.bg} rounded-[2rem] p-8 shadow-2xl`}>
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-[80px] -mr-20 -mt-20 pointer-events-none" />
            <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center gap-6">
              {/* Icon */}
              <div className="w-16 h-16 bg-white/10 backdrop-blur-md rounded-2xl flex items-center justify-center text-3xl border border-white/20 shadow-inner flex-shrink-0">
                {brand.emoji}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1.5">
                  <span className="text-white font-bold text-xl tracking-tight">{brand.name}</span>
                  <span className="px-2 py-0.5 bg-white/20 border border-white/30 rounded-full text-xs font-bold text-white uppercase tracking-widest flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    Live
                  </span>
                </div>
                <p className="text-white/60 text-xs font-mono break-all">{walletAddress}</p>
              </div>

              {/* Actions */}
              <div className="flex gap-2 flex-shrink-0">
                <button
                  onClick={() => { navigator.clipboard.writeText(walletAddress); toast.success('Copied!'); }}
                  className="p-3 bg-white/10 hover:bg-white/20 border border-white/20 rounded-xl transition"
                  title="Copy address"
                >
                  <Copy className="w-4 h-4 text-white" />
                </button>
                <a
                  href={`https://explorer.solana.com/address/${walletAddress}?cluster=devnet`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-3 bg-white/10 hover:bg-white/20 border border-white/20 rounded-xl transition"
                  title="View on Explorer"
                >
                  <ExternalLink className="w-4 h-4 text-white" />
                </a>
                <button
                  onClick={handleDisconnect}
                  className="p-3 bg-red-500/20 hover:bg-red-500/30 border border-red-500/30 rounded-xl transition"
                  title="Disconnect"
                >
                  <X className="w-4 h-4 text-red-300" />
                </button>
              </div>
            </div>

            {/* Balance row */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8 pt-8 border-t border-white/20">
              <div>
                <p className="text-white/50 text-[11px] uppercase font-bold tracking-widest mb-1">TWT Balance</p>
                <p className="text-white font-bold text-2xl tracking-tight">{balanceLoading ? '…' : fmt(twtBalance)}</p>
                <p className="text-white/50 text-xs">TWT</p>
              </div>
              <div>
                <p className="text-white/50 text-[11px] uppercase font-bold tracking-widest mb-1">SOL Balance</p>
                <p className="text-white font-bold text-2xl tracking-tight">{balanceLoading ? '…' : fmt(solBalance, 4)}</p>
                <p className="text-white/50 text-xs">SOL</p>
              </div>
              <div>
                <p className="text-white/50 text-[11px] uppercase font-bold tracking-widest mb-1">Network</p>
                <p className="text-white font-bold text-lg tracking-tight flex items-center gap-1.5">
                  <Globe className="w-4 h-4" /> Devnet
                </p>
              </div>
              <div>
                <p className="text-white/50 text-[11px] uppercase font-bold tracking-widest mb-1">Status</p>
                <p className="text-emerald-300 font-bold text-lg flex items-center gap-1.5">
                  <Shield className="w-4 h-4" /> Secured
                </p>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <button
              onClick={handleAirdrop}
              disabled={airdropping}
              className="flex items-center justify-center gap-2.5 py-4 bg-white text-indigo-950 rounded-2xl font-bold text-sm transition-all hover:scale-[1.02] shadow-[0_0_20px_rgba(255,255,255,0.15)] disabled:opacity-60"
            >
              {airdropping ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
              {airdropping ? 'Requesting…' : 'Claim 100 TWT (Devnet)'}
            </button>
            <button
              onClick={fetchBalances}
              disabled={balanceLoading}
              className="flex items-center justify-center gap-2.5 py-4 bg-white/5 border border-white/10 hover:bg-white/10 text-white rounded-2xl font-semibold text-sm transition-all hover:scale-[1.02]"
            >
              <RefreshCw className={`w-4 h-4 ${balanceLoading ? 'animate-spin' : ''}`} />
              Refresh Balances
            </button>
            <a
              href={`https://explorer.solana.com/address/${walletAddress}?cluster=devnet`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2.5 py-4 bg-purple-500/10 border border-purple-500/20 hover:bg-purple-500/20 text-purple-300 rounded-2xl font-semibold text-sm transition-all hover:scale-[1.02]"
            >
              <ExternalLink className="w-4 h-4" /> Solana Explorer
            </a>
          </div>

          {/* Transaction History */}
          <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-[2rem] p-6">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h3 className="text-white font-bold text-lg">Transaction History</h3>
                <p className="text-gray-400 text-xs mt-0.5">On-chain Solana Devnet transactions</p>
              </div>
              <button
                onClick={fetchTransactions}
                disabled={txLoading}
                className="flex items-center gap-1.5 px-3 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-sm text-white transition"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${txLoading ? 'animate-spin' : ''}`} />
                Refresh
              </button>
            </div>

            {txLoading ? (
              <div className="space-y-3">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="h-16 bg-white/5 rounded-2xl animate-pulse" />
                ))}
              </div>
            ) : transactions.length === 0 ? (
              <div className="text-center py-10">
                <Activity className="w-10 h-10 text-gray-600 mx-auto mb-3" />
                <p className="text-gray-400 text-sm">No transactions yet.</p>
                <p className="text-gray-500 text-xs mt-1">Claim devnet TWT to see your first transaction!</p>
              </div>
            ) : (
              <div className="space-y-3">
                {transactions.map((tx, i) => (
                  <div key={tx.signature || i} className="flex items-center gap-4 bg-white/5 hover:bg-white/[0.08] border border-white/10 rounded-2xl p-4 transition group">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${tx.status === 'confirmed' ? 'bg-emerald-500/20 border border-emerald-500/30' : 'bg-red-500/20 border border-red-500/30'}`}>
                      {tx.status === 'confirmed'
                        ? <CheckCircle className="w-5 h-5 text-emerald-400" />
                        : <X className="w-5 h-5 text-red-400" />
                      }
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-white text-sm font-mono truncate">{tx.signature ? shortenAddress(tx.signature) : 'Unknown'}</p>
                      <p className="text-gray-400 text-xs">{tx.blockTime ? new Date(tx.blockTime * 1000).toLocaleString() : 'Unknown time'}</p>
                    </div>
                    <span className={`px-2.5 py-1 rounded-lg text-xs font-bold uppercase tracking-wide ${tx.status === 'confirmed' ? 'bg-emerald-900/40 text-emerald-400 border border-emerald-500/30' : 'bg-red-900/40 text-red-400 border border-red-500/30'}`}>
                      {tx.status}
                    </span>
                    {tx.explorerUrl && (
                      <a href={tx.explorerUrl} target="_blank" rel="noopener noreferrer" className="opacity-0 group-hover:opacity-100 transition p-2 bg-white/5 rounded-xl">
                        <ExternalLink className="w-3.5 h-3.5 text-purple-400" />
                      </a>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Switch wallet */}
          <div className="text-center">
            <button
              onClick={() => setShowSelector(true)}
              className="text-gray-400 hover:text-white text-sm transition inline-flex items-center gap-1.5"
            >
              <Zap className="w-3.5 h-3.5" /> Switch wallet
            </button>
          </div>
        </>
      )}

      {/* WalletSelector modal */}
      <WalletSelector
        isOpen={showSelector}
        onClose={() => setShowSelector(false)}
        onConnected={handleConnected}
      />
    </div>
  );
};

export default WalletPage;
