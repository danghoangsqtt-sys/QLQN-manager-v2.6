import { MilitaryPersonnel } from '../types';

// --- ĐỊNH NGHĨA TIÊU CHÍ LỌC MỞ RỘNG ---
export interface FilterCriteria {
  keyword: string;       
  unitId: string;        
  rank: string;          
  
  // 1. Nhóm Chính trị & Học vấn
  political: 'all' | 'dang_vien' | 'doan_vien' | 'quan_chung';
  educationLevel: 'all' | '12_12' | '9_12' | 'khac'; // Văn hóa
  professional: 'all' | 'dai_hoc' | 'cao_dang' | 'trung_cap' | 'so_cap' | 'thac_si_tien_si'; // Chuyên môn
  
  // 2. Nhóm Gia đình & Hôn nhân & Hoàn cảnh
  marital: 'all' | 'da_vo' | 'chua_vo' | 'co_con' | 'co_nguoi_yeu' | 'song_mot_minh' | 'song_cung_bo_me';
  economic: 'all' | 'kha_gia' | 'du_an' | 'kho_khan' | 'ho_ngheo';
  
  // 3. Nhóm Nhân khẩu học
  ethnicity: 'all' | 'kinh' | 'dan_toc_thieu_so';
  religion: 'all' | 'khong' | 'co_ton_giao';
  ageRange: 'all' | '18_25' | '26_30' | '31_40' | 'tren_40';
  hometown: string; // Quê quán
  talent: string; // Năng khiếu
  
  // 4. Nhóm An ninh & Vi phạm (Quét sâu)
  security: 'all' | 'canh_bao' | 'an_toan' | 'vay_no' | 'vi_pham_ky_luat' | 'vi_pham_phap_luat' | 'ma_tuy' | 'danh_bac' | 'nuoc_ngoai';
  
  // 5. Nhóm Sức khỏe & Kinh doanh (Chi tiết)
  health: 'all' | 'loai_1' | 'loai_2' | 'loai_3' | 'loai_4_5' | 'co_benh_ly';
  business: 'all' | 'co_kinh_doanh' | 'bds' | 'online' | 'chung_khoan' | 'khong_kinh_doanh';

  // 6. Sắp xếp
  sortBy: 'none' | 'name' | 'age' | 'rank' | 'enlistment';
}

/**
 * Chuẩn hóa chuỗi: chữ thường, NFC, xóa khoảng trắng thừa
 */
const normalizeStr = (str: string | undefined | null): string => {
  if (!str) return '';
  return str.toLowerCase().normalize('NFC').trim();
};

const getAge = (dobString: string): number => {
  if (!dobString) return 0;
  const birthDate = new Date(dobString);
  const today = new Date();
  if (isNaN(birthDate.getTime())) return 0;
  let age = today.getFullYear() - birthDate.getFullYear();
  const m = today.getMonth() - birthDate.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  return age;
};

// Logic xác định hồ sơ có cảnh báo an ninh (Deep Check 2 cấp)
export const hasSecurityAlert = (p: MilitaryPersonnel): boolean => {
    const pAny = p as any; 
    
    // Check mảng vi phạm kỷ luật (Tab 5)
    const hasDisciplineHistory = Array.isArray(pAny.lich_su_vi_pham?.ky_luat_quan_doi) && pAny.lich_su_vi_pham.ky_luat_quan_doi.length > 0;
    // Check mảng vi phạm pháp luật (Tab 5)
    const hasLegalHistory = Array.isArray(pAny.lich_su_vi_pham?.vi_pham_phap_luat) && pAny.lich_su_vi_pham.vi_pham_phap_luat.length > 0;

    return (
        !!p.tai_chinh_suc_khoe?.vay_no?.co_khong ||
        !!p.lich_su_vi_pham?.ma_tuy?.co_khong ||
        !!p.lich_su_vi_pham?.danh_bac?.co_khong ||
        hasDisciplineHistory ||
        hasLegalHistory ||
        (p.yeu_to_nuoc_ngoai?.than_nhan?.length || 0) > 0 ||
        (p.yeu_to_nuoc_ngoai?.di_nuoc_ngoai?.length || 0) > 0 ||
        !!p.yeu_to_nuoc_ngoai?.xuat_canh_dinh_cu?.dang_lam_thu_tuc ||
        !!p.vi_pham_nuoc_ngoai
    );
};

export const filterPersonnel = (
  list: MilitaryPersonnel[], 
  criteria: FilterCriteria
): MilitaryPersonnel[] => {
  
  // Sao chép cẩn thận
  let results = [...list];

  results = results.filter(p => {
    const pAny = p as any; // Cast để truy cập các trường custom/mới

    // A. TỪ KHÓA (Tìm cả trong Quê quán, Năng khiếu, Biệt danh)
    if (criteria.keyword) {
      const kw = normalizeStr(criteria.keyword);
      const match = 
        normalizeStr(p.ho_ten).includes(kw) || 
        normalizeStr(p.ten_khac).includes(kw) ||
        p.cccd.includes(kw) || 
        (p.sdt_rieng || '').includes(kw) ||
        normalizeStr(p.don_vi).includes(kw) ||
        normalizeStr(pAny.que_quan).includes(kw) || // Tìm theo quê quán
        normalizeStr(p.nang_khieu_so_truong).includes(kw); // Tìm theo năng khiếu
      if (!match) return false;
    }

    // B. CẤP BẬC
    if (criteria.rank && criteria.rank !== 'all' && p.cap_bac !== criteria.rank) return false;

    // C. CHÍNH TRỊ
    if (criteria.political !== 'all') {
      const isDangVien = !!p.vao_dang_ngay;
      const isDoanVien = !!p.ngay_vao_doan && !isDangVien;
      if (criteria.political === 'dang_vien' && !isDangVien) return false;
      if (criteria.political === 'doan_vien' && !isDoanVien) return false;
      if (criteria.political === 'quan_chung' && (isDangVien || isDoanVien)) return false;
    }

    // D. HỌC VẤN & CHUYÊN MÔN
    if (criteria.educationLevel !== 'all') {
        const edu = normalizeStr(p.trinh_do_van_hoa);
        if (criteria.educationLevel === '12_12' && !edu.includes('12/12')) return false;
        if (criteria.educationLevel === '9_12' && !edu.includes('9/12')) return false;
    }

    if (criteria.professional !== 'all') {
        const prof = normalizeStr(pAny.custom_data?.trinh_do_chuyen_mon); // Dữ liệu nằm trong custom_data
        if (criteria.professional === 'dai_hoc' && !prof.includes('đại học')) return false;
        if (criteria.professional === 'cao_dang' && !prof.includes('cao đẳng')) return false;
        if (criteria.professional === 'trung_cap' && !prof.includes('trung cấp')) return false;
        if (criteria.professional === 'so_cap' && !prof.includes('sơ cấp')) return false;
        if (criteria.professional === 'thac_si_tien_si' && !prof.includes('thạc sĩ') && !prof.includes('tiến sĩ')) return false;
    }

    // E. GIA ĐÌNH & HOÀN CẢNH (Khớp Tab 3)
    if (criteria.marital !== 'all') {
      const maritalStatus = pAny.custom_data?.tinh_trang_hon_nhan;
      const hasWife = !!(pAny.quan_he_gia_dinh?.vo?.ho_ten);
      const isMarried = maritalStatus === 'ket_hon' || hasWife;
      const hasChildren = (p.quan_he_gia_dinh?.con?.length || 0) > 0;
      const hasLover = !!pAny.custom_data?.co_nguoi_yeu || (p.quan_he_gia_dinh?.nguoi_yeu?.length || 0) > 0;
      const liveWith = normalizeStr(pAny.hoan_canh_song?.song_chung_voi);

      switch (criteria.marital) {
        case 'da_vo': if (!isMarried) return false; break;
        case 'chua_vo': if (isMarried) return false; break;
        case 'co_con': if (!hasChildren) return false; break;
        case 'co_nguoi_yeu': if (!hasLover) return false; break;
        case 'song_mot_minh': if (!liveWith.includes('một mình')) return false; break;
        case 'song_cung_bo_me': if (!liveWith.includes('bố') && !liveWith.includes('mẹ')) return false; break;
      }
    }
    
    // Kinh tế (Tab 3)
    if (criteria.economic && criteria.economic !== 'all') {
        const eco = normalizeStr(p.thong_tin_gia_dinh_chung?.muc_song);
        if (criteria.economic === 'ho_ngheo' && !eco.includes('nghèo')) return false;
        if (criteria.economic === 'kha_gia' && !eco.includes('khá')) return false;
        if (criteria.economic === 'kho_khan' && !eco.includes('khó')) return false;
        if (criteria.economic === 'du_an' && !eco.includes('đủ ăn')) return false;
    }

    // F. NHÂN KHẨU & QUÊ QUÁN
    if (criteria.ethnicity !== 'all') {
      const isKinh = normalizeStr(p.dan_toc).includes('kinh');
      if (criteria.ethnicity === 'kinh' && !isKinh) return false;
      if (criteria.ethnicity === 'dan_toc_thieu_so' && isKinh) return false;
    }
    if (criteria.religion !== 'all') {
        const isNone = normalizeStr(p.ton_giao) === 'không' || normalizeStr(p.ton_giao) === '';
        if (criteria.religion === 'khong' && !isNone) return false;
        if (criteria.religion === 'co_ton_giao' && isNone) return false;
    }
    if (criteria.hometown) {
        // Lọc chính xác theo trường Quê quán mới
        const ht = normalizeStr(criteria.hometown);
        const matchHT = normalizeStr(pAny.que_quan).includes(ht) || normalizeStr(p.ho_khau_thu_tru).includes(ht);
        if (!matchHT) return false;
    }
    if (criteria.talent) {
        if (!normalizeStr(p.nang_khieu_so_truong).includes(normalizeStr(criteria.talent))) return false;
    }

    // G. AN NINH (Tab 5 - Quét sâu mảng)
    if (criteria.security !== 'all') {
      const hasDiscipline = Array.isArray(pAny.lich_su_vi_pham?.ky_luat_quan_doi) && pAny.lich_su_vi_pham.ky_luat_quan_doi.length > 0;
      const hasLegal = Array.isArray(pAny.lich_su_vi_pham?.vi_pham_phap_luat) && pAny.lich_su_vi_pham.vi_pham_phap_luat.length > 0;

      switch (criteria.security) {
        case 'canh_bao': if (!hasSecurityAlert(p)) return false; break;
        case 'an_toan': if (hasSecurityAlert(p)) return false; break;
        case 'vay_no': if (!p.tai_chinh_suc_khoe?.vay_no?.co_khong) return false; break;
        case 'ma_tuy': if (!p.lich_su_vi_pham?.ma_tuy?.co_khong) return false; break;
        case 'danh_bac': if (!p.lich_su_vi_pham?.danh_bac?.co_khong) return false; break;
        case 'vi_pham_ky_luat': if (!hasDiscipline) return false; break;
        case 'vi_pham_phap_luat': if (!hasLegal) return false; break;
        case 'nuoc_ngoai': 
          const foreign = (p.yeu_to_nuoc_ngoai?.than_nhan?.length || 0) > 0 || 
                          (p.yeu_to_nuoc_ngoai?.di_nuoc_ngoai?.length || 0) > 0;
          if (!foreign) return false; 
          break;
      }
    }

    // H. SỨC KHỎE & KINH DOANH (Tab 6 - Chi tiết)
    if (criteria.health && criteria.health !== 'all') {
        const pl = pAny.tai_chinh_suc_khoe?.suc_khoe?.phan_loai || '';
        const benhLy = pAny.tai_chinh_suc_khoe?.suc_khoe?.benh_ly || '';
        
        if (criteria.health === 'loai_1' && pl !== 'Loại 1') return false;
        if (criteria.health === 'loai_2' && pl !== 'Loại 2') return false;
        if (criteria.health === 'loai_3' && pl !== 'Loại 3') return false;
        if (criteria.health === 'loai_4_5' && !['Loại 4', 'Loại 5'].includes(pl)) return false;
        if (criteria.health === 'co_benh_ly' && !benhLy) return false;
    }

    if (criteria.business && criteria.business !== 'all') {
        const isBiz = !!p.tai_chinh_suc_khoe?.kinh_doanh?.co_khong;
        const bizType = normalizeStr(pAny.tai_chinh_suc_khoe?.kinh_doanh?.hinh_thuc);

        if (criteria.business === 'co_kinh_doanh' && !isBiz) return false;
        if (criteria.business === 'khong_kinh_doanh' && isBiz) return false;
        if (criteria.business === 'online' && !bizType.includes('online')) return false;
        if (criteria.business === 'bds' && !bizType.includes('bất động sản')) return false;
        if (criteria.business === 'chung_khoan' && !bizType.includes('chứng khoán') && !bizType.includes('coin')) return false;
    }

    return true;
  });

  // I. SẮP XẾP
  if (criteria.sortBy && criteria.sortBy !== 'none') {
    results.sort((a, b) => {
      switch (criteria.sortBy) {
        case 'name':
          const getFirstName = (fullName: string) => fullName.trim().split(' ').pop() || '';
          return getFirstName(a.ho_ten).localeCompare(getFirstName(b.ho_ten), 'vi');
        case 'age':
          return new Date(b.ngay_sinh).getTime() - new Date(a.ngay_sinh).getTime(); 
        case 'enlistment':
          return new Date(b.nhap_ngu_ngay).getTime() - new Date(a.nhap_ngu_ngay).getTime();
        case 'rank':
          const rankOrder = ['Binh nhì', 'Binh nhất', 'Hạ sĩ', 'Trung sĩ', 'Thượng sĩ', 'Thiếu úy', 'Trung úy', 'Thượng úy', 'Đại úy', 'Thiếu tá', 'Trung tá', 'Thượng tá', 'Đại tá'];
          return rankOrder.indexOf(b.cap_bac) - rankOrder.indexOf(a.cap_bac);
        default: return 0;
      }
    });
  }

  return results;
};