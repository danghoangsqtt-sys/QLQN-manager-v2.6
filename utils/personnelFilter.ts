
import { MilitaryPersonnel } from '../types';

export interface FilterCriteria {
  keyword: string;       
  unitId: string;        
  rank: string;          
  
  // 1. Nhóm Chính trị & Học vấn
  political: 'all' | 'dang_vien' | 'doan_vien' | 'quan_chung';
  education: 'all' | 'dai_hoc_cao_dang' | '12_12' | 'duoi_12' | 'da_tot_nghiep' | 'chua_tot_nghiep';
  
  // 2. Nhóm Gia đình & Hôn nhân
  marital: 'all' | 'da_vo' | 'chua_vo' | 'co_con' | 'co_nguoi_yeu' | 'hoan_canh_dac_biet';
  
  // 3. Nhóm Nhân khẩu học
  ethnicity: 'all' | 'kinh' | 'dan_toc_thieu_so';
  religion: 'all' | 'khong' | 'co_ton_giao';
  ageRange: 'all' | '18_25' | '26_30' | '31_40' | 'tren_40';
  hometown: string;
  
  // 4. Nhóm An ninh & Vi phạm
  security: 'all' | 'canh_bao' | 'an_toan' | 'vay_no' | 'vay_no_gia_dinh_khong_biet' | 'vi_pham_ky_luat' | 'ma_tuy' | 'danh_bac' | 'nuoc_ngoai' | 'ho_chieu' | 'dang_lam_dinh_cu';
  
  // 5. Sắp xếp
  sortBy: 'none' | 'name' | 'age' | 'rank' | 'enlistment';
}

/**
 * Chuẩn hóa chuỗi tiếng Việt để so sánh chính xác
 * Chuyển về chữ thường, chuẩn NFC và xóa khoảng trắng thừa
 */
const normalizeStr = (str: string): string => {
  if (!str) return '';
  return str
    .toLowerCase()
    .normalize('NFC')
    .trim();
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

export const hasSecurityAlert = (p: MilitaryPersonnel): boolean => {
  return (
    !!p.tai_chinh_suc_khoe?.vay_no?.co_khong ||
    !!p.lich_su_vi_pham?.vi_pham_dia_phuong?.co_khong ||
    !!p.lich_su_vi_pham?.ma_tuy?.co_khong ||
    !!p.lich_su_vi_pham?.danh_bac?.co_khong ||
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
  
  let results = list.filter(p => {
    // A. Lọc theo từ khóa cơ bản (Tìm kiếm thông minh)
    if (criteria.keyword) {
      const kw = normalizeStr(criteria.keyword);
      const match = 
        normalizeStr(p.ho_ten).includes(kw) || 
        normalizeStr(p.ten_khac || '').includes(kw) ||
        p.cccd.includes(kw) || 
        (p.sdt_rieng || '').includes(kw) ||
        normalizeStr(p.don_vi).includes(kw);
      if (!match) return false;
    }

    // B. Cấp bậc
    if (criteria.rank && criteria.rank !== 'all' && p.cap_bac !== criteria.rank) return false;

    // C. Nhóm Chính trị
    if (criteria.political !== 'all') {
      if (criteria.political === 'dang_vien' && !p.vao_dang_ngay) return false;
      if (criteria.political === 'doan_vien' && (!p.ngay_vao_doan || p.vao_dang_ngay)) return false;
      if (criteria.political === 'quan_chung' && (p.vao_dang_ngay || p.ngay_vao_doan)) return false;
    }

    // D. Nhóm Học vấn
    if (criteria.education !== 'all') {
      const edu = normalizeStr(p.trinh_do_van_hoa || '');
      if (criteria.education === 'da_tot_nghiep' && !p.da_tot_nghiep) return false;
      if (criteria.education === 'chua_tot_nghiep' && p.da_tot_nghiep) return false;
      if (criteria.education === 'dai_hoc_cao_dang' && !edu.includes('đại học') && !edu.includes('cao đẳng') && !edu.includes('thạc sĩ')) return false;
      if (criteria.education === '12_12' && !edu.includes('12/12')) return false;
      if (criteria.education === 'duoi_12' && edu !== '' && !edu.includes('12/12') && !edu.includes('đại học') && !edu.includes('cao đẳng')) return false;
    }

    // E. NHÓM HÔN NHÂN & GIA ĐÌNH (ĐÃ SỬA LỖI)
    if (criteria.marital !== 'all') {
      const familyList = p.quan_he_gia_dinh?.cha_me_anh_em || [];
      
      // 1. Kiểm tra trạng thái kết hôn
      const hasSpouseInList = familyList.some(m => {
        const rel = normalizeStr(m.quan_he);
        return rel === 'vợ' || rel === 'chồng';
      });
      // Ưu tiên kiểm tra trường đối tượng vợ riêng hoặc trong list thân nhân
      const isMarried = (p.quan_he_gia_dinh?.vo && p.quan_he_gia_dinh.vo.ho_ten.trim() !== '') || hasSpouseInList;
      
      // 2. Kiểm tra có con
      const hasChildInList = familyList.some(m => normalizeStr(m.quan_he).includes('con'));
      const hasChildren = (p.quan_he_gia_dinh?.con?.length || 0) > 0 || hasChildInList;
      
      // 3. Kiểm tra người yêu
      const hasLover = (p.quan_he_gia_dinh?.nguoi_yeu?.length || 0) > 0;
      
      // 4. Hoàn cảnh đặc biệt (Phân tích sâu dữ liệu)
      const specialCircumstances = 
        !!p.hoan_canh_song?.ly_do_khong_song_cung_bo_me || 
        (p.hoan_canh_song?.song_chung_voi && 
         p.hoan_canh_song.song_chung_voi !== '' && 
         !p.hoan_canh_song.song_chung_voi.includes('Bố') && 
         !p.hoan_canh_song.song_chung_voi.includes('Mẹ')) ||
        !!p.thong_tin_gia_dinh_chung?.lich_su_vi_pham_nguoi_than?.co_khong ||
        familyList.some(m => {
          const info = normalizeStr(m.cho_o + m.nghe_nghiep);
          return info.includes('ly hôn') || info.includes('đã mất') || info.includes('tử vong') || info.includes('trại giam');
        });

      switch (criteria.marital) {
        case 'da_vo': if (!isMarried) return false; break;
        case 'chua_vo': if (isMarried) return false; break;
        case 'co_con': if (!hasChildren) return false; break;
        case 'co_nguoi_yeu': if (!hasLover) return false; break;
        case 'hoan_canh_dac_biet': if (!specialCircumstances) return false; break;
      }
    }

    // F. Nhân khẩu học
    if (criteria.ethnicity !== 'all') {
      const isKinh = normalizeStr(p.dan_toc || '').includes('kinh');
      if (criteria.ethnicity === 'kinh' && !isKinh) return false;
      if (criteria.ethnicity === 'dan_toc_thieu_so' && isKinh) return false;
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

    // G. BỘ LỌC AN NINH
    if (criteria.security !== 'all') {
      switch (criteria.security) {
        case 'canh_bao': if (!hasSecurityAlert(p)) return false; break;
        case 'an_toan': if (hasSecurityAlert(p)) return false; break;
        case 'vay_no': if (!p.tai_chinh_suc_khoe?.vay_no?.co_khong) return false; break;
        case 'vay_no_gia_dinh_khong_biet': 
          if (!p.tai_chinh_suc_khoe?.vay_no?.co_khong || p.tai_chinh_suc_khoe.vay_no.gia_dinh_biet) return false; 
          break;
        case 'vi_pham_ky_luat': if (!p.lich_su_vi_pham?.vi_pham_dia_phuong?.co_khong) return false; break;
        case 'ma_tuy': if (!p.lich_su_vi_pham?.ma_tuy?.co_khong) return false; break;
        case 'danh_bac': if (!p.lich_su_vi_pham?.danh_bac?.co_khong) return false; break;
        case 'nuoc_ngoai': 
          const foreign = (p.yeu_to_nuoc_ngoai?.than_nhan?.length || 0) > 0 || (p.yeu_to_nuoc_ngoai?.di_nuoc_ngoai?.length || 0) > 0 || !!p.vi_pham_nuoc_ngoai;
          if (!foreign) return false; 
          break;
        case 'ho_chieu': if (!p.yeu_to_nuoc_ngoai?.ho_chieu?.da_co) return false; break;
        case 'dang_lam_dinh_cu': if (!p.yeu_to_nuoc_ngoai?.xuat_canh_dinh_cu?.dang_lam_thu_tuc) return false; break;
      }
    }

    return true;
  });

  // H. SẮP XẾP (Giữ nguyên logic sắp xếp Tiếng Việt thông minh)
  if (criteria.sortBy && criteria.sortBy !== 'none') {
    results.sort((a, b) => {
      switch (criteria.sortBy) {
        case 'name':
          const getSortName = (fullName: string) => {
            const parts = fullName.trim().split(' ');
            const firstName = parts.pop() || '';
            const middleAndLastName = parts.join(' ');
            return { firstName, middleAndLastName };
          };
          const nameA = getSortName(a.ho_ten);
          const nameB = getSortName(b.ho_ten);
          const cmpName = nameA.firstName.localeCompare(nameB.firstName, 'vi');
          if (cmpName !== 0) return cmpName;
          return nameA.middleAndLastName.localeCompare(nameB.middleAndLastName, 'vi');
        
        case 'age':
          return new Date(b.ngay_sinh).getTime() - new Date(a.ngay_sinh).getTime();
        
        case 'enlistment':
          return new Date(b.nhap_ngu_ngay).getTime() - new Date(a.nhap_ngu_ngay).getTime();
        
        case 'rank':
          const rankOrder = ['Binh nhì', 'Binh nhất', 'Hạ sĩ', 'Trung sĩ', 'Thượng sĩ', 'Thiếu úy', 'Trung úy', 'Thượng úy', 'Đại úy', 'Thiếu tá', 'Trung tá', 'Thượng tá', 'Đại tá'];
          return rankOrder.indexOf(b.cap_bac) - rankOrder.indexOf(a.cap_bac);
        
        default:
          return 0;
      }
    });
  }

  return results;
};
