/**
 * Hệ thống Phát Âm Thanh Huấn Luyện Viên Thể Hình Studio AI Đa Giọng Đọc (Audio Pack)
 * Hỗ trợ chọn Giọng Nữ (Hoài My) & Giọng Nam (Nam Minh), phát tức thì 0ms, offline 100%.
 */

import { getSettings } from '../services/storageService';
import { speakText } from './speechUtils';

const CLIP_NAMES = [
  'start_workout',
  'resume_workout',
  'start_challenge',
  'count_5',
  'count_4',
  'count_3',
  'count_2',
  'count_1',
  'rest_start',
  'prepare_next',
  'workout_complete',
  'badge_unlocked',
  'milestone_30s',
  'milestone_60s',
  'milestone_90s',
  'milestone_120s',
  'milestone_180s',
  'milestone_240s',
  'milestone_300s'
];

const audioCache = {
  female: {},
  male: {}
};

let currentPlayingAudio = null;

// Tải trước toàn bộ âm thanh của cả 2 giọng vào RAM
export const preloadAudioPack = () => {
  if (typeof window === 'undefined') return;

  ['female', 'male'].forEach((voice) => {
    CLIP_NAMES.forEach((clipName) => {
      try {
        const audio = new Audio();
        audio.preload = 'auto';
        audio.src = `/audio/${voice}/${clipName}.mp3`;
        audioCache[voice][clipName] = audio;
      } catch (e) {
        console.warn(`Could not preload audio ${voice}/${clipName}:`, e);
      }
    });
  });
};

// Khởi tạo preload ngay khi app chạy
preloadAudioPack();

// Dừng toàn bộ âm thanh đang phát
export const stopAllVoice = () => {
  if (currentPlayingAudio) {
    try {
      currentPlayingAudio.pause();
      currentPlayingAudio.currentTime = 0;
      currentPlayingAudio = null;
    } catch (e) {
      // Ignore
    }
  }

  if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
    window.speechSynthesis.cancel();
  }
};

/**
 * Nghe thử giọng đọc trong cài đặt
 * @param {'female' | 'male'} voiceKey
 */
export const previewVoice = (voiceKey = 'female') => {
  stopAllVoice();
  try {
    const audio = audioCache[voiceKey]?.['start_workout'] || new Audio(`/audio/${voiceKey}/start_workout.mp3`);
    audio.currentTime = 0;
    audio.volume = 1.0;
    currentPlayingAudio = audio;
    audio.play().catch(e => console.warn('Preview voice error:', e));
  } catch (err) {
    console.error('Preview error:', err);
  }
};

/**
 * Phát câu lệnh giọng đọc Studio AI chất lượng cao theo giọng người dùng đã chọn
 * @param {string} clipKey - Tên mã câu lệnh
 * @param {string} [fallbackText] - Văn bản dự phòng
 * @param {object} [options] - Tuỳ chọn { enabled, volume, voice }
 */
export const playVoiceClip = (clipKey, fallbackText = '', options = {}) => {
  try {
    const settings = getSettings();
    if (options.enabled === false || (options.enabled === undefined && settings.voiceEnabled === false)) {
      stopAllVoice();
      return;
    }

    stopAllVoice();

    const selectedVoice = options.voice || settings.selectedVoice || 'female';
    let audio = audioCache[selectedVoice]?.[clipKey];

    if (!audio) {
      audio = new Audio(`/audio/${selectedVoice}/${clipKey}.mp3`);
      if (!audioCache[selectedVoice]) audioCache[selectedVoice] = {};
      audioCache[selectedVoice][clipKey] = audio;
    }

    if (audio) {
      audio.currentTime = 0;
      audio.volume = options.volume !== undefined ? options.volume : (settings.soundVolume || 1.0);
      currentPlayingAudio = audio;

      const playPromise = audio.play();
      if (playPromise !== undefined) {
        playPromise.catch((err) => {
          console.warn(`Audio play failed for ${selectedVoice}/${clipKey}, falling back to TTS:`, err);
          if (fallbackText) {
            speakText(fallbackText, options);
          }
        });
      }
    } else if (fallbackText) {
      speakText(fallbackText, options);
    }
  } catch (err) {
    console.error(`Error playing voice clip ${clipKey}:`, err);
    if (fallbackText) {
      speakText(fallbackText, options);
    }
  }
};
