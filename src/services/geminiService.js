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
export const generatePlankPlan = async (apiKey, userProfile, historySummary) => {
  if (!apiKey || !apiKey.trim()) {
    throw new Error("Vui lòng nhập Google Gemini API Key trong phần Cài đặt.");
  }

  const record = userProfile.record || 45;
  const height = userProfile.height || 170;
  const weight = userProfile.weight || 65;
  const heightM = height / 100;
  const bmi = (weight / (heightM * heightM)).toFixed(1);

  const promptText = `
Bạn là Huấn luyện viên Thể hình & Chuyên gia Plank cơ Core cấp cao quốc tế.
Dưới đây là BÁO CÁO TOÀN DIỆN VỀ THỂ TRẠNG & LỊCH SỬ TẬP LUYỆN THỰC TẾ của học viên:

👤 CHỈ SỐ THỂ TRẠNG:
- Giới tính sinh học: ${userProfile.gender === 'female' ? 'Nữ 👩 (Định hướng: Siết eo thon gọn, phẳng bụng dưới, tạo rãnh bụng số 11)' : 'Nam 👨 (Định hướng: Phát triển khối cơ bụng 6 múi dày khỏe, rãnh V-cut, tăng sức mạnh Core)'}
- Chiều cao: ${height} cm | Cân nặng: ${weight} kg | BMI: ${bmi}
- Trình độ thể lực: ${userProfile.level || "Trung bình"}
- Mục tiêu chính: ${userProfile.goal || "Tăng sức bền & Giảm mỡ bụng"}

📊 THỐNG KÊ LỊCH SỬ:
- Kỷ lục giữ Plank cao nhất: ${record} giây
- Tổng số buổi tập đã hoàn thành: ${historySummary?.totalWorkouts || 0} buổi
- Tổng thời gian Plank tích lũy: ${historySummary?.totalMinutes || 0} phút
- Chuỗi ngày tập liên tục: ${historySummary?.streak || 0} ngày

🗓️ CHI TIẾT CÁC BUỔI TẬP GẦN NHẤT:
${historySummary?.recentSessionsText || "Chưa có lịch sử buổi tập trước đó."}

NHIỆM VỤ CỦA HUẤN LUYỆN VIÊN:
1. Đánh giá phong độ (evaluation): Phân tích chi tiết sự tiến bộ, điểm mạnh và điểm cần cải thiện dựa trên lịch sử tập luyện thực tế trên.
2. Lời khuyên chiến lược (advice): Đưa ra chỉ dẫn cụ thể về kỹ thuật siết cơ Core, nhịp thở và cách phân bổ sức bền để vượt ngưỡng kỷ lục.
3. Thiết kế chuỗi bài tập mới (exercises): Tạo từ 4 đến 6 hiệp bài tập Plank khoa học nhất phù hợp với phong độ hiện tại.

YÊU CẦU ĐẦU RA BẮT BUỘC:
Chỉ trả về DUY NHẤT một chuỗi JSON hợp lệ tuân theo cấu trúc sau, KHÔNG có văn bản giới thiệu hay markdown giải thích nào:
{
  "evaluation": "Nhận xét đánh giá phong độ dựa trên lịch sử tập...",
  "advice": "Lời khuyên chiến lược nâng cao sức bền...",
  "planName": "Tên giáo án hấp dẫn (vd: 7 Ngày Kiến Tạo Cơ Core Vững Chắc)",
  "goal": "${userProfile.goal || 'Tăng sức bền'}",
  "level": "${userProfile.level || 'Trung bình'}",
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

// ==================== TÍNH NĂNG HUẤN LUYỆN VIÊN AI TƯ VẤN PHONG ĐỘ ====================

// Hàm tạo Prompt chuyên sâu cho Huấn Luyện Viên AI phân tích phong độ (Dùng cho cả Copy Prompt và API)
export const buildPerformanceAnalysisPrompt = (userProfile, historySummary) => {
  const record = userProfile.record || 60;
  const height = userProfile.height || 170;
  const weight = userProfile.weight || 65;
  const heightM = height / 100;
  const bmi = (weight / (heightM * heightM)).toFixed(1);
  const goal = userProfile.goal || "Tăng sức bền & Giảm mỡ bụng";
  const level = userProfile.level || "Trung bình";
  const totalWorkouts = historySummary?.totalWorkouts || 0;
  const totalMinutes = historySummary?.totalMinutes || 0;
  const totalCalories = historySummary?.totalCalories || 0;
  const streak = historySummary?.streak || 0;
  const recentSessionsText = historySummary?.recentSessionsText || "Chưa có lịch sử buổi tập trước đó.";

  return `Bạn là Huấn luyện viên Cá nhân (PT) & Chuyên gia Phục hồi Sức bền Cơ Core cấp cao quốc tế.
Học viên đang cần bạn PHÂN TÍCH CHUYÊN SÂU LỊCH SỬ TẬP LUYỆN, ĐÁNH GIÁ PHONG ĐỘ VÀ ĐƯA RA LỜI KHUYÊN TƯ VẤN THỰC CHIẾN (Tuyệt đối KHÔNG tạo danh sách bài tập mà tập trung 100% vào chẩn đoán và hướng dẫn).

Dưới đây là BÁO CÁO THỂ LỰC & LỊCH SỬ TẬP THỰC TẾ CỦA HỌC VIÊN:

👤 CHỈ SỐ THỂ TRẠNG:
- Giới tính sinh học: ${userProfile.gender === 'female' ? 'Nữ 👩 (Định hướng: Siết eo thon gọn, phẳng bụng dưới, tạo rãnh bụng số 11)' : 'Nam 👨 (Định hướng: Phát triển cơ bụng 6 múi dày khỏe, rãnh V-cut, tăng sức mạnh Core)'}
- Chiều cao: ${height} cm | Cân nặng: ${weight} kg | Chỉ số BMI: ${bmi}
- Trình độ thể lực: ${level}
- Mục tiêu chính: ${goal}

📊 TỔNG KẾT QUÁ TRÌNH TẬP LUYỆN:
- Kỷ lục giữ Plank cao nhất (PR): ${record} giây
- Tổng số buổi tập đã hoàn thành: ${totalWorkouts} buổi
- Tổng thời gian Plank tích lũy: ${totalMinutes} phút (${historySummary?.totalSeconds || 0} giây giữ Core)
- Tổng năng lượng tiêu hao: ${totalCalories} kcal
- Chuỗi ngày tập liên tục: ${streak} ngày

🗓️ CHI TIẾT TỪNG HIỆP CỦA CÁC BUỔI TẬP GẦN NHẤT (Bao gồm thời gian gồng và thời gian nghỉ giữa hiệp thực tế):
${recentSessionsText}

NHIỆM VỤ CỦA HUẤN LUYỆN VIÊN (Đưa ra nhận xét sắc bén, chân thực, khoa học và truyền cảm hứng):
1. Chẩn đoán phong độ & Độ bền giữa các hiệp (evaluation): Đọc kỹ chi tiết từng hiệp ở trên để phân tích xem thời gian gồng có bị sụt giảm ở các hiệp sau không, thời gian nghỉ giữa hiệp hiện tại có đủ để cơ Core tái tạo năng lượng (ATP) không, và sức bền tổng thể đang tiến bộ ra sao.
2. Điểm mạnh & Điểm nghẽn thể lực (strengthsAndWeaknesses): Học viên đang vượt trội ở điểm nào và đâu là rào cản chính (cơ delta vai, cơ mông, thắt lưng hay nhịp thở) cản trở việc giữ vững thời gian ở các hiệp cuối.
3. Kỹ thuật gồng siết & Nhịp thở (formAndBreathing): Hướng dẫn kỹ thuật Hollow Body, cách khóa xương chậu (posterior pelvic tilt) và kỹ thuật thở cơ hoành (thở bụng) để duy trì oxy khi gồng lâu.
4. Cảnh báo an toàn & Phòng ngừa chấn thương (injuryPrevention): Dấu hiệu võng thắt lưng (Lumbar lordosis), mỏi khớp cổ vai gáy và cách khắc phục ngay khi thấy đuối sức.
5. Dinh dưỡng, Giảm mỡ & Hồi phục (nutritionAndRecovery): Lời khuyên ăn uống trước/sau tập, bù nước và nghỉ ngơi phù hợp với chỉ số BMI ${bmi} để tối ưu cơ bụng.
6. Lời nhắn truyền lửa (motivationalQuote): Một câu châm ngôn ngắn gọn, đanh thép từ Huấn Luyện Viên.

YÊU CẦU ĐẦU RA BẮT BUỘC:
Trả về DUY NHẤT một chuỗi JSON hợp lệ theo định dạng sau (KHÔNG kèm văn bản thừa ngoài JSON):
{
  "evaluation": "Nhận xét phân tích chi tiết phong độ và sức bền...",
  "strengthsAndWeaknesses": "Điểm mạnh và điểm nghẽn thể lực của học viên...",
  "formAndBreathing": "Chỉ dẫn kỹ thuật gồng siết Hollow Body và nhịp thở cơ hoành...",
  "injuryPrevention": "Cảnh báo tư thế sai và cách bảo vệ cột sống/khớp vai...",
  "nutritionAndRecovery": "Tư vấn dinh dưỡng, bù khoáng và thời gian hồi phục cơ...",
  "motivationalQuote": "Lời nhắn truyền lửa đanh thép..."
}`;
};

// Gọi trực tiếp Gemini API để phân tích phong độ học viên
export const analyzeWorkoutPerformance = async (apiKey, userProfile, historySummary) => {
  if (!apiKey || !apiKey.trim()) {
    throw new Error("Vui lòng nhập Google Gemini API Key trong phần Cài đặt.");
  }

  const promptText = buildPerformanceAnalysisPrompt(userProfile, historySummary);
  const requestBody = {
    contents: [{ parts: [{ text: promptText }] }],
    generationConfig: {
      responseMimeType: "application/json",
      temperature: 0.7,
    }
  };

  let lastError = null;

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
        console.warn(`Model ${model} failed for performance analysis: ${rawMsg}. Trying next candidate...`);
        lastError = new Error(translateErrorMessage(rawMsg));
        continue;
      }

      const data = await response.json();
      const resultText = data.candidates?.[0]?.content?.parts?.[0]?.text;

      if (!resultText) {
        continue;
      }

      const parsedAdvice = extractJsonFromText(resultText);
      return {
        ...parsedAdvice,
        analyzedAt: new Date().toISOString()
      };
    } catch (err) {
      console.warn(`Model ${model} analysis network error:`, err);
      lastError = err;
    }
  }

  // Nếu máy chủ Google quá tải, tạo phân tích cục bộ thông minh theo dữ liệu thực tế
  console.info("Generating offline performance analysis based on workout metrics...");
  return generateOfflinePerformanceAnalysis(userProfile, historySummary);
};

// Hàm tạo bài phân tích dự phòng khi ngoại tuyến hoặc máy chủ Google quá tải
const generateOfflinePerformanceAnalysis = (userProfile, historySummary) => {
  const record = userProfile.record || 60;
  const totalWorkouts = historySummary?.totalWorkouts || 0;
  const streak = historySummary?.streak || 0;
  const weight = userProfile.weight || 65;
  const height = userProfile.height || 170;
  const heightM = height / 100;
  const bmi = (weight / (heightM * heightM)).toFixed(1);
  const isFemale = userProfile.gender === 'female';

  let evaluation = "";
  if (totalWorkouts >= 10) {
    evaluation = `Bạn đã kiên trì hoàn thành ${totalWorkouts} buổi tập với kỷ lục ${record}s. Phong độ cơ Core của bạn đang bước vào giai đoạn thích nghi vững vàng. Sức bền tĩnh của nhóm cơ thẳng bụng và cơ ngang bụng (TVA) đã tăng trưởng rõ rệt so với giai đoạn đầu.`;
  } else if (totalWorkouts >= 3) {
    evaluation = `Bạn đã có khởi đầu rất tích cực với ${totalWorkouts} buổi tập, giữ vững mốc ${record}s. Thể lực đang trong pha kích hoạt nhóm cơ sâu. Đây là thời điểm vàng để rèn luyện thói quen giữ thẳng trục cơ thể.`;
  } else {
    evaluation = `Bạn đang ở những bước đầu tiên trên hành trình rèn luyện Core với kỷ lục ${record}s. Cơ thể đang dần làm quen với áp lực tĩnh của tư thế Plank. Đừng vội so sánh, hãy tập trung vào cảm giác siết cơ bụng.`;
  }

  let strengthsAndWeaknesses = "";
  if (record >= 90) {
    strengthsAndWeaknesses = `Điểm mạnh: Ý chí thép và sức chịu đựng cơ bụng rất tốt. Điểm nghẽn: Khi vượt qua mốc 60s, nhóm cơ delta ở vai và cơ gấp hông thường có xu hướng mỏi trước cơ bụng, dễ khiến cơ thể gồng bù sai vị trí.`;
  } else if (record >= 60) {
    strengthsAndWeaknesses = `Điểm mạnh: Đạt chuẩn sức bền cơ bản của người trưởng thành (${record}s). Điểm nghẽn: Thường xảy ra tình trạng nín thở ở 15 giây cuối hiệp, dẫn đến tim đập nhanh và cơ bắp cạn kiệt oxy nhanh chóng.`;
  } else {
    strengthsAndWeaknesses = `Điểm mạnh: Tinh thần sẵn sàng bứt phá giới hạn. Điểm nghẽn: Cơ mông chưa tham gia khóa xương chậu đủ sâu, dẫn đến trọng lực dồn nhiều vào khớp vai và thắt lưng.`;
  }

  return {
    evaluation,
    strengthsAndWeaknesses,
    formAndBreathing: `Kỹ thuật Hollow Body: Chủ động cuộn nhẹ xương chậu về phía rốn (Posterior Pelvic Tilt), siết chặt 2 cơ mông như kẹp một đồng xu. Về nhịp thở: Tuyệt đối không nín thở; hãy hít sâu bằng mũi xuống khoang bụng và thở ra từ từ qua kẽ răng (thở xì) để duy trì áp lực trong ổ bụng.`,
    injuryPrevention: `Cảnh báo an toàn: Khi cảm thấy vùng thắt lưng bị võng xuống sàn hoặc hai bả vai bị sụp trũng (mất form thẳng), hãy hạ gối nghỉ ngay lập tức. Giữ tư thế chuẩn trong 45s có giá trị hơn rất nhiều so với gồng 70s bị võng lưng gây áp lực lên đĩa đệm.`,
    nutritionAndRecovery: `Với chỉ số BMI ${bmi} (${isFemale ? 'Mục tiêu siết eo thon' : 'Mục tiêu tăng cơ giảm mỡ'}): Hãy bổ sung một ly nước ấm hoặc điện giải trước khi tập 15 phút. Sau buổi tập, ưu tiên thực phẩm giàu đạm (ức gà, trứng, sữa hạt) và duy trì giấc ngủ 7-8 tiếng để sợi cơ Core được tái tạo săn chắc.`,
    motivationalQuote: streak >= 3 
      ? `Chuỗi ${streak} ngày của bạn là minh chứng cho kỷ luật sắt. Kỷ lục mới đang chờ bạn bứt phá!`
      : `Mỗi giây bạn gồng vững trên thảm là một bước tiến đến phiên bản mạnh mẽ nhất của chính mình.`,
    analyzedAt: new Date().toISOString()
  };
};