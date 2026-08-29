import React, { useState } from 'react';
import { 
  Key, 
  Eye, 
  EyeOff, 
  CheckCircle2, 
  AlertCircle, 
  Sparkles, 
  Volume2, 
  Moon, 
  Sun, 
  ShieldCheck, 
  ExternalLink, 
  HelpCircle,
  Smartphone,
  Github
} from 'lucide-react';
import { testGeminiApiKey } from '../services/geminiService';
import packageJson from '../../package.json';

const Settings = ({ settings, onUpdateSettings, onNavigateToAI }) => {
  const [showKey, setShowKey] = useState(false);
  const [testingKey, setTestingKey] = useState(false);
  const [testResult, setTestResult] = useState(null); // { success: boolean, message: string }

  const handleKeyChange = (val) => {
    onUpdateSettings({ ...settings, apiKey: val });
    setTestResult(null); // Reset test status when modified
  };

  const handleTestKey = async () => {
    if (!settings.apiKey || !settings.apiKey.trim()) {
      setTestResult({
        success: false,
        message: "Vui lòng nhập API Key trước khi kiểm tra."
      });
      return;
    }

    setTestingKey(true);
    setTestResult(null);

    try {
      await testGeminiApiKey(settings.apiKey);
      setTestResult({
        success: true,
        message: "Kết nối thành công! Google Gemini 3.7 Flash đã sẵn sàng phục vụ bạn."
      });
    } catch (err) {
      setTestResult({
        success: false,
        message: err.message || "Lỗi kiểm tra API Key. Vui lòng kiểm tra lại tính chính xác của Key."
      });
    } finally {
      setTestingKey(false);
    }
  };

  return (
    <div className="p-4 sm:p-6 space-y-6 pb-28 max-w-lg mx-auto">
      {/* Title */}
      <div>
        <h2 className="text-2xl font-black tracking-tight text-white dark:text-white light:text-slate-900">
          Cài Đặt Hệ Thống
        </h2>
        <p className="text-xs text-gray-400 dark:text-gray-400 light:text-slate-600 mt-0.5">
          Quản lý API Key, giọng nói trợ lý và giao diện hiển thị
        </p>
      </div>

      {/* SECTION 1: GOOGLE GEMINI API KEY */}
      <div className="glass-panel p-5 rounded-3xl border border-neon/30 shadow-card-glow space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-xl bg-neon/15 text-neon flex items-center justify-center">
              <Key size={16} />
            </div>
            <div>
              <h3 className="text-sm font-extrabold text-white">Google Gemini API Key</h3>
              <p className="text-[11px] text-gray-400">Kết nối trực tiếp không qua trung gian</p>
            </div>
          </div>
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-neon/15 text-neon border border-neon/30">
            {settings.apiKey ? "Đã Thiết Lập" : "Chưa Nhập"}
          </span>
        </div>

        {/* Input Field */}
        <div className="relative">
          <input
            type={showKey ? "text" : "password"}
            value={settings.apiKey || ''}
            onChange={(e) => handleKeyChange(e.target.value)}
            placeholder="Dán API Key (AIzaSy...)"
            className="w-full bg-white/5 border border-white/10 rounded-2xl p-3.5 pr-12 text-xs text-white placeholder-gray-600 focus:outline-none focus:border-neon transition-all font-mono"
          />
          <button
            type="button"
            onClick={() => setShowKey(!showKey)}
            className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white p-1"
          >
            {showKey ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
        </div>

        {/* Test Result Message */}
        {testResult && (
          <div className={`p-3.5 rounded-2xl text-xs flex items-start space-x-2 border transition-all ${
            testResult.success 
              ? 'bg-neon/10 border-neon/30 text-neon' 
              : 'bg-red-500/10 border-red-500/30 text-red-400'
          }`}>
            {testResult.success ? (
              <CheckCircle2 size={16} className="shrink-0 mt-0.5" />
            ) : (
              <AlertCircle size={16} className="shrink-0 mt-0.5" />
            )}
            <div className="flex-1">
              <div className="font-bold">{testResult.success ? "Tuyệt Vời!" : "Kết Nối Thất Bại"}</div>
              <div className="text-[11px] mt-0.5 opacity-90">{testResult.message}</div>
            </div>
          </div>
        )}

        {/* Test Key & Generate Plan Buttons */}
        <div className="flex flex-col sm:flex-row gap-2 pt-1">
          <button
            type="button"
            onClick={handleTestKey}
            disabled={testingKey}
            className="flex-1 py-3 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs flex items-center justify-center space-x-1.5 transition-all active:scale-95 disabled:opacity-50"
          >
            {testingKey ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <Sparkles size={14} className="text-neon" />
            )}
            <span>{testingKey ? "Đang Kiểm Tra..." : "Kiểm Tra Kết Nối API"}</span>
          </button>

          <a
            href="https://aistudio.google.com/app/apikey"
            target="_blank"
            rel="noopener noreferrer"
            className="py-3 px-4 rounded-xl bg-neon/10 hover:bg-neon/20 text-neon border border-neon/30 font-bold text-xs flex items-center justify-center space-x-1.5 transition-all active:scale-95"
          >
            <span>Lấy Key Miễn Phí</span>
            <ExternalLink size={12} />
          </a>
        </div>

        {testResult?.success && (
          <button
            onClick={onNavigateToAI}
            className="w-full py-3.5 rounded-2xl bg-neon text-black font-extrabold text-xs uppercase tracking-wider shadow-neon flex items-center justify-center space-x-2 active:scale-95 transition-all"
          >
            <Sparkles size={14} />
            <span>Mở Ngay Trợ Lý AI Để Tạo Giáo Án</span>
          </button>
        )}
      </div>

      {/* SECTION 2: GIAO DIỆN & ÂM THANH */}
      <div className="glass-panel p-5 rounded-3xl border border-white/10 space-y-4">
        <h3 className="text-xs font-extrabold uppercase tracking-wider text-gray-300">
          Tùy Chọn Ứng Dụng
        </h3>

        {/* Dark Mode Toggle */}
        <div className="flex items-center justify-between py-1">
          <div>
            <div className="text-xs font-bold text-white flex items-center space-x-2">
              <Moon size={14} className="text-cyan-neon" />
              <span>Chế Độ OLED Dark Mode</span>
            </div>
            <div className="text-[11px] text-gray-400 mt-0.5">Nền đen sâu #000000 tiết kiệm pin iPhone</div>
          </div>
          <button
            onClick={() => onUpdateSettings({ ...settings, theme: settings.theme === 'dark' ? 'light' : 'dark' })}
            className={`w-12 h-7 rounded-full p-1 transition-all ${
              settings.theme === 'dark' ? 'bg-neon shadow-neon' : 'bg-gray-600'
            }`}
          >
            <div className={`bg-black w-5 h-5 rounded-full shadow-md transform transition-transform ${
              settings.theme === 'dark' ? 'translate-x-5' : 'translate-x-0'
            }`} />
          </button>
        </div>

        {/* Voice Assistant Toggle */}
        <div className="flex items-center justify-between py-1 border-t border-white/5 pt-3">
          <div>
            <div className="text-xs font-bold text-white flex items-center space-x-2">
              <Volume2 size={14} className="text-neon" />
              <span>Trợ Lý Giọng Nói Tiếng Việt</span>
            </div>
            <div className="text-[11px] text-gray-400 mt-0.5">Đọc khẩu lệnh Bắt đầu, Nghỉ và đếm 5s cuối</div>
          </div>
          <button
            onClick={() => onUpdateSettings({ ...settings, voiceEnabled: !settings.voiceEnabled })}
            className={`w-12 h-7 rounded-full p-1 transition-all ${
              settings.voiceEnabled ? 'bg-neon shadow-neon' : 'bg-gray-600'
            }`}
          >
            <div className={`bg-black w-5 h-5 rounded-full shadow-md transform transition-transform ${
              settings.voiceEnabled ? 'translate-x-5' : 'translate-x-0'
            }`} />
          </button>
        </div>
      </div>

      {/* SECTION 3: THÔNG TIN HỆ THỐNG */}
      <div className="glass-panel p-5 rounded-3xl border border-white/10 space-y-3 text-xs">
        <h3 className="text-xs font-extrabold uppercase tracking-wider text-gray-300">
          Thông Tin Phiên Bản
        </h3>

        <div className="flex justify-between py-1 border-b border-white/5">
          <span className="text-gray-400">Phiên Bản Ứng Dụng</span>
          <span className="font-mono font-bold text-neon">v{packageJson.version}</span>
        </div>

        <div className="flex justify-between py-1 border-b border-white/5">
          <span className="text-gray-400">Kiến Trúc Đóng Gói</span>
          <span className="text-white font-medium">Capacitor 6 + iOS Native</span>
        </div>

        <div className="flex justify-between py-1 border-b border-white/5">
          <span className="text-gray-400">Hỗ Trợ TrollStore</span>
          <span className="text-cyan-neon font-semibold flex items-center space-x-1">
            <ShieldCheck size={13} />
            <span>Bypass Dev Mode (get-task-allow=false)</span>
          </span>
        </div>

        <div className="flex justify-between py-1">
          <span className="text-gray-400">Kho Lưu Trữ GitHub</span>
          <a 
            href="https://github.com/tuaniuminh/pl" 
            target="_blank" 
            rel="noopener noreferrer" 
            className="text-gray-300 hover:text-white flex items-center space-x-1"
          >
            <Github size={12} />
            <span>tuaniuminh/pl</span>
          </a>
        </div>
      </div>
    </div>
  );
};

export default Settings;
