
import React, { useState, useEffect } from 'react';
import Dashboard from './components/Dashboard';
import PersonnelForm from './components/PersonnelForm';
import { db } from './store';
import { Unit, AppMode } from './types';
import { Lock, ShieldCheck, UserPlus, ArrowLeft, Eye, EyeOff } from 'lucide-react';
import './index.css';
const App: React.FC = () => {
  const [mode, setMode] = useState<AppMode>(AppMode.LOGIN);
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [units, setUnits] = useState<Unit[]>([]);

  useEffect(() => {
    const loadUnits = async () => { setUnits(await db.getUnits()); };
    loadUnits();
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (await db.login(password)) {
      setMode(AppMode.COMMANDER);
      setError('');
    } else {
      setError('Mật khẩu không đúng. Vui lòng thử lại.');
    }
  };

  if (mode === AppMode.COMMANDER) return <Dashboard onLogout={() => { setMode(AppMode.LOGIN); setPassword(''); }} />;

  if (mode === AppMode.KIOSK) {
    return (
      <div className="min-h-screen bg-[#0e3322] flex flex-col items-center py-6 px-4">
        <button onClick={() => setMode(AppMode.LOGIN)} className="mb-4 text-white flex items-center gap-2 font-bold uppercase text-[10px] tracking-widest opacity-60 hover:opacity-100 transition-all"><ArrowLeft size={16} /> Quay lại đăng nhập</button>
        <div className="w-full max-w-6xl bg-white rounded-3xl shadow-2xl overflow-hidden border-2 border-[#14452F]">
          <PersonnelForm units={units} onClose={() => { alert("Đã lưu hồ sơ thành công!"); setMode(AppMode.LOGIN); }} />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#14452F] flex items-center justify-center p-6">
      <div className="max-w-sm w-full bg-white rounded-[2.5rem] shadow-2xl p-8 text-center border border-white/10">
        <div className="w-16 h-16 bg-green-50 rounded-2xl flex items-center justify-center mx-auto mb-6">
          <ShieldCheck className="w-10 h-10 text-[#14452F]" />
        </div>
        <h1 className="text-xl font-black text-[#14452F] uppercase mb-1 tracking-tight">Đăng Nhập Hệ Thống</h1>
        <p className="text-[9px] text-slate-400 font-bold uppercase tracking-[0.2em] mb-10">Dành cho cán bộ quản lý</p>

        <form onSubmit={handleLogin} className="space-y-6 text-left">
          <div className="relative">
            <label className="block text-[9px] font-black text-slate-400 uppercase mb-2 ml-1 tracking-widest">Mật khẩu truy cập</label>
            <div className="relative group">
              <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-[#14452F] transition-colors">
                <Lock size={18} />
              </div>
              <input 
                type={showPassword ? "text" : "password"} 
                autoFocus
                className="w-full pl-12 pr-12 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:ring-4 ring-green-600/5 font-bold text-base text-[#14452F] caret-[#14452F] placeholder:text-slate-300 transition-all shadow-inner"
                placeholder="••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <button 
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-[#14452F] transition-colors p-1"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>
          {error && (
            <div className="flex items-center gap-2 text-red-500 text-[10px] font-bold italic px-1 animate-pulse">
              <div className="w-1 h-1 bg-red-500 rounded-full"></div>
              {error}
            </div>
          )}
          <button 
            type="submit" 
            className="w-full py-4 bg-[#14452F] text-white rounded-2xl font-black uppercase tracking-[0.2em] shadow-xl hover:bg-green-800 active:scale-95 transition-all text-[10px]"
          >
            Vào phần mềm
          </button>
        </form>

        <div className="my-8 flex items-center">
          <div className="flex-1 border-t border-slate-100"></div>
          <span className="px-3 text-[8px] text-slate-300 font-black uppercase tracking-widest">Hoặc</span>
          <div className="flex-1 border-t border-slate-100"></div>
        </div>

        <button 
          onClick={() => setMode(AppMode.KIOSK)} 
          className="w-full py-3.5 bg-amber-50 text-amber-700 border border-amber-100 rounded-2xl font-black uppercase text-[9px] flex items-center justify-center gap-2 hover:bg-amber-100 transition-all shadow-sm tracking-widest"
        >
          <UserPlus size={16} /> Quân nhân khai báo mới
        </button>
      </div>
    </div>
  );
};

export default App;
