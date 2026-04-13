import React from 'react'
import { Link } from 'react-router-dom'
import img from '../../assets/vezzra-removebg-preview.png'

const Logo = ({ className = '', showText = true, textSize = 'text-3xl', linkTo = '/' }) => {
  return (
    <Link
      to={linkTo}
      className={`flex items-center gap-3 group hover:scale-105 transition-all duration-300 ${className}`}
    >
      <img
        className="h-11 w-auto object-contain drop-shadow-md group-hover:drop-shadow-[0_0_8px_rgba(236,72,153,0.6)] transition-all duration-300"
        src={img}
        alt="Vartul Logo"
      />
      {showText && (
        <span
          style={{
            fontFamily: "'Dancing Script', cursive",
            fontWeight: 800,
            filter: "drop-shadow(0px 4px 6px rgba(0,0,0,0.6))"
          }}
          className={`text-4xl bg-gradient-to-r from-pink-500 via-fuchsia-400 to-purple-600 bg-clip-text text-transparent leading-none pr-2 pb-1 group-hover:drop-shadow-[0_0_12px_rgba(192,38,211,0.4)] transition-all duration-300`}
        >
          Vartul
        </span>
      )}
    </Link>
  )
}

export default Logo