import React, { useState, useEffect, useRef } from 'react';
import CircularProgress from './UI/CircularProgress';
import { unlockSpeechAPI, playBeep } from '../utils/speechUtils';
import { playVoiceClip, stopAllVoice } from '../utils/audioPack';
import { 
  triggerHapticCount, 
  triggerHapticHeavy, 
  triggerHapticSuccess, 
  triggerHapticMedium 
} from '../utils/hapticsUtils';
import { 
  saveHistory, 
  requestWakeLock, 
  releaseWakeLock, 
  checkAndUnlockBadges, 
  getUserProfile, 
  updatePersonalRecord 
} from '../services/storageService';
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
  Activity,
  Award,
  Zap,
  Infinity as InfinityIcon
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
  const [isMaxChallenge, setIsMaxChallenge] = useState(false);
  const [timeLeft, setTimeLeft] = useState(60);
  const [totalSetDuration, setTotalSetDuration] = useState(60);
  const [sessionTotalHoldSeconds, setSessionTotalHoldSeconds] = useState(0);
  const [showCelebration, setShowCelebration] = useState(false);
  const [completedSessionData, setCompletedSessionData] = useState(null);
  const [showInfoModal, setShowInfoModal] = useState(false);
  const [newlyUnlockedBadges, setNewlyUnlockedBadges] = useState([]);
  const [userProfile, setUserProfile] = useState(getUserProfile());

  // Touch swipe handling
  const touchStartX = useRef(null);
  const touchEndX = useRef(null);

  const currentExercise = isMaxChallenge 
    ? { name: "Thách Thức Vô Cực (Max-Out)", holdTime: 0, tip: "Giữ form chuẩn, phá vỡ mọi giới hạn bản thân!" }
    : (exercises[currentSetIndex] || exercises[0]);

  // Quản lý Screen Wake Lock khi đang tập
  useEffect(() => {
    if (isActive) {
      requestWakeLock();
    } else {
      releaseWakeLock();
    }
    return () => {
      releaseWakeLock();
    };
  }, [isActive]);

  // Dừng ngay giọng nói nếu người dùng bấm tắt âm thanh
  useEffect(() => {
    if (!voiceEnabled) {
      stopAllVoice();
    }
  }, [voiceEnabled]);

  useEffect(() => {
    if (plan && plan.days && plan.days[0]?.exercises?.length > 0) {
      setIsMaxChallenge(false);
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
    if (!isActive && !isMaxChallenge) {
      const targetTime = isResting ? (currentExercise.restTime || 20) : currentExercise.holdTime;
      setTimeLeft(targetTime);
      setTotalSetDuration(targetTime);
    }
  }, [currentExercise, isResting, isMaxChallenge]);

  // Main Timer Tick Loop
  useEffect(() => {
    let interval = null;

    if (isActive) {
      interval = setInterval(() => {
        if (isMaxChallenge) {
          // CHẾ ĐỘ THÁCH THỨC VÔ CỰC (Đếm tăng dần không giới hạn)
          setTimeLeft((prev) => {
            const nextSec = prev + 1;
            setSessionTotalHoldSeconds(s => s + 1);

            // Mốc giọng nói động viên Studio AI & Rung phản hồi
            if (nextSec === 30) {
              if (voiceEnabled) playVoiceClip('milestone_30s', '30 giây! Cơ bụng đang kích hoạt rất tốt!', { enabled: voiceEnabled });
              triggerHapticMedium();
            }
            if (nextSec === 60) {
              if (voiceEnabled) { playVoiceClip('milestone_60s', '1 phút! Xuất sắc, bạn đã đạt mốc tiêu chuẩn!', { enabled: voiceEnabled }); playBeep(880, 200, { enabled: voiceEnabled }); }
              triggerHapticHeavy();
            }
            if (nextSec === 90) {
              if (voiceEnabled) playVoiceClip('milestone_90s', '1 phút 30 giây! Cố lên, giữ vững nhịp thở!', { enabled: voiceEnabled });
              triggerHapticMedium();
            }
            if (nextSec === 120) {
              if (voiceEnabled) { playVoiceClip('milestone_120s', '2 phút! Tuyệt vời, bạn là Chiến Binh Thép!', { enabled: voiceEnabled }); playBeep(880, 300, { enabled: voiceEnabled }); }
              triggerHapticHeavy();
            }
            if (nextSec === 180) {
              if (voiceEnabled) { playVoiceClip('milestone_180s', '3 phút! Đẳng cấp phi thường của Kỷ Lục Gia!', { enabled: voiceEnabled }); playBeep(988, 400, { enabled: voiceEnabled }); }
              triggerHapticHeavy();
            }
            if (nextSec === 240) {
              if (voiceEnabled) playVoiceClip('milestone_240s', '4 phút! Ý chí vô hạn!', { enabled: voiceEnabled });
              triggerHapticMedium();
            }
            if (nextSec === 300) {
              if (voiceEnabled) { playVoiceClip('milestone_300s', '5 phút! Chúc mừng Chúa Tể Cơ Core!', { enabled: voiceEnabled }); playBeep(1046, 500, { enabled: voiceEnabled }); }
              triggerHapticSuccess();
            }

            return nextSec;
          });
        } else {
          // CHẾ ĐỘ BÀI TẬP ĐẾM NGƯỢC
          if (timeLeft > 0) {
            setTimeLeft((prev) => {
              if (!isResting) {
                setSessionTotalHoldSeconds(s => s + 1);
              }

              // Rung phản hồi đếm ngược 5 giây cuối
              if (prev <= 6 && prev >= 2) {
                triggerHapticCount();
              }

              if (voiceEnabled) {
                if (!isResting) {
                  if (prev === 6) { playVoiceClip('count_5', 'Năm', { enabled: voiceEnabled }); playBeep(523, 100, { enabled: voiceEnabled }); }
                  if (prev === 5) { playVoiceClip('count_4', 'Bốn', { enabled: voiceEnabled }); playBeep(587, 100, { enabled: voiceEnabled }); }
                  if (prev === 4) { playVoiceClip('count_3', 'Ba', { enabled: voiceEnabled }); playBeep(659, 100, { enabled: voiceEnabled }); }
                  if (prev === 3) { playVoiceClip('count_2', 'Hai', { enabled: voiceEnabled }); playBeep(698, 100, { enabled: voiceEnabled }); }
                  if (prev === 2) { playVoiceClip('count_1', 'Một', { enabled: voiceEnabled }); playBeep(784, 150, { enabled: voiceEnabled }); }
                } else {
                  if (prev === 4) playVoiceClip('prepare_next', 'Chuẩn bị hiệp tiếp theo', { enabled: voiceEnabled });
                  if (prev === 3) playBeep(440, 80, { enabled: voiceEnabled });
                  if (prev === 2) playBeep(554, 80, { enabled: voiceEnabled });
                }
              }

              return prev - 1;
            });
          } else if (timeLeft === 0) {
            handleSetFinished();
          }
        }
      }, 1000);
    }

    return () => clearInterval(interval);
  }, [isActive, timeLeft, isResting, isMaxChallenge, voiceEnabled]);

  // Hoàn thành hiệp bài tập
  const handleSetFinished = () => {
    triggerHapticHeavy();
    if (voiceEnabled) playBeep(880, 400, { enabled: voiceEnabled });

    if (!isResting && (currentExercise.restTime > 0) && (currentSetIndex < exercises.length - 1)) {
      setIsResting(true);
      const restSec = currentExercise.restTime || 25;
      setTimeLeft(restSec);
      setTotalSetDuration(restSec);
      if (voiceEnabled) playVoiceClip('rest_start', `Tuyệt vời! Nghỉ ngơi ${restSec} giây.`, { enabled: voiceEnabled });
    } else if (currentSetIndex < exercises.length - 1) {
      setIsResting(false);
      const nextIdx = currentSetIndex + 1;
      setCurrentSetIndex(nextIdx);
      const nextEx = exercises[nextIdx];
      setTimeLeft(nextEx.holdTime);
      setTotalSetDuration(nextEx.holdTime);
      if (voiceEnabled) playVoiceClip('prepare_next', `Bắt đầu hiệp ${nextIdx + 1}: ${nextEx.name}`, { enabled: voiceEnabled });
    } else {
      finishWorkoutSession(sessionTotalHoldSeconds + currentExercise.holdTime, exercises.length, plan?.planName || "Plank Tự Do");
    }
  };

  // Hoàn thành buổi tập / dừng Thách thức Vô cực
  const finishWorkoutSession = (totalHold, completedSetsCount, planTitle) => {
    setIsActive(false);
    setIsResting(false);
    releaseWakeLock();
    triggerHapticSuccess();

    if (voiceEnabled) playVoiceClip('workout_complete', 'Xuất sắc! Bạn vừa hoàn thành bài tập!', { enabled: voiceEnabled });
    
    const sessionResult = {
      planName: planTitle,
      duration: totalHold,
      completedSets: completedSetsCount,
      totalSets: completedSetsCount
    };

    saveHistory(sessionResult);
    setCompletedSessionData(sessionResult);
    setUserProfile(getUserProfile());

    // Kiểm tra mở khóa huy hiệu mới
    const unlocked = checkAndUnlockBadges();
    if (unlocked && unlocked.length > 0) {
      setNewlyUnlockedBadges(unlocked);
      triggerHapticSuccess();
      setTimeout(() => {
        if (voiceEnabled) playVoiceClip('badge_unlocked', `Chúc mừng bạn đã mở khóa huy hiệu: ${unlocked[0].name}!`, { enabled: voiceEnabled });
      }, 1800);
    }

    setShowCelebration(true);
  };

  const handleToggleTimer = () => {
    unlockSpeechAPI();
    triggerHapticMedium();
    if (!isActive) {
      if (voiceEnabled) {
        if (isMaxChallenge) {
          playVoiceClip('start_challenge', 'Bắt đầu Thách Thức Vô Cực! Hãy giữ vững đến giây cuối cùng!', { enabled: voiceEnabled });
        } else if (isResting) {
          playVoiceClip('rest_start', 'Tiếp tục nghỉ ngơi hồi sức', { enabled: voiceEnabled });
        } else {
          playVoiceClip('start_workout', `Bắt đầu. ${currentExercise.name}`, { enabled: voiceEnabled });
        }
      }
    }
    setIsActive(!isActive);
  };

  const handleStopMaxChallenge = () => {
    triggerHapticSuccess();
    if (timeLeft > 0) {
      finishWorkoutSession(timeLeft, 1, "🌌 Thách Thức Vô Cực (Max-Out)");
    }
  };

  const handleResetTimer = () => {
    triggerHapticMedium();
    setIsActive(false);
    setIsResting(false);
    releaseWakeLock();
    stopAllVoice();

    if (isMaxChallenge) {
      setTimeLeft(0);
      setTotalSetDuration(0);
    } else {
      setCurrentSetIndex(0);
      const firstHold = exercises[0].holdTime;
      setTimeLeft(firstHold);
      setTotalSetDuration(firstHold);
    }
    setSessionTotalHoldSeconds(0);
  };

  const handleSkipSet = () => {
    triggerHapticMedium();
    if (currentSetIndex < exercises.length - 1) {
      setIsResting(false);
      const nextIdx = currentSetIndex + 1;
      setCurrentSetIndex(nextIdx);
      setTimeLeft(exercises[nextIdx].holdTime);
      setTotalSetDuration(exercises[nextIdx].holdTime);
      if (voiceEnabled) playVoiceClip('prepare_next', `Chuyển sang ${exercises[nextIdx].name}`, { enabled: voiceEnabled });
    } else {
      handleSetFinished();
    }
  };

  const handleSelectSet = (idx) => {
    if (isActive || isMaxChallenge) return;
    if (idx >= 0 && idx < exercises.length) {
      triggerHapticMedium();
      setIsResting(false);
      setCurrentSetIndex(idx);
      setTimeLeft(exercises[idx].holdTime);
      setTotalSetDuration(exercises[idx].holdTime);
    }
  };

  // Swipe handling
  const handleTouchStart = (e) => {
    if (isActive || isMaxChallenge) return;
    touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchMove = (e) => {
    if (isActive || isMaxChallenge) return;
    touchEndX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = () => {
    if (isActive || isMaxChallenge || !touchStartX.current || !touchEndX.current) return;
    const distance = touchStartX.current - touchEndX.current;
    const minSwipeDistance = 50;

    if (distance > minSwipeDistance && currentSetIndex < exercises.length - 1) {
      handleSelectSet(currentSetIndex + 1);
    } else if (distance < -minSwipeDistance && currentSetIndex > 0) {
      handleSelectSet(currentSetIndex - 1);
    }

    touchStartX.current = null;
    touchEndX.current = null;
  };

  const handleAdjustTime = (delta) => {
    if (isMaxChallenge) return;
    triggerHapticMedium();
    setTimeLeft(t => Math.max(5, t + delta));
    setTotalSetDuration(d => Math.max(5, d + delta));
  };

  const handleSelectQuickPreset = (name, holdTime, restTime = 20) => {
    triggerHapticMedium();
    setIsActive(false);
    setIsResting(false);
    setIsMaxChallenge(false);
    const newEx = [{ name, holdTime, restTime, tip: "Hít thở nhịp nhàng, siết chặt cơ bụng và cơ mông" }];
    setExercises(newEx);
    setCurrentSetIndex(0);
    setTimeLeft(holdTime);
    setTotalSetDuration(holdTime);
  };

  const handleSwitchToMaxChallenge = () => {
    triggerHapticMedium();
    setIsActive(false);
    setIsResting(false);
    setIsMaxChallenge(true);
    setTimeLeft(0);
    setTotalSetDuration(0);
    setSessionTotalHoldSeconds(0);
  };

  const progressPercent = totalSetDuration > 0 ? ((totalSetDuration - timeLeft) / totalSetDuration) * 100 : 0;

  return (
    <div className="flex flex-col items-center justify-between p-4 sm:p-6 w-full h-full max-w-lg mx-auto pb-28">
      {/* 1. Quick Presets & Challenge Bar */}
      <div className="w-full flex items-center space-x-2 overflow-x-auto py-2 px-1 mb-2">
        {/* Nút Thách Thức Vô Cực Nổi Bật */}
        <button
          onClick={handleSwitchToMaxChallenge}
          className={`shrink-0 px-4 py-2 rounded-2xl border text-xs font-black active:scale-95 transition-all flex items-center space-x-1.5 shadow-sm ${
            isMaxChallenge 
              ? 'bg-purple-600 text-white border-purple-400 shadow-md shadow-purple-500/20' 
              : 'bg-purple-50 hover:bg-purple-100 text-purple-700 border-purple-300 dark:bg-purple-950/30 dark:border-purple-500/30 dark:text-purple-300'
          }`}
        >
          <InfinityIcon size={14} />
          <span>Thách Thức Vô Cực</span>
        </button>

        <button
          onClick={() => handleSelectQuickPreset("Plank Cơ Bản 30s", 30, 15)}
          className={`shrink-0 px-4 py-2 rounded-2xl border text-xs font-bold active:scale-95 transition-all shadow-sm flex items-center space-x-1.5 ${
            !isMaxChallenge && totalSetDuration === 30
              ? 'bg-emerald-500 text-white border-emerald-400'
              : 'bg-white dark:bg-white/5 border-slate-200 dark:border-white/10 text-slate-700 dark:text-gray-300 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <span>⚡</span>
          <span>30s Khởi Động</span>
        </button>

        <button
          onClick={() => handleSelectQuickPreset("Plank Chuẩn 60s", 60, 25)}
          className={`shrink-0 px-4 py-2 rounded-2xl border text-xs font-bold active:scale-95 transition-all shadow-sm flex items-center space-x-1.5 ${
            !isMaxChallenge && totalSetDuration === 60
              ? 'bg-emerald-500 text-white border-emerald-400'
              : 'bg-white dark:bg-white/5 border-slate-200 dark:border-white/10 text-slate-700 dark:text-gray-300 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <span>🔥</span>
          <span>60s Tiêu Chuẩn</span>
        </button>

        <button
          onClick={() => handleSelectQuickPreset("Plank Thử Thách 2 Phút", 120, 30)}
          className={`shrink-0 px-4 py-2 rounded-2xl border text-xs font-bold active:scale-95 transition-all shadow-sm flex items-center space-x-1.5 ${
            !isMaxChallenge && totalSetDuration === 120
              ? 'bg-emerald-500 text-white border-emerald-400'
              : 'bg-white dark:bg-white/5 border-slate-200 dark:border-white/10 text-slate-700 dark:text-gray-300 hover:text-slate-900 dark:hover:text-white'
          }`}
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

      {/* 2. Exercise Information Card */}
      <div 
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        className="w-full glass-panel p-5 rounded-3xl text-center relative select-none transition-colors duration-300 shadow-sm"
      >
        {/* Nút lật hiệp trái/phải khi chưa bắt đầu */}
        {exercises.length > 1 && !isActive && !isMaxChallenge && (
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
          <span className={`text-[11px] font-extrabold uppercase px-2.5 py-0.5 rounded-full ${
            isMaxChallenge 
              ? 'bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300' 
              : 'bg-slate-200 dark:bg-white/10 text-slate-700 dark:text-gray-300'
          }`}>
            {isMaxChallenge ? "MAX-OUT EFFORT" : `Hiệp ${currentSetIndex + 1} / ${exercises.length}`}
          </span>
          {plan?.planName && !isMaxChallenge && (
            <span className="text-[11px] font-bold text-emerald-600 dark:text-neon truncate max-w-[160px]">
              {plan.planName}
            </span>
          )}
        </div>

        <h2 className="text-xl sm:text-2xl font-black mt-2 tracking-tight text-slate-900 dark:text-white px-8">
          {isMaxChallenge ? "🌌 Thách Thức Vô Cực" : (isResting ? "❄️ Thời Gian Nghỉ Hồi Sức" : currentExercise.name)}
        </h2>

        {/* Nút bấm (i) Mở Modal Chi Tiết */}
        <button 
          onClick={() => setShowInfoModal(true)}
          className="mt-2 inline-flex items-center justify-center space-x-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-white/5 dark:hover:bg-white/10 border border-slate-200/80 dark:border-white/10 text-xs text-slate-700 dark:text-gray-300 active:scale-95 transition-all max-w-full"
        >
          <div className="w-4 h-4 rounded-full bg-cyan-500/20 text-cyan-600 dark:text-cyan-neon flex items-center justify-center shrink-0">
            <Info size={11} />
          </div>
          <span className="truncate text-[11px] font-medium">
            {isMaxChallenge ? "Giữ tư thế chuẩn đến khi chạm sàn để lập kỷ lục mới" : (currentExercise.tip || "Siết cơ bụng, giữ thẳng lưng, thở đều")}
          </span>
          <span className="text-[10px] text-cyan-600 dark:text-cyan-neon font-bold ml-1 shrink-0">Xem chi tiết</span>
        </button>

        {/* Multi-set progress indicator dots */}
        {exercises.length > 1 && !isMaxChallenge && (
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
          isMaxChallenge={isMaxChallenge}
          isActive={isActive}
          personalRecord={userProfile.record || 60}
          exerciseName={currentExercise.name}
        />

        {/* Quick Time Adjuster (chỉ hiện khi không ở chế độ Vô Cực) */}
        {!isMaxChallenge && (
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
        )}
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

          {/* Huge Main Play / Pause / Stop Challenge Button */}
          {isMaxChallenge && isActive ? (
            <button
              onClick={handleStopMaxChallenge}
              className="flex-1 h-16 rounded-3xl font-black text-lg tracking-wider uppercase flex items-center justify-center space-x-3 transition-all active:scale-95 bg-purple-600 hover:bg-purple-700 text-white shadow-lg shadow-purple-600/30"
            >
              <Trophy size={26} />
              <span>DỪNG & LƯU KỶ LỤC ({timeLeft}s)</span>
            </button>
          ) : (
            <button
              onClick={handleToggleTimer}
              className={`flex-1 h-16 rounded-3xl font-black text-lg tracking-wider uppercase flex items-center justify-center space-x-3 transition-all active:scale-95 shadow-md ${
                isActive
                  ? 'bg-amber-500 hover:bg-amber-400 text-white shadow-amber-500/20'
                  : isMaxChallenge
                  ? 'bg-purple-600 hover:bg-purple-500 text-white shadow-purple-500/20'
                  : 'bg-gradient-to-r from-emerald-500 via-emerald-600 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white shadow-emerald-500/20'
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
                  <span>{isMaxChallenge ? "BẮT ĐẦU THÁCH THỨC" : (timeLeft < totalSetDuration ? "TIẾP TỤC" : "BẮT ĐẦU TẬP")}</span>
                </>
              )}
            </button>
          )}

          {/* Next Set Button */}
          {exercises.length > 1 && !isMaxChallenge && (
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

      {/* 5. MODAL HƯỚNG DẪN TƯ THẾ CHI TIẾT */}
      {showInfoModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-fade-in">
          <div className="glass-panel p-6 rounded-3xl max-w-md w-full space-y-4 shadow-2xl relative max-h-[85vh] overflow-y-auto">
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
                  {isMaxChallenge ? "CHẾ ĐỘ VÔ CỰC" : `Hiệp ${currentSetIndex + 1} / ${exercises.length}`}
                </span>
                <h3 className="text-lg font-black text-slate-900 dark:text-white mt-1">
                  {currentExercise.name}
                </h3>
              </div>
            </div>

            <div className="space-y-2 text-xs">
              <h4 className="font-extrabold text-slate-900 dark:text-white flex items-center space-x-1.5 uppercase tracking-wider text-[11px]">
                <ShieldCheck size={14} className="text-emerald-500" />
                <span>Kỹ Thuật Chuẩn Khoa Học</span>
              </h4>
              <p className="text-slate-600 dark:text-gray-300 leading-relaxed bg-slate-50 dark:bg-white/5 p-3 rounded-xl border border-slate-200 dark:border-white/5">
                {currentExercise.tip || "Siết chặt cơ bụng và cơ mông, giữ thân người tạo thành một đường thẳng song song mặt sàn. Hít thở nhịp nhàng bằng mũi và thở ra bằng miệng."}
              </p>
            </div>

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

      {/* 6. MODAL CHÚC MỪNG HOÀN THÀNH & MỞ KHÓA HUY HIỆU */}
      {showCelebration && completedSessionData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-fade-in">
          <div className="glass-panel p-6 rounded-3xl max-w-sm w-full text-center space-y-4 shadow-2xl">
            <div className="w-16 h-16 rounded-full bg-emerald-100 dark:bg-neon/20 border border-emerald-400 dark:border-neon text-emerald-600 dark:text-neon mx-auto flex items-center justify-center shadow-md dark:shadow-neon animate-bounce">
              <Trophy size={32} />
            </div>

            <div>
              <h3 className="text-2xl font-black text-slate-900 dark:text-white">XUẤT SẮC!</h3>
              <p className="text-xs text-slate-600 dark:text-gray-400 mt-1">
                Bạn vừa hoàn thành xuất sắc bài tập với thành tích ấn tượng.
              </p>
            </div>

            {/* Thông báo mở khóa huy hiệu mới nếu có */}
            {newlyUnlockedBadges.length > 0 && (
              <div className="p-3.5 rounded-2xl bg-gradient-to-r from-amber-500/15 via-purple-500/15 to-cyan-500/15 border border-amber-400/40 text-center space-y-1">
                <div className="flex items-center justify-center space-x-1.5 text-xs font-black text-amber-500">
                  <Award size={16} />
                  <span>MỞ KHÓA HUY HIỆU MỚI!</span>
                </div>
                {newlyUnlockedBadges.map(b => (
                  <div key={b.id} className="text-xs font-bold text-slate-800 dark:text-white flex items-center justify-center space-x-1">
                    <span className="text-base">{b.icon}</span>
                    <span>{b.name} ({b.desc})</span>
                  </div>
                ))}
              </div>
            )}

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
                setNewlyUnlockedBadges([]);
                handleResetTimer();
              }}
              className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white font-extrabold text-sm uppercase tracking-wider shadow-md shadow-emerald-500/20 active:scale-95 transition-all"
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