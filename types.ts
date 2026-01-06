export enum AppMode {
  LOGIN = 'LOGIN',
  COMMANDER = 'COMMANDER',
  KIOSK = 'KIOSK'
}

export type LogLevel = 'INFO' | 'WARN' | 'ERROR' | 'SYSTEM';

export interface LogEntry {
  id: string;
  timestamp: number;
  level: LogLevel;
  message: string;
  details?: string;
}

export interface Unit {
  id: string;
  name: string;
  parentId: string | null;
}

export interface CustomField {
  id: string;
  display_name: string;
  field_key: string;
  data_type: 'TEXT' | 'INTEGER' | 'DATE' | 'TEXTAREA' | 'BOOLEAN';
  unit_id: string | null;
  is_required: boolean;
}

export interface ShortcutConfig {
  id: string;
  label: string;
  key: string;
  altKey: boolean;
  ctrlKey: boolean;
  shiftKey: boolean;
}

export interface BiographyEntry {
  time: string;
  job: string;
  place: string;
}

export interface SocialAccount {
  name: string;
  phone: string;
}

export interface FamilyMember {
  quan_he: string;
  ho_ten: string;
  nam_sinh: string;
  nghe_nghiep: string;
  cho_o: string;
  sdt: string;
}

export interface ForeignRelative {
  ten: string;
  qh: string;
  nuoc: string;
}

export interface TravelHistory {
  nuoc: string;
  muc_dich: string;
  thoi_gian: string;
}

export interface MilitaryPersonnel {
  id: string;
  ho_ten: string;
  ten_khac: string;
  ngay_sinh: string;
  cccd: string;
  cap_bac: string;
  chuc_vu: string;
  don_vi_id: string;
  don_vi: string;
  sdt_rieng: string;
  noi_sinh: string;
  ho_khau_thu_tru: string;
  dan_toc: string;
  ton_giao: string;
  anh_dai_dien: string;
  nhap_ngu_ngay: string;
  vao_dang_ngay: string;
  ngay_vao_doan: string;
  trinh_do_van_hoa: string;
  da_tot_nghiep: boolean;
  nang_khieu_so_truong: string;
  
  // JSON Columns
  tieu_su_ban_than: BiographyEntry[];
  mang_xa_hoi: { 
    facebook: SocialAccount[]; 
    zalo: SocialAccount[]; 
    tiktok: SocialAccount[] 
  };
  hoan_canh_song: {
    song_chung_voi: string;
    chi_tiet_nguoi_nuoi_duong: { ten: string; nghe: string; diachi: string } | null;
    ly_do_khong_song_cung_bo_me: string;
  };
  quan_he_gia_dinh: {
    cha_me_anh_em: FamilyMember[];
    vo: { ho_ten: string; nam_sinh: string; sdt: string; nghe_nghiep: string; noi_o: string } | null;
    con: Array<{ ten: string; ns: string }>;
    // Cập nhật interface nguoi_yeu để dùng 'sdt' thống nhất
    nguoi_yeu: Array<{ ten: string; ns: string; nghe_o: string; sdt: string }>;
  };
  thong_tin_gia_dinh_chung: {
    muc_song: string;
    nghe_nghiep_chinh: string;
    lich_su_vi_pham_nguoi_than: { co_khong: boolean; chi_tiet: string };
    lich_su_covid_gia_dinh: string;
  };
  yeu_to_nuoc_ngoai: {
    than_nhan: ForeignRelative[];
    di_nuoc_ngoai: TravelHistory[];
    ho_chieu: { da_co: boolean; du_dinh_nuoc: string };
    xuat_canh_dinh_cu: { dang_lam_thu_tuc: boolean; nuoc: string; nguoi_bao_lanh: string };
  };
  lich_su_vi_pham: {
    vi_pham_dia_phuong: { co_khong: boolean; noi_dung: string; ket_qua: string };
    danh_bac: { co_khong: boolean; hinh_thuc: string; dia_diem: string; doi_tuong: string };
    ma_tuy: { co_khong: boolean; thoi_gian: string; loai: string; so_lan: string; doi_tuong: string; xu_ly: string; hinh_thuc_xu_ly: string };
  };
  tai_chinh_suc_khoe: {
    vay_no: { 
      co_khong: boolean; 
      ai_vay: string; 
      nguoi_dung_ten: string;
      so_tien: string; 
      muc_dich: string; 
      hinh_thuc: string; 
      han_tra: string; 
      gia_dinh_biet: boolean; 
      nguoi_tra: string;
    };
    kinh_doanh: { co_khong: boolean; chi_tiet: string };
    covid_ban_than: { da_mac: boolean; thoi_gian: string };
  };
  custom_data: Record<string, any>;
  y_kien_nguyen_vong: string;
  vi_pham_nuoc_ngoai: string;
  createdAt: number;
}