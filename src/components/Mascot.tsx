/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
// 👇 改动 1: 这里去掉了 FUYAO_AVATAR
import { FUYAO_QUOTES } from '../data';
import type { FuyaoPersonality } from '../types';

// 👇 改动 2: 直接导入本地图片 (确保图片在 src/assets/my-mascot.png)
import localMascot from './my-mascot.png';

// Cast motion components to any to resolve type mismatch errors
const MotionDiv = motion.div as any;
const MotionImg = motion.img as any;

interface MascotProps {
  onClick?: () => void;
  lang?: 'en' | 'zh';
  personality: FuyaoPersonality;
}

// 🎨 VISUAL CONFIGURATION
const IMAGE_STYLE = {
  // 👇 改动 3: 改为 normal，确保图片色彩正常显示
  blendMode: 'normal' as 'screen' | 'normal' | 'soft-light' | 'lighten', 
  
  // Opacity of the character (0.8 - 1.0)
  opacity: 1.0,

  // Softens the rectangular edges of the image
  maskEdges: true 
};

export const Mascot: React.FC<MascotProps> = ({ onClick, lang = 'en', personality }) => {
  const [quote, setQuote] = useState("");
  const [imgError, setImgError] = useState(false);

  // Helper to get a quote based on personality
  const getNextQuote = () => {
    let pool;
    if (personality === 'RANDOM') {
      // Flatten all values to get random from all categories
      pool = Object.values(FUYAO_QUOTES).flat();
    } else {
      pool = FUYAO_QUOTES[personality];
    }
    
    // Fallback if pool is empty
    if (!pool || pool.length === 0) return "Atmosphere nominal.";
    
    const randomIdx = Math.floor(Math.random() * pool.length);
    return pool[randomIdx][lang];
  };

  // Initialize random quote on mount or when personality changes
  useEffect(() => {
    setQuote(getNextQuote());
  }, [personality, lang]);

  // Handler for clicking the mascot: Change quote AND Open Chat
  const handleMascotClick = () => {
    setQuote(getNextQuote());

    // Trigger the parent action (Opening the Chat)
    if (onClick) {
      onClick();
    }
  };

  return (
    <MotionDiv 
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 1, delay: 0.5 }}
      onClick={handleMascotClick}
      // Uses normal flow positioning (relative) to fit in grid
      className="relative z-20 flex flex-col items-center pointer-events-auto cursor-pointer group mt-8 lg:mt-0"
      data-hover="true"
    >
        <div className="relative w-48 h-64 flex items-end justify-center">
            {/* Holographic Container */}
            <div className="relative w-full h-full flex items-center justify-center">
                
                {/* Atmosphere Glow (Backdrop) - Darkened to blend with #0f172a */}
                <MotionDiv 
                  className="absolute inset-0 bg-gradient-to-br from-sky-900/40 via-slate-800/40 to-indigo-900/40 rounded-full blur-3xl pointer-events-none"
                  animate={{ 
                    scale: [1.2, 1.3, 1.2],
                    opacity: [0.6, 0.8, 0.6]
                  }}
                  transition={{
                    duration: 4,
                    repeat: Infinity,
                    ease: "easeInOut"
                  }}
                />

                {/* Render Static Local Image with HIGH-END VISUALS */}
                {!imgError ? (
                  <MotionImg 
                    // 👇 改动 4: 使用导入的变量
                    src={localMascot}
                    alt="Fuyao Mascot" 
                    onError={() => setImgError(true)}
                    className="relative w-32 h-32 lg:w-40 lg:h-40 object-contain transition-transform group-hover:scale-110 duration-300"
                    style={{
                      // 1. Blend Mode restoration
                      mixBlendMode: IMAGE_STYLE.blendMode,
                      opacity: IMAGE_STYLE.opacity,

                      // 2. Edge Masking - Smoother transition (40% to 85%)
                      maskImage: IMAGE_STYLE.maskEdges 
                        ? 'radial-gradient(circle at center, black 40%, transparent 85%)' 
                        : 'none',
                      WebkitMaskImage: IMAGE_STYLE.maskEdges 
                        ? 'radial-gradient(circle at center, black 40%, transparent 85%)' 
                        : 'none',

                      // 3. Glow/Contrast enhancement
                      filter: 'drop-shadow(0 0 15px rgba(56,189,248,0.4)) contrast(1.1) brightness(1.1)',
                    }}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ 
                      opacity: 1,
                      // Float Animation
                      y: [0, -12, 0],
                      // Sway Animation
                      rotate: [0, 2, -2, 0],
                      // Breathing Animation
                      scale: [1, 1.03, 1]
                    }}
                    transition={{
                      duration: 6,
                      repeat: Infinity,
                      ease: "easeInOut"
                    }}
                  />
                ) : (
                  // Error Fallback Text
                  <div className="text-red-400 text-xs text-center border border-red-500 p-2 rounded bg-black/50">
                    Image Not Found<br/>
                    Put <strong>my-mascot.png</strong><br/>
                    in <strong>src/assets</strong> folder
                  </div>
                )}
            </div>
        </div>
        
        {/* Dialogue Bubble - Static (No floating animation) - Moved UP by changing margin to negative */}
        <MotionDiv 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            // Key change: Added key={quote} to trigger re-animation on quote change
            key={quote} 
            transition={{ duration: 0.3, ease: "easeOut" }}
            className="-mt-6 bg-[#0f172a]/80 backdrop-blur-md border border-[#38bdf8]/20 p-3 rounded-xl rounded-tr-none max-w-[240px] text-xs text-sky-200 text-center shadow-lg group-hover:bg-[#1e293b] transition-colors"
        >
          "{quote}"
        </MotionDiv>
    </MotionDiv>
  );
};

export default Mascot;