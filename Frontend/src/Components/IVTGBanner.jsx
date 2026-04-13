import React, { useState } from 'react';
import { Gift, X, Zap, ChevronRight } from 'lucide-react';
import { toast } from 'react-hot-toast';
import axios from 'axios';

const IVTGBanner = ({ onClaimed }) => {
  const [claiming, setClaiming] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  if (dismissed) return null;

  const handleClaim = async () => {
    setClaiming(true);
    try {
      const token = localStorage.getItem('token');
      const { data } = await axios.post('/api/engagement/claim-ivtg', {}, { headers: { token } });
      if (data.success) {
        toast.success(data.message);
        if (onClaimed) onClaimed(data.virtualTwtBalance);
        setDismissed(true);
      }
    } catch (err) {
      const msg = err?.response?.data?.message || 'Claim failed';
      if (msg.includes('already claimed')) {
        setDismissed(true);
      } else {
        toast.error(msg);
      }
    } finally {
      setClaiming(false);
    }
  };

  return (
    <div className="relative rounded-2xl overflow-hidden bg-gradient-to-r from-yellow-900/40 via-orange-900/30 to-yellow-900/40 border border-yellow-500/40 p-5 shadow-2xl shadow-yellow-900/20">
      {/* Animated glow */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-6 -right-6 w-32 h-32 bg-yellow-500/15 rounded-full blur-2xl animate-pulse" />
        <div className="absolute -bottom-4 -left-4 w-24 h-24 bg-orange-500/10 rounded-full blur-xl" />
      </div>

      <div className="relative flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-2xl bg-yellow-500/20 flex items-center justify-center flex-shrink-0 border border-yellow-500/30">
            <Gift className="w-6 h-6 text-yellow-400" />
          </div>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <h3 className="text-white font-bold text-base">🎁 Welcome Gift — 100 Virtual TWT</h3>
              <span className="bg-yellow-500/20 text-yellow-400 text-[10px] font-bold px-2 py-0.5 rounded-full border border-yellow-500/30 uppercase tracking-wider">New User</span>
            </div>
            <p className="text-yellow-200/70 text-sm leading-relaxed max-w-lg">
              As a new member of the Vartul ecosystem, you receive <span className="text-yellow-300 font-semibold">100 virtual TWT</span> to start exploring. 
              Virtual tokens convert to <span className="text-white font-semibold">real TWT</span> after 14 days + 3 watch sessions.
            </p>
            <div className="flex flex-wrap gap-4 mt-2">
              {[
                { label: 'Signup Bonus', amount: '+50 TWT' },
                { label: 'Profile Bonus', amount: '+25 TWT' },
                { label: 'First Watch', amount: '+25 TWT' },
              ].map(({ label, amount }) => (
                <div key={label} className="flex items-center gap-1 text-xs text-yellow-300/70">
                  <Zap className="w-3 h-3" />
                  <span>{label}: <span className="text-yellow-300 font-semibold">{amount}</span></span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-shrink-0">
          <button
            onClick={handleClaim}
            disabled={claiming}
            className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-400 hover:to-orange-400 text-black font-bold rounded-xl text-sm transition-all hover:scale-105 shadow-lg shadow-yellow-900/30 disabled:opacity-60"
          >
            {claiming ? (
              <span className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
            ) : (
              <Gift className="w-4 h-4" />
            )}
            {claiming ? 'Claiming…' : 'Claim 100 TWT'}
            {!claiming && <ChevronRight className="w-4 h-4" />}
          </button>
          <button
            onClick={() => setDismissed(true)}
            className="p-2 hover:bg-yellow-900/40 rounded-lg transition"
          >
            <X className="w-4 h-4 text-yellow-500/60 hover:text-yellow-300" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default IVTGBanner;
