import { MilitaryPersonnel } from '../types';

// Mở rộng Type cho Filter để hỗ trợ các trường sâu
export interface FilterCriteria {
  keyword: string;       
  unitId: string;        
  rank: string;          
  
  // 1. Nhóm Chính trị & Học vấn
  political: 'all' | 'dang_vien' | 'doan_vien' | 'quan_chung';
  education: 'all' | 'dai_hoc_cao_dang' | '12_12' | 'duoi_12' | 'da_tot_nghiep' | 'chua_tot_nghiep';
  
  // 2. Nhóm Gia đình & Hôn nhân
  marital: 'all' | 'da_vo' | 'chua_vo' | 'co_con' | 'co_nguoi_yeu' | 'hoan_canh_dac_biet' | 'song_mot_minh';
  economic: 'all' | 'kha_gia' | 'kho_khan' | 'ho_ngheo';
  
  // 3. Nhóm Nhân khẩu học
  ethnicity: 'all' | 'kinh' | 'dan_toc_thieu_so';
  religion: 'all' | 'khong' | 'co_ton_giao';
  ageRange: 'all' | '18_25' | '26_30' | '31_40' | 'tren_40';
  hometown: string;
  
  // 4. Nhóm An ninh & Vi phạm (Nâng cấp)
  security: 'all' | 'canh_bao' | 'an_toan' | 'vay_no' | 'vi_pham_ky_luat' | 'vi_pham_phap_luat' | 'ma_tuy' | 'danh_bac' | 'nuoc_ngoai';
  
  // 5. Nhóm Sức khỏe & Kinh doanh (Mới)
  health: 'all' | 'loai_1' | 'loai_2' | 'loai_3_4_5' | 'co_benh_nen';
  business: 'all' | 'co_kinh_doanh' | 'khong_kinh_doanh';

  // 6. Sắp xếp
  sortBy: 'none' | 'name' | 'age' | 'rank' | 'enlistment';
}

/**
 * Chuẩn hóa chuỗi tiếng Việt: chữ thường, NFC, xóa khoảng trắng thừa
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

// Logic xác định hồ sơ có cảnh báo an ninh (Deep Check)
export const hasSecurityAlert = (p: MilitaryPersonnel): boolean => {
    const pAny = p as any; // Cast to any để truy cập các trường mở rộng
    
    // Check mảng vi phạm kỷ luật mới
    const hasDisciplineHistory = Array.isArray(pAny.lich_su_vi_pham?.ky_luat_quan_doi) && pAny.lich_su_vi_pham.ky_luat_quan_doi.length > 0;
    // Check mảng vi phạm pháp luật mới
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
  
  let results = [...list];

  results = results.filter(p => {
    const pAny = p as any; // Sử dụng pAny để truy cập cấu trúc dữ liệu mới linh hoạt

    // A. TỪ KHÓA
    if (criteria.keyword) {
      const kw = normalizeStr(criteria.keyword);
      const match = 
        normalizeStr(p.ho_ten).includes(kw) || 
        normalizeStr(p.ten_khac).includes(kw) ||
        p.cccd.includes(kw) || 
        (p.sdt_rieng || '').includes(kw) ||
        normalizeStr(p.don_vi).includes(kw);
      if (!match) return false;
    }

    // B. ĐƠN VỊ & CẤP BẬC
    if (criteria.unitId && criteria.unitId !== 'all') { /* Logic handled by Store usually */ }
    if (criteria.rank && criteria.rank !== 'all' && p.cap_bac !== criteria.rank) return false;

    // C. CHÍNH TRỊ
    if (criteria.political !== 'all') {
      const isDangVien = !!p.vao_dang_ngay;
      const isDoanVien = !!p.ngay_vao_doan && !isDangVien;
      if (criteria.political === 'dang_vien' && !isDangVien) return false;
      if (criteria.political === 'doan_vien' && !isDoanVien) return false;
      if (criteria.political === 'quan_chung' && (isDangVien || isDoanVien)) return false;
    }

    // D. HỌC VẤN
    if (criteria.education !== 'all') {
      const edu = normalizeStr(p.trinh_do_van_hoa);
      const isHighEdu = edu.includes('đại học') || edu.includes('cao đẳng') || edu.includes('thạc sĩ');
      if (criteria.education === 'da_tot_nghiep' && !p.da_tot_nghiep) return false;
      if (criteria.education === 'chua_tot_nghiep' && p.da_tot_nghiep) return false;
      if (criteria.education === 'dai_hoc_cao_dang' && !isHighEdu) return false;
      if (criteria.education === '12_12' && !edu.includes('12/12')) return false;
      if (criteria.education === 'duoi_12' && edu !== '' && !edu.includes('12/12') && !isHighEdu) return false;
    }

    // E. HÔN NHÂN & GIA ĐÌNH (Logic khớp với Form Mới)
    if (criteria.marital !== 'all') {
      const maritalStatus = pAny.custom_data?.tinh_trang_hon_nhan; // 'ket_hon' | 'doc_than'
      const hasWife = !!(pAny.quan_he_gia_dinh?.vo?.ho_ten);
      const isMarried = maritalStatus === 'ket_hon' || hasWife;

      const hasChildren = (p.quan_he_gia_dinh?.con?.length || 0) > 0;
      const hasLover = !!pAny.custom_data?.co_nguoi_yeu || (p.quan_he_gia_dinh?.nguoi_yeu?.length || 0) > 0;
      const livingAlone = pAny.hoan_canh_song?.song_chung_voi?.includes('Một mình');

      switch (criteria.marital) {
        case 'da_vo': if (!isMarried) return false; break;
        case 'chua_vo': if (isMarried) return false; break;
        case 'co_con': if (!hasChildren) return false; break;
        case 'co_nguoi_yeu': if (!hasLover) return false; break;
        case 'song_mot_minh': if (!livingAlone) return false; break;
      }
    }
    
    // Kinh tế gia đình
    if (criteria.economic && criteria.economic !== 'all') {
        const eco = normalizeStr(p.thong_tin_gia_dinh_chung?.muc_song);
        if (criteria.economic === 'ho_ngheo' && !eco.includes('nghèo')) return false;
        if (criteria.economic === 'kha_gia' && !eco.includes('khá')) return false;
        if (criteria.economic === 'kho_khan' && !eco.includes('khó')) return false;
    }

    // F. NHÂN KHẨU HỌC
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
    if (criteria.ageRange !== 'all') {
      const age = getAge(p.ngay_sinh);
      if (criteria.ageRange === '18_25' && (age < 18 || age > 25)) return false;
      if (criteria.ageRange === '26_30' && (age < 26 || age > 30)) return false;
      if (criteria.ageRange === '31_40' && (age < 31 || age > 40)) return false;
      if (criteria.ageRange === 'tren_40' && age <= 40) return false;
    }
    if (criteria.hometown) {
      const ht = normalizeStr(criteria.hometown);
      const matchHT = normalizeStr(p.noi_sinh).includes(ht) || normalizeStr(p.ho_khau_thu_tru).includes(ht);
      if (!matchHT) return false;
    }

    // G. AN NINH (Deep Search vào mảng mới)
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

    // H. SỨC KHỎE & KINH DOANH (Mới)
    if (criteria.health && criteria.health !== 'all') {
        const pl = pAny.tai_chinh_suc_khoe?.suc_khoe?.phan_loai || '';
        const benhLy = pAny.tai_chinh_suc_khoe?.suc_khoe?.benh_ly || '';
        
        if (criteria.health === 'loai_1' && pl !== 'Loại 1') return false;
        if (criteria.health === 'loai_2' && pl !== 'Loại 2') return false;
        if (criteria.health === 'loai_3_4_5' && !['Loại 3', 'Loại 4', 'Loại 5'].includes(pl)) return false;
        if (criteria.health === 'co_benh_nen' && !benhLy) return false;
    }

    if (criteria.business && criteria.business !== 'all') {
        const isBiz = !!p.tai_chinh_suc_khoe?.kinh_doanh?.co_khong;
        if (criteria.business === 'co_kinh_doanh' && !isBiz) return false;
        if (criteria.business === 'khong_kinh_doanh' && isBiz) return false;
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