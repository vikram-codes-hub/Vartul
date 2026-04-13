import React, { useState, useContext } from "react";
import { Usercontext } from "../Context/Usercontext";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.08 }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 16 },
  show:   { opacity: 1, y: 0, transition: { duration: 0.4, ease: 'easeOut' } }
};

const selectOptionStyle = `
  select option {
    background-color: #111111;
    color: #ffffff;
  }
`;

const BasicInfo = () => {
  const navigate = useNavigate();
  const { completeprofile } = useContext(Usercontext);

  const [formData, setFormData] = useState({
    username: "",
    gender: "",
    ageGroup: "",
    bio: "",
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const res = await completeprofile(formData);
    if (res?.success) {
      navigate("/profile-setup/interests");
    }
  };

  const inputClass = "w-full px-4 py-3 bg-white/5 border border-white/8 rounded-xl text-sm text-white placeholder-gray-700 focus:outline-none focus:border-purple-500/50 focus:bg-white/8 transition-all duration-200";
  const labelClass = "block text-xs font-semibold text-gray-500 mb-2 uppercase tracking-wider";
  const selectStyle = {
    colorScheme: 'dark',
    backgroundColor: '#111111',
    color: 'white',
  };

  return (
    <div className="min-h-screen bg-black text-white flex items-center justify-center px-4 relative overflow-hidden">

      {/* Inject option styles */}
      <style>{selectOptionStyle}</style>

      {/* Ambient blobs */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-40 -left-40 w-[500px] h-[500px] bg-purple-700/8 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -right-40 w-[500px] h-[500px] bg-pink-700/6 rounded-full blur-3xl" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        className="relative z-10 w-full max-w-xl"
      >
        {/* Header */}
        <div className="text-center mb-10">
          {/* Step indicator */}
          <div className="flex items-center justify-center gap-2 mb-6">
            <div className="w-8 h-1 rounded-full bg-purple-500" />
            <div className="w-8 h-1 rounded-full bg-white/15" />
            <div className="w-8 h-1 rounded-full bg-white/15" />
          </div>
          <motion.h1
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-3xl font-black mb-2"
          >
            <span className="text-white">set up your </span>
            <span className="text-purple-400">vibe</span>
          </motion.h1>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="text-gray-600 text-sm"
          >
            A few quick things so people know who you are
          </motion.p>
        </div>

        <form onSubmit={handleSubmit}>
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="show"
            className="space-y-5"
          >

            {/* Username */}
            <motion.div variants={itemVariants}>
              <label className={labelClass}>Username</label>
              <input
                type="text" name="username"
                value={formData.username} onChange={handleChange} required
                placeholder="@yourhandle"
                className={inputClass}
              />
            </motion.div>

            {/* Gender + Age Group */}
            <motion.div variants={itemVariants} className="grid grid-cols-2 gap-4">
              <div>
                <label className={labelClass}>Gender</label>
                <select
                  name="gender" value={formData.gender} onChange={handleChange} required
                  className={`${inputClass} cursor-pointer`}
                  style={selectStyle}
                >
                  <option value="" disabled style={{ backgroundColor: '#111111', color: '#888' }}>Select</option>
                  <option value="male" style={{ backgroundColor: '#111111', color: 'white' }}>Male</option>
                  <option value="female" style={{ backgroundColor: '#111111', color: 'white' }}>Female</option>
                  <option value="non-binary" style={{ backgroundColor: '#111111', color: 'white' }}>Non-binary</option>
                  <option value="prefer-not-to-say" style={{ backgroundColor: '#111111', color: 'white' }}>Prefer not to say</option>
                </select>
              </div>
              <div>
                <label className={labelClass}>Age group</label>
                <select
                  name="ageGroup" value={formData.ageGroup} onChange={handleChange} required
                  className={`${inputClass} cursor-pointer`}
                  style={selectStyle}
                >
                  <option value="" disabled style={{ backgroundColor: '#111111', color: '#888' }}>Select</option>
                  <option value="teen" style={{ backgroundColor: '#111111', color: 'white' }}>Teen (13–17)</option>
                  <option value="young-adult" style={{ backgroundColor: '#111111', color: 'white' }}>Young Adult (18–24)</option>
                  <option value="adult" style={{ backgroundColor: '#111111', color: 'white' }}>Adult (25+)</option>
                </select>
              </div>
            </motion.div>

            {/* Bio */}
            <motion.div variants={itemVariants}>
              <label className={labelClass}>Bio <span className="text-gray-700 normal-case tracking-normal font-normal">(optional)</span></label>
              <textarea
                name="bio" value={formData.bio} onChange={handleChange}
                placeholder="What's your thing? Keep it real"
                rows={3}
                className={`${inputClass} resize-none`}
              />
            </motion.div>

          </motion.div>

          {/* CTA */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="flex justify-end mt-8"
          >
            <motion.button
              type="submit"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.97 }}
              className="bg-purple-600 hover:bg-purple-500 text-white text-sm font-bold px-8 py-3 rounded-xl transition-colors duration-200"
            >
              Continue
            </motion.button>
          </motion.div>
        </form>
      </motion.div>
    </div>
  );
};

export default BasicInfo;