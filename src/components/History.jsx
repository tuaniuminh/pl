import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { 
  History as HistoryIcon, 
  Trash2, 
  Flame, 
  Clock, 
  Calendar, 
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
  Info,
  Edit2,
  Check,
  X,
  Layers,
  Filter
} from 'lucide-react';
import { 
  getHistory, 
  getHistoryStats, 
  clearHistory, 
  deleteHistoryItem,
  BADGES_LIST, 
  getUnlockedBadges, 
  getUserProfile,
  calculateBMI,
  recalibrateAndSyncAllData,
  getNormalizedSessionSets
} from '../services/storageService';

const History = ({ onStartWorkout }) => {
  const [activeTab, setActiveTab] = useState('history'); // 'history' | 'badges'
  const [historyList, setHistoryList] = useState(getHistory());
  const [stats, setStats] = useState(getHistoryStats());
  const [unlockedBadges, setUnlockedBadges] = useState(getUnlockedBadges());
  const [userProfile, setUserProfile] = useState(getUserProfile());
  const [synced, setSynced] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentViewDate, setCurrentViewDate] = useState(new Date());
  const [selectedDayDetail, setSelectedDayDetail] = useState(null);
  const [selectedFilterDate, setSelectedFilterDate] = useState(null); // 'YYYY-MM-DD' hoặc null
  const [visibleCount, setVisibleCount] = useState(10); // Phân trang 10 buổi/lần
  const [selectedSessionDetail, setSelectedSessionDetail] = useState(null); // Modal chi tiết từng hiệp
  const [deleteTarget, setDeleteTarget] = useState(null); // null | { type: 'single', id: string } | { type: 'all' }

  const bmiInfo = calculateBMI(userProfile.weight || 65, userProfile.height || 170, userProfile.gender || 'male');
  const met = (userProfile.gender || 'male') === 'female' ? 4.1 : 4.4;
  const currentCalPerMin = ((met * 3.5 * (Number(userProfile.weight) || 65)) / 200).toFixed(1);

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

  const handleRequestDeleteSession = (id) => {
    setDeleteTarget({ type: 'single', id });
  };

  const handleRequestClearAll = () => {
    setDeleteTarget({ type: 'all' });
  };

  const handleConfirmDelete = () => {
    if (!deleteTarget) return;
    if (deleteTarget.type === 'single') {
      deleteHistoryItem(deleteTarget.id);
    } else if (deleteTarget.type === 'all') {
      clearHistory();
      setIsEditing(false);
    }
    refreshData();
    setSelectedDayDetail(null);
    setDeleteTarget(null);
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
    setSelectedFilterDate(null);
    setVisibleCount(10);
  };

  const handleNextMonth = () => {
    setCurrentViewDate(new Date(viewYear, viewMonth + 1, 1));
    setSelectedDayDetail(null);
    setSelectedFilterDate(null);
    setVisibleCount(10);
  };

  const handleGoToday = () => {
    setCurrentViewDate(new Date());
    setSelectedDayDetail(null);
    setSelectedFilterDate(null);
    setVisibleCount(10);
  };

  const handleSelectDay = (dayNum, dayData) => {
    const dateKey = `${viewYear}-${String(viewMonth + 1).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
    if (!dayData || dayData.count === 0) {
      setSelectedDayDetail({
        dateKey,
        dateStr: `${String(dayNum).padStart(2, '0')}/${String(viewMonth + 1).padStart(2, '0')}/${viewYear}`,
        count: 0,
        totalDuration: 0,
        totalCalories: 0,
        sessions: []
      });
      setSelectedFilterDate(null);
    } else {
      setSelectedDayDetail({
        dateKey,
        dateStr: `${String(dayNum).padStart(2, '0')}/${String(viewMonth + 1).padStart(2, '0')}/${viewYear}`,
        ...dayData
      });
      // Bấm vào ngày có buổi tập: toggle bộ lọc danh sách theo ngày đó
      setSelectedFilterDate(prev => (prev === dateKey ? null : dateKey));
      setVisibleCount(10);
    }
  };

  const handleClearDateFilter = () => {
    setSelectedFilterDate(null);
    setSelectedDayDetail(null);
    setVisibleCount(10);
  };

  // Danh sách hiển thị sau khi áp dụng bộ lọc ngày (nếu có)
  const displayedHistory = historyList.filter((item) => {
    if (!selectedFilterDate) return true;
    if (!item.date) return false;
    const d = new Date(item.date);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    return key === selectedFilterDate;
  });

  // Phân trang 10 buổi/lần tránh kéo dài danh sách
  const paginatedHistory = displayedHistory.slice(0, visibleCount);
  const hasMore = visibleCount < displayedHistory.length;

  return (
    <div className="p-4 sm:p-6 space-y-6 pb-24 max-w-lg mx-auto">
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
        <div className="space-y-4 animate-fade-in">
          {/* Header Card: Hồ Sơ Thể Trạng Hiện Tại */}
          <div className="glass-panel p-3.5 rounded-3xl border border-cyan-500/20 bg-gradient-to-r from-cyan-500/10 via-emerald-500/5 to-teal-500/10 flex items-center justify-between text-xs">
            <div className="flex items-center space-x-2.5 min-w-0">
              <div className="w-8 h-8 rounded-xl bg-cyan-100 dark:bg-cyan-500/20 text-cyan-600 dark:text-cyan-neon flex items-center justify-center font-bold text-sm shrink-0 shadow-sm">
                {userProfile.gender === 'female' ? '👩' : '👨'}
              </div>
              <div className="min-w-0">
                <div className="flex items-center space-x-2 flex-wrap gap-y-1 font-black text-slate-900 dark:text-white text-xs">
                  <span>{userProfile.gender === 'female' ? 'Nữ' : 'Nam'} • {userProfile.height || 170}cm • {userProfile.weight || 65}kg</span>
                  <span className={`text-[9px] font-extrabold px-2 py-0.5 rounded-full border shrink-0 ${
                    bmiInfo.color === 'emerald'
                      ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 border-emerald-300/60 dark:border-emerald-500/30'
                      : bmiInfo.color === 'cyan'
                      ? 'bg-cyan-50 text-cyan-700 dark:bg-cyan-950 dark:text-cyan-300 border-cyan-300/60 dark:border-cyan-500/30'
                      : bmiInfo.color === 'amber'
                      ? 'bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-300 border-amber-300/60 dark:border-amber-500/30'
                      : 'bg-rose-50 text-rose-700 dark:bg-rose-950 dark:text-rose-300 border-rose-300/60 dark:border-rose-500/30'
                  }`}>
                    BMI {bmiInfo.bmi} • {bmiInfo.status}
                  </span>
                </div>
                <p className="text-[10px] text-slate-500 dark:text-gray-400 mt-0.5">
                  Tốc độ đốt hiện tại: <span className="font-mono text-cyan-600 dark:text-cyan-neon font-bold">~{currentCalPerMin} kcal/phút</span>
                </p>
              </div>
            </div>
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
                Tích lũy từng thời kỳ
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
                <span>Chuỗi Ngày Tập</span>
              </div>
              <div className="mt-2 flex items-baseline space-x-1">
                <span className="font-mono text-2xl sm:text-3xl font-black text-purple-600 dark:text-purple-400">
                  {stats.currentStreak || 0}
                </span>
                <span className="text-xs text-slate-500 dark:text-gray-400 font-bold">ngày</span>
              </div>
              <div className="text-[10px] text-slate-400 dark:text-gray-500 mt-1">
                Kỷ lục: {stats.bestStreak || stats.streak || 0} ngày liên tiếp
              </div>
            </div>
          </div>

          {/* NHẬT KÝ HOẠT ĐỘNG THÁNG (MONTHLY ACTIVITY TRACKER) */}
          <div className="glass-panel p-5 rounded-3xl space-y-3.5 border border-amber-300/40 dark:border-amber-500/20">
            {/* Header: Title + Navigation (Bố cục thông minh không bao giờ bị đè chữ) */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div className="w-7 h-7 rounded-xl bg-amber-100 dark:bg-amber-500/15 text-amber-600 dark:text-amber-400 flex items-center justify-center shadow-sm shrink-0">
                    <Flame size={15} />
                  </div>
                  <h3 className="text-xs sm:text-sm font-black uppercase tracking-wider text-slate-900 dark:text-white">
                    Nhật Ký Hoạt Động
                  </h3>
                </div>

                {/* Month Switcher Controls */}
                <div className="flex items-center space-x-0.5 bg-slate-100 dark:bg-white/5 p-0.5 sm:p-1 rounded-2xl border border-slate-200 dark:border-white/10 shrink-0">
                  <button
                    onClick={handlePrevMonth}
                    className="p-1 rounded-xl hover:bg-slate-200 dark:hover:bg-white/10 text-slate-700 dark:text-gray-300 transition-all active:scale-95"
                    title="Tháng trước"
                  >
                    <ChevronLeft size={13} />
                  </button>
                  <span className="text-[11px] font-extrabold px-1.5 text-slate-900 dark:text-white min-w-[64px] text-center">
                    Th{viewMonth + 1}/{viewYear}
                  </span>
                  <button
                    onClick={handleNextMonth}
                    className="p-1 rounded-xl hover:bg-slate-200 dark:hover:bg-white/10 text-slate-700 dark:text-gray-300 transition-all active:scale-95"
                    title="Tháng sau"
                  >
                    <ChevronRight size={13} />
                  </button>
                  {!isCurrentMonthView && (
                    <button
                      onClick={handleGoToday}
                      className="text-[9px] font-bold px-1.5 py-0.5 rounded-lg bg-amber-500 text-white active:scale-95 transition-all ml-0.5"
                    >
                      Nay
                    </button>
                  )}
                </div>
              </div>

              {/* Subtitle Summary */}
              <p className="text-[11px] text-slate-500 dark:text-gray-400 pl-9">
                {activeDaysThisMonth} ngày tập • {Math.round(totalDurationThisMonth / 60)} phút giữ Core
              </p>
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
                <span>Mức độ hoạt động:</span>
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
              <div className="flex items-center space-x-2">
                <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-700 dark:text-gray-300">
                  Chi Tiết Các Buổi Tập ({displayedHistory.length})
                </h3>
                {selectedFilterDate && (
                  <button
                    onClick={handleClearDateFilter}
                    className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 border border-amber-300/40 hover:bg-amber-200 dark:hover:bg-amber-900/60 transition-all flex items-center space-x-1"
                    title="Bấm để xem tất cả các ngày"
                  >
                    <span>Lọc: {selectedDayDetail?.dateStr}</span>
                    <X size={10} />
                  </button>
                )}
              </div>
              {historyList.length > 0 && (
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => setIsEditing(!isEditing)}
                    className={`text-[11px] font-bold px-3 py-1 rounded-xl transition-all active:scale-95 flex items-center space-x-1 shadow-sm ${
                      isEditing 
                        ? 'bg-emerald-500 text-white shadow-emerald-500/20 font-extrabold' 
                        : 'bg-slate-100 hover:bg-slate-200 dark:bg-white/10 dark:hover:bg-white/20 text-slate-700 dark:text-gray-300'
                    }`}
                  >
                    {isEditing ? <Check size={13} /> : <Edit2 size={13} />}
                    <span>{isEditing ? "Xong" : "Sửa"}</span>
                  </button>

                  {isEditing && (
                    <button
                      onClick={handleRequestClearAll}
                      className="text-[11px] text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 flex items-center space-x-1 px-2 py-1 rounded-lg bg-red-50 dark:bg-red-950/40"
                    >
                      <Trash2 size={12} />
                      <span>Xóa hết</span>
                    </button>
                  )}
                </div>
              )}
            </div>

            {displayedHistory.length === 0 ? (
              <div className="text-center py-12 glass-panel rounded-3xl p-6 space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-slate-400 dark:text-gray-500 mx-auto flex items-center justify-center">
                  <HistoryIcon size={24} />
                </div>
                <h4 className="text-sm font-bold text-slate-800 dark:text-gray-300">
                  {selectedFilterDate ? `Không có buổi tập nào trong ngày ${selectedDayDetail?.dateStr}` : "Chưa có lịch sử tập luyện"}
                </h4>
                <p className="text-xs text-slate-500 dark:text-gray-400 max-w-xs mx-auto">
                  {selectedFilterDate ? "Hãy chọn ngày khác hoặc bấm bỏ lọc để xem toàn bộ lịch sử." : "Hãy hoàn thành bài tập đầu tiên của bạn để xem biểu đồ và số liệu phân tích tại đây!"}
                </p>
                {selectedFilterDate ? (
                  <button
                    onClick={handleClearDateFilter}
                    className="mt-2 px-5 py-2.5 rounded-2xl bg-slate-200 dark:bg-white/10 text-slate-800 dark:text-white font-bold text-xs uppercase tracking-wider active:scale-95 transition-all"
                  >
                    Xem Tất Cả Các Ngày
                  </button>
                ) : (
                  <button
                    onClick={onStartWorkout}
                    className="mt-2 px-5 py-2.5 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white font-bold text-xs uppercase tracking-wider shadow-md shadow-emerald-500/20 active:scale-95 transition-all"
                  >
                    Bắt Đầu Tập Ngay
                  </button>
                )}
              </div>
            ) : (
              <div className="space-y-2.5">
                {paginatedHistory.map((item) => (
                  <div
                    key={item.id}
                    onClick={() => !isEditing && setSelectedSessionDetail(item)}
                    className={`glass-panel p-4 rounded-2xl flex items-center justify-between transition-all group ${
                      !isEditing ? 'cursor-pointer hover:border-emerald-500/50 hover:bg-emerald-500/5 active:scale-[0.99]' : ''
                    }`}
                  >
                    <div className="flex items-start space-x-3 min-w-0">
                      {isEditing ? (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleRequestDeleteSession(item.id);
                          }}
                          className="w-9 h-9 rounded-2xl bg-red-100 hover:bg-red-200 dark:bg-red-500/20 dark:hover:bg-red-500/30 text-red-600 dark:text-red-400 flex items-center justify-center shrink-0 active:scale-90 transition-all shadow-sm"
                          title="Xóa buổi tập này"
                        >
                          <Trash2 size={15} />
                        </button>
                      ) : (
                        <div className="w-10 h-10 rounded-2xl bg-emerald-50 dark:bg-neon/10 border border-emerald-300 dark:border-neon/20 flex items-center justify-center text-emerald-600 dark:text-neon shrink-0 mt-0.5 group-hover:scale-105 transition-transform">
                          <CheckCircle2 size={18} />
                        </div>
                      )}
                      <div className="min-w-0">
                        <div className="text-xs font-bold text-slate-900 dark:text-white truncate">
                          {item.planName || "Plank Tự Do"}
                        </div>
                        <div className="flex items-center space-x-2 text-[10px] text-slate-500 dark:text-gray-400 mt-1 flex-wrap">
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

                    <div className="flex items-center space-x-2 shrink-0 pl-3">
                      <div className="text-right">
                        <div className="font-mono text-sm font-extrabold text-emerald-600 dark:text-neon">
                          {item.duration}s
                        </div>
                        {item.maxSingleHold && item.completedSets > 1 && (
                          <div className="text-[9px] text-emerald-600 dark:text-emerald-400 font-mono font-medium">
                            Max: {item.maxSingleHold}s
                          </div>
                        )}
                        <div className="text-[10px] text-slate-500 dark:text-gray-400 font-medium">
                          ~{item.calories || Math.round((item.duration / 60) * 4.5)} kcal{item.weightAtTime ? ` (${item.weightAtTime}kg)` : ''}
                        </div>
                      </div>
                      {!isEditing && (
                        <div className="w-6 h-6 rounded-full bg-slate-100 dark:bg-white/5 flex items-center justify-center text-slate-400 dark:text-gray-500 group-hover:text-emerald-500 group-hover:bg-emerald-100 dark:group-hover:bg-neon/10 transition-colors">
                          <ChevronRight size={14} />
                        </div>
                      )}
                    </div>
                  </div>
                ))}

                {/* Nút Xem Thêm 10 Buổi Trước */}
                {hasMore && (
                  <div className="pt-2 text-center">
                    <button
                      onClick={() => setVisibleCount(prev => prev + 10)}
                      className="w-full py-3 rounded-2xl bg-slate-100 hover:bg-slate-200 dark:bg-white/5 dark:hover:bg-white/10 border border-slate-200 dark:border-white/10 text-slate-700 dark:text-gray-300 font-extrabold text-xs tracking-wider uppercase flex items-center justify-center space-x-2 active:scale-95 transition-all shadow-sm"
                    >
                      <span>Xem thêm 10 buổi trước</span>
                      <span className="text-[10px] opacity-70 font-mono">({displayedHistory.length - visibleCount} buổi còn lại)</span>
                      <ChevronRight size={14} className="rotate-90" />
                    </button>
                  </div>
                )}
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

      {/* MODAL BẢNG THÔNG TIN CHI TIẾT TỪNG HIỆP CỦA BUỔI TẬP (PORTAL TO BODY TO BEAT NAVBAR) */}
      {selectedSessionDetail && createPortal(
        <div className="fixed inset-0 z-[999] bg-black/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 pt-12 pb-16 sm:pb-20 overflow-hidden animate-fade-in">
          <div className="glass-panel max-w-md w-full p-4 sm:p-5 rounded-3xl border border-emerald-500/30 shadow-2xl bg-white/95 dark:bg-slate-900/95 space-y-3.5 max-h-[82vh] sm:max-h-[85vh] flex flex-col">
            {/* Modal Header */}
            <div className="flex items-start justify-between shrink-0">
              <div className="flex items-center space-x-3 min-w-0">
                <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-emerald-500/20 to-teal-500/20 border border-emerald-400/40 text-emerald-600 dark:text-neon flex items-center justify-center shrink-0 shadow-sm text-xl">
                  {selectedSessionDetail.planName?.includes('Thách Thức') ? '⚡' : '🧘'}
                </div>
                <div className="min-w-0">
                  <div className="flex items-center space-x-2">
                    <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-neon/10 dark:text-neon border border-emerald-300/40 dark:border-neon/30">
                      Chi Tiết Buổi Tập
                    </span>
                  </div>
                  <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-white mt-0.5 truncate">
                    {selectedSessionDetail.planName || "Plank Tự Do"}
                  </h3>
                  <p className="text-[11px] text-slate-500 dark:text-gray-400 flex items-center space-x-1.5 mt-0.5">
                    <Calendar size={11} />
                    <span>{new Date(selectedSessionDetail.date).toLocaleDateString('vi-VN')}</span>
                    <span>•</span>
                    <Clock size={11} />
                    <span>{new Date(selectedSessionDetail.date).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}</span>
                  </p>
                </div>
              </div>

              <button
                onClick={() => setSelectedSessionDetail(null)}
                className="w-8 h-8 rounded-full bg-slate-100 dark:bg-white/10 hover:bg-slate-200 dark:hover:bg-white/20 text-slate-600 dark:text-gray-300 flex items-center justify-center active:scale-90 transition-all shrink-0 ml-2"
                title="Đóng"
              >
                <X size={16} />
              </button>
            </div>

            {/* 4 Summary Stats Grid (KỶ LỤC ngắn gọn chống vỡ chữ) */}
            <div className="grid grid-cols-4 gap-2 shrink-0">
              <div className="p-2 sm:p-2.5 rounded-2xl bg-slate-100 dark:bg-white/5 border border-slate-200/60 dark:border-white/5 text-center">
                <div className="text-[9px] font-bold text-slate-400 uppercase truncate">Tổng Giữ</div>
                <div className="font-mono text-sm sm:text-base font-black text-emerald-600 dark:text-neon mt-0.5">
                  {selectedSessionDetail.duration}s
                </div>
              </div>
              <div className="p-2 sm:p-2.5 rounded-2xl bg-slate-100 dark:bg-white/5 border border-slate-200/60 dark:border-white/5 text-center">
                <div className="text-[9px] font-bold text-slate-400 uppercase truncate">Số Hiệp</div>
                <div className="font-mono text-sm sm:text-base font-black text-cyan-600 dark:text-cyan-neon mt-0.5">
                  {selectedSessionDetail.completedSets || 1}
                </div>
              </div>
              <div className="p-2 sm:p-2.5 rounded-2xl bg-slate-100 dark:bg-white/5 border border-slate-200/60 dark:border-white/5 text-center">
                <div className="text-[9px] font-bold text-slate-400 uppercase truncate">Kỷ Lục</div>
                <div className="font-mono text-sm sm:text-base font-black text-amber-500 mt-0.5">
                  {selectedSessionDetail.maxSingleHold || (selectedSessionDetail.completedSets === 1 ? selectedSessionDetail.duration : Math.round((selectedSessionDetail.duration || 60) / (selectedSessionDetail.completedSets || 1)))}s
                </div>
              </div>
              <div className="p-2 sm:p-2.5 rounded-2xl bg-slate-100 dark:bg-white/5 border border-slate-200/60 dark:border-white/5 text-center">
                <div className="text-[9px] font-bold text-slate-400 uppercase truncate">Calo Đốt</div>
                <div className="font-mono text-sm sm:text-base font-black text-purple-600 dark:text-purple-400 mt-0.5">
                  ~{selectedSessionDetail.calories || Math.round((selectedSessionDetail.duration / 60) * 4.5)}
                </div>
              </div>
            </div>

            {/* Sets Breakdown Table Section */}
            <div className="flex-1 min-h-0 flex flex-col space-y-2">
              <div className="flex items-center justify-between shrink-0 px-1">
                <h4 className="text-xs font-black uppercase tracking-wider text-slate-800 dark:text-gray-200 flex items-center space-x-1.5">
                  <Layers size={14} className="text-emerald-500" />
                  <span>Bảng Thông Số Từng Hiệp</span>
                </h4>
                <span className="text-[10px] text-slate-400 dark:text-gray-500 font-medium">
                  {getNormalizedSessionSets(selectedSessionDetail).length} hiệp {selectedSessionDetail.setsDetail ? 'hoàn thành' : '(ước tính từ bản cũ)'}
                </span>
              </div>

              {/* Scrollable Table Container */}
              <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain rounded-2xl border border-slate-200 dark:border-white/10 bg-slate-50/50 dark:bg-black/20 shadow-inner">
                <table className="w-full text-left border-collapse text-xs">
                  <thead className="sticky top-0 bg-slate-100 dark:bg-slate-900 border-b border-slate-200 dark:border-white/10 text-[10px] font-black uppercase text-slate-500 dark:text-gray-400 tracking-wider z-10">
                    <tr>
                      <th className="py-2.5 px-3">Hiệp & Bài Tập</th>
                      <th className="py-2.5 px-3 text-center">⏱️ Siết Core</th>
                      <th className="py-2.5 px-3 text-right">❄️ Nghỉ Chuyển Hiệp</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200/60 dark:divide-white/5">
                    {getNormalizedSessionSets(selectedSessionDetail).map((set, idx, arr) => (
                      <tr key={idx} className="hover:bg-slate-100/60 dark:hover:bg-white/5 transition-colors">
                        <td className="py-2.5 px-3">
                          <div className="flex items-center space-x-2">
                            <span className="w-5 h-5 rounded-md bg-emerald-100 text-emerald-700 dark:bg-neon/10 dark:text-neon flex items-center justify-center text-[10px] font-black shrink-0">
                              {set.setNumber || idx + 1}
                            </span>
                            <span className="font-bold text-slate-800 dark:text-white truncate max-w-[120px] sm:max-w-[170px]">
                              {set.name || `Hiệp ${idx + 1}`}
                            </span>
                          </div>
                        </td>
                        <td className="py-2.5 px-3 text-center">
                          <span className="font-mono font-extrabold text-emerald-600 dark:text-neon px-2 py-0.5 rounded-lg bg-emerald-50 dark:bg-neon/10 border border-emerald-300/40 dark:border-neon/30 inline-block">
                            {set.holdTime > 0 ? `${set.holdTime}s` : "Fail"}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-right">
                          {idx === arr.length - 1 ? (
                            <span className="text-slate-400 dark:text-gray-500 font-mono text-[11px]">- (Xong)</span>
                          ) : set.restTime > 0 ? (
                            <span className="font-mono font-bold text-cyan-600 dark:text-cyan-neon px-1.5 py-0.5 rounded-md bg-cyan-50 dark:bg-cyan-950/40 border border-cyan-300/40 dark:border-cyan-500/30">
                              {set.restTime}s
                            </span>
                          ) : (
                            <span className="text-[10px] text-teal-600 dark:text-teal-400 font-semibold bg-teal-50 dark:bg-teal-950/30 px-1.5 py-0.5 rounded-md">
                              🍃 Tự do
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="pt-2 shrink-0">
              <button
                onClick={() => setSelectedSessionDetail(null)}
                className="w-full py-3 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white font-extrabold text-xs uppercase tracking-wider shadow-md shadow-emerald-500/20 active:scale-95 transition-all"
              >
                Đóng Chi Tiết
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* MODAL XÁC NHẬN XÓA CHUẨN GIAO DIỆN APP (PORTAL TO BODY) */}
      {deleteTarget && createPortal(
        <div className="fixed inset-0 bg-black/75 backdrop-blur-sm z-[999] flex items-center justify-center p-4 animate-fade-in">
          <div className="glass-panel max-w-xs w-full p-6 rounded-3xl border border-red-500/30 text-center space-y-4 shadow-2xl bg-white/95 dark:bg-slate-900/95">
            {/* Red Warning Icon */}
            <div className="w-14 h-14 rounded-2xl bg-red-100 dark:bg-red-500/20 text-red-600 dark:text-red-400 flex items-center justify-center mx-auto shadow-inner">
              <Trash2 size={24} />
            </div>

            {/* Title & Desc */}
            <div>
              <h3 className="text-base font-black text-slate-900 dark:text-white">
                {deleteTarget.type === 'all' ? "Xóa Toàn Bộ Lịch Sử?" : "Xóa Buổi Tập Này?"}
              </h3>
              <p className="text-xs text-slate-500 dark:text-gray-400 mt-1.5 leading-relaxed">
                {deleteTarget.type === 'all'
                  ? "Toàn bộ dữ liệu luyện tập và biểu đồ sẽ được làm mới. Hành động này không thể hoàn tác."
                  : "Dữ liệu buổi tập này sẽ được xóa khỏi lịch sử và các thống kê liên quan."}
              </p>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center space-x-3 pt-2">
              <button
                onClick={() => setDeleteTarget(null)}
                className="flex-1 py-3 rounded-2xl bg-slate-100 hover:bg-slate-200 dark:bg-white/10 dark:hover:bg-white/20 text-slate-700 dark:text-gray-300 font-bold text-xs active:scale-95 transition-all"
              >
                Hủy
              </button>
              <button
                onClick={handleConfirmDelete}
                className="flex-1 py-3 rounded-2xl bg-red-500 hover:bg-red-600 text-white font-extrabold text-xs shadow-md shadow-red-500/30 active:scale-95 transition-all"
              >
                {deleteTarget.type === 'all' ? "Xóa Tất Cả" : "Xóa Ngay"}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};

export default History;
