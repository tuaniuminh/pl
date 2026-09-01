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
  Play,
  Download,
  RefreshCw,
  ArrowUpCircle,
  Smartphone,
  Share2,
  Check,
  X,
  Info
} from 'lucide-react';
import { testGeminiApiKey } from '../services/geminiService';
import { previewVoice, VOICE_PERSONAS } from '../utils/audioPack';
import { checkForUpdate, downloadIPAInApp } from '../services/updateService';

const APP_VERSION = '2.1.0';

const Settings = ({ settings, onUpdateSettings, onNavigateToAI }) => {
  const [showKey, setShowKey] = useState(false);
  const [testingKey, setTestingKey] = useState(false);
  const [testResult, setTestResult] = useState(null);

  // Trạng thái kiểm tra & tải bản cập nhật In-App OTA
  const [checkingUpdate, setCheckingUpdate] = useState(false);
  const [updateInfo, setUpdateInfo] = useState(null);
  const [updateChecked, setUpdateChecked] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState(null);
  const [downloadError, setDownloadError] = useState(null);
  const [downloadFinished, setDownloadFinished] = useState(false);

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

  const handleCheckUpdate = async () => {
    setCheckingUpdate(true);
    setUpdateChecked(false);
    setDownloadError(null);
    setDownloadFinished(false);

    try {
      // Giả lập độ trễ tối thiểu 600ms chống nhấp nháy UI
      const [res] = await Promise.all([
        checkForUpdate(APP_VERSION),
        new Promise(resolve => setTimeout(resolve, 600))
      ]);
      setUpdateInfo(res);
      setUpdateChecked(true);
    } catch (e) {
      setUpdateInfo({ hasUpdate: false, error: e.message });
      setUpdateChecked(true);
    } finally {
      setCheckingUpdate(false);
    }
  };

  const handleStartDownloadIPA = async () => {
    if (!updateInfo?.ipaDownloadUrl) return;

    setIsDownloading(true);
    setDownloadError(null);
    setDownloadFinished(false);
    setDownloadProgress({
      progress: 0,
      downloadedMB: '0.0',
      totalMB: '...',
      speed: '0 KB/s'
    });

    try {
      const res = await downloadIPAInApp(updateInfo.ipaDownloadUrl, (data) => {
        setDownloadProgress(data);
      });
      if (res && res.success) {
        setDownloadFinished(true);
      }
    } catch (err) {
      setDownloadError(err.message || "Lỗi tải file IPA. Vui lòng thử lại.");
    } finally {
      setIsDownloading(false);
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
          Tùy chọn phong cách Huấn Luyện Viên AI, Gemini API Key & Cập Nhật OTA
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
                    ? 'border-emerald-500 bg-emerald-500/10 shadow-sm'
                    : 'border-slate-200 dark:border-white/5 hover:border-slate-300 dark:hover:border-white/10'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-2">
                    <span className="text-xl">{persona.emoji}</span>
                    <div>
                      <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                        {persona.name}
                      </h4>
                      <p className="text-[10px] text-slate-500 dark:text-gray-400">
                        {persona.desc}
                      </p>
                    </div>
                  </div>
                  {isSelected && (
                    <div className="w-5 h-5 rounded-full bg-emerald-500 text-white flex items-center justify-center shrink-0">
                      <Check size={12} />
                    </div>
                  )}
                </div>

                <div className="mt-2.5 pt-2 border-t border-slate-100 dark:border-white/5 flex items-center justify-between text-[10px]">
                  <span className="text-slate-400 dark:text-gray-500 italic truncate max-w-[140px]">
                    "{persona.sampleText}"
                  </span>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      previewVoice(persona.id);
                    }}
                    className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-white/5 dark:hover:bg-white/10 text-slate-700 dark:text-gray-300 shrink-0 ml-1 active:scale-95"
                    title="Nghe thử"
                  >
                    <Play size={10} />
                  </button>
                </div>
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
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-xl bg-cyan-100 dark:bg-cyan-500/15 text-cyan-600 dark:text-cyan-neon flex items-center justify-center">
              <Key size={16} />
            </div>
            <div>
              <h3 className="text-sm font-extrabold text-slate-900 dark:text-white">Google Gemini API Key</h3>
              <p className="text-[11px] text-slate-500 dark:text-gray-400">Kích hoạt Huấn Luyện Viên AI chuyên sâu</p>
            </div>
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

      {/* SECTION 3: CẬP NHẬT ỨNG DỤNG (IN-APP OTA UPDATER) */}
      <div className="glass-panel p-5 rounded-3xl space-y-4 border border-cyan-300/40 dark:border-cyan-500/20">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-xl bg-cyan-100 dark:bg-cyan-500/15 text-cyan-600 dark:text-cyan-neon flex items-center justify-center">
              <ArrowUpCircle size={16} />
            </div>
            <div>
              <h3 className="text-sm font-extrabold text-slate-900 dark:text-white">Cập Nhật Ứng Dụng (OTA)</h3>
              <p className="text-[11px] text-slate-500 dark:text-gray-400">Tải & cài đặt trực tiếp qua TrollStore không cần máy tính</p>
            </div>
          </div>
          <span className="text-[11px] font-black px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 dark:bg-white/10 dark:text-gray-300 border border-slate-200 dark:border-white/10 font-mono">
            v{APP_VERSION}
          </span>
        </div>

        {/* Status Area */}
        {updateChecked && updateInfo && (
          <div className={`p-3.5 rounded-2xl text-xs flex items-start space-x-2.5 border transition-all animate-fade-in ${
            updateInfo.hasUpdate
              ? 'bg-cyan-50 dark:bg-cyan-950/40 border-cyan-300 dark:border-cyan-500/30 text-cyan-900 dark:text-cyan-200'
              : updateInfo.error
              ? 'bg-amber-50 dark:bg-amber-950/40 border-amber-300 dark:border-amber-500/30 text-amber-800 dark:text-amber-300'
              : 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-500/30 text-emerald-800 dark:text-emerald-300'
          }`}>
            {updateInfo.hasUpdate ? (
              <Sparkles size={16} className="shrink-0 mt-0.5 text-cyan-500" />
            ) : updateInfo.error ? (
              <AlertCircle size={16} className="shrink-0 mt-0.5 text-amber-500" />
            ) : (
              <CheckCircle2 size={16} className="shrink-0 mt-0.5 text-emerald-500" />
            )}
            <div className="flex-1 min-w-0">
              <div className="font-bold flex items-center space-x-2">
                <span>{updateInfo.hasUpdate ? `Đã có bản phát hành mới: ${updateInfo.tagName}` : updateInfo.error ? "Không thể kiểm tra" : "Ứng dụng đang ở bản mới nhất!"}</span>
              </div>
              <div className="text-[11px] mt-0.5 opacity-90 leading-relaxed">
                {updateInfo.hasUpdate 
                  ? (updateInfo.releaseName || "Sẵn sàng nâng cấp file IPA trực tiếp vào TrollStore.")
                  : updateInfo.error
                  ? (updateInfo.error)
                  : `Bạn đang dùng phiên bản v${APP_VERSION} mới nhất từ GitHub Releases.`}
              </div>
            </div>
          </div>
        )}

        {/* Buttons */}
        <div className="flex flex-col sm:flex-row gap-2 pt-1">
          <button
            type="button"
            onClick={handleCheckUpdate}
            disabled={checkingUpdate || isDownloading}
            className="flex-1 py-3 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-800 dark:bg-white/10 dark:hover:bg-white/20 dark:text-white font-bold text-xs flex items-center justify-center space-x-1.5 transition-all active:scale-95 disabled:opacity-50"
          >
            <RefreshCw size={14} className={`text-cyan-600 dark:text-cyan-neon ${checkingUpdate ? 'animate-spin' : ''}`} />
            <span>{checkingUpdate ? "Đang Kiểm Tra..." : "Kiểm Tra Bản Cập Nhật Mới"}</span>
          </button>

          {updateInfo?.hasUpdate && updateInfo?.ipaDownloadUrl && (
            <button
              type="button"
              onClick={handleStartDownloadIPA}
              disabled={isDownloading}
              className="py-3 px-5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-black text-xs flex items-center justify-center space-x-1.5 transition-all active:scale-95 shadow-md shadow-cyan-500/20"
            >
              <Download size={14} />
              <span>Tải & Cài Đặt Ngay</span>
            </button>
          )}
        </div>
      </div>

      {/* MODAL TIẾN TRÌNH TẢI IPA TRỰC TIẾP TRONG APP */}
      {(isDownloading || downloadProgress) && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-md z-50 flex items-center justify-center p-4 animate-fade-in">
          <div className="glass-panel max-w-sm w-full p-6 rounded-3xl border border-cyan-500/30 text-center space-y-4 shadow-2xl bg-white/95 dark:bg-slate-900/95">
            {/* Download Icon */}
            <div className="w-14 h-14 rounded-2xl bg-cyan-100 dark:bg-cyan-500/20 text-cyan-600 dark:text-cyan-neon flex items-center justify-center mx-auto shadow-inner">
              {downloadFinished ? (
                <CheckCircle2 size={28} className="text-emerald-500" />
              ) : isDownloading ? (
                <Download size={26} className="animate-bounce text-cyan-500" />
              ) : (
                <AlertCircle size={26} className="text-red-500" />
              )}
            </div>

            {/* Title & Status */}
            <div>
              <h3 className="text-base font-black text-slate-900 dark:text-white">
                {downloadFinished ? "Tải File Hoàn Tất!" : downloadError ? "Lỗi Tải File" : "Đang Tải Bản Cập Nhật"}
              </h3>
              <p className="text-xs text-slate-500 dark:text-gray-400 mt-1">
                {downloadFinished 
                  ? "Bảng chia sẻ iOS đang mở. Hãy chọn TrollStore để cài đặt ngay." 
                  : downloadError 
                  ? downloadError 
                  : `Tải gói IPA (${downloadProgress?.downloadedMB || '0.0'} MB / ${downloadProgress?.totalMB || '...'} MB)`}
              </p>
            </div>

            {/* Progress Bar */}
            {!downloadError && (
              <div className="space-y-2">
                <div className="w-full h-3.5 bg-slate-100 dark:bg-white/10 rounded-full overflow-hidden p-0.5 border border-slate-200 dark:border-white/10 relative">
                  <div 
                    className="h-full bg-gradient-to-r from-cyan-500 to-emerald-500 rounded-full transition-all duration-300"
                    style={{ width: `${Math.min(100, Math.round((downloadProgress?.progress || 0) * 100))}%` }}
                  />
                </div>
                <div className="flex items-center justify-between text-[11px] font-bold text-slate-500 dark:text-gray-400">
                  <span>{Math.min(100, Math.round((downloadProgress?.progress || 0) * 100))}%</span>
                  <span className="text-cyan-600 dark:text-cyan-neon font-mono">{downloadProgress?.speed || '0 KB/s'}</span>
                </div>
              </div>
            )}

            {/* Close Button */}
            <div className="pt-2">
              <button
                onClick={() => {
                  setDownloadProgress(null);
                  setIsDownloading(false);
                  setDownloadFinished(false);
                }}
                className="w-full py-3 rounded-2xl bg-slate-100 hover:bg-slate-200 dark:bg-white/10 dark:hover:bg-white/20 text-slate-700 dark:text-gray-300 font-bold text-xs active:scale-95 transition-all"
              >
                {downloadFinished ? "Đóng" : "Hủy Tải"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Settings;
