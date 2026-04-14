import React, { useState, useContext } from "react";
import { Usercontext } from "../Context/Usercontext";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.04 }
  }
};

const pillVariants = {
  hidden: { opacity: 0, y: 6 },
  show: { opacity: 1, y: 0, transition: { duration: 0.2, ease: "easeOut" } }
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
    if (interests.length < 3) return;
    const res = await updateUserInterests({ interests, contentCategories });
    if (res?.success) {
      navigate("/profile-setup/profile-picture");
    }
  };

  const tooFew = interests.length < 3;
  const remaining = 3 - interests.length;

  return (
    <div className="min-h-screen bg-black text-white flex items-center justify-center px-4 py-12">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
        className="w-full max-w-xl"
      >

        {/* Step dots */}
        <div className="flex gap-1.5 mb-8">
          <div className="w-7 h-0.5 rounded-full bg-white/10" />
          <div className="w-7 h-0.5 rounded-full bg-purple-500" />
          <div className="w-7 h-0.5 rounded-full bg-white/10" />
        </div>

        {/* Header */}
        <h1 className="text-[28px] font-medium tracking-tight text-white mb-1.5">
          what's your vibe?
        </h1>
        <p className="text-sm text-neutral-600 mb-10">
          pick at least 3 interests to personalise your feed
        </p>

        <div className="space-y-9">

          {/* Interests */}
          <div>
            <div className="flex items-center justify-between pb-2.5 mb-4 border-b border-white/5">
              <span className="text-[11px] uppercase tracking-widest text-neutral-600 font-medium">
                Interests
              </span>
              <AnimatePresence mode="wait">
                {tooFew && interests.length > 0 ? (
                  <motion.span
                    key="remaining"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.15 }}
                    className="text-xs text-pink-600"
                  >
                    {remaining} more needed
                  </motion.span>
                ) : tooFew ? (
                  <motion.span
                    key="empty"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.15 }}
                    className="text-xs text-neutral-700"
                  >
                    0 of 3 min
                  </motion.span>
                ) : (
                  <motion.span
                    key="done"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.15 }}
                    className="text-xs text-purple-400"
                  >
                    {interests.length} selected
                  </motion.span>
                )}
              </AnimatePresence>
            </div>

            <motion.div
              variants={containerVariants}
              initial="hidden"
              animate="show"
              className="flex flex-wrap gap-2"
            >
              {interestsList.map((item) => {
                const selected = interests.includes(item);
                return (
                  <motion.button
                    key={item}
                    variants={pillVariants}
                    onClick={() => toggle(item, interests, setInterests)}
                    whileTap={{ scale: 0.96 }}
                    className={`px-3.5 py-2 rounded-md text-sm font-normal border transition-all duration-150 ${
                      selected
                        ? "bg-purple-950/60 border-purple-500/70 text-purple-200"
                        : "bg-transparent border-white/10 text-neutral-500 hover:border-white/20 hover:text-neutral-300"
                    }`}
                  >
                    {item}
                  </motion.button>
                );
              })}
            </motion.div>
          </div>

          {/* Content Categories */}
          <div>
            <div className="flex items-center justify-between pb-2.5 mb-4 border-b border-white/5">
              <span className="text-[11px] uppercase tracking-widest text-neutral-600 font-medium">
                Content categories
              </span>
              <span className="text-[11px] text-neutral-800">optional</span>
            </div>

            <motion.div
              variants={containerVariants}
              initial="hidden"
              animate="show"
              className="flex flex-wrap gap-2"
            >
              {categoriesList.map((item) => {
                const selected = contentCategories.includes(item);
                return (
                  <motion.button
                    key={item}
                    variants={pillVariants}
                    onClick={() => toggle(item, contentCategories, setContentCategories)}
                    whileTap={{ scale: 0.96 }}
                    className={`px-3.5 py-2 rounded-md text-sm font-normal border transition-all duration-150 ${
                      selected
                        ? "bg-pink-950/50 border-pink-500/60 text-pink-200"
                        : "bg-transparent border-white/10 text-neutral-500 hover:border-white/20 hover:text-neutral-300"
                    }`}
                  >
                    {item}
                  </motion.button>
                );
              })}
            </motion.div>
          </div>

        </div>

        {/* CTA */}
        <div className="flex items-center justify-between mt-10">
          <AnimatePresence>
            {tooFew && (
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="text-xs text-neutral-700"
              >
                {interests.length === 0
                  ? "select 3 interests to continue"
                  : `${remaining} more to go`}
              </motion.p>
            )}
          </AnimatePresence>

          <motion.button
            onClick={handleSubmit}
            whileTap={!tooFew ? { scale: 0.97 } : {}}
            disabled={tooFew}
            className={`ml-auto text-sm font-medium px-7 py-2.5 rounded-[10px] border transition-all duration-200 ${
              tooFew
                ? "bg-transparent border-white/5 text-neutral-700 cursor-not-allowed"
                : "bg-purple-600 hover:bg-purple-500 border-purple-600 text-white cursor-pointer"
            }`}
          >
            Continue
          </motion.button>
        </div>

      </motion.div>
    </div>
  );
};

export default InterestsSetup;