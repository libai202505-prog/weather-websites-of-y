/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React, { useState, useRef, useEffect } from 'react';
import { MessageCircle, X, Send, GripHorizontal, MoveDiagonal, MoveDiagonal2, ChevronDown } from 'lucide-react';
import { motion, AnimatePresence, useDragControls, useMotionValue } from 'framer-motion';
import { sendMessageToGemini } from '../services/geminiService';
import type { ChatMessage, FuyaoPersonality } from '../types';
import { FUYAO_QUOTES } from '../data'; // 🔴 移除了 FUYAO_AVATAR
import Logo from './Logo';

// 👇 🟢 新增：导入本地图片
import localMascot from './my-mascot.png';

// Cast motion components to any to resolve type mismatch errors
const MotionDiv = motion.div as any;
const MotionButton = motion.button as any;

interface AIChatProps {
  lang: 'en' | 'zh';
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  personality: FuyaoPersonality;
  setPersonality: (p: FuyaoPersonality) => void;
}

// Mapping for Bilingual Personality Labels
const PERSONALITY_LABELS: Record<FuyaoPersonality, { en: string; zh: string }> = {
  RANDOM: { en: 'Random', zh: '随机/引导' },
  PLAYFUL: { en: 'Playful', zh: '傲娇' },
  CYBER: { en: 'Cyber', zh: '赛博' },
  ANCIENT: { en: 'Ancient', zh: '古风' },
  CARING: { en: 'Caring', zh: '暖心' }
};

const AIChat: React.FC<AIChatProps> = ({ lang, isOpen, setIsOpen, personality, setPersonality }) => {
  
  const placeholders: Record<'en' | 'zh', string> = {
    en: 'Ask Fuyao about weather tools, models...',
    zh: '向扶摇询问数据源、模型、天气产品...'
  };

  // Helper to get a random quote based on personality
  const getRandomQuote = (currentLang: 'en' | 'zh') => {
    let pool;
    if (personality === 'RANDOM') {
      pool = Object.values(FUYAO_QUOTES).flat();
    } else {
      pool = FUYAO_QUOTES[personality];
    }
    
    if (!pool || pool.length === 0) return "Hello! I am Fuyao. ☀️";
    
    const index = Math.floor(Math.random() * pool.length);
    return pool[index][currentLang] + " ☀️";
  };

  // Load initial state from localStorage if available, otherwise use a random Fuyao quote
  const [messages, setMessages] = useState<ChatMessage[]>(() => {
    const saved = localStorage.getItem('aero_chat_history');
    if (saved) {
      return JSON.parse(saved);
    }
    return [{ role: 'model', text: getRandomQuote(lang) }];
  });
  
  // Persistence Effect: Save to localStorage whenever messages change
  useEffect(() => {
    // Limit to last 50 messages to prevent storage bloat
    const savedMessages = messages.slice(-50);
    localStorage.setItem('aero_chat_history', JSON.stringify(savedMessages));
  }, [messages]);

  // Language Switch & Personality Switch Effect
  useEffect(() => {
    setMessages(prev => {
      // If chat is empty, or only contains 1 message from the model (the welcome message),
      // we REPLACE it with a NEW random quote in the new language/personality.
      if (prev.length === 0 || (prev.length === 1 && prev[0].role === 'model')) {
        return [{ role: 'model', text: getRandomQuote(lang) }];
      }
      return prev;
    });
  }, [lang, personality]);

  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const chatContainerRef = useRef<HTMLDivElement>(null);

  // Drag and Resize State
  const dragControls = useDragControls();
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const [dimensions, setDimensions] = useState({ width: 380, height: 500 });
  const minSize = { width: 300, height: 400 };

  const scrollToBottom = () => {
    if (chatContainerRef.current) {
      const { scrollHeight, clientHeight } = chatContainerRef.current;
      chatContainerRef.current.scrollTo({
        top: scrollHeight - clientHeight,
        behavior: 'smooth',
      });
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isOpen]);

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMessage: ChatMessage = { role: 'user', text: input };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    // Slight delay to allow state update to render before scrolling
    setTimeout(scrollToBottom, 100);

    // Pass personality to the service
    const responseText = await sendMessageToGemini(input, personality);
    
    setMessages(prev => [...prev, { role: 'model', text: responseText }]);
    setIsLoading(false);
  };

  // Robust Markdown-like parser including URLs
  const renderMessageText = (text: string) => {
    if (!text) return null;
    const urlRegex = /(https?:\/\/[^\s]+)/g;

    return text.split('\n').map((line, i) => {
      let content = line.trim();
      if (!content) return <div key={i} className="h-2" />; // Spacer for empty lines

      // Handle simple list items (* or -)
      const isList = content.startsWith('* ') || content.startsWith('- ');
      if (isList) content = content.substring(2);
      
      // Handle Headers (#)
      const isHeader = content.startsWith('##');
      if (isHeader) content = content.replace(/^#+\s*/, '');

      // Split by URL first to separate links from text
      const parts = content.split(urlRegex);
      
      return (
        <div 
          key={i} 
          className={`
            ${isList ? 'pl-4 relative mb-1' : 'mb-1'} 
            ${isHeader ? 'font-bold text-sky-300 mt-3 mb-2 text-base' : ''}
            break-words
          `}
        >
           {isList && <span className="absolute left-0 text-sky-400">•</span>}
           
           {parts.map((part, j) => {
              // If this part matches a URL
              if (part.match(urlRegex)) {
                  return (
                    <a 
                      key={j} 
                      href={part} 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      className="text-sky-300 underline break-all hover:text-sky-100 transition-colors"
                    >
                      {part}
                    </a>
                  );
              }

              // Parse bold **text** within non-url parts
              const subParts = part.split(/(\*\*.*?\*\*)/g);
              return subParts.map((subPart, k) => {
                  if (subPart.startsWith('**') && subPart.endsWith('**')) {
                    return <strong key={`${j}-${k}`} className="text-sky-200 font-bold">{subPart.slice(2, -2)}</strong>
                  }
                  return <span key={`${j}-${k}`}>{subPart}</span>
              });
           })}
        </div>
      )
    });
  };

  // Custom Resize Handler
  const handleResizeStart = (direction: 'left' | 'right') => (e: React.PointerEvent) => {
    e.preventDefault();
    e.stopPropagation();

    const startX = e.clientX;
    const startY = e.clientY;
    const startWidth = dimensions.width;
    const startHeight = dimensions.height;
    const startXPos = x.get(); // Get current motion value X

    const onPointerMove = (moveEvent: PointerEvent) => {
      const deltaX = moveEvent.clientX - startX;
      const deltaY = moveEvent.clientY - startY;

      // Height logic is the same for both
      const newHeight = Math.max(minSize.height, startHeight + deltaY);

      if (direction === 'right') {
        // Dragging right handle: simple width increase
        const newWidth = Math.max(minSize.width, startWidth + deltaX);
        setDimensions({ width: newWidth, height: newHeight });
      } else {
        // Dragging left handle:
        // 1. Calculate new potential width (dragging left = negative deltaX = positive width growth)
        const newWidth = Math.max(minSize.width, startWidth - deltaX);
        
        // 2. We only update if the width actually changed (respected minWidth)
        const widthChange = newWidth - startWidth;
        
        if (widthChange !== 0) {
          // 3. Move the box to the left by the amount it grew to create the illusion of left-resizing
          // Note: Since it's fixed right, decreasing X moves it LEFT.
          x.set(startXPos - widthChange);
          setDimensions({ width: newWidth, height: newHeight });
        }
      }
    };

    const onPointerUp = () => {
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);
    };

    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);
  };

  return (
    <div className="fixed bottom-4 right-4 md:bottom-6 md:right-6 z-50 flex flex-col items-end pointer-events-auto">
      <AnimatePresence>
        {isOpen && (
          <MotionDiv
            initial={{ opacity: 0, y: 20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.9 }}
            style={{ 
              width: dimensions.width, 
              height: dimensions.height,
              x,
              y
            }}
            // Enable drag but disable default listener so we can attach it to header only
            drag
            dragListener={false} 
            dragMomentum={false}
            dragControls={dragControls}
            className="mb-4 bg-black/80 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl shadow-sky-500/20 flex flex-col overflow-hidden max-w-[95vw] max-h-[90vh] relative"
          >
            {/* Draggable Header with Personality Selector */}
            <div 
              onPointerDown={(e: React.PointerEvent) => dragControls.start(e)}
              className="flex-none bg-gradient-to-r from-sky-900/50 to-blue-900/50 p-4 flex justify-between items-center border-b border-white/10 cursor-move touch-none select-none group"
            >
              <div className="flex items-center gap-3 pointer-events-none">
                <div className="relative w-8 h-8 overflow-hidden">
                   <Logo variant="radar" className="w-full h-full" />
                </div>
                <h3 className="font-heading font-bold text-white tracking-wider">Fuyao AI (扶摇)</h3>
              </div>
              
              <div className="flex items-center gap-2">
                {/* Personality Selector */}
                <div className="relative group">
                    <button className="flex items-center gap-1 text-[10px] uppercase bg-black/20 hover:bg-black/40 px-2 py-1 rounded text-white/70 hover:text-white transition-colors border border-white/10 whitespace-nowrap">
                        {PERSONALITY_LABELS[personality][lang]} <ChevronDown className="w-3 h-3" />
                    </button>
                    {/* Dropdown Menu */}
                    <div className="absolute top-full right-0 mt-1 w-24 bg-[#0f172a] border border-white/20 rounded-lg shadow-xl overflow-hidden hidden group-hover:block z-50">
                        {(['RANDOM', 'PLAYFUL', 'CYBER', 'ANCIENT', 'CARING'] as FuyaoPersonality[]).map(p => (
                            <button 
                                key={p}
                                onClick={(e) => { e.stopPropagation(); setPersonality(p); }}
                                className={`w-full text-left px-3 py-2 text-[10px] hover:bg-sky-500/20 text-gray-300 hover:text-white ${personality === p ? 'text-sky-400 font-bold' : ''}`}
                            >
                                {PERSONALITY_LABELS[p][lang]}
                            </button>
                        ))}
                    </div>
                </div>

                <button 
                  onClick={(e) => { e.stopPropagation(); setIsOpen(false); }} 
                  className="text-white/50 hover:text-white pointer-events-auto p-1 rounded hover:bg-white/10 transition-colors" 
                  data-hover="true"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Messages - Updated for WeChat Style Avatar */}
            <div 
              ref={chatContainerRef}
              className="flex-1 overflow-y-auto p-4 space-y-4 scroll-smooth min-h-0 relative z-10"
            >
              {messages.map((msg, idx) => (
                <div
                  key={idx}
                  className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start items-start gap-2'}`}
                >
                  {/* Model Avatar (WeChat Style) */}
                  {msg.role === 'model' && (
                    <div className="flex-shrink-0 w-8 h-8 rounded-full overflow-hidden border border-white/10 bg-black/30 mt-1">
                      {/* 👇 🟢 使用本地图片 */}
                      <img 
                         src={localMascot} 
                         alt="Fuyao" 
                         className="w-full h-full object-cover mix-blend-normal scale-125"
                      />
                    </div>
                  )}

                  <div
                    className={`max-w-[85%] p-3 rounded-2xl text-sm leading-relaxed shadow-sm ${
                      msg.role === 'user'
                        ? 'bg-sky-600 text-white rounded-br-none'
                        : 'bg-white/10 text-gray-200 rounded-bl-none border border-white/5'
                    }`}
                  >
                    {msg.role === 'user' ? msg.text : renderMessageText(msg.text)}
                  </div>
                </div>
              ))}
              {isLoading && (
                <div className="flex justify-start items-start gap-2">
                   <div className="flex-shrink-0 w-8 h-8 rounded-full overflow-hidden border border-white/10 bg-black/30 mt-1">
                      {/* 👇 🟢 使用本地图片 (加载中动画) */}
                      <img 
                         src={localMascot} 
                         alt="Fuyao" 
                         className="w-full h-full object-cover mix-blend-normal scale-125"
                      />
                   </div>
                  <div className="bg-white/10 p-3 rounded-2xl rounded-bl-none flex gap-1">
                    <span className="w-1.5 h-1.5 bg-sky-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <span className="w-1.5 h-1.5 bg-sky-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <span className="w-1.5 h-1.5 bg-sky-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                </div>
              )}
            </div>

            {/* Input */}
            <div className="flex-none p-3 border-t border-white/10 bg-black/40 relative z-10">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleSend();
                    }
                  }}
                  placeholder={placeholders[lang]}
                  className="flex-1 bg-transparent text-white placeholder-white/30 text-sm focus:outline-none"
                />
                <button
                  onClick={handleSend}
                  disabled={isLoading || !input.trim()}
                  className="bg-sky-600 p-2 rounded-lg hover:bg-sky-500 transition-colors disabled:opacity-50"
                  data-hover="true"
                >
                  <Send className="w-4 h-4 text-white" />
                </button>
              </div>
            </div>

            {/* Resize Handles */}
            
            {/* Bottom-Left Handle */}
            <div 
              onPointerDown={handleResizeStart('left')}
              className="absolute bottom-0 left-0 w-6 h-6 z-50 cursor-nesw-resize group flex items-end justify-start p-0.5"
            >
               <div className="w-full h-full bg-transparent hover:bg-sky-500/20 rounded-br-xl transition-colors">
                  <MoveDiagonal2 className="w-3.5 h-3.5 text-white/20 group-hover:text-sky-400 transition-colors absolute bottom-1 left-1" />
               </div>
            </div>

            {/* Bottom-Right Handle */}
            <div 
              onPointerDown={handleResizeStart('right')}
              className="absolute bottom-0 right-0 w-6 h-6 z-50 cursor-nwse-resize group flex items-end justify-end p-0.5"
            >
               <div className="w-full h-full bg-transparent hover:bg-sky-500/20 rounded-br-xl transition-colors">
                 <MoveDiagonal className="w-3.5 h-3.5 text-white/20 group-hover:text-sky-400 transition-colors absolute bottom-1 right-1" />
               </div>
            </div>

          </MotionDiv>
        )}
      </AnimatePresence>

      {/* Toggle Button */}
      <MotionButton
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        onClick={() => setIsOpen(!isOpen)}
        className="w-12 h-12 md:w-14 md:h-14 rounded-full bg-gradient-to-tr from-sky-600 to-blue-600 flex items-center justify-center shadow-lg shadow-sky-500/40 border border-white/20 z-50 group"
        data-hover="true"
      >
        {isOpen ? (
          <X className="w-5 h-5 md:w-6 md:h-6 text-white" />
        ) : (
          <MessageCircle className="w-5 h-5 md:w-6 md:h-6 text-white group-hover:animate-bounce" />
        )}
      </MotionButton>
    </div>
  );
};

export default AIChat;