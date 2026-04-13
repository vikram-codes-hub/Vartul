import React, { useState, useEffect } from 'react';
import { Gift, Clock, Star, Play, CheckCircle, Zap, ArrowRight } from 'lucide-react';
import axiosInstance from '../../Utils/axiosInstance';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';

const TYPE_COLORS = {
  reward:         'text-green-400  bg-green-500/10  border-green-500/20',
  stake:          'text-blue-400   bg-blue-500/10   border-blue-500/20',
  unstake:        'text-amber-400  bg-amber-500/10  border-amber-500/20',
  transfer:       'text-violet-400 bg-violet-500/10 border-violet-500/20',
  tip:            'text-pink-400   bg-pink-500/10   border-pink-500/20',
  airdrop:        'text-cyan-400   bg-cyan-500/10   border-cyan-500/20',
  ivtg:           'text-yellow-400 bg-yellow-500/10 border-yellow-500/20',
  creator_stake:  'text-indigo-400 bg-indigo-500/10 border-indigo-500/20',
};
const TYPE_LABELS = {
  reward: 'Watch Reward', stake: 'Staked', unstake: 'Unstaked',
  transfer: 'Transfer', tip: 'Tip', airdrop: 'Airdrop',
  ivtg: 'Token Grant', creator_stake: 'Creator Stake',
};

const SectionCard = ({ children, className = '' }) => (
  <div className={`bg-gradient-to-br from-white/[0.03] to-transparent border border-white/5 rounded-2xl p-6 ${className}`}>
    {children}
  </div>
);

const RewardsPage = () => {
  const navigate = useNavigate();
  const [rewardData, setRewardData] = useState(null);
  const [engData, setEngData]       = useState(null);
  const [loading, setLoading]       = useState(true);
  const [claiming, setClaiming]     = useState(false);
  const [tab, setTab]               = useState('history'); // 'history' | 'tips'

  const load = async () => {
    try {
      setLoading(true);
      const [histRes, engRes] = await Promise.all([
        axiosInstance.get('/api/engagement/reward-history'),
        axiosInstance.get('/api/engagement/status'),
      ]);
      setRewardData(histRes.data);
      setEngData(engRes.data);
    } catch (e) {
      toast.error('Failed to load reward data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const handleClaimIVTG = async () => {
    try {
      setClaiming(true);
      const { data } = await axiosInstance.post('/api/engagement/claim-ivtg');
      if (data.success) {
        toast.success(data.message);
        load();
      }
    } catch (e) {
      toast.error(e.response?.data?.message || 'Claim failed');
    } finally {
      setClaiming(false);
    }
  };

  if (loading) return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <div className="w-8 h-8 border-[3px] border-violet-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  const totalEarned  = rewardData?.totalEarned || 0;
  const txLogs       = rewardData?.txLogs || [];
  const tipHistory   = rewardData?.tipHistory || [];
  const isActive     = engData?.status === 'active';
  const ivtgClaimed  = engData?.ivtgClaimed;

  return (
    <div className="p-4 md:p-8 space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white">Rewards</h1>
        <p className="text-sm text-gray-500 mt-1">Track, manage, and claim your TWT rewards</p>
      </div>

      {/* Total earned banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-violet-900/30 via-indigo-900/20 to-[#080812] border border-violet-500/20 p-8">
        <div className="absolute top-0 right-0 w-48 h-48 bg-violet-600/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
        <div className="relative">
          <p className="text-xs text-violet-300 uppercase tracking-widest mb-2">Total Lifetime Earned</p>
          <div className="flex items-baseline gap-3 mb-4">
            <span className="text-5xl font-bold text-white">{totalEarned.toFixed(4)}</span>
            <span className="text-violet-400 text-2xl font-semibold">TWT</span>
          </div>
          <div className="flex flex-wrap gap-3 text-xs">
            <span className="flex items-center gap-1.5 text-gray-400"><Play size={11} /> Watch rewards active: {isActive ? '✅' : '❌'}</span>
            <span className="flex items-center gap-1.5 text-gray-400"><Zap size={11} /> Engagement: {engData?.stakeAmount || 0} TWT staked</span>
          </div>
        </div>
      </div>

      {/* W2E Stats */}
      {isActive && (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {[
            { label: 'Watch Sessions', value: engData?.watchSessionCount || 0, icon: Play, color: 'violet' },
            { label: 'Stake Amount',   value: `${engData?.stakeAmount || 0} TWT`, icon: Zap, color: 'blue' },
            { label: 'Days Active',    value: `${engData?.daysStaked || 0}d`, icon: Clock, color: 'green' },
          ].map(({ label, value, icon: Icon, color }) => (
            <div key={label} className="bg-white/[0.03] border border-white/5 rounded-2xl p-4">
              <Icon size={14} className={`text-${color}-400 mb-2`} />
              <p className="text-lg font-bold text-white">{value}</p>
              <p className="text-xs text-gray-500 mt-1">{label}</p>
            </div>
          ))}
        </div>
      )}

      {/* IVTG Claim */}
      {!ivtgClaimed && (
        <SectionCard>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-yellow-500/20 flex items-center justify-center">
                <Star size={18} className="text-yellow-400" />
              </div>
              <div>
                <p className="font-semibold text-white">Initial Token Grant</p>
                <p className="text-xs text-gray-500 mt-0.5">Claim your free 100 virtual TWT to get started</p>
              </div>
            </div>
            <button
              onClick={handleClaimIVTG}
              disabled={claiming}
              className="flex items-center gap-2 bg-yellow-500/20 border border-yellow-500/30 text-yellow-300 hover:bg-yellow-500/30 px-4 py-2 rounded-xl text-sm font-medium transition disabled:opacity-50"
            >
              {claiming ? 'Claiming...' : 'Claim 100 TWT'} <ArrowRight size={14} />
            </button>
          </div>
        </SectionCard>
      )}

      {!isActive && (
        <div className="flex items-start gap-3 bg-violet-500/5 border border-violet-500/15 rounded-xl p-4">
          <Zap size={14} className="text-violet-400 flex-shrink-0 mt-0.5" />
          <p className="text-xs text-violet-300/80">
            You need an active stake to earn watch rewards.{' '}
            <button onClick={() => navigate('/dashboard/staking')} className="underline hover:text-white">Go to Staking →</button>
          </p>
        </div>
      )}

      {/* History tabs */}
      <SectionCard className="!p-0 overflow-hidden">
        <div className="flex border-b border-white/5">
          {[
            { key: 'history', label: 'Transaction History' },
            { key: 'tips',    label: 'Tip History' },
          ].map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              className={`flex-1 py-3.5 text-sm font-medium transition ${tab === key ? 'text-violet-300 border-b-2 border-violet-400 bg-violet-500/5' : 'text-gray-500 hover:text-gray-300'}`}
            >
              {label}
            </button>
          ))}
        </div>

        <div className="p-4 space-y-2 max-h-96 overflow-y-auto">
          {tab === 'history' && (
            txLogs.length === 0
              ? <p className="text-center text-gray-600 py-8">No transactions yet. Start earning by watching reels!</p>
              : txLogs.map((log) => (
                <div key={log._id} className="flex items-center justify-between py-3 px-4 rounded-xl hover:bg-white/[0.03] transition border border-white/[0.03]">
                  <div className="flex items-center gap-3">
                    <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full border ${TYPE_COLORS[log.type] || 'text-gray-400 bg-white/5 border-white/10'}`}>
                      {TYPE_LABELS[log.type] || log.type}
                    </span>
                    <div>
                      <p className="text-xs text-gray-300">{log.note || TYPE_LABELS[log.type]}</p>
                      <p className="text-[11px] text-gray-600">{new Date(log.createdAt).toLocaleString()}</p>
                    </div>
                  </div>
                  <span className={`font-semibold text-sm ${log.amount >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                    {log.amount >= 0 ? '+' : ''}{log.amount.toFixed(4)} TWT
                  </span>
                </div>
              ))
          )}
          {tab === 'tips' && (
            tipHistory.length === 0
              ? <p className="text-center text-gray-600 py-8">No tip history yet</p>
              : tipHistory.map((tip) => (
                <div key={tip._id} className="flex items-center justify-between py-3 px-4 rounded-xl hover:bg-white/[0.03] transition">
                  <div className="flex items-center gap-3">
                    {tip.from?.profilePic
                      ? <img src={tip.from.profilePic} alt="" className="w-7 h-7 rounded-full object-cover" />
                      : <div className="w-7 h-7 rounded-full bg-pink-500/30 flex items-center justify-center"><Gift size={12} className="text-pink-400" /></div>
                    }
                    <div>
                      <p className="text-xs text-gray-300">@{tip.from?.username || '?'} → @{tip.to?.username || '?'}</p>
                      <p className="text-[11px] text-gray-600">{new Date(tip.createdAt).toLocaleString()}</p>
                    </div>
                    {tip.type === 'super' && <Star size={11} className="text-yellow-400" />}
                  </div>
                  <span className="text-pink-400 font-semibold text-sm">{tip.amount} TWT</span>
                </div>
              ))
          )}
        </div>
      </SectionCard>
    </div>
  );
};

export default RewardsPage;
