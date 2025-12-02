import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MapPin, List, AlertTriangle, ShieldCheck, X, Sparkles, Droplets, Thermometer } from 'lucide-react';
import CitySearchModal from './CitySearchModal';

interface CityData {
    name: string;
    temp: string;
    text: string;
    wind: string;
    alert: string | null;
    // 🔥 新增：后端新给的数据字段
    feelsLike?: string; 
    humidity?: string;
}

interface BriefingData {
    ai_briefing?: string;
    ai_briefing_zh?: string;
    ai_briefing_en?: string;
    humidity?: string;
    pressure?: string;
    updateTime?: string;
}

interface WeatherBoardProps {
    // 允许 lang 属性传入，或者默认处理
    lang?: 'en' | 'zh'; 
}

//const QWEATHER_KEY = import.meta.env.VITE_QWEATHER_KEY || "";

const WeatherBoard: React.FC<WeatherBoardProps> = ({ lang = 'zh' }) => {
    const isEn = lang === 'en';

    // 1. 翻译逻辑 (保持不变)
    const translateCondition = (text: string) => {
        if (!isEn) return text;
        const map: Record<string, string> = {
            '晴': 'Sunny', '多云': 'Cloudy', '少云': 'Partly Cloudy', '晴间多云': 'Partly Sunny',
            '阴': 'Overcast', '阵雨': 'Showers', '雷阵雨': 'Thunderstorm', '小雨': 'Light Rain',
            '中雨': 'Moderate Rain', '大雨': 'Heavy Rain', '暴雨': 'Storm', '雨夹雪': 'Sleet',
            '小雪': 'Light Snow', '中雪': 'Moderate Snow', '大雪': 'Heavy Snow', '暴雪': 'Blizzard',
            '雾': 'Fog', '霾': 'Haze', '沙尘暴': 'Sandstorm', '浮尘': 'Dust', '扬沙': 'Blowing Sand',
        };
        return map[text] || text;
    };

    const translateWind = (wind: string) => {
        if (!isEn) return wind;
        if (!wind) return wind;
        const dirMap: Record<string, string> = {
            '北风': 'N', '东北风': 'NE', '东风': 'E', '东南风': 'SE',
            '南风': 'S', '西南风': 'SW', '西风': 'W', '西北风': 'NW',
        };
        const m = wind.match(/^(.+?)(\d+)级$/);
        if (!m) return wind;
        return `${dirMap[m[1]] || m[1]} ${m[2]}`;
    };

    // 2. 🔥 升级报警判断逻辑：适配“体感”、“极寒”等新词
    const getAlertLevel = (alert: string | null | undefined): 'red' | 'orange' | 'none' => {
        if (!alert) return 'none';
        // 只要包含“红色”或“极寒”，就是红
        if (alert.includes('红色') || alert.includes('Red') || alert.includes('极寒')) return 'red';
        // 只要包含“橙色”或“北风”，就是橙 (根据你的脚本，北风目前算作橙色等级关注)
        if (alert.includes('橙色') || alert.includes('Orange') || alert.includes('北风')) return 'orange';
        return 'red'; // 默认 fallback
    };

    const [userLocation, setUserLocation] = useState(isEn ? "LOCATING..." : "定位中...");
    // 本地数据也加个体感
    const [localWeather, setLocalWeather] = useState({ temp: "--", text: "--", wind: "--", feelsLike: "--" });

    const [monitorData, setMonitorData] = useState<CityData[]>([]);
    const [allCities, setAllCities] = useState<CityData[]>([]); 

    const [currentIndex, setCurrentIndex] = useState(0);
    const [isBoardOpen, setIsBoardOpen] = useState(false);
    const [lastUpdate, setLastUpdate] = useState(isEn ? "SYNCING..." : "同步中...");

    const [aiBulletin, setAiBulletin] = useState(isEn ? "INITIALIZING INTEL..." : "正在加载...");
    const [briefingDict, setBriefingDict] = useState<Record<string, BriefingData>>({});

    // 3. 获取监控数据
    const fetchMonitorData = async () => {
        try {
            const res = await fetch(`./weather-status.json?t=${Date.now()}`);
            if (!res.ok) return;
            const data = await res.json();
            setLastUpdate(new Date(data.updateTime).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' }));
            setAllCities(data.cities);

            const important = data.cities.filter((c: CityData) =>
                ['北京', '慈溪'].includes(c.name) || c.alert
            );
            setMonitorData(important.length > 0 ? important : data.cities.slice(0, 5));
        } catch (e) { }
    };

    // 4. 获取本地数据
    {/*const fetchLocalData = async (cityInput: string = '北京') => {
        try {
            if (!QWEATHER_KEY) return;
            const geoRes = await fetch(`https://geoapi.qweather.com/v2/city/lookup?location=${cityInput}&key=${QWEATHER_KEY}`);
            const geoData = await geoRes.json();
            if (geoData.code !== '200') return;

            const cityId = geoData.location[0].id;
            const cityName = geoData.location[0].name;
            setUserLocation(cityName);

            const nowRes = await fetch(`https://devapi.qweather.com/v7/weather/now?location=${cityId}&key=${QWEATHER_KEY}`);
            const nowData = await nowRes.json();

            if (nowData.code === '200') {
                setLocalWeather({
                    temp: nowData.now.temp,
                    text: nowData.now.text,
                    wind: `${nowData.now.windDir}${nowData.now.windScale}级`,
                    feelsLike: nowData.now.feelsLike // 🔥 获取本地体感
                });
            }
        } catch (e) { }
    };
    */}

    // 5. 获取简报字典
    const fetchBriefings = async () => {
        try {
            const res = await fetch(`./latest-briefings.json?t=${Date.now()}`);
            if (res.ok) {
                const data = await res.json();
                setBriefingDict(data);
            }
        } catch (e) { }
    };

    const [isSearchOpen, setIsSearchOpen] = useState(false);

    useEffect(() => {
        fetchMonitorData();
        fetchBriefings();
        //fetchLocalData(); // 默认 Auto IP
    }, []);

    useEffect(() => {
        if (monitorData.length > 0 && (userLocation === "LOCATING..." || userLocation === "定位中...")) {
            const first = monitorData[0]; // 默认取第一个 (通常是北京)
            setUserLocation(first.name);
            setLocalWeather({
                temp: first.temp,
                text: first.text,
                wind: first.wind,
                feelsLike: first.feelsLike || "--"
            });
        }
    }, [monitorData, userLocation]);

    // 轮播
    useEffect(() => {
        if (monitorData.length <= 1) return;
        const timer = setInterval(() => {
            setCurrentIndex((prev) => (prev + 1) % monitorData.length);
        }, 5000);
        return () => clearInterval(timer);
    }, [monitorData]);

    // 简报联动
    useEffect(() => {
        const info = briefingDict[userLocation];
        if (info) {
            const zh = info.ai_briefing_zh || info.ai_briefing || "";
            const en = info.ai_briefing_en || info.ai_briefing || zh;
            const brief = isEn ? (en || zh) : (zh || en);
            if (brief) {
                setAiBulletin(brief);
                return;
            }
        } else {
            setAiBulletin(
                isEn
                    ? `NO TACTICAL DATA FOR SECTOR: ${userLocation}`
                    : `当前地区暂无天气数据：${userLocation}`
            );
        }
    }, [userLocation, briefingDict, isEn]);

    const handleSwitchCity = () => {
        setIsSearchOpen(true);
    };
    const handleSearchConfirm = (input: string) => {    
        // 尝试在监控列表里找，找不到就去查 API
        const exist = allCities.find(c => c.name.includes(input));
        if (exist) {
            setUserLocation(exist.name);
            setLocalWeather({
                temp: exist.temp,
                text: exist.text,
                wind: exist.wind,
                feelsLike: exist.feelsLike || "--"
            });
        } else {
            console.log("City not in monitor list");
        }
    };

    const currentCity = monitorData[currentIndex] || { name: "NO DATA", temp: "-", text: "-", wind: "-", alert: null };
    const currentAlertLevel = getAlertLevel(currentCity.alert);

    return (
        <>
            {/* 🟢 顶部 HUD 条 (样式已修复为半透明) */}
            <div className="fixed top-20 left-0 right-0 bg-[#0f172a]/80 backdrop-blur-md border-b border-slate-800 h-10 flex items-stretch z-30 font-mono text-xs select-none shadow-md">

                {/* 左侧：本地实况 */}
                <div
                    onClick={handleSwitchCity}
                    className="flex items-center gap-3 px-3 sm:px-4 bg-transparent hover:bg-slate-900/50 text-sky-400 cursor-pointer transition-colors border-r border-slate-800 sm:min-w-[180px]"
                >
                    <div className="flex flex-col leading-none">
                        <span className="text-[8px] text-slate-500 font-bold tracking-widest uppercase">
                            {isEn ? "Local" : "本地"}
                        </span>
                        <span className="text-xs sm:text-sm font-bold flex items-center gap-1"><MapPin className="w-3 h-3" /> {userLocation}</span>
                    </div>

                    <div className="h-6 w-[1px] bg-slate-700 mx-1 block"></div>

                    <div className="flex items-center gap-1 sm:gap-3 ml-2 sm:ml-0">
                        <span className="text-sm sm:text-lg font-bold text-white">{localWeather.temp}°</span>
                        <div className="flex flex-col leading-tight text-[10px] text-slate-400">
                            <span className="truncate max-w-[40px] sm:max-w-none">
                                {translateCondition(localWeather.text)}</span>
                            {/* 🔥 新增：显示体感温度 */}
                            <span className="flex items-center gap-1 text-[8px] sm:text-[9px] text-slate-500">
                                FL: {localWeather.feelsLike}°
                            </span>
                        </div>
                    </div>
                </div>

                {/* 中间：监控翻页 */}
                <div className="flex-1 flex items-center justify-end px-2 sm:px-4 bg-transparent relative overflow-hidden">
                    <div className="flex items-center gap-2 w-full justify-end">
                        <span className="text-[8px] text-slate-600 font-bold tracking-widest hidden md:block">
                            {isEn ? "UPDATED //" : "更新时间 //"} {lastUpdate}
                        </span>

                        <div className="relative h-8 w-full max-w-lg flex items-center justify-end">
                            <AnimatePresence mode='wait'>
                                <motion.div
                                    key={currentIndex}
                                    initial={{ y: -15, opacity: 0 }}
                                    animate={{ y: 0, opacity: 1 }}
                                    exit={{ y: 15, opacity: 0 }}
                                    transition={{ duration: 0.3, ease: "circOut" }}
                                    className="absolute right-0 flex items-center gap-3 w-full justify-end"
                                >
                                    {/* 状态徽章 */}
                                    {currentAlertLevel === 'none' ? (
                                        <div className="shrink-0 flex items-center gap-1.5 px-2 py-0.5 rounded-sm border bg-emerald-950/30 border-emerald-900/50 text-emerald-400">
                                            <ShieldCheck className="w-3 h-3" />
                                            <span className="font-bold text-[10px] sm:text-xs whitespace-nowrap">
                                                {isEn ? "OK" : "正常"}
                                            </span>
                                        </div>
                                    ) : (
                                        <div className={`shrink-0 flex items-center gap-1.5 px-2 py-0.5 rounded-sm border ${
                                            currentAlertLevel === 'red' ? 'bg-red-950/50 border-red-900 text-red-400' : 'bg-orange-950/40 border-orange-900 text-orange-300'
                                        }`}>
                                            <AlertTriangle className="w-3 h-3 animate-pulse" />
                                            <span className="font-bold text-[10px] sm:text-xs whitespace-nowrap">
                                                {/* 手机端 */}
                                                <span className="sm:hidden">
                                                    {currentAlertLevel ==='red'
                                                        ?(isEn ? "ALERT" : "预警")
                                                        :(isEn ? "NOTE" : "提示")}
                                                </span>
                                                <span className="hidden sm:inline">
                                                    {currentAlertLevel ==='red'
                                                    ?(isEn ? "RED ALERT" : "红色预警")
                                                    :(isEn ? "WARNING" : "异常提示")}
                                                </span>
                                                
                                            </span>
                                        </div>
                                    )}

                                    <span className="text-sky-300 font-bold text-sm min-w-[50px] text-right truncate">
                                        {currentCity.name}
                                    </span>

                                    <div className="flex items-center justify-end gap-1.5 text-slate-300 text-xs">
                                        <span className="text-right text-[10px] sm:text-xs whitespace-nowrap">
                                            {translateCondition(currentCity.text)}
                                        </span>
                           {/* 温度保持加粗，也不要限制宽度 */}
                                        <span className="text-right text-white font-bold text-sm">
                                            {currentCity.temp}°
                                        </span>
                                    </div>

                                    {currentCity.alert && (
                                        <span className="hidden lg:block text-red-400 text-[10px] border-l border-slate-700 pl-3 max-w-[150px] truncate animate-pulse">
                                            {currentCity.alert}
                                        </span>
                                    )}
                                </motion.div>
                            </AnimatePresence>
                        </div>
                    </div>
                </div>

                {/* 右侧：展开按钮 */}
                <button
                    onClick={() => setIsBoardOpen(true)}
                    className="bg-slate-800/80 hover:bg-sky-600/90 hover:text-white text-slate-400 px-4 flex items-center justify-center border-l border-slate-600 transition-all duration-300"
                >
                    <List className="w-4 h-4" />
                </button>
            </div>

            {/* 🔴 完整列表 Modal */}
            <AnimatePresence>
                {isBoardOpen && (
                    <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setIsBoardOpen(false)}>
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0, y: 10 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.95, opacity: 0, y: 10 }}
                            className="w-full max-w-md bg-[#1e293b] border border-slate-600 rounded-lg shadow-2xl overflow-hidden flex flex-col max-h-[80vh]"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div className="bg-slate-800 p-3 border-b border-slate-600 flex justify-between items-center">
                                <div className="flex items-center gap-2">
                                    <ShieldCheck className="w-4 h-4 text-sky-400" />
                                    <span className="text-sm font-mono font-bold text-white tracking-widest">
                                        {isEn ? "GLOBAL STATUS" : "全局状态"}
                                    </span>
                                </div>
                                <button onClick={() => setIsBoardOpen(false)}><X className="w-5 h-5 text-slate-400 hover:text-white transition-colors" /></button>
                            </div>

                            <div className="flex-1 overflow-y-auto bg-[#0f172a] p-2 space-y-2">
                                {/* AI 战术简报 */}
                                <div className="mb-2 bg-yellow-500/10 border border-yellow-500/30 rounded p-3">
                                    <div className="flex items-center gap-2 text-yellow-500 mb-2 border-b border-yellow-500/20 pb-1">
                                        <Sparkles className="w-3 h-3" />
                                        <span className="text-[10px] font-bold tracking-widest">
                                            {isEn ? "AI BRIEFING" : "AI 实况简报"}: {userLocation.toUpperCase()}
                                        </span>
                                    </div>
                                    <p className="text-xs text-yellow-100/80 font-mono leading-relaxed animate-pulse">
                                        {aiBulletin}
                                    </p>
                                </div>

                                {monitorData.map(city => {
                                    const level = getAlertLevel(city.alert);
                                    const isAlert = level !== 'none';
                                    const rowClass = isAlert
                                        ? level === 'red'
                                            ? 'border-red-500 bg-red-900/10'
                                            : 'border-orange-400 bg-orange-900/10'
                                        : 'border-emerald-500/50 bg-white/5 hover:bg-white/10';

                                    return (
                                        <div key={city.name} className={`flex flex-col p-2 rounded border-l-2 transition-colors ${rowClass}`}>
                                            <div className="flex justify-between items-center">
                                                <div className="flex items-center gap-2">
                                                    <span className={`font-bold ${isAlert ? (level === 'red' ? 'text-red-300' : 'text-orange-200') : 'text-sky-200'}`}>{city.name}</span>
                                                    {isAlert && <AlertTriangle className={`w-3 h-3 animate-pulse ${level === 'red' ? 'text-red-500' : 'text-orange-400'}`} />}
                                                </div>
                                                <div className="text-right flex items-center gap-3">
                                                    {/* 🔥 新增：在列表里显示体感和湿度 */}
                                                    <div className="flex flex-col items-end text-[9px] text-slate-500">
                                                        <span className="flex items-center gap-1"><Thermometer className="w-2 h-2"/> FL: {city.feelsLike || "-"}°</span>
                                                        <span className="flex items-center gap-1"><Droplets className="w-2 h-2"/> {city.humidity || "-"}%</span>
                                                    </div>
                                                    <div className="text-right">
                                                        <span className="block text-white font-bold font-mono">{city.temp}°C</span>
                                                        <span className="text-[9px] text-slate-400">{translateWind(city.wind)}</span>
                                                    </div>
                                                </div>
                                            </div>
                                            {isAlert && (
                                                <div className={`mt-1 pt-1 border-t text-[10px] font-mono ${level === 'red' ? 'border-red-500/20 text-red-400' : 'border-orange-400/30 text-orange-300'}`}>
                                                    {city.alert}
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}

                                {monitorData.length === 0 && (
                                    <div className="text-center py-8 text-slate-500 text-xs font-mono">Waiting for data synchronization...</div>
                                )}
                            </div>

                            <div className="bg-slate-900 p-2 text-center text-[10px] text-slate-600 font-mono border-t border-slate-700">
                                {isEn ? "DATA SOURCE: GITHUB ACTIONS / QWEATHER" : "数据来源：GitHub Actions 自动监控 / 和风天气"}
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
            {/* 🔥 5. 插入搜索弹窗 (这里就是你要放的位置) */}
            <CitySearchModal 
                isOpen={isSearchOpen}
                onClose={() => setIsSearchOpen(false)}
                onSearch={handleSearchConfirm}
                lang={isEn ? 'en' : 'zh'}
                availableCities={allCities.map(c => c.name)}
            />
        </>
    );
};

export default WeatherBoard;