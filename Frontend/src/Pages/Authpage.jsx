import React, { useContext, useState } from 'react';
import { useDispatch } from 'react-redux';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { setUser } from '../store/authSlice';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { Usercontext } from '../Context/Usercontext';
import { motion, AnimatePresence } from 'framer-motion';

const AuthPage = () => {
  const [mode, setMode] = useState('signup');
  const location = useLocation();

  const [formData, setFormData] = useState({ email: '', password: '', fullname: '' });
  const [loading, setLoading] = useState(false);

  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { Login } = useContext(Usercontext);

  const handleChange = (e) =>
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));

  const resetForm = () => setFormData({ email: '', password: '', fullname: '' });

  const toggleMode = (nextMode) => {
    if (nextMode === mode) return;
    setMode(nextMode);
    resetForm();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    const { email, password, fullname } = formData;
    const credentials = mode === 'signup' ? { fullname, email, password } : { email, password };
    const response = await Login({ state: mode === 'signup' ? 'signup' : 'login', credentials });
    setLoading(false);
    if (response?.success) {
      navigate(mode === 'signup' ? '/profile-setup/basic-info' : '/');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-black text-white overflow-hidden relative">

      {/* Ambient blobs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -left-40 w-[500px] h-[500px] bg-purple-700/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -right-40 w-[500px] h-[500px] bg-pink-700/8 rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/3 w-72 h-72 bg-violet-600/6 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 flex flex-col md:flex-row w-full max-w-5xl">

        {/* ── LEFT PANEL ── */}
        <motion.div
          initial={{ opacity: 0, x: -40 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
          className="hidden md:flex w-1/2 flex-col items-center justify-center p-12"
        >
          <div className="flex flex-col items-center text-center gap-6">
            <motion.img
              src="/src/assets/vezzra-removebg-preview.png"
              alt="Vartul"
              className="w-44 h-44 object-contain"
              animate={{ y: [0, -10, 0] }}
              transition={{ repeat: Infinity, duration: 4, ease: 'easeInOut' }}
            />
            <AnimatePresence mode="wait">
              <motion.div
                key={mode}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                transition={{ duration: 0.3 }}
              >
                <h2 className="text-2xl font-bold text-white mb-2">
                  {mode === 'signup' ? 'Welcome to Vartul' : 'Back already?'}
                </h2>
                <p className="text-gray-500 text-sm max-w-xs leading-relaxed">
                  {mode === 'signup'
                    ? 'Your people are waiting. Join the community of creators and explorers.'
                    : 'Pick up right where you left off. Your feed missed you.'}
                </p>
              </motion.div>
            </AnimatePresence>
          </div>
        </motion.div>

        {/* ── RIGHT PANEL ── */}
        <motion.div
          initial={{ opacity: 0, x: 40 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
          className="w-full md:w-1/2 flex flex-col justify-center px-8 py-10 md:px-12"
        >
          {/* Brand wordmark */}
          <motion.div
            initial={{ opacity: 0, y: -16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.5 }}
            className="text-center mb-7"
          >
            <h1 className="text-4xl font-black tracking-tight mb-1.5">
              <span className="text-white">var</span>
              <span className="text-purple-400">tul</span>
            </h1>
            <AnimatePresence mode="wait">
              <motion.p
                key={mode}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="text-gray-600 text-[10px] tracking-[0.2em] uppercase font-medium"
              >
                {mode === 'signup' ? 'create · connect · explore' : 'good to see you again'}
              </motion.p>
            </AnimatePresence>
          </motion.div>

          {/* Facebook */}
          <motion.button
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.98 }}
            className="mb-5 border border-white/10 bg-white/5 hover:bg-white/10 text-white py-2.5 px-4 rounded-xl flex items-center justify-center gap-2.5 text-sm font-medium transition-colors duration-200"
          >
            {/* Blue circle with F */}
            <span className="w-5 h-5 rounded-full bg-[#1877F2] flex items-center justify-center flex-shrink-0">
              <svg viewBox="0 0 24 24" className="w-3 h-3 fill-white">
                <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
              </svg>
            </span>
            Continue with Facebook
          </motion.button>

          {/* Divider */}
          <div className="flex items-center gap-3 my-3">
            <div className="flex-grow h-px bg-white/8" />
            <span className="text-gray-700 text-xs">or</span>
            <div className="flex-grow h-px bg-white/8" />
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-3.5">

            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
              <label htmlFor="email" className="block text-xs font-medium text-gray-500 mb-1.5">
                Email or phone
              </label>
              <input
                id="email" type="text" name="email" placeholder="you@email.com"
                value={formData.email} onChange={handleChange} required
                className="w-full px-3 py-2.5 bg-white/5 border border-white/8 rounded-xl text-sm text-white placeholder-gray-700 focus:outline-none focus:border-purple-500/50 focus:bg-white/8 transition-all duration-200"
              />
            </motion.div>

            <AnimatePresence>
              {mode === 'signup' && (
                <motion.div
                  key="fullname"
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.25 }}
                  style={{ overflow: 'hidden' }}
                >
                  <label htmlFor="fullname" className="block text-xs font-medium text-gray-500 mb-1.5">
                    Full name
                  </label>
                  <input
                    id="fullname" type="text" name="fullname" placeholder="Your name"
                    value={formData.fullname} onChange={handleChange} required
                    className="w-full px-3 py-2.5 bg-white/5 border border-white/8 rounded-xl text-sm text-white placeholder-gray-700 focus:outline-none focus:border-purple-500/50 transition-all duration-200"
                  />
                </motion.div>
              )}
            </AnimatePresence>

            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
              <div className="flex justify-between items-center mb-1.5">
                <label htmlFor="password" className="text-xs font-medium text-gray-500">Password</label>
                {mode === 'login' && (
                  <a href="#" className="text-xs text-purple-500 hover:text-purple-400 transition-colors">Forgot password?</a>
                )}
              </div>
              <input
                id="password" type="password" name="password"
                placeholder={mode === 'signup' ? 'At least 8 characters' : 'Enter your password'}
                value={formData.password} onChange={handleChange} required
                className="w-full px-3 py-2.5 bg-white/5 border border-white/8 rounded-xl text-sm text-white placeholder-gray-700 focus:outline-none focus:border-purple-500/50 transition-all duration-200"
              />
            </motion.div>

            <AnimatePresence>
              {mode === 'signup' && (
                <motion.p
                  key="terms"
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                  className="text-xs text-gray-700 leading-relaxed"
                >
                  By signing up, you agree to our{' '}
                  <Link to="/terms" className="text-purple-500 hover:text-purple-400">Terms of Service</Link>{' '}&amp;{' '}
                  <Link to="/privacy" className="text-purple-500 hover:text-purple-400">Privacy Policy</Link>.
                </motion.p>
              )}
            </AnimatePresence>

            <motion.button
              type="submit" disabled={loading}
              whileHover={!loading ? { scale: 1.01 } : {}}
              whileTap={!loading ? { scale: 0.98 } : {}}
              className={`w-full py-2.5 rounded-xl text-sm font-bold tracking-wide text-white transition-all duration-200 mt-1 ${
                loading ? 'bg-gray-800 cursor-not-allowed text-gray-500' : 'bg-purple-600 hover:bg-purple-500'
              }`}
            >
              {loading
                ? (mode === 'signup' ? 'Creating account...' : 'Signing in...')
                : (mode === 'signup' ? 'Create account' : 'Sign in')}
            </motion.button>
          </form>

          <p className="mt-5 text-center text-xs text-gray-600">
            {mode === 'signup' ? (
              <>Already have an account?{' '}
                <button onClick={() => { toggleMode('login'); navigate('/auth?mode=login'); }}
                  className="text-purple-400 hover:text-purple-300 font-semibold transition-colors">Sign in</button>
              </>
            ) : (
              <>Don't have an account?{' '}
                <button onClick={() => { toggleMode('signup'); navigate('/auth?mode=signup'); }}
                  className="text-purple-400 hover:text-purple-300 font-semibold transition-colors">Create account</button>
              </>
            )}
          </p>

          <div className="mt-6 text-center">
            <p className="text-gray-700 text-xs mb-2.5">Get the app</p>
            <div className="flex justify-center gap-3">
              <a href="#" className="hover:opacity-70 transition-opacity">
                <img src="https://play.google.com/intl/en_us/badges/static/images/badges/en_badge_web_generic.png" alt="Google Play" className="h-8" />
              </a>
              <a href="#" className="hover:opacity-70 transition-opacity">
                <img src="https://developer.microsoft.com/store/badges/images/English_get-it-from-MS.png" alt="Microsoft" className="h-8" />
              </a>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default AuthPage;