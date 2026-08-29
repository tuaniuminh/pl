import React from 'react';
import { Sparkles, Moon, Sun, Volume2, VolumeX, Flame } from 'lucide-react';
import packageJson from '../../package.json';

const Header = ({ settings, onToggleTheme, onToggleVoice, activePlan }) => {
  const isDark = settings.theme === 'dark';

  return (
    <header className="w-full safe-top-padding px-5 pb-3 pt-2 bg-oled/90 dark:bg-oled/95 light:bg-white/95 backdrop-blur-xl border-b border-white/5 dark:border-white/5 light:border-slate-200 z-30 transition-all">
      <div className="flex items-center justify-between">
        {/* Logo & Title */}
        <div className="flex items-center space-x-2.5">
          <div className="w-9 h-9 rounded-2xl bg-gradient-to-tr from-neon to-cyan-neon p-0.5 shadow-neon">
            <div className="w-full h-full bg-oled rounded-[14px] flex items-center justify-center">
              <Flame className="w-5 h-5 text-neon animate-pulse" />
            </div>
          </div>
          <div>
            <div className="flex items-center space-x-1.5">
              <h1 className="font-extrabold text-lg tracking-tight bg-gradient-to-r from-white via-gray-200 to-gray-400 dark:from-white dark:to-gray-300 light:from-slate-900 light:to-slate-700 bg-clip-text text-transparent">
                PLANK AI
              </h1>
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-neon/10 text-neon border border-neon/20 shadow-sm">
                v{packageJson.version}
              </span>
            </div>
            <div className="flex items-center space-x-1.5 text-[11px] text-gray-400">
              <span className="w-1.5 h-1.5 rounded-full bg-neon animate-ping" />
              <span>{activePlan ? `Giáo án: ${activePlan.planName?.slice(0, 18)}...` : 'Gemini AI Coach Active'}</span>
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
                ? 'bg-neon/10 border-neon/30 text-neon shadow-sm' 
                : 'bg-white/5 dark:bg-white/5 light:bg-slate-100 border-white/10 dark:border-white/10 light:border-slate-200 text-gray-400'
            }`}
            title={settings.voiceEnabled ? "Tắt giọng nói" : "Bật giọng nói"}
          >
            {settings.voiceEnabled ? <Volume2 size={16} /> : <VolumeX size={16} />}
          </button>

          {/* Quick Theme Toggle */}
          <button
            onClick={onToggleTheme}
            className="w-9 h-9 rounded-xl flex items-center justify-center bg-white/5 dark:bg-white/5 light:bg-slate-100 border border-white/10 dark:border-white/10 light:border-slate-200 text-gray-300 dark:text-gray-300 light:text-slate-700 transition-all active:scale-95"
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
