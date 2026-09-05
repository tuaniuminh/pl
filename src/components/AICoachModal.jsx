import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { 
  Sparkles, 
  Brain, 
  Activity, 
  Check, 
  Copy, 
  ExternalLink, 
  X, 
  Flame, 
  ShieldAlert, 
  RefreshCw, 
  Trophy, 
  ClipboardPaste, 
  AlertCircle, 
  Zap,
  Quote,
  ShieldCheck,
  HeartPulse
} from 'lucide-react';
import { 
  buildPerformanceAnalysisPrompt, 
  analyzeWorkoutPerformance 
} from '../services/geminiService';
import { 
  getLastAICoachAdvice, 
  saveLastAICoachAdvice, 
  getWorkoutHistorySummaryForAI, 
  getUserProfile 
} from '../services/storageService';
import { triggerHapticSuccess, triggerHapticMedium } from '../utils/hapticsUtils';

const AICoachModal = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState('api'); // 'api' | 'bridge'
  const [loading, setLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState(0);
  const [error, setError] = useState(null);
  const [advice, setAdvice] = useState(null);
  const [isPromptCopied, setIsPromptCopied] = useState(false);
  const [pasteInputText, setPasteInputText] = useState('');
  const [historySummary, setHistorySummary] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [apiKey, setApiKey] = useState('');

  // Tải dữ liệu hồ sơ và bài nhận xét đã lưu khi mở modal
  useEffect(() => {
    if (isOpen) {
      const summary = getWorkoutHistorySummaryForAI();
      const profile = getUserProfile();
      setHistorySummary(summary);
      setUserProfile(profile);

      const savedAdvice = getLastAICoachAdvice();
      if (savedAdvice) {
        setAdvice(savedAdvice);
      }

      // Lấy Gemini API Key nếu đã lưu trong cài đặt
      const storedSettings = localStorage.getItem('plank_settings_v2');
      let foundKey = '';
      if (storedSettings) {
        try {
          const parsed = JSON.parse(storedSettings);
          if (parsed.geminiApiKey) {
            foundKey = parsed.geminiApiKey.trim();
            setApiKey(foundKey);
          }
        } catch (e) {
          console.error("Parse settings error:", e);
        }
      }

      // Nếu chưa có API Key, ưu tiên mở ngay tab 'bridge' (Cầu Nối Miễn Phí)
      if (!foundKey) {
        setActiveTab('bridge');
      } else {
        setActiveTab('api');
      }
      setError(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  // Xử lý gọi phân tích phong độ bằng Gemini API
  const handleAnalyzePerformance = async () => {
    if (!apiKey) {
      setActiveTab('bridge');
      setError(null);
      return;
    }

    setLoading(true);
    setError(null);
    setLoadingStep(1);

    const stepTimer1 = setTimeout(() => setLoadingStep(2), 1200);
    const stepTimer2 = setTimeout(() => setLoadingStep(3), 2400);

    try {
      const result = await analyzeWorkoutPerformance(apiKey, userProfile, historySummary);
      setAdvice(result);
      saveLastAICoachAdvice(result);
      triggerHapticSuccess();
    } catch (err) {
      console.error("AI Analysis error:", err);
      setError(err.message || "Không thể kết nối với máy chủ AI. Vui lòng thử lại hoặc dùng tab Cầu Nối.");
    } finally {
      clearTimeout(stepTimer1);
      clearTimeout(stepTimer2);
      setLoading(false);
      setLoadingStep(0);
    }
  };

  // Sao chép Prompt đầy đủ kèm lịch sử tập để mở app ngoài
  const handleCopyPrompt = async () => {
    try {
      const promptText = buildPerformanceAnalysisPrompt(userProfile, historySummary);
      await navigator.clipboard.writeText(promptText);
      setIsPromptCopied(true);
      triggerHapticSuccess();
      setTimeout(() => setIsPromptCopied(false), 3000);
    } catch (e) {
      console.error("Copy prompt error:", e);
    }
  };

  // Dán câu trả lời từ bên ngoài vào app để lưu trữ
  const handleSavePastedAdvice = () => {
    if (!pasteInputText.trim()) return;

    try {
      let parsed = null;
      try {
        parsed = JSON.parse(pasteInputText);
      } catch {
        // Nếu là text thường, tự format thành object nhận xét
        parsed = {
          evaluation: pasteInputText.trim(),
          strengthsAndWeaknesses: "Được trích xuất từ câu trả lời của AI",
          formAndBreathing: "Xem chi tiết trong phần nhận xét phía trên.",
          injuryPrevention: "Luôn duy trì form lưng thẳng và hạ gối khi mỏi.",
          nutritionAndRecovery: "Nghỉ ngơi và bổ sung đủ nước, protein sau tập.",
          motivationalQuote: "Kiên trì hôm nay là thành công của ngày mai!",
          analyzedAt: new Date().toISOString()
        };
      }

      if (parsed) {
        const fullAdvice = {
          evaluation: parsed.evaluation || pasteInputText,
          strengthsAndWeaknesses: parsed.strengthsAndWeaknesses || "Đã phân tích thể trạng",
          formAndBreathing: parsed.formAndBreathing || "Giữ vững kỹ thuật Hollow Body",
          injuryPrevention: parsed.injuryPrevention || "Không để võng thắt lưng",
          nutritionAndRecovery: parsed.nutritionAndRecovery || "Hồi phục cơ bắp chu đáo",
          motivationalQuote: parsed.motivationalQuote || "Bứt phá giới hạn bản thân!",
          analyzedAt: new Date().toISOString()
        };
        setAdvice(fullAdvice);
        saveLastAICoachAdvice(fullAdvice);
        setPasteInputText('');
        setActiveTab('api');
        triggerHapticSuccess();
      }
    } catch (e) {
      setError("Không thể đọc định dạng văn bản này.");
    }
  };

  const formattedDate = advice?.analyzedAt 
    ? new Date(advice.analyzedAt).toLocaleDateString('vi-VN', {
        day: '2-digit',
        month: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
      })
    : null;

  return createPortal(
    <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-[999] flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-fade-in">
      <div className="glass-panel max-w-md w-full my-auto rounded-3xl bg-white dark:bg-oled border border-purple-400/40 dark:border-purple-500/30 shadow-2xl flex flex-col max-h-[92vh] overflow-hidden">
        
        {/* MODAL HEADER */}
        <div className="bg-gradient-to-r from-purple-600 via-indigo-600 to-cyan-600 text-white p-4 sm:p-5 relative shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2.5">
              <div className="w-10 h-10 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center shadow-inner text-white">
                <Brain size={22} className="animate-pulse" />
              </div>
              <div>
                <div className="flex items-center space-x-1.5">
                  <h3 className="font-black text-sm sm:text-base tracking-wide">
                    Huấn Luyện Viên AI Tư Vấn
                  </h3>
                  <span className="px-2 py-0.5 rounded-full bg-white/20 text-[9px] font-black uppercase tracking-wider">
                    PRO
                  </span>
                </div>
                <p className="text-[11px] text-purple-100 font-medium">
                  Chẩn đoán phong độ thực tế & Tư vấn cơ Core
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-black/20 hover:bg-black/30 flex items-center justify-center text-white/80 hover:text-white transition-colors"
            >
              <X size={16} />
            </button>
          </div>

          {/* QUICK METRICS PILLS */}
          {historySummary && userProfile && (
            <div className="mt-3.5 pt-3 border-t border-white/15 grid grid-cols-2 gap-1.5 text-[10px] font-bold text-purple-100">
              <span className="px-2.5 py-1.5 rounded-xl bg-black/20 text-center truncate">
                {userProfile.gender === 'female' ? '👩 Nữ' : '👨 Nam'} • {historySummary.height}cm • {historySummary.weight}kg
              </span>
              <span className="px-2.5 py-1.5 rounded-xl bg-white/20 text-white font-extrabold flex items-center justify-center space-x-1">
                <Trophy size={11} className="text-amber-300 shrink-0" />
                <span>Kỷ lục PR: {historySummary.personalRecord}s</span>
              </span>
              <span className="px-2.5 py-1 rounded-xl bg-black/20 col-span-2 text-center text-[10px]">
                📊 Đã tập: <strong>{historySummary.totalWorkouts} buổi</strong> • <strong>{historySummary.totalMinutes}p</strong> tích lũy (BMI {historySummary.bmi})
              </span>
            </div>
          )}
        </div>

        {/* TAB NAVIGATION */}
        <div className="p-3 border-b border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 flex space-x-2 shrink-0">
          <button
            onClick={() => { setActiveTab('api'); setError(null); triggerHapticMedium(); }}
            className={`flex-1 py-2 rounded-2xl font-black text-xs flex items-center justify-center space-x-1.5 transition-all ${
              activeTab === 'api'
                ? 'bg-purple-600 text-white shadow-md shadow-purple-600/30'
                : 'text-slate-600 dark:text-gray-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Zap size={14} />
            <span>Tư Vấn Tự Động (API)</span>
          </button>
          <button
            onClick={() => { setActiveTab('bridge'); setError(null); triggerHapticMedium(); }}
            className={`flex-1 py-2 rounded-2xl font-black text-xs flex items-center justify-center space-x-1.5 transition-all ${
              activeTab === 'bridge'
                ? 'bg-purple-600 text-white shadow-md shadow-purple-600/30'
                : 'text-slate-600 dark:text-gray-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <ExternalLink size={13} />
            <span>Cầu Nối Miễn Phí</span>
          </button>
        </div>

        {/* MODAL CONTENT BODY */}
        <div className="p-4 overflow-y-auto space-y-4 flex-1 overscroll-contain">
          {/* TAB 1: API DIRECT CALL & RESULTS */}
          {activeTab === 'api' && (
            <div className="space-y-4">
              {error && (
                <div className="p-3.5 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-300 dark:border-rose-500/30 text-rose-700 dark:text-rose-400 text-xs flex items-start space-x-2 animate-fade-in">
                  <AlertCircle size={16} className="shrink-0 mt-0.5" />
                  <span className="text-[11px] leading-relaxed">{error}</span>
                </div>
              )}

              {!apiKey ? (
                <div className="p-4 rounded-3xl bg-purple-50/70 dark:bg-purple-950/30 border border-purple-300/50 dark:border-purple-500/30 text-center space-y-2.5">
                  <div className="w-10 h-10 rounded-2xl bg-purple-100 dark:bg-purple-900/40 text-purple-600 dark:text-purple-300 flex items-center justify-center mx-auto">
                    <Sparkles size={20} />
                  </div>
                  <div className="space-y-1">
                    <h4 className="text-xs font-black text-slate-900 dark:text-white">
                      Cần Gemini API Key Để Gọi 1-Chạm
                    </h4>
                    <p className="text-[11px] text-slate-500 dark:text-gray-400 leading-relaxed">
                      Để phân tích tự động ngay trong ứng dụng, bạn có thể cài API Key miễn phí của Google trong mục <strong>Cài Đặt</strong>.
                    </p>
                  </div>
                  <div className="pt-1">
                    <button
                      onClick={() => { setActiveTab('bridge'); setError(null); triggerHapticMedium(); }}
                      className="w-full py-2.5 px-3 rounded-2xl bg-purple-600 hover:bg-purple-700 text-white font-black text-xs shadow-md shadow-purple-600/20 active:scale-95 transition-all flex items-center justify-center space-x-1.5"
                    >
                      <span>Dùng Cầu Nối Miễn Phí (Không cần Key)</span>
                      <ExternalLink size={13} />
                    </button>
                  </div>
                </div>
              ) : (
                /* Action Bar / Trigger Button */
                <div className="flex items-center space-x-2">
                  <button
                    onClick={handleAnalyzePerformance}
                    disabled={loading}
                    className={`flex-1 py-3 px-4 rounded-2xl font-black text-xs uppercase tracking-wider flex items-center justify-center space-x-2 shadow-md active:scale-95 transition-all ${
                      loading
                        ? 'bg-slate-300 dark:bg-white/20 text-slate-500 cursor-not-allowed'
                        : 'bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white shadow-purple-600/30'
                    }`}
                  >
                    <Sparkles size={16} className={loading ? "animate-spin" : "animate-pulse"} />
                    <span>
                      {loading 
                        ? "HLV Đang Phân Tích Dữ Liệu..." 
                        : (advice ? "Phân Tích Lại Phong Độ ⚡" : "Bắt Đầu Nhận Xét & Tư Vấn ⚡")}
                    </span>
                  </button>
                </div>
              )}

              {/* Loading steps animation */}
              {loading && (
                <div className="p-5 rounded-3xl bg-purple-50/60 dark:bg-purple-950/20 border border-purple-300/40 dark:border-purple-500/20 text-center space-y-3 animate-pulse">
                  <div className="w-12 h-12 rounded-full bg-purple-600 text-white flex items-center justify-center mx-auto shadow-lg shadow-purple-600/40">
                    <Activity size={24} className="animate-bounce" />
                  </div>
                  <div className="space-y-1">
                    <p className="font-black text-xs text-purple-900 dark:text-purple-200">
                      {loadingStep === 1 && "1/3. Đang đọc nhật ký các buổi tập & kỷ lục..."}
                      {loadingStep === 2 && "2/3. Đang chẩn đoán sức bền cơ Core & tư thế..."}
                      {loadingStep === 3 && "3/3. Đang hoàn thiện chiến lược thở & dinh dưỡng..."}
                    </p>
                    <p className="text-[10px] text-slate-500 dark:text-gray-400">
                      AI đang may đo nhận xét theo đúng thể trạng của bạn
                    </p>
                  </div>
                </div>
              )}

              {/* Display Advice Cards if available */}
              {!loading && advice && (
                <div className="space-y-3.5 animate-fade-in">
                  {formattedDate && (
                    <div className="text-[10px] font-bold text-slate-400 dark:text-gray-500 flex items-center justify-between px-1">
                      <span>Bản tư vấn HLV gần nhất</span>
                      <span>{formattedDate}</span>
                    </div>
                  )}

                  {/* 1. Evaluation Card */}
                  {advice.evaluation && (
                    <div className="glass-panel p-4 rounded-3xl border border-purple-300/60 dark:border-purple-500/30 bg-purple-50/30 dark:bg-purple-950/20 space-y-1.5 shadow-sm">
                      <div className="flex items-center space-x-2 text-purple-700 dark:text-purple-300 font-black text-xs uppercase tracking-wide">
                        <Activity size={14} className="text-purple-600 dark:text-purple-400 shrink-0" />
                        <span>Chẩn Đoán Phong Độ & Sức Bền</span>
                      </div>
                      <p className="text-xs text-slate-700 dark:text-gray-200 leading-relaxed text-justify">
                        {advice.evaluation}
                      </p>
                    </div>
                  )}

                  {/* 2. Strengths & Bottlenecks Card */}
                  {advice.strengthsAndWeaknesses && (
                    <div className="glass-panel p-4 rounded-3xl border border-cyan-300/60 dark:border-cyan-500/30 bg-cyan-50/30 dark:bg-cyan-950/20 space-y-1.5 shadow-sm">
                      <div className="flex items-center space-x-2 text-cyan-700 dark:text-cyan-300 font-black text-xs uppercase tracking-wide">
                        <Zap size={14} className="text-cyan-600 dark:text-cyan-neon shrink-0" />
                        <span>Điểm Mạnh & Điểm Nghẽn Thể Lực</span>
                      </div>
                      <p className="text-xs text-slate-700 dark:text-gray-200 leading-relaxed text-justify">
                        {advice.strengthsAndWeaknesses}
                      </p>
                    </div>
                  )}

                  {/* 3. Form & Breathing Strategy */}
                  {advice.formAndBreathing && (
                    <div className="glass-panel p-4 rounded-3xl border border-emerald-300/60 dark:border-emerald-500/30 bg-emerald-50/30 dark:bg-emerald-950/20 space-y-1.5 shadow-sm">
                      <div className="flex items-center space-x-2 text-emerald-700 dark:text-emerald-300 font-black text-xs uppercase tracking-wide">
                        <HeartPulse size={14} className="text-emerald-600 dark:text-neon shrink-0" />
                        <span>Kỹ Thuật Hollow Body & Nhịp Thở</span>
                      </div>
                      <p className="text-xs text-slate-700 dark:text-gray-200 leading-relaxed text-justify">
                        {advice.formAndBreathing}
                      </p>
                    </div>
                  )}

                  {/* 4. Injury Prevention & Posture Warning */}
                  {advice.injuryPrevention && (
                    <div className="glass-panel p-4 rounded-3xl border border-amber-300/60 dark:border-amber-500/30 bg-amber-50/30 dark:bg-amber-950/20 space-y-1.5 shadow-sm">
                      <div className="flex items-center space-x-2 text-amber-700 dark:text-amber-300 font-black text-xs uppercase tracking-wide">
                        <ShieldAlert size={14} className="text-amber-500 shrink-0" />
                        <span>Cảnh Báo An Toàn & Phòng Chấn Thương</span>
                      </div>
                      <p className="text-xs text-slate-700 dark:text-gray-200 leading-relaxed text-justify">
                        {advice.injuryPrevention}
                      </p>
                    </div>
                  )}

                  {/* 5. Nutrition & Recovery */}
                  {advice.nutritionAndRecovery && (
                    <div className="glass-panel p-4 rounded-3xl border border-indigo-300/60 dark:border-indigo-500/30 bg-indigo-50/30 dark:bg-indigo-950/20 space-y-1.5 shadow-sm">
                      <div className="flex items-center space-x-2 text-indigo-700 dark:text-indigo-300 font-black text-xs uppercase tracking-wide">
                        <ShieldCheck size={14} className="text-indigo-600 dark:text-indigo-400 shrink-0" />
                        <span>Dinh Dưỡng, Giảm Mỡ & Hồi Phục</span>
                      </div>
                      <p className="text-xs text-slate-700 dark:text-gray-200 leading-relaxed text-justify">
                        {advice.nutritionAndRecovery}
                      </p>
                    </div>
                  )}

                  {/* 6. Motivational Quote */}
                  {advice.motivationalQuote && (
                    <div className="p-3.5 rounded-2xl bg-gradient-to-r from-amber-500/15 via-orange-500/10 to-amber-500/15 border border-amber-400/40 text-center space-y-1">
                      <Quote size={18} className="mx-auto text-amber-500 opacity-70" />
                      <p className="font-extrabold text-xs text-amber-800 dark:text-amber-200 italic">
                        "{advice.motivationalQuote}"
                      </p>
                      <span className="text-[9px] font-bold uppercase tracking-wider text-amber-600/80">
                        — Lời nhắn từ Huấn Luyện Viên
                      </span>
                    </div>
                  )}
                </div>
              )}

              {!loading && !advice && !error && (
                <div className="p-6 rounded-3xl border border-dashed border-slate-300 dark:border-white/10 text-center space-y-2.5">
                  <Brain size={32} className="mx-auto text-purple-500 opacity-60" />
                  <p className="font-extrabold text-xs text-slate-800 dark:text-white">
                    Chưa có bài nhận xét phong độ nào
                  </p>
                  <p className="text-[11px] text-slate-500 dark:text-gray-400 max-w-xs mx-auto">
                    Bấm nút <strong>"Bắt Đầu Nhận Xét & Tư Vấn ⚡"</strong> ở trên để Huấn luyện viên AI phân tích toàn bộ lịch sử tập luyện của bạn!
                  </p>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: MASTER PROMPT BRIDGE (FREE 100%) */}
          {activeTab === 'bridge' && (
            <div className="space-y-4">
              {/* Step 1: Copy Master Prompt */}
              <div className="glass-panel p-4 rounded-3xl border border-purple-400/40 dark:border-purple-500/20 bg-gradient-to-br from-purple-50/50 to-indigo-50/50 dark:from-purple-950/20 dark:to-indigo-950/20 space-y-2.5">
                <div className="flex items-center space-x-2">
                  <span className="w-5 h-5 rounded-full bg-purple-600 text-white text-[10px] font-black flex items-center justify-center shadow-sm">
                    1
                  </span>
                  <h4 className="text-xs font-black text-slate-900 dark:text-white">
                    Sao Chép Báo Cáo Thể Lực & Câu Lệnh HLV
                  </h4>
                </div>
                <p className="text-[11px] text-slate-600 dark:text-gray-300">
                  Hệ thống tự động đóng gói toàn bộ thống kê <strong>{historySummary?.totalWorkouts || 0} buổi tập</strong>, kỷ lục <strong>{userProfile?.record || 60}s</strong> và các buổi tập gần đây để AI đọc:
                </p>

                <div className="flex space-x-2 pt-1">
                  <button
                    onClick={handleCopyPrompt}
                    className={`flex-1 py-3 px-3 rounded-2xl font-black text-xs flex items-center justify-center space-x-1.5 shadow-md active:scale-95 transition-all ${
                      isPromptCopied 
                        ? 'bg-emerald-600 text-white shadow-emerald-600/30' 
                        : 'bg-purple-600 hover:bg-purple-700 text-white shadow-purple-600/20'
                    }`}
                  >
                    {isPromptCopied ? <Check size={15} className="animate-bounce" /> : <Copy size={14} />}
                    <span>{isPromptCopied ? "✓ Đã Sao Chép Báo Cáo!" : "1. Sao Chép Báo Cáo Thể Lực"}</span>
                  </button>
                </div>
              </div>

              {/* Step 2: Open External AI */}
              <div className="glass-panel p-4 rounded-3xl border border-cyan-400/40 dark:border-cyan-500/20 bg-gradient-to-br from-cyan-50/50 to-blue-50/50 dark:from-cyan-950/20 dark:to-blue-950/20 space-y-2.5">
                <div className="flex items-center space-x-2">
                  <span className="w-5 h-5 rounded-full bg-cyan-600 text-white text-[10px] font-black flex items-center justify-center shadow-sm">
                    2
                  </span>
                  <h4 className="text-xs font-black text-slate-900 dark:text-white">
                    Mở Ứng Dụng AI & Dán Vào Trò Chuyện
                  </h4>
                </div>
                <p className="text-[11px] text-slate-600 dark:text-gray-300">
                  Mở Gemini hoặc ChatGPT, bấm Dán (Paste) để AI phân tích và bạn có thể hỏi đáp thêm:
                </p>

                <div className="grid grid-cols-2 gap-2 pt-1">
                  <a
                    href="https://gemini.google.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="py-2.5 px-3 rounded-2xl bg-purple-100 hover:bg-purple-200 dark:bg-purple-950/60 dark:hover:bg-purple-900/60 text-purple-700 dark:text-purple-300 font-extrabold text-xs flex items-center justify-center space-x-1.5 active:scale-95 transition-all border border-purple-300/40 dark:border-purple-500/30"
                  >
                    <ExternalLink size={12} />
                    <span>Mở Google Gemini</span>
                  </a>
                  <a
                    href="https://chatgpt.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="py-2.5 px-3 rounded-2xl bg-emerald-100 hover:bg-emerald-200 dark:bg-emerald-950/60 dark:hover:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300 font-extrabold text-xs flex items-center justify-center space-x-1.5 active:scale-95 transition-all border border-emerald-300/40 dark:border-emerald-500/30"
                  >
                    <ExternalLink size={12} />
                    <span>Mở ChatGPT</span>
                  </a>
                </div>
              </div>

              {/* Step 3: Paste Back to Save (Optional) */}
              <div className="glass-panel p-4 rounded-3xl border border-slate-200 dark:border-white/10 space-y-2.5">
                <div className="flex items-center space-x-2">
                  <span className="w-5 h-5 rounded-full bg-slate-600 text-white text-[10px] font-black flex items-center justify-center shadow-sm">
                    3
                  </span>
                  <h4 className="text-xs font-black text-slate-900 dark:text-white">
                    Lưu Lại Bản Tư Vấn Vào App (Tùy Chọn)
                  </h4>
                </div>
                <p className="text-[11px] text-slate-600 dark:text-gray-300">
                  Sau khi nhận câu trả lời từ AI, bạn có thể sao chép và dán vào đây để app lưu trữ:
                </p>

                <textarea
                  value={pasteInputText}
                  onChange={(e) => setPasteInputText(e.target.value)}
                  placeholder="Dán câu trả lời hoặc phân tích của AI vào đây..."
                  rows={3}
                  className="w-full bg-white dark:bg-black/40 border border-slate-300 dark:border-white/10 rounded-2xl p-3 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-purple-500 resize-none font-sans"
                />

                <button
                  onClick={handleSavePastedAdvice}
                  disabled={!pasteInputText.trim()}
                  className={`w-full py-2.5 rounded-2xl font-black text-xs uppercase tracking-wider flex items-center justify-center space-x-1.5 transition-all ${
                    pasteInputText.trim()
                      ? 'bg-purple-600 text-white shadow-md active:scale-95'
                      : 'bg-slate-200 dark:bg-white/10 text-slate-400 cursor-not-allowed'
                  }`}
                >
                  <Check size={14} />
                  <span>Lưu Bản Nhận Xét Vào Máy</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* MODAL FOOTER */}
        <div className="p-3 sm:p-4 border-t border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 flex items-center justify-end shrink-0">
          <button
            onClick={onClose}
            className="w-full py-3 rounded-2xl bg-slate-200 hover:bg-slate-300 dark:bg-white/10 dark:hover:bg-white/20 text-slate-800 dark:text-white font-extrabold text-xs uppercase tracking-wider active:scale-95 transition-all"
          >
            Đóng
          </button>
        </div>

      </div>
    </div>,
    document.body
  );
};

export default AICoachModal;
