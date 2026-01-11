
import { 
  Search, FileDown, LogOut, 
  Users, Trash2, Eye,
  ShieldCheck, Landmark, UserPlus,
  Filter, Printer, BookOpen, ShieldAlert, 
  Keyboard as KeyboardIcon,
  LayoutDashboard,
  GraduationCap,
  FileText, MapPin, ChevronLeft, ChevronRight,
  FileEdit, AlertTriangle, CheckCircle2, X, Info, Loader2
} from 'lucide-react';
import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { MilitaryPersonnel, Unit, ShortcutConfig } from '../types';
import { db, FilterCriteria } from '../store';
import PersonnelForm from './PersonnelForm';
import UnitTree from './UnitTree';
import Settings from './Settings';
import UserGuide from './UserGuide';
import { exportPersonnelToCSV } from '../utils/exportHelper';
import ProfilePrintTemplate from './ProfilePrintTemplate';

type SortType = 'name' | 'age' | 'enlistment' | 'none';
type ToastType = 'success' | 'error' | 'info' | 'warning';

interface Toast {
  id: string;
  message: string;
  type: ToastType;
}

const ITEMS_PER_PAGE = 25;

const Dashboard: React.FC<{ onLogout: () => void }> = ({ onLogout }) => {
  const [activeTab, setActiveTab] = useState<'units' | 'settings' | 'overview'>('overview');
  const [personnel, setPersonnel] = useState<MilitaryPersonnel[]>([]);
  const [units, setUnits] = useState<Unit[]>([]);
  const [shortcuts, setShortcuts] = useState<ShortcutConfig[]>([]);
  
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingPerson, setEditingPerson] = useState<MilitaryPersonnel | undefined>(undefined);
  const [isViewMode, setIsViewMode] = useState(false); 

  const [printingPerson, setPrintingPerson] = useState<MilitaryPersonnel | undefined>(undefined);
  
  const [showAdvancedFilter, setShowAdvancedFilter] = useState(false);
  const [showGuide, setShowGuide] = useState(false);

  const [sortBy, setSortBy] = useState<SortType>('name');
  const [dashboardStats, setDashboardStats] = useState<any>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const [searchTerm, setSearchTerm] = useState('');

  // States cho hệ thống thông báo mới
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [confirmModal, setConfirmModal] = useState<{ isOpen: boolean; personId?: string; personName?: string }>({ isOpen: false });
  const [isProcessing, setIsProcessing] = useState(false);

  const [filters, setFilters] = useState<FilterCriteria>({
    keyword: '', unitId: 'all', rank: 'all', position: 'all',
    political: 'all', security: 'all', 
    education: 'all', marital: 'all', hasChildren: 'all'
  });

  const addToast = (message: string, type: ToastType = 'success') => {
    const id = Date.now().toString();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 3000);
  };

  useEffect(() => {
    const handler = setTimeout(() => {
      setFilters(prev => ({ ...prev, keyword: searchTerm }));
    }, 300);
    return () => clearTimeout(handler);
  }, [searchTerm]);

  const loadData = useCallback(async () => {
    try {
      const pList = await db.getPersonnel(filters);
      const uList = await db.getUnits();
      const stats = await db.getDashboardStats();
      
      setPersonnel(pList);
      setUnits(uList);
      setDashboardStats(stats || {
          total: pList.length,
          party: 0,
          securityAlert: 0,
          educationHigh: 0,
          ranks: {}
      });
      setCurrentPage(1);
    } catch (error) {
      addToast("Không thể tải dữ liệu hệ thống", "error");
    }
  }, [filters]);

  useEffect(() => { loadData(); }, [loadData]);

  const handlePrint = async (person: MilitaryPersonnel) => {
    try {
        const fullData = await db.getPersonnelById(person.id);
        if (fullData) {
            addToast(`Đang chuẩn bị bản in cho ${person.ho_ten.split(' ').pop()}...`, "info");
            setPrintingPerson(fullData);
            setTimeout(() => {
              window.print();
              setPrintingPerson(undefined);
            }, 600);
        }
    } catch (error) {
        addToast("Lỗi khi chuẩn bị in hồ sơ", "error");
    }
  };

  const handleExportCSV = () => {
    try {
        exportPersonnelToCSV(sortedPersonnel, `Danh_sach_quan_nhan_${new Date().getTime()}.xls`);
        addToast("Đã xuất file Excel thành công");
    } catch (e) {
        addToast("Lỗi khi xuất dữ liệu Excel", "error");
    }
  };

  const handleDeleteConfirm = async () => {
    if (!confirmModal.personId) return;
    setIsProcessing(true);
    try {
      await db.deletePersonnel(confirmModal.personId);
      addToast(`Đã xóa hồ sơ ${confirmModal.personName}`, "success");
      setConfirmModal({ isOpen: false });
      loadData();
    } catch (error) {
      addToast("Lỗi khi xóa hồ sơ", "error");
    } finally {
      setIsProcessing(false);
    }
  };

  const sortedPersonnel = useMemo(() => {
    const list = [...personnel];
    if (sortBy === 'name') {
      list.sort((a, b) => {
        const nameA = a.ho_ten.trim().split(' ').pop() || '';
        const nameB = b.ho_ten.trim().split(' ').pop() || '';
        return nameA.localeCompare(nameB, 'vi', { sensitivity: 'base' });
      });
    } else if (sortBy === 'age') {
      list.sort((a, b) => new Date(a.ngay_sinh).getTime() - new Date(b.ngay_sinh).getTime());
    } else if (sortBy === 'enlistment') {
      list.sort((a, b) => new Date(b.nhap_ngu_ngay).getTime() - new Date(a.nhap_ngu_ngay).getTime());
    }
    return list;
  }, [personnel, sortBy]);

  const paginatedPersonnel = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    return sortedPersonnel.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [sortedPersonnel, currentPage]);

  const totalPages = Math.ceil(sortedPersonnel.length / ITEMS_PER_PAGE);

  const StatCard = ({ title, value, icon: Icon, color, unitLabel, bgColor }: any) => (
    <div className={`bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between group hover:border-green-600/30 hover:shadow-md transition-all`}>
      <div>
        <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">{title}</p>
        <div className="flex items-baseline gap-2">
            <h3 className="text-2xl font-bold text-slate-800 leading-none">{value}</h3>
            {unitLabel && <span className="text-[10px] font-medium text-slate-400">{unitLabel}</span>}
        </div>
      </div>
      <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${bgColor || 'bg-slate-50'} ${color || 'text-slate-600'}`}>
          <Icon size={18} />
      </div>
    </div>
  );

  const LeaveProgressBar = ({ current, total }: { current: number; total: number }) => {
    const percentage = total > 0 ? Math.min(Math.round((current / total) * 100), 100) : 0;
    const remaining = Math.max(total - current, 0);
    
    let colorClass = "bg-green-500";
    if (percentage >= 90) colorClass = "bg-red-500";
    else if (percentage >= 70) colorClass = "bg-amber-500";

    return (
      <div className="w-full max-w-[140px]">
        <div className="flex justify-between items-center mb-1">
          <span className="text-[9px] font-black text-slate-400 uppercase">Phép: {current}/{total}</span>
          <span className={`text-[9px] font-black uppercase ${remaining === 0 ? 'text-red-500' : 'text-slate-600'}`}>
            Còn: {remaining}
          </span>
        </div>
        <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden border border-slate-200/50 shadow-inner">
          <div 
            className={`h-full ${colorClass} transition-all duration-500 rounded-full`} 
            style={{ width: `${percentage}%` }}
          />
        </div>
      </div>
    );
  };

  return (
    <div className="h-screen bg-[#F0F2F5] flex font-sans text-slate-800 overflow-hidden relative text-sm">
      
      <ProfilePrintTemplate data={printingPerson} />

      {/* TOAST NOTIFICATIONS */}
      <div className="fixed top-6 right-6 z-[1000] flex flex-col gap-3 no-print">
        {toasts.map(toast => (
          <div key={toast.id} className={`flex items-center gap-3 px-4 py-3 rounded-2xl shadow-2xl border animate-slide-left min-w-[300px] ${
            toast.type === 'success' ? 'bg-white border-green-100 text-green-800' :
            toast.type === 'error' ? 'bg-red-50 border-red-100 text-red-800' :
            toast.type === 'warning' ? 'bg-amber-50 border-amber-100 text-amber-800' :
            'bg-blue-50 border-blue-100 text-blue-800'
          }`}>
            {toast.type === 'success' && <CheckCircle2 className="text-green-500" size={20} />}
            {toast.type === 'error' && <AlertTriangle className="text-red-500" size={20} />}
            {toast.type === 'warning' && <AlertTriangle className="text-amber-500" size={20} />}
            {toast.type === 'info' && <Info className="text-blue-500" size={20} />}
            <span className="text-xs font-bold uppercase tracking-tight flex-1">{toast.message}</span>
            <button onClick={() => setToasts(prev => prev.filter(t => t.id !== toast.id))} className="text-slate-400 hover:text-slate-600">
              <X size={16} />
            </button>
          </div>
        ))}
      </div>

      {/* CONFIRM DELETE MODAL */}
      {confirmModal.isOpen && (
        <div className="fixed inset-0 z-[900] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-fade-in no-print">
          <div className="bg-white w-full max-w-md rounded-[2.5rem] shadow-2xl overflow-hidden border border-slate-200 animate-slide-up">
            <div className="p-8 text-center">
              <div className="w-20 h-20 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner">
                <AlertTriangle size={40} />
              </div>
              <h3 className="text-xl font-black text-slate-800 uppercase tracking-tight mb-2">Xác nhận xóa hồ sơ?</h3>
              <p className="text-sm text-slate-500 font-medium leading-relaxed mb-8">
                Hành động này sẽ gỡ bỏ hoàn toàn quân nhân <span className="text-red-600 font-bold">"{confirmModal.personName}"</span> khỏi hệ thống. Dữ liệu không thể khôi phục.
              </p>
              <div className="flex gap-4">
                <button 
                  disabled={isProcessing}
                  onClick={() => setConfirmModal({ isOpen: false })} 
                  className="flex-1 py-4 bg-slate-100 text-slate-500 rounded-2xl font-black uppercase text-xs tracking-widest hover:bg-slate-200 transition-all"
                >
                  Hủy bỏ
                </button>
                <button 
                  disabled={isProcessing}
                  onClick={handleDeleteConfirm}
                  className="flex-1 py-4 bg-red-600 text-white rounded-2xl font-black uppercase text-xs tracking-widest shadow-xl shadow-red-200 hover:bg-red-700 active:scale-95 transition-all flex items-center justify-center gap-2"
                >
                  {isProcessing ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={16} />}
                  Đồng ý xóa
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="w-64 bg-[#14452F] flex flex-col shadow-xl shrink-0 z-20 no-print">
        <div className="p-6 text-center border-b border-white/5 bg-[#0d2d1f]">
          <div className="flex flex-col items-center gap-2 mb-1">
             <div className="relative">
                <div className="absolute inset-0 bg-green-400 blur-[15px] opacity-20"></div>
                <Users className="text-white w-8 h-8 relative z-10 drop-shadow-[0_0_8px_rgba(255,255,255,0.3)]" strokeWidth={2} />
             </div>
             <h1 className="text-white font-black text-[13px] tracking-[0.1em] uppercase leading-tight mt-1">
                QLQN MANAGER<br/>SYSTEM
             </h1>
          </div>
          <p className="text-[#D4AF37] text-[8px] font-black uppercase tracking-[0.25em] opacity-90 mt-2">
            Powered by DHsystem
          </p>
        </div>
        
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto scrollbar-hide">
          <button onClick={() => setActiveTab('overview')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg font-medium text-xs uppercase tracking-wide transition-all ${activeTab === 'overview' ? 'bg-white text-[#14452F] shadow-md font-bold' : 'text-white/70 hover:bg-white/10 hover:text-white'}`}>
            <LayoutDashboard size={16} /> Tổng quan
          </button>
          <button onClick={() => setActiveTab('units')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg font-medium text-xs uppercase tracking-wide transition-all ${activeTab === 'units' ? 'bg-white text-[#14452F] shadow-md font-bold' : 'text-white/70 hover:bg-white/10 hover:text-white'}`}>
            <Landmark size={16} /> Đơn vị
          </button>
          <button onClick={() => setActiveTab('settings')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg font-medium text-xs uppercase tracking-wide transition-all ${activeTab === 'settings' ? 'bg-white text-[#14452F] shadow-md font-bold' : 'text-white/70 hover:bg-white/10 hover:text-white'}`}>
            <KeyboardIcon size={16} /> Thiết lập
          </button>
        </nav>

        <div className="p-4 border-t border-white/10 space-y-2">
          <button onClick={() => setShowGuide(true)} className="w-full py-2.5 bg-white/5 text-white/80 rounded-lg font-medium text-xs hover:bg-white/15 transition-all flex items-center justify-center gap-2">
            <BookOpen size={14} /> Hướng dẫn
          </button>
          <button onClick={onLogout} className="w-full py-2.5 bg-red-500/20 text-red-200 rounded-lg font-medium text-xs hover:bg-red-600 hover:text-white transition-all flex items-center justify-center gap-2">
            <LogOut size={14} /> Thoát
          </button>
        </div>
      </div>

      <div className="flex-1 flex flex-col min-h-0 bg-[#F0F2F5] no-print">
        <header className="bg-white px-6 py-3 shrink-0 flex items-center justify-between gap-6 border-b border-slate-200 z-10 shadow-sm no-print h-16">
          <div className="relative flex-1 max-w-2xl">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input 
              ref={searchInputRef}
              type="text" 
              placeholder="Tìm tên, CCCD, đơn vị, SĐT..."
              className="w-full pl-10 pr-4 py-2 bg-slate-100 border-none rounded-lg outline-none focus:ring-2 ring-green-600/20 font-medium text-sm text-slate-700 transition-all"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          <div className="flex gap-3">
            <button onClick={handleExportCSV} className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-300 text-slate-600 rounded-lg font-bold text-xs uppercase hover:bg-slate-50 hover:text-green-700 hover:border-green-600 transition-all"><FileDown size={16} /> Xuất Excel</button>
            <button 
              onClick={() => { 
                setEditingPerson(undefined); 
                setIsViewMode(false);
                setIsFormOpen(true); 
              }} 
              className="flex items-center gap-2 px-5 py-2 bg-[#14452F] text-white rounded-lg font-bold text-xs uppercase hover:bg-green-800 shadow-md transition-all"
            >
              <UserPlus size={16} /> Thêm mới
            </button>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto scroll-smooth bg-[#F0F2F5] no-print p-6">
          <div className="max-w-7xl mx-auto flex flex-col h-full">
          
          {activeTab === 'overview' && (
            <div className="space-y-6 animate-fade-in pb-10">
              
              {dashboardStats && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <StatCard title="Tổng quân số" value={dashboardStats.total} icon={Users} color="text-blue-600" bgColor="bg-blue-50" unitLabel="Người" />
                  <StatCard title="Đảng viên" value={dashboardStats.party} icon={ShieldCheck} color="text-red-600" bgColor="bg-red-50" unitLabel="Đ/c" />
                  <StatCard title="Trình độ cao" value={dashboardStats.educationHigh} icon={GraduationCap} color="text-purple-600" bgColor="bg-purple-50" unitLabel="Người" />
                  <StatCard title="Cảnh báo An ninh" value={dashboardStats.securityAlert} icon={ShieldAlert} color="text-amber-600" bgColor="bg-amber-50" unitLabel="Hồ sơ" />
                </div>
              )}

              <div className="flex flex-col md:flex-row justify-between items-center gap-4 bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                <div className="flex items-center gap-4">
                   <h2 className="text-sm font-bold text-slate-700 uppercase flex items-center gap-2">
                     <FileText size={16} className="text-green-700"/> Danh sách ({sortedPersonnel.length})
                   </h2>
                   <div className="h-4 w-[1px] bg-slate-300"></div>
                   <div className="flex items-center gap-2">
                      <span className="text-xs text-slate-500 font-medium">Sắp xếp:</span>
                      <select 
                        className="bg-slate-50 border border-slate-200 text-slate-700 text-xs rounded-md px-2 py-1 outline-none focus:border-green-500"
                        value={sortBy}
                        onChange={(e) => setSortBy(e.target.value as SortType)}
                      >
                        <option value="name">Tên A-Z</option>
                        <option value="age">Độ tuổi</option>
                        <option value="enlistment">Nhập ngũ</option>
                      </select>
                   </div>
                </div>
                <div>
                   <button 
                      onClick={() => setShowAdvancedFilter(!showAdvancedFilter)} 
                      className={`px-4 py-2 rounded-lg text-xs font-bold uppercase flex items-center gap-2 transition-all border ${showAdvancedFilter ? 'bg-green-50 text-green-700 border-green-200' : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'}`}
                   >
                     <Filter size={14}/> Bộ lọc
                   </button>
                </div>
              </div>

              {showAdvancedFilter && (
                <div className="bg-white p-5 rounded-xl border border-green-100 shadow-sm animate-slide-down">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="space-y-1"><label className="text-[10px] font-bold text-slate-400 uppercase">Chính trị</label><select className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium outline-none focus:border-green-500" value={filters.political} onChange={e => setFilters({...filters, political: e.target.value as any})}><option value="all">Tất cả</option><option value="dang_vien">Đảng viên</option><option value="quan_chung">Quần chúng</option></select></div>
                    <div className="space-y-1"><label className="text-[10px] font-bold text-slate-400 uppercase">Học vấn</label><select className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium outline-none focus:border-green-500" value={filters.education} onChange={e => setFilters({...filters, education: e.target.value as any})}><option value="all">Tất cả</option><option value="12_12">12/12</option><option value="dai_hoc">Đại học</option><option value="cao_dang">Cao đẳng</option></select></div>
                    <div className="space-y-1"><label className="text-[10px] font-bold text-slate-400 uppercase">Hôn nhân</label><select className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium outline-none focus:border-green-500" value={filters.marital} onChange={e => setFilters({...filters, marital: e.target.value as any})}><option value="all">Tất cả</option><option value="da_vo">Đã kết hôn</option><option value="chua_vo">Độc thân</option></select></div>
                    <div className="space-y-1"><label className="text-[10px] font-bold text-slate-400 uppercase">An ninh</label><select className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium outline-none focus:border-green-500" value={filters.security} onChange={e => setFilters({...filters, security: e.target.value as any})}><option value="all">Tất cả</option><option value="canh_bao">Cảnh báo An ninh</option><option value="vay_no">Vay nợ</option><option value="vi_pham">Vi phạm kỷ luật</option><option value="nuoc_ngoai">Yếu tố nước ngoài</option></select></div>
                  </div>
                </div>
              )}

              <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
                <div className="divide-y divide-slate-100">
                  {paginatedPersonnel.map((p) => (
                    <div key={p.id} className="p-3 flex items-center gap-4 hover:bg-slate-50 transition-colors group">
                      <div className="w-12 h-12 rounded-lg bg-slate-100 flex items-center justify-center border border-slate-200 overflow-hidden shrink-0 relative">
                          {p.anh_dai_dien && p.anh_dai_dien.startsWith('data:image') ? (
                              <img 
                                src={p.anh_dai_dien} 
                                alt={p.ho_ten} 
                                className="w-full h-full object-cover" 
                                loading="lazy" 
                              />
                          ) : (
                              <span className="text-green-800 font-bold text-lg">{p.ho_ten.charAt(0)}</span>
                          )}
                      </div>
                      
                      <div className="flex-1 grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
                          <div className="md:col-span-3 min-w-0">
                            <p className="text-sm font-bold text-slate-800 group-hover:text-green-700 truncate">{p.ho_ten}</p>
                            <div className="flex items-center gap-2 mt-0.5">
                               <span className="text-[10px] bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded border border-slate-200">{p.cccd}</span>
                               <span className="text-[10px] text-slate-400">NS: {p.ngay_sinh}</span>
                            </div>
                          </div>
                          
                          <div className="md:col-span-2">
                            <p className="text-xs font-bold text-slate-700">{p.cap_bac}</p>
                            <p className="text-[10px] text-slate-500 truncate">{p.chuc_vu || 'Chiến sĩ'}</p>
                          </div>

                          <div className="md:col-span-3">
                            <LeaveProgressBar 
                              current={p.nghi_phep_thuc_te || 0} 
                              total={p.nghi_phep_tham_chieu || 12} 
                            />
                          </div>

                          <div className="md:col-span-4 flex flex-wrap items-center gap-2">
                            <span className="px-2 py-1 bg-green-50 text-green-700 rounded text-[10px] font-bold border border-green-100 flex items-center gap-1"><MapPin size={10}/> {p.don_vi}</span>
                            {p.vao_dang_ngay && <span className="px-2 py-1 bg-red-50 text-red-600 rounded text-[10px] font-bold border border-red-100 flex items-center gap-1"><ShieldCheck size={10}/> Đảng viên</span>}
                            {db.hasSecurityAlert(p) && <span className="px-2 py-1 bg-amber-50 text-amber-600 rounded text-[10px] font-bold border border-amber-100 flex items-center gap-1"><ShieldAlert size={10}/> Cảnh báo</span>}
                          </div>
                      </div>

                      <div className="flex gap-1 shrink-0 opacity-80 group-hover:opacity-100">
                          <button 
                            onClick={async () => { 
                              const fullInfo = await db.getPersonnelById(p.id);
                              if (fullInfo) {
                                  setEditingPerson(fullInfo); 
                                  setIsViewMode(false); 
                                  setIsFormOpen(true); 
                              }
                            }} 
                            className="p-2 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded transition-all" 
                            title="Chỉnh sửa"
                          >
                            <FileEdit size={18} />
                          </button>

                          <button 
                            onClick={async () => { 
                              const fullInfo = await db.getPersonnelById(p.id);
                              if (fullInfo) {
                                  setEditingPerson(fullInfo); 
                                  setIsViewMode(true); 
                                  setIsFormOpen(true); 
                              }
                            }} 
                            className="p-2 text-slate-400 hover:text-green-700 hover:bg-green-50 rounded transition-all" 
                            title="Xem chi tiết"
                          >
                            <Eye size={18} />
                          </button>

                          <button onClick={() => handlePrint(p)} className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-all" title="In hồ sơ"><Printer size={18} /></button>
                          
                          <button 
                            onClick={() => setConfirmModal({ isOpen: true, personId: p.id, personName: p.ho_ten })} 
                            className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded transition-all" 
                            title="Xóa"
                          >
                            <Trash2 size={18} />
                          </button>
                      </div>
                    </div>
                  ))}
                  {paginatedPersonnel.length === 0 && (
                    <div className="p-8 text-center text-slate-400 text-sm">Chưa có dữ liệu hiển thị.</div>
                  )}
                </div>
              </div>

              {totalPages > 1 && (
                <div className="flex justify-between items-center pt-4">
                   <p className="text-xs text-slate-400">Trang {currentPage} / {totalPages}</p>
                   <div className="flex items-center gap-2">
                    <button 
                      disabled={currentPage === 1}
                      onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                      className="w-8 h-8 flex items-center justify-center bg-white border border-slate-200 rounded-lg text-slate-500 hover:text-green-700 disabled:opacity-50"
                    >
                      <ChevronLeft size={16} />
                    </button>
                    <div className="flex items-center gap-1">
                      {Array.from({ length: totalPages }).map((_, i) => (
                          <button 
                            key={i+1}
                            onClick={() => setCurrentPage(i+1)}
                            className={`w-8 h-8 flex items-center justify-center rounded-lg text-xs font-bold transition-all ${currentPage === i+1 ? 'bg-green-700 text-white' : 'text-slate-500 hover:bg-slate-100'}`}
                          >
                            {i+1}
                          </button>
                      ))}
                    </div>
                    <button 
                      disabled={currentPage === totalPages}
                      onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                      className="w-8 h-8 flex items-center justify-center bg-white border border-slate-200 rounded-lg text-slate-500 hover:text-green-700 disabled:opacity-50"
                    >
                      <ChevronRight size={16} />
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'units' && <UnitTree units={units} onRefresh={loadData} onViewDetailedList={(id) => { setFilters({...filters, unitId: id}); setActiveTab('overview'); }} />}
          {activeTab === 'settings' && <Settings />}

          </div>
        </main>
      </div>

      {showGuide && (
        <UserGuide onClose={() => setShowGuide(false)} />
      )}

      {isFormOpen && (
        <div className="fixed inset-0 z-[500] flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-sm overflow-y-auto no-print">
          <PersonnelForm 
            units={units} 
            initialData={editingPerson} 
            isViewMode={isViewMode}
            onClose={() => { setIsFormOpen(false); loadData(); }} 
          />
        </div>
      )}
      
      <style>{`
        .scrollbar-hide::-webkit-scrollbar { display: none; }
        .animate-fade-in { animation: fade-in 0.3s ease-out forwards; }
        .animate-slide-down { animation: slide-down 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
        .animate-slide-up { animation: slide-up 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
        .animate-slide-left { animation: slide-left 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
        .animate-shake { animation: shake 0.4s cubic-bezier(.36,.07,.19,.97) both; }
        
        @keyframes fade-in { from { opacity: 0; } to { opacity: 1; } }
        @keyframes slide-down { from { opacity: 0; transform: translateY(-10px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes slide-up { from { opacity: 0; transform: translateY(30px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes slide-left { from { opacity: 0; transform: translateX(30px); } to { opacity: 1; transform: translateX(0); } }
        @keyframes shake {
          10%, 90% { transform: translate3d(-1px, 0, 0); }
          20%, 80% { transform: translate3d(2px, 0, 0); }
          30%, 50%, 70% { transform: translate3d(-4px, 0, 0); }
          40%, 60% { transform: translate3d(4px, 0, 0); }
        }
      `}</style>
    </div>
  );
};

export default Dashboard;
