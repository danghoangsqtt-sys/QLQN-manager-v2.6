import React, { useState, useEffect } from 'react';
import { AppMode, Unit } from './types';
import Dashboard from './components/Dashboard';
import PersonnelForm from './components/PersonnelForm';
import { db } from './store';

const App: React.FC = () => {
  const [mode, setMode] = useState<AppMode>(AppMode.LOGIN);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  // State lưu danh sách đơn vị (Dùng cho Kiosk Mode)
  const [units, setUnits] = useState<Unit[]>([]);

  // Hàm tải danh sách đơn vị
  const loadUnits = async () => {
    try {
      const data = await db.getUnits();
      setUnits(data);
    } catch (e) {
      console.error("Lỗi tải danh sách đơn vị:", e);
    }
  };

  // Effect: Tải danh sách đơn vị khi khởi động App
  useEffect(() => {
    loadUnits();
  }, []);

  // Effect: Tải lại đơn vị khi chuyển sang chế độ Kiosk để đảm bảo dữ liệu mới nhất
  useEffect(() => {
    if (mode === AppMode.KIOSK) {
      loadUnits();
    }
  }, [mode]);

  const handleCommanderLogin = async () => {
    if (!password) {
      setError('Vui lòng nhập mật khẩu!');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      // GỌI API ĐĂNG NHẬP AN TOÀN TỪ STORE -> PRELOAD -> MAIN (HASH CHECK)
      const isValid = await db.login(password);
      
      if (isValid) {
        setMode(AppMode.COMMANDER);
        setShowLoginModal(false);
        setPassword(''); // Xóa mật khẩu khỏi state sau khi đăng nhập thành công
        setError('');
      } else {
        setError('Mật khẩu không đúng, vui lòng thử lại.');
      }
    } catch (e) {
      console.error(e);
      setError('Lỗi hệ thống xác thực. Vui lòng kiểm tra Logs.');
    } finally {
      setIsLoading(false);
    }
  };

  if (mode === AppMode.LOGIN) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-[#0f2e1f] relative overflow-hidden">
        {/* Background Animation Effect */}
        <div className="absolute top-0 left-0 w-full h-full opacity-30 animate-pulse" style={{ backgroundImage: 'radial-gradient(at 10% 10%, rgba(212, 175, 55, 0.2) 0px, transparent 50%), radial-gradient(at 90% 90%, rgba(20, 69, 47, 0.8) 0px, transparent 50%)' }}></div>
        
        <div className="flex w-full max-w-4xl h-[550px] glass-panel rounded-3xl shadow-2xl overflow-hidden z-10 animate-fade-in border border-white/10">
          {/* Left Panel - Image */}
          <div className="hidden md:flex flex-1 relative flex-col justify-end p-10 text-white bg-cover bg-center" style={{ backgroundImage: "url('https://images.unsplash.com/photo-1579912437766-79b846d0a775?q=80&w=1000&auto=format&fit=crop')" }}>
            <div className="absolute inset-0 bg-gradient-to-t from-[#14452F] to-[#14452F]/40"></div>
            <div className="relative z-20">
              <div className="text-2xl font-bold uppercase tracking-widest border-b-4 border-[#d4af37] inline-block mb-4 pb-1">DHsystem 2026</div>
              <h2 className="text-3xl font-bold mb-2">QUẢN LÝ HỒ SƠ<br/>QUÂN NHÂN</h2>
              <p className="text-sm opacity-80 font-medium">Hệ thống lõi DH-Core v2.6 - Bảo mật & Tối ưu hóa.</p>
              <div className="mt-6 text-[#d4af37] text-xs font-bold flex items-center gap-2 bg-black/20 p-2 rounded-lg w-fit">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path d="M10 12a2 2 0 100-4 2 2 0 000 4z"/><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm0-2a6 6 0 100-12 6 6 0 000 12z" clipRule="evenodd"/></svg>
                Secure Database Mode
              </div>
            </div>
          </div>

          {/* Right Panel - Actions */}
          <div className="flex-1 p-12 flex flex-col justify-center items-center bg-white">
            <h3 className="text-2xl font-black text-[#14452F] mb-1 uppercase tracking-tight">Cổng Đăng Nhập</h3>
            <p className="text-gray-400 text-sm mb-10 font-bold">Vui lòng chọn chế độ truy cập</p>

            <div className="w-full space-y-5">
              <button 
                onClick={() => { setShowLoginModal(true); setError(''); }}
                className="w-full group flex items-center p-5 rounded-2xl military-green text-white hover:bg-[#0e3322] transition-all shadow-lg hover:-translate-y-1 relative overflow-hidden"
              >
                <div className="absolute inset-0 bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                <div className="bg-white/10 p-3 rounded-xl mr-4 group-hover:scale-110 transition-transform">
                  <svg className="w-8 h-8 text-[#d4af37]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path></svg>
                </div>
                <div className="text-left">
                  <div className="font-black text-sm uppercase tracking-wider">Chỉ huy / Quản trị</div>
                  <div className="text-[10px] opacity-70 font-medium">Truy cập Dashboard điều hành</div>
                </div>
              </button>

              <button 
                onClick={() => setMode(AppMode.KIOSK)}
                className="w-full group flex items-center p-5 rounded-2xl bg-white border-2 border-[#14452F] text-[#14452F] hover:bg-green-50 transition-all shadow-sm hover:-translate-y-1"
              >
                <div className="bg-[#14452F]/5 p-3 rounded-xl mr-4 group-hover:scale-110 transition-transform">
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2-2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path></svg>
                </div>
                <div className="text-left">
                  <div className="font-black text-sm uppercase tracking-wider">Chiến sĩ tự khai</div>
                  <div className="text-[10px] opacity-70 font-medium">Chế độ Kiosk tự phục vụ</div>
                </div>
              </button>
            </div>
            <div className="mt-12 text-[9px] text-gray-300 font-bold uppercase tracking-widest">
              Powered by DHsystem &copy; 2026
            </div>
          </div>
        </div>

        {/* Login Modal */}
        {showLoginModal && (
          <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[100] animate-fade-in p-4 backdrop-blur-sm">
            <div className="bg-white w-full max-w-sm rounded-3xl shadow-2xl overflow-hidden border-t-8 border-[#14452F]">
              <div className="p-8">
                <div className="flex justify-between items-center mb-6">
                  <h4 className="font-black text-[#14452F] uppercase flex items-center gap-2 text-xs tracking-widest">
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd"></path></svg>
                    Xác thực DH-Gate
                  </h4>
                  <button onClick={() => setShowLoginModal(false)} className="text-gray-400 hover:text-red-500 transition-colors">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                  </button>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-[10px] font-black uppercase text-gray-500 mb-1">Tên đăng nhập</label>
                    <div className="relative">
                       <input type="text" className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none font-bold text-xs text-gray-600 pl-10" value="admin" readOnly />
                       <div className="absolute left-3 top-3 text-gray-400">
                          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd"/></svg>
                       </div>
                    </div>
                  </div>
                  <div>
                    <label className="block text-[10px] font-black uppercase text-gray-500 mb-1">Mật khẩu bảo mật</label>
                    <div className="relative">
                        <input 
                        type="password" 
                        className="w-full p-3 pl-10 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 ring-[#14452F]/20 font-bold text-xs transition-all focus:bg-white" 
                        placeholder="••••••" 
                        value={password}
                        onChange={e => setPassword(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && handleCommanderLogin()}
                        autoFocus
                        />
                        <div className="absolute left-3 top-3 text-gray-400">
                            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd"/></svg>
                        </div>
                    </div>
                  </div>
                  
                  {error && (
                    <div className="p-3 bg-red-50 border border-red-100 rounded-xl flex items-center gap-2 animate-fade-in">
                       <svg className="w-4 h-4 text-red-500 shrink-0" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd"/></svg>
                       <p className="text-red-500 text-[10px] font-bold">{error}</p>
                    </div>
                  )}

                  <button 
                    onClick={handleCommanderLogin} 
                    disabled={isLoading}
                    className="w-full py-4 military-green text-white rounded-xl font-black uppercase tracking-widest shadow-lg transition-all text-xs hover:bg-[#0e3322] active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed flex justify-center items-center gap-2"
                  >
                    {isLoading ? (
                        <>
                            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                            Đang xác thực...
                        </>
                    ) : 'Đăng nhập hệ thống'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  if (mode === AppMode.KIOSK) {
    return (
      <div className="h-screen w-full bg-[#f0f2f5] flex flex-col overflow-hidden">
        <header className="military-green text-white pt-10 pb-20 text-center relative shadow-xl" style={{ clipPath: 'polygon(0 0, 100% 0, 100% 85%, 50% 100%, 0 85%)' }}>
          <h1 className="text-3xl font-black uppercase tracking-tighter mb-2">Hệ thống Kiosk DHsystem</h1>
          <p className="text-sm opacity-70 font-medium">Vui lòng khai báo thông tin trung thực và chính xác</p>
          <button 
            onClick={() => setMode(AppMode.LOGIN)}
            className="mt-4 px-6 py-2 border border-white/30 rounded-full hover:bg-white/10 text-xs font-bold transition-all flex items-center gap-2 mx-auto"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"/></svg>
            Quay lại màn hình chính
          </button>
        </header>
        <div className="flex-1 overflow-y-auto px-4 pb-20 -mt-10 scrollbar-hide">
          <div className="max-w-6xl mx-auto bg-white rounded-[2.5rem] shadow-2xl p-2 border-4 border-white">
            {/* Sử dụng state units thay vì gọi db.getUnits() trực tiếp */}
            <PersonnelForm units={units} onClose={() => { alert('Dữ liệu đã được chuyển vào hàng đợi duyệt!'); setMode(AppMode.LOGIN); }} />
          </div>
        </div>
      </div>
    );
  }

  return (
    <Dashboard onLogout={() => setMode(AppMode.LOGIN)} />
  );
};

export default App;