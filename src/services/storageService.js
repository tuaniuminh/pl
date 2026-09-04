/**
 * Dịch vụ lưu trữ LocalStorage, Hệ thống Huy hiệu & Screen Wake Lock
 */

const STORAGE_KEYS = {
  SETTINGS: 'plank_settings_v2',
  HISTORY: 'plank_history_v2',
  ACTIVE_PLAN: 'plank_active_plan_v2',
  SAVED_PLANS: 'plank_saved_plans_v2',
  USER_PROFILE: 'plank_user_profile_v2',
  UNLOCKED_BADGES: 'plank_unlocked_badges_v2',
  DELETED_DEFAULT_PLANS: 'plank_deleted_default_plans_v2'
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
  // --- A. Khởi Đầu & Số Lượng Buổi Tập ---
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
    id: 'workouts_5',
    name: 'Kiên Định 5 Buổi',
    desc: 'Hoàn thành 5 buổi tập Plank',
    icon: '🥈',
    rarity: 'Hiếm',
    color: 'cyan',
    check: (stats, history) => history.length >= 5
  },
  {
    id: 'workouts_20',
    name: 'Chuyên Gia 20 Buổi',
    desc: 'Hoàn thành 20 buổi tập Plank',
    icon: '🥇',
    rarity: 'Sử thi',
    color: 'amber',
    check: (stats, history) => history.length >= 20
  },
  {
    id: 'workouts_50',
    name: 'Đại Sư 50 Buổi',
    desc: 'Chinh phục cột mốc 50 buổi tập kiên trì',
    icon: '🏆',
    rarity: 'Huyền thoại',
    color: 'purple',
    check: (stats, history) => history.length >= 50
  },

  // --- B. Kỷ Lục Giữ Plank Đơn Hiệp ---
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

  // --- C. Chuỗi Ngày Tập Liên Tiếp ---
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
    id: 'streak_14',
    name: 'Kỷ Luật Kim Cương',
    desc: 'Duy trì chuỗi tập 14 ngày liên tiếp không bỏ cuộc',
    icon: '💠',
    rarity: 'Huyền thoại',
    color: 'purple',
    check: (stats) => stats.streak >= 14
  },
  {
    id: 'streak_30',
    name: 'Bất Khả Chiến Bại',
    desc: 'Chinh phục chuỗi kỷ lục 30 ngày tập liên tiếp',
    icon: '👑',
    rarity: 'Tối thượng',
    color: 'red',
    check: (stats) => stats.streak >= 30
  },

  // --- D. Tổng Thời Gian Tích Lũy ---
  {
    id: 'total_30m',
    name: 'Chiến Thần 30 Phút',
    desc: 'Tổng thời gian tích lũy đạt 30 phút Plank',
    icon: '🛡️',
    rarity: 'Sử thi',
    color: 'amber',
    check: (stats) => stats.totalSeconds >= 1800
  },
  {
    id: 'total_1h',
    name: 'Chúa Tể Core 1 Giờ',
    desc: 'Tổng thời gian tích lũy đạt 60 phút Plank',
    icon: '⚔️',
    rarity: 'Huyền thoại',
    color: 'purple',
    check: (stats) => stats.totalSeconds >= 3600
  },
  {
    id: 'total_3h',
    name: 'Huyền Thoại Bất Tử',
    desc: 'Tổng thời gian tích lũy đạt 180 phút (3 giờ) Plank',
    icon: '🌌',
    rarity: 'Tối thượng',
    color: 'red',
    check: (stats) => stats.totalSeconds >= 10800
  },

  // --- E. Tích Lũy Hiệp & Năng Lượng Đốt Cháy ---
  {
    id: 'sets_50',
    name: 'Bức Tường Thép 50 Hiệp',
    desc: 'Tích lũy hoàn thành 50 hiệp Plank',
    icon: '🧱',
    rarity: 'Hiếm',
    color: 'cyan',
    check: (stats) => (stats.totalSets || 0) >= 50
  },
  {
    id: 'sets_100',
    name: 'Pháo Đài Bất Hoại',
    desc: 'Tích lũy hoàn thành 100 hiệp Plank',
    icon: '🏛️',
    rarity: 'Huyền thoại',
    color: 'purple',
    check: (stats) => (stats.totalSets || 0) >= 100
  },
  {
    id: 'cal_500',
    name: 'Lò Đốt Mỡ 500 kcal',
    desc: 'Đốt cháy tích lũy 500 kcal từ các bài tập',
    icon: '♨️',
    rarity: 'Hiếm',
    color: 'cyan',
    check: (stats) => stats.totalCalories >= 500
  },
  {
    id: 'cal_2000',
    name: 'Núi Lửa Năng Lượng',
    desc: 'Đốt cháy tích lũy 2000 kcal từ Plank',
    icon: '🌋',
    rarity: 'Huyền thoại',
    color: 'purple',
    check: (stats) => stats.totalCalories >= 2000
  },

  // --- F. Thử Thách & Phong Cách Tập Luyện ---
  {
    id: 'ten_sets_session',
    name: 'Chiến Binh 10 Hiệp',
    desc: 'Hoàn thành 1 buổi tập có từ 10 hiệp trở lên',
    icon: '🎯',
    rarity: 'Sử thi',
    color: 'amber',
    check: (stats, history) => history.some(h => (h.completedSets || 1) >= 10)
  },
  {
    id: 'early_bird',
    name: 'Chiến Binh Bình Minh',
    desc: 'Hoàn thành bài tập trong khung giờ sáng sớm (5h - 8h)',
    icon: '🌅',
    rarity: 'Đặc biệt',
    color: 'cyan',
    check: (stats, history) => history.some(h => {
      const hour = new Date(h.date).getHours();
      return hour >= 5 && hour < 8;
    })
  },
  {
    id: 'night_owl',
    name: 'Cú Đêm Bền Bỉ',
    desc: 'Hoàn thành bài tập trong khung giờ đêm (21h - 24h)',
    icon: '🌙',
    rarity: 'Đặc biệt',
    color: 'purple',
    check: (stats, history) => history.some(h => {
      const hour = new Date(h.date).getHours();
      return hour >= 21 && hour <= 23;
    })
  },
  {
    id: 'max_challenge',
    name: 'Vô Cực Vượt Ngưỡng',
    desc: 'Chinh phục 1 buổi Thách Thức Vô Cực (Max-Out)',
    icon: '🌌',
    rarity: 'Đặc biệt',
    color: 'cyan',
    check: (stats, history) => history.some(h => h.planName?.includes('Thách Thức Vô Cực') || h.planId === 'max_challenge')
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
    soundEnabled: true,
    heartbeatEnabled: true, // Âm thanh nhịp tim dồn dập ở 15 giây cuối
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

export const getDeletedDefaultPlanIds = () => {
  try {
    const saved = localStorage.getItem(STORAGE_KEYS.DELETED_DEFAULT_PLANS);
    return saved ? JSON.parse(saved) : [];
  } catch (e) {
    return [];
  }
};

export const restoreDefaultPlans = () => {
  try {
    localStorage.removeItem(STORAGE_KEYS.DELETED_DEFAULT_PLANS);
    return true;
  } catch (e) {
    return false;
  }
};

export const getAllPlans = () => {
  const customPlans = getSavedPlans();
  const deletedIds = getDeletedDefaultPlanIds();
  const visibleDefaults = DEFAULT_PLANS.filter(p => !deletedIds.includes(p.id));
  return [...customPlans, ...visibleDefaults];
};

export const getActivePlan = () => {
  try {
    const saved = localStorage.getItem(STORAGE_KEYS.ACTIVE_PLAN);
    if (saved) return JSON.parse(saved);
    const all = getAllPlans();
    return all[0] || DEFAULT_PLANS[0];
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

    // Lưu lại tên cũ trước khi cập nhật (nếu có) để đối soát lịch sử
    const existingPlan = plans.find(p => p.id === planId);
    const oldPlanName = existingPlan?.planName;

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
    if (active && (active.id === planId || active.planName === oldPlanName || active.planName === plan.planName)) {
      saveActivePlan(formattedPlan);
    }

    // ĐỒNG BỘ TÊN MỚI VÀO TOÀN BỘ LỊCH SỬ TẬP LUYỆN ĐÃ TẬP TRƯỚC ĐÓ
    try {
      const history = getHistory();
      let historyChanged = false;
      const updatedHistory = history.map(h => {
        const isMatchById = h.planId && h.planId === planId;
        const isMatchByName = oldPlanName && h.planName === oldPlanName;
        
        if (isMatchById || isMatchByName) {
          historyChanged = true;
          return {
            ...h,
            planId: planId,
            planName: formattedPlan.planName
          };
        }
        return h;
      });

      if (historyChanged) {
        localStorage.setItem(STORAGE_KEYS.HISTORY, JSON.stringify(updatedHistory));
      }
    } catch (syncErr) {
      console.warn("Sync history error:", syncErr);
    }

    return formattedPlan;
  } catch (e) {
    console.error("Save plan error:", e);
    return plan;
  }
};

export const deletePlan = (planId) => {
  try {
    let customPlans = getSavedPlans();
    const isCustom = customPlans.some(p => p.id === planId);

    if (isCustom) {
      customPlans = customPlans.filter(p => p.id !== planId);
      localStorage.setItem(STORAGE_KEYS.SAVED_PLANS, JSON.stringify(customPlans));
    } else {
      // Nếu là mẫu chuẩn (preset) -> thêm ID vào danh sách mẫu chuẩn đã xóa
      const deletedIds = getDeletedDefaultPlanIds();
      if (!deletedIds.includes(planId)) {
        deletedIds.push(planId);
        localStorage.setItem(STORAGE_KEYS.DELETED_DEFAULT_PLANS, JSON.stringify(deletedIds));
      }
    }

    const remaining = getAllPlans();
    const active = getActivePlan();
    if (active && active.id === planId) {
      saveActivePlan(remaining[0] || DEFAULT_PLANS[0]);
    }

    return remaining;
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
      planId: session.planId || null,
      planName: session.planName || "Plank Tự Do",
      duration: session.duration || 0,
      maxSingleHold: maxSingleHold,
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

export const deleteHistoryItem = (id) => {
  try {
    const history = getHistory();
    const filtered = history.filter(item => item.id !== id);
    localStorage.setItem(STORAGE_KEYS.HISTORY, JSON.stringify(filtered));
    return true;
  } catch (e) {
    console.error("Delete history item error:", e);
    return false;
  }
};

export const getHistoryStats = () => {
  const history = getHistory();
  const totalSeconds = history.reduce((acc, curr) => acc + (curr.duration || 0), 0);
  const totalCalories = history.reduce((acc, curr) => acc + (curr.calories || 0), 0);
  const totalWorkouts = history.length;
  const totalSets = history.reduce((acc, curr) => acc + (curr.completedSets || 1), 0);
  
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
    totalSets,
    streak
  };
};

export const getWorkoutHistorySummaryForAI = () => {
  const history = getHistory();
  const stats = getHistoryStats();
  const profile = getUserProfile();

  const recentSessions = history.slice(0, 5).map((h, i) => {
    const dateStr = new Date(h.date).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });
    const holdTime = h.maxSingleHold || (h.completedSets === 1 ? h.duration : Math.round((h.duration || 60) / (h.completedSets || 1)));
    return `- Buổi ${i + 1} (${dateStr}): Bài "${h.planName || 'Plank'}", giữ tổng ${h.duration || 0}s (${Math.round((h.duration || 0) / 60)}p), kỷ lục đơn hiệp: ${holdTime}s, hoàn thành ${h.completedSets || 1} hiệp, đốt ${h.calories || 0} kcal.`;
  });

  return {
    totalWorkouts: stats.totalWorkouts,
    totalSeconds: stats.totalSeconds,
    totalMinutes: stats.totalMinutes,
    totalCalories: stats.totalCalories,
    totalSets: stats.totalSets,
    streak: stats.streak,
    personalRecord: profile.record || 60,
    goal: profile.goal || "Tăng sức bền & Giảm mỡ bụng",
    level: profile.level || "Trung bình",
    recentSessionsText: recentSessions.length > 0 
      ? recentSessions.join('\n') 
      : "Chưa có lịch sử buổi tập trước đó (đây là học viên mới bắt đầu)."
  };
};

// ==================== 5. BỘ CÂN CHỈNH & TỰ ĐỘNG ĐỒNG BỘ DỮ LIỆU CŨ ====================
export const recalibrateAndSyncAllData = () => {
  try {
    const history = getHistory();
    const customPlans = getSavedPlans();
    let historyChanged = false;

    // 1. Cân chỉnh và sửa các bản ghi lịch sử cũ (sửa 660s -> 600s, gán maxSingleHold, cập nhật tên giáo án)
    const updatedHistory = history.map(h => {
      let item = { ...h };

      // Sửa lỗi nhân đôi thời gian ở bản cũ (ví dụ 10 hiệp x 60s thành 660s)
      if (item.duration === 660 && (item.completedSets === 10 || item.totalSets === 10)) {
        item.duration = 600;
        item.maxSingleHold = 60;
        historyChanged = true;
      }

      // Tự động đồng bộ và tính lại calo chính xác theo thời lượng thực tế (chuẩn hóa các bản ghi cũ)
      const standardCalories = Math.round(((item.duration || 0) / 60) * 4.5);
      if (item.calories !== standardCalories) {
        item.calories = standardCalories;
        historyChanged = true;
      }

      // Đảm bảo có maxSingleHold chính xác
      if (item.maxSingleHold === undefined || item.maxSingleHold === null) {
        if (item.completedSets > 1) {
          item.maxSingleHold = Math.round(item.duration / item.completedSets);
        } else {
          item.maxSingleHold = item.duration || 0;
        }
        historyChanged = true;
      }

      // Đồng bộ tên giáo án nếu người dùng đã đổi tên giáo án
      if (customPlans.length > 0) {
        let matchedPlan = customPlans.find(p => p.id === item.planId);
        if (!matchedPlan) {
          // Nếu item này mang tên mặc định cũ như 'Giáo Án Tự Thiết Kế'
          if (item.planName?.includes('Giáo Án Tự Thiết Kế') || item.planName === 'Plank Tự Do') {
            matchedPlan = customPlans[0];
          }
        }

        if (matchedPlan && item.planName !== matchedPlan.planName) {
          item.planId = matchedPlan.id;
          item.planName = matchedPlan.planName;
          historyChanged = true;
        }
      }

      return item;
    });

    if (historyChanged) {
      localStorage.setItem(STORAGE_KEYS.HISTORY, JSON.stringify(updatedHistory));
    }

    // 2. Cân chỉnh lại Kỷ Lục Cá Nhân (Personal Record)
    const validHistory = getHistory();
    let trueMaxContinuous = 60;
    if (validHistory.length > 0) {
      trueMaxContinuous = validHistory.reduce((max, h) => {
        const single = h.maxSingleHold || (h.totalSets === 1 ? h.duration : Math.round(h.duration / (h.completedSets || 1))) || 0;
        return Math.max(max, single);
      }, 60);
    }

    const userProfile = getUserProfile();
    if (userProfile.record > trueMaxContinuous || !userProfile.record) {
      userProfile.record = trueMaxContinuous;
      saveUserProfile(userProfile);
    }

    // 3. Quét và Cân Chỉnh Lại Toàn Bộ Danh Hiệu / Huy Hiệu Hợp Lệ
    const stats = getHistoryStats();
    const legitimateBadgeIds = [];

    BADGES_LIST.forEach(badge => {
      if (badge.check(stats, validHistory)) {
        legitimateBadgeIds.push(badge.id);
      }
    });

    // Ghi đè lại chính xác danh sách huy hiệu thực sự đạt được
    saveUnlockedBadges(legitimateBadgeIds);

    return {
      history: validHistory,
      badges: legitimateBadgeIds,
      userProfile
    };
  } catch (err) {
    console.error("Recalibration error:", err);
    return null;
  }
};