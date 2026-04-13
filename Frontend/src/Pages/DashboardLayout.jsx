import React, { useContext, useState } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, Wallet, Layers, Gift, ArrowLeftRight,
  TrendingUp, ChevronLeft, Menu, X, Zap, LogOut, User as UserIcon
} from 'lucide-react';
import { Usercontext } from '../Context/Usercontext';

const navItems = [
  { icon: LayoutDashboard, label: 'Overview',       path: '/dashboard',                end: true },
  { icon: Wallet,          label: 'Wallet',          path: '/dashboard/wallet'                    },
  { icon: Layers,          label: 'Staking',         path: '/dashboard/staking'                   },
  { icon: Gift,            label: 'Rewards',         path: '/dashboard/rewards'                   },
  { icon: ArrowLeftRight,  label: 'Transactions',    path: '/dashboard/transactions'              },
  { icon: TrendingUp,      label: 'Creator Earnings',path: '/dashboard/creator-earnings'          },
];

const DashboardLayout = () => {
  const { authuser } = useContext(Usercontext);
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[#080812] text-white flex overflow-hidden">
      {/* ── Mobile overlay ──────────────────────────────────────────────────── */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-30 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* ── Sidebar ──────────────────────────────────────────────────────────── */}
      <aside
        className={`fixed top-0 left-0 h-full z-40 flex flex-col transition-transform duration-300 ease-in-out
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
          md:relative md:translate-x-0 md:flex
          w-64
          border-r border-white/5
          bg-gradient-to-b from-[#0f0f2a] via-[#0d0d20] to-[#080812]
        `}
        style={{ backdropFilter: 'blur(24px)' }}
      >
        {/* Logo */}
        <div className="flex items-center justify-between px-5 py-5 border-b border-white/5">
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigate('/')}>
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-600 to-indigo-500 flex items-center justify-center shadow-lg shadow-violet-500/30">
              <Zap size={16} className="text-white" />
            </div>
            <span className="text-lg font-bold bg-gradient-to-r from-violet-400 to-indigo-300 bg-clip-text text-transparent tracking-tight">
              VARTUL
            </span>
          </div>
          <button
            className="md:hidden text-gray-400 hover:text-white transition"
            onClick={() => setSidebarOpen(false)}
          >
            <X size={18} />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-5 space-y-1 overflow-y-auto">
          <p className="text-[10px] uppercase tracking-widest text-gray-600 px-3 mb-3">Dashboard</p>
          {navItems.map(({ icon: Icon, label, path, end }) => (
            <NavLink
              key={path}
              to={path}
              end={end}
              className={({ isActive }) =>
                `group flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
                  isActive
                    ? 'bg-violet-600/20 text-violet-300 shadow-inner shadow-violet-500/10 border border-violet-500/20'
                    : 'text-gray-400 hover:text-white hover:bg-white/5'
                }`
              }
              onClick={() => setSidebarOpen(false)}
            >
              {({ isActive }) => (
                <>
                  <Icon
                    size={16}
                    className={`flex-shrink-0 transition-colors ${isActive ? 'text-violet-400' : 'text-gray-500 group-hover:text-gray-300'}`}
                  />
                  <span>{label}</span>
                  {isActive && (
                    <span className="ml-auto w-1.5 h-1.5 rounded-full bg-violet-400 animate-pulse" />
                  )}
                </>
              )}
            </NavLink>
          ))}
        </nav>

        {/* User footer */}
        <div className="px-4 py-4 border-t border-white/5">
          <div className="flex items-center gap-3 p-2 rounded-xl hover:bg-white/5 cursor-pointer transition group"
            onClick={() => navigate('/profile')}>
            {authuser?.profilePic ? (
              <img src={authuser.profilePic} alt="avatar" className="w-8 h-8 rounded-full object-cover ring-2 ring-violet-500/30" />
            ) : (
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-600 to-indigo-500 flex items-center justify-center">
                <UserIcon size={14} />
              </div>
            )}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white truncate">{authuser?.username || 'User'}</p>
              <p className="text-xs text-gray-500 truncate">{authuser?.email || ''}</p>
            </div>
          </div>
        </div>
      </aside>

      {/* ── Main content ─────────────────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        {/* Mobile top bar */}
        <header className="md:hidden flex items-center gap-3 px-4 py-3 border-b border-white/5 bg-[#0a0a1e]/80 backdrop-blur sticky top-0 z-20">
          <button
            onClick={() => setSidebarOpen(true)}
            className="text-gray-400 hover:text-white transition"
          >
            <Menu size={20} />
          </button>
          <span className="font-semibold text-sm text-white">Dashboard</span>
          <button
            onClick={() => navigate('/')}
            className="ml-auto text-gray-400 hover:text-white transition flex items-center gap-1 text-xs"
          >
            <ChevronLeft size={14} /> Back to Feed
          </button>
        </header>

        {/* Back to feed nav (desktop) */}
        <div className="hidden md:flex items-center justify-end px-6 py-2 border-b border-white/5 bg-[#0a0a1e]/50">
          <button
            onClick={() => navigate('/')}
            className="flex items-center gap-1.5 text-gray-500 hover:text-violet-300 text-xs transition"
          >
            <ChevronLeft size={13} /> Back to Feed
          </button>
        </div>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;
