import React, { useContext, useEffect } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { ChatContext } from '../Context/Chat'
import Chatleft from '../Components/Chat/Chatleft'
import Chatright from '../Components/Chat/Chatright'

const Chat = () => {
  const { selectedChat, setSelectedChat } = useContext(ChatContext)
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    // If navigated here with a targetUser in state (e.g. from user profile)
    if (location.state && location.state.targetUser) {
      setSelectedChat(location.state.targetUser);
      // Optional: Clear the state so it doesn't re-trigger on refresh
      navigate('.', { replace: true, state: {} });
    }
  }, [location, setSelectedChat, navigate]);

  return (
    <div className='flex h-screen overflow-hidden bg-black'>
      {/* Mobile View */}
      <div className='md:hidden w-full'>
        {!selectedChat ? (
          <Chatleft />
        ) : (
          <Chatright isMobile={true} />
        )}
      </div>

      {/* Desktop View - Show both side by side */}
      <div className='hidden md:flex w-full'>
        <Chatleft />
        {selectedChat && <Chatright isMobile={false} />}
      </div>
    </div>
  )
}

export default Chat