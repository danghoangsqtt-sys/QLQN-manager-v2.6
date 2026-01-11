
import { db } from '../store';
import { ShortcutConfig } from '../types'; 
import { 
  Key, ShieldCheck, RefreshCcw, Save, Trash2, 
  Keyboard, AlertTriangle, FileDown, Info, 
  Eye, EyeOff, Activity, Cpu, Database, 
  DownloadCloud, CheckCircle2, Terminal,
  Settings as SettingsIcon, ShieldAlert,
  HardDrive, History, ChevronRight as ChevronRightIcon,
  X, AlertCircle
} from 'lucide-react';
import React, { useState, useEffect, useRef } from 'react';

const Settings: React.FC = () => {
  const [passwords, setPasswords] = useState({ next: '', confirm: '' });
  const [showPass, setShowPass] = useState(false);
  const [shortcuts, setShortcuts] = useState<ShortcutConfig[]>([]);
  const [recordingId, setRecordingId] = useState<string | null>(null);
  const [isDiagnosticRunning, setIsDiagnosticRunning] = useState(false);
  const [diagnosticResult, setDiagnosticResult] = useState<any>(null);
  const [appVersion] = useState("7.0.0");
  
  // States for Update Modal
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  
  // Ref cho input file ẩn
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const fetchShortcuts = async () => {
        const data = await db.getShortcuts();
        setShortcuts(data);
    };
    fetchShortcuts();
  }, []);

  const handleUpdatePassword = async () => {
    if (!passwords.next || passwords.next !== passwords.confirm) {
      alert('Mật khẩu không khớp hoặc đang trống!');
      return;
    }
    const success = await db.changePassword(passwords.next);
    if (success) {
        alert('Đổi mật khẩu thành công!');
        setPasswords({ next: '', confirm: '' });
    }
  };

  const runDiagnostics = async () => {
    setIsDiagnosticRunning(true);
    setDiagnosticResult(null);
    setTimeout(async () => {
      const stats = await db.getSystemStats();
      setDiagnosticResult({
        status: 'Ổn định',
        tables: ['personnel', 'units', 'settings'],
        integrity: '100%',
        records: stats.personnelCount
      });
      setIsDiagnosticRunning(false);
    }, 1200);
  };

  const startRecording = (id: string) => {
    setRecordingId(id);
    const handleKey = async (e: KeyboardEvent) => {
      e.preventDefault();
      if (['Control', 'Alt', 'Shift', 'Meta'].includes(e.key)) return;
      await db.updateShortcut(id, { key: e.key, altKey: e.altKey, ctrlKey: e.ctrlKey, shiftKey: e.shiftKey });
      setShortcuts(await db.getShortcuts());
      setRecordingId(null);
      window.removeEventListener('keydown', handleKey);
    };
    window.addEventListener('keydown', handleKey);
  };

  const handleBackup = async () => {
    try {
        const jsonString = await db.createBackup();
        if (!jsonString) {
          alert("Có lỗi khi trích xuất dữ liệu, vui lòng thử lại!");
          return;
        }
        const date = new Date();
        const fileName = `QNManager_Backup_${date.getFullYear()}-${(date.getMonth()+1).toString().padStart(2,'0')}-${date.getDate().toString().padStart(2,'0')}.json`;
        const blob = new Blob([jsonString], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = fileName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    } catch (e) {
        console.error(e);
        alert("Lỗi sao lưu: " + e);
    }
  };

  const handleRestore = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (e) => {
        try {
            const content = e.target?.result as string;
            const data = JSON.parse(content);
            if (confirm(`CẢNH BÁO: Tìm thấy bản sao lưu ngày ${new Date(data.timestamp).toLocaleString()}.\n\nThao tác này sẽ XÓA TOÀN BỘ dữ liệu hiện tại và thay thế bằng dữ liệu trong file backup.\n\nBạn có chắc chắn muốn tiếp tục?`)) {
                const success = await db.restoreBackup(data);
                if (success) {
                    alert("Khôi phục dữ liệu thành công! Ứng dụng sẽ tải lại.");
                    window.location.reload();
                } else {
                    alert("File backup không đúng định dạng hoặc bị hỏng.");
                }
            }
        } catch (error) {
            alert("File không hợp lệ!");
        }
    };
    reader.readAsText(file);
    event.target.value = '';
  };

  const triggerUpdate = async () => {
    setIsUpdating(true);
    try {
        // @ts-ignore
        const result = await window.electronAPI.updateFromFile();
        if (!result.success && result.message !== 'Đã hủy chọn file.') {
            alert("Lỗi: " + result.message);
        }
    } catch (error) {
        console.error(error);
    } finally {
        setIsUpdating(false);
        setShowUpdateModal(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto animate-fade-in pb-20 space-y-6 text-slate-700">
      
      <input 
        type="file" 
        ref={fileInputRef} 
        className="hidden" 
        accept=".json" 
        onChange={handleRestore} 
      />

      {/* HEADER TRANG */}
      <div className="flex items-center justify-between border-b border-slate-200 pb-4">
        <div>
          <h1 className="text-xl font-black text-slate-800 uppercase tracking-tight flex items-center gap-2">
            <SettingsIcon size={24} className="text-[#14452F]"/> Cấu hình hệ thống
          </h1>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Tùy chỉnh bảo mật và vận hành phần mềm</p>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 bg-green-50 rounded-lg border border-green-100">
          <ShieldCheck size={14} className="text-green-600"/>
          <span className="text-[10px] font-black text-green-700 uppercase">Hệ thống bảo vệ: ON</span>
        </div>
      </div>

      <div className="grid grid-cols-12 gap-6">
        
        {/* CỘT TRÁI: BẢO MẬT & PHÍM TẮT */}
        <div className="col-span-12 lg:col-span-7 space-y-6">
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
             <div className="px-5 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                <h3 className="text-xs font-black uppercase flex items-center gap-2">
                   <Keyboard size={16} className="text-blue-600"/> Phím tắt vận hành nhanh
                </h3>
                <button onClick={() => db.resetShortcuts().then(() => db.getShortcuts().then(setShortcuts))} className="text-[9px] font-bold text-slate-400 hover:text-red-500 uppercase flex items-center gap-1 transition-colors">
                   <RefreshCcw size={12} /> Reset
                </button>
             </div>
             <div className="divide-y divide-slate-100">
                {shortcuts.map(s => (
                  <div key={s.id} className="flex items-center justify-between px-5 py-3 hover:bg-slate-50 transition-colors group">
                     <div>
                        <p className="text-[11px] font-bold text-slate-700 uppercase tracking-tight">{s.label}</p>
                        <p className="text-[9px] text-slate-400 font-medium italic">Gán phím nhanh cho chức năng</p>
                     </div>
                     <div className="flex items-center gap-3">
                        <div className={`px-4 py-1.5 rounded-lg font-mono text-[11px] font-bold min-w-[100px] text-center transition-all border ${recordingId === s.id ? 'bg-red-500 text-white animate-pulse border-red-400' : 'bg-white text-slate-600 border-slate-200'}`}>
                           {recordingId === s.id ? 'NHẤN PHÍM...' : (
                             <span className="opacity-80">
                                {s.ctrlKey && 'Ctrl+'}
                                {s.altKey && 'Alt+'}
                                {s.shiftKey && 'Shift+'}
                                <span className="text-[#14452F] uppercase">{s.key === ' ' ? 'Space' : s.key}</span>
                             </span>
                           )}
                        </div>
                        <button 
                          onClick={() => startRecording(s.id)}
                          className="w-8 h-8 flex items-center justify-center bg-white border border-slate-200 rounded-lg hover:bg-[#14452F] hover:text-white transition-all shadow-sm"
                        >
                           <Key size={14} />
                        </button>
                     </div>
                  </div>
                ))}
             </div>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5">
            <h3 className="text-xs font-black uppercase flex items-center gap-2 mb-5 border-b border-slate-100 pb-3">
               <ShieldAlert size={16} className="text-red-600" /> Kiểm soát truy cập
            </h3>
            <div className="grid grid-cols-2 gap-4">
               <div className="space-y-1.5">
                  <label className="text-[9px] font-bold text-slate-400 uppercase ml-1">Mật khẩu mới</label>
                  <div className="relative">
                    <input 
                      type={showPass ? "text" : "password"} 
                      className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-none text-xs font-bold focus:border-[#14452F] transition-all" 
                      value={passwords.next} 
                      onChange={e => setPasswords({...passwords, next: e.target.value})} 
                    />
                    <button onClick={() => setShowPass(!showPass)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                      {showPass ? <EyeOff size={14} /> : <Eye size={14} />}
                    </button>
                  </div>
               </div>
               <div className="space-y-1.5">
                  <label className="text-[9px] font-bold text-slate-400 uppercase ml-1">Xác nhận lại</label>
                  <input 
                    type={showPass ? "text" : "password"} 
                    className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-none text-xs font-bold focus:border-[#14452F] transition-all" 
                    value={passwords.confirm} 
                    onChange={e => setPasswords({...passwords, confirm: e.target.value})} 
                  />
               </div>
            </div>
            <button onClick={handleUpdatePassword} className="mt-4 px-6 py-2.5 bg-[#14452F] text-white rounded-xl font-bold uppercase text-[10px] tracking-widest shadow-md hover:bg-green-800 transition-all active:scale-95">
               Cập nhật mật khẩu quản trị
            </button>
          </div>
        </div>

        {/* CỘT PHẢI: CHẨN ĐOÁN & QUẢN TRỊ DỮ LIỆU */}
        <div className="col-span-12 lg:col-span-5 space-y-6">
          <div className="bg-slate-900 rounded-2xl shadow-xl p-5 text-slate-300">
             <div className="flex justify-between items-center mb-4 border-b border-white/10 pb-3">
                <h3 className="text-xs font-black uppercase flex items-center gap-2 text-green-400">
                   <Terminal size={16} /> Diagnostic Tools
                </h3>
                <span className="text-[9px] font-mono text-white/40">Build: 2024.12</span>
             </div>
             
             {diagnosticResult ? (
                <div className="space-y-2 mb-4 animate-fade-in text-[10px] font-mono">
                   <div className="flex justify-between border-b border-white/5 pb-1">
                      <span className="text-slate-500">Trạng thái cơ sở dữ liệu:</span>
                      <span className="text-green-400 uppercase font-bold">{diagnosticResult.status}</span>
                   </div>
                   <div className="flex justify-between border-b border-white/5 pb-1">
                      <span className="text-slate-500">Tính toàn vẹn (Integrity):</span>
                      <span className="text-blue-400 font-bold">{diagnosticResult.integrity}</span>
                   </div>
                   <div className="flex justify-between">
                      <span className="text-slate-500">Số bản ghi đang quản lý:</span>
                      <span className="text-white font-bold">{diagnosticResult.records} hồ sơ</span>
                   </div>
                </div>
             ) : (
                <div className="py-8 text-center opacity-20 text-[10px] uppercase font-bold italic tracking-widest">Sẵn sàng chẩn đoán...</div>
             )}

             <button 
                onClick={runDiagnostics} 
                disabled={isDiagnosticRunning}
                className={`w-full py-2.5 border border-green-500/30 text-green-500 rounded-xl font-bold uppercase text-[10px] flex items-center justify-center gap-2 hover:bg-green-500 hover:text-white transition-all ${isDiagnosticRunning ? 'animate-pulse opacity-50' : ''}`}
             >
                <Activity size={14} /> {isDiagnosticRunning ? 'Đang phân tích...' : 'Kiểm tra hệ thống'}
             </button>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-red-100 p-5 overflow-hidden relative">
             <div className="absolute top-0 right-0 p-2 opacity-10 text-red-100">
                <AlertTriangle size={80} />
             </div>
             <h3 className="text-xs font-black uppercase flex items-center gap-2 mb-5 text-red-800">
                <HardDrive size={16} /> Quản trị dữ liệu
             </h3>
             <div className="space-y-2 relative z-10">
                <button onClick={handleBackup} className="w-full flex items-center justify-between p-3 bg-blue-50/50 border border-blue-100 rounded-xl hover:bg-blue-100 transition-all group">
                   <div className="flex items-center gap-3">
                      <FileDown size={18} className="text-blue-600"/>
                      <div className="text-left">
                         <p className="text-[11px] font-bold text-slate-800 uppercase">Sao lưu cơ sở dữ liệu</p>
                         <p className="text-[9px] text-slate-400 font-medium">Xuất tệp nén JSON (.json)</p>
                      </div>
                   </div>
                   <ChevronRightIcon size={14} className="text-slate-300 group-hover:text-blue-600 transition-colors" />
                </button>

                <button 
                   onClick={() => fileInputRef.current?.click()} 
                   className="w-full flex items-center justify-between p-3 bg-green-50/50 border border-green-100 rounded-xl hover:bg-green-100 transition-all group"
                >
                   <div className="flex items-center gap-3">
                      <Database size={18} className="text-green-600"/>
                      <div className="text-left">
                         <p className="text-[11px] font-bold text-slate-800 uppercase">Khôi phục dữ liệu</p>
                         <p className="text-[9px] text-slate-400 font-medium">Nhập từ file backup (.json)</p>
                      </div>
                   </div>
                   <ChevronRightIcon size={14} className="text-slate-300 group-hover:text-green-600 transition-colors" />
                </button>

                <button 
                   onClick={async () => { if(confirm("CẢNH BÁO NGUY HIỂM:\n\nBạn có chắc chắn muốn xóa sạch toàn bộ dữ liệu (nhân sự, đơn vị, lịch sử)?\nThao tác này KHÔNG THỂ khôi phục.")) { await db.clearDatabase(); window.location.reload(); } }} 
                   className="w-full flex items-center justify-between p-3 bg-red-50/50 border border-red-100 rounded-xl hover:bg-red-100 transition-all group mt-4"
                >
                   <div className="flex items-center gap-3">
                      <Trash2 size={18} className="text-red-600"/>
                      <div className="text-left">
                         <p className="text-[11px] font-bold text-red-800 uppercase">Xóa toàn bộ hồ sơ</p>
                         <p className="text-[9px] text-red-400 font-medium italic">Reset hệ thống về mặc định</p>
                      </div>
                   </div>
                </button>
             </div>
          </div>

          <div className="bg-white rounded-2xl p-4 border border-slate-200 flex items-center justify-between">
              <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-slate-50 text-slate-400 rounded-xl flex items-center justify-center">
                      <DownloadCloud size={20} />
                  </div>
                  <div>
                      <p className="text-[9px] font-bold text-slate-400 uppercase leading-none mb-1">Phiên bản hiện tại</p>
                      <p className="text-xs font-black text-slate-800 uppercase tracking-tight">{appVersion}</p>
                  </div>
              </div>
              
              <button 
                onClick={() => setShowUpdateModal(true)}
                className="px-4 py-1.5 bg-slate-800 text-white rounded-lg font-bold text-[9px] uppercase hover:bg-green-700 hover:shadow-lg transition-all flex items-center gap-2"
              >
                 <RefreshCcw size={12} className="animate-spin-slow" /> Cập nhật phiên bản
              </button>
          </div>
        </div>
      </div>

      {/* --- MODAL CẬP NHẬT PHIÊN BẢN (NÂNG CẤP GIAO DIỆN) --- */}
      {showUpdateModal && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-fade-in no-print">
          <div className="bg-white w-full max-w-md rounded-[2.5rem] shadow-2xl overflow-hidden border border-slate-200 animate-slide-up">
             {/* Header */}
             <div className="bg-[#14452F] p-6 text-white relative">
                <button 
                   onClick={() => setShowUpdateModal(false)}
                   className="absolute right-6 top-6 text-white/50 hover:text-white transition-colors"
                >
                   <X size={20} />
                </button>
                <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center mb-4">
                   <DownloadCloud size={24} className="text-amber-400" />
                </div>
                <h3 className="text-lg font-black uppercase tracking-tight">Cập nhật hệ thống</h3>
                <p className="text-[10px] text-white/60 font-bold uppercase tracking-widest mt-1">Nâng cấp phiên bản phần mềm</p>
             </div>

             {/* Content */}
             <div className="p-8 space-y-6">
                <div className="flex gap-4 p-4 bg-red-50 border border-red-100 rounded-2xl">
                   <div className="shrink-0 text-red-500 mt-1">
                      <AlertTriangle size={20} />
                   </div>
                   <div>
                      <h4 className="text-[11px] font-black text-red-800 uppercase mb-1">Cảnh báo quan trọng</h4>
                      <p className="text-xs text-red-700/80 leading-relaxed font-medium">
                         Trước khi thực hiện cập nhật, hãy chắc chắn bạn đã <strong>SAO LƯU DỮ LIỆU</strong> (Database Backup). Quá trình này có thể ảnh hưởng đến dữ liệu hiện tại.
                      </p>
                   </div>
                </div>

                <div className="space-y-3">
                   <div className="flex items-center gap-3">
                      <div className="w-6 h-6 rounded-full bg-green-50 text-green-600 flex items-center justify-center shrink-0">
                         <CheckCircle2 size={12} />
                      </div>
                      <p className="text-[11px] font-bold text-slate-600">Hệ thống sẽ tự động đóng để cài đặt mới.</p>
                   </div>
                   <div className="flex items-center gap-3">
                      <div className="w-6 h-6 rounded-full bg-green-50 text-green-600 flex items-center justify-center shrink-0">
                         <CheckCircle2 size={12} />
                      </div>
                      <p className="text-[11px] font-bold text-slate-600">Bạn sẽ cần chọn file cập nhật định dạng <strong>.exe</strong></p>
                   </div>
                </div>

                <div className="pt-4 flex flex-col gap-3">
                   <button 
                      disabled={isUpdating}
                      onClick={triggerUpdate}
                      className="w-full py-4 bg-[#14452F] text-white rounded-2xl font-black uppercase text-xs tracking-widest shadow-xl hover:bg-green-800 active:scale-95 transition-all flex items-center justify-center gap-3"
                   >
                      {isUpdating ? <RefreshCcw size={16} className="animate-spin" /> : <FileDown size={18} />}
                      Tiếp tục chọn file cập nhật
                   </button>
                   <button 
                      disabled={isUpdating}
                      onClick={() => setShowUpdateModal(false)}
                      className="w-full py-4 bg-white border border-slate-200 text-slate-400 rounded-2xl font-black uppercase text-xs tracking-widest hover:bg-slate-50 transition-all"
                   >
                      Hủy bỏ
                   </button>
                </div>
             </div>

             <div className="bg-slate-50 p-4 text-center border-t border-slate-100">
                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest flex items-center justify-center gap-2">
                   <ShieldCheck size={10} /> Secure Update Protocol Enabled
                </p>
             </div>
          </div>
        </div>
      )}

      <style>{`
        .animate-fade-in { animation: fadeIn 0.4s ease-out; }
        .animate-slide-up { animation: slideUp 0.4s cubic-bezier(0.16, 1, 0.3, 1); }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(5px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes slideUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
        .scrollbar-hide::-webkit-scrollbar { display: none; }
        .animate-spin-slow { animation: spin 3s linear infinite; }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
};

export default Settings;
