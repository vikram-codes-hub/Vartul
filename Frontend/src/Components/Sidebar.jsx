import React, { useState, useEffect, useContext } from 'react'
import { Link, NavLink } from 'react-router-dom'
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
  CiMenuFries,

} from "react-icons/ci"
import { HiOutlinePlus } from "react-icons/hi2";
import { FaCircleInfo } from "react-icons/fa6";
import { Usercontext } from '../Context/Usercontext';
import CreatePostModal from './CreatePostModel';
import SearchOverlay from './SearchOverlay';

const Sidebar = () => {
  const [isCollapsed, setIsCollapsed] = useState(false)
  const [openCreate, setOpenCreate] = useState(false);
  const [openSearch, setOpenSearch] = useState(false);


  const {Logout}=useContext(Usercontext)

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 1400) {
        setIsCollapsed(true)
      } else {
        setIsCollapsed(false)
      }
    }


    handleResize()

    window.addEventListener('resize', handleResize)


    return () => window.removeEventListener('resize', handleResize)
  }, [])
  
  const userProfileImage = 'https://via.placeholder.com/40x40'
  
  const navItems = [
    { path: '/', icon: CiHome, label: 'Home' },
    { action: 'search', icon: CiSearch, label: 'Search' },
    { path: '/reels', icon: CiVideoOn, label: 'Reels' },
    { path: '/chat', icon: CiChat1, label: 'Messages' },
    { action: 'create', icon: HiOutlinePlus, label: 'Create' },
    { path: '/profile', icon: CiUser, label: 'Profile' },
    { path: '/twt-token', icon: CiCoinInsert, label: 'Twt Token' },
    { path: '/dashboard', icon: CiGrid41, label: 'Dashboard' },
    { path: '/settings', icon: CiSettings, label: 'Setting' },
  ]

  const bottomNavItems = [
    { path: '/', icon: CiHome, label: 'Home' },
    { path: '/reels', icon: CiVideoOn, label: 'Reels' },
    { path: '/chat', icon: CiChat1, label: 'Messages' },
    { path: '/twt-token', icon: CiCoinInsert, label: 'Token' },
    { path: '/dashboard', icon: CiGrid41, label: 'Dashboard' },
    { path: '/profile', icon: 'profile', label: 'Profile' },
  ]

  return (
    <>
      {/* Desktop Sidebar */}
      <div className={`hidden lg:block fixed top-0 left-0 z-30 h-screen bg-gradient-to-b from-gray-900 to-black shadow-2xl flex-col border-r border-gray-800 overflow-y-auto hide-scrollbar transition-all duration-300 ${
        isCollapsed ? 'w-[80px]' : 'w-[250px]'
      }`}>
        {/* Header Section */}
        <div className='flex flex-col'>
          {/* Logo */}
          <div className='p-6 border-b border-gray-800'>
            <Logo showText={!isCollapsed} />
          </div>
          
          {/* Navigation Links */}
          <nav className='flex flex-col mt-4 px-3'>
{navItems.map((item) => {
  const IconComponent = item.icon;

  // CREATE POST (MODAL)
  if (item.action === "create") {
    return (
      <button
        key={item.label}
        onClick={() => setOpenCreate(true)}
        className={`flex items-center ${
          isCollapsed ? "justify-center" : "gap-4"
        } p-3 mx-2 mb-2 rounded-xl text-gray-300 hover:bg-gray-800 hover:text-white transition-all`}
        title={isCollapsed ? item.label : ""}
      >
        <IconComponent className="w-6 h-6" />
        {!isCollapsed && <p className="text-base font-medium">{item.label}</p>}
      </button>
    );
  }
  if(item.action=='search'){
    return (
      <button
      key={item.label}
      onClick={()=>setOpenSearch(true)}
       className={`flex items-center ${
          isCollapsed ? "justify-center" : "gap-4"
        } p-3 mx-2 mb-2 rounded-xl text-gray-300 hover:bg-gray-800 hover:text-white transition-all`}
        title={isCollapsed ? item.label : ""}
      >
<IconComponent/>
 {!isCollapsed && <p className="text-base font-medium">{item.label}</p>}
      </button>
    )
  }

  // NORMAL NAV LINKS
  return (
    <NavLink
      key={item.path}
      to={item.path}
      className={({ isActive }) =>
        `flex items-center ${
          isCollapsed ? "justify-center" : "gap-4"
        } p-3 mx-2 mb-2 rounded-xl transition-all ${
          isActive
            ? "bg-blue-600 text-white"
            : "text-gray-300 hover:bg-gray-800 hover:text-white"
        }`
      }
      title={isCollapsed ? item.label : ""}
    >
      <IconComponent className="w-6 h-6" />
      {!isCollapsed && <p className="text-base font-medium">{item.label}</p>}
    </NavLink>
  );
})}
</nav>

        </div>
        
        {/* Logout Button */}
        <div className='mt-auto p-3 border-t border-gray-800'>
          <button className={`flex items-center ${isCollapsed ? 'justify-center' : 'gap-4'} p-3 mx-2 mb-4 rounded-xl text-gray-300 hover:bg-red-600 hover:text-white transition-all duration-200 group w-full`}
            title={isCollapsed ? 'Logout' : ''}
          >
            <CiLogout className='w-6 h-6 flex-shrink-0' />
            {!isCollapsed && (
              <p onClick={Logout} className='text-base font-medium'>
                Logout
              </p>
            )}
          </button>
        </div>
      </div>

      {/* Mobile Bottom Navigation Bar */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-gray-900 border-t border-gray-800 shadow-2xl">
        <nav className='flex justify-around items-center py-1 px-1'>
          {bottomNavItems.map((item) => {
            if (item.icon === 'profile') {
              return (
                <NavLink 
                  key={item.path}
                  to={item.path}
                  className={({ isActive }) =>
                    `flex flex-col items-center justify-center py-1 px-2 rounded-lg transition-all duration-200`
                  }
                >
                  {({ isActive }) => (
                    <div className={`w-7 h-7 rounded-full overflow-hidden border-2 ${
                      isActive ? 'border-blue-500' : 'border-gray-600'
                    }`}>
                      <img 
                        src={userProfileImage} 
                        alt="Profile" 
                        className='w-full h-full object-cover'
                      />
                    </div>
                  )}
                </NavLink>
              )
            }
            
            const IconComponent = item.icon
            return (
              <NavLink 
                key={item.path}
                to={item.path}
                className={({ isActive }) =>
                  `flex flex-col items-center justify-center py-1 px-2 rounded-lg transition-all duration-200 ${
                    isActive 
                      ? 'text-blue-500' 
                      : 'text-gray-400 hover:text-white'
                  }`
                }
              >
                <IconComponent className='w-6 h-6' />
              </NavLink>
            )
          })}
        </nav>
      </div>

      <CreatePostModal
  open={openCreate}
  onClose={() => setOpenCreate(false)}
/>

<SearchOverlay
  isOpen={openSearch}
  onClose={() => setOpenSearch(false)}
/>

    </>
  )
}

export default Sidebar