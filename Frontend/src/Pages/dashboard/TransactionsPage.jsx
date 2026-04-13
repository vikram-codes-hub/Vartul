import React, { useState, useEffect } from 'react';
import { ArrowLeftRight, ExternalLink, RefreshCw, CheckCircle, XCircle, Clock, Filter } from 'lucide-react';
import axiosInstance from '../../Utils/axiosInstance';
import toast from 'react-hot-toast';

const TX_COLORS = {
  reward: 'text-green-400 bg-green-500/10 border-green-500/20',
  stake: 'text-blue-400 bg-blue-500/10 border-blue-500/20',
  unstake: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
  transfer: 'text-violet-400 bg-violet-500/10 border-violet-500/20',
  tip: 'text-pink-400 bg-pink-500/10 border-pink-500/20',
  airdrop: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/20',
  ivtg: 'text-yellow-400 bg-yellow-500/10 border-yellow-500/20',
};
const TX_LABELS = {
  reward: 'Watch Reward', stake: 'Stake', unstake: 'Unstake',
  transfer: 'Transfer', tip: 'Tip', airdrop: 'Airdrop', ivtg: 'Token Grant',
};

const StatusBadge = ({ status }) => {
  if (status === 'confirmed') return <span className="flex items-center gap-1 text-[11px] text-green-400"><CheckCircle size={11} /> Confirmed</span>;
  if (status === 'failed') return <span className="flex items-center gap-1 text-[11px] text-red-400"><XCircle size={11} /> Failed</span>;
  return <span className="flex items-center gap-1 text-[11px] text-amber-400"><Clock size={11} /> Pending</span>;
};

const TransactionsPage = () => {
  const [internalLogs, setInternalLogs] = useState([]);
  const [onChainTxs, setOnChainTxs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('internal');
  const [typeFilter, setTypeFilter] = useState('all');

  const loadData = async () => {
    try {
      setLoading(true);
      const [logsRes, chainRes] = await Promise.allSettled([
        axiosInstance.get('/api/engagement/tx-logs?limit=50'),
        axiosInstance.get('/api/engagement/transactions?limit=20'),
      ]);
      if (logsRes.status === 'fulfilled') setInternalLogs(logsRes.value.data.logs || []);
      if (chainRes.status === 'fulfilled') setOnChainTxs(chainRes.value.data.transactions || []);
    } catch {
      toast.error('Failed to load transactions');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, []);

  const filterTypes = ['all', 'reward', 'stake', 'unstake', 'transfer', 'tip', 'airdrop'];
  const filteredLogs = typeFilter === 'all' ? internalLogs : internalLogs.filter(l => l.type === typeFilter);

  if (loading) return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <div className="w-8 h-8 border-[3px] border-violet-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="p-4 md:p-8 space-y-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Transactions</h1>
          <p className="text-sm text-gray-500 mt-1">All your TWT token movements</p>
        </div>
        <button onClick={loadData} className="p-2 rounded-xl border border-white/10 text-gray-400 hover:text-white hover:bg-white/5 transition" title="Refresh">
          <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
        </button>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-white/5">
        {[{ key: 'internal', label: `Platform Logs (${internalLogs.length})` }, { key: 'onchain', label: `On-Chain (${onChainTxs.length})` }].map(({ key, label }) => (
          <button key={key} onClick={() => setTab(key)} className={`px-5 py-3 text-sm font-medium transition border-b-2 ${tab === key ? 'text-violet-300 border-violet-400' : 'text-gray-500 border-transparent hover:text-gray-300'}`}>{label}</button>
        ))}
      </div>

      {tab === 'internal' && (
        <>
          <div className="flex flex-wrap gap-2 items-center">
            <Filter size={13} className="text-gray-600" />
            {filterTypes.map(t => (
              <button key={t} onClick={() => setTypeFilter(t)} className={`text-[11px] px-2.5 py-1 rounded-full border transition capitalize ${typeFilter === t ? 'border-violet-400 text-violet-300 bg-violet-500/10' : 'border-white/10 text-gray-500 hover:border-white/20'}`}>
                {TX_LABELS[t] || t}
              </button>
            ))}
          </div>
          <div className="bg-white/[0.02] border border-white/5 rounded-2xl overflow-hidden">
            <div className="divide-y divide-white/[0.04] max-h-[520px] overflow-y-auto">
              {filteredLogs.length === 0
                ? <p className="text-center text-gray-600 py-12">No transactions found</p>
                : filteredLogs.map(log => (
                  <div key={log._id} className="flex items-center gap-4 px-5 py-4 hover:bg-white/[0.02] transition">
                    <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full border flex-shrink-0 ${TX_COLORS[log.type] || 'text-gray-400 bg-white/5 border-white/10'}`}>{TX_LABELS[log.type] || log.type}</span>
                    <div className="flex-1 min-w-0">
                      {log.relatedUser && <p className="text-xs text-gray-400">@{log.relatedUser.username}</p>}
                      {log.note && <p className="text-[11px] text-gray-600 truncate">{log.note}</p>}
                    </div>
                    <StatusBadge status={log.status} />
                    <span className={`font-semibold text-sm flex-shrink-0 ${log.amount >= 0 ? 'text-green-400' : 'text-red-400'}`}>{log.amount >= 0 ? '+' : ''}{log.amount.toFixed(4)} TWT</span>
                    <span className="text-[11px] text-gray-600 flex-shrink-0 text-right">{new Date(log.createdAt).toLocaleDateString()}</span>
                  </div>
                ))}
            </div>
          </div>
        </>
      )}

      {tab === 'onchain' && (
        <div className="bg-white/[0.02] border border-white/5 rounded-2xl overflow-hidden">
          <div className="divide-y divide-white/[0.04] max-h-[520px] overflow-y-auto">
            {onChainTxs.length === 0
              ? (
                <div className="text-center py-12">
                  <ArrowLeftRight size={32} className="mx-auto mb-3 text-gray-700" />
                  <p className="text-gray-600 text-sm">No on-chain transactions found</p>
                  <p className="text-xs text-gray-700 mt-1">Connect a wallet and airdrop TWT</p>
                </div>
              )
              : onChainTxs.map(tx => (
                <div key={tx.signature} className="flex items-center gap-4 px-5 py-4 hover:bg-white/[0.02] transition">
                  <div className="flex-1 min-w-0">
                    <p className="font-mono text-xs text-violet-300 truncate">{tx.signature.slice(0, 28)}...{tx.signature.slice(-6)}</p>
                    {tx.memo && <p className="text-[11px] text-gray-600">{tx.memo}</p>}
                  </div>
                  <StatusBadge status={tx.status} />
                  <span className="text-[11px] text-gray-500">{tx.blockTime ? new Date(tx.blockTime * 1000).toLocaleDateString() : '—'}</span>
                  <a href={tx.explorerUrl} target="_blank" rel="noopener noreferrer" className="text-gray-500 hover:text-violet-300 transition flex-shrink-0" title="Solana Explorer">
                    <ExternalLink size={13} />
                  </a>
                </div>
              ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default TransactionsPage;
