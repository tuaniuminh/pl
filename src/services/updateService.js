/**
 * Dịch vụ kiểm tra và tải bản cập nhật trực tiếp (In-App OTA Updater)
 * Kết nối GitHub Releases API của repository tuaniuminh/pl
 */
import { registerPlugin } from '@capacitor/core';

export const LiveActivityPlugin = registerPlugin('LiveActivityPlugin');

// Tên Repository GitHub của dự án
const GITHUB_REPO = 'tuaniuminh/pl';

export const compareVersions = (v1, v2) => {
  const clean1 = (v1 || '').replace(/^v/, '').trim().split('.').map(Number);
  const clean2 = (v2 || '').replace(/^v/, '').trim().split('.').map(Number);
  for (let i = 0; i < Math.max(clean1.length, clean2.length); i++) {
    const num1 = clean1[i] || 0;
    const num2 = clean2[i] || 0;
    if (num1 > num2) return 1;
    if (num1 < num2) return -1;
  }
  return 0;
};

export const checkForUpdate = async (currentVersion) => {
  try {
    // Thêm timestamp để chống WebKit cache dữ liệu cũ
    const url = `https://api.github.com/repos/${GITHUB_REPO}/releases/latest?t=${Date.now()}`;
    const res = await fetch(url, {
      headers: { 'Accept': 'application/vnd.github.v3+json' }
    });
    if (!res.ok) {
      if (res.status === 404) {
        return { hasUpdate: false, message: "Chưa có bản phát hành nào trên GitHub Releases." };
      }
      throw new Error(`HTTP ${res.status}`);
    }

    const release = await res.json();
    const latestTag = release.tag_name || '';
    const hasUpdate = compareVersions(latestTag, currentVersion) > 0;
    const ipaAsset = (release.assets || []).find(a => a.name && a.name.endsWith('.ipa'));

    return {
      hasUpdate,
      currentVersion,
      tagName: latestTag,
      releaseName: release.name || latestTag,
      body: release.body || '',
      publishedAt: release.published_at,
      ipaDownloadUrl: ipaAsset?.browser_download_url,
      ipaName: ipaAsset?.name,
      ipaSize: ipaAsset?.size
    };
  } catch (error) {
    return { hasUpdate: false, error: error.message };
  }
};

export const downloadIPAInApp = async (downloadUrl, onProgressCallback) => {
  try {
    if (LiveActivityPlugin && typeof LiveActivityPlugin.downloadAndOpenIPA === 'function') {
      let listener = null;
      if (onProgressCallback) {
        try {
          listener = await LiveActivityPlugin.addListener('ipaDownloadProgress', (data) => {
            onProgressCallback(data);
          });
        } catch (listenerErr) {
          console.warn("Could not attach progress listener:", listenerErr);
        }
      }
      try {
        const result = await LiveActivityPlugin.downloadAndOpenIPA({ url: downloadUrl });
        return result;
      } finally {
        if (listener && typeof listener.remove === 'function') {
          listener.remove();
        }
      }
    }
  } catch (e) {
    console.warn("Native plugin download failed, opening browser fallback:", e);
    // Nếu Native Plugin chưa được hỗ trợ (chạy trên Web hoặc bản cũ chưa có native pod), mở Safari để tải trực tiếp
    window.open(downloadUrl, '_blank');
    return { success: true, fallback: true };
  }

  // Fallback mở Safari tải trực tiếp
  window.open(downloadUrl, '_blank');
  return { success: true, fallback: true };
};

export const cancelDownloadIPA = async () => {
  try {
    if (LiveActivityPlugin && typeof LiveActivityPlugin.cancelDownload === 'function') {
      await LiveActivityPlugin.cancelDownload();
    }
  } catch (e) {
    console.warn("Error calling cancelDownload on native plugin:", e);
  }
};
