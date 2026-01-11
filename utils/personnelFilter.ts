import { Table } from 'dexie';
import { MilitaryPersonnel } from '../types';

// Mở rộng bộ lọc để phù hợp với PersonnelForm mới
export interface FilterCriteria {
  keyword: string;
  unitId: string;
  
  // Cấp bậc & Chức vụ
  rank: string;
  
  // Chính trị & Học vấn
  political: 'all' | 'dang_vien' | 'quan_chung' | 'doan_vien';
  education: 'all' | 'dai_hoc_cao_dang' | 'duoi_dai_hoc' | 'da_tot_nghiep' | 'chua_tot_nghiep';
  
  // Gia đình
  marital: 'all' | 'da_vo' | 'chua_vo' | 'co_ban_gai';
  hasChildren: 'all' | 'co_con' | 'chua_con';
  
  // Dân số & Xã hội
  ethnicity: 'all' | 'kinh' | 'dan_toc_thieu_so';
  religion: 'all' | 'khong' | 'co_ton_giao';
  hometown: string;
  ageRange: 'all' | '18_25' | '26_30' | '31_40' | 'tren_40';

  // An ninh & Kỷ luật (Chi tiết hóa)
  security: 'all' | 'canh_bao' | 'vay_no' | 'vi_pham_ky_luat' | 'vi_pham_phap_luat' | 'ma_tuy' | 'co_bac' | 'hut_thuoc' | 'nuoc_ngoai' | 'ho_chieu';
  
  // MỚI: Tài chính & Sức khỏe & Nước ngoài
  healthStatus: 'all' | 'loai_1' | 'loai_2' | 'loai_3' | 'loai_4_5';
  business: 'all' | 'co_kinh_doanh' | 'co_dau_tu';
  overseas: 'all' | 'da_di_nuoc_ngoai' | 'dang_lam_dinh_cu';

  // Sắp xếp
  sortBy?: 'name' | 'age' | 'enlistment' | 'none'; 
}

// Logic tính tuổi
const getAge = (dateString: string): number => {
  if (!dateString) return 0;
  let year = 0;
  if (dateString.includes('/')) {
    const parts = dateString.split('/');
    if (parts.length === 3) year = parseInt(parts[2]);
  } else if (dateString.includes('-')) {
    year = parseInt(dateString.split('-')[0]);
  }
  
  if (!year || isNaN(year)) return 0;
  return new Date().getFullYear() - year;
};

// Logic kiểm tra an ninh tổng quát (Cập nhật theo cấu trúc mới)
export const hasSecurityAlert = (p: MilitaryPersonnel): boolean => {
  const anNinh = p.lich_su_vi_pham;
  const taiChinh = p.tai_chinh_suc_khoe;
  const nuocNgoai = p.yeu_to_nuoc_ngoai;

  // 1. Kiểm tra vay nợ
  if (taiChinh?.vay_no?.co_khong) return true;

  // 2. Kiểm tra kỷ luật/vi phạm (Mảng)
  if (Array.isArray(anNinh?.ky_luat_quan_doi) && anNinh.ky_luat_quan_doi.length > 0) return true;
  if (Array.isArray(anNinh?.vi_pham_phap_luat) && anNinh.vi_pham_phap_luat.length > 0) return true;

  // 3. Kiểm tra tệ nạn (Object chi tiết)
  const teNan = anNinh?.te_nan_xa_hoi;
  if (teNan) {
      if (teNan.ma_tuy?.co_khong === true || teNan.ma_tuy === true) return true;
      if (teNan.co_bac?.co_khong === true || teNan.co_bac === true) return true;
      if (teNan.tin_dung_den) return true; // Cấu trúc cũ/mới
  }

  // 4. Kiểm tra nước ngoài
  if (nuocNgoai) {
      if (nuocNgoai.dinh_cu?.dang_lam_thu_tuc) return true;
      // Có thân nhân nước ngoài
      if (Array.isArray(nuocNgoai.than_nhan) && nuocNgoai.than_nhan.length > 0) return true;
      // Đi nước ngoài có vi phạm (kiểm tra trong lịch sử đi)
      if (Array.isArray(nuocNgoai.lich_su_di_nuoc_ngoai) && nuocNgoai.lich_su_di_nuoc_ngoai.some((t: any) => !!t.vi_pham)) return true;
  }

  return false;
};

// Hàm đệ quy lấy ID các đơn vị con
export const getRecursiveUnitIds = (allUnits: any[], rootId: string): string[] => {
    const children = allUnits.filter(u => u.parentId === rootId);
    let ids = [rootId];
    children.forEach(child => {
        ids = [...ids, ...getRecursiveUnitIds(allUnits, child.id)];
    });
    return ids;
};

// --- HÀM XỬ LÝ CHÍNH ---
export const executePersonnelQuery = async (
  table: Table<MilitaryPersonnel>,
  allUnits: any[], 
  criteria: Partial<FilterCriteria>,
  unlimited: boolean = false
): Promise<MilitaryPersonnel[]> => {
  
  let collection = table.toCollection();

  // Load dữ liệu vào RAM
  let results = await collection.toArray();

  // --- BẮT ĐẦU PIPE LỌC ---

  // 1. Lọc Keyword
  const keyword = criteria.keyword?.toLowerCase().trim();
  if (keyword) {
    results = results.filter(p => 
      (p.ho_ten || '').toLowerCase().includes(keyword) || 
      (p.ten_khac || '').toLowerCase().includes(keyword) ||
      (p.cccd || '').includes(keyword) || 
      (p.sdt_rieng || '').includes(keyword)
    );
  }

  // 2. Lọc Đơn vị
  if (criteria.unitId && criteria.unitId !== 'all') {
    const targetIds = getRecursiveUnitIds(allUnits, criteria.unitId);
    results = results.filter(p => targetIds.includes(p.don_vi_id));
  }

  // 3. Lọc Cấp bậc
  if (criteria.rank && criteria.rank !== 'all') {
    results = results.filter(p => p.cap_bac === criteria.rank);
  }

  // 4. Lọc Chính trị
  if (criteria.political === 'dang_vien') {
    results = results.filter(p => !!p.vao_dang_ngay);
  } else if (criteria.political === 'quan_chung') {
    results = results.filter(p => !p.vao_dang_ngay);
  } else if (criteria.political === 'doan_vien') {
    results = results.filter(p => !!p.ngay_vao_doan && !p.vao_dang_ngay);
  }

  // 5. Lọc Học vấn
  if (criteria.education === 'dai_hoc_cao_dang') {
    results = results.filter(p => {
      const edu = (p.trinh_do_van_hoa || '').toLowerCase();
      return edu.includes('đại học') || edu.includes('cao đẳng') || edu.includes('thạc sĩ') || edu.includes('tiến sĩ');
    });
  } else if (criteria.education === 'duoi_dai_hoc') {
     results = results.filter(p => {
      const edu = (p.trinh_do_van_hoa || '').toLowerCase();
      return !edu.includes('đại học') && !edu.includes('cao đẳng') && !edu.includes('thạc sĩ') && !edu.includes('tiến sĩ');
    });
  } else if (criteria.education === 'da_tot_nghiep') {
    results = results.filter(p => p.da_tot_nghiep === true);
  }

  // 6. Lọc Hôn nhân (Cập nhật theo cấu trúc mới + cũ)
  if (criteria.marital === 'da_vo') {
    results = results.filter(p => {
      const qh = p.quan_he_gia_dinh;
      // Check checkbox mới hoặc object cũ
      return qh?.tinh_trang_hon_nhan?.da_ket_hon || (qh?.vo && typeof qh.vo === 'object');
    });
  } else if (criteria.marital === 'chua_vo') {
    results = results.filter(p => {
       const qh = p.quan_he_gia_dinh;
       return !qh?.tinh_trang_hon_nhan?.da_ket_hon && !qh?.vo;
    });
  } else if (criteria.marital === 'co_ban_gai') {
    results = results.filter(p => {
       const qh = p.quan_he_gia_dinh;
       return qh?.tinh_trang_hon_nhan?.co_ban_gai || (qh?.ban_gai && typeof qh.ban_gai === 'object');
    });
  }

  // 7. Lọc Con cái
  if (criteria.hasChildren === 'co_con') {
    results = results.filter(p => {
        // Check mảng 'con' hoặc filter trong 'than_nhan'
        const hasConLegacy = Array.isArray(p.quan_he_gia_dinh?.con) && p.quan_he_gia_dinh.con.length > 0;
        const hasConNew = Array.isArray(p.quan_he_gia_dinh?.than_nhan) && p.quan_he_gia_dinh.than_nhan.some((r:any) => r.moi_quan_he.includes('Con'));
        return hasConLegacy || hasConNew;
    });
  }

  // 8. Lọc Dân tộc & Tôn giáo
  if (criteria.ethnicity === 'kinh') {
    results = results.filter(p => (p.dan_toc || '').toLowerCase() === 'kinh');
  } else if (criteria.ethnicity === 'dan_toc_thieu_so') {
    results = results.filter(p => {
       const dt = (p.dan_toc || '').toLowerCase();
       return dt && dt !== 'kinh';
    });
  }

  if (criteria.religion === 'co_ton_giao') {
    results = results.filter(p => {
       const tg = (p.ton_giao || '').toLowerCase();
       return tg && tg !== 'không' && tg !== 'khong';
    });
  }

  // 9. Lọc Độ tuổi
  if (criteria.ageRange && criteria.ageRange !== 'all') {
    results = results.filter(p => {
       const age = getAge(p.ngay_sinh);
       if (criteria.ageRange === '18_25') return age >= 18 && age <= 25;
       if (criteria.ageRange === '26_30') return age >= 26 && age <= 30;
       if (criteria.ageRange === '31_40') return age >= 31 && age <= 40;
       if (criteria.ageRange === 'tren_40') return age > 40;
       return true;
    });
  }

  // 10. Lọc An ninh & Vi phạm (CẬP NHẬT MẠNH MẼ)
  if (criteria.security === 'canh_bao') {
    results = results.filter(p => hasSecurityAlert(p));
  } else if (criteria.security === 'vay_no') {
     results = results.filter(p => !!p.tai_chinh_suc_khoe?.vay_no?.co_khong);
  } else if (criteria.security === 'vi_pham_ky_luat') {
     results = results.filter(p => Array.isArray(p.lich_su_vi_pham?.ky_luat_quan_doi) && p.lich_su_vi_pham.ky_luat_quan_doi.length > 0);
  } else if (criteria.security === 'vi_pham_phap_luat') {
     results = results.filter(p => Array.isArray(p.lich_su_vi_pham?.vi_pham_phap_luat) && p.lich_su_vi_pham.vi_pham_phap_luat.length > 0);
  } else if (criteria.security === 'ma_tuy') {
     results = results.filter(p => {
         const maTuy = p.lich_su_vi_pham?.te_nan_xa_hoi?.ma_tuy;
         return maTuy === true || maTuy?.co_khong === true;
     });
  } else if (criteria.security === 'co_bac') {
     results = results.filter(p => {
         const coBac = p.lich_su_vi_pham?.te_nan_xa_hoi?.co_bac;
         return coBac === true || coBac?.co_khong === true;
     });
  } else if (criteria.security === 'hut_thuoc') {
     results = results.filter(p => !!p.lich_su_vi_pham?.te_nan_xa_hoi?.hut_thuoc);
  } else if (criteria.security === 'nuoc_ngoai') {
     results = results.filter(p => 
       (p.yeu_to_nuoc_ngoai?.than_nhan?.length || 0) > 0 ||
       !!p.yeu_to_nuoc_ngoai?.dinh_cu?.dang_lam_thu_tuc
     );
  } else if (criteria.security === 'ho_chieu') {
     results = results.filter(p => !!p.yeu_to_nuoc_ngoai?.ho_chieu?.da_co);
  }

  // 11. Lọc Kinh doanh & Đầu tư (MỚI)
  if (criteria.business === 'co_kinh_doanh') {
      results = results.filter(p => !!p.tai_chinh_suc_khoe?.kinh_doanh_dau_tu?.kinh_doanh?.co_khong);
  } else if (criteria.business === 'co_dau_tu') {
      results = results.filter(p => !!p.tai_chinh_suc_khoe?.kinh_doanh_dau_tu?.dau_tu?.co_khong);
  }

  // 12. Lọc Sức khỏe (MỚI)
  if (criteria.healthStatus && criteria.healthStatus !== 'all') {
      results = results.filter(p => {
          const loai = (p.tai_chinh_suc_khoe?.phan_loai_suc_khoe || '').toLowerCase();
          if (criteria.healthStatus === 'loai_1') return loai.includes('loại 1');
          if (criteria.healthStatus === 'loai_2') return loai.includes('loại 2');
          if (criteria.healthStatus === 'loai_3') return loai.includes('loại 3');
          if (criteria.healthStatus === 'loai_4_5') return loai.includes('loại 4') || loai.includes('loại 5');
          return true;
      });
  }

  // 13. Lọc Yếu tố nước ngoài (Chi tiết)
  if (criteria.overseas === 'da_di_nuoc_ngoai') {
      results = results.filter(p => !!p.yeu_to_nuoc_ngoai?.da_di_nuoc_ngoai);
  } else if (criteria.overseas === 'dang_lam_dinh_cu') {
      results = results.filter(p => !!p.yeu_to_nuoc_ngoai?.dinh_cu?.dang_lam_thu_tuc);
  }

  // --- SẮP XẾP ---
  if (criteria.sortBy && criteria.sortBy !== 'none') {
    results.sort((a, b) => {
      if (criteria.sortBy === 'name') {
        const nameA = a.ho_ten.trim().split(' ').pop() || '';
        const nameB = b.ho_ten.trim().split(' ').pop() || '';
        const compare = nameA.localeCompare(nameB, 'vi');
        if (compare === 0) return a.ho_ten.localeCompare(b.ho_ten, 'vi');
        return compare;
      } else if (criteria.sortBy === 'age') {
        return (new Date(b.ngay_sinh).getTime() || 0) - (new Date(a.ngay_sinh).getTime() || 0);
      } else if (criteria.sortBy === 'enlistment') {
        return (new Date(b.nhap_ngu_ngay).getTime() || 0) - (new Date(a.nhap_ngu_ngay).getTime() || 0);
      }
      return 0;
    });
  } else {
    results.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
  }

  const optimizedResults = results.map(p => ({
    ...p,
    anh_dai_dien: p.anh_thumb || '', 
  }));

  if (!unlimited) {
      return optimizedResults.slice(0, 200);
  }

  return optimizedResults;
};