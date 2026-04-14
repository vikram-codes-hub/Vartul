import React, { useState, useEffect } from 'react';
import { stakeEngagementTokens } from '../../api/engagement.api';
import { fetchDashboardStats } from '../../api/engagement.api';
import {
  TrendingUp, Coins, Info, CheckCircle, X,
  ExternalLink, Copy, Zap, Lock
} from 'lucide-react';
import { toast } from 'react-hot-toast';

const EngagementStakeModal = ({ isOpen, onClose, onSuccess }) => {
  const [amount, setAmount]       = useState('');
  const [duration, setDuration]   = useState(7);
  const [loading, setLoading]     = useState(false);
  const [error, setError]         = useState('');
  const [twtBalance, setTwtBalance] = useState(null);
  const [success, setSuccess]     = useState(null); // { txHash, amount, duration }

  // Fetch user's current balance when modal opens
  useEffect(() => {
    if (!isOpen) return;
    setSuccess(null);
    setError('');
    setAmount('');
    fetchDashboardStats()
      .then(data => setTwtBalance(data?.wallet?.available ?? data?.wallet?.total ?? 0))
      .catch(() => setTwtBalance(null));
  }, [isOpen]);

  if (!isOpen) return null;

  const stakingPlans = [
    { days: 1,  apy: '8%',  label: '1 Day',   badge: 'Starter'  },
    { days: 7,  apy: '10%', label: '7 Days',  badge: 'Popular'  },
    { days: 30, apy: '12%', label: '30 Days', badge: 'Max APY'  },
  ];

  const selectedPlan    = stakingPlans.find(p => p.days === duration);
  const parsedAmount    = parseFloat(amount);
  const estimatedReward = amount && !isNaN(parsedAmount) && selectedPlan
    ? (parsedAmount * parseFloat(selectedPlan.apy) / 100 * duration / 365).toFixed(4)
    : '0.0000';

  const handleStake = async () => {
    if (!amount || isNaN(parsedAmount) || parsedAmount <= 0) {
      setError('Please enter a valid stake amount');
      return;
    }
    // Only block if we KNOW the balance and the amount exceeds it
    if (twtBalance !== null && twtBalance > 0 && parsedAmount > twtBalance) {
      setError(`Insufficient balance. You have ${twtBalance.toLocaleString()} TWT available.`);
      return;
    }
    setLoading(true);
    setError('');
    try {
      const result = await stakeEngagementTokens(Number(amount), Number(duration));
      setSuccess({
        txHash:   result?.txHash   || `stake_${Date.now()}`,
        amount:   parsedAmount,
        duration: duration,
        apy:      selectedPlan?.apy,
      });
      onSuccess?.();
    } catch (err) {
      setError(err?.response?.data?.message || 'Staking failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const copyTx = (tx) => {
    navigator.clipboard.writeText(tx);
    toast.success('TX ID copied!');
  };

  // ── Success Screen ──────────────────────────────────────────────────────────
  if (success) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
        <div className="bg-gray-900 border border-emerald-500/40 rounded-2xl w-full max-w-sm p-6 text-white shadow-2xl relative overflow-hidden">
          {/* Glow */}
          <div className="absolute top-0 left-0 w-full h-full bg-emerald-500/5 pointer-events-none" />
          <div className="absolute top-0 right-0 w-48 h-48 bg-emerald-500/15 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none" />

          <div className="relative flex flex-col items-center text-center">
            {/* Animated check */}
            <div className="w-20 h-20 rounded-full bg-emerald-500/20 border-2 border-emerald-500/50 flex items-center justify-center mb-5 animate-pulse">
              <CheckCircle className="w-10 h-10 text-emerald-400" />
            </div>

            <h3 className="text-2xl font-bold text-white mb-1">Stake Activated! 🎉</h3>
            <p className="text-gray-400 text-sm mb-6">
              Your <span className="text-white font-bold">{success.amount.toLocaleString()} TWT</span> is now locked for{' '}
              <span className="text-emerald-400 font-bold">{success.duration} day{success.duration > 1 ? 's' : ''}</span> at{' '}
              <span className="text-yellow-400 font-bold">{success.apy} APY</span>.
            </p>

            {/* Stats row */}
            <div className="w-full grid grid-cols-3 gap-3 mb-5">
              {[
                { label: 'Staked', value: `${success.amount} TWT`, color: 'text-white' },
                { label: 'Duration', value: `${success.duration}d`, color: 'text-indigo-400' },
                { label: 'APY', value: success.apy, color: 'text-yellow-400' },
              ].map(s => (
                <div key={s.label} className="bg-white/5 rounded-xl p-3 border border-white/10">
                  <div className={`font-bold text-sm ${s.color}`}>{s.value}</div>
                  <div className="text-gray-500 text-[10px] mt-0.5">{s.label}</div>
                </div>
              ))}
            </div>

            {/* TX Hash */}
            <div className="w-full bg-black/50 border border-white/10 rounded-xl p-3 mb-5 flex items-center justify-between gap-2">
              <div>
                <div className="text-[10px] text-gray-500 mb-0.5">Transaction ID</div>
                <div className="font-mono text-xs text-indigo-300 truncate max-w-[160px]">
                  {success.txHash}
                </div>
              </div>
              <button
                onClick={() => copyTx(success.txHash)}
                className="p-2 bg-white/5 hover:bg-white/10 rounded-lg transition"
              >
                <Copy className="w-3.5 h-3.5 text-gray-400" />
              </button>
            </div>

            {/* W2E tip */}
            <div className="w-full flex items-start gap-2 bg-blue-900/20 border border-blue-500/20 rounded-xl p-3 mb-5 text-left">
              <Zap className="w-4 h-4 text-blue-400 flex-shrink-0 mt-0.5" />
              <p className="text-[11px] text-blue-200">
                <strong>Now go watch reels!</strong> Every 5 seconds of verified watch time earns you TWT tokens automatically.
              </p>
            </div>

            <button
              onClick={onClose}
              className="w-full py-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 rounded-xl text-white font-bold text-sm transition-all shadow-lg shadow-emerald-900/30"
            >
              Start Earning →
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── Stake Form ──────────────────────────────────────────────────────────────
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="bg-gray-900 border border-indigo-500/30 rounded-2xl w-full max-w-sm p-6 text-white shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-40 h-40 bg-indigo-500/10 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none" />

        {/* Header */}
        <div className="flex items-center justify-between mb-4 relative">
          <div>
            <h3 className="text-xl font-bold flex items-center gap-2">
              <Zap className="w-5 h-5 text-yellow-400" /> Stake & Earn
            </h3>
            <p className="text-gray-400 text-xs mt-0.5">Lock TWT → Earn Proof-of-Engagement rewards</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 bg-white/5 hover:bg-white/10 rounded-xl transition"
          >
            <X className="w-4 h-4 text-gray-400" />
          </button>
        </div>

        {/* Current Balance */}
        {twtBalance !== null && (
          <div className="bg-indigo-900/20 border border-indigo-500/20 rounded-xl px-4 py-3 mb-4 flex items-center justify-between relative">
            <div className="flex items-center gap-2">
              <Coins className="w-4 h-4 text-indigo-400" />
              <span className="text-gray-400 text-xs">Available TWT</span>
            </div>
            <span className="text-white font-bold text-sm">{twtBalance.toLocaleString()} TWT</span>
          </div>
        )}

        <div className="space-y-4 mb-5 relative">
          {/* Amount Input */}
          <div>
            <label className="block text-xs font-medium text-gray-400 mb-1.5">Stake Amount (TWT)</label>
            <div className="relative">
              <input
                type="number"
                value={amount}
                onChange={(e) => { setAmount(e.target.value); setError(''); }}
                className="w-full bg-gray-800 border border-gray-700 rounded-xl p-3 pr-16 text-white focus:outline-none focus:border-indigo-500 transition-all text-sm"
                placeholder="e.g. 100"
                min="1"
              />
              {twtBalance !== null && (
                <button
                  onClick={() => setAmount(String(twtBalance))}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-indigo-400 hover:text-indigo-300 font-semibold"
                >
                  MAX
                </button>
              )}
            </div>
          </div>

          {/* Lock Duration */}
          <div>
            <label className="block text-xs font-medium text-gray-400 mb-1.5">Lock Duration</label>
            <div className="grid grid-cols-3 gap-2">
              {stakingPlans.map((plan) => (
                <button
                  key={plan.days}
                  onClick={() => setDuration(plan.days)}
                  className={`py-3 px-2 rounded-xl text-xs font-medium border transition-all relative ${
                    duration === plan.days
                      ? 'bg-indigo-600/25 border-indigo-500 text-indigo-300'
                      : 'bg-gray-800 border-gray-700 text-gray-400 hover:border-gray-600'
                  }`}
                >
                  {plan.days === 7 && (
                    <span className="absolute -top-2 left-1/2 -translate-x-1/2 px-1.5 py-0.5 bg-indigo-600 rounded-full text-[9px] font-bold text-white whitespace-nowrap">
                      Popular
                    </span>
                  )}
                  <div className="font-bold">{plan.label}</div>
                  <div className="text-[10px] mt-0.5 opacity-70">{plan.apy} APY</div>
                </button>
              ))}
            </div>
          </div>

          {/* Estimated Reward */}
          {amount && parsedAmount > 0 && (
            <div className="bg-emerald-900/20 border border-emerald-500/20 rounded-xl px-4 py-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-emerald-400" />
                <span className="text-gray-400 text-xs">Estimated Reward</span>
              </div>
              <span className="text-emerald-400 font-bold text-sm">~{estimatedReward} TWT</span>
            </div>
          )}
        </div>

        {error && <p className="text-red-400 text-xs mb-4 relative">{error}</p>}

        <div className="flex gap-3 relative">
          <button
            onClick={onClose}
            className="flex-1 py-3 px-4 rounded-xl bg-gray-800 hover:bg-gray-700 text-sm font-medium transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleStake}
            disabled={loading || !amount || parsedAmount <= 0}
            className="flex-1 py-3 px-4 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-sm font-bold text-white shadow-lg shadow-indigo-900/30 transition-all disabled:opacity-50 flex justify-center items-center gap-2"
          >
            {loading
              ? <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              : <><Lock className="w-4 h-4" /> Stake & Earn</>}
          </button>
        </div>

        <div className="flex items-start gap-1.5 mt-4 relative">
          <Info className="w-3 h-3 text-gray-600 flex-shrink-0 mt-0.5" />
          <p className="text-[10px] text-gray-500">
            Tokens are locked for the selected duration. Rewards accumulate as you watch reels (Watch-to-Earn).
          </p>
        </div>
      </div>
    </div>
  );
};

export default EngagementStakeModal;
