
import React, { useState, useEffect } from 'react';
import { Shield, Key, UserPlus, Star, Crosshair, ChevronRight, Activity, Radio, Target, FileText } from 'lucide-react';
import PersonnelForm from './PersonnelForm';
import { db } from '../store';
import { Unit } from '../types';

interface LoginScreenProps {
  onLoginSuccess: () => void;
}

const LoginScreen: React.FC<LoginScreenProps> = ({ onLoginSuccess }) => {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  // State cho chế độ chiến sĩ
  const [showSoldierForm, setShowSoldierForm] = useState(false);
  const [units, setUnits] = useState<Unit[]>([]);

  // Load danh sách đơn vị
  useEffect(() => {
    const fetchUnits = async () => {
        try {
            // FIX: Sử dụng phương thức db.getUnits() để lấy dữ liệu đơn vị thay vì truy cập trực tiếp db.units (không tồn tại trên Store)
            const data = await db.getUnits();
            setUnits(data);
        } catch (e) {
            console.error("Lỗi tải đơn vị:", e);
        }
    };
    fetchUnits();
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      // @ts-ignore
      const success = await window.electronAPI.login(password);
      
      setTimeout(() => {
          if (success) {
            onLoginSuccess();
          } else {
            setError('MÃ TRUY CẬP KHÔNG HỢP LỆ.');
            setIsLoading(false);
          }
      }, 800);
    } catch (err) {
      console.error(err);
      setError('LỖI KẾT NỐI HỆ THỐNG.');
      setIsLoading(false);
    }
  };

  return (
    // Đã thay đổi font-mono thành font-sans để đồng bộ với toàn hệ thống
    <div className="min-h-screen bg-[#050f0a] flex flex-col relative overflow-hidden font-sans text-green-500 selection:bg-green-500 selection:text-black">
      
      {/* --- CSS TÙY CHỈNH THANH CUỘN & ANIMATION --- */}
      <style>{`
        /* Thanh cuộn quân sự */
        ::-webkit-scrollbar {
          width: 8px;
          height: 8px;
        }
        ::-webkit-scrollbar-track {
          background: #0a1f16; 
          border-left: 1px solid #14452F;
        }
        ::-webkit-scrollbar-thumb {
          background: #22c55e; 
          border-radius: 0px;
        }
        ::-webkit-scrollbar-thumb:hover {
          background: #15803d; 
          box-shadow: 0 0 10px #22c55e;
        }

        /* Hiệu ứng quét Radar */
        @keyframes radar-spin {
          from { transform: translate(-50%, -50%) rotate(0deg); }
          to { transform: translate(-50%, -50%) rotate(360deg); }
        }
        .radar-sweep {
          background: conic-gradient(from 0deg, transparent 0deg, rgba(34, 197, 94, 0.1) 60deg, rgba(34, 197, 94, 0.4) 90deg, transparent 91deg);
          animation: radar-spin 4s linear infinite;
        }
        
        /* Clip path vát góc */
        .clip-corner {
          clip-path: polygon(
            0 0, 
            100% 0, 
            100% calc(100% - 15px), 
            calc(100% - 15px) 100%, 
            0 100%
          );
        }
        .clip-corner-top {
          clip-path: polygon(
            15px 0, 
            100% 0, 
            100% 100%, 
            0 100%, 
            0 15px
          );
        }
      `}</style>

      {/* --- BACKGROUND EFFECTS --- */}
      <div className="absolute inset-0 z-0 pointer-events-none">
         {/* Grid lưới nền */}
         <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'linear-gradient(#14452F 1px, transparent 1px), linear-gradient(90deg, #14452F 1px, transparent 1px)', backgroundSize: '50px 50px' }}></div>
         
         {/* Radar Elements */}
         <div className="absolute top-1/2 left-1/2 w-[80vh] h-[80vh] border border-green-900/40 rounded-full -translate-x-1/2 -translate-y-1/2"></div>
         <div className="absolute top-1/2 left-1/2 w-[60vh] h-[60vh] border border-green-800/30 rounded-full -translate-x-1/2 -translate-y-1/2"></div>
         <div className="absolute top-1/2 left-1/2 w-[80vh] h-[80vh] rounded-full -translate-x-1/2 -translate-y-1/2 radar-sweep opacity-50"></div>
         
         {/* Crosshairs Decorations */}
         <div className="absolute top-10 left-10 text-green-900/50"><Crosshair size={40} /></div>
         <div className="absolute bottom-10 right-10 text-green-900/50"><Crosshair size={40} /></div>
         <div className="absolute top-10 right-10 text-green-900/50 rotate-90"><Crosshair size={40} /></div>
         <div className="absolute bottom-10 left-10 text-green-900/50 -rotate-90"><Crosshair size={40} /></div>
      </div>

      {/* --- LOGIN CONTENT --- */}
      <div className="relative z-10 flex-1 flex flex-col items-center justify-center p-4">
        
        {/* LOGO AREA */}
        <div className="mb-12 text-center animate-fade-in-down group cursor-default">
          <div className="relative inline-flex items-center justify-center mb-6">
             <div className="absolute inset-0 bg-green-500 blur-[40px] opacity-10 group-hover:opacity-20 transition-opacity duration-500"></div>
             <div className="relative border-2 border-green-500/30 p-4 rounded-full bg-[#0a1f16]/80 backdrop-blur-sm">
                <Shield size={64} className="text-green-500 drop-shadow-[0_0_15px_rgba(34,197,94,0.5)]" strokeWidth={1.5} />
             </div>
             {/* Decorative lines around logo */}
             <div className="absolute -left-12 top-1/2 w-10 h-[1px] bg-green-800"></div>
             <div className="absolute -right-12 top-1/2 w-10 h-[1px] bg-green-800"></div>
          </div>
          
          <h1 className="text-4xl md:text-6xl font-black uppercase tracking-[0.15em] text-white drop-shadow-xl mb-3 flex flex-col gap-1">
            <span className="text-sm tracking-[0.5em] text-green-600 font-bold mb-[-5px]">HỆ THỐNG QUẢN LÝ</span>
            <span className="bg-clip-text text-transparent bg-gradient-to-b from-white to-gray-400">QUÂN NHÂN</span>
          </h1>
          
          <div className="flex items-center justify-center gap-4 text-[10px] font-bold text-green-600 tracking-[0.3em] uppercase border-t border-b border-green-900/50 py-2 mx-auto max-w-xs">
            <Star size={10} fill="currentColor" />
            <span>DHsystem v8.0</span>
            <Star size={10} fill="currentColor" />
          </div>
        </div>

        {/* LOGIN BOX */}
        <div className="w-full max-w-sm bg-[#0a1f16]/90 backdrop-blur-md border border-green-500/30 p-1 clip-corner relative group hover:border-green-500/60 transition-colors duration-500 shadow-[0_0_30px_rgba(0,0,0,0.5)]">
          {/* Status indicators */}
          <div className="absolute -top-6 right-0 flex gap-1">
            <div className="w-2 h-2 bg-green-500 animate-pulse"></div>
            <div className="w-2 h-2 bg-green-900"></div>
            <div className="w-2 h-2 bg-green-900"></div>
          </div>

          <div className="bg-[#050f0a] p-8 clip-corner">
             <h2 className="text-xs font-bold text-green-400 uppercase tracking-widest mb-8 flex items-center justify-between">
               <span className="flex items-center gap-2"><Key size={14} /> XÁC THỰC CHỈ HUY</span>
               <span className="text-[10px] text-green-800">SEC-01</span>
             </h2>
             
             <form onSubmit={handleLogin} className="space-y-6">
                <div className="relative group/input">
                   <div className="absolute -left-1 top-1/2 -translate-y-1/2 w-1 h-4 bg-green-700 transition-all group-focus-within/input:h-8 group-focus-within/input:bg-green-400"></div>
                   <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full bg-[#0a1f16] text-white border border-green-900 p-4 pl-6 outline-none focus:border-green-500 focus:bg-[#0f2e1f] transition-all font-bold tracking-[0.3em] text-center uppercase placeholder-green-900/50 text-lg shadow-inner"
                      placeholder="••••••"
                      autoFocus
                   />
                </div>

                {error && (
                  <div className="bg-red-950/30 border-l-2 border-red-500 p-3 flex items-center gap-3 text-red-500 text-[10px] font-bold uppercase animate-shake tracking-wider">
                    <Activity size={14} className="shrink-0 animate-pulse" /> {error}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isLoading || !password}
                  className={`w-full py-4 font-black uppercase text-xs tracking-[0.2em] transition-all relative overflow-hidden group/btn ${
                    isLoading || !password
                      ? 'bg-green-900/20 text-green-800 border border-green-900/50 cursor-not-allowed'
                      : 'bg-green-600 hover:bg-green-500 text-black shadow-[0_0_20px_rgba(34,197,94,0.3)] hover:shadow-[0_0_30px_rgba(34,197,94,0.6)]'
                  }`}
                >
                  <span className="relative z-10 flex items-center justify-center gap-2">
                    {isLoading ? <Target className="animate-spin" size={16}/> : <Radio size={16} />}
                    {isLoading ? 'ĐANG KẾT NỐI...' : 'TRUY CẬP'}
                  </span>
                </button>
             </form>
          </div>
        </div>
      </div>

      {/* --- SOLDIER ENTRY BAR --- */}
      <div className="relative z-20 border-t border-green-900/50 bg-[#020503]/90 backdrop-blur-sm">
        <div className="h-[2px] w-full bg-gradient-to-r from-transparent via-green-500/50 to-transparent"></div>
        <div className="max-w-5xl mx-auto p-4 md:p-6 flex flex-col md:flex-row items-center justify-between gap-6">
           <div className="flex items-center gap-6">
              <div className="w-12 h-12 bg-green-900/20 rounded flex items-center justify-center border border-green-500/30 text-green-500">
                 <FileText size={24} />
              </div>
              <div className="text-center md:text-left">
                  <h3 className="text-green-400 font-bold uppercase tracking-wider text-sm mb-1">
                     Khu vực nhập liệu chiến sĩ
                  </h3>
                  <p className="text-[10px] text-green-700">
                     Hệ thống mở cổng nhập liệu từ xa • Bảo mật mức 3
                  </p>
              </div>
           </div>
           
           <button 
             onClick={() => setShowSoldierForm(true)}
             className="relative overflow-hidden group px-8 py-3 bg-transparent border border-green-600/30 text-green-400 hover:text-green-300 hover:border-green-400 transition-all uppercase text-xs font-bold tracking-widest clip-corner-top"
           >
              <div className="absolute inset-0 bg-green-500/10 translate-y-full group-hover:translate-y-0 transition-transform duration-300"></div>
              <span className="relative flex items-center gap-3">
                 Khai báo hồ sơ mới
                 <ChevronRight size={14} className="group-hover:translate-x-1 transition-transform" />
              </span>
           </button>
        </div>
      </div>

      {/* --- MODAL FORM CHO CHIẾN SĨ (FULL SCREEN OVERLAY) --- */}
      {showSoldierForm && (
         <div className="fixed inset-0 z-[100] bg-[#0a1f16] flex flex-col animate-fade-in">
            {/* Header Modal */}
            <div className="bg-[#020503] border-b border-green-800 p-4 flex items-center justify-between shrink-0 shadow-lg z-[110] relative">
               <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-green-900/20 rounded-full flex items-center justify-center border border-green-500/20">
                    <Shield className="text-green-500" size={20} />
                  </div>
                  <div>
                    <h2 className="text-green-400 font-black uppercase tracking-widest text-sm flex items-center gap-2">
                      Cổng Nhập Liệu <span className="px-2 py-0.5 bg-green-900/30 text-[10px] rounded text-green-300">LIVE</span>
                    </h2>
                    <p className="text-[10px] text-gray-500 mt-0.5">Mã phiên: {new Date().getTime().toString().slice(-6)} • Mode: Nhập liệu bảo mật</p>
                  </div>
               </div>
               
               <div className="flex items-center gap-4">
                 <div className="hidden md:flex flex-col items-end text-[10px] text-green-800 mr-4">
                    <span>STATUS: SECURE</span>
                    <span>CONNECTION: ENCRYPTED</span>
                 </div>
                 <button 
                    onClick={() => setShowSoldierForm(false)}
                    className="px-6 py-2 bg-red-950/30 text-red-500 border border-red-900/50 hover:bg-red-900/50 hover:text-red-400 hover:border-red-500 transition-all text-xs font-bold uppercase rounded tracking-wider flex items-center gap-2"
                 >
                    <Crosshair size={14} /> Đóng Cổng
                 </button>
               </div>
               
               {/* Progress bar effect under header */}
               <div className="absolute bottom-0 left-0 h-[1px] bg-green-500/50 w-full animate-pulse"></div>
            </div>

            {/* Form Container - Tối ưu cuộn dọc */}
            <div className="flex-1 bg-[#f4f6f8] relative overflow-hidden flex flex-col">
               {/* Container cuộn chính - Thêm padding để form không dính sát lề */}
               <div className="flex-1 overflow-y-auto p-4 md:p-8 custom-scrollbar scroll-smooth">
                   <div className="max-w-7xl mx-auto pb-20">
                       {/* Truyền prop isViewMode=false để cho phép nhập */}
                       <PersonnelForm 
                          units={units} 
                          onClose={() => setShowSoldierForm(false)} 
                          isViewMode={false} 
                       />
                   </div>
               </div>
            </div>
         </div>
      )}
    </div>
  );
};

export default LoginScreen;
