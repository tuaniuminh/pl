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

  // Áp dụng Dark Mode OLED lên phần tử gốc <html>
  useEffect(() => {
    const root = document.documentElement;
    if (settings.theme === 'dark') {
      root.classList.add('dark');
      root.classList.remove('light');
    } else {
      root.classList.add('light');
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
    <div className="h-screen w-screen flex flex-col bg-oled dark:bg-oled light:bg-slate-100 text-white dark:text-white light:text-slate-900 overflow-hidden font-sans transition-colors">
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
      <nav className="fixed bottom-0 left-0 right-0 z-40 bg-oled/90 dark:bg-oled/95 light:bg-white/95 backdrop-blur-2xl border-t border-white/5 dark:border-white/5 light:border-slate-200 safe-bottom-padding px-6 pt-2">
        <div className="flex items-center justify-around max-w-md mx-auto">
          {/* Tab 1: Timer */}
          <button
            onClick={() => setActiveTab('timer')}
            className={`flex flex-col items-center justify-center py-1 px-3 rounded-2xl transition-all duration-300 relative ${
              activeTab === 'timer'
                ? 'text-neon scale-105'
                : 'text-gray-500 hover:text-gray-300'
            }`}
          >
            <div className="relative">
              <TimerIcon size={24} className={activeTab === 'timer' ? 'drop-shadow-neon' : ''} />
              {activeTab === 'timer' && (
                <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 bg-neon rounded-full shadow-neon" />
              )}
            </div>
            <span className="text-[10px] font-bold tracking-tight mt-1">Đồng Hồ</span>
          </button>

          {/* Tab 2: AI Coach */}
          <button
            onClick={() => setActiveTab('ai_coach')}
            className={`flex flex-col items-center justify-center py-1 px-3 rounded-2xl transition-all duration-300 relative ${
              activeTab === 'ai_coach'
                ? 'text-cyan-neon scale-105'
                : 'text-gray-500 hover:text-gray-300'
            }`}
          >
            <div className="relative">
              <Sparkles size={24} className={activeTab === 'ai_coach' ? 'drop-shadow-cyan-glow' : ''} />
              {activeTab === 'ai_coach' && (
                <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 bg-cyan-neon rounded-full shadow-cyan-glow" />
              )}
            </div>
            <span className="text-[10px] font-bold tracking-tight mt-1">AI Coach</span>
          </button>

          {/* Tab 3: History */}
          <button
            onClick={() => setActiveTab('history')}
            className={`flex flex-col items-center justify-center py-1 px-3 rounded-2xl transition-all duration-300 relative ${
              activeTab === 'history'
                ? 'text-amber-400 scale-105'
                : 'text-gray-500 hover:text-gray-300'
            }`}
          >
            <div className="relative">
              <HistoryIcon size={24} className={activeTab === 'history' ? 'drop-shadow-amber-glow' : ''} />
              {activeTab === 'history' && (
                <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 bg-amber-400 rounded-full shadow-amber-glow" />
              )}
            </div>
            <span className="text-[10px] font-bold tracking-tight mt-1">Lịch Sử</span>
          </button>

          {/* Tab 4: Settings */}
          <button
            onClick={() => setActiveTab('settings')}
            className={`flex flex-col items-center justify-center py-1 px-3 rounded-2xl transition-all duration-300 relative ${
              activeTab === 'settings'
                ? 'text-white scale-105'
                : 'text-gray-500 hover:text-gray-300'
            }`}
          >
            <div className="relative">
              <SettingsIcon size={24} />
              {activeTab === 'settings' && (
                <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 bg-white rounded-full" />
              )}
            </div>
            <span className="text-[10px] font-bold tracking-tight mt-1">Cài Đặt</span>
          </button>
        </div>
      </nav>
    </div>
  );
}

export default App;