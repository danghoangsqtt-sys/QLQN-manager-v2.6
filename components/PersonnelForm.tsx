import React, { useState, useEffect, useRef } from 'react';
import { MilitaryPersonnel, Unit, CustomField } from '../types';
import { db } from '../store';
import { Trash2, Plus, Camera, X, Calendar as CalendarIcon, AlertTriangle, CheckCircle, Info, ShieldAlert } from 'lucide-react';
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
  trinh_do_van_hoa: '12/12', da_tot_nghiep: false, nang_khieu_so_truong: '',
  anh_dai_dien: '',
  nghi_phep_thuc_te: 0,
  nghi_phep_tham_chieu: 12,
  tieu_su_ban_than: [{ time: '', job: '', place: '' }],
  mang_xa_hoi: { facebook: [], zalo: [], tiktok: [] },
  hoan_canh_song: { song_chung_voi: '', chi_tiet_nguoi_nuoi_duong: null, ly_do_khong_song_cung_bo_me: '' },
  quan_he_gia_dinh: { 
      cha_me_anh_em: [], 
      vo: null, 
      con: [], 
      nguoi_yeu: [] 
  },
  thong_tin_gia_dinh_chung: { 
      muc_song: 'Đủ ăn', 
      nghe_nghiep_chinh: '', 
      lich_su_vi_pham_nguoi_than: { co_khong: false, chi_tiet: '' }, 
      lich_su_covid_gia_dinh: '' 
  },
  yeu_to_nuoc_ngoai: { 
      than_nhan: [], 
      di_nuoc_ngoai: [], 
      ho_chieu: { da_co: false, du_dinh_nuoc: '' }, 
      xuat_canh_dinh_cu: { dang_lam_thu_tuc: false, nuoc: '', nguoi_bao_lanh: '' } 
  },
  lich_su_vi_pham: { 
    vi_pham_dia_phuong: { co_khong: false, noi_dung: '', ket_qua: '' },
    danh_bac: { co_khong: false, hinh_thuc: '', dia_diem: '', doi_tuong: '' },
    ma_tuy: { co_khong: false, thoi_gian: '', loai: '', so_lan: '', doi_tuong: '', xu_ly: '', hinh_thuc_xu_ly: '' }
  },
  tai_chinh_suc_khoe: { 
    vay_no: { co_khong: false, ai_vay: '', nguoi_dung_ten: '', so_tien: '', muc_dich: '', hinh_thuc: '', han_tra: '', gia_dinh_biet: false, nguoi_tra: '' },
    kinh_doanh: { co_khong: false, chi_tiet: '' },
    covid_ban_than: { da_mac: false, thoi_gian: '' }
  },
  custom_data: {},
  y_kien_nguyen_vong: '',
  vi_pham_nuoc_ngoai: ''
};

// --- HELPER FUNCTION CHO NGÀY THÁNG ---
// Chuyển từ YYYY-MM-DD (Database) -> DD/MM/YYYY (Hiển thị)
const toDisplayDate = (isoDate: string | undefined) => {
  if (!isoDate) return '';
  const [y, m, d] = isoDate.split('-');
  if (!y || !m || !d) return isoDate;
  return `${d}/${m}/${y}`;
};

// Chuyển từ DD/MM/YYYY (Nhập liệu) -> YYYY-MM-DD (Database)
const toIsoDate = (displayDate: string) => {
  if (!displayDate) return '';
  const parts = displayDate.split('/');
  if (parts.length !== 3) return '';
  const [d, m, y] = parts;
  return `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
};

// --- COMPONENT NHẬP NGÀY THÁNG VIỆT NAM (CUSTOM) ---
const VietnamDateInput: React.FC<{
  value: string | undefined;
  onChange: (newIsoDate: string) => void;
  disabled?: boolean;
  className?: string;
}> = ({ value, onChange, disabled, className }) => {
  const [displayValue, setDisplayValue] = useState(toDisplayDate(value));
  const hiddenDateInputRef = useRef<HTMLInputElement>(null);

  // Đồng bộ khi value bên ngoài thay đổi
  useEffect(() => {
    setDisplayValue(toDisplayDate(value));
  }, [value]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let val = e.target.value;
    
    // Logic tự động thêm dấu / khi nhập số
    // Chỉ cho phép nhập số và dấu /
    val = val.replace(/[^0-9/]/g, '');
    
    // Tự động thêm / sau ngày và tháng nếu người dùng đang nhập liền mạch
    if (val.length === 2 && !val.includes('/')) val += '/';
    if (val.length === 5 && val.split('/').length === 2) val += '/';
    
    setDisplayValue(val);

    // Nếu nhập đủ format dd/mm/yyyy -> Update ngược lại value gốc
    if (val.length === 10) {
      const iso = toIsoDate(val);
      if (iso) onChange(iso);
    } else if (val === '') {
      onChange('');
    }
  };

  const handleDateIconClick = () => {
    if (!disabled && hiddenDateInputRef.current) {
        hiddenDateInputRef.current.showPicker();
    }
  };

  const handleHiddenDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const isoDate = e.target.value;
    onChange(isoDate); // Cập nhật value gốc
    setDisplayValue(toDisplayDate(isoDate)); // Cập nhật hiển thị
  };

  return (
    <div className="relative w-full">
      <input
        type="text"
        disabled={disabled}
        className={`${className} pr-10`} // Chừa chỗ cho icon
        placeholder="dd/mm/yyyy"
        maxLength={10}
        value={displayValue}
        onChange={handleInputChange}
        onBlur={() => {
           // Khi blur, nếu format đúng thì giữ, sai thì reset về value cũ
           const iso = toIsoDate(displayValue);
           if (!iso && displayValue !== '') {
               setDisplayValue(toDisplayDate(value)); 
           }
        }}
      />
      
      {/* Nút icon lịch - Bấm vào sẽ mở popup chọn ngày của trình duyệt */}
      <div 
        onClick={handleDateIconClick}
        className={`absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-green-600 cursor-pointer p-1 ${disabled ? 'hidden' : ''}`}
      >
        <CalendarIcon size={16} />
      </div>

      {/* Input date ẩn để dùng native picker của trình duyệt */}
      <input
        ref={hiddenDateInputRef}
        type="date"
        className="absolute inset-0 opacity-0 pointer-events-none w-0 h-0"
        value={value || ''}
        onChange={handleHiddenDateChange}
        tabIndex={-1}
      />
    </div>
  );
};

// --- PHẦN MỚI: CẤU HÌNH TOAST (HUD STYLE) ---
type ToastType = 'success' | 'error' | 'warning' | 'info';
interface ToastMessage { id: number; type: ToastType; title: string; message: string; }

const MilitaryToast: React.FC<{ toasts: ToastMessage[]; removeToast: (id: number) => void }> = ({ toasts, removeToast }) => {
  return (
    <div className="absolute top-4 right-4 z-[300] flex flex-col gap-3 w-80 pointer-events-none">
      {toasts.map((toast) => (
        <div key={toast.id} className={`pointer-events-auto relative overflow-hidden bg-[#0F291E] border-l-4 shadow-2xl rounded-sm transform transition-all duration-500 hover:scale-105 ${toast.type === 'error' ? 'border-red-600' : toast.type === 'success' ? 'border-yellow-500' : 'border-blue-500'}`}>
          {/* Hiệu ứng quét ngang (Scanline) */}
          <div className="absolute inset-0 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] z-0 bg-[length:100%_2px,3px_100%] pointer-events-none"></div>
          <div className="p-4 flex gap-3 relative z-10">
            <div className={`mt-1 ${toast.type === 'error' ? 'text-red-500' : toast.type === 'success' ? 'text-yellow-500' : 'text-blue-400'}`}>
               {toast.type === 'success' && <CheckCircle size={20} />}
               {toast.type === 'error' && <AlertTriangle size={20} />}
               {toast.type === 'info' && <Info size={20} />}
            </div>
            <div className="flex-1">
              <h4 className={`text-xs font-black uppercase tracking-widest ${toast.type === 'error' ? 'text-red-500' : toast.type === 'success' ? 'text-yellow-500' : 'text-blue-400'}`}>{toast.title}</h4>
              <p className="text-[11px] font-mono text-gray-300 mt-1 leading-tight">{toast.message}</p>
            </div>
            <button onClick={() => removeToast(toast.id)} className="text-gray-500 hover:text-white transition-colors self-start"><X size={14} /></button>
          </div>
          {/* Thanh thời gian chạy bên dưới */}
          <div className={`h-0.5 w-full bg-gray-700/50 absolute bottom-0 left-0`}>
             <div className={`h-full transition-all duration-[4000ms] ease-linear w-0 ${toast.type === 'error' ? 'bg-red-600' : 'bg-yellow-500'}`} style={{width: '100%'}}></div>
          </div>
        </div>
      ))}
    </div>
  );
};

const PersonnelForm: React.FC<PersonnelFormProps> = ({ units, onClose, initialData, isViewMode = false }) => {
  const [activeTab, setActiveTab] = useState(1);
  // --- STATE CHO TOAST ---
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const showToast = (type: ToastType, title: string, message: string) => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, type, title, message }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 4000); // Tự tắt sau 4s
  };
  const [customFields, setCustomFields] = useState<CustomField[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [formData, setFormData] = useState<Partial<MilitaryPersonnel>>(
    initialData ? structuredClone(initialData) : structuredClone(DEFAULT_DATA)
  );

  useEffect(() => {
    if (initialData) {
      setFormData(structuredClone(initialData));
    } else {
      setFormData(structuredClone(DEFAULT_DATA));
    }
  }, [initialData]);

  useEffect(() => {
    if (formData.don_vi_id) {
      setCustomFields(db.getCustomFields(formData.don_vi_id));
    }
  }, [formData.don_vi_id]);

  // --- HÀM XỬ LÝ ẢNH MỚI (ĐÃ CÓ TẠO THUMBNAIL) ---
  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (isViewMode) return;
    const file = event.target.files?.[0];
    
    if (file) {
      // 1. Kiểm tra dung lượng (5MB)
      if (file.size > 5 * 1024 * 1024) {
        showToast('error', 'LỖI TẢI ẢNH', 'Kích thước file quá lớn (Tối đa 5MB).');
        return;
      }

      const reader = new FileReader();
      
      // 2. Xử lý khi đọc xong file
      reader.onload = async (e) => {
        const base64String = e.target?.result as string;
        
        try {
            // Thông báo đang xử lý (vì tạo thumb có thể mất 1 chút thời gian)
            showToast('info', 'ĐANG XỬ LÝ', 'Đang tạo ảnh thu nhỏ...');

            // Gọi hàm tạo thumbnail từ Bước 1
            const thumbString = await createThumbnail(base64String, 200);

            // Lưu cả ảnh gốc và ảnh thumb vào form
            setFormData(prev => ({ 
                ...prev, 
                anh_dai_dien: base64String,
                anh_thumb: thumbString  // <--- Dòng quan trọng mới thêm
            }));

            showToast('success', 'THÀNH CÔNG', 'Đã cập nhật ảnh đại diện.');
        } catch (error) {
            console.error(error);
            // Nếu lỗi tạo thumb thì vẫn lưu ảnh gốc
            setFormData(prev => ({ ...prev, anh_dai_dien: base64String }));
            showToast('warning', 'CẢNH BÁO', 'Đã lưu ảnh nhưng không tạo được thumbnail.');
        }
      };
      
      reader.readAsDataURL(file);
    }
  };

  const handleSave = () => {
    if (isViewMode) return;

    // Kiểm tra dữ liệu
    if (!formData.ho_ten || !formData.cccd || !formData.don_vi_id) {
      showToast('error', 'THIẾU THÔNG TIN', 'Vui lòng điền các trường bắt buộc (*): Họ tên, CCCD, Đơn vị.');
      return;
    }
    
    const unitName = units.find(u => u.id === formData.don_vi_id)?.name || '';
    const finalData = { ...formData, don_vi: unitName };
    
    const save = async () => {
        try {
            if (initialData && initialData.id) {
                await db.updatePersonnel(initialData.id, finalData);
                showToast('success', 'CẬP NHẬT THÀNH CÔNG', `Đã lưu hồ sơ đồng chí ${finalData.ho_ten}.`);
            } else {
                await db.addPersonnel({ 
                    ...finalData as MilitaryPersonnel, 
                    id: Date.now().toString(), 
                });
                showToast('success', 'THÊM MỚI THÀNH CÔNG', `Đã tạo hồ sơ cho đồng chí ${finalData.ho_ten}.`);
            }
            setTimeout(() => onClose(), 1500); // Đợi 1.5s để người dùng đọc thông báo rồi mới đóng
        } catch (e: any) {
            showToast('error', 'LỖI HỆ THỐNG', 'Không thể lưu vào CSDL: ' + e.message);
        }
    };
    save();
  };

  const updateNested = (path: string, value: any) => {
    if (isViewMode) return;
    setFormData(prev => {
      const updated = structuredClone(prev);
      const keys = path.split('.');
      let current: any = updated;
      for (let i = 0; i < keys.length - 1; i++) {
        const key = keys[i];
        if (!current[key]) current[key] = {};
        current = current[key];
      }
      current[keys[keys.length - 1]] = value;
      return updated;
    });
  };

  const addRow = (path: string, template: any) => {
    if (isViewMode) return;
    setFormData(prev => {
        const updated = structuredClone(prev);
        const keys = path.split('.');
        let current: any = updated;
        for (const k of keys) {
            if (!current[k]) current[k] = [];
            current = current[k];
        }
        if (Array.isArray(current)) {
            current.push(template);
        }
        return updated;
    });
  };

  const removeRow = (path: string, index: number) => {
    if (isViewMode) return;
    setFormData(prev => {
        const updated = structuredClone(prev);
        const keys = path.split('.');
        let current: any = updated;
        for (let i = 0; i < keys.length; i++) {
             if (!current[keys[i]]) return prev;
             current = current[keys[i]];
        }
        if (Array.isArray(current)) {
             current.splice(index, 1);
        }
        return updated;
    });
  };

  // STYLE CHUNG
  const inputClass = "w-full p-2 border border-gray-200 rounded-md outline-none disabled:bg-gray-50 disabled:text-black disabled:font-medium disabled:opacity-100";
  const inputClassBold = "w-full p-2 border border-gray-200 rounded-md outline-none font-bold disabled:bg-gray-50 disabled:text-black disabled:opacity-100";

  return (
    <div className="bg-[#f4f6f8] w-full max-w-7xl max-h-[95vh] rounded-3xl shadow-2xl overflow-hidden flex flex-col border-2 border-[#14452F] animate-fade-in relative z-[200]">
      
      {/* --- HIỂN THỊ TOAST (HUD) TẠI ĐÂY --- */}
      <MilitaryToast toasts={toasts} removeToast={(id) => setToasts(t => t.filter(x => x.id !== id))} />

      {/* --- DẢI BĂNG BẢO MẬT (SECURITY TAPE) --- */}
      {isViewMode && (
          <div className="w-full h-8 flex items-center justify-center overflow-hidden relative shadow-md"
            style={{ background: 'repeating-linear-gradient(45deg, #FCD34D, #FCD34D 10px, #1F2937 10px, #1F2937 20px)' }}>
              <div className="bg-white/90 px-6 py-0.5 rounded-full border-2 border-black z-10 shadow-lg">
                 <span className="text-black font-black uppercase text-[10px] tracking-[0.2em] flex items-center gap-2">
                    <ShieldAlert size={12} className="text-red-600"/>
                    Chế độ Chỉ Xem - Restricted View Mode
                    <ShieldAlert size={12} className="text-red-600"/>
                 </span>
              </div>
          </div>
      )}

      {/* Navbar Tab */}
      <div className="bg-white flex overflow-x-auto border-b shrink-0 px-2 pt-2 gap-1 scrollbar-hide">
        {[
          { id: 1, label: '1. Thông Tin Chung' },
          { id: 2, label: '2. Tiểu Sử & MXH' },
          { id: 3, label: '3. Gia Đình & Hôn Nhân' },
          { id: 4, label: '4. Yếu Tố Nước Ngoài' },
          { id: 5, label: '5. Lịch Sử & Tệ Nạn', danger: true },
          { id: 6, label: '6. Tài Chính & Sức Khỏe', danger: true },
          { id: 7, label: '7. Cam Kết & Nguyện Vọng' },
          
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-3 text-[11px] font-bold uppercase transition-all border-b-2 whitespace-nowrap ${
              activeTab === tab.id 
              ? 'border-[#14452F] text-[#14452F] bg-green-50/50' 
              : `border-transparent text-gray-500 hover:text-gray-700 ${tab.danger ? 'hover:text-red-600' : ''}`
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto p-8 bg-white space-y-10 scrollbar-hide">
        
        {/* --- TAB 1: THÔNG TIN CHUNG --- */}
        {activeTab === 1 && (
          <div className="animate-fade-in space-y-10">
            <section>
              <h3 className="flex items-center gap-2 text-[#14452F] font-black uppercase text-xs mb-6">
                Thông tin cơ bản
              </h3>
              <div className="grid grid-cols-12 gap-6">
                <div className="col-span-12 md:col-span-2 flex flex-col items-center">
                  
                  {/* ẢNH ĐẠI DIỆN */}
                  <div className="w-32 h-44 border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center bg-gray-50 mb-3 relative overflow-hidden group">
                    {formData.anh_dai_dien ? (
                        <img src={formData.anh_dai_dien} className="w-full h-full object-cover" alt="Avatar" />
                    ) : (
                        <span className="text-gray-400 text-[10px] font-bold">Ảnh thẻ</span>
                    )}
                  </div>
                  
                  {!isViewMode && (
                      <>
                        <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleImageUpload} />
                        <button onClick={() => fileInputRef.current?.click()} className="px-4 py-1.5 border border-gray-300 rounded-md text-[10px] font-bold text-gray-600 flex items-center gap-1 hover:bg-gray-50 transition-colors">
                            <Camera size={14}/> Chọn ảnh
                        </button>
                        {formData.anh_dai_dien && (
                            <button onClick={() => setFormData(prev => ({...prev, anh_dai_dien: ''}))} className="mt-2 text-[10px] text-red-500 hover:underline">Xóa ảnh</button>
                        )}
                      </>
                  )}

                </div>
                <div className="col-span-12 md:col-span-10 grid grid-cols-3 gap-x-6 gap-y-4">
                  <div className="col-span-2">
                    <label className="block text-[10px] font-bold text-gray-600 mb-1">Họ và tên khai sinh <span className="text-red-500">*</span></label>
                    <input disabled={isViewMode} type="text" className={inputClassBold + " text-[#14452F] uppercase"} value={formData.ho_ten || ''} onChange={e => setFormData({...formData, ho_ten: e.target.value.toUpperCase()})} />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-gray-600 mb-1">Tên khác (nếu có)</label>
                    <input disabled={isViewMode} type="text" className={inputClass} value={formData.ten_khac || ''} onChange={e => setFormData({...formData, ten_khac: e.target.value})} />
                  </div>
                  
                  {/* --- SỬ DỤNG VietnamDateInput --- */}
                  <div>
                    <label className="block text-[10px] font-bold text-gray-600 mb-1">Ngày sinh <span className="text-red-500">*</span></label>
                    <VietnamDateInput 
                        disabled={isViewMode}
                        value={formData.ngay_sinh} 
                        onChange={(iso) => setFormData({...formData, ngay_sinh: iso})}
                        className={inputClass + " font-medium"}
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-gray-600 mb-1">CCCD/CMND <span className="text-red-500">*</span></label>
                    <input disabled={isViewMode} type="text" className={inputClassBold} value={formData.cccd || ''} onChange={e => setFormData({...formData, cccd: e.target.value})} />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-gray-600 mb-1">SĐT Cá nhân</label>
                    <input disabled={isViewMode} type="text" className={inputClass} placeholder="Số thường dùng" value={formData.sdt_rieng || ''} onChange={e => setFormData({...formData, sdt_rieng: e.target.value})} />
                  </div>
                  <div className="col-span-3">
                    <label className="block text-[10px] font-bold text-gray-600 mb-1">HKTT</label>
                    <textarea disabled={isViewMode} className={inputClass + " text-xs"} rows={2} placeholder="Ghi cụ thể địa chỉ thường trú..." value={formData.ho_khau_thu_tru || ''} onChange={e => setFormData({...formData, ho_khau_thu_tru: e.target.value})} />
                  </div>

                  <div className="p-3 bg-green-50 rounded-xl border border-green-100 col-span-3 grid grid-cols-2 gap-4">
                     <div>
                        <label className="block text-[10px] font-black text-green-700 mb-1 uppercase tracking-widest">Nghỉ phép thực tế (ngày)</label>
                        <input disabled={isViewMode} type="number" className="w-full p-2 bg-white border border-green-200 rounded-lg outline-none font-bold text-green-700 disabled:bg-white disabled:text-green-800 disabled:opacity-100" value={formData.nghi_phep_thuc_te} onChange={e => setFormData({...formData, nghi_phep_thuc_te: parseInt(e.target.value) || 0})} />
                     </div>
                     <div>
                        <label className="block text-[10px] font-black text-green-700 mb-1 uppercase tracking-widest">Nghỉ phép tham chiếu (ngày)</label>
                        <input disabled={isViewMode} type="number" className="w-full p-2 bg-white border border-green-200 rounded-lg outline-none font-bold text-green-700 disabled:bg-white disabled:text-green-800 disabled:opacity-100" value={formData.nghi_phep_tham_chieu} onChange={e => setFormData({...formData, nghi_phep_tham_chieu: parseInt(e.target.value) || 0})} />
                     </div>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-gray-600 mb-1">Nơi sinh</label>
                    <input disabled={isViewMode} type="text" className={inputClass} value={formData.noi_sinh || ''} onChange={e => setFormData({...formData, noi_sinh: e.target.value})} />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-gray-600 mb-1">Dân tộc</label>
                    <input disabled={isViewMode} type="text" className={inputClass} value={formData.dan_toc || ''} onChange={e => setFormData({...formData, dan_toc: e.target.value})} />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-gray-600 mb-1">Tôn giáo</label>
                    <input disabled={isViewMode} type="text" className={inputClass} value={formData.ton_giao || ''} onChange={e => setFormData({...formData, ton_giao: e.target.value})} />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-gray-600 mb-1">Trình độ học vấn</label>
                    <input disabled={isViewMode} type="text" className={inputClass} placeholder="12/12" value={formData.trinh_do_van_hoa || ''} onChange={e => setFormData({...formData, trinh_do_van_hoa: e.target.value})} />
                  </div>
                  <div className="flex flex-col justify-center">
                    <label className="block text-[10px] font-bold text-gray-600 mb-1">Đã tốt nghiệp chưa?</label>
                    <div className="flex gap-4">
                      <label className="flex items-center gap-1.5 text-xs cursor-pointer"><input disabled={isViewMode} type="radio" checked={!!formData.da_tot_nghiep} onChange={() => setFormData({...formData, da_tot_nghiep: true})} className="w-3 h-3 accent-[#14452F]" /> Đã TN</label>
                      <label className="flex items-center gap-1.5 text-xs cursor-pointer"><input disabled={isViewMode} type="radio" checked={!formData.da_tot_nghiep} onChange={() => setFormData({...formData, da_tot_nghiep: false})} className="w-3 h-3 accent-[#14452F]" /> Chưa TN</label>
                    </div>
                  </div>
                  <div className="col-span-1">
                    <label className="block text-[10px] font-bold text-gray-600 mb-1">Năng khiếu/Sở trường</label>
                    <textarea disabled={isViewMode} className={inputClass + " text-xs"} rows={1} placeholder="Vẽ, đàn, hát, sửa chữa..." value={formData.nang_khieu_so_truong || ''} onChange={e => setFormData({...formData, nang_khieu_so_truong: e.target.value})} />
                  </div>
                </div>
              </div>
            </section>

            <section className="border-t pt-8">
              <h3 className="flex items-center gap-2 text-[#14452F] font-black uppercase text-xs mb-6">Đơn vị & Tổ chức</h3>
              <div className="grid grid-cols-5 gap-6">
                <div className="col-span-2">
                  <label className="block text-[10px] font-bold text-gray-600 mb-1">Đơn vị <span className="text-red-500">*</span></label>
                  <select disabled={isViewMode} className={inputClassBold} value={formData.don_vi_id || ''} onChange={e => setFormData({...formData, don_vi_id: e.target.value})}>
                    <option value="">-- Chọn đơn vị --</option>
                    {units.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-gray-600 mb-1">Cấp bậc</label>
                  <select disabled={isViewMode} className={inputClassBold} value={formData.cap_bac || 'Binh nhì'} onChange={e => setFormData({...formData, cap_bac: e.target.value})}>
                    <option>Binh nhì</option><option>Binh nhất</option><option>Hạ sĩ</option><option>Trung sĩ</option><option>Thượng sĩ</option><option>Thiếu úy</option><option>Trung úy</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-gray-600 mb-1">Chức vụ</label>
                  <input disabled={isViewMode} type="text" className={inputClass} value={formData.chuc_vu || ''} onChange={e => setFormData({...formData, chuc_vu: e.target.value})} />
                </div>
                
                {/* --- DATE INPUTS ĐỒNG BỘ --- */}
                <div>
                  <label className="block text-[10px] font-bold text-gray-600 mb-1">Ngày nhập ngũ</label>
                  <VietnamDateInput 
                    disabled={isViewMode}
                    className={inputClass} 
                    value={formData.nhap_ngu_ngay} 
                    onChange={iso => setFormData({...formData, nhap_ngu_ngay: iso})} 
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-gray-600 mb-1">Ngày vào Đoàn</label>
                  <VietnamDateInput 
                    disabled={isViewMode}
                    className={inputClass} 
                    value={formData.ngay_vao_doan} 
                    onChange={iso => setFormData({...formData, ngay_vao_doan: iso})} 
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-gray-600 mb-1">Ngày vào Đảng</label>
                  <VietnamDateInput 
                    disabled={isViewMode}
                    className={inputClass} 
                    value={formData.vao_dang_ngay} 
                    onChange={iso => setFormData({...formData, vao_dang_ngay: iso})} 
                  />
                </div>
              </div>
            </section>
          </div>
        )}

        {/* --- TAB 2: TIỂU SỬ & MXH --- */}
        {activeTab === 2 && (
          <div className="animate-fade-in space-y-10">
            <section>
              <h3 className="flex items-center gap-2 text-[#14452F] font-black uppercase text-xs mb-6">
                Quá trình từ 10 tuổi đến nhập ngũ
              </h3>
              <div className="border border-gray-100 rounded-lg overflow-hidden shadow-sm mb-4">
                <table className="w-full text-xs">
                  <thead className="bg-gray-50 text-gray-500 font-bold border-b">
                    <tr>
                      <th className="p-3 text-left w-1/4 border-r">Thời gian</th>
                      <th className="p-3 text-left w-2/4 border-r">Làm gì? Chức vụ?</th>
                      <th className="p-3 text-left w-1/4 border-r">Ở đâu?</th>
                      {!isViewMode && <th className="w-10"></th>}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {(formData.tieu_su_ban_than || []).map((row, idx) => (
                      <tr key={idx}>
                        <td className="p-2 border-r"><input disabled={isViewMode} type="text" className={inputClass} value={row.time} onChange={e => {
                          const updated = [...(formData.tieu_su_ban_than || [])]; updated[idx].time = e.target.value; updateNested('tieu_su_ban_than', updated);
                        }} /></td>
                        <td className="p-2 border-r"><input disabled={isViewMode} type="text" className={inputClass} value={row.job} onChange={e => {
                          const updated = [...(formData.tieu_su_ban_than || [])]; updated[idx].job = e.target.value; updateNested('tieu_su_ban_than', updated);
                        }} /></td>
                        <td className="p-2 border-r"><input disabled={isViewMode} type="text" className={inputClass} value={row.place} onChange={e => {
                          const updated = [...(formData.tieu_su_ban_than || [])]; updated[idx].place = e.target.value; updateNested('tieu_su_ban_than', updated);
                        }} /></td>
                        {!isViewMode && (
                            <td className="p-2 text-center"><button onClick={() => removeRow('tieu_su_ban_than', idx)} className="text-red-400 hover:text-red-600"><Trash2 size={14}/></button></td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {!isViewMode && (
                  <button onClick={() => addRow('tieu_su_ban_than', {time: '', job: '', place: ''})} className="px-4 py-2 border-2 border-blue-50 text-blue-600 rounded-lg text-[10px] font-bold uppercase hover:bg-blue-50 transition-all flex items-center gap-1"><Plus size={14}/> Thêm mốc thời gian</button>
              )}
            </section>

            <section>
              <h3 className="flex items-center gap-2 text-[#14452F] font-black uppercase text-xs mb-6">Mạng Xã Hội</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {(['facebook', 'zalo', 'tiktok'] as const).map(type => (
                  <div key={type} className="bg-gray-50/50 p-5 rounded-xl border border-gray-100">
                    <div className="flex justify-between items-center mb-4">
                      <span className="text-[11px] font-bold text-gray-700 uppercase flex items-center gap-2">{type}</span>
                    </div>
                    <div className="space-y-3">
                      {(formData.mang_xa_hoi?.[type] || []).map((acc, idx) => (
                        <div key={idx} className="flex gap-2 group animate-fade-in">
                          <input disabled={isViewMode} type="text" placeholder="Tên TK/ID" className={inputClass + " text-[10px]"} value={acc.name} onChange={e => {
                            const currentList = [...(formData.mang_xa_hoi?.[type] || [])];
                            currentList[idx] = { ...currentList[idx], name: e.target.value };
                            updateNested(`mang_xa_hoi.${type}`, currentList);
                          }} />
                          <input disabled={isViewMode} type="text" placeholder="SĐT ĐK" className={inputClass + " text-[10px]"} value={acc.phone} onChange={e => {
                            const currentList = [...(formData.mang_xa_hoi?.[type] || [])];
                            currentList[idx] = { ...currentList[idx], phone: e.target.value };
                            updateNested(`mang_xa_hoi.${type}`, currentList);
                          }} />
                          {!isViewMode && (
                              <button onClick={() => {
                                const currentList = [...(formData.mang_xa_hoi?.[type] || [])];
                                currentList.splice(idx, 1);
                                updateNested(`mang_xa_hoi.${type}`, currentList);
                              }} className="text-red-400 hover:text-red-600 transition-colors"><X size={14}/></button>
                          )}
                        </div>
                      ))}
                      {!isViewMode && (
                          <button onClick={() => {
                            const current = formData.mang_xa_hoi?.[type] || [];
                            updateNested(`mang_xa_hoi.${type}`, [...current, {name: '', phone: ''}]);
                          }} className="w-full py-2 border border-blue-200 rounded-lg text-blue-600 text-[10px] font-bold uppercase hover:bg-blue-50 transition-all">Thêm tài khoản</button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </div>
        )}

        {/* --- TAB 3: GIA ĐÌNH & HÔN NHÂN --- */}
        {activeTab === 3 && (
          <div className="animate-fade-in space-y-10">
            <section>
              <h3 className="flex items-center gap-2 text-[#14452F] font-black uppercase text-xs mb-6">Hoàn cảnh sống</h3>
              <div className="bg-gray-50/50 p-6 rounded-2xl border border-gray-100 space-y-6">
                <div>
                  <label className="block text-[11px] font-bold text-gray-700 uppercase mb-3">Sống chung với ai?</label>
                  <div className="flex gap-8">
                    {['Bố', 'Mẹ', 'Người nuôi dưỡng khác'].map(val => (
                      <label key={val} className="flex items-center gap-2 text-xs font-medium cursor-pointer">
                        <input disabled={isViewMode} type="checkbox" checked={(formData.hoan_canh_song?.song_chung_voi || '').includes(val)} onChange={e => {
                          let current = formData.hoan_canh_song?.song_chung_voi || '';
                          if (e.target.checked) current = current ? current + ', ' + val : val;
                          else current = current.split(', ').filter(v => v !== val).join(', ');
                          updateNested('hoan_canh_song.song_chung_voi', current);
                        }} className="w-4 h-4 rounded border-gray-300 accent-[#14452F]" />
                        {val}
                      </label>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-gray-700 uppercase mb-2">Lý do không sống chung với bố, mẹ (nếu có)</label>
                  <textarea disabled={isViewMode} className={inputClass} rows={2} value={formData.hoan_canh_song?.ly_do_khong_song_cung_bo_me || ''} onChange={e => updateNested('hoan_canh_song.ly_do_khong_song_cung_bo_me', e.target.value)} />
                </div>
              </div>
            </section>

            <section>
              <h3 className="flex items-center gap-2 text-[#14452F] font-black uppercase text-xs mb-6">Chi tiết thân nhân</h3>
              <div className="border border-gray-100 rounded-lg overflow-hidden shadow-sm mb-4">
                <table className="w-full text-xs">
                  <thead className="bg-gray-50 text-gray-500 font-bold border-b">
                    <tr>
                      <th className="p-3 text-left w-24 border-r">Quan hệ</th>
                      <th className="p-3 text-left w-1/5 border-r">Họ tên</th>
                      <th className="p-3 text-left w-24 border-r">Năm sinh</th>
                      <th className="p-3 text-left w-1/5 border-r">Nghề nghiệp</th>
                      <th className="p-3 text-left w-1/4 border-r">Quê quán / Nơi ở</th>
                      <th className="p-3 text-left w-32 border-r">SĐT</th>
                      {!isViewMode && <th className="w-10"></th>}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {(formData.quan_he_gia_dinh?.cha_me_anh_em || []).map((f, idx) => (
                      <tr key={idx}>
                        <td className="p-2 border-r">
                          <select disabled={isViewMode} className={inputClass} value={f.quan_he} onChange={e => {
                            const updated = [...(formData.quan_he_gia_dinh?.cha_me_anh_em || [])]; updated[idx] = { ...updated[idx], quan_he: e.target.value }; updateNested('quan_he_gia_dinh.cha_me_anh_em', updated);
                          }}>
                            <option>Bố</option><option>Mẹ</option><option>Vợ</option><option>Con</option><option>Anh</option><option>Chị</option><option>Em</option><option>Ông</option><option>Bà</option><option>Bạn</option>
                          </select>
                        </td>
                        <td className="p-2 border-r"><input disabled={isViewMode} type="text" className={inputClassBold + " uppercase"} value={f.ho_ten} onChange={e => {
                          const updated = [...(formData.quan_he_gia_dinh?.cha_me_anh_em || [])]; updated[idx] = { ...updated[idx], ho_ten: e.target.value.toUpperCase() }; updateNested('quan_he_gia_dinh.cha_me_anh_em', updated);
                        }} /></td>
                        <td className="p-2 border-r"><input disabled={isViewMode} type="text" className={inputClass + " text-center"} value={f.nam_sinh} onChange={e => {
                          const updated = [...(formData.quan_he_gia_dinh?.cha_me_anh_em || [])]; updated[idx] = { ...updated[idx], nam_sinh: e.target.value }; updateNested('quan_he_gia_dinh.cha_me_anh_em', updated);
                        }} /></td>
                        <td className="p-2 border-r"><input disabled={isViewMode} type="text" className={inputClass} value={f.nghe_nghiep} onChange={e => {
                          const updated = [...(formData.quan_he_gia_dinh?.cha_me_anh_em || [])]; updated[idx] = { ...updated[idx], nghe_nghiep: e.target.value }; updateNested('quan_he_gia_dinh.cha_me_anh_em', updated);
                        }} /></td>
                        <td className="p-2 border-r"><input disabled={isViewMode} type="text" className={inputClass} value={f.cho_o} onChange={e => {
                          const updated = [...(formData.quan_he_gia_dinh?.cha_me_anh_em || [])]; updated[idx] = { ...updated[idx], cho_o: e.target.value }; updateNested('quan_he_gia_dinh.cha_me_anh_em', updated);
                        }} /></td>
                        <td className="p-2 border-r"><input disabled={isViewMode} type="text" className={inputClass} value={f.sdt} onChange={e => {
                          const updated = [...(formData.quan_he_gia_dinh?.cha_me_anh_em || [])]; updated[idx] = { ...updated[idx], sdt: e.target.value }; updateNested('quan_he_gia_dinh.cha_me_anh_em', updated);
                        }} /></td>
                        {!isViewMode && (
                            <td className="p-2 text-center"><button onClick={() => removeRow('quan_he_gia_dinh.cha_me_anh_em', idx)} className="text-red-400 hover:text-red-600 transition-all"><Trash2 size={14}/></button></td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {!isViewMode && (
                  <button onClick={() => addRow('quan_he_gia_dinh.cha_me_anh_em', {quan_he: 'Bố', ho_ten: '', nam_sinh: '', nghe_nghiep: '', cho_o: '', sdt: ''})} className="px-5 py-2.5 border-2 border-green-50 text-green-700 rounded-lg text-[10px] font-bold uppercase hover:bg-green-50 transition-all flex items-center gap-1"><Plus size={14}/> Thêm người thân</button>
              )}
            </section>
          </div>
        )}

        {/* --- TAB 4: YẾU TỐ NƯỚC NGOÀI --- */}
        {activeTab === 4 && (
          <div className="animate-fade-in space-y-10">
            <section>
              <h3 className="flex items-center gap-2 text-[#14452F] font-black uppercase text-xs mb-6">Quan hệ & Đi nước ngoài</h3>
              <div className="space-y-8">
                {/* Foreign Relatives */}
                <div className="p-6 bg-white border border-gray-100 rounded-2xl shadow-sm">
                  <label className="block text-[11px] font-bold text-gray-700 uppercase mb-4">Có quan hệ với ai ở nước ngoài không?</label>
                  <div className="flex gap-8 mb-4">
                    <label className="flex items-center gap-2 text-xs font-bold cursor-pointer"><input disabled={isViewMode} type="radio" checked={!(formData.yeu_to_nuoc_ngoai?.than_nhan || []).length} onChange={() => updateNested('yeu_to_nuoc_ngoai.than_nhan', [])} className="w-4 h-4 accent-[#14452F]" /> Không</label>
                    <label className="flex items-center gap-2 text-xs font-bold cursor-pointer"><input disabled={isViewMode} type="radio" checked={!!(formData.yeu_to_nuoc_ngoai?.than_nhan || []).length} onChange={() => { if(!formData.yeu_to_nuoc_ngoai?.than_nhan?.length) addRow('yeu_to_nuoc_ngoai.than_nhan', {ten: '', qh: '', nuoc: ''}) }} className="w-4 h-4 accent-[#14452F]" /> Có</label>
                  </div>
                  
                  {(formData.yeu_to_nuoc_ngoai?.than_nhan || []).map((t: any, idx: number) => (
                    <div key={idx} className="flex gap-4 p-3 bg-gray-50 rounded-lg animate-fade-in mb-2">
                        <input disabled={isViewMode} type="text" placeholder="Họ tên" className={inputClass} value={t.ten} onChange={e => {
                            const updated = [...(formData.yeu_to_nuoc_ngoai?.than_nhan || [])]; updated[idx] = { ...updated[idx], ten: e.target.value }; updateNested('yeu_to_nuoc_ngoai.than_nhan', updated);
                        }} />
                        <input disabled={isViewMode} type="text" placeholder="Quan hệ" className="w-1/4 p-2 bg-white border border-gray-200 rounded text-xs disabled:bg-gray-50 disabled:text-black" value={t.qh} onChange={e => {
                            const updated = [...(formData.yeu_to_nuoc_ngoai?.than_nhan || [])]; updated[idx] = { ...updated[idx], qh: e.target.value }; updateNested('yeu_to_nuoc_ngoai.than_nhan', updated);
                        }} />
                        <input disabled={isViewMode} type="text" placeholder="Nước nào" className="w-1/4 p-2 bg-white border border-gray-200 rounded text-xs disabled:bg-gray-50 disabled:text-black" value={t.nuoc} onChange={e => {
                            const updated = [...(formData.yeu_to_nuoc_ngoai?.than_nhan || [])]; updated[idx] = { ...updated[idx], nuoc: e.target.value }; updateNested('yeu_to_nuoc_ngoai.than_nhan', updated);
                        }} />
                        {!isViewMode && <button onClick={() => removeRow('yeu_to_nuoc_ngoai.than_nhan', idx)} className="text-red-400"><X size={14}/></button>}
                    </div>
                  ))}
                  {!!(formData.yeu_to_nuoc_ngoai?.than_nhan || []).length && !isViewMode && (
                    <button onClick={() => addRow('yeu_to_nuoc_ngoai.than_nhan', {ten: '', qh: '', nuoc: ''})} className="px-4 py-2 bg-gray-600 text-white rounded text-[10px] font-bold mt-2">Thêm người (Ai, Quan hệ, Nước nào)</button>
                  )}
                </div>

                {/* Travel History */}
                <div className="p-6 bg-white border border-gray-100 rounded-2xl shadow-sm">
                  <label className="block text-[11px] font-bold text-gray-700 uppercase mb-4">Đã từng đi nước ngoài chưa?</label>
                  <div className="flex gap-8 mb-4">
                    <label className="flex items-center gap-2 text-xs font-bold cursor-pointer"><input disabled={isViewMode} type="radio" checked={!(formData.yeu_to_nuoc_ngoai?.di_nuoc_ngoai || []).length} onChange={() => updateNested('yeu_to_nuoc_ngoai.di_nuoc_ngoai', [])} className="w-4 h-4 accent-[#14452F]" /> Chưa đi</label>
                    <label className="flex items-center gap-2 text-xs font-bold cursor-pointer"><input disabled={isViewMode} type="radio" checked={!!(formData.yeu_to_nuoc_ngoai?.di_nuoc_ngoai || []).length} onChange={() => { if(!formData.yeu_to_nuoc_ngoai?.di_nuoc_ngoai?.length) addRow('yeu_to_nuoc_ngoai.di_nuoc_ngoai', {nuoc: '', muc_dich: '', thoi_gian: ''}) }} className="w-4 h-4 accent-[#14452F]" /> Đã đi</label>
                  </div>
                   
                  {(formData.yeu_to_nuoc_ngoai?.di_nuoc_ngoai || []).map((d: any, idx: number) => (
                    <div key={idx} className="flex gap-4 p-3 bg-gray-50 rounded-lg animate-fade-in mb-2">
                        <input disabled={isViewMode} type="text" placeholder="Nước nào" className="w-1/3 p-2 bg-white border border-gray-200 rounded text-xs disabled:bg-gray-50 disabled:text-black" value={d.nuoc} onChange={e => {
                            const updated = [...(formData.yeu_to_nuoc_ngoai?.di_nuoc_ngoai || [])]; updated[idx] = { ...updated[idx], nuoc: e.target.value }; updateNested('yeu_to_nuoc_ngoai.di_nuoc_ngoai', updated);
                        }} />
                        <input disabled={isViewMode} type="text" placeholder="Mục đích" className="w-1/3 p-2 bg-white border border-gray-200 rounded text-xs disabled:bg-gray-50 disabled:text-black" value={d.muc_dich} onChange={e => {
                            const updated = [...(formData.yeu_to_nuoc_ngoai?.di_nuoc_ngoai || [])]; updated[idx] = { ...updated[idx], muc_dich: e.target.value }; updateNested('yeu_to_nuoc_ngoai.di_nuoc_ngoai', updated);
                        }} />
                        <input disabled={isViewMode} type="text" placeholder="Thời gian" className="w-1/3 p-2 bg-white border border-gray-200 rounded text-xs disabled:bg-gray-50 disabled:text-black" value={d.thoi_gian} onChange={e => {
                            const updated = [...(formData.yeu_to_nuoc_ngoai?.di_nuoc_ngoai || [])]; updated[idx] = { ...updated[idx], thoi_gian: e.target.value }; updateNested('yeu_to_nuoc_ngoai.di_nuoc_ngoai', updated);
                        }} />
                        {!isViewMode && <button onClick={() => removeRow('yeu_to_nuoc_ngoai.di_nuoc_ngoai', idx)} className="text-red-400"><X size={14}/></button>}
                    </div>
                  ))}
                  {!!(formData.yeu_to_nuoc_ngoai?.di_nuoc_ngoai || []).length && (
                    <div className="space-y-4 mt-2">
                        {!isViewMode && <button onClick={() => addRow('yeu_to_nuoc_ngoai.di_nuoc_ngoai', {nuoc: '', muc_dich: '', thoi_gian: ''})} className="px-4 py-2 bg-gray-600 text-white rounded text-[10px] font-bold">Thêm lịch sử</button>}
                        <div className="p-3 bg-red-50 rounded-lg border border-red-100">
                            <label className="block text-[11px] font-bold text-red-600 uppercase mb-2">Có vi phạm gì khi đang ở nước ngoài không?</label>
                            <textarea disabled={isViewMode} className={inputClass} rows={2} placeholder="Nếu có ghi rõ..." value={formData.vi_pham_nuoc_ngoai || ''} onChange={e => setFormData({...formData, vi_pham_nuoc_ngoai: e.target.value})} />
                        </div>
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-8">
                  <div className="p-6 bg-white border border-gray-100 rounded-2xl shadow-sm">
                    <label className="block text-[11px] font-bold text-gray-700 uppercase mb-4">Đã có hộ chiếu chưa?</label>
                    <div className="flex gap-8">
                      <label className="flex items-center gap-2 text-xs font-bold cursor-pointer"><input disabled={isViewMode} type="radio" checked={!formData.yeu_to_nuoc_ngoai?.ho_chieu?.da_co} onChange={() => updateNested('yeu_to_nuoc_ngoai.ho_chieu.da_co', false)} className="w-4 h-4 accent-[#14452F]" /> Chưa</label>
                      <label className="flex items-center gap-2 text-xs font-bold cursor-pointer"><input disabled={isViewMode} type="radio" checked={!!formData.yeu_to_nuoc_ngoai?.ho_chieu?.da_co} onChange={() => updateNested('yeu_to_nuoc_ngoai.ho_chieu.da_co', true)} className="w-4 h-4 accent-[#14452F]" /> Đã có</label>
                    </div>
                    
                    {formData.yeu_to_nuoc_ngoai?.ho_chieu?.da_co && (
                        <div className="mt-4 animate-fade-in">
                            <label className="block text-[10px] font-bold text-gray-500 mb-1">Dự định đi nước nào?</label>
                            <input disabled={isViewMode} type="text" className={inputClass} value={formData.yeu_to_nuoc_ngoai?.ho_chieu?.du_dinh_nuoc || ''} onChange={e => updateNested('yeu_to_nuoc_ngoai.ho_chieu.du_dinh_nuoc', e.target.value)} />
                        </div>
                    )}
                  </div>
                  <div className="p-6 bg-white border border-gray-100 rounded-2xl shadow-sm">
                    <label className="block text-[11px] font-bold text-gray-700 uppercase mb-4 leading-relaxed">Bản thân đã hoặc đang làm thủ tục xuất cảnh định cư?</label>
                    <div className="flex gap-8">
                      <label className="flex items-center gap-2 text-xs font-bold cursor-pointer"><input disabled={isViewMode} type="radio" checked={!formData.yeu_to_nuoc_ngoai?.xuat_canh_dinh_cu?.dang_lam_thu_tuc} onChange={() => updateNested('yeu_to_nuoc_ngoai.xuat_canh_dinh_cu.dang_lam_thu_tuc', false)} className="w-4 h-4 accent-[#14452F]" /> Không</label>
                      <label className="flex items-center gap-2 text-xs font-bold cursor-pointer"><input disabled={isViewMode} type="radio" checked={!!formData.yeu_to_nuoc_ngoai?.xuat_canh_dinh_cu?.dang_lam_thu_tuc} onChange={() => updateNested('yeu_to_nuoc_ngoai.xuat_canh_dinh_cu.dang_lam_thu_tuc', true)} className="w-4 h-4 accent-[#14452F]" /> Có</label>
                    </div>
                    
                    {formData.yeu_to_nuoc_ngoai?.xuat_canh_dinh_cu?.dang_lam_thu_tuc && (
                        <div className="space-y-3 mt-4 animate-fade-in">
                            <input disabled={isViewMode} type="text" placeholder="Nước định cư" className={inputClass} value={formData.yeu_to_nuoc_ngoai?.xuat_canh_dinh_cu?.nuoc || ''} onChange={e => updateNested('yeu_to_nuoc_ngoai.xuat_canh_dinh_cu.nuoc', e.target.value)} />
                            <input disabled={isViewMode} type="text" placeholder="Người bảo lãnh" className={inputClass} value={formData.yeu_to_nuoc_ngoai?.xuat_canh_dinh_cu?.nguoi_bao_lanh || ''} onChange={e => updateNested('yeu_to_nuoc_ngoai.xuat_canh_dinh_cu.nguoi_bao_lanh', e.target.value)} />
                        </div>
                    )}
                  </div>
                </div>
              </div>
            </section>
          </div>
        )}

        {/* --- TAB 5: LỊCH SỬ & TỆ NẠN --- */}
        {activeTab === 5 && (
          <div className="animate-fade-in space-y-8">
            <h3 className="flex items-center gap-2 text-red-700 font-black uppercase text-xs mb-6">Dữ liệu Bảo Mật & Vi Phạm</h3>
            <div className="space-y-6">
              {/* Local Violation */}
              <div className="p-6 bg-white border-l-4 border-red-500 rounded-xl shadow-sm space-y-6">
                <div className="flex justify-between items-center">
                  <h4 className="text-[11px] font-black text-red-800 uppercase">1. Vi phạm tại địa phương</h4>
                  <div className="flex gap-6">
                    <label className="flex items-center gap-2 text-xs font-bold cursor-pointer"><input disabled={isViewMode} type="radio" checked={!formData.lich_su_vi_pham?.vi_pham_dia_phuong?.co_khong} onChange={() => updateNested('lich_su_vi_pham.vi_pham_dia_phuong.co_khong', false)} className="accent-red-600" /> Không</label>
                    <label className="flex items-center gap-2 text-xs font-bold cursor-pointer"><input disabled={isViewMode} type="radio" checked={!!formData.lich_su_vi_pham?.vi_pham_dia_phuong?.co_khong} onChange={() => updateNested('lich_su_vi_pham.vi_pham_dia_phuong.co_khong', true)} className="accent-red-600" /> Có</label>
                  </div>
                </div>
                {formData.lich_su_vi_pham?.vi_pham_dia_phuong?.co_khong && (
                  <div className="p-5 bg-gray-50/50 rounded-xl space-y-4">
                    <textarea disabled={isViewMode} className={inputClass} rows={2} placeholder="Nội dung chi tiết..." value={formData.lich_su_vi_pham.vi_pham_dia_phuong.noi_dung || ''} onChange={e => updateNested('lich_su_vi_pham.vi_pham_dia_phuong.noi_dung', e.target.value)} />
                    <textarea disabled={isViewMode} className={inputClass} rows={1} placeholder="Kết quả giải quyết..." value={formData.lich_su_vi_pham.vi_pham_dia_phuong.ket_qua || ''} onChange={e => updateNested('lich_su_vi_pham.vi_pham_dia_phuong.ket_qua', e.target.value)} />
                  </div>
                )}
              </div>

              {/* Gambling */}
              <div className="p-6 bg-white border-l-4 border-red-500 rounded-xl shadow-sm space-y-6">
                <div className="flex justify-between items-center">
                  <h4 className="text-[11px] font-black text-red-800 uppercase">2. Tham gia đánh bạc / Cá độ</h4>
                  <div className="flex gap-6">
                    <label className="flex items-center gap-2 text-xs font-bold cursor-pointer"><input disabled={isViewMode} type="radio" checked={!formData.lich_su_vi_pham?.danh_bac?.co_khong} onChange={() => updateNested('lich_su_vi_pham.danh_bac.co_khong', false)} className="accent-red-600" /> Chưa từng</label>
                    <label className="flex items-center gap-2 text-xs font-bold cursor-pointer"><input disabled={isViewMode} type="radio" checked={!!formData.lich_su_vi_pham?.danh_bac?.co_khong} onChange={() => updateNested('lich_su_vi_pham.danh_bac.co_khong', true)} className="accent-red-600" /> Đã từng tham gia</label>
                  </div>
                </div>
                {formData.lich_su_vi_pham?.danh_bac?.co_khong && (
                  <div className="p-5 bg-gray-50/50 rounded-xl grid grid-cols-2 gap-6">
                    <div>
                      <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Hình thức chơi</label>
                      <input disabled={isViewMode} type="text" className={inputClass} placeholder="VD: Lô đề, bóng đá, xóc đĩa..." value={formData.lich_su_vi_pham.danh_bac.hinh_thuc || ''} onChange={e => updateNested('lich_su_vi_pham.danh_bac.hinh_thuc', e.target.value)} />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Chơi với ai?</label>
                      <input disabled={isViewMode} type="text" className={inputClass} placeholder="VD: Bạn bè xã hội, người lạ..." value={formData.lich_su_vi_pham.danh_bac.doi_tuong || ''} onChange={e => updateNested('lich_su_vi_pham.danh_bac.doi_tuong', e.target.value)} />
                    </div>
                    <div className="col-span-2">
                      <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Địa điểm / Thời gian</label>
                      <input disabled={isViewMode} type="text" className={inputClass} placeholder="Chơi ở đâu? Khi nào?" value={formData.lich_su_vi_pham.danh_bac.dia_diem || ''} onChange={e => updateNested('lich_su_vi_pham.danh_bac.dia_diem', e.target.value)} />
                    </div>
                  </div>
                )}
              </div>

              {/* Drugs */}
              <div className="p-6 bg-white border-l-4 border-red-500 rounded-xl shadow-sm space-y-6">
                <div className="flex justify-between items-center">
                  <h4 className="text-[11px] font-black text-red-800 uppercase">3. Sử dụng Ma túy / Chất gây nghiện</h4>
                  <div className="flex gap-6">
                    <label className="flex items-center gap-2 text-xs font-bold cursor-pointer"><input disabled={isViewMode} type="radio" checked={!formData.lich_su_vi_pham?.ma_tuy?.co_khong} onChange={() => updateNested('lich_su_vi_pham.ma_tuy.co_khong', false)} className="accent-red-600" /> Chưa từng</label>
                    <label className="flex items-center gap-2 text-xs font-bold cursor-pointer"><input disabled={isViewMode} type="radio" checked={!!formData.lich_su_vi_pham?.ma_tuy?.co_khong} onChange={() => updateNested('lich_su_vi_pham.ma_tuy.co_khong', true)} className="accent-red-600" /> Đã từng sử dụng</label>
                  </div>
                </div>
                {formData.lich_su_vi_pham?.ma_tuy?.co_khong && (
                  <div className="p-5 bg-gray-50/50 rounded-xl grid grid-cols-3 gap-6">
                    <div>
                      <label className="block text-[10px] font-bold text-gray-500 mb-1 uppercase">Thời gian (từ khi nào?)</label>
                      <input disabled={isViewMode} type="text" className={inputClass} value={formData.lich_su_vi_pham.ma_tuy.thoi_gian || ''} onChange={e => updateNested('lich_su_vi_pham.ma_tuy.thoi_gian', e.target.value)} />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-gray-500 mb-1 uppercase">Loại chất</label>
                      <input disabled={isViewMode} type="text" className={inputClass} placeholder="Cỏ, Ke, Đá..." value={formData.lich_su_vi_pham.ma_tuy.loai || ''} onChange={e => updateNested('lich_su_vi_pham.ma_tuy.loai', e.target.value)} />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-gray-500 mb-1 uppercase">Số lần sử dụng</label>
                      <input disabled={isViewMode} type="text" className={inputClass} value={formData.lich_su_vi_pham.ma_tuy.so_lan || ''} onChange={e => updateNested('lich_su_vi_pham.ma_tuy.so_lan', e.target.value)} />
                    </div>
                    <div className="col-span-2">
                      <label className="block text-[10px] font-bold text-gray-500 mb-1 uppercase">Sử dụng với ai?</label>
                      <input disabled={isViewMode} type="text" className={inputClass} value={formData.lich_su_vi_pham.ma_tuy.doi_tuong || ''} onChange={e => updateNested('lich_su_vi_pham.ma_tuy.doi_tuong', e.target.value)} />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-gray-500 mb-1 uppercase">Đã bị xử lý chưa?</label>
                      <input disabled={isViewMode} type="text" className={inputClass} placeholder="Có/Không" value={formData.lich_su_vi_pham.ma_tuy.xu_ly || ''} onChange={e => updateNested('lich_su_vi_pham.ma_tuy.xu_ly', e.target.value)} />
                    </div>
                    <div className="col-span-3">
                      <label className="block text-[10px] font-bold text-gray-500 mb-1 uppercase">Hình thức xử lý (nếu có) & Chi tiết</label>
                      <textarea disabled={isViewMode} className={inputClass} rows={2} placeholder="Ghi rõ hình thức xử lý..." value={formData.lich_su_vi_pham.ma_tuy.hinh_thuc_xu_ly || ''} onChange={e => updateNested('lich_su_vi_pham.ma_tuy.hinh_thuc_xu_ly', e.target.value)} />
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* --- TAB 6: TÀI CHÍNH & SỨC KHỎE --- */}
        {activeTab === 6 && (
          <div className="animate-fade-in space-y-10">
            <section>
              <h3 className="flex items-center gap-2 text-[#14452F] font-black uppercase text-xs mb-6">Tình hình tài chính</h3>
              <div className="space-y-6">
                <div className="p-6 bg-white border border-yellow-50 rounded-2xl shadow-sm space-y-6 bg-gradient-to-br from-yellow-50/30 to-transparent">
                  <div className="flex justify-between items-center">
                    <h4 className="text-[11px] font-black text-yellow-800 uppercase">1. Vay nợ (Cá nhân / Tổ chức / Tín dụng đen...)</h4>
                    <div className="flex gap-6">
                      <label className="flex items-center gap-2 text-xs font-bold cursor-pointer"><input disabled={isViewMode} type="radio" checked={!formData.tai_chinh_suc_khoe?.vay_no?.co_khong} onChange={() => updateNested('tai_chinh_suc_khoe.vay_no.co_khong', false)} className="accent-yellow-700" /> Không</label>
                      <label className="flex items-center gap-2 text-xs font-bold cursor-pointer"><input disabled={isViewMode} type="radio" checked={!!formData.tai_chinh_suc_khoe?.vay_no?.co_khong} onChange={() => updateNested('tai_chinh_suc_khoe.vay_no.co_khong', true)} className="accent-yellow-700" /> Có</label>
                    </div>
                  </div>
                  {formData.tai_chinh_suc_khoe?.vay_no?.co_khong && (
                    <div className="grid grid-cols-2 gap-x-8 gap-y-4 p-5 bg-white/60 border border-yellow-100 rounded-xl">
                      <div>
                        <label className="block text-[10px] font-bold text-gray-600 mb-1">Ai đứng tên vay?</label>
                        <input disabled={isViewMode} type="text" className={inputClass} placeholder="Bản thân / Vợ / Bố mẹ..." value={formData.tai_chinh_suc_khoe.vay_no.nguoi_dung_ten || ''} onChange={e => updateNested('tai_chinh_suc_khoe.vay_no.nguoi_dung_ten', e.target.value)} />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-gray-600 mb-1">Ai là người trả nợ?</label>
                        <input disabled={isViewMode} type="text" className={inputClass} placeholder="Người chịu trách nhiệm trả" value={formData.tai_chinh_suc_khoe.vay_no.nguoi_tra || ''} onChange={e => updateNested('tai_chinh_suc_khoe.vay_no.nguoi_tra', e.target.value)} />
                      </div>
                      <div className="col-span-1">
                        <label className="block text-[10px] font-bold text-gray-600 mb-1">Vay của ai / Tổ chức nào?</label>
                        <input disabled={isViewMode} type="text" className={inputClass} value={formData.tai_chinh_suc_khoe.vay_no.ai_vay || ''} onChange={e => updateNested('tai_chinh_suc_khoe.vay_no.ai_vay', e.target.value)} />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-[10px] font-bold text-gray-600 mb-1">Số tiền (VNĐ)</label>
                          <input disabled={isViewMode} type="text" className={inputClassBold} value={formData.tai_chinh_suc_khoe.vay_no.so_tien || ''} onChange={e => updateNested('tai_chinh_suc_khoe.vay_no.so_tien', e.target.value)} />
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold text-gray-600 mb-1">Hạn trả</label>
                          <input disabled={isViewMode} type="text" className={inputClass} value={formData.tai_chinh_suc_khoe.vay_no.han_tra || ''} onChange={e => updateNested('tai_chinh_suc_khoe.vay_no.han_tra', e.target.value)} />
                        </div>
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-gray-600 mb-1">Hình thức vay</label>
                        <input disabled={isViewMode} type="text" className={inputClass} placeholder="Tín chấp / Thế chấp / App..." value={formData.tai_chinh_suc_khoe.vay_no.hinh_thuc || ''} onChange={e => updateNested('tai_chinh_suc_khoe.vay_no.hinh_thuc', e.target.value)} />
                      </div>
                      <div className="flex items-center gap-3 pt-6">
                        <input disabled={isViewMode} type="checkbox" checked={!!formData.tai_chinh_suc_khoe.vay_no.gia_dinh_biet} onChange={e => updateNested('tai_chinh_suc_khoe.vay_no.gia_dinh_biet', e.target.checked)} className="w-4 h-4 accent-yellow-700" />
                        <label className="text-[10px] font-bold text-gray-700 uppercase">Gia đình đã biết chuyện vay nợ</label>
                      </div>
                      <div className="col-span-2">
                        <label className="block text-[10px] font-bold text-gray-600 mb-1">Mục đích vay & Chi tiết khác</label>
                        <textarea disabled={isViewMode} className={inputClass} rows={2} placeholder="Vay để làm gì? ..." value={formData.tai_chinh_suc_khoe.vay_no.muc_dich || ''} onChange={e => updateNested('tai_chinh_suc_khoe.vay_no.muc_dich', e.target.value)} />
                      </div>
                    </div>
                  )}
                </div>

                <div className="p-6 bg-white border border-gray-100 rounded-2xl shadow-sm space-y-4">
                  <div className="flex justify-between items-center">
                    <h4 className="text-[11px] font-black text-gray-800 uppercase">2. Kinh doanh & Bất động sản</h4>
                    <div className="flex gap-6">
                      <label className="flex items-center gap-2 text-xs font-bold cursor-pointer"><input disabled={isViewMode} type="radio" checked={!formData.tai_chinh_suc_khoe?.kinh_doanh?.co_khong} onChange={() => updateNested('tai_chinh_suc_khoe.kinh_doanh.co_khong', false)} className="accent-[#14452F]" /> Không</label>
                      <label className="flex items-center gap-2 text-xs font-bold cursor-pointer"><input disabled={isViewMode} type="radio" checked={!!formData.tai_chinh_suc_khoe?.kinh_doanh?.co_khong} onChange={() => updateNested('tai_chinh_suc_khoe.kinh_doanh.co_khong', true)} className="accent-[#14452F]" /> Có</label>
                    </div>
                  </div>
                  {formData.tai_chinh_suc_khoe?.kinh_doanh?.co_khong && (
                    <div>
                      <label className="block text-[10px] font-bold text-gray-500 mb-1 uppercase">Chi tiết đối tác & Địa chỉ kinh doanh</label>
                      <textarea disabled={isViewMode} className={inputClass} rows={2} placeholder="Tên tổ chức/cá nhân, tên công ty, địa chỉ cụ thể..." value={formData.tai_chinh_suc_khoe.kinh_doanh.chi_tiet || ''} onChange={e => updateNested('tai_chinh_suc_khoe.kinh_doanh.chi_tiet', e.target.value)} />
                    </div>
                  )}
                </div>
              </div>
            </section>

            <section>
              <h3 className="flex items-center gap-2 text-[#14452F] font-black uppercase text-xs mb-6">Sức khỏe</h3>
              <div className="p-6 bg-white border border-gray-100 rounded-2xl shadow-sm">
                <div className="flex justify-between items-center mb-4">
                  <label className="text-[11px] font-bold text-gray-700 uppercase">Đã từng mắc Covid-19 chưa?</label>
                  <div className="flex gap-6">
                    <label className="flex items-center gap-2 text-xs font-bold cursor-pointer"><input disabled={isViewMode} type="radio" checked={!formData.tai_chinh_suc_khoe?.covid_ban_than?.da_mac} onChange={() => updateNested('tai_chinh_suc_khoe.covid_ban_than.da_mac', false)} className="accent-green-700" /> Không</label>
                    <label className="flex items-center gap-2 text-xs font-bold cursor-pointer"><input disabled={isViewMode} type="radio" checked={!!formData.tai_chinh_suc_khoe?.covid_ban_than?.da_mac} onChange={() => updateNested('tai_chinh_suc_khoe.covid_ban_than.da_mac', true)} className="accent-green-700" /> Có</label>
                  </div>
                </div>
                {formData.tai_chinh_suc_khoe?.covid_ban_than?.da_mac && (
                  <input disabled={isViewMode} type="text" placeholder="Thời gian mắc bệnh (Tháng/Năm)" className={inputClass} value={formData.tai_chinh_suc_khoe.covid_ban_than.thoi_gian || ''} onChange={e => updateNested('tai_chinh_suc_khoe.covid_ban_than.thoi_gian', e.target.value)} />
                )}
              </div>
            </section>
          </div>
        )}

        {/* --- TAB 7: CAM KẾT & NGUYỆN VỌNG --- */}
        {activeTab === 7 && (
          <div className="animate-fade-in space-y-10 max-w-4xl mx-auto py-10">
            <h3 className="flex items-center justify-center gap-2 text-[#14452F] font-black uppercase text-xl mb-12 tracking-widest">
              Ý kiến, Nguyện vọng & Cam đoan
            </h3>
            
            <div className="space-y-12">
              <div className="space-y-4">
                <h4 className="text-sm font-black text-gray-800 uppercase tracking-widest border-b-2 border-gray-100 pb-2">II. Ý KIẾN VÀ NGUYỆN VỌNG CỦA BẢN THÂN</h4>
                <p className="text-gray-500 text-[11px] font-medium leading-relaxed italic">Đồng chí có ý kiến, đề xuất hoặc hoàn cảnh đặc biệt nào cần đơn vị quan tâm giúp đỡ không?</p>
                <textarea disabled={isViewMode} className="w-full p-8 bg-gray-50/50 border border-gray-200 rounded-[2.5rem] outline-none shadow-inner min-h-[300px] leading-relaxed text-sm focus:ring-4 ring-green-50 transition-all disabled:bg-gray-50 disabled:text-black" value={formData.y_kien_nguyen_vong || ''} onChange={e => setFormData({...formData, y_kien_nguyen_vong: e.target.value})} placeholder="Ghi rõ nội dung..." />
              </div>
              
              <div className="space-y-6">
                <h4 className="text-sm font-black text-red-700 uppercase tracking-widest text-center">III. CAM ĐOAN</h4>
                <div className="py-10 px-2 bg-red-50/30 border-2 border-red-100 rounded-[2.5rem] italic text-[10px] md:text-[11px] text-red-900 text-center leading-relaxed font-bold shadow-sm whitespace-nowrap overflow-hidden text-ellipsis">
                  "Tôi xin cam đoan những lời khai trên là đúng sự thật, nếu có gì sai trái tôi xin chịu hoàn toàn trách nhiệm trước pháp luật và kỷ luật Quân đội."
                </div>
              </div>
            </div>
          </div>
        )}

      </div>

      {/* Footer Actions */}
      <div className="p-6 bg-gray-50 border-t flex justify-end gap-4 shrink-0 shadow-[0_-4px_20px_rgba(0,0,0,0.05)]">
        <button 
          onClick={onClose} 
          className="px-10 py-4 bg-gray-200 text-gray-800 rounded-2xl font-black uppercase text-xs tracking-widest hover:bg-gray-300 transition-all border border-gray-300"
        >
          {isViewMode ? 'Đóng' : 'Hủy bỏ'}
        </button>
        {!isViewMode && (
            <button 
              onClick={handleSave} 
              className="px-16 py-4 bg-[#14452F] text-white rounded-2xl font-black uppercase text-xs tracking-widest shadow-xl hover:bg-[#1a5a3d] active:scale-95 transition-all"
            >
              Hoàn thành & Lưu
            </button>
        )}
      </div>
    </div>
  );
};

export default PersonnelForm;