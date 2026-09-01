/**
 * Microsoft Edge Neural TTS Engine (Miễn phí 100%, chất lượng Studio tự nhiên)
 * Hỗ trợ các giọng tiếng Việt chuẩn Microsoft Neural:
 * - vi-VN-HoaiMyNeural (Nữ - Truyền cảm, tự nhiên)
 * - vi-VN-NamMinhNeural (Nam - Trầm ấm, dứt khoát)
 */

const TRUSTED_CLIENT_TOKEN = '6A5AA1D4EA654074B1576028BA7B3F44';
const EDGE_WS_URL = `wss://speech.platform.bing.com/consumer/speech/synthesize/readaloud/edge/v1?TrustedClientToken=${TRUSTED_CLIENT_TOKEN}`;

export const EDGE_VOICES = {
  HOAI_MY: 'vi-VN-HoaiMyNeural',
  NAM_MINH: 'vi-VN-NamMinhNeural',
  EN_JENNY: 'en-US-JennyNeural',
  EN_GUY: 'en-US-GuyNeural'
};

// Bộ nhớ cache âm thanh đã tổng hợp (IndexedDB / Memory Cache) để phát tức thì 0ms
const ttsMemoryCache = new Map();
let currentEdgeAudio = null;

// Hàm tạo Request ID ngẫu nhiên
const generateRequestId = () => {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
};

/**
 * Tổng hợp giọng đọc Microsoft Edge Neural TTS thành Audio Blob
 * @param {string} text - Văn bản cần đọc
 * @param {string} voice - Tên giọng (vi-VN-HoaiMyNeural | vi-VN-NamMinhNeural)
 * @param {number} rate - Tốc độ đọc (-50% đến +50%)
 * @param {number} pitch - Cao độ (-50% đến +50%)
 * @returns {Promise<Blob>}
 */
export const synthesizeEdgeTTS = async (text, voice = EDGE_VOICES.HOAI_MY, rate = 0, pitch = 0) => {
  const cacheKey = `${voice}_${rate}_${pitch}_${text.trim()}`;
  if (ttsMemoryCache.has(cacheKey)) {
    return ttsMemoryCache.get(cacheKey);
  }

  return new Promise((resolve, reject) => {
    let ws = null;
    let audioChunks = [];
    const timeout = setTimeout(() => {
      if (ws) {
        try { ws.close(); } catch (e) {}
      }
      reject(new Error("Edge TTS timeout sau 6 giây"));
    }, 6000);

    try {
      ws = new WebSocket(EDGE_WS_URL);
      ws.binaryType = 'arraybuffer';

      ws.onopen = () => {
        // 1. Gửi cấu hình định dạng âm thanh MP3
        const configMsg =
          `Content-Type:application/json; charset=utf-8\r\nPath:speech.config\r\n\r\n` +
          JSON.stringify({
            context: {
              synthesis: {
                audio: {
                  metadataoptions: {
                    sentenceBoundaryEnabled: "false",
                    wordBoundaryEnabled: "false"
                  },
                  outputFormat: "audio-24khz-48kbitrate-mono-mp3"
                }
              }
            }
          });
        ws.send(configMsg);

        // 2. Gửi yêu cầu SSML
        const reqId = generateRequestId().replace(/-/g, '');
        const rateStr = rate >= 0 ? `+${rate}%` : `${rate}%`;
        const pitchStr = pitch >= 0 ? `+${pitch}Hz` : `${pitch}Hz`;

        const ssml =
          `<speak version='1.0' xmlns='http://www.w3.org/2001/10/synthesis' xml:lang='vi-VN'>` +
          `<voice name='${voice}'>` +
          `<prosody pitch='${pitchStr}' rate='${rateStr}'>${text}</prosody>` +
          `</voice></speak>`;

        const ssmlMsg =
          `X-RequestId:${reqId}\r\nContent-Type:application/ssml+xml\r\nPath:ssml\r\n\r\n${ssml}`;
        ws.send(ssmlMsg);
      };

      ws.onmessage = (event) => {
        if (typeof event.data === 'string') {
          if (event.data.includes('Path:turn.end')) {
            clearTimeout(timeout);
            try { ws.close(); } catch (e) {}
            const blob = new Blob(audioChunks, { type: 'audio/mp3' });
            ttsMemoryCache.set(cacheKey, blob);
            resolve(blob);
          }
        } else if (event.data instanceof ArrayBuffer) {
          // Xử lý gói tin nhị phân: 2 byte đầu là độ dài header Text
          const dataView = new DataView(event.data);
          if (dataView.byteLength > 2) {
            const headerLength = dataView.getInt16(0);
            if (event.data.byteLength > 2 + headerLength) {
              const audioData = event.data.slice(2 + headerLength);
              audioChunks.push(audioData);
            }
          }
        }
      };

      ws.onerror = (err) => {
        clearTimeout(timeout);
        reject(err);
      };

      ws.onclose = () => {
        clearTimeout(timeout);
        if (audioChunks.length > 0) {
          const blob = new Blob(audioChunks, { type: 'audio/mp3' });
          ttsMemoryCache.set(cacheKey, blob);
          resolve(blob);
        }
      };
    } catch (err) {
      clearTimeout(timeout);
      reject(err);
    }
  });
};

/**
 * Đọc văn bản bằng Microsoft Edge Neural TTS
 * @param {string} text - Nội dung câu cần đọc
 * @param {object} options - Tuỳ chọn { voice, volume, rate, pitch }
 */
export const speakEdgeNeural = async (text, options = {}) => {
  if (!text || !text.trim()) return;

  // Dừng âm thanh đang phát trước đó
  if (currentEdgeAudio) {
    try {
      currentEdgeAudio.pause();
      currentEdgeAudio.currentTime = 0;
      currentEdgeAudio = null;
    } catch (e) {}
  }

  const voiceName = options.voice === 'male' ? EDGE_VOICES.NAM_MINH : EDGE_VOICES.HOAI_MY;

  try {
    const audioBlob = await synthesizeEdgeTTS(text, voiceName, options.rate || 0, options.pitch || 0);
    const audioUrl = URL.createObjectURL(audioBlob);
    const audio = new Audio(audioUrl);
    audio.volume = options.volume !== undefined ? options.volume : 1.0;
    currentEdgeAudio = audio;

    audio.onended = () => {
      URL.revokeObjectURL(audioUrl);
      if (currentEdgeAudio === audio) currentEdgeAudio = null;
    };

    await audio.play();
  } catch (err) {
    console.warn("Edge Neural TTS failed, fallback to Web Speech API:", err);
    // Fallback sang Web Speech API nếu mất mạng hoặc offline
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'vi-VN';
      window.speechSynthesis.cancel();
      window.speechSynthesis.speak(utterance);
    }
  }
};
