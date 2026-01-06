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
  
  // State lưu danh sách đơn vị (Dùng cho Kiosk Mode)
  const [units, setUnits] = useState<Unit[]>([]);

  // Effect: Tải danh sách đơn vị khi khởi động App
  useEffect(() => {
    const loadUnits = async () => {
      try {
        const data = await db.getUnits();
        setUnits(data);
      } catch (e) {
        console.error("Lỗi tải danh sách đơn vị:", e);
      }
    };
    loadUnits();
  }, []);

  const handleCommanderLogin = () => {
    // SỬA LỖI BẢO MẬT: Loại bỏ logic 'OR' với mật khẩu cứng.
    // Lấy mật khẩu từ cài đặt, nếu chưa thiết lập thì mặc định là '123456'.
    // Khi người dùng đổi pass, '123456' sẽ không còn hiệu lực.
    const currentPassword = localStorage.getItem('admin_password') || '123456';

    if (password === currentPassword) {
      setMode(AppMode.COMMANDER);
      setShowLoginModal(false);
      setError('');
    } else {
      setError('Tên đăng nhập hoặc mật khẩu không đúng!');
    }
  };

  if (mode === AppMode.LOGIN) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-[#0f2e1f] relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-full opacity-30" style={{ backgroundImage: 'radial-gradient(at 10% 10%, rgba(212, 175, 55, 0.2) 0px, transparent 50%), radial-gradient(at 90% 90%, rgba(20, 69, 47, 0.8) 0px, transparent 50%)' }}></div>
        
        <div className="flex w-full max-w-4xl h-[550px] glass-panel rounded-3xl shadow-2xl overflow-hidden z-10 animate-fade-in">
          <div className="hidden md:flex flex-1 relative flex-col justify-end p-10 text-white bg-cover bg-center" style={{ backgroundImage: "url('https://images.unsplash.com/photo-1579912437766-79b846d0a775?q=80&w=1000&auto=format&fit=crop')" }}>
            <div className="absolute inset-0 bg-gradient-to-t from-[#14452F]/90 to-[#14452F]/30"></div>
            <div className="relative z-20">
              <div className="text-2xl font-bold uppercase tracking-widest border-b-4 border-[#d4af37] inline-block mb-4 pb-1">DHsystem 2026</div>
              <h2 className="text-3xl font-bold mb-2">QUẢN LÝ HỒ SƠ<br/>CHIẾN SĨ</h2>
              <p className="text-sm opacity-80">Hệ thống lõi DH-Core v2.6 - Giải pháp quản lý quân sự chuyên nghiệp.</p>
              <div className="mt-6 text-[#d4af37] text-xs font-bold flex items-center gap-2">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path d="M10 12a2 2 0 100-4 2 2 0 000 4z"/><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm0-2a6 6 0 100-12 6 6 0 000 12z" clipRule="evenodd"/></svg>
                Phiên bản Build 2026.05
              </div>
            </div>
          </div>

          <div className="flex-1 p-12 flex flex-col justify-center items-center bg-white">
            <h3 className="text-2xl font-black text-[#14452F] mb-1">CHỌN CHẾ ĐỘ</h3>
            <p className="text-gray-400 text-sm mb-10">Vui lòng chọn môi trường làm việc</p>

            <div className="w-full space-y-5">
              <button 
                onClick={() => setShowLoginModal(true)}
                className="w-full group flex items-center p-5 rounded-2xl military-green text-white hover:bg-[#0e3322] transition-all shadow-lg hover:-translate-y-1"
              >
                <div className="bg-white/10 p-3 rounded-xl mr-4 group-hover:scale-110 transition-transform">
                  <svg className="w-8 h-8 text-[#d4af37]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path></svg>
                </div>
                <div className="text-left">
                  <div className="font-black text-sm uppercase">Chỉ huy / Quản trị</div>
                  <div className="text-[10px] opacity-70">Truy cập Dashboard điều hành</div>
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
                  <div className="font-black text-sm uppercase">Chiến sĩ tự khai</div>
                  <div className="text-[10px] opacity-70">Chế độ Kiosk tự phục vụ</div>
                </div>
              </button>
            </div>
            <div className="mt-12 text-[9px] text-gray-300 font-bold uppercase tracking-widest">
              Powered by DHsystem &copy; 2026
            </div>
          </div>
        </div>

        {showLoginModal && (
          <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[100] animate-fade-in p-4">
            <div className="bg-white w-full max-w-sm rounded-3xl shadow-2xl overflow-hidden border-t-8 border-[#14452F]">
              <div className="p-8">
                <div className="flex justify-between items-center mb-6">
                  <h4 className="font-black text-[#14452F] uppercase flex items-center gap-2 text-xs">
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd"></path></svg>
                    Xác thực DH-Gate
                  </h4>
                  <button onClick={() => setShowLoginModal(false)} className="text-gray-400 hover:text-red-500">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                  </button>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-[10px] font-black uppercase text-gray-500 mb-1">Tên đăng nhập</label>
                    <input type="text" className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none font-bold text-xs" value="admin" readOnly />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black uppercase text-gray-500 mb-1">Mật khẩu</label>
                    <input 
                      type="password" 
                      className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 ring-[#14452F]/20 font-bold text-xs" 
                      placeholder="••••••" 
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && handleCommanderLogin()}
                      autoFocus
                    />
                  </div>
                  {error && <p className="text-red-500 text-[10px] font-bold text-center">{error}</p>}
                  <button onClick={handleCommanderLogin} className="w-full py-4 military-green text-white rounded-xl font-black uppercase tracking-widest shadow-lg transition-all text-xs">
                    Đăng nhập
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
        <header className="military-green text-white pt-10 pb-20 text-center relative" style={{ clipPath: 'polygon(0 0, 100% 0, 100% 85%, 50% 100%, 0 85%)' }}>
          <h1 className="text-3xl font-black uppercase tracking-tighter mb-2">Hệ thống Kiosk DHsystem</h1>
          <p className="text-sm opacity-70">Vui lòng khai báo thông tin trung thực and chính xác</p>
          <button 
            onClick={() => setMode(AppMode.LOGIN)}
            className="mt-4 px-4 py-2 border border-white/30 rounded-lg hover:bg-white/10 text-xs font-bold transition-all"
          >
            ← Thoát (Esc)
          </button>
        </header>
        <div className="flex-1 overflow-y-auto px-4 pb-20 -mt-10 scrollbar-hide">
          <div className="max-w-6xl mx-auto bg-white rounded-3xl shadow-2xl p-2">
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