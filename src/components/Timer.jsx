import React, { useState, useEffect, useRef } from 'react';
import CircularProgress from './UI/CircularProgress';
import { unlockSpeechAPI, playBeep } from '../utils/speechUtils';
import { playVoiceClip, stopAllVoice, playHeartbeatSound } from '../utils/audioPack';
import { 
  triggerHapticCount, 
  triggerHapticHeavy, 
  triggerHapticSuccess, 
  triggerHapticMedium,
  triggerHapticWarning,
  triggerHapticHeartbeat
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
  Flame, 
  Volume2, 
  VolumeX, 
  Moon, 
  Sun, 
  Trophy, 
  Award,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  Zap,
  Info,
  X,
  ShieldCheck,
  Activity,
  Infinity as InfinityIcon,
  Plus,
  Minus,
  ClipboardList
} from 'lucide-react';

const Timer = ({ plan, onOpenAIPlan, voiceEnabled = true, onWorkoutStateChange }) => {
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

  // Trạng thái kiểm tra xem có đang trong quá trình tập luyện dở dang không
  const isWorkoutInProgress = isActive || (isMaxChallenge && timeLeft > 0) || (!isMaxChallenge && (timeLeft < totalSetDuration || currentSetIndex > 0));

  // Thông báo trạng thái đang tập lên component App để khóa chuyển Tab
  useEffect(() => {
    onWorkoutStateChange?.(isWorkoutInProgress);
  }, [isWorkoutInProgress, onWorkoutStateChange]);

  // Touch drag swipe state for iOS Photo-style carousel
  const [dragOffset, setDragOffset] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const touchStartX = useRef(null);
  const touchEndX = useRef(null);

  const currentExercise = isMaxChallenge 
    ? { name: "Thách Thức Giới Hạn", holdTime: 0, tip: "Giữ form chuẩn, phá vỡ mọi giới hạn bản thân!" }
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
    if (plan) {
      let exs = [];
      if (plan.exercises && plan.exercises.length > 0) {
        exs = plan.exercises;
      } else if (plan.days && plan.days[0]?.exercises?.length > 0) {
        exs = plan.days[0].exercises;
      }

      if (exs.length > 0) {
        setIsMaxChallenge(false);
        setExercises(exs);
        setCurrentSetIndex(0);
        setIsActive(false);
        setIsResting(false);
        setTimeLeft(exs[0].holdTime);
        setTotalSetDuration(exs[0].holdTime);
        setSessionTotalHoldSeconds(0);
      }
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

              // 1. Âm thanh & Rung nhịp tim đập kép dồn dập ở 15 giây cuối hiệp (Focus Heartbeat Rhythm)
              if (!isResting && prev <= 16 && prev >= 7) {
                playHeartbeatSound({ enabled: voiceEnabled });
                triggerHapticHeartbeat();
              }

              // 2. Rung phản hồi đếm ngược 5 giây cuối
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
      finishWorkoutSession(sessionTotalHoldSeconds, exercises.length, plan?.planName || "Plank Tự Do", plan?.id);
    }
  };

  // Hoàn thành buổi tập / dừng Thách thức Vô cực
  const finishWorkoutSession = (totalHold, completedSetsCount, planTitle, planId = null) => {
    setIsActive(false);
    setIsResting(false);
    releaseWakeLock();
    triggerHapticSuccess();

    if (voiceEnabled) playVoiceClip('workout_complete', 'Xuất sắc! Bạn vừa hoàn thành bài tập!', { enabled: voiceEnabled });
    
    const maxSingleHold = isMaxChallenge 
      ? totalHold 
      : Math.max(...exercises.map(e => Number(e.holdTime || 0)));

    const sessionResult = {
      planId: planId || (isMaxChallenge ? 'max_challenge' : plan?.id || null),
      planName: planTitle,
      duration: totalHold,
      maxSingleHold: maxSingleHold,
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
          if (timeLeft === 0) {
            playVoiceClip('start_challenge', 'Bắt đầu Thách Thức Giới Hạn! Hãy giữ vững đến giây cuối cùng!', { enabled: voiceEnabled });
          } else {
            playVoiceClip('resume_workout', 'Tiếp tục nào! Giữ vững tư thế!', { enabled: voiceEnabled });
          }
        } else if (isResting) {
          playVoiceClip('rest_start', 'Tiếp tục nghỉ ngơi hồi sức', { enabled: voiceEnabled });
        } else {
          if (timeLeft < totalSetDuration) {
            // Đang tạm dừng và bấm tiếp tục -> Phát khẩu lệnh tiếp tục dứt khoát
            playVoiceClip('resume_workout', 'Tiếp tục nào! Giữ vững tư thế!', { enabled: voiceEnabled });
          } else {
            // Bắt đầu hiệp mới từ đầu -> Phát câu lệnh bắt đầu bài tập
            playVoiceClip('start_workout', `Bắt đầu. ${currentExercise.name}`, { enabled: voiceEnabled });
          }
        }
      }
    }
    setIsActive(!isActive);
  };

  const handleToggleCountMode = () => {
    // Khi đang trong bài tập, nút bấm hoàn toàn không có tác dụng (phải bấm kết thúc/đặt lại bài tập mới được đổi)
    if (isWorkoutInProgress) {
      triggerHapticWarning();
      return;
    }

    triggerHapticMedium();
    const nextMode = !isMaxChallenge;
    setIsMaxChallenge(nextMode);
    setIsResting(false);
    setCurrentSetIndex(0);

    if (nextMode) {
      // Chuyển sang Đếm Xuôi (Thách Thức Giới Hạn)
      setTimeLeft(0);
      setTotalSetDuration(0);
      setSessionTotalHoldSeconds(0);
      if (voiceEnabled) {
        playVoiceClip('start_challenge', 'Chuyển sang Thách Thức Giới Hạn! Hãy giữ plank lâu nhất có thể!', { enabled: voiceEnabled });
      }
    } else {
      // Chuyển về Đếm Ngược theo giáo án
      const firstHold = exercises[0]?.holdTime || 60;
      setTimeLeft(firstHold);
      setTotalSetDuration(firstHold);
      setSessionTotalHoldSeconds(0);
    }
  };

  const handleStopMaxChallenge = () => {
    triggerHapticSuccess();
    if (timeLeft > 0) {
      finishWorkoutSession(timeLeft, 1, "⚡ Thách Thức Giới Hạn");
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

  // Swipe handling (Smooth iOS Photos style carousel with rubber-band elasticity)
  const handleTouchStart = (e) => {
    if (isActive || isMaxChallenge || exercises.length <= 1) return;
    touchStartX.current = e.touches[0].clientX;
    setIsDragging(true);
  };

  const handleTouchMove = (e) => {
    if (!touchStartX.current || isActive || isMaxChallenge || exercises.length <= 1) return;
    const currentX = e.touches[0].clientX;
    let diff = currentX - touchStartX.current;

    // Hiệu ứng lò xo đàn hồi (Rubber-band) khi ở 2 đầu
    if ((currentSetIndex === 0 && diff > 0) || (currentSetIndex === exercises.length - 1 && diff < 0)) {
      diff = diff * 0.28;
    }
    setDragOffset(diff);
  };

  const handleTouchEnd = () => {
    if (!isDragging || isActive || isMaxChallenge || exercises.length <= 1) {
      setDragOffset(0);
      setIsDragging(false);
      return;
    }

    const threshold = 40;
    if (dragOffset < -threshold && currentSetIndex < exercises.length - 1) {
      handleSelectSet(currentSetIndex + 1);
    } else if (dragOffset > threshold && currentSetIndex > 0) {
      handleSelectSet(currentSetIndex - 1);
    }

    setDragOffset(0);
    setIsDragging(false);
    touchStartX.current = null;
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
    <div className="w-full h-full max-w-lg mx-auto flex flex-col justify-between items-center overflow-hidden p-4 sm:p-6 pb-28 sm:pb-32 select-none">
      {/* 1. Exercise Information Card - iPhone Photos Style Smooth Carousel (Khóa cứng h-[120px] chống nhảy đồng hồ) */}
      <div 
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        className="w-full h-[120px] glass-panel p-3 rounded-3xl text-center relative select-none transition-colors duration-300 shadow-sm shrink-0 overflow-hidden flex flex-col justify-between"
      >
        {isMaxChallenge ? (
          <div className="w-full h-full flex flex-col items-center justify-center space-y-2 py-1">
            <span className="text-xs sm:text-sm font-black uppercase px-4 py-1.5 rounded-full bg-cyan-100 text-cyan-900 dark:bg-cyan-950/80 dark:text-cyan-300 border-2 border-cyan-400/60 dark:border-cyan-500/40 shadow-sm">
              ⚡ THÁCH THỨC GIỚI HẠN
            </span>

            {/* Nút bấm (i) Mở Modal Chi Tiết */}
            <button 
              onClick={() => setShowInfoModal(true)}
              className="inline-flex items-center justify-center space-x-1.5 px-3 py-1 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-white/5 dark:hover:bg-white/10 border border-slate-200/80 dark:border-white/10 text-xs text-slate-700 dark:text-gray-300 active:scale-95 transition-all max-w-full"
            >
              <div className="w-3.5 h-3.5 rounded-full bg-cyan-500/20 text-cyan-600 dark:text-cyan-neon flex items-center justify-center shrink-0">
                <Info size={10} />
              </div>
              <span className="truncate text-[10px] font-medium">
                Giữ tư thế chuẩn đến khi chạm sàn để lập kỷ lục mới
              </span>
              <span className="text-[10px] text-cyan-600 dark:text-cyan-neon font-bold ml-1 shrink-0">Chi tiết</span>
            </button>
          </div>
        ) : (
          <>
            {/* Carousel Sliding Track */}
            <div 
              className="flex w-full will-change-transform"
              style={{
                transform: `translateX(calc(-${currentSetIndex * 100}% + ${dragOffset}px))`,
                transition: isDragging ? 'none' : 'transform 320ms cubic-bezier(0.25, 1, 0.5, 1)'
              }}
            >
              {exercises.map((ex, idx) => {
                const isCurrent = idx === currentSetIndex;
                return (
                  <div 
                    key={idx} 
                    className="w-full shrink-0 px-3 flex flex-col items-center justify-center"
                  >
                    <div className="flex items-center justify-center space-x-2">
                      <span className="text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-300/40">
                        HIỆP {idx + 1} / {exercises.length}
                      </span>
                      <span className="text-[10px] font-mono font-bold text-slate-500 dark:text-gray-400">
                        {ex.holdTime}s giữ • {ex.restTime || 20}s nghỉ
                      </span>
                    </div>

                    <h2 className="text-lg sm:text-xl font-black mt-1 tracking-tight text-slate-900 dark:text-white px-5 truncate max-w-full">
                      {isResting && isCurrent ? "❄️ Thời Gian Nghỉ Hồi Sức" : ex.name}
                    </h2>

                    {/* Nút bấm (i) Mở Modal Chi Tiết */}
                    <button 
                      onClick={() => setShowInfoModal(true)}
                      className="mt-1 inline-flex items-center justify-center space-x-1.5 px-3 py-1 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-white/5 dark:hover:bg-white/10 border border-slate-200/80 dark:border-white/10 text-xs text-slate-700 dark:text-gray-300 active:scale-95 transition-all max-w-full"
                    >
                      <div className="w-3.5 h-3.5 rounded-full bg-cyan-500/20 text-cyan-600 dark:text-cyan-neon flex items-center justify-center shrink-0">
                        <Info size={10} />
                      </div>
                      <span className="truncate text-[10px] font-medium">
                        {ex.tip || "Siết cơ bụng, giữ thẳng lưng, thở đều"}
                      </span>
                      <span className="text-[10px] text-cyan-600 dark:text-cyan-neon font-bold ml-1 shrink-0">Chi tiết</span>
                    </button>
                  </div>
                );
              })}
            </div>

            {/* Multi-set progress indicator dots (iPhone pagination style) */}
            <div className="flex justify-center items-center space-x-1.5 h-2 shrink-0">
              {exercises.length > 1 && exercises.map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSelectSet(idx)}
                  disabled={isActive}
                  className={`h-1.5 rounded-full transition-all duration-300 ${
                    idx === currentSetIndex
                      ? 'w-6 bg-emerald-500 dark:bg-neon shadow-sm'
                      : idx < currentSetIndex
                      ? 'w-1.5 bg-slate-400 dark:bg-gray-500'
                      : 'w-1.5 bg-slate-200 dark:bg-white/10'
                  }`}
                  title={`Chuyển tới Hiệp ${idx + 1}`}
                />
              ))}
            </div>
          </>
        )}
      </div>

      {/* 2. Main HUD Circular Timer (Khóa cứng vị trí chuẩn 100% trong cả 2 chế độ) */}
      <div className="flex flex-col items-center justify-center my-auto w-full relative shrink-0">
        {/* Nút Vô Cực Chuyển Đổi Đếm Xuôi ở Góc Phải Phía Trên Đồng Hồ */}
        <button
          onClick={handleToggleCountMode}
          disabled={isWorkoutInProgress}
          className={`w-10 h-10 rounded-2xl flex items-center justify-center transition-all shadow-sm border absolute -top-3 right-3 sm:right-8 z-20 ${
            isWorkoutInProgress 
              ? 'opacity-30 cursor-not-allowed border-slate-300 dark:border-white/10 text-slate-400 dark:text-gray-600 bg-slate-100 dark:bg-white/5' 
              : isMaxChallenge
              ? 'bg-cyan-500 hover:bg-cyan-400 text-slate-950 border-cyan-300 shadow-md shadow-cyan-500/30 ring-2 ring-cyan-400 active:scale-90'
              : 'bg-white dark:bg-white/5 text-cyan-600 dark:text-cyan-neon border-cyan-300/60 dark:border-cyan-500/30 hover:bg-cyan-50 dark:hover:bg-cyan-950/40 active:scale-90'
          }`}
          title={
            isWorkoutInProgress
              ? "Hãy bấm kết thúc hoặc đặt lại bài tập trước khi đổi chế độ đếm"
              : isMaxChallenge
              ? "Chế độ Đếm Xuôi (Bấm để về Đếm Ngược)"
              : "Bấm để chuyển sang Chế độ Đếm Xuôi (Giữ lâu nhất có thể)"
          }
        >
          <InfinityIcon size={20} className={isMaxChallenge && !isWorkoutInProgress ? "animate-pulse" : ""} />
        </button>

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

        {/* Quick Time Adjuster / Status Bar (Cố định chiều cao h-12 mt-4 sm:mt-5 trong cả 2 chế độ) */}
        <div className="h-12 mt-4 sm:mt-5 flex items-center justify-center shrink-0">
          {!isMaxChallenge ? (
            <div className="flex justify-center items-center space-x-6 h-12">
              {/* Nút -15s: Viền tròn Vàng Hổ Phách */}
              <button
                onClick={() => handleAdjustTime(-15)}
                className="w-11 h-11 sm:w-12 sm:h-12 rounded-full bg-amber-500/10 dark:bg-amber-950/30 border-2 border-amber-400/70 dark:border-amber-500/50 hover:bg-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center font-mono font-black text-xs active:scale-90 transition-all shadow-sm"
                title="Giảm 15 giây"
              >
                <span>-15s</span>
              </button>

              {/* Nút +15s: Viền tròn Xanh Lục Bảo */}
              <button
                onClick={() => handleAdjustTime(15)}
                className="w-11 h-11 sm:w-12 sm:h-12 rounded-full bg-emerald-500/10 dark:bg-emerald-950/30 border-2 border-emerald-400/70 dark:border-emerald-500/50 hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-mono font-black text-xs active:scale-90 transition-all shadow-sm"
                title="Tăng 15 giây"
              >
                <span>+15s</span>
              </button>
            </div>
          ) : (
            <div className="h-12 flex items-center justify-center">
              <div className="text-[11px] font-bold text-slate-500 dark:text-gray-400 flex items-center space-x-1.5 px-4 py-2 rounded-full bg-cyan-50 dark:bg-cyan-950/30 border border-cyan-300/40 dark:border-cyan-500/20 shadow-sm">
                <Zap size={13} className="text-cyan-600 dark:text-cyan-neon" />
                <span>Gồng giữ tự do không giới hạn</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 4. Giant Tactical Control Buttons (Cố định chiều cao h-16 mb-3 sm:mb-5 chống nhảy vị trí) */}
      <div className="w-full h-16 mb-3 sm:mb-5 shrink-0 flex items-center justify-center">
        <div className={`flex items-center justify-center space-x-3.5 mx-auto w-full ${isMaxChallenge ? 'max-w-[320px]' : 'max-w-md'}`}>
          {/* Reset / Stop Button */}
          <button
            onClick={handleResetTimer}
            className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl sm:rounded-3xl bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 flex items-center justify-center text-slate-600 dark:text-gray-400 hover:text-slate-900 dark:hover:text-white active:scale-90 transition-all shadow-sm shrink-0"
            title="Khởi động lại bài tập"
          >
            <RotateCcw size={22} />
          </button>

          {/* Huge Main Play / Pause / Stop Challenge Button */}
          {isMaxChallenge && isActive ? (
            <button
              onClick={handleStopMaxChallenge}
              className="flex-1 h-14 sm:h-16 rounded-2xl sm:rounded-3xl font-black text-base sm:text-lg tracking-wider uppercase flex items-center justify-center space-x-2.5 transition-all active:scale-95 bg-gradient-to-r from-rose-500 via-red-500 to-amber-500 hover:from-rose-400 hover:to-amber-400 text-white shadow-lg shadow-red-500/30"
            >
              <Trophy size={22} />
              <span>KẾT THÚC</span>
            </button>
          ) : (
            <button
              onClick={handleToggleTimer}
              className={`flex-1 h-14 sm:h-16 rounded-2xl sm:rounded-3xl font-black text-base sm:text-lg tracking-wider uppercase flex items-center justify-center space-x-2.5 transition-all active:scale-95 shadow-md ${
                isActive
                  ? 'bg-amber-500 hover:bg-amber-400 text-white shadow-amber-500/20'
                  : isMaxChallenge
                  ? 'bg-gradient-to-r from-sky-400 via-cyan-400 to-teal-400 hover:from-sky-300 hover:to-teal-300 text-slate-950 shadow-lg shadow-cyan-500/30 border border-cyan-300/30'
                  : 'bg-gradient-to-r from-emerald-500 via-emerald-600 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white shadow-emerald-500/20'
              }`}
            >
              {isActive ? (
                <>
                  <Pause size={24} fill="currentColor" />
                  <span>TẠM DỪNG</span>
                </>
              ) : (
                <>
                  <Play size={24} fill="currentColor" />
                  <span>{timeLeft < totalSetDuration && !isMaxChallenge ? "TIẾP TỤC" : (isMaxChallenge && timeLeft > 0 ? "TIẾP TỤC" : "BẮT ĐẦU TẬP")}</span>
                </>
              )}
            </button>
          )}

          {/* Next Set Button */}
          {exercises.length > 1 && !isMaxChallenge && (
            <button
              onClick={handleSkipSet}
              className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl sm:rounded-3xl bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 flex items-center justify-center text-slate-600 dark:text-gray-400 hover:text-slate-900 dark:hover:text-white active:scale-90 transition-all shadow-sm shrink-0"
              title="Chuyển sang hiệp kế tiếp"
            >
              <SkipForward size={22} />
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
                  {completedSessionData.calories || Math.round((completedSessionData.duration / 60) * 4.5)} kcal
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