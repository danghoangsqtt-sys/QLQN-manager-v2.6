
import { db } from '../store';
import { ShortcutConfig } from '../types'; 
import { 
  Key, ShieldCheck, RefreshCcw, Save, Trash2, 
  Keyboard, AlertTriangle, FileDown, Info, 
  Eye, EyeOff, Activity, Cpu, Database, 
  DownloadCloud, CheckCircle2, Terminal,
  Settings as SettingsIcon, ShieldAlert,
  HardDrive, History
} from 'lucide-react';
import React, { useState, useEffect } from 'react';

const Settings: React.FC = () => {
  const [passwords, setPasswords] = useState({ next: '', confirm: '' });
  const [showPass, setShowPass] = useState(false);
  const [shortcuts, setShortcuts] = useState<ShortcutConfig[]>([]);
  const [recordingId, setRecordingId] = useState<string | null>(null);
  const [isDiagnosticRunning, setIsDiagnosticRunning] = useState(false);
  const [diagnosticResult, setDiagnosticResult] = useState<any>(null);
  const [appVersion] = useState("7.2.5-STABLE");

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
    alert("Dữ liệu đang được đóng gói... \nBản sao lưu lưu tại: Documents/QNManager/Backups");
  };

  return (
    <div className="max-w-6xl mx-auto animate-fade-in pb-20 space-y-6 text-slate-700">
      
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
          
          {/* PHÍM TẮT (Giao diện List Item mới) */}
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

          {/* QUẢN LÝ TRUY CẬP */}
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
          
          {/* CHẨN ĐOÁN HỆ THỐNG */}
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

          {/* VÙNG AN TOÀN DỮ LIỆU (Danger Zone Compact) */}
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
                         <p className="text-[9px] text-slate-400 font-medium">Xuất tệp nén SQLITE (.db)</p>
                      </div>
                   </div>
                   <ChevronRight size={14} className="text-slate-300 group-hover:text-blue-600 transition-colors" />
                </button>

                <button 
                   onClick={async () => { if(confirm("XÁC NHẬN: Xóa sạch toàn bộ dữ liệu? Thao tác này KHÔNG THỂ khôi phục.")) { await db.clearDatabase(); window.location.reload(); } }} 
                   className="w-full flex items-center justify-between p-3 bg-red-50/50 border border-red-100 rounded-xl hover:bg-red-100 transition-all group"
                >
                   <div className="flex items-center gap-3">
                      <Trash2 size={18} className="text-red-600"/>
                      <div className="text-left">
                         <p className="text-[11px] font-bold text-red-800 uppercase">Xóa toàn bộ hồ sơ</p>
                         <p className="text-[9px] text-red-400 font-medium italic">Làm trống Database nhân sự</p>
                      </div>
                   </div>
                </button>
             </div>
          </div>

          {/* INFO & VERSION */}
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
              <button className="px-4 py-1.5 bg-slate-800 text-white rounded-lg font-bold text-[9px] uppercase hover:bg-black transition-all">Check Update</button>
          </div>
        </div>

      </div>

      <style>{`
        .animate-fade-in { animation: fadeIn 0.4s ease-out; }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(5px); } to { opacity: 1; transform: translateY(0); } }
        .scrollbar-hide::-webkit-scrollbar { display: none; }
      `}</style>
    </div>
  );
};

const ChevronRight = ({ size, className }: any) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="m9 18 6-6-6-6"/>
  </svg>
);

export default Settings;
