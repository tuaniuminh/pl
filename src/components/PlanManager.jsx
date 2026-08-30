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
  FileText
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
  duplicatePlan 
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

  // State cho AI Coach Generator
  const [profile, setProfile] = useState(getUserProfile());
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState(null);
  const [aiGeneratedPlan, setAiGeneratedPlan] = useState(null);

  // Toast feedback state
  const [toastMessage, setToastMessage] = useState(null);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 2600);
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

  // ==================== 4. XỬ LÝ GEMINI AI COACH ====================
  const handleProfileChange = (field, value) => {
    const updated = { ...profile, [field]: value };
    setProfile(updated);
    saveUserProfile(updated);
  };

  const handleGenerateAIPlan = async () => {
    if (!apiKey || !apiKey.trim()) {
      setAiError("Bạn chưa cài đặt Google Gemini API Key. Vui lòng vào Cài đặt để nhập Key miễn phí.");
      return;
    }

    setAiLoading(true);
    setAiError(null);

    try {
      const generated = await generatePlankPlan(apiKey, profile);
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
    <div className="p-4 sm:p-6 space-y-6 pb-36 max-w-lg mx-auto">
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
          onClick={() => setView('ai')}
          className={`flex-1 py-2 rounded-xl text-xs font-extrabold flex items-center justify-center space-x-1.5 transition-all ${
            view === 'ai'
              ? 'bg-white dark:bg-oled text-cyan-600 dark:text-cyan-neon shadow-sm'
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
              const totalHoldTime = exercises.reduce((acc, curr) => acc + (curr.holdTime || 0), 0);
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
                        {exercises.length} Hiệp ({totalHoldTime}s)
                      </div>
                      <div className="text-[10px] text-slate-400 dark:text-gray-500">
                        {plan.level || 'Cơ bản'}
                      </div>
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
                      onClick={() => handleDuplicatePlan(plan.id)}
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

                    {/* Delete Button (Chỉ cho phép xóa giáo án tự tạo / AI, không xóa preset mặc định) */}
                    {!plan.isDefault && (
                      <button
                        onClick={() => setDeleteConfirmId(plan.id)}
                        className="p-2.5 rounded-2xl bg-red-50 hover:bg-red-100 dark:bg-red-500/10 dark:hover:bg-red-500/20 text-red-600 dark:text-red-400 active:scale-95 transition-all"
                        title="Xóa giáo án"
                      >
                        <Trash2 size={15} />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

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

          {/* Toast Notification Banner */}
          {toastMessage && (
            <div className="fixed top-16 left-1/2 -translate-x-1/2 z-50 px-4 py-2.5 rounded-2xl bg-slate-900/95 dark:bg-white/95 text-white dark:text-slate-900 text-xs font-extrabold shadow-2xl backdrop-blur-md border border-white/20 dark:border-black/10 flex items-center space-x-2 animate-fade-in max-w-xs text-center pointer-events-none">
              <CheckCircle2 size={16} className="text-emerald-400 dark:text-emerald-600 shrink-0" />
              <span className="line-clamp-2">{toastMessage}</span>
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
            <div className="absolute top-0 right-0 w-40 h-40 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
            <div className="relative z-10">
              <div className="inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-full bg-cyan-500/20 text-cyan-neon border border-cyan-400/30 text-xs font-bold mb-2">
                <Sparkles size={13} className="animate-spin" style={{ animationDuration: '4s' }} />
                <span>GEMINI 3.7 FLASH COACH</span>
              </div>
              <h2 className="text-xl font-black text-white">
                Tư Vấn Giáo Án Cá Nhân Hóa
              </h2>
              <p className="text-xs text-gray-300 mt-1">
                Gemini AI sẽ phân tích thể lực và mục tiêu của bạn để thiết kế chuỗi bài tập tối ưu nhất.
              </p>
            </div>
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
                      ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-500 shadow-sm'
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
                className="w-full bg-slate-100 dark:bg-white/5 border border-slate-300 dark:border-white/10 rounded-2xl p-3 text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500"
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
                className="w-full bg-slate-100 dark:bg-white/5 border border-slate-300 dark:border-white/10 rounded-2xl p-3 text-xs font-bold text-slate-900 dark:text-white font-mono focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          {/* Error Message if any */}
          {aiError && (
            <div className="p-4 rounded-2xl bg-red-50 dark:bg-red-500/10 border border-red-300 dark:border-red-500/30 text-xs text-red-700 dark:text-red-400 space-y-2">
              <div className="flex items-center space-x-2 font-bold">
                <AlertCircle size={16} />
                <span>Không Thể Tạo Giáo Án</span>
              </div>
              <p className="text-[11px]">{aiError}</p>
              {onOpenSettings && (
                <button
                  onClick={onOpenSettings}
                  className="px-3 py-1.5 rounded-xl bg-red-600 text-white font-bold text-[11px] shadow-sm"
                >
                  Mở Cài Đặt Để Nhập Key
                </button>
              )}
            </div>
          )}

          {/* Generate Button */}
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
            <span>{aiLoading ? "Gemini AI Đang Phân Tích & Thiết Kế..." : "Tạo Giáo Án Cá Nhân Hóa Với Gemini AI"}</span>
          </button>

          {/* AI Result Card Preview */}
          {aiGeneratedPlan && (
            <div className="glass-panel p-5 rounded-3xl border border-cyan-400/40 dark:border-cyan-500/30 space-y-4 animate-fade-in bg-cyan-50/10 dark:bg-cyan-950/20">
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full bg-cyan-100 text-cyan-800 dark:bg-cyan-950 dark:text-cyan-neon border border-cyan-300/40">
                    🤖 KẾT QUẢ TỪ GEMINI AI
                  </span>
                  <h3 className="text-base font-black text-slate-900 dark:text-white mt-1.5">
                    {aiGeneratedPlan.planName}
                  </h3>
                  <p className="text-xs text-slate-600 dark:text-gray-300 mt-0.5">
                    {aiGeneratedPlan.goal}
                  </p>
                </div>
              </div>

              {/* Exercises in AI Plan */}
              <div className="space-y-2">
                {(aiGeneratedPlan.days?.[0]?.exercises || []).map((ex, idx) => (
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
                      <span className="text-slate-400 ml-1">/ {ex.restTime}s</span>
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
