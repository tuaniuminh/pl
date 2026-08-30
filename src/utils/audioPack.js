/**
 * Hệ thống Phát Âm Thanh Huấn Luyện Viên Thể Hình Studio AI (Audio Pack)
 * Tự động tải trước (Preload) vào bộ nhớ để phát tức thì 0ms, hoạt động offline 100%.
 */

import { getSettings } from '../services/storageService';
import { speakText } from './speechUtils';

const AUDIO_CLIPS = {
  start_workout: '/audio/start_workout.mp3',
  start_challenge: '/audio/start_challenge.mp3',
  count_5: '/audio/count_5.mp3',
  count_4: '/audio/count_4.mp3',
  count_3: '/audio/count_3.mp3',
  count_2: '/audio/count_2.mp3',
  count_1: '/audio/count_1.mp3',
  rest_start: '/audio/rest_start.mp3',
  prepare_next: '/audio/prepare_next.mp3',
  workout_complete: '/audio/workout_complete.mp3',
  badge_unlocked: '/audio/badge_unlocked.mp3',
  milestone_30s: '/audio/milestone_30s.mp3',
  milestone_60s: '/audio/milestone_60s.mp3',
  milestone_90s: '/audio/milestone_90s.mp3',
  milestone_120s: '/audio/milestone_120s.mp3',
  milestone_180s: '/audio/milestone_180s.mp3',
  milestone_240s: '/audio/milestone_240s.mp3',
  milestone_300s: '/audio/milestone_300s.mp3'
};

const audioCache = {};
let currentPlayingAudio = null;

// Tải trước toàn bộ âm thanh vào RAM
export const preloadAudioPack = () => {
  if (typeof window === 'undefined') return;

  Object.entries(AUDIO_CLIPS).forEach(([key, src]) => {
    try {
      const audio = new Audio();
      audio.preload = 'auto';
      audio.src = src;
      audioCache[key] = audio;
    } catch (e) {
      console.warn(`Could not preload audio: ${key}`, e);
    }
  });
};

// Khởi tạo preload ngay khi module được nạp
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
 * Phát câu lệnh giọng đọc Studio AI chất lượng cao
 * @param {string} clipKey - Tên mã câu lệnh trong AUDIO_CLIPS
 * @param {string} [fallbackText] - Văn bản dự phòng nếu không có file âm thanh
 * @param {object} [options] - Tuỳ chọn { enabled, volume }
 */
export const playVoiceClip = (clipKey, fallbackText = '', options = {}) => {
  try {
    const settings = getSettings();
    if (options.enabled === false || (options.enabled === undefined && settings.voiceEnabled === false)) {
      stopAllVoice();
      return;
    }

    stopAllVoice();

    let audio = audioCache[clipKey];
    if (!audio && AUDIO_CLIPS[clipKey]) {
      audio = new Audio(AUDIO_CLIPS[clipKey]);
      audioCache[clipKey] = audio;
    }

    if (audio) {
      audio.currentTime = 0;
      audio.volume = options.volume !== undefined ? options.volume : (settings.soundVolume || 1.0);
      currentPlayingAudio = audio;

      const playPromise = audio.play();
      if (playPromise !== undefined) {
        playPromise.catch((err) => {
          console.warn(`Audio play failed for ${clipKey}, falling back to speech synthesis:`, err);
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
