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
 * Nghe thử giọng đọc trong Cài Đặt (Sử dụng Microsoft Edge Neural TTS)
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

    const playPromise = audio.play();
    if (playPromise !== undefined) {
      playPromise.catch(() => {
        // Fallback sang Microsoft Edge Neural TTS
        speakText('Bắt đầu buổi tập nào! Hãy gồng cơ bụng và giữ form chuẩn nhé.', { voice: voiceKey });
      });
    }
  } catch (err) {
    speakText('Bắt đầu buổi tập nào! Hãy gồng cơ bụng và giữ form chuẩn nhé.', { voice: voiceKey });
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

let audioCtx = null;
const getAudioContext = () => {
  if (typeof window === 'undefined') return null;
  if (!audioCtx) {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (AudioContextClass) {
      audioCtx = new AudioContextClass();
    }
  }
  if (audioCtx && audioCtx.state === 'suspended') {
    audioCtx.resume().catch(() => {});
  }
  return audioCtx;
};

/**
 * Phát âm thanh tiếng Beep ngắn chuẩn nhịp đếm
 */
export const playBeep = (freq = 600, duration = 120, options = {}) => {
  try {
    const settings = getSettings();
    if (options.enabled === false || (options.enabled === undefined && settings.soundEnabled === false)) return;

    const ctx = getAudioContext();
    if (!ctx) return;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, ctx.currentTime);

    const volume = options.volume !== undefined ? options.volume : 0.4;
    gain.gain.setValueAtTime(volume, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration / 1000);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + duration / 1000);
  } catch (e) {
    console.warn('Beep error:', e);
  }
};

/**
 * Phát âm thanh nhịp tim đập kép (Double Thump: Lub-Dub Heartbeat FX)
 * Thump 1: Tần số ~70Hz decay 38Hz (LUB)
 * Thump 2: Tần số ~58Hz decay 32Hz (DUB, sau 120ms)
 */
export const playHeartbeatSound = (options = {}) => {
  try {
    const settings = getSettings();
    if (options.enabled === false || (options.enabled === undefined && (settings.heartbeatEnabled === false || settings.soundEnabled === false))) return;

    const ctx = getAudioContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const volume = options.volume !== undefined ? options.volume : 0.85;

    const createThump = (time, startFreq, endFreq, gainVal, dur) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const filter = ctx.createBiquadFilter();

      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(140, time);

      osc.type = 'sine';
      osc.frequency.setValueAtTime(startFreq, time);
      osc.frequency.exponentialRampToValueAtTime(endFreq, time + dur);

      gain.gain.setValueAtTime(0.001, time);
      gain.gain.linearRampToValueAtTime(gainVal * volume, time + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, time + dur);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);

      osc.start(time);
      osc.stop(time + dur);
    };

    // Nhịp 1: LUB
    createThump(now, 75, 40, 0.9, 0.15);
    // Nhịp 2: DUB (sau 120ms)
    createThump(now + 0.12, 60, 32, 0.75, 0.13);
  } catch (e) {
    console.warn('Heartbeat audio error:', e);
  }
};
