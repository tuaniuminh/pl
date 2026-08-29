export const saveSettings = (settings) => localStorage.setItem('plank_settings', JSON.stringify(settings));

export const getSettings = () => {
  const defaultSettings = { apiKey: '', theme: 'dark' };
  const saved = localStorage.getItem('plank_settings');
  return saved ? { ...defaultSettings, ...JSON.parse(saved) } : defaultSettings;
};

export const saveHistory = (session) => {
  const history = getHistory();
  history.push({ ...session, id: Date.now(), date: new Date().toISOString() });
  localStorage.setItem('plank_history', JSON.stringify(history));
};

export const getHistory = () => {
  const saved = localStorage.getItem('plank_history');
  return saved ? JSON.parse(saved) : [];
};

export const exportCSV = () => {
  const history = getHistory();
  if (history.length === 0) return alert("Không có dữ liệu để xuất.");

  const headers = ["ID", "Ngày", "Thời lượng (giây)", "Giáo án"];
  const rows = history.map(h => [
    h.id,
    new Date(h.date).toLocaleString('vi-VN'),
    h.duration,
    h.planName || "Tự do"
  ]);

  const csvContent = [headers.join(","), ...rows.map(e => e.join(","))].join("\n");
  const blob = new Blob(["\uFEFF" + csvContent], { type: 'text/csv;charset=utf-8;' });
  
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = `plank_history_${Date.now()}.csv`;
  link.click();
};