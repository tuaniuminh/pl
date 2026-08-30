import React, { useState, useEffect } from 'react';
import { 
  History as HistoryIcon, 
  Trash2, 
  Flame, 
  Clock, 
  Calendar as CalendarIcon, 
  Trophy, 
  Zap, 
  CheckCircle2,
  Award,
  Lock,
  Sparkles,
  ShieldCheck,
  RotateCcw,
  ChevronLeft,
  ChevronRight,
  Info
} from 'lucide-react';
import { 
  getHistory, 
  getHistoryStats, 
  clearHistory, 
  BADGES_LIST, 
  getUnlockedBadges, 
  getUserProfile,
  recalibrateAndSyncAllData
} from '../services/storageService';

const History = ({ onStartWorkout }) => {
  const [activeTab, setActiveTab] = useState('history'); // 'history' | 'badges'
  const [historyList, setHistoryList] = useState(getHistory());
  const [stats, setStats] = useState(getHistoryStats());
  const [unlockedBadges, setUnlockedBadges] = useState(getUnlockedBadges());
  const [userProfile, setUserProfile] = useState(getUserProfile());
  const [synced, setSynced] = useState(false);
  const [currentViewDate, setCurrentViewDate] = useState(new Date());
  const [selectedDayDetail, setSelectedDayDetail] = useState(null);

  const refreshData = () => {
    recalibrateAndSyncAllData();
    setHistoryList(getHistory());
    setStats(getHistoryStats());
    setUnlockedBadges(getUnlockedBadges());
    setUserProfile(getUserProfile());
  };

  useEffect(() => {
    refreshData();
  }, []);

  const handleManualSync = () => {
    refreshData();
    setSynced(true);
    setTimeout(() => setSynced(false), 2000);
  };

  const handleClear = () => {
    if (window.confirm("Bạn có chắc chắn muốn xóa toàn bộ lịch sử luyện tập không?")) {
      clearHistory();
      refreshData();
      setSelectedDayDetail(null);
    }
  };

  const unlockedCount = unlockedBadges.length;
  const totalBadgesCount = BADGES_LIST.length;
  const badgeProgress = Math.round((unlockedCount / totalBadgesCount) * 100);

  // ==================== TÍNH TOÁN LỊCH VẾT LỬA (STREAK HEATMAP) ====================
  const viewYear = currentViewDate.getFullYear();
  const viewMonth = currentViewDate.getMonth(); // 0-11
  const today = new Date();
  const isCurrentMonthView = today.getFullYear() === viewYear && today.getMonth() === viewMonth;

  // Gom nhóm lịch sử theo ngày YYYY-MM-DD
  const workoutsMap = {};
  historyList.forEach((item) => {
    if (!item.date) return;
    const d = new Date(item.date);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    if (!workoutsMap[key]) {
      workoutsMap[key] = { count: 0, totalDuration: 0, totalCalories: 0, sessions: [] };
    }
    workoutsMap[key].count += 1;
    workoutsMap[key].totalDuration += (item.duration || 0);
    workoutsMap[key].totalCalories += (item.calories || 0);
    workoutsMap[key].sessions.push(item);
  });

  // Tính số ngày và offset cho tháng đang xem
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const startDayOfWeek = (new Date(viewYear, viewMonth, 1).getDay() + 6) % 7; // T2 là 0, CN là 6

  // Thống kê riêng trong tháng đang xem
  let activeDaysThisMonth = 0;
  let totalDurationThisMonth = 0;
  for (let day = 1; day <= daysInMonth; day++) {
    const key = `${viewYear}-${String(viewMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    if (workoutsMap[key] && workoutsMap[key].count > 0) {
      activeDaysThisMonth += 1;
      totalDurationThisMonth += workoutsMap[key].totalDuration;
    }
  }

  const handlePrevMonth = () => {
    setCurrentViewDate(new Date(viewYear, viewMonth - 1, 1));
    setSelectedDayDetail(null);
  };

  const handleNextMonth = () => {
    setCurrentViewDate(new Date(viewYear, viewMonth + 1, 1));
    setSelectedDayDetail(null);
  };

  const handleGoToday = () => {
    setCurrentViewDate(new Date());
    setSelectedDayDetail(null);
  };

  const handleSelectDay = (dayNum, dayData) => {
    if (!dayData || dayData.count === 0) {
      setSelectedDayDetail({
        dateStr: `${String(dayNum).padStart(2, '0')}/${String(viewMonth + 1).padStart(2, '0')}/${viewYear}`,
        count: 0,
        totalDuration: 0,
        totalCalories: 0,
        sessions: []
      });
    } else {
      setSelectedDayDetail({
        dateStr: `${String(dayNum).padStart(2, '0')}/${String(viewMonth + 1).padStart(2, '0')}/${viewYear}`,
        ...dayData
      });
    }
  };

  return (
    <div className="p-4 sm:p-6 space-y-6 pb-28 max-w-lg mx-auto">
      {/* Header Banner */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white flex items-center space-x-2">
            <span>Thành Tích & Thống Kê</span>
          </h2>
          <p className="text-xs text-slate-500 dark:text-gray-400 mt-0.5">
            Theo dõi sức bền Core và mở khóa các danh hiệu cao quý
          </p>
        </div>

        <div className="flex items-center space-x-1.5">
          <button
            onClick={handleManualSync}
            className="p-2 rounded-2xl bg-slate-100 dark:bg-white/10 hover:bg-slate-200 dark:hover:bg-white/20 text-slate-700 dark:text-gray-300 active:scale-95 transition-all"
            title="Đồng bộ lại tên giáo án & danh hiệu chuẩn xác"
          >
            <RotateCcw size={15} className={synced ? "animate-spin text-emerald-500" : ""} />
          </button>
        </div>
      </div>

      {/* Sub-Tab Navigation Bar (Nhật Ký Tập vs Tủ Huy Hiệu) */}
      <div className="flex p-1 rounded-2xl bg-slate-200/80 dark:bg-white/5 border border-slate-300/60 dark:border-white/10">
        <button
          onClick={() => setActiveTab('history')}
          className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center space-x-1.5 ${
            activeTab === 'history'
              ? 'bg-white dark:bg-oled text-slate-900 dark:text-white shadow-sm font-extrabold'
              : 'text-slate-600 dark:text-gray-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <HistoryIcon size={14} />
          <span>Nhật Ký Tập ({historyList.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('badges')}
          className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center space-x-1.5 ${
            activeTab === 'badges'
              ? 'bg-white dark:bg-oled text-amber-600 dark:text-amber-400 shadow-sm font-extrabold'
              : 'text-slate-600 dark:text-gray-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <Award size={14} />
          <span>Tủ Huy Hiệu ({unlockedCount}/{totalBadgesCount})</span>
        </button>
      </div>

      {/* TAB 1: NHẬT KÝ TẬP & 4 CHỈ SỐ KPI */}
      {activeTab === 'history' && (
        <div className="space-y-6 animate-fade-in">
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
                <span>Kỷ Lục Plank</span>
              </div>
              <div className="mt-2 flex items-baseline space-x-1">
                <span className="font-mono text-2xl sm:text-3xl font-black text-amber-500 dark:text-amber-400">
                  {userProfile.record || 60}
                </span>
                <span className="text-xs text-slate-500 dark:text-gray-400 font-bold">giây</span>
              </div>
              <div className="text-[10px] text-slate-400 dark:text-gray-500 mt-1">
                Kỷ lục cá nhân tốt nhất
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

          {/* LỊCH VẾT LỬA CHUỖI TẬP (STREAK HEATMAP CALENDAR) */}
          <div className="glass-panel p-5 rounded-3xl space-y-4 border border-amber-300/40 dark:border-amber-500/20">
            {/* Header: Title + Navigation */}
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 rounded-xl bg-amber-100 dark:bg-amber-500/15 text-amber-600 dark:text-amber-400 flex items-center justify-center shadow-sm">
                  <Flame size={16} />
                </div>
                <div>
                  <h3 className="text-xs font-black uppercase tracking-wider text-slate-900 dark:text-white">
                    Lịch Vết Lửa Chuỗi Tập
                  </h3>
                  <p className="text-[11px] text-slate-500 dark:text-gray-400">
                    {activeDaysThisMonth} ngày rực lửa • {Math.round(totalDurationThisMonth / 60)} phút giữ Core
                  </p>
                </div>
              </div>

              {/* Month Switcher Controls */}
              <div className="flex items-center space-x-1 bg-slate-100 dark:bg-white/5 p-1 rounded-2xl border border-slate-200 dark:border-white/10">
                <button
                  onClick={handlePrevMonth}
                  className="p-1 rounded-xl hover:bg-slate-200 dark:hover:bg-white/10 text-slate-700 dark:text-gray-300 transition-all active:scale-95"
                  title="Tháng trước"
                >
                  <ChevronLeft size={14} />
                </button>
                <span className="text-[11px] font-extrabold px-1.5 text-slate-900 dark:text-white min-w-[76px] text-center">
                  Th{viewMonth + 1}/{viewYear}
                </span>
                <button
                  onClick={handleNextMonth}
                  className="p-1 rounded-xl hover:bg-slate-200 dark:hover:bg-white/10 text-slate-700 dark:text-gray-300 transition-all active:scale-95"
                  title="Tháng sau"
                >
                  <ChevronRight size={14} />
                </button>
                {!isCurrentMonthView && (
                  <button
                    onClick={handleGoToday}
                    className="text-[9px] font-bold px-1.5 py-0.5 rounded-lg bg-amber-500 text-white active:scale-95 transition-all"
                  >
                    Nay
                  </button>
                )}
              </div>
            </div>

            {/* Days of Week Header */}
            <div className="grid grid-cols-7 gap-1.5 text-center">
              {['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'].map((d, i) => (
                <div key={d} className={`text-[10px] font-bold ${i >= 5 ? 'text-amber-600 dark:text-amber-400' : 'text-slate-400 dark:text-gray-500'}`}>
                  {d}
                </div>
              ))}
            </div>

            {/* Calendar Days Matrix */}
            <div className="grid grid-cols-7 gap-1.5">
              {/* Offset slots */}
              {Array.from({ length: startDayOfWeek }).map((_, i) => (
                <div key={`empty-${i}`} className="aspect-square rounded-xl bg-transparent" />
              ))}

              {/* Day Cells */}
              {Array.from({ length: daysInMonth }).map((_, i) => {
                const dayNum = i + 1;
                const dateKey = `${viewYear}-${String(viewMonth + 1).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
                const dayData = workoutsMap[dateKey];
                const hasWorkouts = dayData && dayData.count > 0;
                const dur = dayData ? dayData.totalDuration : 0;
                const isToday = isCurrentMonthView && today.getDate() === dayNum;
                const isSelected = selectedDayDetail?.dateStr === `${String(dayNum).padStart(2, '0')}/${String(viewMonth + 1).padStart(2, '0')}/${viewYear}`;

                // Tính toán màu ngọn lửa theo cường độ
                let heatClass = 'bg-slate-100/80 dark:bg-white/5 text-slate-500 dark:text-gray-400 border-slate-200/60 dark:border-white/5 hover:border-slate-300';
                if (hasWorkouts) {
                  if (dur >= 180) {
                    // Cấp 3 (>= 3 phút): Ngọn lửa rực sáng
                    heatClass = 'bg-gradient-to-tr from-amber-500 via-orange-500 to-red-500 text-white font-black shadow-md shadow-orange-500/30 border-amber-300';
                  } else if (dur >= 60) {
                    // Cấp 2 (1 - 3 phút): Lửa vàng hổ phách
                    heatClass = 'bg-amber-400/30 dark:bg-amber-500/30 border-amber-500/60 text-amber-900 dark:text-amber-200 font-bold';
                  } else {
                    // Cấp 1 (< 1 phút): Lửa nhẹ
                    heatClass = 'bg-amber-100 dark:bg-amber-950/60 border-amber-300 dark:border-amber-500/40 text-amber-700 dark:text-amber-300';
                  }
                }

                return (
                  <button
                    key={dateKey}
                    type="button"
                    onClick={() => handleSelectDay(dayNum, dayData)}
                    className={`aspect-square rounded-2xl border flex flex-col items-center justify-center relative transition-all active:scale-90 ${heatClass} ${
                      isToday ? 'ring-2 ring-emerald-500 dark:ring-neon font-black' : ''
                    } ${isSelected ? 'ring-2 ring-amber-500 scale-105 shadow-md' : ''}`}
                  >
                    <span className="text-[11px] leading-none">{dayNum}</span>
                    {hasWorkouts && (
                      <span className="text-[8px] leading-none mt-0.5">
                        {dur >= 180 ? '🔥' : '•'}
                      </span>
                    )}
                    {isToday && !hasWorkouts && (
                      <span className="w-1 h-1 rounded-full bg-emerald-500 dark:bg-neon absolute bottom-1" />
                    )}
                  </button>
                );
              })}
            </div>

            {/* Selected Day Detail Popover / Summary Bar */}
            {selectedDayDetail && (
              <div className="p-3 rounded-2xl bg-amber-50/80 dark:bg-amber-950/30 border border-amber-300/60 dark:border-amber-500/30 flex items-center justify-between animate-fade-in text-xs">
                <div className="flex items-center space-x-2">
                  <span className="text-base">{selectedDayDetail.count > 0 ? '🔥' : '💤'}</span>
                  <div>
                    <div className="font-extrabold text-slate-900 dark:text-white">
                      Ngày {selectedDayDetail.dateStr}
                    </div>
                    <div className="text-[11px] text-slate-600 dark:text-gray-300">
                      {selectedDayDetail.count > 0 ? (
                        <>
                          <strong>{selectedDayDetail.count}</strong> buổi tập • Giữ <strong>{Math.floor(selectedDayDetail.totalDuration / 60)}p {selectedDayDetail.totalDuration % 60}s</strong> • ~{selectedDayDetail.totalCalories} kcal
                        </>
                      ) : (
                        "Ngày nghỉ ngơi hồi phục cơ Core"
                      )}
                    </div>
                  </div>
                </div>
                {selectedDayDetail.count === 0 && (
                  <button
                    onClick={onStartWorkout}
                    className="px-2.5 py-1 rounded-xl bg-amber-500 text-white font-bold text-[10px] active:scale-95"
                  >
                    Tập Bù
                  </button>
                )}
              </div>
            )}

            {/* Legend */}
            <div className="flex items-center justify-between pt-1 border-t border-slate-200 dark:border-white/5 text-[10px] text-slate-500 dark:text-gray-400">
              <span className="flex items-center space-x-1">
                <span className="w-2.5 h-2.5 rounded-md bg-emerald-500 dark:bg-neon inline-block" />
                <span>Hôm nay</span>
              </span>
              <div className="flex items-center space-x-1.5">
                <span>Cường độ:</span>
                <span className="w-2.5 h-2.5 rounded-md bg-slate-200 dark:bg-white/10 inline-block" title="0s" />
                <span className="w-2.5 h-2.5 rounded-md bg-amber-200 dark:bg-amber-950 inline-block" title="< 1p" />
                <span className="w-2.5 h-2.5 rounded-md bg-amber-400 inline-block" title="1-3p" />
                <span className="w-2.5 h-2.5 rounded-md bg-gradient-to-tr from-amber-500 to-red-500 inline-block" title="> 3p" />
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
                  className="mt-2 px-5 py-2.5 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white font-bold text-xs uppercase tracking-wider shadow-md shadow-emerald-500/20 active:scale-95 transition-all"
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
                      {item.maxSingleHold && item.completedSets > 1 && (
                        <div className="text-[9px] text-emerald-600 dark:text-emerald-400 font-mono font-medium">
                          Max: {item.maxSingleHold}s
                        </div>
                      )}
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
      )}

      {/* TAB 2: TỦ DANH HIỆU & HUY HIỆU THÀNH TÍCH */}
      {activeTab === 'badges' && (
        <div className="space-y-5 animate-fade-in">
          {/* Badge Progress Overview Card */}
          <div className="glass-panel p-5 rounded-3xl border border-amber-400/30 space-y-3 bg-gradient-to-br from-amber-500/10 via-transparent to-purple-500/10">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2.5">
                <div className="w-10 h-10 rounded-2xl bg-amber-500/20 text-amber-500 flex items-center justify-center text-xl shadow-sm">
                  🏆
                </div>
                <div>
                  <h3 className="text-sm font-extrabold text-slate-900 dark:text-white">Bộ Sưu Tập Danh Hiệu</h3>
                  <p className="text-[11px] text-slate-500 dark:text-gray-400">Đã mở khóa {unlockedCount} / {totalBadgesCount} huy hiệu</p>
                </div>
              </div>
              <span className="font-mono font-black text-base text-amber-500">{badgeProgress}%</span>
            </div>

            {/* Progress Bar */}
            <div className="w-full h-2 rounded-full bg-slate-200 dark:bg-white/10 overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-amber-500 via-emerald-500 to-cyan-500 rounded-full transition-all duration-700"
                style={{ width: `${badgeProgress}%` }}
              />
            </div>
          </div>

          {/* Badges Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {BADGES_LIST.map((badge) => {
              const isUnlocked = unlockedBadges.includes(badge.id);

              return (
                <div
                  key={badge.id}
                  className={`glass-panel p-4 rounded-2xl border transition-all flex items-start space-x-3.5 relative overflow-hidden ${
                    isUnlocked
                      ? 'border-amber-400/50 shadow-sm dark:shadow-amber-500/5 bg-amber-500/5'
                      : 'opacity-60 border-slate-200 dark:border-white/5 grayscale'
                  }`}
                >
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-2xl shrink-0 shadow-inner ${
                    isUnlocked 
                      ? 'bg-amber-100 dark:bg-white/10' 
                      : 'bg-slate-200 dark:bg-white/5'
                  }`}>
                    {badge.icon}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-black text-slate-900 dark:text-white truncate">
                        {badge.name}
                      </h4>
                      {isUnlocked ? (
                        <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
                          Đã Nhận
                        </span>
                      ) : (
                        <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-slate-200 text-slate-600 dark:bg-white/10 dark:text-gray-400 flex items-center space-x-0.5">
                          <Lock size={9} />
                          <span>Khóa</span>
                        </span>
                      )}
                    </div>

                    <p className="text-[11px] text-slate-500 dark:text-gray-400 mt-1 leading-tight">
                      {badge.desc}
                    </p>

                    <div className="mt-2 flex items-center space-x-1.5 text-[10px] text-slate-400 dark:text-gray-500 font-semibold">
                      <Sparkles size={10} className="text-amber-500" />
                      <span>Độ hiếm: {badge.rarity}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default History;
