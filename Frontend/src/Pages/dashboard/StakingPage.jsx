import React, { useState, useEffect } from 'react';
import { Layers, Lock, Unlock, Zap, TrendingUp, AlertCircle, CheckCircle, Clock } from 'lucide-react';
import { stakeEngagementTokens } from '../../api/engagement.api';
import axiosInstance from '../../Utils/axiosInstance';
import toast from 'react-hot-toast';

const lockOptions = [
  { days: 1,  label: '1 Day',   apy: '5%',  multiplier: '1.0x', color: 'border-gray-500/30 text-gray-300' },
  { days: 7,  label: '7 Days',  apy: '12%', multiplier: '1.25x', color: 'border-blue-500/30 text-blue-300' },
  { days: 30, label: '30 Days', apy: '25%', multiplier: '1.5x', color: 'border-violet-500/30 text-violet-300' },
  { days: 90, label: '90 Days', apy: '40%', multiplier: '2.0x', color: 'border-amber-500/30 text-amber-300' },
];

const SectionCard = ({ children, className = '' }) => (
  <div className={`bg-gradient-to-br from-white/[0.03] to-transparent border border-white/5 rounded-2xl p-6 ${className}`}>
    {children}
  </div>
);

const StakingPage = () => {
  const [status, setStatus]         = useState(null);
  const [loading, setLoading]       = useState(true);
  const [staking, setStaking]       = useState(false);
  const [unstaking, setUnstaking]   = useState(false);
  const [amount, setAmount]         = useState('');
  const [lockDays, setLockDays]     = useState(7);
  const [unstakeAmt, setUnstakeAmt] = useState('');

  const loadStatus = async () => {
    try {
      setLoading(true);
      const { data } = await axiosInstance.get('/api/engagement/status');
      setStatus(data);
    } catch (e) {
      toast.error('Failed to load staking status');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadStatus(); }, []);

  const handleStake = async (e) => {
    e.preventDefault();
    if (!amount || Number(amount) <= 0) return toast.error('Enter a valid amount');
    try {
      setStaking(true);
      const data = await stakeEngagementTokens(Number(amount), lockDays);
      if (data.success) {
        toast.success(`✅ Staked ${amount} TWT for ${lockDays} days!`);
        setAmount('');
        setTimeout(loadStatus, 1000);
      }
    } catch (e) {
      toast.error(e.response?.data?.message || 'Staking failed');
    } finally {
      setStaking(false);
    }
  };

  const handleUnstake = async () => {
    const amtVal = unstakeAmt ? Number(unstakeAmt) : undefined;
    try {
      setUnstaking(true);
      const { data } = await axiosInstance.post('/api/engagement/unstake', { amount: amtVal });
      if (data.success) {
        toast.success(data.message);
        setUnstakeAmt('');
        setTimeout(loadStatus, 1000);
      }
    } catch (e) {
      toast.error(e.response?.data?.message || 'Unstake failed');
    } finally {
      setUnstaking(false);
    }
  };

  const isActive = status?.status === 'active';
  const selectedLock = lockOptions.find(l => l.days === lockDays);
  const stakeStartDate = status?.stakeStartTime ? new Date(status.stakeStartTime) : null;
  const unlockDate = stakeStartDate ? new Date(stakeStartDate.getTime() + (status?.lockDurationDays || 1) * 86400000) : null;
  const isUnlocked = unlockDate ? unlockDate <= new Date() : true;
  const daysLeft = unlockDate ? Math.max(0, Math.ceil((unlockDate - Date.now()) / 86400000)) : 0;

  if (loading) return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <div className="w-8 h-8 border-[3px] border-violet-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="p-4 md:p-8 space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white">Staking</h1>
        <p className="text-sm text-gray-500 mt-1">Stake TWT to activate engagement rewards and earn yield</p>
      </div>

      {/* Current Stake Status */}
      <div className={`rounded-2xl p-6 border ${isActive ? 'bg-gradient-to-br from-green-900/15 to-transparent border-green-500/20' : 'bg-gradient-to-br from-white/[0.02] to-transparent border-white/5'}`}>
        <div className="flex items-center gap-3 mb-4">
          <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${isActive ? 'bg-green-500/20' : 'bg-white/5'}`}>
            {isActive ? <Layers size={16} className="text-green-400" /> : <Layers size={16} className="text-gray-500" />}
          </div>
          <div>
            <h2 className="font-semibold text-white">Current Stake</h2>
            <div className={`flex items-center gap-1.5 text-xs mt-0.5 ${isActive ? 'text-green-400' : 'text-gray-500'}`}>
              <span className={`w-1.5 h-1.5 rounded-full ${isActive ? 'bg-green-400 animate-pulse' : 'bg-gray-600'}`} />
              {isActive ? 'Active — Earning rewards' : 'No active stake'}
            </div>
          </div>
          {stakeStartDate && (
            <span className="ml-auto text-xs text-gray-500">Since {stakeStartDate.toLocaleDateString()}</span>
          )}
        </div>

        {isActive ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: 'Staked Amount',   value: `${status?.stakeAmount || 0} TWT`,   color: 'text-white' },
              { label: 'Lock Duration',   value: `${status?.lockDurationDays || 0} days`, color: 'text-blue-400' },
              { label: 'Unlock Date',     value: unlockDate ? unlockDate.toLocaleDateString() : '—', color: isUnlocked ? 'text-green-400' : 'text-amber-400' },
              { label: 'Days Left',       value: isUnlocked ? '🔓 Unlocked!' : `${daysLeft} days`, color: isUnlocked ? 'text-green-400' : 'text-white' },
            ].map(({ label, value, color }) => (
              <div key={label} className="bg-white/[0.03] rounded-xl p-3 border border-white/5">
                <p className="text-[11px] text-gray-500 mb-1">{label}</p>
                <p className={`font-semibold text-sm ${color}`}>{value}</p>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-600 text-sm">No active staking position found. Use the form below to start.</p>
        )}
      </div>

      {/* Stake Form */}
      <SectionCard>
        <h2 className="font-semibold text-white mb-5 flex items-center gap-2"><Zap size={15} className="text-violet-400" /> Stake TWT</h2>
        <form onSubmit={handleStake} className="space-y-5">
          {/* Amount */}
          <div>
            <label className="text-xs text-gray-400 uppercase tracking-wide mb-2 block">Amount (TWT)</label>
            <div className="flex gap-2">
              <input
                type="number"
                min="1"
                step="0.01"
                value={amount}
                onChange={e => setAmount(e.target.value)}
                placeholder="e.g. 100"
                className="flex-1 bg-white/[0.04] border border-white/10 text-white placeholder-gray-600 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-violet-500/50 transition"
              />
              <button
                type="button"
                onClick={() => setAmount(String(status?.twtBalance || 0))}
                className="px-3 py-2 text-xs border border-violet-500/30 text-violet-400 hover:bg-violet-500/10 rounded-xl transition"
              >
                MAX
              </button>
            </div>
            {status?.twtBalance !== undefined && (
              <p className="text-xs text-gray-600 mt-1.5">Available: {(status.twtBalance || 0).toFixed(4)} TWT</p>
            )}
          </div>

          {/* Lock duration */}
          <div>
            <label className="text-xs text-gray-400 uppercase tracking-wide mb-3 block">Lock Duration</label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              {lockOptions.map(({ days, label, apy, multiplier, color }) => (
                <button
                  key={days}
                  type="button"
                  onClick={() => setLockDays(days)}
                  className={`p-3 rounded-xl border text-left transition ${lockDays === days
                    ? `${color} bg-white/5 shadow-lg`
                    : 'border-white/5 text-gray-500 hover:border-white/10 hover:text-gray-400'
                  }`}
                >
                  <p className="text-sm font-semibold">{label}</p>
                  <p className="text-xs mt-1 opacity-70">{apy} APY · {multiplier}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Summary */}
          {amount > 0 && (
            <div className="bg-violet-500/5 border border-violet-500/15 rounded-xl p-4 text-sm space-y-1.5">
              <div className="flex justify-between text-gray-400">
                <span>Staking:</span><span className="text-white">{amount} TWT</span>
              </div>
              <div className="flex justify-between text-gray-400">
                <span>Lock period:</span><span className="text-white">{selectedLock?.label}</span>
              </div>
              <div className="flex justify-between text-gray-400">
                <span>Reward multiplier:</span><span className="text-violet-300">{selectedLock?.multiplier}</span>
              </div>
              <div className="flex justify-between text-gray-400">
                <span>Est. APY:</span><span className="text-green-400">{selectedLock?.apy}</span>
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={staking || !amount}
            className="w-full bg-violet-600 hover:bg-violet-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold py-3 rounded-xl transition shadow-lg shadow-violet-500/20"
          >
            {staking ? 'Staking...' : `Stake ${amount || '0'} TWT`}
          </button>
        </form>
      </SectionCard>

      {/* Unstake Section */}
      {isActive && (
        <SectionCard>
          <h2 className="font-semibold text-white mb-5 flex items-center gap-2">
            {isUnlocked ? <Unlock size={15} className="text-green-400" /> : <Lock size={15} className="text-amber-400" />}
            Unstake
          </h2>
          {!isUnlocked && (
            <div className="flex items-start gap-3 bg-amber-500/5 border border-amber-500/15 rounded-xl p-3 mb-4">
              <Clock size={14} className="text-amber-400 flex-shrink-0 mt-0.5" />
              <p className="text-xs text-amber-300/80">
                Your stake is locked for <strong>{daysLeft} more days</strong> (until {unlockDate?.toLocaleDateString()}).
                Early unstaking may reset your rewards.
              </p>
            </div>
          )}
          <div className="flex gap-3">
            <input
              type="number"
              min="0"
              step="0.01"
              value={unstakeAmt}
              onChange={e => setUnstakeAmt(e.target.value)}
              placeholder={`Max: ${status?.stakeAmount || 0} TWT`}
              className="flex-1 bg-white/[0.04] border border-white/10 text-white placeholder-gray-600 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-red-500/50 transition"
            />
            <button
              onClick={handleUnstake}
              disabled={unstaking}
              className="px-5 py-3 bg-red-600/20 border border-red-500/30 text-red-400 hover:bg-red-600/30 rounded-xl text-sm font-medium transition disabled:opacity-50"
            >
              {unstaking ? 'Unstaking...' : 'Unstake'}
            </button>
          </div>
          <p className="text-xs text-gray-600 mt-2">Leave blank to unstake entire position ({status?.stakeAmount || 0} TWT)</p>
        </SectionCard>
      )}

      {/* APY info */}
      <SectionCard>
        <h3 className="font-semibold text-white mb-4 flex items-center gap-2"><TrendingUp size={15} className="text-violet-400" /> APY & Rewards Structure</h3>
        <div className="space-y-2 text-sm">
          <p className="text-gray-500 text-xs mb-3">Rewards are calculated based on your stake amount, watch time, and lock duration multiplier.</p>
          {lockOptions.map(({ label, apy, multiplier, color }) => (
            <div key={label} className={`flex items-center justify-between py-2 px-3 rounded-lg bg-white/[0.02] border border-white/5`}>
              <span className="text-gray-400">{label}</span>
              <div className="flex items-center gap-4">
                <span className="text-xs text-gray-500">Multiplier: <span className={color.split(' ').pop()}>{multiplier}</span></span>
                <span className="text-green-400 font-medium">{apy}</span>
              </div>
            </div>
          ))}
        </div>
      </SectionCard>
    </div>
  );
};

export default StakingPage;
