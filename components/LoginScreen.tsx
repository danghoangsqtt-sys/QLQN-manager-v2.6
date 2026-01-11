import React, { useState, useEffect } from 'react';
import { 
  Shield, Key, UserPlus, Crosshair, Target, 
  FileText, AlertTriangle, LogIn, 
  Database, Server, ChevronRight, Minimize2
} from 'lucide-react';
import PersonnelForm from './PersonnelForm';
import { db } from '../store';
import { Unit } from '../types';

interface LoginScreenProps {
  onLogin: () => void;
}

const LoginScreen: React.FC<LoginScreenProps> = ({ onLogin }) => {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  // State quản lý chế độ khai báo thông tin chiến sĩ
  const [showSoldierForm, setShowSoldierForm] = useState(false);
  const [units, setUnits] = useState<Unit[]>([]);
  // Giữ lại state systemStatus để logic không bị lỗi
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [systemStatus, setSystemStatus] = useState('ONLINE');

  // Load danh sách đơn vị để phục vụ form nhập liệu
  useEffect(() => {
    const fetchUnits = async () => {
        try {
            const data = await db.getUnits();
            setUnits(data);
        } catch (e) {
            console.error("Lỗi tải đơn vị:", e);
            setSystemStatus('OFFLINE');
        }
    };
    fetchUnits();
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      // Sử dụng hàm login an toàn từ store
      const success = await db.login(password);
      
      // Giả lập độ trễ mạng để hiệu ứng loading mượt mà hơn
      await new Promise(resolve => setTimeout(resolve, 800));

      if (success) {
        // [FIX QUAN TRỌNG] Kiểm tra onLogin có tồn tại trước khi gọi
        // Để tránh crash nếu App.tsx truyền sai prop (ví dụ: onLoginSuccess)
        if (typeof onLogin === 'function') {
            onLogin();
        } else {
            console.error("DEV ERROR: Hàm onLogin chưa được truyền đúng từ App.tsx");
            setError('Lỗi hệ thống: Không tìm thấy hàm chuyển trang.');
        }
      } else {
        setError('Mã truy cập không hợp lệ. Vui lòng kiểm tra lại.');
      }
    } catch (err) {
      console.error(err);
      setError('Lỗi kết nối cơ sở dữ liệu nội bộ.');
    } finally {
      setIsLoading(false);
    }
  };

  // Component nền Radar/Tech
  const TechBackground = () => (
    <div className="absolute inset-0 overflow-hidden pointer-events-none z-0 bg-[#050b14]">
      {/* Grid nền */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(16,185,129,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(16,185,129,0.02)_1px,transparent_1px)] bg-[size:40px_40px]"></div>
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,#050b14_90%)]"></div>
      
      {/* Radar Circles */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] border border-emerald-500/5 rounded-full animate-[spin_60s_linear_infinite]"></div>
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] border border-emerald-500/10 rounded-full animate-[spin_40s_linear_infinite_reverse]"></div>
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[350px] h-[350px] border border-dashed border-emerald-500/20 rounded-full animate-[spin_20s_linear_infinite]"></div>
      
      {/* Scanning Line */}
      <div className="absolute top-0 left-0 w-full h-1 bg-emerald-500/20 shadow-[0_0_20px_rgba(16,185,129,0.4)] animate-scan"></div>
    </div>
  );

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden font-sans text-slate-200">
      <TechBackground />
      
      {/* MÀN HÌNH ĐĂNG NHẬP CHÍNH */}
      {!showSoldierForm ? (
        <div className="w-full max-w-7xl z-10 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center p-6 animate-fade-in relative">
           
           {/* Decorative Lines */}
           <div className="absolute top-0 left-10 w-[1px] h-full bg-gradient-to-b from-transparent via-emerald-900/50 to-transparent hidden lg:block"></div>
           <div className="absolute bottom-10 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-emerald-900/50 to-transparent hidden lg:block"></div>

           {/* Cột trái: Branding & Thông tin (7 cols) */}
           <div className="lg:col-span-7 space-y-12 pl-4 lg:pl-16 relative">
              
              <div className="space-y-6">
                <div className="relative">
                    <h1 className="text-4xl lg:text-6xl font-black text-white leading-[0.9] tracking-tighter drop-shadow-[0_4px_10px_rgba(0,0,0,0.5)]">
                      <span className="block text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-green-300 to-teal-400">HỆ THỐNG</span>
                      <span className="block whitespace-nowrap">QUẢN LÝ QUÂN NHÂN</span>
                    </h1>
                    {/* Decorative element underneath title */}
                    <div className="absolute -bottom-4 left-0 w-24 h-1.5 bg-emerald-600 skew-x-12"></div>
                    <div className="absolute -bottom-4 left-26 w-4 h-1.5 bg-emerald-800 skew-x-12 ml-2"></div>
                </div>
                
                <p className="text-slate-400 text-sm md:text-base font-medium leading-relaxed max-w-lg border-l-2 border-emerald-900/50 pl-4">
                  Nền tảng số hóa hồ sơ nhân sự, giám sát biến động quân số và phân tích dữ liệu tập trung. Đảm bảo an toàn thông tin tuyệt đối.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4 max-w-md">
                  <div className="p-5 bg-slate-900/40 border border-slate-700/30 rounded-sm hover:border-emerald-500/40 transition-all group backdrop-blur-sm relative overflow-hidden">
                     <div className="absolute top-0 right-0 p-2 opacity-10 group-hover:opacity-20 transition-opacity"><Crosshair size={40} /></div>
                     <Target className="text-emerald-500 mb-3 group-hover:scale-110 transition-transform" size={24} />
                     <h3 className="text-white font-bold text-sm uppercase tracking-wide">Giám sát 24/7</h3>
                     <p className="text-slate-500 text-xs mt-1">Theo dõi quân số thực</p>
                  </div>
                  <div className="p-5 bg-slate-900/40 border border-slate-700/30 rounded-sm hover:border-blue-500/40 transition-all group backdrop-blur-sm relative overflow-hidden">
                     <div className="absolute top-0 right-0 p-2 opacity-10 group-hover:opacity-20 transition-opacity"><Database size={40} /></div>
                     <Database className="text-blue-500 mb-3 group-hover:scale-110 transition-transform" size={24} />
                     <h3 className="text-white font-bold text-sm uppercase tracking-wide">Lưu trữ Số</h3>
                     <p className="text-slate-500 text-xs mt-1">Hồ sơ điện tử an toàn</p>
                  </div>
              </div>
           </div>

           {/* Cột phải: Form Đăng nhập (5 cols) */}
           <div className="lg:col-span-5 w-full max-w-md mx-auto relative">
              {/* Tech Frame */}
              <div className="absolute -inset-[1px] bg-gradient-to-b from-emerald-500/20 to-transparent rounded-lg opacity-50 pointer-events-none"></div>
              
              {/* Corner Accents */}
              <div className="absolute -top-1 -left-1 w-4 h-4 border-t-2 border-l-2 border-emerald-500"></div>
              <div className="absolute -top-1 -right-1 w-4 h-4 border-t-2 border-r-2 border-emerald-500"></div>
              <div className="absolute -bottom-1 -left-1 w-4 h-4 border-b-2 border-l-2 border-emerald-500"></div>
              <div className="absolute -bottom-1 -right-1 w-4 h-4 border-b-2 border-r-2 border-emerald-500"></div>

              <div className="relative bg-[#08101c]/95 border border-slate-700/50 rounded-lg p-8 shadow-[0_0_50px_rgba(0,0,0,0.5)] backdrop-blur-xl">
                  <div className="flex items-center justify-between mb-8 pb-4 border-b border-slate-800">
                      <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-gradient-to-br from-emerald-600 to-green-800 rounded flex items-center justify-center text-white shadow-lg">
                              <Shield size={20} strokeWidth={2.5}/>
                          </div>
                          <div>
                              <h3 className="text-white font-black uppercase tracking-wider text-sm">Đăng nhập</h3>
                              <p className="text-emerald-500/60 text-[10px] font-mono uppercase">Secure_Access_V2.6</p>
                          </div>
                      </div>
                      <div className="flex gap-1">
                          <div className="w-1 h-1 bg-emerald-500 rounded-full animate-ping"></div>
                          <div className="w-1 h-1 bg-emerald-500 rounded-full"></div>
                          <div className="w-1 h-1 bg-emerald-500 rounded-full"></div>
                      </div>
                  </div>

                  <form onSubmit={handleLogin} className="space-y-6">
                      <div className="space-y-2">
                          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                            <Key size={10} className="text-emerald-500"/> Mã truy cập
                          </label>
                          <div className="relative group z-20">
                              <input 
                                type="password" 
                                className="w-full bg-[#030712] border border-slate-700 text-emerald-400 text-center font-mono text-xl tracking-[0.5em] rounded-md px-4 py-4 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/50 transition-all placeholder:text-slate-800 placeholder:tracking-normal placeholder:text-sm group-hover:border-slate-600"
                                placeholder="••••••••"
                                value={password}
                                onChange={e => setPassword(e.target.value)}
                                autoFocus
                              />
                              {/* Scan line in input */}
                              <div className="absolute bottom-0 left-0 h-[2px] bg-emerald-500 w-0 group-focus-within:w-full transition-all duration-500"></div>
                          </div>
                      </div>

                      {error && (
                        <div className="flex items-start gap-3 p-3 bg-red-500/5 border border-red-500/20 rounded-md text-red-400 text-xs font-bold animate-shake">
                            <AlertTriangle size={16} className="shrink-0 mt-0.5" />
                            {error}
                        </div>
                      )}

                      <button 
                          type="submit"
                          disabled={isLoading}
                          className="w-full py-4 bg-gradient-to-r from-emerald-700 to-green-600 hover:from-emerald-600 hover:to-green-500 text-white font-black uppercase tracking-widest text-xs rounded-md shadow-lg shadow-emerald-900/40 transform active:scale-[0.98] transition-all flex items-center justify-center gap-2 border border-white/10 group"
                      >
                          {isLoading ? (
                              <div className="flex items-center gap-2">
                                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                  <span>Đang xác thực...</span>
                              </div>
                          ) : (
                              <>
                                  <LogIn size={16} className="group-hover:translate-x-0.5 transition-transform"/> TRUY CẬP QUẢN TRỊ
                              </>
                          )}
                      </button>
                  </form>

                  <div className="mt-8 pt-6 border-t border-slate-800/50">
                      <button 
                          onClick={() => setShowSoldierForm(true)}
                          className="w-full py-3 bg-slate-800/30 hover:bg-slate-800/60 text-slate-400 hover:text-white font-bold text-xs uppercase tracking-wide rounded-md border border-slate-700 hover:border-emerald-500/50 transition-all flex items-center justify-center gap-2 group"
                      >
                          <UserPlus size={16} className="text-slate-500 group-hover:text-emerald-400 transition-colors"/>
                          Khai báo hồ sơ chiến sĩ
                          <ChevronRight size={14} className="opacity-50 group-hover:translate-x-1 transition-transform"/>
                      </button>
                  </div>
              </div>
           </div>

        </div>
      ) : (
        /* GIAO DIỆN KHAI BÁO CHIẾN SĨ (Modal Fullscreen) */
        <div className="fixed inset-0 z-50 bg-[#050b14] flex flex-col animate-slide-up overflow-hidden">
            {/* Header Modal - Phong cách Tech */}
            <div className="h-16 border-b border-slate-800 bg-[#0b1221]/95 backdrop-blur-md px-4 md:px-8 flex items-center justify-between shrink-0 z-20 shadow-lg relative">
               <div className="flex items-center gap-4">
                   <div className="w-10 h-10 bg-emerald-900/20 border border-emerald-500/30 rounded flex items-center justify-center text-emerald-400 shadow-[0_0_10px_rgba(16,185,129,0.1)]">
                      <FileText size={20} />
                   </div>
                   <div>
                      <h2 className="text-white font-black uppercase tracking-wide text-sm flex items-center gap-2">
                         Cổng thông tin khai báo
                         <span className="px-1.5 py-0.5 rounded-[2px] bg-blue-500/10 text-blue-400 border border-blue-500/20 text-[9px]">SECURE</span>
                      </h2>
                      <p className="text-slate-500 text-[10px] uppercase font-medium tracking-widest">Dành cho quân nhân mới</p>
                   </div>
               </div>
               <div className="flex items-center gap-4">
                 <div className="hidden md:flex items-center gap-2 px-3 py-1.5 bg-slate-900 border border-slate-700 rounded text-slate-400 text-xs font-mono">
                    <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></span> SERVER_CONNECTED
                 </div>
                 <div className="h-8 w-[1px] bg-slate-800 mx-2 hidden md:block"></div>
                 <button 
                    onClick={() => setShowSoldierForm(false)}
                    className="group px-5 py-2 bg-red-500/10 text-red-500 border border-red-500/20 hover:bg-red-500 hover:text-white hover:border-red-500 transition-all text-xs font-bold uppercase rounded tracking-wider flex items-center gap-2"
                 >
                    <Minimize2 size={14} className="group-hover:scale-90 transition-transform" /> Đóng
                 </button>
               </div>
               {/* Header loading bar */}
               <div className="absolute bottom-0 left-0 w-full h-[1px] bg-slate-800">
                  <div className="w-1/3 h-full bg-emerald-500/50 blur-[2px] animate-scan-fast"></div>
               </div>
            </div>

            {/* Form Container */}
            <div className="flex-1 bg-[#f0f2f5] relative overflow-hidden flex flex-col w-full">
               <div className="flex-1 overflow-y-auto w-full custom-scrollbar scroll-smooth">
                   <div className="min-h-full w-full flex justify-center p-4 md:p-8">
                       <div className="w-full max-w-6xl animate-fade-in pb-10">
                           <PersonnelForm 
                              units={units} 
                              onClose={() => setShowSoldierForm(false)} 
                              isViewMode={false} 
                           />
                       </div>
                   </div>
               </div>
               
               {/* Footer hướng dẫn */}
               <div className="bg-white border-t border-slate-200 p-2 text-center text-[10px] text-slate-500 font-bold uppercase tracking-widest shrink-0 flex items-center justify-center gap-2 shadow-inner z-10">
                  <AlertTriangle size={12} className="text-amber-500"/>
                  Lưu ý: Mọi thông tin khai báo phải trung thực và chính xác tuyệt đối.
               </div>
            </div>
        </div>
      )}

      {/* Footer bản quyền */}
      {!showSoldierForm && (
        <div className="absolute bottom-6 left-0 right-0 text-center z-0 pointer-events-none">
          <div className="flex items-center justify-center gap-2 text-slate-600/50 text-[10px] font-black uppercase tracking-[0.3em]">
             <Server size={10} /> Military System v2.6.8 • Internal Use Only
          </div>
        </div>
      )}

      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background-color: rgba(148, 163, 184, 0.5); border-radius: 20px; }
        
        @keyframes scan {
          0% { top: 0%; opacity: 0; }
          50% { opacity: 1; }
          100% { top: 100%; opacity: 0; }
        }
        @keyframes scan-fast {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(300%); }
        }
        @keyframes fade-in {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes slide-up {
          from { transform: translateY(100%); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
        @keyframes shake {
          10%, 90% { transform: translate3d(-1px, 0, 0); }
          20%, 80% { transform: translate3d(2px, 0, 0); }
          30%, 50%, 70% { transform: translate3d(-2px, 0, 0); }
          40%, 60% { transform: translate3d(2px, 0, 0); }
        }
        .animate-scan { animation: scan 4s linear infinite; }
        .animate-scan-fast { animation: scan-fast 2s linear infinite; }
        .animate-fade-in { animation: fade-in 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
        .animate-slide-up { animation: slide-up 0.5s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
        .animate-shake { animation: shake 0.4s cubic-bezier(.36,.07,.19,.97) both; }
      `}</style>
    </div>
  );
};

export default LoginScreen;