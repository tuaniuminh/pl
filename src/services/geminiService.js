export const generatePlankPlan = async (apiKey, userProfile) => {
  if (!apiKey) {
    throw new Error("Vui lòng nhập Google Gemini API Key trong phần Cài đặt.");
  }

  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;

  const promptText = `Bạn là một huấn luyện viên Fitness chuyên nghiệp. 
Hãy tạo một giáo án tập Plank cá nhân hóa dựa trên thông tin sau:
- Kỷ lục giữ plank tối đa: ${userProfile.record} giây
- Tần suất tập mong muốn: ${userProfile.frequency}
- Mục tiêu chính: ${userProfile.goal}

YÊU CẦU QUAN TRỌNG: Đầu ra PHẢI tuân thủ cấu trúc JSON sau đây, KHÔNG chứa bất kỳ văn bản dư thừa nào:
{
  "planName": "Tên giáo án ngắn gọn",
  "days": [
    {
      "day": 1,
      "exercises": [
        {
          "name": "Plank cơ bản",
          "holdTime": 60, 
          "restTime": 30
        }
      ]
    }
  ]
}`;

  const requestBody = {
    contents: [{ parts: [{ text: promptText }] }],
    generationConfig: { responseMimeType: "application/json" }
  };

  try {
    const response = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error?.message || "Lỗi khi kết nối với Gemini API");
    }

    const data = await response.json();
    const resultText = data.candidates[0].content.parts[0].text;
    return JSON.parse(resultText);
  } catch (error) {
    console.error("Gemini API Error:", error);
    throw new Error(`Không thể tạo giáo án: ${error.message}`);
  }
};