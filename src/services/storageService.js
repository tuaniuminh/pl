/**
 * Dịch vụ lưu trữ LocalStorage, Hệ thống Huy hiệu & Screen Wake Lock
 */

const STORAGE_KEYS = {
  SETTINGS: 'plank_settings_v2',
  HISTORY: 'plank_history_v2',
  ACTIVE_PLAN: 'plank_active_plan_v2',
  SAVED_PLANS: 'plank_saved_plans_v2',
  USER_PROFILE: 'plank_user_profile_v2',
  UNLOCKED_BADGES: 'plank_unlocked_badges_v2'
};

// ==================== 1. SCREEN WAKE LOCK API ====================
let wakeLockInstance = null;

export const requestWakeLock = async () => {
  if (typeof window !== 'undefined' && 'wakeLock' in navigator) {
    try {
      wakeLockInstance = await navigator.wakeLock.request('screen');
      console.log('Screen Wake Lock activated');
    } catch (err) {
      console.warn('Wake Lock request error:', err);
    }
  }
};

export const releaseWakeLock = async () => {
  if (wakeLockInstance) {
    try {
      await wakeLockInstance.release();
      wakeLockInstance = null;
      console.log('Screen Wake Lock released');
    } catch (err) {
      console.warn('Wake Lock release error:', err);
    }
  }
};

// ==================== 2. HỆ THỐNG DANH HIỆU & HUY HIỆU ====================
export const BADGES_LIST = [
  {
    id: 'first_step',
    name: 'Tân Binh Thép',
    desc: 'Hoàn thành bài tập Plank đầu tiên',
    icon: '🥉',
    rarity: 'Cơ bản',
    color: 'emerald',
    check: (stats, history) => history.length >= 1
  },
  {
    id: 'hold_60s',
    name: 'Chiến Binh 1 Phút',
    desc: 'Giữ Plank liên tục từ 60 giây trở lên',
    icon: '⚡',
    rarity: 'Hiếm',
    color: 'cyan',
    check: (stats, history) => history.some(h => (h.duration || 0) >= 60)
  },
  {
    id: 'hold_120s',
    name: 'Bứt Phá 2 Phút',
    desc: 'Giữ Plank liên tục từ 120 giây trở lên',
    icon: '🔥',
    rarity: 'Sử thi',
    color: 'amber',
    check: (stats, history) => history.some(h => (h.duration || 0) >= 120)
  },
  {
    id: 'hold_180s',
    name: 'Kỷ Lục Gia 3 Phút',
    desc: 'Giữ Plank liên tục từ 180 giây trở lên',
    icon: '🏆',
    rarity: 'Huyền thoại',
    color: 'purple',
    check: (stats, history) => history.some(h => (h.duration || 0) >= 180)
  },
  {
    id: 'hold_300s',
    name: 'Bậc Thầy 5 Phút',
    desc: 'Chinh phục mốc 300 giây (5 phút) huyền thoại',
    icon: '👑',
    rarity: 'Tối thượng',
    color: 'red',
    check: (stats, history) => history.some(h => (h.duration || 0) >= 300)
  },
  {
    id: 'streak_3',
    name: 'Kiên Trì 3 Ngày',
    desc: 'Duy trì chuỗi tập 3 ngày liên tiếp',
    icon: '🌟',
    rarity: 'Hiếm',
    color: 'cyan',
    check: (stats) => stats.streak >= 3
  },
  {
    id: 'streak_7',
    name: 'Bản Lĩnh 7 Ngày',
    desc: 'Duy trì chuỗi tập 7 ngày liên tiếp',
    icon: '💎',
    rarity: 'Sử thi',
    color: 'amber',
    check: (stats) => stats.streak >= 7
  },
  {
    id: 'total_30m',
    name: 'Chúa Tể Cơ Core',
    desc: 'Tổng thời gian tích lũy đạt 30 phút Plank',
    icon: '🛡️',
    rarity: 'Huyền thoại',
    color: 'purple',
    check: (stats) => stats.totalSeconds >= 1800
  },
  {
    id: 'max_challenge',
    name: 'Vô Cực Vượt Ngưỡng',
    desc: 'Chinh phục 1 buổi Thách Thức Vô Cực (Max-Out)',
    icon: '🌌',
    rarity: 'Đặc biệt',
    color: 'cyan',
    check: (stats, history) => history.some(h => h.planName?.includes('Thách Thức Vô Cực'))
  }
];

export const getUnlockedBadges = () => {
  try {
    const saved = localStorage.getItem(STORAGE_KEYS.UNLOCKED_BADGES);
    return saved ? JSON.parse(saved) : [];
  } catch (e) {
    return [];
  }
};

export const saveUnlockedBadges = (badgeIds) => {
  try {
    localStorage.setItem(STORAGE_KEYS.UNLOCKED_BADGES, JSON.stringify(badgeIds));
  } catch (e) {
    console.error("Save badges error:", e);
  }
};

// Kiểm tra và mở khóa huy hiệu mới
export const checkAndUnlockBadges = () => {
  const currentUnlocked = getUnlockedBadges();
  const stats = getHistoryStats();
  const history = getHistory();
  const newlyUnlocked = [];

  BADGES_LIST.forEach(badge => {
    if (!currentUnlocked.includes(badge.id)) {
      if (badge.check(stats, history)) {
        newlyUnlocked.push(badge);
        currentUnlocked.push(badge.id);
      }
    }
  });

  if (newlyUnlocked.length > 0) {
    saveUnlockedBadges(currentUnlocked);
  }

  return newlyUnlocked;
};

// ==================== 3. CÀI ĐẶT & HỒ SƠ ====================
export const getSettings = () => {
  const defaultSettings = {
    apiKey: '',
    theme: 'dark',
    voiceEnabled: true,
    selectedVoice: 'female', // 'female' (Hoài My) | 'male' (Nam Minh)
    countdownAudio: true,
    soundVolume: 1.0,
    autoNextSet: true
  };
  try {
    const saved = localStorage.getItem(STORAGE_KEYS.SETTINGS);
    return saved ? { ...defaultSettings, ...JSON.parse(saved) } : defaultSettings;
  } catch (e) {
    return defaultSettings;
  }
};

export const saveSettings = (settings) => {
  try {
    localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
  } catch (e) {
    console.error("Save settings error:", e);
  }
};

export const getUserProfile = () => {
  const defaultProfile = {
    record: 60,
    frequency: '3 buổi/tuần',
    goal: 'Giảm mỡ bụng & Tăng cơ Core',
    level: 'Trung bình',
    notes: ''
  };
  try {
    const saved = localStorage.getItem(STORAGE_KEYS.USER_PROFILE);
    return saved ? { ...defaultProfile, ...JSON.parse(saved) } : defaultProfile;
  } catch (e) {
    return defaultProfile;
  }
};

export const saveUserProfile = (profile) => {
  try {
    localStorage.setItem(STORAGE_KEYS.USER_PROFILE, JSON.stringify(profile));
  } catch (e) {
    console.error("Save profile error:", e);
  }
};

// Cập nhật kỷ lục cá nhân nếu vượt qua kỷ lục cũ
export const updatePersonalRecord = (newDuration) => {
  const profile = getUserProfile();
  if (newDuration > (profile.record || 0)) {
    profile.record = newDuration;
    saveUserProfile(profile);
    return true; // Có kỷ lục mới
  }
  return false;
};

// ==================== 4. KẾ HOẠCH & LỊCH SỬ ====================
export const getActivePlan = () => {
  try {
    const saved = localStorage.getItem(STORAGE_KEYS.ACTIVE_PLAN);
    return saved ? JSON.parse(saved) : null;
  } catch (e) {
    return null;
  }
};

export const saveActivePlan = (plan) => {
  try {
    localStorage.setItem(STORAGE_KEYS.ACTIVE_PLAN, JSON.stringify(plan));
  } catch (e) {
    console.error("Save active plan error:", e);
  }
};

export const getSavedPlans = () => {
  try {
    const saved = localStorage.getItem(STORAGE_KEYS.SAVED_PLANS);
    return saved ? JSON.parse(saved) : [];
  } catch (e) {
    return [];
  }
};

export const addSavedPlan = (plan) => {
  try {
    const plans = getSavedPlans();
    const newPlan = { ...plan, id: Date.now(), createdAt: new Date().toISOString() };
    plans.unshift(newPlan);
    localStorage.setItem(STORAGE_KEYS.SAVED_PLANS, JSON.stringify(plans));
    return newPlan;
  } catch (e) {
    console.error("Add saved plan error:", e);
    return plan;
  }
};

export const getHistory = () => {
  try {
    const saved = localStorage.getItem(STORAGE_KEYS.HISTORY);
    return saved ? JSON.parse(saved) : [];
  } catch (e) {
    return [];
  }
};

export const saveHistory = (session) => {
  try {
    const history = getHistory();
    const calories = Math.round((session.duration / 60) * 4.5);
    const newRecord = {
      id: Date.now(),
      date: new Date().toISOString(),
      duration: session.duration || 0,
      planName: session.planName || "Plank Tự Do",
      completedSets: session.completedSets || 1,
      totalSets: session.totalSets || 1,
      calories: calories
    };
    history.unshift(newRecord);
    localStorage.setItem(STORAGE_KEYS.HISTORY, JSON.stringify(history));
    
    // Cập nhật kỷ lục cá nhân nếu có
    updatePersonalRecord(session.duration || 0);

    return newRecord;
  } catch (e) {
    console.error("Save history error:", e);
  }
};

export const clearHistory = () => {
  try {
    localStorage.removeItem(STORAGE_KEYS.HISTORY);
  } catch (e) {
    console.error("Clear history error:", e);
  }
};

export const getHistoryStats = () => {
  const history = getHistory();
  const totalSeconds = history.reduce((acc, curr) => acc + (curr.duration || 0), 0);
  const totalCalories = history.reduce((acc, curr) => acc + (curr.calories || 0), 0);
  const totalWorkouts = history.length;
  
  let streak = 0;
  if (history.length > 0) {
    const dates = [...new Set(history.map(h => new Date(h.date).toDateString()))];
    streak = dates.length;
  }

  return {
    totalSeconds,
    totalMinutes: Math.round(totalSeconds / 60),
    totalCalories,
    totalWorkouts,
    streak
  };
};

export const exportCSV = () => {
  const history = getHistory();
  if (history.length === 0) {
    alert("Chưa có dữ liệu tập luyện nào để xuất.");
    return false;
  }

  const headers = ["STT", "Thời Gian", "Giáo Án", "Thời Lượng Giữ (Giây)", "Số Hiệp", "Calo Ước Tính (kcal)"];
  const rows = history.map((h, index) => [
    index + 1,
    `"${new Date(h.date).toLocaleString('vi-VN')}"`,
    `"${(h.planName || "Plank Tự Do").replace(/"/g, '""')}"`,
    h.duration || 0,
    `"${h.completedSets || 1}/${h.totalSets || 1}"`,
    h.calories || 0
  ]);

  const csvContent = [
    headers.join(","),
    ...rows.map(e => e.join(","))
  ].join("\r\n");

  const blob = new Blob(["\uFEFF" + csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  const filename = `PlankAI_LichSuTap_${new Date().toISOString().slice(0, 10)}.csv`;
  
  link.setAttribute("href", url);
  link.setAttribute("download", filename);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
  return true;
};