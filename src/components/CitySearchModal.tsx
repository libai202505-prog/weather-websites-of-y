import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MapPin, Search, X, Database } from 'lucide-react';

interface CitySearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSearch: (city: string) => void;
  lang: 'en' | 'zh';
  // 🔥 新增：接收可用城市列表
  availableCities: string[];
}

const CitySearchModal: React.FC<CitySearchModalProps> = ({ isOpen, onClose, onSearch, lang, availableCities }) => {
  const [inputVal, setInputVal] = useState('');
  const isEn = lang === 'en';

  const handleSubmit = (val: string = inputVal) => {
    if (val.trim()) {
      onSearch(val.trim());
      setInputVal(''); 
      onClose();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleSubmit();
    if (e.key === 'Escape') onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="absolute inset-0" onClick={onClose} />

          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 10 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 10 }}
            className="relative w-full max-w-sm bg-[#1e293b] border border-slate-600 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[80vh]"
          >
            {/* 标题栏 */}
            <div className="bg-slate-800/50 p-4 border-b border-slate-700 flex justify-between items-center shrink-0">
              <span className="text-xs font-mono font-bold text-sky-400 tracking-widest flex items-center gap-2">
                <MapPin className="w-3 h-3" />
                {isEn ? "SWITCH SECTOR" : "切换区域"}
              </span>
              <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* 内容区域 */}
            <div className="p-6 flex flex-col gap-4 overflow-y-auto">
              <div className="relative">
                <input
                  autoFocus
                  type="text"
                  value={inputVal}
                  onChange={(e) => setInputVal(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder={isEn ? "Enter City Name..." : "输入城市名称..."}
                  className="w-full bg-[#0f172a] border border-slate-600 rounded-lg py-3 px-4 text-center text-white placeholder-slate-600 focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500 transition-all font-bold text-lg tracking-widest"
                />
              </div>

              {/* 按钮组 */}
              <div className="grid grid-cols-2 gap-3">
                <button onClick={onClose} className="py-2 rounded-lg border border-slate-600 text-slate-400 hover:bg-slate-700 hover:text-white text-xs font-bold transition-colors">
                  {isEn ? "CANCEL" : "取消"}
                </button>
                <button onClick={() => handleSubmit()} disabled={!inputVal.trim()} className="py-2 rounded-lg bg-sky-600 text-white hover:bg-sky-500 disabled:opacity-50 disabled:cursor-not-allowed text-xs font-bold transition-colors flex items-center justify-center gap-2">
                  <Search className="w-3 h-3" />
                  {isEn ? "CONFIRM" : "确认"}
                </button>
              </div>

              {/* 🔥 新增：可用节点列表 (标签云) */}
              {availableCities.length > 0 && (
                <div className="mt-2 pt-4 border-t border-slate-700/50">
                  <div className="flex items-center gap-2 mb-3 text-[10px] text-slate-500 font-mono tracking-widest uppercase">
                    <Database className="w-3 h-3" />
                    {isEn ? "AVAILABLE NODES" : "已接入监控节点"}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {availableCities.map((city) => (
                      <button
                        key={city}
                        onClick={() => handleSubmit(city)}
                        className="px-3 py-1.5 rounded bg-slate-800 border border-slate-700 text-slate-300 text-xs hover:bg-sky-900/30 hover:border-sky-500/50 hover:text-sky-300 transition-all"
                      >
                        {city}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default CitySearchModal;