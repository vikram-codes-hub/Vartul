import React, { useState, useEffect, useContext } from 'react';
import {
  Chart as ChartJS,
  CategoryScale, LinearScale, PointElement, LineElement,
  ArcElement, Tooltip, Legend
} from 'chart.js';
import { Line, Doughnut } from 'react-chartjs-2';
import { TrendingUp, Clock, Award, Users, Wallet, Zap, ChevronRight } from 'lucide-react';
import { fetchDashboardStats } from '../api/engagement.api';
import { Usercontext } from '../Context/Usercontext';
import { useNavigate } from 'react-router-dom';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, ArcElement, Tooltip, Legend);

const statCardClass = "bg-gradient-to-br from-purple-900/20 to-black rounded-xl p-5 border border-purple-500/20 flex flex-col gap-2";

const Dashboard = () => {
  const { authuser } = useContext(Usercontext);
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadStats = async () => {
      try {
        setLoading(true);
        const data = await fetchDashboardStats();
        if (data.success) setStats(data);
      } catch (err) {
        setError("Could not load dashboard data.");
        console.error("Dashboard stats error:", err);
      } finally {
        setLoading(false);
      }
    };
    loadStats();
  }, []);

  // ── Chart config ──────────────────────────────────────────────────────────────
  const lineChartData = {
    labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
    datasets: [{
      label: 'TWT Earned',
      data: [0, 0, 0, 0, 0, 0, stats?.engagement?.totalRewardsEarned || 0],
      borderColor: 'rgb(138, 43, 226)',
      backgroundColor: 'rgba(138, 43, 226, 0.1)',
      tension: 0.4,
      fill: true,
    }],
  };

  const lineOptions = {
    responsive: true, maintainAspectRatio: false,
    plugins: { legend: { display: false }, tooltip: { backgroundColor: 'rgba(0,0,0,0.8)', titleColor: '#fff', bodyColor: '#fff' } },
    scales: {
      x: { grid: { display: false }, ticks: { color: 'rgba(255,255,255,0.5)' } },
      y: { grid: { color: 'rgba(255,255,255,0.1)' }, ticks: { color: 'rgba(255,255,255,0.5)' } },
    },
  };

  const doughnutOpts = { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false }, tooltip: { enabled: false } } };
  const makeDoughnut = (val, color) => ({
    labels: ['Done', 'Left'],
    datasets: [{ data: [val, 100 - val], backgroundColor: [color, 'rgba(255,255,255,0.1)'], borderWidth: 0, cutout: '75%' }],
  });

  // ── Derived values ────────────────────────────────────────────────────────────
  const wallet = stats?.wallet || {};
  const eng = stats?.engagement || {};
  const social = stats?.social || {};

  const stakedPct = wallet.total > 0 ? Math.min(100, Math.round((wallet.staked / wallet.total) * 100)) : 0;
  const claimedPct = eng.totalRewardsEarned > 0 && wallet.total > 0 ? Math.min(100, Math.round((eng.totalRewardsEarned / wallet.total) * 100)) : 0;
  const engagementPct = eng.status === 'active' ? 82 : 0;

  // ── Loading state ─────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-gray-400 text-sm">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white flex">
      {/* ── Left Sidebar ─────────────────────────────────────────────────────── */}
      <div className="hidden md:flex flex-col w-64 border-r border-gray-800 p-5 gap-2">
        <h1 className="text-xl font-bold text-purple-400 mb-6">VARTUL</h1>
        {[
          { icon: <TrendingUp size={16} />, label: 'Dashboard', active: true },
          { icon: <Users size={16} />, label: 'Community', path: '/' },
          { icon: <Award size={16} />, label: 'Rewards', path: '/twt-token' },
          { icon: <Clock size={16} />, label: 'Activity', path: '/twt-token' },
          { icon: <Wallet size={16} />, label: 'Wallet', path: '/twt-token' },
        ].map(({ icon, label, active, path }) => (
          <button
            key={label}
            onClick={() => path && navigate(path)}
            className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all ${ active ? 'bg-purple-900/40 text-purple-300 font-semibold' : 'text-gray-400 hover:bg-gray-800/30 hover:text-white' }`}
          >
            {icon}<span>{label}</span>
          </button>
        ))}
      </div>

      {/* ── Main Content ─────────────────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col overflow-auto">
        {/* Header */}
        <div className="w-full border-b border-gray-800 px-6 py-4 flex items-center justify-between sticky top-0 bg-black/80 backdrop-blur z-10">
          <div>
            <h2 className="text-lg font-semibold">Welcome back, {authuser?.username || 'Creator'} 👋</h2>
            <p className="text-xs text-gray-400">{eng.status === 'active' ? '⚡ Earning active — keep watching!' : 'Stake TWT on the Token page to start earning.'}</p>
          </div>
          <button onClick={() => navigate('/twt-token')} className="flex items-center gap-2 bg-purple-700 hover:bg-purple-600 text-white text-sm font-semibold px-4 py-2 rounded-lg transition">
            <Zap size={14} /> Manage TWT
          </button>
        </div>

        <div className="p-4 md:p-6 flex-1">
          <div className="max-w-7xl mx-auto space-y-6">

            {/* ── Stat Cards Row ─────────────────────────────────────────────── */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className={statCardClass}>
                <p className="text-xs text-gray-400 uppercase tracking-wide">Total Balance</p>
                <p className="text-2xl font-bold text-white">{wallet.total?.toLocaleString(undefined, { maximumFractionDigits: 2 }) || 0} <span className="text-purple-400 text-sm">TWT</span></p>
                <p className="text-xs text-gray-500">{wallet.address ? `${wallet.address.slice(0,6)}…${wallet.address.slice(-4)}` : 'No wallet linked'}</p>
              </div>
              <div className={statCardClass}>
                <p className="text-xs text-gray-400 uppercase tracking-wide">Staked</p>
                <p className="text-2xl font-bold text-blue-400">{wallet.staked?.toLocaleString() || 0} <span className="text-sm">TWT</span></p>
                <p className="text-xs text-gray-500">{eng.daysStaked || 0} days active</p>
              </div>
              <div className={statCardClass}>
                <p className="text-xs text-gray-400 uppercase tracking-wide">Total Earned</p>
                <p className="text-2xl font-bold text-green-400">+{eng.totalRewardsEarned?.toFixed(2) || '0.00'} <span className="text-sm">TWT</span></p>
                <p className="text-xs text-gray-500">Lifetime rewards</p>
              </div>
              <div className={statCardClass}>
                <p className="text-xs text-gray-400 uppercase tracking-wide">Engagement</p>
                <div className={`text-xl font-bold mt-1 flex items-center gap-2 ${eng.status === 'active' ? 'text-green-400' : 'text-red-400'}`}>
                  <span className={`w-2 h-2 rounded-full ${eng.status === 'active' ? 'bg-green-400 animate-pulse' : 'bg-red-400'}`} />
                  {eng.status === 'active' ? 'Active' : 'Inactive'}
                </div>
                <p className="text-xs text-gray-500">PoS Engagement</p>
              </div>
            </div>

            {/* ── Charts Row ────────────────────────────────────────────────── */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              {/* Line Chart */}
              <div className="lg:col-span-2 bg-gradient-to-br from-purple-900/10 to-black rounded-xl p-6 border border-purple-500/20">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-white">Reward Trends</h3>
                  <span className="text-xs text-purple-400 bg-purple-900/30 px-2 py-1 rounded-full">This Week</span>
                </div>
                <div className="h-52">
                  <Line data={lineChartData} options={lineOptions} />
                </div>
                {/* Doughnuts */}
                <div className="grid grid-cols-3 gap-4 mt-6">
                  {[
                    { label: 'Staked %', pct: stakedPct, color: 'rgba(138,43,226,0.8)' },
                    { label: 'Claimed %', pct: claimedPct, color: 'rgba(59,130,246,0.8)' },
                    { label: 'Engagement', pct: engagementPct, color: 'rgba(16,185,129,0.8)' },
                  ].map(({ label, pct, color }) => (
                    <div key={label} className="flex flex-col items-center">
                      <div className="h-20 w-20 relative">
                        <Doughnut data={makeDoughnut(pct, color)} options={doughnutOpts} />
                        <div className="absolute inset-0 flex items-center justify-center">
                          <span className="text-sm font-bold">{pct}%</span>
                        </div>
                      </div>
                      <p className="text-xs text-center mt-2 text-gray-400">{label}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* TWT Overview Card */}
              <div className="bg-gradient-to-br from-purple-900/20 to-black rounded-xl p-6 border border-purple-500/20 flex flex-col justify-between">
                <div>
                  <h3 className="text-lg font-bold mb-4">TWT Overview</h3>
                  <p className="text-xs text-gray-400 mb-1">Available Balance</p>
                  <div className="flex items-baseline gap-1 mb-4">
                    <span className="text-3xl font-bold">{(wallet.available || 0).toLocaleString(undefined, { maximumFractionDigits: 2 })}</span>
                    <span className="text-purple-400 font-medium">TWT</span>
                  </div>
                  <div className="space-y-3 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-400">Staked</span>
                      <span className="text-blue-400 font-medium">{wallet.staked || 0} TWT</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Days Active</span>
                      <span className="font-medium">{eng.daysStaked || 0} days</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Lifetime Rewards</span>
                      <span className="text-green-400 font-medium">+{(eng.totalRewardsEarned || 0).toFixed(2)} TWT</span>
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => navigate('/twt-token')}
                  className="mt-4 w-full bg-indigo-600 hover:bg-indigo-700 text-white py-2.5 px-4 rounded-lg text-sm font-semibold transition flex items-center justify-center gap-2"
                >
                  Manage & Claim <ChevronRight size={14} />
                </button>
              </div>
            </div>

            {/* ── Social & Insights Row ──────────────────────────────────────── */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Social Stats */}
              <div className="bg-gradient-to-br from-purple-900/10 to-black rounded-xl p-6 border border-purple-500/20">
                <h3 className="font-semibold text-white mb-4">Social Stats</h3>
                <div className="grid grid-cols-3 gap-4 text-center">
                  {[
                    { label: 'Posts', value: social.posts || 0 },
                    { label: 'Followers', value: social.followers || 0 },
                    { label: 'Following', value: social.following || 0 },
                  ].map(({ label, value }) => (
                    <div key={label} className="bg-black/40 rounded-xl p-3 border border-purple-500/10">
                      <p className="text-xl font-bold text-white">{value.toLocaleString()}</p>
                      <p className="text-xs text-gray-400 mt-1">{label}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Engagement Insights */}
              <div className="bg-gradient-to-br from-purple-900/10 to-black rounded-xl p-6 border border-purple-500/20">
                <h3 className="font-semibold text-white mb-4">Engagement Info</h3>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between items-center py-2 border-b border-gray-800">
                    <span className="text-gray-400">Stake Duration</span>
                    <span className="font-medium">{eng.daysStaked || 0} days</span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-gray-800">
                    <span className="text-gray-400">Stake Amount</span>
                    <span className="font-medium text-blue-400">{eng.stakeAmount || 0} TWT</span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-gray-800">
                    <span className="text-gray-400">Last Reward</span>
                    <span className="font-medium text-green-400">
                      {eng.lastRewardCalculation
                        ? new Date(eng.lastRewardCalculation).toLocaleDateString()
                        : '—'}
                    </span>
                  </div>
                  <div className="flex justify-between items-center py-2">
                    <span className="text-gray-400">Wallet</span>
                    <span className="font-mono text-xs text-purple-300">
                      {wallet.address ? `${wallet.address.slice(0, 8)}…${wallet.address.slice(-6)}` : 'Not linked'}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Error Banner */}
            {error && (
              <div className="bg-red-900/30 border border-red-700 rounded-xl p-4 text-red-300 text-sm">
                ⚠️ {error} — Some stats may be using cached data.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;