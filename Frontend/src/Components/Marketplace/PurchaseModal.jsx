import React, { useState } from 'react';

const PurchaseModal = ({ isOpen, onClose, onConfirm, item }) => {
  const [loading, setLoading] = useState(false);

  if (!isOpen || !item) return null;

  const handlePurchase = async () => {
    setLoading(true);
    // Simulate Solana transaction
    setTimeout(() => {
      const mockTxHash = "sol_tx_buy_" + Math.random().toString(36).substr(2, 9);
      onConfirm(item, mockTxHash);
      setLoading(false);
      onClose();
    }, 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-gray-900 border border-gray-700 rounded-xl w-full max-w-sm p-6 text-white shadow-2xl">
        <h3 className="text-xl font-bold mb-2">Confirm Purchase</h3>
        <p className="text-gray-400 text-sm mb-4">
          You are about to purchase <strong>{item.name}</strong> for <strong>{item.priceTWT} TWT</strong>.
        </p>

        <div className="bg-gray-800 rounded-lg p-3 mb-6 flex items-center gap-3">
          <img src={item.ipfsImage} alt={item.name} className="w-12 h-12 rounded object-cover" />
          <div>
            <div className="font-semibold text-sm">{item.name}</div>
            <div className="text-xs text-purple-400">{item.priceTWT} TWT</div>
          </div>
        </div>

        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-3 px-4 rounded-lg bg-gray-800 hover:bg-gray-700 text-sm font-medium transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handlePurchase}
            disabled={loading}
            className="flex-1 py-3 px-4 rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-sm font-medium transition-colors disabled:opacity-50 flex justify-center items-center"
          >
            {loading ? (
              <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
            ) : (
              'Confirm Purchase'
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default PurchaseModal;
