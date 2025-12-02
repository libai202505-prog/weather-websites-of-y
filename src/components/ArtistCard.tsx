
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/


import React from 'react';
import { motion } from 'framer-motion';
import type { Artist } from '../types';
import { ArrowUpRight, ExternalLink } from 'lucide-react';

// Cast motion components to any to resolve type mismatch errors
const MotionDiv = motion.div as any;
const MotionImg = motion.img as any;
const MotionH3 = motion.h3 as any;
const MotionP = motion.p as any;

interface ArtistCardProps {
  artist: Artist;
  onClick: () => void;
}

const ArtistCard: React.FC<ArtistCardProps> = ({ artist, onClick }) => {
  const hasImage = Boolean(artist.image);

  // Render text-only card for entries without images (e.g., Mesovortices)
  if (!hasImage) {
    return (
      <MotionDiv
        className="group relative h-[220px] md:h-[280px] w-full overflow-hidden border border-white/10 bg-[#0f172a] hover:bg-[#1e293b] cursor-pointer rounded-xl flex flex-col items-center justify-center p-8 text-center transition-colors"
        initial="rest"
        whileHover="hover"
        whileTap="hover"
        animate="rest"
        data-hover="true"
        onClick={onClick}
      >
        {/* Decorative corner accent */}
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-[#38bdf8] to-transparent opacity-30 group-hover:opacity-100 transition-opacity" />

        <MotionDiv
          className="mb-4 p-3 rounded-full bg-white/5 text-[#38bdf8] group-hover:bg-[#38bdf8] group-hover:text-black transition-colors"
          variants={{
            rest: { scale: 1 },
            hover: { scale: 1.1 }
          }}
        >
          <ExternalLink className="w-6 h-6" />
        </MotionDiv>

        <h3 className="font-heading text-2xl md:text-3xl font-bold uppercase text-white tracking-tight mb-2 group-hover:text-[#38bdf8] transition-colors">
          {artist.name}
        </h3>

        <span className="text-xs font-mono text-gray-500 uppercase tracking-widest border border-white/10 px-3 py-1 rounded-full">
          {artist.genre}
        </span>

        <MotionDiv
          className="absolute bottom-6 text-xs text-gray-600 font-mono opacity-0 group-hover:opacity-100 transition-opacity"
          variants={{
            rest: { y: 10 },
            hover: { y: 0 }
          }}
        >
          CLICK TO VIEW
        </MotionDiv>
      </MotionDiv>
    );
  }

  // Original render for image-based cards
  return (
    <MotionDiv
      className="group relative h-[220px] md:h-[280px] w-full overflow-hidden border border-white/10 bg-[#0f172a] cursor-pointer rounded-xl"
      initial="rest"
      whileHover="hover"
      whileTap="hover"
      animate="rest"
      data-hover="true"
      onClick={onClick}
    >
      {/* Image Background */}
      <div className="absolute inset-0 overflow-hidden bg-[#1e293b]">
        <MotionImg
          src={artist.image}
          alt={artist.name}
          className="h-full w-full object-cover will-change-transform"
          variants={{
            rest: { scale: 1, opacity: 1, filter: 'grayscale(0%) blur(0px)' },
            hover: { scale: 1.1, opacity: 1, filter: 'grayscale(0%) blur(0px)' }
          }}
          transition={{ duration: 0.6, ease: [0.33, 1, 0.68, 1] }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/10 to-transparent transition-opacity duration-500" />
      </div>

      {/* Overlay Info */}
      <div className="absolute inset-0 p-6 flex flex-col justify-between pointer-events-none">
        <div className="flex justify-between items-start">
          <span className="text-[10px] font-mono border px-2 py-1 rounded backdrop-blur-md border-white/30 bg-black/40 text-white/80">
            {artist.day}
          </span>
          <MotionDiv
            variants={{
              rest: { opacity: 0, x: 10, y: -10 },
              hover: { opacity: 1, x: 0, y: 0 }
            }}
            className="bg-[#38bdf8] text-black rounded-full p-1.5 will-change-transform shadow-lg shadow-cyan-500/50"
          >
            <ArrowUpRight className="w-5 h-5" />
          </MotionDiv>
        </div>

        <div>
          <div className="overflow-hidden">
            <MotionH3
              className="font-heading text-lg md:text-xl font-bold uppercase text-white leading-tight drop-shadow-md will-change-transform"
              variants={{
                rest: { y: 0 },
                hover: { y: -2 }
              }}
              transition={{ duration: 0.4 }}
            >
              {artist.name}
            </MotionH3>
          </div>
          <MotionP
            className="text-xs font-bold uppercase tracking-wider text-[#38bdf8] mt-1 will-change-transform"
            variants={{
              rest: { opacity: 0.8, y: 0 },
              hover: { opacity: 1, y: 0 }
            }}
          >
            {artist.genre}
          </MotionP>
        </div>
      </div>
    </MotionDiv>
  );
};

export default ArtistCard;