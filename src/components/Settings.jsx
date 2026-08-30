import React, { useState } from 'react';
import { 
  Key, 
  Eye, 
  EyeOff, 
  CheckCircle2, 
  AlertCircle, 
  Sparkles, 
  Volume2, 
  ExternalLink,
  Play
} from 'lucide-react';
import { testGeminiApiKey } from '../services/geminiService';
import { previewVoice, VOICE_PERSONAS } from '../utils/audioPack';

const Settings = ({ settings, onUpdateSettings, onNavigateToAI }) => {
  const [showKey, setShowKey] = useState(false);
  const [testingKey, setTestingKey] = useState(false);
  const [testResult, setTestResult] = useState(null);

  const handleKeyChange = (val) => {
    onUpdateSettings({ ...settings, apiKey: val });
    setTestResult(null);
  };

  const handleVoiceChange = (voiceKey) => {
    onUpdateSettings({ ...settings, selectedVoice: voiceKey });
    previewVoice(voiceKey);
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
      const res = await testGeminiApiKey(settings.apiKey);
      setTestResult({
        success: true,
        message: `Kết nối thành công! Đang kết nối mô hình: ${res.activeModel || 'Google Gemini 3.7 Flash'}. Hệ thống sẵn sàng tạo giáo án cho bạn.`
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

  const currentPersona = VOICE_PERSONAS.find(p => p.id === (settings.selectedVoice || 'female')) || VOICE_PERSONAS[0];

  return (
    <div className="p-4 sm:p-6 space-y-6 pb-28 max-w-lg mx-auto">
      {/* Title */}
      <div>
        <h2 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white">
          Cài Đặt Hệ Thống
        </h2>
        <p className="text-xs text-slate-500 dark:text-gray-400 mt-0.5">
          Tùy chọn phong cách Huấn Luyện Viên AI và Google Gemini API Key
        </p>
      </div>

      {/* SECTION 1: BỘ SƯU TẬP 6 PHONG CÁCH HUẤN LUYỆN VIÊN STUDIO AI */}
      <div className="glass-panel p-5 rounded-3xl space-y-4 border border-emerald-300/40 dark:border-emerald-500/20">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-xl bg-emerald-100 dark:bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <Volume2 size={16} />
            </div>
            <div>
              <h3 className="text-sm font-extrabold text-slate-900 dark:text-white">Giọng Đọc Huấn Luyện Viên AI</h3>
              <p className="text-[11px] text-slate-500 dark:text-gray-400">Chọn người bạn đồng hành luyện tập cùng bạn</p>
            </div>
          </div>
          <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-300/60 dark:border-emerald-500/30">
            {currentPersona.emoji} {currentPersona.name}
          </span>
        </div>

        {/* 6 Voice Personas Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
          {VOICE_PERSONAS.map((persona) => {
            const isSelected = (settings.selectedVoice || 'female') === persona.id;

            return (
              <div 
                key={persona.id}
                onClick={() => handleVoiceChange(persona.id)}
                className={`p-3.5 rounded-2xl border transition-all cursor-pointer relative flex flex-col justify-between ${
                  isSelected
                    ? 'bg-emerald-50/90 dark:bg-emerald-500/15 border-emerald-500 shadow-sm ring-1 ring-emerald-500/40'
                    : 'bg-slate-50 dark:bg-white/5 border-slate-200 dark:border-white/10 hover:border-slate-300 dark:hover:border-white/20'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-1.5">
                      <span className="text-xl">{persona.emoji}</span>
                      <span className="text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded-md bg-white dark:bg-white/10 text-slate-700 dark:text-gray-300 border border-slate-200 dark:border-white/10">
                        {persona.tag}
                      </span>
                    </div>
                    <span className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                      isSelected
                        ? 'border-emerald-500 bg-emerald-500 text-white'
                        : 'border-slate-300 dark:border-white/20'
                    }`}>
                      {isSelected && <span className="w-1.5 h-1.5 rounded-full bg-white" />}
                    </span>
                  </div>

                  <h4 className="text-xs font-black text-slate-900 dark:text-white mt-2">
                    {persona.name}
                  </h4>
                  <p className="text-[11px] text-slate-500 dark:text-gray-400 mt-0.5 line-clamp-2">
                    {persona.desc}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    previewVoice(persona.id);
                  }}
                  className="mt-2.5 py-1 px-2.5 rounded-xl bg-white dark:bg-white/10 border border-slate-200 dark:border-white/10 text-[10px] font-bold text-emerald-700 dark:text-emerald-300 flex items-center justify-center space-x-1 active:scale-95 shadow-sm"
                >
                  <Play size={10} fill="currentColor" />
                  <span>Nghe Thử</span>
                </button>
              </div>
            );
          })}
        </div>

        {/* Master Voice Assistant Toggle */}
        <div className="flex items-center justify-between pt-3 border-t border-slate-200 dark:border-white/5">
          <div>
            <div className="text-xs font-bold text-slate-900 dark:text-white">Bật Trợ Lý Giọng Nói Đếm Giờ</div>
            <div className="text-[11px] text-slate-500 dark:text-gray-400">Đếm nhịp 3, 2, 1 và hướng dẫn tư thế</div>
          </div>
          <button
            type="button"
            onClick={() => onUpdateSettings({ ...settings, soundEnabled: !settings.soundEnabled })}
            className={`w-12 h-7 rounded-full p-1 transition-all ${
              settings.soundEnabled ? 'bg-emerald-500 shadow-sm' : 'bg-slate-300 dark:bg-white/20'
            }`}
          >
            <div className={`bg-white w-5 h-5 rounded-full shadow-md transform transition-transform ${
              settings.soundEnabled ? 'translate-x-5' : 'translate-x-0'
            }`} />
          </button>
        </div>

        {/* Heartbeat FX Sound Toggle */}
        <div className="flex items-center justify-between pt-3 border-t border-slate-200 dark:border-white/5">
          <div>
            <div className="text-xs font-bold text-slate-900 dark:text-white flex items-center space-x-1.5">
              <span>❤️ Âm Thanh Nhịp Tim Gồng Cơ</span>
              <span className="text-[9px] font-extrabold px-1.5 py-0.5 rounded bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300">15s Cuối</span>
            </div>
            <div className="text-[11px] text-slate-500 dark:text-gray-400 mt-0.5">Tiếng tim đập dồn dập và rung kích thích bứt phá giới hạn</div>
          </div>
          <button
            type="button"
            onClick={() => onUpdateSettings({ ...settings, heartbeatEnabled: settings.heartbeatEnabled !== false ? false : true })}
            className={`w-12 h-7 rounded-full p-1 transition-all ${
              settings.heartbeatEnabled !== false ? 'bg-red-500 shadow-sm' : 'bg-slate-300 dark:bg-white/20'
            }`}
          >
            <div className={`bg-white w-5 h-5 rounded-full shadow-md transform transition-transform ${
              settings.heartbeatEnabled !== false ? 'translate-x-5' : 'translate-x-0'
            }`} />
          </button>
        </div>
      </div>

      {/* SECTION 2: CẤU HÌNH GOOGLE GEMINI API KEY */}
      <div className="glass-panel p-5 rounded-3xl space-y-4 border border-cyan-300/40 dark:border-cyan-500/20">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 rounded-xl bg-cyan-100 dark:bg-cyan-500/15 text-cyan-600 dark:text-cyan-neon flex items-center justify-center">
            <Key size={16} />
          </div>
          <div>
            <h3 className="text-sm font-extrabold text-slate-900 dark:text-white">Google Gemini API Key</h3>
            <p className="text-[11px] text-slate-500 dark:text-gray-400">Kết nối trực tiếp trí tuệ nhân tạo Gemini</p>
          </div>
        </div>

        {/* Input Key */}
        <div className="relative">
          <input
            type={showKey ? "text" : "password"}
            value={settings.apiKey || ''}
            onChange={(e) => handleKeyChange(e.target.value)}
            placeholder="Dán mã API Key (AIzaSy...)"
            className="w-full bg-slate-100 dark:bg-white/5 border border-slate-300 dark:border-white/10 rounded-2xl p-3.5 pr-11 text-xs text-slate-900 dark:text-white font-mono focus:outline-none focus:border-cyan-500 transition-all placeholder:text-slate-400"
          />
          <button
            type="button"
            onClick={() => setShowKey(!showKey)}
            className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-gray-400 hover:text-slate-700 dark:hover:text-white p-1"
          >
            {showKey ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
        </div>

        {/* Test Result Message */}
        {testResult && (
          <div className={`p-3.5 rounded-2xl text-xs flex items-start space-x-2 border transition-all ${
            testResult.success 
              ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-500/30 text-emerald-800 dark:text-emerald-300' 
              : 'bg-red-50 dark:bg-red-500/10 border-red-300 dark:border-red-500/30 text-red-700 dark:text-red-400'
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
            className="flex-1 py-3 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-800 dark:bg-white/10 dark:hover:bg-white/20 dark:text-white font-bold text-xs flex items-center justify-center space-x-1.5 transition-all active:scale-95 disabled:opacity-50"
          >
            {testingKey ? (
              <div className="w-4 h-4 border-2 border-slate-600 dark:border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <Sparkles size={14} className="text-emerald-600 dark:text-emerald-400" />
            )}
            <span>{testingKey ? "Đang Kiểm Tra..." : "Kiểm Tra Kết Nối API"}</span>
          </button>

          <a
            href="https://aistudio.google.com/app/apikey"
            target="_blank"
            rel="noopener noreferrer"
            className="py-3 px-4 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-300 dark:bg-emerald-500/10 dark:hover:bg-emerald-500/20 dark:text-emerald-400 dark:border-emerald-500/30 font-bold text-xs flex items-center justify-center space-x-1.5 transition-all active:scale-95"
          >
            <span>Lấy Key Miễn Phí</span>
            <ExternalLink size={12} />
          </a>
        </div>

        {testResult?.success && (
          <button
            onClick={onNavigateToAI}
            className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white font-extrabold text-xs uppercase tracking-wider shadow-md shadow-emerald-500/20 flex items-center justify-center space-x-2 active:scale-95 transition-all"
          >
            <Sparkles size={14} />
            <span>Mở Ngay Tab Giáo Án Để Thiết Kế Bài Tập</span>
          </button>
        )}
      </div>
    </div>
  );
};

export default Settings;
