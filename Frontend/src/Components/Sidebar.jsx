import React, { useState, useEffect, useContext } from 'react'
import { NavLink } from 'react-router-dom'
import Logo from './ui/Logo'
import {
  CiHome,
  CiSearch,
  CiVideoOn,
  CiChat1,
  CiUser,
  CiCoinInsert,
  CiGrid41,
  CiSettings,
  CiLogout,
} from "react-icons/ci"
import { HiOutlinePlus } from "react-icons/hi2";
import { Usercontext } from '../Context/Usercontext';
import CreatePostModal from './CreatePostModel';
import SearchOverlay from './SearchOverlay';

const Sidebar = () => {
  const [isCollapsed, setIsCollapsed] = useState(false)
  const [openCreate, setOpenCreate] = useState(false);
  const [openSearch, setOpenSearch] = useState(false);
  const { Logout } = useContext(Usercontext)

  useEffect(() => {
    const handleResize = () => {
      setIsCollapsed(window.innerWidth < 1400)
    }
    handleResize()
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  const userProfileImage = 'https://via.placeholder.com/40x40'

  // ── Nav groups ──────────────────────────────────────────────────────────
  const mainNav = [
    { path: '/',        icon: CiHome,       label: 'Home' },
    { action: 'search', icon: CiSearch,     label: 'Search' },
    { path: '/reels',   icon: CiVideoOn,    label: 'Reels' },
    { path: '/chat',    icon: CiChat1,      label: 'Messages' },
    { action: 'create', icon: HiOutlinePlus,label: 'Create' },
    { path: '/profile', icon: CiUser,       label: 'Profile' },
  ]

  const tokenNav = [
    { path: '/twt-token',  icon: CiCoinInsert, label: 'TWT Token' },
    { path: '/dashboard',  icon: CiGrid41,     label: 'Dashboard' },
  ]

  const accountNav = [
    { path: '/settings', icon: CiSettings, label: 'Settings' },
  ]

  // ── Shared item renderer ─────────────────────────────────────────────────
  const baseClass = `flex items-center p-3 rounded-xl transition-all duration-150 w-full`
  const collapsedClass = `justify-center`
  const expandedClass = `gap-3.5`

  const renderItem = (item) => {
    const Icon = item.icon

    // Active style — left border accent instead of full blue fill
    const activeStyle = `
      bg-purple-500/10
      text-purple-400
      border-l-2 border-purple-500
      pl-[10px]
    `
    const inactiveStyle = `text-gray-400 hover:bg-white/6 hover:text-white border-l-2 border-transparent pl-[10px]`

    if (item.action === 'create') {
      return (
        <button
          key="create"
          onClick={() => setOpenCreate(true)}
          title={isCollapsed ? item.label : ''}
          className={`${baseClass} ${isCollapsed ? collapsedClass : expandedClass} ${inactiveStyle}`}
        >
          <Icon className="w-5 h-5 flex-shrink-0" />
          {!isCollapsed && <span className="text-sm font-medium">{item.label}</span>}
        </button>
      )
    }

    if (item.action === 'search') {
      return (
        <button
          key="search"
          onClick={() => setOpenSearch(true)}
          title={isCollapsed ? item.label : ''}
          className={`${baseClass} ${isCollapsed ? collapsedClass : expandedClass} ${inactiveStyle}`}
        >
          <Icon className="w-5 h-5 flex-shrink-0" />
          {!isCollapsed && <span className="text-sm font-medium">{item.label}</span>}
        </button>
      )
    }

    return (
      <NavLink
        key={item.path}
        to={item.path}
        title={isCollapsed ? item.label : ''}
        className={({ isActive }) =>
          `${baseClass} ${isCollapsed ? collapsedClass : expandedClass} ${isActive ? activeStyle : inactiveStyle}`
        }
      >
        <Icon className="w-5 h-5 flex-shrink-0" />
        {!isCollapsed && <span className="text-sm font-medium">{item.label}</span>}
      </NavLink>
    )
  }

  // ── Group label ──────────────────────────────────────────────────────────
  const GroupLabel = ({ label }) =>
    isCollapsed ? (
      <div className="my-1 h-px bg-white/6 mx-2" />
    ) : (
      <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-600 px-3 pt-4 pb-1">
        {label}
      </p>
    )

  return (
    <>
      {/* ── Desktop Sidebar ─────────────────────────────────────────────── */}
      <div className={`hidden lg:flex fixed top-0 left-0 z-30 h-screen flex-col bg-[#0a0a0a] border-r border-white/6 transition-all duration-300 ${
        isCollapsed ? 'w-[72px]' : 'w-[240px]'
      }`}>

        {/* Logo */}
        <div className={`p-5 border-b border-white/6 ${isCollapsed ? 'flex justify-center' : ''}`}>
          <Logo showText={!isCollapsed} />
        </div>

        {/* Nav */}
        <nav className="flex-1 flex flex-col overflow-y-auto px-2 py-3 scrollbar-hide">

          {/* Main */}
          <div className="flex flex-col gap-0.5">
            {mainNav.map(renderItem)}
          </div>

          {/* Token & Analytics */}
          <GroupLabel label="Token & Analytics" />
          <div className="flex flex-col gap-0.5">
            {tokenNav.map(renderItem)}
          </div>

          {/* Account */}
          <GroupLabel label="Account" />
          <div className="flex flex-col gap-0.5">
            {accountNav.map(renderItem)}
          </div>
        </nav>

        {/* Logout */}
        <div className="p-2 border-t border-white/6">
          <button
            onClick={Logout}
            title={isCollapsed ? 'Log out' : ''}
            className={`${baseClass} ${isCollapsed ? collapsedClass : expandedClass} text-gray-500 hover:bg-red-500/10 hover:text-red-400 border-l-2 border-transparent pl-[10px] transition-all`}
          >
            <CiLogout className="w-5 h-5 flex-shrink-0" />
            {!isCollapsed && <span className="text-sm font-medium">Log out</span>}
          </button>
        </div>
      </div>

      {/* ── Mobile Bottom Bar ────────────────────────────────────────────── */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-[#0a0a0a] border-t border-white/6">
        <nav className="flex justify-around items-center py-2 px-1">
          {[
            { path: '/',          icon: CiHome },
            { path: '/reels',     icon: CiVideoOn },
            { path: '/chat',      icon: CiChat1 },
            { path: '/twt-token', icon: CiCoinInsert },
            { path: '/dashboard', icon: CiGrid41 },
          ].map(({ path, icon: Icon }) => (
            <NavLink
              key={path}
              to={path}
              className={({ isActive }) =>
                `flex items-center justify-center p-2.5 rounded-xl transition-all ${
                  isActive ? 'text-purple-400' : 'text-gray-500 hover:text-white'
                }`
              }
            >
              <Icon className="w-6 h-6" />
            </NavLink>
          ))}

          {/* Profile avatar */}
          <NavLink
            to="/profile"
            className={({ isActive }) =>
              `flex items-center justify-center p-1 rounded-full transition-all ${
                isActive ? 'ring-2 ring-purple-500' : 'ring-2 ring-gray-700'
              }`
            }
          >
            <div className="w-6 h-6 rounded-full overflow-hidden">
              <img src={userProfileImage} alt="Profile" className="w-full h-full object-cover" />
            </div>
          </NavLink>
        </nav>
      </div>

      <CreatePostModal open={openCreate} onClose={() => setOpenCreate(false)} />
      <SearchOverlay isOpen={openSearch} onClose={() => setOpenSearch(false)} />
    </>
  )
}

export default Sidebar