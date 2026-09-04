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
  const size = 232;
  const strokeWidth = 12;
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const strokeDashoffset = isMaxChallenge 
    ? circumference - ((timeLeft % 60) / 60) * circumference
    : circumference - (progress / 100) * circumference;

  let strokeGradientId = "neonGradient";
  let glowColor = "rgba(16, 185, 129, 0.5)";

  if (isMaxChallenge) {
    strokeGradientId = "cosmicGradient";
    glowColor = "rgba(6, 182, 212, 0.6)";
  } else if (isResting) {
    strokeGradientId = "cyanGradient";
    glowColor = "rgba(6, 182, 212, 0.5)";
  }

  return (
    <div className="relative flex items-center justify-center">
      {/* Background radial glow - Quầng sáng Neon rực rỡ đa tầng */}
      <div 
        className={`absolute w-52 h-52 rounded-full blur-3xl transition-all duration-700 pointer-events-none ${
          isActive 
            ? 'opacity-40 dark:opacity-70 scale-105' 
            : 'opacity-25 dark:opacity-55 scale-100'
        }`}
        style={{ 
          backgroundColor: isMaxChallenge ? '#06b6d4' : (isResting ? '#00f2fe' : '#10b981') 
        }}
      />
      {/* Lõi sáng trung tâm giúp tỏa sáng rực rỡ phía sau con số */}
      <div 
        className={`absolute w-32 h-32 rounded-full blur-2xl transition-all duration-500 pointer-events-none ${
          isActive 
            ? 'opacity-30 dark:opacity-50' 
            : 'opacity-15 dark:opacity-30'
        }`}
        style={{ 
          backgroundColor: isMaxChallenge ? '#22d3ee' : (isResting ? '#38bdf8' : '#34d399') 
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

          {/* Gradient cho chế độ Đếm Xuôi Vô Cực */}
          <linearGradient id="cosmicGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#06b6d4" />
            <stop offset="50%" stopColor="#00f2fe" />
            <stop offset="100%" stopColor="#10b981" />
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
            ? 'bg-cyan-50 text-cyan-800 border-cyan-300 dark:bg-cyan-950/80 dark:border-cyan-500/40 dark:text-cyan-neon'
            : isResting 
            ? 'bg-cyan-50 text-cyan-800 border-cyan-300 dark:bg-cyan-950/80 dark:border-cyan-500/40 dark:text-cyan-neon'
            : 'bg-emerald-50 text-emerald-800 border-emerald-300 dark:bg-emerald-950/80 dark:border-emerald-500/40 dark:text-emerald-400'
        }`}>
          {isMaxChallenge ? "⚡ ĐẾM XUÔI" : (isResting ? "❄️ HỒI SỨC" : "🔥 ĐANG GIỮ CORE")}
        </span>

        {/* Main Big Digit Timer */}
        <div className="font-mono text-5xl sm:text-6xl font-black tracking-tighter leading-none text-slate-900 dark:text-white">
          {timeLeft}
        </div>

        {/* Secondary Info / Target */}
        <div className="text-[11px] font-medium text-slate-500 dark:text-gray-400 mt-1">
          {isMaxChallenge ? (
            <span>Kỷ lục: <strong className="text-cyan-600 dark:text-cyan-neon font-bold">{personalRecord}s</strong></span>
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