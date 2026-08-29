import React, { useState, useEffect, useRef } from 'react';
import CircularProgress from './UI/CircularProgress';
import { unlockSpeechAPI, speakText, playBeep } from '../utils/speechUtils';
import { saveHistory, getActivePlan } from '../services/storageService';
import { 
  Play, 
  Pause, 
  RotateCcw, 
  SkipForward, 
  Flame, 
  Sparkles, 
  Trophy, 
  Plus, 
  Minus, 
  Check, 
  ArrowRight,
  Info
} from 'lucide-react';

const Timer = ({ plan, onOpenAIPlan }) => {
  // Chuẩn bị danh sách bài tập (từ Giáo án AI hoặc Mặc định)
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

  // Khi plan từ ngoài thay đổi (ví dụ nạp từ AI Coach)
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

  // Cập nhật thời gian khi đổi hiệp hoặc đổi trạng thái nghỉ
  useEffect(() => {
    if (!isActive) {
      const targetTime = isResting ? (currentExercise.restTime || 20) : currentExercise.holdTime;
      setTimeLeft(targetTime);
      setTotalSetDuration(targetTime);
    }
  }, [currentExercise, isResting]);

  // Interval chạy đếm ngược
  useEffect(() => {
    let interval = null;

    if (isActive && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((prev) => {
          // Tính tổng thời gian đã giữ thực tế (chỉ tính khi đang hold plank, không tính khi nghỉ)
          if (!isResting) {
            setSessionTotalHoldSeconds(s => s + 1);
          }

          // Trợ lý giọng nói đếm ngược 5 giây cuối
          if (!isResting) {
            if (prev === 6) { speakText("Năm"); playBeep(523, 100); }
            if (prev === 5) { speakText("Bốn"); playBeep(587, 100); }
            if (prev === 4) { speakText("Ba"); playBeep(659, 100); }
            if (prev === 3) { speakText("Hai"); playBeep(698, 100); }
            if (prev === 2) { speakText("Một"); playBeep(784, 150); }
          } else {
            // Đếm ngược 3s khi sắp hết giờ nghỉ
            if (prev === 4) speakText("Chuẩn bị");
            if (prev === 3) playBeep(440, 80);
            if (prev === 2) playBeep(554, 80);
          }

          return prev - 1;
        });
      }, 1000);
    } else if (isActive && timeLeft === 0) {
      handleSetFinished();
    }

    return () => clearInterval(interval);
  }, [isActive, timeLeft, isResting]);

  // Xử lý khi kết thúc 1 Set (Hold hoặc Rest)
  const handleSetFinished = () => {
    playBeep(880, 400);

    if (!isResting && (currentExercise.restTime > 0) && (currentSetIndex < exercises.length - 1)) {
      // Chuyển sang Nghỉ ngơi
      setIsResting(true);
      const restSec = currentExercise.restTime || 25;
      setTimeLeft(restSec);
      setTotalSetDuration(restSec);
      speakText(`Tuyệt vời! Nghỉ ngơi ${restSec} giây.`);
    } else if (currentSetIndex < exercises.length - 1) {
      // Chuyển sang Hiệp tập tiếp theo
      setIsResting(false);
      const nextIdx = currentSetIndex + 1;
      setCurrentSetIndex(nextIdx);
      const nextEx = exercises[nextIdx];
      setTimeLeft(nextEx.holdTime);
      setTotalSetDuration(nextEx.holdTime);
      speakText(`Bắt đầu hiệp ${nextIdx + 1}: ${nextEx.name}`);
    } else {
      // Đã hoàn thành toàn bộ bài tập
      setIsActive(false);
      setIsResting(false);
      speakText("Xuất sắc! Bạn đã hoàn thành xuất sắc toàn bộ bài tập!");
      
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

  // Nút Play / Pause
  const handleToggleTimer = () => {
    unlockSpeechAPI(); // Quan trọng: Unlock audio cho iOS
    if (!isActive) {
      if (isResting) {
        speakText("Tiếp tục nghỉ");
      } else {
        speakText(`Bắt đầu. ${currentExercise.name}`);
      }
    }
    setIsActive(!isActive);
  };

  // Nút Reset / Stop
  const handleResetTimer = () => {
    setIsActive(false);
    setIsResting(false);
    setCurrentSetIndex(0);
    const firstHold = exercises[0].holdTime;
    setTimeLeft(firstHold);
    setTotalSetDuration(firstHold);
    setSessionTotalHoldSeconds(0);
  };

  // Nút Bỏ qua / Chuyển hiệp thủ công
  const handleSkipSet = () => {
    if (currentSetIndex < exercises.length - 1) {
      setIsResting(false);
      const nextIdx = currentSetIndex + 1;
      setCurrentSetIndex(nextIdx);
      setTimeLeft(exercises[nextIdx].holdTime);
      setTotalSetDuration(exercises[nextIdx].holdTime);
      speakText(`Chuyển sang ${exercises[nextIdx].name}`);
    } else {
      handleSetFinished();
    }
  };

  // Điều chỉnh nhanh thời gian +/- 15s
  const handleAdjustTime = (delta) => {
    setTimeLeft(t => Math.max(5, t + delta));
    setTotalSetDuration(d => Math.max(5, d + delta));
  };

  // Quick Preset Selection
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
          className="px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-xs font-bold text-gray-300 hover:text-white whitespace-nowrap active:scale-95 transition-all"
        >
          ⚡ 30s Khởi Động
        </button>
        <button
          onClick={() => handleSelectQuickPreset("Plank Chuẩn 60s", 60, 25)}
          className="px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-xs font-bold text-gray-300 hover:text-white whitespace-nowrap active:scale-95 transition-all"
        >
          🔥 60s Tiêu Chuẩn
        </button>
        <button
          onClick={() => handleSelectQuickPreset("Plank Thử Thách 2 Phút", 120, 30)}
          className="px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-xs font-bold text-gray-300 hover:text-white whitespace-nowrap active:scale-95 transition-all"
        >
          🏆 120s Bứt Phá
        </button>
        <button
          onClick={onOpenAIPlan}
          className="px-3 py-1.5 rounded-full bg-neon/15 border border-neon/30 text-xs font-bold text-neon whitespace-nowrap active:scale-95 transition-all flex items-center space-x-1"
        >
          <Sparkles size={12} />
          <span>Tạo Với AI</span>
        </button>
      </div>

      {/* Exercise Information Card */}
      <div className="w-full glass-panel p-4 rounded-3xl border border-white/10 text-center shadow-card-glow transition-all">
        <div className="flex items-center justify-center space-x-2">
          <span className="text-[11px] font-extrabold uppercase px-2.5 py-0.5 rounded-full bg-white/10 text-gray-300">
            Hiệp {currentSetIndex + 1} / {exercises.length}
          </span>
          {plan?.planName && (
            <span className="text-[11px] font-bold text-neon truncate max-w-[160px]">
              {plan.planName}
            </span>
          )}
        </div>

        <h2 className="text-xl sm:text-2xl font-black mt-2 tracking-tight text-white dark:text-white light:text-slate-900">
          {isResting ? "❄️ Thời Gian Nghỉ Hồi Sức" : currentExercise.name}
        </h2>

        {/* Posture Coaching Tip */}
        <p className="text-xs text-gray-400 dark:text-gray-400 light:text-slate-600 mt-1 flex items-center justify-center space-x-1">
          <Info size={13} className="text-cyan-neon shrink-0" />
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
                    ? 'w-6 bg-neon shadow-neon'
                    : idx < currentSetIndex
                    ? 'w-2 bg-gray-500'
                    : 'w-2 bg-white/10'
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
            className="px-3 py-1 bg-white/5 border border-white/10 hover:bg-white/10 rounded-full text-xs font-bold text-gray-300 flex items-center space-x-1 active:scale-90 transition-all"
            title="Giảm 15 giây"
          >
            <Minus size={12} />
            <span>15s</span>
          </button>
          <button
            onClick={() => handleAdjustTime(15)}
            className="px-3 py-1 bg-white/5 border border-white/10 hover:bg-white/10 rounded-full text-xs font-bold text-gray-300 flex items-center space-x-1 active:scale-90 transition-all"
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
            className="w-16 h-16 rounded-3xl bg-white/5 dark:bg-white/5 light:bg-slate-200 border border-white/10 dark:border-white/10 light:border-slate-300 flex items-center justify-center text-gray-400 hover:text-white active:scale-90 transition-all shrink-0"
            title="Khởi động lại bài tập"
          >
            <RotateCcw size={24} />
          </button>

          {/* Huge Main Play / Pause Button */}
          <button
            onClick={handleToggleTimer}
            className={`flex-1 h-16 rounded-3xl font-black text-lg tracking-wider uppercase flex items-center justify-center space-x-3 transition-all active:scale-95 shadow-neon-lg ${
              isActive
                ? 'bg-amber-500 hover:bg-amber-400 text-black shadow-amber-glow'
                : 'bg-neon hover:bg-neon-dark text-black shadow-neon'
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
              className="w-16 h-16 rounded-3xl bg-white/5 dark:bg-white/5 light:bg-slate-200 border border-white/10 dark:border-white/10 light:border-slate-300 flex items-center justify-center text-gray-400 hover:text-white active:scale-90 transition-all shrink-0"
              title="Chuyển sang hiệp kế tiếp"
            >
              <SkipForward size={24} />
            </button>
          )}
        </div>
      </div>

      {/* CELEBRATION MODAL KHI HOÀN THÀNH BÀI TẬP */}
      {showCelebration && completedSessionData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
          <div className="glass-panel p-6 rounded-3xl border border-neon/50 shadow-neon-lg max-w-sm w-full text-center space-y-4">
            <div className="w-16 h-16 rounded-full bg-neon/20 border border-neon text-neon mx-auto flex items-center justify-center shadow-neon animate-bounce">
              <Trophy size={32} />
            </div>

            <div>
              <h3 className="text-2xl font-black text-white">XUẤT SẮC!</h3>
              <p className="text-xs text-gray-400 mt-1">
                Bạn vừa hoàn thành xuất sắc buổi luyện tập Plank hôm nay.
              </p>
            </div>

            {/* Workout Summary Stats */}
            <div className="grid grid-cols-2 gap-2.5 p-3 rounded-2xl bg-white/5 border border-white/10">
              <div className="text-center">
                <div className="text-[10px] text-gray-400 uppercase font-bold">Thời Gian Giữ</div>
                <div className="font-mono text-lg font-extrabold text-neon">
                  {completedSessionData.duration}s
                </div>
              </div>
              <div className="text-center">
                <div className="text-[10px] text-gray-400 uppercase font-bold">Calo Tiêu Hao</div>
                <div className="font-mono text-lg font-extrabold text-cyan-neon">
                  {Math.round((completedSessionData.duration / 60) * 4.5)} kcal
                </div>
              </div>
            </div>

            <button
              onClick={() => {
                setShowCelebration(false);
                handleResetTimer();
              }}
              className="w-full py-3.5 rounded-2xl bg-neon text-black font-extrabold text-sm uppercase tracking-wider shadow-neon active:scale-95 transition-all"
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