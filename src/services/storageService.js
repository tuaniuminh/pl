/**
 * Dịch vụ lưu trữ LocalStorage & Xuất dữ liệu CSV
 */

const STORAGE_KEYS = {
  SETTINGS: 'plank_settings_v2',
  HISTORY: 'plank_history_v2',
  ACTIVE_PLAN: 'plank_active_plan_v2',
  SAVED_PLANS: 'plank_saved_plans_v2',
  USER_PROFILE: 'plank_user_profile_v2'
};

// Cài đặt chung
export const getSettings = () => {
  const defaultSettings = {
    apiKey: '',
    theme: 'dark', // Mặc định Dark Mode OLED
    voiceEnabled: true,
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

// Hồ sơ người dùng
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

// Kế hoạch đang tập
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

// Danh sách các giáo án đã tạo
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

// Lịch sử tập luyện
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
    const calories = Math.round((session.duration / 60) * 4.5); // Ước tính 4.5 kcal / phút plank
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

// Thống kê tổng hợp
export const getHistoryStats = () => {
  const history = getHistory();
  const totalSeconds = history.reduce((acc, curr) => acc + (curr.duration || 0), 0);
  const totalCalories = history.reduce((acc, curr) => acc + (curr.calories || 0), 0);
  const totalWorkouts = history.length;
  
  // Tính chuỗi ngày (Streak)
  let streak = 0;
  if (history.length > 0) {
    const dates = [...new Set(history.map(h => new Date(h.date).toDateString()))];
    streak = dates.length; // Đếm số ngày tập độc lập
  }

  return {
    totalSeconds,
    totalMinutes: Math.round(totalSeconds / 60),
    totalCalories,
    totalWorkouts,
    streak
  };
};

// Xuất file CSV chuẩn định dạng
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

  // UTF-8 BOM \uFEFF giúp Excel hiển thị đúng tiếng Việt có dấu
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