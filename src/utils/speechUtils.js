import { getSettings } from '../services/storageService';
import { speakEdgeNeural } from '../services/edgeTtsService';

let speechUnlocked = false;

// Kích hoạt audio context ngay khi user tap vào màn hình (bắt buộc cho iOS Safari / WKWebView)
export const unlockSpeechAPI = () => {
  if (!speechUnlocked && typeof window !== 'undefined' && 'speechSynthesis' in window) {
    try {
      const utterance = new SpeechSynthesisUtterance('');
      utterance.volume = 0;
      window.speechSynthesis.speak(utterance);
      speechUnlocked = true;
    } catch (e) {
      console.warn("Could not unlock speech API:", e);
    }
  }
};

export const speakText = async (text, options = {}) => {
  if (!text || !text.trim() || typeof window === 'undefined') return;

  // Kiểm tra nếu trợ lý giọng nói đang bị tắt
  try {
    const settings = getSettings();
    if (options.enabled === false || (options.enabled === undefined && settings.voiceEnabled === false)) {
      if ('speechSynthesis' in window) window.speechSynthesis.cancel();
      return;
    }

    // 1. Ưu tiên phát bằng Microsoft Edge Neural TTS Engine (chất lượng Studio truyền cảm)
    try {
      await speakEdgeNeural(text, {
        voice: options.voice || settings.selectedVoice || 'female',
        volume: options.volume !== undefined ? options.volume : (settings.soundVolume || 1.0),
        rate: options.rate || 0,
        pitch: options.pitch || 0
      });
      return;
    } catch (edgeErr) {
      console.warn("Edge Neural TTS failed, fallback to native SpeechSynthesis:", edgeErr);
    }

    // 2. Dự phòng: Phát bằng Web Speech API nếu mất kết nối mạng
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();

      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = options.lang || 'vi-VN';
      utterance.rate = options.rate || 1.0;
      utterance.pitch = options.pitch || 1.0;
      utterance.volume = options.volume !== undefined ? options.volume : (settings.soundVolume || 1.0);

      const voices = window.speechSynthesis.getVoices();
      const viVoice = voices.find(v => v.lang.includes('vi') || v.lang.includes('VI'));
      if (viVoice) {
        utterance.voice = viVoice;
      }

      window.speechSynthesis.speak(utterance);
    }
  } catch (e) {
    console.error("Speech Synthesis Error:", e);
  }
};

export const playBeep = (freq = 880, duration = 150, options = {}) => {
  try {
    const settings = getSettings();
    if (options.enabled === false || (options.enabled === undefined && settings.voiceEnabled === false)) {
      return;
    }

    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return;
    const ctx = new AudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(0.3, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + duration / 1000);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + duration / 1000);
  } catch (e) {
    // Ignore audio context restriction
  }
};