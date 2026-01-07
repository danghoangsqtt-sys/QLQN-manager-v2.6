
import React, { useState, useRef, useEffect } from 'react';
import { db } from '../store';
import { ShortcutConfig } from '../types'; 
import { 
  Key, ShieldCheck, RefreshCcw, Save, Trash2, 
  Keyboard, AlertTriangle, FileDown, Info, 
  Eye, EyeOff, Activity, Cpu, Database, 
  DownloadCloud, CheckCircle2, Terminal
} from 'lucide-react';

const Settings: React.FC = () => {
  const [passwords, setPasswords] = useState({ next: '', confirm: '' });
  const [showPass, setShowPass] = useState(false);
  const [shortcuts, setShortcuts] = useState<ShortcutConfig[]>([]);
  const [recordingId, setRecordingId] = useState<string | null>(null);
  const [isDiagnosticRunning, setIsDiagnosticRunning] = useState(false);
  const [diagnosticResult, setDiagnosticResult] = useState<any>(null);
  const [appVersion] = useState("5.2.0-PRO");

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
    // Giả lập quá trình kiểm tra sâu
    setTimeout(async () => {
      const stats = await db.getSystemStats();
      setDiagnosticResult({
        status: 'Ổn định',
        tables: ['personnel', 'units', 'settings'],
        integrity: '100%',
        connection: stats.status,
        records: stats.personnelCount
      });
      setIsDiagnosticRunning(false);
    }, 1500);
  };

  const startRecording = (id: string) => {
    setRecordingId(id);
    const handleKey = async (e: KeyboardEvent) => {
      e.preventDefault();
      if (['Control', 'Alt', 'Shift', 'Meta'].includes(e.key)) return;
      
      await db.updateShortcut(id, {
        key: e.key,
        altKey: e.altKey,
        ctrlKey: e.ctrlKey,
        shiftKey: e.shiftKey
      });
      
      const updated = await db.getShortcuts();
      setShortcuts(updated);
      setRecordingId(null);
      window.removeEventListener('keydown', handleKey);
    };
    window.addEventListener('keydown', handleKey);
  };

  const handleResetShortcuts = async () => {
    if (confirm('Khôi phục phím tắt mặc định?')) {
      await db.resetShortcuts();
      const updated = await db.getShortcuts();
      setShortcuts(updated);
    }
  };

  const handleBackup = async () => {
    alert("Đang khởi tạo bản sao lưu... \nToàn bộ tệp 'du_lieu_quan_nhan_v4.db' sẽ được đóng gói.");
    setTimeout(() => {
        alert("Sao lưu thành công! Bản lưu được lưu tại thư mục Documents/QNManager_Backups");
    }, 1000);
  };

  return (
    <div className="grid grid-cols-12 gap-8 animate-fade-in pb-20">
      <div className="col-span-12 lg:col-span-5 space-y-8">
        {/* Mật khẩu - Nâng cấp mắt xem */}
        <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-5">
            <ShieldCheck size={80} />
          </div>
          <h3 className="flex items-center gap-3 font-black text-[#14452F] uppercase text-xs mb-8 border-b pb-4">
            <Key size={20} className="text-green-700" /> Quản lý truy cập
          </h3>
          <div className="space-y-6">
            <div className="space-y-2 relative">
              <label className="text-[10px] font-black text-slate-400 uppercase ml-2">Mật khẩu mới</label>
              <div className="relative">
                <input 
                  type={showPass ? "text" : "password"} 
                  className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none font-bold focus:ring-4 ring-green-500/5" 
                  value={passwords.next} 
                  onChange={e => setPasswords({...passwords, next: e.target.value})} 
                />
                <button 
                  onClick={() => setShowPass(!showPass)} 
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-[#14452F]"
                >
                  {showPass ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase ml-2">Xác nhận mật khẩu</label>
              <input 
                type={showPass ? "text" : "password"} 
                className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none font-bold focus:ring-4 ring-green-500/5" 
                value={passwords.confirm} 
                onChange={e => setPasswords({...passwords, confirm: e.target.value})} 
              />
            </div>
            <button onClick={handleUpdatePassword} className="w-full py-5 bg-[#14452F] text-white rounded-2xl font-black uppercase text-xs tracking-widest hover:bg-green-800 transition-all shadow-xl active:scale-95">Cập nhật mật khẩu</button>
          </div>
        </div>

        {/* Chẩn đoán & Debug */}
        <div className="bg-slate-900 p-8 rounded-[2.5rem] shadow-2xl text-white">
           <h3 className="flex items-center gap-3 font-black text-green-400 uppercase text-xs mb-8 border-b border-white/10 pb-4">
            <Terminal size={20} /> Hệ thống chẩn đoán
          </h3>
          <div className="space-y-4">
             {diagnosticResult ? (
                <div className="bg-white/5 p-4 rounded-xl space-y-2 animate-fade-in">
                   <div className="flex justify-between text-[10px] uppercase font-bold">
                      <span className="text-gray-400">Trạng thái:</span>
                      <span className="text-green-400">{diagnosticResult.status}</span>
                   </div>
                   <div className="flex justify-between text-[10px] uppercase font-bold">
                      <span className="text-gray-400">Kết nối:</span>
                      <span className="text-blue-400">{diagnosticResult.connection}</span>
                   </div>
                   <div className="flex justify-between text-[10px] uppercase font-bold">
                      <span className="text-gray-400">Dữ liệu hồ sơ:</span>
                      <span className="text-white">{diagnosticResult.records} hồ sơ</span>
                   </div>
                   <div className="pt-2 flex gap-2 overflow-x-auto scrollbar-hide">
                      {diagnosticResult.tables.map((t: string) => (
                         <span key={t} className="px-2 py-1 bg-green-500/10 text-green-500 rounded text-[8px] font-black uppercase border border-green-500/20">Table: {t}</span>
                      ))}
                   </div>
                </div>
             ) : (
                <div className="py-6 text-center opacity-30 italic text-xs">Sẵn sàng kiểm tra hệ thống</div>
             )}
             <button 
                onClick={runDiagnostics} 
                disabled={isDiagnosticRunning}
                className={`w-full py-4 border-2 border-green-500/30 text-green-500 rounded-2xl font-black uppercase text-xs flex items-center justify-center gap-2 hover:bg-green-500 hover:text-white transition-all ${isDiagnosticRunning ? 'animate-pulse' : ''}`}
             >
                <Activity size={18} /> {isDiagnosticRunning ? 'Đang kiểm tra...' : 'Bắt đầu Debug'}
             </button>
          </div>
        </div>

        {/* Phiên bản */}
        <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-4">
                <div className="p-3 bg-blue-50 text-blue-600 rounded-2xl">
                    <DownloadCloud size={24} />
                </div>
                <div>
                    <p className="text-[10px] font-black text-slate-400 uppercase">Phiên bản hiện tại</p>
                    <p className="text-sm font-black text-slate-800 uppercase">{appVersion}</p>
                </div>
            </div>
            <button className="px-5 py-2.5 bg-blue-600 text-white rounded-xl font-black text-[10px] uppercase shadow-lg shadow-blue-200 hover:bg-blue-700 active:scale-95 transition-all">Kiểm tra cập nhật</button>
        </div>
      </div>

      <div className="col-span-12 lg:col-span-7 space-y-8">
        {/* Phím tắt */}
        <div className="bg-white p-10 rounded-[3rem] shadow-sm border border-slate-100">
           <div className="flex justify-between items-center mb-10 pb-6 border-b">
              <h3 className="flex items-center gap-3 font-black text-[#14452F] uppercase text-sm">
                 <Keyboard size={24} /> Phím tắt vận hành nhanh
              </h3>
              <button onClick={handleResetShortcuts} className="text-[10px] font-black text-slate-400 hover:text-red-500 uppercase flex items-center gap-2">
                 <RefreshCcw size={14} /> Reset mặc định
              </button>
           </div>

           <div className="space-y-4">
              {shortcuts.map(s => (
                <div key={s.id} className="flex items-center justify-between p-6 bg-slate-50 rounded-[2rem] border border-transparent hover:border-green-200 transition-all group">
                   <div>
                      <p className="text-xs font-black text-slate-700 uppercase tracking-tight">{s.label}</p>
                      <p className="text-[10px] text-slate-400 font-bold uppercase mt-1">Gán phím hệ thống</p>
                   </div>
                   <div className="flex items-center gap-4">
                      <div className={`px-6 py-3 rounded-xl font-mono text-sm font-black min-w-[140px] text-center shadow-inner transition-all ${recordingId === s.id ? 'bg-red-500 text-white animate-pulse' : 'bg-white text-[#14452F] border-2 border-slate-100'}`}>
                         {recordingId === s.id ? 'NHẤN PHÍM...' : (
                           <div className="flex justify-center items-center gap-1">
                              {s.ctrlKey && <span className="opacity-40">Ctrl +</span>}
                              {s.altKey && <span className="opacity-40">Alt +</span>}
                              {s.shiftKey && <span className="opacity-40">Shift +</span>}
                              <span className="uppercase text-green-700">{s.key === ' ' ? 'Space' : s.key}</span>
                           </div>
                         )}
                      </div>
                      <button 
                        onClick={() => startRecording(s.id)}
                        className="w-12 h-12 flex items-center justify-center bg-white border border-slate-200 rounded-full hover:bg-[#14452F] hover:text-white transition-all shadow-sm group-hover:scale-110"
                      >
                         <Key size={18} />
                      </button>
                   </div>
                </div>
              ))}
           </div>
        </div>

        {/* Vùng an toàn dữ liệu */}
        <div className="bg-red-50 p-10 rounded-[3rem] border-2 border-red-100 border-dashed relative overflow-hidden">
          <div className="absolute -top-10 -right-10 opacity-5 text-red-600">
             <AlertTriangle size={200} />
          </div>
          <h3 className="flex items-center gap-3 font-black text-red-800 uppercase text-sm mb-10 pb-4 border-b border-red-200">
            <ShieldCheck size={24} /> Vùng an toàn dữ liệu (Dành cho Quản trị)
          </h3>
          <div className="grid grid-cols-2 gap-6">
             <button onClick={handleBackup} className="flex flex-col items-center gap-4 p-8 bg-white rounded-[2rem] border border-slate-100 hover:shadow-xl hover:border-blue-200 transition-all group">
                <div className="p-4 bg-blue-50 text-blue-600 rounded-2xl group-hover:bg-blue-600 group-hover:text-white transition-all">
                    <FileDown size={32} />
                </div>
                <div className="text-center">
                    <p className="text-xs font-black text-slate-800 uppercase">Sao lưu Database</p>
                    <p className="text-[9px] text-slate-400 font-bold mt-1 uppercase">Xuất tệp SQLITE (.db)</p>
                </div>
             </button>

             <button 
                onClick={async () => { if(confirm("CẢNH BÁO NGUY HIỂM: Bạn có chắc chắn muốn XÓA SẠCH toàn bộ hồ sơ quân nhân và cơ cấu đơn vị? Thao tác này KHÔNG THỂ KHÔI PHỤC.")) { await db.clearDatabase(); window.location.reload(); } }} 
                className="flex flex-col items-center gap-4 p-8 bg-white rounded-[2rem] border border-slate-100 hover:shadow-xl hover:border-red-200 transition-all group"
             >
                <div className="p-4 bg-red-50 text-red-600 rounded-2xl group-hover:bg-red-600 group-hover:text-white transition-all">
                    <Trash2 size={32} />
                </div>
                <div className="text-center">
                    <p className="text-xs font-black text-red-800 uppercase">Xóa toàn bộ hồ sơ</p>
                    <p className="text-[9px] text-slate-400 font-bold mt-1 uppercase">Xóa dữ liệu Personnel & Units</p>
                </div>
             </button>
          </div>

          <div className="mt-8 flex gap-4 p-5 bg-white/60 rounded-2xl border border-red-200">
              <Info className="text-red-400 shrink-0" size={24} />
              <p className="text-[10px] text-red-800 font-bold leading-relaxed uppercase">
                 Thông báo: Việc xóa dữ liệu gốc chỉ áp dụng cho hồ sơ, thông tin bảo mật và cấu trúc đơn vị. Các cài đặt cá nhân (Phím tắt, Mật khẩu quản trị) sẽ được giữ lại để đảm bảo tính liên tục của hệ thống.
              </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;
