import React, { useState, useEffect } from 'react';
import { MilitaryPersonnel, Unit } from '../types';
import { db } from '../store';
import PersonnelForm from './PersonnelForm';
import UnitTree from './UnitTree';
import Settings from './Settings';
import DebugPanel from './DebugPanel';

interface DashboardProps {
  onLogout: () => void;
}

const Dashboard: React.FC<DashboardProps> = ({ onLogout }) => {
  const [personnel, setPersonnel] = useState<MilitaryPersonnel[]>([]);
  const [units, setUnits] = useState<Unit[]>([]);
  
  // Basic States
  const [search, setSearch] = useState('');
  const [filterUnit, setFilterUnit] = useState('all');
  
  // Advanced Filter States (New)
  const [isAdvancedFilter, setIsAdvancedFilter] = useState(false);
  const [filterRank, setFilterRank] = useState('all');
  const [filterSecurity, setFilterSecurity] = useState('all');
  const [filterEducation, setFilterEducation] = useState('all');
  const [filterMarital, setFilterMarital] = useState('all');
  const [filterPolitical, setFilterPolitical] = useState('all');

  const [showForm, setShowForm] = useState(false);
  const [editingPerson, setEditingPerson] = useState<MilitaryPersonnel | undefined>();
  const [activeView, setActiveView] = useState<'list' | 'units' | 'input' | 'settings' | 'debug'>('list');

  const refreshData = () => {
    setPersonnel(db.getPersonnel({ 
      unitId: filterUnit, 
      keyword: search,
      // Truyền các tham số lọc mới vào store
      rank: filterRank,
      security: filterSecurity,
      education: filterEducation,
      marital: filterMarital,
      political: filterPolitical
    }));
    setUnits(db.getUnits());
  };

  useEffect(() => {
    refreshData();
  }, [filterUnit, search, filterRank, filterSecurity, filterEducation, filterMarital, filterPolitical, activeView]);

  useEffect(() => {
    const handleShortcuts = (e: KeyboardEvent) => {
      if (e.altKey && e.key === '1') setActiveView('list');
      if (e.altKey && e.key === '2') setActiveView('units');
      if (e.altKey && e.key === '3') { setEditingPerson(undefined); setShowForm(true); }
      if (e.altKey && e.key === '4') setActiveView('settings');
      if (e.altKey && (e.key === 'd' || e.key === 'D')) setActiveView('debug');
      if (e.altKey && (e.key === 'n' || e.key === 'N')) { setEditingPerson(undefined); setShowForm(true); }
      if (e.altKey && (e.key === 's' || e.key === 'S')) { e.preventDefault(); document.getElementById('mainSearchInput')?.focus(); }
      if (e.altKey && (e.key === 'r' || e.key === 'R')) { e.preventDefault(); refreshData(); }
      if (e.key === 'Escape') onLogout();
    };
    window.addEventListener('keydown', handleShortcuts);
    return () => window.removeEventListener('keydown', handleShortcuts);
  }, [onLogout]);

  // --- CHỨC NĂNG XUẤT CSV CHUẨN HÓA ---
  const handleExportCSV = () => {
    if (personnel.length === 0) {
      alert('Không có dữ liệu để xuất!');
      return;
    }

    const unitName = filterUnit === 'all' ? 'TOÀN ĐƠN VỊ' : units.find(u => u.id === filterUnit)?.name || 'ĐƠN VỊ';
    const currentTime = new Date();
    const timeString = `${currentTime.getHours()}ờ${currentTime.getMinutes()}, ngày ${currentTime.getDate()} tháng ${currentTime.getMonth() + 1} năm ${currentTime.getFullYear()}`;

    let csvContent = "\ufeff"; // BOM
    csvContent += "CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM\n";
    csvContent += "Độc lập - Tự do - Hạnh phúc\n";
    csvContent += ",,,,,,,,,,,\n"; 
    csvContent += `DANH SÁCH TRÍCH NGANG QUÂN NHÂN - ${unitName.toUpperCase()}\n`;
    csvContent += `(Thời điểm trích xuất: ${timeString})\n\n`;

    const headers = [
      "STT",
      "Họ và tên",
      "Cấp bậc",
      "Chức vụ",
      "Đơn vị",
      "Số CCCD",
      "Số điện thoại",
      "Ngày sinh",
      "Quê quán / Nơi ở",
      "Ngày nhập ngũ",
      "Ngày vào Đảng",
      "Trình độ học vấn",
      "Ghi chú (Nguyện vọng)"
    ];
    csvContent += headers.join(",") + "\n";

    personnel.forEach((p, idx) => {
      const clean = (text: string) => {
        if (!text) return "";
        return text.replace(/"/g, '""').replace(/(\r\n|\n|\r)/gm, " ");
      };

      const row = [
        idx + 1,
        `"${clean(p.ho_ten.toUpperCase())}"`,
        `"${clean(p.cap_bac)}"`,
        `"${clean(p.chuc_vu)}"`,
        `"${clean(p.don_vi)}"`,
        `"'${clean(p.cccd)}"`, 
        `"'${clean(p.sdt_rieng)}"`,
        `"${clean(p.ngay_sinh)}"`,
        `"${clean(p.ho_khau_thu_tru || p.noi_sinh)}"`,
        `"${clean(p.nhap_ngu_ngay)}"`,
        `"${clean(p.vao_dang_ngay || 'Chưa vào Đảng')}"`,
        `"${clean(p.trinh_do_van_hoa)}"`,
        `"${clean(p.y_kien_nguyen_vong)}"`
      ];
      csvContent += row.join(",") + "\n";
    });

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `DANH_SACH_${unitName.replace(/\s+/g, '_')}_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    db.log('INFO', `Đã xuất danh sách CSV (${personnel.length} hồ sơ) - Đơn vị: ${unitName}`);
  };

  return (
    <div className="flex h-screen bg-[#f4f6f8] font-sans">
      {/* Sidebar */}
      <div className="w-64 military-green text-white flex flex-col shadow-2xl z-20 overflow-hidden">
        <div className="p-8 bg-black/10 flex items-center gap-3">
          <div className="bg-white/10 p-2 rounded-xl">
             <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 20 20"><path d="M10 2a1 1 0 011 1v1.323l3.954 1.582 1.599-.8a1 1 0 01.894 1.79l-1.233.616 1.738 5.42a1 1 0 01-.285 1.05A3.989 3.989 0 0115 15a3.989 3.989 0 01-2.667-1.019 1 1 0 01-.285-1.05l1.715-5.349L11 6.477V17a1 1 0 01-2 0V6.477L6.237 7.582l1.715 5.349a1 1 0 01-.285 1.05A3.989 3.989 0 015 15a3.989 3.989 0 01-2.667-1.019 1 1 0 01-.285-1.05l1.738-5.42-1.233-.617a1 1 0 01.894-1.789l1.599.8L9 4.323V3a1 1 0 011-1z"/></svg>
          </div>
          <div>
            <h1 className="text-sm font-black tracking-widest uppercase">QLQN SYSTEM</h1>
            <p className="text-[8px] text-green-400 font-bold uppercase tracking-widest">HÀNH CHÍNH QUÂN SỰ</p>
          </div>
        </div>

        <nav className="flex-1 p-3 space-y-1 mt-6">
          <button onClick={() => setActiveView('list')} className={`w-full flex items-center gap-4 p-4 rounded-xl transition-all text-xs font-bold ${activeView === 'list' ? 'nav-link-active' : 'text-white/40 hover:bg-white/5'}`}>
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M4 6h16M4 10h16M4 14h16M4 18h16" strokeWidth="2"/></svg>
            Danh Sách (Alt+1)
          </button>
          <button onClick={() => setActiveView('units')} className={`w-full flex items-center gap-4 p-4 rounded-xl transition-all text-xs font-bold ${activeView === 'units' ? 'nav-link-active' : 'text-white/40 hover:bg-white/5'}`}>
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16" strokeWidth="2"/></svg>
            Tổ Chức (Alt+2)
          </button>
          <button onClick={() => { setEditingPerson(undefined); setShowForm(true); }} className={`w-full flex items-center gap-4 p-4 rounded-xl transition-all text-xs font-bold text-white/40 hover:bg-white/5`}>
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" strokeWidth="2"/></svg>
            Nhập Liệu (Alt+N)
          </button>
          <button onClick={() => setActiveView('settings')} className={`w-full flex items-center gap-4 p-4 rounded-xl transition-all text-xs font-bold ${activeView === 'settings' ? 'nav-link-active' : 'text-white/40 hover:bg-white/5'}`}>
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" strokeWidth="2"/><path d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" strokeWidth="2"/></svg>
            Cài Đặt (Alt+4)
          </button>
          <button onClick={() => setActiveView('debug')} className={`w-full flex items-center gap-4 p-4 rounded-xl transition-all text-xs font-bold ${activeView === 'debug' ? 'nav-link-active' : 'text-white/40 hover:bg-white/5'}`}>
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" strokeWidth="2"/></svg>
            Diagnostics (Alt+D)
          </button>
        </nav>
      </div>

      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="bg-white px-10 py-6 border-b flex justify-between items-center z-10 shadow-sm">
          <div>
            <h2 className="text-2xl font-black text-[#14452F] uppercase tracking-tighter">
              {activeView === 'list' ? 'DANH SÁCH QUÂN NHÂN' : 
               activeView === 'units' ? 'CƠ CẤU TỔ CHỨC' : 
               activeView === 'settings' ? 'CÀI ĐẶT HỆ THỐNG' : 
               activeView === 'debug' ? 'DIAGNOSTICS & DEBUG' : 'NHẬP LIỆU MỚI'}
            </h2>
            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-1">Hệ thống quản lý nội bộ bảo mật</p>
          </div>
          <div className="flex items-center gap-10">
            <div className="flex items-center gap-3">
              <div className="text-right">
                 <p className="text-sm font-black text-gray-800 uppercase">Ban Chỉ Huy</p>
                 <p className="text-[10px] text-green-500 font-bold uppercase tracking-tighter">System Operational</p>
              </div>
              <div className="w-12 h-12 rounded-2xl military-green flex items-center justify-center text-white border-4 border-white shadow-xl">
                 <svg className="w-7 h-7" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd"/></svg>
              </div>
            </div>
            <button onClick={onLogout} className="w-10 h-10 flex items-center justify-center rounded-xl hover:bg-rose-50 text-rose-400 hover:text-rose-600 transition-all border border-transparent hover:border-rose-100">
               <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" strokeWidth="2"/></svg>
            </button>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-10 scrollbar-hide bg-[#f8fafc]">
          {activeView === 'list' && (
            <div className="space-y-8 animate-fade-in">
              {/* Filter Bar Nâng Cấp */}
              <div className="bg-white p-6 rounded-3xl shadow-lg border border-gray-100 mb-8 animate-fade-in">
                {/* Hàng 1: Bộ lọc cơ bản */}
                <div className="flex flex-wrap gap-4 items-end">
                   
                   <div className="w-64">
                      <label className="block text-[10px] font-black text-gray-400 mb-1 uppercase tracking-widest">Đơn vị quản lý</label>
                      <select className="w-full p-3 bg-gray-50 border border-gray-100 rounded-xl font-bold text-xs text-[#14452F] outline-none" value={filterUnit} onChange={e => setFilterUnit(e.target.value)}>
                         <option value="all">TOÀN ĐƠN VỊ</option>
                         {units.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                      </select>
                   </div>

                   <div className="flex-1 min-w-[300px] relative">
                      <label className="block text-[10px] font-black text-gray-400 mb-1 uppercase tracking-widest">Tìm kiếm (Tên, CCCD, Sở trường)</label>
                      <input id="mainSearchInput" type="text" placeholder="Nhập từ khóa (VD: Lái xe, Hát, Nguyễn Văn A...)" className="w-full p-3 pl-10 bg-gray-50 border border-gray-100 rounded-xl font-bold text-xs text-[#14452F] focus:ring-2 ring-[#14452F]/10 transition-all outline-none" value={search} onChange={e => setSearch(e.target.value)} />
                      <div className="absolute left-3 bottom-3 text-gray-400">
                         <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" strokeWidth="2"/></svg>
                      </div>
                   </div>

                   {/* Nút bật/tắt bộ lọc nâng cao */}
                   <button onClick={() => setIsAdvancedFilter(!isAdvancedFilter)} className={`p-3 rounded-xl border transition-all flex items-center gap-2 text-[10px] font-black uppercase tracking-wider h-[42px] ${isAdvancedFilter ? 'bg-[#14452F] text-white border-[#14452F] shadow-lg' : 'bg-white text-gray-500 border-gray-200 hover:bg-gray-50'}`}>
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4"></path></svg>
                      {isAdvancedFilter ? 'Thu gọn' : 'Bộ lọc sâu'}
                   </button>
                   
                   <div className="w-[1px] h-10 bg-gray-200 mx-2"></div>

                   <button onClick={handleExportCSV} className="bg-blue-50 text-blue-700 hover:bg-blue-600 hover:text-white border border-blue-200 p-3 rounded-xl font-bold text-[10px] uppercase tracking-wider transition-all flex items-center justify-center gap-2 shadow-sm h-[42px]" title="Xuất Excel CSV">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path></svg>
                    Xuất File
                  </button>
                  <button onClick={() => { setEditingPerson(undefined); setShowForm(true); }} className="bg-[#d4af37] text-white hover:bg-[#b89628] p-3 rounded-xl shadow-md transition-all flex items-center justify-center gap-2 h-[42px] font-bold text-[10px] uppercase tracking-wider" title="Thêm mới">
                     <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"></path></svg>
                     Thêm Mới
                  </button>
                </div>

                {/* Hàng 2: Bộ lọc chuyên sâu (Ẩn/Hiện) */}
                {isAdvancedFilter && (
                  <div className="grid grid-cols-4 gap-4 mt-6 pt-6 border-t border-gray-100 animate-fade-in-down">
                     
                     <div>
                        <label className="block text-[9px] font-bold text-gray-400 mb-1 uppercase tracking-wider">Cấp bậc</label>
                        <select className="w-full p-2.5 bg-white border border-gray-200 rounded-lg text-xs font-bold outline-none focus:border-[#14452F] text-gray-700" value={filterRank} onChange={e => setFilterRank(e.target.value)}>
                           <option value="all">Tất cả cấp bậc</option>
                           <option value="Binh nhì">Binh nhì</option>
                           <option value="Binh nhất">Binh nhất</option>
                           <option value="Hạ sĩ">Hạ sĩ</option>
                           <option value="Trung sĩ">Trung sĩ</option>
                           <option value="Thượng sĩ">Thượng sĩ</option>
                        </select>
                     </div>

                     <div>
                        <label className="block text-[9px] font-bold text-gray-400 mb-1 uppercase tracking-wider">An ninh & Pháp luật</label>
                        <select className="w-full p-2.5 bg-white border border-gray-200 rounded-lg text-xs font-bold outline-none focus:border-[#14452F] text-gray-700" value={filterSecurity} onChange={e => setFilterSecurity(e.target.value)}>
                           <option value="all">Tất cả hồ sơ</option>
                           <option value="vi_pham" className="text-red-600">⚠️ Có lịch sử vi phạm</option>
                           <option value="vay_no" className="text-amber-600">⚠️ Đang vay nợ</option>
                           <option value="yeu_to_nuoc_ngoai" className="text-blue-600">✈️ Có yếu tố nước ngoài</option>
                        </select>
                     </div>

                     <div>
                        <label className="block text-[9px] font-bold text-gray-400 mb-1 uppercase tracking-wider">Trình độ & Chính trị</label>
                        <div className="grid grid-cols-2 gap-2">
                           <select className="w-full p-2.5 bg-white border border-gray-200 rounded-lg text-xs font-bold outline-none focus:border-[#14452F] text-gray-700" value={filterEducation} onChange={e => setFilterEducation(e.target.value)}>
                              <option value="all">Học vấn (Tất cả)</option>
                              <option value="dai_hoc">ĐH/CĐ/TC</option>
                              <option value="pho_thong">PTTH (12/12)</option>
                              <option value="chua_tot_nghiep">Chưa tốt nghiệp</option>
                           </select>
                           <select className="w-full p-2.5 bg-white border border-gray-200 rounded-lg text-xs font-bold outline-none focus:border-[#14452F] text-gray-700" value={filterPolitical} onChange={e => setFilterPolitical(e.target.value)}>
                              <option value="all">Chính trị (Tất cả)</option>
                              <option value="dang_vien">Đảng viên</option>
                              <option value="doan_vien">Đoàn viên</option>
                           </select>
                        </div>
                     </div>

                     <div>
                        <label className="block text-[9px] font-bold text-gray-400 mb-1 uppercase tracking-wider">Hôn nhân & Gia đình</label>
                        <select className="w-full p-2.5 bg-white border border-gray-200 rounded-lg text-xs font-bold outline-none focus:border-[#14452F] text-gray-700" value={filterMarital} onChange={e => setFilterMarital(e.target.value)}>
                           <option value="all">Tất cả</option>
                           <option value="doc_than">Độc thân</option>
                           <option value="co_vo">Đã lập gia đình</option>
                           <option value="co_con">Đã có con</option>
                        </select>
                     </div>
                  </div>
                )}
              </div>

              {/* Personnel Table */}
              <div className="bg-white rounded-[2rem] shadow-xl overflow-hidden border border-gray-100 min-h-[500px]">
                <table className="w-full">
                  <thead className="bg-[#14452F] text-white">
                    <tr>
                      <th className="px-6 py-4 text-left text-[10px] font-black uppercase tracking-widest opacity-80">STT</th>
                      <th className="px-6 py-4 text-left text-[10px] font-black uppercase tracking-widest opacity-80">Hồ sơ</th>
                      <th className="px-6 py-4 text-left text-[10px] font-black uppercase tracking-widest opacity-80">Cấp bậc / Chức vụ</th>
                      <th className="px-6 py-4 text-left text-[10px] font-black uppercase tracking-widest opacity-80">Đơn vị</th>
                      <th className="px-6 py-4 text-center text-[10px] font-black uppercase tracking-widest opacity-80">Cảnh báo</th>
                      <th className="px-6 py-4 text-right text-[10px] font-black uppercase tracking-widest opacity-80">Thao tác</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 bg-white">
                    {personnel.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="py-20 text-center text-gray-300">
                          <svg className="w-16 h-16 mx-auto mb-4 opacity-20" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" strokeWidth="1"/></svg>
                          <p className="font-black uppercase text-xs tracking-widest">Không có dữ liệu phù hợp bộ lọc</p>
                        </td>
                      </tr>
                    ) : (
                      personnel.map((p, idx) => (
                        <tr key={p.id} className="hover:bg-green-50/40 transition-colors group">
                          <td className="px-6 py-4 text-[11px] font-bold text-gray-400">#{idx + 1}</td>
                          <td className="px-6 py-4">
                              <div className="flex items-center gap-4">
                                <div className="w-10 h-10 rounded-xl overflow-hidden border border-gray-200 bg-gray-100 flex-shrink-0">
                                  <img src={p.anh_dai_dien || 'https://via.placeholder.com/150'} className="w-full h-full object-cover" alt="" />
                                </div>
                                <div>
                                  <p className="font-bold text-[#14452F] text-xs uppercase">{p.ho_ten}</p>
                                  <div className="flex items-center gap-2 mt-0.5">
                                    <span className="text-[10px] text-gray-500 font-mono bg-gray-100 px-1 rounded">{p.cccd}</span>
                                    {p.vao_dang_ngay && <span className="w-1.5 h-1.5 bg-red-500 rounded-full" title="Đảng viên"></span>}
                                  </div>
                                </div>
                              </div>
                          </td>
                          <td className="px-6 py-4">
                             <span className="inline-block px-2 py-0.5 bg-[#d4af37]/10 text-[#a6892e] rounded text-[9px] font-black uppercase mb-1">{p.cap_bac}</span>
                             <p className="text-[11px] font-bold text-gray-600">{p.chuc_vu}</p>
                          </td>
                          <td className="px-6 py-4">
                             <p className="text-[10px] font-bold uppercase text-[#14452F]">{p.don_vi}</p>
                          </td>
                          <td className="px-6 py-4 text-center">
                              <div className="flex justify-center gap-1">
                                {p.tai_chinh_suc_khoe?.vay_no?.co_khong && <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" title="Vay nợ"></div>}
                                {(p.lich_su_vi_pham?.ma_tuy?.co_khong || p.lich_su_vi_pham?.vi_pham_dia_phuong?.co_khong) && <div className="w-2 h-2 bg-purple-600 rounded-full" title="Vi phạm"></div>}
                                {(p.yeu_to_nuoc_ngoai?.than_nhan?.length > 0 || p.yeu_to_nuoc_ngoai?.di_nuoc_ngoai?.length > 0) && <div className="w-2 h-2 bg-blue-500 rounded-full" title="Yếu tố nước ngoài"></div>}
                              </div>
                          </td>
                          <td className="px-6 py-4 text-right">
                              <button onClick={() => { setEditingPerson(p); setShowForm(true); }} className="px-3 py-1.5 bg-white border border-gray-200 text-gray-600 rounded-lg font-bold text-[10px] uppercase hover:bg-[#14452F] hover:text-white hover:border-[#14452F] transition-all shadow-sm">
                                Chi tiết
                              </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {/* Stats Footer */}
              <div className="grid grid-cols-4 gap-4">
                 <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex items-center justify-between">
                    <div>
                      <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Quân số</p>
                      <p className="text-xl font-black text-[#14452F]">{personnel.length}</p>
                    </div>
                    <div className="p-2 bg-green-50 text-green-600 rounded-xl">
                       <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3zM6 8a2 2 0 11-4 0 2 2 0 014 0zM16 18v-3a5.972 5.972 0 00-.75-2.906A3.005 3.005 0 0119 15v3h-3zM4.75 12.094A5.973 5.973 0 004 15v3H1v-3a3.005 3.005 0 013.75-2.906z"/></svg>
                    </div>
                 </div>
                 {/* Các box thống kê khác giữ nguyên logic nhưng có thể hiển thị dynamic theo bộ lọc */}
              </div>
            </div>
          )}

          {activeView === 'units' && <UnitTree units={units} onRefresh={refreshData} />}
          {activeView === 'settings' && <Settings />}
          {activeView === 'debug' && <DebugPanel />}
        </main>
      </div>

      {showForm && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <PersonnelForm units={units} initialData={editingPerson} onClose={() => { setShowForm(false); refreshData(); }} />
        </div>
      )}
    </div>
  );
};

export default Dashboard;