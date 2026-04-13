import React, { useState, useEffect, useContext } from 'react';
import {
  Chart as ChartJS, CategoryScale, LinearScale, PointElement,
  LineElement, ArcElement, Tooltip, Legend, BarElement,
} from 'chart.js';
import { Line, Doughnut } from 'react-chartjs-2';
import {
  TrendingUp, Clock, Award, Users, Wallet, Zap, ChevronRight,
  Activity, Star, ArrowUpRight, RefreshCw, Layers,
} from 'lucide-react';
import { fetchDashboardStats } from '../../api/engagement.api';
import { Usercontext } from '../../Context/Usercontext';
import { useNavigate } from 'react-router-dom';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, ArcElement, Tooltip, Legend, BarElement);

// ── Stat Card ────────────────────────────────────────────────────────────────
const StatCard = ({ label, value, sub, color = 'violet', icon: Icon, badge }) => {
  const colorMap = {
    violet: 'from-violet-600/20 to-violet-900/10 border-violet-500/20 text-violet-300',
    blue:   'from-blue-600/20 to-blue-900/10 border-blue-500/20 text-blue-300',
    green:  'from-green-600/20 to-green-900/10 border-green-500/20 text-green-300',
    amber:  'from-amber-600/20 to-amber-900/10 border-amber-500/20 text-amber-300',
  };
  return (
    <div className={`bg-gradient-to-br ${colorMap[color]} border rounded-2xl p-5 flex flex-col gap-3 hover:scale-[1.02] transition-transform duration-200`}>
      <div className="flex items-center justify-between">
        <p className="text-xs text-gray-400 uppercase tracking-widest font-medium">{label}</p>
        {Icon && <div className={`p-2 rounded-lg bg-white/5`}><Icon size={14} className={colorMap[color].split(' ').pop()} /></div>}
      </div>
      <div>
        <p className="text-2xl font-bold text-white leading-none">{value}</p>
        {sub && <p className="text-xs text-gray-500 mt-1.5">{sub}</p>}
      </div>
      {badge && (
        <span className={`self-start text-[10px] font-semibold px-2 py-0.5 rounded-full bg-white/10 ${colorMap[color].split(' ').pop()}`}>
          {badge}
        </span>
      )}
    </div>
  );
};

const Overview = () => {
  const { authuser } = useContext(Usercontext);
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastRefresh, setLastRefresh] = useState(Date.now());

  const loadStats = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await fetchDashboardStats();
      if (data.success) setStats(data);
    } catch (err) {
      setError('Could not load dashboard data.');
    } finally {
      setLoading(false);
      setLastRefresh(Date.now());
    }
  };

  useEffect(() => { loadStats(); }, []);

  const wallet = stats?.wallet || {};
  const eng    = stats?.engagement || {};
  const social = stats?.social || {};

  // Chart data
  const lineChartData = {
    labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Today'],
    datasets: [{
      label: 'TWT Earned',
      data: [0, 0, 0, 0, 0, 0, eng.earnedTWT || 0],
      borderColor: 'rgb(139, 92, 246)',
      backgroundColor: 'rgba(139, 92, 246, 0.08)',
      tension: 0.4,
      fill: true,
      pointBackgroundColor: 'rgb(139, 92, 246)',
      pointRadius: 4,
    }],
  };
  const lineOptions = {
    responsive: true, maintainAspectRatio: false,
    plugins: { legend: { display: false }, tooltip: { backgroundColor: 'rgba(10,10,30,0.9)', titleColor: '#c4b5fd', bodyColor: '#fff', borderColor: 'rgba(139,92,246,0.3)', borderWidth: 1 }},
    scales: {
      x: { grid: { display: false, color: 'rgba(255,255,255,0.05)' }, ticks: { color: 'rgba(255,255,255,0.4)', font: { size: 11 } } },
      y: { grid: { color: 'rgba(255,255,255,0.05)' }, ticks: { color: 'rgba(255,255,255,0.4)', font: { size: 11 } } },
    },
  };
  const doughnutOpts = { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false }, tooltip: { enabled: false }}};
  const makeDoughnut = (val, color, bg = 'rgba(255,255,255,0.05)') => ({
    datasets: [{ data: [val, Math.max(0, 100 - val)], backgroundColor: [color, bg], borderWidth: 0, cutout: '78%' }],
  });

  const stakedPct     = wallet.total > 0 ? Math.min(100, Math.round((wallet.staked / wallet.total) * 100)) : 0;
  const claimedPct    = eng.totalRewardsEarned > 0 && wallet.total > 0 ? Math.min(100, Math.round((eng.totalRewardsEarned / wallet.total) * 100)) : 0;
  const engagementPct = eng.status === 'active' ? 82 : 0;

  if (loading) return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="w-10 h-10 border-[3px] border-violet-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-gray-400 text-sm">Loading dashboard...</p>
      </div>
    </div>
  );

  return (
    <div className="p-4 md:p-8 space-y-6 max-w-7xl mx-auto">
      {/* ── Header ──────────────────────────────────────────────────────────── */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">
            Welcome back, <span className="text-violet-400">{authuser?.username || 'Creator'}</span> 👋
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            {eng.status === 'active'
              ? '⚡ Your engagement is active — keep watching to earn TWT!'
              : 'Stake TWT on the Staking page to start earning rewards.'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={loadStats}
            className="p-2 text-gray-500 hover:text-violet-300 hover:bg-violet-500/10 rounded-lg transition"
            title="Refresh"
          >
            <RefreshCw size={15} />
          </button>
          <button
            onClick={() => navigate('/dashboard/staking')}
            className="flex items-center gap-2 bg-violet-600 hover:bg-violet-500 text-white text-sm font-semibold px-4 py-2 rounded-xl transition shadow-lg shadow-violet-500/20"
          >
            <Zap size={14} /> Manage TWT
          </button>
        </div>
      </div>

      {/* ── Stat Cards ──────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          label="Total Balance" icon={Wallet} color="violet"
          value={`${(wallet.total || 0).toLocaleString(undefined, { maximumFractionDigits: 2 })} TWT`}
          sub={wallet.address ? `${wallet.address.slice(0, 6)}…${wallet.address.slice(-4)}` : 'No wallet linked'}
          badge={wallet.onChain ? '🔗 On-chain' : '📊 Tracked'}
        />
        <StatCard
          label="Staked" icon={Layers} color="blue"
          value={`${(wallet.staked || 0).toLocaleString()} TWT`}
          sub={`${eng.daysStaked || 0} days active`}
        />
        <StatCard
          label="Total Earned" icon={Award} color="green"
          value={`+${(eng.totalRewardsEarned || 0).toFixed(2)} TWT`}
          sub="Lifetime rewards"
        />
        <StatCard
          label="Engagement" icon={Activity} color="amber"
          value={eng.status === 'active' ? 'Active' : 'Inactive'}
          sub="PoS engagement status"
          badge={eng.status === 'active' ? '🟢 Earning' : '🔴 Paused'}
        />
      </div>

      {/* ── Charts Row ──────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Line chart */}
        <div className="lg:col-span-2 bg-gradient-to-br from-violet-900/10 to-[#080812] rounded-2xl p-6 border border-violet-500/10">
          <div className="flex items-center justify-between mb-5">
            <h3 className="font-semibold text-white">Reward Trends</h3>
            <span className="text-xs text-violet-400 bg-violet-500/10 border border-violet-500/20 px-2.5 py-1 rounded-full">This Week</span>
          </div>
          <div className="h-44">
            <Line data={lineChartData} options={lineOptions} />
          </div>
          {/* Doughnuts */}
          <div className="grid grid-cols-3 gap-4 mt-6 pt-4 border-t border-white/5">
            {[
              { label: 'Staked %',    pct: stakedPct,     color: 'rgba(139,92,246,0.9)'  },
              { label: 'Claimed %',   pct: claimedPct,    color: 'rgba(59,130,246,0.9)'  },
              { label: 'Engagement',  pct: engagementPct, color: 'rgba(16,185,129,0.9)'  },
            ].map(({ label, pct, color }) => (
              <div key={label} className="flex flex-col items-center gap-2">
                <div className="h-16 w-16 relative">
                  <Doughnut data={makeDoughnut(pct, color)} options={doughnutOpts} />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-xs font-bold text-white">{pct}%</span>
                  </div>
                </div>
                <p className="text-[11px] text-center text-gray-500">{label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* TWT Overview Card */}
        <div className="bg-gradient-to-br from-violet-900/15 to-[#080812] rounded-2xl p-6 border border-violet-500/10 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <div className="w-6 h-6 rounded-lg bg-violet-600/30 flex items-center justify-center">
                <Zap size={12} className="text-violet-400" />
              </div>
              <h3 className="font-semibold text-white">TWT Overview</h3>
            </div>
            <p className="text-[11px] text-gray-500 mb-2">Available Balance</p>
            <div className="flex items-baseline gap-1.5 mb-5">
              <span className="text-4xl font-bold text-white">{(wallet.available || 0).toLocaleString(undefined, { maximumFractionDigits: 2 })}</span>
              <span className="text-violet-400 font-semibold text-lg">TWT</span>
            </div>
            <div className="space-y-2.5 text-sm">
              {[
                { label: 'Staked',           value: `${wallet.staked || 0} TWT`, textColor: 'text-blue-400' },
                { label: 'Days Active',       value: `${eng.daysStaked || 0}d`,  textColor: 'text-white' },
                { label: 'Lifetime Rewards',  value: `+${(eng.totalRewardsEarned || 0).toFixed(2)} TWT`, textColor: 'text-green-400' },
                { label: 'Last Reward',       value: eng.lastRewardCalculation ? new Date(eng.lastRewardCalculation).toLocaleDateString() : '—', textColor: 'text-gray-300' },
              ].map(({ label, value, textColor }) => (
                <div key={label} className="flex justify-between items-center py-1.5 border-b border-white/5 last:border-0">
                  <span className="text-gray-500 text-xs">{label}</span>
                  <span className={`${textColor} font-medium text-xs`}>{value}</span>
                </div>
              ))}
            </div>
          </div>
          <button
            onClick={() => navigate('/dashboard/staking')}
            className="mt-5 w-full bg-violet-600 hover:bg-violet-500 text-white py-2.5 rounded-xl text-sm font-semibold transition flex items-center justify-center gap-2 shadow-lg shadow-violet-500/20"
          >
            Manage & Stake <ChevronRight size={14} />
          </button>
        </div>
      </div>

      {/* ── Social & Engagement Row ──────────────────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Social Stats */}
        <div className="bg-gradient-to-br from-white/[0.02] to-transparent rounded-2xl p-6 border border-white/5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-white flex items-center gap-2"><Users size={15} className="text-violet-400" /> Social Stats</h3>
            <button onClick={() => navigate('/profile')} className="text-[11px] text-gray-500 hover:text-violet-300 transition flex items-center gap-1">View Profile <ArrowUpRight size={10} /></button>
          </div>
          <div className="grid grid-cols-3 gap-3 text-center">
            {[
              { label: 'Posts',     value: social.posts || 0      },
              { label: 'Followers', value: social.followers || 0  },
              { label: 'Following', value: social.following || 0  },
            ].map(({ label, value }) => (
              <div key={label} className="bg-white/[0.03] rounded-xl p-3 border border-white/5">
                <p className="text-xl font-bold text-white">{value.toLocaleString()}</p>
                <p className="text-[11px] text-gray-500 mt-1">{label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Engagement Info */}
        <div className="bg-gradient-to-br from-white/[0.02] to-transparent rounded-2xl p-6 border border-white/5">
          <h3 className="font-semibold text-white mb-4 flex items-center gap-2"><TrendingUp size={15} className="text-violet-400" /> Engagement Info</h3>
          <div className="space-y-2 text-sm">
            {[
              { label: 'Stake Duration',  value: `${eng.daysStaked || 0} days`,         textColor: 'text-white' },
              { label: 'Stake Amount',    value: `${eng.stakeAmount || 0} TWT`,          textColor: 'text-blue-400' },
              { label: 'Status',          value: eng.status || 'inactive',               textColor: eng.status === 'active' ? 'text-green-400' : 'text-red-400' },
              { label: 'Wallet',          value: wallet.address ? `${wallet.address.slice(0,8)}…${wallet.address.slice(-6)}` : 'Not linked', textColor: 'text-violet-300 font-mono text-xs' },
            ].map(({ label, value, textColor }) => (
              <div key={label} className="flex justify-between items-center py-2 border-b border-white/5 last:border-0">
                <span className="text-gray-500 text-xs">{label}</span>
                <span className={textColor}>{value}</span>
              </div>
            ))}
          </div>
          <div className="mt-4 flex gap-2">
            <button onClick={() => navigate('/dashboard/wallet')} className="flex-1 text-xs border border-violet-500/30 text-violet-400 hover:bg-violet-500/10 py-2 rounded-lg transition">Connect Wallet</button>
            <button onClick={() => navigate('/dashboard/rewards')} className="flex-1 text-xs border border-green-500/30 text-green-400 hover:bg-green-500/10 py-2 rounded-lg transition">View Rewards</button>
          </div>
        </div>
      </div>

      {error && (
        <div className="bg-red-900/20 border border-red-700/40 rounded-xl p-4 text-red-300 text-sm">
          ⚠️ {error}
        </div>
      )}
    </div>
  );
};

export default Overview;
