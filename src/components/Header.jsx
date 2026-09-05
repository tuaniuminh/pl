import React, { useState, useEffect, useRef } from 'react';
import { Moon, Sun, Volume2, VolumeX, Flame, RefreshCw, Check, ArrowUpCircle, AlertCircle } from 'lucide-react';
import packageJson from '../../package.json';
import { checkForUpdate } from '../services/updateService';
import { triggerHapticSuccess, triggerHapticMedium, triggerHapticWarning } from '../utils/hapticsUtils';
import UpdateModal from './UpdateModal';

const Header = ({ settings, onToggleTheme, onToggleVoice, activePlan }) => {
  const isDark = settings.theme === 'dark';

  // Trạng thái kiểm tra cập nhật từ huy hiệu phiên bản
  // 'idle' | 'checking' | 'latest' | 'has_update' | 'error'
  const [updateStatus, setUpdateStatus] = useState('idle');
  const [updateInfo, setUpdateInfo] = useState(null);
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const autoCheckedRef = useRef(false);
  const latestTimerRef = useRef(null);
  const errorTimerRef = useRef(null);

  // Tự động kiểm tra ngầm khi mở app (sau 1.2s để không cản trở render chính)
  useEffect(() => {
    if (autoCheckedRef.current) return;
    autoCheckedRef.current = true;

    const timer = setTimeout(async () => {
      try {
        const res = await checkForUpdate(packageJson.version);
        if (res && res.hasUpdate) {
          setUpdateInfo(res);
          setUpdateStatus('has_update');
        }
      } catch (err) {
        // Tự động kiểm tra ngầm thất bại thì giữ nguyên idle
      }
    }, 1200);

    return () => {
      clearTimeout(timer);
      if (latestTimerRef.current) clearTimeout(latestTimerRef.current);
      if (errorTimerRef.current) clearTimeout(errorTimerRef.current);
    };
  }, []);

  const handleBadgeClick = async () => {
    // 1. Nếu đã phát hiện có bản cập nhật mới -> Bấm vào để mở bảng cập nhật
    if (updateStatus === 'has_update') {
      triggerHapticMedium();
      setShowUpdateModal(true);
      return;
    }

    // 2. Nếu đang trong tiến trình kiểm tra hoặc đang hiện thông báo mới nhất -> Bỏ qua
    if (updateStatus === 'checking' || updateStatus === 'latest') {
      return;
    }

    // 3. Tiến hành kiểm tra phiên bản mới theo yêu cầu người dùng
    triggerHapticMedium();
    setUpdateStatus('checking');

    try {
      // Đảm bảo hiệu ứng xoay kiểm tra hiển thị mượt mà ít nhất 700ms
      const [res] = await Promise.all([
        checkForUpdate(packageJson.version),
        new Promise(resolve => setTimeout(resolve, 700))
      ]);

      if (res && res.hasUpdate) {
        setUpdateInfo(res);
        setUpdateStatus('has_update');
        setShowUpdateModal(true);
        triggerHapticSuccess();
      } else if (res && res.error) {
        setUpdateStatus('error');
        triggerHapticWarning();
        if (errorTimerRef.current) clearTimeout(errorTimerRef.current);
        errorTimerRef.current = setTimeout(() => {
          setUpdateStatus('idle');
        }, 2500);
      } else {
        // Đã là bản mới nhất: Hiển thị hiệu ứng trực tiếp trên huy hiệu thay vì hiện toast
        setUpdateStatus('latest');
        triggerHapticSuccess();
        if (latestTimerRef.current) clearTimeout(latestTimerRef.current);
        latestTimerRef.current = setTimeout(() => {
          setUpdateStatus(prev => prev === 'latest' ? 'idle' : prev);
        }, 2500);
      }
    } catch (err) {
      setUpdateStatus('error');
      triggerHapticWarning();
      if (errorTimerRef.current) clearTimeout(errorTimerRef.current);
      errorTimerRef.current = setTimeout(() => {
        setUpdateStatus('idle');
      }, 2500);
    }
  };

  return (
    <>
      <header className="w-full safe-top-padding px-5 pb-3 pt-2 bg-white/95 dark:bg-oled/95 backdrop-blur-xl border-b border-slate-200 dark:border-white/5 z-30 transition-colors duration-300">
        <div className="flex items-center justify-between">
          {/* Logo & Title */}
          <div className="flex items-center space-x-2.5">
            <div className="w-9 h-9 rounded-2xl bg-gradient-to-tr from-emerald-500 via-neon to-cyan-500 p-0.5 shadow-sm dark:shadow-neon">
              <div className="w-full h-full bg-white dark:bg-oled rounded-[14px] flex items-center justify-center">
                <Flame className="w-5 h-5 text-emerald-600 dark:text-neon animate-pulse" />
              </div>
            </div>
            <div>
              <div className="flex items-center space-x-1.5">
                <h1 className="font-extrabold text-lg tracking-tight bg-gradient-to-r from-slate-900 to-slate-700 dark:from-white dark:to-gray-300 bg-clip-text text-transparent">
                  PLANK AI
                </h1>

                {/* Huy Hiệu Phiên Bản Thông Minh (Interactive Version Badge) */}
                {updateStatus === 'has_update' ? (
                  <button
                    type="button"
                    onClick={handleBadgeClick}
                    className="relative inline-flex items-center space-x-1 text-[10px] font-black px-2 py-0.5 rounded-full bg-gradient-to-r from-amber-400 via-orange-400 to-rose-500 text-slate-950 border border-amber-300 shadow-md shadow-orange-500/25 animate-pulse hover:scale-105 active:scale-95 transition-all cursor-pointer"
                    title={`Có bản cập nhật mới: ${updateInfo?.tagName || ''}! Bấm để xem chi tiết & cập nhật`}
                  >
                    <span className="relative flex h-2 w-2 shrink-0">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-600"></span>
                    </span>
                    <span>v{packageJson.version}</span>
                    <ArrowUpCircle size={11} strokeWidth={2.5} className="text-slate-950 shrink-0 animate-bounce" />
                  </button>
                ) : updateStatus === 'checking' ? (
                  <button
                    type="button"
                    disabled
                    className="inline-flex items-center space-x-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-cyan-100 text-cyan-900 dark:bg-cyan-950/80 dark:text-cyan-300 border border-cyan-400/60 dark:border-cyan-500/40 shadow-sm animate-pulse cursor-wait"
                  >
                    <RefreshCw size={10} className="animate-spin text-cyan-600 dark:text-cyan-neon shrink-0" />
                    <span>v{packageJson.version}</span>
                    <span className="text-[9px] font-medium opacity-85">Kiểm tra...</span>
                  </button>
                ) : updateStatus === 'latest' ? (
                  <button
                    type="button"
                    disabled
                    className="inline-flex items-center space-x-1 text-[10px] font-black px-2 py-0.5 rounded-full bg-emerald-500 text-white dark:bg-neon dark:text-slate-950 border border-emerald-400 dark:border-neon shadow-md shadow-emerald-500/30 animate-bounce cursor-default"
                  >
                    <Check size={11} strokeWidth={3} className="shrink-0" />
                    <span>Bản mới nhất</span>
                  </button>
                ) : updateStatus === 'error' ? (
                  <button
                    type="button"
                    onClick={handleBadgeClick}
                    className="inline-flex items-center space-x-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300 border border-amber-300/60 dark:border-amber-500/40 cursor-pointer active:scale-95"
                    title="Không thể kiểm tra kết nối. Bấm để thử lại"
                  >
                    <span>v{packageJson.version}</span>
                    <AlertCircle size={10} className="text-amber-500 shrink-0" />
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={handleBadgeClick}
                    className="inline-flex items-center space-x-1 text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-emerald-100 text-emerald-700 dark:bg-neon/10 dark:text-neon border border-emerald-300/40 dark:border-neon/20 shadow-sm hover:scale-105 active:scale-95 transition-all cursor-pointer"
                    title="Bấm để kiểm tra bản cập nhật mới"
                  >
                    <span>v{packageJson.version}</span>
                  </button>
                )}
              </div>
              <div className="flex items-center space-x-1.5 text-[11px] text-slate-500 dark:text-gray-400">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 dark:bg-neon animate-ping" />
                <span>{activePlan ? `Giáo án: ${activePlan.planName?.slice(0, 18)}...` : 'Gemini 3.7 Flash Active'}</span>
              </div>
            </div>
          </div>

          {/* Action Controls */}
          <div className="flex items-center space-x-2">
            {/* Quick Voice Toggle */}
            <button
              onClick={onToggleVoice}
              className={`w-9 h-9 rounded-xl flex items-center justify-center border transition-all ${
                settings.voiceEnabled 
                  ? 'bg-emerald-50 border-emerald-300 text-emerald-600 dark:bg-neon/10 dark:border-neon/30 dark:text-neon shadow-sm' 
                  : 'bg-slate-100 border-slate-200 text-slate-400 dark:bg-white/5 dark:border-white/10 dark:text-gray-400'
              }`}
              title={settings.voiceEnabled ? "Tắt giọng nói" : "Bật giọng nói"}
            >
              {settings.voiceEnabled ? <Volume2 size={16} /> : <VolumeX size={16} />}
            </button>

            {/* Quick Theme Toggle */}
            <button
              onClick={onToggleTheme}
              className="w-9 h-9 rounded-xl flex items-center justify-center bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-slate-700 dark:text-gray-300 transition-all active:scale-95 hover:bg-slate-200 dark:hover:bg-white/10"
              title="Đổi giao diện Sáng / Tối OLED"
            >
              {isDark ? <Sun size={16} className="text-amber-400" /> : <Moon size={16} className="text-indigo-600" />}
            </button>
          </div>
        </div>
      </header>

      {/* Modal Cập Nhật Bản Mới (Hiển Thị Khi Có Bản Phát Hành Mới) */}
      <UpdateModal
        isOpen={showUpdateModal}
        onClose={() => setShowUpdateModal(false)}
        updateInfo={updateInfo}
        currentVersion={packageJson.version}
      />
    </>
  );
};

export default Header;
