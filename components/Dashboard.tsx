
import { 
  Search, FileDown, LogOut, 
  Users, Edit3, Trash2, Eye,
  ShieldCheck, Landmark, UserPlus,
  Filter, X, Printer, BookOpen, AlertTriangle, 
  SortAsc, Calendar, Clock, HelpCircle, 
  ChevronRight, Keyboard as KeyboardIcon,
  CheckCircle2, RefreshCcw, LayoutDashboard,
  TrendingUp, Activity, PieChart, Info,
  ShieldAlert, Database, HardDrive, MousePointer2
} from 'lucide-react';
import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { MilitaryPersonnel, Unit, ShortcutConfig } from '../types.ts';
import { db, FilterCriteria } from '../store.ts';
import PersonnelForm from './PersonnelForm.tsx';
import UnitTree from './UnitTree.tsx';
import Settings from './Settings.tsx';

type SortType = 'name' | 'age' | 'enlistment' | 'none';

const Dashboard: React.FC<{ onLogout: () => void }> = ({ onLogout }) => {
  const [activeTab, setActiveTab] = useState<'personnel' | 'units' | 'settings' | 'overview'>('overview');
  const [personnel, setPersonnel] = useState<MilitaryPersonnel[]>([]);
  const [units, setUnits] = useState<Unit[]>([]);
  const [shortcuts, setShortcuts] = useState<ShortcutConfig[]>([]);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingPerson, setEditingPerson] = useState<MilitaryPersonnel | undefined>(undefined);
  const [viewingPerson, setViewingPerson] = useState<MilitaryPersonnel | undefined>(undefined);
  const [showAdvancedFilter, setShowAdvancedFilter] = useState(false);
  const [showGuide, setShowGuide] = useState(false);
  const [sortBy, setSortBy] = useState<SortType>('none');
  const [dashboardStats, setDashboardStats] = useState<any>(null);
  
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
    const sList = await db.getShortcuts();
    const stats = await db.getDashboardStats();
    setPersonnel(pList);
    setUnits(uList);
    setShortcuts(sList);
    setDashboardStats(stats);
  }, [filters]);

  useEffect(() => { loadData(); }, [loadData]);

  const formatShortcut = useCallback((id: string) => {
    const s = shortcuts.find(item => item.id === id);
    if (!s) return '...';
    const parts = [];
    if (s.ctrlKey) parts.push('Ctrl');
    if (s.shiftKey) parts.push('Shift');
    parts.push(s.key.toUpperCase());
    return parts.join(' + ');
  }, [shortcuts]);

  const sortedPersonnel = useMemo(() => {
    const list = [...personnel];
    if (sortBy === 'name') {
      return list.sort((a, b) => a.ho_ten.split(' ').pop()!.localeCompare(b.ho_ten.split(' ').pop()!, 'vi'));
    }
    if (sortBy === 'age') {
      return list.sort((a, b) => new Date(b.ngay_sinh).getTime() - new Date(a.ngay_sinh).getTime());
    }
    return list;
  }, [personnel, sortBy]);

  const exportCSV = () => {
    const headers = ['Họ Tên', 'CCCD', 'Đơn Vị', 'Cấp Bậc', 'Ngày Sinh'];
    const rows = personnel.map(p => [p.ho_ten, p.cccd, p.don_vi, p.cap_bac, p.ngay_sinh]);
    const csvContent = "data:text/csv;charset=utf-8," + [headers, ...rows].map(e => e.join(",")).join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `danh_sach_quan_nhan_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const StatCard = ({ title, value, icon: Icon, color }: any) => (
    <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm flex items-center justify-between group hover:shadow-lg transition-all duration-300">
      <div>
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{title}</p>
        <h3 className="text-3xl font-black text-slate-800 tracking-tighter">{value}</h3>
      </div>
      <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${color} shadow-inner group-hover:scale-110 transition-transform`}>
        <Icon size={24} />
      </div>
    </div>
  );

  return (
    <div className="h-screen bg-[#F8FAFC] flex font-sans text-slate-800 overflow-hidden">
      {/* Sidebar Hiện Đại */}
      <div className="w-64 bg-[#14452F] flex flex-col shadow-2xl shrink-0">
        <div className="p-8 text-center border-b border-white/5">
          <div className="w-14 h-14 bg-white/10 rounded-2xl flex items-center justify-center mx-auto mb-3 border border-white/20">
            <ShieldCheck className="text-white w-8 h-8" />
          </div>
          <h1 className="text-white font-black text-sm tracking-tight uppercase leading-tight">QN-Manager<br/>Pro Edition</h1>
          <p className="text-green-400 text-[8px] font-black uppercase mt-1.5 tracking-[0.2em]">Hệ thống bảo mật nội bộ</p>
        </div>
        
        <nav className="flex-1 px-4 py-6 space-y-1">
          <button onClick={() => setActiveTab('overview')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold text-xs transition-all ${activeTab === 'overview' ? 'bg-white text-[#14452F] shadow-lg' : 'text-white/40 hover:bg-white/5'}`}>
            <LayoutDashboard size={16} /> Tổng quan đơn vị
          </button>
          <button onClick={() => setActiveTab('personnel')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold text-xs transition-all ${activeTab === 'personnel' ? 'bg-white text-[#14452F] shadow-lg' : 'text-white/40 hover:bg-white/5'}`}>
            <Users size={16} /> Danh sách hồ sơ
          </button>
          <button onClick={() => setActiveTab('units')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold text-xs transition-all ${activeTab === 'units' ? 'bg-white text-[#14452F] shadow-lg' : 'text-white/40 hover:bg-white/5'}`}>
            <Landmark size={16} /> Biên chế tổ chức
          </button>
          <button onClick={() => setActiveTab('settings')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold text-xs transition-all ${activeTab === 'settings' ? 'bg-white text-[#14452F] shadow-lg' : 'text-white/40 hover:bg-white/5'}`}>
            <KeyboardIcon size={16} /> Thiết lập hệ thống
          </button>
        </nav>

        <div className="p-6 border-t border-white/5">
          <button onClick={onLogout} className="w-full py-3 bg-red-500/10 text-red-400 rounded-xl font-black text-[10px] uppercase hover:bg-red-500 hover:text-white transition-all flex items-center justify-center gap-2">
            <LogOut size={14} /> Thoát hệ thống
          </button>
        </div>
      </div>

      <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
        {/* Header Tinh Tế */}
        <header className="bg-white border-b px-8 py-4 shrink-0 flex items-center justify-between gap-6 shadow-sm">
          <div className="relative flex-1 max-xl">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input 
              ref={searchInputRef}
              type="text" 
              placeholder="Tìm kiếm thông minh (Tên, CCCD, SĐT...)"
              className="w-full pl-10 pr-4 py-3 bg-slate-100 border-none rounded-2xl outline-none focus:ring-4 ring-green-600/5 font-bold text-xs"
              value={filters.keyword}
              onChange={(e) => setFilters({...filters, keyword: e.target.value})}
            />
          </div>
          
          <div className="flex gap-2">
            <button onClick={exportCSV} className="flex items-center gap-2 px-4 py-2.5 bg-slate-100 text-slate-600 rounded-xl font-bold text-xs hover:bg-slate-200 transition-all"><FileDown size={16} /> Xuất dữ liệu</button>
            <button onClick={() => { setEditingPerson(undefined); setIsFormOpen(true); }} className="flex items-center gap-2 px-6 py-2.5 bg-[#14452F] text-white rounded-xl font-black uppercase text-[10px] hover:bg-green-800 shadow-xl transition-all"><UserPlus size={16} /> Thêm chiến sĩ</button>
          </div>
        </header>

        {/* Content Area */}
        <main className="flex-1 overflow-y-auto p-8 min-h-0">
          
          {activeTab === 'overview' && dashboardStats && (
            <div className="space-y-10 animate-fade-in">
              <div className="grid grid-cols-4 gap-6">
                <StatCard title="Tổng Quân Số" value={dashboardStats.total} icon={Users} color="bg-blue-50 text-blue-600" />
                <StatCard title="Đảng Viên" value={dashboardStats.party} icon={ShieldCheck} color="bg-red-50 text-red-600" />
                <StatCard title="Vay Nợ/Tín Dụng" value={dashboardStats.debt} icon={AlertTriangle} color="bg-amber-50 text-amber-600" />
                <StatCard title="Chỉ Số Sức Khỏe" value="98%" icon={Activity} color="bg-green-50 text-green-600" />
              </div>

              <div className="grid grid-cols-12 gap-6">
                <div className="col-span-8 bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm">
                  <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest mb-6 flex items-center gap-2">
                    <TrendingUp size={18} className="text-[#14452F]" /> Cơ cấu quân hàm hiện tại
                  </h3>
                  <div className="space-y-4">
                    {Object.entries(dashboardStats.ranks).map(([rank, count]: any) => (
                      <div key={rank} className="space-y-1.5">
                        <div className="flex justify-between text-[10px] font-black uppercase">
                          <span>{rank}</span>
                          <span className="text-[#14452F]">{count} đồng chí</span>
                        </div>
                        <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-[#14452F] rounded-full transition-all duration-1000" 
                            style={{ width: `${(count / dashboardStats.total) * 100}%` }}
                          ></div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="col-span-4 bg-[#14452F] p-8 rounded-[2.5rem] shadow-xl text-white flex flex-col justify-between">
                  <div>
                    <h3 className="text-sm font-black uppercase tracking-widest mb-2">Trực ban hệ thống</h3>
                    <p className="text-[10px] text-green-400 font-bold uppercase">Trạng thái: Hoạt động ổn định</p>
                  </div>
                  <div className="py-8">
                    <p className="text-2xl font-black tracking-tighter mb-1">An Toàn 100%</p>
                    <p className="text-[9px] opacity-60 font-bold uppercase tracking-widest">Dữ liệu được mã hóa và lưu trữ cục bộ trên máy tính này.</p>
                  </div>
                  <button onClick={() => setShowGuide(true)} className="w-full py-4 bg-white/10 hover:bg-white/20 rounded-2xl font-black uppercase text-[10px] transition-all border border-white/10">Xem tài liệu hướng dẫn</button>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'personnel' && (
            <div className="space-y-4 animate-fade-in">
              <div className="flex justify-between items-center px-2">
                <h2 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Danh sách tìm thấy: <span className="text-[#14452F]">{sortedPersonnel.length}</span></h2>
                <div className="flex gap-2">
                   <button onClick={() => setSortBy('name')} className={`px-3 py-1.5 rounded-lg text-[9px] font-black uppercase ${sortBy === 'name' ? 'bg-[#14452F] text-white' : 'bg-white text-slate-400 border'}`}>Tên (A-Z)</button>
                   <button onClick={() => setShowAdvancedFilter(!showAdvancedFilter)} className="px-3 py-1.5 bg-white border text-slate-400 rounded-lg text-[9px] font-black uppercase flex items-center gap-1"><Filter size={12}/> Bộ lọc</button>
                </div>
              </div>

              {sortedPersonnel.map((p, i) => (
                <div key={p.id} className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4 group hover:border-[#14452F]/20 transition-all">
                  <div className="w-12 h-12 bg-slate-50 rounded-full flex items-center justify-center font-black text-[#14452F] text-xs border border-slate-100 overflow-hidden shrink-0 shadow-inner">
                    {p.anh_dai_dien ? <img src={p.anh_dai_dien} className="w-full h-full object-cover" /> : p.ho_ten.charAt(0)}
                  </div>
                  <div className="flex-1 grid grid-cols-4 gap-4">
                    <div>
                      <p className="text-[11px] font-black text-slate-800 uppercase leading-tight">{p.ho_ten}</p>
                      <p className="text-[9px] text-slate-400 font-bold mt-0.5">{p.cccd}</p>
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-slate-700">{p.cap_bac}</p>
                      <p className="text-[9px] font-black text-slate-400 uppercase truncate">{p.chuc_vu || 'N/A'}</p>
                    </div>
                    <div className="col-span-2 flex items-center gap-2">
                       <span className="px-2 py-0.5 bg-green-50 text-green-700 rounded text-[8px] font-black uppercase border border-green-100">{p.don_vi}</span>
                       {p.vao_dang_ngay && <span className="px-2 py-0.5 bg-red-50 text-red-600 rounded text-[8px] font-black uppercase border border-red-100">Đảng Viên</span>}
                       {p.tai_chinh_suc_khoe?.vay_no?.co_khong && <span className="px-2 py-0.5 bg-amber-50 text-amber-700 rounded text-[8px] font-black uppercase border border-amber-100">Cảnh báo nợ</span>}
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <button onClick={() => setViewingPerson(p)} className="p-2.5 text-blue-600 hover:bg-blue-50 rounded-xl transition-all"><Eye size={16} /></button>
                    <button onClick={() => { setEditingPerson(p); setIsFormOpen(true); }} className="p-2.5 text-[#14452F] hover:bg-green-50 rounded-xl transition-all"><Edit3 size={16} /></button>
                    <button onClick={async () => { if(confirm('Xóa hồ sơ này?')) { await db.deletePersonnel(p.id); loadData(); } }} className="p-2.5 text-red-400 hover:bg-red-50 rounded-xl transition-all"><Trash2 size={16} /></button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {activeTab === 'units' && <UnitTree units={units} onRefresh={loadData} onViewDetailedList={(id) => { setFilters({...filters, unitId: id}); setActiveTab('personnel'); }} />}
          {activeTab === 'settings' && <Settings />}

        </main>
      </div>

      {isFormOpen && (
        <div className="fixed inset-0 z-[500] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto">
          <PersonnelForm units={units} initialData={editingPerson} onClose={() => { setIsFormOpen(false); loadData(); }} />
        </div>
      )}

      {/* CẨM NANG HƯỚNG DẪN NÂNG CẤP */}
      {showGuide && (
        <div className="fixed inset-0 z-[1000] bg-slate-900/80 backdrop-blur-xl flex items-center justify-center p-6 animate-fade-in">
          <div className="bg-white w-full max-w-6xl h-[90vh] rounded-[3rem] shadow-2xl overflow-hidden flex flex-col relative border border-white/20">
            {/* Header Manual */}
            <div className="bg-[#14452F] px-12 py-8 flex items-center justify-between shrink-0">
               <div className="flex items-center gap-6">
                  <div className="w-16 h-16 bg-white/10 rounded-2xl flex items-center justify-center border border-white/20">
                     <BookOpen className="text-white w-8 h-8" />
                  </div>
                  <div>
                     <h2 className="text-2xl font-black text-white uppercase tracking-tighter leading-none">Cẩm nang vận hành hệ thống</h2>
                     <p className="text-[10px] font-black text-green-400 uppercase tracking-widest mt-2">Dành cho cán bộ quản lý nhân sự - Version 7.0 (Internal)</p>
                  </div>
               </div>
               <button onClick={() => setShowGuide(false)} className="w-12 h-12 bg-white/10 rounded-full flex items-center justify-center text-white hover:bg-red-500 transition-all border border-white/10">
                  <X size={24} />
               </button>
            </div>

            {/* Content Manual Layout */}
            <div className="flex-1 flex overflow-hidden">
               {/* Table of Contents */}
               <div className="w-64 bg-slate-50 border-r p-8 overflow-y-auto shrink-0 space-y-2">
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4">Mục lục hướng dẫn</p>
                  {[
                    { id: 'sec1', label: '1. Quy định chung', icon: ShieldCheck },
                    { id: 'sec2', label: '2. Quản lý Hồ sơ', icon: Users },
                    { id: 'sec3', label: '3. Cơ cấu Đơn vị', icon: Landmark },
                    { id: 'sec4', label: '4. Báo cáo & Xuất file', icon: FileDown },
                    { id: 'sec5', label: '5. Phím tắt Thao tác', icon: KeyboardIcon },
                    { id: 'sec6', label: '6. Bảo mật & Backup', icon: Database },
                    { id: 'sec7', label: '7. Xử lý sự cố', icon: ShieldAlert },
                  ].map(item => (
                    <a key={item.id} href={`#${item.id}`} className="flex items-center gap-3 p-3 rounded-xl hover:bg-white hover:shadow-sm text-slate-600 hover:text-[#14452F] transition-all group">
                       <item.icon size={16} className="group-hover:scale-110 transition-transform" />
                       <span className="text-[11px] font-black uppercase tracking-tight">{item.label}</span>
                    </a>
                  ))}
               </div>

               {/* Main Document Content */}
               <div className="flex-1 overflow-y-auto p-12 scroll-smooth bg-white">
                  <div className="max-w-3xl mx-auto space-y-16 pb-20">
                     
                     {/* Section 1 */}
                     <section id="sec1" className="space-y-6">
                        <div className="flex items-center gap-4 text-[#14452F]">
                           <div className="w-10 h-10 bg-green-50 rounded-xl flex items-center justify-center"><ShieldCheck size={20}/></div>
                           <h3 className="text-xl font-black uppercase tracking-tight">1. Quy định chung về bảo mật</h3>
                        </div>
                        <div className="space-y-4 text-sm leading-relaxed text-slate-600 font-medium bg-slate-50 p-6 rounded-2xl border border-slate-100">
                           <p className="flex items-start gap-2"><span className="text-red-500 font-black">•</span> <b>Tính pháp lý:</b> Mọi dữ liệu quân nhân được khai báo phải đảm bảo tính trung thực, chính xác theo hồ sơ gốc.</p>
                           <p className="flex items-start gap-2"><span className="text-red-500 font-black">•</span> <b>Offline 100%:</b> Hệ thống hoạt động hoàn toàn ngoại tuyến. Tuyệt đối không cố gắng kết nối Internet trong quá trình truy cập dữ liệu tuyệt mật.</p>
                           <p className="flex items-start gap-2"><span className="text-red-500 font-black">•</span> <b>Bảo mật thiết bị:</b> Cán bộ trực máy có trách nhiệm đăng xuất hệ thống khi rời vị trí làm việc.</p>
                        </div>
                     </section>

                     {/* Section 2 */}
                     <section id="sec2" className="space-y-6">
                        <div className="flex items-center gap-4 text-[#14452F]">
                           <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center"><Users size={20}/></div>
                           <h3 className="text-xl font-black uppercase tracking-tight">2. Quy trình quản lý hồ sơ</h3>
                        </div>
                        <div className="grid grid-cols-2 gap-6">
                           <div className="p-6 border rounded-2xl border-slate-100">
                              <h4 className="text-[10px] font-black text-slate-400 uppercase mb-3">Thêm mới quân nhân</h4>
                              <p className="text-xs text-slate-500 leading-relaxed mb-4">Click nút <b>"Thêm chiến sĩ"</b> hoặc dùng phím tắt {formatShortcut('add_person')}. Điền đầy đủ 8 Tab thông tin. Lưu ý Tab 5 & 6 là thông tin nhạy cảm.</p>
                              <div className="flex gap-2">
                                 <span className="px-2 py-1 bg-amber-50 text-amber-600 rounded text-[9px] font-black uppercase">Ảnh thẻ: Base64</span>
                                 <span className="px-2 py-1 bg-amber-50 text-amber-600 rounded text-[9px] font-black uppercase">Kích thước: 3x4</span>
                              </div>
                           </div>
                           <div className="p-6 border rounded-2xl border-slate-100">
                              <h4 className="text-[10px] font-black text-slate-400 uppercase mb-3">Cập nhật nghỉ phép</h4>
                              <p className="text-xs text-slate-500 leading-relaxed">Mỗi quân nhân có trường <b>"Nghỉ phép thực tế"</b>. Cán bộ cần cập nhật sau mỗi đợt quân nhân đi phép để hệ thống tự động tính toán chỉ số quân số trực chiến.</p>
                           </div>
                        </div>
                     </section>

                     {/* Section 3 */}
                     <section id="sec3" className="space-y-6">
                        <div className="flex items-center gap-4 text-[#14452F]">
                           <div className="w-10 h-10 bg-emerald-50 rounded-xl flex items-center justify-center"><Landmark size={20}/></div>
                           <h3 className="text-xl font-black uppercase tracking-tight">3. Sơ đồ tổ chức & Đơn vị</h3>
                        </div>
                        <div className="p-6 bg-slate-50 rounded-2xl space-y-4">
                           <p className="text-sm text-slate-600">Hệ thống hỗ trợ <b>Cơ cấu cây thư mục đệ quy (Recursive Tree)</b>. Khi tạo một đơn vị mới, bạn có thể chọn đơn vị cha là bất kỳ cấp nào (Tiểu đoàn - Đại đội - Trung đội).</p>
                           <div className="flex items-center gap-3 p-4 bg-white rounded-xl border border-slate-100">
                              <Info className="text-blue-500" size={20} />
                              <p className="text-xs font-bold text-slate-700">Khi xóa một Đơn vị cha, toàn bộ Đơn vị con trực thuộc sẽ bị xóa theo để đảm bảo tính nhất quán dữ liệu.</p>
                           </div>
                        </div>
                     </section>

                     {/* Section 4 */}
                     <section id="sec4" className="space-y-6">
                        <div className="flex items-center gap-4 text-[#14452F]">
                           <div className="w-10 h-10 bg-amber-50 rounded-xl flex items-center justify-center"><FileDown size={20}/></div>
                           <h3 className="text-xl font-black uppercase tracking-tight">4. Báo cáo & Kết xuất dữ liệu</h3>
                        </div>
                        <div className="bg-white border rounded-[2rem] p-8 space-y-6 shadow-sm">
                           <div className="flex items-center justify-between group">
                              <div className="flex items-center gap-3">
                                 <MousePointer2 size={16} className="text-slate-300" />
                                 <span className="text-xs font-black text-slate-800 uppercase">Xuất danh sách (CSV/Excel)</span>
                              </div>
                              <p className="text-[10px] text-slate-400 font-bold uppercase">Tab Danh sách &gt; Nút Xuất dữ liệu</p>
                           </div>
                           <div className="flex items-center justify-between group">
                              <div className="flex items-center gap-3">
                                 <MousePointer2 size={16} className="text-slate-300" />
                                 <span className="text-xs font-black text-slate-800 uppercase">In hồ sơ quân nhân cá nhân</span>
                              </div>
                              <p className="text-[10px] text-slate-400 font-bold uppercase">Xem chi tiết &gt; Ctrl + P</p>
                           </div>
                        </div>
                     </section>

                     {/* Section 5 */}
                     <section id="sec5" className="space-y-6">
                        <div className="flex items-center gap-4 text-[#14452F]">
                           <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center"><KeyboardIcon size={20}/></div>
                           <h3 className="text-xl font-black uppercase tracking-tight">5. Bảng tra cứu phím tắt nhanh</h3>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                           {shortcuts.map(s => (
                              <div key={s.id} className="flex items-center justify-between p-4 border rounded-2xl bg-slate-50">
                                 <span className="text-[10px] font-black text-slate-600 uppercase">{s.label}</span>
                                 <div className="flex gap-1">
                                    {s.ctrlKey && <span className="px-2 py-0.5 bg-white border rounded text-[9px] font-bold">Ctrl</span>}
                                    <span className="px-2 py-0.5 bg-white border rounded text-[9px] font-bold uppercase">{s.key}</span>
                                 </div>
                              </div>
                           ))}
                        </div>
                     </section>

                     {/* Section 6 */}
                     <section id="sec6" className="space-y-6">
                        <div className="flex items-center gap-4 text-[#14452F]">
                           <div className="w-10 h-10 bg-purple-50 rounded-xl flex items-center justify-center"><Database size={20}/></div>
                           <h3 className="text-xl font-black uppercase tracking-tight">6. Lưu trữ & Khôi phục (Backup)</h3>
                        </div>
                        <div className="space-y-4">
                           <div className="p-6 border-2 border-dashed border-purple-100 rounded-2xl flex items-center gap-6">
                              <HardDrive className="text-purple-300" size={32} />
                              <div>
                                 <p className="text-xs font-bold text-slate-700 leading-relaxed uppercase mb-2">Đường dẫn dữ liệu gốc:</p>
                                 <code className="bg-slate-100 px-3 py-1.5 rounded-lg text-[10px] text-purple-700 font-black">C:/Users/[User]/AppData/Roaming/QuanLyQuanNhan/IndexedDB</code>
                              </div>
                           </div>
                           <p className="text-xs text-slate-500 italic">Khuyến cáo: Cán bộ quản trị cần thực hiện sao lưu (Backup) tệp dữ liệu vào ổ cứng di động định kỳ 1 tuần/lần tại mục Thiết lập hệ thống.</p>
                        </div>
                     </section>

                     {/* Section 7 */}
                     <section id="sec7" className="space-y-6">
                        <div className="flex items-center gap-4 text-red-600">
                           <div className="w-10 h-10 bg-red-50 rounded-xl flex items-center justify-center"><ShieldAlert size={20}/></div>
                           <h3 className="text-xl font-black uppercase tracking-tight">7. Giải quyết sự cố thường gặp</h3>
                        </div>
                        <div className="space-y-4">
                           <div className="p-6 border border-red-100 rounded-2xl space-y-4">
                              <div>
                                 <p className="text-xs font-black text-slate-800 uppercase mb-1">Mất kết nối Database?</p>
                                 <p className="text-xs text-slate-500">Vào mục <b>Thiết lập</b> &gt; Chạy <b>"Debug Hệ thống"</b> để tự động quét lỗi kết nối và khôi phục Index dữ liệu.</p>
                              </div>
                              <div className="pt-4 border-t border-red-50">
                                 <p className="text-xs font-black text-slate-800 uppercase mb-1">Quên mật khẩu cán bộ?</p>
                                 <p className="text-xs text-slate-500">Liên hệ trực tiếp bộ phận Kỹ thuật Sư đoàn để được cấp mã reset vật lý thông qua tệp "app_secure_settings.json".</p>
                              </div>
                           </div>
                        </div>
                     </section>

                  </div>
               </div>
            </div>

            {/* Footer Manual */}
            <div className="p-8 bg-slate-50 border-t flex justify-center shrink-0">
               <button onClick={() => setShowGuide(false)} className="px-12 py-4 bg-[#14452F] text-white rounded-2xl font-black uppercase text-xs tracking-[0.2em] shadow-xl hover:bg-green-800 transition-all">Xác nhận đã hiểu quy trình & Quay lại làm việc</button>
            </div>
          </div>
        </div>
      )}

      {viewingPerson && (
        <div className="fixed inset-0 z-[600] bg-slate-900/90 backdrop-blur-md flex items-center justify-center p-8 animate-fade-in overflow-y-auto">
           <div className="bg-white w-full max-w-4xl rounded-[2.5rem] shadow-2xl flex flex-col overflow-hidden relative border border-white/10">
              <button onClick={() => setViewingPerson(undefined)} className="absolute top-6 right-6 w-10 h-10 bg-white border rounded-full flex items-center justify-center hover:bg-red-500 hover:text-white transition-all z-10"><X size={20} /></button>
              <div className="p-12 overflow-y-auto max-h-[90vh]">
                 <div className="grid grid-cols-3 gap-10">
                    <div className="space-y-6">
                       <div className="aspect-[3/4] bg-slate-100 rounded-3xl border-2 border-slate-50 shadow-inner overflow-hidden flex items-center justify-center">
                          {viewingPerson.anh_dai_dien ? <img src={viewingPerson.anh_dai_dien} className="w-full h-full object-cover" /> : <p className="text-[10px] font-black text-slate-300">KHÔNG CÓ ẢNH</p>}
                       </div>
                       <div className="p-6 bg-[#14452F] text-white rounded-[2rem] shadow-lg">
                          <p className="text-[8px] font-black text-green-400 uppercase tracking-widest mb-2">Thông tin tổ chức</p>
                          <h3 className="text-xl font-black uppercase tracking-tight leading-none mb-1">{viewingPerson.cap_bac}</h3>
                          <p className="text-[11px] font-bold opacity-70 uppercase mb-4">{viewingPerson.chuc_vu || 'N/A'}</p>
                          <div className="pt-4 border-t border-white/10">
                             <p className="text-[8px] font-black text-green-400 uppercase mb-1">Đơn vị quản lý</p>
                             <p className="text-xs font-black uppercase">{viewingPerson.don_vi}</p>
                          </div>
                       </div>
                    </div>
                    <div className="col-span-2 space-y-8">
                       <div>
                          <h2 className="text-4xl font-black text-slate-800 uppercase tracking-tighter leading-none">{viewingPerson.ho_ten}</h2>
                          <div className="flex gap-4 mt-4">
                             <div className="px-3 py-1 bg-slate-100 rounded-lg text-[10px] font-black text-slate-500 uppercase">{viewingPerson.cccd}</div>
                             <div className="px-3 py-1 bg-slate-100 rounded-lg text-[10px] font-black text-slate-500 uppercase">NS: {viewingPerson.ngay_sinh}</div>
                          </div>
                       </div>
                       
                       <div className="grid grid-cols-2 gap-6 bg-slate-50 p-6 rounded-3xl border border-slate-100">
                          <div>
                             <p className="text-[8px] font-black text-slate-400 uppercase mb-1.5">Trình độ học vấn</p>
                             <p className="text-xs font-bold text-slate-700">{viewingPerson.trinh_do_van_hoa}</p>
                          </div>
                          <div>
                             <p className="text-[8px] font-black text-slate-400 uppercase mb-1.5">Số điện thoại</p>
                             <p className="text-xs font-bold text-slate-700">{viewingPerson.sdt_rieng || 'Chưa cập nhật'}</p>
                          </div>
                          <div>
                             <p className="text-[8px] font-black text-slate-400 uppercase mb-1.5">Ngày nhập ngũ</p>
                             <p className="text-xs font-bold text-slate-700">{viewingPerson.nhap_ngu_ngay || 'N/A'}</p>
                          </div>
                          <div>
                             <p className="text-[8px] font-black text-slate-400 uppercase mb-1.5">Ngày vào Đảng</p>
                             <p className="text-xs font-bold text-red-600">{viewingPerson.vao_dang_ngay || 'Quần chúng'}</p>
                          </div>
                       </div>

                       <div className="p-6 bg-red-50 rounded-3xl border border-red-100">
                          <h4 className="text-[10px] font-black text-red-800 uppercase mb-4 flex items-center gap-2"><AlertTriangle size={14}/> Cảnh báo an ninh & Vi phạm</h4>
                          <div className="space-y-3">
                             {viewingPerson.tai_chinh_suc_khoe?.vay_no?.co_khong ? (
                                <p className="text-[11px] font-bold text-red-700">● Đang có khoản vay nợ: {viewingPerson.tai_chinh_suc_khoe.vay_no.so_tien}đ</p>
                             ) : <p className="text-[11px] font-bold text-green-700">● An toàn tài chính cá nhân</p>}
                             
                             {viewingPerson.lich_su_vi_pham?.ma_tuy?.co_khong ? (
                                <p className="text-[11px] font-bold text-red-700">● Có tiền sử sử dụng chất gây nghiện</p>
                             ) : <p className="text-[11px] font-bold text-green-700">● Không có tiền sử ma túy</p>}
                          </div>
                       </div>

                       <div className="flex gap-4 pt-4">
                          <button onClick={() => { setEditingPerson(viewingPerson); setViewingPerson(undefined); setIsFormOpen(true); }} className="flex-1 py-4 bg-[#14452F] text-white rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-xl flex items-center justify-center gap-2"><Edit3 size={18}/> Cập nhật hồ sơ</button>
                          <button onClick={() => setViewingPerson(undefined)} className="px-10 py-4 bg-slate-100 text-slate-500 rounded-2xl font-black uppercase text-[10px] tracking-widest border border-slate-200">Đóng</button>
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
