import React from 'react';

const CircularProgress = ({ 
  progress = 0, 
  timeLeft = 0, 
  totalTime = 60,
  status = "HOLD", 
  isResting = false,
  exerciseName = "Plank Cơ Bản"
}) => {
  const size = 260;
  const strokeWidth = 14;
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const strokeDashoffset = circumference - (progress / 100) * circumference;

  // Màu sắc theo trạng thái: Luyện tập (Neon Xanh) vs Nghỉ ngơi (Cyan / Blue Ice)
  const strokeGradientId = isResting ? "cyanGradient" : "neonGradient";
  const glowColor = isResting ? "rgba(0, 242, 254, 0.45)" : "rgba(57, 255, 20, 0.45)";

  return (
    <div className="relative flex items-center justify-center my-4">
      {/* Background radial glow */}
      <div 
        className="absolute w-56 h-56 rounded-full blur-3xl opacity-30 transition-all duration-700 pointer-events-none"
        style={{ backgroundColor: isResting ? '#00f2fe' : '#39ff14' }}
      />

      <svg width={size} height={size} className="transform -rotate-90 drop-shadow-2xl">
        <defs>
          {/* Gradient cho chế độ Luyện tập */}
          <linearGradient id="neonGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#39ff14" />
            <stop offset="100%" stopColor="#00f2fe" />
          </linearGradient>

          {/* Gradient cho chế độ Nghỉ ngơi */}
          <linearGradient id="cyanGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#00f2fe" />
            <stop offset="100%" stopColor="#4facfe" />
          </linearGradient>

          {/* Filter tạo hiệu ứng Glow bóng bẩy */}
          <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="4" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>

        {/* Track Background */}
        <circle
          className="text-white/5 dark:text-white/5 light:text-slate-200"
          strokeWidth={strokeWidth}
          stroke="currentColor"
          fill="transparent"
          r={radius}
          cx={size / 2}
          cy={size / 2}
        />

        {/* Dynamic Progress Stroke */}
        <circle
          className="transition-all duration-500 ease-out"
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          style={{ strokeDashoffset }}
          strokeLinecap="round"
          stroke={`url(#${strokeGradientId})`}
          filter="url(#glow)"
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
          isResting 
            ? 'bg-cyan-neon/15 text-cyan-neon border border-cyan-neon/30 shadow-cyan-glow' 
            : 'bg-neon/15 text-neon border border-neon/30 shadow-neon'
        }`}>
          {isResting ? "❄️ HỒI SỨC" : "🔥 ĐANG GIỮ CORE"}
        </div>

        {/* Big Digital Timer Display */}
        <div className="flex items-baseline justify-center">
          <span className="font-mono text-7xl font-extrabold tracking-tight text-white dark:text-white light:text-slate-900 drop-shadow-md">
            {timeLeft}
          </span>
          <span className="text-sm font-bold text-gray-400 ml-1.5 uppercase">s</span>
        </div>

        {/* Total Set Time / Progress Percentage */}
        <div className="text-xs font-medium text-gray-400 dark:text-gray-400 light:text-slate-500 mt-1">
          Mục tiêu: <span className="text-white dark:text-white light:text-slate-800 font-semibold">{totalTime}s</span> ({Math.round(progress)}%)
        </div>
      </div>
    </div>
  );
};

export default CircularProgress;