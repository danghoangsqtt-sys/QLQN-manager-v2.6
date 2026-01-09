import { 
    Search, FileDown, LogOut, 
    Users, Edit3, Trash2, Eye,
    ShieldCheck, Landmark, UserPlus,
    Filter, X, Printer, BookOpen, AlertTriangle, 
    SortAsc, Calendar, Clock, HelpCircle, 
    ChevronRight, Keyboard as KeyboardIcon,
    CheckCircle2, RefreshCcw, LayoutDashboard,
    TrendingUp, Activity, PieChart, Info,
    ShieldAlert, Database, HardDrive, MousePointer2,
    ChevronDown, ChevronUp
  } from 'lucide-react';
  import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
  import { MilitaryPersonnel, Unit, ShortcutConfig } from '../types.ts';
  import { db, FilterCriteria } from '../store.ts';
  import PersonnelForm from './PersonnelForm.tsx';
  import UnitTree from './UnitTree.tsx';
  import Settings from './Settings.tsx';
  
  // --- Định nghĩa các loại sắp xếp và bộ lọc ---
  type SortType = 'name_asc' | 'name_desc' | 'age_asc' | 'age_desc' | 'updated_newest' | 'updated_oldest';
  
  interface AdvancedFilterState {
    isDangVien: boolean | null; // null = all, true = only dang vien, false = only quan chung
    hasDebt: boolean;
    hasViolation: boolean;
    isMarried: boolean;
    hasForeignElement: boolean;
    educationLevel: string; // "" = all
  }
  
  const Dashboard: React.FC<{ onLogout: () => void }> = ({ onLogout }) => {
    // --- State cơ bản ---
    const [activeTab, setActiveTab] = useState<'personnel' | 'units' | 'settings' | 'overview'>('overview');
    const [personnel, setPersonnel] = useState<MilitaryPersonnel[]>([]);
    const [units, setUnits] = useState<Unit[]>([]);
    const [shortcuts, setShortcuts] = useState<ShortcutConfig[]>([]);
    
    // --- State UI ---
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [editingPerson, setEditingPerson] = useState<MilitaryPersonnel | undefined>(undefined);
    const [viewingPerson, setViewingPerson] = useState<MilitaryPersonnel | undefined>(undefined);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedUnitId, setSelectedUnitId] = useState<string | null>(null);
    
    // --- State Nâng cao (Sort & Filter) ---
    const [sortType, setSortType] = useState<SortType>('updated_newest');
    const [showAdvancedFilter, setShowAdvancedFilter] = useState(false);
    const [advancedFilters, setAdvancedFilters] = useState<AdvancedFilterState>({
      isDangVien: null,
      hasDebt: false,
      hasViolation: false,
      isMarried: false,
      hasForeignElement: false,
      educationLevel: ""
    });
  
    // --- Load dữ liệu ---
    useEffect(() => {
      const loadData = () => {
        setPersonnel(db.getPersonnel());
        setUnits(db.getUnits());
        setShortcuts(db.getShortcuts());
      };
      
      loadData();
      // Giả lập real-time update đơn giản bằng interval hoặc event listener nếu store hỗ trợ
      const interval = setInterval(loadData, 2000); 
      return () => clearInterval(interval);
    }, []);
  
    // --- 1. LOGIC THỐNG KÊ (STATISTICS) ---
    const stats = useMemo(() => {
      const now = new Date();
      const threeMonthsAgo = new Date();
      threeMonthsAgo.setMonth(now.getMonth() - 3);
  
      let dangVien = 0;
      let quanChung = 0;
      let tangMoi = 0; // Tăng trong 3 tháng qua (dựa trên ngày nhập ngũ)
      let coVayNo = 0;
      let coViPham = 0;
  
      personnel.forEach(p => {
        // Đảng viên vs Quần chúng
        if (p.ngay_vao_dang) {
          dangVien++;
        } else {
          quanChung++;
        }
  
        // Tăng giảm 3 tháng (Logic: Ngày nhập ngũ >= 3 tháng trước)
        const ngayNhap = new Date(p.ngay_nhap_ngu);
        if (ngayNhap >= threeMonthsAgo) {
          tangMoi++;
        }
  
        // Thống kê rủi ro
        if (p.tai_chinh_suc_khoe?.vay_no?.so_tien > 0) coVayNo++;
        if (p.lich_su_vi_pham?.ky_luat) coViPham++;
      });
  
      return {
        total: personnel.length,
        dangVien,
        quanChung,
        tangMoi,
        coVayNo,
        coViPham
      };
    }, [personnel]);
  
    // --- 2. LOGIC LỌC & SẮP XẾP (CORE LOGIC) ---
    const processedPersonnel = useMemo(() => {
      // B1: Lọc cơ bản & Nâng cao
      let result = personnel.filter(p => {
        // Lọc theo đơn vị (nếu có chọn)
        if (selectedUnitId && p.don_vi_id !== selectedUnitId) {
            // Cần logic đệ quy nếu muốn lấy cả con, ở đây làm đơn giản là khớp ID
            // Nếu muốn lấy cả đơn vị con, cần hàm helper check isDescendant
            return false; 
        }
  
        // Lọc Search Text
        const searchLower = searchTerm.toLowerCase();
        const matchesSearch = 
          p.ho_ten.toLowerCase().includes(searchLower) ||
          p.id.toLowerCase().includes(searchLower) ||
          p.que_quan.toLowerCase().includes(searchLower);
        
        if (!matchesSearch) return false;
  
        // Lọc Nâng cao
        if (advancedFilters.isDangVien === true && !p.ngay_vao_dang) return false;
        if (advancedFilters.isDangVien === false && p.ngay_vao_dang) return false;
        
        if (advancedFilters.hasDebt && (!p.tai_chinh_suc_khoe?.vay_no?.so_tien || p.tai_chinh_suc_khoe.vay_no.so_tien <= 0)) return false;
        
        if (advancedFilters.hasViolation && !p.lich_su_vi_pham?.ky_luat) return false;
        
        if (advancedFilters.isMarried && p.tinh_trang_hon_nhan !== 'co_vo') return false;
        
        if (advancedFilters.hasForeignElement && !p.yeu_to_nuoc_ngoai) return false;
  
        if (advancedFilters.educationLevel && !p.trinh_do_hoc_van?.toLowerCase().includes(advancedFilters.educationLevel.toLowerCase())) return false;
  
        return true;
      });
  
      // B2: Sắp xếp (Sorting)
      result.sort((a, b) => {
        // Helper lấy tên (Chữ cái cuối cùng)
        const getName = (fullName: string) => fullName.trim().split(' ').pop() || '';
        
        switch (sortType) {
          case 'name_asc':
            return getName(a.ho_ten).localeCompare(getName(b.ho_ten), 'vi');
          case 'name_desc':
            return getName(b.ho_ten).localeCompare(getName(a.ho_ten), 'vi');
          
          case 'age_asc': // Trẻ nhất trước (Năm sinh lớn hơn)
            return new Date(b.ngay_sinh).getTime() - new Date(a.ngay_sinh).getTime();
          case 'age_desc': // Già nhất trước
            return new Date(a.ngay_sinh).getTime() - new Date(b.ngay_sinh).getTime();
          
          case 'updated_newest':
            return new Date(b.updatedAt || 0).getTime() - new Date(a.updatedAt || 0).getTime();
          case 'updated_oldest':
            return new Date(a.updatedAt || 0).getTime() - new Date(b.updatedAt || 0).getTime();
            
          default:
            return 0;
        }
      });
  
      return result;
    }, [personnel, searchTerm, selectedUnitId, advancedFilters, sortType]);
  
    // --- Handlers ---
    const handleDelete = (id: string) => {
      if (confirm('Bạn có chắc chắn muốn xóa hồ sơ này?')) {
        db.deletePersonnel(id);
        setPersonnel(db.getPersonnel()); // Refresh
      }
    };
  
    const handleSavePersonnel = (data: MilitaryPersonnel) => {
      if (editingPerson) {
        db.updatePersonnel({ ...data, updatedAt: new Date().toISOString() });
      } else {
        db.addPersonnel({ ...data, updatedAt: new Date().toISOString(), createdAt: new Date().toISOString() });
      }
      setIsFormOpen(false);
      setEditingPerson(undefined);
      setPersonnel(db.getPersonnel()); // Refresh
    };
  
    // --- Render Components ---
  
    // UI: Thẻ thống kê (Đã nâng cấp)
    const renderStats = () => (
      <div className="grid grid-cols-4 gap-4 mb-6">
        <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex items-center justify-between">
          <div>
            <p className="text-slate-500 text-xs font-bold uppercase tracking-wider">Tổng quân số</p>
            <div className="flex items-baseline gap-2">
              <h3 className="text-3xl font-black text-slate-800">{stats.total}</h3>
              <span className="text-xs font-bold text-green-600 bg-green-100 px-2 py-0.5 rounded-full">
                +{stats.tangMoi} (3 tháng)
              </span>
            </div>
          </div>
          <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600">
            <Users size={24} />
          </div>
        </div>
  
        <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex items-center justify-between">
            <div>
              <p className="text-slate-500 text-xs font-bold uppercase tracking-wider">Đảng viên / Quần chúng</p>
              <div className="flex items-end gap-2 mt-1">
                 <div className='flex flex-col'>
                    <span className="text-lg font-bold text-red-600">{stats.dangVien} <span className="text-[10px] text-slate-400 font-normal">ĐV</span></span>
                 </div>
                 <div className='w-[1px] h-8 bg-slate-200'></div>
                 <div className='flex flex-col'>
                    <span className="text-lg font-bold text-slate-600">{stats.quanChung} <span className="text-[10px] text-slate-400 font-normal">QC</span></span>
                 </div>
              </div>
            </div>
            <div className="w-12 h-12 rounded-xl bg-red-50 flex items-center justify-center text-red-600">
              <Landmark size={24} />
            </div>
        </div>
  
        <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex items-center justify-between">
          <div>
            <p className="text-slate-500 text-xs font-bold uppercase tracking-wider">Cảnh báo Vay nợ</p>
            <h3 className={`text-3xl font-black ${stats.coVayNo > 0 ? 'text-orange-600' : 'text-slate-800'}`}>{stats.coVayNo}</h3>
          </div>
          <div className="w-12 h-12 rounded-xl bg-orange-50 flex items-center justify-center text-orange-600">
            <AlertTriangle size={24} />
          </div>
        </div>
  
        <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex items-center justify-between">
          <div>
            <p className="text-slate-500 text-xs font-bold uppercase tracking-wider">Vi phạm kỷ luật</p>
            <h3 className={`text-3xl font-black ${stats.coViPham > 0 ? 'text-red-600' : 'text-slate-800'}`}>{stats.coViPham}</h3>
          </div>
          <div className="w-12 h-12 rounded-xl bg-red-50 flex items-center justify-center text-red-600">
            <ShieldAlert size={24} />
          </div>
        </div>
      </div>
    );
  
    // UI: Toolbar Bộ lọc & Sắp xếp (Đã nâng cấp)
    const renderToolbar = () => (
      <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 mb-6">
        <div className="flex gap-4 items-center mb-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input 
              type="text"
              placeholder="Tìm kiếm cán bộ, chiến sĩ..."
              className="w-full pl-10 pr-4 py-3 bg-slate-50 border-none rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-sm font-medium"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          <button 
            onClick={() => setShowAdvancedFilter(!showAdvancedFilter)}
            className={`px-4 py-3 rounded-xl font-bold text-sm flex items-center gap-2 transition-colors ${showAdvancedFilter ? 'bg-blue-100 text-blue-700' : 'bg-slate-50 text-slate-600 hover:bg-slate-100'}`}
          >
            <Filter size={18} />
            Bộ lọc {showAdvancedFilter ? <ChevronUp size={16}/> : <ChevronDown size={16}/>}
          </button>
  
          <div className="flex items-center gap-2 bg-slate-50 p-1 rounded-xl">
             <span className="text-xs font-bold text-slate-400 px-2 uppercase">Sắp xếp:</span>
             <select 
                value={sortType} 
                onChange={(e) => setSortType(e.target.value as SortType)}
                className="bg-transparent text-sm font-bold text-slate-700 outline-none py-2 pr-2"
             >
                <option value="name_asc">Tên (A - Z)</option>
                <option value="name_desc">Tên (Z - A)</option>
                <option value="updated_newest">Mới cập nhật</option>
                <option value="updated_oldest">Cũ nhất</option>
                <option value="age_asc">Tuổi (Trẻ - Già)</option>
                <option value="age_desc">Tuổi (Già - Trẻ)</option>
             </select>
          </div>
  
          <button onClick={() => setIsFormOpen(true)} className="px-6 py-3 bg-blue-600 text-white rounded-xl font-bold text-sm shadow-lg shadow-blue-200 hover:bg-blue-700 transition-all flex items-center gap-2">
            <UserPlus size={18} /> Thêm mới
          </button>
        </div>
  
        {/* Panel Bộ lọc nâng cao */}
        {showAdvancedFilter && (
            <div className="pt-4 border-t border-slate-100 grid grid-cols-4 gap-4 animate-in fade-in slide-in-from-top-2">
                {/* Lọc Chính trị */}
                <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-500 uppercase">Chính trị</label>
                    <select 
                        className="w-full p-2 bg-slate-50 rounded-lg text-sm border border-slate-200"
                        value={advancedFilters.isDangVien === null ? 'all' : (advancedFilters.isDangVien ? 'true' : 'false')}
                        onChange={(e) => {
                            const val = e.target.value;
                            setAdvancedFilters(prev => ({...prev, isDangVien: val === 'all' ? null : (val === 'true')}));
                        }}
                    >
                        <option value="all">Tất cả</option>
                        <option value="true">Đảng viên</option>
                        <option value="false">Quần chúng</option>
                    </select>
                </div>
  
                {/* Lọc Trình độ */}
                <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-500 uppercase">Trình độ</label>
                    <select 
                        className="w-full p-2 bg-slate-50 rounded-lg text-sm border border-slate-200"
                        value={advancedFilters.educationLevel}
                        onChange={(e) => setAdvancedFilters(prev => ({...prev, educationLevel: e.target.value}))}
                    >
                        <option value="">Tất cả</option>
                        <option value="đại học">Đại học</option>
                        <option value="cao đẳng">Cao đẳng</option>
                        <option value="12/12">THPT (12/12)</option>
                    </select>
                </div>
  
                {/* Checkbox filters */}
                <div className="col-span-2 space-y-2">
                     <label className="text-xs font-bold text-slate-500 uppercase">Tiêu chí đặc biệt</label>
                     <div className="flex flex-wrap gap-3">
                        <label className="flex items-center gap-2 cursor-pointer p-2 rounded-lg border border-slate-200 hover:bg-slate-50">
                            <input type="checkbox" checked={advancedFilters.hasDebt} onChange={(e) => setAdvancedFilters(prev => ({...prev, hasDebt: e.target.checked}))} />
                            <span className="text-sm font-medium">Có vay nợ</span>
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer p-2 rounded-lg border border-slate-200 hover:bg-slate-50">
                            <input type="checkbox" checked={advancedFilters.hasViolation} onChange={(e) => setAdvancedFilters(prev => ({...prev, hasViolation: e.target.checked}))} />
                            <span className="text-sm font-medium">Có vi phạm</span>
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer p-2 rounded-lg border border-slate-200 hover:bg-slate-50">
                            <input type="checkbox" checked={advancedFilters.hasForeignElement} onChange={(e) => setAdvancedFilters(prev => ({...prev, hasForeignElement: e.target.checked}))} />
                            <span className="text-sm font-medium">Yếu tố nước ngoài</span>
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer p-2 rounded-lg border border-slate-200 hover:bg-slate-50">
                            <input type="checkbox" checked={advancedFilters.isMarried} onChange={(e) => setAdvancedFilters(prev => ({...prev, isMarried: e.target.checked}))} />
                            <span className="text-sm font-medium">Đã kết hôn</span>
                        </label>
                     </div>
                </div>
            </div>
        )}
      </div>
    );
  
    // Main Render
    return (
      <div className="flex h-screen bg-[#F8F9FC] font-sans text-slate-900 overflow-hidden">
        {/* Sidebar Mini */}
        <aside className="w-20 bg-[#14452F] flex flex-col items-center py-6 gap-6 z-20 shadow-2xl">
          <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center text-white mb-4">
            <ShieldCheck size={24} />
          </div>
          <nav className="flex-1 flex flex-col gap-4 w-full px-2">
            <button onClick={() => setActiveTab('overview')} className={`p-3 rounded-xl flex justify-center transition-all ${activeTab === 'overview' ? 'bg-white text-[#14452F] shadow-lg translate-x-1' : 'text-white/60 hover:text-white hover:bg-white/10'}`}>
              <LayoutDashboard size={22} />
            </button>
            <button onClick={() => setActiveTab('personnel')} className={`p-3 rounded-xl flex justify-center transition-all ${activeTab === 'personnel' ? 'bg-white text-[#14452F] shadow-lg translate-x-1' : 'text-white/60 hover:text-white hover:bg-white/10'}`}>
              <Users size={22} />
            </button>
            <button onClick={() => setActiveTab('units')} className={`p-3 rounded-xl flex justify-center transition-all ${activeTab === 'units' ? 'bg-white text-[#14452F] shadow-lg translate-x-1' : 'text-white/60 hover:text-white hover:bg-white/10'}`}>
              <Database size={22} />
            </button>
            <div className="h-px w-8 bg-white/10 mx-auto my-2"></div>
            <button onClick={() => setActiveTab('settings')} className={`p-3 rounded-xl flex justify-center transition-all ${activeTab === 'settings' ? 'bg-white text-[#14452F] shadow-lg translate-x-1' : 'text-white/60 hover:text-white hover:bg-white/10'}`}>
              <Activity size={22} />
            </button>
          </nav>
          <button onClick={onLogout} className="p-3 text-red-300 hover:bg-red-500/20 rounded-xl transition-colors mt-auto">
            <LogOut size={22} />
          </button>
        </aside>
  
        {/* Content Area */}
        <main className="flex-1 flex flex-col h-full overflow-hidden relative">
          {/* Top Header */}
          <header className="h-16 bg-white border-b border-slate-100 flex items-center justify-between px-8 z-10">
            <div className="flex items-center gap-3">
              <h1 className="text-xl font-black text-slate-800 tracking-tight uppercase">Hệ thống quản lý quân nhân</h1>
              <span className="bg-blue-50 text-blue-600 text-[10px] font-bold px-2 py-1 rounded-md border border-blue-100">v2.6 PRO</span>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 bg-slate-50 px-3 py-1.5 rounded-full border border-slate-200">
                <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                <span className="text-xs font-bold text-slate-600">Hệ thống sẵn sàng</span>
              </div>
              <div className="w-8 h-8 rounded-full bg-slate-200 overflow-hidden border-2 border-white shadow-sm">
                <img src="https://ui-avatars.com/api/?name=Admin&background=0D8ABC&color=fff" alt="User" />
              </div>
            </div>
          </header>
  
          {/* Scrollable Content */}
          <div className="flex-1 overflow-auto p-8 relative">
            {activeTab === 'overview' && (
              <div className="max-w-6xl mx-auto animate-in fade-in zoom-in-95 duration-300">
                <div className="mb-8">
                  <h2 className="text-2xl font-black text-slate-800 mb-2">Tổng quan đơn vị</h2>
                  <p className="text-slate-500 font-medium">Cập nhật số liệu thống kê thời gian thực</p>
                </div>
                
                {renderStats()}
  
                {/* Table Preview */}
                <div className="bg-white rounded-3xl shadow-xl border border-slate-100 overflow-hidden">
                    <div className="p-6 border-b border-slate-100 flex justify-between items-center">
                        <h3 className="font-bold text-lg flex items-center gap-2">
                            <Activity size={20} className="text-blue-600"/>
                            Biến động nhân sự gần đây
                        </h3>
                        <button onClick={() => setActiveTab('personnel')} className="text-blue-600 text-sm font-bold hover:underline">Xem tất cả</button>
                    </div>
                    <div className="p-0">
                        <table className="w-full text-left text-sm">
                            <thead className="bg-slate-50 text-slate-500 font-bold uppercase text-xs">
                                <tr>
                                    <th className="px-6 py-4">Quân nhân</th>
                                    <th className="px-6 py-4">Cấp bậc</th>
                                    <th className="px-6 py-4">Thời gian</th>
                                    <th className="px-6 py-4 text-right">Trạng thái</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {personnel.slice(0, 5).map((p, idx) => (
                                    <tr key={idx} className="hover:bg-slate-50/50">
                                        <td className="px-6 py-4 font-bold text-slate-700">{p.ho_ten}</td>
                                        <td className="px-6 py-4">{p.cap_bac}</td>
                                        <td className="px-6 py-4 text-slate-500">{new Date(p.updatedAt || p.createdAt || Date.now()).toLocaleDateString('vi-VN')}</td>
                                        <td className="px-6 py-4 text-right">
                                            <span className="inline-flex items-center gap-1 text-xs font-bold text-green-600 bg-green-50 px-2 py-1 rounded-md">
                                                <CheckCircle2 size={12}/> Hoạt động
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
              </div>
            )}
  
            {activeTab === 'personnel' && (
              <div className="flex gap-6 h-full">
                {/* Left Tree */}
                <div className="w-72 flex-shrink-0 h-full overflow-hidden bg-white rounded-2xl shadow-sm border border-slate-100 flex flex-col">
                  <div className="p-4 border-b border-slate-100 bg-slate-50/50">
                    <h3 className="font-bold text-slate-700 flex items-center gap-2">
                        <Database size={16}/> Cây đơn vị
                    </h3>
                  </div>
                  <div className="flex-1 overflow-auto p-2">
                     <UnitTree 
                        units={units} 
                        onSelectUnit={setSelectedUnitId} 
                        selectedUnitId={selectedUnitId} 
                     />
                  </div>
                </div>
  
                {/* Right List */}
                <div className="flex-1 flex flex-col min-w-0">
                  {renderToolbar()}
  
                  <div className="flex-1 bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden flex flex-col">
                     <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
                        <span className="font-bold text-slate-500 text-xs uppercase">
                            Hiển thị {processedPersonnel.length} / {personnel.length} hồ sơ
                        </span>
                        {/* Tags lọc đang active */}
                        <div className="flex gap-2">
                            {advancedFilters.isDangVien !== null && (
                                <span className="text-[10px] font-bold bg-red-100 text-red-600 px-2 py-1 rounded-md">
                                    {advancedFilters.isDangVien ? 'Đảng viên' : 'Quần chúng'}
                                </span>
                            )}
                            {advancedFilters.hasDebt && (
                                <span className="text-[10px] font-bold bg-orange-100 text-orange-600 px-2 py-1 rounded-md">Vay nợ</span>
                            )}
                        </div>
                     </div>
  
                     <div className="flex-1 overflow-auto p-4 grid grid-cols-1 xl:grid-cols-2 gap-4">
                        {processedPersonnel.map(p => (
                            <div key={p.id} onClick={() => setViewingPerson(p)} className="group bg-white border border-slate-200 rounded-xl p-4 hover:shadow-xl hover:border-blue-300 transition-all cursor-pointer relative overflow-hidden">
                                <div className="absolute top-0 right-0 p-3 opacity-0 group-hover:opacity-100 transition-opacity flex gap-2">
                                    <button onClick={(e) => { e.stopPropagation(); setEditingPerson(p); setIsFormOpen(true); }} className="p-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100"><Edit3 size={16}/></button>
                                    <button onClick={(e) => { e.stopPropagation(); handleDelete(p.id); }} className="p-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100"><Trash2 size={16}/></button>
                                </div>
                                <div className="flex items-center gap-4">
                                    <div className="w-16 h-16 rounded-full bg-slate-100 flex-shrink-0 flex items-center justify-center text-slate-400 font-black text-xl border-2 border-white shadow-sm">
                                        {p.avatarUrl ? <img src={p.avatarUrl} className="w-full h-full object-cover rounded-full" /> : p.ho_ten.charAt(0)}
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-slate-800 text-lg group-hover:text-blue-700 transition-colors">{p.ho_ten}</h4>
                                        <p className="text-sm font-medium text-slate-500 mb-1">{p.cap_bac} - {p.chuc_vu}</p>
                                        <div className="flex gap-2">
                                            {p.ngay_vao_dang ? 
                                                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-red-100 text-red-700 border border-red-200">Đảng viên</span> : 
                                                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-500 border border-slate-200">Quần chúng</span>
                                            }
                                            {p.tai_chinh_suc_khoe?.vay_no?.so_tien > 0 && 
                                                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-orange-100 text-orange-700 border border-orange-200 animate-pulse">Cảnh báo nợ</span>
                                            }
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                        {processedPersonnel.length === 0 && (
                            <div className="col-span-full h-40 flex flex-col items-center justify-center text-slate-400">
                                <Search size={40} className="mb-2 opacity-20"/>
                                <p>Không tìm thấy quân nhân nào phù hợp</p>
                            </div>
                        )}
                     </div>
                  </div>
                </div>
              </div>
            )}
  
            {/* Modal Components */}
            {isFormOpen && (
              <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                <PersonnelForm 
                  initialData={editingPerson}
                  units={units}
                  onSave={handleSavePersonnel}
                  onClose={() => { setIsFormOpen(false); setEditingPerson(undefined); }}
                />
              </div>
            )}
  
            {viewingPerson && (
               <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-md z-50 flex items-center justify-center p-4 animate-in fade-in zoom-in-95">
                   <div className="bg-white rounded-3xl w-full max-w-2xl max-h-[90vh] overflow-hidden shadow-2xl flex flex-col">
                       {/* Header Detail */}
                       <div className="h-32 bg-gradient-to-r from-[#14452F] to-[#0A2F1F] relative flex items-end p-8">
                          <button onClick={() => setViewingPerson(undefined)} className="absolute top-4 right-4 p-2 bg-white/10 hover:bg-white/20 text-white rounded-full"><X size={20}/></button>
                          <div className="translate-y-1/2 flex items-end gap-6 w-full">
                             <div className="w-32 h-32 rounded-2xl bg-white p-1 shadow-xl">
                                <div className="w-full h-full bg-slate-100 rounded-xl overflow-hidden flex items-center justify-center text-4xl font-black text-slate-300">
                                   {viewingPerson.avatarUrl ? <img src={viewingPerson.avatarUrl} className="w-full h-full object-cover"/> : viewingPerson.ho_ten.charAt(0)}
                                </div>
                             </div>
                             <div className="mb-4 text-white">
                                <h2 className="text-3xl font-black">{viewingPerson.ho_ten}</h2>
                                <p className="opacity-80 text-lg font-medium">{viewingPerson.cap_bac} - {viewingPerson.chuc_vu}</p>
                             </div>
                          </div>
                       </div>
  
                       {/* Content Detail */}
                       <div className="p-8 pt-20 overflow-y-auto flex-1 bg-[#F8F9FC]">
                          <div className="grid grid-cols-2 gap-8">
                             <div className="space-y-6">
                                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                                    <h4 className="text-xs font-bold text-slate-400 uppercase mb-4 flex items-center gap-2"><Info size={14}/> Thông tin cơ bản</h4>
                                    <div className="space-y-3">
                                        <div className="flex justify-between"><span className="text-slate-500 text-sm">Ngày sinh:</span> <span className="font-bold text-slate-800">{new Date(viewingPerson.ngay_sinh).toLocaleDateString('vi-VN')}</span></div>
                                        <div className="flex justify-between"><span className="text-slate-500 text-sm">Quê quán:</span> <span className="font-bold text-slate-800">{viewingPerson.que_quan}</span></div>
                                        <div className="flex justify-between"><span className="text-slate-500 text-sm">Nhập ngũ:</span> <span className="font-bold text-slate-800">{new Date(viewingPerson.ngay_nhap_ngu).toLocaleDateString('vi-VN')}</span></div>
                                        <div className="flex justify-between"><span className="text-slate-500 text-sm">Trình độ:</span> <span className="font-bold text-slate-800">{viewingPerson.trinh_do_hoc_van}</span></div>
                                    </div>
                                </div>
                                
                                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                                    <h4 className="text-xs font-bold text-slate-400 uppercase mb-4 flex items-center gap-2"><Landmark size={14}/> Chính trị & Gia đình</h4>
                                    <div className="space-y-3">
                                        <div className="flex justify-between">
                                            <span className="text-slate-500 text-sm">Đảng viên:</span> 
                                            <span className={`font-bold ${viewingPerson.ngay_vao_dang ? 'text-red-600' : 'text-slate-800'}`}>
                                                {viewingPerson.ngay_vao_dang ? `Kết nạp ${new Date(viewingPerson.ngay_vao_dang).toLocaleDateString('vi-VN')}` : 'Chưa'}
                                            </span>
                                        </div>
                                        <div className="flex justify-between"><span className="text-slate-500 text-sm">Hôn nhân:</span> <span className="font-bold text-slate-800">{viewingPerson.tinh_trang_hon_nhan === 'co_vo' ? 'Đã kết hôn' : 'Độc thân'}</span></div>
                                    </div>
                                </div>
                             </div>
  
                             <div className="space-y-6">
                                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                                    <h4 className="text-xs font-bold text-slate-400 uppercase mb-4 flex items-center gap-2"><ShieldAlert size={14}/> Tình hình quản lý</h4>
                                    <div className="space-y-4">
                                        <div className={`p-3 rounded-xl border ${viewingPerson.tai_chinh_suc_khoe?.vay_no?.so_tien > 0 ? 'bg-orange-50 border-orange-200 text-orange-800' : 'bg-green-50 border-green-200 text-green-800'}`}>
                                            <p className="text-xs font-bold uppercase mb-1">Tài chính</p>
                                            <p className="font-bold text-sm">
                                                {viewingPerson.tai_chinh_suc_khoe?.vay_no?.so_tien > 0 
                                                ? `Đang vay nợ: ${viewingPerson.tai_chinh_suc_khoe.vay_no.so_tien.toLocaleString()}đ` 
                                                : 'An toàn, không có dư nợ xấu'}
                                            </p>
                                        </div>
  
                                        <div className={`p-3 rounded-xl border ${viewingPerson.lich_su_vi_pham?.ky_luat ? 'bg-red-50 border-red-200 text-red-800' : 'bg-green-50 border-green-200 text-green-800'}`}>
                                            <p className="text-xs font-bold uppercase mb-1">Kỷ luật</p>
                                            <p className="font-bold text-sm">
                                                {viewingPerson.lich_su_vi_pham?.ky_luat
                                                ? `Có vi phạm: ${viewingPerson.lich_su_vi_pham.hinh_thuc}` 
                                                : 'Chấp hành tốt kỷ luật'}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                             </div>
                          </div>
                          
                          <div className="mt-8 flex gap-4">
                              <button onClick={() => { setEditingPerson(viewingPerson); setViewingPerson(undefined); setIsFormOpen(true); }} className="flex-1 py-4 bg-[#14452F] hover:bg-[#1a573b] text-white rounded-xl font-bold uppercase text-sm shadow-xl shadow-green-900/20 flex items-center justify-center gap-2 transition-all">
                                  <Edit3 size={18}/> Cập nhật hồ sơ
                              </button>
                              <button onClick={() => setViewingPerson(undefined)} className="px-8 py-4 bg-white hover:bg-slate-50 text-slate-600 rounded-xl font-bold uppercase text-sm border border-slate-200 shadow-sm transition-all">
                                  Đóng lại
                              </button>
                          </div>
                       </div>
                   </div>
               </div>
            )}
  
            {activeTab === 'settings' && <Settings />}
          </div>
        </main>
      </div>
    );
  };
  
  export default Dashboard;