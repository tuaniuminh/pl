import React, { useState, useRef } from 'react';
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
  Info,
  ChevronDown,
  ChevronUp,
  Scale
} from 'lucide-react';
import { testGeminiApiKey } from '../services/geminiService';
import { previewVoice, VOICE_PERSONAS, playHeartbeatSound } from '../utils/audioPack';
import { triggerHapticHeartbeat } from '../utils/hapticsUtils';
import { checkForUpdate, downloadIPAInApp, cancelDownloadIPA } from '../services/updateService';
import { getUserProfile, saveUserProfile, calculateBMI } from '../services/storageService';

const APP_VERSION = '2.2.9';

const Settings = ({ settings, onUpdateSettings, onNavigateToAI }) => {
  const [userProfile, setUserProfileState] = useState(getUserProfile());
  const [showKey, setShowKey] = useState(false);
  const [testingKey, setTestingKey] = useState(false);
  const [testResult, setTestResult] = useState(null);

  // Trạng thái đóng/mở danh sách giọng nói để tối ưu diện tích
  const [isVoiceListOpen, setIsVoiceListOpen] = useState(false);

  // Trạng thái kiểm tra & tải bản cập nhật In-App OTA
  const [checkingUpdate, setCheckingUpdate] = useState(false);
  const [updateInfo, setUpdateInfo] = useState(null);
  const [updateChecked, setUpdateChecked] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState(null);
  const [downloadError, setDownloadError] = useState(null);
  const [downloadFinished, setDownloadFinished] = useState(false);

  // Cờ hủy tiến trình tải ngầm
  const downloadCanceledRef = useRef(false);

  const handleGenderChange = (newGender) => {
    const updated = { ...userProfile, gender: newGender };
    setUserProfileState(updated);
    saveUserProfile(updated);
  };

  const handleHeightChange = (newHeight) => {
    const val = Number(newHeight) || 170;
    const updated = { ...userProfile, height: val };
    setUserProfileState(updated);
    saveUserProfile(updated);
  };

  const handleWeightChange = (newWeight) => {
    const val = Number(newWeight) || 65;
    const updated = { ...userProfile, weight: val };
    setUserProfileState(updated);
    saveUserProfile(updated);
  };

  const bmiInfo = calculateBMI(userProfile.weight || 65, userProfile.height || 170, userProfile.gender || 'male');
  const met = (userProfile.gender || 'male') === 'female' ? 4.1 : 4.4;
  const calPerMin = ((met * 3.5 * (Number(userProfile.weight) || 65)) / 200).toFixed(1);

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

    downloadCanceledRef.current = false;
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
        if (downloadCanceledRef.current) return;
        setDownloadProgress(data);
      });
      if (res && res.success && !downloadCanceledRef.current) {
        setDownloadFinished(true);
      }
    } catch (err) {
      if (!downloadCanceledRef.current) {
        setDownloadError(err.message || "Lỗi tải file IPA. Vui lòng thử lại.");
      }
    } finally {
      if (!downloadCanceledRef.current) {
        setIsDownloading(false);
      }
    }
  };

  const handleCancelDownload = async () => {
    downloadCanceledRef.current = true;
    setIsDownloading(false);
    setDownloadProgress(null);
    setDownloadFinished(false);
    setDownloadError(null);
    await cancelDownloadIPA();
  };

  const currentPersona = VOICE_PERSONAS.find(p => p.id === (settings.selectedVoice || 'female')) || VOICE_PERSONAS[0];

  return (
    <div className="p-4 sm:p-6 space-y-6 pb-24 max-w-lg mx-auto">
      {/* Title */}
      <div>
        <h2 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white">
          Cài Đặt Hệ Thống
        </h2>
        <p className="text-xs text-slate-500 dark:text-gray-400 mt-0.5">
          Cập nhật OTA, phong cách Huấn Luyện Viên AI & Gemini API Key
        </p>
      </div>

      {/* SECTION 1: CẬP NHẬT ỨNG DỤNG (OTA) */}
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

        {/* Buttons (Nút Tải & Cài Đặt Ngay được ưu tiên đưa lên TRÊN nút Kiểm Tra Cập Nhật khi có bản mới) */}
        <div className="flex flex-col gap-2 pt-1">
          {updateInfo?.hasUpdate && updateInfo?.ipaDownloadUrl && (
            <button
              type="button"
              onClick={handleStartDownloadIPA}
              disabled={isDownloading}
              className="w-full py-3.5 px-5 rounded-2xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-black text-xs flex items-center justify-center space-x-2 transition-all active:scale-95 shadow-md shadow-cyan-500/20"
            >
              <Download size={16} />
              <span>Tải & Cài Đặt Ngay ({updateInfo.tagName})</span>
            </button>
          )}

          <button
            type="button"
            onClick={handleCheckUpdate}
            disabled={checkingUpdate || isDownloading}
            className="w-full py-3 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-800 dark:bg-white/10 dark:hover:bg-white/20 dark:text-white font-bold text-xs flex items-center justify-center space-x-1.5 transition-all active:scale-95 disabled:opacity-50"
          >
            <RefreshCw size={14} className={`text-cyan-600 dark:text-cyan-neon ${checkingUpdate ? 'animate-spin' : ''}`} />
            <span>{checkingUpdate ? "Đang Kiểm Tra..." : "Kiểm Tra Bản Cập Nhật Mới"}</span>
          </button>
        </div>
      </div>

      {/* SECTION 2: BỘ SƯU TẬP GIỌNG ĐỌC HUẤN LUYỆN VIÊN STUDIO AI (DẠNG ACCORDION ĐÓNG/MỞ) */}
      <div className="glass-panel p-5 rounded-3xl space-y-4 border border-emerald-300/40 dark:border-emerald-500/20">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-xl bg-emerald-100 dark:bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <Volume2 size={16} />
            </div>
            <div>
              <h3 className="text-sm font-extrabold text-slate-900 dark:text-white">Giọng Đọc Huấn Luyện Viên AI</h3>
              <p className="text-[11px] text-slate-500 dark:text-gray-400">Microsoft Edge Neural TTS (Hoài My & Nam Minh Studio)</p>
            </div>
          </div>
          <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-300/60 dark:border-emerald-500/30 shrink-0">
            {currentPersona.emoji} {currentPersona.name}
          </span>
        </div>

        {/* Selected Persona Summary Bar & Collapse Toggle Button */}
        <div className="p-3 rounded-2xl bg-slate-100/80 dark:bg-white/5 border border-slate-200/80 dark:border-white/10 flex items-center justify-between gap-3">
          <div className="flex items-center space-x-2.5 min-w-0 flex-1">
            <span className="text-2xl shrink-0">{currentPersona.emoji}</span>
            <div className="min-w-0 flex-1">
              <div className="flex items-center space-x-1.5">
                <span className="text-xs font-black text-slate-900 dark:text-white truncate">{currentPersona.name}</span>
                <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 shrink-0">Đang chọn</span>
              </div>
              <p className="text-[10px] text-slate-500 dark:text-gray-400 truncate mt-0.5">"{currentPersona.sampleText}"</p>
            </div>
          </div>

          <div className="flex items-center space-x-1.5 shrink-0">
            <button
              type="button"
              onClick={() => previewVoice(currentPersona.id)}
              className="p-2 rounded-xl bg-white dark:bg-white/10 text-slate-700 dark:text-gray-300 hover:text-emerald-600 dark:hover:text-emerald-400 shadow-sm active:scale-95 transition-all"
              title="Nghe thử"
            >
              <Play size={12} />
            </button>

            <button
              type="button"
              onClick={() => setIsVoiceListOpen(!isVoiceListOpen)}
              className="px-2.5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-[11px] flex items-center space-x-1 active:scale-95 transition-all shadow-sm"
            >
              <span>{isVoiceListOpen ? "Thu gọn" : "Đổi giọng"}</span>
              {isVoiceListOpen ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            </button>
          </div>
        </div>

        {/* 6 Voice Personas Grid (Chỉ hiện khi mở rộng) */}
        {isVoiceListOpen && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1 animate-fade-in">
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
        )}

        {/* Master Voice Assistant Toggle (Đồng bộ trực tiếp với nút âm thanh trên Header) */}
        <div className="flex items-center justify-between pt-3 border-t border-slate-200 dark:border-white/5 gap-3">
          <div className="flex-1 min-w-0">
            <div className="text-xs font-bold text-slate-900 dark:text-white">Bật Trợ Lý Giọng Nói Đếm Giờ</div>
            <div className="text-[11px] text-slate-500 dark:text-gray-400">Đếm nhịp 3, 2, 1 và hướng dẫn tư thế</div>
          </div>
          <button
            type="button"
            onClick={() => onUpdateSettings({ ...settings, voiceEnabled: !settings.voiceEnabled, soundEnabled: !settings.voiceEnabled })}
            className={`w-12 h-7 rounded-full p-1 transition-all shrink-0 active:scale-95 ${
              settings.voiceEnabled ? 'bg-emerald-500 shadow-sm' : 'bg-slate-300 dark:bg-white/20'
            }`}
          >
            <div className={`bg-white w-5 h-5 rounded-full shadow-md transform transition-transform ${
              settings.voiceEnabled ? 'translate-x-5' : 'translate-x-0'
            }`} />
          </button>
        </div>

        {/* Heartbeat FX Sound Toggle */}
        <div className="flex items-center justify-between pt-3 border-t border-slate-200 dark:border-white/5 gap-3">
          <div className="flex-1 min-w-0">
            <div className="text-xs font-bold text-slate-900 dark:text-white flex items-center space-x-1.5">
              <span>❤️ Âm Thanh Nhịp Tim Gồng Cơ</span>
              <span className="text-[9px] font-extrabold px-1.5 py-0.5 rounded bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300 shrink-0">15s Cuối</span>
            </div>
            <div className="text-[11px] text-slate-500 dark:text-gray-400 mt-0.5 leading-snug">Tiếng tim đập dồn dập và rung kích thích bứt phá giới hạn</div>
          </div>
          <button
            type="button"
            onClick={() => {
              const nextVal = settings.heartbeatEnabled !== false ? false : true;
              onUpdateSettings({ ...settings, heartbeatEnabled: nextVal });
              if (nextVal) {
                playHeartbeatSound({ enabled: true });
                triggerHapticHeartbeat();
              }
            }}
            className={`w-12 h-7 rounded-full p-1 transition-all shrink-0 active:scale-95 ${
              settings.heartbeatEnabled !== false ? 'bg-red-500 shadow-sm' : 'bg-slate-300 dark:bg-white/20'
            }`}
          >
            <div className={`bg-white w-5 h-5 rounded-full shadow-md transform transition-transform ${
              settings.heartbeatEnabled !== false ? 'translate-x-5' : 'translate-x-0'
            }`} />
          </button>
        </div>
      </div>

      {/* SECTION 3: CHỈ SỐ CƠ THỂ & THỂ TRẠNG (BMI) */}
      <div className="glass-panel p-5 rounded-3xl space-y-4 border border-cyan-300/40 dark:border-cyan-500/20">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-xl bg-cyan-100 dark:bg-cyan-500/15 text-cyan-600 dark:text-cyan-neon flex items-center justify-center">
              <Scale size={16} />
            </div>
            <div>
              <h3 className="text-sm font-extrabold text-slate-900 dark:text-white">Chỉ Số Cơ Thể & Thể Trạng</h3>
              <p className="text-[11px] text-slate-500 dark:text-gray-400">Cá nhân hóa lượng Calo đốt & Tối ưu giáo án AI</p>
            </div>
          </div>
          <span className={`text-[10px] font-black px-2.5 py-0.5 rounded-full border shrink-0 ${
            bmiInfo.color === 'emerald'
              ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 border-emerald-300/60 dark:border-emerald-500/30'
              : bmiInfo.color === 'cyan'
              ? 'bg-cyan-50 text-cyan-700 dark:bg-cyan-950 dark:text-cyan-300 border-cyan-300/60 dark:border-cyan-500/30'
              : bmiInfo.color === 'amber'
              ? 'bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-300 border-amber-300/60 dark:border-amber-500/30'
              : 'bg-rose-50 text-rose-700 dark:bg-rose-950 dark:text-rose-300 border-rose-300/60 dark:border-rose-500/30'
          }`}>
            BMI: {bmiInfo.bmi} • {bmiInfo.status}
          </span>
        </div>

        {/* Giới Tính Sinh Học (Nam / Nữ) */}
        <div className="flex items-center justify-between p-2.5 rounded-2xl bg-slate-100/80 dark:bg-white/5 border border-slate-200/80 dark:border-white/10">
          <span className="text-xs font-bold text-slate-700 dark:text-gray-300 ml-1.5">Giới Tính Sinh Học</span>
          <div className="flex space-x-1.5">
            <button
              type="button"
              onClick={() => handleGenderChange('male')}
              className={`px-3.5 py-1.5 rounded-xl font-black text-xs transition-all flex items-center space-x-1.5 active:scale-95 ${
                (userProfile.gender || 'male') === 'male'
                  ? 'bg-cyan-500 text-slate-950 shadow-sm shadow-cyan-500/20'
                  : 'bg-white dark:bg-white/10 text-slate-600 dark:text-gray-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <span>👨 Nam</span>
            </button>
            <button
              type="button"
              onClick={() => handleGenderChange('female')}
              className={`px-3.5 py-1.5 rounded-xl font-black text-xs transition-all flex items-center space-x-1.5 active:scale-95 ${
                userProfile.gender === 'female'
                  ? 'bg-rose-500 text-white shadow-sm shadow-rose-500/20'
                  : 'bg-white dark:bg-white/10 text-slate-600 dark:text-gray-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <span>👩 Nữ</span>
            </button>
          </div>
        </div>

        {/* 2 Sliders / Quick Step: Cân Nặng & Chiều Cao */}
        <div className="grid grid-cols-2 gap-3 pt-1">
          {/* Cân Nặng (kg) */}
          <div className="p-3.5 rounded-2xl bg-slate-100/80 dark:bg-white/5 border border-slate-200/80 dark:border-white/10 space-y-2.5">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-slate-700 dark:text-gray-300">Cân Nặng</span>
              <span className="font-mono font-black text-cyan-600 dark:text-cyan-neon text-sm">{userProfile.weight || 65} <span className="text-[10px] font-normal text-slate-400">kg</span></span>
            </div>
            <div className="flex items-center space-x-1.5">
              <button
                type="button"
                onClick={() => handleWeightChange(Math.max(35, (userProfile.weight || 65) - 1))}
                className="w-7 h-7 rounded-lg bg-white dark:bg-white/10 text-slate-700 dark:text-white flex items-center justify-center font-bold text-sm shadow-sm active:scale-90"
              >
                -
              </button>
              <input
                type="range"
                min="35"
                max="130"
                step="1"
                value={userProfile.weight || 65}
                onChange={(e) => handleWeightChange(e.target.value)}
                className="w-full accent-cyan-500 cursor-pointer h-1.5 bg-slate-200 dark:bg-white/10 rounded-lg"
              />
              <button
                type="button"
                onClick={() => handleWeightChange(Math.min(150, (userProfile.weight || 65) + 1))}
                className="w-7 h-7 rounded-lg bg-white dark:bg-white/10 text-slate-700 dark:text-white flex items-center justify-center font-bold text-sm shadow-sm active:scale-90"
              >
                +
              </button>
            </div>
          </div>

          {/* Chiều Cao (cm) */}
          <div className="p-3.5 rounded-2xl bg-slate-100/80 dark:bg-white/5 border border-slate-200/80 dark:border-white/10 space-y-2.5">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-slate-700 dark:text-gray-300">Chiều Cao</span>
              <span className="font-mono font-black text-emerald-600 dark:text-emerald-400 text-sm">{userProfile.height || 170} <span className="text-[10px] font-normal text-slate-400">cm</span></span>
            </div>
            <div className="flex items-center space-x-1.5">
              <button
                type="button"
                onClick={() => handleHeightChange(Math.max(130, (userProfile.height || 170) - 1))}
                className="w-7 h-7 rounded-lg bg-white dark:bg-white/10 text-slate-700 dark:text-white flex items-center justify-center font-bold text-sm shadow-sm active:scale-90"
              >
                -
              </button>
              <input
                type="range"
                min="130"
                max="210"
                step="1"
                value={userProfile.height || 170}
                onChange={(e) => handleHeightChange(e.target.value)}
                className="w-full accent-emerald-500 cursor-pointer h-1.5 bg-slate-200 dark:bg-white/10 rounded-lg"
              />
              <button
                type="button"
                onClick={() => handleHeightChange(Math.min(220, (userProfile.height || 170) + 1))}
                className="w-7 h-7 rounded-lg bg-white dark:bg-white/10 text-slate-700 dark:text-white flex items-center justify-center font-bold text-sm shadow-sm active:scale-90"
              >
                +
              </button>
            </div>
          </div>
        </div>

        {/* Live Metrics Feedback Card */}
        <div className="p-3.5 rounded-2xl bg-gradient-to-r from-cyan-500/10 via-emerald-500/10 to-teal-500/10 border border-cyan-500/20 flex items-center justify-between text-xs">
          <div className="space-y-0.5 min-w-0 flex-1 pr-2">
            <div className="font-bold text-slate-900 dark:text-white flex items-center space-x-1.5">
              <span>🔥 Tốc độ đốt:</span>
              <span className="font-mono text-cyan-600 dark:text-cyan-neon font-black">~{calPerMin} kcal / phút</span>
            </div>
            <p className="text-[10px] text-slate-500 dark:text-gray-400 leading-tight">{bmiInfo.desc}</p>
          </div>
          <div className="text-right shrink-0">
            <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-white dark:bg-white/10 border border-slate-200 dark:border-white/10 text-slate-600 dark:text-gray-300">
              ACSM MET 4.3
            </span>
          </div>
        </div>
      </div>

      {/* SECTION 4: CẤU HÌNH GOOGLE GEMINI API KEY */}
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
              : 'bg-red-50 dark:bg-red-950/40 border-red-300 dark:border-red-500/30 text-red-800 dark:text-red-300'
          }`}>
            {testResult.success ? (
              <CheckCircle2 size={16} className="shrink-0 mt-0.5 text-emerald-500" />
            ) : (
              <AlertCircle size={16} className="shrink-0 mt-0.5 text-red-500" />
            )}
            <div className="flex-1">
              <p className="font-bold">{testResult.success ? "Kết nối thành công" : "Lỗi xác thực"}</p>
              <p className="mt-0.5 text-[11px] opacity-90 leading-relaxed">{testResult.message}</p>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex space-x-2 pt-1">
          <button
            type="button"
            onClick={handleTestKey}
            disabled={testingKey || !settings.apiKey}
            className="flex-1 py-3 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-800 dark:bg-white/10 dark:hover:bg-white/20 dark:text-white font-bold text-xs flex items-center justify-center space-x-1.5 transition-all active:scale-95 disabled:opacity-50"
          >
            {testingKey ? (
              <>
                <div className="w-3.5 h-3.5 border-2 border-slate-600 dark:border-white border-t-transparent rounded-full animate-spin" />
                <span>Đang kiểm tra...</span>
              </>
            ) : (
              <>
                <Sparkles size={14} className="text-cyan-600 dark:text-cyan-neon" />
                <span>Kiểm Tra Kết Nối</span>
              </>
            )}
          </button>

          <a
            href="https://aistudio.google.com/app/apikey"
            target="_blank"
            rel="noreferrer"
            className="px-4 py-3 rounded-xl bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-600 dark:text-cyan-neon border border-cyan-500/20 font-bold text-xs flex items-center space-x-1 transition-all active:scale-95 shrink-0"
          >
            <span>Lấy Key Miễn Phí</span>
            <ExternalLink size={12} />
          </a>
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

            {/* Action Buttons */}
            <div className="pt-2 flex space-x-2">
              <button
                onClick={handleCancelDownload}
                className="flex-1 py-3 rounded-2xl bg-slate-100 hover:bg-slate-200 dark:bg-white/10 dark:hover:bg-white/20 text-slate-700 dark:text-gray-300 font-bold text-xs active:scale-95 transition-all"
              >
                {downloadFinished ? "Đóng" : "Hủy"}
              </button>

              {downloadError && updateInfo?.ipaDownloadUrl && (
                <button
                  onClick={() => {
                    window.open(updateInfo.ipaDownloadUrl, '_blank');
                    handleCancelDownload();
                  }}
                  className="flex-1 py-3 rounded-2xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-black text-xs active:scale-95 transition-all flex items-center justify-center space-x-1"
                >
                  <ExternalLink size={12} />
                  <span>Mở Safari Tải</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Settings;
