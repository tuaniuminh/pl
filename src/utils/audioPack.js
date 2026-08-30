/**
 * Hệ thống Phát Âm Thanh Huấn Luyện Viên Thể Hình Studio AI Đa Phong Cách (Audio Pack)
 * Hỗ trợ 6 phong cách HLV: Hoài My, Nam Minh, Quân Đội, Yoga Zen, Cyberpunk AI, English Pro.
 * Phát tức thì 0ms, hoạt động offline 100%.
 */

import { getSettings } from '../services/storageService';
import { speakText } from './speechUtils';

export const VOICE_PERSONAS = [
  {
    id: 'female',
    name: 'Hoài My (Nữ PT)',
    emoji: '👩',
    tag: 'Truyền Cảm',
    desc: 'Trong trẻo, nhẹ nhàng, tự nhiên và thư thái',
    color: 'emerald'
  },
  {
    id: 'male',
    name: 'Nam Minh (Nam PT)',
    emoji: '👨',
    tag: 'Mạnh Mẽ',
    desc: 'Trầm ấm, dứt khoát, phong thái HLV thể hình chuẩn',
    color: 'cyan'
  },
  {
    id: 'military',
    name: 'HLV Quân Đội',
    emoji: '🥊',
    tag: 'Kỷ Luật Thép',
    desc: 'Hùng hồn, đanh thép, thúc ép gồng Core bứt phá',
    color: 'amber'
  },
  {
    id: 'zen',
    name: 'HLV Yoga & Zen',
    emoji: '🧘',
    tag: 'Tĩnh Tại',
    desc: 'Êm dịu, dẫn dắt nhịp thở sâu và lắng nghe cơ thể',
    color: 'purple'
  },
  {
    id: 'cyber',
    name: 'Cyberpunk AI',
    emoji: '🤖',
    tag: 'Công Nghệ',
    desc: 'Trợ lý AI tương lai, âm hưởng Sci-Fi hiện đại',
    color: 'cyan'
  },
  {
    id: 'english',
    name: 'English Pro Coach',
    emoji: '🇺🇸',
    tag: 'Quốc Tế',
    desc: 'Phong cách phòng tập quốc tế (Nike / Peloton)',
    color: 'emerald'
  }
];

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

const audioCache = {};
let currentPlayingAudio = null;

// Tải trước các file âm thanh của persona đang chọn vào RAM
export const preloadAudioPack = (personaId) => {
  if (typeof window === 'undefined') return;

  const currentPersona = personaId || getSettings()?.selectedVoice || 'female';
  if (!audioCache[currentPersona]) {
    audioCache[currentPersona] = {};
  }

  CLIP_NAMES.forEach((clipName) => {
    try {
      if (!audioCache[currentPersona][clipName]) {
        const audio = new Audio();
        audio.preload = 'auto';
        audio.src = `/audio/${currentPersona}/${clipName}.mp3`;
        audioCache[currentPersona][clipName] = audio;
      }
    } catch (e) {
      console.warn(`Could not preload audio ${currentPersona}/${clipName}:`, e);
    }
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
 * Nghe thử giọng đọc trong Cài Đặt
 * @param {string} voiceKey
 */
export const previewVoice = (voiceKey = 'female') => {
  stopAllVoice();
  try {
    preloadAudioPack(voiceKey);
    let audio = audioCache[voiceKey]?.['start_workout'];
    if (!audio) {
      audio = new Audio(`/audio/${voiceKey}/start_workout.mp3`);
      if (!audioCache[voiceKey]) audioCache[voiceKey] = {};
      audioCache[voiceKey]['start_workout'] = audio;
    }

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
