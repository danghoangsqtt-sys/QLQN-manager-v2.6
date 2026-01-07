
import React, { useState, useEffect } from 'react';
import Dashboard from './components/Dashboard.tsx';
import PersonnelForm from './components/PersonnelForm.tsx';
import { db } from './store.ts';
import { Unit, AppMode } from './types.ts';
import { Lock, ShieldCheck, UserPlus, ArrowLeft } from 'lucide-react';

const App: React.FC = () => {
  const [mode, setMode] = useState<AppMode>(AppMode.LOGIN);
  const [password, setPassword] = useState('');
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
      <div className="min-h-screen bg-[#0e3322] flex flex-col items-center py-10 px-4">
        <button onClick={() => setMode(AppMode.LOGIN)} className="mb-6 text-white flex items-center gap-2 font-bold uppercase text-xs"><ArrowLeft /> Quay lại</button>
        <div className="w-full max-w-7xl bg-white rounded-3xl shadow-2xl overflow-hidden border-4 border-[#14452F]">
          <PersonnelForm units={units} onClose={() => { alert("Đã lưu hồ sơ thành công!"); setMode(AppMode.LOGIN); }} />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#14452F] flex items-center justify-center p-6">
      <div className="max-w-md w-full bg-white rounded-[2.5rem] shadow-2xl p-10 text-center">
        <ShieldCheck className="w-16 h-16 text-[#14452F] mx-auto mb-6" />
        <h1 className="text-2xl font-black text-[#14452F] uppercase mb-2">Đăng Nhập Hệ Thống</h1>
        <p className="text-xs text-gray-400 font-bold uppercase tracking-widest mb-10">Dành cho cán bộ quản lý</p>

        <form onSubmit={handleLogin} className="space-y-6">
          <div className="relative">
            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
            <input 
              type="password" 
              autoFocus
              className="w-full pl-12 pr-4 py-4 bg-gray-50 border rounded-2xl outline-none focus:ring-4 ring-green-600/5 font-bold text-lg"
              placeholder="Nhập mật khẩu..."
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          {error && <p className="text-red-500 text-xs font-bold italic">{error}</p>}
          <button type="submit" className="w-full py-4 bg-[#14452F] text-white rounded-2xl font-black uppercase tracking-widest shadow-xl">Vào phần mềm</button>
        </form>

        <div className="my-8 flex items-center"><div className="flex-1 border-t"></div><span className="px-4 text-[10px] text-gray-300 font-black uppercase">Hoặc</span><div className="flex-1 border-t"></div></div>

        <button onClick={() => setMode(AppMode.KIOSK)} className="w-full py-4 bg-amber-50 text-[#856404] border border-amber-200 rounded-2xl font-black uppercase text-xs flex items-center justify-center gap-2 hover:bg-amber-100">
          <UserPlus size={18} /> Quân nhân khai báo mới
        </button>
      </div>
    </div>
  );
};

export default App;
