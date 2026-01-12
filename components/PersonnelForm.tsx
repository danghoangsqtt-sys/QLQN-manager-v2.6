import React, { useState, useEffect, useRef } from 'react';
import { MilitaryPersonnel, Unit } from '../types';
import { db } from '../store';
import { 
  Trash2, Plus, Camera, X, Calendar as CalendarIcon, 
  AlertTriangle, CheckCircle, Info, ShieldAlert, 
  Save, User, Users, Heart, Globe, 
  FileText, Plane, DollarSign, Activity, BookOpen, 
  Facebook, MessageCircle, Share2, Phone, Home, Gavel,
  Ruler, Scale, Stethoscope, Briefcase, Clock, GraduationCap, Award, Calendar
} from 'lucide-react';
import { createThumbnail } from '../utils/imageHelper';

interface PersonnelFormProps {
  units: Unit[];
  onClose: () => void;
  initialData?: MilitaryPersonnel;
  isViewMode?: boolean; 
}

// --- DỮ LIỆU MẶC ĐỊNH ---
const DEFAULT_DATA: Partial<MilitaryPersonnel> = {
  ho_ten: '', ten_khac: '', ngay_sinh: '', cccd: '', sdt_rieng: '',
  cap_bac: 'Binh nhì', chuc_vu: '', don_vi_id: '',
  nhap_ngu_ngay: '', ngay_vao_doan: '', vao_dang_ngay: '',
  ho_khau_thu_tru: '', noi_sinh: '', dan_toc: 'Kinh', ton_giao: 'Không',
  
  // @ts-ignore
  que_quan: '', 
  trinh_do_van_hoa: '12/12', 
  da_tot_nghiep: true, 
  nang_khieu_so_truong: '',
  
  anh_dai_dien: '', anh_thumb: '',
  nghi_phep_thuc_te: 0,
  nghi_phep_tham_chieu: 12, // Mặc định 12 ngày phép/năm
  
  tieu_su_ban_than: [{ time: '', job: '', place: '' }],
  mang_xa_hoi: { facebook: [], zalo: [], tiktok: [] },
  
  hoan_canh_song: { song_chung_voi: 'Bố mẹ đẻ', chi_tiet_nguoi_nuoi_duong: null, ly_do_khong_song_cung_bo_me: '' },
  quan_he_gia_dinh: { 
      cha_me_anh_em: [], 
      vo: { ho_ten: '', nam_sinh: '', sdt: '', nghe_nghiep: '', noi_o: '' }, 
      con: [], 
      nguoi_yeu: [] 
  },
  thong_tin_gia_dinh_chung: { 
      muc_song: 'Đủ ăn', 
      nghe_nghiep_chinh: 'Làm nông', 
      lich_su_vi_pham_nguoi_than: { co_khong: false, chi_tiet: '' }, 
      lich_su_covid_gia_dinh: 'Không' 
  },
  
  yeu_to_nuoc_ngoai: { 
      than_nhan: [], 
      di_nuoc_ngoai: [], 
      ho_chieu: { da_co: false, du_dinh_nuoc: '' }, 
      xuat_canh_dinh_cu: { dang_lam_thu_tuc: false, nuoc: '', nguoi_bao_lanh: '' } 
  },
  vi_pham_nuoc_ngoai: '',

  lich_su_vi_pham: { 
    vi_pham_dia_phuong: { co_khong: false, noi_dung: '', ket_qua: '' },
    danh_bac: { co_khong: false, hinh_thuc: '', dia_diem: '', doi_tuong: '' },
    ma_tuy: { co_khong: false, thoi_gian: '', loai: '', so_lan: '', doi_tuong: '', xu_ly: '', hinh_thuc_xu_ly: '' },
    // @ts-ignore
    ky_luat_quan_doi: [], 
    // @ts-ignore
    vi_pham_phap_luat: [] 
  },
  
  tai_chinh_suc_khoe: { 
    vay_no: { co_khong: false, ai_vay: '', nguoi_dung_ten: '', so_tien: '', muc_dich: '', hinh_thuc: '', han_tra: '', gia_dinh_biet: false, nguoi_tra: '' },
    // @ts-ignore
    kinh_doanh: { 
        co_khong: false, 
        hinh_thuc: '', loai_hinh: '', von: '', dia_diem: '', doi_tac: '', sdt_doi_tac: '' 
    },
    covid_ban_than: { da_mac: false, thoi_gian: '' },
    // @ts-ignore
    suc_khoe: { chieu_cao: '', can_nang: '', phan_loai: 'Loại 1', benh_ly: '' }
  },
  
  custom_data: {
    nguoi_bao_tin_khancap: '', 
    tinh_trang_hon_nhan: 'doc_than', 
    co_nguoi_yeu: false,
    trinh_do_chuyen_mon: 'Đại học'
  },
  y_kien_nguyen_vong: ''
};

// --- HELPER FUNCTIONS ---
const toDisplayDate = (isoDate: string | undefined) => {
  if (!isoDate) return '';
  const [y, m, d] = isoDate.split('-');
  return (y && m && d) ? `${d}/${m}/${y}` : isoDate;
};

const toIsoDate = (displayDate: string) => {
  if (!displayDate) return '';
  const parts = displayDate.split('/');
  if (parts.length !== 3) return '';
  const [d, m, y] = parts;
  return `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
};

// --- COMPONENTS CON ---
const VietnamDateInput: React.FC<{
  value: string | undefined;
  onChange: (newIsoDate: string) => void;
  disabled?: boolean;
  className?: string;
  label?: string;
  required?: boolean;
}> = ({ value, onChange, disabled, className, label, required }) => {
  const [displayValue, setDisplayValue] = useState(toDisplayDate(value));
  const hiddenDateInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { setDisplayValue(toDisplayDate(value)); }, [value]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let val = e.target.value.replace(/[^0-9/]/g, '');
    if (val.length === 2 && !val.includes('/')) val += '/';
    if (val.length === 5 && val.split('/').length === 2) val += '/';
    setDisplayValue(val);
    if (val.length === 10) {
      const iso = toIsoDate(val);
      if (iso) onChange(iso);
    } else if (val === '') onChange('');
  };

  return (
    <div className="w-full">
      {label && <label className="block text-[10px] font-bold text-gray-600 mb-1 uppercase tracking-wide">{label} {required && <span className="text-red-500">*</span>}</label>}
      <div className="relative">
        <input
          type="text"
          disabled={disabled}
          className={`${className} pr-8 font-medium`}
          placeholder="dd/mm/yyyy"
          maxLength={10}
          value={displayValue}
          onChange={handleInputChange}
          onBlur={() => { if (!toIsoDate(displayValue) && displayValue) setDisplayValue(toDisplayDate(value)); }}
        />
        <div 
          onClick={() => {
            if (!disabled && hiddenDateInputRef.current) {
              if (typeof hiddenDateInputRef.current.showPicker === 'function') {
                hiddenDateInputRef.current.showPicker();
              } else {
                hiddenDateInputRef.current.focus(); 
              }
            }
          }} 
          className={`absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-green-600 cursor-pointer ${disabled ? 'hidden' : ''}`}
        >
          <CalendarIcon size={16} />
        </div>
        <input ref={hiddenDateInputRef} type="date" className="absolute inset-0 opacity-0 pointer-events-none w-0 h-0" value={value || ''} onChange={(e) => { onChange(e.target.value); setDisplayValue(toDisplayDate(e.target.value)); }} tabIndex={-1} />
      </div>
    </div>
  );
};

// --- TOAST NOTIFICATION ---
type ToastType = 'success' | 'error' | 'warning' | 'info';
interface ToastMessage { id: number; type: ToastType; title: string; message: string; }

const MilitaryToast: React.FC<{ toasts: ToastMessage[]; removeToast: (id: number) => void }> = ({ toasts, removeToast }) => (
  <div className="absolute top-4 right-4 z-[2000] flex flex-col gap-3 w-80 pointer-events-none">
    {toasts.map((toast) => (
      <div key={toast.id} className={`pointer-events-auto relative overflow-hidden bg-white border-l-4 shadow-xl rounded-r-md transform transition-all duration-300 animate-slide-in ${toast.type === 'error' ? 'border-red-600' : toast.type === 'success' ? 'border-green-600' : 'border-blue-500'}`}>
        <div className="p-4 flex gap-3">
          <div className={`${toast.type === 'error' ? 'text-red-600' : toast.type === 'success' ? 'text-green-600' : 'text-blue-600'}`}>
             {toast.type === 'success' && <CheckCircle size={24} />}
             {toast.type === 'error' && <AlertTriangle size={24} />}
             {toast.type === 'info' && <Info size={24} />}
             {toast.type === 'warning' && <ShieldAlert size={24} />}
          </div>
          <div className="flex-1">
            <h4 className="text-sm font-black uppercase text-gray-800">{toast.title}</h4>
            <p className="text-xs text-gray-600 mt-1">{toast.message}</p>
          </div>
          <button onClick={() => removeToast(toast.id)} className="text-gray-400 hover:text-black self-start"><X size={16} /></button>
        </div>
      </div>
    ))}
  </div>
);

// --- MAIN COMPONENT: PERSONNEL FORM ---
const PersonnelForm: React.FC<PersonnelFormProps> = ({ units, onClose, initialData, isViewMode = false }) => {
  const [activeTab, setActiveTab] = useState(1);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // --- KHỞI TẠO STATE AN TOÀN ---
  // --- KHỞI TẠO STATE AN TOÀN ---
  const [formData, setFormData] = useState<Partial<MilitaryPersonnel>>(() => {
    // 1. Luôn bắt đầu từ bản sao chuẩn của dữ liệu mặc định
    // JSON.parse(JSON.stringify) giúp deep clone, ngắt tham chiếu
    const finalData = JSON.parse(JSON.stringify(DEFAULT_DATA));

    // Nếu không có dữ liệu đầu vào (chế độ thêm mới), trả về mặc định ngay
    if (!initialData) return finalData;

    try {
      // 2. Merge cấp 1: Ghi đè các trường cơ bản (ho_ten, cccd,...)
      // Lưu ý: Việc này sẽ ghi đè cả các object con bằng tham chiếu của initialData
      // nên ta cần bước 3 để khôi phục cấu trúc mặc định cho các object con.
      const mergedBase = { ...finalData, ...initialData };

      // 3. Hàm helper để merge object con an toàn (giữ lại default keys)
      // Giúp tránh lỗi mất field nếu initialData trả về object thiếu field
      const safeMergeSection = (sectionKey: keyof MilitaryPersonnel) => {
        if (initialData[sectionKey] && typeof initialData[sectionKey] === 'object') {
          mergedBase[sectionKey] = {
            ...DEFAULT_DATA[sectionKey],      // Lấy gốc mặc định
            ...(mergedBase[sectionKey] || {}) // Ghi đè bằng dữ liệu mới
          };
        }
      };

      // Áp dụng merge an toàn cho các nhóm dữ liệu lớn
      safeMergeSection('quan_he_gia_dinh');
      safeMergeSection('thong_tin_gia_dinh_chung');
      safeMergeSection('tai_chinh_suc_khoe');
      safeMergeSection('lich_su_vi_pham');
      safeMergeSection('yeu_to_nuoc_ngoai');
      safeMergeSection('mang_xa_hoi');
      safeMergeSection('custom_data');

      // 4. Xử lý chuyên sâu cho các Object lồng nhau cấp 3 (Nested Level 3)
      // Vấn đề: "vo", "kinh_doanh" thường bị null đè lên object rỗng mặc định
      
      // -> Xử lý Vợ
      if (mergedBase.quan_he_gia_dinh) {
        mergedBase.quan_he_gia_dinh.vo = {
          // @ts-ignore: DEFAULT_DATA.quan_he_gia_dinh.vo đảm bảo có cấu trúc
          ...DEFAULT_DATA.quan_he_gia_dinh?.vo, 
          ...(initialData.quan_he_gia_dinh?.vo || {}) 
        };
      }

      // -> Xử lý Vi phạm người thân
      if (mergedBase.thong_tin_gia_dinh_chung) {
        mergedBase.thong_tin_gia_dinh_chung.lich_su_vi_pham_nguoi_than = {
           // @ts-ignore
           ...DEFAULT_DATA.thong_tin_gia_dinh_chung?.lich_su_vi_pham_nguoi_than,
           ...(initialData.thong_tin_gia_dinh_chung?.lich_su_vi_pham_nguoi_than || {})
        };
      }

      // -> Xử lý Kinh doanh & Sức khỏe
      if (mergedBase.tai_chinh_suc_khoe) {
        mergedBase.tai_chinh_suc_khoe.kinh_doanh = {
            // @ts-ignore
            ...DEFAULT_DATA.tai_chinh_suc_khoe?.kinh_doanh,
            ...(initialData.tai_chinh_suc_khoe?.kinh_doanh || {})
        };
        mergedBase.tai_chinh_suc_khoe.suc_khoe = {
            // @ts-ignore
            ...DEFAULT_DATA.tai_chinh_suc_khoe?.suc_khoe,
            ...(initialData.tai_chinh_suc_khoe?.suc_khoe || {})
        };
      }

      // 5. Đảm bảo Mảng (Array) không bao giờ là null/undefined
      // Nếu null, gán về mảng rỗng []
      if (!mergedBase.tieu_su_ban_than) mergedBase.tieu_su_ban_than = [];
      
      // Mạng xã hội
      if (!mergedBase.mang_xa_hoi) mergedBase.mang_xa_hoi = { facebook: [], zalo: [], tiktok: [] };
      if (!mergedBase.mang_xa_hoi.facebook) mergedBase.mang_xa_hoi.facebook = [];
      if (!mergedBase.mang_xa_hoi.zalo) mergedBase.mang_xa_hoi.zalo = [];
      if (!mergedBase.mang_xa_hoi.tiktok) mergedBase.mang_xa_hoi.tiktok = [];

      // Quan hệ & Nước ngoài
      if (!mergedBase.yeu_to_nuoc_ngoai.than_nhan) mergedBase.yeu_to_nuoc_ngoai.than_nhan = [];
      if (!mergedBase.yeu_to_nuoc_ngoai.di_nuoc_ngoai) mergedBase.yeu_to_nuoc_ngoai.di_nuoc_ngoai = [];
      if (!mergedBase.quan_he_gia_dinh.cha_me_anh_em) mergedBase.quan_he_gia_dinh.cha_me_anh_em = [];
      if (!mergedBase.quan_he_gia_dinh.con) mergedBase.quan_he_gia_dinh.con = [];
      if (!mergedBase.quan_he_gia_dinh.nguoi_yeu) mergedBase.quan_he_gia_dinh.nguoi_yeu = [];

      // Vi phạm
      if (!mergedBase.lich_su_vi_pham.ky_luat_quan_doi) mergedBase.lich_su_vi_pham.ky_luat_quan_doi = [];
      if (!mergedBase.lich_su_vi_pham.vi_pham_phap_luat) mergedBase.lich_su_vi_pham.vi_pham_phap_luat = [];

      // 6. Logic tính toán dữ liệu Custom (Derived State)
      // Tự động suy luận tình trạng hôn nhân nếu chưa có
      if (!mergedBase.custom_data?.tinh_trang_hon_nhan) {
          // @ts-ignore
          const hasWife = !!(mergedBase.quan_he_gia_dinh?.vo?.ho_ten);
          mergedBase.custom_data = { 
            ...mergedBase.custom_data, 
            tinh_trang_hon_nhan: hasWife ? 'ket_hon' : 'doc_than' 
          };
      }
      
      // Tự động suy luận tình trạng người yêu
      if (mergedBase.custom_data?.co_nguoi_yeu === undefined) {
          const hasLover = (mergedBase.quan_he_gia_dinh?.nguoi_yeu?.length || 0) > 0;
          mergedBase.custom_data = { 
            ...mergedBase.custom_data, 
            co_nguoi_yeu: hasLover 
          };
      }

      return mergedBase;
    } catch (e) {
      console.error("Lỗi khởi tạo Form:", e);
      // Fallback an toàn tuyệt đối
      return JSON.parse(JSON.stringify(DEFAULT_DATA));
    }
  });

  const showToast = (type: ToastType, title: string, message: string) => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, type, title, message }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 4000);
  };

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (isViewMode) return;
    const file = event.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        showToast('error', 'LỖI', 'Ảnh quá lớn (>5MB).');
        return;
      }
      const reader = new FileReader();
      reader.onload = async (e) => {
        const base64 = e.target?.result as string;
        try {
            showToast('info', 'XỬ LÝ', 'Đang tạo ảnh thu nhỏ...');
            const thumb = await createThumbnail(base64, 200);
            const optimizedMain = await createThumbnail(base64, 800);
            setFormData(prev => ({ ...prev, anh_dai_dien: base64, anh_thumb: thumb }));
            showToast('success', 'XONG', 'Đã cập nhật ảnh.');
        } catch {
            setFormData(prev => ({ ...prev, anh_dai_dien: optimizedMain, anh_thumb: thumb  }));
        }
      };
      reader.readAsDataURL(file);
    }
  };

const updateNested = (path: string, value: any) => {
  if (isViewMode) return;
  
  setFormData(prev => {
    // Deep clone an toàn bằng JSON (hoặc dùng thư viện lodash/cloneDeep nếu có)
    const newState = JSON.parse(JSON.stringify(prev));
    const keys = path.split('.');
    
    let current: any = newState;
    for (let i = 0; i < keys.length - 1; i++) {
        const key = keys[i];
        
        // Nếu key không tồn tại hoặc null, khởi tạo object mới để tránh crash
        if (!current[key]) {
            // Kiểm tra xem key tiếp theo là số (index mảng) hay chữ (key object)
            const nextKey = keys[i + 1];
            if (!isNaN(Number(nextKey))) {
                current[key] = [];
            } else {
                current[key] = {};
            }
        }
        current = current[key];
    }
    
    // Gán giá trị cuối cùng
    current[keys[keys.length - 1]] = value;
    
    return newState;
  });
};

  const addRow = (path: string, item: any) => {
    if(isViewMode) return;
    setFormData(prev => {
        const updated = JSON.parse(JSON.stringify(prev));
        const keys = path.split('.');
        let current: any = updated;
        for (const k of keys) current = current[k];
        if (Array.isArray(current)) current.push(item);
        else current = [item]; 
        return updated;
    });
  };

  const removeRow = (path: string, idx: number) => {
    if(isViewMode) return;
    setFormData(prev => {
        const updated = JSON.parse(JSON.stringify(prev));
        const keys = path.split('.');
        let current: any = updated;
        for (const k of keys) current = current[k];
        if (Array.isArray(current)) current.splice(idx, 1);
        return updated;
    });
  };

  const updateRow = (path: string, idx: number, field: string, value: any) => {
    if(isViewMode) return;
    setFormData(prev => {
        const updated = JSON.parse(JSON.stringify(prev));
        const keys = path.split('.');
        let current: any = updated;
        for (const k of keys) current = current[k];
        if (Array.isArray(current) && current[idx]) {
            current[idx][field] = value;
        }
        return updated;
    });
  };

  const handleSave = async () => {
    if (!formData.ho_ten || !formData.cccd || !formData.don_vi_id || !formData.ngay_sinh) {
        showToast('error', 'THIẾU THÔNG TIN', 'Họ tên, Ngày sinh, CCCD và Đơn vị là bắt buộc.');
        setActiveTab(1);
        return;
    }
    
    try {
        const unitName = units.find(u => u.id === formData.don_vi_id)?.name || '';
        const finalData = { ...formData, don_vi: unitName };
        
        if (initialData?.id) {
            await db.updatePersonnel(initialData.id, finalData);
            showToast('success', 'THÀNH CÔNG', 'Đã cập nhật hồ sơ.');
        } else {
            await db.addPersonnel({ ...finalData as MilitaryPersonnel, id: Date.now().toString() });
            showToast('success', 'THÀNH CÔNG', 'Đã thêm mới hồ sơ.');
        }
        setTimeout(onClose, 1000);
    } catch (e) {
        showToast('error', 'LỖI DB', 'Không lưu được: ' + e);
    }
  };

  const inputBase = "w-full p-2.5 border rounded-lg text-sm outline-none transition-all focus:border-green-600 focus:ring-1 focus:ring-green-600 disabled:bg-gray-100 disabled:text-gray-600 font-medium text-gray-700 bg-white shadow-sm";
  const labelBase = "block text-[11px] font-extrabold text-gray-500 mb-1.5 uppercase tracking-wider";
  const sectionTitle = "flex items-center gap-2 text-[#14452F] font-black uppercase text-sm mb-4 pb-2 border-b-2 border-green-50 mt-6";
  const tableHeader = "bg-gray-100 text-gray-600 font-bold uppercase text-[11px] p-3 text-left border-b border-gray-200";
  const tableCell = "p-2 border-b border-gray-100 align-middle";

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[1000] flex items-center justify-center p-4">
      <div className="bg-[#f8f9fa] w-full max-w-[95rem] max-h-[95vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-fade-in relative">
        <MilitaryToast toasts={toasts} removeToast={(id) => setToasts(t => t.filter(x => x.id !== id))} />

        {/* HEADER */}
        <div className="bg-[#14452F] text-white p-5 flex justify-between items-center shrink-0 shadow-md z-10">
            <div className="flex items-center gap-4">
                <div className="bg-white/10 p-2.5 rounded-xl border border-white/20"><User className="text-yellow-400" size={24}/></div>
                <div>
                    <h2 className="font-black text-xl uppercase tracking-widest">{isViewMode ? 'Xem Hồ Sơ Quân Nhân' : initialData ? 'Chỉnh Sửa Hồ Sơ' : 'Thêm Mới Quân Nhân'}</h2>
                    <p className="text-xs text-gray-300 font-mono mt-1 opacity-80">MÃ SỐ: {initialData?.id || 'AUTO-GENERATE'} • TRẠNG THÁI: {isViewMode ? 'CHỈ ĐỌC' : 'ĐANG NHẬP LIỆU'}</p>
                </div>
            </div>
            <button onClick={onClose} className="bg-white/10 hover:bg-white/20 p-2.5 rounded-full transition-colors text-white/80 hover:text-white"><X size={24}/></button>
        </div>

        {/* NAVIGATION TABS */}
        <div className="bg-white border-b flex overflow-x-auto px-6 gap-1 shrink-0 shadow-sm scrollbar-hide z-10">
             {[
                {id: 1, label: 'Thông tin chung', icon: User},
                {id: 2, label: 'Tiểu sử & MXH', icon: Clock},
                {id: 3, label: 'Gia đình & QH', icon: Users},
                {id: 4, label: 'Nước ngoài', icon: Plane},
                {id: 5, label: 'An ninh & Vi phạm', icon: ShieldAlert, danger: true},
                {id: 6, label: 'Tài chính & SK', icon: DollarSign, danger: true},
                {id: 7, label: 'Cam kết', icon: FileText}
             ].map(t => (
                 <button key={t.id} onClick={() => setActiveTab(t.id)} className={`flex items-center gap-2 px-6 py-4 text-xs font-bold uppercase transition-all border-b-4 whitespace-nowrap ${activeTab === t.id ? 'border-[#14452F] text-[#14452F] bg-green-50' : 'border-transparent text-gray-500 hover:bg-gray-50 hover:text-gray-700'} ${t.danger && activeTab !== t.id ? 'text-red-500 hover:text-red-700' : ''}`}>
                    <t.icon size={16} className={t.danger ? 'text-red-500' : activeTab === t.id ? 'text-[#14452F]' : 'text-gray-400'} /> {t.label}
                 </button>
             ))}
        </div>

        {/* BODY */}
        <div className="flex-1 overflow-y-auto p-8 space-y-10 scrollbar-thin scrollbar-thumb-gray-300 bg-[#f4f6f8]">
            
            {/* TAB 1: THÔNG TIN CƠ BẢN */}
            {activeTab === 1 && (
                <div className="grid grid-cols-12 gap-8 animate-fade-in bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
                    <div className="col-span-12 md:col-span-3 flex flex-col items-center gap-4 border-r border-gray-100 pr-4">
                        <div className="w-48 h-64 border-2 border-dashed border-gray-300 rounded-xl bg-gray-50 flex items-center justify-center overflow-hidden relative group shadow-inner">
                            {formData.anh_dai_dien ? <img src={formData.anh_dai_dien} className="w-full h-full object-cover" /> : <User className="text-gray-300" size={64} />}
                        </div>
                        {!isViewMode && (
                            <>
                                <input type="file" ref={fileInputRef} hidden accept="image/*" onChange={handleImageUpload} />
                                <button onClick={() => fileInputRef.current?.click()} className="flex items-center gap-2 px-6 py-2.5 bg-white border border-gray-300 shadow-sm rounded-lg text-xs font-bold uppercase hover:bg-gray-50 text-gray-700 transition-all w-full justify-center"><Camera size={14}/> Tải ảnh</button>
                            </>
                        )}
                        <div className="text-center mt-4">
                            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wide">Lần cập nhật cuối</p>
                            <p className="text-xs font-bold text-gray-700">{new Date().toLocaleDateString('vi-VN')}</p>
                        </div>
                    </div>
                    
                    <div className="col-span-12 md:col-span-9 grid grid-cols-2 md:grid-cols-3 gap-6">
                        <div className="col-span-2">
                             <label className={labelBase}>Họ tên khai sinh <span className="text-red-500">*</span></label>
                             <input className={`${inputBase} font-black text-[#14452F] uppercase text-lg`} value={formData.ho_ten} onChange={e => setFormData({...formData, ho_ten: e.target.value.toUpperCase()})} disabled={isViewMode} />
                        </div>
                        <div>
                             <label className={labelBase}>Số hiệu sĩ quan / QNCN</label>
                             <input className={inputBase} value={formData.custom_data?.so_hieu_quan_nhan || ''} onChange={e => updateNested('custom_data.so_hieu_quan_nhan', e.target.value)} disabled={isViewMode} />
                        </div>

                        <VietnamDateInput label="Ngày sinh" value={formData.ngay_sinh} onChange={v => setFormData({...formData, ngay_sinh: v})} disabled={isViewMode} required className={inputBase} />
                        <div>
                             <label className={labelBase}>CCCD/CMND <span className="text-red-500">*</span></label>
                             <input className={`${inputBase} font-bold tracking-wider font-mono`} value={formData.cccd} onChange={e => setFormData({...formData, cccd: e.target.value})} disabled={isViewMode} />
                        </div>
                         <div>
                             <label className={labelBase}>Điện thoại</label>
                             <input className={inputBase} value={formData.sdt_rieng} onChange={e => setFormData({...formData, sdt_rieng: e.target.value})} disabled={isViewMode} />
                        </div>

                        <div className="col-span-3">
                             <label className={labelBase}>Quê quán</label>
                             {/* @ts-ignore */}
                             <input className={inputBase} value={formData.que_quan || ''} onChange={e => setFormData({...formData, que_quan: e.target.value})} disabled={isViewMode} placeholder="Xã/Phường - Huyện/Quận - Tỉnh/Thành phố" />
                        </div>

                        <div className="col-span-3">
                             <label className={labelBase}>Hộ khẩu thường trú</label>
                             <input className={inputBase} value={formData.ho_khau_thu_tru} onChange={e => setFormData({...formData, ho_khau_thu_tru: e.target.value})} disabled={isViewMode} placeholder="Thôn/Xóm - Xã/Phường - Huyện/Quận - Tỉnh/Thành phố" />
                        </div>

                        <div className="col-span-3 grid grid-cols-4 gap-4 p-5 bg-green-50/30 rounded-xl border border-green-100">
                             <div className="col-span-2">
                                 <label className={labelBase}>Đơn vị quản lý <span className="text-red-500">*</span></label>
                                 <select className={`${inputBase} font-bold text-green-800`} value={formData.don_vi_id} onChange={e => setFormData({...formData, don_vi_id: e.target.value})} disabled={isViewMode}>
                                     <option value="">-- Chọn đơn vị --</option>
                                     {(units || []).map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                                 </select>
                             </div>
                             <div>
                                 <label className={labelBase}>Cấp bậc</label>
                                 <select className={inputBase} value={formData.cap_bac} onChange={e => setFormData({...formData, cap_bac: e.target.value})} disabled={isViewMode}>
                                     {['Binh nhì', 'Binh nhất', 'Hạ sĩ', 'Trung sĩ', 'Thượng sĩ', 'Thiếu úy', 'Trung úy', 'Thượng úy', 'Đại úy', 'Thiếu tá', 'Trung tá', 'Thượng tá', 'Đại tá'].map(r => <option key={r} value={r}>{r}</option>)}
                                 </select>
                             </div>
                             <div>
                                 <label className={labelBase}>Chức vụ</label>
                                 <input className={inputBase} value={formData.chuc_vu} onChange={e => setFormData({...formData, chuc_vu: e.target.value})} disabled={isViewMode} />
                             </div>
                             <VietnamDateInput label="Nhập ngũ" value={formData.nhap_ngu_ngay} onChange={v => setFormData({...formData, nhap_ngu_ngay: v})} disabled={isViewMode} className={inputBase} />
                             <VietnamDateInput label="Vào Đoàn" value={formData.ngay_vao_doan} onChange={v => setFormData({...formData, ngay_vao_doan: v})} disabled={isViewMode} className={inputBase} />
                             <VietnamDateInput label="Vào Đảng" value={formData.vao_dang_ngay} onChange={v => setFormData({...formData, vao_dang_ngay: v})} disabled={isViewMode} className={inputBase} />
                             
                             {/* TRÌNH ĐỘ VĂN HÓA & NĂNG KHIẾU */}
                             <div className="col-span-4 grid grid-cols-12 gap-4 mt-2 pt-4 border-t border-green-200/50">
                                <div className="col-span-3">
                                    <label className={labelBase}><GraduationCap size={12} className="inline mr-1"/> Văn hóa chung</label>
                                    <select className={inputBase} value={formData.trinh_do_van_hoa} onChange={e => setFormData({...formData, trinh_do_van_hoa: e.target.value})} disabled={isViewMode}>
                                        <option value="12/12">12/12</option>
                                        <option value="9/12">9/12</option>
                                        <option value="Khác">Khác</option>
                                    </select>
                                </div>
                                <div className="col-span-4">
                                    <label className={labelBase}><GraduationCap size={12} className="inline mr-1"/> Trình độ chuyên môn</label>
                                    <select 
                                        className={inputBase} 
                                        value={formData.custom_data?.trinh_do_chuyen_mon} 
                                        onChange={e => updateNested('custom_data.trinh_do_chuyen_mon', e.target.value)} 
                                        disabled={isViewMode}
                                    >
                                        <option value="Đại học">Đại học</option>
                                        <option value="Thạc sĩ">Thạc sĩ</option>
                                        <option value="Tiến sĩ">Tiến sĩ</option>
                                        <option value="Cao đẳng">Cao đẳng</option>
                                        <option value="Trung cấp">Trung cấp</option>
                                        <option value="Sơ cấp">Sơ cấp</option>
                                        <option value="Không">Không</option>
                                    </select>
                                </div>
                                <div className="col-span-2 flex items-end pb-3">
                                    <label className="flex items-center gap-2 cursor-pointer bg-white px-3 py-2 rounded-lg border border-green-200 shadow-sm w-full hover:bg-green-50 transition-colors">
                                        <input 
                                            type="checkbox" 
                                            checked={formData.da_tot_nghiep} 
                                            onChange={e => setFormData({...formData, da_tot_nghiep: e.target.checked})} 
                                            disabled={isViewMode}
                                            className="w-4 h-4 accent-green-600"
                                        />
                                        <span className="text-[11px] font-bold text-gray-700 uppercase">Đã tốt nghiệp</span>
                                    </label>
                                </div>
                                <div className="col-span-3">
                                    <label className={labelBase}><Award size={12} className="inline mr-1"/> Năng khiếu / Sở trường</label>
                                    <input 
                                        className={inputBase} 
                                        value={formData.nang_khieu_so_truong} 
                                        onChange={e => setFormData({...formData, nang_khieu_so_truong: e.target.value})} 
                                        disabled={isViewMode}
                                        placeholder="VD: Ca hát, Thể thao..."
                                    />
                                </div>

                                {/* BỔ SUNG: QUẢN LÝ NGHỈ PHÉP */}
                                <div className="col-span-12 mt-3 pt-3 border-t border-green-200/50 flex items-center justify-between bg-green-100/50 p-2 rounded-lg">
                                    <div className="flex items-center gap-2">
                                        <Calendar size={16} className="text-green-700"/>
                                        <span className="text-xs font-bold text-green-800 uppercase">Quản lý phép năm:</span>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <div className="flex items-center gap-1">
                                            <span className="text-[10px] font-bold text-gray-500 uppercase">Tiêu chuẩn:</span>
                                            <input 
                                                type="number" 
                                                className="w-12 h-7 text-center text-sm font-bold border border-green-300 rounded focus:ring-1 focus:ring-green-500 bg-white"
                                                value={formData.nghi_phep_tham_chieu}
                                                onChange={e => setFormData({...formData, nghi_phep_tham_chieu: Number(e.target.value)})}
                                                disabled={isViewMode}
                                            />
                                        </div>
                                        <div className="flex items-center gap-1">
                                            <span className="text-[10px] font-bold text-gray-500 uppercase">Đã nghỉ:</span>
                                            <input 
                                                type="number" 
                                                className="w-12 h-7 text-center text-sm font-bold border border-red-300 rounded focus:ring-1 focus:ring-red-500 text-red-600 bg-white"
                                                value={formData.nghi_phep_thuc_te}
                                                onChange={e => setFormData({...formData, nghi_phep_thuc_te: Number(e.target.value)})}
                                                disabled={isViewMode}
                                            />
                                        </div>
                                        <div className="flex items-center gap-1 bg-white px-2 py-1 rounded shadow-sm border border-green-200">
                                            <span className="text-[10px] font-bold text-gray-500 uppercase">Còn lại:</span>
                                            <span className={`font-black text-sm ${(formData.nghi_phep_tham_chieu || 0) - (formData.nghi_phep_thuc_te || 0) < 0 ? 'text-red-600' : 'text-green-700'}`}>
                                                {(formData.nghi_phep_tham_chieu || 0) - (formData.nghi_phep_thuc_te || 0)}
                                            </span>
                                            <span className="text-[10px] text-gray-400">ngày</span>
                                        </div>
                                    </div>
                                </div>
                             </div>
                        </div>
                    </div>
                </div>
            )}
            
            {/* TAB 2: TIỂU SỬ & MẠNG XÃ HỘI */}
            {activeTab === 2 && (
              <div className="space-y-8 animate-fade-in">
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
                  <h3 className={sectionTitle}><BookOpen size={18}/> I. TÓM TẮT TIỂU SỬ BẢN THÂN</h3>
                  <div className="overflow-hidden border rounded-xl shadow-sm">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="bg-[#14452F] text-white font-bold uppercase text-xs">
                          <th className="p-4 text-left w-48 border-r border-white/20">Thời gian</th>
                          <th className="p-4 text-left border-r border-white/20">Công việc / Chức vụ</th>
                          <th className="p-4 text-left">Đơn vị / Địa điểm</th>
                          {!isViewMode && <th className="p-4 w-14 text-center">Xóa</th>}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100 bg-white">
                        {formData.tieu_su_ban_than?.map((row, idx) => (
                          <tr key={idx} className="hover:bg-gray-50 transition-colors">
                            <td className="p-2 border-r border-gray-100">
                              <input 
                                className={`${inputBase} border-none bg-transparent focus:ring-0 text-center font-mono`} 
                                placeholder="Từ... đến..." 
                                value={row.time} 
                                onChange={e => updateRow('tieu_su_ban_than', idx, 'time', e.target.value)}
                                disabled={isViewMode}
                              />
                            </td>
                            <td className="p-2 border-r border-gray-100">
                              <textarea 
                                className={`${inputBase} border-none bg-transparent focus:ring-0 resize-none h-10 min-h-[2.5rem]`} 
                                placeholder="Làm gì, chức vụ gì..." 
                                value={row.job}
                                onChange={e => updateRow('tieu_su_ban_than', idx, 'job', e.target.value)}
                                disabled={isViewMode}
                              />
                            </td>
                            <td className="p-2">
                              <textarea 
                                className={`${inputBase} border-none bg-transparent focus:ring-0 resize-none h-10 min-h-[2.5rem]`} 
                                placeholder="Ở đâu, đơn vị nào..." 
                                value={row.place}
                                onChange={e => updateRow('tieu_su_ban_than', idx, 'place', e.target.value)}
                                disabled={isViewMode}
                              />
                            </td>
                            {!isViewMode && (
                              <td className="p-2 text-center">
                                <button onClick={() => removeRow('tieu_su_ban_than', idx)} className="text-gray-400 hover:text-red-500 hover:bg-red-50 p-2 rounded-full transition-all">
                                  <Trash2 size={16}/>
                                </button>
                              </td>
                            )}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  {!isViewMode && (
                    <button onClick={() => addRow('tieu_su_ban_than', {time: '', job: '', place: ''})} className="mt-3 flex items-center gap-2 text-xs font-bold uppercase text-[#14452F] bg-green-50 px-4 py-2 rounded-lg hover:bg-green-100 transition-colors">
                      <Plus size={14}/> Thêm khoảng thời gian
                    </button>
                  )}
                </div>

                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
                  <h3 className={sectionTitle}><Share2 size={18}/> II. THÔNG TIN MẠNG XÃ HỘI</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="bg-blue-50/50 p-4 rounded-xl border border-blue-100 flex flex-col h-full">
                      <div className="flex items-center gap-2 mb-3 text-blue-700 font-bold uppercase text-xs">
                        <Facebook size={16}/> Facebook
                      </div>
                      <div className="space-y-2 flex-1">
                        {formData.mang_xa_hoi?.facebook?.map((tk, idx) => (
                          <div key={idx} className="flex gap-1 group">
                            <input className={inputBase} placeholder="Link/Tên FB..." value={tk} onChange={e => { const newArr = [...(formData.mang_xa_hoi?.facebook || [])]; newArr[idx] = e.target.value; updateNested('mang_xa_hoi.facebook', newArr); }} disabled={isViewMode} />
                            {!isViewMode && <button onClick={() => { const newArr = [...(formData.mang_xa_hoi?.facebook || [])]; newArr.splice(idx, 1); updateNested('mang_xa_hoi.facebook', newArr); }} className="text-gray-300 group-hover:text-red-500"><X size={16}/></button>}
                          </div>
                        ))}
                        {!isViewMode && <button onClick={() => { const newArr = [...(formData.mang_xa_hoi?.facebook || []), '']; updateNested('mang_xa_hoi.facebook', newArr); }} className="w-full py-2 border border-dashed border-blue-300 rounded text-blue-500 text-xs hover:bg-blue-50">+ Thêm</button>}
                      </div>
                    </div>
                    <div className="bg-blue-50/30 p-4 rounded-xl border border-blue-100 flex flex-col h-full">
                      <div className="flex items-center gap-2 mb-3 text-blue-600 font-bold uppercase text-xs">
                        <MessageCircle size={16}/> Zalo
                      </div>
                      <div className="space-y-2 flex-1">
                        {formData.mang_xa_hoi?.zalo?.map((tk, idx) => (
                          <div key={idx} className="flex gap-1 group">
                             <input className={inputBase} placeholder="SĐT Zalo..." value={tk} onChange={e => { const newArr = [...(formData.mang_xa_hoi?.zalo || [])]; newArr[idx] = e.target.value; updateNested('mang_xa_hoi.zalo', newArr); }} disabled={isViewMode} />
                            {!isViewMode && <button onClick={() => { const newArr = [...(formData.mang_xa_hoi?.zalo || [])]; newArr.splice(idx, 1); updateNested('mang_xa_hoi.zalo', newArr); }} className="text-gray-300 group-hover:text-red-500"><X size={16}/></button>}
                          </div>
                        ))}
                        {!isViewMode && <button onClick={() => { const newArr = [...(formData.mang_xa_hoi?.zalo || []), '']; updateNested('mang_xa_hoi.zalo', newArr); }} className="w-full py-2 border border-dashed border-blue-300 rounded text-blue-500 text-xs hover:bg-blue-50">+ Thêm</button>}
                      </div>
                    </div>
                    <div className="bg-gray-50 p-4 rounded-xl border border-gray-200 flex flex-col h-full">
                      <div className="flex items-center gap-2 mb-3 text-gray-700 font-bold uppercase text-xs">
                        <Globe size={16}/> Tiktok / Khác
                      </div>
                      <div className="space-y-2 flex-1">
                        {formData.mang_xa_hoi?.tiktok?.map((tk, idx) => (
                          <div key={idx} className="flex gap-1 group">
                             <input className={inputBase} placeholder="ID Tiktok..." value={tk} onChange={e => { const newArr = [...(formData.mang_xa_hoi?.tiktok || [])]; newArr[idx] = e.target.value; updateNested('mang_xa_hoi.tiktok', newArr); }} disabled={isViewMode} />
                            {!isViewMode && <button onClick={() => { const newArr = [...(formData.mang_xa_hoi?.tiktok || [])]; newArr.splice(idx, 1); updateNested('mang_xa_hoi.tiktok', newArr); }} className="text-gray-300 group-hover:text-red-500"><X size={16}/></button>}
                          </div>
                        ))}
                         {!isViewMode && <button onClick={() => { const newArr = [...(formData.mang_xa_hoi?.tiktok || []), '']; updateNested('mang_xa_hoi.tiktok', newArr); }} className="w-full py-2 border border-dashed border-gray-300 rounded text-gray-500 text-xs hover:bg-gray-100">+ Thêm</button>}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 3: GIA ĐÌNH - CHI TIẾT */}
            {activeTab === 3 && (
                <div className="animate-fade-in space-y-8 bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pb-6 border-b border-gray-100">
                        <div className="col-span-1 md:col-span-3">
                            <h3 className={sectionTitle}><Home size={18}/> I. THÔNG TIN CHUNG & HOÀN CẢNH</h3>
                        </div>
                        <div className="bg-green-50/50 p-4 rounded-xl border border-green-100">
                            <label className={labelBase}>Hiện đang sống cùng ai?</label>
                            <select className={inputBase} value={formData.hoan_canh_song?.song_chung_voi} onChange={e => updateNested('hoan_canh_song.song_chung_voi', e.target.value)} disabled={isViewMode}>
                                <option value="Bố mẹ đẻ">Bố mẹ đẻ</option>
                                <option value="Vợ chồng, con cái">Vợ chồng, con cái</option>
                                <option value="Anh chị em ruột">Anh chị em ruột</option>
                                <option value="Ông bà, họ hàng">Ông bà, họ hàng</option>
                                <option value="Một mình (Thuê trọ)">Một mình (Thuê trọ)</option>
                                <option value="Một mình (Nhà riêng)">Một mình (Nhà riêng)</option>
                                <option value="Khác">Khác</option>
                            </select>
                        </div>
                        <div className="bg-yellow-50/50 p-4 rounded-xl border border-yellow-100">
                            <label className={labelBase}>Hoàn cảnh kinh tế gia đình</label>
                            <select className={inputBase} value={formData.thong_tin_gia_dinh_chung?.muc_song} onChange={e => updateNested('thong_tin_gia_dinh_chung.muc_song', e.target.value)} disabled={isViewMode}>
                                <option value="Khá giả">Khá giả</option>
                                <option value="Đủ ăn">Đủ ăn</option>
                                <option value="Khó khăn">Khó khăn</option>
                                <option value="Hộ nghèo/Cận nghèo">Hộ nghèo / Cận nghèo</option>
                            </select>
                        </div>
                        <div className={`p-4 rounded-xl border transition-all ${formData.thong_tin_gia_dinh_chung?.lich_su_vi_pham_nguoi_than?.co_khong ? 'bg-red-50 border-red-200' : 'bg-gray-50 border-gray-100'}`}>
                            <div className="flex justify-between items-center mb-2">
                                <label className="text-[11px] font-extrabold text-gray-600 uppercase tracking-wider flex items-center gap-1"><Gavel size={12}/> Gia đình có người vi phạm PL?</label>
                                <div className="flex gap-2 text-xs">
                                    <label className="cursor-pointer flex items-center gap-1"><input type="radio" checked={!formData.thong_tin_gia_dinh_chung?.lich_su_vi_pham_nguoi_than?.co_khong} onChange={() => updateNested('thong_tin_gia_dinh_chung.lich_su_vi_pham_nguoi_than.co_khong', false)} disabled={isViewMode}/> Không</label>
                                    <label className="cursor-pointer flex items-center gap-1 text-red-600 font-bold"><input type="radio" checked={!!formData.thong_tin_gia_dinh_chung?.lich_su_vi_pham_nguoi_than?.co_khong} onChange={() => updateNested('thong_tin_gia_dinh_chung.lich_su_vi_pham_nguoi_than.co_khong', true)} disabled={isViewMode}/> Có</label>
                                </div>
                            </div>
                            {formData.thong_tin_gia_dinh_chung?.lich_su_vi_pham_nguoi_than?.co_khong && (
                                <input className={inputBase} placeholder="Ai? Vi phạm gì? Năm nào?" value={formData.thong_tin_gia_dinh_chung?.lich_su_vi_pham_nguoi_than?.chi_tiet} onChange={e => updateNested('thong_tin_gia_dinh_chung.lich_su_vi_pham_nguoi_than.chi_tiet', e.target.value)} disabled={isViewMode} />
                            )}
                        </div>
                    </div>

                    <div>
                        <div className="flex justify-between items-end mb-4">
                            <h3 className={sectionTitle}><Users size={18}/> II. DANH SÁCH NGƯỜI THÂN (CHA MẸ, ANH EM)</h3>
                            <div className="text-[10px] text-gray-500 italic bg-blue-50 px-3 py-1 rounded-full border border-blue-100 flex items-center gap-1">
                                <Info size={12}/> Vui lòng chọn (tick) vào người cần báo tin khi có việc khẩn cấp
                            </div>
                        </div>
                        <div className="bg-white border rounded-xl overflow-hidden shadow-sm">
                            <table className="w-full text-sm text-left">
                                <thead className="bg-gray-100 text-gray-600 font-bold uppercase text-[11px]">
                                    <tr>
                                        <th className="p-3 w-16 text-center text-red-600">Báo tin</th>
                                        <th className="p-3 w-24">Quan hệ</th>
                                        <th className="p-3">Họ tên</th>
                                        <th className="p-3 w-20">Năm sinh</th>
                                        <th className="p-3">Nghề nghiệp</th>
                                        <th className="p-3">Nơi ở</th>
                                        <th className="p-3">SĐT</th>
                                        {!isViewMode && <th className="p-3 w-10"></th>}
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {(formData.quan_he_gia_dinh?.cha_me_anh_em || []).map((mem, idx) => (
                                        <tr key={idx} className={formData.custom_data?.nguoi_bao_tin_khancap === mem.ho_ten && mem.ho_ten ? 'bg-red-50/50' : 'hover:bg-gray-50'}>
                                            <td className="p-2 text-center">
                                                <input type="radio" name="bao_tin_khancap" disabled={isViewMode || !mem.ho_ten} checked={formData.custom_data?.nguoi_bao_tin_khancap === mem.ho_ten && !!mem.ho_ten} onChange={() => updateNested('custom_data.nguoi_bao_tin_khancap', mem.ho_ten)} className="w-4 h-4 accent-red-600 cursor-pointer" />
                                            </td>
                                            <td className="p-2"><select className={inputBase} value={mem.quan_he} onChange={e => {const u = JSON.parse(JSON.stringify(formData.quan_he_gia_dinh?.cha_me_anh_em || [])); u[idx].quan_he = e.target.value; updateNested('quan_he_gia_dinh.cha_me_anh_em', u);}} disabled={isViewMode}><option>Bố</option><option>Mẹ</option><option>Anh</option><option>Chị</option><option>Em</option></select></td>
                                            <td className="p-2"><input className={inputBase} value={mem.ho_ten} onChange={e => {const u = JSON.parse(JSON.stringify(formData.quan_he_gia_dinh?.cha_me_anh_em || [])); u[idx].ho_ten = e.target.value; updateNested('quan_he_gia_dinh.cha_me_anh_em', u);}} disabled={isViewMode} placeholder="Họ tên đầy đủ"/></td>
                                            <td className="p-2"><input className={inputBase} value={mem.nam_sinh} onChange={e => {const u = JSON.parse(JSON.stringify(formData.quan_he_gia_dinh?.cha_me_anh_em || [])); u[idx].nam_sinh = e.target.value; updateNested('quan_he_gia_dinh.cha_me_anh_em', u);}} disabled={isViewMode} placeholder="Năm"/></td>
                                            <td className="p-2"><input className={inputBase} value={mem.nghe_nghiep} onChange={e => {const u = JSON.parse(JSON.stringify(formData.quan_he_gia_dinh?.cha_me_anh_em || [])); u[idx].nghe_nghiep = e.target.value; updateNested('quan_he_gia_dinh.cha_me_anh_em', u);}} disabled={isViewMode} /></td>
                                            <td className="p-2"><input className={inputBase} value={mem.cho_o} onChange={e => {const u = JSON.parse(JSON.stringify(formData.quan_he_gia_dinh?.cha_me_anh_em || [])); u[idx].cho_o = e.target.value; updateNested('quan_he_gia_dinh.cha_me_anh_em', u);}} disabled={isViewMode} /></td>
                                            <td className="p-2"><input className={inputBase} value={mem.sdt} onChange={e => {const u = JSON.parse(JSON.stringify(formData.quan_he_gia_dinh?.cha_me_anh_em || [])); u[idx].sdt = e.target.value; updateNested('quan_he_gia_dinh.cha_me_anh_em', u);}} disabled={isViewMode} placeholder="Số ĐT"/></td>
                                            {!isViewMode && <td className="p-2 text-center"><button onClick={() => removeRow('quan_he_gia_dinh.cha_me_anh_em', idx)} className="text-gray-300 hover:text-red-500 hover:bg-red-50 p-1.5 rounded transition-colors"><Trash2 size={16}/></button></td>}
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                            {!isViewMode && <div className="p-3 bg-gray-50 border-t"><button onClick={() => addRow('quan_he_gia_dinh.cha_me_anh_em', {quan_he: 'Bố', ho_ten: '', nam_sinh: '', nghe_nghiep: '', cho_o: '', sdt: ''})} className="flex items-center gap-2 text-green-700 font-bold text-xs uppercase px-4 py-2 hover:bg-green-100 rounded-lg transition-colors border border-green-200 bg-white"><Plus size={16}/> Thêm thành viên</button></div>}
                        </div>
                    </div>

                    <div>
                        <h3 className={sectionTitle}><Heart size={18}/> III. HÔN NHÂN & TÌNH CẢM</h3>
                        <div className="bg-gray-50/50 p-5 rounded-xl border border-gray-100">
                             <div className="flex gap-6 mb-6">
                                <label className={`flex items-center gap-3 cursor-pointer p-4 rounded-xl border-2 transition-all w-full ${formData.custom_data?.tinh_trang_hon_nhan === 'ket_hon' ? 'border-blue-500 bg-blue-50' : 'border-transparent bg-white shadow-sm hover:bg-gray-50'}`}>
                                    <input type="radio" name="tinh_trang_hon_nhan" checked={formData.custom_data?.tinh_trang_hon_nhan === 'ket_hon'} onChange={() => updateNested('custom_data.tinh_trang_hon_nhan', 'ket_hon')} disabled={isViewMode} className="w-5 h-5 accent-blue-600" />
                                    <div><div className="font-bold text-gray-800 uppercase text-xs">Đã kết hôn</div><div className="text-[10px] text-gray-500">Đã đăng ký kết hôn hoặc tổ chức đám cưới</div></div>
                                </label>
                                <label className={`flex items-center gap-3 cursor-pointer p-4 rounded-xl border-2 transition-all w-full ${formData.custom_data?.tinh_trang_hon_nhan === 'doc_than' ? 'border-pink-500 bg-pink-50' : 'border-transparent bg-white shadow-sm hover:bg-gray-50'}`}>
                                    <input type="radio" name="tinh_trang_hon_nhan" checked={formData.custom_data?.tinh_trang_hon_nhan === 'doc_than'} onChange={() => updateNested('custom_data.tinh_trang_hon_nhan', 'doc_than')} disabled={isViewMode} className="w-5 h-5 accent-pink-500" />
                                    <div><div className="font-bold text-gray-800 uppercase text-xs">Chưa kết hôn</div><div className="text-[10px] text-gray-500">Độc thân, ly hôn hoặc đang hẹn hò</div></div>
                                </label>
                             </div>

                             {formData.custom_data?.tinh_trang_hon_nhan === 'ket_hon' && (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 animate-slide-in">
                                     <div className="bg-blue-50/30 p-5 rounded-xl border border-blue-100 h-full">
                                         <div className="font-bold text-blue-800 uppercase text-xs mb-3 flex items-center gap-2"><User size={14}/> Thông tin Vợ / Chồng</div>
                                         <div className="space-y-3">
                                            {/* @ts-ignore */}
                                            <input className={inputBase} placeholder="Họ và tên" value={formData.quan_he_gia_dinh?.vo?.ho_ten || ''} onChange={e => updateNested('quan_he_gia_dinh.vo.ho_ten', e.target.value)} disabled={isViewMode} />
                                            <div className="grid grid-cols-2 gap-3">
                                                {/* @ts-ignore */}
                                                <input className={inputBase} placeholder="Năm sinh" value={formData.quan_he_gia_dinh?.vo?.nam_sinh || ''} onChange={e => updateNested('quan_he_gia_dinh.vo.nam_sinh', e.target.value)} disabled={isViewMode} />
                                                {/* @ts-ignore */}
                                                <input className={inputBase} placeholder="SĐT liên hệ" value={formData.quan_he_gia_dinh?.vo?.sdt || ''} onChange={e => updateNested('quan_he_gia_dinh.vo.sdt', e.target.value)} disabled={isViewMode} />
                                            </div>
                                            {/* @ts-ignore */}
                                            <input className={inputBase} placeholder="Nghề nghiệp" value={formData.quan_he_gia_dinh?.vo?.nghe_nghiep || ''} onChange={e => updateNested('quan_he_gia_dinh.vo.nghe_nghiep', e.target.value)} disabled={isViewMode} />
                                            {/* @ts-ignore */}
                                            <input className={inputBase} placeholder="Nơi ở hiện tại" value={formData.quan_he_gia_dinh?.vo?.noi_o || ''} onChange={e => updateNested('quan_he_gia_dinh.vo.noi_o', e.target.value)} disabled={isViewMode} />
                                         </div>
                                     </div>
                                     <div className="bg-gray-100/50 p-5 rounded-xl border border-gray-200 h-full">
                                         <div className="font-bold text-gray-700 uppercase text-xs mb-3 flex items-center gap-2"><Users size={14}/> Danh sách con cái</div>
                                         <div className="space-y-2">
                                             {(formData.quan_he_gia_dinh?.con || []).length === 0 && <p className="text-xs text-gray-400 italic text-center py-4 bg-white rounded-lg border border-dashed border-gray-300">Chưa có thông tin con cái</p>}
                                             {(formData.quan_he_gia_dinh?.con || []).map((child, idx) => (
                                                 <div key={idx} className="flex gap-2">
                                                     <input className={inputBase} value={child.ten} onChange={e => { const u = JSON.parse(JSON.stringify(formData.quan_he_gia_dinh?.con || [])); u[idx].ten = e.target.value; updateNested('quan_he_gia_dinh.con', u); }} disabled={isViewMode} placeholder="Tên con" />
                                                     <input className={`${inputBase} w-24 text-center`} value={child.ns} onChange={e => { const u = JSON.parse(JSON.stringify(formData.quan_he_gia_dinh?.con || [])); u[idx].ns = e.target.value; updateNested('quan_he_gia_dinh.con', u); }} disabled={isViewMode} placeholder="Năm sinh" />
                                                     {!isViewMode && <button onClick={() => removeRow('quan_he_gia_dinh.con', idx)} className="text-red-500 hover:bg-red-50 p-2 rounded"><Trash2 size={16}/></button>}
                                                 </div>
                                             ))}
                                             {!isViewMode && <button onClick={() => addRow('quan_he_gia_dinh.con', {ten: '', ns: ''})} className="text-xs font-bold text-blue-600 flex items-center gap-1 mt-2 hover:bg-blue-50 px-3 py-1.5 rounded transition-colors">+ Thêm con</button>}
                                         </div>
                                     </div>
                                </div>
                             )}

                             {formData.custom_data?.tinh_trang_hon_nhan === 'doc_than' && (
                                <div className="bg-pink-50/30 p-5 rounded-xl border border-pink-100 animate-slide-in">
                                    <div className="flex items-center gap-4 mb-4">
                                        <div className="font-bold text-pink-700 uppercase text-xs flex items-center gap-2"><Heart size={14} className="fill-pink-500 text-pink-500"/> Thông tin Bạn gái / Người yêu</div>
                                        <label className="flex items-center gap-2 cursor-pointer bg-white px-3 py-1 rounded-full border border-pink-200 hover:border-pink-300 transition-colors shadow-sm">
                                            <input type="checkbox" checked={!!formData.custom_data?.co_nguoi_yeu} onChange={e => { updateNested('custom_data.co_nguoi_yeu', e.target.checked); if (e.target.checked && (formData.quan_he_gia_dinh?.nguoi_yeu?.length || 0) === 0) { addRow('quan_he_gia_dinh.nguoi_yeu', { ho_ten: '', nam_sinh: '', nghe_nghiep: '', noi_o: '', sdt: '' }); } }} disabled={isViewMode} className="w-4 h-4 accent-pink-500" />
                                            <span className="text-xs font-bold text-gray-700">Đã có người yêu</span>
                                        </label>
                                    </div>
                                    {!formData.custom_data?.co_nguoi_yeu && <div className="text-center py-6 text-gray-400 italic text-sm bg-white rounded-lg border border-dashed border-gray-200">Chưa có bạn gái / người yêu</div>}
                                    {formData.custom_data?.co_nguoi_yeu && (
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-fade-in bg-white p-4 rounded-lg shadow-sm border border-pink-100">
                                            <div className="col-span-1 md:col-span-2">
                                                <label className={labelBase}>Họ và tên</label>
                                                <input className={inputBase} value={formData.quan_he_gia_dinh?.nguoi_yeu?.[0]?.ho_ten || ''} onChange={e => updateRow('quan_he_gia_dinh.nguoi_yeu', 0, 'ho_ten', e.target.value)} disabled={isViewMode} placeholder="Nguyễn Thị A..." />
                                            </div>
                                            <div>
                                                <label className={labelBase}>Năm sinh</label>
                                                <input className={inputBase} value={formData.quan_he_gia_dinh?.nguoi_yeu?.[0]?.nam_sinh || ''} onChange={e => updateRow('quan_he_gia_dinh.nguoi_yeu', 0, 'nam_sinh', e.target.value)} disabled={isViewMode} placeholder="YYYY" />
                                            </div>
                                            <div>
                                                <label className={labelBase}>Số điện thoại</label>
                                                <div className="relative"><Phone size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"/><input className={`${inputBase} pl-9`} value={formData.quan_he_gia_dinh?.nguoi_yeu?.[0]?.sdt || ''} onChange={e => updateRow('quan_he_gia_dinh.nguoi_yeu', 0, 'sdt', e.target.value)} disabled={isViewMode} placeholder="09xx..." /></div>
                                            </div>
                                            <div>
                                                <label className={labelBase}>Nghề nghiệp</label>
                                                <input className={inputBase} value={formData.quan_he_gia_dinh?.nguoi_yeu?.[0]?.nghe_nghiep || ''} onChange={e => updateRow('quan_he_gia_dinh.nguoi_yeu', 0, 'nghe_nghiep', e.target.value)} disabled={isViewMode} placeholder="Sinh viên, CN..." />
                                            </div>
                                            <div>
                                                <label className={labelBase}>Quê quán / Nơi ở</label>
                                                <input className={inputBase} value={formData.quan_he_gia_dinh?.nguoi_yeu?.[0]?.noi_o || ''} onChange={e => updateRow('quan_he_gia_dinh.nguoi_yeu', 0, 'noi_o', e.target.value)} disabled={isViewMode} placeholder="Hà Nội..." />
                                            </div>
                                        </div>
                                    )}
                                </div>
                             )}
                        </div>
                    </div>
                </div>
            )}

            {/* TAB 4: NƯỚC NGOÀI */}
            {activeTab === 4 && (
              <div className="space-y-8 animate-fade-in">
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
                  <h3 className={sectionTitle}><Globe size={18}/> I. THÂN NHÂN Ở NƯỚC NGOÀI</h3>
                  <div className="overflow-hidden border rounded-xl shadow-sm">
                    <table className="w-full text-sm">
                      <thead className={tableHeader}>
                        <tr>
                          <th className="p-3 w-32">Quan hệ</th>
                          <th className="p-3">Họ và tên</th>
                          <th className="p-3">Nước định cư</th>
                          <th className="p-3">Nghề nghiệp / Lý do</th>
                          {!isViewMode && <th className="p-3 w-10"></th>}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100 bg-white">
                         {formData.yeu_to_nuoc_ngoai?.than_nhan?.length === 0 && <tr><td colSpan={5} className="p-4 text-center text-gray-400 italic text-xs">Không có thân nhân ở nước ngoài</td></tr>}
                         {formData.yeu_to_nuoc_ngoai?.than_nhan?.map((item, idx) => (
                           <tr key={idx}>
                             <td className={tableCell}><input className={inputBase} value={item.quan_he} onChange={e => { const u = JSON.parse(JSON.stringify(formData.yeu_to_nuoc_ngoai?.than_nhan || [])); u[idx].quan_he = e.target.value; updateNested('yeu_to_nuoc_ngoai.than_nhan', u); }} disabled={isViewMode} placeholder="VD: Cô ruột" /></td>
                             <td className={tableCell}><input className={inputBase} value={item.ho_ten} onChange={e => { const u = JSON.parse(JSON.stringify(formData.yeu_to_nuoc_ngoai?.than_nhan || [])); u[idx].ho_ten = e.target.value; updateNested('yeu_to_nuoc_ngoai.than_nhan', u); }} disabled={isViewMode} /></td>
                             <td className={tableCell}><input className={inputBase} value={item.nuoc} onChange={e => { const u = JSON.parse(JSON.stringify(formData.yeu_to_nuoc_ngoai?.than_nhan || [])); u[idx].nuoc = e.target.value; updateNested('yeu_to_nuoc_ngoai.than_nhan', u); }} disabled={isViewMode} /></td>
                             <td className={tableCell}><input className={inputBase} value={item.nghe_nghiep} onChange={e => { const u = JSON.parse(JSON.stringify(formData.yeu_to_nuoc_ngoai?.than_nhan || [])); u[idx].nghe_nghiep = e.target.value; updateNested('yeu_to_nuoc_ngoai.than_nhan', u); }} disabled={isViewMode} /></td>
                             {!isViewMode && <td className={tableCell}><button onClick={() => removeRow('yeu_to_nuoc_ngoai.than_nhan', idx)} className="text-gray-400 hover:text-red-500"><Trash2 size={16}/></button></td>}
                           </tr>
                         ))}
                      </tbody>
                    </table>
                  </div>
                  {!isViewMode && <button onClick={() => addRow('yeu_to_nuoc_ngoai.than_nhan', {quan_he: '', ho_ten: '', nuoc: '', nghe_nghiep: ''})} className="mt-3 flex items-center gap-2 text-xs font-bold uppercase text-blue-600 bg-blue-50 px-4 py-2 rounded-lg hover:bg-blue-100 transition-colors"><Plus size={14}/> Thêm thân nhân</button>}
                </div>

                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
                  <h3 className={sectionTitle}><Plane size={18}/> II. LỊCH SỬ ĐI NƯỚC NGOÀI</h3>
                  <div className="overflow-hidden border rounded-xl shadow-sm">
                    <table className="w-full text-sm">
                      <thead className={tableHeader}>
                        <tr>
                          <th className="p-3">Nước đến</th>
                          <th className="p-3 w-40">Thời gian</th>
                          <th className="p-3">Mục đích</th>
                          <th className="p-3">Kết quả / Ghi chú</th>
                          {!isViewMode && <th className="p-3 w-10"></th>}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100 bg-white">
                         {formData.yeu_to_nuoc_ngoai?.di_nuoc_ngoai?.length === 0 && <tr><td colSpan={5} className="p-4 text-center text-gray-400 italic text-xs">Chưa từng đi nước ngoài</td></tr>}
                         {formData.yeu_to_nuoc_ngoai?.di_nuoc_ngoai?.map((item, idx) => (
                           <tr key={idx}>
                             <td className={tableCell}><input className={inputBase} value={item.nuoc} onChange={e => { const u = JSON.parse(JSON.stringify(formData.yeu_to_nuoc_ngoai?.di_nuoc_ngoai || [])); u[idx].nuoc = e.target.value; updateNested('yeu_to_nuoc_ngoai.di_nuoc_ngoai', u); }} disabled={isViewMode} /></td>
                             <td className={tableCell}><input className={inputBase} value={item.thoi_gian} onChange={e => { const u = JSON.parse(JSON.stringify(formData.yeu_to_nuoc_ngoai?.di_nuoc_ngoai || [])); u[idx].thoi_gian = e.target.value; updateNested('yeu_to_nuoc_ngoai.di_nuoc_ngoai', u); }} disabled={isViewMode} placeholder="mm/yyyy" /></td>
                             <td className={tableCell}><input className={inputBase} value={item.muc_dich} onChange={e => { const u = JSON.parse(JSON.stringify(formData.yeu_to_nuoc_ngoai?.di_nuoc_ngoai || [])); u[idx].muc_dich = e.target.value; updateNested('yeu_to_nuoc_ngoai.di_nuoc_ngoai', u); }} disabled={isViewMode} /></td>
                             <td className={tableCell}><input className={inputBase} value={item.ket_qua} onChange={e => { const u = JSON.parse(JSON.stringify(formData.yeu_to_nuoc_ngoai?.di_nuoc_ngoai || [])); u[idx].ket_qua = e.target.value; updateNested('yeu_to_nuoc_ngoai.di_nuoc_ngoai', u); }} disabled={isViewMode} /></td>
                             {!isViewMode && <td className={tableCell}><button onClick={() => removeRow('yeu_to_nuoc_ngoai.di_nuoc_ngoai', idx)} className="text-gray-400 hover:text-red-500"><Trash2 size={16}/></button></td>}
                           </tr>
                         ))}
                      </tbody>
                    </table>
                  </div>
                  {!isViewMode && <button onClick={() => addRow('yeu_to_nuoc_ngoai.di_nuoc_ngoai', {nuoc: '', thoi_gian: '', muc_dich: '', ket_qua: ''})} className="mt-3 flex items-center gap-2 text-xs font-bold uppercase text-blue-600 bg-blue-50 px-4 py-2 rounded-lg hover:bg-blue-100 transition-colors"><Plus size={14}/> Thêm chuyến đi</button>}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                   <div className="bg-orange-50/50 p-6 rounded-2xl border border-orange-100">
                      <h3 className="font-bold text-orange-800 uppercase text-xs mb-4">III. THÔNG TIN HỘ CHIẾU (PASSPORT)</h3>
                      <div className="space-y-3">
                         <label className="flex items-center gap-2 cursor-pointer p-3 bg-white rounded-lg border border-orange-200 hover:bg-orange-50 transition-colors">
                           <input type="checkbox" checked={formData.yeu_to_nuoc_ngoai?.ho_chieu?.da_co} onChange={e => updateNested('yeu_to_nuoc_ngoai.ho_chieu.da_co', e.target.checked)} disabled={isViewMode} className="w-5 h-5 accent-orange-600" />
                           <span className="font-bold text-gray-700 text-sm">Đã có hộ chiếu</span>
                         </label>
                         {formData.yeu_to_nuoc_ngoai?.ho_chieu?.da_co && (
                           <div className="animate-slide-in">
                             <label className={labelBase}>Dự định đi nước nào thời gian tới?</label>
                             <input className={inputBase} value={formData.yeu_to_nuoc_ngoai?.ho_chieu?.du_dinh_nuoc} onChange={e => updateNested('yeu_to_nuoc_ngoai.ho_chieu.du_dinh_nuoc', e.target.value)} disabled={isViewMode} placeholder="Ghi rõ nước và thời gian dự kiến..." />
                           </div>
                         )}
                      </div>
                   </div>
                   <div className="bg-red-50/50 p-6 rounded-2xl border border-red-100">
                      <h3 className="font-bold text-red-800 uppercase text-xs mb-4">IV. HỒ SƠ BẢO LÃNH ĐỊNH CƯ</h3>
                      <div className="space-y-3">
                         <label className="flex items-center gap-2 cursor-pointer p-3 bg-white rounded-lg border border-red-200 hover:bg-red-50 transition-colors">
                           <input type="checkbox" checked={formData.yeu_to_nuoc_ngoai?.xuat_canh_dinh_cu?.dang_lam_thu_tuc} onChange={e => updateNested('yeu_to_nuoc_ngoai.xuat_canh_dinh_cu.dang_lam_thu_tuc', e.target.checked)} disabled={isViewMode} className="w-5 h-5 accent-red-600" />
                           <span className="font-bold text-gray-700 text-sm">Đang có hồ sơ xin bảo lãnh định cư</span>
                         </label>
                         {formData.yeu_to_nuoc_ngoai?.xuat_canh_dinh_cu?.dang_lam_thu_tuc && (
                           <div className="animate-slide-in space-y-3">
                             <div><label className={labelBase}>Nước xin định cư</label><input className={inputBase} value={formData.yeu_to_nuoc_ngoai?.xuat_canh_dinh_cu?.nuoc} onChange={e => updateNested('yeu_to_nuoc_ngoai.xuat_canh_dinh_cu.nuoc', e.target.value)} disabled={isViewMode} /></div>
                             <div><label className={labelBase}>Người bảo lãnh (Quan hệ)</label><input className={inputBase} value={formData.yeu_to_nuoc_ngoai?.xuat_canh_dinh_cu?.nguoi_bao_lanh} onChange={e => updateNested('yeu_to_nuoc_ngoai.xuat_canh_dinh_cu.nguoi_bao_lanh', e.target.value)} disabled={isViewMode} /></div>
                           </div>
                         )}
                      </div>
                   </div>
                </div>
              </div>
            )}

            {/* TAB 5: AN NINH & VI PHẠM - ĐÃ NÂNG CẤP CHI TIẾT */}
            {activeTab === 5 && (
                <div className="space-y-8 animate-fade-in">
                    <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-r-lg flex items-start gap-3">
                        <ShieldAlert className="text-red-600 mt-1" />
                        <div>
                            <h4 className="font-bold text-red-800 uppercase text-sm">Khu vực nhạy cảm</h4>
                            <p className="text-xs text-red-700">Thông tin tại đây ảnh hưởng trực tiếp đến kết quả rà soát chính trị. Vui lòng khai báo trung thực.</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Vay nợ */}
                        <div className={`p-6 bg-white border rounded-xl transition-all ${formData.tai_chinh_suc_khoe?.vay_no?.co_khong ? 'border-red-300 ring-4 ring-red-50' : 'border-gray-200'}`}>
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="font-black text-gray-700 uppercase text-sm">I. Tình hình vay nợ</h3>
                                <div className="flex gap-4">
                                    <label className="flex items-center gap-2 cursor-pointer font-bold text-xs"><input type="radio" checked={!formData.tai_chinh_suc_khoe?.vay_no?.co_khong} onChange={() => updateNested('tai_chinh_suc_khoe.vay_no.co_khong', false)} disabled={isViewMode} className="accent-green-600" /> Không có</label>
                                    <label className="flex items-center gap-2 cursor-pointer font-bold text-xs text-red-600"><input type="radio" checked={!!formData.tai_chinh_suc_khoe?.vay_no?.co_khong} onChange={() => updateNested('tai_chinh_suc_khoe.vay_no.co_khong', true)} disabled={isViewMode} className="accent-red-600" /> Có vay nợ</label>
                                </div>
                            </div>
                            
                            {formData.tai_chinh_suc_khoe?.vay_no?.co_khong && (
                                <div className="grid grid-cols-2 gap-4 animate-slide-in">
                                    <div><label className={labelBase}>Số tiền (VNĐ)</label><input className={`${inputBase} font-bold text-red-600`} value={formData.tai_chinh_suc_khoe?.vay_no?.so_tien} onChange={e => updateNested('tai_chinh_suc_khoe.vay_no.so_tien', e.target.value)} disabled={isViewMode} /></div>
                                    <div><label className={labelBase}>Chủ nợ</label><input className={inputBase} value={formData.tai_chinh_suc_khoe?.vay_no?.ai_vay} onChange={e => updateNested('tai_chinh_suc_khoe.vay_no.ai_vay', e.target.value)} disabled={isViewMode} /></div>
                                    <div className="col-span-2"><label className={labelBase}>Mục đích vay</label><input className={inputBase} value={formData.tai_chinh_suc_khoe?.vay_no?.muc_dich} onChange={e => updateNested('tai_chinh_suc_khoe.vay_no.muc_dich', e.target.value)} disabled={isViewMode} /></div>
                                    <div className="col-span-2 flex items-center gap-2 mt-2 p-2 bg-yellow-50 rounded">
                                        <input type="checkbox" checked={formData.tai_chinh_suc_khoe?.vay_no?.gia_dinh_biet} onChange={e => updateNested('tai_chinh_suc_khoe.vay_no.gia_dinh_biet', e.target.checked)} disabled={isViewMode} className="w-4 h-4 accent-yellow-600" />
                                        <span className="text-xs font-bold text-yellow-800 uppercase">Gia đình đã biết chuyện vay nợ</span>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Ma túy & Đánh bạc */}
                        <div className="space-y-6">
                            <div className={`p-4 bg-white border rounded-xl transition-all ${formData.lich_su_vi_pham?.ma_tuy?.co_khong ? 'border-red-300 ring-2 ring-red-50' : 'border-gray-200'}`}>
                                <div className="flex justify-between items-center mb-2">
                                    <h3 className="font-bold text-gray-700 uppercase text-xs">II. Liên quan Ma túy</h3>
                                    <div className="flex gap-2">
                                        <label className="flex items-center gap-1 cursor-pointer font-bold text-[10px]"><input type="radio" checked={!formData.lich_su_vi_pham?.ma_tuy?.co_khong} onChange={() => updateNested('lich_su_vi_pham.ma_tuy.co_khong', false)} disabled={isViewMode} /> Không</label>
                                        <label className="flex items-center gap-1 cursor-pointer font-bold text-[10px] text-red-600"><input type="radio" checked={!!formData.lich_su_vi_pham?.ma_tuy?.co_khong} onChange={() => updateNested('lich_su_vi_pham.ma_tuy.co_khong', true)} disabled={isViewMode} /> Có</label>
                                    </div>
                                </div>
                                {formData.lich_su_vi_pham?.ma_tuy?.co_khong && (
                                    <div className="grid grid-cols-2 gap-2 animate-slide-in">
                                        <input className={inputBase} placeholder="Năm nào?" value={formData.lich_su_vi_pham?.ma_tuy?.thoi_gian} onChange={e => updateNested('lich_su_vi_pham.ma_tuy.thoi_gian', e.target.value)} disabled={isViewMode} />
                                        <input className={inputBase} placeholder="Hình thức (Hút/Chích...)" value={formData.lich_su_vi_pham?.ma_tuy?.loai} onChange={e => updateNested('lich_su_vi_pham.ma_tuy.loai', e.target.value)} disabled={isViewMode} />
                                    </div>
                                )}
                            </div>
                             <div className={`p-4 bg-white border rounded-xl transition-all ${formData.lich_su_vi_pham?.danh_bac?.co_khong ? 'border-red-300 ring-2 ring-red-50' : 'border-gray-200'}`}>
                                <div className="flex justify-between items-center mb-2">
                                    <h3 className="font-bold text-gray-700 uppercase text-xs">III. Đánh bạc / Lô đề</h3>
                                    <div className="flex gap-2">
                                        <label className="flex items-center gap-1 cursor-pointer font-bold text-[10px]"><input type="radio" checked={!formData.lich_su_vi_pham?.danh_bac?.co_khong} onChange={() => updateNested('lich_su_vi_pham.danh_bac.co_khong', false)} disabled={isViewMode} /> Không</label>
                                        <label className="flex items-center gap-1 cursor-pointer font-bold text-[10px] text-red-600"><input type="radio" checked={!!formData.lich_su_vi_pham?.danh_bac?.co_khong} onChange={() => updateNested('lich_su_vi_pham.danh_bac.co_khong', true)} disabled={isViewMode} /> Có</label>
                                    </div>
                                </div>
                                {formData.lich_su_vi_pham?.danh_bac?.co_khong && (
                                    <div className="animate-slide-in">
                                        <input className={inputBase} placeholder="Chi tiết hình thức, địa điểm..." value={formData.lich_su_vi_pham?.danh_bac?.hinh_thuc} onChange={e => updateNested('lich_su_vi_pham.danh_bac.hinh_thuc', e.target.value)} disabled={isViewMode} />
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* BẢNG LỊCH SỬ VI PHẠM CHI TIẾT */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Kỷ luật quân đội */}
                        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
                             <h3 className="font-bold text-[#14452F] uppercase text-xs mb-3 flex items-center gap-2"><Gavel size={14}/> IV. VI PHẠM KỶ LUẬT QUÂN ĐỘI</h3>
                             <table className="w-full text-xs text-left mb-2">
                                 <thead className="bg-gray-100 uppercase text-gray-500 font-bold">
                                     <tr>
                                         <th className="p-2 w-16">Năm</th>
                                         <th className="p-2">Nội dung vi phạm</th>
                                         <th className="p-2">Hình thức xử lý</th>
                                         {!isViewMode && <th className="p-2 w-8"></th>}
                                     </tr>
                                 </thead>
                                 <tbody className="divide-y">
                                     {/* @ts-ignore */}
                                     {(formData.lich_su_vi_pham?.ky_luat_quan_doi || []).length === 0 && <tr><td colSpan={4} className="p-3 text-center text-gray-400 italic">Chưa có vi phạm</td></tr>}
                                     {/* @ts-ignore */}
                                     {(formData.lich_su_vi_pham?.ky_luat_quan_doi || []).map((vp, idx) => (
                                         <tr key={idx}>
                                             <td className="p-1"><input className="w-full p-1 border rounded" value={vp.nam} onChange={e => updateRow('lich_su_vi_pham.ky_luat_quan_doi', idx, 'nam', e.target.value)} disabled={isViewMode} placeholder="Năm"/></td>
                                             <td className="p-1"><input className="w-full p-1 border rounded" value={vp.noi_dung} onChange={e => updateRow('lich_su_vi_pham.ky_luat_quan_doi', idx, 'noi_dung', e.target.value)} disabled={isViewMode}/></td>
                                             <td className="p-1"><input className="w-full p-1 border rounded" value={vp.hinh_thuc} onChange={e => updateRow('lich_su_vi_pham.ky_luat_quan_doi', idx, 'hinh_thuc', e.target.value)} disabled={isViewMode}/></td>
                                             {!isViewMode && <td className="p-1 text-center"><button onClick={() => removeRow('lich_su_vi_pham.ky_luat_quan_doi', idx)} className="text-red-500"><Trash2 size={14}/></button></td>}
                                         </tr>
                                     ))}
                                 </tbody>
                             </table>
                             {!isViewMode && <button onClick={() => addRow('lich_su_vi_pham.ky_luat_quan_doi', {nam: '', noi_dung: '', hinh_thuc: ''})} className="text-[10px] uppercase font-bold text-green-700 hover:bg-green-50 px-2 py-1 rounded border border-green-200">+ Thêm dòng</button>}
                        </div>

                        {/* Vi phạm pháp luật */}
                        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
                             <h3 className="font-bold text-red-800 uppercase text-xs mb-3 flex items-center gap-2"><AlertTriangle size={14}/> V. VI PHẠM PHÁP LUẬT</h3>
                             <table className="w-full text-xs text-left mb-2">
                                 <thead className="bg-gray-100 uppercase text-gray-500 font-bold">
                                     <tr>
                                         <th className="p-2 w-16">Năm</th>
                                         <th className="p-2">Nội dung vi phạm</th>
                                         <th className="p-2">Hình thức xử lý</th>
                                         {!isViewMode && <th className="p-2 w-8"></th>}
                                     </tr>
                                 </thead>
                                 <tbody className="divide-y">
                                     {/* @ts-ignore */}
                                     {(formData.lich_su_vi_pham?.vi_pham_phap_luat || []).length === 0 && <tr><td colSpan={4} className="p-3 text-center text-gray-400 italic">Chưa có vi phạm</td></tr>}
                                     {/* @ts-ignore */}
                                     {(formData.lich_su_vi_pham?.vi_pham_phap_luat || []).map((vp, idx) => (
                                         <tr key={idx}>
                                             <td className="p-1"><input className="w-full p-1 border rounded" value={vp.nam} onChange={e => updateRow('lich_su_vi_pham.vi_pham_phap_luat', idx, 'nam', e.target.value)} disabled={isViewMode} placeholder="Năm"/></td>
                                             <td className="p-1"><input className="w-full p-1 border rounded" value={vp.noi_dung} onChange={e => updateRow('lich_su_vi_pham.vi_pham_phap_luat', idx, 'noi_dung', e.target.value)} disabled={isViewMode}/></td>
                                             <td className="p-1"><input className="w-full p-1 border rounded" value={vp.hinh_thuc} onChange={e => updateRow('lich_su_vi_pham.vi_pham_phap_luat', idx, 'hinh_thuc', e.target.value)} disabled={isViewMode}/></td>
                                             {!isViewMode && <td className="p-1 text-center"><button onClick={() => removeRow('lich_su_vi_pham.vi_pham_phap_luat', idx)} className="text-red-500"><Trash2 size={14}/></button></td>}
                                         </tr>
                                     ))}
                                 </tbody>
                             </table>
                             {!isViewMode && <button onClick={() => addRow('lich_su_vi_pham.vi_pham_phap_luat', {nam: '', noi_dung: '', hinh_thuc: ''})} className="text-[10px] uppercase font-bold text-red-700 hover:bg-red-50 px-2 py-1 rounded border border-red-200">+ Thêm dòng</button>}
                        </div>
                    </div>
                </div>
            )}

            {/* TAB 6: TÀI CHÍNH & SỨC KHỎE - ĐÃ NÂNG CẤP CHI TIẾT */}
            {activeTab === 6 && (
              <div className="space-y-8 animate-fade-in">
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    
                    {/* 1. Kinh doanh */}
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200 h-full flex flex-col">
                       <h3 className={sectionTitle}><Briefcase size={18}/> I. KINH DOANH & ĐẦU TƯ</h3>
                       <div className="space-y-4 flex-1">
                          <label className="flex items-center gap-2 cursor-pointer p-4 bg-green-50/50 rounded-lg border border-green-100 hover:bg-green-100 transition-colors">
                             <input type="checkbox" checked={formData.tai_chinh_suc_khoe?.kinh_doanh?.co_khong} onChange={e => updateNested('tai_chinh_suc_khoe.kinh_doanh.co_khong', e.target.checked)} disabled={isViewMode} className="w-5 h-5 accent-green-600" />
                             <div className="flex-1"><span className="font-bold text-gray-800 text-sm block">Có tham gia Kinh doanh / Đầu tư</span><span className="text-xs text-gray-500 block mt-1">Bao gồm kinh doanh online, BĐS, góp vốn...</span></div>
                          </label>
                          {formData.tai_chinh_suc_khoe?.kinh_doanh?.co_khong && (
                             <div className="animate-slide-in space-y-3 bg-gray-50 p-4 rounded-xl border border-gray-100">
                                <div className="grid grid-cols-2 gap-3">
                                    <div><label className={labelBase}>Mô hình</label><select 
                                            // @ts-ignore
                                            value={formData.tai_chinh_suc_khoe?.kinh_doanh?.hinh_thuc} 
                                            onChange={e => updateNested('tai_chinh_suc_khoe.kinh_doanh.hinh_thuc', e.target.value)}
                                            disabled={isViewMode}
                                            className={inputBase}
                                        >
                                            <option value="">-- Chọn --</option>
                                            <option value="Online">Online</option>
                                            <option value="Cửa hàng">Cửa hàng</option>
                                            <option value="Bất động sản">Bất động sản</option>
                                            <option value="Chứng khoán/Coin">Chứng khoán/Coin</option>
                                            <option value="Góp vốn">Góp vốn</option>
                                            <option value="Khác">Khác</option>
                                        </select>
                                    </div>
                                    <div><label className={labelBase}>Loại hình</label>
                                        {/* @ts-ignore */}
                                        <input className={inputBase} placeholder="VD: Quần áo, Cafe..." value={formData.tai_chinh_suc_khoe?.kinh_doanh?.loai_hinh} onChange={e => updateNested('tai_chinh_suc_khoe.kinh_doanh.loai_hinh', e.target.value)} disabled={isViewMode} />
                                    </div>
                                </div>
                                <div><label className={labelBase}>Vốn đầu tư (Ước tính)</label>
                                    {/* @ts-ignore */}
                                    <input className={inputBase} placeholder="VD: 500 triệu" value={formData.tai_chinh_suc_khoe?.kinh_doanh?.von} onChange={e => updateNested('tai_chinh_suc_khoe.kinh_doanh.von', e.target.value)} disabled={isViewMode} />
                                </div>
                                <div><label className={labelBase}>Địa điểm kinh doanh</label>
                                    {/* @ts-ignore */}
                                    <input className={inputBase} placeholder="Địa chỉ cụ thể" value={formData.tai_chinh_suc_khoe?.kinh_doanh?.dia_diem} onChange={e => updateNested('tai_chinh_suc_khoe.kinh_doanh.dia_diem', e.target.value)} disabled={isViewMode} />
                                </div>
                                <div className="grid grid-cols-2 gap-3">
                                    <div><label className={labelBase}>Đối tác chính</label>
                                        {/* @ts-ignore */}
                                        <input className={inputBase} placeholder="Tên đối tác" value={formData.tai_chinh_suc_khoe?.kinh_doanh?.doi_tac} onChange={e => updateNested('tai_chinh_suc_khoe.kinh_doanh.doi_tac', e.target.value)} disabled={isViewMode} />
                                    </div>
                                    <div><label className={labelBase}>SĐT Đối tác</label>
                                        {/* @ts-ignore */}
                                        <input className={inputBase} placeholder="Số ĐT" value={formData.tai_chinh_suc_khoe?.kinh_doanh?.sdt_doi_tac} onChange={e => updateNested('tai_chinh_suc_khoe.kinh_doanh.sdt_doi_tac', e.target.value)} disabled={isViewMode} />
                                    </div>
                                </div>
                             </div>
                          )}
                       </div>
                    </div>

                    {/* 2. Sức khỏe & Dịch bệnh */}
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200 h-full flex flex-col">
                       <h3 className={sectionTitle}><Activity size={18}/> II. TÌNH HÌNH SỨC KHỎE</h3>
                       <div className="space-y-6 flex-1">
                          {/* Chỉ số sinh tồn */}
                          <div className="bg-blue-50/50 p-4 rounded-xl border border-blue-100">
                              <div className="grid grid-cols-3 gap-4 mb-4">
                                  <div>
                                      <label className="text-[10px] font-bold text-gray-500 uppercase block mb-1 flex items-center gap-1"><Ruler size={10}/> Chiều cao</label>
                                      <div className="relative">
                                          {/* @ts-ignore */}
                                          <input className={`${inputBase} pr-8`} value={formData.tai_chinh_suc_khoe?.suc_khoe?.chieu_cao} onChange={e => updateNested('tai_chinh_suc_khoe.suc_khoe.chieu_cao', e.target.value)} disabled={isViewMode} placeholder="170"/>
                                          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400 font-bold">cm</span>
                                      </div>
                                  </div>
                                  <div>
                                      <label className="text-[10px] font-bold text-gray-500 uppercase block mb-1 flex items-center gap-1"><Scale size={10}/> Cân nặng</label>
                                      <div className="relative">
                                          {/* @ts-ignore */}
                                          <input className={`${inputBase} pr-8`} value={formData.tai_chinh_suc_khoe?.suc_khoe?.can_nang} onChange={e => updateNested('tai_chinh_suc_khoe.suc_khoe.can_nang', e.target.value)} disabled={isViewMode} placeholder="65"/>
                                          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400 font-bold">kg</span>
                                      </div>
                                  </div>
                                  <div>
                                      <label className="text-[10px] font-bold text-gray-500 uppercase block mb-1 flex items-center gap-1"><Stethoscope size={10}/> Phân loại</label>
                                      <select className={inputBase}
                                        // @ts-ignore
                                        value={formData.tai_chinh_suc_khoe?.suc_khoe?.phan_loai} 
                                        onChange={e => updateNested('tai_chinh_suc_khoe.suc_khoe.phan_loai', e.target.value)}
                                        disabled={isViewMode}
                                      >
                                          <option value="Loại 1">Loại 1</option>
                                          <option value="Loại 2">Loại 2</option>
                                          <option value="Loại 3">Loại 3</option>
                                          <option value="Loại 4">Loại 4</option>
                                          <option value="Loại 5">Loại 5</option>
                                      </select>
                                  </div>
                              </div>
                              <div>
                                <label className={labelBase}>Tiền sử bệnh lý cần lưu ý</label>
                                <textarea className={`${inputBase} h-20 resize-none`} placeholder="Ghi rõ nếu có bệnh dạ dày, huyết áp, xương khớp, tim mạch..." disabled={isViewMode}
                                    // @ts-ignore
                                    value={formData.tai_chinh_suc_khoe?.suc_khoe?.benh_ly || ''}
                                    onChange={e => updateNested('tai_chinh_suc_khoe.suc_khoe.benh_ly', e.target.value)}
                                />
                              </div>
                          </div>

                          {/* Covid */}
                          <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                             <div className="flex justify-between items-center mb-3">
                                <span className="font-bold text-gray-700 text-xs uppercase">Lịch sử nhiễm COVID-19</span>
                                <div className="flex gap-3">
                                   <label className="flex items-center gap-1 cursor-pointer text-xs font-bold"><input type="radio" name="covid" checked={!formData.tai_chinh_suc_khoe?.covid_ban_than?.da_mac} onChange={() => updateNested('tai_chinh_suc_khoe.covid_ban_than.da_mac', false)} disabled={isViewMode} /> Chưa mắc</label>
                                   <label className="flex items-center gap-1 cursor-pointer text-xs font-bold"><input type="radio" name="covid" checked={!!formData.tai_chinh_suc_khoe?.covid_ban_than?.da_mac} onChange={() => updateNested('tai_chinh_suc_khoe.covid_ban_than.da_mac', true)} disabled={isViewMode} /> Đã mắc</label>
                                </div>
                             </div>
                             {formData.tai_chinh_suc_khoe?.covid_ban_than?.da_mac && (
                                <input className={inputBase} placeholder="Thời gian mắc và tình trạng (VD: 08/2021, tiêm 3 mũi)" value={formData.tai_chinh_suc_khoe?.covid_ban_than?.thoi_gian} onChange={e => updateNested('tai_chinh_suc_khoe.covid_ban_than.thoi_gian', e.target.value)} disabled={isViewMode} />
                             )}
                          </div>
                       </div>
                    </div>
                 </div>
              </div>
            )}

            {/* TAB 7: CAM KẾT */}
            {activeTab === 7 && (
                <div className="max-w-4xl mx-auto space-y-8 animate-fade-in bg-white p-10 rounded-3xl shadow-xl border border-gray-100">
                    <div className="text-center space-y-2 mb-8 border-b-2 border-gray-100 pb-6">
                      <h3 className="font-black text-2xl uppercase text-[#14452F] tracking-widest">Tâm Tư & Nguyện Vọng</h3>
                      <p className="text-sm text-gray-500 italic">Dành cho quân nhân trình bày ý kiến cá nhân, đề xuất hoặc khó khăn cần giúp đỡ</p>
                    </div>

                    <div className="relative">
                      <textarea className="w-full h-96 p-8 bg-[#fffff8] border-2 border-gray-200 rounded-2xl focus:ring-4 focus:ring-yellow-100 focus:border-yellow-400 outline-none text-base leading-relaxed text-gray-800 shadow-inner font-serif" placeholder="Viết nội dung tại đây..." value={formData.y_kien_nguyen_vong} onChange={e => setFormData({...formData, y_kien_nguyen_vong: e.target.value})} disabled={isViewMode} />
                      <div className="absolute top-4 right-4 text-gray-300 pointer-events-none"><FileText size={48} opacity={0.1}/></div>
                    </div>
                    
                    <div className="space-y-6">
                      <h4 className="text-sm font-black text-red-700 uppercase tracking-widest text-center">III. CAM ĐOAN</h4>
                      <div className="py-10 px-2 bg-red-50/30 border-2 border-red-100 rounded-[2.5rem] italic text-[10px] md:text-[11px] text-red-900 text-center leading-relaxed font-bold shadow-sm whitespace-nowrap overflow-hidden text-ellipsis">"Tôi xin cam đoan những lời khai trên là đúng sự thật, nếu có gì sai trái tôi xin chịu hoàn toàn trách nhiệm trước pháp luật và kỷ luật Quân đội."</div>
                    </div>
                </div>
            )}

        </div>

        {/* FOOTER ACTIONS */}
        <div className="p-6 bg-gray-50 border-t flex justify-end gap-4 shrink-0 shadow-[0_-4px_20px_rgba(0,0,0,0.05)]">
            <button onClick={onClose} className="px-10 py-4 bg-gray-200 text-gray-800 rounded-2xl font-black uppercase text-xs tracking-widest hover:bg-gray-300 transition-all border border-gray-300">{isViewMode ? 'Đóng' : 'Hủy bỏ'}</button>
            {!isViewMode && <button onClick={handleSave} className="px-16 py-4 bg-[#14452F] text-white rounded-2xl font-black uppercase text-xs tracking-widest hover:bg-[#1b5c3f] shadow-lg hover:shadow-green-900/30 transition-all flex items-center gap-3 transform hover:-translate-y-1"><Save size={18} /> Lưu hồ sơ</button>}
        </div>

      </div>
    </div>
  );
};

export default PersonnelForm;