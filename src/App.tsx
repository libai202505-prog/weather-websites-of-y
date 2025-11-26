/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React, { useState, useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Play, X, Globe, Lock, ShieldCheck, Zap } from 'lucide-react';
import FluidBackground from './components/FluidBackground';
import GlitchText from './components/GlitchText';
import ArtistCard from './components/ArtistCard';
import AIChat from './components/AIChat';
import CustomCursor from './components/CustomCursor';
import { Logo } from './components/Logo';
import { Mascot } from './components/Mascot';
import { RAW_SOURCES } from './data';
import  type { RawSourceItem, FuyaoPersonality } from './types';

// Cast motion components to any to resolve type mismatch errors
const MotionDiv = motion.div as any;
const MotionP = motion.p as any;

const UI_TEXT = {
  en: {
    nav: { 
      home: 'Home', 
      forecast: 'Forecast', 
      satellite: 'Satellite', 
      regional: 'Regional', 
      research: 'Research', 
      community: 'Community', 
      videos: 'Videos',
      access: 'Access' 
    },
    status: 'STATUS: OPERATIONAL',
    hero: {
      version: 'Weather_Web_Page_v2.1',
      subtitle: 'CENTRALIZED INTELLIGENCE FOR ATMOSPHERIC PHENOMENA'
    },
    directory: {
      title: 'GLOBAL',
      titleHighlight: 'INDEX',
      desc: 'Aggregating the planet\'s most powerful forecasting systems, regional observatories, and satellite feeds.'
    },
    layers: {
      title: 'CORE',
      titleHighlight: 'METRICS',
      dailyData: 'DAILY DATA PROCESSED',
      items: [
        { title: 'SYNOPTIC', desc: 'Large scale systems via GFS & ECMWF.' },
        { title: 'MESOSCALE', desc: 'Precipitation analysis & severe storm tracking.' },
        { title: 'VECTORS', desc: 'Streamline wind visualization for maritime & aviation.' },
      ]
    },
    access: {
      title: 'ACCESS &',
      desc: 'Most linked resources are free for public use. Some specialized datasets require academic credentials or subscriptions.',
      networkWarning: 'NOTICE: Some external data sources may require specific network environments (VPN/Proxy) to access in certain regions.',
      tiers: [
        { title: "PUBLIC DOMAIN", items: ["NOAA GFS", "GOES Satellite", "NMC Charts"] },
        { title: "COMMERCIAL/FREEMIUM", items: ["Windy Premium", "Ventusky", "WeatherFlow"] },
        { title: "RESTRICTED/ACADEMIC", items: ["ECMWF High-Res", "EarthLab Raw Data", "Custom Reanalysis"] },
      ]
    },
    footer: {
      tagline: 'AGGREGATING PLANETARY DATA STREAMS',
      submission: 'Submit: 1742521891@qq.com | Xiaohongshu: 7421236275'
    },
    modal: {
      launch: 'Launch Website'
    }
  },
  zh: {
    nav: { 
      home: '首页', 
      forecast: '预报', 
      satellite: '卫星', 
      regional: '区域', 
      research: '科研', 
      community: '社区',
      videos: '视频',
      access: '访问' 
    },
    status: '状态：运行中',
    hero: {
      version: '气象数据网页_v2.1',
      subtitle: '气象现象的集中情报与数据网站'
    },
    directory: {
      title: '全球',
      titleHighlight: '索引',
      desc: '汇集全球最强大的天气预报系统、区域观测站和卫星信号源。'
    },
    layers: {
      title: '核心',
      titleHighlight: '参数',
      dailyData: '日处理数据量',
      items: [
        { title: '天气尺度', desc: '通过 GFS 和 ECMWF 查看大尺度天气系统。' },
        { title: '中尺度雷达', desc: '降水分析与强对流风暴追踪。' },
        { title: '矢量分析', desc: '海事与航空的流线风场可视化。' },
      ]
    },
    access: {
      title: '研究与访问',
      desc: '大多数链接资源可供公众免费使用。部分专业数据集需要学术凭证或订阅。',
      networkWarning: '注意：部分外部数据源可能需要特定的网络环境（科学上网/VPN）才能在某些地区正常访问。',
      tiers: [
        { title: "公共领域", items: ["NOAA GFS", "GOES 卫星", "NMC 图表"] },
        { title: "商业/免费增值", items: ["Windy 高级版", "Ventusky", "WeatherFlow"] },
        { title: "受限/学术", items: ["ECMWF 高分辨率", "EarthLab 原始数据", "定制再分析"] },
      ]
    },
    footer: {
      tagline: '聚合行星数据流',
      submission: '投稿邮箱：1742521891@qq.com | 小红书：7421236275'
    },
    modal: {
      launch: '访问网站'
    }
  }
};

const NAV_ITEMS = ['home', 'forecast', 'satellite', 'regional', 'research', 'community', 'videos', 'access'];
const CATEGORY_MAP: Record<string, number> = {
  'forecast': 0,
  'satellite': 1,
  'regional': 2,
  'research': 3,
  'community': 4,
  'videos': 5
};

export default function App() {
  const [lang, setLang] = useState<'en' | 'zh'>('zh');
  const [selectedSource, setSelectedSource] = useState<RawSourceItem | null>(null);
  const [isChatOpen, setIsChatOpen] = useState(false);
  // Add Personality State
  const [personality, setPersonality] = useState<FuyaoPersonality>('RANDOM');

  // Toggle Language
  const toggleLang = () => setLang(prev => prev === 'en' ? 'zh' : 'en');
  const t = UI_TEXT[lang];

  // Scroll Handler
  const scrollToSection = (id: string) => {
    // If it's a category link
    if (CATEGORY_MAP[id] !== undefined) {
      const element = document.getElementById(`category-${CATEGORY_MAP[id]}`);
      if (element) element.scrollIntoView({ behavior: 'smooth' });
    } else {
      // Standard ID link
      const element = document.getElementById(id);
      if (element) element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="relative min-h-screen text-white selection:bg-sky-500/30 selection:text-sky-200">
      <FluidBackground />
      <CustomCursor />

      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-40 border-b border-white/10 bg-[#0f172a]/80 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-4 cursor-pointer" onClick={() => window.scrollTo(0, 0)}>
            <Logo className="w-10 h-10" />
            <span className="font-heading text-xl font-bold tracking-widest">AERO</span>
          </div>

          <div className="hidden md:flex items-center gap-3 lg:gap-8">
            {NAV_ITEMS.map((item) => (
              <button
                key={item}
                onClick={() => scrollToSection(item)}
                className="text-[10px] lg:text-xs font-bold uppercase tracking-widest text-gray-400 hover:text-sky-400 transition-colors whitespace-nowrap"
              >
                {t.nav[item as keyof typeof t.nav]}
              </button>
            ))}
          </div>

          <button 
            onClick={toggleLang}
            className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-white/20 hover:bg-white/10 transition-colors text-xs font-mono"
          >
            <Globe className="w-3 h-3" />
            <span>{lang.toUpperCase()}</span>
          </button>
        </div>
      </nav>

      {/* Hero Section */}
      <section id="home" className="relative min-h-screen flex flex-col justify-center px-6 pt-20">
        <div className="max-w-7xl mx-auto w-full grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          {/* Text Column: Centered on Mobile/Tablet, Left on Desktop */}
          <div className="flex flex-col items-center lg:items-start text-center lg:text-left order-2 lg:order-1">
            <MotionDiv 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-sky-500/30 bg-sky-500/10 text-sky-400 text-xs font-mono mb-8"
            >
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-sky-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-sky-500"></span>
              </span>
              {t.hero.version}
            </MotionDiv>

            <GlitchText text="AERO" as="h1" className="text-[15vw] lg:text-[10vw] leading-[0.8] mb-8 text-white mix-blend-difference" />
            
            <MotionP 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="text-xl md:text-2xl text-gray-400 max-w-xl font-light"
            >
              {t.hero.subtitle}
            </MotionP>
          </div>
          
          {/* Mascot Column: Centered always */}
          <div className="relative h-[40vh] lg:h-[60vh] flex items-center justify-center order-1 lg:order-2">
             <Mascot 
                onClick={() => setIsChatOpen(true)} 
                lang={lang} 
                personality={personality} 
             />
          </div>
        </div>
      </section>

      {/* Directory Section */}
      <section id="directory" className="py-24 px-6 border-t border-white/5 bg-black/20">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-end mb-20 gap-8">
            <div>
              <h2 className="font-heading text-5xl md:text-7xl font-bold mb-4">
                {t.directory.title} <span className="text-transparent bg-clip-text bg-gradient-to-r from-sky-400 to-blue-600">{t.directory.titleHighlight}</span>
              </h2>
              <p className="text-gray-400 max-w-md">{t.directory.desc}</p>
            </div>
          </div>

          <div className="space-y-32">
            {RAW_SOURCES.map((category, catIndex) => (
              <div key={catIndex} id={`category-${catIndex}`} className="scroll-mt-32">
                <div className="flex items-center gap-4 mb-12">
                  <span className="text-4xl md:text-6xl font-heading font-bold text-white/10">0{catIndex + 1}</span>
                  <div>
                    <h3 className="text-2xl font-bold text-sky-200">{category.title[lang]}</h3>
                    <p className="text-sm text-gray-500">{category.description[lang]}</p>
                  </div>
                </div>
                
                {/* GRID FIX: Changed md:grid-cols-2 to md:grid-cols-3 as requested */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-x-8 gap-y-16">
                  {category.sources.map((source) => (
                    <ArtistCard 
                      key={source.id} 
                      artist={{
                        ...source,
                        name: source.name[lang],
                        genre: source.genre[lang],
                        description: source.description[lang]
                      }}
                      onClick={() => setSelectedSource(source)}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Data Layers Info */}
      <section className="py-32 px-6 border-y border-white/5 relative overflow-hidden">
        <div className="absolute inset-0 bg-sky-900/5" />
        <div className="max-w-7xl mx-auto relative">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12 text-center">
            {t.layers.items.map((item, i) => (
              <div key={i} className="group p-8 border border-white/5 hover:border-sky-500/30 transition-colors bg-[#0f172a]/50 backdrop-blur-sm rounded-2xl">
                <h4 className="font-heading text-xl font-bold mb-4 group-hover:text-sky-400 transition-colors">{item.title}</h4>
                <p className="text-sm text-gray-400">{item.desc}</p>
              </div>
            ))}
          </div>
          
          <div className="mt-24 text-center">
             <div className="font-mono text-xs text-sky-500 mb-2">{t.layers.dailyData}</div>
             <div className="font-heading text-6xl md:text-9xl font-bold text-transparent bg-clip-text bg-gradient-to-b from-white to-white/10">
               4.2 TB
             </div>
          </div>
        </div>
      </section>

      {/* Access Tiers */}
      <section id="access" className="py-24 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="mb-16">
             <h2 className="font-heading text-4xl mb-4">{t.access.title} <span className="text-gray-500">TIERS</span></h2>
             <p className="text-gray-400 max-w-2xl">{t.access.desc}</p>
             {/* Network Warning Banner */}
             <div className="mt-6 p-4 border border-yellow-500/30 bg-yellow-500/10 rounded-lg flex items-start gap-3">
                <Zap className="w-5 h-5 text-yellow-500 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-yellow-200/80 leading-relaxed">
                  {t.access.networkWarning}
                </p>
             </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {t.access.tiers.map((tier, i) => (
              <div key={i} className="p-8 border border-white/10 rounded-2xl bg-white/5 hover:bg-white/10 transition-colors">
                <div className="flex items-center gap-3 mb-6">
                  {i === 0 && <Globe className="w-5 h-5 text-green-400" />}
                  {i === 1 && <ShieldCheck className="w-5 h-5 text-blue-400" />}
                  {i === 2 && <Lock className="w-5 h-5 text-purple-400" />}
                  <h3 className="font-bold tracking-widest text-sm text-gray-300 break-words max-w-[80%]">{tier.title}</h3>
                </div>
                <ul className="space-y-4">
                  {tier.items.map((item, j) => (
                    <li key={j} className="flex items-center gap-3 text-sm text-gray-400">
                      <span className="w-1.5 h-1.5 bg-white/20 rounded-full" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 border-t border-white/10 bg-black/40">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-2">
            <Logo className="w-8 h-8" />
            <span className="font-heading font-bold tracking-widest text-sm">AERO</span>
          </div>
          
          <div className="flex flex-col items-center md:items-end gap-2 text-xs font-mono text-gray-500">
            <p>{t.footer.tagline}</p>
            <p className="text-gray-400">{t.footer.submission}</p>
            <p>© 2024 AERO SYSTEMS ONLINE</p>
          </div>
        </div>
      </footer>

      {/* Chat Bot */}
      <AIChat 
         lang={lang} 
         isOpen={isChatOpen} 
         setIsOpen={setIsChatOpen}
         personality={personality}
         setPersonality={setPersonality}
      />

      {/* Modal for Artist/Source Details */}
      <AnimatePresence>
        {selectedSource && (
          <MotionDiv 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xl"
            onClick={() => setSelectedSource(null)}
          >
            <MotionDiv 
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="bg-[#0f172a] border border-white/10 rounded-2xl max-w-2xl w-full overflow-hidden shadow-2xl"
              onClick={(e: React.MouseEvent<HTMLDivElement>) => e.stopPropagation()}
            >
              {/* Only show image if one exists */}
              {selectedSource.image && (
                <div className="h-64 overflow-hidden relative">
                   <img src={selectedSource.image} alt={selectedSource.name[lang]} className="w-full h-full object-cover" />
                   <div className="absolute inset-0 bg-gradient-to-t from-[#0f172a] to-transparent" />
                </div>
              )}
              
              <div className="p-8">
                <div className="flex justify-between items-start mb-6">
                  <div>
                    <h2 className="text-3xl font-heading font-bold mb-2">{selectedSource.name[lang]}</h2>
                    <span className="text-xs font-mono px-2 py-1 border border-sky-500/30 text-sky-400 rounded">
                      {selectedSource.genre[lang]}
                    </span>
                  </div>
                  <button onClick={() => setSelectedSource(null)} className="p-2 hover:bg-white/10 rounded-full">
                    <X className="w-6 h-6" />
                  </button>
                </div>
                
                <p className="text-gray-300 leading-relaxed mb-8">
                  {selectedSource.description[lang]}
                </p>

                {selectedSource.link && (
                  <a 
                    href={selectedSource.link} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-2 w-full py-4 bg-white text-black font-bold uppercase tracking-widest hover:bg-sky-400 transition-colors"
                  >
                    {t.modal.launch} <Play className="w-4 h-4 fill-current" />
                  </a>
                )}
              </div>
            </MotionDiv>
          </MotionDiv>
        )}
      </AnimatePresence>
    </div>
  );
}