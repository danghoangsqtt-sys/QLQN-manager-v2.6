
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
  FilterX, ChevronDown, GraduationCap, Heart, Baby,
  Zap, ArrowUpRight, UserCheck, Briefcase, FileText,
  MapPin, Phone, ChevronLeft
} from 'lucide-react';
import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { MilitaryPersonnel, Unit, ShortcutConfig } from '../types.ts';
import { db, FilterCriteria } from '../store.ts';
import PersonnelForm from './PersonnelForm.tsx';
import UnitTree from './UnitTree.tsx';
import Settings from './Settings.tsx';

type SortType = 'name' | 'age' | 'enlistment' | 'none';

const ITEMS_PER_PAGE = 20;

const Dashboard: React.FC<{ onLogout: () => void }> = ({ onLogout }) => {
  const [activeTab, setActiveTab] = useState<'units' | 'settings' | 'overview'>('overview');
  const [personnel, setPersonnel] = useState<MilitaryPersonnel[]>([]);
  const [units, setUnits] = useState<Unit[]>([]);
  const [shortcuts, setShortcuts] = useState<ShortcutConfig[]>([]);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingPerson, setEditingPerson] = useState<MilitaryPersonnel | undefined>(undefined);
  const [viewingPerson, setViewingPerson] = useState<MilitaryPersonnel | undefined>(undefined);
  const [printingPerson, setPrintingPerson] = useState<MilitaryPersonnel | undefined>(undefined);
  const [showAdvancedFilter, setShowAdvancedFilter] = useState(false);
  const [showGuide, setShowGuide] = useState(false);
  const [sortBy, setSortBy] = useState<SortType>('name');
  const [dashboardStats, setDashboardStats] = useState<any>(null);
  const [currentPage, setCurrentPage] = useState(1);
  
  const searchInputRef = useRef<HTMLInputElement>(null);

  const [filters, setFilters] = useState<FilterCriteria>({
    keyword: '', unitId: 'all', rank: 'all', position: 'all',
    political: 'all', security: 'all', 
    education: 'all', marital: 'all', hasChildren: 'all'
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
    setCurrentPage(1);
  }, [filters]);

  useEffect(() => { loadData(); }, [loadData]);

  const handlePrint = (person: MilitaryPersonnel) => {
    setPrintingPerson(person);
    setTimeout(() => {
      window.print();
      setPrintingPerson(undefined);
    }, 600);
  };

  const handleExportCSV = () => {
    if (personnel.length === 0) {
      alert("Không có dữ liệu quân nhân để xuất!");
      return;
    }

    // 1. Định nghĩa Headers đầy đủ
    const headers = [
      "Họ tên", "Tên khác", "Ngày sinh", "CCCD", "Cấp bậc", "Chức vụ", "Đơn vị", "SĐT Riêng", 
      "Quê quán", "HKTT", "Dân tộc", "Tôn giáo", "Nhập ngũ", "Vào Đoàn", 
      "Vào Đảng", "Học vấn", "Tốt nghiệp", "Năng khiếu", "Nghỉ phép (Thực tế)", "Nghỉ phép (Tham chiếu)",
      "Vay nợ", "Người vay", "Số tiền nợ", "Mục đích vay", "Hạn trả", "Gia đình biết?", "Người trả nợ",
      "Vi phạm địa phương", "Sử dụng ma túy", "Đánh bạc/Cá độ", "Yếu tố nước ngoài", "Nguyện vọng bản thân"
    ];

    // 2. Hàm làm sạch dữ liệu để tránh lỗi CSV
    const clean = (val: any) => {
      if (val === undefined || val === null) return "";
      // Xóa dấu xuống dòng và escape dấu nháy kép
      return String(val).replace(/[\r\n]+/g, " ").replace(/"/g, '""');
    };

    // 3. Xử lý dữ liệu từng hàng
    const rows = sortedPersonnel.map(p => [
      p.ho_ten,
      p.ten_khac || "Không",
      p.ngay_sinh,
      p.cccd,
      p.cap_bac,
      p.chuc_vu || "Chiến sĩ",
      p.don_vi,
      p.sdt_rieng || "",
      p.noi_sinh || "",
      p.ho_khau_thu_tru || "",
      p.dan_toc,
      p.ton_giao,
      p.nhap_ngu_ngay,
      p.ngay_vao_doan || "",
      p.vao_dang_ngay || "Quần chúng",
      p.trinh_do_van_hoa,
      p.da_tot_nghiep ? "Rồi" : "Chưa",
      p.nang_khieu_so_truong || "",
      p.nghi_phep_thuc_te,
      p.nghi_phep_tham_chieu,
      p.tai_chinh_suc_khoe?.vay_no?.co_khong ? "CÓ NỢ" : "Không",
      p.tai_chinh_suc_khoe?.vay_no?.nguoi_dung_ten || "",
      p.tai_chinh_suc_khoe?.vay_no?.so_tien || "0",
      p.tai_chinh_suc_khoe?.vay_no?.muc_dich || "",
      p.tai_chinh_suc_khoe?.vay_no?.han_tra || "",
      p.tai_chinh_suc_khoe?.vay_no?.gia_dinh_biet ? "Có" : "Không",
      p.tai_chinh_suc_khoe?.vay_no?.nguoi_tra || "",
      p.lich_su_vi_pham?.vi_pham_dia_phuong?.co_khong ? p.lich_su_vi_pham.vi_pham_dia_phuong.noi_dung : "Không",
      p.lich_su_vi_pham?.ma_tuy?.co_khong ? "CÓ TIỀN SỬ" : "Không",
      p.lich_su_vi_pham?.danh_bac?.co_khong ? "CÓ THAM GIA" : "Không",
      (p.yeu_to_nuoc_ngoai?.than_nhan?.length || 0) > 0 ? "CÓ" : "Không",
      p.y_kien_nguyen_vong || ""
    ]);

    // 4. Xây dựng nội dung file
    const BOM = "\uFEFF"; // Byte Order Mark cho UTF-8
    const sepInstruction = "sep=,"; // Lệnh ép Excel dùng dấu phẩy
    const dateStr = new Date().toLocaleDateString('vi-VN');
    const titleRow = `DANH SÁCH QUÂN NHÂN - CHIẾT XUẤT NGÀY: ${dateStr} - TỔNG QUÂN SỐ: ${personnel.length} ĐỒNG CHÍ`;
    
    // Ghép tất cả các phần thành chuỗi CSV hoàn chỉnh
    const csvContent = [
      sepInstruction,
      `"${clean(titleRow)}"`, // Dòng tiêu đề lớn (chiếm 1 ô đầu)
      headers.map(h => `"${clean(h)}"`).join(","), // Hàng tiêu đề cột
      ...rows.map(row => row.map(val => `"${clean(val)}"`).join(",")) // Dữ liệu quân nhân
    ].join("\n");

    // 5. Kích hoạt tải xuống
    const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    const fileName = `Bao_cao_nhan_su_${new Date().getTime()}.csv`;
    link.setAttribute("download", fileName);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
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

  const resetFilters = () => {
    setFilters({
      keyword: '', unitId: 'all', rank: 'all', position: 'all',
      political: 'all', security: 'all', 
      education: 'all', marital: 'all', hasChildren: 'all'
    });
  };

  const StatCard = ({ title, value, icon: Icon, color, unitLabel, bgColor }: any) => (
    <div className={`bg-white p-6 xl:p-8 rounded-[2.5rem] border border-slate-100 shadow-sm flex flex-col justify-between group hover:shadow-lg transition-all duration-300 relative overflow-hidden`}>
      <div className={`absolute -right-4 -top-4 w-24 h-24 ${bgColor || 'bg-slate-50'} opacity-10 rounded-full group-hover:scale-150 transition-transform duration-700`}></div>
      <div className="flex justify-between items-start mb-6 relative z-10">
        <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${bgColor || 'bg-slate-50'} ${color || 'text-slate-600'} shadow-inner`}>
          <Icon size={22} />
        </div>
      </div>
      <div className="relative z-10">
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2">{title}</p>
        <div className="flex items-baseline gap-2">
            <h3 className="text-4xl font-black text-slate-800 tracking-tighter leading-none">{value}</h3>
            {unitLabel && <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{unitLabel}</span>}
        </div>
      </div>
    </div>
  );

  return (
    <div className="h-screen bg-[#F1F5F9] flex font-sans text-slate-800 overflow-hidden relative">
      
      {/* VÙNG IN HỒ SƠ CHUẨN A4 */}
      {printingPerson && (
        <div className="print-area-wrapper">
          <div className="a4-page">
            <div className="print-header">
              <div className="unit-label">
                <p className="font-bold uppercase tracking-tighter">ĐƠN VỊ: {printingPerson.don_vi}</p>
                <div className="line-sm"></div>
                <p className="text-[10px] font-bold">Số hồ sơ: QN-{printingPerson.cccd.slice(-6)}</p>
              </div>
              <div className="national-label">
                <p className="font-bold uppercase text-[12px]">CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM</p>
                <p className="font-bold text-[11px]">Độc lập - Tự do - Hạnh phúc</p>
                <div className="line-lg"></div>
              </div>
            </div>

            <h1 className="main-title">SƠ YẾU LÝ LỊCH QUÂN NHÂN</h1>
            <p className="sub-title-italic">(Dùng cho công tác quản lý quân số nội bộ)</p>

            <div className="info-grid-container">
              <div className="photo-box">
                {printingPerson.anh_dai_dien ? (
                  <img src={printingPerson.anh_dai_dien} alt="Avatar" />
                ) : (
                  <div className="placeholder">ẢNH 3x4</div>
                )}
              </div>
              <div className="primary-info">
                <p><strong>1. Họ và tên khai sinh:</strong> <span className="uppercase font-bold text-[16px]">{printingPerson.ho_ten}</span></p>
                <p><strong>2. Tên gọi khác:</strong> {printingPerson.ten_khac || 'Không'}</p>
                <p><strong>3. Ngày, tháng, năm sinh:</strong> {printingPerson.ngay_sinh}</p>
                <p><strong>4. Số định danh cá nhân (CCCD):</strong> {printingPerson.cccd}</p>
                <p><strong>5. Cấp bậc:</strong> <span className="font-bold">{printingPerson.cap_bac}</span></p>
                <p><strong>6. Chức vụ:</strong> {printingPerson.chuc_vu || 'Chiến sĩ'}</p>
                <p><strong>7. Quê quán:</strong> {printingPerson.noi_sinh}</p>
                <p><strong>8. Nơi đăng ký HKTT:</strong> {printingPerson.ho_khau_thu_tru}</p>
              </div>
            </div>

            <div className="print-section">
              <h3 className="section-title">I. THÀNH PHẦN CHÍNH TRỊ - BIÊN CHẾ</h3>
              <div className="details-grid">
                <p><strong>Dân tộc:</strong> {printingPerson.dan_toc}</p>
                <p><strong>Tôn giáo:</strong> {printingPerson.ton_giao}</p>
                <p><strong>Trình độ văn hóa:</strong> {printingPerson.trinh_do_van_hoa}</p>
                <p><strong>Ngày nhập ngũ:</strong> {printingPerson.nhap_ngu_ngay}</p>
                <p><strong>Ngày vào Đoàn:</strong> {printingPerson.ngay_vao_doan || 'Chưa vào Đoàn'}</p>
                <p><strong>Ngày vào Đảng:</strong> {printingPerson.vao_dang_ngay || 'Quần chúng'}</p>
              </div>
            </div>

            <div className="print-section">
              <h3 className="section-title">II. QUAN HỆ GIA ĐÌNH (Bố, mẹ, anh, chị, em ruột)</h3>
              <table className="print-table">
                <thead>
                  <tr>
                    <th style={{width: '15%'}}>Quan hệ</th>
                    <th style={{width: '25%'}}>Họ và tên</th>
                    <th style={{width: '12%'}}>Năm sinh</th>
                    <th>Nghề nghiệp & Nơi ở hiện nay</th>
                  </tr>
                </thead>
                <tbody>
                  {(printingPerson.quan_he_gia_dinh?.cha_me_anh_em || []).length > 0 ? (
                    printingPerson.quan_he_gia_dinh.cha_me_anh_em.map((f, i) => (
                      <tr key={i}>
                        <td className="text-center font-bold">{f.quan_he}</td>
                        <td className="uppercase">{f.ho_ten}</td>
                        <td className="text-center">{f.nam_sinh}</td>
                        <td>{f.nghe_nghiep} - {f.cho_o}</td>
                      </tr>
                    ))
                  ) : (
                    <tr><td colSpan={4} className="text-center italic">Không có dữ liệu khai báo</td></tr>
                  )}
                </tbody>
              </table>
            </div>

            <div className="print-section page-break-avoid">
              <h3 className="section-title">III. RÀ SOÁT AN NINH - TÀI CHÍNH - TỆ NẠN</h3>
              <div className="security-details text-[12px] leading-relaxed">
                <p><strong>1. Tình hình tài chính:</strong> {printingPerson.tai_chinh_suc_khoe?.vay_no?.co_khong ? `Cảnh báo: Có vay nợ số tiền ${printingPerson.tai_chinh_suc_khoe.vay_no.so_tien}đ. Mục đích: ${printingPerson.tai_chinh_suc_khoe.vay_no.muc_dich}.` : 'Tài chính ổn định, không có nợ xấu.'}</p>
                <p><strong>2. Tiền sử vi phạm:</strong> {printingPerson.lich_su_vi_pham?.vi_pham_dia_phuong?.co_khong ? `Có vi phạm: ${printingPerson.lich_su_vi_pham.vi_pham_dia_phuong.noi_dung}.` : 'Chấp hành tốt pháp luật và quy định địa phương.'}</p>
                <p><strong>3. Yếu tố nước ngoài:</strong> {(printingPerson.yeu_to_nuoc_ngoai?.than_nhan?.length || 0) > 0 ? `Có thân nhân định cư tại nước ngoài (${printingPerson.yeu_to_nuoc_ngoai.than_nhan.map(t => t.nuoc).join(', ')}).` : 'Không có yếu tố nước ngoài.'}</p>
                <p><strong>4. Sức khỏe & Tệ nạn:</strong> {printingPerson.lich_su_vi_pham?.ma_tuy?.co_khong ? 'Phát hiện có tiền sử liên quan đến chất gây nghiện.' : 'Sức khỏe tốt, không liên quan tệ nạn.'}</p>
              </div>
            </div>

            <div className="print-signatures">
              <div className="sig-box italic">
                <p className="mb-20 uppercase font-bold text-[11px]">Quân nhân ký tên</p>
                <p className="font-bold uppercase">({printingPerson.ho_ten})</p>
              </div>
              <div className="sig-box">
                <p className="mb-1 italic text-[11px]">Ngày ...... tháng ...... năm 20......</p>
                <p className="font-bold uppercase mb-20">Thủ trưởng đơn vị xác nhận</p>
                <p className="font-bold uppercase text-[10px]">(Ký tên, đóng dấu)</p>
              </div>
            </div>

            <div className="print-footer-mark">
              Hệ thống quản lý quân nhân QN-Manager Pro - Dữ liệu bảo mật tuyệt đối
            </div>
          </div>
        </div>
      )}

      {/* Sidebar (no-print) */}
      <div className="w-72 bg-[#14452F] flex flex-col shadow-2xl shrink-0 z-20 no-print">
        <div className="p-10 text-center border-b border-white/5">
          <div className="w-16 h-16 bg-gradient-to-br from-white/20 to-transparent rounded-2xl flex items-center justify-center mx-auto mb-4 border border-white/20 shadow-lg">
            <ShieldCheck className="text-white w-9 h-9" />
          </div>
          <h1 className="text-white font-black text-sm tracking-tight uppercase leading-tight">QN-Manager Pro</h1>
          <p className="text-[#D4AF37] text-[8px] font-black uppercase mt-2 tracking-[0.3em]">Hệ thống chỉ huy nội bộ</p>
        </div>
        
        <nav className="flex-1 px-6 py-8 space-y-2 overflow-y-auto scrollbar-hide">
          <button onClick={() => setActiveTab('overview')} className={`w-full flex items-center gap-3 px-5 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all ${activeTab === 'overview' ? 'bg-white text-[#14452F] shadow-xl' : 'text-white/50 hover:bg-white/5 hover:text-white'}`}>
            <LayoutDashboard size={18} /> Tổng quan chỉ huy
          </button>
          <button onClick={() => setActiveTab('units')} className={`w-full flex items-center gap-3 px-5 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all ${activeTab === 'units' ? 'bg-white text-[#14452F] shadow-xl' : 'text-white/50 hover:bg-white/5 hover:text-white'}`}>
            <Landmark size={18} /> Cơ cấu đơn vị
          </button>
          <button onClick={() => setActiveTab('settings')} className={`w-full flex items-center gap-3 px-5 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all ${activeTab === 'settings' ? 'bg-white text-[#14452F] shadow-xl' : 'text-white/50 hover:bg-white/5 hover:text-white'}`}>
            <KeyboardIcon size={18} /> Thiết lập hệ thống
          </button>
        </nav>

        <div className="p-8 border-t border-white/5">
          <button onClick={() => setShowGuide(true)} className="w-full py-4 mb-3 bg-white/5 text-white/70 rounded-2xl font-black text-[10px] uppercase hover:bg-white/10 transition-all flex items-center justify-center gap-2">
            <BookOpen size={14} /> Hướng dẫn
          </button>
          <button onClick={onLogout} className="w-full py-4 bg-red-500/10 text-red-400 rounded-2xl font-black text-[10px] uppercase hover:bg-red-500 hover:text-white transition-all flex items-center justify-center gap-2">
            <LogOut size={14} /> Thoát an toàn
          </button>
        </div>
      </div>

      <div className="flex-1 flex flex-col min-h-0 bg-[#F8FAFC] no-print">
        {/* Header (no-print) */}
        <header className="bg-white px-8 lg:px-12 py-5 shrink-0 flex items-center justify-between gap-8 border-b border-slate-100 z-10 shadow-sm no-print">
          <div className="relative flex-1 max-w-4xl">
            <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300" size={20} />
            <input 
              ref={searchInputRef}
              type="text" 
              placeholder="Tìm kiếm nhanh tên, CCCD, đơn vị hoặc số điện thoại..."
              className="w-full pl-16 pr-6 py-4.5 bg-slate-50 border-none rounded-[1.25rem] outline-none focus:ring-4 ring-[#14452F]/5 font-bold text-sm placeholder:text-slate-300 transition-all shadow-inner"
              value={filters.keyword}
              onChange={(e) => setFilters({...filters, keyword: e.target.value})}
            />
          </div>
          
          <div className="flex gap-4">
            <button onClick={handleExportCSV} className="flex items-center gap-2 px-8 py-4.5 bg-white border border-slate-200 text-slate-600 rounded-[1.25rem] font-black uppercase text-[10px] tracking-widest hover:bg-slate-50 hover:text-[#14452F] transition-all shadow-sm transform active:scale-95"><FileDown size={18} /> Xuất CSV</button>
            <button onClick={() => { setEditingPerson(undefined); setIsFormOpen(true); }} className="flex items-center gap-2 px-10 py-4.5 bg-[#14452F] text-white rounded-[1.25rem] font-black uppercase text-[10px] tracking-widest hover:bg-green-800 shadow-xl shadow-green-900/10 transition-all transform active:scale-95"><UserPlus size={18} /> Thêm chiến sĩ</button>
          </div>
        </header>

        {/* Main Content (no-print) */}
        <main className="flex-1 overflow-y-auto scroll-smooth bg-[#F8FAFC] no-print">
          <div className="max-w-screen-2xl mx-auto p-8 lg:p-12 min-h-full flex flex-col">
          
          {activeTab === 'overview' && (
            <div className="space-y-10 animate-fade-in pb-20 flex-1">
              
              {/* Thống kê */}
              {dashboardStats && (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-8">
                  <StatCard title="Tổng quân số" value={dashboardStats.total} icon={Users} color="text-blue-600" bgColor="bg-blue-50" unitLabel="Quân nhân" />
                  <StatCard title="Đảng viên CSVN" value={dashboardStats.party} icon={ShieldCheck} color="text-red-600" bgColor="bg-red-50" unitLabel="Đồng chí" />
                  <StatCard title="Học văn cao (ĐH/CĐ/CH)" value={dashboardStats.educationHigh} icon={GraduationCap} color="text-purple-600" bgColor="bg-purple-50" unitLabel="Nhân sự" />
                  <StatCard title="Đối tượng Vay nợ" value={dashboardStats.debt} icon={AlertTriangle} color="text-amber-600" bgColor="bg-amber-50" unitLabel="Đối tượng" />
                </div>
              )}

              {/* Tools */}
              <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-8 bg-white p-10 rounded-[3rem] border border-slate-100 shadow-sm">
                <div className="space-y-5">
                   <h2 className="text-2xl font-black text-slate-800 uppercase tracking-tighter flex items-center gap-4">
                     <div className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center text-[#14452F] shadow-inner"><FileText size={20} /></div> Quản lý danh sách quân nhân
                   </h2>
                   <div className="flex flex-wrap items-center gap-3">
                      <span className="text-[10px] font-black text-slate-400 uppercase mr-2 tracking-widest">Sắp xếp theo:</span>
                      <button onClick={() => setSortBy('name')} className={`px-6 py-3 rounded-2xl text-[10px] font-black uppercase transition-all ${sortBy === 'name' ? 'bg-[#14452F] text-white shadow-lg' : 'bg-slate-50 text-slate-400 hover:bg-slate-100'}`}>Tên A-Z</button>
                      <button onClick={() => setSortBy('age')} className={`px-6 py-3 rounded-2xl text-[10px] font-black uppercase transition-all ${sortBy === 'age' ? 'bg-[#14452F] text-white shadow-lg' : 'bg-slate-50 text-slate-400 hover:bg-slate-100'}`}>Tuổi tác</button>
                      <button onClick={() => setSortBy('enlistment')} className={`px-6 py-3 rounded-2xl text-[10px] font-black uppercase transition-all ${sortBy === 'enlistment' ? 'bg-[#14452F] text-white shadow-lg' : 'bg-slate-50 text-slate-400 hover:bg-slate-100'}`}>Nhập ngũ</button>
                   </div>
                </div>
                <div className="flex gap-4 w-full lg:w-auto">
                   <button 
                      onClick={() => setShowAdvancedFilter(!showAdvancedFilter)} 
                      className={`flex-1 lg:flex-none px-10 py-5 rounded-[1.5rem] text-[10px] font-black uppercase flex items-center justify-center gap-4 transition-all border-2 ${showAdvancedFilter ? 'bg-[#14452F] text-white border-[#14452F] shadow-xl shadow-green-900/10' : 'bg-white text-[#14452F] border-[#14452F]/10 hover:border-[#14452F]/30 hover:bg-[#14452F]/5'}`}
                   >
                     <Filter size={20}/> {showAdvancedFilter ? 'Ẩn bộ lọc chuyên sâu' : 'Bộ lọc chuyên sâu'}
                   </button>
                </div>
              </div>

              {/* Advanced Filter */}
              {showAdvancedFilter && (
                <div className="bg-white p-10 xl:p-12 rounded-[3.5rem] border-2 border-[#14452F]/10 shadow-2xl animate-slide-down">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10 xl:gap-12">
                    <div className="space-y-4">
                      <label className="flex items-center gap-3 text-[11px] font-black text-slate-400 uppercase tracking-widest"><ShieldCheck size={18} className="text-red-500"/> Trạng thái chính trị</label>
                      <select className="w-full p-5 bg-slate-50 border-none rounded-2xl outline-none font-bold text-xs focus:ring-4 ring-green-100 transition-all" value={filters.political} onChange={e => setFilters({...filters, political: e.target.value as any})}>
                        <option value="all">Tất cả quân nhân</option>
                        <option value="dang_vien">Đảng viên Đảng CSVN</option>
                        <option value="quan_chung">Quần chúng nội bộ</option>
                      </select>
                    </div>
                    <div className="space-y-4">
                      <label className="flex items-center gap-3 text-[11px] font-black text-slate-400 uppercase tracking-widest"><GraduationCap size={18} className="text-blue-600"/> Trình độ học vấn</label>
                      <select className="w-full p-5 bg-slate-50 border-none rounded-2xl outline-none font-bold text-xs focus:ring-4 ring-blue-100 transition-all" value={filters.education} onChange={e => setFilters({...filters, education: e.target.value as any})}>
                        <option value="all">Tất cả trình độ</option>
                        <option value="12_12">Trình độ 12/12</option>
                        <option value="9_12">Trình độ 9/12</option>
                        <option value="dai_hoc">Đại học</option>
                        <option value="cao_dang">Cao đẳng</option>
                        <option value="cao_hoc">Sau Đại học (Thạc sĩ/Tiến sĩ)</option>
                      </select>
                    </div>
                    <div className="space-y-4">
                      <label className="flex items-center gap-3 text-[11px] font-black text-slate-400 uppercase tracking-widest"><Heart size={18} className="text-rose-500"/> Tình trạng hôn nhân</label>
                      <select className="w-full p-5 bg-slate-50 border-none rounded-2xl outline-none font-bold text-xs focus:ring-4 ring-rose-100 transition-all" value={filters.marital} onChange={e => setFilters({...filters, marital: e.target.value as any})}>
                        <option value="all">Tất cả</option>
                        <option value="da_vo">Đã lập gia đình</option>
                        <option value="chua_vo">Độc thân</option>
                      </select>
                    </div>
                    <div className="space-y-4">
                      <label className="flex items-center gap-3 text-[11px] font-black text-slate-400 uppercase tracking-widest"><AlertTriangle size={18} className="text-amber-500"/> Rà soát an ninh</label>
                      <select className="w-full p-5 bg-slate-50 border-none rounded-2xl outline-none font-bold text-xs focus:ring-4 ring-amber-100 transition-all" value={filters.security} onChange={e => setFilters({...filters, security: e.target.value as any})}>
                        <option value="all">Không áp dụng</option>
                        <option value="vay_no">Đối tượng vay nợ</option>
                        <option value="vi_pham">Đối tượng vi phạm</option>
                        <option value="nuoc_ngoai">Có yếu tố nước ngoài</option>
                        <option value="than_nhan_vi_pham">Người thân vi phạm PL</option>
                      </select>
                    </div>
                  </div>
                </div>
              )}

              {/* Danh sách quân nhân */}
              <div className="flex flex-col gap-5">
                {paginatedPersonnel.map((p, i) => (
                    <div key={p.id} className="bg-white p-6 xl:p-8 rounded-[3rem] border border-slate-100 shadow-sm flex items-center gap-8 group hover:border-[#14452F]/30 hover:shadow-xl transition-all animate-fade-in" style={{ animationDelay: `${i * 20}ms` }}>
                      <div className="w-20 h-20 xl:w-24 xl:h-24 bg-slate-50 rounded-3xl flex items-center justify-center font-black text-[#14452F] text-2xl xl:text-3xl border border-slate-100 overflow-hidden shrink-0 shadow-inner group-hover:scale-105 transition-transform duration-500 ring-4 ring-transparent group-hover:ring-[#14452F]/5">
                          {p.anh_dai_dien ? <img src={p.anh_dai_dien} className="w-full h-full object-cover" /> : p.ho_ten.charAt(0)}
                      </div>
                      
                      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-6 xl:gap-8 items-center">
                          <div className="lg:col-span-4 min-w-0">
                            <p className="text-[17px] xl:text-[19px] font-black text-slate-800 uppercase leading-tight group-hover:text-[#14452F] transition-colors mb-2 truncate tracking-tight">{p.ho_ten}</p>
                            <div className="flex items-center gap-4">
                               <span className="text-[11px] text-slate-400 font-bold tracking-widest uppercase flex items-center gap-2 shrink-0"><FileText size={14}/> {p.cccd}</span>
                               <span className="text-[11px] text-slate-300 font-bold uppercase border-l border-slate-200 pl-4 shrink-0">NS: {p.ngay_sinh}</span>
                            </div>
                          </div>
                          
                          <div className="lg:col-span-3">
                            <p className="text-[12px] font-black text-slate-700 uppercase tracking-tight">{p.cap_bac}</p>
                            <p className="text-[11px] font-bold text-slate-400 uppercase truncate mt-1.5 opacity-80">{p.chuc_vu || 'Chiến sĩ'}</p>
                          </div>

                          <div className="lg:col-span-5 flex flex-wrap items-center gap-3">
                            <span className="px-4 py-2 bg-green-50 text-green-700 rounded-full text-[10px] font-black uppercase border border-green-100 flex items-center gap-2 shadow-sm"><MapPin size={12}/> {p.don_vi}</span>
                            {p.vao_dang_ngay && <span className="px-4 py-2 bg-red-50 text-red-600 rounded-full text-[10px] font-black uppercase border border-red-100 flex items-center gap-2 shadow-sm"><ShieldCheck size={12}/> Đảng viên</span>}
                          </div>
                      </div>

                      <div className="flex gap-3 shrink-0">
                          <button onClick={() => setViewingPerson(p)} className="w-14 h-14 flex items-center justify-center text-slate-300 hover:text-[#14452F] hover:bg-[#14452F]/5 rounded-2xl transition-all shadow-sm bg-white border border-slate-50" title="Xem hồ sơ"><Eye size={22} /></button>
                          <button onClick={() => handlePrint(p)} className="w-14 h-14 flex items-center justify-center text-slate-300 hover:text-green-600 hover:bg-green-600/5 rounded-2xl transition-all shadow-sm bg-white border border-slate-50" title="In hồ sơ PDF"><Printer size={22} /></button>
                          <button onClick={() => { setEditingPerson(p); setIsFormOpen(true); }} className="w-14 h-14 flex items-center justify-center text-slate-300 hover:text-blue-600 hover:bg-blue-600/5 rounded-2xl transition-all shadow-sm bg-white border border-slate-50" title="Sửa"><Edit3 size={22} /></button>
                          <button onClick={async () => { if(confirm('Xác nhận xóa hồ sơ quân nhân này?')) { await db.deletePersonnel(p.id); loadData(); } }} className="w-14 h-14 flex items-center justify-center text-slate-300 hover:text-red-500 hover:bg-red-500/5 rounded-2xl transition-all shadow-sm bg-white border border-slate-50" title="Xóa"><Trash2 size={22} /></button>
                      </div>
                    </div>
                ))}
              </div>

              {/* Phân trang */}
              {totalPages > 1 && (
                <div className="flex justify-center items-center gap-3 pt-12 pb-6 animate-fade-in no-print">
                  <button 
                    disabled={currentPage === 1}
                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                    className="w-12 h-12 flex items-center justify-center bg-white border border-slate-200 rounded-2xl text-slate-400 hover:text-[#14452F] disabled:opacity-30 disabled:hover:bg-transparent transition-all shadow-sm"
                  >
                    <ChevronLeft size={24} />
                  </button>
                  <div className="flex items-center gap-2 px-6 py-3 bg-white border border-slate-100 rounded-2xl shadow-sm">
                    {Array.from({ length: totalPages }).map((_, i) => (
                        <button 
                          key={i+1}
                          onClick={() => setCurrentPage(i+1)}
                          className={`w-10 h-10 flex items-center justify-center rounded-xl text-[11px] font-black uppercase transition-all ${currentPage === i+1 ? 'bg-[#14452F] text-white shadow-lg' : 'text-slate-400 hover:bg-slate-50 hover:text-slate-800'}`}
                        >
                          {i+1}
                        </button>
                    ))}
                  </div>
                  <button 
                    disabled={currentPage === totalPages}
                    onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                    className="w-12 h-12 flex items-center justify-center bg-white border border-slate-200 rounded-2xl text-slate-400 hover:text-[#14452F] disabled:opacity-30 disabled:hover:bg-transparent transition-all shadow-sm"
                  >
                    <ChevronRight size={24} />
                  </button>
                </div>
              )}
            </div>
          )}

          {activeTab === 'units' && <UnitTree units={units} onRefresh={loadData} onViewDetailedList={(id) => { setFilters({...filters, unitId: id}); setActiveTab('overview'); }} />}
          {activeTab === 'settings' && <Settings />}

          </div>
        </main>
      </div>

      {/* Modals */}
      {isFormOpen && (
        <div className="fixed inset-0 z-[500] flex items-center justify-center p-6 lg:p-12 bg-slate-900/60 backdrop-blur-sm overflow-y-auto no-print">
          <PersonnelForm units={units} initialData={editingPerson} onClose={() => { setIsFormOpen(false); loadData(); }} />
        </div>
      )}

      {/* Personnel Quick View Modal */}
      {viewingPerson && (
        <div className="fixed inset-0 z-[600] bg-slate-900/95 backdrop-blur-xl flex items-center justify-center p-8 lg:p-12 animate-fade-in overflow-y-auto no-print">
           <div className="bg-white w-full max-w-screen-xl rounded-[4rem] shadow-2xl flex flex-col overflow-hidden relative border border-white/20">
              <button onClick={() => setViewingPerson(undefined)} className="absolute top-10 right-10 w-14 h-14 bg-white border border-slate-100 rounded-full flex items-center justify-center hover:bg-red-500 hover:text-white transition-all z-10 shadow-xl transform active:scale-90"><X size={24} /></button>
              
              <div className="p-12 lg:p-20 overflow-y-auto max-h-[95vh] scrollbar-hide">
                 <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 xl:gap-20">
                    <div className="lg:col-span-4 space-y-10">
                       <div className="aspect-[3/4] bg-slate-100 rounded-[3.5rem] border-[10px] border-white shadow-2xl overflow-hidden flex items-center justify-center group relative ring-1 ring-slate-100">
                          {viewingPerson.anh_dai_dien ? <img src={viewingPerson.anh_dai_dien} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" /> : <div className="text-slate-200 font-black text-7xl">{viewingPerson.ho_ten.charAt(0)}</div>}
                       </div>
                       
                       <div className="p-12 bg-[#14452F] text-white rounded-[3.5rem] shadow-2xl relative overflow-hidden ring-4 ring-green-900/20">
                          <p className="text-[10px] font-black text-green-400 uppercase tracking-[0.4em] mb-5">Thông tin quân hàm</p>
                          <h3 className="text-3xl font-black uppercase tracking-tight leading-none mb-4">{viewingPerson.cap_bac}</h3>
                          <p className="text-sm font-bold opacity-80 uppercase mb-10 tracking-widest">{viewingPerson.chuc_vu || 'Học viên / Chiến sĩ'}</p>
                       </div>
                    </div>
                    
                    <div className="lg:col-span-8 space-y-12 xl:space-y-16">
                       <div>
                          <h2 className="text-5xl lg:text-6xl font-black text-slate-800 uppercase tracking-tighter leading-none mb-10">{viewingPerson.ho_ten}</h2>
                          <div className="flex flex-wrap gap-5">
                             <div className="px-6 py-4 bg-slate-50 rounded-2xl text-[12px] font-black text-slate-500 uppercase tracking-widest border border-slate-100 flex items-center gap-3 shadow-sm"><FileText size={18} className="text-[#14452F]"/> {viewingPerson.cccd}</div>
                             <div className="px-6 py-4 bg-slate-50 rounded-2xl text-[12px] font-black text-slate-500 uppercase tracking-widest border border-slate-100 flex items-center gap-3 shadow-sm"><Calendar size={18} className="text-[#14452F]"/> NS: {viewingPerson.ngay_sinh}</div>
                          </div>
                       </div>
                       <div className="flex flex-col sm:flex-row gap-6 pt-12">
                          <button onClick={() => handlePrint(viewingPerson)} className="flex-1 py-7 bg-green-700 text-white rounded-[2.5rem] font-black uppercase text-[11px] tracking-[0.3em] shadow-2xl hover:bg-green-800 transition-all flex items-center justify-center gap-4"><Printer size={24}/> In hồ sơ bản cứng (A4)</button>
                          <button onClick={() => setViewingPerson(undefined)} className="px-20 py-7 bg-slate-100 text-slate-500 rounded-[2.5rem] font-black uppercase text-[11px] tracking-widest hover:bg-slate-200 transition-all border border-slate-200 shadow-sm">Đóng cửa sổ</button>
                       </div>
                    </div>
                 </div>
              </div>
           </div>
        </div>
      )}
      
      <style>{`
        /* THIẾT LẬP CHO PRINT */
        @media print {
          /* Ẩn các thành phần không cần thiết */
          .no-print { display: none !important; }
          
          /* Hiển thị vùng in */
          .print-area-wrapper { 
            display: block !important; 
            position: absolute !important; 
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            background: white !important;
            z-index: 9999 !important;
          }

          /* Tối ưu layout in */
          body, #root, .h-screen { 
            height: auto !important; 
            overflow: visible !important; 
            display: block !important;
            background: white !important;
          }

          @page { 
            size: A4; 
            margin: 15mm; 
          }

          /* Bảo tồn màu sắc và đường kẻ */
          * {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
        }

        /* Styles cho Template In A4 */
        .print-area-wrapper { display: none; font-family: 'Times New Roman', serif; color: black; background: white; }
        .a4-page { width: 210mm; margin: 0 auto; background: white; padding: 10mm; }
        
        .print-header { display: flex; justify-content: space-between; margin-bottom: 20px; }
        .unit-label { text-align: center; width: 40%; }
        .national-label { text-align: center; width: 60%; }
        .line-sm { border-bottom: 1px solid black; width: 50px; margin: 4px auto; }
        .line-lg { border-bottom: 1px solid black; width: 150px; margin: 4px auto; }
        
        .main-title { text-align: center; font-size: 22px; font-weight: bold; margin: 25px 0 5px 0; }
        .sub-title-italic { text-align: center; font-style: italic; font-size: 11px; margin-bottom: 30px; }
        
        .info-grid-container { display: flex; gap: 30px; margin-bottom: 25px; }
        .photo-box { width: 3cm; height: 4cm; border: 1px solid black; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
        .photo-box img { width: 100%; height: 100%; object-fit: cover; }
        .photo-box .placeholder { font-size: 9px; font-weight: bold; color: #999; }
        
        .primary-info { flex: 1; display: flex; flex-direction: column; gap: 4px; font-size: 13px; }
        .primary-info p { border-bottom: 1px dotted #ccc; padding-bottom: 2px; }
        
        .section-title { font-size: 13px; font-weight: bold; background: #f2f2f2; padding: 4px 10px; border: 1px solid black; margin: 20px 0 10px 0; border-radius: 2px; }
        .details-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 6px; padding: 0 10px; font-size: 12px; }
        
        .print-table { width: 100%; border-collapse: collapse; margin-top: 5px; font-size: 11px; }
        .print-table th, .print-table td { border: 1px solid black; padding: 6px; }
        .print-table th { background: #f9f9f9; font-weight: bold; text-transform: uppercase; }
        
        .print-signatures { display: flex; justify-content: space-between; margin-top: 40px; padding: 0 40px; }
        .sig-box { width: 45%; text-align: center; }
        
        .print-footer-mark { margin-top: 60px; text-align: center; font-size: 8px; color: #ccc; text-transform: uppercase; letter-spacing: 1px; }
        
        .page-break-avoid { page-break-inside: avoid; }

        /* Animation */
        @keyframes slide-down {
          from { opacity: 0; transform: translateY(-30px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-slide-down {
          animation: slide-down 0.5s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
        .animate-fade-in {
          animation: fade-in 0.4s ease-out forwards;
        }
        @keyframes fade-in {
          from { opacity: 0; }
          to { opacity: 1; }
        }
      `}</style>
    </div>
  );
};

export default Dashboard;
