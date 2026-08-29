import React from 'react';
import { Moon, Sun, Volume2, VolumeX, Flame } from 'lucide-react';
import packageJson from '../../package.json';

const Header = ({ settings, onToggleTheme, onToggleVoice, activePlan }) => {
  const isDark = settings.theme === 'dark';

  return (
    <header className="w-full safe-top-padding px-5 pb-3 pt-2 bg-white/95 dark:bg-oled/95 backdrop-blur-xl border-b border-slate-200 dark:border-white/5 z-30 transition-colors duration-300">
      <div className="flex items-center justify-between">
        {/* Logo & Title */}
        <div className="flex items-center space-x-2.5">
          <div className="w-9 h-9 rounded-2xl bg-gradient-to-tr from-emerald-500 via-neon to-cyan-500 p-0.5 shadow-sm dark:shadow-neon">
            <div className="w-full h-full bg-white dark:bg-oled rounded-[14px] flex items-center justify-center">
              <Flame className="w-5 h-5 text-emerald-600 dark:text-neon animate-pulse" />
            </div>
          </div>
          <div>
            <div className="flex items-center space-x-1.5">
              <h1 className="font-extrabold text-lg tracking-tight bg-gradient-to-r from-slate-900 to-slate-700 dark:from-white dark:to-gray-300 bg-clip-text text-transparent">
                PLANK AI
              </h1>
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-emerald-100 text-emerald-700 dark:bg-neon/10 dark:text-neon border border-emerald-300/40 dark:border-neon/20 shadow-sm">
                v{packageJson.version}
              </span>
            </div>
            <div className="flex items-center space-x-1.5 text-[11px] text-slate-500 dark:text-gray-400">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 dark:bg-neon animate-ping" />
              <span>{activePlan ? `Giáo án: ${activePlan.planName?.slice(0, 18)}...` : 'Gemini 3.7 Flash Active'}</span>
            </div>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center space-x-2">
          {/* Quick Voice Toggle */}
          <button
            onClick={onToggleVoice}
            className={`w-9 h-9 rounded-xl flex items-center justify-center border transition-all ${
              settings.voiceEnabled 
                ? 'bg-emerald-50 border-emerald-300 text-emerald-600 dark:bg-neon/10 dark:border-neon/30 dark:text-neon shadow-sm' 
                : 'bg-slate-100 border-slate-200 text-slate-400 dark:bg-white/5 dark:border-white/10 dark:text-gray-400'
            }`}
            title={settings.voiceEnabled ? "Tắt giọng nói" : "Bật giọng nói"}
          >
            {settings.voiceEnabled ? <Volume2 size={16} /> : <VolumeX size={16} />}
          </button>

          {/* Quick Theme Toggle */}
          <button
            onClick={onToggleTheme}
            className="w-9 h-9 rounded-xl flex items-center justify-center bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-slate-700 dark:text-gray-300 transition-all active:scale-95 hover:bg-slate-200 dark:hover:bg-white/10"
            title="Đổi giao diện Sáng / Tối OLED"
          >
            {isDark ? <Sun size={16} className="text-amber-400" /> : <Moon size={16} className="text-indigo-600" />}
          </button>
        </div>
      </div>
    </header>
  );
};

export default Header;
