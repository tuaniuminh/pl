/**
 * Tiện ích Rung Phản Hồi Xúc Giác (Haptic Feedback) chuyên sâu cho iOS & Web.
 * Sử dụng Apple Taptic Engine qua @capacitor/haptics và HTML5 Vibration API.
 */

let CapacitorHaptics = null;

// Khởi tạo và nạp động Capacitor Haptics nếu có
const initHaptics = async () => {
  if (typeof window !== 'undefined') {
    try {
      const module = await import('@capacitor/haptics');
      CapacitorHaptics = module.Haptics;
    } catch (e) {
      // Chạy trên môi trường Web / chưa nạp plugin
      CapacitorHaptics = null;
    }
  }
};

initHaptics();

// 1. Rung nhẹ khi chạm nút bấm (Button Tap / Navigation Tab / Presets)
export const triggerHapticLight = async () => {
  try {
    if (CapacitorHaptics) {
      await CapacitorHaptics.impact({ style: 'LIGHT' });
    } else if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      navigator.vibrate(10);
    }
  } catch (e) {
    // Bỏ qua nếu thiết bị không hỗ trợ rung
  }
};

// 2. Rung vừa (Play / Pause / Switch Set)
export const triggerHapticMedium = async () => {
  try {
    if (CapacitorHaptics) {
      await CapacitorHaptics.impact({ style: 'MEDIUM' });
    } else if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      navigator.vibrate(25);
    }
  } catch (e) {
    // Ignore
  }
};

// 3. Rung mạnh (Hoàn thành bài tập / Đổi hiệp / Cột mốc)
export const triggerHapticHeavy = async () => {
  try {
    if (CapacitorHaptics) {
      await CapacitorHaptics.impact({ style: 'HEAVY' });
    } else if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      navigator.vibrate([30, 40, 30]);
    }
  } catch (e) {
    // Ignore
  }
};

// 4. Rung thành công (Mở khóa Huy Hiệu / Lưu Kỷ Lục Mới)
export const triggerHapticSuccess = async () => {
  try {
    if (CapacitorHaptics) {
      await CapacitorHaptics.notification({ type: 'SUCCESS' });
    } else if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      navigator.vibrate([15, 30, 15, 30, 40]);
    }
  } catch (e) {
    // Ignore
  }
};

// 5. Rung cảnh báo / Lỗi
export const triggerHapticWarning = async () => {
  try {
    if (CapacitorHaptics) {
      await CapacitorHaptics.notification({ type: 'WARNING' });
    } else if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      navigator.vibrate([40, 60, 40]);
    }
  } catch (e) {
    // Ignore
  }
};

// 6. Rung nhịp đếm ngược (3 - 2 - 1)
export const triggerHapticCount = async () => {
  try {
    if (CapacitorHaptics) {
      await CapacitorHaptics.impact({ style: 'LIGHT' });
    } else if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      navigator.vibrate(15);
    }
  } catch (e) {
    // Ignore
  }
};

// 7. Rung nhịp tim đập kép (Lub-Dub Heartbeat)
export const triggerHapticHeartbeat = async () => {
  try {
    if (CapacitorHaptics) {
      await CapacitorHaptics.impact({ style: 'HEAVY' });
      setTimeout(async () => {
        try {
          if (CapacitorHaptics) await CapacitorHaptics.impact({ style: 'MEDIUM' });
        } catch (e) {}
      }, 120);
    } else if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      navigator.vibrate([25, 40, 20]);
    }
  } catch (e) {
    // Ignore
  }
};

// ==================== TỰ ĐỘNG GẮN PHẢN HỒI RUNG CHO TẤT CẢ NÚT BẤM ====================
export const attachGlobalButtonHaptics = () => {
  if (typeof window === 'undefined') return;

  const handleGlobalClick = (event) => {
    // Kiểm tra xem phần tử được chạm vào có phải là button hoặc thẻ interactive không
    const target = event.target;
    if (!target) return;

    const button = target.closest('button, [role="button"], a, input[type="range"], input[type="checkbox"]');
    if (button) {
      triggerHapticLight();
    }
  };

  window.addEventListener('click', handleGlobalClick, { capture: true, passive: true });
};
