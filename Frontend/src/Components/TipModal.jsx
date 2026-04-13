import React, { useState, useContext } from 'react';
import { X, Zap, Star, Send, Coins } from 'lucide-react';
import { toast } from 'react-hot-toast';
import axios from 'axios';
import { Usercontext } from '../Context/Usercontext';

const TipModal = ({ creator, onClose }) => {
  const { authuser } = useContext(Usercontext);
  const [amount, setAmount] = useState('');
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [tipType, setTipType] = useState('micro'); // 'micro' | 'super'

  const balance = (authuser?.twtBalance || 0) + (authuser?.virtualTwtBalance || 0);
  const presets = [0.5, 1, 5, 10, 25, 50];

  const handleTip = async () => {
    const amt = parseFloat(amount);
    if (!amt || amt < 0.1) { toast.error('Minimum tip is 0.1 TWT'); return; }
    if (amt > balance) { toast.error(`Insufficient balance. You have ${balance.toFixed(2)} TWT`); return; }

    setSending(true);
    try {
      const token = localStorage.getItem('token');
      const { data } = await axios.post('/api/engagement/tip', {
        toUserId: creator._id,
        amount: amt,
        message,
      }, { headers: { token } });

      if (data.success) {
        toast.success(data.message);
        onClose();
      }
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Tip failed');
    } finally {
      setSending(false);
    }
  };

  const parsedAmt = parseFloat(amount) || 0;
  const isSuper = parsedAmt >= 10;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm px-4">
      <div className="bg-gray-900 border border-gray-700 rounded-2xl p-6 w-full max-w-md shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2">
            <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${isSuper ? 'bg-yellow-500/20' : 'bg-purple-500/20'}`}>
              {isSuper ? <Star className="w-4 h-4 text-yellow-400" /> : <Zap className="w-4 h-4 text-purple-400" />}
            </div>
            <div>
              <h3 className="text-white font-bold text-base">
                {isSuper ? '🌟 Super Tip' : '💸 Tip'}
              </h3>
              <p className="text-gray-400 text-xs">to @{creator?.username}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 hover:bg-gray-800 rounded-lg transition">
            <X className="w-4 h-4 text-gray-400" />
          </button>
        </div>

        {/* Balance */}
        <div className="bg-black/40 rounded-xl px-4 py-3 border border-gray-800 mb-5 flex items-center justify-between">
          <span className="text-gray-400 text-xs">Your balance</span>
          <span className="text-white font-bold text-sm flex items-center gap-1.5">
            <Coins className="w-3.5 h-3.5 text-purple-400" />
            {balance.toFixed(2)} TWT
          </span>
        </div>

        {/* Amount input */}
        <div className="mb-4">
          <label className="text-gray-400 text-xs mb-2 block">Tip Amount (TWT)</label>
          <div className="relative">
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.1"
              min="0.1"
              step="0.1"
              className="w-full bg-black/40 border border-gray-700 rounded-xl px-4 py-3 text-white text-lg font-bold placeholder-gray-600 focus:outline-none focus:border-purple-500 transition pr-16"
            />
            <span className={`absolute right-4 top-1/2 -translate-y-1/2 text-sm font-bold ${isSuper ? 'text-yellow-400' : 'text-purple-400'}`}>
              TWT
            </span>
          </div>
          {/* Super Tip Badge */}
          {isSuper && (
            <div className="mt-2 flex items-center gap-1.5 text-yellow-400 text-xs">
              <Star className="w-3 h-3" />
              Super Tip unlocked! Your message gets pinned for 1 hour.
            </div>
          )}
        </div>

        {/* Preset amounts */}
        <div className="grid grid-cols-6 gap-2 mb-4">
          {presets.map((p) => (
            <button
              key={p}
              onClick={() => setAmount(p.toString())}
              className={`py-1.5 rounded-lg text-xs font-semibold transition-all border ${
                parseFloat(amount) === p
                  ? 'bg-purple-600 border-purple-500 text-white'
                  : 'bg-gray-800 border-gray-700 text-gray-300 hover:bg-gray-700'
              }`}
            >
              {p}
            </button>
          ))}
        </div>

        {/* Message (super tip only shows pinned) */}
        <div className="mb-5">
          <label className="text-gray-400 text-xs mb-2 block">
            Message {isSuper ? '(pinned for 1 hour)' : '(optional)'}
          </label>
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder={isSuper ? "Your message will be highlighted!" : "Say something nice..."}
            maxLength={200}
            rows={2}
            className={`w-full bg-black/40 border rounded-xl px-4 py-3 text-white text-sm placeholder-gray-600 focus:outline-none transition resize-none ${
              isSuper ? 'border-yellow-500/50 focus:border-yellow-400' : 'border-gray-700 focus:border-purple-500'
            }`}
          />
          <div className="text-right text-gray-600 text-xs mt-1">{message.length}/200</div>
        </div>

        {/* Fee breakdown */}
        {parsedAmt > 0 && (
          <div className="bg-gray-800/50 rounded-xl p-3 mb-4 text-xs space-y-1">
            <div className="flex justify-between text-gray-400">
              <span>Creator receives (95%)</span>
              <span className="text-green-400 font-semibold">{(parsedAmt * 0.95).toFixed(4)} TWT</span>
            </div>
            <div className="flex justify-between text-gray-500">
              <span>Platform fee (5%)</span>
              <span>{(parsedAmt * 0.05).toFixed(4)} TWT</span>
            </div>
          </div>
        )}

        {/* Send Button */}
        <button
          onClick={handleTip}
          disabled={sending || !amount || parsedAmt < 0.1}
          className={`w-full py-3 rounded-xl font-bold text-white transition-all flex items-center justify-center gap-2 disabled:opacity-50 ${
            isSuper
              ? 'bg-gradient-to-r from-yellow-600 to-orange-600 hover:from-yellow-500 hover:to-orange-500 shadow-lg shadow-yellow-900/30'
              : 'bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500'
          }`}
        >
          {sending ? (
            <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
          ) : (
            <Send className="w-4 h-4" />
          )}
          {sending ? 'Sending…' : `Send ${parsedAmt > 0 ? parsedAmt + ' TWT' : 'Tip'}`}
        </button>
      </div>
    </div>
  );
};

export default TipModal;
