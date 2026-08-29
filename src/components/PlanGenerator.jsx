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
  Layers
} from 'lucide-react';
import { generatePlankPlan, getPredefinedPlans } from '../services/geminiService';
import { getUserProfile, saveUserProfile, saveActivePlan, addSavedPlan, getSavedPlans } from '../services/storageService';

const PlanGenerator = ({ apiKey, onSelectPlan, onOpenSettings }) => {
  const [profile, setProfile] = useState(getUserProfile());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [generatedPlan, setGeneratedPlan] = useState(null);
  const [selectedDay, setSelectedDay] = useState(1);
  const [activeTab, setActiveTab] = useState('create'); // 'create', 'saved', 'templates'
  const [savedPlans, setSavedPlans] = useState(getSavedPlans());
  const [templatePlans] = useState(getPredefinedPlans());

  const goalOptions = [
    { id: 'Giảm mỡ bụng & Siết eo', label: '🔥 Giảm mỡ bụng & Siết eo', desc: 'Đốt mỡ nhanh, thon gọn vùng bụng' },
    { id: 'Tăng sức bền & Thể lực Core', label: '⚡ Tăng sức bền Core', desc: 'Gia tăng thời gian giữ plank tối đa' },
    { id: 'Xây dựng Cơ Bụng 6 Múi', label: '💪 Cơ Bụng 6 Múi', desc: 'Biến thể đa dạng tác động toàn bộ nhóm cơ' },
    { id: 'Cải thiện Tư Thế & Giảm Đau Lưng', label: '🧘 Cải thiện Tư Thế', desc: 'Nhẹ nhàng, củng cố cột sống vững vàng' },
  ];

  const levelOptions = [
    { id: 'Mới bắt đầu', label: 'Mới bắt đầu (< 30s)' },
    { id: 'Trung bình', label: 'Trung bình (30s - 90s)' },
    { id: 'Nâng cao', label: 'Nâng cao (> 90s)' }
  ];

  const frequencyOptions = [
    '3 buổi/tuần',
    '4 buổi/tuần',
    '5 buổi/tuần',
    'Hàng ngày (7 ngày)'
  ];

  const handleProfileChange = (field, value) => {
    const updated = { ...profile, [field]: value };
    setProfile(updated);
    saveUserProfile(updated);
  };

  const handleGeneratePlan = async () => {
    if (!apiKey || !apiKey.trim()) {
      setError("Bạn chưa cấu hình Google Gemini API Key. Hãy vào Cài đặt để nhập Key miễn phí.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const plan = await generatePlankPlan(apiKey, profile);
      setGeneratedPlan(plan);
      setSelectedDay(1);
      const saved = addSavedPlan(plan);
      setSavedPlans(getSavedPlans());
    } catch (err) {
      console.error(err);
      setError(err.message || "Không thể tạo giáo án từ Gemini AI. Vui lòng kiểm tra lại API Key hoặc kết nối mạng.");
    } finally {
      setLoading(false);
    }
  };

  const handleStartWorkout = (plan, dayIndex = 0) => {
    const dayData = plan.days[dayIndex] || plan.days[0];
    const sessionPlan = {
      planName: `${plan.planName} (Ngày ${dayData.day || (dayIndex + 1)})`,
      dayTitle: dayData.title || `Ngày ${dayData.day}`,
      days: [dayData]
    };
    saveActivePlan(sessionPlan);
    onSelectPlan(sessionPlan);
  };

  return (
    <div className="p-4 sm:p-6 space-y-6 pb-28 max-w-lg mx-auto">
      {/* AI Coach Header Banner */}
      <div className="relative overflow-hidden rounded-3xl p-5 bg-gradient-to-br from-slate-900 via-slate-800 to-black text-white border border-white/10 shadow-lg dark:shadow-card-glow">
        <div className="absolute top-0 right-0 w-40 h-40 bg-neon/10 rounded-full blur-3xl pointer-events-none" />
        <div className="flex items-start justify-between relative z-10">
          <div>
            <div className="inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-full bg-neon/15 text-neon border border-neon/30 text-xs font-bold mb-2.5">
              <Sparkles size={13} className="animate-spin" style={{ animationDuration: '4s' }} />
              <span>GEMINI 3.7 FLASH COACH</span>
            </div>
            <h2 className="text-2xl font-black tracking-tight text-white">
              Thiết Kế Giáo Án AI
            </h2>
            <p className="text-xs text-gray-300 mt-1 max-w-xs">
              AI sẽ phân tích kỷ lục và mục tiêu của bạn để tạo lộ trình luyện tập chuẩn khoa học.
            </p>
          </div>
        </div>

        {/* API Key Missing Notification Alert */}
        {!apiKey && (
          <div className="mt-4 p-3 rounded-2xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-between text-xs">
            <div className="flex items-center space-x-2 text-amber-300">
              <AlertCircle size={16} className="shrink-0" />
              <span>Chưa nhập API Key Gemini</span>
            </div>
            <button 
              onClick={onOpenSettings}
              className="px-3 py-1 bg-amber-400 text-black font-bold rounded-xl text-[11px] hover:bg-amber-300 transition-all shrink-0"
            >
              Nhập ngay
            </button>
          </div>
        )}
      </div>

      {/* Tabs Switcher: Tạo Mới | Mẫu Sẵn Có | Đã Lưu */}
      <div className="grid grid-cols-3 gap-1.5 p-1 bg-slate-200 dark:bg-darkCard rounded-2xl border border-slate-300 dark:border-darkBorder">
        <button
          onClick={() => setActiveTab('create')}
          className={`py-2 text-xs font-bold rounded-xl transition-all flex items-center justify-center space-x-1 ${
            activeTab === 'create'
              ? 'bg-emerald-500 text-white dark:bg-neon dark:text-black shadow-sm dark:shadow-neon'
              : 'text-slate-600 dark:text-gray-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <Sparkles size={14} />
          <span>Tạo Với AI</span>
        </button>
        <button
          onClick={() => setActiveTab('templates')}
          className={`py-2 text-xs font-bold rounded-xl transition-all flex items-center justify-center space-x-1 ${
            activeTab === 'templates'
              ? 'bg-emerald-500 text-white dark:bg-neon dark:text-black shadow-sm dark:shadow-neon'
              : 'text-slate-600 dark:text-gray-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <BookOpen size={14} />
          <span>Mẫu Có Sẵn</span>
        </button>
        <button
          onClick={() => setActiveTab('saved')}
          className={`py-2 text-xs font-bold rounded-xl transition-all flex items-center justify-center space-x-1 ${
            activeTab === 'saved'
              ? 'bg-emerald-500 text-white dark:bg-neon dark:text-black shadow-sm dark:shadow-neon'
              : 'text-slate-600 dark:text-gray-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <Layers size={14} />
          <span>Đã Tạo ({savedPlans.length})</span>
        </button>
      </div>

      {/* TAB 1: FORM TẠO GIÁO ÁN VỚI AI */}
      {activeTab === 'create' && (
        <div className="space-y-5">
          {/* Error Message */}
          {error && (
            <div className="p-4 rounded-2xl bg-red-100 dark:bg-red-500/10 border border-red-300 dark:border-red-500/30 text-red-700 dark:text-red-400 text-xs flex items-start space-x-2.5">
              <AlertCircle size={18} className="shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="font-semibold">{error}</p>
              </div>
            </div>
          )}

          {/* Form Input Fields */}
          <div className="glass-panel p-5 rounded-3xl space-y-5">
            {/* 1. Kỷ Lục Giữ Plank */}
            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-gray-300 flex items-center space-x-1.5">
                  <Clock size={14} className="text-emerald-600 dark:text-neon" />
                  <span>Kỷ Lục Plank Tối Đa Của Bạn</span>
                </label>
                <span className="font-mono text-base font-extrabold text-emerald-600 dark:text-neon">
                  {profile.record} giây
                </span>
              </div>
              <input
                type="range"
                min="10"
                max="240"
                step="5"
                value={profile.record}
                onChange={(e) => handleProfileChange('record', parseInt(e.target.value))}
                className="w-full accent-emerald-500 dark:accent-neon h-2 bg-slate-200 dark:bg-white/10 rounded-lg cursor-pointer"
              />
              {/* Quick Select Buttons */}
              <div className="flex justify-between mt-2.5 gap-1.5">
                {[30, 45, 60, 90, 120, 180].map((sec) => (
                  <button
                    key={sec}
                    type="button"
                    onClick={() => handleProfileChange('record', sec)}
                    className={`flex-1 py-1.5 text-[11px] font-bold rounded-xl border transition-all ${
                      profile.record === sec
                        ? 'bg-emerald-500 text-white border-emerald-500 dark:bg-neon dark:text-black dark:border-neon shadow-sm'
                        : 'bg-slate-100 dark:bg-white/5 border-slate-300 dark:border-white/10 text-slate-700 dark:text-gray-400 hover:bg-slate-200 dark:hover:text-white'
                    }`}
                  >
                    {sec}s
                  </button>
                ))}
              </div>
            </div>

            {/* 2. Mục Tiêu Tập Luyện */}
            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-gray-300 flex items-center space-x-1.5 mb-2.5">
                <Target size={14} className="text-cyan-600 dark:text-cyan-neon" />
                <span>Mục Tiêu Chính</span>
              </label>
              <div className="grid grid-cols-1 gap-2">
                {goalOptions.map((g) => (
                  <div
                    key={g.id}
                    onClick={() => handleProfileChange('goal', g.id)}
                    className={`p-3 rounded-2xl border cursor-pointer transition-all flex items-center justify-between ${
                      profile.goal === g.id
                        ? 'bg-cyan-50 dark:bg-cyan-neon/10 border-cyan-500 dark:border-cyan-neon text-cyan-950 dark:text-white shadow-sm dark:shadow-cyan-glow'
                        : 'bg-slate-50 dark:bg-white/5 border-slate-200 dark:border-white/10 text-slate-700 dark:text-gray-400 hover:border-slate-300 dark:hover:border-white/20'
                    }`}
                  >
                    <div>
                      <div className="text-xs font-bold text-slate-900 dark:text-gray-200">{g.label}</div>
                      <div className="text-[11px] text-slate-500 dark:text-gray-400 mt-0.5">{g.desc}</div>
                    </div>
                    {profile.goal === g.id && (
                      <CheckCircle2 size={16} className="text-cyan-600 dark:text-cyan-neon shrink-0" />
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* 3. Tần Suất & Cấp Độ */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-gray-300 block mb-2">
                  Tần Suất
                </label>
                <select
                  value={profile.frequency}
                  onChange={(e) => handleProfileChange('frequency', e.target.value)}
                  className="w-full bg-slate-100 dark:bg-white/5 border border-slate-300 dark:border-white/10 rounded-xl p-2.5 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500 dark:focus:border-neon"
                >
                  {frequencyOptions.map((f) => (
                    <option key={f} value={f} className="bg-white dark:bg-darkCard text-slate-900 dark:text-white">
                      {f}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-gray-300 block mb-2">
                  Trình Độ
                </label>
                <select
                  value={profile.level}
                  onChange={(e) => handleProfileChange('level', e.target.value)}
                  className="w-full bg-slate-100 dark:bg-white/5 border border-slate-300 dark:border-white/10 rounded-xl p-2.5 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500 dark:focus:border-neon"
                >
                  {levelOptions.map((l) => (
                    <option key={l.id} value={l.id} className="bg-white dark:bg-darkCard text-slate-900 dark:text-white">
                      {l.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* 4. Ghi Chú Riêng */}
            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-gray-300 block mb-1.5">
                Yêu Cầu Riêng Cho AI (Không bắt buộc)
              </label>
              <input
                type="text"
                placeholder="VD: Tránh đau cổ tay, tập trung cơ liên sườn..."
                value={profile.notes || ''}
                onChange={(e) => handleProfileChange('notes', e.target.value)}
                className="w-full bg-slate-100 dark:bg-white/5 border border-slate-300 dark:border-white/10 rounded-xl p-3 text-xs text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-gray-600 focus:outline-none focus:border-emerald-500 dark:focus:border-neon"
              />
            </div>
          </div>

          {/* Action Button: Generate AI Plan */}
          <button
            onClick={handleGeneratePlan}
            disabled={loading}
            className={`w-full py-4 rounded-2xl font-black text-sm uppercase tracking-wider flex items-center justify-center space-x-2 transition-all active:scale-95 shadow-md dark:shadow-neon-lg ${
              loading
                ? 'bg-slate-300 text-slate-500 dark:bg-gray-800 dark:text-gray-400 cursor-not-allowed'
                : 'bg-emerald-500 hover:bg-emerald-600 text-white dark:bg-neon dark:hover:bg-neon-dark dark:text-black'
            }`}
          >
            {loading ? (
              <>
                <div className="w-5 h-5 border-2 border-white dark:border-black border-t-transparent rounded-full animate-spin" />
                <span>AI Đang Phân Tích & Soạn Giáo Án...</span>
              </>
            ) : (
              <>
                <Zap size={18} fill="currentColor" />
                <span>Tạo Giáo Án Cá Nhân Hóa Bằng AI</span>
              </>
            )}
          </button>

          {/* KẾT QUẢ GIÁO ÁN VỪA TẠO (NẾU CÓ) */}
          {generatedPlan && (
            <div className="glass-panel p-5 rounded-3xl border border-emerald-400 dark:border-neon/40 shadow-md dark:shadow-neon space-y-4 animate-fade-in">
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-neon/20 dark:text-neon">
                    ✨ Giáo Án Đã Sẵn Sàng
                  </span>
                  <h3 className="text-lg font-black text-slate-900 dark:text-white mt-1">
                    {generatedPlan.planName}
                  </h3>
                  <p className="text-xs text-slate-600 dark:text-gray-400 mt-0.5">
                    {generatedPlan.description}
                  </p>
                </div>
              </div>

              {/* Day Selector */}
              {generatedPlan.days && generatedPlan.days.length > 1 && (
                <div className="flex space-x-2 overflow-x-auto py-1">
                  {generatedPlan.days.map((d, index) => (
                    <button
                      key={index}
                      onClick={() => setSelectedDay(d.day || (index + 1))}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                        selectedDay === (d.day || (index + 1))
                          ? 'bg-cyan-500 text-white dark:bg-cyan-neon dark:text-black shadow-sm dark:shadow-cyan-glow'
                          : 'bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-gray-400 hover:bg-slate-200 dark:hover:text-white'
                      }`}
                    >
                      Ngày {d.day || (index + 1)}
                    </button>
                  ))}
                </div>
              )}

              {/* Current Selected Day Exercises */}
              {(() => {
                const dayObj = generatedPlan.days.find(d => (d.day || 1) === selectedDay) || generatedPlan.days[0];
                return (
                  <div className="space-y-2.5">
                    <div className="text-xs font-bold text-slate-800 dark:text-gray-300 flex items-center justify-between">
                      <span>{dayObj.title || `Lịch Tập Ngày ${selectedDay}`}</span>
                      <span className="text-cyan-600 dark:text-cyan-neon">{dayObj.focus || 'Tổng Hợp'}</span>
                    </div>

                    <div className="space-y-2">
                      {dayObj.exercises.map((ex, i) => (
                        <div
                          key={i}
                          className="p-3 rounded-2xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/5 flex items-center justify-between"
                        >
                          <div>
                            <div className="text-xs font-bold text-slate-900 dark:text-white flex items-center space-x-2">
                              <span className="w-5 h-5 rounded-full bg-slate-200 dark:bg-white/10 text-emerald-600 dark:text-neon flex items-center justify-center text-[10px]">
                                {i + 1}
                              </span>
                              <span>{ex.name}</span>
                            </div>
                            {ex.tip && (
                              <div className="text-[11px] text-slate-500 dark:text-gray-400 mt-1 pl-7">
                                💡 {ex.tip}
                              </div>
                            )}
                          </div>
                          <div className="text-right pl-2 shrink-0">
                            <div className="font-mono text-xs font-bold text-emerald-600 dark:text-neon">
                              {ex.holdTime}s
                            </div>
                            <div className="text-[10px] text-slate-500 dark:text-gray-400">
                              Nghỉ {ex.restTime}s
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Nút Bắt Đầu Tập Ngay */}
                    <button
                      onClick={() => handleStartWorkout(generatedPlan, selectedDay - 1)}
                      className="w-full mt-3 py-3.5 rounded-2xl bg-emerald-500 text-white dark:bg-neon dark:text-black font-extrabold text-xs uppercase tracking-wider flex items-center justify-center space-x-2 shadow-md dark:shadow-neon active:scale-95 transition-all"
                    >
                      <Play size={16} fill="currentColor" />
                      <span>Nạp Vào Đồng Hồ & Tập Ngày Này Ngay</span>
                    </button>
                  </div>
                );
              })()}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: MẪU CÓ SẴN (TEMPLATES) */}
      {activeTab === 'templates' && (
        <div className="space-y-4">
          {templatePlans.map((tpl, idx) => (
            <div key={idx} className="glass-panel p-5 rounded-3xl space-y-3">
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-cyan-100 text-cyan-800 dark:bg-cyan-neon/15 dark:text-cyan-neon">
                    {tpl.level}
                  </span>
                  <h3 className="text-base font-black text-slate-900 dark:text-white mt-1.5">{tpl.planName}</h3>
                  <p className="text-xs text-slate-600 dark:text-gray-400 mt-1">{tpl.description}</p>
                </div>
              </div>

              <div className="border-t border-slate-200 dark:border-white/5 pt-3 space-y-2">
                {tpl.days[0].exercises.map((ex, i) => (
                  <div key={i} className="flex justify-between items-center text-xs py-1">
                    <span className="text-slate-700 dark:text-gray-300">{i + 1}. {ex.name}</span>
                    <span className="font-mono font-bold text-emerald-600 dark:text-neon">{ex.holdTime}s (Nghỉ {ex.restTime}s)</span>
                  </div>
                ))}
              </div>

              <button
                onClick={() => handleStartWorkout(tpl, 0)}
                className="w-full py-3 rounded-2xl bg-slate-100 hover:bg-emerald-500 hover:text-white dark:bg-white/10 dark:hover:bg-neon dark:hover:text-black text-slate-800 dark:text-white font-bold text-xs uppercase tracking-wider flex items-center justify-center space-x-1.5 transition-all active:scale-95"
              >
                <Play size={14} fill="currentColor" />
                <span>Bắt Đầu Tập Giáo Án Này</span>
              </button>
            </div>
          ))}
        </div>
      )}

      {/* TAB 3: GIÁO ÁN ĐÃ LƯU (SAVED PLANS) */}
      {activeTab === 'saved' && (
        <div className="space-y-4">
          {savedPlans.length === 0 ? (
            <div className="text-center py-12 glass-panel rounded-3xl p-6">
              <Layers size={40} className="mx-auto text-slate-400 dark:text-gray-600 mb-3" />
              <h4 className="text-sm font-bold text-slate-800 dark:text-gray-300">Chưa có giáo án nào được lưu</h4>
              <p className="text-xs text-slate-500 dark:text-gray-400 mt-1">
                Hãy chuyển sang tab "Tạo Với AI" để tạo giáo án đầu tiên của bạn!
              </p>
            </div>
          ) : (
            savedPlans.map((saved, idx) => (
              <div key={idx} className="glass-panel p-5 rounded-3xl space-y-3">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-base font-bold text-slate-900 dark:text-white">{saved.planName}</h3>
                    <p className="text-xs text-slate-600 dark:text-gray-400 mt-0.5">{saved.description || `${saved.days?.length || 1} Ngày luyện tập`}</p>
                  </div>
                  <span className="text-[10px] text-slate-500 dark:text-gray-400">
                    {new Date(saved.createdAt || Date.now()).toLocaleDateString('vi-VN')}
                  </span>
                </div>
                <button
                  onClick={() => handleStartWorkout(saved, 0)}
                  className="w-full py-3 rounded-2xl bg-emerald-500 text-white dark:bg-neon dark:text-black font-bold text-xs uppercase tracking-wider flex items-center justify-center space-x-1.5 shadow-sm dark:shadow-neon active:scale-95 transition-all"
                >
                  <Play size={14} fill="currentColor" />
                  <span>Nạp Vào Timer & Tập</span>
                </button>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
};

export default PlanGenerator;
