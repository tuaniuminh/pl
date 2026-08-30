/**
 * Dịch vụ gọi Google Gemini REST API trực tiếp.
 * Tích hợp cơ chế Fallback thông minh (Chống quá tải máy chủ Google).
 */

const CANDIDATE_MODELS = [
  'gemini-3.7-flash',
  'gemini-3.6-flash',
  'gemini-2.5-flash',
  'gemini-2.0-flash'
];

// Hàm dịch thông báo lỗi sang tiếng Việt thân thiện
const translateErrorMessage = (errorMsg) => {
  if (!errorMsg) return "Lỗi không xác định khi kết nối với AI.";
  const msg = errorMsg.toLowerCase();
  
  if (msg.includes("high demand") || msg.includes("overloaded") || msg.includes("503") || msg.includes("resource has been exhausted")) {
    return "Máy chủ Google Gemini đang quá tải lượt truy cập tạm thời. Ứng dụng đã tự động chuyển sang mô hình dự phòng.";
  }
  if (msg.includes("api_key_invalid") || msg.includes("api key not valid") || msg.includes("400")) {
    return "API Key không hợp lệ hoặc đã hết hạn. Vui lòng kiểm tra lại trong phần Cài đặt.";
  }
  if (msg.includes("quota") || msg.includes("rate limit") || msg.includes("429")) {
    return "Đã đạt giới hạn yêu cầu miễn phí của Google. Vui lòng đợi trong giây lát hoặc đổi API Key khác.";
  }
  return errorMsg;
};

// Hàm kiểm tra nhanh tính hợp lệ của API Key với cơ chế Fallback
export const testGeminiApiKey = async (apiKey) => {
  if (!apiKey || !apiKey.trim()) {
    throw new Error("Vui lòng nhập API Key.");
  }

  let lastError = null;

  for (const model of CANDIDATE_MODELS) {
    try {
      const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey.trim()}`;
      const requestBody = {
        contents: [{ parts: [{ text: "Ping" }] }]
      };

      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestBody)
      });

      if (response.ok) {
        const data = await response.json();
        if (data.candidates?.[0]?.content?.parts?.[0]?.text) {
          return { success: true, activeModel: model };
        }
      } else {
        const errorData = await response.json().catch(() => ({}));
        const rawMsg = errorData.error?.message || `HTTP ${response.status}`;
        lastError = new Error(translateErrorMessage(rawMsg));
      }
    } catch (err) {
      lastError = err;
    }
  }

  throw lastError || new Error("Không thể kết nối với máy chủ Google Gemini.");
};

// Hàm trích xuất JSON an toàn kể cả khi Gemini trả về Markdown ```json ... ```
const extractJsonFromText = (text) => {
  try {
    return JSON.parse(text);
  } catch (e) {
    const match = text.match(/\{[\s\S]*\}|\[[\s\S]*\]/);
    if (match) {
      return JSON.parse(match[0]);
    }
    throw new Error("Không thể phân tích dữ liệu JSON từ AI.");
  }
};

// Tạo giáo án thông minh có cơ chế Fallback tự động khi model quá tải
export const generatePlankPlan = async (apiKey, userProfile) => {
  if (!apiKey || !apiKey.trim()) {
    throw new Error("Vui lòng nhập Google Gemini API Key trong phần Cài đặt.");
  }

  const promptText = `
Bạn là Huấn luyện viên Fitness chuyên nghiệp cấp cao thế giới, chuyên sâu về Plank và tăng cường nhóm cơ Core.
Hãy thiết kế một giáo án luyện tập Plank cá nhân hóa xuất sắc dựa trên thông tin người tập sau:
- Kỷ lục giữ Plank hiện tại: ${userProfile.record || 45} giây
- Tần suất tập mong muốn: ${userProfile.frequency || "3 buổi/tuần"}
- Mục tiêu chính: ${userProfile.goal || "Tăng sức bền & Giảm mỡ bụng"}
- Trình độ thể lực: ${userProfile.level || "Trung bình"}
- Ghi chú thêm: ${userProfile.notes || "Không có"}

YÊU CẦU ĐẦU RA BẮT BUỘC:
Chỉ trả về DUY NHẤT một chuỗi JSON hợp lệ tuân theo cấu trúc sau, KHÔNG có văn bản giới thiệu hay markdown giải thích nào:
{
  "planName": "Tên giáo án hấp dẫn (vd: 7 Ngày Kiến Tạo Cơ Core Vững Chắc)",
  "description": "Mô tả ngắn gọn lộ trình và lợi ích đạt được trong 1-2 câu",
  "level": "Mới bắt đầu | Trung bình | Nâng cao",
  "totalDays": 7,
  "days": [
    {
      "day": 1,
      "title": "Khởi động & Đánh thức cơ Core",
      "focus": "Sức bền cơ bản",
      "exercises": [
        {
          "name": "Plank khuỷu tay chuẩn",
          "holdTime": 45,
          "restTime": 25,
          "tip": "Siết chặt cơ mông và cơ bụng, giữ thẳng từ đầu đến gót chân"
        },
        {
          "name": "Plank nghiêng (Side Plank)",
          "holdTime": 30,
          "restTime": 20,
          "tip": "Nâng hông cao, không để võng hông xuống sàn"
        },
        {
          "name": "Plank cao tay duỗi thẳng",
          "holdTime": 45,
          "restTime": 30,
          "tip": "Cổ tay thẳng hàng dưới vai, mắt nhìn xuống sàn"
        }
      ]
    }
  ]
}

Lưu ý:
- Phải tạo ít nhất 3-5 ngày tập đa dạng.
- Mỗi ngày có từ 3 đến 5 bài tập biến thể phong phú (Plank khuỷu tay, Side Plank, Plank Superman, Plank giơ chân, Plank leo núi, Plank Up-Down...).
- Thời gian holdTime và restTime tính bằng giây, thiết kế khoa học phù hợp kỷ lục ${userProfile.record || 45}s.
`;

  const requestBody = {
    contents: [{ parts: [{ text: promptText }] }],
    generationConfig: {
      responseMimeType: "application/json",
      temperature: 0.7,
    }
  };

  let lastError = null;

  // Lần lượt thử các model từ 3.7 Flash -> 2.5 Flash -> 2.0 Flash -> 1.5 Flash nếu gặp lỗi High Demand / Quá tải
  for (const model of CANDIDATE_MODELS) {
    try {
      const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey.trim()}`;

      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestBody)
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const rawMsg = errorData.error?.message || `HTTP ${response.status}`;
        console.warn(`Model ${model} failed: ${rawMsg}. Trying next candidate...`);
        lastError = new Error(translateErrorMessage(rawMsg));
        continue; // Thử model tiếp theo
      }

      const data = await response.json();
      const resultText = data.candidates?.[0]?.content?.parts?.[0]?.text;

      if (!resultText) {
        continue;
      }

      const parsedPlan = extractJsonFromText(resultText);
      return parsedPlan;
    } catch (err) {
      console.warn(`Model ${model} network error:`, err);
      lastError = err;
    }
  }

  // Nếu tất cả model online đều quá tải từ Google, tự động sinh giáo án cá nhân hóa nội bộ theo đúng thể trạng người dùng
  console.info("Falling back to local intelligent plan generator based on user profile...");
  return generateOfflineCustomPlan(userProfile);
};

// Hàm sinh giáo án cá nhân hóa nội bộ chuẩn khoa học theo thể trạng người dùng khi Google server quá tải
const generateOfflineCustomPlan = (userProfile) => {
  const record = userProfile.record || 45;
  const baseHold1 = Math.max(15, Math.round(record * 0.7));
  const baseHold2 = Math.max(20, Math.round(record * 0.85));
  const maxHold = Math.max(30, record);

  return {
    planName: `🔥 Lộ Trình ${userProfile.goal || 'Cơ Core Vững Chắc'} (Tối Ưu Cá Nhân)`,
    description: `Giáo án cá nhân hóa tự động tối ưu cho kỷ lục ${record}s của bạn. Tác động toàn diện vùng bụng, lưng và hông.`,
    level: userProfile.level || 'Trung bình',
    totalDays: 5,
    days: [
      {
        day: 1,
        title: "Kích Hoạt Nhóm Cơ Core",
        focus: "Sức bền nền tảng",
        exercises: [
          { name: "Plank khuỷu tay chuẩn", holdTime: baseHold1, restTime: 20, tip: "Siết chặt cơ mông và bụng, không võng lưng" },
          { name: "Plank nghiêng bên trái", holdTime: Math.round(baseHold1 * 0.75), restTime: 15, tip: "Nâng cao hông siết cơ liên sườn" },
          { name: "Plank nghiêng bên phải", holdTime: Math.round(baseHold1 * 0.75), restTime: 20, tip: "Giữ cơ thể trên một đường thẳng" },
          { name: "Plank cao tay duỗi thẳng", holdTime: baseHold2, restTime: 30, tip: "Cổ tay thẳng hàng với vai, thở đều" }
        ]
      },
      {
        day: 2,
        title: "Tấn Công Cơ Bụng Dưới & Chéo",
        focus: "Đốt mỡ & Siết eo",
        exercises: [
          { name: "Plank leo núi (Mountain Climbers)", holdTime: baseHold1, restTime: 20, tip: "Kéo gối nhịp nhàng về phía ngực" },
          { name: "Plank nhấc chân luân phiên", holdTime: baseHold1, restTime: 20, tip: "Nâng chân không làm xoay lắc hông" },
          { name: "Plank khuỷu tay bứt phá", holdTime: maxHold, restTime: 35, tip: "Tập trung cảm nhận cơ bụng căng siết" }
        ]
      },
      {
        day: 3,
        title: "Củng Cố Cột Sống & Sức Bền Đỉnh Cao",
        focus: "Phá vỡ giới hạn",
        exercises: [
          { name: "Plank Superman (Giơ tay chân đối diện)", holdTime: Math.round(baseHold1 * 0.7), restTime: 20, tip: "Giữ thăng bằng và siết lưng dưới" },
          { name: "Plank xoay hông (Spiderman Plank)", holdTime: baseHold2, restTime: 25, tip: "Đưa gối chạm nhẹ về phía khuỷu tay" },
          { name: "Plank khuỷu tay Max Effort", holdTime: Math.round(maxHold * 1.1), restTime: 40, tip: "Duy trì ý chí vượt ngưỡng giới hạn" }
        ]
      }
    ]
  };
};

// Các giáo án mẫu chất lượng cao sẵn có
export const getPredefinedPlans = () => [
  {
    planName: "🔥 7 Ngày Đốt Mỡ & Siết Eo Thần Tốc",
    description: "Lộ trình nhanh giúp săn chắc cơ bụng, tăng cơ liên sườn và đốt mỡ thừa hiệu quả.",
    level: "Mọi cấp độ",
    totalDays: 7,
    days: [
      {
        day: 1,
        title: "Đánh Thức Vùng Cơ Bụng",
        focus: "Khởi động & Cơ bản",
        exercises: [
          { name: "Plank khuỷu tay truyền thống", holdTime: 45, restTime: 20, tip: "Hít thở đều đặn, không nín thở" },
          { name: "Plank nghiêng bên trái", holdTime: 30, restTime: 15, tip: "Nâng cao hông siết cơ liên sườn" },
          { name: "Plank nghiêng bên phải", holdTime: 30, restTime: 20, tip: "Giữ người trên một đường thẳng" },
          { name: "Plank khuỷu tay bứt phá", holdTime: 50, restTime: 30, tip: "Cố gắng giữ vững đến giây cuối cùng" }
        ]
      },
      {
        day: 2,
        title: "Tăng Cường Cơ Liên Sườn",
        focus: "Cơ bụng chéo",
        exercises: [
          { name: "Plank cao tay chạm vai", holdTime: 45, restTime: 20, tip: "Hạn chế lắc lư phần hông khi chạm vai" },
          { name: "Plank leo núi (Mountain Climber)", holdTime: 40, restTime: 20, tip: "Kéo gối sát về phía ngực nhịp nhàng" },
          { name: "Plank khuỷu tay", holdTime: 60, restTime: 30, tip: "Tập trung cảm nhận cơ bụng căng siết" }
        ]
      }
    ]
  },
  {
    planName: "⚡ Thử Thách 30 Ngày Vươn Tới 5 Phút Plank",
    description: "Giáo án tăng dần thể lực bền bỉ, giúp bạn phá vỡ mọi giới hạn bản thân.",
    level: "Nâng cao",
    totalDays: 30,
    days: [
      {
        day: 1,
        title: "Thiết Lập Nền Tảng",
        focus: "Sức bền tĩnh",
        exercises: [
          { name: "Plank khuỷu tay Hiệp 1", holdTime: 60, restTime: 30, tip: "Giữ form lưng chuẩn, không võng lưng" },
          { name: "Plank khuỷu tay Hiệp 2", holdTime: 60, restTime: 30, tip: "Cơ mông siết chặt" },
          { name: "Plank khuỷu tay Hiệp 3 (Max Effort)", holdTime: 75, restTime: 45, tip: "Vượt ngưỡng giới hạn" }
        ]
      }
    ]
  }
];