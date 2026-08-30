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
    desc: 'Giữ Plank liên tục trong 1 hiệp từ 60 giây trở lên',
    icon: '⚡',
    rarity: 'Hiếm',
    color: 'cyan',
    check: (stats, history) => history.some(h => (h.maxSingleHold || (h.totalSets === 1 ? h.duration : 0)) >= 60)
  },
  {
    id: 'hold_120s',
    name: 'Bứt Phá 2 Phút',
    desc: 'Giữ Plank liên tục trong 1 hiệp từ 120 giây trở lên',
    icon: '🔥',
    rarity: 'Sử thi',
    color: 'amber',
    check: (stats, history) => history.some(h => (h.maxSingleHold || (h.totalSets === 1 ? h.duration : 0)) >= 120)
  },
  {
    id: 'hold_180s',
    name: 'Kỷ Lục Gia 3 Phút',
    desc: 'Giữ Plank liên tục trong 1 hiệp từ 180 giây trở lên',
    icon: '🏆',
    rarity: 'Huyền thoại',
    color: 'purple',
    check: (stats, history) => history.some(h => (h.maxSingleHold || (h.totalSets === 1 ? h.duration : 0)) >= 180)
  },
  {
    id: 'hold_300s',
    name: 'Bậc Thầy 5 Phút',
    desc: 'Chinh phục mốc 300 giây (5 phút) liên tục trong 1 hiệp',
    icon: '👑',
    rarity: 'Tối thượng',
    color: 'red',
    check: (stats, history) => history.some(h => (h.maxSingleHold || (h.totalSets === 1 ? h.duration : 0)) >= 300)
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
export const DEFAULT_PLANS = [
  {
    id: 'preset_core_7days',
    planName: '7 Ngày Bứt Phá Sức Bền Core',
    goal: 'Tăng cường sức bền, săn chắc cơ bụng và cải thiện thể lực toàn diện',
    level: 'Trung bình',
    type: 'preset',
    isDefault: true,
    createdAt: '2026-08-30T00:00:00.000Z',
    days: [
      {
        day: 1,
        title: 'Kích Hoạt Cơ Core Toàn Diện',
        exercises: [
          { name: 'Plank Khuỷu Tay Tiêu Chuẩn', holdTime: 45, restTime: 20, tip: 'Siết chặt cơ bụng và cơ mông, giữ lưng thẳng song song mặt sàn.' },
          { name: 'Side Plank (Nghiêng) Trái', holdTime: 30, restTime: 15, tip: 'Nâng cao hông, giữ thân người tạo thành đường thẳng, mở rộng ngực.' },
          { name: 'Side Plank (Nghiêng) Phải', holdTime: 30, restTime: 20, tip: 'Đẩy hông cao, siết chặt cơ liên sườn phía dưới.' },
          { name: 'Plank Cao Căng Tay', holdTime: 45, restTime: 25, tip: 'Cổ tay ngay dưới vai, mắt nhìn xuống sàn, hít thở đều đặn.' }
        ]
      }
    ]
  },
  {
    id: 'preset_burn_fat',
    planName: 'Siết Cơ Bụng & Đốt Mỡ Thần Tốc',
    goal: 'Đốt mỡ nhanh, thon gọn vòng eo và kích hoạt cơ bụng 6 múi',
    level: 'Nâng cao',
    type: 'preset',
    isDefault: true,
    createdAt: '2026-08-30T00:00:00.000Z',
    days: [
      {
        day: 1,
        title: 'Chuỗi Plank Đốt Mỡ Chuyên Sâu',
        exercises: [
          { name: 'Plank Tiêu Chuẩn', holdTime: 60, restTime: 20, tip: 'Khóa chặt khớp vai, gồng cứng cơ bụng tối đa.' },
          { name: 'Plank Co Gối Mountain Climber', holdTime: 40, restTime: 20, tip: 'Co từng gối hướng về phía ngực nhịp nhàng.' },
          { name: 'Side Plank Nâng Chân', holdTime: 35, restTime: 20, tip: 'Giữ thăng bằng và nâng chân trên lên cao.' },
          { name: 'Plank Chạm Vai Chéo', holdTime: 40, restTime: 20, tip: 'Hạn chế lắc hông khi tay chạm vai đối diện.' },
          { name: 'Plank Khóa Khớp Tối Đa', holdTime: 45, restTime: 30, tip: 'Hiệp cuối cùng! Dồn toàn bộ ý chí giữ vững tư thế!' }
        ]
      }
    ]
  },
  {
    id: 'preset_beginner_spine',
    planName: 'Khởi Động Tân Binh & Bảo Vệ Cột Sống',
    goal: 'Làm quen an toàn, củng cố cơ lưng dưới và phòng tránh đau mỏi',
    level: 'Mới bắt đầu',
    type: 'preset',
    isDefault: true,
    createdAt: '2026-08-30T00:00:00.000Z',
    days: [
      {
        day: 1,
        title: 'Nhập Môn Nhẹ Nhàng & Chuẩn Form',
        exercises: [
          { name: 'Plank Khuỷu Tay Nhẹ Nhàng', holdTime: 30, restTime: 20, tip: 'Tập trung cảm nhận cơ bụng, không cần gồng quá sức.' },
          { name: 'Plank Cao Chống Tay', holdTime: 25, restTime: 20, tip: 'Giữ vai thoải mái, hít sâu bằng mũi và thở ra bằng miệng.' },
          { name: 'Side Plank Chống Gối', holdTime: 25, restTime: 20, tip: 'Gập gối 90 độ để giảm bớt áp lực lên khớp vai.' }
        ]
      }
    ]
  }
];

export const getSavedPlans = () => {
  try {
    const saved = localStorage.getItem(STORAGE_KEYS.SAVED_PLANS);
    return saved ? JSON.parse(saved) : [];
  } catch (e) {
    return [];
  }
};

export const getAllPlans = () => {
  const customPlans = getSavedPlans();
  return [...customPlans, ...DEFAULT_PLANS];
};

export const getActivePlan = () => {
  try {
    const saved = localStorage.getItem(STORAGE_KEYS.ACTIVE_PLAN);
    if (saved) return JSON.parse(saved);
    return DEFAULT_PLANS[0];
  } catch (e) {
    return DEFAULT_PLANS[0];
  }
};

export const saveActivePlan = (plan) => {
  try {
    localStorage.setItem(STORAGE_KEYS.ACTIVE_PLAN, JSON.stringify(plan));
  } catch (e) {
    console.error("Save active plan error:", e);
  }
};

export const savePlan = (plan) => {
  try {
    const plans = getSavedPlans();
    const isNew = !plan.id || plan.id.startsWith('preset_');
    const planId = isNew ? `plan_${Date.now()}` : plan.id;
    const planType = plan.type || (isNew ? 'custom' : 'custom');

    const formattedPlan = {
      ...plan,
      id: planId,
      type: planType,
      isDefault: false,
      updatedAt: new Date().toISOString(),
      createdAt: plan.createdAt || new Date().toISOString()
    };

    const existingIndex = plans.findIndex(p => p.id === planId);
    if (existingIndex >= 0) {
      plans[existingIndex] = formattedPlan;
    } else {
      plans.unshift(formattedPlan);
    }

    localStorage.setItem(STORAGE_KEYS.SAVED_PLANS, JSON.stringify(plans));

    // Nếu giáo án đang chỉnh sửa cũng là giáo án active -> cập nhật active luôn
    const active = getActivePlan();
    if (active && (active.id === planId || active.planName === plan.planName)) {
      saveActivePlan(formattedPlan);
    }

    return formattedPlan;
  } catch (e) {
    console.error("Save plan error:", e);
    return plan;
  }
};

export const deletePlan = (planId) => {
  try {
    let plans = getSavedPlans();
    plans = plans.filter(p => p.id !== planId);
    localStorage.setItem(STORAGE_KEYS.SAVED_PLANS, JSON.stringify(plans));

    const active = getActivePlan();
    if (active && active.id === planId) {
      saveActivePlan(DEFAULT_PLANS[0]);
    }

    return plans;
  } catch (e) {
    console.error("Delete plan error:", e);
    return [];
  }
};

export const duplicatePlan = (planId) => {
  try {
    const all = getAllPlans();
    const sourcePlan = all.find(p => p.id === planId);
    if (!sourcePlan) return null;

    const clonedPlan = {
      ...JSON.parse(JSON.stringify(sourcePlan)),
      id: `plan_${Date.now()}`,
      planName: `${sourcePlan.planName} (Bản sao)`,
      type: 'custom',
      isDefault: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    return savePlan(clonedPlan);
  } catch (e) {
    console.error("Duplicate plan error:", e);
    return null;
  }
};

export const addSavedPlan = (plan) => {
  return savePlan(plan);
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
    const maxSingleHold = session.maxSingleHold !== undefined 
      ? session.maxSingleHold 
      : (session.totalSets === 1 ? (session.duration || 0) : (session.duration ? Math.round(session.duration / (session.completedSets || 1)) : 0));

    const newRecord = {
      id: Date.now(),
      date: new Date().toISOString(),
      duration: session.duration || 0,
      maxSingleHold: maxSingleHold,
      planName: session.planName || "Plank Tự Do",
      completedSets: session.completedSets || 1,
      totalSets: session.totalSets || 1,
      calories: calories
    };
    history.unshift(newRecord);
    localStorage.setItem(STORAGE_KEYS.HISTORY, JSON.stringify(history));
    
    // Cập nhật kỷ lục cá nhân liên tục nếu có
    if (maxSingleHold > 0) {
      updatePersonalRecord(maxSingleHold);
    }

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