import { Outlet, useLocation } from "react-router-dom";
import  Sidebar from '../Components/Sidebar'

const Layout = ({ hideSidebar }) => {
  const location = useLocation();
  const isChatPage = location.pathname.startsWith('/chat');
  const isProfilePage = location.pathname.startsWith('/profile');
  const isTwtTokenPage = location.pathname.startsWith('/twt-token');
  const isReelsPage = location.pathname.startsWith('/reels');

  return (
    <div className="flex min-h-screen bg-black">
      {!hideSidebar && <Sidebar />}

      {/* MAIN CONTENT AREA */}
      <main className={`flex-1 ml-[80px] lg:ml-[250px] ${isChatPage || isProfilePage || isTwtTokenPage || isReelsPage ? 'p-0' : 'p-4'}`}>
        <Outlet />
      </main>
    </div>
  );
};

export default Layout;
