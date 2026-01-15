
import { MilitaryPersonnel } from '../types';

export interface FilterCriteria {
  keyword: string;       
  unitId: string;        
  rank: string;          
  political: 'all' | 'dang_vien' | 'doan_vien' | 'quan_chung';
  education: 'all' | 'dai_hoc_cao_dang' | '12_12' | 'duoi_12' | 'da_tot_nghiep' | 'chua_tot_nghiep';
  marital: 'all' | 'da_vo' | 'chua_vo' | 'co_con' | 'co_nguoi_yeu' | 'hoan_canh_dac_biet';
  ethnicity: 'all' | 'kinh' | 'dan_toc_thieu_so';
  religion: 'all' | 'khong' | 'co_ton_giao';
  ageRange: 'all' | '18_25' | '26_30' | '31_40' | 'tren_40';
  hometown: string;
  security: 'all' | 'canh_bao' | 'an_toan' | 'vay_no' | 'vay_no_gia_dinh_khong_biet' | 'vi_pham_ky_luat' | 'ma_tuy' | 'danh_bac' | 'nuoc_ngoai' | 'ho_chieu' | 'dang_lam_dinh_cu';
  sortBy: 'none' | 'name' | 'age' | 'rank' | 'enlistment';
}

/**
 * --- HELPERS ---
 */

const normalizeStr = (str: string): string => 
  (str || '').toLowerCase().normalize('NFC').trim();

const getAge = (dobString: string): number => {
  if (!dobString) return 0;
  const birthDate = new Date(dobString);
  const today = new Date();
  if (isNaN(birthDate.getTime())) return 0;
  let age = today.getFullYear() - birthDate.getFullYear();
  const m = today.getMonth() - birthDate.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) age--;
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

/**
 * --- PREDICATE FUNCTIONS (LOGIC LỌC TỪNG PHẦN) ---
 */

const checkBasic = (p: MilitaryPersonnel, c: FilterCriteria) => {
  if (c.keyword) {
    const kw = normalizeStr(c.keyword);
    const searchable = [p.ho_ten, p.ten_khac, p.cccd, p.sdt_rieng, p.don_vi].map(v => normalizeStr(v || ''));
    if (!searchable.some(v => v.includes(kw))) return false;
  }
  if (c.rank !== 'all' && p.cap_bac !== c.rank) return false;
  return true;
};

const checkPolitics = (p: MilitaryPersonnel, c: FilterCriteria) => {
  if (c.political === 'all') return true;
  if (c.political === 'dang_vien') return !!p.vao_dang_ngay;
  if (c.political === 'doan_vien') return !!p.ngay_vao_doan && !p.vao_dang_ngay;
  if (c.political === 'quan_chung') return !p.vao_dang_ngay && !p.ngay_vao_doan;
  return true;
};

const checkEducation = (p: MilitaryPersonnel, c: FilterCriteria) => {
  if (c.education === 'all') return true;
  const edu = normalizeStr(p.trinh_do_van_hoa);
  switch (c.education) {
    case 'da_tot_nghiep': return !!p.da_tot_nghiep;
    case 'chua_tot_nghiep': return !p.da_tot_nghiep;
    case 'dai_hoc_cao_dang': return ['đại học', 'cao đẳng', 'thạc sĩ'].some(v => edu.includes(v));
    case '12_12': return edu.includes('12/12');
    case 'duoi_12': return edu !== '' && !['12/12', 'đại học', 'cao đẳng'].some(v => edu.includes(v));
    default: return true;
  }
};

const checkMarital = (p: MilitaryPersonnel, c: FilterCriteria) => {
  if (c.marital === 'all') return true;
  const familyList = p.quan_he_gia_dinh?.cha_me_anh_em || [];
  const isMarried = !!p.quan_he_gia_dinh?.vo?.ho_ten || familyList.some(m => ['vợ', 'chồng'].includes(normalizeStr(m.quan_he)));
  const hasChildren = (p.quan_he_gia_dinh?.con?.length || 0) > 0 || familyList.some(m => normalizeStr(m.quan_he).includes('con'));
  const hasLover = (p.quan_he_gia_dinh?.nguoi_yeu?.length || 0) > 0;
  
  const isSpecial = !!p.hoan_canh_song?.ly_do_khong_song_cung_bo_me || 
                    (p.hoan_canh_song?.song_chung_voi && !['bố', 'mẹ'].some(v => normalizeStr(p.hoan_canh_song.song_chung_voi).includes(v))) ||
                    !!p.thong_tin_gia_dinh_chung?.lich_su_vi_pham_nguoi_than?.co_khong ||
                    familyList.some(m => ['ly hôn', 'đã mất', 'tử vong', 'trại giam'].some(v => normalizeStr(m.cho_o + m.nghe_nghiep).includes(v)));

  switch (c.marital) {
    case 'da_vo': return isMarried;
    case 'chua_vo': return !isMarried;
    case 'co_con': return hasChildren;
    case 'co_nguoi_yeu': return hasLover;
    // Fix typo in marital status filter case from 'hoan_canh_biet' to 'hoan_canh_dac_biet' to match FilterCriteria type.
    case 'hoan_canh_dac_biet': return isSpecial;
    default: return true;
  }
};

const checkDemographics = (p: MilitaryPersonnel, c: FilterCriteria) => {
  if (c.ethnicity !== 'all') {
    const isKinh = normalizeStr(p.dan_toc).includes('kinh');
    if (c.ethnicity === 'kinh' && !isKinh) return false;
    if (c.ethnicity === 'dan_toc_thieu_so' && isKinh) return false;
  }
  if (c.ageRange !== 'all') {
    const age = getAge(p.ngay_sinh);
    if (c.ageRange === '18_25' && (age < 18 || age > 25)) return false;
    if (c.ageRange === '26_30' && (age < 26 || age > 30)) return false;
    if (c.ageRange === '31_40' && (age < 31 || age > 40)) return false;
    if (c.ageRange === 'tren_40' && age <= 40) return false;
  }
  if (c.hometown) {
    const ht = normalizeStr(c.hometown);
    if (!normalizeStr(p.noi_sinh).includes(ht) && !normalizeStr(p.ho_khau_thu_tru).includes(ht)) return false;
  }
  return true;
};

const checkSecurity = (p: MilitaryPersonnel, c: FilterCriteria) => {
  if (c.security === 'all') return true;
  const securityData = p.tai_chinh_suc_khoe?.vay_no;
  switch (c.security) {
    case 'canh_bao': return hasSecurityAlert(p);
    case 'an_toan': return !hasSecurityAlert(p);
    case 'vay_no': return !!securityData?.co_khong;
    case 'vay_no_gia_dinh_khong_biet': return !!securityData?.co_khong && !securityData?.gia_dinh_biet;
    case 'vi_pham_ky_luat': return !!p.lich_su_vi_pham?.vi_pham_dia_phuong?.co_khong;
    case 'ma_tuy': return !!p.lich_su_vi_pham?.ma_tuy?.co_khong;
    case 'danh_bac': return !!p.lich_su_vi_pham?.danh_bac?.co_khong;
    case 'nuoc_ngoai': return (p.yeu_to_nuoc_ngoai?.than_nhan?.length || 0) > 0 || (p.yeu_to_nuoc_ngoai?.di_nuoc_ngoai?.length || 0) > 0 || !!p.vi_pham_nuoc_ngoai;
    case 'ho_chieu': return !!p.yeu_to_nuoc_ngoai?.ho_chieu?.da_co;
    case 'dang_lam_dinh_cu': return !!p.yeu_to_nuoc_ngoai?.xuat_canh_dinh_cu?.dang_lam_thu_tuc;
    default: return true;
  }
};

/**
 * --- MAIN FILTER ENGINE ---
 */

export const filterPersonnel = (list: MilitaryPersonnel[], criteria: FilterCriteria): MilitaryPersonnel[] => {
  let results = list.filter(p => 
    checkBasic(p, criteria) &&
    checkPolitics(p, criteria) &&
    checkEducation(p, criteria) &&
    checkMarital(p, criteria) &&
    checkDemographics(p, criteria) &&
    checkSecurity(p, criteria)
  );

  if (criteria.sortBy && criteria.sortBy !== 'none') {
    results.sort((a, b) => {
      switch (criteria.sortBy) {
        case 'name':
          const getNameParts = (name: string) => {
            const parts = name.trim().split(' ');
            return { first: parts.pop() || '', rest: parts.join(' ') };
          };
          const aN = getNameParts(a.ho_ten), bN = getNameParts(b.ho_ten);
          return aN.first.localeCompare(bN.first, 'vi') || aN.rest.localeCompare(bN.rest, 'vi');
        case 'age': return new Date(b.ngay_sinh).getTime() - new Date(a.ngay_sinh).getTime();
        case 'enlistment': return new Date(b.nhap_ngu_ngay).getTime() - new Date(a.nhap_ngu_ngay).getTime();
        case 'rank':
          const ranks = ['Binh nhì', 'Binh nhất', 'Hạ sĩ', 'Trung sĩ', 'Thượng sĩ', 'Thiếu úy', 'Trung úy', 'Thượng úy', 'Đại úy', 'Thiếu tá', 'Trung tá', 'Thượng tá', 'Đại tá'];
          return ranks.indexOf(b.cap_bac) - ranks.indexOf(a.cap_bac);
        default: return 0;
      }
    });
  }

  return results;
};
