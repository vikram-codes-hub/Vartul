import React, { useState } from 'react';

const StakeModal = ({ isOpen, onClose, onConfirm, creatorName }) => {
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleStake = async () => {
    if (!amount || isNaN(amount) || amount <= 0) return;
    
    setLoading(true);
    // Simulate Solana transaction
    setTimeout(() => {
      const mockTxHash = "sol_tx_" + Math.random().toString(36).substr(2, 9);
      onConfirm(Number(amount), mockTxHash);
      setLoading(false);
      setAmount('');
      onClose();
    }, 1500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-gray-900 border border-gray-700 rounded-xl w-full max-w-sm p-6 text-white shadow-2xl">
        <h3 className="text-xl font-bold mb-2">Stake on {creatorName}</h3>
        <p className="text-gray-400 text-sm mb-4">
          Staking TWT supports the creator and boosts your potential rewards.
          Locked for 24h.
        </p>

        <div className="mb-4">
          <label className="block text-xs font-medium text-gray-400 mb-1">
            Amount (TWT)
          </label>
          <input
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="w-full bg-gray-800 border border-gray-700 rounded-lg p-3 text-white focus:outline-none focus:border-blue-500"
            placeholder="0.00"
          />
        </div>

        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-3 px-4 rounded-lg bg-gray-800 hover:bg-gray-700 text-sm font-medium transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleStake}
            disabled={loading}
            className="flex-1 py-3 px-4 rounded-lg bg-blue-600 hover:bg-blue-500 text-sm font-medium transition-colors disabled:opacity-50 flex justify-center items-center"
          >
            {loading ? (
              <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
            ) : (
              'Confirm Stake'
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default StakeModal;
