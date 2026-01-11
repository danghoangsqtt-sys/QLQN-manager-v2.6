import React, { useState, useEffect, useRef } from 'react';
import { MilitaryPersonnel, Unit } from '../types';
import { db } from '../store';
import { Trash2, Plus, Camera, X, Calendar as CalendarIcon, Save, Upload, User, Users, ShieldAlert, GraduationCap, DollarSign, Globe, Clock, Share2, Medal, Heart, Home, Smartphone, Facebook, MessageCircle, Activity, Gavel, AlertTriangle, Phone, CheckSquare, CreditCard, TrendingUp, Cigarette, Plane, FileSignature } from 'lucide-react';
import { createThumbnail } from '../utils/imageHelper';

interface PersonnelFormProps {
  units: Unit[];
  onClose: () => void;
  initialData?: MilitaryPersonnel;
  isViewMode?: boolean; 
}

// --- DỮ LIỆU MẶC ĐỊNH ĐẦY ĐỦ ---
const DEFAULT_DATA: any = {
  // 1. Thông tin cơ bản
  ho_ten: '', ten_khac: '', ngay_sinh: '', cccd: '', sdt_rieng: '',
  cap_bac: 'Binh nhì', chuc_vu: '', don_vi_id: '',
  nhap_ngu_ngay: '', xuat_ngu_ngay: '', 
  ngay_vao_doan: '', vao_dang_ngay: '',
  ho_khau_thu_tru: '', noi_sinh: '', dan_toc: 'Kinh', ton_giao: 'Không',
  trinh_do_van_hoa: '12/12', da_tot_nghiep: false, nang_khieu_so_truong: '',
  anh_dai_dien: '',
  khen_thuong: '',

  // 2. Nghỉ phép
  nghi_phep_thuc_te: 0,
  nghi_phep_tham_chieu: 12,

  // 3. Tiểu sử & Xã hội
  tieu_su_ban_than: [], 
  mang_xa_hoi: { facebook: [], zalo: [], tiktok: [] },
  hoan_canh_song: { song_chung: '', tinh_trang_nha_o: '', hoan_canh_gia_dinh: '' },

  // 4. Gia đình
  quan_he_gia_dinh: {
    tinh_trang_hon_nhan: { da_ket_hon: false, co_ban_gai: false },
    than_nhan: [] 
  },

  // 5. An ninh & Tài chính & Sức khỏe
  tai_chinh_suc_khoe: {
    vay_no: { 
        co_khong: false, 
        so_tien: '', 
        nguoi_vay: '', 
        nguoi_tra: '', 
        chu_no: '', 
        han_tra: '', 
        hinh_thuc: '', 
        muc_dich: '', 
        gia_dinh_biet: false 
    },
    kinh_doanh_dau_tu: {
        kinh_doanh: {
            co_khong: false,
            linh_vuc: '',
            doi_tac: '',
            so_von: ''
        },
        dau_tu: {
            co_khong: false,
            loai_hinh: '',
            doi_tac: '',
            thoi_gian: '',
            so_von: '',
            ten_cong_ty: '',
            dia_chi_cong_ty: ''
        }
    },
    thu_nhap: '', 
    tai_san: '', 
    tinh_hinh_suc_khoe: '',
    phan_loai_suc_khoe: 'Loại 1', 
    benh_man_tinh: '', 
    nhom_mau: '', chieu_cao: '', can_nang: ''
  },
  lich_su_vi_pham: {
    ky_luat_quan_doi: [], 
    vi_pham_phap_luat: [], 
    te_nan_xa_hoi: { 
        ma_tuy: {
            co_khong: false,
            loai_chat: '',
            thoi_gian_bat_dau: '',
            so_lan_su_dung: '',
            hinh_thuc_su_dung: '',
            dia_diem_su_dung: '',
            nguoi_cung_su_dung: '',
            da_bi_xu_ly: false,
            hinh_thuc_xu_ly: '',
            chi_tiet_khac: ''
        },
        co_bac: {
            co_khong: false,
            hinh_thuc: '', 
            thoi_gian_choi: '',
            dia_diem_choi: '',
            nguoi_cung_choi: '',
            so_tien_thang_thua: '',
            da_bi_xu_ly: false,
            hinh_thuc_xu_ly: '',
            chi_tiet_khac: ''
        },
        ruou_che: false,
        hut_thuoc: false, 
        ghi_chu_chung: ''
    },
    quan_he_xa_hoi: '', 
    bieu_hien_tu_tuong: '' 
  },
  yeu_to_nuoc_ngoai: {
    than_nhan: [],
    da_di_nuoc_ngoai: false,
    lich_su_di_nuoc_ngoai: [],
    dinh_cu: {
        dang_lam_thu_tuc: false,
        nuoc_dinh_cu: '',
        nguoi_bao_lanh: ''
    },
    ho_chieu: { da_co: false, so_hieu: '', ngay_cap: '', noi_giu: '' }
  },
  // Mới bổ sung: Ý kiến & Cam đoan
  y_kien_cam_doan: {
      y_kien_nguyen_vong: '',
      cam_doan: 'Tôi xin cam đoan những lời khai trên là đúng sự thật và hoàn toàn chịu trách nhiệm trước pháp luật về lời khai của mình.'
  },
  vi_pham_nuoc_ngoai: false
};

const VietnamDateInput = ({ value, onChange, disabled, placeholder = "dd/mm/yyyy", className }: any) => {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let val = e.target.value;
    if (!/^[0-9/]*$/.test(val)) return;
    onChange(val);
  };

  return (
    <div className="relative w-full">
      <input
        type="text"
        value={value || ''}
        onChange={handleChange}
        placeholder={placeholder}
        disabled={disabled}
        maxLength={10}
        className={`${className} pl-9 w-full`}
      />
      <CalendarIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
    </div>
  );
};

const PersonnelForm: React.FC<PersonnelFormProps> = ({ units, onClose, initialData, isViewMode = false }) => {
  const [formData, setFormData] = useState<any>(JSON.parse(JSON.stringify(DEFAULT_DATA)));
  const [activeSection, setActiveSection] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const sectionRefs = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    if (initialData) {
      // Helper convert structure
      let initialRelations = initialData.quan_he_gia_dinh || {};
      let flatRelations: any[] = [];
      
      const convert = (source: any[], type: string) => source?.map((i: any) => ({
          moi_quan_he: i.moi_quan_he || type,
          ho_ten: i.ho_ten,
          nam_sinh: i.nam_sinh,
          nghe_nghiep_dia_chi: i.nghe_nghiep || i.nghe_nghiep_dia_chi || '',
          sdt: i.sdt || '',
          bao_tin: i.bao_tin || false
      })) || [];

      if (Array.isArray(initialRelations.than_nhan) && initialRelations.than_nhan.length > 0) {
          flatRelations = initialRelations.than_nhan;
      } else {
          if (initialRelations.bo_me_de) flatRelations = [...flatRelations, ...convert(initialRelations.bo_me_de, 'Bố đẻ')];
          if (initialRelations.anh_chi_em_ruot) flatRelations = [...flatRelations, ...convert(initialRelations.anh_chi_em_ruot, 'Anh trai')];
          if (initialRelations.vo) flatRelations.push({ ...initialRelations.vo, moi_quan_he: 'Vợ', nghe_nghiep_dia_chi: initialRelations.vo.nghe_nghiep });
          if (initialRelations.ban_gai) flatRelations.push({ ...initialRelations.ban_gai, moi_quan_he: 'Bạn gái', nghe_nghiep_dia_chi: initialRelations.ban_gai.nghe_nghiep });
          if (initialRelations.con) flatRelations = [...flatRelations, ...convert(initialRelations.con, 'Con trai')];
          if (initialRelations.bo_me_vo) flatRelations = [...flatRelations, ...convert(initialRelations.bo_me_vo, 'Bố vợ')];
      }

      // Xử lý chuyển đổi dữ liệu kỷ luật cũ
      let klQuanDoi = initialData.lich_su_vi_pham?.ky_luat_quan_doi || [];
      if (!Array.isArray(klQuanDoi)) {
          if (klQuanDoi.co_khong) {
              klQuanDoi = [{ nam: klQuanDoi.nam || '', hinh_thuc: klQuanDoi.hinh_thuc || '', ly_do: klQuanDoi.ly_do || '' }];
          } else {
              klQuanDoi = [];
          }
      }

      let vpPhapLuat = initialData.lich_su_vi_pham?.vi_pham_phap_luat || [];
      if (!Array.isArray(vpPhapLuat)) {
           if (vpPhapLuat.co_khong) {
              vpPhapLuat = [{ nam: vpPhapLuat.nam || '', hinh_thuc: vpPhapLuat.hinh_thuc || '', ly_do: vpPhapLuat.ly_do || '' }];
          } else {
              vpPhapLuat = [];
          }
      }

      // Nâng cấp dữ liệu tệ nạn cũ
      let teNan = initialData.lich_su_vi_pham?.te_nan_xa_hoi || {};
      let maTuyMoi = { ...DEFAULT_DATA.lich_su_vi_pham.te_nan_xa_hoi.ma_tuy, ...(typeof teNan.ma_tuy === 'boolean' ? { co_khong: teNan.ma_tuy } : teNan.ma_tuy || {}) };
      let coBacMoi = { ...DEFAULT_DATA.lich_su_vi_pham.te_nan_xa_hoi.co_bac, ...(typeof teNan.co_bac === 'boolean' ? { co_khong: teNan.co_bac } : teNan.co_bac || {}) };

      // Nâng cấp dữ liệu Yếu tố nước ngoài
      let nuocNgoai = initialData.yeu_to_nuoc_ngoai || {};
      let lichSuDi = nuocNgoai.lich_su_di_nuoc_ngoai || [];
      if (nuocNgoai.di_nuoc_ngoai && Array.isArray(nuocNgoai.di_nuoc_ngoai) && lichSuDi.length === 0) {
          lichSuDi = nuocNgoai.di_nuoc_ngoai;
      }

      const mergedData = { 
        ...DEFAULT_DATA, 
        ...initialData,
        quan_he_gia_dinh: {
            tinh_trang_hon_nhan: initialRelations.tinh_trang_hon_nhan || { 
                da_ket_hon: !!initialRelations.vo, 
                co_ban_gai: !!initialRelations.ban_gai 
            },
            than_nhan: flatRelations
        },
        tai_chinh_suc_khoe: { 
            ...DEFAULT_DATA.tai_chinh_suc_khoe, 
            ...(initialData.tai_chinh_suc_khoe || {}),
            vay_no: { ...DEFAULT_DATA.tai_chinh_suc_khoe.vay_no, ...(initialData.tai_chinh_suc_khoe?.vay_no || {}) },
            kinh_doanh_dau_tu: {
                kinh_doanh: { ...DEFAULT_DATA.tai_chinh_suc_khoe.kinh_doanh_dau_tu.kinh_doanh, ...(initialData.tai_chinh_suc_khoe?.kinh_doanh_dau_tu?.kinh_doanh || {}) },
                dau_tu: { ...DEFAULT_DATA.tai_chinh_suc_khoe.kinh_doanh_dau_tu.dau_tu, ...(initialData.tai_chinh_suc_khoe?.kinh_doanh_dau_tu?.dau_tu || {}) }
            }
        },
        lich_su_vi_pham: { 
            ...DEFAULT_DATA.lich_su_vi_pham, 
            ...(initialData.lich_su_vi_pham || {}),
            ky_luat_quan_doi: klQuanDoi,
            vi_pham_phap_luat: vpPhapLuat,
            te_nan_xa_hoi: {
                ...DEFAULT_DATA.lich_su_vi_pham.te_nan_xa_hoi,
                ...teNan,
                ma_tuy: maTuyMoi,
                co_bac: coBacMoi,
                hut_thuoc: teNan.hut_thuoc !== undefined ? teNan.hut_thuoc : DEFAULT_DATA.lich_su_vi_pham.te_nan_xa_hoi.hut_thuoc
            }
        },
        yeu_to_nuoc_ngoai: { 
            ...DEFAULT_DATA.yeu_to_nuoc_ngoai, 
            ...nuocNgoai,
            lich_su_di_nuoc_ngoai: lichSuDi,
            dinh_cu: { ...DEFAULT_DATA.yeu_to_nuoc_ngoai.dinh_cu, ...(nuocNgoai.dinh_cu || {}) }
        },
        // Merge Ý kiến & Cam đoan
        y_kien_cam_doan: {
            ...DEFAULT_DATA.y_kien_cam_doan,
            ...(initialData.y_kien_cam_doan || {})
        },
        mang_xa_hoi: { ...DEFAULT_DATA.mang_xa_hoi, ...(initialData.mang_xa_hoi || {}) },
        hoan_canh_song: { ...DEFAULT_DATA.hoan_canh_song, ...(initialData.hoan_canh_song || {}) },
        tieu_su_ban_than: initialData.tieu_su_ban_than || []
      };
      
      setFormData(mergedData);
    }
  }, [initialData]);

  // Scrollspy logic
  useEffect(() => {
    const handleScroll = (e: Event) => {
      const container = e.target as HTMLDivElement;
      const scrollPos = container.scrollTop + 150;
      sectionRefs.current.forEach((section, index) => {
        if (section && section.offsetTop <= scrollPos && (section.offsetTop + section.offsetHeight) > scrollPos) {
          setActiveSection(index);
        }
      });
    };
    const formContainer = document.getElementById('form-scroll-container');
    if (formContainer) formContainer.addEventListener('scroll', handleScroll);
    return () => {
      if (formContainer) formContainer.removeEventListener('scroll', handleScroll);
    };
  }, []);

  const scrollToSection = (index: number) => {
    setActiveSection(index);
    sectionRefs.current[index]?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        const base64 = await createThumbnail(file, 800, 0.8);
        setFormData({ ...formData, anh_dai_dien: base64, anh_thumb: base64 });
      } catch (err) {
        console.error("Lỗi ảnh:", err);
      }
    }
  };

  const handleSave = async () => {
    if (!formData.ho_ten || !formData.don_vi_id) {
      alert("Vui lòng nhập Họ tên và Đơn vị!");
      return;
    }
    
    const saveData = { ...formData };
    const rels = formData.quan_he_gia_dinh.than_nhan;
    
    saveData.quan_he_gia_dinh.vo = rels.find((r:any) => r.moi_quan_he === 'Vợ' || r.moi_quan_he === 'Chồng') || null;
    saveData.quan_he_gia_dinh.con = rels.filter((r:any) => ['Con trai', 'Con gái', 'Con nuôi'].includes(r.moi_quan_he));
    saveData.quan_he_gia_dinh.ban_gai = rels.find((r:any) => r.moi_quan_he === 'Bạn gái') || null;

    try {
      if (initialData?.id) {
        await db.updatePersonnel(initialData.id, saveData);
      } else {
        await db.addPersonnel(saveData);
      }
      onClose();
    } catch (e) {
      console.error(e);
      alert("Lỗi khi lưu dữ liệu");
    }
  };

  const inputClass = `w-full bg-white border border-slate-200 rounded-xl px-3 py-2.5 text-sm font-medium text-slate-700 outline-none focus:border-green-600 focus:ring-1 focus:ring-green-600/20 transition-all disabled:bg-slate-50 disabled:text-slate-500`;
  const labelClass = `block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 ml-1`;
  const sectionTitleClass = `text-sm font-black text-slate-800 uppercase tracking-widest border-b border-slate-200 pb-3 mb-6 flex items-center gap-3`;
  const sectionIconClass = `w-8 h-8 rounded-lg bg-slate-100 text-slate-600 flex items-center justify-center`;

  const SECTIONS = [
    { title: "Thông tin cơ bản", icon: User },
    { title: "Chính trị & Nhập ngũ", icon: Users },
    { title: "Trình độ & Đào tạo", icon: GraduationCap },
    { title: "Tiểu sử bản thân", icon: Clock },
    { title: "Quan hệ gia đình", icon: Heart },
    { title: "Đời sống & MXH", icon: Share2 },
    { title: "Tài chính & Sức khỏe", icon: DollarSign },
    { title: "Lịch sử & An ninh", icon: ShieldAlert },
    { title: "Yếu tố nước ngoài", icon: Globe },
    { title: "Ý kiến & Cam đoan", icon: FileSignature }
  ];

  // Helper render bảng quan hệ
  const renderRelationTable = (
        groupFilter: (r: any) => boolean, 
        title: string, 
        defaultRole: string, 
        relationOptions: string[], 
        canAdd: boolean = true
    ) => {
      const itemsWithIndex = formData.quan_he_gia_dinh.than_nhan.map((item: any, index: number) => ({...item, originalIndex: index})).filter(groupFilter);

      return (
        <div className="mb-6">
            <div className="flex justify-between items-center mb-2">
                <h4 className="text-xs font-black uppercase text-slate-500 flex items-center gap-2">
                    {title}
                </h4>
                {canAdd && !isViewMode && (
                    <button 
                        onClick={() => {
                            const newItem = { moi_quan_he: defaultRole, ho_ten: '', nam_sinh: '', nghe_nghiep_dia_chi: '', sdt: '', bao_tin: false };
                            setFormData({
                                ...formData,
                                quan_he_gia_dinh: {
                                    ...formData.quan_he_gia_dinh,
                                    than_nhan: [...formData.quan_he_gia_dinh.than_nhan, newItem]
                                }
                            });
                        }}
                        className="text-[10px] font-bold text-green-600 bg-green-50 px-2 py-1 rounded border border-green-200 hover:bg-green-100 flex items-center gap-1"
                    >
                        <Plus size={10}/> Thêm
                    </button>
                )}
            </div>
            
            <div className="overflow-x-auto border border-slate-200 rounded-xl">
                <table className="w-full text-left border-collapse">
                    <thead className="bg-slate-50 text-[10px] uppercase text-slate-500 font-bold">
                        <tr>
                            <th className="p-3 border-r border-slate-200 w-32">Quan hệ</th>
                            <th className="p-3 border-r border-slate-200 w-48">Họ và Tên</th>
                            <th className="p-3 border-r border-slate-200 w-20">Năm sinh</th>
                            <th className="p-3 border-r border-slate-200">Nghề nghiệp / Địa chỉ</th>
                            <th className="p-3 border-r border-slate-200 w-28">SĐT</th>
                            <th className="p-3 border-r border-slate-200 w-16 text-center">Báo tin</th>
                            {!isViewMode && <th className="p-3 w-10 text-center">Xóa</th>}
                        </tr>
                    </thead>
                    <tbody className="text-sm">
                        {itemsWithIndex.map((item: any) => {
                             const index = item.originalIndex;
                             return (
                                <tr key={index} className="border-b border-slate-100 last:border-0 hover:bg-slate-50 transition-colors">
                                    <td className="p-2 border-r border-slate-100">
                                        <select
                                            disabled={isViewMode}
                                            className="w-full bg-transparent outline-none font-bold text-green-700 text-xs py-1"
                                            value={item.moi_quan_he}
                                            onChange={e => {
                                                const newArr = [...formData.quan_he_gia_dinh.than_nhan];
                                                newArr[index] = { ...newArr[index], moi_quan_he: e.target.value };
                                                setFormData({
                                                    ...formData, 
                                                    quan_he_gia_dinh: {
                                                        ...formData.quan_he_gia_dinh, 
                                                        than_nhan: newArr
                                                    }
                                                });
                                            }}
                                        >
                                            {relationOptions.map(opt => (
                                                <option key={opt} value={opt}>{opt}</option>
                                            ))}
                                        </select>
                                    </td>
                                    <td className="p-2 border-r border-slate-100">
                                        <input disabled={isViewMode} type="text" className="w-full bg-transparent outline-none font-bold text-slate-700" placeholder="Nhập tên..." value={item.ho_ten} onChange={e => {
                                            const newArr = [...formData.quan_he_gia_dinh.than_nhan];
                                            newArr[index] = { ...newArr[index], ho_ten: e.target.value };
                                            setFormData({...formData, quan_he_gia_dinh: {...formData.quan_he_gia_dinh, than_nhan: newArr}});
                                        }} />
                                    </td>
                                    <td className="p-2 border-r border-slate-100">
                                        <input disabled={isViewMode} type="text" className="w-full bg-transparent outline-none" placeholder="yyyy" value={item.nam_sinh} onChange={e => {
                                            const newArr = [...formData.quan_he_gia_dinh.than_nhan];
                                            newArr[index] = { ...newArr[index], nam_sinh: e.target.value };
                                            setFormData({...formData, quan_he_gia_dinh: {...formData.quan_he_gia_dinh, than_nhan: newArr}});
                                        }} />
                                    </td>
                                    <td className="p-2 border-r border-slate-100">
                                        <input disabled={isViewMode} type="text" className="w-full bg-transparent outline-none" placeholder="Đang ở đâu, làm gì?" value={item.nghe_nghiep_dia_chi} onChange={e => {
                                            const newArr = [...formData.quan_he_gia_dinh.than_nhan];
                                            newArr[index] = { ...newArr[index], nghe_nghiep_dia_chi: e.target.value };
                                            setFormData({...formData, quan_he_gia_dinh: {...formData.quan_he_gia_dinh, than_nhan: newArr}});
                                        }} />
                                    </td>
                                    <td className="p-2 border-r border-slate-100">
                                        <input disabled={isViewMode} type="text" className="w-full bg-transparent outline-none text-xs" placeholder="09xx..." value={item.sdt} onChange={e => {
                                            const newArr = [...formData.quan_he_gia_dinh.than_nhan];
                                            newArr[index] = { ...newArr[index], sdt: e.target.value };
                                            setFormData({...formData, quan_he_gia_dinh: {...formData.quan_he_gia_dinh, than_nhan: newArr}});
                                        }} />
                                    </td>
                                    <td className="p-2 border-r border-slate-100 text-center">
                                        <input disabled={isViewMode} type="checkbox" className="w-4 h-4 accent-green-600 rounded cursor-pointer" checked={item.bao_tin} onChange={e => {
                                            const newArr = [...formData.quan_he_gia_dinh.than_nhan];
                                            newArr[index] = { ...newArr[index], bao_tin: e.target.checked };
                                            setFormData({...formData, quan_he_gia_dinh: {...formData.quan_he_gia_dinh, than_nhan: newArr}});
                                        }} />
                                    </td>
                                    {!isViewMode && (
                                        <td className="p-2 text-center">
                                            <button onClick={() => {
                                                const newArr = formData.quan_he_gia_dinh.than_nhan.filter((_:any, i:number) => i !== index);
                                                setFormData({...formData, quan_he_gia_dinh: {...formData.quan_he_gia_dinh, than_nhan: newArr}});
                                            }} className="text-slate-400 hover:text-red-500"><Trash2 size={14}/></button>
                                        </td>
                                    )}
                                </tr>
                             );
                        })}
                        {itemsWithIndex.length === 0 && (
                            <tr><td colSpan={7} className="p-4 text-center text-xs text-slate-400 italic">Chưa có thông tin</td></tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
      );
  };

  const FAMILY_OPTIONS = ['Bố đẻ', 'Mẹ đẻ', 'Bố nuôi', 'Mẹ nuôi', 'Anh trai', 'Chị gái', 'Em trai', 'Em gái'];
  const MARRIAGE_OPTIONS = ['Vợ', 'Chồng', 'Con trai', 'Con gái', 'Con nuôi', 'Bố vợ', 'Mẹ vợ', 'Bố chồng', 'Mẹ chồng'];
  const GF_OPTIONS = ['Bạn gái', 'Người yêu'];

  // Helper render bảng vi phạm/kỷ luật
  const renderViolationTable = (dataKey: 'ky_luat_quan_doi' | 'vi_pham_phap_luat', title: string) => {
      const items = formData.lich_su_vi_pham[dataKey] || [];
      
      return (
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden mb-4">
            <div className="bg-slate-50 px-4 py-3 flex justify-between items-center border-b border-slate-200">
                <h4 className="text-xs font-bold text-slate-700 uppercase">{title}</h4>
                {!isViewMode && (
                    <button 
                        onClick={() => {
                            setFormData({
                                ...formData,
                                lich_su_vi_pham: {
                                    ...formData.lich_su_vi_pham,
                                    [dataKey]: [...items, { nam: '', hinh_thuc: '', ly_do: '', don_vi_xu_ly: '', noi_dung: '', ket_qua_giai_quyet: '' }]
                                }
                            });
                        }}
                        className="text-[10px] font-bold text-blue-600 bg-blue-50 px-2 py-1 rounded border border-blue-200 hover:bg-blue-100 flex items-center gap-1"
                    >
                        <Plus size={10}/> Thêm
                    </button>
                )}
            </div>
            
            {items.length > 0 ? (
                <div className="divide-y divide-slate-100">
                    {items.map((item: any, idx: number) => (
                        <div key={idx} className="p-3 grid grid-cols-12 gap-3 items-center hover:bg-slate-50 transition-colors">
                            <div className="col-span-2">
                                <input disabled={isViewMode} type="text" className="w-full bg-slate-50 border border-slate-200 rounded px-2 py-1.5 text-xs text-center" placeholder="Năm..." value={item.nam} onChange={e => {
                                    const newItems = [...items];
                                    newItems[idx].nam = e.target.value;
                                    setFormData({...formData, lich_su_vi_pham: {...formData.lich_su_vi_pham, [dataKey]: newItems}});
                                }} />
                            </div>
                            <div className="col-span-3">
                                <input disabled={isViewMode} type="text" className="w-full bg-white border border-slate-200 rounded px-2 py-1.5 text-xs" placeholder="Hình thức..." value={item.hinh_thuc} onChange={e => {
                                    const newItems = [...items];
                                    newItems[idx].hinh_thuc = e.target.value;
                                    setFormData({...formData, lich_su_vi_pham: {...formData.lich_su_vi_pham, [dataKey]: newItems}});
                                }} />
                            </div>
                            {dataKey === 'vi_pham_phap_luat' ? (
                                <div className="col-span-6 grid grid-cols-2 gap-2">
                                    <input disabled={isViewMode} type="text" className="w-full bg-white border border-slate-200 rounded px-2 py-1.5 text-xs" placeholder="Nội dung vi phạm chi tiết..." value={item.ly_do} onChange={e => {
                                        const newItems = [...items];
                                        newItems[idx].ly_do = e.target.value;
                                        setFormData({...formData, lich_su_vi_pham: {...formData.lich_su_vi_pham, [dataKey]: newItems}});
                                    }} />
                                    <input disabled={isViewMode} type="text" className="w-full bg-white border border-slate-200 rounded px-2 py-1.5 text-xs" placeholder="Kết quả giải quyết..." value={item.ket_qua_giai_quyet} onChange={e => {
                                        const newItems = [...items];
                                        newItems[idx].ket_qua_giai_quyet = e.target.value;
                                        setFormData({...formData, lich_su_vi_pham: {...formData.lich_su_vi_pham, [dataKey]: newItems}});
                                    }} />
                                </div>
                            ) : (
                                <div className="col-span-6">
                                    <input disabled={isViewMode} type="text" className="w-full bg-white border border-slate-200 rounded px-2 py-1.5 text-xs" placeholder="Lý do & Đơn vị xử lý..." value={item.ly_do} onChange={e => {
                                        const newItems = [...items];
                                        newItems[idx].ly_do = e.target.value;
                                        setFormData({...formData, lich_su_vi_pham: {...formData.lich_su_vi_pham, [dataKey]: newItems}});
                                    }} />
                                </div>
                            )}
                            
                            {!isViewMode && (
                                <div className="col-span-1 text-center">
                                    <button onClick={() => {
                                        const newItems = items.filter((_:any, i:number) => i !== idx);
                                        setFormData({...formData, lich_su_vi_pham: {...formData.lich_su_vi_pham, [dataKey]: newItems}});
                                    }} className="text-slate-400 hover:text-red-500 p-1"><Trash2 size={14}/></button>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            ) : (
                <div className="p-4 text-center text-xs text-slate-400 italic">Không có dữ liệu</div>
            )}
        </div>
      );
  };

  return (
    <div className="bg-white w-full max-w-6xl h-[95vh] rounded-[2rem] shadow-2xl flex flex-col overflow-hidden animate-slide-up relative">
      
      {/* HEADER */}
      <div className="px-8 py-5 border-b border-slate-100 flex justify-between items-center bg-white z-20 shrink-0">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-green-50 text-green-700 rounded-2xl flex items-center justify-center font-black text-xl shadow-inner">
             {isViewMode ? <Eye size={24}/> : (initialData ? <FileEdit size={24}/> : <Plus size={24}/>)}
          </div>
          <div>
             <h2 className="text-xl font-black text-slate-800 uppercase tracking-tight">{isViewMode ? 'Xem hồ sơ' : (initialData ? 'Cập nhật hồ sơ' : 'Thêm quân nhân mới')}</h2>
             <p className="text-xs font-medium text-slate-400">{units.length} đơn vị trực thuộc hệ thống</p>
          </div>
        </div>
        <button onClick={onClose} className="w-10 h-10 rounded-full bg-slate-50 text-slate-400 hover:bg-red-50 hover:text-red-500 flex items-center justify-center transition-all">
          <X size={20} strokeWidth={2.5} />
        </button>
      </div>

      <div className="flex flex-1 min-h-0">
        
        {/* SIDEBAR */}
        <div className="w-64 bg-slate-50 border-r border-slate-100 overflow-y-auto hidden md:block py-6 px-4">
          <nav className="space-y-1">
            {SECTIONS.map((sec, idx) => {
               const Icon = sec.icon;
               return (
                <button
                  key={idx}
                  onClick={() => scrollToSection(idx)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-bold uppercase transition-all ${activeSection === idx ? 'bg-white text-green-700 shadow-sm border border-slate-100' : 'text-slate-500 hover:bg-white hover:text-slate-700'}`}
                >
                  <Icon size={16} className={activeSection === idx ? 'text-green-600' : 'text-slate-400'} />
                  {sec.title}
                </button>
               );
            })}
          </nav>
        </div>

        {/* FORM CONTENT */}
        <div id="form-scroll-container" className="flex-1 overflow-y-auto p-8 scroll-smooth bg-white">
          
          {/* 1. THÔNG TIN CƠ BẢN */}
          <div ref={el => sectionRefs.current[0] = el} className="mb-12 scroll-mt-6">
            <h3 className={sectionTitleClass}><div className={sectionIconClass}><User size={18}/></div> Thông tin cơ bản</h3>
            <div className="flex flex-col md:flex-row gap-8">
              <div className="w-40 flex-shrink-0 flex flex-col items-center gap-3">
                <div 
                  className="w-40 h-52 bg-slate-100 rounded-2xl border-2 border-dashed border-slate-300 flex flex-col items-center justify-center cursor-pointer hover:border-green-500 hover:bg-green-50 transition-all overflow-hidden relative group"
                  onClick={() => !isViewMode && fileInputRef.current?.click()}
                >
                  {formData.anh_dai_dien ? (
                    <img src={formData.anh_dai_dien} alt="Avatar" className="w-full h-full object-cover" />
                  ) : (
                    <>
                      <Camera size={32} className="text-slate-300 mb-2" />
                      <span className="text-[10px] font-bold text-slate-400 uppercase">Tải ảnh lên</span>
                    </>
                  )}
                  {!isViewMode && (
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"><Upload className="text-white" size={24}/></div>
                  )}
                </div>
                <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
              </div>

              <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="md:col-span-2">
                   <label className={labelClass}>Họ và tên <span className="text-red-500">*</span></label>
                   <input disabled={isViewMode} type="text" className={`${inputClass} !text-lg !font-bold`} placeholder="NGUYỄN VĂN A" value={formData.ho_ten} onChange={e => setFormData({...formData, ho_ten: e.target.value.toUpperCase()})} />
                </div>
                <div><label className={labelClass}>Tên khác / Bí danh</label><input disabled={isViewMode} type="text" className={inputClass} value={formData.ten_khac} onChange={e => setFormData({...formData, ten_khac: e.target.value})} /></div>
                <div><label className={labelClass}>Số hiệu quân nhân / CCCD</label><input disabled={isViewMode} type="text" className={inputClass} value={formData.cccd} onChange={e => setFormData({...formData, cccd: e.target.value})} /></div>
                <div><label className={labelClass}>Ngày sinh</label><VietnamDateInput disabled={isViewMode} className={inputClass} value={formData.ngay_sinh} onChange={(val: string) => setFormData({...formData, ngay_sinh: val})} /></div>
                <div><label className={labelClass}>Số điện thoại</label><input disabled={isViewMode} type="text" className={inputClass} value={formData.sdt_rieng} onChange={e => setFormData({...formData, sdt_rieng: e.target.value})} /></div>
                <div><label className={labelClass}>Quê quán / HKTT</label><input disabled={isViewMode} type="text" className={inputClass} value={formData.ho_khau_thu_tru} onChange={e => setFormData({...formData, ho_khau_thu_tru: e.target.value})} /></div>
                <div><label className={labelClass}>Nơi sinh</label><input disabled={isViewMode} type="text" className={inputClass} value={formData.noi_sinh} onChange={e => setFormData({...formData, noi_sinh: e.target.value})} /></div>
                <div className="grid grid-cols-2 gap-4">
                    <div><label className={labelClass}>Dân tộc</label><input disabled={isViewMode} type="text" className={inputClass} value={formData.dan_toc} onChange={e => setFormData({...formData, dan_toc: e.target.value})} /></div>
                    <div><label className={labelClass}>Tôn giáo</label><input disabled={isViewMode} type="text" className={inputClass} value={formData.ton_giao} onChange={e => setFormData({...formData, ton_giao: e.target.value})} /></div>
                </div>
              </div>
            </div>
          </div>

          {/* 2. CHÍNH TRỊ & NHẬP NGŨ */}
          <div ref={el => sectionRefs.current[1] = el} className="mb-12 scroll-mt-6">
            <h3 className={sectionTitleClass}><div className={sectionIconClass}><Users size={18}/></div> Chính trị & Nhập ngũ</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-5">
              <div>
                  <label className={labelClass}>Đơn vị <span className="text-red-500">*</span></label>
                  <select disabled={isViewMode} className={inputClass} value={formData.don_vi_id} onChange={e => setFormData({...formData, don_vi_id: e.target.value})}>
                    <option value="">-- Chọn đơn vị --</option>
                    {units.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                  </select>
              </div>
              <div>
                  <label className={labelClass}>Cấp bậc</label>
                  <select disabled={isViewMode} className={inputClass} value={formData.cap_bac} onChange={e => setFormData({...formData, cap_bac: e.target.value})}>
                    {['Binh nhì', 'Binh nhất', 'Hạ sĩ', 'Trung sĩ', 'Thượng sĩ', 'Thiếu úy', 'Trung úy', 'Thượng úy', 'Đại úy', 'Thiếu tá', 'Trung tá', 'Thượng tá', 'Đại tá'].map(r => <option key={r} value={r}>{r}</option>)}
                  </select>
              </div>
              <div><label className={labelClass}>Chức vụ</label><input disabled={isViewMode} type="text" className={inputClass} value={formData.chuc_vu} onChange={e => setFormData({...formData, chuc_vu: e.target.value})} /></div>
              <div><label className={labelClass}>Ngày nhập ngũ</label><VietnamDateInput disabled={isViewMode} className={inputClass} value={formData.nhap_ngu_ngay} onChange={(val: string) => setFormData({...formData, nhap_ngu_ngay: val})} /></div>
              <div><label className={labelClass}>Ngày xuất ngũ (Dự kiến)</label><VietnamDateInput disabled={isViewMode} className={inputClass} value={formData.xuat_ngu_ngay} onChange={(val: string) => setFormData({...formData, xuat_ngu_ngay: val})} /></div>
              <div><label className={labelClass}>Ngày vào Đoàn</label><VietnamDateInput disabled={isViewMode} className={inputClass} value={formData.ngay_vao_doan} onChange={(val: string) => setFormData({...formData, ngay_vao_doan: val})} /></div>
              <div><label className={labelClass}>Ngày vào Đảng</label><VietnamDateInput disabled={isViewMode} className={inputClass} value={formData.vao_dang_ngay} onChange={(val: string) => setFormData({...formData, vao_dang_ngay: val})} /></div>
            </div>
            
            <div>
                 <label className={labelClass}>Các hình thức Khen thưởng</label>
                 <textarea disabled={isViewMode} className={inputClass} rows={2} placeholder="Huân chương, huy chương, bằng khen..." value={formData.khen_thuong} onChange={e => setFormData({...formData, khen_thuong: e.target.value})} />
            </div>
          </div>

          {/* 3. TRÌNH ĐỘ & ĐÀO TẠO */}
          <div ref={el => sectionRefs.current[2] = el} className="mb-12 scroll-mt-6">
            <h3 className={sectionTitleClass}><div className={sectionIconClass}><GraduationCap size={18}/></div> Trình độ & Đào tạo</h3>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                 <div>
                    <label className={labelClass}>Trình độ văn hóa</label>
                    <select disabled={isViewMode} className={inputClass} value={formData.trinh_do_van_hoa} onChange={e => setFormData({...formData, trinh_do_van_hoa: e.target.value})}>
                      {['12/12', '9/12', 'Đại học', 'Cao đẳng', 'Trung cấp', 'Thạc sĩ'].map(opt => <option key={opt} value={opt}>{opt}</option>)}
                    </select>
                 </div>
                 <div className="flex items-center gap-4 pt-6">
                     <label className="flex items-center gap-3 cursor-pointer">
                        <input disabled={isViewMode} type="checkbox" className="w-5 h-5 accent-green-600 rounded" checked={formData.da_tot_nghiep} onChange={e => setFormData({...formData, da_tot_nghiep: e.target.checked})} />
                        <span className="text-sm font-bold text-slate-700">Đã tốt nghiệp / Có bằng cấp</span>
                     </label>
                 </div>
                 <div className="md:col-span-2">
                    <label className={labelClass}>Năng khiếu / Sở trường</label>
                    <textarea disabled={isViewMode} className={inputClass} rows={2} value={formData.nang_khieu_so_truong} onChange={e => setFormData({...formData, nang_khieu_so_truong: e.target.value})} placeholder="Vd: Lái xe, Bơi lội, CNTT..." />
                 </div>
             </div>
          </div>

          {/* 4. TIỂU SỬ BẢN THÂN */}
          <div ref={el => sectionRefs.current[3] = el} className="mb-12 scroll-mt-6">
            <h3 className={sectionTitleClass}><div className={sectionIconClass}><Clock size={18}/></div> Tiểu sử bản thân</h3>
            <div className="bg-slate-50 p-5 rounded-xl border border-slate-200">
                <div className="flex justify-between items-center mb-4">
                   <h4 className="text-xs font-black uppercase text-slate-500">Tóm tắt quá trình</h4>
                   {!isViewMode && <button onClick={() => setFormData({...formData, tieu_su_ban_than: [...(formData.tieu_su_ban_than || []), { time: '', job: '', place: '' }]})} className="text-[10px] font-bold text-green-600 bg-white px-3 py-1.5 rounded-lg border border-green-200 hover:bg-green-50 flex items-center gap-1"><Plus size={12}/> THÊM MỐC</button>}
                </div>
                <div className="space-y-3">
                    {formData.tieu_su_ban_than?.map((item: any, idx: number) => (
                        <div key={idx} className="flex gap-2 items-start">
                            <input disabled={isViewMode} type="text" placeholder="Thời gian (Vd: 2010-2015)" className={`${inputClass} !w-40`} value={item.time} onChange={e => {
                                const newData = [...formData.tieu_su_ban_than]; newData[idx].time = e.target.value; setFormData({...formData, tieu_su_ban_than: newData});
                            }} />
                            <input disabled={isViewMode} type="text" placeholder="Làm gì, chức vụ?" className={inputClass} value={item.job} onChange={e => {
                                const newData = [...formData.tieu_su_ban_than]; newData[idx].job = e.target.value; setFormData({...formData, tieu_su_ban_than: newData});
                            }} />
                            <input disabled={isViewMode} type="text" placeholder="Ở đâu, đơn vị nào?" className={inputClass} value={item.place} onChange={e => {
                                const newData = [...formData.tieu_su_ban_than]; newData[idx].place = e.target.value; setFormData({...formData, tieu_su_ban_than: newData});
                            }} />
                             {!isViewMode && <button onClick={() => {
                                 const newData = formData.tieu_su_ban_than.filter((_:any, i:number) => i!==idx); setFormData({...formData, tieu_su_ban_than: newData});
                             }} className="p-2 text-slate-400 hover:text-red-500"><Trash2 size={16}/></button>}
                        </div>
                    ))}
                    {(!formData.tieu_su_ban_than || formData.tieu_su_ban_than.length === 0) && <p className="text-sm text-slate-400 italic text-center py-2">Chưa cập nhật tiểu sử</p>}
                </div>
            </div>
          </div>

          {/* 5. QUAN HỆ GIA ĐÌNH (DẠNG BẢNG - TỐI ƯU KHÔNG GIAN) */}
          <div ref={el => sectionRefs.current[4] = el} className="mb-12 scroll-mt-6">
            <h3 className={sectionTitleClass}><div className={sectionIconClass}><Heart size={18}/></div> Quan hệ gia đình</h3>
            
            {/* Control Panel: Checkbox trạng thái hôn nhân */}
            <div className="flex gap-6 mb-4 px-4 py-3 bg-slate-50 rounded-xl border border-slate-200">
                <label className="flex items-center gap-2 cursor-pointer">
                    <input 
                        disabled={isViewMode} 
                        type="checkbox" 
                        className="w-5 h-5 accent-blue-600 rounded" 
                        checked={formData.quan_he_gia_dinh.tinh_trang_hon_nhan.da_ket_hon} 
                        onChange={e => setFormData({
                            ...formData, 
                            quan_he_gia_dinh: {
                                ...formData.quan_he_gia_dinh, 
                                tinh_trang_hon_nhan: { ...formData.quan_he_gia_dinh.tinh_trang_hon_nhan, da_ket_hon: e.target.checked }
                            }
                        })} 
                    />
                    <span className={`text-xs font-bold uppercase ${formData.quan_he_gia_dinh.tinh_trang_hon_nhan.da_ket_hon ? 'text-blue-700' : 'text-slate-500'}`}>Đã lập gia đình (Vợ/Con)</span>
                </label>

                {!formData.quan_he_gia_dinh.tinh_trang_hon_nhan.da_ket_hon && (
                    <label className="flex items-center gap-2 cursor-pointer">
                        <input 
                            disabled={isViewMode} 
                            type="checkbox" 
                            className="w-5 h-5 accent-pink-500 rounded" 
                            checked={formData.quan_he_gia_dinh.tinh_trang_hon_nhan.co_ban_gai} 
                            onChange={e => setFormData({
                                ...formData, 
                                quan_he_gia_dinh: {
                                    ...formData.quan_he_gia_dinh, 
                                    tinh_trang_hon_nhan: { ...formData.quan_he_gia_dinh.tinh_trang_hon_nhan, co_ban_gai: e.target.checked }
                                }
                            })} 
                        />
                        <span className={`text-xs font-bold uppercase ${formData.quan_he_gia_dinh.tinh_trang_hon_nhan.co_ban_gai ? 'text-pink-600' : 'text-slate-500'}`}>Đang có bạn gái</span>
                    </label>
                )}
            </div>

            {/* Bảng 1: Bố mẹ đẻ & Anh chị em (Luôn hiển thị) */}
            {renderRelationTable(
                (item) => FAMILY_OPTIONS.includes(item.moi_quan_he),
                'Thân nhân (Bố mẹ, Anh chị em ruột)',
                'Bố đẻ',
                FAMILY_OPTIONS
            )}

            {/* Bảng 2: Vợ & Con & Bố mẹ vợ (Chỉ hiện khi đã kết hôn) */}
            {formData.quan_he_gia_dinh.tinh_trang_hon_nhan.da_ket_hon && renderRelationTable(
                (item) => MARRIAGE_OPTIONS.includes(item.moi_quan_he),
                'Gia đình nhỏ (Vợ/Chồng, Con, Nhạc phụ mẫu)',
                'Vợ',
                MARRIAGE_OPTIONS
            )}

            {/* Bảng 3: Bạn gái (Chỉ hiện khi có bạn gái & chưa kết hôn) */}
            {formData.quan_he_gia_dinh.tinh_trang_hon_nhan.co_ban_gai && !formData.quan_he_gia_dinh.tinh_trang_hon_nhan.da_ket_hon && renderRelationTable(
                (item) => GF_OPTIONS.includes(item.moi_quan_he),
                'Thông tin bạn gái',
                'Bạn gái',
                GF_OPTIONS,
                // Logic: Chỉ cho thêm 1 bạn gái
                !formData.quan_he_gia_dinh.than_nhan.some((i:any) => GF_OPTIONS.includes(i.moi_quan_he))
            )}
          </div>

          {/* 6. ĐỜI SỐNG & MXH */}
          <div ref={el => sectionRefs.current[5] = el} className="mb-12 scroll-mt-6">
             <h3 className={sectionTitleClass}><div className={sectionIconClass}><Share2 size={18}/></div> Đời sống & Mạng xã hội</h3>
             
             <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                 <div className="space-y-4">
                     <h4 className="text-xs font-black uppercase text-slate-500 border-b border-slate-100 pb-2 mb-2 flex items-center gap-2"><Home size={14}/> Điều kiện sinh hoạt</h4>
                     <div>
                        <label className={labelClass}>Hoàn cảnh sống chung với</label>
                        <input disabled={isViewMode} type="text" className={inputClass} placeholder="Vd: Bố mẹ, Vợ con, Một mình..." value={formData.hoan_canh_song.song_chung} onChange={e => setFormData({...formData, hoan_canh_song: {...formData.hoan_canh_song, song_chung: e.target.value}})} />
                     </div>
                     <div>
                        <label className={labelClass}>Tình trạng nhà ở</label>
                        <input disabled={isViewMode} type="text" className={inputClass} placeholder="Vd: Nhà riêng, Nhà thuê, Tập thể..." value={formData.hoan_canh_song.tinh_trang_nha_o} onChange={e => setFormData({...formData, hoan_canh_song: {...formData.hoan_canh_song, tinh_trang_nha_o: e.target.value}})} />
                     </div>
                     <div>
                        <label className={labelClass}>Hoàn cảnh gia đình</label>
                        <select 
                            disabled={isViewMode} 
                            className={inputClass} 
                            value={formData.hoan_canh_song.hoan_canh_gia_dinh} 
                            onChange={e => setFormData({...formData, hoan_canh_song: {...formData.hoan_canh_song, hoan_canh_gia_dinh: e.target.value}})}
                        >
                            <option value="">-- Chọn hoàn cảnh --</option>
                            <option value="Khá giả">Khá giả</option>
                            <option value="Bình thường">Bình thường (Đủ ăn)</option>
                            <option value="Khó khăn">Khó khăn</option>
                            <option value="Đặc biệt khó khăn">Đặc biệt khó khăn</option>
                        </select>
                     </div>
                 </div>

                 <div className="space-y-3">
                     <h4 className="text-xs font-black uppercase text-slate-500 border-b border-slate-100 pb-2 mb-2 flex items-center gap-2"><Globe size={14}/> Mạng xã hội</h4>
                     <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded bg-blue-100 text-blue-600 flex items-center justify-center shrink-0"><Facebook size={16}/></div>
                        <div className="flex-1">
                            <label className={labelClass}>FACEBOOK</label>
                            <input disabled={isViewMode} type="text" className={inputClass} placeholder="Link/ID..." value={formData.mang_xa_hoi.facebook?.join(', ') || ''} onChange={e => setFormData({...formData, mang_xa_hoi: {...formData.mang_xa_hoi, facebook: e.target.value.split(',').map((s:string) => s.trim())}})} />
                        </div>
                     </div>
                     <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded bg-blue-500 text-white flex items-center justify-center shrink-0"><MessageCircle size={16}/></div>
                        <div className="flex-1">
                            <label className={labelClass}>ZALO</label>
                            <input disabled={isViewMode} type="text" className={inputClass} placeholder="Số điện thoại Zalo..." value={formData.mang_xa_hoi.zalo?.join(', ') || ''} onChange={e => setFormData({...formData, mang_xa_hoi: {...formData.mang_xa_hoi, zalo: e.target.value.split(',').map((s:string) => s.trim())}})} />
                        </div>
                     </div>
                     <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded bg-black text-white flex items-center justify-center shrink-0"><Smartphone size={16}/></div>
                        <div className="flex-1">
                            <label className={labelClass}>TIKTOK</label>
                            <input disabled={isViewMode} type="text" className={inputClass} placeholder="ID kênh..." value={formData.mang_xa_hoi.tiktok?.join(', ') || ''} onChange={e => setFormData({...formData, mang_xa_hoi: {...formData.mang_xa_hoi, tiktok: e.target.value.split(',').map((s:string) => s.trim())}})} />
                        </div>
                     </div>
                 </div>
             </div>
          </div>

          {/* 7. TÀI CHÍNH & SỨC KHỎE (Chi tiết hóa) */}
          <div ref={el => sectionRefs.current[6] = el} className="mb-12 scroll-mt-6">
            <h3 className={sectionTitleClass}><div className={sectionIconClass}><DollarSign size={18}/></div> Tài chính & Sức khỏe</h3>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Cột 1: Tài chính */}
                <div className="space-y-4">
                    <h4 className="text-xs font-black uppercase text-green-600 border-b border-green-100 pb-2 mb-2 flex items-center gap-2"><DollarSign size={14}/> Tình hình tài chính</h4>
                    
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className={labelClass}>Thu nhập (VNĐ)</label>
                            <input disabled={isViewMode} type="text" className={inputClass} placeholder="Lương/Thưởng..." value={formData.tai_chinh_suc_khoe.thu_nhap} onChange={e => setFormData({...formData, tai_chinh_suc_khoe: {...formData.tai_chinh_suc_khoe, thu_nhap: e.target.value}})} />
                        </div>
                        <div>
                            <label className={labelClass}>Tài sản chính</label>
                            <input disabled={isViewMode} type="text" className={inputClass} placeholder="Nhà, xe..." value={formData.tai_chinh_suc_khoe.tai_san} onChange={e => setFormData({...formData, tai_chinh_suc_khoe: {...formData.tai_chinh_suc_khoe, tai_san: e.target.value}})} />
                        </div>
                    </div>

                    <div className={`p-4 rounded-xl border ${formData.tai_chinh_suc_khoe.vay_no.co_khong ? 'bg-red-50 border-red-200' : 'bg-slate-50 border-slate-200'}`}>
                        <div className="flex justify-between items-center mb-3">
                            <label className="flex items-center gap-3 cursor-pointer">
                                <input disabled={isViewMode} type="checkbox" className="w-5 h-5 accent-red-600 rounded" checked={formData.tai_chinh_suc_khoe.vay_no.co_khong} onChange={e => setFormData({...formData, tai_chinh_suc_khoe: {...formData.tai_chinh_suc_khoe, vay_no: {...formData.tai_chinh_suc_khoe.vay_no, co_khong: e.target.checked}}})} />
                                <span className={`text-sm font-black uppercase ${formData.tai_chinh_suc_khoe.vay_no.co_khong ? 'text-red-700' : 'text-slate-500'}`}>Có vay nợ / Tín dụng?</span>
                            </label>
                            {formData.tai_chinh_suc_khoe.vay_no.co_khong && (
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input disabled={isViewMode} type="checkbox" className="w-4 h-4 accent-blue-600 rounded" checked={formData.tai_chinh_suc_khoe.vay_no.gia_dinh_biet} onChange={e => setFormData({...formData, tai_chinh_suc_khoe: {...formData.tai_chinh_suc_khoe, vay_no: {...formData.tai_chinh_suc_khoe.vay_no, gia_dinh_biet: e.target.checked}}})} />
                                    <span className="text-[10px] font-bold text-blue-600">GIA ĐÌNH ĐÃ BIẾT</span>
                                </label>
                            )}
                        </div>
                        
                        {formData.tai_chinh_suc_khoe.vay_no.co_khong && (
                            <div className="space-y-3 animate-fade-in">
                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="text-[9px] font-bold text-slate-400 uppercase">Người đứng tên</label>
                                        <input disabled={isViewMode} type="text" className="w-full bg-white border border-red-200 rounded px-2 py-1.5 text-xs font-bold" placeholder="Tên người vay..." value={formData.tai_chinh_suc_khoe.vay_no.nguoi_vay} onChange={e => setFormData({...formData, tai_chinh_suc_khoe: {...formData.tai_chinh_suc_khoe, vay_no: {...formData.tai_chinh_suc_khoe.vay_no, nguoi_vay: e.target.value}}})} />
                                    </div>
                                    <div>
                                        <label className="text-[9px] font-bold text-slate-400 uppercase">Người trả nợ</label>
                                        <input disabled={isViewMode} type="text" className="w-full bg-white border border-red-200 rounded px-2 py-1.5 text-xs font-bold" placeholder="Tên người trả..." value={formData.tai_chinh_suc_khoe.vay_no.nguoi_tra} onChange={e => setFormData({...formData, tai_chinh_suc_khoe: {...formData.tai_chinh_suc_khoe, vay_no: {...formData.tai_chinh_suc_khoe.vay_no, nguoi_tra: e.target.value}}})} />
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-3">
                                    <input disabled={isViewMode} type="text" className="w-full bg-white border border-red-200 rounded px-2 py-1.5 text-xs" placeholder="Vay của ai/Tổ chức nào?" value={formData.tai_chinh_suc_khoe.vay_no.chu_no} onChange={e => setFormData({...formData, tai_chinh_suc_khoe: {...formData.tai_chinh_suc_khoe, vay_no: {...formData.tai_chinh_suc_khoe.vay_no, chu_no: e.target.value}}})} />
                                    <input disabled={isViewMode} type="text" className="w-full bg-white border border-red-200 rounded px-2 py-1.5 text-xs font-black text-red-600" placeholder="Số tiền (VNĐ)..." value={formData.tai_chinh_suc_khoe.vay_no.so_tien} onChange={e => setFormData({...formData, tai_chinh_suc_khoe: {...formData.tai_chinh_suc_khoe, vay_no: {...formData.tai_chinh_suc_khoe.vay_no, so_tien: e.target.value}}})} />
                                </div>
                                <div className="grid grid-cols-2 gap-3">
                                    <input disabled={isViewMode} type="text" className="w-full bg-white border border-red-200 rounded px-2 py-1.5 text-xs" placeholder="Hình thức vay..." value={formData.tai_chinh_suc_khoe.vay_no.hinh_thuc} onChange={e => setFormData({...formData, tai_chinh_suc_khoe: {...formData.tai_chinh_suc_khoe, vay_no: {...formData.tai_chinh_suc_khoe.vay_no, hinh_thuc: e.target.value}}})} />
                                    <input disabled={isViewMode} type="text" className="w-full bg-white border border-red-200 rounded px-2 py-1.5 text-xs" placeholder="Hạn trả..." value={formData.tai_chinh_suc_khoe.vay_no.han_tra} onChange={e => setFormData({...formData, tai_chinh_suc_khoe: {...formData.tai_chinh_suc_khoe, vay_no: {...formData.tai_chinh_suc_khoe.vay_no, han_tra: e.target.value}}})} />
                                </div>
                                <input disabled={isViewMode} type="text" className="w-full bg-white border border-red-200 rounded px-2 py-1.5 text-xs" placeholder="Mục đích vay..." value={formData.tai_chinh_suc_khoe.vay_no.muc_dich} onChange={e => setFormData({...formData, tai_chinh_suc_khoe: {...formData.tai_chinh_suc_khoe, vay_no: {...formData.tai_chinh_suc_khoe.vay_no, muc_dich: e.target.value}}})} />
                                <input disabled={isViewMode} type="text" className="w-full bg-white border border-red-200 rounded px-2 py-1.5 text-xs" placeholder="Khả năng chi trả hiện tại..." value={formData.tai_chinh_suc_khoe.vay_no.kha_nang_tra} onChange={e => setFormData({...formData, tai_chinh_suc_khoe: {...formData.tai_chinh_suc_khoe, vay_no: {...formData.tai_chinh_suc_khoe.vay_no, kha_nang_tra: e.target.value}}})} />
                            </div>
                        )}
                    </div>

                    <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
                        <div className="flex justify-between items-center mb-2">
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input disabled={isViewMode} type="checkbox" className="w-4 h-4 accent-green-600" checked={formData.tai_chinh_suc_khoe.kinh_doanh_dau_tu.kinh_doanh.co_khong} onChange={e => setFormData({...formData, tai_chinh_suc_khoe: {...formData.tai_chinh_suc_khoe, kinh_doanh_dau_tu: {...formData.tai_chinh_suc_khoe.kinh_doanh_dau_tu, kinh_doanh: {...formData.tai_chinh_suc_khoe.kinh_doanh_dau_tu.kinh_doanh, co_khong: e.target.checked}}}})} />
                                <span className="text-xs font-bold uppercase text-green-700">Có Kinh doanh thêm</span>
                            </label>
                        </div>
                        {formData.tai_chinh_suc_khoe.kinh_doanh_dau_tu.kinh_doanh.co_khong && (
                            <div className="space-y-2 animate-fade-in pl-6">
                                <input disabled={isViewMode} type="text" className="w-full bg-white border border-slate-300 rounded px-2 py-1.5 text-xs" placeholder="Lĩnh vực kinh doanh..." value={formData.tai_chinh_suc_khoe.kinh_doanh_dau_tu.kinh_doanh.linh_vuc} onChange={e => setFormData({...formData, tai_chinh_suc_khoe: {...formData.tai_chinh_suc_khoe, kinh_doanh_dau_tu: {...formData.tai_chinh_suc_khoe.kinh_doanh_dau_tu, kinh_doanh: {...formData.tai_chinh_suc_khoe.kinh_doanh_dau_tu.kinh_doanh, linh_vuc: e.target.value}}}})} />
                                <div className="grid grid-cols-2 gap-2">
                                    <input disabled={isViewMode} type="text" className="bg-white border border-slate-300 rounded px-2 py-1.5 text-xs" placeholder="Làm với ai?..." value={formData.tai_chinh_suc_khoe.kinh_doanh_dau_tu.kinh_doanh.doi_tac} onChange={e => setFormData({...formData, tai_chinh_suc_khoe: {...formData.tai_chinh_suc_khoe, kinh_doanh_dau_tu: {...formData.tai_chinh_suc_khoe.kinh_doanh_dau_tu, kinh_doanh: {...formData.tai_chinh_suc_khoe.kinh_doanh_dau_tu.kinh_doanh, doi_tac: e.target.value}}}})} />
                                    <input disabled={isViewMode} type="text" className="bg-white border border-slate-300 rounded px-2 py-1.5 text-xs" placeholder="Vốn đầu tư..." value={formData.tai_chinh_suc_khoe.kinh_doanh_dau_tu.kinh_doanh.so_von} onChange={e => setFormData({...formData, tai_chinh_suc_khoe: {...formData.tai_chinh_suc_khoe, kinh_doanh_dau_tu: {...formData.tai_chinh_suc_khoe.kinh_doanh_dau_tu, kinh_doanh: {...formData.tai_chinh_suc_khoe.kinh_doanh_dau_tu.kinh_doanh, so_von: e.target.value}}}})} />
                                </div>
                            </div>
                        )}

                        <div className="border-t border-slate-200 pt-3 mt-2">
                            <label className="flex items-center gap-2 cursor-pointer mb-2">
                                <input disabled={isViewMode} type="checkbox" className="w-4 h-4 accent-blue-600" checked={formData.tai_chinh_suc_khoe.kinh_doanh_dau_tu.dau_tu.co_khong} onChange={e => setFormData({...formData, tai_chinh_suc_khoe: {...formData.tai_chinh_suc_khoe, kinh_doanh_dau_tu: {...formData.tai_chinh_suc_khoe.kinh_doanh_dau_tu, dau_tu: {...formData.tai_chinh_suc_khoe.kinh_doanh_dau_tu.dau_tu, co_khong: e.target.checked}}}})} />
                                <span className="text-xs font-bold uppercase text-blue-700">Có Đầu tư tài chính</span>
                            </label>
                            {formData.tai_chinh_suc_khoe.kinh_doanh_dau_tu.dau_tu.co_khong && (
                                <div className="space-y-2 animate-fade-in pl-6">
                                    <div className="grid grid-cols-2 gap-2">
                                        <input disabled={isViewMode} type="text" className="bg-white border border-slate-300 rounded px-2 py-1.5 text-xs" placeholder="Loại hình (CK, BĐS...)..." value={formData.tai_chinh_suc_khoe.kinh_doanh_dau_tu.dau_tu.loai_hinh} onChange={e => setFormData({...formData, tai_chinh_suc_khoe: {...formData.tai_chinh_suc_khoe, kinh_doanh_dau_tu: {...formData.tai_chinh_suc_khoe.kinh_doanh_dau_tu, dau_tu: {...formData.tai_chinh_suc_khoe.kinh_doanh_dau_tu.dau_tu, loai_hinh: e.target.value}}}})} />
                                        <input disabled={isViewMode} type="text" className="bg-white border border-slate-300 rounded px-2 py-1.5 text-xs" placeholder="Thời gian bắt đầu..." value={formData.tai_chinh_suc_khoe.kinh_doanh_dau_tu.dau_tu.thoi_gian} onChange={e => setFormData({...formData, tai_chinh_suc_khoe: {...formData.tai_chinh_suc_khoe, kinh_doanh_dau_tu: {...formData.tai_chinh_suc_khoe.kinh_doanh_dau_tu, dau_tu: {...formData.tai_chinh_suc_khoe.kinh_doanh_dau_tu.dau_tu, thoi_gian: e.target.value}}}})} />
                                    </div>
                                    <div className="grid grid-cols-2 gap-2">
                                        <input disabled={isViewMode} type="text" className="bg-white border border-slate-300 rounded px-2 py-1.5 text-xs" placeholder="Đầu tư với ai?..." value={formData.tai_chinh_suc_khoe.kinh_doanh_dau_tu.dau_tu.doi_tac} onChange={e => setFormData({...formData, tai_chinh_suc_khoe: {...formData.tai_chinh_suc_khoe, kinh_doanh_dau_tu: {...formData.tai_chinh_suc_khoe.kinh_doanh_dau_tu, dau_tu: {...formData.tai_chinh_suc_khoe.kinh_doanh_dau_tu.dau_tu, doi_tac: e.target.value}}}})} />
                                        <input disabled={isViewMode} type="text" className="bg-white border border-slate-300 rounded px-2 py-1.5 text-xs" placeholder="Số vốn..." value={formData.tai_chinh_suc_khoe.kinh_doanh_dau_tu.dau_tu.so_von} onChange={e => setFormData({...formData, tai_chinh_suc_khoe: {...formData.tai_chinh_suc_khoe, kinh_doanh_dau_tu: {...formData.tai_chinh_suc_khoe.kinh_doanh_dau_tu, dau_tu: {...formData.tai_chinh_suc_khoe.kinh_doanh_dau_tu.dau_tu, so_von: e.target.value}}}})} />
                                    </div>
                                    <input disabled={isViewMode} type="text" className="w-full bg-white border border-slate-300 rounded px-2 py-1.5 text-xs" placeholder="Tên công ty/Sàn..." value={formData.tai_chinh_suc_khoe.kinh_doanh_dau_tu.dau_tu.ten_cong_ty} onChange={e => setFormData({...formData, tai_chinh_suc_khoe: {...formData.tai_chinh_suc_khoe, kinh_doanh_dau_tu: {...formData.tai_chinh_suc_khoe.kinh_doanh_dau_tu, dau_tu: {...formData.tai_chinh_suc_khoe.kinh_doanh_dau_tu.dau_tu, ten_cong_ty: e.target.value}}}})} />
                                    <input disabled={isViewMode} type="text" className="w-full bg-white border border-slate-300 rounded px-2 py-1.5 text-xs" placeholder="Địa chỉ/Trụ sở..." value={formData.tai_chinh_suc_khoe.kinh_doanh_dau_tu.dau_tu.dia_chi_cong_ty} onChange={e => setFormData({...formData, tai_chinh_suc_khoe: {...formData.tai_chinh_suc_khoe, kinh_doanh_dau_tu: {...formData.tai_chinh_suc_khoe.kinh_doanh_dau_tu, dau_tu: {...formData.tai_chinh_suc_khoe.kinh_doanh_dau_tu.dau_tu, dia_chi_cong_ty: e.target.value}}}})} />
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Cột 2: Sức khỏe */}
                <div className="space-y-4">
                     <h4 className="text-xs font-black uppercase text-blue-600 border-b border-blue-100 pb-2 mb-2 flex items-center gap-2"><Activity size={14}/> Tình trạng sức khỏe</h4>
                     
                     <div className="grid grid-cols-2 gap-3">
                         <div>
                             <label className={labelClass}>Phân loại SK</label>
                             <select disabled={isViewMode} className={inputClass} value={formData.tai_chinh_suc_khoe.phan_loai_suc_khoe} onChange={e => setFormData({...formData, tai_chinh_suc_khoe: {...formData.tai_chinh_suc_khoe, phan_loai_suc_khoe: e.target.value}})}>
                                 <option value="Loại 1">Loại 1 (Tốt)</option>
                                 <option value="Loại 2">Loại 2 (Khá)</option>
                                 <option value="Loại 3">Loại 3 (TB)</option>
                                 <option value="Loại 4">Loại 4 (Yếu)</option>
                             </select>
                         </div>
                         <div><label className={labelClass}>Nhóm máu</label><input disabled={isViewMode} type="text" className={inputClass} value={formData.tai_chinh_suc_khoe.nhom_mau} onChange={e => setFormData({...formData, tai_chinh_suc_khoe: {...formData.tai_chinh_suc_khoe, nhom_mau: e.target.value}})} /></div>
                     </div>

                     <div className="grid grid-cols-2 gap-3">
                         <div><label className={labelClass}>Chiều cao (cm)</label><input disabled={isViewMode} type="text" className={inputClass} value={formData.tai_chinh_suc_khoe.chieu_cao} onChange={e => setFormData({...formData, tai_chinh_suc_khoe: {...formData.tai_chinh_suc_khoe, chieu_cao: e.target.value}})} /></div>
                         <div><label className={labelClass}>Cân nặng (kg)</label><input disabled={isViewMode} type="text" className={inputClass} value={formData.tai_chinh_suc_khoe.can_nang} onChange={e => setFormData({...formData, tai_chinh_suc_khoe: {...formData.tai_chinh_suc_khoe, can_nang: e.target.value}})} /></div>
                     </div>

                     <div>
                         <label className={labelClass}>Bệnh mãn tính / Lưu ý</label>
                         <textarea disabled={isViewMode} className={inputClass} rows={2} placeholder="Bệnh lý cần chú ý..." value={formData.tai_chinh_suc_khoe.benh_man_tinh} onChange={e => setFormData({...formData, tai_chinh_suc_khoe: {...formData.tai_chinh_suc_khoe, benh_man_tinh: e.target.value}})} />
                     </div>
                </div>
             </div>
          </div>

          {/* 8. LỊCH SỬ & AN NINH (Chi tiết hóa) */}
          <div ref={el => sectionRefs.current[7] = el} className="mb-12 scroll-mt-6">
            <h3 className={sectionTitleClass}><div className={sectionIconClass}><ShieldAlert size={18}/></div> Lịch sử & An ninh</h3>
            
            <div className="grid grid-cols-1 gap-8">
                {/* Cột 1: Vi phạm & Kỷ luật */}
                <div className="space-y-4">
                    {/* Bảng Kỷ luật Quân đội */}
                    {renderViolationTable('ky_luat_quan_doi', 'Kỷ luật Quân đội')}

                    {/* Bảng Vi phạm Pháp luật */}
                    {renderViolationTable('vi_pham_phap_luat', 'Vi phạm Pháp luật (Tiền án/sự)')}
                </div>

                {/* Cột 2: Tệ nạn & Quan hệ (Chi tiết hóa) */}
                <div className="space-y-4">
                    <h4 className="text-xs font-black uppercase text-purple-600 border-b border-purple-100 pb-2 mb-2 flex items-center gap-2"><AlertTriangle size={14}/> Các vấn đề khác</h4>
                    
                    <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-4">
                        {/* MA TÚY */}
                        <div className="border-b border-slate-200 pb-4">
                            <label className="flex items-center gap-2 cursor-pointer mb-2">
                                <input disabled={isViewMode} type="checkbox" className="w-4 h-4 accent-purple-600" checked={formData.lich_su_vi_pham.te_nan_xa_hoi.ma_tuy.co_khong} onChange={e => setFormData({...formData, lich_su_vi_pham: {...formData.lich_su_vi_pham, te_nan_xa_hoi: {...formData.lich_su_vi_pham.te_nan_xa_hoi, ma_tuy: {...formData.lich_su_vi_pham.te_nan_xa_hoi.ma_tuy, co_khong: e.target.checked}}}})} />
                                <span className="text-xs font-bold uppercase text-purple-700">Dấu hiệu sử dụng Ma túy / Chất gây nghiện</span>
                            </label>
                            {formData.lich_su_vi_pham.te_nan_xa_hoi.ma_tuy.co_khong && (
                                <div className="grid grid-cols-2 gap-3 pl-6 animate-fade-in">
                                    <input disabled={isViewMode} type="text" className="bg-white border border-slate-300 rounded px-2 py-1 text-xs" placeholder="Loại chất sử dụng..." value={formData.lich_su_vi_pham.te_nan_xa_hoi.ma_tuy.loai_chat} onChange={e => setFormData({...formData, lich_su_vi_pham: {...formData.lich_su_vi_pham, te_nan_xa_hoi: {...formData.lich_su_vi_pham.te_nan_xa_hoi, ma_tuy: {...formData.lich_su_vi_pham.te_nan_xa_hoi.ma_tuy, loai_chat: e.target.value}}}})} />
                                    <input disabled={isViewMode} type="text" className="bg-white border border-slate-300 rounded px-2 py-1 text-xs" placeholder="Thời gian bắt đầu..." value={formData.lich_su_vi_pham.te_nan_xa_hoi.ma_tuy.thoi_gian_bat_dau} onChange={e => setFormData({...formData, lich_su_vi_pham: {...formData.lich_su_vi_pham, te_nan_xa_hoi: {...formData.lich_su_vi_pham.te_nan_xa_hoi, ma_tuy: {...formData.lich_su_vi_pham.te_nan_xa_hoi.ma_tuy, thoi_gian_bat_dau: e.target.value}}}})} />
                                    <input disabled={isViewMode} type="text" className="bg-white border border-slate-300 rounded px-2 py-1 text-xs" placeholder="Số lần dùng..." value={formData.lich_su_vi_pham.te_nan_xa_hoi.ma_tuy.so_lan_su_dung} onChange={e => setFormData({...formData, lich_su_vi_pham: {...formData.lich_su_vi_pham, te_nan_xa_hoi: {...formData.lich_su_vi_pham.te_nan_xa_hoi, ma_tuy: {...formData.lich_su_vi_pham.te_nan_xa_hoi.ma_tuy, so_lan_su_dung: e.target.value}}}})} />
                                    <input disabled={isViewMode} type="text" className="bg-white border border-slate-300 rounded px-2 py-1 text-xs" placeholder="Dùng chung với ai?..." value={formData.lich_su_vi_pham.te_nan_xa_hoi.ma_tuy.nguoi_cung_su_dung} onChange={e => setFormData({...formData, lich_su_vi_pham: {...formData.lich_su_vi_pham, te_nan_xa_hoi: {...formData.lich_su_vi_pham.te_nan_xa_hoi, ma_tuy: {...formData.lich_su_vi_pham.te_nan_xa_hoi.ma_tuy, nguoi_cung_su_dung: e.target.value}}}})} />
                                    <input disabled={isViewMode} type="text" className="col-span-2 bg-white border border-slate-300 rounded px-2 py-1 text-xs" placeholder="Hình thức xử lý (nếu có)..." value={formData.lich_su_vi_pham.te_nan_xa_hoi.ma_tuy.hinh_thuc_xu_ly} onChange={e => setFormData({...formData, lich_su_vi_pham: {...formData.lich_su_vi_pham, te_nan_xa_hoi: {...formData.lich_su_vi_pham.te_nan_xa_hoi, ma_tuy: {...formData.lich_su_vi_pham.te_nan_xa_hoi.ma_tuy, hinh_thuc_xu_ly: e.target.value}}}})} />
                                </div>
                            )}
                        </div>

                        {/* CỜ BẠC */}
                        <div className="border-b border-slate-200 pb-4">
                            <label className="flex items-center gap-2 cursor-pointer mb-2">
                                <input disabled={isViewMode} type="checkbox" className="w-4 h-4 accent-purple-600" checked={formData.lich_su_vi_pham.te_nan_xa_hoi.co_bac.co_khong} onChange={e => setFormData({...formData, lich_su_vi_pham: {...formData.lich_su_vi_pham, te_nan_xa_hoi: {...formData.lich_su_vi_pham.te_nan_xa_hoi, co_bac: {...formData.lich_su_vi_pham.te_nan_xa_hoi.co_bac, co_khong: e.target.checked}}}})} />
                                <span className="text-xs font-bold uppercase text-purple-700">Tham gia Cờ bạc / Cá độ</span>
                            </label>
                            {formData.lich_su_vi_pham.te_nan_xa_hoi.co_bac.co_khong && (
                                <div className="grid grid-cols-2 gap-3 pl-6 animate-fade-in">
                                    <input disabled={isViewMode} type="text" className="bg-white border border-slate-300 rounded px-2 py-1 text-xs" placeholder="Hình thức chơi (Lô đề, bóng đá...)..." value={formData.lich_su_vi_pham.te_nan_xa_hoi.co_bac.hinh_thuc} onChange={e => setFormData({...formData, lich_su_vi_pham: {...formData.lich_su_vi_pham, te_nan_xa_hoi: {...formData.lich_su_vi_pham.te_nan_xa_hoi, co_bac: {...formData.lich_su_vi_pham.te_nan_xa_hoi.co_bac, hinh_thuc: e.target.value}}}})} />
                                    <input disabled={isViewMode} type="text" className="bg-white border border-slate-300 rounded px-2 py-1 text-xs" placeholder="Thời gian & Địa điểm chơi..." value={formData.lich_su_vi_pham.te_nan_xa_hoi.co_bac.thoi_gian_choi} onChange={e => setFormData({...formData, lich_su_vi_pham: {...formData.lich_su_vi_pham, te_nan_xa_hoi: {...formData.lich_su_vi_pham.te_nan_xa_hoi, co_bac: {...formData.lich_su_vi_pham.te_nan_xa_hoi.co_bac, thoi_gian_choi: e.target.value}}}})} />
                                    <input disabled={isViewMode} type="text" className="bg-white border border-slate-300 rounded px-2 py-1 text-xs" placeholder="Chơi với ai?..." value={formData.lich_su_vi_pham.te_nan_xa_hoi.co_bac.nguoi_cung_choi} onChange={e => setFormData({...formData, lich_su_vi_pham: {...formData.lich_su_vi_pham, te_nan_xa_hoi: {...formData.lich_su_vi_pham.te_nan_xa_hoi, co_bac: {...formData.lich_su_vi_pham.te_nan_xa_hoi.co_bac, nguoi_cung_choi: e.target.value}}}})} />
                                    <input disabled={isViewMode} type="text" className="bg-white border border-slate-300 rounded px-2 py-1 text-xs" placeholder="Số tiền thắng/thua..." value={formData.lich_su_vi_pham.te_nan_xa_hoi.co_bac.so_tien_thang_thua} onChange={e => setFormData({...formData, lich_su_vi_pham: {...formData.lich_su_vi_pham, te_nan_xa_hoi: {...formData.lich_su_vi_pham.te_nan_xa_hoi, co_bac: {...formData.lich_su_vi_pham.te_nan_xa_hoi.co_bac, so_tien_thang_thua: e.target.value}}}})} />
                                </div>
                            )}
                        </div>

                        {/* CÁC TỆ NẠN KHÁC */}
                        <div className="flex gap-4">
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input disabled={isViewMode} type="checkbox" className="w-4 h-4 accent-purple-600" checked={formData.lich_su_vi_pham.te_nan_xa_hoi.ruou_che} onChange={e => setFormData({...formData, lich_su_vi_pham: {...formData.lich_su_vi_pham, te_nan_xa_hoi: {...formData.lich_su_vi_pham.te_nan_xa_hoi, ruou_che: e.target.checked}}})} />
                                <span className="text-xs font-medium">Hay rượu chè</span>
                            </label>
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input disabled={isViewMode} type="checkbox" className="w-4 h-4 accent-purple-600" checked={formData.lich_su_vi_pham.te_nan_xa_hoi.hut_thuoc} onChange={e => setFormData({...formData, lich_su_vi_pham: {...formData.lich_su_vi_pham, te_nan_xa_hoi: {...formData.lich_su_vi_pham.te_nan_xa_hoi, hut_thuoc: e.target.checked}}})} />
                                <span className="text-xs font-medium">Thường xuyên hút thuốc lá / Thuốc lá điện tử</span>
                            </label>
                        </div>
                        
                        <input disabled={isViewMode} type="text" className="w-full bg-white border border-slate-300 rounded px-2 py-1 text-xs" placeholder="Ghi chú chung về tệ nạn..." value={formData.lich_su_vi_pham.te_nan_xa_hoi.ghi_chu_chung} onChange={e => setFormData({...formData, lich_su_vi_pham: {...formData.lich_su_vi_pham, te_nan_xa_hoi: {...formData.lich_su_vi_pham.te_nan_xa_hoi, ghi_chu_chung: e.target.value}}})} />
                    </div>

                    <div>
                        <label className={labelClass}>Quan hệ xã hội & Tư tưởng</label>
                        <textarea disabled={isViewMode} className={inputClass} rows={2} placeholder="Quan hệ phức tạp, biểu hiện tư tưởng..." value={formData.lich_su_vi_pham.quan_he_xa_hoi} onChange={e => setFormData({...formData, lich_su_vi_pham: {...formData.lich_su_vi_pham, quan_he_xa_hoi: e.target.value}})} />
                    </div>
                </div>
            </div>
          </div>

          {/* 9. YẾU TỐ NƯỚC NGOÀI */}
          <div ref={el => sectionRefs.current[8] = el} className="mb-12 scroll-mt-6">
            <h3 className={sectionTitleClass}><div className={sectionIconClass}><Globe size={18}/></div> Yếu tố nước ngoài</h3>
            
            {/* Lịch sử đi nước ngoài (Mới nâng cấp) */}
            <div className="mb-6 bg-slate-50 p-4 rounded-xl border border-slate-200">
                <div className="flex justify-between items-center mb-3">
                    <label className="flex items-center gap-2 cursor-pointer">
                        <input disabled={isViewMode} type="checkbox" className="w-4 h-4 accent-blue-600 rounded" checked={formData.yeu_to_nuoc_ngoai.da_di_nuoc_ngoai} onChange={e => setFormData({...formData, yeu_to_nuoc_ngoai: {...formData.yeu_to_nuoc_ngoai, da_di_nuoc_ngoai: e.target.checked}})} />
                        <span className="text-xs font-bold uppercase text-blue-700">Đã từng đi nước ngoài</span>
                    </label>
                    {formData.yeu_to_nuoc_ngoai.da_di_nuoc_ngoai && !isViewMode && (
                        <button 
                            onClick={() => setFormData({
                                ...formData,
                                yeu_to_nuoc_ngoai: {
                                    ...formData.yeu_to_nuoc_ngoai,
                                    lich_su_di_nuoc_ngoai: [...formData.yeu_to_nuoc_ngoai.lich_su_di_nuoc_ngoai, { nuoc: '', muc_dich: '', thoi_gian: '', vi_pham: '' }]
                                }
                            })}
                            className="text-[10px] font-bold text-blue-600 bg-blue-50 px-2 py-1 rounded border border-blue-200 hover:bg-blue-100 flex items-center gap-1"
                        >
                            <Plus size={10}/> Thêm chuyến đi
                        </button>
                    )}
                </div>

                {formData.yeu_to_nuoc_ngoai.da_di_nuoc_ngoai && (
                    <div className="space-y-3 animate-fade-in">
                        {formData.yeu_to_nuoc_ngoai.lich_su_di_nuoc_ngoai.map((trip: any, idx: number) => (
                            <div key={idx} className="p-3 bg-white border border-slate-200 rounded-lg shadow-sm">
                                <div className="grid grid-cols-12 gap-3 items-center mb-2">
                                    <div className="col-span-3">
                                        <input disabled={isViewMode} type="text" className="w-full bg-slate-50 border border-slate-200 rounded px-2 py-1 text-xs font-bold" placeholder="Tên nước..." value={trip.nuoc} onChange={e => {
                                            const newTrips = [...formData.yeu_to_nuoc_ngoai.lich_su_di_nuoc_ngoai];
                                            newTrips[idx].nuoc = e.target.value;
                                            setFormData({...formData, yeu_to_nuoc_ngoai: {...formData.yeu_to_nuoc_ngoai, lich_su_di_nuoc_ngoai: newTrips}});
                                        }} />
                                    </div>
                                    <div className="col-span-4">
                                        <input disabled={isViewMode} type="text" className="w-full bg-white border border-slate-200 rounded px-2 py-1 text-xs" placeholder="Mục đích..." value={trip.muc_dich} onChange={e => {
                                            const newTrips = [...formData.yeu_to_nuoc_ngoai.lich_su_di_nuoc_ngoai];
                                            newTrips[idx].muc_dich = e.target.value;
                                            setFormData({...formData, yeu_to_nuoc_ngoai: {...formData.yeu_to_nuoc_ngoai, lich_su_di_nuoc_ngoai: newTrips}});
                                        }} />
                                    </div>
                                    <div className="col-span-4">
                                        <input disabled={isViewMode} type="text" className="w-full bg-white border border-slate-200 rounded px-2 py-1 text-xs" placeholder="Thời gian (Từ...đến)..." value={trip.thoi_gian} onChange={e => {
                                            const newTrips = [...formData.yeu_to_nuoc_ngoai.lich_su_di_nuoc_ngoai];
                                            newTrips[idx].thoi_gian = e.target.value;
                                            setFormData({...formData, yeu_to_nuoc_ngoai: {...formData.yeu_to_nuoc_ngoai, lich_su_di_nuoc_ngoai: newTrips}});
                                        }} />
                                    </div>
                                    {!isViewMode && (
                                        <div className="col-span-1 text-center">
                                            <button onClick={() => {
                                                const newTrips = formData.yeu_to_nuoc_ngoai.lich_su_di_nuoc_ngoai.filter((_:any, i:number) => i !== idx);
                                                setFormData({...formData, yeu_to_nuoc_ngoai: {...formData.yeu_to_nuoc_ngoai, lich_su_di_nuoc_ngoai: newTrips}});
                                            }} className="text-slate-400 hover:text-red-500"><Trash2 size={14}/></button>
                                        </div>
                                    )}
                                </div>
                                <input disabled={isViewMode} type="text" className="w-full bg-white border border-red-100 rounded px-2 py-1 text-xs text-red-600 placeholder:text-red-300" placeholder="Có vi phạm gì khi ở nước ngoài không? (Ghi rõ)..." value={trip.vi_pham} onChange={e => {
                                    const newTrips = [...formData.yeu_to_nuoc_ngoai.lich_su_di_nuoc_ngoai];
                                    newTrips[idx].vi_pham = e.target.value;
                                    setFormData({...formData, yeu_to_nuoc_ngoai: {...formData.yeu_to_nuoc_ngoai, lich_su_di_nuoc_ngoai: newTrips}});
                                }} />
                            </div>
                        ))}
                        {formData.yeu_to_nuoc_ngoai.lich_su_di_nuoc_ngoai.length === 0 && (
                            <p className="text-xs text-slate-400 italic text-center py-2">Chưa có thông tin chuyến đi</p>
                        )}
                    </div>
                )}
            </div>

            {/* Định cư & Hộ chiếu */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                    <h4 className="text-xs font-black uppercase text-slate-500 border-b border-slate-100 pb-2 mb-2 flex items-center gap-2"><Plane size={14}/> Thông tin Định cư</h4>
                    <label className="flex items-center gap-2 cursor-pointer mb-2">
                        <input disabled={isViewMode} type="checkbox" className="w-4 h-4 accent-amber-600" checked={formData.yeu_to_nuoc_ngoai.dinh_cu.dang_lam_thu_tuc} onChange={e => setFormData({...formData, yeu_to_nuoc_ngoai: {...formData.yeu_to_nuoc_ngoai, dinh_cu: {...formData.yeu_to_nuoc_ngoai.dinh_cu, dang_lam_thu_tuc: e.target.checked}}})} />
                        <span className="text-xs font-bold text-slate-700">Đang làm thủ tục xuất cảnh định cư</span>
                    </label>
                    {formData.yeu_to_nuoc_ngoai.dinh_cu.dang_lam_thu_tuc && (
                        <div className="space-y-3 animate-fade-in pl-6">
                            <input disabled={isViewMode} type="text" className="w-full bg-white border border-slate-200 rounded px-3 py-2 text-sm" placeholder="Nước định cư..." value={formData.yeu_to_nuoc_ngoai.dinh_cu.nuoc_dinh_cu} onChange={e => setFormData({...formData, yeu_to_nuoc_ngoai: {...formData.yeu_to_nuoc_ngoai, dinh_cu: {...formData.yeu_to_nuoc_ngoai.dinh_cu, nuoc_dinh_cu: e.target.value}}})} />
                            <input disabled={isViewMode} type="text" className="w-full bg-white border border-slate-200 rounded px-3 py-2 text-sm" placeholder="Người bảo lãnh (Họ tên, quan hệ)..." value={formData.yeu_to_nuoc_ngoai.dinh_cu.nguoi_bao_lanh} onChange={e => setFormData({...formData, yeu_to_nuoc_ngoai: {...formData.yeu_to_nuoc_ngoai, dinh_cu: {...formData.yeu_to_nuoc_ngoai.dinh_cu, nguoi_bao_lanh: e.target.value}}})} />
                        </div>
                    )}
                </div>

                <div className="space-y-4">
                    <h4 className="text-xs font-black uppercase text-slate-500 border-b border-slate-100 pb-2 mb-2 flex items-center gap-2"><CreditCard size={14}/> Hộ chiếu (Passport)</h4>
                    <label className="flex items-center gap-2 cursor-pointer mb-2">
                        <input disabled={isViewMode} type="checkbox" className="w-4 h-4 accent-green-600" checked={formData.yeu_to_nuoc_ngoai.ho_chieu.da_co} onChange={e => setFormData({...formData, yeu_to_nuoc_ngoai: {...formData.yeu_to_nuoc_ngoai, ho_chieu: {...formData.yeu_to_nuoc_ngoai.ho_chieu, da_co: e.target.checked}}})} />
                        <span className="text-xs font-bold text-slate-700">Đã được cấp Hộ chiếu</span>
                    </label>
                    {formData.yeu_to_nuoc_ngoai.ho_chieu.da_co && (
                        <div className="space-y-3 animate-fade-in pl-6">
                            <div className="grid grid-cols-2 gap-3">
                                <input disabled={isViewMode} type="text" placeholder="Số hiệu" className="w-full bg-white border border-slate-200 rounded px-2 py-1.5 text-xs" value={formData.yeu_to_nuoc_ngoai.ho_chieu.so_hieu} onChange={e => setFormData({...formData, yeu_to_nuoc_ngoai: {...formData.yeu_to_nuoc_ngoai, ho_chieu: {...formData.yeu_to_nuoc_ngoai.ho_chieu, so_hieu: e.target.value}}})} />
                                <VietnamDateInput disabled={isViewMode} placeholder="Ngày cấp" className="w-full bg-white border border-slate-200 rounded px-2 py-1.5 text-xs" value={formData.yeu_to_nuoc_ngoai.ho_chieu.ngay_cap} onChange={(val: string) => setFormData({...formData, yeu_to_nuoc_ngoai: {...formData.yeu_to_nuoc_ngoai, ho_chieu: {...formData.yeu_to_nuoc_ngoai.ho_chieu, ngay_cap: val}}})} />
                            </div>
                            <input disabled={isViewMode} type="text" placeholder="Nơi giữ hiện nay" className="w-full bg-white border border-slate-200 rounded px-2 py-1.5 text-xs" value={formData.yeu_to_nuoc_ngoai.ho_chieu.noi_giu} onChange={e => setFormData({...formData, yeu_to_nuoc_ngoai: {...formData.yeu_to_nuoc_ngoai, ho_chieu: {...formData.yeu_to_nuoc_ngoai.ho_chieu, noi_giu: e.target.value}}})} />
                        </div>
                    )}
                </div>
            </div>

             <div className="mt-6 pt-4 border-t border-slate-100">
                 <div className="flex justify-between items-center mb-2">
                    <h4 className="text-xs font-black uppercase text-slate-500">Thân nhân ở nước ngoài</h4>
                    {!isViewMode && <button onClick={() => setFormData({...formData, yeu_to_nuoc_ngoai: {...formData.yeu_to_nuoc_ngoai, than_nhan: [...formData.yeu_to_nuoc_ngoai.than_nhan, { moi_quan_he: '', ho_ten: '', quoc_gia: '' }]}})} className="text-[10px] text-blue-600 font-bold hover:underline">+ THÊM</button>}
                 </div>
                 {formData.yeu_to_nuoc_ngoai.than_nhan.map((tn: any, idx: number) => (
                     <div key={idx} className="flex gap-2 mb-2">
                        <input disabled={isViewMode} type="text" placeholder="Quan hệ (Bố, mẹ...)" className={`${inputClass} !w-32`} value={tn.moi_quan_he} onChange={e => {
                            const newTn = [...formData.yeu_to_nuoc_ngoai.than_nhan]; newTn[idx].moi_quan_he = e.target.value;
                            setFormData({...formData, yeu_to_nuoc_ngoai: {...formData.yeu_to_nuoc_ngoai, than_nhan: newTn}});
                        }} />
                        <input disabled={isViewMode} type="text" placeholder="Họ tên" className={inputClass} value={tn.ho_ten} onChange={e => {
                            const newTn = [...formData.yeu_to_nuoc_ngoai.than_nhan]; newTn[idx].ho_ten = e.target.value;
                            setFormData({...formData, yeu_to_nuoc_ngoai: {...formData.yeu_to_nuoc_ngoai, than_nhan: newTn}});
                        }} />
                        <input disabled={isViewMode} type="text" placeholder="Quốc gia định cư" className={inputClass} value={tn.quoc_gia} onChange={e => {
                            const newTn = [...formData.yeu_to_nuoc_ngoai.than_nhan]; newTn[idx].quoc_gia = e.target.value;
                            setFormData({...formData, yeu_to_nuoc_ngoai: {...formData.yeu_to_nuoc_ngoai, than_nhan: newTn}});
                        }} />
                         {!isViewMode && <button onClick={() => {
                             const newTn = formData.yeu_to_nuoc_ngoai.than_nhan.filter((_:any, i:number) => i!==idx);
                             setFormData({...formData, yeu_to_nuoc_ngoai: {...formData.yeu_to_nuoc_ngoai, than_nhan: newTn}});
                         }} className="text-red-400"><X size={16}/></button>}
                     </div>
                 ))}
             </div>
          </div>
          
          {/* 10. Ý KIẾN & CAM ĐOAN */}
          <div ref={el => sectionRefs.current[9] = el} className="mb-12 scroll-mt-6">
            <h3 className={sectionTitleClass}><div className={sectionIconClass}><FileSignature size={18}/></div> Ý kiến & Cam đoan</h3>
            <div className="space-y-6">
                <div>
                    <label className={labelClass}>Ý kiến / Nguyện vọng cá nhân</label>
                    <textarea 
                        disabled={isViewMode} 
                        className={inputClass} 
                        rows={4} 
                        placeholder="Trình bày nguyện vọng về công tác, gia đình..." 
                        value={formData.y_kien_cam_doan.y_kien_nguyen_vong} 
                        onChange={e => setFormData({...formData, y_kien_cam_doan: {...formData.y_kien_cam_doan, y_kien_nguyen_vong: e.target.value}})} 
                    />
                </div>
                
                <div>
                    <label className={labelClass}>Lời cam đoan</label>
                    <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                        <textarea 
                            disabled={isViewMode} 
                            className="w-full bg-transparent border-none outline-none text-sm text-slate-700 italic" 
                            rows={3} 
                            value={formData.y_kien_cam_doan.cam_doan} 
                            onChange={e => setFormData({...formData, y_kien_cam_doan: {...formData.y_kien_cam_doan, cam_doan: e.target.value}})} 
                        />
                    </div>
                </div>
            </div>
          </div>

        </div>
      </div>

      <div className="p-6 bg-slate-50 border-t flex justify-end gap-4 shrink-0 shadow-[0_-4px_20px_rgba(0,0,0,0.05)] z-20">
        <button onClick={onClose} className="px-8 py-3 bg-white text-slate-600 rounded-xl font-bold uppercase text-xs tracking-widest hover:bg-slate-100 transition-all border border-slate-200">{isViewMode ? 'Đóng' : 'Hủy bỏ'}</button>
        {!isViewMode && (
            <button onClick={handleSave} className="px-12 py-3 bg-green-700 text-white rounded-xl font-black uppercase text-xs tracking-widest shadow-xl shadow-green-200 hover:bg-green-800 hover:scale-105 active:scale-95 transition-all flex items-center gap-2"><Save size={16} /> Lưu hồ sơ</button>
        )}
      </div>

      <style>{` .scroll-mt-6 { scroll-margin-top: 1.5rem; } `}</style>
    </div>
  );
};

export default PersonnelForm;