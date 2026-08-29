import React, { useState, useEffect } from 'react';
import { 
  History as HistoryIcon, 
  Download, 
  Trash2, 
  Flame, 
  Clock, 
  Calendar, 
  Trophy, 
  Zap, 
  CheckCircle2
} from 'lucide-react';
import { getHistory, getHistoryStats, exportCSV, clearHistory } from '../services/storageService';

const History = ({ onStartWorkout }) => {
  const [historyList, setHistoryList] = useState(getHistory());
  const [stats, setStats] = useState(getHistoryStats());
  const [copied, setCopied] = useState(false);

  const refreshData = () => {
    setHistoryList(getHistory());
    setStats(getHistoryStats());
  };

  const handleExport = () => {
    const success = exportCSV();
    if (success) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  const handleClear = () => {
    if (window.confirm("Bạn có chắc chắn muốn xóa toàn bộ lịch sử luyện tập không?")) {
      clearHistory();
      refreshData();
    }
  };

  return (
    <div className="p-4 sm:p-6 space-y-6 pb-28 max-w-lg mx-auto">
      {/* Header Banner */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white flex items-center space-x-2">
            <span>Lịch Sử & Thống Kê</span>
          </h2>
          <p className="text-xs text-slate-500 dark:text-gray-400 mt-0.5">
            Theo dõi sự tiến bộ và sức bền Core qua từng ngày
          </p>
        </div>

        {historyList.length > 0 && (
          <button
            onClick={handleExport}
            className="px-3.5 py-2 rounded-2xl bg-emerald-50 text-emerald-700 border border-emerald-300 dark:bg-neon/15 dark:border-neon/30 dark:text-neon font-bold text-xs flex items-center space-x-1.5 shadow-sm active:scale-95 transition-all hover:bg-emerald-500 hover:text-white dark:hover:bg-neon dark:hover:text-black"
          >
            <Download size={14} />
            <span>{copied ? "Đã Xuất File!" : "Xuất CSV"}</span>
          </button>
        )}
      </div>

      {/* 4 Summary Stats Cards Grid */}
      <div className="grid grid-cols-2 gap-3">
        {/* Total Minutes */}
        <div className="glass-panel p-4 rounded-3xl relative overflow-hidden">
          <div className="flex items-center space-x-1.5 text-[11px] font-bold text-slate-500 dark:text-gray-400 uppercase">
            <Clock size={13} className="text-cyan-600 dark:text-cyan-neon" />
            <span>Tổng Thời Gian</span>
          </div>
          <div className="mt-2 flex items-baseline space-x-1">
            <span className="font-mono text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">
              {stats.totalMinutes}
            </span>
            <span className="text-xs text-slate-500 dark:text-gray-400 font-bold">phút</span>
          </div>
          <div className="text-[10px] text-slate-400 dark:text-gray-500 mt-1 font-mono">
            ({stats.totalSeconds}s giữ Core)
          </div>
        </div>

        {/* Total Calories */}
        <div className="glass-panel p-4 rounded-3xl relative overflow-hidden">
          <div className="flex items-center space-x-1.5 text-[11px] font-bold text-slate-500 dark:text-gray-400 uppercase">
            <Flame size={13} className="text-emerald-600 dark:text-neon" />
            <span>Calo Tiêu Hao</span>
          </div>
          <div className="mt-2 flex items-baseline space-x-1">
            <span className="font-mono text-2xl sm:text-3xl font-black text-emerald-600 dark:text-neon">
              {stats.totalCalories}
            </span>
            <span className="text-xs text-slate-500 dark:text-gray-400 font-bold">kcal</span>
          </div>
          <div className="text-[10px] text-slate-400 dark:text-gray-500 mt-1">
            Ước tính tiêu chuẩn
          </div>
        </div>

        {/* Workout Sessions */}
        <div className="glass-panel p-4 rounded-3xl relative overflow-hidden">
          <div className="flex items-center space-x-1.5 text-[11px] font-bold text-slate-500 dark:text-gray-400 uppercase">
            <Trophy size={13} className="text-amber-500 dark:text-amber-400" />
            <span>Tổng Số Buổi</span>
          </div>
          <div className="mt-2 flex items-baseline space-x-1">
            <span className="font-mono text-2xl sm:text-3xl font-black text-amber-500 dark:text-amber-400">
              {stats.totalWorkouts}
            </span>
            <span className="text-xs text-slate-500 dark:text-gray-400 font-bold">buổi</span>
          </div>
          <div className="text-[10px] text-slate-400 dark:text-gray-500 mt-1">
            Đã hoàn thành
          </div>
        </div>

        {/* Streak Days */}
        <div className="glass-panel p-4 rounded-3xl relative overflow-hidden">
          <div className="flex items-center space-x-1.5 text-[11px] font-bold text-slate-500 dark:text-gray-400 uppercase">
            <Zap size={13} className="text-purple-600 dark:text-purple-400" />
            <span>Ngày Luyện Tập</span>
          </div>
          <div className="mt-2 flex items-baseline space-x-1">
            <span className="font-mono text-2xl sm:text-3xl font-black text-purple-600 dark:text-purple-400">
              {stats.streak}
            </span>
            <span className="text-xs text-slate-500 dark:text-gray-400 font-bold">ngày</span>
          </div>
          <div className="text-[10px] text-slate-400 dark:text-gray-500 mt-1">
            Chuỗi kiên trì
          </div>
        </div>
      </div>

      {/* Workout History List */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-700 dark:text-gray-300">
            Chi Tiết Các Buổi Tập ({historyList.length})
          </h3>
          {historyList.length > 0 && (
            <button
              onClick={handleClear}
              className="text-[11px] text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 flex items-center space-x-1"
            >
              <Trash2 size={12} />
              <span>Xóa tất cả</span>
            </button>
          )}
        </div>

        {historyList.length === 0 ? (
          <div className="text-center py-12 glass-panel rounded-3xl p-6 space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-slate-400 dark:text-gray-500 mx-auto flex items-center justify-center">
              <HistoryIcon size={24} />
            </div>
            <h4 className="text-sm font-bold text-slate-800 dark:text-gray-300">Chưa có lịch sử tập luyện</h4>
            <p className="text-xs text-slate-500 dark:text-gray-400 max-w-xs mx-auto">
              Hãy hoàn thành bài tập đầu tiên của bạn để xem biểu đồ và số liệu phân tích tại đây!
            </p>
            <button
              onClick={onStartWorkout}
              className="mt-2 px-5 py-2.5 rounded-2xl bg-emerald-500 text-white dark:bg-neon dark:text-black font-bold text-xs uppercase tracking-wider shadow-sm dark:shadow-neon active:scale-95 transition-all"
            >
              Bắt Đầu Tập Ngay
            </button>
          </div>
        ) : (
          <div className="space-y-2.5">
            {historyList.map((item) => (
              <div
                key={item.id}
                className="glass-panel p-4 rounded-2xl flex items-center justify-between hover:border-slate-300 dark:hover:border-white/20 transition-all"
              >
                <div className="flex items-start space-x-3">
                  <div className="w-10 h-10 rounded-2xl bg-emerald-50 dark:bg-neon/10 border border-emerald-300 dark:border-neon/20 flex items-center justify-center text-emerald-600 dark:text-neon shrink-0 mt-0.5">
                    <CheckCircle2 size={18} />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-slate-900 dark:text-white">
                      {item.planName || "Plank Tự Do"}
                    </div>
                    <div className="flex items-center space-x-2 text-[10px] text-slate-500 dark:text-gray-400 mt-1">
                      <span className="flex items-center space-x-1">
                        <Calendar size={10} />
                        <span>{new Date(item.date).toLocaleDateString('vi-VN')}</span>
                      </span>
                      <span>•</span>
                      <span>{new Date(item.date).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}</span>
                      {item.completedSets && (
                        <>
                          <span>•</span>
                          <span className="text-slate-700 dark:text-gray-300 font-semibold">{item.completedSets} Hiệp</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                <div className="text-right pl-3 shrink-0">
                  <div className="font-mono text-sm font-extrabold text-emerald-600 dark:text-neon">
                    {item.duration}s
                  </div>
                  <div className="text-[10px] text-slate-500 dark:text-gray-400 font-medium">
                    ~{item.calories || Math.round((item.duration / 60) * 4.5)} kcal
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default History;
