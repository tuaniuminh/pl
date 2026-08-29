import React, { useState, useEffect, useRef } from 'react';
import CircularProgress from './UI/CircularProgress';
import { unlockSpeechAPI, speakText, playBeep } from '../utils/speechUtils';
import { saveHistory } from '../services/storageService';
import { 
  Play, 
  Pause, 
  RotateCcw, 
  SkipForward, 
  Trophy, 
  Plus, 
  Minus, 
  Sparkles,
  Info,
  ChevronLeft,
  ChevronRight,
  X,
  ShieldCheck,
  Flame,
  Activity
} from 'lucide-react';

const Timer = ({ plan, onOpenAIPlan, voiceEnabled = true }) => {
  const [exercises, setExercises] = useState(() => {
    if (plan && plan.days && plan.days[0]?.exercises?.length > 0) {
      return plan.days[0].exercises;
    }
    return [
      { name: "Plank Khuỷu Tay Chuẩn", holdTime: 60, restTime: 30, tip: "Siết chặt cơ mông và cơ bụng, hít thở đều đặn" }
    ];
  });

  const [currentSetIndex, setCurrentSetIndex] = useState(0);
  const [isActive, setIsActive] = useState(false);
  const [isResting, setIsResting] = useState(false);
  const [timeLeft, setTimeLeft] = useState(60);
  const [totalSetDuration, setTotalSetDuration] = useState(60);
  const [sessionTotalHoldSeconds, setSessionTotalHoldSeconds] = useState(0);
  const [showCelebration, setShowCelebration] = useState(false);
  const [completedSessionData, setCompletedSessionData] = useState(null);
  const [showInfoModal, setShowInfoModal] = useState(false);

  // Touch swipe handling
  const touchStartX = useRef(null);
  const touchEndX = useRef(null);

  const currentExercise = exercises[currentSetIndex] || exercises[0];

  // Dừng ngay giọng nói nếu người dùng bấm tắt âm thanh
  useEffect(() => {
    if (!voiceEnabled && typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
  }, [voiceEnabled]);

  useEffect(() => {
    if (plan && plan.days && plan.days[0]?.exercises?.length > 0) {
      const exs = plan.days[0].exercises;
      setExercises(exs);
      setCurrentSetIndex(0);
      setIsActive(false);
      setIsResting(false);
      setTimeLeft(exs[0].holdTime);
      setTotalSetDuration(exs[0].holdTime);
      setSessionTotalHoldSeconds(0);
    }
  }, [plan]);

  useEffect(() => {
    if (!isActive) {
      const targetTime = isResting ? (currentExercise.restTime || 20) : currentExercise.holdTime;
      setTimeLeft(targetTime);
      setTotalSetDuration(targetTime);
    }
  }, [currentExercise, isResting]);

  useEffect(() => {
    let interval = null;

    if (isActive && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((prev) => {
          if (!isResting) {
            setSessionTotalHoldSeconds(s => s + 1);
          }

          if (voiceEnabled) {
            if (!isResting) {
              if (prev === 6) { speakText("Năm", { enabled: voiceEnabled }); playBeep(523, 100, { enabled: voiceEnabled }); }
              if (prev === 5) { speakText("Bốn", { enabled: voiceEnabled }); playBeep(587, 100, { enabled: voiceEnabled }); }
              if (prev === 4) { speakText("Ba", { enabled: voiceEnabled }); playBeep(659, 100, { enabled: voiceEnabled }); }
              if (prev === 3) { speakText("Hai", { enabled: voiceEnabled }); playBeep(698, 100, { enabled: voiceEnabled }); }
              if (prev === 2) { speakText("Một", { enabled: voiceEnabled }); playBeep(784, 150, { enabled: voiceEnabled }); }
            } else {
              if (prev === 4) speakText("Chuẩn bị", { enabled: voiceEnabled });
              if (prev === 3) playBeep(440, 80, { enabled: voiceEnabled });
              if (prev === 2) playBeep(554, 80, { enabled: voiceEnabled });
            }
          }

          return prev - 1;
        });
      }, 1000);
    } else if (isActive && timeLeft === 0) {
      handleSetFinished();
    }

    return () => clearInterval(interval);
  }, [isActive, timeLeft, isResting, voiceEnabled]);

  const handleSetFinished = () => {
    if (voiceEnabled) playBeep(880, 400, { enabled: voiceEnabled });

    if (!isResting && (currentExercise.restTime > 0) && (currentSetIndex < exercises.length - 1)) {
      setIsResting(true);
      const restSec = currentExercise.restTime || 25;
      setTimeLeft(restSec);
      setTotalSetDuration(restSec);
      if (voiceEnabled) speakText(`Tuyệt vời! Nghỉ ngơi ${restSec} giây.`, { enabled: voiceEnabled });
    } else if (currentSetIndex < exercises.length - 1) {
      setIsResting(false);
      const nextIdx = currentSetIndex + 1;
      setCurrentSetIndex(nextIdx);
      const nextEx = exercises[nextIdx];
      setTimeLeft(nextEx.holdTime);
      setTotalSetDuration(nextEx.holdTime);
      if (voiceEnabled) speakText(`Bắt đầu hiệp ${nextIdx + 1}: ${nextEx.name}`, { enabled: voiceEnabled });
    } else {
      setIsActive(false);
      setIsResting(false);
      if (voiceEnabled) speakText("Xuất sắc! Bạn đã hoàn thành xuất sắc toàn bộ bài tập!", { enabled: voiceEnabled });
      
      const totalHold = sessionTotalHoldSeconds + currentExercise.holdTime;
      const sessionResult = {
        planName: plan?.planName || "Plank Tự Do",
        duration: totalHold,
        completedSets: exercises.length,
        totalSets: exercises.length
      };

      saveHistory(sessionResult);
      setCompletedSessionData(sessionResult);
      setShowCelebration(true);
    }
  };

  const handleToggleTimer = () => {
    unlockSpeechAPI();
    if (!isActive && voiceEnabled) {
      if (isResting) {
        speakText("Tiếp tục nghỉ", { enabled: voiceEnabled });
      } else {
        speakText(`Bắt đầu. ${currentExercise.name}`, { enabled: voiceEnabled });
      }
    }
    setIsActive(!isActive);
  };

  const handleResetTimer = () => {
    setIsActive(false);
    setIsResting(false);
    setCurrentSetIndex(0);
    const firstHold = exercises[0].holdTime;
    setTimeLeft(firstHold);
    setTotalSetDuration(firstHold);
    setSessionTotalHoldSeconds(0);
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
  };

  const handleSkipSet = () => {
    if (currentSetIndex < exercises.length - 1) {
      setIsResting(false);
      const nextIdx = currentSetIndex + 1;
      setCurrentSetIndex(nextIdx);
      setTimeLeft(exercises[nextIdx].holdTime);
      setTotalSetDuration(exercises[nextIdx].holdTime);
      if (voiceEnabled) speakText(`Chuyển sang ${exercises[nextIdx].name}`, { enabled: voiceEnabled });
    } else {
      handleSetFinished();
    }
  };

  // Switch to specific set when browsing
  const handleSelectSet = (idx) => {
    if (isActive) return; // Không đổi khi đang chạy bài tập
    if (idx >= 0 && idx < exercises.length) {
      setIsResting(false);
      setCurrentSetIndex(idx);
      setTimeLeft(exercises[idx].holdTime);
      setTotalSetDuration(exercises[idx].holdTime);
    }
  };

  // Swipe handling
  const handleTouchStart = (e) => {
    if (isActive) return;
    touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchMove = (e) => {
    if (isActive) return;
    touchEndX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = () => {
    if (isActive || !touchStartX.current || !touchEndX.current) return;
    const distance = touchStartX.current - touchEndX.current;
    const minSwipeDistance = 50;

    if (distance > minSwipeDistance) {
      // Vuốt sang trái -> Xem hiệp kế tiếp
      if (currentSetIndex < exercises.length - 1) {
        handleSelectSet(currentSetIndex + 1);
      }
    } else if (distance < -minSwipeDistance) {
      // Vuốt sang phải -> Xem hiệp trước đó
      if (currentSetIndex > 0) {
        handleSelectSet(currentSetIndex - 1);
      }
    }

    touchStartX.current = null;
    touchEndX.current = null;
  };

  const handleAdjustTime = (delta) => {
    setTimeLeft(t => Math.max(5, t + delta));
    setTotalSetDuration(d => Math.max(5, d + delta));
  };

  const handleSelectQuickPreset = (name, holdTime, restTime = 20) => {
    setIsActive(false);
    setIsResting(false);
    const newEx = [{ name, holdTime, restTime, tip: "Hít thở nhịp nhàng, siết chặt cơ bụng và cơ mông" }];
    setExercises(newEx);
    setCurrentSetIndex(0);
    setTimeLeft(holdTime);
    setTotalSetDuration(holdTime);
  };

  const progressPercent = totalSetDuration > 0 ? ((totalSetDuration - timeLeft) / totalSetDuration) * 100 : 0;

  return (
    <div className="flex flex-col items-center justify-between p-4 sm:p-6 w-full h-full max-w-lg mx-auto pb-28">
      {/* 1. Quick Presets Bar (Căn chỉnh chuẩn, không lệch mép) */}
      <div className="w-full flex items-center space-x-2 overflow-x-auto py-2 px-1 mb-2">
        <button
          onClick={() => handleSelectQuickPreset("Plank Cơ Bản 30s", 30, 15)}
          className="shrink-0 px-4 py-2 rounded-2xl bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 text-xs font-bold text-slate-700 dark:text-gray-300 hover:text-slate-900 dark:hover:text-white active:scale-95 transition-all shadow-sm flex items-center space-x-1.5"
        >
          <span>⚡</span>
          <span>30s Khởi Động</span>
        </button>
        <button
          onClick={() => handleSelectQuickPreset("Plank Chuẩn 60s", 60, 25)}
          className="shrink-0 px-4 py-2 rounded-2xl bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 text-xs font-bold text-slate-700 dark:text-gray-300 hover:text-slate-900 dark:hover:text-white active:scale-95 transition-all shadow-sm flex items-center space-x-1.5"
        >
          <span>🔥</span>
          <span>60s Tiêu Chuẩn</span>
        </button>
        <button
          onClick={() => handleSelectQuickPreset("Plank Thử Thách 2 Phút", 120, 30)}
          className="shrink-0 px-4 py-2 rounded-2xl bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 text-xs font-bold text-slate-700 dark:text-gray-300 hover:text-slate-900 dark:hover:text-white active:scale-95 transition-all shadow-sm flex items-center space-x-1.5"
        >
          <span>🏆</span>
          <span>120s Bứt Phá</span>
        </button>
        <button
          onClick={onOpenAIPlan}
          className="shrink-0 px-4 py-2 rounded-2xl bg-emerald-50 dark:bg-neon/15 border border-emerald-300 dark:border-neon/30 text-xs font-bold text-emerald-700 dark:text-neon active:scale-95 transition-all flex items-center space-x-1.5 shadow-sm"
        >
          <Sparkles size={14} />
          <span>Tạo Với AI</span>
        </button>
      </div>

      {/* 2. Exercise Information Card Có Hỗ Trợ Vuốt Trái/Phải & Xem Trước Hiệp */}
      <div 
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        className="w-full glass-panel p-5 rounded-3xl text-center relative select-none transition-colors duration-300 shadow-sm"
      >
        {/* Nút lật hiệp trái/phải khi chưa bắt đầu */}
        {exercises.length > 1 && !isActive && (
          <>
            <button
              onClick={() => handleSelectSet(currentSetIndex - 1)}
              disabled={currentSetIndex === 0}
              className="absolute left-3 top-1/2 -translate-y-1/2 p-2 rounded-full text-slate-400 hover:text-slate-700 dark:hover:text-white disabled:opacity-20 active:scale-90 transition-all z-10"
              title="Hiệp trước"
            >
              <ChevronLeft size={20} />
            </button>
            <button
              onClick={() => handleSelectSet(currentSetIndex + 1)}
              disabled={currentSetIndex === exercises.length - 1}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-2 rounded-full text-slate-400 hover:text-slate-700 dark:hover:text-white disabled:opacity-20 active:scale-90 transition-all z-10"
              title="Hiệp tiếp theo"
            >
              <ChevronRight size={20} />
            </button>
          </>
        )}

        <div className="flex items-center justify-center space-x-2">
          <span className="text-[11px] font-extrabold uppercase px-2.5 py-0.5 rounded-full bg-slate-200 dark:bg-white/10 text-slate-700 dark:text-gray-300">
            Hiệp {currentSetIndex + 1} / {exercises.length}
          </span>
          {plan?.planName && (
            <span className="text-[11px] font-bold text-emerald-600 dark:text-neon truncate max-w-[160px]">
              {plan.planName}
            </span>
          )}
        </div>

        <h2 className="text-xl sm:text-2xl font-black mt-2 tracking-tight text-slate-900 dark:text-white px-8">
          {isResting ? "❄️ Thời Gian Nghỉ Hồi Sức" : currentExercise.name}
        </h2>

        {/* Nút bấm (i) Mở Modal Chi Tiết Tư Thế Chuẩn */}
        <button 
          onClick={() => setShowInfoModal(true)}
          className="mt-2 inline-flex items-center justify-center space-x-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-white/5 dark:hover:bg-white/10 border border-slate-200/80 dark:border-white/10 text-xs text-slate-700 dark:text-gray-300 active:scale-95 transition-all max-w-full"
        >
          <div className="w-4 h-4 rounded-full bg-cyan-500/20 text-cyan-600 dark:text-cyan-neon flex items-center justify-center shrink-0">
            <Info size={11} />
          </div>
          <span className="truncate text-[11px] font-medium">
            {isResting ? "Hít sâu bằng mũi, thở chậm bằng miệng để hồi sức" : (currentExercise.tip || "Siết cơ bụng, giữ thẳng lưng, thở đều")}
          </span>
          <span className="text-[10px] text-cyan-600 dark:text-cyan-neon font-bold ml-1 shrink-0">Xem chi tiết</span>
        </button>

        {/* Multi-set progress indicator dots (Bấm được để chuyển hiệp) */}
        {exercises.length > 1 && (
          <div className="flex justify-center items-center space-x-2 mt-3.5">
            {exercises.map((_, idx) => (
              <button
                key={idx}
                onClick={() => handleSelectSet(idx)}
                disabled={isActive}
                className={`h-2 rounded-full transition-all duration-300 ${
                  idx === currentSetIndex
                    ? 'w-7 bg-emerald-500 dark:bg-neon shadow-sm dark:shadow-neon'
                    : idx < currentSetIndex
                    ? 'w-2 bg-slate-400 dark:bg-gray-500'
                    : 'w-2 bg-slate-200 dark:bg-white/10'
                }`}
                title={`Chuyển tới Hiệp ${idx + 1}`}
              />
            ))}
          </div>
        )}
      </div>

      {/* 3. Main HUD Circular Timer */}
      <div className="relative my-2">
        <CircularProgress
          progress={progressPercent}
          timeLeft={timeLeft}
          totalTime={totalSetDuration}
          isResting={isResting}
          exerciseName={currentExercise.name}
        />

        {/* Quick Time Adjuster Floating Buttons */}
        <div className="flex justify-center space-x-4 mt-[-10px] z-10 relative">
          <button
            onClick={() => handleAdjustTime(-15)}
            className="px-3.5 py-1.5 bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 hover:bg-slate-100 dark:hover:bg-white/10 rounded-full text-xs font-bold text-slate-700 dark:text-gray-300 flex items-center space-x-1 active:scale-90 transition-all shadow-sm"
            title="Giảm 15 giây"
          >
            <Minus size={12} />
            <span>15s</span>
          </button>
          <button
            onClick={() => handleAdjustTime(15)}
            className="px-3.5 py-1.5 bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 hover:bg-slate-100 dark:hover:bg-white/10 rounded-full text-xs font-bold text-slate-700 dark:text-gray-300 flex items-center space-x-1 active:scale-90 transition-all shadow-sm"
            title="Tăng 15 giây"
          >
            <Plus size={12} />
            <span>15s</span>
          </button>
        </div>
      </div>

      {/* 4. Giant Tactical Control Buttons */}
      <div className="w-full space-y-3">
        <div className="flex items-center space-x-3 w-full">
          {/* Reset / Stop Button */}
          <button
            onClick={handleResetTimer}
            className="w-16 h-16 rounded-3xl bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 flex items-center justify-center text-slate-600 dark:text-gray-400 hover:text-slate-900 dark:hover:text-white active:scale-90 transition-all shadow-sm shrink-0"
            title="Khởi động lại bài tập"
          >
            <RotateCcw size={24} />
          </button>

          {/* Huge Main Play / Pause Button */}
          <button
            onClick={handleToggleTimer}
            className={`flex-1 h-16 rounded-3xl font-black text-lg tracking-wider uppercase flex items-center justify-center space-x-3 transition-all active:scale-95 shadow-md dark:shadow-neon-lg ${
              isActive
                ? 'bg-amber-500 hover:bg-amber-400 text-white dark:text-black dark:shadow-amber-glow'
                : 'bg-emerald-500 hover:bg-emerald-600 text-white dark:bg-neon dark:hover:bg-neon-dark dark:text-black dark:shadow-neon'
            }`}
          >
            {isActive ? (
              <>
                <Pause size={28} fill="currentColor" />
                <span>TẠM DỪNG</span>
              </>
            ) : (
              <>
                <Play size={28} fill="currentColor" />
                <span>{timeLeft < totalSetDuration ? "TIẾP TỤC" : "BẮT ĐẦU TẬP"}</span>
              </>
            )}
          </button>

          {/* Next Set Button */}
          {exercises.length > 1 && (
            <button
              onClick={handleSkipSet}
              className="w-16 h-16 rounded-3xl bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 flex items-center justify-center text-slate-600 dark:text-gray-400 hover:text-slate-900 dark:hover:text-white active:scale-90 transition-all shadow-sm shrink-0"
              title="Chuyển sang hiệp kế tiếp"
            >
              <SkipForward size={24} />
            </button>
          )}
        </div>
      </div>

      {/* 5. MODAL HƯỚNG DẪN TƯ THẾ CHI TIẾT KHI BẤM NÚT (i) */}
      {showInfoModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-fade-in">
          <div className="glass-panel p-6 rounded-3xl max-w-md w-full space-y-4 shadow-2xl relative max-h-[85vh] overflow-y-auto">
            {/* Close Button */}
            <button
              onClick={() => setShowInfoModal(false)}
              className="absolute right-4 top-4 w-8 h-8 rounded-full bg-slate-200 dark:bg-white/10 flex items-center justify-center text-slate-700 dark:text-white active:scale-90 transition-all"
            >
              <X size={18} />
            </button>

            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-2xl bg-emerald-100 dark:bg-neon/20 text-emerald-600 dark:text-neon flex items-center justify-center shrink-0">
                <Flame size={20} />
              </div>
              <div>
                <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 dark:bg-neon/10 dark:text-neon border border-emerald-300 dark:border-neon/30">
                  Hiệp {currentSetIndex + 1} / {exercises.length}
                </span>
                <h3 className="text-lg font-black text-slate-900 dark:text-white mt-1">
                  {currentExercise.name}
                </h3>
              </div>
            </div>

            {/* Thông số hiệp tập */}
            <div className="grid grid-cols-2 gap-2 p-3 rounded-2xl bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-xs">
              <div className="text-center">
                <div className="text-slate-500 dark:text-gray-400 font-medium">Thời Gian Giữ</div>
                <div className="text-base font-bold text-emerald-600 dark:text-neon font-mono mt-0.5">{currentExercise.holdTime} giây</div>
              </div>
              <div className="text-center">
                <div className="text-slate-500 dark:text-gray-400 font-medium">Thời Gian Nghỉ</div>
                <div className="text-base font-bold text-cyan-600 dark:text-cyan-neon font-mono mt-0.5">{currentExercise.restTime || 20} giây</div>
              </div>
            </div>

            {/* Hướng dẫn kỹ thuật chuẩn */}
            <div className="space-y-2 text-xs">
              <h4 className="font-extrabold text-slate-900 dark:text-white flex items-center space-x-1.5 uppercase tracking-wider text-[11px]">
                <ShieldCheck size={14} className="text-emerald-500" />
                <span>Kỹ Thuật Chuẩn Khoa Học</span>
              </h4>
              <p className="text-slate-600 dark:text-gray-300 leading-relaxed bg-slate-50 dark:bg-white/5 p-3 rounded-xl border border-slate-200 dark:border-white/5">
                {currentExercise.tip || "Siết chặt cơ bụng và cơ mông, giữ thân người tạo thành một đường thẳng song song mặt sàn. Hít thở nhịp nhàng bằng mũi và thở ra bằng miệng."}
              </p>
            </div>

            {/* Lưu ý quan trọng */}
            <div className="space-y-2 text-xs">
              <h4 className="font-extrabold text-slate-900 dark:text-white flex items-center space-x-1.5 uppercase tracking-wider text-[11px]">
                <Activity size={14} className="text-cyan-500" />
                <span>Lỗi Sai Cần Tránh</span>
              </h4>
              <ul className="space-y-1.5 text-slate-600 dark:text-gray-400 pl-2">
                <li className="flex items-start space-x-1.5">
                  <span className="text-red-500 font-bold">•</span>
                  <span><strong>Không võng lưng:</strong> Giữ cột sống thẳng tự nhiên để bảo vệ đĩa đệm.</span>
                </li>
                <li className="flex items-start space-x-1.5">
                  <span className="text-red-500 font-bold">•</span>
                  <span><strong>Không nhô mông quá cao:</strong> Đảm bảo cơ bụng luôn trong trạng thái siết căng.</span>
                </li>
                <li className="flex items-start space-x-1.5">
                  <span className="text-red-500 font-bold">•</span>
                  <span><strong>Không nín thở:</strong> Thở đều giúp cung cấp đủ oxy cho cơ bắp chịu tải.</span>
                </li>
              </ul>
            </div>

            <button
              onClick={() => setShowInfoModal(false)}
              className="w-full py-3 rounded-2xl bg-emerald-500 text-white dark:bg-neon dark:text-black font-extrabold text-xs uppercase tracking-wider shadow-md active:scale-95 transition-all"
            >
              Đã Hiểu, Sẵn Sàng Tập
            </button>
          </div>
        </div>
      )}

      {/* 6. CELEBRATION MODAL KHI HOÀN THÀNH BÀI TẬP */}
      {showCelebration && completedSessionData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-fade-in">
          <div className="glass-panel p-6 rounded-3xl max-w-sm w-full text-center space-y-4 shadow-2xl">
            <div className="w-16 h-16 rounded-full bg-emerald-100 dark:bg-neon/20 border border-emerald-400 dark:border-neon text-emerald-600 dark:text-neon mx-auto flex items-center justify-center shadow-md dark:shadow-neon animate-bounce">
              <Trophy size={32} />
            </div>

            <div>
              <h3 className="text-2xl font-black text-slate-900 dark:text-white">XUẤT SẮC!</h3>
              <p className="text-xs text-slate-600 dark:text-gray-400 mt-1">
                Bạn vừa hoàn thành xuất sắc buổi luyện tập Plank hôm nay.
              </p>
            </div>

            {/* Workout Summary Stats */}
            <div className="grid grid-cols-2 gap-2.5 p-3 rounded-2xl bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10">
              <div className="text-center">
                <div className="text-[10px] text-slate-500 dark:text-gray-400 uppercase font-bold">Thời Gian Giữ</div>
                <div className="font-mono text-lg font-extrabold text-emerald-600 dark:text-neon">
                  {completedSessionData.duration}s
                </div>
              </div>
              <div className="text-center">
                <div className="text-[10px] text-slate-500 dark:text-gray-400 uppercase font-bold">Calo Tiêu Hao</div>
                <div className="font-mono text-lg font-extrabold text-cyan-600 dark:text-cyan-neon">
                  {Math.round((completedSessionData.duration / 60) * 4.5)} kcal
                </div>
              </div>
            </div>

            <button
              onClick={() => {
                setShowCelebration(false);
                handleResetTimer();
              }}
              className="w-full py-3.5 rounded-2xl bg-emerald-500 text-white dark:bg-neon dark:text-black font-extrabold text-sm uppercase tracking-wider shadow-md dark:shadow-neon active:scale-95 transition-all"
            >
              Tiếp Tục Luyện Tập
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Timer;