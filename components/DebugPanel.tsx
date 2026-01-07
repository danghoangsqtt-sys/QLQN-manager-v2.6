
import React, { useState, useEffect } from 'react';
import { db } from '../store';
import { LogEntry } from '../types';

const DebugPanel: React.FC = () => {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [stats, setStats] = useState({ personnelCount: 0, unitCount: 0, status: '...', storageUsage: '...' });

  const refreshData = async () => {
    const fetchedLogs = await db.getLogs();
    setLogs(fetchedLogs);
    const fetchedStats = await db.getSystemStats();
    setStats(fetchedStats);
  };

  useEffect(() => {
    refreshData();
    const interval = setInterval(refreshData, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="grid grid-cols-12 gap-6 animate-fade-in font-mono">
      <div className="col-span-12 lg:col-span-4 space-y-6">
        <div className="bg-[#1a1a1a] text-green-400 p-6 rounded-2xl border border-green-900 shadow-2xl">
          <h3 className="text-xs font-black uppercase mb-6 flex items-center gap-2 border-b border-green-900 pb-2">
            <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
            System Health
          </h3>
          <div className="space-y-4 text-[11px]">
            <div className="flex justify-between border-b border-green-900/30 pb-2">
              <span className="opacity-60 uppercase">Dữ liệu:</span>
              <span className="font-bold text-white">{stats.personnelCount} hồ sơ</span>
            </div>
            <div className="flex justify-between border-b border-green-900/30 pb-2">
              <span className="opacity-60 uppercase">Đơn vị:</span>
              <span className="font-bold text-white">{stats.unitCount}</span>
            </div>
            <div className="flex justify-between border-b border-green-900/30 pb-2">
              <span className="opacity-60 uppercase">Engine:</span>
              <span className="font-bold text-white">{stats.status}</span>
            </div>
          </div>
          <button onClick={() => db.clearLogs().then(refreshData)} className="w-full mt-8 py-3 bg-red-500/10 text-red-500 border border-red-500/20 rounded-lg text-[10px] font-black uppercase">Xóa lịch sử nhật ký</button>
        </div>
      </div>

      <div className="col-span-12 lg:col-span-8 flex flex-col h-[650px]">
        <div className="bg-[#0c0c0c] flex-1 rounded-2xl border border-gray-800 flex flex-col overflow-hidden">
          <div className="bg-[#1a1a1a] px-6 py-4 border-b border-gray-800 text-[10px] text-gray-500 font-bold uppercase tracking-widest">
             Real-time Operation Logs
          </div>
          <div className="flex-1 overflow-y-auto p-6 space-y-3 scrollbar-hide text-[11px]">
            {logs.length === 0 ? (
              <div className="h-full flex items-center justify-center opacity-20 italic text-green-400">Đang chờ sự kiện...</div>
            ) : (
              logs.map(log => (
                <div key={log.id} className="flex gap-4 border-l-2 pl-4 border-green-800">
                  <span className="text-gray-600">[{new Date(log.timestamp).toLocaleTimeString()}]</span>
                  <span className={`font-black uppercase w-16 ${log.level === 'ERROR' ? 'text-red-500' : log.level === 'WARN' ? 'text-yellow-500' : 'text-green-500'}`}>{log.level}</span>
                  <span className="text-gray-300 flex-1">{log.message}</span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DebugPanel;
