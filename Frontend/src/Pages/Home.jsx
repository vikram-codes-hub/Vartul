import React from "react";
import Hero from "../Components/Homeleft/Hero";
import Postforhome from "../Components/Homeleft/Postforhome";
import Homeright from "../Components/Homeright/Homeright";

const Home = () => {
  return (
    <div className="flex bg-black min-h-screen text-white">
      {/* ── CENTER FEED ──────────────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Stories bar — sticky top */}
        <div className="sticky top-0 z-20 bg-black w-full">
          <Hero />
        </div>

        {/* Post feed — scrollable, centered, max-width like Instagram */}
        <div className="w-full max-w-[470px] mx-auto pt-6 pb-24 px-2">
          <Postforhome />
        </div>
      </div>

      {/* ── RIGHT SIDEBAR ────────────────────────────────────────────────── */}
      <Homeright />
    </div>
  );
};

export default Home;
