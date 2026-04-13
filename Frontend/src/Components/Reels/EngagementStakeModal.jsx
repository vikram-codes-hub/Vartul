import React, { useState, useEffect } from 'react';
import { stakeEngagementTokens } from '../../api/engagement.api';
import { fetchDashboardStats } from '../../api/engagement.api';
import { TrendingUp, Coins, Info } from 'lucide-react';

const EngagementStakeModal = ({ isOpen, onClose, onSuccess }) => {
  const [amount, setAmount] = useState('');
  const [duration, setDuration] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [twtBalance, setTwtBalance] = useState(null);

  // Fetch user's current balance when modal opens
  useEffect(() => {
    if (!isOpen) return;
    fetchDashboardStats()
      .then(data => setTwtBalance(data?.wallet?.available ?? data?.wallet?.total ?? 0))
      .catch(() => setTwtBalance(null));
  }, [isOpen]);

  if (!isOpen) return null;

  const stakingPlans = [
    { days: 1, apy: '8%', label: '1 Day' },
    { days: 7, apy: '10%', label: '7 Days' },
    { days: 30, apy: '12%', label: '30 Days' },
  ];

  const selectedPlan = stakingPlans.find(p => p.days === duration);
  const estimatedReward = amount && !isNaN(amount) && selectedPlan
    ? (parseFloat(amount) * parseFloat(selectedPlan.apy) / 100 * duration / 365).toFixed(4)
    : '0.0000';

  const handleStake = async () => {
    if (!amount || isNaN(amount) || amount <= 0) {
      setError('Please enter a valid amount');
      return;
    }
    if (twtBalance !== null && parseFloat(amount) > twtBalance) {
      setError(`Insufficient balance. You have ${twtBalance.toLocaleString()} TWT available.`);
      return;
    }
    setLoading(true);
    setError('');
    try {
      await stakeEngagementTokens(Number(amount), Number(duration));
      onSuccess?.();
      onClose();
    } catch (err) {
      setError(err?.response?.data?.message || 'Staking failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="bg-gray-900 border border-blue-500/30 rounded-2xl w-full max-w-sm p-6 text-white shadow-2xl relative overflow-hidden">
        {/* Glow */}
        <div className="absolute top-0 right-0 w-40 h-40 bg-blue-500/10 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none" />

        <h3 className="text-xl font-bold mb-1 flex items-center gap-2 relative">
          <span className="text-blue-400">⚡</span> Activate Auto-Earning
        </h3>
        <p className="text-gray-400 text-sm mb-5 leading-relaxed relative">
          Stake TWT to unlock <b className="text-white">Proof-of-Engagement</b> rewards. Earn tokens automatically while you watch reels.
        </p>

        {/* Current Balance Display */}
        {twtBalance !== null && (
          <div className="bg-blue-900/20 border border-blue-500/20 rounded-xl px-4 py-3 mb-4 flex items-center justify-between relative">
            <div className="flex items-center gap-2">
              <Coins className="w-4 h-4 text-blue-400" />
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
                onChange={(e) => setAmount(e.target.value)}
                className="w-full bg-gray-800 border border-gray-700 rounded-xl p-3 pr-16 text-white focus:outline-none focus:border-blue-500 transition-all text-sm"
                placeholder="e.g. 100"
                min="1"
              />
              {twtBalance !== null && (
                <button
                  onClick={() => setAmount(String(twtBalance))}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-blue-400 hover:text-blue-300 font-semibold"
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
                  className={`py-2.5 px-2 rounded-xl text-xs font-medium border transition-all ${duration === plan.days
                    ? 'bg-blue-600/20 border-blue-500 text-blue-300'
                    : 'bg-gray-800 border-gray-700 text-gray-400 hover:border-gray-600'
                    }`}
                >
                  <div className="font-bold">{plan.label}</div>
                  <div className="text-[10px] mt-0.5 opacity-70">{plan.apy} APY</div>
                </button>
              ))}
            </div>
          </div>

          {/* Estimated Reward */}
          {amount && parseFloat(amount) > 0 && (
            <div className="bg-green-900/20 border border-green-500/20 rounded-xl px-4 py-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-green-400" />
                <span className="text-gray-400 text-xs">Estimated Reward</span>
              </div>
              <span className="text-green-400 font-bold text-sm">~{estimatedReward} TWT</span>
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
            disabled={loading}
            className="flex-1 py-3 px-4 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-sm font-bold text-white shadow-lg shadow-blue-900/20 transition-all disabled:opacity-50 flex justify-center items-center gap-2"
          >
            {loading
              ? <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              : <><TrendingUp className="w-4 h-4" /> Stake & Earn</>}
          </button>
        </div>

        <div className="flex items-start gap-1.5 mt-4 relative">
          <Info className="w-3 h-3 text-gray-600 flex-shrink-0 mt-0.5" />
          <p className="text-[10px] text-gray-500">
            Tokens are locked for the selected duration. Rewards are distributed daily based on your engagement.
          </p>
        </div>
      </div>
    </div>
  );
};

export default EngagementStakeModal;
