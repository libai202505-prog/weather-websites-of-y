/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/


import React, { useEffect, useState } from 'react';
import { motion, useSpring, useMotionValue, useTransform } from 'framer-motion';

// Cast motion components to any to resolve type mismatch errors
const MotionDiv = motion.div as any;
const MotionSpan = motion.span as any;

const CustomCursor: React.FC = () => {
  const [isHovering, setIsHovering] = useState(false);
  
  // Initialize off-screen to prevent flash
  const mouseX = useMotionValue(-100);
  const mouseY = useMotionValue(-100);
  
  // Smooth spring animation
  const springConfig = { damping: 20, stiffness: 350, mass: 0.1 }; 
  const x = useSpring(mouseX, springConfig);
  const y = useSpring(mouseY, springConfig);

  // Center the cursor (80px width/height -> 40px offset)
  const xPos = useTransform(x, (latest: number) => latest - 40);
  const yPos = useTransform(y, (latest: number) => latest - 40);

  useEffect(() => {
    const updateMousePosition = (e: MouseEvent) => {
      mouseX.set(e.clientX);
      mouseY.set(e.clientY);

      const target = e.target as HTMLElement;
      const clickable = target.closest('button') || 
                        target.closest('a') || 
                        target.closest('[data-hover="true"]');
      setIsHovering(!!clickable);
    };

    window.addEventListener('mousemove', updateMousePosition, { passive: true });
    return () => window.removeEventListener('mousemove', updateMousePosition);
  }, [mouseX, mouseY]);

  return (
    <MotionDiv
      className="fixed top-0 left-0 z-[9999] pointer-events-none mix-blend-difference flex items-center justify-center hidden md:flex will-change-transform"
      style={{ x: xPos, y: yPos }}
    >
      {/* This div is the actual cursor "body" and will handle the scaling and text centering */}
      {/* Changed base size to 80px diameter (40px radius) */}
      <MotionDiv
        className="relative rounded-full bg-white shadow-[0_0_10px_rgba(255,255,255,0.3)] flex items-center justify-center"
        style={{ width: 80, height: 80 }}
        animate={{
          // Scaled by 1.5 to become 120px diameter (60px radius) when hovering
          scale: isHovering ? 1.5 : 1, 
        }}
        transition={{ type: "spring", stiffness: 300, damping: 25 }}
      >
        {/* Text directly inside the scalable cursor body, centered by flex parent */}
        <MotionSpan 
          className="z-10 text-black font-black uppercase tracking-widest text-sm overflow-hidden whitespace-nowrap"
          initial={{ opacity: 0 }}
          animate={{ 
            opacity: isHovering ? 1 : 0,
          }}
          transition={{ duration: 0.2 }}
        >
          View
        </MotionSpan>
      </MotionDiv>
    </MotionDiv>
  );
};

export default CustomCursor;