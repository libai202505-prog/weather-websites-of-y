/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// Cast motion components to any to resolve type mismatch errors
const MotionPath = motion.path as any;
const MotionCircle = motion.circle as any;
const MotionG = motion.g as any;

// Weather states
enum WeatherState {
  Rain = 0,
  Snow = 1,
  Wind = 2
}

interface LogoProps {
  className?: string;
  variant?: 'weather' | 'radar';
}

export const Logo: React.FC<LogoProps> = ({ className = "w-12 h-12", variant = 'weather' }) => {
  const [weather, setWeather] = useState<WeatherState>(WeatherState.Rain);

  // Cycle weather every 3 seconds only if variant is weather
  useEffect(() => {
    if (variant !== 'weather') return;
    
    const interval = setInterval(() => {
      setWeather((prev) => (prev + 1) % 3);
    }, 3000);
    return () => clearInterval(interval);
  }, [variant]);

  // Radar Variant Render
  if (variant === 'radar') {
    return (
      <div className={`${className} relative flex items-center justify-center`}>
        <svg
          viewBox="0 0 100 100"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-full h-full drop-shadow-[0_0_8px_rgba(56,189,248,0.5)]"
        >
           {/* Static Base */}
           <circle cx="50" cy="50" r="45" stroke="#38bdf8" strokeWidth="2" strokeOpacity="0.8" />
           <circle cx="50" cy="50" r="30" stroke="#38bdf8" strokeWidth="1" strokeOpacity="0.5" />
           <circle cx="50" cy="50" r="15" stroke="#38bdf8" strokeWidth="1" strokeOpacity="0.3" />
           <line x1="50" y1="5" x2="50" y2="95" stroke="#38bdf8" strokeWidth="1" strokeOpacity="0.4" />
           <line x1="5" y1="50" x2="95" y2="50" stroke="#38bdf8" strokeWidth="1" strokeOpacity="0.4" />
           
           {/* Scanning Sector */}
           <MotionPath
             d="M50 50 L50 5 A45 45 0 0 1 95 50 Z"
             fill="url(#radar-gradient)"
             initial={{ rotate: 0 }}
             animate={{ rotate: 360 }}
             transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
             style={{ transformOrigin: "50px 50px", transformBox: "view-box" }}
           />
           
           <defs>
             <linearGradient id="radar-gradient" x1="50" y1="50" x2="50" y2="0" gradientUnits="userSpaceOnUse">
               <stop offset="0" stopColor="#38bdf8" stopOpacity="0" />
               <stop offset="1" stopColor="#38bdf8" stopOpacity="0.6" />
             </linearGradient>
           </defs>
        </svg>
      </div>
    );
  }

  // Default Weather Variant Render
  return (
    <div className={`${className} relative flex items-center justify-center`}>
      <svg
        viewBox="0 0 100 100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full drop-shadow-[0_0_8px_rgba(56,189,248,0.5)] overflow-visible"
      >
        <defs>
          <linearGradient id="cloud-gradient" x1="20" y1="40" x2="80" y2="60" gradientUnits="userSpaceOnUse">
             <stop offset="0" stopColor="#ffffff" />
             <stop offset="1" stopColor="#bae6fd" />
          </linearGradient>
        </defs>

        {/* Outer Ring / Compass (Static decorative) */}
        <circle cx="50" cy="50" r="46" stroke="#38bdf8" strokeWidth="1" strokeOpacity="0.5" strokeDasharray="4 2" />
        <circle cx="50" cy="50" r="48" stroke="#38bdf8" strokeWidth="0.5" strokeOpacity="0.2" />
        
        {/* Inner Grid (Latitude/Longitude) - Static */}
        <path d="M50 10 Q90 50 50 90 Q10 50 50 10" stroke="#38bdf8" strokeWidth="0.5" strokeOpacity="0.4" fill="none" />
        <line x1="10" y1="50" x2="90" y2="50" stroke="#38bdf8" strokeWidth="0.5" strokeOpacity="0.4" />
        <line x1="50" y1="10" x2="50" y2="90" stroke="#38bdf8" strokeWidth="0.5" strokeOpacity="0.4" />

        {/* Central Meteorological Elements Group */}
        <g transform="translate(0, 0)">
           {/* Sun (Behind) - Top Right */}
           <MotionCircle 
             cx="70" cy="35" r={8}
             fill="#fbbf24"
             initial={{ r: 8, opacity: 0.8 }}
             animate={{ r: [8, 9, 8], opacity: [0.8, 1, 0.8] }}
             transition={{ duration: 3, repeat: Infinity }}
           />

           {/* Cloud (Front) */}
           <path 
             d="M35 55 C28 55 24 60 28 65 C26 68 28 72 32 72 L70 72 C76 72 78 64 72 60 C74 52 64 48 60 52 C56 44 40 44 35 55 Z" 
             fill="url(#cloud-gradient)" 
             filter="drop-shadow(0 4px 4px rgba(0,0,0,0.3))"
             opacity="0.95"
           />
           
           {/* Weather Animation Cycle */}
           <AnimatePresence mode='wait'>
             {weather === WeatherState.Rain && (
                <MotionG
                  key="rain"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.5 }}
                >
                  <MotionG
                      animate={{ y: [0, 8, 12], opacity: [0, 1, 0] }}
                      transition={{ duration: 1.2, repeat: Infinity, ease: "easeIn" }}
                  >
                      <line x1="42" y1="75" x2="40" y2="80" stroke="#38bdf8" strokeWidth="2" strokeLinecap="round" />
                      <line x1="52" y1="76" x2="50" y2="83" stroke="#38bdf8" strokeWidth="2" strokeLinecap="round" />
                      <line x1="62" y1="75" x2="60" y2="80" stroke="#38bdf8" strokeWidth="2" strokeLinecap="round" />
                  </MotionG>
                </MotionG>
             )}

             {weather === WeatherState.Snow && (
                <MotionG
                  key="snow"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.5 }}
                >
                   <MotionG
                      animate={{ y: [0, 10], x: [0, 2, -2, 0], opacity: [0, 1, 0] }}
                      transition={{ duration: 2.5, repeat: Infinity, ease: "linear" }}
                   >
                      <circle cx="42" cy="76" r={1.5} fill="#e0f2fe" />
                      <circle cx="52" cy="74" r={2} fill="#e0f2fe" />
                      <circle cx="62" cy="76" r={1.5} fill="#e0f2fe" />
                   </MotionG>
                </MotionG>
             )}

             {weather === WeatherState.Wind && (
                <MotionG
                  key="wind"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.5 }}
                >
                   {/* Diagonal Wind: Moving Top-Right to Bottom-Left */}
                   <MotionG
                      animate={{ 
                        x: [0, -15], 
                        y: [0, 15],
                        opacity: [0, 1, 0] 
                      }}
                      transition={{ duration: 1.0, repeat: Infinity, ease: "easeInOut" }}
                   >
                       {/* Lines drawn initially at a slant */}
                       <line x1="65" y1="70" x2="55" y2="80" stroke="#bae6fd" strokeWidth="2" strokeLinecap="round" strokeOpacity="0.8" />
                       <line x1="55" y1="70" x2="45" y2="80" stroke="#bae6fd" strokeWidth="2" strokeLinecap="round" strokeOpacity="0.6" />
                       <line x1="45" y1="70" x2="35" y2="80" stroke="#bae6fd" strokeWidth="2" strokeLinecap="round" strokeOpacity="0.4" />
                   </MotionG>
                </MotionG>
             )}
           </AnimatePresence>
           
        </g>
      </svg>
    </div>
  );
};

export default Logo;