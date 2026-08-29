import os
import json

files = {
    "package.json": """{
  "name": "plank-ai",
  "private": true,
  "version": "1.0.1",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview",
    "generate-icons": "capacitor-assets generate --iconBackgroundColor '#000000' --iconBackgroundColorDark '#000000' --splashBackgroundColor '#000000' --splashBackgroundColorDark '#000000'"
  },
  "dependencies": {
    "@capacitor/core": "^6.0.0",
    "@capacitor/ios": "^6.0.0",
    "lucide-react": "^0.300.0",
    "react": "^18.2.0",
    "react-dom": "^18.2.0"
  },
  "devDependencies": {
    "@capacitor/assets": "^3.0.0",
    "@capacitor/cli": "^6.0.0",
    "@types/react": "^18.2.0",
    "@types/react-dom": "^18.2.0",
    "@vitejs/plugin-react": "^4.2.0",
    "autoprefixer": "^10.4.19",
    "postcss": "^8.4.38",
    "tailwindcss": "^3.4.3",
    "vite": "^5.2.0"
  }
}""",
    "vite.config.js": """import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
})""",
    "tailwind.config.js": """/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        oled: '#000000',
        neon: '#39ff14',
      }
    },
  },
  plugins: [],
}""",
    "postcss.config.js": """export default {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
}""",
    "index.html": """<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
    <title>Plank AI</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.jsx"></script>
  </body>
</html>""",
    "src/main.jsx": """import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)""",
    "src/index.css": """@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  body {
    @apply bg-white text-gray-900 transition-colors duration-300;
  }
  .dark body {
    @apply bg-oled text-white;
  }
}""",
    "src/utils/speechUtils.js": """let speechUnlocked = false;

export const unlockSpeechAPI = () => {
  if (!speechUnlocked && 'speechSynthesis' in window) {
    const utterance = new SpeechSynthesisUtterance('');
    utterance.volume = 0;
    window.speechSynthesis.speak(utterance);
    speechUnlocked = true;
  }
};

export const speakText = (text) => {
  if (!('speechSynthesis' in window)) return;
  window.speechSynthesis.cancel();
  
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = 'vi-VN';
  utterance.rate = 1.0;
  window.speechSynthesis.speak(utterance);
};""",
    "src/services/storageService.js": """export const saveSettings = (settings) => localStorage.setItem('plank_settings', JSON.stringify(settings));

export const getSettings = () => {
  const defaultSettings = { apiKey: '', theme: 'dark' };
  const saved = localStorage.getItem('plank_settings');
  return saved ? { ...defaultSettings, ...JSON.parse(saved) } : defaultSettings;
};

export const saveHistory = (session) => {
  const history = getHistory();
  history.push({ ...session, id: Date.now(), date: new Date().toISOString() });
  localStorage.setItem('plank_history', JSON.stringify(history));
};

export const getHistory = () => {
  const saved = localStorage.getItem('plank_history');
  return saved ? JSON.parse(saved) : [];
};

export const exportCSV = () => {
  const history = getHistory();
  if (history.length === 0) return alert("Không có dữ liệu để xuất.");

  const headers = ["ID", "Ngày", "Thời lượng (giây)", "Giáo án"];
  const rows = history.map(h => [
    h.id,
    new Date(h.date).toLocaleString('vi-VN'),
    h.duration,
    h.planName || "Tự do"
  ]);

  const csvContent = [headers.join(","), ...rows.map(e => e.join(","))].join("\\n");
  const blob = new Blob(["\\uFEFF" + csvContent], { type: 'text/csv;charset=utf-8;' });
  
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = `plank_history_${Date.now()}.csv`;
  link.click();
};""",
    "src/services/geminiService.js": """export const generatePlankPlan = async (apiKey, userProfile) => {
  if (!apiKey) {
    throw new Error("Vui lòng nhập Google Gemini API Key trong phần Cài đặt.");
  }

  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;

  const promptText = `Bạn là một huấn luyện viên Fitness chuyên nghiệp. 
Hãy tạo một giáo án tập Plank cá nhân hóa dựa trên thông tin sau:
- Kỷ lục giữ plank tối đa: ${userProfile.record} giây
- Tần suất tập mong muốn: ${userProfile.frequency}
- Mục tiêu chính: ${userProfile.goal}

YÊU CẦU QUAN TRỌNG: Đầu ra PHẢI tuân thủ cấu trúc JSON sau đây, KHÔNG chứa bất kỳ văn bản dư thừa nào:
{
  "planName": "Tên giáo án ngắn gọn",
  "days": [
    {
      "day": 1,
      "exercises": [
        {
          "name": "Plank cơ bản",
          "holdTime": 60, 
          "restTime": 30
        }
      ]
    }
  ]
}`;

  const requestBody = {
    contents: [{ parts: [{ text: promptText }] }],
    generationConfig: { responseMimeType: "application/json" }
  };

  try {
    const response = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error?.message || "Lỗi khi kết nối với Gemini API");
    }

    const data = await response.json();
    const resultText = data.candidates[0].content.parts[0].text;
    return JSON.parse(resultText);
  } catch (error) {
    console.error("Gemini API Error:", error);
    throw new Error(`Không thể tạo giáo án: ${error.message}`);
  }
};""",
    "src/components/UI/CircularProgress.jsx": """import React from 'react';

const CircularProgress = ({ progress, text, subtitle, colorClass = "text-neon" }) => {
  const radius = 120;
  const stroke = 12;
  const normalizedRadius = radius - stroke * 2;
  const circumference = normalizedRadius * 2 * Math.PI;
  const strokeDashoffset = circumference - (progress / 100) * circumference;

  return (
    <div className="relative flex items-center justify-center">
      <svg height={radius * 2} width={radius * 2} className="transform -rotate-90">
        <circle
          className="text-gray-200 dark:text-gray-900"
          strokeWidth={stroke} stroke="currentColor" fill="transparent"
          r={normalizedRadius} cx={radius} cy={radius}
        />
        <circle
          className={`transition-all duration-1000 ease-linear ${colorClass}`}
          strokeWidth={stroke} strokeDasharray={circumference + ' ' + circumference}
          style={{ strokeDashoffset }}
          strokeLinecap="round" stroke="currentColor" fill="transparent"
          r={normalizedRadius} cx={radius} cy={radius}
        />
      </svg>
      <div className="absolute flex flex-col items-center justify-center text-center">
        <span className="text-7xl font-bold tracking-tighter">{text}</span>
        {subtitle && <span className="text-lg text-gray-500 mt-2">{subtitle}</span>}
      </div>
    </div>
  );
};

export default CircularProgress;""",
    "src/components/Timer.jsx": """import React, { useState, useEffect } from 'react';
import CircularProgress from './UI/CircularProgress';
import { unlockSpeechAPI, speakText } from '../utils/speechUtils';
import { saveHistory } from '../services/storageService';
import { Play, Pause, Square } from 'lucide-react';

const Timer = ({ plan }) => {
  const [isActive, setIsActive] = useState(false);
  const [isResting, setIsResting] = useState(false);
  const [timeLeft, setTimeLeft] = useState(0);
  const [totalTime, setTotalTime] = useState(0);
  const [currentSetIndex, setCurrentSetIndex] = useState(0);
  
  const exercises = plan ? plan.days[0].exercises : [{ name: "Plank tự do", holdTime: 60, restTime: 0 }];
  const currentExercise = exercises[currentSetIndex];

  useEffect(() => {
    if (!isActive) {
      const time = isResting ? currentExercise.restTime : currentExercise.holdTime;
      setTotalTime(time);
      setTimeLeft(time);
    }
  }, [currentExercise, isResting, plan]);

  useEffect(() => {
    let interval = null;
    if (isActive && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft(time => {
          if (time === 6 && !isResting) speakText("Năm");
          if (time === 5 && !isResting) speakText("Bốn");
          if (time === 4 && !isResting) speakText("Ba");
          if (time === 3 && !isResting) speakText("Hai");
          if (time === 2 && !isResting) speakText("Một");
          return time - 1;
        });
      }, 1000);
    } else if (isActive && timeLeft === 0) {
      handleSetComplete();
    }
    return () => clearInterval(interval);
  }, [isActive, timeLeft]);

  const handleSetComplete = () => {
    if (!isResting && currentExercise.restTime > 0 && currentSetIndex < exercises.length - 1) {
      setIsResting(true);
      speakText("Nghỉ ngơi");
    } else if (currentSetIndex < exercises.length - 1) {
      setIsResting(false);
      setCurrentSetIndex(prev => prev + 1);
      speakText("Bắt đầu hiệp mới");
    } else {
      setIsActive(false);
      speakText("Tuyệt vời, bạn đã hoàn thành bài tập");
      saveHistory({
        planName: plan ? plan.planName : "Tập tự do",
        duration: exercises.reduce((acc, curr) => acc + curr.holdTime, 0)
      });
    }
  };

  const toggleTimer = () => {
    unlockSpeechAPI();
    if (!isActive) speakText(isResting ? "Tiếp tục nghỉ" : "Bắt đầu");
    setIsActive(!isActive);
  };

  const stopTimer = () => {
    setIsActive(false); setIsResting(false); setCurrentSetIndex(0);
    setTimeLeft(exercises[0].holdTime); setTotalTime(exercises[0].holdTime);
  };

  const progress = totalTime > 0 ? ((totalTime - timeLeft) / totalTime) * 100 : 0;

  return (
    <div className="flex flex-col items-center justify-center p-6 w-full h-full pt-16">
      <h2 className="text-2xl font-bold mb-10">{isResting ? "Nghỉ ngơi" : currentExercise.name}</h2>
      
      <CircularProgress 
        progress={progress} text={timeLeft} subtitle="GIÂY" 
        colorClass={isResting ? "text-blue-500" : "text-neon"}
      />
      
      <div className="mt-16 flex space-x-6 w-full max-w-xs">
        <button 
          onClick={toggleTimer}
          className="flex-1 bg-neon text-oled font-bold py-5 rounded-3xl flex justify-center items-center active:scale-90 transition-transform"
        >
          {isActive ? <Pause size={36} /> : <Play size={36} fill="currentColor" />}
        </button>
        <button 
          onClick={stopTimer}
          className="flex-1 bg-gray-800 text-white font-bold py-5 rounded-3xl flex justify-center items-center active:scale-90 transition-transform"
        >
          <Square size={36} fill="currentColor" />
        </button>
      </div>
      <div className="mt-10 text-gray-500 font-medium tracking-widest uppercase">
        Hiệp {currentSetIndex + 1} / {exercises.length}
      </div>
    </div>
  );
};

export default Timer;""",
    "src/App.jsx": """import React, { useState, useEffect } from 'react';
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

export default App;""",
    "capacitor.config.json": """{
  "appId": "com.plankai.app",
  "appName": "Plank AI",
  "webDir": "dist",
  "bundledWebRuntime": false
}""",
    "ios-build-entitlements.plist": """<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>get-task-allow</key>
    <false/>
</dict>
</plist>""",
    ".github/workflows/build-ios.yml": """name: Build iOS IPA for TrollStore

on:
  push:
    branches: [ "main" ]
  workflow_dispatch:

jobs:
  build:
    runs-on: macos-latest

    steps:
      - name: Checkout mã nguồn
        uses: actions/checkout@v4

      - name: Thiết lập Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'

      - name: Cài đặt Dependencies
        run: npm install

      - name: Build Web (Vite)
        run: npm run build

      - name: Khởi tạo & Đồng bộ Capacitor
        run: |
          npx cap add ios || true
          npx cap sync ios

      - name: Tạo Icon tự động
        run: npm run generate-icons || true

      - name: Đồng bộ Version từ package.json vào Xcode
        run: |
          VERSION=$(jq -r '.version' package.json)
          echo "Cập nhật MARKETING_VERSION = $VERSION"
          sed -i '' "s/MARKETING_VERSION = .*/MARKETING_VERSION = $VERSION;/g" ios/App/App.xcodeproj/project.pbxproj

      - name: Build mã nguồn iOS bằng Xcode (Không ký)
        working-directory: ios/App
        run: |
          xcodebuild \\
            -workspace App.xcworkspace \\
            -scheme App \\
            -configuration Release \\
            -sdk iphoneos \\
            -derivedDataPath build \\
            CODE_SIGNING_ALLOWED=NO \\
            CODE_SIGNING_REQUIRED=NO \\
            CODE_SIGNING_IDENTITY=""

      - name: Ký mã giả (Ad-Hoc) với Entitlements cho TrollStore
        run: |
          codesign --force --sign - --deep --entitlements ios-build-entitlements.plist ios/App/build/Build/Products/Release-iphoneos/App.app

      - name: Đóng gói thành file IPA chuẩn
        run: |
          mkdir -p Payload
          cp -r ios/App/build/Build/Products/Release-iphoneos/App.app Payload/
          zip -r PlankAI-TrollStore.ipa Payload
          rm -rf Payload

      - name: Tải file IPA lên GitHub Artifacts
        uses: actions/upload-artifact@v4
        with:
          name: PlankAI-TrollStore-IPA
          path: PlankAI-TrollStore.ipa
          retention-days: 7""",
    ".gitignore": """node_modules
dist
dist-ssr
*.local
.env
.env.*
.env.local
.env.*.local
npm-debug.log*
yarn-debug.log*
yarn-error.log*
pnpm-debug.log*
.idea
.DS_Store
*.suo
*.ntvs*
*.njsproj
*.sln
*.sw?
ios
android"""
}

for filepath, content in files.items():
    dirpath = os.path.dirname(filepath)
    if dirpath:
        os.makedirs(dirpath, exist_ok=True)
    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(content)

print("Created all files successfully.")
