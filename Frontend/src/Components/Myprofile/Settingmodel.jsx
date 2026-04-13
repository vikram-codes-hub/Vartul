import React, { useContext } from 'react'
import { useNavigate } from 'react-router-dom'
import { Usercontext } from '../../Context/Usercontext'
import { toast } from 'react-toastify'

const SettingsModal = ({ isOpen, onClose }) => {
  if (!isOpen) return null;
  
  const navigate = useNavigate();
  const { Logout } = useContext(Usercontext);

  const handleComingSoon = () => {
    toast.info("This feature is coming soon!");
  };

  return (
    <div 
      className="fixed inset-0 bg-black/50 backdrop-blur-sm  modal-overlay  bg-opacity-60 flex items-center justify-center z-50" 
      onClick={onClose}
    >
      <div 
        className="bg-[#262626] rounded-2xl w-full max-w-md mx-4" 
        onClick={(e) => e.stopPropagation()}
      >
        <div className="divide-y divide-gray-700">
          <button onClick={handleComingSoon} className="w-full py-4 px-6 text-white hover:bg-[#363636] transition text-center rounded-t-2xl">
            Apps and websites
          </button>
          <button onClick={handleComingSoon} className="w-full py-4 px-6 text-white hover:bg-[#363636] transition text-center">
            QR code
          </button>
          <button onClick={handleComingSoon} className="w-full py-4 px-6 text-white hover:bg-[#363636] transition text-center">
            Notifications
          </button>
          <button 
            className="w-full py-4 px-6 text-white hover:bg-[#363636] transition text-center"
            onClick={() => {
              navigate('/settings');
              onClose();
            }}
          >
            Settings and privacy
          </button>
          <button onClick={handleComingSoon} className="w-full py-4 px-6 text-white hover:bg-[#363636] transition text-center">
            Supervision
          </button>
          <button onClick={handleComingSoon} className="w-full py-4 px-6 text-white hover:bg-[#363636] transition text-center">
            Login activity
          </button>
          <button 
            onClick={() => {
              Logout();
              onClose();
              toast.success("Successfully logged out");
            }} 
            className="w-full py-4 px-6 text-red-500 font-semibold hover:bg-[#363636] transition text-center"
          >
            Log Out
          </button>
          <button 
            className="w-full py-4 px-6 text-white hover:bg-[#363636] transition text-center rounded-b-2xl" 
            onClick={onClose}
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

export default SettingsModal;