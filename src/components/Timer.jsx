import React, { useState, useEffect } from 'react';
import CircularProgress from './UI/CircularProgress';
import { unlockSpeechAPI, speakText } from '../utils/speechUtils';
import { saveHistory } from '../services/storageService';
import { Play, Pause, Square } from 'lucide-react';

const Timer = ({ plan }) => {
  const [isActive, setIsActive] = useState(false);
  const [isResting, setIsResting] = useState(false);
  const [timeLeft, setTimeLeft] = useState(0);
  const [totalTime, setTotalTime] = useState(0);
  const [currentSetIndex, setCurrentSetIndex] = useState(0);
  
  const exercises = plan ? plan.days[0].exercises : [{ name: "Plank tự do", holdTime: 60, restTime: 0 }];
  const currentExercise = exercises[currentSetIndex];

  useEffect(() => {
    if (!isActive) {
      const time = isResting ? currentExercise.restTime : currentExercise.holdTime;
      setTotalTime(time);
      setTimeLeft(time);
    }
  }, [currentExercise, isResting, plan]);

  useEffect(() => {
    let interval = null;
    if (isActive && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft(time => {
          if (time === 6 && !isResting) speakText("Năm");
          if (time === 5 && !isResting) speakText("Bốn");
          if (time === 4 && !isResting) speakText("Ba");
          if (time === 3 && !isResting) speakText("Hai");
          if (time === 2 && !isResting) speakText("Một");
          return time - 1;
        });
      }, 1000);
    } else if (isActive && timeLeft === 0) {
      handleSetComplete();
    }
    return () => clearInterval(interval);
  }, [isActive, timeLeft]);

  const handleSetComplete = () => {
    if (!isResting && currentExercise.restTime > 0 && currentSetIndex < exercises.length - 1) {
      setIsResting(true);
      speakText("Nghỉ ngơi");
    } else if (currentSetIndex < exercises.length - 1) {
      setIsResting(false);
      setCurrentSetIndex(prev => prev + 1);
      speakText("Bắt đầu hiệp mới");
    } else {
      setIsActive(false);
      speakText("Tuyệt vời, bạn đã hoàn thành bài tập");
      saveHistory({
        planName: plan ? plan.planName : "Tập tự do",
        duration: exercises.reduce((acc, curr) => acc + curr.holdTime, 0)
      });
    }
  };

  const toggleTimer = () => {
    unlockSpeechAPI();
    if (!isActive) speakText(isResting ? "Tiếp tục nghỉ" : "Bắt đầu");
    setIsActive(!isActive);
  };

  const stopTimer = () => {
    setIsActive(false); setIsResting(false); setCurrentSetIndex(0);
    setTimeLeft(exercises[0].holdTime); setTotalTime(exercises[0].holdTime);
  };

  const progress = totalTime > 0 ? ((totalTime - timeLeft) / totalTime) * 100 : 0;

  return (
    <div className="flex flex-col items-center justify-center p-6 w-full h-full pt-16">
      <h2 className="text-2xl font-bold mb-10">{isResting ? "Nghỉ ngơi" : currentExercise.name}</h2>
      
      <CircularProgress 
        progress={progress} text={timeLeft} subtitle="GIÂY" 
        colorClass={isResting ? "text-blue-500" : "text-neon"}
      />
      
      <div className="mt-16 flex space-x-6 w-full max-w-xs">
        <button 
          onClick={toggleTimer}
          className="flex-1 bg-neon text-oled font-bold py-5 rounded-3xl flex justify-center items-center active:scale-90 transition-transform"
        >
          {isActive ? <Pause size={36} /> : <Play size={36} fill="currentColor" />}
        </button>
        <button 
          onClick={stopTimer}
          className="flex-1 bg-gray-800 text-white font-bold py-5 rounded-3xl flex justify-center items-center active:scale-90 transition-transform"
        >
          <Square size={36} fill="currentColor" />
        </button>
      </div>
      <div className="mt-10 text-gray-500 font-medium tracking-widest uppercase">
        Hiệp {currentSetIndex + 1} / {exercises.length}
      </div>
    </div>
  );
};

export default Timer;