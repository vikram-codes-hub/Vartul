import React, { useState, useEffect } from 'react';
import { TrendingUp, Users, Star, Zap, Award, RefreshCw, BarChart3 } from 'lucide-react';
import {
  Chart as ChartJS, CategoryScale, LinearScale, BarElement, Tooltip, Legend, ArcElement,
} from 'chart.js';
import { Bar, Doughnut } from 'react-chartjs-2';
import axiosInstance from '../../Utils/axiosInstance';
import toast from 'react-hot-toast';

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip, Legend, ArcElement);

const StatCard = ({ label, value, sub, icon: Icon, color = 'violet' }) => {
  const colorMap = {
    violet: 'from-violet-600/20 border-violet-500/20 text-violet-400',
    green: 'from-green-600/20 border-green-500/20 text-green-400',
    blue: 'from-blue-600/20 border-blue-500/20 text-blue-400',
    amber: 'from-amber-600/20 border-amber-500/20 text-amber-400',
  };
  return (
    <div className={`bg-gradient-to-br ${colorMap[color]} to-transparent border rounded-2xl p-5`}>
      {Icon && <Icon size={16} className={colorMap[color].split(' ').pop()} />}
      <p className="text-2xl font-bold text-white mt-3">{value}</p>
      <p className="text-xs text-gray-500 mt-1">{label}</p>
      {sub && <p className="text-[11px] text-gray-600 mt-0.5">{sub}</p>}
    </div>
  );
};

const CreatorEarnings = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    try {
      setLoading(true);
      const { data: res } = await axiosInstance.get('/api/engagement/creator-earnings');
      if (res.success) setData(res);
    } catch {
      toast.error('Failed to load creator earnings');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  if (loading) return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <div className="w-8 h-8 border-[3px] border-violet-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  if (!data) return null;

  const { totalEarnings, totalTipsReceived, totalStakedOnMe, watchRewards, earningsSources, tipsReceived, topSupporters, metrics } = data;

  const barData = {
    labels: earningsSources.map(s => s.source),
    datasets: [{
      label: 'TWT Earned',
      data: earningsSources.map(s => s.amount),
      backgroundColor: ['rgba(139,92,246,0.7)', 'rgba(236,72,153,0.7)', 'rgba(99,102,241,0.7)'],
      borderRadius: 6,
    }],
  };
  const barOptions = {
    responsive: true, maintainAspectRatio: false,
    plugins: { legend: { display: false }, tooltip: { backgroundColor: 'rgba(10,10,30,0.9)', bodyColor: '#fff', titleColor: '#c4b5fd' }},
    scales: {
      x: { grid: { display: false }, ticks: { color: 'rgba(255,255,255,0.4)', font: { size: 11 } } },
      y: { grid: { color: 'rgba(255,255,255,0.05)' }, ticks: { color: 'rgba(255,255,255,0.4)', font: { size: 11 } } },
    },
  };

  const doughnutData = {
    labels: earningsSources.map(s => s.source),
    datasets: [{
      data: earningsSources.map(s => Math.max(0.001, s.amount)),
      backgroundColor: ['rgba(139,92,246,0.8)', 'rgba(236,72,153,0.8)', 'rgba(99,102,241,0.8)'],
      borderWidth: 0,
      cutout: '70%',
    }],
  };

  return (
    <div className="p-4 md:p-8 space-y-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Creator Earnings</h1>
          <p className="text-sm text-gray-500 mt-1">Your engagement-based income breakdown</p>
        </div>
        <button onClick={load} className="p-2 rounded-xl border border-white/10 text-gray-400 hover:text-white hover:bg-white/5 transition">
          <RefreshCw size={15} />
        </button>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="Total Earnings" value={`${totalEarnings.toFixed(4)} TWT`} icon={TrendingUp} color="violet" />
        <StatCard label="Watch Rewards" value={`${watchRewards.toFixed(4)} TWT`} icon={Zap} color="green" />
        <StatCard label="Tips Received" value={`${totalTipsReceived.toFixed(4)} TWT`} icon={Award} color="amber" />
        <StatCard label="Staked On You" value={`${totalStakedOnMe.toFixed(2)} TWT`} icon={Users} color="blue" />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="md:col-span-2 bg-white/[0.02] border border-white/5 rounded-2xl p-6">
          <h3 className="font-semibold text-white mb-4 flex items-center gap-2"><BarChart3 size={15} className="text-violet-400" /> Earnings Breakdown</h3>
          <div className="h-40">
            <Bar data={barData} options={barOptions} />
          </div>
        </div>
        <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-6 flex flex-col items-center justify-center">
          <h3 className="font-semibold text-white mb-4">Distribution</h3>
          <div className="h-32 w-32 relative">
            <Doughnut data={doughnutData} options={{ responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } } }} />
          </div>
          <div className="mt-3 space-y-1">
            {earningsSources.map((s, i) => {
              const colors = ['bg-violet-400', 'bg-pink-400', 'bg-indigo-400'];
              return (
                <div key={s.source} className="flex items-center gap-2 text-xs text-gray-400">
                  <span className={`w-2 h-2 rounded-full ${colors[i]}`} />
                  {s.source}: {s.amount.toFixed(4)} TWT
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Performance Metrics */}
      <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-6">
        <h3 className="font-semibold text-white mb-4 flex items-center gap-2"><Zap size={15} className="text-violet-400" /> Performance Metrics</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: 'Watch Sessions', value: metrics.watchSessions },
            { label: 'Days Active', value: `${metrics.daysActive}d` },
            { label: 'Engagement', value: metrics.engagementStatus, color: metrics.engagementStatus === 'active' ? 'text-green-400' : 'text-red-400' },
            { label: 'Avg Watch %', value: `${metrics.avgWatchPct}%` },
          ].map(({ label, value, color }) => (
            <div key={label} className="bg-white/[0.03] rounded-xl p-4 border border-white/5">
              <p className={`text-lg font-bold ${color || 'text-white'}`}>{value}</p>
              <p className="text-xs text-gray-500 mt-1">{label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Top Supporters */}
      {topSupporters.length > 0 && (
        <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-6">
          <h3 className="font-semibold text-white mb-4 flex items-center gap-2"><Star size={15} className="text-amber-400" /> Top Supporters</h3>
          <div className="space-y-3">
            {topSupporters.map((s, i) => (
              <div key={s._id} className="flex items-center gap-4 py-2">
                <span className="text-gray-600 text-sm w-5">#{i + 1}</span>
                {s.staker?.profilePic
                  ? <img src={s.staker.profilePic} alt="" className="w-8 h-8 rounded-full object-cover" />
                  : <div className="w-8 h-8 rounded-full bg-violet-600/30 flex items-center justify-center text-xs text-violet-400">@</div>
                }
                <div className="flex-1">
                  <p className="text-sm font-medium text-white">@{s.staker?.username || '?'}</p>
                  <p className="text-xs text-gray-500">Locked {s.lockDays} days · Unlocks {new Date(s.unlockDate).toLocaleDateString()}</p>
                </div>
                <span className="text-blue-400 font-semibold text-sm">{s.amount} TWT</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recent Tips Received */}
      {tipsReceived.length > 0 && (
        <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-6">
          <h3 className="font-semibold text-white mb-4 flex items-center gap-2"><Award size={15} className="text-amber-400" /> Recent Tips Received</h3>
          <div className="space-y-2">
            {tipsReceived.map(tip => (
              <div key={tip._id} className="flex items-center gap-3 py-2 border-b border-white/[0.04] last:border-0">
                {tip.from?.profilePic
                  ? <img src={tip.from.profilePic} alt="" className="w-7 h-7 rounded-full object-cover" />
                  : <div className="w-7 h-7 rounded-full bg-pink-500/30 flex items-center justify-center text-[10px] text-pink-400">@</div>
                }
                <div className="flex-1">
                  <p className="text-xs text-gray-300">@{tip.from?.username}</p>
                  {tip.message && <p className="text-[11px] text-gray-600 truncate">"{tip.message}"</p>}
                </div>
                {tip.type === 'super' && <Star size={11} className="text-yellow-400" />}
                <span className="text-pink-400 font-semibold text-sm">{tip.amount} TWT</span>
                <span className="text-[11px] text-gray-600">{new Date(tip.createdAt).toLocaleDateString()}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default CreatorEarnings;
