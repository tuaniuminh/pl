import React, { useState, useEffect } from 'react';
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
  Info
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

  const handleAdjustTime = (delta) => {
    setTimeLeft(t => Math.max(5, t + delta));
    setTotalSetDuration(d => Math.max(5, d + delta));
  };

  const handleSelectQuickPreset = (name, holdTime, restTime = 20) => {
    setIsActive(false);
    setIsResting(false);
    const newEx = [{ name, holdTime, restTime, tip: "Hít thở nhịp nhàng, siết chặt cơ thể" }];
    setExercises(newEx);
    setCurrentSetIndex(0);
    setTimeLeft(holdTime);
    setTotalSetDuration(holdTime);
  };

  const progressPercent = totalSetDuration > 0 ? ((totalSetDuration - timeLeft) / totalSetDuration) * 100 : 0;

  return (
    <div className="flex flex-col items-center justify-between p-4 sm:p-6 w-full h-full max-w-lg mx-auto pb-28">
      {/* Quick Presets Slider */}
      <div className="w-full flex space-x-2 overflow-x-auto py-1 scrollbar-none mb-2">
        <button
          onClick={() => handleSelectQuickPreset("Plank Cơ Bản 30s", 30, 15)}
          className="px-3.5 py-1.5 rounded-full bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 text-xs font-bold text-slate-700 dark:text-gray-300 hover:text-slate-900 dark:hover:text-white whitespace-nowrap active:scale-95 transition-all shadow-sm"
        >
          ⚡ 30s Khởi Động
        </button>
        <button
          onClick={() => handleSelectQuickPreset("Plank Chuẩn 60s", 60, 25)}
          className="px-3.5 py-1.5 rounded-full bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 text-xs font-bold text-slate-700 dark:text-gray-300 hover:text-slate-900 dark:hover:text-white whitespace-nowrap active:scale-95 transition-all shadow-sm"
        >
          🔥 60s Tiêu Chuẩn
        </button>
        <button
          onClick={() => handleSelectQuickPreset("Plank Thử Thách 2 Phút", 120, 30)}
          className="px-3.5 py-1.5 rounded-full bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 text-xs font-bold text-slate-700 dark:text-gray-300 hover:text-slate-900 dark:hover:text-white whitespace-nowrap active:scale-95 transition-all shadow-sm"
        >
          🏆 120s Bứt Phá
        </button>
        <button
          onClick={onOpenAIPlan}
          className="px-3.5 py-1.5 rounded-full bg-emerald-50 dark:bg-neon/15 border border-emerald-300 dark:border-neon/30 text-xs font-bold text-emerald-700 dark:text-neon whitespace-nowrap active:scale-95 transition-all flex items-center space-x-1 shadow-sm"
        >
          <Sparkles size={12} />
          <span>Tạo Với AI</span>
        </button>
      </div>

      {/* Exercise Information Card */}
      <div className="w-full glass-panel p-5 rounded-3xl text-center transition-colors duration-300">
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

        <h2 className="text-xl sm:text-2xl font-black mt-2 tracking-tight text-slate-900 dark:text-white">
          {isResting ? "❄️ Thời Gian Nghỉ Hồi Sức" : currentExercise.name}
        </h2>

        {/* Posture Coaching Tip */}
        <p className="text-xs text-slate-600 dark:text-gray-400 mt-1 flex items-center justify-center space-x-1">
          <Info size={13} className="text-cyan-600 dark:text-cyan-neon shrink-0" />
          <span>{isResting ? "Hít sâu bằng mũi, thở chậm bằng miệng để hồi sức" : (currentExercise.tip || "Siết cơ bụng, giữ thẳng lưng, thở đều")}</span>
        </p>

        {/* Multi-set progress indicator dots */}
        {exercises.length > 1 && (
          <div className="flex justify-center space-x-1.5 mt-3">
            {exercises.map((_, idx) => (
              <div
                key={idx}
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  idx === currentSetIndex
                    ? 'w-6 bg-emerald-500 dark:bg-neon shadow-sm dark:shadow-neon'
                    : idx < currentSetIndex
                    ? 'w-2 bg-slate-400 dark:bg-gray-500'
                    : 'w-2 bg-slate-200 dark:bg-white/10'
                }`}
              />
            ))}
          </div>
        )}
      </div>

      {/* Main HUD Circular Timer */}
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

      {/* Giant Tactical Control Buttons */}
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

      {/* CELEBRATION MODAL KHI HOÀN THÀNH BÀI TẬP */}
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