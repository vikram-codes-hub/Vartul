import React, { useState, useEffect, useCallback, useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Wallet, TrendingUp, Gift, Clock, ArrowUpRight, Award,
  AlertTriangle, Bell, X, Copy, ExternalLink, Zap,
  RefreshCw, CheckCircle, Coins, Activity, ChevronRight, Download
} from 'lucide-react';
import { Doughnut } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
import { toast } from 'react-hot-toast';

import MarketplaceSection from '../Components/Marketplace/MarketplaceSection';
import useEngagementStatus from '../hooks/useEngagementStatus';
import EngagementStakeModal from '../Components/Reels/EngagementStakeModal';
import WalletSelector from '../Components/WalletSelector';
import { fetchTokenInfo, fetchWalletTransactions, requestAirdrop } from '../api/token.api';
import { Usercontext } from '../Context/Usercontext';
import IVTGBanner from '../Components/IVTGBanner';

ChartJS.register(ArcElement, Tooltip, Legend);

// ── Constants ─────────────────────────────────────────────────────────────
const TOKEN_MINT = 'GwT16b6nPp9t793ba875QJ9QSyGgzA8yhQstz2UzetC8';
const DEVNET_EXPLORER = `https://explorer.solana.com/address/${TOKEN_MINT}?cluster=custom&customUrl=http://localhost:8899`;

// ── Helpers ───────────────────────────────────────────────────────────────
const formatTWT = (amount) => {
  if (amount === undefined || amount === null) return '0.00';
  return Number(amount).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
};
const shortenAddress = (addr) => (addr ? `${addr.slice(0, 6)}…${addr.slice(-4)}` : '');

export default function Twt_Token() {
  const navigate = useNavigate();
  const { authuser } = useContext(Usercontext);
  const engagement = useEngagementStatus();

  // State
  const [activeTab, setActiveTab] = useState('overview');
  const [isStakeModalOpen, setIsStakeModalOpen] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showWalletSelector, setShowWalletSelector] = useState(false);
  const [localWalletAddress, setLocalWalletAddress] = useState(
    () => localStorage.getItem('vartul_wallet_address') || ''
  );

  // Token Data
  const [tokenInfo, setTokenInfo] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [loadingTx, setLoadingTx] = useState(false);
  const [airdropping, setAirdropping] = useState(false);

  // Load basic token info
  useEffect(() => {
    fetchTokenInfo()
      .then((res) => setTokenInfo(res.data))
      .catch((err) => console.log('Failed to fetch token config', err));
  }, []);

  const loadTransactions = useCallback(async () => {
    if (!localWalletAddress) return;
    setLoadingTx(true);
    try {
      // Backend reads wallet from auth session; limit = 10
      const data = await fetchWalletTransactions(10);
      setTransactions(data?.transactions || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingTx(false);
    }
  }, [localWalletAddress]);

  useEffect(() => {
    if (activeTab === 'transactions' && localWalletAddress) {
      loadTransactions();
    }
  }, [activeTab, localWalletAddress, loadTransactions]);

  const copyToClipboard = (text, msg) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    toast.success(msg || 'Copied to clipboard!');
  };

  const handleAirdrop = async () => {
    if (!localWalletAddress) {
      toast.error('Connect wallet first');
      return;
    }
    setAirdropping(true);
    try {
      // requestAirdrop already returns res.data (the JSON body)
      const data = await requestAirdrop(localWalletAddress, 100);
      const txShort = shortenAddress(data.signature);
      const isOnChain = data.onChain;
      toast.success(
        isOnChain
          ? `✅ 100 TWT sent on-chain! TX: ${txShort}`
          : `✅ 100 TWT credited to your account! (${txShort})`
      );
      // Refresh balance so the UI updates immediately
      engagement.refreshStatus();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Airdrop failed');
    } finally {
      setAirdropping(false);
    }
  };

  const chartData = {
    labels: ['Circulating', 'Staked', 'Locked'],
    datasets: [{
      data: [60, 25, 15],
      backgroundColor: ['#A855F7', '#3B82F6', '#10B981'],
      borderWidth: 0,
      hoverOffset: 4
    }]
  };

  const chartOptions = {
    cutout: '75%',
    plugins: {
      legend: { display: false },
      tooltip: { backgroundColor: 'rgba(0,0,0,0.8)', padding: 12, cornerRadius: 8 }
    }
  };

  return (
    <div className="min-h-screen bg-[#020205] text-white">
      {/* ── Header ── */}
      <div className="sticky top-0 z-40 bg-[#020205]/80 backdrop-blur-xl border-b border-white/5">
        <div className="max-w-[1400px] mx-auto px-4 md:px-8 h-20 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-purple-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-purple-500/20">
              <Coins className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl md:text-2xl font-bold tracking-tight text-white flex items-center gap-2">
                TWT Token
                <span className="px-2 py-0.5 rounded-full bg-purple-500/10 border border-purple-500/20 text-[10px] text-purple-400 font-bold uppercase tracking-wider">
                  Devnet
                </span>
              </h1>
              <p className="text-gray-400 text-sm hidden md:block">Vartul's Native Engagement Token</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="hidden md:flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/10 rounded-xl font-mono text-sm text-gray-300">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              1 TWT = $0.05
            </div>
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className="relative w-10 h-10 rounded-xl bg-white/5 hover:bg-white/10 flex items-center justify-center transition"
            >
              <Bell className="w-5 h-5 text-gray-400" />
              <div className="absolute top-2.5 right-2.5 w-2 h-2 bg-red-500 rounded-full border-2 border-[#020205]" />
            </button>
            <button
              onClick={() => navigate('/dashboard/wallet')}
              className="hidden sm:flex items-center gap-2 px-5 py-2.5 bg-white text-indigo-950 rounded-xl text-sm font-bold transition hover:scale-105"
            >
              Dashboard
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-[1400px] mx-auto px-4 md:px-8 py-8">
        {/* Banner */}
        <IVTGBanner />

        {/* ── Layout Grid ── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mt-8">
          {/* Main Content (Left, 2/3) */}
          <div className="lg:col-span-2 space-y-8">
            {/* Tabs */}
            <div className="flex items-center gap-2 p-1.5 bg-white/5 rounded-2xl border border-white/5 w-fit">
              {[
                { id: 'overview', icon: <TrendingUp className="w-4 h-4" />, label: 'Overview' },
                { id: 'transactions', icon: <Activity className="w-4 h-4" />, label: 'Transactions' },
              ].map(t => (
                <button
                  key={t.id}
                  onClick={() => setActiveTab(t.id)}
                  className={`flex items-center gap-2 px-6 py-2.5 rounded-xl font-semibold text-sm transition-all ${
                    activeTab === t.id
                      ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-lg'
                      : 'text-gray-400 hover:text-white hover:bg-white/5'
                  }`}
                >
                  {t.icon} {t.label}
                </button>
              ))}
            </div>

            {/* Overview Tab */}
            {activeTab === 'overview' && (
              <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                {/* Wallet Action needed */}
                {!localWalletAddress && (
                  <div className="rounded-2xl bg-gradient-to-r from-purple-900/40 to-pink-900/40 border border-purple-500/30 p-6">
                    <div className="flex items-start gap-4">
                      <div className="w-10 h-10 rounded-xl bg-purple-500/20 flex items-center justify-center flex-shrink-0">
                        <Wallet className="w-5 h-5 text-purple-400" />
                      </div>
                      <div className="flex-1">
                        <h3 className="text-white font-semibold mb-1">Connect Your Solana Wallet</h3>
                        <p className="text-gray-400 text-sm mb-4 leading-relaxed">
                          Link your Phantom, Backpack, or Solflare wallet to receive real TWT on-chain and participate in the reward system.
                        </p>
                        <div className="flex items-center gap-3 mb-4">
                          {[{e:'👻',c:'bg-purple-600',n:'Phantom'},{e:'🎒',c:'bg-red-600',n:'Backpack'},{e:'🌟',c:'bg-orange-500',n:'Solflare'}].map(w=>(
                            <div key={w.n} className="flex flex-col items-center gap-1.5">
                              <div className={`w-10 h-10 rounded-xl ${w.c} flex items-center justify-center text-base shadow-md`}>{w.e}</div>
                              <span className="text-gray-500 text-[10px] font-medium">{w.n}</span>
                            </div>
                          ))}
                        </div>
                        <button
                          onClick={() => setShowWalletSelector(true)}
                          className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 rounded-xl text-white text-sm font-semibold transition-all hover:scale-105 shadow-lg"
                        >
                          <Wallet className="w-4 h-4" /> Connect Wallet
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* Big Stats */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="relative overflow-hidden group bg-gradient-to-b from-white/[0.08] to-transparent border border-white/10 rounded-3xl p-6 backdrop-blur-xl">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-full blur-2xl -mr-10 -mt-10" />
                    <div className="flex items-center gap-4 mb-6">
                      <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 flex items-center justify-center border border-emerald-500/30">
                        <Coins className="w-6 h-6 text-emerald-400" />
                      </div>
                      <span className="text-gray-300 font-semibold tracking-wide">Total TWT Balance</span>
                    </div>
                    <div className="text-4xl font-bold text-white mb-2 tracking-tight">
                      {engagement.loading ? '…' : formatTWT(engagement.twtBalance)}
                    </div>
                    <div className="text-emerald-400 flex items-center justify-between">
                      <span className="text-sm font-medium">TWT</span>
                      {engagement.onChain && (
                        <span className="px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-xs flex items-center gap-1.5">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" /> On-chain
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="relative overflow-hidden group bg-gradient-to-b from-white/[0.08] to-transparent border border-white/10 rounded-3xl p-6 backdrop-blur-xl">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 rounded-full blur-2xl -mr-10 -mt-10" />
                    <div className="flex items-center gap-4 mb-6">
                      <div className="w-12 h-12 rounded-2xl bg-indigo-500/20 flex items-center justify-center border border-indigo-500/30">
                        <TrendingUp className="w-6 h-6 text-indigo-400" />
                      </div>
                      <span className="text-gray-300 font-semibold tracking-wide">Staked TWT</span>
                    </div>
                    <div className="text-4xl font-bold text-indigo-300 mb-2 tracking-tight">
                      {engagement.loading ? '—' : formatTWT(engagement.staked)}
                    </div>
                    <div className="text-gray-500 text-sm">Locked in engagement pool</div>
                  </div>
                </div>

                {/* Connected Info Panel */}
                {localWalletAddress && (
                  <div className="relative bg-white/5 backdrop-blur-md rounded-3xl border border-white/10 p-6 md:p-8 mt-4 overflow-hidden">
                    <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-purple-500/10 rounded-full blur-[100px] -mr-40 -mt-40 pointer-events-none" />
                    <h3 className="text-white font-bold text-lg mb-4 flex items-center justify-between">
                      <span className="flex items-center gap-2">
                        <div className="p-1.5 bg-emerald-500/20 rounded-full border border-emerald-500/30">
                          <CheckCircle className="w-4 h-4 text-emerald-400" />
                        </div>
                        Connected Wallet
                      </span>
                      <div className="flex items-center gap-2">
                        {['👻','🎒','🌟'].map((e, i) => (
                          <span key={i} className="w-7 h-7 flex items-center justify-center rounded-lg bg-white/5 border border-white/10 text-sm">{e}</span>
                        ))}
                      </div>
                    </h3>
                    <div className="flex flex-col md:flex-row items-center gap-4">
                      <div className="flex-1 font-mono text-indigo-200 text-sm bg-black/40 rounded-2xl px-5 py-4 border border-white/10 w-full break-all shadow-inner">
                        {localWalletAddress}
                      </div>
                      <div className="flex gap-3 w-full md:w-auto">
                        <button onClick={() => copyToClipboard(localWalletAddress, 'Copied!')} className="p-4 bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl transition-all">
                          <Copy className="w-5 h-5 text-gray-400" />
                        </button>
                        <a href={`https://explorer.solana.com/address/${localWalletAddress}?cluster=devnet`} target="_blank" rel="noopener noreferrer" className="p-4 bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl transition-all">
                          <ExternalLink className="w-5 h-5 text-purple-400" />
                        </a>
                      </div>
                    </div>

                    <div className="mt-8 flex flex-col md:flex-row items-center gap-4 pt-6 border-t border-white/10">
                      <button
                        onClick={handleAirdrop}
                        disabled={airdropping}
                        className="flex justify-center items-center gap-2 px-8 py-4 bg-white text-indigo-950 rounded-2xl font-bold transition-all disabled:opacity-50 lg:w-fit"
                      >
                        {airdropping ? <RefreshCw className="w-5 h-5 animate-spin" /> : <Download className="w-5 h-5" />}
                        Claim 100 TWT (Devnet)
                      </button>
                      <button onClick={() => setShowWalletSelector(true)} className="text-gray-400 hover:text-white text-sm transition">
                        Switch wallet
                      </button>
                    </div>
                  </div>
                )}

                <MarketplaceSection />
              </div>
            )}

            {/* Transactions Tab */}
            {activeTab === 'transactions' && (
              <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-bold text-white flex items-center gap-2">
                    <Activity className="w-5 h-5 text-purple-400" /> Recent Transfers
                  </h3>
                  <button onClick={loadTransactions} disabled={loadingTx} className="p-2 bg-white/5 hover:bg-white/10 rounded-lg text-gray-400 transition">
                    <RefreshCw className={`w-4 h-4 ${loadingTx ? 'animate-spin' : ''}`} />
                  </button>
                </div>
                {!localWalletAddress ? (
                  <div className="text-center py-12 bg-white/5 rounded-3xl border border-white/10 backdrop-blur-sm">
                    <Wallet className="w-12 h-12 text-gray-600 mx-auto mb-4" />
                    <p className="text-gray-400 font-medium heading-font">Connect your wallet to view transactions.</p>
                  </div>
                ) : transactions.length === 0 && !loadingTx ? (
                  <div className="text-center py-12 bg-white/5 rounded-3xl border border-white/10">
                    <Activity className="w-12 h-12 text-gray-600 mx-auto mb-4" />
                    <p className="text-gray-400">No recent transactions found.</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {transactions.map((tx, idx) => (
                      <div key={idx} className="flex items-center gap-4 p-4 rounded-2xl bg-white/5 hover:bg-white/[0.08] transition border border-white/10">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${tx.status === 'confirmed' ? 'bg-emerald-500/20 border border-emerald-500/30' : 'bg-red-500/20 border border-red-500/30'}`}>
                          {tx.status === 'confirmed' ? <CheckCircle className="w-5 h-5 text-emerald-400" /> : <X className="w-5 h-5 text-red-400" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-white text-sm font-mono truncate">{tx.signature ? shortenAddress(tx.signature) : 'Unknown Tx'}</p>
                          <p className="text-gray-400 text-xs">{tx.blockTime ? new Date(tx.blockTime * 1000).toLocaleString() : 'Recent'}</p>
                        </div>
                        <span className={`px-2 py-1 rounded-md text-[10px] uppercase font-bold tracking-wider ${tx.status === 'confirmed' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'}`}>
                          {tx.status}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Right Sidebar (1/3) */}
          <div className="space-y-6">
            {/* Quick Stake CTA */}
            <div className="bg-gradient-to-br from-indigo-900 via-purple-900 to-[#1e1a38] rounded-3xl p-6 border border-purple-500/30 shadow-xl overflow-hidden relative">
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl -mr-10 -mt-10" />
              <div className="relative z-10">
                <h3 className="text-white font-bold text-lg mb-2 flex items-center gap-2">
                  <Zap className="w-5 h-5 text-yellow-400" /> Stake & Earn
                </h3>
                <p className="text-indigo-200 text-sm mb-6 leading-relaxed">
                  Lock your TWT to boost your creator tier and earn daily yields from the engagement pool.
                </p>
                <div className="space-y-4 mb-6">
                  <div className="flex justify-between items-center bg-black/30 rounded-xl p-3 border border-white/5">
                    <span className="text-indigo-300 text-xs">Unstaked</span>
                    <span className="text-white font-bold">{formatTWT(engagement.available)} <span className="text-xs text-indigo-400">TWT</span></span>
                  </div>
                </div>
                <button
                  onClick={() => setIsStakeModalOpen(true)}
                  className="w-full py-3.5 bg-white text-indigo-950 rounded-xl font-bold transition hover:scale-105 shadow-[0_0_20px_rgba(255,255,255,0.2)]"
                >
                  Stake Tokens Now
                </button>
              </div>
            </div>

            {/* Wallet Info Widget */}
            {localWalletAddress ? (
              <div className="bg-white/5 rounded-3xl border border-white/10 p-5 backdrop-blur-xl">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
                      <Wallet className="w-4 h-4 text-emerald-400" />
                    </div>
                    <h3 className="font-bold text-white text-sm">Web3 Wallet</h3>
                  </div>
                  <span className="text-emerald-400 text-xs font-bold uppercase tracking-wider flex items-center gap-1 bg-emerald-500/10 px-2 py-1 rounded-md border border-emerald-500/20">
                    <CheckCircle className="w-3 h-3" /> Connected
                  </span>
                </div>
                <div className="font-mono text-xs text-indigo-300 bg-black/50 rounded-xl p-3 border border-white/5 break-all mb-4 shadow-inner">
                  {localWalletAddress}
                </div>
                <div className="flex gap-2">
                  <button onClick={() => copyToClipboard(localWalletAddress)} className="flex-1 flex justify-center py-2.5 bg-white/5 hover:bg-white/10 rounded-xl text-xs font-medium transition text-gray-300">
                    <Copy className="w-3.5 h-3.5 mr-1.5" /> Copy
                  </button>
                  <a href={`https://explorer.solana.com/address/${localWalletAddress}?cluster=devnet`} target="_blank" rel="noopener noreferrer" className="flex-1 flex justify-center items-center py-2.5 bg-purple-500/10 hover:bg-purple-500/20 rounded-xl text-xs font-medium transition text-purple-300">
                    <ExternalLink className="w-3.5 h-3.5 mr-1.5" /> Explorer
                  </a>
                </div>
                <button
                  onClick={() => setShowWalletSelector(true)}
                  className="w-full mt-2 py-2 text-gray-500 hover:text-gray-300 text-xs transition"
                >
                  Switch wallet
                </button>
              </div>
            ) : (
              <div className="bg-white/5 rounded-3xl border border-white/10 p-5 pt-8 pb-8 text-center backdrop-blur-xl">
                 <Wallet className="w-10 h-10 text-gray-500 mx-auto mb-3" />
                 <p className="text-gray-300 font-medium text-sm mb-4">Wallet Disconnected</p>
                 <button onClick={() => setShowWalletSelector(true)} className="w-full py-3 bg-white/10 hover:bg-white/20 rounded-xl text-sm font-semibold text-white transition">
                   Connect a Wallet
                 </button>
              </div>
            )}

            {/* Rewards Summary */}
            <div className="bg-white/5 rounded-3xl border border-white/10 p-6 backdrop-blur-xl">
              <div className="flex items-center gap-3 mb-5">
                <div className="p-2 bg-amber-500/20 rounded-lg border border-amber-500/30">
                  <Gift className="w-4 h-4 text-amber-400" />
                </div>
                <h3 className="font-bold text-white">Daily Performance</h3>
              </div>
              <div className="space-y-4">
                <div className="flex justify-between pb-3 border-b border-white/5">
                  <span className="text-gray-400 text-sm">Lifetime Yields</span>
                  <span className="text-amber-400 font-bold">{formatTWT(engagement.totalRewardsEarned)}</span>
                </div>
                <div className="flex justify-between pb-3 border-b border-white/5">
                  <span className="text-gray-400 text-sm">Today</span>
                  <span className="text-white font-bold">+{formatTWT(engagement.pendingRewards)}</span>
                </div>
              </div>
            </div>

            {/* Token Analytics */}
            <div className="bg-[#0b0819] rounded-3xl border border-white/5 p-6 shadow-inner">
              <div className="flex justify-between items-center mb-6">
                <h3 className="font-bold text-white flex items-center gap-2">
                  <Activity className="w-4 h-4 text-purple-400" /> Network Tokenomics
                </h3>
              </div>
              <div className="w-full aspect-square max-h-48 mb-6 relative flex justify-center">
                <Doughnut data={chartData} options={chartOptions} />
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                  <span className="text-gray-400 text-xs">Total</span>
                  <span className="text-white font-bold text-lg">1B</span>
                </div>
              </div>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between pb-2 border-b border-purple-500/10">
                  <span className="text-purple-200/50">Mint Address</span>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs text-purple-300">{shortenAddress(TOKEN_MINT)}</span>
                    <button onClick={() => copyToClipboard(TOKEN_MINT)}><Copy className="w-3 h-3 text-purple-400" /></button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <EngagementStakeModal
        isOpen={isStakeModalOpen}
        onClose={() => setIsStakeModalOpen(false)}
        onSuccess={() => { engagement.refreshStatus(); toast.success('Staked!'); }}
      />
      
      <WalletSelector
        isOpen={showWalletSelector}
        onClose={() => setShowWalletSelector(false)}
        onConnected={(pk) => {
          setLocalWalletAddress(pk);
          setShowWalletSelector(false);
          engagement.refreshStatus();
          toast.success('Wallet connected!');
        }}
      />
    </div>
  );
}
