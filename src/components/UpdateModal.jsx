import React, { useState, useRef } from 'react';
import { createPortal } from 'react-dom';
import { 
  Download, 
  Sparkles, 
  CheckCircle2, 
  AlertCircle, 
  ExternalLink, 
  X, 
  Calendar,
  Layers
} from 'lucide-react';
import { downloadIPAInApp, cancelDownloadIPA } from '../services/updateService';

const UpdateModal = ({ isOpen, onClose, updateInfo, currentVersion }) => {
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState(null);
  const [downloadError, setDownloadError] = useState(null);
  const [downloadFinished, setDownloadFinished] = useState(false);
  const downloadCanceledRef = useRef(false);

  if (!isOpen || !updateInfo) return null;

  const handleStartDownload = async () => {
    if (!updateInfo.ipaDownloadUrl) {
      window.open(`https://github.com/tuaniuminh/pl/releases/tag/${updateInfo.tagName || ''}`, '_blank');
      return;
    }

    downloadCanceledRef.current = false;
    setIsDownloading(true);
    setDownloadError(null);
    setDownloadFinished(false);
    setDownloadProgress({
      progress: 0,
      downloadedMB: '0.0',
      totalMB: updateInfo.ipaSize ? (updateInfo.ipaSize / (1024 * 1024)).toFixed(1) : '...',
      speed: '0 KB/s'
    });

    try {
      const res = await downloadIPAInApp(updateInfo.ipaDownloadUrl, (data) => {
        if (downloadCanceledRef.current) return;
        setDownloadProgress(data);
      });
      if (res && res.success && !downloadCanceledRef.current) {
        setDownloadFinished(true);
      }
    } catch (err) {
      if (!downloadCanceledRef.current) {
        setDownloadError(err.message || "Lỗi tải file IPA. Vui lòng thử lại.");
      }
    } finally {
      if (!downloadCanceledRef.current) {
        setIsDownloading(false);
      }
    }
  };

  const handleCancel = async () => {
    downloadCanceledRef.current = true;
    setIsDownloading(false);
    setDownloadProgress(null);
    setDownloadFinished(false);
    setDownloadError(null);
    await cancelDownloadIPA();
  };

  const handleClose = () => {
    if (isDownloading) {
      handleCancel();
    }
    onClose();
  };

  const formattedDate = updateInfo.publishedAt 
    ? new Date(updateInfo.publishedAt).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' })
    : null;

  const sizeMB = updateInfo.ipaSize 
    ? `~${(updateInfo.ipaSize / (1024 * 1024)).toFixed(1)} MB` 
    : null;

  return createPortal(
    <div className="fixed inset-0 z-[999] bg-black/80 backdrop-blur-md flex items-center justify-center p-4 pt-12 pb-16 overflow-hidden animate-fade-in">
      <div className="glass-panel max-w-md w-full p-5 sm:p-6 rounded-3xl border border-cyan-500/30 shadow-2xl bg-white/95 dark:bg-slate-900/95 space-y-4 max-h-[85vh] flex flex-col">
        {/* Header */}
        <div className="flex items-start justify-between shrink-0">
          <div className="flex items-center space-x-3 min-w-0">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-cyan-500 to-emerald-500 text-slate-950 flex items-center justify-center shrink-0 shadow-lg shadow-cyan-500/20">
              <Sparkles size={24} />
            </div>
            <div className="min-w-0">
              <div className="flex items-center space-x-2">
                <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-cyan-100 text-cyan-800 dark:bg-cyan-950/80 dark:text-cyan-300 border border-cyan-400/50 dark:border-cyan-500/40">
                  Phiên Bản Mới
                </span>
                {sizeMB && (
                  <span className="text-[10px] font-mono text-slate-400 dark:text-gray-400">
                    {sizeMB}
                  </span>
                )}
              </div>
              <h3 className="text-lg font-black text-slate-900 dark:text-white mt-0.5 truncate flex items-center space-x-2">
                <span>{updateInfo.tagName || "Bản phát hành mới"}</span>
                <span className="text-xs font-normal text-slate-400 dark:text-gray-400">
                  (hiện tại: v{currentVersion})
                </span>
              </h3>
              {formattedDate && (
                <p className="text-[11px] text-slate-500 dark:text-gray-400 flex items-center space-x-1 mt-0.5">
                  <Calendar size={11} />
                  <span>Phát hành: {formattedDate}</span>
                </p>
              )}
            </div>
          </div>

          <button
            onClick={handleClose}
            className="w-8 h-8 rounded-full bg-slate-100 dark:bg-white/10 hover:bg-slate-200 dark:hover:bg-white/20 text-slate-600 dark:text-gray-300 flex items-center justify-center active:scale-90 transition-all shrink-0 ml-2"
            title="Đóng"
          >
            <X size={16} />
          </button>
        </div>

        {/* Release Body / Changelog Section */}
        <div className="flex-1 min-h-0 flex flex-col space-y-2">
          <div className="flex items-center justify-between shrink-0 px-1">
            <h4 className="text-xs font-black uppercase tracking-wider text-slate-800 dark:text-gray-200 flex items-center space-x-1.5">
              <Layers size={13} className="text-cyan-500" />
              <span>{updateInfo.releaseName || "Nội dung cập nhật"}</span>
            </h4>
          </div>

          <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain p-3.5 rounded-2xl bg-slate-50/70 dark:bg-black/30 border border-slate-200 dark:border-white/10 text-xs text-slate-700 dark:text-gray-300 whitespace-pre-line leading-relaxed shadow-inner font-sans">
            {updateInfo.body ? updateInfo.body : "Bản cập nhật chứa các cải tiến hiệu năng và sửa lỗi."}
          </div>
        </div>

        {/* Download Progress Status (If Active) */}
        {(isDownloading || downloadProgress || downloadFinished || downloadError) && (
          <div className="p-3.5 rounded-2xl bg-slate-100 dark:bg-white/5 border border-slate-200/80 dark:border-white/10 space-y-2.5 shrink-0 animate-fade-in">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-slate-900 dark:text-white flex items-center space-x-1.5">
                {downloadFinished ? (
                  <CheckCircle2 size={15} className="text-emerald-500" />
                ) : isDownloading ? (
                  <Download size={15} className="text-cyan-500 animate-bounce" />
                ) : (
                  <AlertCircle size={15} className="text-red-500" />
                )}
                <span>
                  {downloadFinished 
                    ? "Tải file hoàn tất!" 
                    : downloadError 
                    ? downloadError 
                    : `Đang tải: ${downloadProgress?.downloadedMB || '0.0'} MB / ${downloadProgress?.totalMB || '...'} MB`}
                </span>
              </span>
              {!downloadError && !downloadFinished && (
                <span className="text-[11px] font-mono text-cyan-600 dark:text-cyan-neon font-bold">
                  {downloadProgress?.speed || '0 KB/s'}
                </span>
              )}
            </div>

            {!downloadError && !downloadFinished && (
              <div className="w-full h-2.5 bg-slate-200 dark:bg-white/10 rounded-full overflow-hidden p-0.5">
                <div 
                  className="h-full bg-gradient-to-r from-cyan-500 to-emerald-500 rounded-full transition-all duration-300"
                  style={{ width: `${Math.min(100, Math.round((downloadProgress?.progress || 0) * 100))}%` }}
                />
              </div>
            )}

            {downloadFinished && (
              <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">
                Bảng chia sẻ iOS đang mở. Chọn TrollStore để hoàn tất cài đặt.
              </p>
            )}
          </div>
        )}

        {/* Modal Actions */}
        <div className="pt-1 shrink-0 space-y-2">
          {!isDownloading && !downloadFinished && (
            <button
              onClick={handleStartDownload}
              className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-cyan-500 via-teal-500 to-emerald-500 hover:from-cyan-400 hover:to-emerald-400 text-slate-950 font-black text-xs uppercase tracking-wider shadow-lg shadow-cyan-500/20 active:scale-95 transition-all flex items-center justify-center space-x-2"
            >
              <Download size={16} />
              <span>Tải & Cài Đặt Ngay (TrollStore)</span>
            </button>
          )}

          {isDownloading && (
            <button
              onClick={handleCancel}
              className="w-full py-3 rounded-2xl bg-slate-200 hover:bg-slate-300 dark:bg-white/10 dark:hover:bg-white/20 text-slate-700 dark:text-gray-300 font-bold text-xs active:scale-95 transition-all"
            >
              Hủy Tải Xuống
            </button>
          )}

          {downloadError && updateInfo.ipaDownloadUrl && (
            <div className="flex space-x-2">
              <button
                onClick={handleStartDownload}
                className="flex-1 py-3 rounded-2xl bg-cyan-500 text-slate-950 font-black text-xs active:scale-95 transition-all"
              >
                Thử Lại
              </button>
              <a
                href={updateInfo.ipaDownloadUrl}
                target="_blank"
                rel="noreferrer"
                className="flex-1 py-3 rounded-2xl bg-slate-200 dark:bg-white/10 text-slate-800 dark:text-white font-bold text-xs flex items-center justify-center space-x-1 active:scale-95 transition-all"
              >
                <span>Mở Safari Tải</span>
                <ExternalLink size={12} />
              </a>
            </div>
          )}

          {downloadFinished && (
            <button
              onClick={handleClose}
              className="w-full py-3 rounded-2xl bg-emerald-500 text-slate-950 font-black text-xs uppercase tracking-wider active:scale-95 transition-all"
            >
              Đóng
            </button>
          )}

          {!isDownloading && !downloadFinished && (
            <button
              onClick={handleClose}
              className="w-full py-2.5 rounded-2xl text-slate-500 dark:text-gray-400 hover:text-slate-700 dark:hover:text-white font-semibold text-xs transition-colors"
            >
              Để sau
            </button>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
};

export default UpdateModal;
