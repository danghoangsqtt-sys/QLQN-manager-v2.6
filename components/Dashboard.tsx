
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { MilitaryPersonnel, Unit, ShortcutConfig } from '../types.ts';
import { db, FilterCriteria } from '../store.ts';
import PersonnelForm from './PersonnelForm.tsx';
import UnitTree from './UnitTree.tsx';
import Settings from './Settings.tsx';
import { 
  Search, FileDown, LogOut, 
  Users, Edit3, Trash2, Eye,
  ShieldCheck, Landmark, UserPlus,
  Filter, X, FileText, Printer, Globe, Heart, AlertTriangle, BookOpen, Info, CheckCircle2, ShieldAlert, Award, Briefcase, GraduationCap, Scale, Lock
} from 'lucide-react';

const Dashboard: React.FC<{ onLogout: () => void }> = ({ onLogout }) => {
  const [activeTab, setActiveTab] = useState<'personnel' | 'units' | 'settings'>('personnel');
  const [personnel, setPersonnel] = useState<MilitaryPersonnel[]>([]);
  const [units, setUnits] = useState<Unit[]>([]);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingPerson, setEditingPerson] = useState<MilitaryPersonnel | undefined>(undefined);
  const [viewingPerson, setViewingPerson] = useState<MilitaryPersonnel | undefined>(undefined);
  const [showAdvancedFilter, setShowAdvancedFilter] = useState(false);
  const [showGuide, setShowGuide] = useState(false);
  
  const searchInputRef = useRef<HTMLInputElement>(null);

  const [filters, setFilters] = useState<FilterCriteria>({
    keyword: '', unitId: 'all', rank: 'all', position: 'all',
    political: 'all', security: 'all', 
    education: 'all', foreignElement: 'all',
    familyStatus: 'all', marital: 'all'
  });

  const loadData = useCallback(async () => {
    const pList = await db.getPersonnel(filters);
    const uList = await db.getUnits();
    setPersonnel(pList);
    setUnits(uList);
  }, [filters]);

  // --- LOGIC PHÍM TẮT ---
  useEffect(() => {
    const handleKeyDown = async (e: KeyboardEvent) => {
      const shortcuts = await db.getShortcuts();
      
      const findShortcut = (id: string) => shortcuts.find(s => s.id === id);

      const isMatch = (s?: ShortcutConfig) => {
        if (!s) return false;
        return e.key.toLowerCase() === s.key.toLowerCase() && 
               e.ctrlKey === s.ctrlKey && 
               e.altKey === s.altKey && 
               e.shiftKey === s.shiftKey;
      };

      if (isMatch(findShortcut('add_person'))) {
        e.preventDefault();
        setEditingPerson(undefined);
        setIsFormOpen(true);
      } else if (isMatch(findShortcut('search'))) {
        e.preventDefault();
        searchInputRef.current?.focus();
      } else if (isMatch(findShortcut('refresh'))) {
        e.preventDefault();
        loadData();
      } else if (isMatch(findShortcut('guide'))) {
        e.preventDefault();
        setShowGuide(true);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [loadData]);

  useEffect(() => {
    const loadSavedFilters = async () => {
      const saved = await db.getSetting('last_filters');
      if (saved) setFilters(saved);
    };
    loadSavedFilters();
  }, []);

  useEffect(() => {
    db.saveSetting('last_filters', filters);
  }, [filters]);

  useEffect(() => { loadData(); }, [loadData]);

  const resetFilters = () => {
    setFilters({ 
      keyword: '', unitId: 'all', rank: 'all', position: 'all',
      political: 'all', security: 'all', 
      education: 'all', foreignElement: 'all',
      familyStatus: 'all', marital: 'all'
    });
  };

  const exportToDoc = (p: MilitaryPersonnel) => {
    const html = `
      <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
      <head><meta charset='utf-8'><title>Hồ sơ quân nhân</title>
      <style>
        body { font-family: 'Times New Roman', serif; }
        .header { text-align: center; font-weight: bold; text-transform: uppercase; }
        table { width: 100%; border-collapse: collapse; margin-top: 20px; }
        td { border: 1px solid black; padding: 8px; font-size: 14px; }
        .title { font-size: 18px; font-weight: bold; margin: 20px 0; }
      </style>
      </head>
      <body>
        <div class="header">CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM<br>Độc lập - Tự do - Hạnh phúc</div>
        <div class="header" style="margin-top: 30px;">HỒ SƠ QUÂN NHÂN</div>
        <div class="header" style="font-size: 20px;">${p.ho_ten.toUpperCase()}</div>
        <table>
          <tr><td width="30%"><b>Cấp bậc:</b></td><td>${p.cap_bac}</td></tr>
          <tr><td><b>Chức vụ:</b></td><td>${p.chuc_vu}</td></tr>
          <tr><td><b>Đơn vị:</b></td><td>${p.don_vi}</td></tr>
          <tr><td><b>Số CCCD:</b></td><td>${p.cccd}</td></tr>
          <tr><td><b>Ngày sinh:</b></td><td>${p.ngay_sinh}</td></tr>
        </table>
      </body></html>
    `;
    const blob = new Blob([html], { type: 'application/msword' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `HOSO_${p.ho_ten.replace(/\s+/g, '_')}.doc`;
    a.click();
  };

  const ranks = [
    "Binh nhì", "Binh nhất", "Hạ sĩ", "Trung sĩ", "Thượng sĩ", 
    "Thiếu úy", "Trung úy", "Thượng úy", "Đại úy", 
    "Thiếu tá", "Trung tá", "Thượng tá", "Đại tá"
  ];

  const positions = [
    "Chiến sĩ", "Tiểu đội trưởng", "Phó tiểu đội trưởng", 
    "Trung đội trưởng", "Phó trung đội trưởng",
    "Đại đội trưởng", "Chính trị viên", "Phó đại đội trưởng", "Phó chính trị viên",
    "Nhân viên chuyên môn", "Quản lý"
  ];

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex font-sans text-slate-800">
      {/* Sidebar Nâng cấp */}
      <div className="w-80 bg-[#14452F] flex flex-col shadow-2xl shrink-0">
        <div className="p-10 text-center">
          <div className="w-20 h-20 bg-white/10 rounded-3xl flex items-center justify-center mx-auto mb-4 border border-white/20">
            <ShieldCheck className="text-white w-10 h-10" />
          </div>
          <h1 className="text-white font-black text-xl tracking-tight uppercase">Quản Lý Quân Nhân</h1>
          <p className="text-green-400 text-[10px] font-bold uppercase mt-2 tracking-[0.2em]">Phiên bản 5.0 Pro</p>
        </div>
        
        <nav className="flex-1 px-6 space-y-2">
          <button onClick={() => setActiveTab('personnel')} className={`w-full flex items-center gap-4 px-6 py-4 rounded-2xl font-bold text-sm transition-all ${activeTab === 'personnel' ? 'bg-white text-[#14452F] shadow-xl' : 'text-white/50 hover:bg-white/5'}`}>
            <Users size={20} /> Danh sách hồ sơ
          </button>
          <button onClick={() => setActiveTab('units')} className={`w-full flex items-center gap-4 px-6 py-4 rounded-2xl font-bold text-sm transition-all ${activeTab === 'units' ? 'bg-white text-[#14452F] shadow-xl' : 'text-white/50 hover:bg-white/5'}`}>
            <Landmark size={20} /> Cơ cấu đơn vị
          </button>
          <button onClick={() => setActiveTab('settings')} className={`w-full flex items-center gap-4 px-6 py-4 rounded-2xl font-bold text-sm transition-all ${activeTab === 'settings' ? 'bg-white text-[#14452F] shadow-xl' : 'text-white/50 hover:bg-white/5'}`}>
            <ShieldCheck size={20} /> Hệ thống bảo mật
          </button>
          
          <div className="pt-10 border-t border-white/5">
             <button onClick={() => setShowGuide(true)} className="w-full flex items-center gap-4 px-6 py-4 rounded-2xl font-bold text-sm text-yellow-400 hover:bg-white/5 transition-all">
                <BookOpen size={20} /> Hướng dẫn sử dụng
             </button>
          </div>
        </nav>

        <div className="p-8 border-t border-white/5">
          <button onClick={onLogout} className="w-full py-4 bg-red-500/10 text-red-400 rounded-2xl font-black text-xs uppercase hover:bg-red-500 hover:text-white transition-all flex items-center justify-center gap-2">
            <LogOut size={16} /> Thoát hệ thống
          </button>
        </div>
      </div>

      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="bg-white border-b px-10 py-6">
          <div className="flex items-center justify-between gap-8">
            <div className="relative flex-1 max-w-2xl">
              <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
              <input 
                ref={searchInputRef}
                type="text" 
                placeholder="Tìm Tên, CCCD, SĐT hoặc Quê quán..."
                className="w-full pl-14 pr-6 py-4 bg-slate-100 border-none rounded-2xl outline-none focus:ring-4 ring-green-600/10 font-bold text-sm"
                value={filters.keyword}
                onChange={(e) => setFilters({...filters, keyword: e.target.value})}
              />
            </div>
            <div className="flex gap-4">
              <button onClick={() => setShowAdvancedFilter(!showAdvancedFilter)} className={`flex items-center gap-2 px-6 py-4 rounded-2xl font-bold text-sm transition-all ${showAdvancedFilter ? 'bg-green-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>
                <Filter size={18} /> Lọc chuyên sâu
              </button>
              <button onClick={() => { setEditingPerson(undefined); setIsFormOpen(true); }} className="flex items-center gap-2 px-8 py-4 bg-[#14452F] text-white rounded-2xl font-black uppercase text-xs hover:bg-green-800 shadow-xl">
                <UserPlus size={18} /> Thêm chiến sĩ (Ctrl+N)
              </button>
            </div>
          </div>
          
          {showAdvancedFilter && (
            <div className="mt-6 p-8 bg-slate-50 rounded-[2rem] border border-slate-200 grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-6 animate-fade-in shadow-inner overflow-visible">
               {/* ĐƠN VỊ */}
               <div className="space-y-2">
                 <label className="text-[10px] font-black text-slate-400 uppercase ml-2 flex items-center gap-1">
                   <Landmark size={12} /> Đơn vị
                 </label>
                 <select className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-xs font-bold outline-none focus:ring-2 ring-green-500/20" value={filters.unitId} onChange={(e) => setFilters({...filters, unitId: e.target.value})}>
                    <option value="all">Tất cả đơn vị</option>
                    {units.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                 </select>
               </div>

               {/* QUÂN HÀM */}
               <div className="space-y-2">
                 <label className="text-[10px] font-black text-slate-400 uppercase ml-2 flex items-center gap-1">
                   <Award size={12} /> Quân hàm
                 </label>
                 <select className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-xs font-bold outline-none focus:ring-2 ring-green-500/20" value={filters.rank} onChange={(e) => setFilters({...filters, rank: e.target.value})}>
                    <option value="all">Tất cả quân hàm</option>
                    {ranks.map(r => <option key={r} value={r}>{r}</option>)}
                 </select>
               </div>

               {/* CHỨC VỤ */}
               <div className="space-y-2">
                 <label className="text-[10px] font-black text-slate-400 uppercase ml-2 flex items-center gap-1">
                   <Briefcase size={12} /> Chức vụ
                 </label>
                 <select className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-xs font-bold outline-none focus:ring-2 ring-green-500/20" value={filters.position} onChange={(e) => setFilters({...filters, position: e.target.value})}>
                    <option value="all">Tất cả chức vụ</option>
                    {positions.map(p => <option key={p} value={p}>{p}</option>)}
                 </select>
               </div>

               {/* HỌC VẤN */}
               <div className="space-y-2">
                 <label className="text-[10px] font-black text-slate-400 uppercase ml-2 flex items-center gap-1">
                   <GraduationCap size={12} /> Học vấn
                 </label>
                 <select className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-xs font-bold outline-none focus:ring-2 ring-green-500/20" value={filters.education} onChange={(e) => setFilters({...filters, education: e.target.value})}>
                    <option value="all">Tất cả trình độ</option>
                    <option value="12/12">Trung học phổ thông (12/12)</option>
                    <option value="Trung cấp">Trung cấp</option>
                    <option value="Cao đẳng">Cao đẳng</option>
                    <option value="Đại học">Đại học</option>
                    <option value="Sau đại học">Sau đại học</option>
                 </select>
               </div>

               {/* CHÍNH TRỊ */}
               <div className="space-y-2">
                 <label className="text-[10px] font-black text-slate-400 uppercase ml-2 flex items-center gap-1">
                   <Scale size={12} /> Diện chính trị
                 </label>
                 <select className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-xs font-bold outline-none focus:ring-2 ring-green-500/20" value={filters.political} onChange={(e) => setFilters({...filters, political: e.target.value as any})}>
                    <option value="all">Tất cả</option>
                    <option value="dang_vien">Đảng viên</option>
                    <option value="quan_chung">Quần chúng</option>
                 </select>
               </div>

               {/* KỶ LUẬT / VAY NỢ */}
               <div className="space-y-2">
                 <label className="text-[10px] font-black text-slate-400 uppercase ml-2 flex items-center gap-1">
                   <AlertTriangle size={12} className="text-red-500" /> Kỷ luật & Vay nợ
                 </label>
                 <select className="w-full bg-white border border-red-100 rounded-xl px-4 py-3 text-xs font-bold outline-none focus:ring-2 ring-red-500/20 text-red-700" value={filters.security} onChange={(e) => setFilters({...filters, security: e.target.value as any})}>
                    <option value="all" className="text-slate-800">Bình thường</option>
                    <option value="vay_no">Có nợ nần</option>
                    <option value="vi_pham">Có tiền án/tiền sự</option>
                    <option value="ma_tuy">Liên quan ma túy</option>
                 </select>
               </div>

               {/* YẾU TỐ NƯỚC NGOÀI */}
               <div className="space-y-2">
                 <label className="text-[10px] font-black text-slate-400 uppercase ml-2 flex items-center gap-1">
                   <Globe size={12} /> Yếu tố nước ngoài
                 </label>
                 <select className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-xs font-bold outline-none focus:ring-2 ring-green-500/20" value={filters.foreignElement} onChange={(e) => setFilters({...filters, foreignElement: e.target.value as any})}>
                    <option value="all">Tất cả</option>
                    <option value="has_relatives">Có thân nhân nước ngoài</option>
                    <option value="has_passport">Đã có hộ chiếu</option>
                 </select>
               </div>

               {/* HÔN NHÂN */}
               <div className="space-y-2">
                 <label className="text-[10px] font-black text-slate-400 uppercase ml-2 flex items-center gap-1">
                   <Heart size={12} /> Hôn nhân
                 </label>
                 <select className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-xs font-bold outline-none focus:ring-2 ring-green-500/20" value={filters.marital} onChange={(e) => setFilters({...filters, marital: e.target.value as any})}>
                    <option value="all">Tất cả</option>
                    <option value="da_ket_hon">Đã kết hôn</option>
                    <option value="doc_than">Độc thân (chưa vợ)</option>
                 </select>
               </div>

               {/* HOÀN CẢNH GIA ĐÌNH */}
               <div className="space-y-2">
                 <label className="text-[10px] font-black text-slate-400 uppercase ml-2 flex items-center gap-1">
                   <Info size={12} /> Hoàn cảnh gia đình
                 </label>
                 <select className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-xs font-bold outline-none focus:ring-2 ring-green-500/20" value={filters.familyStatus} onChange={(e) => setFilters({...filters, familyStatus: e.target.value as any})}>
                    <option value="all">Tất cả</option>
                    <option value="poor">Hộ nghèo/Khó khăn</option>
                    <option value="violation">Thân nhân vi phạm PL</option>
                    <option value="special_circumstances">Hoàn cảnh đặc biệt</option>
                 </select>
               </div>

               <div className="flex items-end pb-1">
                 <button onClick={resetFilters} className="w-full py-3 bg-red-50 text-red-500 font-bold text-xs uppercase rounded-xl hover:bg-red-500 hover:text-white transition-all flex items-center justify-center gap-2 border border-red-100 shadow-sm">
                   <X size={14} /> Xóa tất cả lọc
                 </button>
               </div>
            </div>
          )}
        </header>

        <main className="flex-1 overflow-y-auto p-10">
          {activeTab === 'personnel' && (
            <div className="space-y-4">
              <div className="flex justify-between items-center mb-4">
                 <h2 className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                    <Users size={14} /> Kết quả tìm kiếm: <span className="text-green-700 font-black">{personnel.length} hồ sơ</span>
                 </h2>
                 <div className="flex gap-2">
                    {filters.rank !== 'all' && <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-[10px] font-bold">Quân hàm: {filters.rank}</span>}
                    {filters.security !== 'all' && <span className="px-3 py-1 bg-red-100 text-red-700 rounded-full text-[10px] font-bold uppercase">Cảnh báo: {filters.security}</span>}
                 </div>
              </div>
              
              {personnel.length === 0 ? (
                <div className="py-40 text-center text-slate-300 font-bold uppercase text-sm tracking-widest border-4 border-dashed rounded-[3rem]">
                   Không tìm thấy hồ sơ phù hợp
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-4">
                  {personnel.map(p => (
                    <div key={p.id} className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm hover:shadow-xl hover:scale-[1.01] transition-all group flex items-center gap-8 relative overflow-hidden">
                       {/* Cảnh báo nợ nần / vi phạm */}
                       {(p.tai_chinh_suc_khoe?.vay_no?.co_khong || p.lich_su_vi_pham?.ma_tuy?.co_khong) && (
                         <div className="absolute top-0 right-0 w-24 h-24">
                           <div className="absolute top-2 right-[-24px] rotate-45 bg-red-500 text-white text-[8px] font-black uppercase py-1 w-32 text-center shadow-md">Cảnh báo</div>
                         </div>
                       )}

                       <div className="w-24 h-32 rounded-2xl bg-slate-100 overflow-hidden shadow-inner shrink-0 border-2 border-slate-50">
                          {p.anh_dai_dien ? <img src={p.anh_dai_dien} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-[10px] font-black text-slate-300 uppercase leading-tight text-center p-2">No Photo</div>}
                       </div>
                       <div className="flex-1 grid grid-cols-4 gap-6">
                          <div>
                             <div className="font-black text-[#14452F] text-lg uppercase mb-1">{p.ho_ten}</div>
                             <div className="text-[11px] text-slate-400 font-bold flex items-center gap-1">
                               <Lock size={10} /> {p.cccd}
                             </div>
                          </div>
                          <div>
                             <div className="text-[10px] font-black text-slate-400 uppercase mb-1">Cấp bậc & Chức vụ</div>
                             <div className="text-sm font-bold flex items-center gap-1">
                               <Award size={14} className="text-amber-600" />
                               {p.cap_bac}
                             </div>
                             <div className="text-[11px] font-black text-slate-600 uppercase mt-0.5">{p.chuc_vu || 'N/A'}</div>
                          </div>
                          <div>
                             <div className="text-[10px] font-black text-slate-400 uppercase mb-1">Đơn vị & Liên hệ</div>
                             <div className="text-sm font-black text-green-800 uppercase flex items-center gap-1">
                               <Landmark size={14} className="text-green-600" />
                               {p.don_vi}
                             </div>
                             <div className="text-[11px] font-bold text-slate-500 mt-0.5">{p.sdt_rieng || 'Không có SĐT'}</div>
                          </div>
                          <div>
                             <div className="text-[10px] font-black text-slate-400 uppercase mb-1">Tình trạng đặc biệt</div>
                             <div className="flex flex-wrap gap-1 mt-1">
                                {p.vao_dang_ngay && <span className="px-2 py-0.5 bg-red-50 text-red-600 rounded text-[8px] font-black uppercase">Đảng viên</span>}
                                {p.quan_he_gia_dinh?.vo && <span className="px-2 py-0.5 bg-blue-50 text-blue-600 rounded text-[8px] font-black uppercase">Đã kết hôn</span>}
                                {p.yeu_to_nuoc_ngoai?.than_nhan?.length > 0 && <span className="px-2 py-0.5 bg-purple-50 text-purple-600 rounded text-[8px] font-black uppercase">Nước ngoài</span>}
                             </div>
                          </div>
                       </div>
                       <div className="flex gap-2">
                          <button onClick={() => setViewingPerson(p)} className="p-4 text-blue-600 hover:bg-blue-50 rounded-2xl transition-all" title="Xem chi tiết"><Eye size={22} /></button>
                          <button onClick={() => { setEditingPerson(p); setIsFormOpen(true); }} className="p-4 text-[#14452F] hover:bg-green-50 rounded-2xl transition-all" title="Chỉnh sửa"><Edit3 size={22} /></button>
                          <button onClick={async () => { if(confirm("Bạn có chắc chắn muốn xóa hồ sơ quân nhân này? Dữ liệu không thể khôi phục.")) { await db.deletePersonnel(p.id); loadData(); } }} className="p-4 text-red-500 hover:bg-red-50 rounded-2xl transition-all" title="Xóa hồ sơ"><Trash2 size={22} /></button>
                       </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
          {activeTab === 'units' && <UnitTree units={units} onRefresh={loadData} />}
          {activeTab === 'settings' && <Settings />}
        </main>
      </div>

      {/* --- MODAL HƯỚNG DẪN SỬ DỤNG --- */}
      {showGuide && (
        <div className="fixed inset-0 z-[500] bg-slate-900/90 backdrop-blur-md flex items-center justify-center p-10 animate-fade-in">
           <div className="bg-white w-full max-w-4xl max-h-[90vh] rounded-[3rem] shadow-2xl flex flex-col overflow-hidden">
              <div className="p-8 border-b bg-slate-50 flex justify-between items-center">
                 <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-yellow-400 rounded-2xl flex items-center justify-center text-white">
                       <BookOpen size={24} />
                    </div>
                    <div>
                       <h2 className="text-xl font-black text-slate-800 uppercase">Hướng dẫn vận hành</h2>
                       <p className="text-[10px] text-slate-400 font-bold uppercase">Hệ thống quản lý quân nhân chuyên nghiệp</p>
                    </div>
                 </div>
                 <button onClick={() => setShowGuide(false)} className="w-12 h-12 bg-white border rounded-full flex items-center justify-center hover:bg-red-500 hover:text-white transition-all"><X size={24} /></button>
              </div>
              <div className="flex-1 overflow-y-auto p-12 space-y-10">
                 <section className="space-y-4">
                    <h3 className="text-sm font-black text-[#14452F] uppercase flex items-center gap-2">
                       <CheckCircle2 size={18} className="text-green-600" /> 1. Bộ lọc chuyên sâu
                    </h3>
                    <p className="text-sm text-slate-600 leading-relaxed pl-7">
                       - <b>Lọc Kỷ luật & Vay nợ:</b> Giúp rà soát các quân nhân có hoàn cảnh tài chính hoặc chấp hành kỷ luật kém.<br/>
                       - <b>Lọc Chính trị:</b> Tách riêng Đảng viên để phân công nhiệm vụ phù hợp.<br/>
                       - <b>Lọc Hôn nhân & Gia đình:</b> Nắm bắt chính xác hoàn cảnh hậu phương của quân nhân.
                    </p>
                 </section>

                 <section className="space-y-4">
                    <h3 className="text-sm font-black text-[#14452F] uppercase flex items-center gap-2">
                       <ShieldAlert size={18} className="text-red-600" /> 2. Bảo mật dữ liệu gốc
                    </h3>
                    <p className="text-sm text-slate-600 leading-relaxed pl-7">
                       - Hệ thống hoạt động trên công nghệ **SQLite Offline**, toàn bộ hồ sơ nằm tại tệp `du_lieu_quan_nhan_v4.db`.<br/>
                       - Tuyệt đối không can thiệp vào tệp này nếu không có chuyên môn để bảo toàn tính toàn vẹn của hồ sơ nhân sự.
                    </p>
                 </section>
              </div>
              <div className="p-8 bg-slate-50 border-t flex justify-center">
                 <button onClick={() => setShowGuide(false)} className="px-10 py-4 bg-[#14452F] text-white rounded-2xl font-black uppercase text-xs tracking-widest shadow-xl">Đã rõ, quay lại làm việc</button>
              </div>
           </div>
        </div>
      )}

      {isFormOpen && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center p-6 bg-slate-900/80 backdrop-blur-sm overflow-y-auto">
          <PersonnelForm units={units} initialData={editingPerson} onClose={() => { setIsFormOpen(false); loadData(); }} />
        </div>
      )}

      {/* MODAL XEM CHI TIẾT */}
      {viewingPerson && (
        <div className="fixed inset-0 z-[400] bg-slate-900/90 backdrop-blur-md flex items-center justify-center p-10 animate-fade-in">
           <div className="bg-white w-full max-w-5xl max-h-[90vh] rounded-[3rem] shadow-2xl flex flex-col overflow-hidden">
              <div className="p-8 border-b bg-slate-50 flex justify-between items-center">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 bg-green-100 rounded-2xl flex items-center justify-center text-green-700">
                    <Users size={32} />
                  </div>
                  <div>
                    <h2 className="text-xl font-black text-slate-800 uppercase">{viewingPerson.ho_ten}</h2>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Hồ sơ chi tiết quân nhân</p>
                  </div>
                </div>
                <button onClick={() => setViewingPerson(undefined)} className="w-12 h-12 bg-white border rounded-full flex items-center justify-center hover:bg-red-500 hover:text-white transition-all"><X size={24} /></button>
              </div>
              <div className="flex-1 overflow-y-auto p-12">
                 <div className="grid grid-cols-12 gap-12">
                   <div className="col-span-4 space-y-6">
                      <div className="aspect-[3/4] rounded-3xl overflow-hidden border-4 border-slate-50 shadow-xl bg-slate-100">
                         {viewingPerson.anh_dai_dien ? <img src={viewingPerson.anh_dai_dien} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-slate-300 font-black">KHÔNG CÓ ẢNH</div>}
                      </div>
                      <div className="p-6 bg-green-50 rounded-3xl border border-green-100">
                         <h4 className="text-[10px] font-black text-green-800 uppercase mb-4 tracking-widest">Quân hàm & Chức vụ hiện tại</h4>
                         <p className="text-lg font-black text-green-900 uppercase">{viewingPerson.cap_bac}</p>
                         <p className="text-sm font-bold text-green-700 mt-1">{viewingPerson.chuc_vu || 'Chưa phân chức vụ'}</p>
                         <div className="mt-6 pt-4 border-t border-green-100">
                            <p className="text-[10px] font-black text-green-800 uppercase mb-1">Đơn vị công tác</p>
                            <p className="text-sm font-black text-green-900 uppercase">{viewingPerson.don_vi}</p>
                         </div>
                      </div>
                   </div>
                   <div className="col-span-8 space-y-10">
                      <div className="grid grid-cols-2 gap-8">
                         <div className="space-y-1">
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Số định danh (CCCD)</span>
                            <p className="text-sm font-bold text-slate-800">{viewingPerson.cccd}</p>
                         </div>
                         <div className="space-y-1">
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Ngày sinh</span>
                            <p className="text-sm font-bold text-slate-800">{viewingPerson.ngay_sinh}</p>
                         </div>
                         <div className="space-y-1">
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Số điện thoại</span>
                            <p className="text-sm font-bold text-slate-800">{viewingPerson.sdt_rieng || 'N/A'}</p>
                         </div>
                         <div className="space-y-1">
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Trình độ học vấn</span>
                            <p className="text-sm font-bold text-slate-800">{viewingPerson.trinh_do_van_hoa}</p>
                         </div>
                      </div>

                      <div className="p-8 bg-slate-50 rounded-3xl border border-slate-100 space-y-6">
                        <h4 className="text-xs font-black text-slate-800 uppercase flex items-center gap-2">
                           <Heart size={14} className="text-red-500" /> Tình hình gia đình & Hậu phương
                        </h4>
                        <div className="grid grid-cols-2 gap-x-8 gap-y-4 text-xs">
                           <p><span className="text-slate-400 font-bold uppercase">Mức sống:</span> <span className="font-bold">{viewingPerson.thong_tin_gia_dinh_chung?.muc_song}</span></p>
                           <p><span className="text-slate-400 font-bold uppercase">Hôn nhân:</span> <span className="font-bold">{viewingPerson.quan_he_gia_dinh?.vo ? 'Đã lập gia đình' : 'Độc thân'}</span></p>
                           <div className="col-span-2">
                              <span className="text-slate-400 font-bold uppercase block mb-1">Nghề nghiệp chính gia đình:</span>
                              <p className="font-bold italic">{viewingPerson.thong_tin_gia_dinh_chung?.nghe_nghiep_chinh || 'Chưa cập nhật'}</p>
                           </div>
                        </div>
                      </div>

                      <div className="p-8 bg-red-50 rounded-3xl border border-red-100 space-y-6">
                        <h4 className="text-xs font-black text-red-800 uppercase flex items-center gap-2">
                           <AlertTriangle size={14} /> Chấp hành pháp luật & Kỷ luật
                        </h4>
                        <div className="space-y-4">
                           <div className="flex justify-between items-center text-xs">
                              <span className="font-bold uppercase text-slate-500">Tình trạng nợ nần:</span>
                              {viewingPerson.tai_chinh_suc_khoe?.vay_no?.co_khong ? (
                                <span className="px-3 py-1 bg-red-600 text-white rounded-full font-black text-[10px]">CÓ VAY NỢ ({viewingPerson.tai_chinh_suc_khoe.vay_no.so_tien})</span>
                              ) : (
                                <span className="px-3 py-1 bg-green-600 text-white rounded-full font-black text-[10px]">AN TOÀN</span>
                              )}
                           </div>
                           <div className="flex justify-between items-center text-xs">
                              <span className="font-bold uppercase text-slate-500">Liên quan ma túy:</span>
                              {viewingPerson.lich_su_vi_pham?.ma_tuy?.co_khong ? (
                                <span className="px-3 py-1 bg-red-600 text-white rounded-full font-black text-[10px]">CÓ TIỀN SỬ</span>
                              ) : (
                                <span className="px-3 py-1 bg-green-600 text-white rounded-full font-black text-[10px]">AN TOÀN</span>
                              )}
                           </div>
                        </div>
                      </div>
                   </div>
                 </div>
              </div>
              <div className="p-8 bg-slate-50 border-t flex justify-end gap-4">
                <button onClick={() => exportToDoc(viewingPerson)} className="flex items-center gap-2 px-8 py-4 bg-emerald-600 text-white rounded-2xl font-black uppercase text-xs tracking-widest shadow-xl">
                   <FileText size={18} /> Xuất Word (.doc)
                </button>
                <button onClick={() => { setEditingPerson(viewingPerson); setViewingPerson(undefined); setIsFormOpen(true); }} className="flex items-center gap-2 px-8 py-4 bg-[#14452F] text-white rounded-2xl font-black uppercase text-xs tracking-widest shadow-xl">
                   <Edit3 size={18} /> Sửa hồ sơ
                </button>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
