import React from 'react';

const CircularProgress = ({ 
  progress = 0, 
  timeLeft = 0, 
  totalTime = 60,
  isResting = false,
  isMaxChallenge = false,
  isActive = false,
  personalRecord = 60,
  exerciseName = "Plank Cơ Bản"
}) => {
  const size = 240;
  const strokeWidth = 13;
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const strokeDashoffset = isMaxChallenge 
    ? circumference - ((timeLeft % 60) / 60) * circumference
    : circumference - (progress / 100) * circumference;

  let strokeGradientId = "neonGradient";
  let glowColor = "rgba(16, 185, 129, 0.5)";

  if (isMaxChallenge) {
    strokeGradientId = "cosmicGradient";
    glowColor = "rgba(168, 85, 247, 0.6)";
  } else if (isResting) {
    strokeGradientId = "cyanGradient";
    glowColor = "rgba(6, 182, 212, 0.5)";
  }

  return (
    <div className="relative flex items-center justify-center">
      {/* Background radial glow */}
      <div 
        className="absolute w-52 h-52 rounded-full blur-3xl opacity-20 dark:opacity-35 transition-all duration-700 pointer-events-none"
        style={{ 
          backgroundColor: isMaxChallenge ? '#8b5cf6' : (isResting ? '#00f2fe' : '#10b981') 
        }}
      />

      <svg width={size} height={size} className="transform -rotate-90">
        <defs>
          {/* Gradient cho chế độ Luyện tập chuẩn */}
          <linearGradient id="neonGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#10b981" />
            <stop offset="100%" stopColor="#06b6d4" />
          </linearGradient>

          {/* Gradient cho chế độ Nghỉ ngơi */}
          <linearGradient id="cyanGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#06b6d4" />
            <stop offset="100%" stopColor="#3b82f6" />
          </linearGradient>

          {/* Gradient cho chế độ Thách Thức Vô Cực */}
          <linearGradient id="cosmicGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#a855f7" />
            <stop offset="50%" stopColor="#ec4899" />
            <stop offset="100%" stopColor="#00f2fe" />
          </linearGradient>
        </defs>

        {/* Track Circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="currentColor"
          strokeWidth={strokeWidth}
          className="text-slate-200 dark:text-white/10 fill-transparent"
        />

        {/* Dynamic Progress Sweep Circle with 60 FPS smooth CSS transition */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={`url(#${strokeGradientId})`}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          className="fill-transparent"
          style={{
            transition: isActive ? 'stroke-dashoffset 1000ms linear' : 'stroke-dashoffset 300ms ease-out',
            filter: isActive ? `drop-shadow(0 0 10px ${glowColor})` : 'none',
            willChange: 'stroke-dashoffset'
          }}
        />
      </svg>

      {/* Inside Content */}
      <div className="absolute flex flex-col items-center justify-center text-center">
        {/* Status Badge */}
        <span className={`text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full mb-1 tracking-wider border shadow-sm ${
          isMaxChallenge
            ? 'bg-purple-100 text-purple-800 border-purple-300 dark:bg-purple-950/80 dark:border-purple-500/40 dark:text-purple-300'
            : isResting 
            ? 'bg-cyan-50 text-cyan-800 border-cyan-300 dark:bg-cyan-950/80 dark:border-cyan-500/40 dark:text-cyan-neon'
            : 'bg-emerald-50 text-emerald-800 border-emerald-300 dark:bg-emerald-950/80 dark:border-emerald-500/40 dark:text-emerald-400'
        }`}>
          {isMaxChallenge ? "🌌 KHÔNG GIỚI HẠN" : (isResting ? "❄️ HỒI SỨC" : "🔥 ĐANG GIỮ CORE")}
        </span>

        {/* Main Big Digit Timer */}
        <div className="font-mono text-5xl sm:text-6xl font-black tracking-tighter leading-none text-slate-900 dark:text-white">
          {timeLeft}
        </div>

        {/* Secondary Info / Target */}
        <div className="text-[11px] font-medium text-slate-500 dark:text-gray-400 mt-1">
          {isMaxChallenge ? (
            <span>Kỷ lục: <strong className="text-purple-600 dark:text-purple-400 font-bold">{personalRecord}s</strong></span>
          ) : isResting ? (
            <span>Mục tiêu: <strong className="text-cyan-600 dark:text-cyan-neon font-bold">{totalTime}s</strong></span>
          ) : (
            <span>Mục tiêu: <strong className="text-emerald-600 dark:text-emerald-400 font-bold">{totalTime}s</strong> ({Math.round(progress)}%)</span>
          )}
        </div>
      </div>
    </div>
  );
};

export default CircularProgress;