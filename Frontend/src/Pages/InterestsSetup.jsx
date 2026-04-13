import React, { useState, useContext } from "react";
import { Usercontext } from "../Context/Usercontext";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.05 }
  }
};

const pillVariants = {
  hidden: { opacity: 0, scale: 0.85 },
  show:   { opacity: 1, scale: 1, transition: { duration: 0.25, ease: 'easeOut' } }
};

// Emoji map for visual interest
const interestEmoji = {
  Photography: "📷", Travel: "✈️", Food: "🍜", Fashion: "👗",
  Sports: "⚡", Music: "🎵", Art: "🎨", Technology: "💻",
};

const categoryEmoji = {
  Entertainment: "🎬", Education: "📚", News: "📰", Lifestyle: "🌿",
  Gaming: "🎮", Fitness: "🏋️", Business: "💼",
};

const InterestsSetup = () => {
  const { updateUserInterests } = useContext(Usercontext);
  const navigate = useNavigate();

  const interestsList = ["Photography", "Travel", "Food", "Fashion", "Sports", "Music", "Art", "Technology"];
  const categoriesList = ["Entertainment", "Education", "News", "Lifestyle", "Gaming", "Fitness", "Business"];

  const [interests, setInterests] = useState([]);
  const [contentCategories, setContentCategories] = useState([]);

  const toggle = (item, list, setter) => {
    setter(list.includes(item) ? list.filter(i => i !== item) : [...list, item]);
  };

  const handleSubmit = async () => {
    if (interests.length < 3) {
      // gentle visual feedback — no native alert
      return;
    }
    const res = await updateUserInterests({ interests, contentCategories });
    if (res?.success) {
      navigate("/profile-setup/profile-picture");
    }
  };

  const tooFew = interests.length < 3;

  return (
    <div className="min-h-screen bg-black text-white flex items-center justify-center px-4 py-12 relative overflow-hidden">

      {/* Ambient blobs */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-40 -right-40 w-[500px] h-[500px] bg-purple-700/8 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-[500px] h-[500px] bg-pink-700/6 rounded-full blur-3xl" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        className="relative z-10 w-full max-w-2xl"
      >

        {/* Header */}
        <div className="text-center mb-10">
          {/* Step dots */}
          <div className="flex items-center justify-center gap-2 mb-6">
            <div className="w-8 h-1 rounded-full bg-white/20" />
            <div className="w-8 h-1 rounded-full bg-purple-500" />
            <div className="w-8 h-1 rounded-full bg-white/15" />
          </div>
          <motion.h1
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-3xl font-black mb-2"
          >
            <span className="text-white">what's your </span>
            <span className="text-purple-400">vibe?</span>
          </motion.h1>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="text-gray-600 text-sm"
          >
            Pick at least 3 interests so we can personalise your feed
          </motion.p>
        </div>

        <div className="space-y-10">

          {/* ── Interests ── */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <p className="text-xs font-semibold uppercase tracking-widest text-gray-500">Interests</p>
              <AnimatePresence>
                {tooFew && interests.length > 0 && (
                  <motion.span
                    initial={{ opacity: 0, x: 8 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0 }}
                    className="text-xs text-pink-500"
                  >
                    {3 - interests.length} more needed
                  </motion.span>
                )}
                {!tooFew && (
                  <motion.span
                    initial={{ opacity: 0, x: 8 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0 }}
                    className="text-xs text-purple-400"
                  >
                    ✓ nice picks
                  </motion.span>
                )}
              </AnimatePresence>
            </div>

            <motion.div
              variants={containerVariants}
              initial="hidden"
              animate="show"
              className="flex flex-wrap gap-2.5"
            >
              {interestsList.map((item) => {
                const selected = interests.includes(item);
                return (
                  <motion.button
                    key={item}
                    variants={pillVariants}
                    onClick={() => toggle(item, interests, setInterests)}
                    whileHover={{ scale: 1.04 }}
                    whileTap={{ scale: 0.95 }}
                    className={`flex items-center gap-2 px-4 py-2.5 rounded-full text-sm font-medium border transition-all duration-200 ${
                      selected
                        ? 'bg-purple-600 border-purple-500 text-white shadow-lg shadow-purple-500/20'
                        : 'bg-white/5 border-white/10 text-gray-400 hover:border-white/25 hover:text-white'
                    }`}
                  >
                    <span className="text-base leading-none">{interestEmoji[item]}</span>
                    {item}
                    {selected && (
                      <motion.span
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="text-xs"
                      >
                        ✓
                      </motion.span>
                    )}
                  </motion.button>
                );
              })}
            </motion.div>
          </div>

          {/* ── Content Categories ── */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <p className="text-xs font-semibold uppercase tracking-widest text-gray-500">Content categories</p>
              <span className="text-xs text-gray-700">optional</span>
            </div>

            <motion.div
              variants={containerVariants}
              initial="hidden"
              animate="show"
              className="flex flex-wrap gap-2.5"
            >
              {categoriesList.map((item) => {
                const selected = contentCategories.includes(item);
                return (
                  <motion.button
                    key={item}
                    variants={pillVariants}
                    onClick={() => toggle(item, contentCategories, setContentCategories)}
                    whileHover={{ scale: 1.04 }}
                    whileTap={{ scale: 0.95 }}
                    className={`flex items-center gap-2 px-4 py-2.5 rounded-full text-sm font-medium border transition-all duration-200 ${
                      selected
                        ? 'bg-pink-600 border-pink-500 text-white shadow-lg shadow-pink-500/20'
                        : 'bg-white/5 border-white/10 text-gray-400 hover:border-white/25 hover:text-white'
                    }`}
                  >
                    <span className="text-base leading-none">{categoryEmoji[item]}</span>
                    {item}
                    {selected && (
                      <motion.span
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="text-xs"
                      >
                        ✓
                      </motion.span>
                    )}
                  </motion.button>
                );
              })}
            </motion.div>
          </div>

        </div>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="flex items-center justify-between mt-10"
        >
          <AnimatePresence>
            {tooFew && (
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="text-xs text-gray-700"
              >
                Select at least 3 interests to continue
              </motion.p>
            )}
          </AnimatePresence>

          <motion.button
            onClick={handleSubmit}
            whileHover={!tooFew ? { scale: 1.02 } : {}}
            whileTap={!tooFew ? { scale: 0.97 } : {}}
            className={`ml-auto text-sm font-bold px-8 py-3 rounded-xl transition-all duration-200 ${
              tooFew
                ? 'bg-white/8 text-gray-600 cursor-not-allowed'
                : 'bg-purple-600 hover:bg-purple-500 text-white'
            }`}
          >
            Continue
          </motion.button>
        </motion.div>

      </motion.div>
    </div>
  );
};

export default InterestsSetup;