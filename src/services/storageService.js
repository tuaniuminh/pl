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
  DELETED_DEFAULT_PLANS: 'plank_deleted_default_plans_v2',
  LAST_AI_COACH_ADVICE: 'plank_last_ai_coach_advice_v2'
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

// Trích xuất kỷ lục giữ liên tục đơn hiệp tốt nhất từ 1 buổi tập
const extractSessionMaxHold = (session) => {
  if (!session) return 0;
  if (session.maxSingleHold && session.maxSingleHold > 0) return session.maxSingleHold;
  if (Array.isArray(session.setsDetail) && session.setsDetail.length > 0) {
    return Math.max(...session.setsDetail.map(s => Number(s.holdTime) || 0));
  }
  if (session.completedSets === 1 || session.totalSets === 1) return session.duration || 0;
  return session.duration ? Math.round(session.duration / (session.completedSets || 1)) : 0;
};

// ==================== 2. HỆ THỐNG DANH HIỆU & HUY HIỆU ====================
export const BADGES_LIST = [
  // --- A. Khởi Đầu & Số Lượng Buổi Tập (Workouts Count) ---
  {
    id: 'first_step',
    name: 'Tân Binh Thép',
    desc: 'Hoàn thành bài tập Plank đầu tiên',
    icon: '🥉',
    rarity: 'Cơ bản',
    color: 'emerald',
    check: (stats, history) => (stats.totalWorkouts || history.length) >= 1
  },
  {
    id: 'workouts_5',
    name: 'Kiên Định 5 Buổi',
    desc: 'Hoàn thành 5 buổi tập Plank',
    icon: '🥈',
    rarity: 'Hiếm',
    color: 'cyan',
    check: (stats, history) => (stats.totalWorkouts || history.length) >= 5
  },
  {
    id: 'workouts_10',
    name: 'Chiến Binh 10 Buổi',
    desc: 'Hoàn thành 10 buổi tập Plank',
    icon: '🎖️',
    rarity: 'Hiếm',
    color: 'cyan',
    check: (stats, history) => (stats.totalWorkouts || history.length) >= 10
  },
  {
    id: 'workouts_20',
    name: 'Chuyên Gia 20 Buổi',
    desc: 'Hoàn thành 20 buổi tập Plank',
    icon: '🥇',
    rarity: 'Sử thi',
    color: 'amber',
    check: (stats, history) => (stats.totalWorkouts || history.length) >= 20
  },
  {
    id: 'workouts_35',
    name: 'Thói Quen Thép 35 Buổi',
    desc: 'Duy trì lối sống kiên trì với 35 buổi tập Plank',
    icon: '⭐',
    rarity: 'Sử thi',
    color: 'amber',
    check: (stats, history) => (stats.totalWorkouts || history.length) >= 35
  },
  {
    id: 'workouts_50',
    name: 'Đại Sư 50 Buổi',
    desc: 'Chinh phục cột mốc 50 buổi tập kiên trì',
    icon: '🏆',
    rarity: 'Huyền thoại',
    color: 'purple',
    check: (stats, history) => (stats.totalWorkouts || history.length) >= 50
  },
  {
    id: 'workouts_100',
    name: 'Huyền Thoại 100 Buổi',
    desc: 'Gia nhập hàng ngũ cao quý với 100 buổi tập Plank',
    icon: '👑',
    rarity: 'Tối thượng',
    color: 'red',
    check: (stats, history) => (stats.totalWorkouts || history.length) >= 100
  },

  // --- B. Kỷ Lục Giữ Plank Đơn Hiệp (Max Single Hold) ---
  {
    id: 'hold_30s',
    name: 'Khởi Động Năng Lượng',
    desc: 'Giữ Plank liên tục trong 1 hiệp từ 30 giây trở lên',
    icon: '⚡',
    rarity: 'Cơ bản',
    color: 'emerald',
    check: (stats, history) => {
      const profile = getUserProfile();
      if ((profile?.record || 0) >= 30) return true;
      return history.some(h => extractSessionMaxHold(h) >= 30);
    }
  },
  {
    id: 'hold_60s',
    name: 'Chiến Binh 1 Phút',
    desc: 'Giữ Plank liên tục trong 1 hiệp từ 60 giây trở lên',
    icon: '⚡',
    rarity: 'Hiếm',
    color: 'cyan',
    check: (stats, history) => {
      const profile = getUserProfile();
      if ((profile?.record || 0) >= 60) return true;
      return history.some(h => extractSessionMaxHold(h) >= 60);
    }
  },
  {
    id: 'hold_90s',
    name: 'Bền Bỉ 90 Giây',
    desc: 'Giữ Plank liên tục trong 1 hiệp từ 90 giây trở lên',
    icon: '🔥',
    rarity: 'Hiếm',
    color: 'cyan',
    check: (stats, history) => {
      const profile = getUserProfile();
      if ((profile?.record || 0) >= 90) return true;
      return history.some(h => extractSessionMaxHold(h) >= 90);
    }
  },
  {
    id: 'hold_120s',
    name: 'Bứt Phá 2 Phút',
    desc: 'Giữ Plank liên tục trong 1 hiệp từ 120 giây trở lên',
    icon: '🔥',
    rarity: 'Sử thi',
    color: 'amber',
    check: (stats, history) => {
      const profile = getUserProfile();
      if ((profile?.record || 0) >= 120) return true;
      return history.some(h => extractSessionMaxHold(h) >= 120);
    }
  },
  {
    id: 'hold_180s',
    name: 'Kỷ Lục Gia 3 Phút',
    desc: 'Giữ Plank liên tục trong 1 hiệp từ 180 giây trở lên',
    icon: '🏆',
    rarity: 'Huyền thoại',
    color: 'purple',
    check: (stats, history) => {
      const profile = getUserProfile();
      if ((profile?.record || 0) >= 180) return true;
      return history.some(h => extractSessionMaxHold(h) >= 180);
    }
  },
  {
    id: 'hold_240s',
    name: 'Ý Chí Thép 4 Phút',
    desc: 'Giữ Plank liên tục trong 1 hiệp từ 240 giây (4 phút) trở lên',
    icon: '💫',
    rarity: 'Huyền thoại',
    color: 'purple',
    check: (stats, history) => {
      const profile = getUserProfile();
      if ((profile?.record || 0) >= 240) return true;
      return history.some(h => extractSessionMaxHold(h) >= 240);
    }
  },
  {
    id: 'hold_300s',
    name: 'Bậc Thầy 5 Phút',
    desc: 'Chinh phục mốc 300 giây (5 phút) liên tục trong 1 hiệp',
    icon: '👑',
    rarity: 'Tối thượng',
    color: 'red',
    check: (stats, history) => {
      const profile = getUserProfile();
      if ((profile?.record || 0) >= 300) return true;
      return history.some(h => extractSessionMaxHold(h) >= 300);
    }
  },
  {
    id: 'hold_420s',
    name: 'Thần Lực Siêu Phàm 7 Phút',
    desc: 'Chinh phục mốc 420 giây (7 phút) liên tục trong 1 hiệp',
    icon: '🌌',
    rarity: 'Tối thượng',
    color: 'red',
    check: (stats, history) => {
      const profile = getUserProfile();
      if ((profile?.record || 0) >= 420) return true;
      return history.some(h => extractSessionMaxHold(h) >= 420);
    }
  },

  // --- C. Chuỗi Ngày Tập Liên Tiếp (Consecutive Streak) ---
  {
    id: 'streak_3',
    name: 'Kiên Trì 3 Ngày',
    desc: 'Duy trì chuỗi tập 3 ngày liên tiếp',
    icon: '🌟',
    rarity: 'Hiếm',
    color: 'cyan',
    check: (stats) => (stats.bestStreak || stats.streak || 0) >= 3
  },
  {
    id: 'streak_5',
    name: 'Nhịp Điệu Không Ngừng',
    desc: 'Duy trì chuỗi tập 5 ngày liên tiếp',
    icon: '⚡',
    rarity: 'Hiếm',
    color: 'cyan',
    check: (stats) => (stats.bestStreak || stats.streak || 0) >= 5
  },
  {
    id: 'streak_7',
    name: 'Bản Lĩnh 7 Ngày',
    desc: 'Duy trì chuỗi tập 7 ngày liên tiếp',
    icon: '💎',
    rarity: 'Sử thi',
    color: 'amber',
    check: (stats) => (stats.bestStreak || stats.streak || 0) >= 7
  },
  {
    id: 'streak_10',
    name: 'Kỷ Luật Vàng 10 Ngày',
    desc: 'Duy trì chuỗi tập 10 ngày liên tiếp',
    icon: '🏅',
    rarity: 'Sử thi',
    color: 'amber',
    check: (stats) => (stats.bestStreak || stats.streak || 0) >= 10
  },
  {
    id: 'streak_14',
    name: 'Kỷ Luật Kim Cương',
    desc: 'Duy trì chuỗi tập 14 ngày liên tiếp không bỏ cuộc',
    icon: '💠',
    rarity: 'Huyền thoại',
    color: 'purple',
    check: (stats) => (stats.bestStreak || stats.streak || 0) >= 14
  },
  {
    id: 'streak_21',
    name: 'Bản Năng Thép 21 Ngày',
    desc: '21 ngày liên tiếp để biến Plank thành bản năng tự nhiên',
    icon: '🔮',
    rarity: 'Huyền thoại',
    color: 'purple',
    check: (stats) => (stats.bestStreak || stats.streak || 0) >= 21
  },
  {
    id: 'streak_30',
    name: 'Bất Khả Chiến Bại',
    desc: 'Chinh phục chuỗi kỷ lục 30 ngày tập liên tiếp',
    icon: '👑',
    rarity: 'Tối thượng',
    color: 'red',
    check: (stats) => (stats.bestStreak || stats.streak || 0) >= 30
  },
  {
    id: 'streak_60',
    name: 'Ý Chí Kim Cương 60 Ngày',
    desc: 'Kỳ tích phi thường: 60 ngày tập luyện không gián đoạn',
    icon: '🪐',
    rarity: 'Tối thượng',
    color: 'red',
    check: (stats) => (stats.bestStreak || stats.streak || 0) >= 60
  },

  // --- D. Tổng Thời Gian Tích Lũy (Cumulative Hold Time) ---
  {
    id: 'total_15m',
    name: 'Bước Đệm 15 Phút',
    desc: 'Tổng thời gian tích lũy đạt 15 phút (900 giây) Plank',
    icon: '⏱️',
    rarity: 'Cơ bản',
    color: 'emerald',
    check: (stats) => (stats.totalSeconds || 0) >= 900
  },
  {
    id: 'total_30m',
    name: 'Chiến Thần 30 Phút',
    desc: 'Tổng thời gian tích lũy đạt 30 phút Plank',
    icon: '🛡️',
    rarity: 'Sử thi',
    color: 'amber',
    check: (stats) => (stats.totalSeconds || 0) >= 1800
  },
  {
    id: 'total_1h',
    name: 'Chúa Tể Core 1 Giờ',
    desc: 'Tổng thời gian tích lũy đạt 60 phút Plank',
    icon: '⚔️',
    rarity: 'Huyền thoại',
    color: 'purple',
    check: (stats) => (stats.totalSeconds || 0) >= 3600
  },
  {
    id: 'total_2h',
    name: 'Chiến Binh 2 Giờ Core',
    desc: 'Tổng thời gian tích lũy đạt 120 phút (2 giờ) Plank',
    icon: '⚡',
    rarity: 'Huyền thoại',
    color: 'purple',
    check: (stats) => (stats.totalSeconds || 0) >= 7200
  },
  {
    id: 'total_3h',
    name: 'Huyền Thoại Bất Tử',
    desc: 'Tổng thời gian tích lũy đạt 180 phút (3 giờ) Plank',
    icon: '🌌',
    rarity: 'Tối thượng',
    color: 'red',
    check: (stats) => (stats.totalSeconds || 0) >= 10800
  },
  {
    id: 'total_5h',
    name: 'Ý Chí Bất Diệt 5 Giờ',
    desc: 'Tổng thời gian tích lũy đạt 300 phút (5 giờ) Plank',
    icon: '👑',
    rarity: 'Tối thượng',
    color: 'red',
    check: (stats) => (stats.totalSeconds || 0) >= 18000
  },

  // --- E. Tích Lũy Hiệp & Năng Lượng Đốt Cháy ---
  {
    id: 'sets_25',
    name: 'Tập Sự 25 Hiệp',
    desc: 'Tích lũy hoàn thành 25 hiệp Plank',
    icon: '🧱',
    rarity: 'Cơ bản',
    color: 'emerald',
    check: (stats) => (stats.totalSets || 0) >= 25
  },
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
    id: 'sets_200',
    name: 'Trường Thành Bất Tử 200 Hiệp',
    desc: 'Tích lũy hoàn thành 200 hiệp Plank',
    icon: '🏯',
    rarity: 'Tối thượng',
    color: 'red',
    check: (stats) => (stats.totalSets || 0) >= 200
  },
  {
    id: 'cal_100',
    name: 'Tia Lửa Năng Lượng',
    desc: 'Đốt cháy tích lũy 100 kcal từ các bài tập',
    icon: '✨',
    rarity: 'Cơ bản',
    color: 'emerald',
    check: (stats) => (stats.totalCalories || 0) >= 100
  },
  {
    id: 'cal_500',
    name: 'Lò Đốt Mỡ 500 kcal',
    desc: 'Đốt cháy tích lũy 500 kcal từ các bài tập',
    icon: '♨️',
    rarity: 'Hiếm',
    color: 'cyan',
    check: (stats) => (stats.totalCalories || 0) >= 500
  },
  {
    id: 'cal_1000',
    name: 'Cỗ Máy Năng Lượng 1000 kcal',
    desc: 'Đốt cháy tích lũy 1000 kcal từ Plank',
    icon: '🔥',
    rarity: 'Sử thi',
    color: 'amber',
    check: (stats) => (stats.totalCalories || 0) >= 1000
  },
  {
    id: 'cal_2000',
    name: 'Núi Lửa Năng Lượng',
    desc: 'Đốt cháy tích lũy 2000 kcal từ Plank',
    icon: '🌋',
    rarity: 'Huyền thoại',
    color: 'purple',
    check: (stats) => (stats.totalCalories || 0) >= 2000
  },
  {
    id: 'cal_5000',
    name: 'Đại Hỏa Ngục 5000 kcal',
    desc: 'Đốt cháy tích lũy 5000 kcal từ Plank',
    icon: '☄️',
    rarity: 'Tối thượng',
    color: 'red',
    check: (stats) => (stats.totalCalories || 0) >= 5000
  },

  // --- F. Thử Thách & Thành Tích Buổi Tập ---
  {
    id: 'five_sets_session',
    name: 'Hiệp Sĩ 5 Hiệp',
    desc: 'Hoàn thành 1 buổi tập có từ 5 hiệp trở lên',
    icon: '⚔️',
    rarity: 'Hiếm',
    color: 'cyan',
    check: (stats, history) => history.some(h => (h.completedSets || h.totalSets || (Array.isArray(h.setsDetail) ? h.setsDetail.length : 1)) >= 5)
  },
  {
    id: 'ten_sets_session',
    name: 'Chiến Binh 10 Hiệp',
    desc: 'Hoàn thành 1 buổi tập có từ 10 hiệp trở lên',
    icon: '🎯',
    rarity: 'Sử thi',
    color: 'amber',
    check: (stats, history) => history.some(h => (h.completedSets || h.totalSets || (Array.isArray(h.setsDetail) ? h.setsDetail.length : 1)) >= 10)
  },
  {
    id: 'session_300s',
    name: 'Buổi Tập Thép 5 Phút',
    desc: 'Hoàn thành 1 buổi tập có tổng thời gian gồng từ 300 giây (5 phút) trở lên',
    icon: '🏋️',
    rarity: 'Sử thi',
    color: 'amber',
    check: (stats, history) => history.some(h => (h.duration || 0) >= 300)
  },
  {
    id: 'session_600s',
    name: 'Chiến Dịch 10 Phút',
    desc: 'Hoàn thành 1 buổi tập có tổng thời gian gồng từ 600 giây (10 phút) trở lên',
    icon: '🛡️',
    rarity: 'Huyền thoại',
    color: 'purple',
    check: (stats, history) => history.some(h => (h.duration || 0) >= 600)
  },
  {
    id: 'calorie_crusher_session',
    name: 'Bão Calo Đơn Buổi',
    desc: 'Đốt cháy từ 50 kcal trở lên chỉ trong một buổi tập',
    icon: '💥',
    rarity: 'Hiếm',
    color: 'cyan',
    check: (stats, history) => history.some(h => (h.calories || 0) >= 50)
  },
  {
    id: 'max_challenge',
    name: 'Vô Cực Vượt Ngưỡng',
    desc: 'Chinh phục 1 buổi Thách Thức Vô Cực (Max-Out)',
    icon: '🌌',
    rarity: 'Đặc biệt',
    color: 'cyan',
    check: (stats, history) => history.some(h => h.planName?.includes('Thách Thức') || h.planId === 'max_challenge')
  },
  {
    id: 'multi_set_challenge',
    name: 'Ý Chí Đa Hiệp',
    desc: 'Chinh phục bài Thách Thức Giới Hạn từ 3 hiệp trở lên trong 1 buổi',
    icon: '⚡',
    rarity: 'Sử thi',
    color: 'amber',
    check: (stats, history) => history.some(h => (h.planName?.includes('Thách Thức') || h.planId === 'max_challenge') && (h.completedSets || (Array.isArray(h.setsDetail) ? h.setsDetail.length : 1)) >= 3)
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
    gender: 'male', // 'male' (Nam) hoặc 'female' (Nữ)
    weight: 65, // Cân nặng (kg)
    height: 170, // Chiều cao (cm)
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

/**
 * Tính chỉ số thể trạng BMI và đánh giá tình trạng cơ thể cá nhân hóa theo Giới Tính
 */
export const calculateBMI = (weight = 65, height = 170, gender = 'male') => {
  const w = Number(weight) || 65;
  const h = Number(height) || 170;
  const heightM = h / 100;
  const bmi = Number((w / (heightM * heightM)).toFixed(1));
  const isFemale = gender === 'female';

  let status = 'Cân đối';
  let color = 'emerald';
  let desc = isFemale 
    ? 'Vóc dáng cân đối! Thích hợp để siết eo và tạo rãnh bụng số 11'
    : 'Thể trạng lý tưởng! Sẵn sàng tăng cường sức mạnh cơ bụng 6 múi';

  // Chuẩn nhân trắc học châu Á có phân hóa theo giới tính
  const underweightThreshold = isFemale ? 18.0 : 18.5;
  const normalUpperThreshold = isFemale ? 22.5 : 23.0;
  const overweightThreshold = isFemale ? 24.5 : 25.0;

  if (bmi < underweightThreshold) {
    status = 'Hơi gầy';
    color = 'cyan';
    desc = isFemale
      ? 'Nên tập các bài Plank nhẹ nhàng kết hợp bổ sung dinh dưỡng săn chắc'
      : 'Cần bổ sung protein tăng cơ nạc và tập trung bài Plank sức bền';
  } else if (bmi < normalUpperThreshold) {
    status = 'Cân đối';
    color = 'emerald';
    desc = isFemale
      ? 'Tỷ lệ vàng! Duy trì để tạo cơ bụng số 11 và vòng eo thon gọn'
      : 'Chỉ số lý tưởng! Tăng độ khó để cắt nét khối cơ bụng 6 múi';
  } else if (bmi < overweightThreshold) {
    status = 'Hơi thừa cân';
    color = 'amber';
    desc = isFemale
      ? 'Tập trung các bài Plank liên sườn để siết gọn vòng eo và giảm mỡ bụng'
      : 'Tăng số hiệp Plank ngắt quãng cường độ cao (HIIT Core) để đốt mỡ';
  } else {
    status = 'Cần giảm mỡ';
    color = 'rose';
    desc = isFemale
      ? 'Ưu tiên các bài Plank toàn thân giúp đốt calo và phẳng bụng dưới'
      : 'Tập trung chuỗi Plank đốt mỡ toàn diện kết hợp kiểm soát calo';
  }

  return { bmi, status, color, desc, weight: w, height: h, gender };
};

/**
 * Tính lượng Calo cá nhân hóa theo Cân Nặng & Giới Tính (Chuẩn chuyển hóa MET y khoa thể thao)
 * Nam: MET ~4.4 (tỷ lệ cơ nạc cao hơn) | Nữ: MET ~4.1
 */
export const calculatePersonalizedCalories = (durationSeconds, weightKg = 65, gender = 'male') => {
  const w = Number(weightKg) || 65;
  const met = gender === 'female' ? 4.1 : 4.4;
  // Công thức ACSM: Calo/phút = (MET x 3.5 x Trọng lượng kg) / 200
  const calPerMin = (met * 3.5 * w) / 200;
  return Math.max(1, Math.round(((durationSeconds || 0) / 60) * calPerMin));
};

export const saveUserProfile = (profile) => {
  try {
    localStorage.setItem(STORAGE_KEYS.USER_PROFILE, JSON.stringify(profile));
  } catch (e) {
    console.error("Save profile error:", e);
  }
};

// Lưu và lấy lời khuyên nhận xét mới nhất từ Huấn Luyện Viên AI
export const getLastAICoachAdvice = () => {
  try {
    const data = localStorage.getItem(STORAGE_KEYS.LAST_AI_COACH_ADVICE);
    return data ? JSON.parse(data) : null;
  } catch (e) {
    console.error("Get last AI coach advice error:", e);
    return null;
  }
};

export const saveLastAICoachAdvice = (advice) => {
  try {
    localStorage.setItem(STORAGE_KEYS.LAST_AI_COACH_ADVICE, JSON.stringify(advice));
  } catch (e) {
    console.error("Save last AI coach advice error:", e);
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
  },
  {
    id: 'preset_hybrid_amrap',
    planName: 'Thách Thức Giới Hạn & Phục Hồi (AMRAP)',
    goal: 'Bung 100% công lực ở hiệp đầu đến khi sập cơ, nghỉ tự do hồi phục và củng cố các hiệp sau',
    level: 'Nâng cao',
    type: 'preset',
    isDefault: true,
    createdAt: '2026-09-04T00:00:00.000Z',
    days: [
      {
        day: 1,
        title: 'Bứt Phá Giới Hạn Cá Nhân',
        exercises: [
          { 
            name: 'Plank Tiêu Chuẩn (Hiệp 1 Bung Hết Sức)', 
            holdTime: 0, 
            isMaxEffort: true, 
            restTime: 0, 
            isManualRest: true, 
            tip: 'Gồng hết công lực đến khi sập cơ! Bấm HẾT SỨC khi không giữ nổi nữa.' 
          },
          { 
            name: 'Side Plank Nghiêng Trái', 
            holdTime: 40, 
            isMaxEffort: false, 
            restTime: 20, 
            isManualRest: false, 
            tip: 'Nâng hông cao, siết chặt cơ liên sườn.' 
          },
          { 
            name: 'Side Plank Nghiêng Phải', 
            holdTime: 40, 
            isMaxEffort: false, 
            restTime: 20, 
            isManualRest: false, 
            tip: 'Đẩy hông vững chắc, hít thở đều.' 
          },
          { 
            name: 'Plank Khóa Khớp (Hiệp Cuối Cháy Hết Mình)', 
            holdTime: 0, 
            isMaxEffort: true, 
            restTime: 30, 
            isManualRest: false, 
            tip: 'Hiệp cuối cùng! Dồn toàn bộ sức lực còn lại đến giây cuối cùng!' 
          }
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

/**
 * Tính toán chuỗi ngày tập liên tiếp chuẩn xác (Active Streak & Longest Streak)
 * Không bao giờ bị nhầm lẫn giữa tổng số ngày tập và chuỗi ngày liên tiếp
 */
export const calculateStreakStats = (history) => {
  if (!history || history.length === 0) {
    return { currentStreak: 0, bestStreak: 0, totalDays: 0 };
  }

  // Thu thập danh sách ngày tập duy nhất theo định dạng YYYY-MM-DD
  const dateSet = new Set();
  history.forEach(item => {
    if (!item.date) return;
    const d = new Date(item.date);
    if (isNaN(d.getTime())) return;
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    dateSet.add(key);
  });

  const sortedDates = Array.from(dateSet).sort();
  if (sortedDates.length === 0) {
    return { currentStreak: 0, bestStreak: 0, totalDays: 0 };
  }

  // 1. Tính chuỗi ngày liên tiếp tốt nhất trong lịch sử (bestStreak)
  let bestStreak = 1;
  let currentRun = 1;
  for (let i = 1; i < sortedDates.length; i++) {
    const prevDate = new Date(sortedDates[i - 1]);
    const currDate = new Date(sortedDates[i]);
    const diffDays = Math.round((currDate.getTime() - prevDate.getTime()) / (1000 * 60 * 60 * 24));
    if (diffDays === 1) {
      currentRun += 1;
      if (currentRun > bestStreak) {
        bestStreak = currentRun;
      }
    } else {
      currentRun = 1;
    }
  }

  // 2. Tính chuỗi ngày đang duy trì hiện tại (currentStreak - kết thúc hôm nay hoặc hôm qua)
  const now = new Date();
  const todayKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  const yesterdayKey = `${yesterday.getFullYear()}-${String(yesterday.getMonth() + 1).padStart(2, '0')}-${String(yesterday.getDate()).padStart(2, '0')}`;

  let currentStreak = 0;
  let checkDate = dateSet.has(todayKey) 
    ? new Date(now) 
    : (dateSet.has(yesterdayKey) ? new Date(yesterday) : null);

  if (checkDate) {
    while (true) {
      const k = `${checkDate.getFullYear()}-${String(checkDate.getMonth() + 1).padStart(2, '0')}-${String(checkDate.getDate()).padStart(2, '0')}`;
      if (dateSet.has(k)) {
        currentStreak += 1;
        checkDate.setDate(checkDate.getDate() - 1);
      } else {
        break;
      }
    }
  }

  return {
    currentStreak,
    bestStreak,
    totalDays: sortedDates.length
  };
};

/**
 * Chuẩn hóa danh sách hiệp tập chi tiết của một buổi tập (Backward-compatible fallback)
 * Nếu buổi tập chưa có setsDetail cũ hoặc dữ liệu hiệp bị thiếu, tự động tái tạo bảng hiệp chính xác theo giáo án thực tế
 */
export const getNormalizedSessionSets = (session) => {
  if (!session) return [];
  const count = session.completedSets || session.totalSets || 1;
  const isSingle = count === 1;

  // 1. Nếu đã có setsDetail hợp lệ và đầy đủ số hiệp -> trả về luôn
  if (session.setsDetail && Array.isArray(session.setsDetail) && session.setsDetail.length >= count) {
    return session.setsDetail.slice(0, count);
  }

  // 2. Tra cứu giáo án tương ứng trong tất cả giáo án (cả tự tạo & mặc định) để lấy chính xác thông số siết core và nghỉ chuyển hiệp
  const allPlans = getAllPlans();
  let matchedPlan = allPlans.find(p => 
    (session.planId && p.id === session.planId) || 
    (session.planName && p.planName && p.planName.trim().toLowerCase() === session.planName.trim().toLowerCase())
  );

  let planExercises = [];
  if (matchedPlan) {
    if (Array.isArray(matchedPlan.exercises) && matchedPlan.exercises.length > 0) {
      planExercises = matchedPlan.exercises;
    } else if (Array.isArray(matchedPlan.days) && Array.isArray(matchedPlan.days[0]?.exercises) && matchedPlan.days[0].exercises.length > 0) {
      planExercises = matchedPlan.days[0].exercises;
    }
  }

  // 3. Nếu tìm thấy giáo án, tái tạo chính xác từng hiệp theo thiết lập của giáo án đó
  if (planExercises.length > 0) {
    const sets = [];
    for (let i = 0; i < count; i++) {
      const ex = planExercises[i] || planExercises[i % planExercises.length];
      const isLast = i === count - 1;
      const configuredHold = Number(ex.holdTime);
      const holdTime = (!isNaN(configuredHold) && configuredHold > 0)
        ? configuredHold
        : (session.maxSingleHold || Math.max(15, Math.round((session.duration || 60) / count)));

      const isManualRest = Boolean(ex.isManualRest || ex.restTime === 0);
      const configuredRest = Number(ex.restTime);
      const restTime = isLast 
        ? 0 
        : (isManualRest ? 0 : (!isNaN(configuredRest) ? configuredRest : 20));

      sets.push({
        setNumber: i + 1,
        name: ex.name || `Hiệp ${i + 1}`,
        holdTime: holdTime,
        restTime: restTime
      });
    }
    return sets;
  }

  // 4. Fallback thông minh khi không tìm thấy giáo án gốc
  if (session.planId === 'max_challenge' || session.planName?.includes('Thách Thức')) {
    const avgHold = Math.round((session.duration || 60) / count);
    const sets = [];
    for (let i = 0; i < count; i++) {
      sets.push({
        setNumber: i + 1,
        name: `Thách Thức Hiệp ${i + 1}`,
        holdTime: i === count - 1 && session.maxSingleHold ? session.maxSingleHold : avgHold,
        restTime: i === count - 1 ? 0 : 30
      });
    }
    return sets;
  }

  const avgHold = isSingle 
    ? (session.duration || 60) 
    : (session.maxSingleHold || Math.max(15, Math.round((session.duration || 60) / count)));

  const sets = [];
  for (let i = 0; i < count; i++) {
    sets.push({
      setNumber: i + 1,
      name: isSingle ? (session.planName || "Plank Tiêu Chuẩn") : `Hiệp ${i + 1}`,
      holdTime: avgHold,
      restTime: i === count - 1 ? 0 : 20
    });
  }
  return sets;
};

export const saveHistory = (session) => {
  try {
    const history = getHistory();
    const profile = getUserProfile();
    const calories = calculatePersonalizedCalories(session.duration || 0, profile.weight, profile.gender);
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
      calories: calories,
      weightAtTime: Number(profile.weight) || 65,
      genderAtTime: profile.gender || 'male',
      setsDetail: Array.isArray(session.setsDetail) && session.setsDetail.length > 0 ? session.setsDetail : null
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

export const updateHistoryItem = (id, updatedFields) => {
  try {
    const history = getHistory();
    const index = history.findIndex(item => item.id === id);
    if (index === -1) return null;

    const current = history[index];
    const updated = { ...current, ...updatedFields };

    history[index] = updated;
    localStorage.setItem(STORAGE_KEYS.HISTORY, JSON.stringify(history));

    // Cập nhật lại kỷ lục và danh hiệu nếu có
    recalibrateAndSyncAllData();
    return updated;
  } catch (e) {
    console.error("Update history item error:", e);
    return null;
  }
};

export const getHistoryStats = () => {
  const history = getHistory();
  const totalSeconds = history.reduce((acc, curr) => acc + (curr.duration || 0), 0);
  const totalCalories = history.reduce((acc, curr) => acc + (curr.calories || 0), 0);
  const totalWorkouts = history.length;
  const totalSets = history.reduce((acc, curr) => acc + (curr.completedSets || 1), 0);
  
  const streakStats = calculateStreakStats(history);

  return {
    totalSeconds,
    totalMinutes: Math.round(totalSeconds / 60),
    totalCalories,
    totalWorkouts,
    totalSets,
    streak: streakStats.bestStreak, // Giữ chuỗi tốt nhất cho danh hiệu không bị mất khi lỡ 1 ngày
    currentStreak: streakStats.currentStreak,
    bestStreak: streakStats.bestStreak,
    totalDays: streakStats.totalDays
  };
};

export const getWorkoutHistorySummaryForAI = () => {
  const history = getHistory();
  const stats = getHistoryStats();
  const profile = getUserProfile();

  const recentSessions = history.slice(0, 5).map((h, i) => {
    const dateStr = new Date(h.date).toLocaleDateString('vi-VN', { 
      day: '2-digit', 
      month: '2-digit', 
      hour: '2-digit', 
      minute: '2-digit' 
    });
    const sets = getNormalizedSessionSets(h);
    const setsBreakdown = sets.length > 0
      ? sets.map((s, sIdx) => {
          const isLast = sIdx === sets.length - 1;
          const holdStr = `${s.holdTime || 0}s`;
          const restStr = isLast ? 'Xong buổi tập (Đích)' : (s.restTime > 0 ? `${s.restTime}s` : 'Nghỉ tự do');
          const setName = s.name ? ` (${s.name})` : '';
          return `     + Hiệp ${s.setNumber || sIdx + 1}${setName}: Gồng ${holdStr} | Nghỉ giữa hiệp: ${restStr}`;
        }).join('\n')
      : `     + Giữ tổng ${h.duration || 0}s, ${h.completedSets || 1} hiệp.`;

    return `• Buổi ${i + 1} (${dateStr}) - Bài "${h.planName || 'Plank'}" [Tổng: ${h.duration || 0}s, ${sets.length || h.completedSets || 1} hiệp, ${h.calories || 0} kcal]:\n${setsBreakdown}`;
  });

  const height = profile.height || 170;
  const weight = profile.weight || 65;
  const heightM = height / 100;
  const bmi = (weight / (heightM * heightM)).toFixed(1);

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
    gender: profile.gender || "male",
    height,
    weight,
    bmi,
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
    const profile = getUserProfile();
    const currentWeight = Number(profile.weight) || 68;
    const currentGender = profile.gender || 'male';
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

      // Chuẩn hóa các bản ghi cũ từng mang mốc mặc định ban đầu (65kg) sang cân nặng thật đã thiết lập trong hồ sơ
      if (!item.weightAtTime || item.weightAtTime === 65) {
        item.weightAtTime = currentWeight;
        item.genderAtTime = currentGender;
        item.calories = calculatePersonalizedCalories(item.duration || 0, currentWeight, currentGender);
        historyChanged = true;
      }

      // Đảm bảo mỗi buổi tập luôn có giá trị calo hợp lệ
      if (!item.calories || item.calories <= 0) {
        item.calories = calculatePersonalizedCalories(item.duration || 0, item.weightAtTime || currentWeight, item.genderAtTime || currentGender);
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

      // Sửa lỗi maxSingleHold bị gán bằng tổng duration khi tập Thách Thức Giới Hạn nhiều hiệp
      if ((item.planId === 'max_challenge' || item.planName?.includes('Thách Thức')) && item.completedSets > 1 && item.maxSingleHold === item.duration) {
        item.maxSingleHold = Math.round(item.duration / item.completedSets);
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

      // Chuẩn hóa và bổ sung setsDetail nếu lịch sử chưa có hoặc chưa đủ số hiệp
      if (!item.setsDetail || !Array.isArray(item.setsDetail) || item.setsDetail.length < (item.completedSets || 1)) {
        const normalized = getNormalizedSessionSets(item);
        if (normalized && normalized.length > 0) {
          item.setsDetail = normalized;
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