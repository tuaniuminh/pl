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
  const size = 260;
  const strokeWidth = 14;
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
    <div className="relative flex items-center justify-center my-4">
      {/* Background radial glow */}
      <div 
        className="absolute w-56 h-56 rounded-full blur-3xl opacity-20 dark:opacity-35 transition-all duration-700 pointer-events-none"
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

        {/* Track Background */}
        <circle
          className="text-slate-200 dark:text-white/10"
          strokeWidth={strokeWidth}
          stroke="currentColor"
          fill="transparent"
          r={radius}
          cx={size / 2}
          cy={size / 2}
        />

        {/* Dynamic Progress Stroke (Siêu mượt 60 FPS, chuyển động quét liên tục 1s linear) */}
        <circle
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          style={{ 
            strokeDashoffset,
            transition: isActive ? 'stroke-dashoffset 1000ms linear' : 'stroke-dashoffset 300ms ease-out',
            filter: `drop-shadow(0 0 6px ${glowColor})`,
            willChange: 'stroke-dashoffset'
          }}
          strokeLinecap="round"
          stroke={`url(#${strokeGradientId})`}
          fill="transparent"
          r={radius}
          cx={size / 2}
          cy={size / 2}
        />
      </svg>

      {/* Center Digital Counter & Information */}
      <div className="absolute flex flex-col items-center justify-center text-center px-4">
        {/* Status Badge */}
        <div className={`px-3 py-1 rounded-full text-[11px] font-extrabold tracking-widest uppercase mb-1 transition-all ${
          isMaxChallenge
            ? 'bg-purple-100 text-purple-800 border border-purple-300 dark:bg-purple-500/20 dark:text-purple-300 dark:border-purple-500/40 shadow-sm'
            : isResting 
            ? 'bg-cyan-100 text-cyan-800 border border-cyan-300 dark:bg-cyan-neon/15 dark:text-cyan-neon dark:border-cyan-neon/30 dark:shadow-cyan-glow' 
            : 'bg-emerald-100 text-emerald-800 border border-emerald-300 dark:bg-neon/15 dark:text-neon dark:border-neon/30 dark:shadow-neon'
        }`}>
          {isMaxChallenge ? "🌌 THÁCH THỨC VÔ CỰC" : (isResting ? "❄️ HỒI SỨC" : "🔥 ĐANG GIỮ CORE")}
        </div>

        {/* Big Digital Timer Display */}
        <div className="flex items-center justify-center">
          <span className={`font-mono text-7xl font-extrabold tracking-tight drop-shadow-sm ${
            isMaxChallenge 
              ? 'text-purple-600 dark:text-purple-300' 
              : 'text-slate-900 dark:text-white'
          }`}>
            {timeLeft}
          </span>
        </div>

        {/* Total Set Time / Progress Percentage / Challenge Milestone */}
        <div className="text-xs font-medium text-slate-600 dark:text-gray-400 mt-1">
          {isMaxChallenge ? (
            <span>
              Kỷ lục: <strong className="text-purple-600 dark:text-purple-400">{personalRecord}s</strong> {timeLeft > personalRecord && "🔥 KỶ LỤC MỚI!"}
            </span>
          ) : (
            <span>
              Mục tiêu: <span className="text-slate-900 dark:text-white font-semibold">{totalTime}s</span> ({Math.round(progress)}%)
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

export default CircularProgress;