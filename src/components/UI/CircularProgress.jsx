import React from 'react';

const CircularProgress = ({ progress, text, subtitle, colorClass = "text-neon" }) => {
  const radius = 120;
  const stroke = 12;
  const normalizedRadius = radius - stroke * 2;
  const circumference = normalizedRadius * 2 * Math.PI;
  const strokeDashoffset = circumference - (progress / 100) * circumference;

  return (
    <div className="relative flex items-center justify-center">
      <svg height={radius * 2} width={radius * 2} className="transform -rotate-90">
        <circle
          className="text-gray-200 dark:text-gray-900"
          strokeWidth={stroke} stroke="currentColor" fill="transparent"
          r={normalizedRadius} cx={radius} cy={radius}
        />
        <circle
          className={`transition-all duration-1000 ease-linear ${colorClass}`}
          strokeWidth={stroke} strokeDasharray={circumference + ' ' + circumference}
          style={{ strokeDashoffset }}
          strokeLinecap="round" stroke="currentColor" fill="transparent"
          r={normalizedRadius} cx={radius} cy={radius}
        />
      </svg>
      <div className="absolute flex flex-col items-center justify-center text-center">
        <span className="text-7xl font-bold tracking-tighter">{text}</span>
        {subtitle && <span className="text-lg text-gray-500 mt-2">{subtitle}</span>}
      </div>
    </div>
  );
};

export default CircularProgress;