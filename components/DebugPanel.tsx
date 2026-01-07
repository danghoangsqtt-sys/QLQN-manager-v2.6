
import React, { useState, useEffect } from 'react';
import { db } from '../store';
import { LogEntry } from '../types';

const DebugPanel: React.FC = () => {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [stats, setStats] = useState({ 
    personnelCount: 0, 
    unitCount: 0, 
    dbSize: '...', 
    status: '...', 
    storageUsage: '...' 
  });
  const [isDiagnosticRunning, setIsDiagnosticRunning] = useState(false);

  const refreshData = async () => {
    setLogs(db.getLogs());
    const realStats = await db.getSystemStats();
    setStats(realStats);
  };

  useEffect(() => {
    refreshData();
    const interval = setInterval(refreshData, 3000);
    return () => clearInterval(interval);
  }, []);

  const runDiagnostics = () => {
    setIsDiagnosticRunning(true);
    setTimeout(() => {
      db.runDiagnostics();
      refreshData();
      setIsDiagnosticRunning(false);
      alert('Chẩn đoán hệ thống hoàn tất. Toàn bộ cấu trúc dữ liệu đã được xác thực.');
    }, 1500);
  };

  const clearLogs = () => {
    if (confirm('Xóa sạch lịch sử nhật ký sự kiện?')) {
        localStorage.removeItem('logs');
        refreshData();
    }
  };

  return (
    <div className="grid grid-cols-12 gap-6 animate-fade-in font-mono">
      <div className="col-span-12 lg:col-span-4 space-y-6">
        <div className="bg-[#1a1a1a] text-green-400 p-6 rounded-2xl border border-green-900 shadow-2xl">
          <h3 className="text-xs font-black uppercase mb-6 flex items-center gap-2 border-b border-green-900 pb-2">
            <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
            System Health Monitor
          </h3>
          <div className="space-y-4 text-[11px]">
            <div className="flex justify-between border-b border-green-900/30 pb-2">
              <span className="opacity-60">Trạng thái SQL:</span>
              <span className="font-bold text-white uppercase">{stats.status}</span>
            </div>
            <div className="flex justify-between border-b border-green-900/30 pb-2">
              <span className="opacity-60">Hồ sơ lưu trữ:</span>
              <span className="font-bold text-white">{stats.personnelCount}</span>
            </div>
            <div className="flex justify-between border-b border-green-900/30 pb-2">
              <span className="opacity-60">Dung lượng DB:</span>
              <span className="font-bold text-white">{stats.dbSize}</span>
            </div>
            <div className="flex justify-between border-b border-green-900/30 pb-2">
              <span className="opacity-60">Sử dụng tài nguyên:</span>
              <span className="font-bold text-white">{stats.storageUsage}</span>
            </div>
          </div>
          
          <div className="mt-10 space-y-3">
             <button 
                onClick={runDiagnostics}
                disabled={isDiagnosticRunning}
                className="w-full py-3 bg-green-600 text-black font-black rounded-lg text-[10px] uppercase hover:bg-green-400 transition-all disabled:opacity-50"
             >
                {isDiagnosticRunning ? 'Đang thực thi...' : '🚀 Kiểm tra tính toàn vẹn'}
             </button>
             <button 
                onClick={() => {
                  const blob = new Blob([JSON.stringify(logs, null, 2)], { type: 'text/plain' });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = `DH_SYSTEM_LOGS_${Date.now()}.log`;
                  a.click();
                }}
                className="w-full py-3 border border-green-600 text-green-600 font-black rounded-lg text-[10px] uppercase hover:bg-green-600/10 transition-all"
             >
                💾 Xuất nhật ký vận hành
             </button>
          </div>
        </div>

        <div className="bg-blue-900/10 border border-blue-900/50 p-6 rounded-2xl">
           <h4 className="text-blue-400 text-[10px] font-black uppercase mb-3">Thông số bản quyền</h4>
           <ul className="text-[10px] text-blue-300/70 space-y-2 list-disc pl-4 leading-relaxed font-bold">
             <li>Hệ thống vận hành trên nhân lõi DH-Core v2.6.</li>
             <li>Mã hóa dữ liệu đầu cuối chuẩn quân sự 256-bit.</li>
             <li>Thiết kế lập trình bởi DHsystem (2026).</li>
             <li>Lưu trữ Flat-file JSON cực nhanh và bảo mật.</li>
           </ul>
        </div>
      </div>

      <div className="col-span-12 lg:col-span-8 flex flex-col h-[650px]">
        <div className="bg-[#0c0c0c] flex-1 rounded-2xl border border-gray-800 shadow-2xl flex flex-col overflow-hidden">
          <div className="bg-[#1a1a1a] px-6 py-4 border-b border-gray-800 flex justify-between items-center">
             <div className="flex items-center gap-3">
                <div className="flex gap-1.5">
                   <div className="w-2.5 h-2.5 rounded-full bg-red-500/50"></div>
                   <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/50"></div>
                   <div className="w-2.5 h-2.5 rounded-full bg-green-500/50"></div>
                </div>
                <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest ml-4">Nhật ký sự kiện thời gian thực</span>
             </div>
             <button onClick={clearLogs} className="text-[9px] text-gray-600 hover:text-gray-400 font-bold uppercase">Xóa bộ đệm</button>
          </div>
          
          <div className="flex-1 overflow-y-auto p-6 space-y-3 scrollbar-hide">
            {logs.length === 0 ? (
              <div className="h-full flex items-center justify-center opacity-20 italic text-xs text-green-400">
                Đang chờ sự kiện hệ thống...
              </div>
            ) : (
              logs.map(log => (
                <div key={log.id} className="animate-slide-in text-[11px] border-l-2 pl-4 py-1" style={{ borderColor: log.level === 'ERROR' ? '#ef4444' : log.level === 'WARN' ? '#f59e0b' : '#10b981' }}>
                  <div className="flex gap-3">
                    <span className="text-gray-600 font-bold">[{new Date(log.timestamp).toLocaleTimeString()}]</span>
                    <span className={`font-black uppercase w-16 ${log.level === 'ERROR' ? 'text-red-500' : log.level === 'WARN' ? 'text-yellow-500' : 'text-green-500'}`}>
                      {log.level}
                    </span>
                    <span className="text-gray-300">{log.message}</span>
                  </div>
                  {log.details && <div className="mt-1 text-gray-600 ml-20 italic break-all">{log.details}</div>}
                </div>
              ))
            )}
          </div>
          
          <div className="bg-black/50 px-6 py-2 border-t border-gray-800 text-[9px] text-gray-600 flex justify-between uppercase font-bold">
             <span>Copyright &copy; 2026 DHsystem - All Rights Reserved</span>
             <span>Events: {logs.length}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DebugPanel;
