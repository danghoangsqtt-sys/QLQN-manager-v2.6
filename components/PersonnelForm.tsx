import React, { useState, useEffect } from 'react';
import { MilitaryPersonnel, Unit, CustomField } from '../types';
import { db } from '../store';

interface PersonnelFormProps {
  units: Unit[];
  onClose: () => void;
  initialData?: MilitaryPersonnel;
}

// FIX: Định nghĩa dữ liệu mặc định ra ngoài để tái sử dụng
// Giúp reset form sạch sẽ khi chuyển từ chế độ "Sửa" sang "Thêm mới"
const DEFAULT_DATA: Partial<MilitaryPersonnel> = {
  ho_ten: '', ten_khac: '', ngay_sinh: '', cccd: '', sdt_rieng: '',
  cap_bac: 'Binh nhì', chuc_vu: '', don_vi_id: '',
  nhap_ngu_ngay: '', ngay_vao_doan: '', vao_dang_ngay: '',
  ho_khau_thu_tru: '', noi_sinh: '', dan_toc: 'Kinh', ton_giao: 'Không',
  trinh_do_van_hoa: '12/12', da_tot_nghiep: false, nang_khieu_so_truong: '',
  anh_dai_dien: '',
  // --- NEW UPDATE: Thêm thông tin nghỉ phép ---
  nghi_phep_thuc_te: 0,
  nghi_phep_tham_chieu: 12,
  // --------------------------------------------
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

const PersonnelForm: React.FC<PersonnelFormProps> = ({ units, onClose, initialData }) => {
  const [activeTab, setActiveTab] = useState(1);
  const [customFields, setCustomFields] = useState<CustomField[]>([]);
  
  // Khởi tạo state. 
  // Lưu ý: useState chỉ chạy 1 lần khi mount. Việc update khi props thay đổi sẽ do useEffect xử lý.
  const [formData, setFormData] = useState<Partial<MilitaryPersonnel>>(
    initialData ? JSON.parse(JSON.stringify(initialData)) : JSON.parse(JSON.stringify(DEFAULT_DATA))
  );

  // FIX CRITICAL BUG: Đồng bộ State khi Props initialData thay đổi
  // Nếu không có đoạn này, khi mở user A rồi mở user B, form vẫn hiện user A.
  useEffect(() => {
    if (initialData) {
      // Deep clone để ngắt tham chiếu, tránh lỗi sửa trực tiếp vào props
      setFormData(JSON.parse(JSON.stringify(initialData)));
    } else {
      // Reset về mặc định nếu là chế độ thêm mới
      setFormData(JSON.parse(JSON.stringify(DEFAULT_DATA)));
    }
  }, [initialData]);

  // Load custom fields based on unit
  useEffect(() => {
    if (formData.don_vi_id) {
      setCustomFields(db.getCustomFields(formData.don_vi_id));
    }
  }, [formData.don_vi_id]);

  const handleSave = () => {
    // Validation cơ bản
    if (!formData.ho_ten || !formData.cccd || !formData.don_vi_id) {
      alert('Vui lòng nhập đầy đủ các thông tin bắt buộc (*): Họ tên, CCCD, Đơn vị');
      return;
    }
    
    // Tự động điền tên đơn vị nếu có ID
    const unitName = units.find(u => u.id === formData.don_vi_id)?.name || '';
    const finalData = { ...formData, don_vi: unitName };
    
    // Lưu vào DB (Async)
    const save = async () => {
        try {
            if (initialData && initialData.id) {
                // Chế độ Edit
                await db.updatePersonnel(initialData.id, finalData);
            } else {
                // Chế độ Add New
                await db.addPersonnel({ 
                    ...finalData as MilitaryPersonnel, 
                    id: Date.now().toString(), 
                });
            }
            onClose();
        } catch (e) {
            alert('Lỗi khi lưu hồ sơ: ' + e);
        }
    };
    save();
  };

  // Helper function: Update nested object properties safely
  // FIX: Sử dụng Deep Clone để đảm bảo React State Update đúng chuẩn
  const updateNested = (path: string, value: any) => {
    setFormData(prev => {
      // Deep clone object hiện tại để tránh mutation trực tiếp
      const updated = JSON.parse(JSON.stringify(prev));
      
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

  // Helper functions for Arrays
  // FIX: Logic kiểm tra mảng an toàn hơn
  const addRow = (path: string, template: any) => {
    setFormData(prev => {
        const updated = JSON.parse(JSON.stringify(prev));
        const keys = path.split('.');
        let current: any = updated;
        
        for (const k of keys) {
            if (!current[k]) current[k] = []; // Tạo mảng nếu chưa có trong bản clone
            current = current[k];
        }
        
        if (Array.isArray(current)) {
            current.push(template);
        }
        return updated;
    });
  };

  const removeRow = (path: string, index: number) => {
    setFormData(prev => {
        const updated = JSON.parse(JSON.stringify(prev));
        const keys = path.split('.');
        let current: any = updated;
        
        // Traverse to the array
        for (let i = 0; i < keys.length; i++) {
             if (!current[keys[i]]) return prev; // Path invalid, return original state
             current = current[keys[i]];
        }
        
        if (Array.isArray(current)) {
             // Mutation on clone is safe
             current.splice(index, 1);
        }
        
        // Cập nhật lại state cha
        // Logic traverse ở trên chỉ lấy reference tới mảng con trong 'updated'
        // Vì 'updated' là deep clone, việc sửa 'current' sẽ sửa 'updated'
        
        // Tuy nhiên để chắc chắn traverse đúng, ta cần gán lại. 
        // Cách trên splice trực tiếp vào 'current' (là tham chiếu con của 'updated') là OK.
        
        return updated;
    });
  };

  return (
    <div className="bg-[#f4f6f8] w-full max-w-7xl max-h-[95vh] rounded-3xl shadow-2xl overflow-hidden flex flex-col border-2 border-[#14452F] animate-fade-in relative z-[200]">
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
          { id: 8, label: '8. Thông tin bổ sung' },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-3 text-[11px] font-bold uppercase transition-all border-b-2 ${
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
            {/* Basic Info */}
            <section>
              <h3 className="flex items-center gap-2 text-[#14452F] font-black uppercase text-xs mb-6">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z"/></svg>
                Thông tin cơ bản
              </h3>
              <div className="grid grid-cols-12 gap-6">
                <div className="col-span-12 md:col-span-2 flex flex-col items-center">
                  <div className="w-32 h-44 border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center bg-gray-50 mb-3 relative overflow-hidden group">
                    {formData.anh_dai_dien ? <img src={formData.anh_dai_dien} className="w-full h-full object-cover" /> : <span className="text-gray-400 text-[10px] font-bold">Ảnh thẻ</span>}
                  </div>
                  <button className="px-4 py-1.5 border border-gray-300 rounded-md text-[10px] font-bold text-gray-600 flex items-center gap-1 hover:bg-gray-50">
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" strokeWidth="2"/><path d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" strokeWidth="2"/></svg>
                    Chọn ảnh
                  </button>
                </div>
                <div className="col-span-12 md:col-span-10 grid grid-cols-3 gap-x-6 gap-y-4">
                  <div className="col-span-2">
                    <label className="block text-[10px] font-bold text-gray-600 mb-1">Họ và tên khai sinh <span className="text-red-500">*</span></label>
                    <input type="text" className="w-full p-2 border border-gray-200 rounded-md outline-none font-bold text-[#14452F] uppercase" value={formData.ho_ten || ''} onChange={e => setFormData({...formData, ho_ten: e.target.value.toUpperCase()})} />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-gray-600 mb-1">Tên khác (nếu có)</label>
                    <input type="text" className="w-full p-2 border border-gray-200 rounded-md outline-none" value={formData.ten_khac || ''} onChange={e => setFormData({...formData, ten_khac: e.target.value})} />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-gray-600 mb-1">Ngày sinh <span className="text-red-500">*</span></label>
                    <input type="date" className="w-full p-2 border border-gray-200 rounded-md outline-none font-medium" value={formData.ngay_sinh || ''} onChange={e => setFormData({...formData, ngay_sinh: e.target.value})} />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-gray-600 mb-1">CCCD/CMND <span className="text-red-500">*</span></label>
                    <input type="text" className="w-full p-2 border border-gray-200 rounded-md outline-none font-bold" value={formData.cccd || ''} onChange={e => setFormData({...formData, cccd: e.target.value})} />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-gray-600 mb-1">SĐT Cá nhân</label>
                    <input type="text" className="w-full p-2 border border-gray-200 rounded-md outline-none" placeholder="Số thường dùng" value={formData.sdt_rieng || ''} onChange={e => setFormData({...formData, sdt_rieng: e.target.value})} />
                  </div>
                  <div className="col-span-3">
                    <label className="block text-[10px] font-bold text-gray-600 mb-1">HKTT (Số nhà, đường, ấp, khu phố, xã/phường...)</label>
                    <textarea className="w-full p-2 border border-gray-200 rounded-md outline-none text-xs" rows={2} placeholder="Ghi cụ thể địa chỉ thường trú..." value={formData.ho_khau_thu_tru || ''} onChange={e => setFormData({...formData, ho_khau_thu_tru: e.target.value})} />
                  </div>

                  {/* NEW UPDATE: Thêm field Nghỉ phép vào UI */}
                  <div className="p-3 bg-green-50 rounded-xl border border-green-100 col-span-3 grid grid-cols-2 gap-4">
                     <div>
                        <label className="block text-[10px] font-black text-green-700 mb-1 uppercase tracking-widest">Nghỉ phép thực tế (ngày)</label>
                        <input type="number" className="w-full p-2 bg-white border border-green-200 rounded-lg outline-none font-bold text-green-700" value={formData.nghi_phep_thuc_te} onChange={e => setFormData({...formData, nghi_phep_thuc_te: parseInt(e.target.value) || 0})} />
                     </div>
                     <div>
                        <label className="block text-[10px] font-black text-green-700 mb-1 uppercase tracking-widest">Nghỉ phép tham chiếu (ngày)</label>
                        <input type="number" className="w-full p-2 bg-white border border-green-200 rounded-lg outline-none font-bold text-green-700" value={formData.nghi_phep_tham_chieu} onChange={e => setFormData({...formData, nghi_phep_tham_chieu: parseInt(e.target.value) || 0})} />
                     </div>
                  </div>
                  {/* END NEW UPDATE */}

                  <div>
                    <label className="block text-[10px] font-bold text-gray-600 mb-1">Nơi sinh (Xã, Huyện, Tỉnh)</label>
                    <input type="text" className="w-full p-2 border border-gray-200 rounded-md outline-none" value={formData.noi_sinh || ''} onChange={e => setFormData({...formData, noi_sinh: e.target.value})} />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-gray-600 mb-1">Dân tộc</label>
                    <input type="text" className="w-full p-2 border border-gray-200 rounded-md outline-none" value={formData.dan_toc || ''} onChange={e => setFormData({...formData, dan_toc: e.target.value})} />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-gray-600 mb-1">Tôn giáo</label>
                    <input type="text" className="w-full p-2 border border-gray-200 rounded-md outline-none" value={formData.ton_giao || ''} onChange={e => setFormData({...formData, ton_giao: e.target.value})} />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-gray-600 mb-1">Trình độ học vấn</label>
                    <input type="text" className="w-full p-2 border border-gray-200 rounded-md outline-none" placeholder="12/12" value={formData.trinh_do_van_hoa || ''} onChange={e => setFormData({...formData, trinh_do_van_hoa: e.target.value})} />
                  </div>
                  <div className="flex flex-col justify-center">
                    <label className="block text-[10px] font-bold text-gray-600 mb-1">Đã tốt nghiệp chưa?</label>
                    <div className="flex gap-4">
                      <label className="flex items-center gap-1.5 text-xs cursor-pointer"><input type="radio" checked={!!formData.da_tot_nghiep} onChange={() => setFormData({...formData, da_tot_nghiep: true})} className="w-3 h-3" /> Đã TN</label>
                      <label className="flex items-center gap-1.5 text-xs cursor-pointer"><input type="radio" checked={!formData.da_tot_nghiep} onChange={() => setFormData({...formData, da_tot_nghiep: false})} className="w-3 h-3" /> Chưa TN</label>
                    </div>
                  </div>
                  <div className="col-span-1">
                    <label className="block text-[10px] font-bold text-gray-600 mb-1">Năng khiếu/Sở trường</label>
                    <textarea className="w-full p-2 border border-gray-200 rounded-md outline-none text-xs" rows={1} placeholder="Vẽ, đàn, hát, sửa chữa..." value={formData.nang_khieu_so_truong || ''} onChange={e => setFormData({...formData, nang_khieu_so_truong: e.target.value})} />
                  </div>
                </div>
              </div>
            </section>

            {/* Unit info */}
            <section className="border-t pt-8">
              <h3 className="flex items-center gap-2 text-[#14452F] font-black uppercase text-xs mb-6">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M10.394 2.08a1 1 0 00-.788 0l-7 3a1 1 0 000 1.84L5.25 8.051a.999.999 0 01.356-.257l4-1.714a1 1 0 11.788 1.838L7.667 9.088l1.94.831a1 1 0 00.787 0l7-3a1 1 0 000-1.838l-7-3zM3.31 9.397L5 10.12v4.102a8.969 8.969 0 00-1.05-.174 1 1 0 01-.89-.89 11.115 11.115 0 01.25-3.762zM9.3 16.573A9.026 9.026 0 007 14.935v-3.957l1.818.78a3 3 0 002.364 0l5.508-2.361a11.026 11.026 0 01.25 3.762 1 1 0 01-.89.89 8.968 8.968 0 00-5.35 2.524 1 1 0 01-1.4 0z"/></svg>
                Đơn vị & Tổ chức
              </h3>
              <div className="grid grid-cols-5 gap-6">
                <div className="col-span-2">
                  <label className="block text-[10px] font-bold text-gray-600 mb-1">Đơn vị <span className="text-red-500">*</span></label>
                  <select className="w-full p-2 border border-gray-200 rounded-md outline-none font-bold" value={formData.don_vi_id || ''} onChange={e => setFormData({...formData, don_vi_id: e.target.value})}>
                    <option value="">-- Chọn đơn vị --</option>
                    {units.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-gray-600 mb-1">Cấp bậc</label>
                  <select className="w-full p-2 border border-gray-200 rounded-md outline-none font-bold" value={formData.cap_bac || 'Binh nhì'} onChange={e => setFormData({...formData, cap_bac: e.target.value})}>
                    <option>Binh nhì</option><option>Binh nhất</option><option>Hạ sĩ</option><option>Trung sĩ</option><option>Thượng sĩ</option><option>Thiếu úy</option><option>Trung úy</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-gray-600 mb-1">Chức vụ</label>
                  <input type="text" className="w-full p-2 border border-gray-200 rounded-md outline-none" value={formData.chuc_vu || ''} onChange={e => setFormData({...formData, chuc_vu: e.target.value})} />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-gray-600 mb-1">Ngày nhập ngũ</label>
                  <input type="date" className="w-full p-2 border border-gray-200 rounded-md outline-none" value={formData.nhap_ngu_ngay || ''} onChange={e => setFormData({...formData, nhap_ngu_ngay: e.target.value})} />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-gray-600 mb-1">Ngày vào Đoàn</label>
                  <input type="date" className="w-full p-2 border border-gray-200 rounded-md outline-none" value={formData.ngay_vao_doan || ''} onChange={e => setFormData({...formData, ngay_vao_doan: e.target.value})} />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-gray-600 mb-1">Ngày vào Đảng</label>
                  <input type="date" className="w-full p-2 border border-gray-200 rounded-md outline-none" value={formData.vao_dang_ngay || ''} onChange={e => setFormData({...formData, vao_dang_ngay: e.target.value})} />
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
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" strokeWidth="2"/></svg>
                Quá trình từ 10 tuổi đến nhập ngũ (học gì, làm gì, ở đâu)
              </h3>
              <div className="border border-gray-100 rounded-lg overflow-hidden shadow-sm mb-4">
                <table className="w-full text-xs">
                  <thead className="bg-gray-50 text-gray-500 font-bold border-b">
                    <tr>
                      <th className="p-3 text-left w-1/4 border-r">Thời gian</th>
                      <th className="p-3 text-left w-2/4 border-r">Làm gì? Chức vụ?</th>
                      <th className="p-3 text-left w-1/4 border-r">Ở đâu?</th>
                      <th className="w-10"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {(formData.tieu_su_ban_than || []).map((row, idx) => (
                      <tr key={idx}>
                        <td className="p-2 border-r"><input type="text" placeholder="VD: 2015 - 2019" className="w-full p-2 border border-gray-100 rounded outline-none" value={row.time} onChange={e => {
                          const updated = [...(formData.tieu_su_ban_than || [])]; updated[idx].time = e.target.value; updateNested('tieu_su_ban_than', updated);
                        }} /></td>
                        <td className="p-2 border-r"><input type="text" placeholder="Làm gì?" className="w-full p-2 border border-gray-100 rounded outline-none" value={row.job} onChange={e => {
                          const updated = [...(formData.tieu_su_ban_than || [])]; updated[idx].job = e.target.value; updateNested('tieu_su_ban_than', updated);
                        }} /></td>
                        <td className="p-2 border-r"><input type="text" placeholder="Ở đâu?" className="w-full p-2 border border-gray-100 rounded outline-none" value={row.place} onChange={e => {
                          const updated = [...(formData.tieu_su_ban_than || [])]; updated[idx].place = e.target.value; updateNested('tieu_su_ban_than', updated);
                        }} /></td>
                        <td className="p-2 text-center"><button onClick={() => removeRow('tieu_su_ban_than', idx)} className="text-red-400 hover:text-red-600">×</button></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <button onClick={() => addRow('tieu_su_ban_than', {time: '', job: '', place: ''})} className="px-4 py-2 border-2 border-blue-50 text-blue-600 rounded-lg text-[10px] font-bold uppercase hover:bg-blue-50 transition-all">+ Thêm mốc thời gian</button>
            </section>

            <section>
              <h3 className="flex items-center gap-2 text-[#14452F] font-black uppercase text-xs mb-6">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" strokeWidth="2"/></svg>
                Mạng Xã Hội
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {(['facebook', 'zalo', 'tiktok'] as const).map(type => (
                  <div key={type} className="bg-gray-50/50 p-5 rounded-xl border border-gray-100">
                    <div className="flex justify-between items-center mb-4">
                      <span className="text-[11px] font-bold text-gray-700 uppercase flex items-center gap-2">
                        {type === 'facebook' && <span className="text-blue-600 text-lg">f</span>}
                        {type === 'zalo' && <span className="text-blue-400 text-lg">Z</span>}
                        {type === 'tiktok' && <span className="text-black text-lg">d</span>}
                        {type}
                      </span>
                    </div>
                    <div className="space-y-3">
                      {(formData.mang_xa_hoi?.[type] || []).map((acc, idx) => (
                        <div key={idx} className="flex gap-2 group animate-fade-in">
                          <input type="text" placeholder="Tên TK/ID" className="w-1/2 p-2 bg-white border border-gray-200 rounded text-[10px]" value={acc.name} onChange={e => {
                            const currentList = [...(formData.mang_xa_hoi?.[type] || [])];
                            currentList[idx] = { ...currentList[idx], name: e.target.value };
                            updateNested(`mang_xa_hoi.${type}`, currentList);
                          }} />
                          <input type="text" placeholder="SĐT Đăng ký" className="w-1/2 p-2 bg-white border border-gray-200 rounded text-[10px]" value={acc.phone} onChange={e => {
                            const currentList = [...(formData.mang_xa_hoi?.[type] || [])];
                            currentList[idx] = { ...currentList[idx], phone: e.target.value };
                            updateNested(`mang_xa_hoi.${type}`, currentList);
                          }} />
                          <button onClick={() => {
                             const currentList = [...(formData.mang_xa_hoi?.[type] || [])];
                             currentList.splice(idx, 1);
                             updateNested(`mang_xa_hoi.${type}`, currentList);
                          }} className="text-red-400 hover:text-red-600 transition-colors">×</button>
                        </div>
                      ))}
                      <button onClick={() => {
                        const current = formData.mang_xa_hoi?.[type] || [];
                        updateNested(`mang_xa_hoi.${type}`, [...current, {name: '', phone: ''}]);
                      }} className="w-full py-2 border border-blue-200 rounded-lg text-blue-600 text-[10px] font-bold uppercase hover:bg-blue-50 transition-all">Thêm tài khoản</button>
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
              <h3 className="flex items-center gap-2 text-[#14452F] font-black uppercase text-xs mb-6">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" strokeWidth="2"/></svg>
                Hoàn cảnh sống trước nhập ngũ
              </h3>
              <div className="bg-gray-50/50 p-6 rounded-2xl border border-gray-100 space-y-6">
                <div>
                  <label className="block text-[11px] font-bold text-gray-700 uppercase mb-3">Trước khi nhập ngũ sống chung với ai?</label>
                  <div className="flex gap-8">
                    {['Bố', 'Mẹ', 'Người nuôi dưỡng khác'].map(val => (
                      <label key={val} className="flex items-center gap-2 text-xs font-medium cursor-pointer">
                        <input type="checkbox" checked={(formData.hoan_canh_song?.song_chung_voi || '').includes(val)} onChange={e => {
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
                  <textarea className="w-full p-4 bg-white border border-gray-200 rounded-xl outline-none text-xs" rows={2} placeholder="Ghi rõ lý do..." value={formData.hoan_canh_song?.ly_do_khong_song_cung_bo_me || ''} onChange={e => updateNested('hoan_canh_song.ly_do_khong_song_cung_bo_me', e.target.value)} />
                </div>
              </div>
            </section>

            <section>
              <h3 className="flex items-center gap-2 text-[#14452F] font-black uppercase text-xs mb-6">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" strokeWidth="2"/></svg>
                Thông tin chung về gia đình
              </h3>
              <div className="grid grid-cols-2 gap-8 mb-6">
                <div>
                  <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Nghề nghiệp chính của gia đình</label>
                  <input type="text" className="w-full p-2 border border-gray-200 rounded-lg outline-none" value={formData.thong_tin_gia_dinh_chung?.nghe_nghiep_chinh || ''} onChange={e => updateNested('thong_tin_gia_dinh_chung.nghe_nghiep_chinh', e.target.value)} />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Mức sống của gia đình</label>
                  <select className="w-full p-2 border border-gray-200 rounded-lg outline-none font-medium" value={formData.thong_tin_gia_dinh_chung?.muc_song || 'Đủ ăn'} onChange={e => updateNested('thong_tin_gia_dinh_chung.muc_song', e.target.value)}>
                    <option>Đủ ăn</option><option>Khó khăn</option><option>Khá</option>
                  </select>
                </div>
              </div>
              <div className="flex flex-col gap-3 p-4 bg-gray-50 rounded-xl border border-gray-100">
                <div className="flex items-center gap-3">
                  <input type="checkbox" checked={!!formData.thong_tin_gia_dinh_chung?.lich_su_vi_pham_nguoi_than?.co_khong} onChange={e => updateNested('thong_tin_gia_dinh_chung.lich_su_vi_pham_nguoi_than.co_khong', e.target.checked)} className="w-5 h-5 accent-[#14452F]" />
                  <label className="text-[11px] font-bold text-gray-700 uppercase">Trong gia đình (bố, mẹ, anh, chị em ruột) có ai đã hoặc đang vi phạm pháp luật không?</label>
                </div>
                {formData.thong_tin_gia_dinh_chung?.lich_su_vi_pham_nguoi_than?.co_khong && (
                    <textarea className="w-full p-3 bg-white border border-gray-200 rounded-lg text-xs" rows={2} placeholder="Ai vi phạm? Vi phạm gì? Bị xử lý như thế nào?..." value={formData.thong_tin_gia_dinh_chung?.lich_su_vi_pham_nguoi_than?.chi_tiet || ''} onChange={e => updateNested('thong_tin_gia_dinh_chung.lich_su_vi_pham_nguoi_than.chi_tiet', e.target.value)} />
                )}
              </div>
              <div className="mt-6">
                <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Trong gia đình có ai bị Covid-19 không? Nếu có, ngày nào?</label>
                <input type="text" placeholder="Ghi rõ thông tin..." className="w-full p-2 border border-gray-200 rounded-lg outline-none" value={formData.thong_tin_gia_dinh_chung?.lich_su_covid_gia_dinh || ''} onChange={e => updateNested('thong_tin_gia_dinh_chung.lich_su_covid_gia_dinh', e.target.value)} />
              </div>
            </section>

            <section>
              <h3 className="flex items-center gap-2 text-[#14452F] font-black uppercase text-xs mb-6">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" strokeWidth="2"/></svg>
                Chi tiết thân nhân
              </h3>
              <div className="p-4 bg-cyan-50 border border-cyan-100 rounded-lg text-[10px] font-bold text-cyan-800 flex items-center gap-3 mb-4">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"/></svg>
                Khai về bố, mẹ, anh, chị, em ruột, vợ, con và 3 người thân thiết nhất vào bảng dưới đây.
              </div>
              <div className="border border-gray-100 rounded-lg overflow-hidden shadow-sm mb-4">
                <table className="w-full text-xs">
                  <thead className="bg-gray-50 text-gray-500 font-bold border-b">
                    <tr>
                      <th className="p-3 text-left w-24 border-r">Quan hệ</th>
                      <th className="p-3 text-left w-1/5 border-r">Họ tên</th>
                      <th className="p-3 text-left w-24 border-r">Năm sinh</th>
                      <th className="p-3 text-left w-1/5 border-r">Nghề nghiệp</th>
                      <th className="p-3 text-left w-1/4 border-r">Quê quán / Nơi ở</th>
                      <th className="p-3 text-left w-32 border-r">SĐT (Zalo/FB)</th>
                      <th className="w-10"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {(formData.quan_he_gia_dinh?.cha_me_anh_em || []).map((f, idx) => (
                      <tr key={idx}>
                        <td className="p-2 border-r">
                          <select className="w-full p-2 border border-gray-100 rounded text-[11px] font-bold outline-none" value={f.quan_he} onChange={e => {
                            const updated = [...(formData.quan_he_gia_dinh?.cha_me_anh_em || [])]; updated[idx] = { ...updated[idx], quan_he: e.target.value }; updateNested('quan_he_gia_dinh.cha_me_anh_em', updated);
                          }}>
                            <option>Bố</option><option>Mẹ</option><option>Vợ</option><option>Con</option><option>Anh</option><option>Chị</option><option>Em</option><option>Ông</option><option>Bà</option><option>Bạn</option>
                          </select>
                        </td>
                        <td className="p-2 border-r"><input type="text" placeholder="Họ tên" className="w-full p-2 border border-gray-100 rounded text-[11px] font-bold uppercase" value={f.ho_ten} onChange={e => {
                          const updated = [...(formData.quan_he_gia_dinh?.cha_me_anh_em || [])]; updated[idx] = { ...updated[idx], ho_ten: e.target.value.toUpperCase() }; updateNested('quan_he_gia_dinh.cha_me_anh_em', updated);
                        }} /></td>
                        <td className="p-2 border-r"><input type="text" placeholder="Năm sinh" className="w-full p-2 border border-gray-100 rounded text-[11px] text-center" value={f.nam_sinh} onChange={e => {
                          const updated = [...(formData.quan_he_gia_dinh?.cha_me_anh_em || [])]; updated[idx] = { ...updated[idx], nam_sinh: e.target.value }; updateNested('quan_he_gia_dinh.cha_me_anh_em', updated);
                        }} /></td>
                        <td className="p-2 border-r"><input type="text" placeholder="Nghề nghiệp" className="w-full p-2 border border-gray-100 rounded text-[11px]" value={f.nghe_nghiep} onChange={e => {
                          const updated = [...(formData.quan_he_gia_dinh?.cha_me_anh_em || [])]; updated[idx] = { ...updated[idx], nghe_nghiep: e.target.value }; updateNested('quan_he_gia_dinh.cha_me_anh_em', updated);
                        }} /></td>
                        <td className="p-2 border-r"><input type="text" placeholder="Quê quán/Chỗ ở" className="w-full p-2 border border-gray-100 rounded text-[11px]" value={f.cho_o} onChange={e => {
                          const updated = [...(formData.quan_he_gia_dinh?.cha_me_anh_em || [])]; updated[idx] = { ...updated[idx], cho_o: e.target.value }; updateNested('quan_he_gia_dinh.cha_me_anh_em', updated);
                        }} /></td>
                        <td className="p-2 border-r"><input type="text" placeholder="SĐT" className="w-full p-2 border border-gray-100 rounded text-[11px] font-bold" value={f.sdt} onChange={e => {
                          const updated = [...(formData.quan_he_gia_dinh?.cha_me_anh_em || [])]; updated[idx] = { ...updated[idx], sdt: e.target.value }; updateNested('quan_he_gia_dinh.cha_me_anh_em', updated);
                        }} /></td>
                        <td className="p-2 text-center"><button onClick={() => removeRow('quan_he_gia_dinh.cha_me_anh_em', idx)} className="text-red-400 hover:text-red-600 transition-all">×</button></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <button onClick={() => addRow('quan_he_gia_dinh.cha_me_anh_em', {quan_he: 'Bố', ho_ten: '', nam_sinh: '', nghe_nghiep: '', cho_o: '', sdt: ''})} className="px-5 py-2.5 border-2 border-green-50 text-green-700 rounded-lg text-[10px] font-bold uppercase hover:bg-green-50 transition-all">+ Thêm người thân</button>
            </section>

            <div className="grid grid-cols-2 gap-8">
              <div className="bg-yellow-50/30 p-6 rounded-2xl border border-yellow-100 space-y-6">
                <h4 className="text-[11px] font-black uppercase text-yellow-900 border-b border-yellow-100 pb-3">Vợ & Con (Khai chi tiết)</h4>
                <div className="space-y-4">
                  <div>
                    <label className="block text-[10px] font-bold text-gray-600 mb-2">Có vợ chưa?</label>
                    <div className="flex gap-4">
                      <label className="flex items-center gap-1.5 text-xs font-bold cursor-pointer"><input type="radio" checked={formData.quan_he_gia_dinh?.vo === null} onChange={() => updateNested('quan_he_gia_dinh.vo', null)} className="accent-yellow-700" /> Chưa</label>
                      <label className="flex items-center gap-1.5 text-xs font-bold cursor-pointer"><input type="radio" checked={formData.quan_he_gia_dinh?.vo !== null} onChange={() => updateNested('quan_he_gia_dinh.vo', {ho_ten: '', nam_sinh: '', sdt: '', nghe_nghiep: '', noi_o: ''})} className="accent-yellow-700" /> Có</label>
                    </div>
                    {/* WIFE DETAILS (SAFE ACCESS) */}
                    {formData.quan_he_gia_dinh?.vo && (
                        <div className="grid grid-cols-2 gap-3 mt-3 animate-fade-in">
                          <input type="text" placeholder="Họ tên vợ" className="col-span-2 p-2 bg-white border border-gray-200 rounded text-xs font-bold uppercase" value={formData.quan_he_gia_dinh.vo.ho_ten || ''} onChange={e => updateNested('quan_he_gia_dinh.vo.ho_ten', e.target.value.toUpperCase())} />
                          <input type="text" placeholder="Năm sinh" className="p-2 bg-white border border-gray-200 rounded text-xs" value={formData.quan_he_gia_dinh.vo.nam_sinh || ''} onChange={e => updateNested('quan_he_gia_dinh.vo.nam_sinh', e.target.value)} />
                          <input type="text" placeholder="SĐT" className="p-2 bg-white border border-gray-200 rounded text-xs" value={formData.quan_he_gia_dinh.vo.sdt || ''} onChange={e => updateNested('quan_he_gia_dinh.vo.sdt', e.target.value)} />
                          <input type="text" placeholder="Nghề nghiệp" className="col-span-2 p-2 bg-white border border-gray-200 rounded text-xs" value={formData.quan_he_gia_dinh.vo.nghe_nghiep || ''} onChange={e => updateNested('quan_he_gia_dinh.vo.nghe_nghiep', e.target.value)} />
                          <textarea placeholder="Nơi ở hiện nay của vợ" className="col-span-2 p-2 bg-white border border-gray-200 rounded text-xs" rows={2} value={formData.quan_he_gia_dinh.vo.noi_o || ''} onChange={e => updateNested('quan_he_gia_dinh.vo.noi_o', e.target.value)} />
                        </div>
                      )}
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-gray-600 mb-2">Có con chưa?</label>
                    <div className="flex gap-4">
                      <label className="flex items-center gap-1.5 text-xs font-bold cursor-pointer"><input type="radio" checked={(formData.quan_he_gia_dinh?.con || []).length === 0} onChange={() => updateNested('quan_he_gia_dinh.con', [])} className="accent-yellow-700" /> Chưa</label>
                      <label className="flex items-center gap-1.5 text-xs font-bold cursor-pointer"><input type="radio" checked={(formData.quan_he_gia_dinh?.con || []).length > 0} onChange={() => { if(!formData.quan_he_gia_dinh?.con?.length) addRow('quan_he_gia_dinh.con', {ten: '', ns: ''}) }} className="accent-yellow-700" /> Có</label>
                    </div>
                    {/* CHILDREN DETAILS */}
                    {formData.quan_he_gia_dinh?.con && formData.quan_he_gia_dinh.con.length > 0 && (
                        <div className="mt-3 space-y-2">
                            {formData.quan_he_gia_dinh.con.map((c: any, idx: number) => (
                                <div key={idx} className="flex gap-2 animate-fade-in">
                                    <input type="text" placeholder="Họ tên con" className="flex-1 p-2 bg-white border border-gray-200 rounded text-xs" value={c.ten} onChange={e => {
                                        const updated = [...(formData.quan_he_gia_dinh?.con || [])]; updated[idx] = { ...updated[idx], ten: e.target.value }; updateNested('quan_he_gia_dinh.con', updated);
                                    }} />
                                    <input type="text" placeholder="Năm sinh" className="w-24 p-2 bg-white border border-gray-200 rounded text-xs" value={c.ns} onChange={e => {
                                        const updated = [...(formData.quan_he_gia_dinh?.con || [])]; updated[idx] = { ...updated[idx], ns: e.target.value }; updateNested('quan_he_gia_dinh.con', updated);
                                    }} />
                                    <button onClick={() => removeRow('quan_he_gia_dinh.con', idx)} className="text-red-400 p-1">×</button>
                                </div>
                            ))}
                            <button onClick={() => addRow('quan_he_gia_dinh.con', {ten: '', ns: ''})} className="text-[10px] font-bold text-blue-600 mt-2">+ Thêm con</button>
                        </div>
                    )}
                  </div>
                </div>
              </div>
              
              <div className="bg-rose-50/30 p-6 rounded-2xl border border-rose-100 space-y-6">
                <h4 className="text-[11px] font-black uppercase text-rose-900 border-b border-rose-100 pb-3">Người yêu</h4>
                <div className="p-4 bg-white/50 rounded-xl">
                  <label className="flex items-center gap-3 text-xs font-bold text-gray-700 cursor-pointer">
                    <input type="checkbox" checked={(formData.quan_he_gia_dinh?.nguoi_yeu || []).length > 0} onChange={e => updateNested('quan_he_gia_dinh.nguoi_yeu', e.target.checked ? [{ten: '', ns: '', nghe_o: '', sdt: ''}] : [])} className="w-4 h-4 accent-rose-700" />
                    Đang có người yêu
                  </label>
                  {/* LOVER DETAILS */}
                  {(formData.quan_he_gia_dinh?.nguoi_yeu || []).map((ny: any, idx: number) => (
                        <div key={idx} className="mt-4 p-3 bg-white border border-rose-100 rounded-lg space-y-3 relative animate-fade-in">
                            <button onClick={() => removeRow('quan_he_gia_dinh.nguoi_yeu', idx)} className="absolute top-2 right-2 text-red-400">×</button>
                            <input type="text" placeholder="Họ tên" className="w-full p-2 bg-gray-50 border border-gray-200 rounded text-xs font-bold" value={ny.ten} onChange={e => {
                                const updated = [...(formData.quan_he_gia_dinh?.nguoi_yeu || [])]; updated[idx] = { ...updated[idx], ten: e.target.value }; updateNested('quan_he_gia_dinh.nguoi_yeu', updated);
                            }} />
                            <div className="grid grid-cols-2 gap-2">
                                <input type="text" placeholder="Năm sinh" className="p-2 bg-gray-50 border border-gray-200 rounded text-xs" value={ny.ns} onChange={e => {
                                    const updated = [...(formData.quan_he_gia_dinh?.nguoi_yeu || [])]; updated[idx] = { ...updated[idx], ns: e.target.value }; updateNested('quan_he_gia_dinh.nguoi_yeu', updated);
                                }} />
                                {/* Đã sửa: Dùng thuộc tính 'sdt' thống nhất với types.ts */}
                                <input type="text" placeholder="SĐT" className="p-2 bg-gray-50 border border-gray-200 rounded text-xs" value={ny.sdt} onChange={e => {
                                    const updated = [...(formData.quan_he_gia_dinh?.nguoi_yeu || [])]; updated[idx] = { ...updated[idx], sdt: e.target.value }; updateNested('quan_he_gia_dinh.nguoi_yeu', updated);
                                }} />
                            </div>
                            <input type="text" placeholder="Nghề nghiệp/Nơi ở" className="w-full p-2 bg-gray-50 border border-gray-200 rounded text-xs" value={ny.nghe_o} onChange={e => {
                                const updated = [...(formData.quan_he_gia_dinh?.nguoi_yeu || [])]; updated[idx] = { ...updated[idx], nghe_o: e.target.value }; updateNested('quan_he_gia_dinh.nguoi_yeu', updated);
                            }} />
                        </div>
                    ))}
                    {(formData.quan_he_gia_dinh?.nguoi_yeu || []).length > 0 && (
                        <button onClick={() => addRow('quan_he_gia_dinh.nguoi_yeu', {ten: '', ns: '', sdt: '', nghe_o: ''})} className="text-[10px] font-bold text-rose-600 mt-3">+ Thêm người yêu</button>
                    )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* --- TAB 4: YẾU TỐ NƯỚC NGOÀI --- */}
        {activeTab === 4 && (
          <div className="animate-fade-in space-y-10">
            <section>
              <h3 className="flex items-center gap-2 text-[#14452F] font-black uppercase text-xs mb-6">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 002 2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" strokeWidth="2"/></svg>
                Quan hệ & Đi nước ngoài
              </h3>
              <div className="space-y-8">
                {/* Foreign Relatives */}
                <div className="p-6 bg-white border border-gray-100 rounded-2xl shadow-sm">
                  <label className="block text-[11px] font-bold text-gray-700 uppercase mb-4">Có quan hệ với ai ở nước ngoài không?</label>
                  <div className="flex gap-8 mb-4">
                    <label className="flex items-center gap-2 text-xs font-bold cursor-pointer"><input type="radio" checked={!(formData.yeu_to_nuoc_ngoai?.than_nhan || []).length} onChange={() => updateNested('yeu_to_nuoc_ngoai.than_nhan', [])} className="w-4 h-4 accent-[#14452F]" /> Không</label>
                    <label className="flex items-center gap-2 text-xs font-bold cursor-pointer"><input type="radio" checked={!!(formData.yeu_to_nuoc_ngoai?.than_nhan || []).length} onChange={() => { if(!formData.yeu_to_nuoc_ngoai?.than_nhan?.length) addRow('yeu_to_nuoc_ngoai.than_nhan', {ten: '', qh: '', nuoc: ''}) }} className="w-4 h-4 accent-[#14452F]" /> Có</label>
                  </div>
                  {/* ADDED FOREIGN RELATIVES INPUTS */}
                  {(formData.yeu_to_nuoc_ngoai?.than_nhan || []).map((t: any, idx: number) => (
                    <div key={idx} className="flex gap-4 p-3 bg-gray-50 rounded-lg animate-fade-in mb-2">
                        <input type="text" placeholder="Họ tên" className="flex-1 p-2 bg-white border border-gray-200 rounded text-xs" value={t.ten} onChange={e => {
                            const updated = [...(formData.yeu_to_nuoc_ngoai?.than_nhan || [])]; updated[idx] = { ...updated[idx], ten: e.target.value }; updateNested('yeu_to_nuoc_ngoai.than_nhan', updated);
                        }} />
                        <input type="text" placeholder="Quan hệ" className="w-1/4 p-2 bg-white border border-gray-200 rounded text-xs" value={t.qh} onChange={e => {
                            const updated = [...(formData.yeu_to_nuoc_ngoai?.than_nhan || [])]; updated[idx] = { ...updated[idx], qh: e.target.value }; updateNested('yeu_to_nuoc_ngoai.than_nhan', updated);
                        }} />
                        <input type="text" placeholder="Nước nào" className="w-1/4 p-2 bg-white border border-gray-200 rounded text-xs" value={t.nuoc} onChange={e => {
                            const updated = [...(formData.yeu_to_nuoc_ngoai?.than_nhan || [])]; updated[idx] = { ...updated[idx], nuoc: e.target.value }; updateNested('yeu_to_nuoc_ngoai.than_nhan', updated);
                        }} />
                        <button onClick={() => removeRow('yeu_to_nuoc_ngoai.than_nhan', idx)} className="text-red-400">×</button>
                    </div>
                  ))}
                  {!!(formData.yeu_to_nuoc_ngoai?.than_nhan || []).length && (
                    <button onClick={() => addRow('yeu_to_nuoc_ngoai.than_nhan', {ten: '', qh: '', nuoc: ''})} className="px-4 py-2 bg-gray-600 text-white rounded text-[10px] font-bold mt-2">Thêm người (Ai, Quan hệ, Nước nào)</button>
                  )}
                </div>

                {/* Travel History */}
                <div className="p-6 bg-white border border-gray-100 rounded-2xl shadow-sm">
                  <label className="block text-[11px] font-bold text-gray-700 uppercase mb-4">Đã từng đi nước ngoài chưa?</label>
                  <div className="flex gap-8 mb-4">
                    <label className="flex items-center gap-2 text-xs font-bold cursor-pointer"><input type="radio" checked={!(formData.yeu_to_nuoc_ngoai?.di_nuoc_ngoai || []).length} onChange={() => updateNested('yeu_to_nuoc_ngoai.di_nuoc_ngoai', [])} className="w-4 h-4 accent-[#14452F]" /> Chưa đi</label>
                    <label className="flex items-center gap-2 text-xs font-bold cursor-pointer"><input type="radio" checked={!!(formData.yeu_to_nuoc_ngoai?.di_nuoc_ngoai || []).length} onChange={() => { if(!formData.yeu_to_nuoc_ngoai?.di_nuoc_ngoai?.length) addRow('yeu_to_nuoc_ngoai.di_nuoc_ngoai', {nuoc: '', muc_dich: '', thoi_gian: ''}) }} className="w-4 h-4 accent-[#14452F]" /> Đã đi</label>
                  </div>
                   {/* ADDED TRAVEL HISTORY INPUTS */}
                  {(formData.yeu_to_nuoc_ngoai?.di_nuoc_ngoai || []).map((d: any, idx: number) => (
                    <div key={idx} className="flex gap-4 p-3 bg-gray-50 rounded-lg animate-fade-in mb-2">
                        <input type="text" placeholder="Nước nào" className="w-1/3 p-2 bg-white border border-gray-200 rounded text-xs" value={d.nuoc} onChange={e => {
                            const updated = [...(formData.yeu_to_nuoc_ngoai?.di_nuoc_ngoai || [])]; updated[idx] = { ...updated[idx], nuoc: e.target.value }; updateNested('yeu_to_nuoc_ngoai.di_nuoc_ngoai', updated);
                        }} />
                        <input type="text" placeholder="Mục đích" className="w-1/3 p-2 bg-white border border-gray-200 rounded text-xs" value={d.muc_dich} onChange={e => {
                            const updated = [...(formData.yeu_to_nuoc_ngoai?.di_nuoc_ngoai || [])]; updated[idx] = { ...updated[idx], muc_dich: e.target.value }; updateNested('yeu_to_nuoc_ngoai.di_nuoc_ngoai', updated);
                        }} />
                        <input type="text" placeholder="Thời gian" className="w-1/3 p-2 bg-white border border-gray-200 rounded text-xs" value={d.thoi_gian} onChange={e => {
                            const updated = [...(formData.yeu_to_nuoc_ngoai?.di_nuoc_ngoai || [])]; updated[idx] = { ...updated[idx], thoi_gian: e.target.value }; updateNested('yeu_to_nuoc_ngoai.di_nuoc_ngoai', updated);
                        }} />
                        <button onClick={() => removeRow('yeu_to_nuoc_ngoai.di_nuoc_ngoai', idx)} className="text-red-400">×</button>
                    </div>
                  ))}
                  {!!(formData.yeu_to_nuoc_ngoai?.di_nuoc_ngoai || []).length && (
                    <div className="space-y-4 mt-2">
                        <button onClick={() => addRow('yeu_to_nuoc_ngoai.di_nuoc_ngoai', {nuoc: '', muc_dich: '', thoi_gian: ''})} className="px-4 py-2 bg-gray-600 text-white rounded text-[10px] font-bold">Thêm lịch sử</button>
                        <div className="p-3 bg-red-50 rounded-lg border border-red-100">
                            <label className="block text-[11px] font-bold text-red-600 uppercase mb-2">Có vi phạm gì khi đang ở nước ngoài không?</label>
                            <textarea className="w-full p-3 border border-gray-200 rounded-lg text-xs" rows={2} placeholder="Nếu có ghi rõ..." value={formData.vi_pham_nuoc_ngoai || ''} onChange={e => setFormData({...formData, vi_pham_nuoc_ngoai: e.target.value})} />
                        </div>
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-8">
                  <div className="p-6 bg-white border border-gray-100 rounded-2xl shadow-sm">
                    <label className="block text-[11px] font-bold text-gray-700 uppercase mb-4">Đã có hộ chiếu chưa?</label>
                    <div className="flex gap-8">
                      <label className="flex items-center gap-2 text-xs font-bold cursor-pointer"><input type="radio" checked={!formData.yeu_to_nuoc_ngoai?.ho_chieu?.da_co} onChange={() => updateNested('yeu_to_nuoc_ngoai.ho_chieu.da_co', false)} className="w-4 h-4 accent-[#14452F]" /> Chưa</label>
                      <label className="flex items-center gap-2 text-xs font-bold cursor-pointer"><input type="radio" checked={!!formData.yeu_to_nuoc_ngoai?.ho_chieu?.da_co} onChange={() => updateNested('yeu_to_nuoc_ngoai.ho_chieu.da_co', true)} className="w-4 h-4 accent-[#14452F]" /> Đã có</label>
                    </div>
                    {/* PASSPORT DETAIL */}
                    {formData.yeu_to_nuoc_ngoai?.ho_chieu?.da_co && (
                        <div className="mt-4 animate-fade-in">
                            <label className="block text-[10px] font-bold text-gray-500 mb-1">Dự định đi nước nào?</label>
                            <input type="text" className="w-full p-2 border border-gray-200 rounded text-xs" value={formData.yeu_to_nuoc_ngoai?.ho_chieu?.du_dinh_nuoc || ''} onChange={e => updateNested('yeu_to_nuoc_ngoai.ho_chieu.du_dinh_nuoc', e.target.value)} />
                        </div>
                    )}
                  </div>
                  <div className="p-6 bg-white border border-gray-100 rounded-2xl shadow-sm">
                    <label className="block text-[11px] font-bold text-gray-700 uppercase mb-4 leading-relaxed">Bản thân đã hoặc đang làm thủ tục xuất cảnh định cư?</label>
                    <div className="flex gap-8">
                      <label className="flex items-center gap-2 text-xs font-bold cursor-pointer"><input type="radio" checked={!formData.yeu_to_nuoc_ngoai?.xuat_canh_dinh_cu?.dang_lam_thu_tuc} onChange={() => updateNested('yeu_to_nuoc_ngoai.xuat_canh_dinh_cu.dang_lam_thu_tuc', false)} className="w-4 h-4 accent-[#14452F]" /> Không</label>
                      <label className="flex items-center gap-2 text-xs font-bold cursor-pointer"><input type="radio" checked={!!formData.yeu_to_nuoc_ngoai?.xuat_canh_dinh_cu?.dang_lam_thu_tuc} onChange={() => updateNested('yeu_to_nuoc_ngoai.xuat_canh_dinh_cu.dang_lam_thu_tuc', true)} className="w-4 h-4 accent-[#14452F]" /> Có</label>
                    </div>
                    {/* IMMIGRATION DETAIL */}
                    {formData.yeu_to_nuoc_ngoai?.xuat_canh_dinh_cu?.dang_lam_thu_tuc && (
                        <div className="space-y-3 mt-4 animate-fade-in">
                            <input type="text" placeholder="Nước định cư" className="w-full p-2 border border-gray-200 rounded text-xs" value={formData.yeu_to_nuoc_ngoai?.xuat_canh_dinh_cu?.nuoc || ''} onChange={e => updateNested('yeu_to_nuoc_ngoai.xuat_canh_dinh_cu.nuoc', e.target.value)} />
                            <input type="text" placeholder="Người bảo lãnh" className="w-full p-2 border border-gray-200 rounded text-xs" value={formData.yeu_to_nuoc_ngoai?.xuat_canh_dinh_cu?.nguoi_bao_lanh || ''} onChange={e => updateNested('yeu_to_nuoc_ngoai.xuat_canh_dinh_cu.nguoi_bao_lanh', e.target.value)} />
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
            <h3 className="flex items-center gap-2 text-red-700 font-black uppercase text-xs mb-6">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" strokeWidth="2"/></svg>
              Dữ liệu Bảo Mật & Vi Phạm
            </h3>
            <p className="text-red-600 text-[10px] font-bold italic mb-6">Lưu ý: Khai báo trung thực các nội dung dưới đây. Thông tin được bảo mật.</p>
            
            <div className="space-y-6">
              {/* Local Violation */}
              <div className="p-6 bg-white border-l-4 border-red-500 rounded-xl shadow-sm space-y-6">
                <div className="flex justify-between items-center">
                  <h4 className="text-[11px] font-black text-red-800 uppercase">1. Vi phạm tại địa phương (trước nhập ngũ)</h4>
                  <div className="flex gap-6">
                    <label className="flex items-center gap-2 text-xs font-bold cursor-pointer"><input type="radio" checked={!formData.lich_su_vi_pham?.vi_pham_dia_phuong?.co_khong} onChange={() => updateNested('lich_su_vi_pham.vi_pham_dia_phuong.co_khong', false)} className="accent-red-600" /> Không vi phạm</label>
                    <label className="flex items-center gap-2 text-xs font-bold cursor-pointer"><input type="radio" checked={!!formData.lich_su_vi_pham?.vi_pham_dia_phuong?.co_khong} onChange={() => updateNested('lich_su_vi_pham.vi_pham_dia_phuong.co_khong', true)} className="accent-red-600" /> Có vi phạm</label>
                  </div>
                </div>
                {formData.lich_su_vi_pham?.vi_pham_dia_phuong?.co_khong && (
                  <div className="p-5 bg-gray-50/50 rounded-xl space-y-4">
                    <div>
                      <label className="block text-[10px] font-bold text-gray-500 uppercase mb-2">Nội dung chi tiết (Thời gian, nội dung, ở đâu?)</label>
                      <textarea className="w-full p-4 bg-white border border-gray-200 rounded-xl text-xs" rows={2} placeholder="VD: Năm 2020 đánh nhau gây thương tích tại xã X..." value={formData.lich_su_vi_pham.vi_pham_dia_phuong.noi_dung || ''} onChange={e => updateNested('lich_su_vi_pham.vi_pham_dia_phuong.noi_dung', e.target.value)} />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-gray-500 uppercase mb-2">Kết quả giải quyết</label>
                      <textarea className="w-full p-3 bg-white border border-gray-200 rounded-xl text-xs" rows={1} placeholder="Đã bị xử phạt hành chính / Đã hòa giải..." value={formData.lich_su_vi_pham.vi_pham_dia_phuong.ket_qua || ''} onChange={e => updateNested('lich_su_vi_pham.vi_pham_dia_phuong.ket_qua', e.target.value)} />
                    </div>
                  </div>
                )}
              </div>

              {/* Gambling */}
              <div className="p-6 bg-white border-l-4 border-red-500 rounded-xl shadow-sm space-y-6">
                <div className="flex justify-between items-center">
                  <h4 className="text-[11px] font-black text-red-800 uppercase">2. Tham gia đánh bạc / Cá độ</h4>
                  <div className="flex gap-6">
                    <label className="flex items-center gap-2 text-xs font-bold cursor-pointer"><input type="radio" checked={!formData.lich_su_vi_pham?.danh_bac?.co_khong} onChange={() => updateNested('lich_su_vi_pham.danh_bac.co_khong', false)} className="accent-red-600" /> Chưa từng</label>
                    <label className="flex items-center gap-2 text-xs font-bold cursor-pointer"><input type="radio" checked={!!formData.lich_su_vi_pham?.danh_bac?.co_khong} onChange={() => updateNested('lich_su_vi_pham.danh_bac.co_khong', true)} className="accent-red-600" /> Đã từng tham gia</label>
                  </div>
                </div>
                {formData.lich_su_vi_pham?.danh_bac?.co_khong && (
                  <div className="p-5 bg-gray-50/50 rounded-xl grid grid-cols-2 gap-6">
                    <div>
                      <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Hình thức chơi</label>
                      <input type="text" className="w-full p-2 border border-gray-200 rounded-lg text-xs" placeholder="VD: Lô đề, bóng đá, xóc đĩa..." value={formData.lich_su_vi_pham.danh_bac.hinh_thuc || ''} onChange={e => updateNested('lich_su_vi_pham.danh_bac.hinh_thuc', e.target.value)} />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Chơi với ai?</label>
                      <input type="text" className="w-full p-2 border border-gray-200 rounded-lg text-xs" placeholder="VD: Bạn bè xã hội, người lạ..." value={formData.lich_su_vi_pham.danh_bac.doi_tuong || ''} onChange={e => updateNested('lich_su_vi_pham.danh_bac.doi_tuong', e.target.value)} />
                    </div>
                    <div className="col-span-2">
                      <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Địa điểm / Thời gian</label>
                      <input type="text" className="w-full p-2 border border-gray-200 rounded-lg text-xs" placeholder="Chơi ở đâu? Khi nào?" value={formData.lich_su_vi_pham.danh_bac.dia_diem || ''} onChange={e => updateNested('lich_su_vi_pham.danh_bac.dia_diem', e.target.value)} />
                    </div>
                  </div>
                )}
              </div>

              {/* Drugs */}
              <div className="p-6 bg-white border-l-4 border-red-500 rounded-xl shadow-sm space-y-6">
                <div className="flex justify-between items-center">
                  <h4 className="text-[11px] font-black text-red-800 uppercase">3. Sử dụng Ma túy / Chất gây nghiện</h4>
                  <div className="flex gap-6">
                    <label className="flex items-center gap-2 text-xs font-bold cursor-pointer"><input type="radio" checked={!formData.lich_su_vi_pham?.ma_tuy?.co_khong} onChange={() => updateNested('lich_su_vi_pham.ma_tuy.co_khong', false)} className="accent-red-600" /> Chưa từng</label>
                    <label className="flex items-center gap-2 text-xs font-bold cursor-pointer"><input type="radio" checked={!!formData.lich_su_vi_pham?.ma_tuy?.co_khong} onChange={() => updateNested('lich_su_vi_pham.ma_tuy.co_khong', true)} className="accent-red-600" /> Đã từng sử dụng</label>
                  </div>
                </div>
                {formData.lich_su_vi_pham?.ma_tuy?.co_khong && (
                  <div className="p-5 bg-gray-50/50 rounded-xl grid grid-cols-3 gap-6">
                    <div>
                      <label className="block text-[10px] font-bold text-gray-500 mb-1 uppercase">Thời gian (từ khi nào?)</label>
                      <input type="text" className="w-full p-2 border border-gray-200 rounded-lg text-xs" value={formData.lich_su_vi_pham.ma_tuy.thoi_gian || ''} onChange={e => updateNested('lich_su_vi_pham.ma_tuy.thoi_gian', e.target.value)} />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-gray-500 mb-1 uppercase">Loại chất</label>
                      <input type="text" className="w-full p-2 border border-gray-200 rounded-lg text-xs" placeholder="Cỏ, Ke, Đá..." value={formData.lich_su_vi_pham.ma_tuy.loai || ''} onChange={e => updateNested('lich_su_vi_pham.ma_tuy.loai', e.target.value)} />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-gray-500 mb-1 uppercase">Số lần sử dụng</label>
                      <input type="text" className="w-full p-2 border border-gray-200 rounded-lg text-xs" value={formData.lich_su_vi_pham.ma_tuy.so_lan || ''} onChange={e => updateNested('lich_su_vi_pham.ma_tuy.so_lan', e.target.value)} />
                    </div>
                    <div className="col-span-2">
                      <label className="block text-[10px] font-bold text-gray-500 mb-1 uppercase">Sử dụng với ai?</label>
                      <input type="text" className="w-full p-2 border border-gray-200 rounded-lg text-xs" value={formData.lich_su_vi_pham.ma_tuy.doi_tuong || ''} onChange={e => updateNested('lich_su_vi_pham.ma_tuy.doi_tuong', e.target.value)} />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-gray-500 mb-1 uppercase">Đã bị xử lý chưa?</label>
                      <input type="text" className="w-full p-2 border border-gray-200 rounded-lg text-xs" placeholder="Có/Không" value={formData.lich_su_vi_pham.ma_tuy.xu_ly || ''} onChange={e => updateNested('lich_su_vi_pham.ma_tuy.xu_ly', e.target.value)} />
                    </div>
                    <div className="col-span-3">
                      <label className="block text-[10px] font-bold text-gray-500 mb-1 uppercase">Hình thức xử lý (nếu có) & Chi tiết</label>
                      <textarea className="w-full p-3 bg-white border border-gray-200 rounded-xl text-xs" rows={2} placeholder="Ghi rõ hình thức xử lý..." value={formData.lich_su_vi_pham.ma_tuy.hinh_thuc_xu_ly || ''} onChange={e => updateNested('lich_su_vi_pham.ma_tuy.hinh_thuc_xu_ly', e.target.value)} />
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
              <h3 className="flex items-center gap-2 text-[#14452F] font-black uppercase text-xs mb-6">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" strokeWidth="2"/></svg>
                Tình hình tài chính
              </h3>
              <div className="space-y-6">
                <div className="p-6 bg-white border border-yellow-50 rounded-2xl shadow-sm space-y-6 bg-gradient-to-br from-yellow-50/30 to-transparent">
                  <div className="flex justify-between items-center">
                    <h4 className="text-[11px] font-black text-yellow-800 uppercase">1. Vay nợ (Cá nhân / Tổ chức / Tín dụng đen...)</h4>
                    <div className="flex gap-6">
                      <label className="flex items-center gap-2 text-xs font-bold cursor-pointer"><input type="radio" checked={!formData.tai_chinh_suc_khoe?.vay_no?.co_khong} onChange={() => updateNested('tai_chinh_suc_khoe.vay_no.co_khong', false)} className="accent-yellow-700" /> Không</label>
                      <label className="flex items-center gap-2 text-xs font-bold cursor-pointer"><input type="radio" checked={!!formData.tai_chinh_suc_khoe?.vay_no?.co_khong} onChange={() => updateNested('tai_chinh_suc_khoe.vay_no.co_khong', true)} className="accent-yellow-700" /> Có</label>
                    </div>
                  </div>
                  {formData.tai_chinh_suc_khoe?.vay_no?.co_khong && (
                    <div className="grid grid-cols-2 gap-x-8 gap-y-4 p-5 bg-white/60 border border-yellow-100 rounded-xl">
                      <div>
                        <label className="block text-[10px] font-bold text-gray-600 mb-1">Ai đứng tên vay?</label>
                        <input type="text" className="w-full p-2 border border-gray-200 rounded-lg text-xs" placeholder="Bản thân / Vợ / Bố mẹ..." value={formData.tai_chinh_suc_khoe.vay_no.nguoi_dung_ten || ''} onChange={e => updateNested('tai_chinh_suc_khoe.vay_no.nguoi_dung_ten', e.target.value)} />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-gray-600 mb-1">Ai là người trả nợ?</label>
                        <input type="text" className="w-full p-2 border border-gray-200 rounded-lg text-xs" placeholder="Người chịu trách nhiệm trả" value={formData.tai_chinh_suc_khoe.vay_no.nguoi_tra || ''} onChange={e => updateNested('tai_chinh_suc_khoe.vay_no.nguoi_tra', e.target.value)} />
                      </div>
                      <div className="col-span-1">
                        <label className="block text-[10px] font-bold text-gray-600 mb-1">Vay của ai / Tổ chức nào?</label>
                        <input type="text" className="w-full p-2 border border-gray-200 rounded-lg text-xs" value={formData.tai_chinh_suc_khoe.vay_no.ai_vay || ''} onChange={e => updateNested('tai_chinh_suc_khoe.vay_no.ai_vay', e.target.value)} />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-[10px] font-bold text-gray-600 mb-1">Số tiền (VNĐ)</label>
                          <input type="text" className="w-full p-2 border border-gray-200 rounded-lg text-xs font-bold" value={formData.tai_chinh_suc_khoe.vay_no.so_tien || ''} onChange={e => updateNested('tai_chinh_suc_khoe.vay_no.so_tien', e.target.value)} />
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold text-gray-600 mb-1">Hạn trả</label>
                          <input type="text" className="w-full p-2 border border-gray-200 rounded-lg text-xs" value={formData.tai_chinh_suc_khoe.vay_no.han_tra || ''} onChange={e => updateNested('tai_chinh_suc_khoe.vay_no.han_tra', e.target.value)} />
                        </div>
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-gray-600 mb-1">Hình thức vay</label>
                        <input type="text" className="w-full p-2 border border-gray-200 rounded-lg text-xs" placeholder="Tín chấp / Thế chấp / App..." value={formData.tai_chinh_suc_khoe.vay_no.hinh_thuc || ''} onChange={e => updateNested('tai_chinh_suc_khoe.vay_no.hinh_thuc', e.target.value)} />
                      </div>
                      <div className="flex items-center gap-3 pt-6">
                        <input type="checkbox" checked={!!formData.tai_chinh_suc_khoe.vay_no.gia_dinh_biet} onChange={e => updateNested('tai_chinh_suc_khoe.vay_no.gia_dinh_biet', e.target.checked)} className="w-4 h-4 accent-yellow-700" />
                        <label className="text-[10px] font-bold text-gray-700 uppercase">Gia đình đã biết chuyện vay nợ</label>
                      </div>
                      <div className="col-span-2">
                        <label className="block text-[10px] font-bold text-gray-600 mb-1">Mục đích vay & Chi tiết khác</label>
                        <textarea className="w-full p-3 bg-white border border-gray-200 rounded-xl text-xs" rows={2} placeholder="Vay để làm gì? ..." value={formData.tai_chinh_suc_khoe.vay_no.muc_dich || ''} onChange={e => updateNested('tai_chinh_suc_khoe.vay_no.muc_dich', e.target.value)} />
                      </div>
                    </div>
                  )}
                </div>

                <div className="p-6 bg-white border border-gray-100 rounded-2xl shadow-sm space-y-4">
                  <div className="flex justify-between items-center">
                    <h4 className="text-[11px] font-black text-gray-800 uppercase">2. Kinh doanh & Bất động sản</h4>
                    <div className="flex gap-6">
                      <label className="flex items-center gap-2 text-xs font-bold cursor-pointer"><input type="radio" checked={!formData.tai_chinh_suc_khoe?.kinh_doanh?.co_khong} onChange={() => updateNested('tai_chinh_suc_khoe.kinh_doanh.co_khong', false)} className="accent-[#14452F]" /> Không</label>
                      <label className="flex items-center gap-2 text-xs font-bold cursor-pointer"><input type="radio" checked={!!formData.tai_chinh_suc_khoe?.kinh_doanh?.co_khong} onChange={() => updateNested('tai_chinh_suc_khoe.kinh_doanh.co_khong', true)} className="accent-[#14452F]" /> Có</label>
                    </div>
                  </div>
                  {formData.tai_chinh_suc_khoe?.kinh_doanh?.co_khong && (
                    <div>
                      <label className="block text-[10px] font-bold text-gray-500 mb-1 uppercase">Chi tiết đối tác & Địa chỉ kinh doanh</label>
                      <textarea className="w-full p-4 bg-gray-50 border border-gray-100 rounded-xl text-xs" rows={2} placeholder="Tên tổ chức/cá nhân, tên công ty, địa chỉ cụ thể..." value={formData.tai_chinh_suc_khoe.kinh_doanh.chi_tiet || ''} onChange={e => updateNested('tai_chinh_suc_khoe.kinh_doanh.chi_tiet', e.target.value)} />
                    </div>
                  )}
                </div>
              </div>
            </section>

            <section>
              <h3 className="flex items-center gap-2 text-[#14452F] font-black uppercase text-xs mb-6">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" strokeWidth="2"/></svg>
                Sức khỏe
              </h3>
              <div className="p-6 bg-white border border-gray-100 rounded-2xl shadow-sm">
                <div className="flex justify-between items-center mb-4">
                  <label className="text-[11px] font-bold text-gray-700 uppercase">Đã từng mắc Covid-19 chưa?</label>
                  <div className="flex gap-6">
                    <label className="flex items-center gap-2 text-xs font-bold cursor-pointer"><input type="radio" checked={!formData.tai_chinh_suc_khoe?.covid_ban_than?.da_mac} onChange={() => updateNested('tai_chinh_suc_khoe.covid_ban_than.da_mac', false)} className="accent-green-700" /> Không</label>
                    <label className="flex items-center gap-2 text-xs font-bold cursor-pointer"><input type="radio" checked={!!formData.tai_chinh_suc_khoe?.covid_ban_than?.da_mac} onChange={() => updateNested('tai_chinh_suc_khoe.covid_ban_than.da_mac', true)} className="accent-green-700" /> Có</label>
                  </div>
                </div>
                {formData.tai_chinh_suc_khoe?.covid_ban_than?.da_mac && (
                  <input type="text" placeholder="Thời gian mắc bệnh (Tháng/Năm)" className="w-full p-2 border border-gray-200 rounded-lg text-xs" value={formData.tai_chinh_suc_khoe.covid_ban_than.thoi_gian || ''} onChange={e => updateNested('tai_chinh_suc_khoe.covid_ban_than.thoi_gian', e.target.value)} />
                )}
              </div>
            </section>
          </div>
        )}

        {/* --- TAB 7: CAM KẾT & NGUYỆN VỌNG --- */}
        {activeTab === 7 && (
          <div className="animate-fade-in space-y-10 max-w-4xl mx-auto py-10">
            <h3 className="flex items-center justify-center gap-2 text-[#14452F] font-black uppercase text-xl mb-12 tracking-widest">
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" strokeWidth="2"/></svg>
              Ý kiến, Nguyện vọng & Cam đoan
            </h3>
            
            <div className="space-y-12">
              <div className="space-y-4">
                <h4 className="text-sm font-black text-gray-800 uppercase tracking-widest border-b-2 border-gray-100 pb-2">II. Ý KIẾN VÀ NGUYỆN VỌNG CỦA BẢN THÂN</h4>
                <p className="text-gray-500 text-[11px] font-medium leading-relaxed italic">Đồng chí có ý kiến, đề xuất hoặc hoàn cảnh đặc biệt nào cần đơn vị quan tâm giúp đỡ không?</p>
                <textarea className="w-full p-8 bg-gray-50/50 border border-gray-200 rounded-[2.5rem] outline-none shadow-inner min-h-[300px] leading-relaxed text-sm focus:ring-4 ring-green-50 transition-all" value={formData.y_kien_nguyen_vong || ''} onChange={e => setFormData({...formData, y_kien_nguyen_vong: e.target.value})} placeholder="Ghi rõ nội dung..." />
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

        {/* --- TAB 8: THÔNG TIN BỔ SUNG --- */}
        {activeTab === 8 && (
          <div className="animate-fade-in space-y-10">
            <h3 className="flex items-center gap-2 text-[#14452F] font-black uppercase text-xs mb-6">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path d="M11 3a1 1 0 10-2 0v1a1 1 0 102 0V3zM15.657 5.757a1 1 0 00-1.414-1.414l-.707.707a1 1 0 001.414 1.414l.707-.707zM18 10a1 1 0 10-2 0h-1a1 1 0 100 2h1a1 1 0 100 2H2a1 1 0 102 0zM15.657 18.243a1 1 0 00-1.414-1.414l-.707.707a1 1 0 001.414 1.414l.707-.707zM11 19a1 1 0 10-2 0v1a1 1 0 102 0v-1zM4.343 18.243a1 1 0 001.414-1.414l.707-.707a1 1 0 00-1.414-1.414l-.707.707zM3 10a1 1 0 10-2 0h1a1 1 0 100 2H2a1 1 0 102 0zM4.343 5.757a1 1 0 001.414-1.414l.707-.707a1 1 0 00-1.414-1.414l-.707.707z"/></svg>
              Thông tin bổ sung
            </h3>
            <div className="p-5 bg-white border border-gray-100 rounded-xl text-[11px] font-bold text-gray-500 mb-8 flex items-center gap-3 shadow-inner">
               <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"/></svg>
               Các trường dữ liệu này được yêu cầu thêm bởi đơn vị.
            </div>
            {customFields.length === 0 ? (
               <div className="py-20 text-center text-gray-300 font-bold uppercase text-xs tracking-widest border-4 border-dashed rounded-[3rem]">Không có thông tin bổ sung cho đơn vị này.</div>
            ) : (
               <div className="grid grid-cols-2 gap-8">
                {customFields.map(f => (
                  <div key={f.id} className="p-6 bg-gray-50 border border-gray-100 rounded-[2rem] shadow-sm">
                    <label className="block text-[10px] font-black uppercase text-gray-400 mb-2">{f.display_name} {f.is_required && <span className="text-red-500">*</span>}</label>
                    <input type="text" className="w-full p-2.5 bg-white border border-gray-200 rounded-xl outline-none font-bold" value={formData.custom_data?.[f.field_key] || ''} onChange={e => setFormData({...formData, custom_data: {...formData.custom_data, [f.field_key]: e.target.value}})} />
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

      </div>

      {/* Footer Actions - Sửa lỗi màu nút bấm tại đây */}
      <div className="p-6 bg-gray-50 border-t flex justify-end gap-4 shrink-0 shadow-[0_-4px_20px_rgba(0,0,0,0.05)]">
        <button 
          onClick={onClose} 
          className="px-10 py-4 bg-gray-200 text-gray-800 rounded-2xl font-black uppercase text-xs tracking-widest hover:bg-gray-300 transition-all border border-gray-300"
        >
          Hủy bỏ
        </button>
        <button 
          onClick={handleSave} 
          className="px-16 py-4 bg-[#14452F] text-white rounded-2xl font-black uppercase text-xs tracking-widest shadow-xl hover:bg-[#1a5a3d] active:scale-95 transition-all"
        >
          Hoàn thành & Lưu hồ sơ
        </button>
      </div>
    </div>
  );
};

export default PersonnelForm;