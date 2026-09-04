import React, { useState, useEffect } from 'react';
import { 
  Sparkles, 
  Flame, 
  Dumbbell, 
  Target, 
  Clock, 
  CheckCircle2, 
  AlertCircle, 
  Zap, 
  BookOpen, 
  Play, 
  Layers,
  Plus,
  Trash2,
  Edit3,
  Copy,
  CopyPlus,
  Share2,
  ClipboardCheck,
  ChevronDown,
  ChevronUp,
  RotateCcw,
  Sliders,
  Check,
  X,
  HelpCircle,
  ShieldCheck,
  ArrowRight,
  ListPlus,
  PlusCircle,
  FileText,
  Crown,
  ClipboardPaste,
  ExternalLink,
  MessageSquare,
  Trophy,
  Activity,
  TrendingUp
} from 'lucide-react';
import { generatePlankPlan } from '../services/geminiService';
import { 
  getUserProfile, 
  saveUserProfile, 
  getActivePlan, 
  saveActivePlan, 
  getAllPlans, 
  savePlan, 
  deletePlan, 
  duplicatePlan,
  restoreDefaultPlans,
  getDeletedDefaultPlanIds,
  getHistoryStats,
  getWorkoutHistorySummaryForAI
} from '../services/storageService';

const EXERCISE_SUGGESTIONS = [
  { name: 'Plank Khuỷu Tay Tiêu Chuẩn', holdTime: 45, restTime: 20, tip: 'Siết chặt cơ bụng và cơ mông, giữ lưng thẳng song song mặt sàn.' },
  { name: 'Side Plank (Nghiêng) Trái', holdTime: 30, restTime: 15, tip: 'Nâng cao hông, giữ thân người tạo thành đường thẳng, mở rộng ngực.' },
  { name: 'Side Plank (Nghiêng) Phải', holdTime: 30, restTime: 20, tip: 'Đẩy hông cao, siết chặt cơ liên sườn phía dưới.' },
  { name: 'Plank Cao Căng Tay', holdTime: 45, restTime: 25, tip: 'Cổ tay ngay dưới vai, mắt nhìn xuống sàn, hít thở đều đặn.' },
  { name: 'Plank Co Gối (Mountain Climber)', holdTime: 35, restTime: 20, tip: 'Co từng gối hướng về phía ngực nhịp nhàng, kiểm soát lưng dưới.' },
  { name: 'Plank Chạm Vai (Shoulder Taps)', holdTime: 40, restTime: 20, tip: 'Hạn chế lắc lư hông khi đưa tay chạm vào vai đối diện.' },
  { name: 'Plank Nhện (Spider-Man Plank)', holdTime: 35, restTime: 20, tip: 'Đưa đầu gối mở rộng chạm khuỷu tay cùng bên.' },
  { name: 'Plank Nâng Luân Phiên Từng Chân', holdTime: 40, restTime: 20, tip: 'Nâng chân thẳng cách sàn 15cm, siết chặt cơ mông.' }
];

export const formatDurationNice = (totalSeconds) => {
  if (!totalSeconds || totalSeconds <= 0) return '0s';
  const mins = Math.floor(totalSeconds / 60);
  const secs = totalSeconds % 60;
  if (mins > 0 && secs > 0) {
    return `${mins}p ${secs}s`;
  }
  if (mins > 0 && secs === 0) {
    return `${mins} phút`;
  }
  return `${secs}s`;
};

// Hàm tạo Prompt chuyên sâu tối ưu cho tài khoản Gemini Pro kèm toàn bộ Lịch Sử Tập Luyện
export const buildGeminiProPrompt = (userProfile, historySummary) => {
  const record = userProfile.record || 60;
  const height = userProfile.height || 170;
  const weight = userProfile.weight || 65;
  const heightM = height / 100;
  const bmi = (weight / (heightM * heightM)).toFixed(1);
  const goal = userProfile.goal || "Tăng sức bền & Giảm mỡ bụng";
  const level = userProfile.level || "Trung bình";
  const totalWorkouts = historySummary?.totalWorkouts || 0;
  const totalMinutes = historySummary?.totalMinutes || 0;
  const streak = historySummary?.streak || 0;
  const recentSessionsText = historySummary?.recentSessionsText || "Chưa có lịch sử buổi tập trước đó.";

  return `Bạn là Huấn luyện viên Thể hình & Chuyên gia Plank cơ Core cấp cao quốc tế.
Dưới đây là BÁO CÁO TOÀN DIỆN VỀ THỂ TRẠNG & LỊCH SỬ TẬP LUYỆN THỰC TẾ của học viên:

👤 CHỈ SỐ THỂ TRẠNG:
- Giới tính sinh học: ${userProfile.gender === 'female' ? 'Nữ 👩 (Định hướng: Siết eo thon gọn, phẳng bụng dưới, tạo rãnh bụng số 11)' : 'Nam 👨 (Định hướng: Phát triển khối cơ bụng 6 múi dày khỏe, rãnh V-cut, tăng sức mạnh Core)'}
- Chiều cao: ${height} cm | Cân nặng: ${weight} kg | BMI: ${bmi}
- Trình độ thể lực: ${level}
- Mục tiêu chính: ${goal}

📊 THỐNG KÊ LỊCH SỬ TẬP LUYỆN:
- Kỷ lục giữ Plank cao nhất: ${record} giây
- Tổng số buổi tập đã hoàn thành: ${totalWorkouts} buổi
- Tổng thời gian Plank tích lũy: ${totalMinutes} phút
- Chuỗi ngày tập liên tục: ${streak} ngày

🗓️ CHI TIẾT CÁC BUỔI TẬP GẦN NHẤT:
${recentSessionsText}

NHIỆM VỤ CỦA HUẤN LUYỆN VIÊN:
1. Đánh giá phong độ (evaluation): Phân tích chi tiết sự tiến bộ, điểm mạnh và điểm cần cải thiện dựa trên lịch sử tập luyện thực tế trên.
2. Lời khuyên chiến lược (advice): Đưa ra chỉ dẫn cụ thể về kỹ thuật siết cơ Core, nhịp thở và cách phân bổ sức bền để vượt ngưỡng kỷ lục.
3. Thiết kế chuỗi bài tập mới (exercises): Tạo từ 4 đến 6 hiệp bài tập Plank khoa học nhất phù hợp với phong độ hiện tại.

YÊU CẦU ĐẦU RA BẮT BUỘC:
Chỉ trả về DUY NHẤT một chuỗi JSON hợp lệ theo đúng cấu trúc mẫu sau (KHÔNG kèm lời chào hay giải thích ngoài JSON) để ứng dụng PlankAI tự động nạp dữ liệu:
{
  "evaluation": "Nhận xét phân tích phong độ dựa trên lịch sử tập thực tế...",
  "advice": "Lời khuyên chiến lược cải thiện và phát triển cơ Core...",
  "planName": "Tên giáo án cá nhân hóa mới (vd: 7 Ngày Kiến Tạo Cơ Core Vững Chắc)",
  "goal": "${goal}",
  "level": "${level}",
  "exercises": [
    {
      "name": "Plank khuỷu tay chuẩn",
      "holdTime": 50,
      "restTime": 20,
      "tip": "Siết chặt cơ mông và cơ bụng, giữ thẳng từ đầu đến gót chân"
    },
    {
      "name": "Plank nghiêng bên trái",
      "holdTime": 35,
      "restTime": 15,
      "tip": "Nâng cao hông siết chặt cơ liên sườn"
    },
    {
      "name": "Plank nghiêng bên phải",
      "holdTime": 35,
      "restTime": 20,
      "tip": "Giữ thẳng trục cơ thể từ đầu đến gót chân"
    },
    {
      "name": "Plank cao tay duỗi thẳng",
      "holdTime": 45,
      "restTime": 30,
      "tip": "Cổ tay thẳng hàng dưới vai, mắt nhìn xuống sàn"
    }
  ]
}`;
};

// Hàm phân tích thông minh giáo án được dán từ Gemini Pro (hỗ trợ cả JSON và Text tự do)
export const parsePastedWorkoutText = (text) => {
  if (!text || !text.trim()) {
    throw new Error("Nội dung dán vào đang trống. Vui lòng dán câu trả lời từ Gemini Pro.");
  }

  // 1. Thử bóc tách JSON
  try {
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      if (parsed.exercises && Array.isArray(parsed.exercises) && parsed.exercises.length > 0) {
        return {
          planName: parsed.planName || 'Giáo Án Gemini Pro',
          goal: parsed.goal || 'Cá nhân hóa từ Gemini Pro',
          level: parsed.level || 'Trung bình',
          evaluation: parsed.evaluation || 'AI đã phân tích phong độ và tối ưu giáo án theo tiến độ của bạn.',
          advice: parsed.advice || 'Tập trung siết chặt cơ bụng và hít thở đều đặn trong từng hiệp tập.',
          exercises: parsed.exercises.map(e => ({
            name: e.name || 'Plank Biến Thể',
            holdTime: Number(e.holdTime) || 45,
            restTime: Number(e.restTime) || 20,
            tip: e.tip || 'Siết chặt cơ bụng và giữ thẳng lưng'
          }))
        };
      }
      if (parsed.days && parsed.days[0]?.exercises) {
        return {
          planName: parsed.planName || 'Giáo Án Gemini Pro',
          goal: parsed.goal || 'Cá nhân hóa từ Gemini Pro',
          level: parsed.level || 'Trung bình',
          evaluation: parsed.evaluation || 'AI đã phân tích phong độ và tối ưu giáo án theo tiến độ của bạn.',
          advice: parsed.advice || 'Tập trung siết chặt cơ bụng và hít thở đều đặn trong từng hiệp tập.',
          exercises: parsed.days[0].exercises.map(e => ({
            name: e.name || 'Plank Biến Thể',
            holdTime: Number(e.holdTime) || 45,
            restTime: Number(e.restTime) || 20,
            tip: e.tip || 'Siết chặt cơ bụng và giữ thẳng lưng'
          }))
        };
      }
    }
  } catch (e) {
    // Tiếp tục chuyển sang bóc tách văn bản tự do
  }

  // 2. Bóc tách văn bản tự do theo dòng
  const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
  let planName = 'Giáo Án Từ Gemini Pro';
  let evaluation = '';
  let advice = '';
  const extractedExercises = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (line.toLowerCase().includes('đánh giá:') || line.toLowerCase().includes('nhận xét:')) {
      evaluation = line.split(/[:\-–]/)[1]?.trim() || lines[i+1] || '';
      continue;
    }
    if (line.toLowerCase().includes('lời khuyên:') || line.toLowerCase().includes('chiến lược:')) {
      advice = line.split(/[:\-–]/)[1]?.trim() || lines[i+1] || '';
      continue;
    }
    if (line.toLowerCase().includes('tên bài') || line.toLowerCase().includes('giáo án:') || line.startsWith('# ')) {
      planName = line.replace(/^[#*\-:\s]+/, '').replace(/^tên bài[^\w\s]*/i, '').replace(/^giáo án[^\w\s]*/i, '').trim();
      continue;
    }

    const timeMatches = line.match(/(\d+)\s*(?:giây|s|phút|p)/gi);
    if (timeMatches && timeMatches.length >= 1) {
      let name = line.replace(/^\d+[\.\)\-]\s*/, '').split(/[:\-–]/)[0].trim();
      name = name.replace(/[*_#]/g, '').trim();
      if (!name || name.length > 40) name = 'Plank Biến Thể';

      let holdTime = 45;
      let restTime = 20;
      const numMatch = line.match(/(\d+)\s*(?:giây|s)/i);
      if (numMatch) {
        holdTime = parseInt(numMatch[1], 10);
      }
      
      const restMatch = line.match(/nghỉ\s*(\d+)\s*(?:giây|s)/i) || line.match(/rest\s*(\d+)/i);
      if (restMatch) {
        restTime = parseInt(restMatch[1], 10);
      }

      extractedExercises.push({
        name,
        holdTime,
        restTime,
        tip: 'Siết cơ bụng, giữ thẳng lưng'
      });
    }
  }

  if (extractedExercises.length > 0) {
    return {
      planName: planName || 'Giáo Án Gemini Pro',
      goal: 'Thiết kế bởi Gemini Pro',
      level: 'Trung bình',
      evaluation: evaluation || 'Huấn luyện viên AI đã phân tích lịch sử tập luyện và thiết kế bài tập phù hợp nhất.',
      advice: advice || 'Hãy hít thở đều đặn và duy trì nhịp tập luyện kiên trì để đạt hiệu quả tối đa.',
      exercises: extractedExercises
    };
  }

  throw new Error("Không thể nhận diện các bài tập trong nội dung dán. Hãy đảm bảo bạn đã sao chép câu trả lời từ Gemini Pro.");
};

const PlanManager = ({ apiKey, onSelectPlan, onOpenSettings }) => {
  const [view, setView] = useState('library'); // 'library' | 'builder' | 'ai'
  const [plansList, setPlansList] = useState(getAllPlans());
  const [activePlan, setActivePlan] = useState(getActivePlan());
  const [filterType, setFilterType] = useState('all'); // 'all' | 'custom' | 'ai' | 'preset'
  const [expandedPlanId, setExpandedPlanId] = useState(null);

  // State cho Visual Plan Builder (Tự thiết kế / Chỉnh sửa)
  const [editingPlanId, setEditingPlanId] = useState(null);
  const [formPlanName, setFormPlanName] = useState('');
  const [formGoal, setFormGoal] = useState('');
  const [formLevel, setFormLevel] = useState('Trung bình');
  const [formExercises, setFormExercises] = useState([
    { name: 'Plank Khuỷu Tay Tiêu Chuẩn', holdTime: 45, restTime: 20, tip: 'Siết chặt cơ bụng và cơ mông' }
  ]);
  const [deleteConfirmId, setDeleteConfirmId] = useState(null);
  const [duplicateConfirmPlan, setDuplicateConfirmPlan] = useState(null);

  // State cho AI Coach Generator (Gemini Pro Bridge & API)
  const [aiMode, setAiMode] = useState('pro_import'); // 'pro_import' (Khuyên dùng cho gói Pro) | 'api'
  const [profile, setProfile] = useState(getUserProfile());
  const [historySummary, setHistorySummary] = useState(getWorkoutHistorySummaryForAI());
  const [isPromptCopied, setIsPromptCopied] = useState(false);
  const [pasteInputText, setPasteInputText] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState(null);
  const [aiGeneratedPlan, setAiGeneratedPlan] = useState(null);

  // Toast feedback state
  const [toastMessage, setToastMessage] = useState(null);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 2800);
  };

  useEffect(() => {
    setPlansList(getAllPlans());
    setActivePlan(getActivePlan());
  }, []);

  const refreshPlans = () => {
    const all = getAllPlans();
    setPlansList(all);
    setActivePlan(getActivePlan());
  };

  // ==================== 1. XỬ LÝ CHỌN & KÍCH HOẠT GIÁO ÁN ====================
  const handleActivatePlan = (plan) => {
    let sessionPlan = plan;
    // Chuẩn hóa định dạng để Timer luôn nhận diện được
    if (!plan.days && plan.exercises) {
      sessionPlan = {
        id: plan.id,
        planName: plan.planName,
        days: [{ day: 1, title: plan.planName, exercises: plan.exercises }]
      };
    } else if (plan.days && plan.days.length > 0 && !plan.days[0].exercises) {
      sessionPlan = {
        ...plan,
        days: [{ day: 1, title: plan.planName, exercises: plan.exercises || [] }]
      };
    }
    saveActivePlan(sessionPlan);
    setActivePlan(sessionPlan);
    onSelectPlan(sessionPlan);
  };

  // ==================== 2. XỬ LÝ BUILDER (TẠO MỚI / CHỈNH SỬA) ====================
  const handleOpenCreateBuilder = () => {
    setEditingPlanId(null);
    setFormPlanName('Giáo Án Tự Thiết Kế #' + (plansList.filter(p => p.type === 'custom').length + 1));
    setFormGoal('Rèn luyện sức bền cơ bụng & giữ dáng');
    setFormLevel('Trung bình');
    setFormExercises([
      { name: 'Plank Khuỷu Tay Tiêu Chuẩn', holdTime: 45, restTime: 20, tip: 'Siết chặt cơ bụng và cơ mông' },
      { name: 'Side Plank (Nghiêng) Trái', holdTime: 30, restTime: 15, tip: 'Nâng cao hông, giữ thân người thẳng' },
      { name: 'Side Plank (Nghiêng) Phải', holdTime: 30, restTime: 20, tip: 'Đẩy hông cao, siết chặt cơ liên sườn' }
    ]);
    setView('builder');
  };

  const handleOpenAiView = () => {
    setHistorySummary(getWorkoutHistorySummaryForAI());
    setProfile(getUserProfile());
    setView('ai');
  };

  const handleOpenEditBuilder = (plan) => {
    setEditingPlanId(plan.id);
    setFormPlanName(plan.planName || 'Giáo Án Tùy Chỉnh');
    setFormGoal(plan.goal || 'Tập luyện sức bền');
    setFormLevel(plan.level || 'Trung bình');

    let exList = [];
    if (plan.exercises && plan.exercises.length > 0) {
      exList = JSON.parse(JSON.stringify(plan.exercises));
    } else if (plan.days && plan.days[0]?.exercises) {
      exList = JSON.parse(JSON.stringify(plan.days[0].exercises));
    } else {
      exList = [{ name: 'Plank Tiêu Chuẩn', holdTime: 45, restTime: 20, tip: 'Siết bụng thở đều' }];
    }

    setFormExercises(exList);
    setView('builder');
  };

  const handleAddExerciseSet = (preset = null) => {
    const base = preset || EXERCISE_SUGGESTIONS[0];
    setFormExercises([
      ...formExercises,
      {
        name: base.name,
        holdTime: base.holdTime || 45,
        restTime: base.restTime || 20,
        tip: base.tip || 'Siết chặt cơ bụng và hít thở đều'
      }
    ]);
  };

  const handleRemoveExerciseSet = (index) => {
    if (formExercises.length <= 1) return;
    const updated = formExercises.filter((_, idx) => idx !== index);
    setFormExercises(updated);
  };

  const handleUpdateExercise = (index, field, value) => {
    const updated = [...formExercises];
    updated[index] = { ...updated[index], [field]: value };
    setFormExercises(updated);
  };

  const handleSaveCustomPlan = (andActivate = false) => {
    if (!formPlanName.trim()) return;

    const newPlanData = {
      id: editingPlanId || `plan_${Date.now()}`,
      planName: formPlanName.trim(),
      goal: formGoal.trim() || 'Rèn luyện cơ core',
      level: formLevel,
      type: 'custom',
      isDefault: false,
      exercises: formExercises,
      days: [
        {
          day: 1,
          title: formPlanName.trim(),
          exercises: formExercises
        }
      ]
    };

    savePlan(newPlanData);
    refreshPlans();

    if (andActivate) {
      handleActivatePlan(newPlanData);
    } else {
      setView('library');
    }
  };

  // ==================== 3. XỬ LÝ XÓA, NHÂN BẢN & SAO CHÉP ====================
  const handleDeletePlan = (planId) => {
    deletePlan(planId);
    refreshPlans();
    setDeleteConfirmId(null);
    showToast("Đã xóa giáo án thành công.");
  };

  const handleDuplicatePlan = (planId) => {
    const duplicated = duplicatePlan(planId);
    refreshPlans();
    if (duplicated) {
      showToast(`Đã tạo bản sao: "${duplicated.planName}" trong thư viện!`);
    }
  };

  const handleCopyPlanToClipboard = (plan) => {
    try {
      const exs = plan.exercises || plan.days?.[0]?.exercises || [];
      const totalHold = exs.reduce((a, c) => a + (c.holdTime || 0), 0);
      
      let text = `📋 GIÁO ÁN PLANK: ${plan.planName.toUpperCase()}\n`;
      if (plan.goal) text += `🎯 Mục tiêu: ${plan.goal}\n`;
      if (plan.level) text += `⚡ Cấp độ: ${plan.level}\n`;
      text += `⏱️ Tổng thời gian giữ: ${totalHold}s (${Math.round(totalHold / 60)} phút) • ${exs.length} hiệp\n\n`;
      text += `Chi tiết các hiệp bài tập:\n`;
      
      exs.forEach((ex, idx) => {
        text += `${idx + 1}. ${ex.name}: Giữ ${ex.holdTime}s • Nghỉ ${ex.restTime || 20}s`;
        if (ex.tip) text += ` (💡 ${ex.tip})`;
        text += `\n`;
      });
      
      text += `\n📱 Được tạo từ ứng dụng PlankAI`;

      navigator.clipboard.writeText(text).then(() => {
        showToast("Đã sao chép nội dung giáo án! Bạn có thể dán vào Ghi chú (Notes), Zalo...");
      }).catch(() => {
        showToast("Đã sao chép nội dung giáo án vào bộ nhớ tạm!");
      });
    } catch (e) {
      console.error(e);
      showToast("Lỗi sao chép vào bộ nhớ tạm.");
    }
  };

  // ==================== 4. XỬ LÝ GEMINI AI COACH (PRO BRIDGE & API) ====================
  const handleProfileChange = (field, value) => {
    const updated = { ...profile, [field]: value };
    setProfile(updated);
    saveUserProfile(updated);
  };

  // 4.1. Sao chép Prompt cho tài khoản Gemini Pro / Advanced (Kèm dữ liệu lịch sử)
  const handleCopyGeminiProPrompt = () => {
    try {
      const summary = getWorkoutHistorySummaryForAI();
      setHistorySummary(summary);
      const prompt = buildGeminiProPrompt(profile, summary);
      navigator.clipboard.writeText(prompt).then(() => {
        setIsPromptCopied(true);
        setTimeout(() => setIsPromptCopied(false), 2800);
      }).catch(() => {
        setIsPromptCopied(true);
        setTimeout(() => setIsPromptCopied(false), 2800);
      });
    } catch (e) {
      console.error(e);
    }
  };

  // 4.2. Nhập và bóc tách giáo án từ câu trả lời của Gemini Pro
  const handleImportFromPastedText = (customText) => {
    const textToUse = (typeof customText === 'string' ? customText : pasteInputText);
    if (!textToUse || !textToUse.trim()) {
      setAiError("Vui lòng dán câu trả lời của Gemini Pro vào ô bên dưới trước khi bấm Nhập.");
      return;
    }
    setAiError(null);

    try {
      const parsed = parsePastedWorkoutText(textToUse);
      setAiGeneratedPlan(parsed);
      setPasteInputText('');
      showToast(`Đã nhận diện thành công: "${parsed.planName}" (${parsed.exercises.length} hiệp)!`);
    } catch (err) {
      console.error(err);
      setAiError(err.message || "Lỗi đọc dữ liệu giáo án từ Gemini Pro. Vui lòng kiểm tra lại nội dung dán.");
    }
  };

  // 4.3. Dán tự động từ Clipboard
  const handleQuickPasteFromClipboard = async () => {
    try {
      if (navigator.clipboard && navigator.clipboard.readText) {
        const clipText = await navigator.clipboard.readText();
        if (clipText && clipText.trim()) {
          setPasteInputText(clipText);
          handleImportFromPastedText(clipText);
          return;
        }
      }
      showToast("Không tìm thấy nội dung trong bộ nhớ tạm. Hãy dán trực tiếp vào ô bên dưới.");
    } catch (e) {
      showToast("Vui lòng chạm giữ và Dán (Paste) câu trả lời từ Gemini vào ô bên dưới.");
    }
  };

  // 4.4. Mở trực tiếp ứng dụng Gemini trên điện thoại
  const handleOpenGeminiApp = () => {
    try {
      // Thử mở ứng dụng Gemini trên iOS trước, nếu máy chưa cài app sẽ mở qua trình duyệt
      window.location.href = 'google-gemini://';
      setTimeout(() => {
        window.location.href = 'https://gemini.google.com';
      }, 500);
    } catch (e) {
      window.location.href = 'https://gemini.google.com';
    }
  };

  const handleGenerateAIPlan = async () => {
    if (!apiKey || !apiKey.trim()) {
      setAiError("Bạn chưa cài đặt Google Gemini API Key. Vui lòng vào Cài đặt để nhập Key miễn phí.");
      return;
    }

    setAiLoading(true);
    setAiError(null);

    try {
      const summary = getWorkoutHistorySummaryForAI();
      setHistorySummary(summary);
      const generated = await generatePlankPlan(apiKey, profile, summary);
      setAiGeneratedPlan(generated);
    } catch (err) {
      console.error(err);
      setAiError(err.message || "Lỗi tạo giáo án từ Gemini AI. Vui lòng kiểm tra lại API Key hoặc đường truyền mạng.");
    } finally {
      setAiLoading(false);
    }
  };

  const handleSaveAIPlanToLibrary = (andActivate = false) => {
    if (!aiGeneratedPlan) return;

    let exercises = [];
    if (aiGeneratedPlan.days && aiGeneratedPlan.days[0]?.exercises) {
      exercises = aiGeneratedPlan.days[0].exercises;
    }

    const planToSave = {
      id: `ai_${Date.now()}`,
      planName: aiGeneratedPlan.planName || 'Giáo Án AI Gemini Flash',
      goal: aiGeneratedPlan.goal || profile.goal || 'Bứt phá sức bền',
      level: aiGeneratedPlan.level || profile.level || 'Trung bình',
      type: 'ai',
      isDefault: false,
      exercises: exercises,
      days: aiGeneratedPlan.days || [{ day: 1, title: 'Ngày 1', exercises: exercises }]
    };

    savePlan(planToSave);
    refreshPlans();

    if (andActivate) {
      handleActivatePlan(planToSave);
    } else {
      setView('library');
    }
  };

  // Lọc danh sách giáo án
  const filteredPlans = plansList.filter(p => {
    if (filterType === 'all') return true;
    if (filterType === 'custom') return p.type === 'custom';
    if (filterType === 'ai') return p.type === 'ai';
    if (filterType === 'preset') return p.type === 'preset' || p.isDefault;
    return true;
  });

  return (
    <div className="p-4 sm:p-6 space-y-6 pb-24 max-w-lg mx-auto">
      {/* 1. Header Tab Giáo Án */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white flex items-center space-x-2">
            <span>Quản Lý Giáo Án</span>
          </h2>
          <p className="text-xs text-slate-500 dark:text-gray-400 mt-0.5">
            Thiết kế bài tập tùy chỉnh, lưu trữ và tư vấn từ Gemini AI
          </p>
        </div>

        {/* Nút Tạo Mới Nhanh */}
        {view === 'library' && (
          <button
            onClick={handleOpenCreateBuilder}
            className="py-2 px-3 rounded-2xl bg-emerald-500 hover:bg-emerald-600 text-white font-extrabold text-xs flex items-center space-x-1.5 shadow-md shadow-emerald-500/20 active:scale-95 transition-all"
          >
            <Plus size={15} />
            <span>Tạo Mới</span>
          </button>
        )}
      </div>

      {/* 2. Sub-Nav Switcher (Danh sách / Tự thiết kế / Tạo bằng AI) */}
      <div className="flex bg-slate-200 dark:bg-white/10 p-1 rounded-2xl">
        <button
          onClick={() => setView('library')}
          className={`flex-1 py-2 rounded-xl text-xs font-extrabold flex items-center justify-center space-x-1.5 transition-all ${
            view === 'library'
              ? 'bg-white dark:bg-oled text-emerald-600 dark:text-emerald-400 shadow-sm'
              : 'text-slate-600 dark:text-gray-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <BookOpen size={14} />
          <span>Thư Viện ({plansList.length})</span>
        </button>

        <button
          onClick={handleOpenCreateBuilder}
          className={`flex-1 py-2 rounded-xl text-xs font-extrabold flex items-center justify-center space-x-1.5 transition-all ${
            view === 'builder'
              ? 'bg-white dark:bg-oled text-emerald-600 dark:text-emerald-400 shadow-sm'
              : 'text-slate-600 dark:text-gray-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <Edit3 size={14} />
          <span>{editingPlanId ? "Sửa Giáo Án" : "Tự Thiết Kế"}</span>
        </button>

        <button
          onClick={handleOpenAiView}
          className={`flex-1 py-2 rounded-xl text-xs font-extrabold flex items-center justify-center space-x-1.5 transition-all ${
            view === 'ai'
              ? 'bg-white dark:bg-oled text-purple-600 dark:text-purple-400 shadow-sm'
              : 'text-slate-600 dark:text-gray-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <Sparkles size={14} />
          <span>Trợ Lý AI</span>
        </button>
      </div>

      {/* ==================== VIEW 1: THƯ VIỆN GIÁO ÁN (LIBRARY) ==================== */}
      {view === 'library' && (
        <div className="space-y-4">
          {/* Quick Action Cards Banner */}
          <div className="grid grid-cols-2 gap-3">
            <div 
              onClick={handleOpenCreateBuilder}
              className="glass-panel p-4 rounded-3xl border border-emerald-300/40 dark:border-emerald-500/20 hover:border-emerald-500 cursor-pointer active:scale-95 transition-all space-y-2 bg-gradient-to-br from-emerald-50/50 to-teal-50/50 dark:from-emerald-950/20 dark:to-teal-950/20"
            >
              <div className="w-8 h-8 rounded-xl bg-emerald-100 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                <ListPlus size={18} />
              </div>
              <div>
                <h4 className="text-xs font-black text-slate-900 dark:text-white">Tự Thiết Kế</h4>
                <p className="text-[11px] text-slate-500 dark:text-gray-400 mt-0.5">Tự chỉnh số hiệp, thời gian plank và nghỉ</p>
              </div>
            </div>

            <div 
              onClick={() => setView('ai')}
              className="glass-panel p-4 rounded-3xl border border-cyan-300/40 dark:border-cyan-500/20 hover:border-cyan-500 cursor-pointer active:scale-95 transition-all space-y-2 bg-gradient-to-br from-cyan-50/50 to-blue-50/50 dark:from-cyan-950/20 dark:to-blue-950/20"
            >
              <div className="w-8 h-8 rounded-xl bg-cyan-100 dark:bg-cyan-500/20 text-cyan-600 dark:text-cyan-neon flex items-center justify-center">
                <Sparkles size={18} />
              </div>
              <div>
                <h4 className="text-xs font-black text-slate-900 dark:text-white">Tạo Với AI</h4>
                <p className="text-[11px] text-slate-500 dark:text-gray-400 mt-0.5">Gemini phân tích thể lực và tạo bài tối ưu</p>
              </div>
            </div>
          </div>

          {/* Filter Pills */}
          <div className="flex items-center space-x-1.5 overflow-x-auto py-1">
            {[
              { id: 'all', label: 'Tất Cả' },
              { id: 'custom', label: '✍️ Tự Thiết Kế' },
              { id: 'ai', label: '🤖 AI Gemini' },
              { id: 'preset', label: '🛡️ Mẫu Tiêu Chuẩn' }
            ].map(f => (
              <button
                key={f.id}
                onClick={() => setFilterType(f.id)}
                className={`px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all ${
                  filterType === f.id
                    ? 'bg-emerald-500 text-white shadow-sm'
                    : 'bg-slate-200/80 text-slate-700 dark:bg-white/5 dark:text-gray-400 hover:bg-slate-300 dark:hover:bg-white/10'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>

          {/* Plans List Cards */}
          <div className="space-y-3">
            {filteredPlans.map((plan) => {
              const isActive = activePlan?.id === plan.id || activePlan?.planName === plan.planName;
              const exercises = plan.exercises || plan.days?.[0]?.exercises || [];
              const totalHoldSec = exercises.reduce((acc, curr) => acc + (Number(curr.holdTime) || 0), 0);
              const totalRestSec = exercises.slice(0, -1).reduce((acc, curr) => acc + (Number(curr.restTime) || 20), 0);
              const totalWorkoutSec = totalHoldSec + totalRestSec;
              const isExpanded = expandedPlanId === plan.id;

              return (
                <div 
                  key={plan.id}
                  className={`glass-panel rounded-3xl p-5 border transition-all duration-300 relative ${
                    isActive 
                      ? 'border-emerald-500 dark:border-emerald-400 ring-2 ring-emerald-500/20 bg-emerald-50/20 dark:bg-emerald-950/10' 
                      : 'border-slate-200 dark:border-white/10 hover:border-slate-300 dark:hover:border-white/20'
                  }`}
                >
                  {/* Top Header of Card */}
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <div className="flex items-center space-x-2">
                        {/* Type Tag */}
                        <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full ${
                          plan.type === 'custom'
                            ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 border border-amber-300/40'
                            : plan.type === 'ai'
                            ? 'bg-cyan-100 text-cyan-800 dark:bg-cyan-950 dark:text-cyan-neon border border-cyan-300/40'
                            : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-300/40'
                        }`}>
                          {plan.type === 'custom' ? '✍️ Tự Thiết Kế' : (plan.type === 'ai' ? '🤖 AI Gemini' : '🛡️ Mẫu Chuẩn')}
                        </span>

                        {/* Active Badge */}
                        {isActive && (
                          <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-emerald-500 text-white flex items-center space-x-1 shadow-sm">
                            <Check size={11} />
                            <span>ĐANG CHỌN TẬP</span>
                          </span>
                        )}
                      </div>

                      <h3 className="text-sm font-black text-slate-900 dark:text-white pt-1">
                        {plan.planName}
                      </h3>
                      {plan.goal && (
                        <p className="text-[11px] text-slate-500 dark:text-gray-400 line-clamp-1">
                          {plan.goal}
                        </p>
                      )}
                    </div>

                    {/* Level / Total Sets badge */}
                    <div className="text-right shrink-0">
                      <div className="text-xs font-black text-emerald-600 dark:text-emerald-400">
                        {exercises.length} Hiệp
                      </div>
                      <div className="text-[10px] text-slate-400 dark:text-gray-500">
                        {plan.level || 'Cơ bản'}
                      </div>
                    </div>
                  </div>

                  {/* Comprehensive Time Metrics Badges (Format: 10 phút, 1p 30s) */}
                  <div className="grid grid-cols-2 gap-2 mt-3 pt-3 border-t border-slate-200/80 dark:border-white/5">
                    <div className="p-2.5 rounded-2xl bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-300/40 dark:border-emerald-500/20 text-center">
                      <span className="text-[10px] uppercase font-extrabold text-slate-500 dark:text-gray-400 block">
                        🔥 Thời Gian Plank
                      </span>
                      <span className="font-mono text-xs font-black text-emerald-600 dark:text-emerald-400 mt-0.5 block">
                        {formatDurationNice(totalHoldSec)}
                      </span>
                    </div>

                    <div className="p-2.5 rounded-2xl bg-cyan-50/70 dark:bg-cyan-950/30 border border-cyan-300/40 dark:border-cyan-500/20 text-center">
                      <span className="text-[10px] uppercase font-extrabold text-slate-500 dark:text-gray-400 block">
                        ⏱️ Tổng Bài Tập
                      </span>
                      <span className="font-mono text-xs font-black text-cyan-600 dark:text-cyan-neon mt-0.5 block">
                        {formatDurationNice(totalWorkoutSec)}
                      </span>
                    </div>
                  </div>

                  {/* Exercises Preview Summary */}
                  <div className="mt-3 pt-3 border-t border-slate-200/80 dark:border-white/5 space-y-2">
                    <div 
                      onClick={() => setExpandedPlanId(isExpanded ? null : plan.id)}
                      className="flex items-center justify-between text-xs text-slate-600 dark:text-gray-400 cursor-pointer hover:text-slate-900 dark:hover:text-white select-none"
                    >
                      <span className="font-semibold text-[11px]">
                        Xem chi tiết {exercises.length} hiệp bài tập
                      </span>
                      {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                    </div>

                    {/* Expanded Exercises List */}
                    {isExpanded && (
                      <div className="space-y-2 pt-2 animate-fade-in">
                        {exercises.map((ex, idx) => (
                          <div 
                            key={idx}
                            className="p-2.5 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200/60 dark:border-white/5 flex items-center justify-between text-xs"
                          >
                            <div>
                              <div className="font-bold text-slate-800 dark:text-gray-200">
                                {idx + 1}. {ex.name}
                              </div>
                              {ex.tip && (
                                <div className="text-[10px] text-slate-500 dark:text-gray-400 line-clamp-1">
                                  💡 {ex.tip}
                                </div>
                              )}
                            </div>
                            <div className="text-right shrink-0 text-[11px] font-mono">
                              <span className="text-emerald-600 dark:text-emerald-400 font-bold">{ex.holdTime}s giữ</span>
                              <span className="text-slate-400 dark:text-gray-500 ml-1.5">/ {ex.restTime || 20}s nghỉ</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Action Buttons Row */}
                  <div className="flex items-center justify-between pt-4 mt-2 border-t border-slate-200/80 dark:border-white/5 gap-1.5">
                    {/* Select / Start Workout Button */}
                    <button
                      onClick={() => handleActivatePlan(plan)}
                      className={`flex-1 py-2.5 px-3 rounded-2xl font-black text-xs uppercase tracking-wider flex items-center justify-center space-x-1.5 active:scale-95 transition-all shadow-md ${
                        isActive
                          ? 'bg-emerald-500 text-white shadow-emerald-500/20 hover:bg-emerald-600'
                          : 'bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white shadow-emerald-500/20'
                      }`}
                    >
                      <Play size={13} fill="currentColor" />
                      <span>{isActive ? "Bắt Đầu Tập" : "Chọn & Tập"}</span>
                    </button>

                    {/* Copy to Clipboard (Ghi Chú) Button */}
                    <button
                      onClick={() => handleCopyPlanToClipboard(plan)}
                      className="p-2.5 rounded-2xl bg-cyan-50 hover:bg-cyan-100 dark:bg-cyan-500/10 dark:hover:bg-cyan-500/20 text-cyan-700 dark:text-cyan-neon active:scale-95 transition-all"
                      title="Sao chép nội dung ra Ghi chú (Notes)"
                    >
                      <Share2 size={15} />
                    </button>

                    {/* Duplicate (Nhân bản tạo bản sao) Button */}
                    <button
                      onClick={() => setDuplicateConfirmPlan(plan)}
                      className="p-2.5 rounded-2xl bg-slate-100 hover:bg-slate-200 dark:bg-white/10 dark:hover:bg-white/15 text-slate-700 dark:text-gray-300 active:scale-95 transition-all"
                      title="Nhân bản (Tạo 1 bản sao trong thư viện)"
                    >
                      <CopyPlus size={15} />
                    </button>

                    {/* Edit Button */}
                    <button
                      onClick={() => handleOpenEditBuilder(plan)}
                      className="p-2.5 rounded-2xl bg-slate-100 hover:bg-slate-200 dark:bg-white/10 dark:hover:bg-white/15 text-slate-700 dark:text-gray-300 active:scale-95 transition-all"
                      title="Chỉnh sửa giáo án này"
                    >
                      <Edit3 size={15} />
                    </button>

                    {/* Delete Button (Cho phép xóa tất cả giáo án, kể cả mẫu chuẩn) */}
                    <button
                      onClick={() => setDeleteConfirmId(plan.id)}
                      className="p-2.5 rounded-2xl bg-red-50 hover:bg-red-100 dark:bg-red-500/10 dark:hover:bg-red-500/20 text-red-600 dark:text-red-400 active:scale-95 transition-all"
                      title="Xóa giáo án"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Nút khôi phục mẫu chuẩn nếu có mẫu mặc định đã bị xóa */}
          {getDeletedDefaultPlanIds().length > 0 && (
            <div className="text-center pt-2">
              <button
                onClick={() => {
                  restoreDefaultPlans();
                  refreshPlans();
                  showToast("Đã khôi phục lại toàn bộ các mẫu giáo án chuẩn!");
                }}
                className="text-[11px] font-bold text-slate-500 dark:text-gray-400 hover:text-emerald-600 dark:hover:text-neon underline decoration-dotted flex items-center justify-center space-x-1.5 mx-auto active:scale-95 transition-all"
              >
                <RotateCcw size={12} />
                <span>Khôi phục lại các mẫu giáo án chuẩn gốc</span>
              </button>
            </div>
          )}

          {/* Delete Confirmation Modal */}
          {deleteConfirmId && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
              <div className="glass-panel p-6 rounded-3xl max-w-xs w-full text-center space-y-4 shadow-2xl">
                <div className="w-12 h-12 rounded-full bg-red-100 dark:bg-red-500/20 text-red-600 dark:text-red-400 mx-auto flex items-center justify-center">
                  <AlertCircle size={24} />
                </div>
                <div>
                  <h3 className="text-sm font-black text-slate-900 dark:text-white">Xác Nhận Xóa Giáo Án?</h3>
                  <p className="text-xs text-slate-500 dark:text-gray-400 mt-1">
                    Giáo án này sẽ bị xóa vĩnh viễn khỏi thiết bị của bạn.
                  </p>
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={() => setDeleteConfirmId(null)}
                    className="flex-1 py-2.5 rounded-2xl bg-slate-200 dark:bg-white/10 text-slate-700 dark:text-gray-300 font-bold text-xs active:scale-95"
                  >
                    Hủy
                  </button>
                  <button
                    onClick={() => handleDeletePlan(deleteConfirmId)}
                    className="flex-1 py-2.5 rounded-2xl bg-red-500 hover:bg-red-600 text-white font-bold text-xs active:scale-95 shadow-md shadow-red-500/20"
                  >
                    Xóa Ngay
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Duplicate Confirmation Modal */}
          {duplicateConfirmPlan && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
              <div className="glass-panel p-6 rounded-3xl max-w-xs w-full text-center space-y-4 shadow-2xl">
                <div className="w-12 h-12 rounded-full bg-cyan-100 dark:bg-cyan-500/20 text-cyan-600 dark:text-cyan-neon mx-auto flex items-center justify-center">
                  <CopyPlus size={24} />
                </div>
                <div>
                  <h3 className="text-sm font-black text-slate-900 dark:text-white">Nhân Bản Giáo Án?</h3>
                  <p className="text-xs text-slate-500 dark:text-gray-400 mt-1">
                    Hệ thống sẽ tạo 1 bản sao của giáo án <strong className="text-slate-800 dark:text-gray-200">"{duplicateConfirmPlan.planName}"</strong> vào thư viện để bạn tùy chỉnh.
                  </p>
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={() => setDuplicateConfirmPlan(null)}
                    className="flex-1 py-2.5 rounded-2xl bg-slate-200 dark:bg-white/10 text-slate-700 dark:text-gray-300 font-bold text-xs active:scale-95"
                  >
                    Hủy
                  </button>
                  <button
                    onClick={() => {
                      handleDuplicatePlan(duplicateConfirmPlan.id);
                      setDuplicateConfirmPlan(null);
                    }}
                    className="flex-1 py-2.5 rounded-2xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs active:scale-95 shadow-md shadow-cyan-600/20"
                  >
                    Nhân Bản Ngay
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Toast Notification Banner - Placed with ample clearance below header */}
          {toastMessage && (
            <div className="fixed top-24 left-1/2 -translate-x-1/2 z-50 px-5 py-3 rounded-2xl bg-slate-900/95 dark:bg-white/95 text-white dark:text-slate-900 text-xs font-black shadow-2xl backdrop-blur-xl border border-white/20 dark:border-black/10 flex items-center space-x-2.5 animate-fade-in w-[90%] max-w-sm text-center pointer-events-none">
              <CheckCircle2 size={18} className="text-emerald-400 dark:text-emerald-600 shrink-0" />
              <span className="leading-snug">{toastMessage}</span>
            </div>
          )}
        </div>
      )}

      {/* ==================== VIEW 2: VISUAL PLAN BUILDER (TỰ THIẾT KẾ / SỬA) ==================== */}
      {view === 'builder' && (
        <div className="space-y-5">
          {/* Builder Form Top */}
          <div className="glass-panel p-5 rounded-3xl space-y-4 border border-emerald-300/40 dark:border-emerald-500/20">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-black text-slate-900 dark:text-white flex items-center space-x-1.5">
                <Edit3 size={16} className="text-emerald-500" />
                <span>{editingPlanId ? "Chỉnh Sửa Giáo Án" : "Tự Thiết Kế Giáo Án Mới"}</span>
              </h3>
              <button
                onClick={() => setView('library')}
                className="text-xs text-slate-500 hover:text-slate-800 dark:hover:text-white"
              >
                Đóng
              </button>
            </div>

            {/* Plan Name Input */}
            <div>
              <label className="text-[11px] font-extrabold uppercase tracking-wider text-slate-600 dark:text-gray-400 block mb-1">
                Tên Giáo Án
              </label>
              <input
                type="text"
                value={formPlanName}
                onChange={(e) => setFormPlanName(e.target.value)}
                placeholder="Ví dụ: Plank Giảm Mỡ Bụng 5 Phút"
                className="w-full bg-slate-100 dark:bg-white/5 border border-slate-300 dark:border-white/10 rounded-2xl p-3 text-xs font-bold text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-emerald-500 transition-all"
              />
            </div>

            {/* Goal Input */}
            <div>
              <label className="text-[11px] font-extrabold uppercase tracking-wider text-slate-600 dark:text-gray-400 block mb-1">
                Mục Tiêu / Ghi Chú
              </label>
              <input
                type="text"
                value={formGoal}
                onChange={(e) => setFormGoal(e.target.value)}
                placeholder="Ví dụ: Siết chặt cơ core, tập vào mỗi buổi sáng"
                className="w-full bg-slate-100 dark:bg-white/5 border border-slate-300 dark:border-white/10 rounded-2xl p-3 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-emerald-500 transition-all"
              />
            </div>

            {/* Level Selector */}
            <div>
              <label className="text-[11px] font-extrabold uppercase tracking-wider text-slate-600 dark:text-gray-400 block mb-1">
                Cấp Độ Thử Thách
              </label>
              <div className="grid grid-cols-3 gap-2">
                {['Mới bắt đầu', 'Trung bình', 'Nâng cao'].map(lvl => (
                  <button
                    key={lvl}
                    type="button"
                    onClick={() => setFormLevel(lvl)}
                    className={`py-2 rounded-xl text-xs font-bold border transition-all ${
                      formLevel === lvl
                        ? 'bg-emerald-500 text-white border-emerald-500 shadow-sm'
                        : 'bg-slate-100 dark:bg-white/5 text-slate-700 dark:text-gray-300 border-slate-200 dark:border-white/10'
                    }`}
                  >
                    {lvl}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Quick Suggestions Bar */}
          <div>
            <label className="text-[11px] font-extrabold uppercase tracking-wider text-slate-600 dark:text-gray-400 block mb-2 px-1">
              Gợi Ý Thêm Nhanh Các Biến Thể Plank:
            </label>
            <div className="flex space-x-2 overflow-x-auto py-1">
              {EXERCISE_SUGGESTIONS.map((sug, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleAddExerciseSet(sug)}
                  className="shrink-0 px-3 py-1.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300/60 dark:border-emerald-500/30 text-emerald-700 dark:text-emerald-300 text-xs font-bold flex items-center space-x-1 active:scale-95 shadow-sm"
                >
                  <Plus size={12} />
                  <span>{sug.name} ({sug.holdTime}s)</span>
                </button>
              ))}
            </div>
          </div>

          {/* Exercises Sets List in Builder */}
          <div className="space-y-3">
            <div className="flex items-center justify-between px-1">
              <span className="text-xs font-extrabold uppercase text-slate-700 dark:text-gray-300">
                Danh Sách Các Hiệp ({formExercises.length} hiệp)
              </span>
              <span className="text-xs font-mono font-bold text-emerald-600 dark:text-emerald-400">
                Tổng: {formExercises.reduce((a, c) => a + Number(c.holdTime || 0), 0)}s giữ
              </span>
            </div>

            {formExercises.map((ex, index) => (
              <div 
                key={index}
                className="glass-panel p-4 rounded-3xl border border-slate-200 dark:border-white/10 space-y-3 shadow-sm relative"
              >
                {/* Header of each set */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <span className="w-6 h-6 rounded-full bg-emerald-500 text-white text-[11px] font-black flex items-center justify-center">
                      {index + 1}
                    </span>
                    <span className="text-xs font-black text-slate-900 dark:text-white">
                      Hiệp {index + 1}
                    </span>
                  </div>

                  {formExercises.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveExerciseSet(index)}
                      className="text-red-500 hover:text-red-700 p-1 active:scale-90"
                      title="Xóa hiệp này"
                    >
                      <Trash2 size={15} />
                    </button>
                  )}
                </div>

                {/* Exercise Name Input */}
                <div>
                  <input
                    type="text"
                    value={ex.name}
                    onChange={(e) => handleUpdateExercise(index, 'name', e.target.value)}
                    placeholder="Tên bài tập (Plank tiêu chuẩn, Side Plank...)"
                    className="w-full bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl p-2.5 text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>

                {/* Steppers for Hold Time & Rest Time */}
                <div className="grid grid-cols-2 gap-3 pt-1">
                  {/* Hold Time Stepper */}
                  <div className="p-3 rounded-2xl bg-slate-100/80 dark:bg-white/5 border border-slate-200/80 dark:border-white/5 text-center">
                    <span className="text-[10px] font-extrabold uppercase text-slate-500 dark:text-gray-400 block mb-1.5">
                      ⏱️ Thời Gian Giữ
                    </span>
                    <div className="flex items-center justify-center space-x-2">
                      <button
                        type="button"
                        onClick={() => handleUpdateExercise(index, 'holdTime', Math.max(5, Number(ex.holdTime || 45) - 5))}
                        className="w-7 h-7 rounded-lg bg-white dark:bg-white/10 text-slate-700 dark:text-white font-bold flex items-center justify-center shadow-sm active:scale-90"
                      >
                        -5
                      </button>
                      <span className="font-mono text-sm font-black text-emerald-600 dark:text-emerald-400 w-12">
                        {ex.holdTime}s
                      </span>
                      <button
                        type="button"
                        onClick={() => handleUpdateExercise(index, 'holdTime', Number(ex.holdTime || 45) + 5)}
                        className="w-7 h-7 rounded-lg bg-white dark:bg-white/10 text-slate-700 dark:text-white font-bold flex items-center justify-center shadow-sm active:scale-90"
                      >
                        +5
                      </button>
                    </div>
                  </div>

                  {/* Rest Time Stepper */}
                  <div className="p-3 rounded-2xl bg-slate-100/80 dark:bg-white/5 border border-slate-200/80 dark:border-white/5 text-center">
                    <span className="text-[10px] font-extrabold uppercase text-slate-500 dark:text-gray-400 block mb-1.5">
                      ❄️ Thời Gian Nghỉ
                    </span>
                    <div className="flex items-center justify-center space-x-2">
                      <button
                        type="button"
                        onClick={() => handleUpdateExercise(index, 'restTime', Math.max(5, Number(ex.restTime || 20) - 5))}
                        className="w-7 h-7 rounded-lg bg-white dark:bg-white/10 text-slate-700 dark:text-white font-bold flex items-center justify-center shadow-sm active:scale-90"
                      >
                        -5
                      </button>
                      <span className="font-mono text-sm font-black text-cyan-600 dark:text-cyan-neon w-12">
                        {ex.restTime || 20}s
                      </span>
                      <button
                        type="button"
                        onClick={() => handleUpdateExercise(index, 'restTime', Number(ex.restTime || 20) + 5)}
                        className="w-7 h-7 rounded-lg bg-white dark:bg-white/10 text-slate-700 dark:text-white font-bold flex items-center justify-center shadow-sm active:scale-90"
                      >
                        +5
                      </button>
                    </div>
                  </div>
                </div>

                {/* Technique Tip Input */}
                <div>
                  <input
                    type="text"
                    value={ex.tip || ''}
                    onChange={(e) => handleUpdateExercise(index, 'tip', e.target.value)}
                    placeholder="Mẹo tư thế: Siết bụng, thẳng lưng, thở đều..."
                    className="w-full bg-slate-50 dark:bg-white/5 border border-slate-200/80 dark:border-white/5 rounded-xl p-2 text-[11px] text-slate-700 dark:text-gray-300 focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>
            ))}

            {/* Add Set Button */}
            <button
              type="button"
              onClick={() => handleAddExerciseSet()}
              className="w-full py-3.5 rounded-2xl border-2 border-dashed border-emerald-400/60 dark:border-emerald-500/30 hover:border-emerald-500 text-emerald-600 dark:text-emerald-400 font-extrabold text-xs flex items-center justify-center space-x-1.5 active:scale-95 transition-all bg-emerald-50/40 dark:bg-emerald-950/20"
            >
              <PlusCircle size={16} />
              <span>Thêm Hiệp Bài Tập Tiếp Theo</span>
            </button>
          </div>

          {/* Builder Bottom Action Bar */}
          <div className="flex space-x-2 pt-2">
            <button
              type="button"
              onClick={() => setView('library')}
              className="py-3 px-4 rounded-2xl bg-slate-200 dark:bg-white/10 text-slate-800 dark:text-white font-bold text-xs active:scale-95"
            >
              Hủy
            </button>

            <button
              type="button"
              onClick={() => handleSaveCustomPlan(false)}
              className="flex-1 py-3 rounded-2xl bg-slate-800 hover:bg-slate-900 dark:bg-white/20 dark:hover:bg-white/30 text-white font-extrabold text-xs active:scale-95 transition-all"
            >
              Lưu Vào Thư Viện
            </button>

            <button
              type="button"
              onClick={() => handleSaveCustomPlan(true)}
              className="flex-1 py-3 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white font-extrabold text-xs uppercase tracking-wider active:scale-95 transition-all shadow-md shadow-emerald-500/20 flex items-center justify-center space-x-1"
            >
              <Play size={13} fill="currentColor" />
              <span>Lưu & Tập Ngay</span>
            </button>
          </div>
        </div>
      )}

      {/* ==================== VIEW 3: GEMINI AI COACH CONSULTATION ==================== */}
      {view === 'ai' && (
        <div className="space-y-6">
          {/* AI Hero Banner */}
          <div className="relative overflow-hidden rounded-3xl p-5 bg-gradient-to-br from-slate-900 via-slate-800 to-black text-white border border-white/10 shadow-lg">
            <div className="absolute top-0 right-0 w-40 h-40 bg-purple-500/15 rounded-full blur-3xl pointer-events-none" />
            <div className="relative z-10">
              <div className="inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-full bg-purple-500/20 text-purple-300 border border-purple-400/30 text-xs font-bold mb-2">
                <Crown size={13} className="text-amber-300" />
                <span>GEMINI PRO / ADVANCED COACH</span>
              </div>
              <h2 className="text-xl font-black text-white">
                Huấn Luyện Viên AI Đánh Giá & Tư Vấn
              </h2>
              <p className="text-xs text-gray-300 mt-1">
                AI tự động phân tích toàn bộ lịch sử tập luyện thực tế của bạn để đưa ra nhận xét, lời khuyên và thiết kế lộ trình bài tập tối ưu nhất.
              </p>
            </div>
          </div>

          {/* 📊 BÁO CÁO THỂ LỰC & LỊCH SỬ TẬP THỰC TẾ (AI FITNESS AUDIT) */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-extrabold uppercase tracking-wider text-slate-700 dark:text-gray-300 flex items-center space-x-1.5">
                <Activity size={14} className="text-cyan-500" />
                <span>Báo Cáo Lịch Sử Thể Lực Của Bạn</span>
              </label>
              <span className="text-[10px] font-bold text-slate-500 dark:text-gray-400">
                Tự động gửi cho AI
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <div className="p-3 rounded-2xl bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 text-center">
                <div className="text-[10px] font-extrabold uppercase text-slate-500 dark:text-gray-400 flex items-center justify-center space-x-1 mb-1">
                  <Trophy size={12} className="text-amber-500" />
                  <span>Kỷ Lục Max</span>
                </div>
                <div className="font-mono text-base font-black text-amber-500">
                  {profile.record || 60}s
                </div>
              </div>

              <div className="p-3 rounded-2xl bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 text-center">
                <div className="text-[10px] font-extrabold uppercase text-slate-500 dark:text-gray-400 flex items-center justify-center space-x-1 mb-1">
                  <TrendingUp size={12} className="text-emerald-500" />
                  <span>Đã Tập</span>
                </div>
                <div className="font-mono text-base font-black text-emerald-500">
                  {historySummary.totalWorkouts || 0} Buổi
                </div>
              </div>

              <div className="p-3 rounded-2xl bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 text-center">
                <div className="text-[10px] font-extrabold uppercase text-slate-500 dark:text-gray-400 flex items-center justify-center space-x-1 mb-1">
                  <Clock size={12} className="text-cyan-500" />
                  <span>Tích Lũy</span>
                </div>
                <div className="font-mono text-base font-black text-cyan-500">
                  {historySummary.totalMinutes || 0} Phút
                </div>
              </div>

              <div className="p-3 rounded-2xl bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 text-center">
                <div className="text-[10px] font-extrabold uppercase text-slate-500 dark:text-gray-400 flex items-center justify-center space-x-1 mb-1">
                  <Flame size={12} className="text-red-500" />
                  <span>Chuỗi Ngày</span>
                </div>
                <div className="font-mono text-base font-black text-red-500">
                  {historySummary.streak || 0} Ngày
                </div>
              </div>
            </div>
          </div>

          {/* AI Method Switcher (Gói Pro vs API Key) */}
          <div className="flex bg-slate-200/80 dark:bg-white/5 p-1 rounded-2xl">
            <button
              onClick={() => setAiMode('pro_import')}
              className={`flex-1 py-2.5 rounded-xl text-xs font-black flex items-center justify-center space-x-1.5 transition-all ${
                aiMode === 'pro_import'
                  ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-md'
                  : 'text-slate-600 dark:text-gray-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Crown size={14} className="text-amber-300" />
              <span>Dùng Gói Gemini Pro (Khuyên Dùng)</span>
            </button>

            <button
              onClick={() => setAiMode('api')}
              className={`flex-1 py-2.5 rounded-xl text-xs font-black flex items-center justify-center space-x-1.5 transition-all ${
                aiMode === 'api'
                  ? 'bg-white dark:bg-oled text-cyan-600 dark:text-cyan-neon shadow-sm'
                  : 'text-slate-600 dark:text-gray-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Sparkles size={14} />
              <span>Tạo Qua API Key</span>
            </button>
          </div>

          {/* Goal Selector */}
          <div className="space-y-2">
            <label className="text-xs font-extrabold uppercase tracking-wider text-slate-700 dark:text-gray-300 flex items-center space-x-1.5">
              <Target size={14} className="text-emerald-500" />
              <span>Mục Tiêu Thể Hình Của Bạn</span>
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {[
                { id: 'Giảm mỡ bụng & Siết eo', label: '🔥 Giảm mỡ & Siết eo', desc: 'Đốt mỡ nhanh, thon gọn vùng bụng' },
                { id: 'Tăng sức bền & Thể lực Core', label: '⚡ Tăng sức bền Core', desc: 'Gia tăng thời gian giữ tối đa' },
                { id: 'Xây dựng Cơ Bụng 6 Múi', label: '💪 Cơ Bụng 6 Múi', desc: 'Biến thể đa dạng tác động sâu' },
                { id: 'Cải thiện Tư Thế & Giảm Đau Lưng', label: '🧘 Cột Sống Khỏe', desc: 'Củng cố lưng dưới vững vàng' }
              ].map(g => (
                <div
                  key={g.id}
                  onClick={() => handleProfileChange('goal', g.id)}
                  className={`p-3 rounded-2xl border transition-all cursor-pointer ${
                    profile.goal === g.id
                      ? 'bg-purple-50 dark:bg-purple-950/40 border-purple-500 shadow-sm'
                      : 'bg-white dark:bg-white/5 border-slate-200 dark:border-white/10 hover:border-slate-300'
                  }`}
                >
                  <div className="text-xs font-bold text-slate-900 dark:text-white">{g.label}</div>
                  <div className="text-[10px] text-slate-500 dark:text-gray-400 mt-0.5">{g.desc}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Level & Record Adjuster */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-[11px] font-extrabold uppercase tracking-wider text-slate-600 dark:text-gray-400">
                Trình Độ Hiện Tại
              </label>
              <select
                value={profile.level}
                onChange={(e) => handleProfileChange('level', e.target.value)}
                className="w-full bg-slate-100 dark:bg-white/5 border border-slate-300 dark:border-white/10 rounded-2xl p-3 text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:border-purple-500"
              >
                <option value="Mới bắt đầu">Mới bắt đầu (&lt; 30s)</option>
                <option value="Trung bình">Trung bình (30s - 90s)</option>
                <option value="Nâng cao">Nâng cao (&gt; 90s)</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-[11px] font-extrabold uppercase tracking-wider text-slate-600 dark:text-gray-400">
                Kỷ Lục Giữ Max (Giây)
              </label>
              <input
                type="number"
                value={profile.record || 60}
                onChange={(e) => handleProfileChange('record', parseInt(e.target.value) || 30)}
                className="w-full bg-slate-100 dark:bg-white/5 border border-slate-300 dark:border-white/10 rounded-2xl p-3 text-xs font-bold text-slate-900 dark:text-white font-mono focus:outline-none focus:border-purple-500"
              />
            </div>
          </div>

          {/* Error Message if any */}
          {aiError && (
            <div className="p-4 rounded-2xl bg-red-50 dark:bg-red-500/10 border border-red-300 dark:border-red-500/30 text-xs text-red-700 dark:text-red-400 space-y-2">
              <div className="flex items-center space-x-2 font-bold">
                <AlertCircle size={16} />
                <span>Thông Báo</span>
              </div>
              <p className="text-[11px]">{aiError}</p>
            </div>
          )}

          {/* MODE A: GEMINI PRO BRIDGE (Khuyên dùng cho gói Pro) */}
          {aiMode === 'pro_import' && (
            <div className="space-y-4">
              {/* Step 1: Copy Master Prompt */}
              <div className="glass-panel p-4 rounded-3xl border border-purple-400/40 dark:border-purple-500/20 bg-gradient-to-br from-purple-50/50 to-indigo-50/50 dark:from-purple-950/20 dark:to-indigo-950/20 space-y-3">
                <div className="flex items-center space-x-2">
                  <span className="w-6 h-6 rounded-full bg-purple-600 text-white text-xs font-black flex items-center justify-center shadow-sm">
                    1
                  </span>
                  <h4 className="text-xs font-black text-slate-900 dark:text-white">
                    Sao Chép Prompt Kèm Lịch Sử Tập Luyện
                  </h4>
                </div>
                <p className="text-[11px] text-slate-600 dark:text-gray-300">
                  Ứng dụng tự động đóng gói toàn bộ thống kê <strong>{historySummary.totalWorkouts || 0} buổi tập</strong>, kỷ lục <strong>{profile.record || 60}s</strong> và mục tiêu của bạn để Gemini Pro đánh giá chuyên sâu.
                </p>
                <div className="flex space-x-2">
                  <button
                    onClick={handleCopyGeminiProPrompt}
                    className={`flex-1 py-3 px-3 rounded-2xl font-extrabold text-xs flex items-center justify-center space-x-1.5 shadow-md active:scale-95 transition-all ${
                      isPromptCopied 
                        ? 'bg-emerald-600 text-white shadow-emerald-600/30' 
                        : 'bg-purple-600 hover:bg-purple-700 text-white shadow-purple-600/20'
                    }`}
                  >
                    {isPromptCopied ? <Check size={15} className="animate-bounce" /> : <Copy size={14} />}
                    <span>{isPromptCopied ? "✓ Đã Sao Chép Prompt & Lịch Sử!" : "1. Sao Chép Prompt & Lịch Sử"}</span>
                  </button>
                  <a
                    href="https://gemini.google.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="py-3 px-3.5 rounded-2xl bg-purple-100 hover:bg-purple-200 dark:bg-purple-950/60 dark:hover:bg-purple-900/60 text-purple-700 dark:text-purple-300 font-extrabold text-xs flex items-center justify-center space-x-1.5 active:scale-95 transition-all border border-purple-300/40 dark:border-purple-500/30"
                    title="Mở ứng dụng Gemini trên điện thoại"
                  >
                    <ExternalLink size={13} />
                    <span>2. Mở Gemini</span>
                  </a>
                </div>
              </div>

              {/* Step 2: Paste & Import */}
              <div className="glass-panel p-4 rounded-3xl border border-cyan-400/40 dark:border-cyan-500/20 bg-gradient-to-br from-cyan-50/50 to-blue-50/50 dark:from-cyan-950/20 dark:to-blue-950/20 space-y-3">
                <div className="flex items-center space-x-2">
                  <span className="w-6 h-6 rounded-full bg-cyan-600 text-white text-xs font-black flex items-center justify-center shadow-sm">
                    2
                  </span>
                  <h4 className="text-xs font-black text-slate-900 dark:text-white">
                    Dán Đánh Giá & Giáo Án Từ Gemini Pro
                  </h4>
                </div>
                <p className="text-[11px] text-slate-600 dark:text-gray-300">
                  Sau khi Gemini Pro trả lời, bạn sao chép và dán vào đây để App tự động hiển thị nhận xét và nạp bài tập:
                </p>

                <textarea
                  value={pasteInputText}
                  onChange={(e) => setPasteInputText(e.target.value)}
                  placeholder="Chạm giữ để Dán (Paste) câu trả lời từ Gemini Pro vào đây..."
                  rows={3}
                  className="w-full bg-white dark:bg-black/40 border border-slate-300 dark:border-white/10 rounded-2xl p-3 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-cyan-500 resize-none font-mono"
                />

                <div className="flex space-x-2">
                  <button
                    onClick={handleQuickPasteFromClipboard}
                    className="py-2.5 px-3 rounded-2xl bg-slate-100 dark:bg-white/10 text-slate-700 dark:text-gray-300 font-bold text-xs flex items-center space-x-1 active:scale-95 transition-all"
                  >
                    <ClipboardPaste size={14} />
                    <span>Dán Tự Động</span>
                  </button>
                  <button
                    onClick={() => handleImportFromPastedText(pasteInputText)}
                    className="flex-1 py-2.5 px-4 rounded-2xl bg-gradient-to-r from-cyan-500 to-teal-600 hover:from-cyan-400 hover:to-teal-500 text-white font-black text-xs uppercase tracking-wider flex items-center justify-center space-x-1.5 shadow-md shadow-cyan-500/20 active:scale-95 transition-all"
                  >
                    <Sparkles size={14} />
                    <span>3. Nhập & Xem Đánh Giá AI</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* MODE B: DIRECT API GENERATOR */}
          {aiMode === 'api' && (
            <div>
              <button
                onClick={handleGenerateAIPlan}
                disabled={aiLoading}
                className="w-full py-4 rounded-2xl bg-gradient-to-r from-cyan-500 via-teal-500 to-emerald-500 hover:from-cyan-400 hover:to-emerald-400 text-white font-black text-xs uppercase tracking-wider shadow-lg shadow-cyan-500/20 active:scale-95 transition-all flex items-center justify-center space-x-2 disabled:opacity-50"
              >
                {aiLoading ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Sparkles size={16} />
                )}
                <span>{aiLoading ? "AI Đang Phân Tích Lịch Sử & Thiết Kế..." : "Phân Tích & Tạo Giáo Án Qua API Key"}</span>
              </button>
            </div>
          )}

          {/* AI Result Card Preview */}
          {aiGeneratedPlan && (
            <div className="glass-panel p-5 rounded-3xl border border-purple-400/40 dark:border-purple-500/30 space-y-4 animate-fade-in bg-purple-50/10 dark:bg-purple-950/20">
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300 border border-purple-300/40 flex items-center space-x-1 w-fit">
                    <Crown size={11} className="text-amber-500" />
                    <span>ĐÁNH GIÁ & GIÁO ÁN TỪ GEMINI AI</span>
                  </span>
                  <h3 className="text-base font-black text-slate-900 dark:text-white mt-1.5">
                    {aiGeneratedPlan.planName}
                  </h3>
                  <p className="text-xs text-slate-600 dark:text-gray-300 mt-0.5">
                    Mục tiêu: {aiGeneratedPlan.goal} • Trình độ: {aiGeneratedPlan.level}
                  </p>
                </div>
              </div>

              {/* 🌟 AI Evaluation Section */}
              {aiGeneratedPlan.evaluation && (
                <div className="p-3.5 rounded-2xl bg-purple-500/10 border border-purple-400/30 space-y-1">
                  <div className="text-[11px] font-black text-purple-700 dark:text-purple-300 flex items-center space-x-1">
                    <Activity size={13} />
                    <span>Đánh Giá Phong Độ Từ Huấn Luyện Viên AI:</span>
                  </div>
                  <p className="text-xs text-slate-700 dark:text-gray-200 leading-relaxed italic">
                    "{aiGeneratedPlan.evaluation}"
                  </p>
                </div>
              )}

              {/* 💡 AI Strategic Advice Section */}
              {aiGeneratedPlan.advice && (
                <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-400/30 space-y-1">
                  <div className="text-[11px] font-black text-amber-700 dark:text-amber-300 flex items-center space-x-1">
                    <Sparkles size={13} />
                    <span>Lời Khuyên Chiến Lược & Kỹ Thuật:</span>
                  </div>
                  <p className="text-xs text-slate-700 dark:text-gray-200 leading-relaxed">
                    {aiGeneratedPlan.advice}
                  </p>
                </div>
              )}

              {/* Exercises in AI Plan */}
              <div className="space-y-2 pt-1">
                <div className="text-[11px] font-extrabold uppercase tracking-wider text-slate-600 dark:text-gray-400">
                  Chuỗi Hiệp Bài Tập Được Cá Nhân Hóa ({((aiGeneratedPlan.exercises || aiGeneratedPlan.days?.[0]?.exercises) || []).length} Hiệp)
                </div>
                {(aiGeneratedPlan.exercises || aiGeneratedPlan.days?.[0]?.exercises || []).map((ex, idx) => (
                  <div key={idx} className="p-3 rounded-2xl bg-white/80 dark:bg-white/5 border border-slate-200/80 dark:border-white/5 flex items-center justify-between text-xs">
                    <div>
                      <div className="font-bold text-slate-900 dark:text-white">
                        {idx + 1}. {ex.name}
                      </div>
                      {ex.tip && (
                        <div className="text-[10px] text-slate-500 dark:text-gray-400 mt-0.5">
                          💡 {ex.tip}
                        </div>
                      )}
                    </div>
                    <div className="text-right shrink-0 font-mono text-[11px]">
                      <span className="text-emerald-600 dark:text-emerald-400 font-bold">{ex.holdTime}s</span>
                      <span className="text-slate-400 ml-1">/ {ex.restTime || 20}s</span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Action Buttons for AI Plan */}
              <div className="flex space-x-2 pt-2">
                <button
                  onClick={() => handleSaveAIPlanToLibrary(false)}
                  className="flex-1 py-3 rounded-2xl bg-slate-200 hover:bg-slate-300 dark:bg-white/10 dark:hover:bg-white/20 text-slate-800 dark:text-white font-extrabold text-xs active:scale-95 transition-all"
                >
                  Lưu Vào Thư Viện
                </button>

                <button
                  onClick={() => handleSaveAIPlanToLibrary(true)}
                  className="flex-1 py-3 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white font-extrabold text-xs uppercase tracking-wider active:scale-95 transition-all shadow-md shadow-emerald-500/20 flex items-center justify-center space-x-1"
                >
                  <Play size={13} fill="currentColor" />
                  <span>Lưu & Bắt Đầu Tập</span>
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default PlanManager;
