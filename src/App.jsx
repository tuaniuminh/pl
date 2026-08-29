import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import Timer from './components/Timer';
import PlanGenerator from './components/PlanGenerator';
import History from './components/History';
import Settings from './components/Settings';
import { getSettings, saveSettings, getActivePlan, saveActivePlan } from './services/storageService';
import { 
  Timer as TimerIcon, 
  Sparkles, 
  History as HistoryIcon, 
  Settings as SettingsIcon 
} from 'lucide-react';

function App() {
  const [activeTab, setActiveTab] = useState('timer'); // 'timer', 'ai_coach', 'history', 'settings'
  const [settings, setSettingsState] = useState(getSettings());
  const [currentPlan, setCurrentPlan] = useState(getActivePlan());

  // Áp dụng Dark Mode chuẩn cho Tailwind CSS
  useEffect(() => {
    const root = document.documentElement;
    if (settings.theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }, [settings.theme]);

  const handleUpdateSettings = (newSettings) => {
    setSettingsState(newSettings);
    saveSettings(newSettings);
  };

  const handleToggleTheme = () => {
    const newTheme = settings.theme === 'dark' ? 'light' : 'dark';
    handleUpdateSettings({ ...settings, theme: newTheme });
  };

  const handleToggleVoice = () => {
    handleUpdateSettings({ ...settings, voiceEnabled: !settings.voiceEnabled });
  };

  const handleSelectPlan = (newPlan) => {
    setCurrentPlan(newPlan);
    saveActivePlan(newPlan);
    setActiveTab('timer'); // Chuyển thẳng sang Tab Timer để bắt đầu tập
  };

  return (
    <div className="h-screen w-screen flex flex-col bg-slate-100 dark:bg-oled text-slate-900 dark:text-white overflow-hidden font-sans transition-colors duration-300">
      {/* 1. Header Cố Định Ở Trên Cùng Có Safe Area Cho iPhone */}
      <Header 
        settings={settings}
        onToggleTheme={handleToggleTheme}
        onToggleVoice={handleToggleVoice}
        activePlan={currentPlan}
      />

      {/* 2. Phần Thân Scroll Được Chứa 4 Tab Tính Năng */}
      <main className="flex-1 overflow-y-auto overflow-x-hidden relative">
        {activeTab === 'timer' && (
          <Timer 
            plan={currentPlan} 
            onOpenAIPlan={() => setActiveTab('ai_coach')}
          />
        )}

        {activeTab === 'ai_coach' && (
          <PlanGenerator 
            apiKey={settings.apiKey}
            onSelectPlan={handleSelectPlan}
            onOpenSettings={() => setActiveTab('settings')}
          />
        )}

        {activeTab === 'history' && (
          <History 
            onStartWorkout={() => setActiveTab('timer')}
          />
        )}

        {activeTab === 'settings' && (
          <Settings 
            settings={settings}
            onUpdateSettings={handleUpdateSettings}
            onNavigateToAI={() => setActiveTab('ai_coach')}
          />
        )}
      </main>

      {/* 3. Bottom Navigation Bar Đỉnh Cao Với Safe Area Cho Home Bar iPhone */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-oled/95 backdrop-blur-2xl border-t border-slate-200 dark:border-white/5 safe-bottom-padding px-6 pt-2 transition-colors duration-300">
        <div className="flex items-center justify-around max-w-md mx-auto">
          {/* Tab 1: Timer */}
          <button
            onClick={() => setActiveTab('timer')}
            className={`flex flex-col items-center justify-center py-1 px-3 rounded-2xl transition-all duration-300 relative ${
              activeTab === 'timer'
                ? 'text-emerald-600 dark:text-neon scale-105 font-extrabold'
                : 'text-slate-400 dark:text-gray-500 hover:text-slate-600 dark:hover:text-gray-300'
            }`}
          >
            <div className="relative">
              <TimerIcon size={24} />
              {activeTab === 'timer' && (
                <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 bg-emerald-500 dark:bg-neon rounded-full shadow-sm dark:shadow-neon" />
              )}
            </div>
            <span className="text-[10px] tracking-tight mt-1">Đồng Hồ</span>
          </button>

          {/* Tab 2: AI Coach */}
          <button
            onClick={() => setActiveTab('ai_coach')}
            className={`flex flex-col items-center justify-center py-1 px-3 rounded-2xl transition-all duration-300 relative ${
              activeTab === 'ai_coach'
                ? 'text-cyan-600 dark:text-cyan-neon scale-105 font-extrabold'
                : 'text-slate-400 dark:text-gray-500 hover:text-slate-600 dark:hover:text-gray-300'
            }`}
          >
            <div className="relative">
              <Sparkles size={24} />
              {activeTab === 'ai_coach' && (
                <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 bg-cyan-500 dark:bg-cyan-neon rounded-full shadow-sm dark:shadow-cyan-glow" />
              )}
            </div>
            <span className="text-[10px] tracking-tight mt-1">AI Coach</span>
          </button>

          {/* Tab 3: History */}
          <button
            onClick={() => setActiveTab('history')}
            className={`flex flex-col items-center justify-center py-1 px-3 rounded-2xl transition-all duration-300 relative ${
              activeTab === 'history'
                ? 'text-amber-500 dark:text-amber-400 scale-105 font-extrabold'
                : 'text-slate-400 dark:text-gray-500 hover:text-slate-600 dark:hover:text-gray-300'
            }`}
          >
            <div className="relative">
              <HistoryIcon size={24} />
              {activeTab === 'history' && (
                <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 bg-amber-500 dark:bg-amber-400 rounded-full shadow-sm dark:shadow-amber-glow" />
              )}
            </div>
            <span className="text-[10px] tracking-tight mt-1">Lịch Sử</span>
          </button>

          {/* Tab 4: Settings */}
          <button
            onClick={() => setActiveTab('settings')}
            className={`flex flex-col items-center justify-center py-1 px-3 rounded-2xl transition-all duration-300 relative ${
              activeTab === 'settings'
                ? 'text-slate-900 dark:text-white scale-105 font-extrabold'
                : 'text-slate-400 dark:text-gray-500 hover:text-slate-600 dark:hover:text-gray-300'
            }`}
          >
            <div className="relative">
              <SettingsIcon size={24} />
              {activeTab === 'settings' && (
                <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 bg-slate-900 dark:bg-white rounded-full" />
              )}
            </div>
            <span className="text-[10px] tracking-tight mt-1">Cài Đặt</span>
          </button>
        </div>
      </nav>
    </div>
  );
}

export default App;