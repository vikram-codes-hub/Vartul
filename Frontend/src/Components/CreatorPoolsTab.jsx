import React, { useState, useEffect } from 'react';
import { Users, Lock, TrendingUp, ChevronRight, Search, Plus, Award, Clock } from 'lucide-react';
import { toast } from 'react-hot-toast';
import axios from 'axios';

const CreatorPoolsTab = () => {
  const [stakes, setStakes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stakeModal, setStakeModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [selectedCreator, setSelectedCreator] = useState(null);
  const [amount, setAmount] = useState('');
  const [lockDays, setLockDays] = useState(7);
  const [staking, setStaking] = useState(false);

  const token = localStorage.getItem('token');

  const loadStakes = async () => {
    try {
      setLoading(true);
      const { data } = await axios.get('/api/engagement/creator-stakes', { headers: { token } });
      if (data.success) setStakes(data.stakes);
    } catch {
      // silently fail
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadStakes(); }, []);

  const handleSearch = async (q) => {
    setSearchQuery(q);
    if (!q.trim()) { setSearchResults([]); return; }
    setSearching(true);
    try {
      const { data } = await axios.get(`/api/auth/search?q=${encodeURIComponent(q)}`, { headers: { token } });
      setSearchResults(data.users || data || []);
    } catch {
      setSearchResults([]);
    } finally {
      setSearching(false);
    }
  };

  const handleStake = async () => {
    if (!selectedCreator || !amount || parseFloat(amount) < 1) {
      toast.error('Select a creator and enter at least 1 TWT');
      return;
    }
    setStaking(true);
    try {
      const { data } = await axios.post('/api/engagement/creator-stake', {
        creatorId: selectedCreator._id,
        amount: parseFloat(amount),
        lockDays,
      }, { headers: { token } });
      if (data.success) {
        toast.success(data.message);
        setStakeModal(false);
        setSelectedCreator(null);
        setAmount('');
        setLockDays(7);
        loadStakes();
      }
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Staking failed');
    } finally {
      setStaking(false);
    }
  };

  const lockOptions = [
    { days: 7, label: '7 Days', apy: '8%', color: 'text-blue-400' },
    { days: 30, label: '30 Days', apy: '12%', color: 'text-purple-400' },
    { days: 90, label: '90 Days', apy: '18%', color: 'text-pink-400' },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-white font-bold text-lg">Creator Staking Pools</h3>
          <p className="text-gray-400 text-sm mt-0.5">Back creators you believe in and earn yield from their success.</p>
        </div>
        <button
          onClick={() => setStakeModal(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white rounded-xl font-semibold text-sm transition-all hover:scale-105"
        >
          <Plus className="w-4 h-4" /> Back a Creator
        </button>
      </div>

      {/* How It Works */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {[
          { icon: <Users className="w-4 h-4 text-purple-400" />, title: 'Choose a Creator', desc: 'Pick a creator whose content you love and believe will grow.', color: 'from-purple-600/10 to-purple-900/5' },
          { icon: <Lock className="w-4 h-4 text-blue-400" />, title: 'Stake & Lock', desc: 'Lock TWT for 7, 30, or 90 days. Longer = higher APY yield.', color: 'from-blue-600/10 to-blue-900/5' },
          { icon: <TrendingUp className="w-4 h-4 text-green-400" />, title: 'Earn Yield', desc: '15% of the creator\'s epoch rewards flow to their stakers.', color: 'from-green-600/10 to-green-900/5' },
        ].map(({ icon, title, desc, color }) => (
          <div key={title} className={`bg-gradient-to-br ${color} border border-gray-800 rounded-xl p-4`}>
            <div className="flex items-center gap-2 mb-2">{icon}<h4 className="text-white font-semibold text-sm">{title}</h4></div>
            <p className="text-gray-400 text-xs leading-relaxed">{desc}</p>
          </div>
        ))}
      </div>

      {/* Active Stakes */}
      <div>
        <h4 className="text-white font-semibold mb-3 flex items-center gap-2">
          <Award className="w-4 h-4 text-yellow-400" /> Your Active Stakes
          <span className="text-gray-500 text-sm font-normal">({stakes.length})</span>
        </h4>

        {loading ? (
          <div className="space-y-3">
            {[1, 2].map(i => (
              <div key={i} className="bg-gray-900/60 rounded-xl border border-gray-800 p-4 animate-pulse">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gray-700" />
                  <div className="flex-1 space-y-2">
                    <div className="h-3 bg-gray-700 rounded w-1/3" />
                    <div className="h-2 bg-gray-800 rounded w-1/4" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : stakes.length === 0 ? (
          <div className="bg-gray-900/50 rounded-xl border border-gray-800 p-8 text-center">
            <Users className="w-10 h-10 text-gray-600 mx-auto mb-3" />
            <p className="text-gray-400 text-sm mb-1">No active creator stakes yet.</p>
            <p className="text-gray-600 text-xs">Back a creator to start earning yield from their rewards.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {stakes.map((stake) => (
              <div key={stake._id} className="bg-gray-900/60 rounded-xl border border-gray-800 hover:border-purple-500/30 p-4 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full overflow-hidden bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                    {stake.creator?.profilePic ? (
                      <img src={stake.creator.profilePic} alt="" className="w-full h-full object-cover" />
                    ) : stake.creator?.username?.[0]?.toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-white font-semibold text-sm">@{stake.creator?.username}</span>
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${stake.isUnlocked ? 'bg-green-900/40 text-green-400' : 'bg-blue-900/40 text-blue-400'}`}>
                        {stake.isUnlocked ? 'Unlocked' : `${stake.daysLeft}d left`}
                      </span>
                    </div>
                    <div className="flex items-center gap-4 mt-1 text-xs text-gray-500">
                      <span className="flex items-center gap-1"><Lock className="w-3 h-3" />{stake.lockDays}-day lock</span>
                      <span>PST: {stake.pstTokens?.toFixed(2)}</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-white font-bold text-sm">{stake.amount} TWT</div>
                    <div className="text-green-400 text-xs">+{stake.yieldEarned?.toFixed(4) || '0'} earned</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Stake Modal */}
      {stakeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm px-4">
          <div className="bg-gray-900 border border-gray-700 rounded-2xl p-6 w-full max-w-md shadow-2xl">
            <div className="flex justify-between items-center mb-5">
              <h3 className="text-white font-bold text-base">Back a Creator</h3>
              <button onClick={() => { setStakeModal(false); setSelectedCreator(null); setSearchResults([]); setSearchQuery(''); }}>
                ✕
              </button>
            </div>

            {/* Creator Search */}
            {!selectedCreator ? (
              <div>
                <label className="text-gray-400 text-xs mb-2 block">Search for a creator</label>
                <div className="relative">
                  <Search className="w-4 h-4 text-gray-500 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    value={searchQuery}
                    onChange={(e) => handleSearch(e.target.value)}
                    placeholder="Search by username…"
                    className="w-full bg-black/40 border border-gray-700 rounded-xl pl-9 pr-4 py-2.5 text-white text-sm placeholder-gray-600 focus:outline-none focus:border-purple-500 transition"
                  />
                </div>
                <div className="mt-2 space-y-1 max-h-48 overflow-y-auto">
                  {searching && <p className="text-gray-500 text-xs px-2 py-2">Searching…</p>}
                  {searchResults.map((u) => (
                    <button
                      key={u._id}
                      onClick={() => { setSelectedCreator(u); setSearchResults([]); setSearchQuery(''); }}
                      className="w-full flex items-center gap-3 p-2.5 hover:bg-gray-800 rounded-lg transition text-left"
                    >
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white text-xs font-bold flex-shrink-0 overflow-hidden">
                        {u.profilePic ? <img src={u.profilePic} alt="" className="w-full h-full object-cover" /> : u.username?.[0]?.toUpperCase()}
                      </div>
                      <div>
                        <div className="text-white text-sm font-medium">@{u.username}</div>
                        <div className="text-gray-500 text-xs">{u.followersCount || 0} followers</div>
                      </div>
                      <ChevronRight className="w-4 h-4 text-gray-600 ml-auto" />
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <div>
                {/* Selected creator */}
                <div className="flex items-center gap-3 bg-purple-900/20 border border-purple-500/30 rounded-xl p-3 mb-4">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-bold overflow-hidden flex-shrink-0">
                    {selectedCreator.profilePic ? <img src={selectedCreator.profilePic} alt="" className="w-full h-full object-cover" /> : selectedCreator.username?.[0]?.toUpperCase()}
                  </div>
                  <div className="flex-1">
                    <div className="text-white font-semibold text-sm">@{selectedCreator.username}</div>
                    <div className="text-gray-400 text-xs">{selectedCreator.followersCount || 0} followers</div>
                  </div>
                  <button onClick={() => setSelectedCreator(null)} className="text-gray-500 hover:text-white text-xs">Change</button>
                </div>

                {/* Amount */}
                <div className="mb-4">
                  <label className="text-gray-400 text-xs mb-2 block">Stake Amount (TWT)</label>
                  <input
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="Min 1 TWT"
                    min="1"
                    className="w-full bg-black/40 border border-gray-700 rounded-xl px-4 py-3 text-white text-lg font-bold placeholder-gray-600 focus:outline-none focus:border-purple-500 transition"
                  />
                </div>

                {/* Lock period */}
                <div className="mb-5">
                  <label className="text-gray-400 text-xs mb-2 block">Lock Period</label>
                  <div className="grid grid-cols-3 gap-2">
                    {lockOptions.map((opt) => (
                      <button
                        key={opt.days}
                        onClick={() => setLockDays(opt.days)}
                        className={`py-3 rounded-xl border transition-all text-center ${lockDays === opt.days ? 'bg-purple-900/50 border-purple-500 text-white' : 'bg-gray-800 border-gray-700 text-gray-400 hover:border-gray-600'}`}
                      >
                        <div className="font-bold text-sm">{opt.label}</div>
                        <div className={`text-xs font-semibold ${opt.color}`}>{opt.apy} APY</div>
                      </button>
                    ))}
                  </div>
                  <p className="text-gray-600 text-xs mt-2 flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    Early unstake incurs a 3% penalty redistributed to loyal stakers.
                  </p>
                </div>

                <button
                  onClick={handleStake}
                  disabled={staking}
                  className="w-full py-3 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold rounded-xl transition-all disabled:opacity-50"
                >
                  {staking ? 'Staking…' : `Stake ${amount || '0'} TWT for ${lockDays} Days`}
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default CreatorPoolsTab;
