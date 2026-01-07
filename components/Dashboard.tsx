
import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { MilitaryPersonnel, Unit, ShortcutConfig } from '../types.ts';
import { db, FilterCriteria } from '../store.ts';
import PersonnelForm from './PersonnelForm.tsx';
import UnitTree from './UnitTree.tsx';
import Settings from './Settings.tsx';
import { 
  Search, FileDown, LogOut, 
  Users, Edit3, Trash2, Eye,
  ShieldCheck, Landmark, UserPlus,
  Filter, X, FileText, Printer, Globe, Heart, AlertTriangle, BookOpen, Info, CheckCircle2, ShieldAlert, Award, Briefcase, GraduationCap, Scale, Lock,
  SortAsc, Calendar, Clock
} from 'lucide-react';

type SortType = 'name' | 'age' | 'enlistment' | 'none';

const Dashboard: React.FC<{ onLogout: () => void }> = ({ onLogout }) => {
  const [activeTab, setActiveTab] = useState<'personnel' | 'units' | 'settings'>('personnel');
  const [personnel, setPersonnel] = useState<MilitaryPersonnel[]>([]);
  const [units, setUnits] = useState<Unit[]>([]);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingPerson, setEditingPerson] = useState<MilitaryPersonnel | undefined>(undefined);
  const [viewingPerson, setViewingPerson] = useState<MilitaryPersonnel | undefined>(undefined);
  const [showAdvancedFilter, setShowAdvancedFilter] = useState(false);
  const [showGuide, setShowGuide] = useState(false);
  const [sortBy, setSortBy] = useState<SortType>('none');
  
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

  useEffect(() => { loadData(); }, [loadData]);

  const handleViewUnitDetailed = (unitId: string) => {
    setFilters(prev => ({ ...prev, unitId }));
    setActiveTab('personnel');
    setShowAdvancedFilter(true);
  };

  // Thuật toán sắp xếp quân nhân
  const sortedPersonnel = useMemo(() => {
    const list = [...personnel];
    if (sortBy === 'name') {
      return list.sort((a, b) => {
        const nameA = a.ho_ten.split(' ').pop() || '';
        const nameB = b.ho_ten.split(' ').pop() || '';
        return nameA.localeCompare(nameB, 'vi');
      });
    }
    if (sortBy === 'age') {
      return list.sort((a, b) => new Date(b.ngay_sinh).getTime() - new Date(a.ngay_sinh).getTime());
    }
    if (sortBy === 'enlistment') {
      return list.sort((a, b) => new Date(b.nhap_ngu_ngay).getTime() - new Date(a.nhap_ngu_ngay).getTime());
    }
    return list;
  }, [personnel, sortBy]);

  useEffect(() => {
    const handleKeyDown = async (e: KeyboardEvent) => {
      const shortcuts = await db.getShortcuts();
      const findShortcut = (id: string) => shortcuts.find(s => s.id === id);
      const isMatch = (s?: ShortcutConfig) => {
        if (!s) return false;
        return e.key.toLowerCase() === s.key.toLowerCase() && 
               e.ctrlKey === s.ctrlKey && e.altKey === s.altKey && e.shiftKey === s.shiftKey;
      };

      if (isMatch(findShortcut('add_person'))) {
        e.preventDefault(); setEditingPerson(undefined); setIsFormOpen(true);
      } else if (isMatch(findShortcut('search'))) {
        e.preventDefault(); searchInputRef.current?.focus();
      } else if (isMatch(findShortcut('refresh'))) {
        e.preventDefault(); loadData();
      } else if (isMatch(findShortcut('guide'))) {
        e.preventDefault(); setShowGuide(true);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [loadData]);

  const resetFilters = () => {
    setFilters({ 
      keyword: '', unitId: 'all', rank: 'all', position: 'all',
      political: 'all', security: 'all', 
      education: 'all', foreignElement: 'all',
      familyStatus: 'all', marital: 'all'
    });
    setSortBy('none');
  };

  const handlePrint = (p: MilitaryPersonnel) => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const html = `
      <html>
        <head>
          <title>In hồ sơ: ${p.ho_ten}</title>
          <style>
            body { font-family: "Times New Roman", serif; padding: 40px; color: #000; line-height: 1.6; }
            .header { text-align: center; margin-bottom: 30px; }
            .title { font-size: 24px; font-weight: bold; text-transform: uppercase; margin: 20px 0; }
            .section { margin-bottom: 20px; border-bottom: 1px solid #eee; padding-bottom: 10px; }
            .row { display: flex; margin-bottom: 8px; }
            .label { width: 180px; font-weight: bold; }
            .value { flex: 1; border-bottom: 1px dotted #ccc; }
            @media print { .no-print { display: none; } }
          </style>
        </head>
        <body>
          <div class="header">
            <div>QUÂN ĐỘI NHÂN DÂN VIỆT NAM</div>
            <div class="title">BẢN KHAI HỒ SƠ QUÂN NHÂN</div>
          </div>
          <div class="section">
            <div class="row"><div class="label">Họ và tên:</div><div class="value">${p.ho_ten.toUpperCase()}</div></div>
            <div class="row"><div class="label">Ngày sinh:</div><div class="value">${p.ngay_sinh}</div></div>
            <div class="row"><div class="label">Số CCCD:</div><div class="value">${p.cccd}</div></div>
            <div class="row"><div class="label">Cấp bậc:</div><div class="value">${p.cap_bac}</div></div>
            <div class="row"><div class="label">Chức vụ:</div><div class="value">${p.chuc_vu}</div></div>
            <div class="row"><div class="label">Đơn vị:</div><div class="value">${p.don_vi}</div></div>
            <div class="row"><div class="label">Nhập ngũ ngày:</div><div class="value">${p.nhap_ngu_ngay}</div></div>
            <div class="row"><div class="label">Trình độ học vấn:</div><div class="value">${p.trinh_do_van_hoa}</div></div>
          </div>
          <div style="margin-top: 50px; text-align: right; padding-right: 50px;">
            <p>Ngày .... tháng .... năm ....</p>
            <p style="font-weight: bold;">NGƯỜI KHAI KÝ TÊN</p>
            <br><br><br>
            <p>${p.ho_ten}</p>
          </div>
          <script>window.onload = () => { window.print(); window.close(); }</script>
        </body>
      </html>
    `;
    printWindow.document.write(html);
    printWindow.document.close();
  };

  const calculateAge = (dob: string) => {
    if (!dob) return 0;
    const year = new Date(dob).getFullYear();
    const currentYear = new Date().getFullYear();
    return currentYear - year;
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex font-sans text-slate-800">
      {/* Sidebar */}
      <div className="w-64 bg-[#14452F] flex flex-col shadow-2xl shrink-0">
        <div className="p-8 text-center border-b border-white/5">
          <div className="w-14 h-14 bg-white/10 rounded-2xl flex items-center justify-center mx-auto mb-3 border border-white/20">
            <ShieldCheck className="text-white w-8 h-8" />
          </div>
          <h1 className="text-white font-black text-sm tracking-tight uppercase leading-tight">Quản Lý<br/>Quân Nhân</h1>
          <p className="text-green-400 text-[8px] font-black uppercase mt-1.5 tracking-[0.2em]">Hệ thống nội bộ</p>
        </div>
        
        <nav className="flex-1 px-4 py-6 space-y-1">
          <button onClick={() => setActiveTab('personnel')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold text-xs transition-all ${activeTab === 'personnel' ? 'bg-white text-[#14452F] shadow-lg' : 'text-white/40 hover:bg-white/5'}`}>
            <Users size={16} /> Danh sách hồ sơ
          </button>
          <button onClick={() => setActiveTab('units')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold text-xs transition-all ${activeTab === 'units' ? 'bg-white text-[#14452F] shadow-lg' : 'text-white/40 hover:bg-white/5'}`}>
            <Landmark size={16} /> Biên chế tổ chức
          </button>
          <button onClick={() => setActiveTab('settings')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold text-xs transition-all ${activeTab === 'settings' ? 'bg-white text-[#14452F] shadow-lg' : 'text-white/40 hover:bg-white/5'}`}>
            <ShieldCheck size={16} /> Cài đặt hệ thống
          </button>
        </nav>

        <div className="p-6 border-t border-white/5">
          <button onClick={onLogout} className="w-full py-3 bg-red-500/10 text-red-400 rounded-xl font-black text-[10px] uppercase hover:bg-red-500 hover:text-white transition-all flex items-center justify-center gap-2">
            <LogOut size={14} /> Thoát
          </button>
        </div>
      </div>

      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header - Compact */}
        <header className="bg-white border-b px-8 py-4">
          <div className="flex items-center justify-between gap-6">
            <div className="relative flex-1 max-w-xl">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
              <input 
                ref={searchInputRef}
                type="text" 
                placeholder="Tìm Tên, CCCD, SĐT..."
                className="w-full pl-10 pr-4 py-2.5 bg-slate-100 border-none rounded-xl outline-none focus:ring-4 ring-green-600/5 font-bold text-xs"
                value={filters.keyword}
                onChange={(e) => setFilters({...filters, keyword: e.target.value})}
              />
            </div>
            
            <div className="flex gap-2">
               <div className="flex bg-slate-100 p-1 rounded-xl">
                  <button 
                    onClick={() => setSortBy('name')} 
                    className={`px-3 py-1.5 rounded-lg text-[9px] font-black uppercase transition-all flex items-center gap-1 ${sortBy === 'name' ? 'bg-[#14452F] text-white shadow-sm' : 'text-slate-500 hover:bg-slate-200'}`}
                  >
                    <SortAsc size={12} /> Tên (A-Z)
                  </button>
                  <button 
                    onClick={() => setSortBy('enlistment')} 
                    className={`px-3 py-1.5 rounded-lg text-[9px] font-black uppercase transition-all flex items-center gap-1 ${sortBy === 'enlistment' ? 'bg-[#14452F] text-white shadow-sm' : 'text-slate-500 hover:bg-slate-200'}`}
                  >
                    <Calendar size={12} /> Nhập ngũ
                  </button>
                  <button 
                    onClick={() => setSortBy('age')} 
                    className={`px-3 py-1.5 rounded-lg text-[9px] font-black uppercase transition-all flex items-center gap-1 ${sortBy === 'age' ? 'bg-[#14452F] text-white shadow-sm' : 'text-slate-500 hover:bg-slate-200'}`}
                  >
                    <Clock size={12} /> Tuổi
                  </button>
               </div>

              <button onClick={() => setShowAdvancedFilter(!showAdvancedFilter)} className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs transition-all ${showAdvancedFilter ? 'bg-green-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>
                <Filter size={16} /> Lọc nâng cao
              </button>
              <button onClick={() => { setEditingPerson(undefined); setIsFormOpen(true); }} className="flex items-center gap-2 px-6 py-2.5 bg-[#14452F] text-white rounded-xl font-black uppercase text-[10px] hover:bg-green-800 shadow-md transition-all active:scale-95">
                <UserPlus size={16} /> Thêm mới
              </button>
            </div>
          </div>
          
          {showAdvancedFilter && activeTab === 'personnel' && (
            <div className="mt-4 p-6 bg-slate-50 rounded-2xl border border-slate-200 grid grid-cols-5 gap-4 animate-fade-in shadow-inner overflow-visible">
               <div className="space-y-1.5">
                 <label className="text-[9px] font-black text-slate-400 uppercase ml-1">Đơn vị</label>
                 <select className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-[10px] font-bold" value={filters.unitId} onChange={(e) => setFilters({...filters, unitId: e.target.value})}>
                    <option value="all">Tất cả</option>
                    {units.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                 </select>
               </div>
               <div className="space-y-1.5">
                 <label className="text-[9px] font-black text-slate-400 uppercase ml-1">Quân hàm</label>
                 <select className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-[10px] font-bold" value={filters.rank} onChange={(e) => setFilters({...filters, rank: e.target.value})}>
                    <option value="all">Tất cả</option>
                    {["Binh nhì", "Binh nhất", "Hạ sĩ", "Trung sĩ", "Thượng sĩ", "Thiếu úy", "Trung úy", "Thượng úy", "Đại úy"].map(r => <option key={r} value={r}>{r}</option>)}
                 </select>
               </div>
               <div className="space-y-1.5">
                 <label className="text-[9px] font-black text-slate-400 uppercase ml-1">Chính trị</label>
                 <select className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-[10px] font-bold" value={filters.political} onChange={(e) => setFilters({...filters, political: e.target.value as any})}>
                    <option value="all">Tất cả</option>
                    <option value="dang_vien">Đảng viên</option>
                    <option value="quan_chung">Quần chúng</option>
                 </select>
               </div>
               <div className="space-y-1.5">
                 <label className="text-[9px] font-black text-slate-400 uppercase ml-1">Kỷ luật</label>
                 <select className="w-full bg-white border border-red-50 rounded-lg px-3 py-2 text-[10px] font-bold text-red-700" value={filters.security} onChange={(e) => setFilters({...filters, security: e.target.value as any})}>
                    <option value="all">Không</option>
                    <option value="vay_no">Có nợ nần</option>
                    <option value="vi_pham">Có tiền sử</option>
                 </select>
               </div>
               <div className="flex items-end pb-0.5">
                 <button onClick={resetFilters} className="w-full py-2 bg-red-50 text-red-500 font-bold text-[10px] uppercase rounded-lg border border-red-100">
                   Làm mới bộ lọc
                 </button>
               </div>
            </div>
          )}
        </header>

        {/* Content Area - Compact Cards */}
        <main className="flex-1 overflow-y-auto p-8">
          {activeTab === 'personnel' && (
            <div className="space-y-3">
              <div className="flex justify-between items-center mb-2 px-2">
                 <h2 className="text-[9px] font-black text-slate-400 uppercase tracking-widest">
                    Quân số lọc được: <span className="text-[#14452F]">{sortedPersonnel.length}</span>
                 </h2>
              </div>
              
              {sortedPersonnel.length === 0 ? (
                <div className="py-20 text-center text-slate-300 font-bold uppercase text-xs border-2 border-dashed rounded-3xl">
                   Chưa có dữ liệu phù hợp
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-3 pb-10">
                  {sortedPersonnel.map((p, index) => (
                    <div key={p.id} className="bg-white px-5 py-3 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-all flex items-center gap-4 group">
                       <div className="text-[9px] font-black text-slate-300 w-4">{index + 1}</div>
                       <div className="w-12 h-12 rounded-full bg-slate-100 overflow-hidden shrink-0 border-2 border-slate-50 shadow-inner">
                          {p.anh_dai_dien ? (
                            <img src={p.anh_dai_dien} className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-[8px] font-black text-slate-400 uppercase text-center p-1 bg-[#14452F]/5">
                              {p.ho_ten.split(' ').pop()?.charAt(0)}
                            </div>
                          )}
                       </div>
                       
                       <div className="flex-1 grid grid-cols-12 gap-2">
                          <div className="col-span-3 flex flex-col justify-center">
                             <div className="font-black text-[#14452F] text-xs uppercase leading-tight tracking-tight">{p.ho_ten}</div>
                             <div className="text-[9px] text-slate-400 font-bold mt-0.5">{p.cccd}</div>
                          </div>
                          <div className="col-span-2 flex flex-col justify-center">
                             <div className="text-[10px] font-bold text-slate-700">{p.cap_bac}</div>
                             <div className="text-[9px] font-black text-slate-400 uppercase truncate">{p.chuc_vu || 'N/A'}</div>
                          </div>
                          <div className="col-span-2 flex flex-col justify-center">
                             <div className="text-[9px] font-black text-green-800 uppercase truncate">{p.don_vi}</div>
                             <div className="text-[9px] font-bold text-slate-400 mt-0.5 italic">Nhập ngũ: {p.nhap_ngu_ngay || '?'}</div>
                          </div>
                          <div className="col-span-2 flex flex-col justify-center text-center">
                             <div className="text-[8px] font-black text-slate-300 uppercase">Tuổi</div>
                             <div className="text-[11px] font-black text-slate-600">{calculateAge(p.ngay_sinh)}</div>
                          </div>
                          <div className="col-span-3 flex items-center gap-1.5 flex-wrap justify-end">
                             {p.vao_dang_ngay && <span className="px-1.5 py-0.5 bg-red-50 text-red-600 rounded text-[7px] font-black uppercase border border-red-100">Đảng viên</span>}
                             {(p.tai_chinh_suc_khoe?.vay_no?.co_khong || p.lich_su_vi_pham?.ma_tuy?.co_khong) && <span className="px-1.5 py-0.5 bg-amber-50 text-amber-600 rounded text-[7px] font-black uppercase border border-amber-100">Cảnh báo</span>}
                          </div>
                       </div>

                       <div className="flex gap-1 shrink-0">
                          <button onClick={() => setViewingPerson(p)} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-all" title="Xem chi tiết"><Eye size={14} /></button>
                          <button onClick={() => { setEditingPerson(p); setIsFormOpen(true); }} className="p-2 text-[#14452F] hover:bg-green-50 rounded-lg transition-all" title="Sửa hồ sơ"><Edit3 size={14} /></button>
                          <button onClick={() => handlePrint(p)} className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-all" title="In hồ sơ (PDF)"><Printer size={14} /></button>
                          <button onClick={async () => { if(confirm(`Xóa hồ sơ: ${p.ho_ten}?`)) { await db.deletePersonnel(p.id); loadData(); } }} className="p-2 text-red-400 hover:bg-red-50 rounded-lg transition-all" title="Xóa hồ sơ"><Trash2 size={14} /></button>
                       </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
          {activeTab === 'units' && <UnitTree units={units} onRefresh={loadData} onViewDetailedList={handleViewUnitDetailed} />}
          {activeTab === 'settings' && <Settings />}
        </main>
      </div>

      {isFormOpen && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto">
          <PersonnelForm units={units} initialData={editingPerson} onClose={() => { setIsFormOpen(false); loadData(); }} />
        </div>
      )}

      {viewingPerson && (
        <div className="fixed inset-0 z-[400] bg-slate-900/80 backdrop-blur-md flex items-center justify-center p-8 animate-fade-in overflow-y-auto">
           <div className="bg-white w-full max-w-4xl max-h-[90vh] rounded-[2.5rem] shadow-2xl flex flex-col overflow-hidden relative border border-white/20">
              <button onClick={() => setViewingPerson(undefined)} className="absolute top-6 right-6 w-10 h-10 bg-white border rounded-full flex items-center justify-center hover:bg-red-500 hover:text-white transition-all z-10 shadow-lg"><X size={20} /></button>
              
              <div className="flex-1 overflow-y-auto p-12">
                 <div className="grid grid-cols-12 gap-10">
                   <div className="col-span-4 space-y-4">
                      <div className="aspect-[3/4] rounded-2xl overflow-hidden border-2 border-slate-50 shadow-md bg-slate-100">
                         {viewingPerson.anh_dai_dien ? <img src={viewingPerson.anh_dai_dien} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-slate-300 font-black text-xs uppercase text-center p-4">KHÔNG CÓ ẢNH HỒ SƠ</div>}
                      </div>
                      <div className="p-6 bg-[#14452F] text-white rounded-2xl shadow-lg border border-white/10">
                         <p className="text-[8px] font-black text-green-400 uppercase tracking-widest mb-3">Quân hàm & Chức vụ</p>
                         <h2 className="text-xl font-black uppercase mb-0.5 tracking-tighter">{viewingPerson.cap_bac}</h2>
                         <p className="text-xs font-bold opacity-70 uppercase">{viewingPerson.chuc_vu || 'N/A'}</p>
                         <div className="pt-4 mt-4 border-t border-white/10">
                            <p className="text-[8px] font-black text-green-400 uppercase mb-1">Đơn vị quản lý</p>
                            <p className="text-sm font-black uppercase tracking-tight">{viewingPerson.don_vi}</p>
                         </div>
                      </div>
                   </div>
                   <div className="col-span-8 space-y-8">
                      <div className="flex justify-between items-start">
                        <div>
                          <h2 className="text-3xl font-black text-[#14452F] uppercase mb-0.5 tracking-tighter leading-none">{viewingPerson.ho_ten}</h2>
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Hồ sơ quân nhân điện tử hệ quốc phòng</p>
                        </div>
                        <button onClick={() => handlePrint(viewingPerson)} className="px-4 py-2 bg-emerald-50 text-emerald-700 rounded-xl font-black uppercase text-[10px] flex items-center gap-2 border border-emerald-100 hover:bg-emerald-100 transition-all">
                          <Printer size={16} /> In PDF
                        </button>
                      </div>

                      <div className="grid grid-cols-2 gap-8 bg-slate-50/50 p-6 rounded-3xl border border-slate-100">
                         <div className="space-y-4">
                            <div className="space-y-0.5">
                               <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Số CCCD</span>
                               <p className="text-xs font-black text-slate-800 tracking-widest">{viewingPerson.cccd}</p>
                            </div>
                            <div className="space-y-0.5">
                               <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Ngày sinh / Tuổi</span>
                               <p className="text-xs font-bold text-slate-800">{viewingPerson.ngay_sinh} ({calculateAge(viewingPerson.ngay_sinh)} tuổi)</p>
                            </div>
                            <div className="space-y-0.5">
                               <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Nhập ngũ</span>
                               <p className="text-xs font-bold text-slate-800">{viewingPerson.nhap_ngu_ngay || 'Chưa cập nhật'}</p>
                            </div>
                         </div>
                         <div className="space-y-4">
                            <div className="space-y-0.5">
                               <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">SĐT Cá nhân</span>
                               <p className="text-xs font-black text-slate-800 tracking-tight">{viewingPerson.sdt_rieng || 'Không có'}</p>
                            </div>
                            <div className="space-y-0.5">
                               <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Học vấn</span>
                               <p className="text-xs font-bold text-slate-800 uppercase">{viewingPerson.trinh_do_van_hoa}</p>
                            </div>
                            <div className="space-y-0.5">
                               <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Nghỉ phép</span>
                               <p className="text-xs font-bold text-emerald-700">{viewingPerson.nghi_phep_thuc_te} / {viewingPerson.nghi_phep_tham_chieu} ngày</p>
                            </div>
                         </div>
                      </div>

                      <div className="p-6 bg-red-50/30 rounded-3xl border border-red-100 space-y-4">
                        <h4 className="text-[10px] font-black text-red-800 uppercase flex items-center gap-2 border-b border-red-100 pb-3">
                           Cảnh báo & Kỷ luật (Security Status)
                        </h4>
                        <div className="grid grid-cols-2 gap-6">
                           <div className="flex flex-col">
                              <span className="text-[8px] font-bold uppercase text-slate-400 mb-0.5">Vay nợ / Tín dụng:</span>
                              {viewingPerson.tai_chinh_suc_khoe?.vay_no?.co_khong ? (
                                <span className="text-xs font-black text-red-600 tracking-tight uppercase">CÓ VAY NỢ ({viewingPerson.tai_chinh_suc_khoe.vay_no.so_tien}đ)</span>
                              ) : (
                                <span className="text-xs font-black text-green-600 uppercase">An toàn tài chính</span>
                              )}
                           </div>
                           <div className="flex flex-col">
                              <span className="text-[8px] font-bold uppercase text-slate-400 mb-0.5">Ma túy / Chất cấm:</span>
                              {viewingPerson.lich_su_vi_pham?.ma_tuy?.co_khong ? (
                                <span className="text-xs font-black text-red-600 uppercase">CÓ TIỀN SỬ</span>
                              ) : (
                                <span className="text-xs font-black text-green-600 uppercase">An toàn chất kích thích</span>
                              )}
                           </div>
                        </div>
                      </div>

                      <div className="flex gap-4 pt-6">
                        <button onClick={() => { setEditingPerson(viewingPerson); setViewingPerson(undefined); setIsFormOpen(true); }} className="flex-1 py-4 bg-[#14452F] text-white rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-xl flex items-center justify-center gap-2 hover:bg-green-800 transition-all active:scale-95">
                           <Edit3 size={16} /> Cập nhật thông tin
                        </button>
                        <button onClick={() => setViewingPerson(undefined)} className="px-10 py-4 bg-slate-100 text-slate-500 rounded-2xl font-black uppercase text-[10px] tracking-widest hover:bg-slate-200 transition-all">
                           Đóng
                        </button>
                      </div>
                   </div>
                 </div>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
