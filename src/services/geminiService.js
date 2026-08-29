/**
 * Dịch vụ gọi Google Gemini REST API trực tiếp.
 * Tối ưu hiệu năng, không cần cài thêm package.
 */

// Hàm kiểm tra nhanh tính hợp lệ của API Key
export const testGeminiApiKey = async (apiKey) => {
  if (!apiKey || !apiKey.trim()) {
    throw new Error("Vui lòng nhập API Key.");
  }

  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey.trim()}`;

  const requestBody = {
    contents: [
      {
        parts: [{ text: "Hello! Reply with 'OK' only." }]
      }
    ]
  };

  try {
    const response = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const message = errorData.error?.message || `Lỗi HTTP ${response.status}: API Key không hợp lệ hoặc bị giới hạn.`;
      throw new Error(message);
    }

    const data = await response.json();
    return !!data.candidates?.[0]?.content?.parts?.[0]?.text;
  } catch (error) {
    console.error("Gemini Test Error:", error);
    throw error;
  }
};

// Hàm trích xuất JSON an toàn kể cả khi Gemini trả về Markdown ```json ... ```
const extractJsonFromText = (text) => {
  try {
    return JSON.parse(text);
  } catch (e) {
    // Thử regex trích xuất khối JSON
    const match = text.match(/\{[\s\S]*\}|\[[\s\S]*\]/);
    if (match) {
      return JSON.parse(match[0]);
    }
    throw new Error("Không thể phân tích dữ liệu JSON từ AI.");
  }
};

// Hàm tạo giáo án thông minh từ thể trạng người dùng
export const generatePlankPlan = async (apiKey, userProfile) => {
  if (!apiKey || !apiKey.trim()) {
    throw new Error("Vui lòng nhập Google Gemini API Key trong phần Cài đặt.");
  }

  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey.trim()}`;

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
    contents: [
      {
        parts: [{ text: promptText }]
      }
    ],
    generationConfig: {
      responseMimeType: "application/json",
      temperature: 0.7,
    }
  };

  try {
    const response = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error?.message || `Lỗi kết nối Gemini API (HTTP ${response.status})`);
    }

    const data = await response.json();
    const resultText = data.candidates?.[0]?.content?.parts?.[0]?.text;
    
    if (!resultText) {
      throw new Error("Không nhận được nội dung trả về từ Gemini AI.");
    }

    const parsedPlan = extractJsonFromText(resultText);
    return parsedPlan;
  } catch (error) {
    console.error("Gemini API Error:", error);
    throw new Error(error.message || "Không thể tạo giáo án tự động.");
  }
};

// Các giáo án mẫu chất lượng cao sẵn có (phòng khi chưa có API Key hoặc muốn tập ngay)
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