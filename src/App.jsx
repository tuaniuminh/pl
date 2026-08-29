import React, { useState, useEffect } from 'react';
import Timer from './components/Timer';
import { getSettings, saveSettings, exportCSV } from './services/storageService';
import { Settings as SettingsIcon, History as HistoryIcon, Home } from 'lucide-react';
import packageJson from '../package.json';

function App() {
  const [activeTab, setActiveTab] = useState('timer');
  const [settings, setSettingsState] = useState(getSettings());
  const [currentPlan, setCurrentPlan] = useState(null);

  useEffect(() => {
    if (settings.theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [settings.theme]);

  const updateSettings = (newSettings) => {
    setSettingsState(newSettings);
    saveSettings(newSettings);
  };

  return (
    <div className="min-h-screen flex flex-col font-sans">
      <div className="w-full text-center py-2 text-xs text-gray-500 bg-gray-100 dark:bg-gray-900 absolute top-0 z-10">
        Plank AI - v{packageJson.version}
      </div>
      <div className="flex-1 overflow-y-auto pb-20 pt-10">
        {activeTab === 'timer' && <Timer plan={currentPlan} />}
        {activeTab === 'settings' && (
          <div className="p-6">
            <h2 className="text-2xl font-bold mb-6">Cài đặt</h2>
            <div className="mb-4">
              <label className="block mb-2 text-sm text-gray-400">Google Gemini API Key</label>
              <input 
                type="password"
                value={settings.apiKey}
                onChange={e => updateSettings({...settings, apiKey: e.target.value})}
                className="w-full bg-gray-900 border border-gray-700 rounded-xl p-4 text-white focus:outline-none focus:border-neon"
                placeholder="Nhập API Key..."
              />
            </div>
            <div className="flex items-center justify-between mt-8">
              <span>Dark Mode (OLED)</span>
              <button 
                onClick={() => updateSettings({...settings, theme: settings.theme === 'dark' ? 'light' : 'dark'})}
                className={`w-14 h-8 rounded-full p-1 transition-colors ${settings.theme === 'dark' ? 'bg-neon' : 'bg-gray-400'}`}
              >
                <div className={`bg-white w-6 h-6 rounded-full shadow-md transform transition-transform ${settings.theme === 'dark' ? 'translate-x-6' : ''}`} />
              </button>
            </div>
          </div>
        )}
        {activeTab === 'history' && (
          <div className="p-6 flex flex-col items-center">
            <h2 className="text-2xl font-bold mb-6">Lịch sử tập</h2>
            <button 
              onClick={exportCSV}
              className="bg-gray-800 text-white w-full py-4 rounded-xl font-bold active:scale-95 transition-transform"
            >
              Xuất dữ liệu (.CSV)
            </button>
          </div>
        )}
      </div>

      <div className="fixed bottom-0 w-full bg-white dark:bg-oled border-t border-gray-200 dark:border-gray-900 px-6 py-4 flex justify-between pb-8">
        <button onClick={() => setActiveTab('timer')} className={`p-2 ${activeTab === 'timer' ? 'text-neon' : 'text-gray-500'}`}>
          <Home size={28} />
        </button>
        <button onClick={() => setActiveTab('history')} className={`p-2 ${activeTab === 'history' ? 'text-neon' : 'text-gray-500'}`}>
          <HistoryIcon size={28} />
        </button>
        <button onClick={() => setActiveTab('settings')} className={`p-2 ${activeTab === 'settings' ? 'text-neon' : 'text-gray-500'}`}>
          <SettingsIcon size={28} />
        </button>
      </div>
    </div>
  );
}

export default App;