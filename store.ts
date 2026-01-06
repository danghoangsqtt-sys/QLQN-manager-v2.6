import { MilitaryPersonnel, Unit, CustomField, LogEntry, LogLevel, ShortcutConfig } from './types';

const STORAGE_KEY = 'soldiers_db_v5';
const LOG_LIMIT = 100;

// Định nghĩa Interface cho bộ lọc nâng cao
export interface FilterCriteria {
  unitId?: string;
  keyword?: string;
  rank?: string;        // Cấp bậc
  education?: string;   // Trình độ văn hóa
  political?: string;   // Chính trị (Đảng/Đoàn)
  security?: string;    // An ninh (Vi phạm, Vay nợ, Nước ngoài)
  marital?: string;     // Hôn nhân (Độc thân/Có gia đình)
  type?: string;        // Giữ lại để tương thích ngược nếu cần
}

const DEFAULT_SHORTCUTS: ShortcutConfig[] = [
  { id: 'list', label: 'Danh sách (Alt + 1)', key: '1', altKey: true, ctrlKey: false, shiftKey: false },
  { id: 'units', label: 'Tổ chức (Alt + 2)', key: '2', altKey: true, ctrlKey: false, shiftKey: false },
  { id: 'input', label: 'Nhập liệu (Alt + 3)', key: '3', altKey: true, ctrlKey: false, shiftKey: false },
  { id: 'settings', label: 'Cài đặt (Alt + 4)', key: '4', altKey: true, ctrlKey: false, shiftKey: false },
  { id: 'debug', label: 'Debug (Alt + D)', key: 'd', altKey: true, ctrlKey: false, shiftKey: false },
  { id: 'new', label: 'Thêm mới (Alt + N)', key: 'n', altKey: true, ctrlKey: false, shiftKey: false },
  { id: 'search', label: 'Tìm kiếm (Alt + S)', key: 's', altKey: true, ctrlKey: false, shiftKey: false },
  { id: 'refresh', label: 'Làm mới (Alt + R)', key: 'r', altKey: true, ctrlKey: false, shiftKey: false },
];

class Store {
  private data: {
    personnel: MilitaryPersonnel[];
    units: Unit[];
    customFields: CustomField[];
    logs: LogEntry[];
    shortcuts: ShortcutConfig[];
  };

  constructor() {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        this.data = JSON.parse(saved);
        if (!this.data.logs) this.data.logs = [];
        if (!this.data.shortcuts) this.data.shortcuts = [...DEFAULT_SHORTCUTS];
      } catch (e) {
        console.error("Lỗi parse DB, khởi tạo mới");
        this.resetToDefault();
      }
    } else {
      this.resetToDefault();
    }
  }

  private resetToDefault() {
    this.data = {
      personnel: [],
      units: [
        { id: '1', name: 'Tiểu đoàn 1', parentId: null },
        { id: '2', name: 'Đại đội 1', parentId: '1' },
        { id: '3', name: 'Đại đội 2', parentId: '1' },
      ],
      customFields: [],
      logs: [],
      shortcuts: [...DEFAULT_SHORTCUTS]
    };
    this.log('SYSTEM', 'Hệ thống đã được khởi tạo mới hoặc reset.');
    this.save();
  }

  private save() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.data));
    } catch (e) {
      this.log('ERROR', 'Không thể lưu dữ liệu vào Disk!', String(e));
    }
  }

  log(level: LogLevel, message: string, details?: string) {
    const entry: LogEntry = {
      id: Math.random().toString(36).substr(2, 9),
      timestamp: Date.now(),
      level,
      message,
      details
    };
    this.data.logs = [entry, ...(this.data.logs || [])].slice(0, LOG_LIMIT);
  }

  getLogs() { return this.data.logs || []; }

  getSystemStats() {
    const dbString = JSON.stringify(this.data);
    return {
      personnelCount: this.data.personnel.length,
      unitCount: this.data.units.length,
      dbSize: (dbString.length / 1024).toFixed(2) + ' KB',
      storageUsage: ((dbString.length / 5242880) * 100).toFixed(2) + '%',
      status: 'HEALTHY'
    };
  }

  runDiagnostics() {
    this.log('SYSTEM', 'Bắt đầu quá trình chẩn đoán hệ thống...');
    let issues = 0;
    this.data.personnel.forEach(p => {
      const unit = this.data.units.find(u => u.id === p.don_vi_id);
      if (!unit) {
        this.log('WARN', `Chiến sĩ ${p.ho_ten} đang liên kết với đơn vị không tồn tại (ID: ${p.don_vi_id})`);
        issues++;
      }
    });
    if (issues === 0) {
      this.log('INFO', 'Chẩn đoán hoàn tất: Không tìm thấy lỗi logic dữ liệu.');
    } else {
      this.log('INFO', `Chẩn đoán hoàn tất: Tìm thấy ${issues} vấn đề.`);
    }
    this.save();
    return issues;
  }

  getUnits() { return this.data.units; }
  
  // --- LOGIC LỌC NÂNG CẤP ---
  getPersonnel(filters: FilterCriteria = {}) {
    let result = [...this.data.personnel];

    // 1. Lọc Đơn vị
    if (filters.unitId && filters.unitId !== 'all') {
      result = result.filter(p => p.don_vi_id === filters.unitId);
    }

    // 2. Tìm kiếm từ khóa (Mở rộng phạm vi tìm kiếm)
    if (filters.keyword) {
      const kw = filters.keyword.toLowerCase().trim();
      result = result.filter(p => 
        p.ho_ten.toLowerCase().includes(kw) || 
        p.cccd.includes(kw) ||
        (p.sdt_rieng || '').includes(kw) ||
        (p.nang_khieu_so_truong || '').toLowerCase().includes(kw) || // Tìm trong sở trường
        (p.que_quan || p.ho_khau_thu_tru || '').toLowerCase().includes(kw) // Tìm trong quê quán
      );
    }

    // 3. Lọc Cấp bậc
    if (filters.rank && filters.rank !== 'all') {
      result = result.filter(p => p.cap_bac === filters.rank);
    }

    // 4. Lọc Trình độ học vấn
    if (filters.education && filters.education !== 'all') {
      if (filters.education === 'dai_hoc') {
        // Tìm text chứa ĐH, Cao đẳng, Trung cấp...
        result = result.filter(p => 
          /đại học|cao đẳng|trung cấp|thạc sĩ|tiến sĩ/i.test(p.trinh_do_van_hoa)
        );
      } else if (filters.education === 'pho_thong') {
        result = result.filter(p => /12\/12|9\/12/.test(p.trinh_do_van_hoa));
      } else if (filters.education === 'chua_tot_nghiep') {
        result = result.filter(p => p.da_tot_nghiep === false);
      }
    }

    // 5. Lọc Chính trị
    if (filters.political && filters.political !== 'all') {
      if (filters.political === 'dang_vien') result = result.filter(p => !!p.vao_dang_ngay);
      if (filters.political === 'doan_vien') result = result.filter(p => !!p.ngay_vao_doan && !p.vao_dang_ngay); // Là đoàn viên nhưng chưa vào Đảng
    }

    // 6. Lọc An ninh & Kỷ luật (Deep Search)
    if (filters.security && filters.security !== 'all') {
      if (filters.security === 'vi_pham') {
        // Có bất kỳ vi phạm nào (Ma túy, cờ bạc, địa phương, vi phạm nước ngoài)
        result = result.filter(p => 
          p.lich_su_vi_pham?.ma_tuy?.co_khong || 
          p.lich_su_vi_pham?.danh_bac?.co_khong || 
          p.lich_su_vi_pham?.vi_pham_dia_phuong?.co_khong ||
          (p.vi_pham_nuoc_ngoai && p.vi_pham_nuoc_ngoai.length > 2)
        );
      } else if (filters.security === 'yeu_to_nuoc_ngoai') {
        // Có người thân nước ngoài hoặc đã từng đi nước ngoài
        result = result.filter(p => 
          (p.yeu_to_nuoc_ngoai?.than_nhan && p.yeu_to_nuoc_ngoai.than_nhan.length > 0) ||
          (p.yeu_to_nuoc_ngoai?.di_nuoc_ngoai && p.yeu_to_nuoc_ngoai.di_nuoc_ngoai.length > 0) ||
          p.yeu_to_nuoc_ngoai?.xuat_canh_dinh_cu?.dang_lam_thu_tuc
        );
      } else if (filters.security === 'vay_no') {
        result = result.filter(p => p.tai_chinh_suc_khoe?.vay_no?.co_khong);
      }
    }

    // 7. Lọc Hôn nhân
    if (filters.marital && filters.marital !== 'all') {
      if (filters.marital === 'co_vo') result = result.filter(p => p.quan_he_gia_dinh?.vo !== null);
      if (filters.marital === 'doc_than') result = result.filter(p => p.quan_he_gia_dinh?.vo === null);
      if (filters.marital === 'co_con') result = result.filter(p => p.quan_he_gia_dinh?.con && p.quan_he_gia_dinh.con.length > 0);
    }

    // Tương thích ngược với filterType cũ (nếu còn dùng)
    if (filters.type && filters.type !== 'all') {
       if (filters.type === 'dang_vien') result = result.filter(p => !!p.vao_dang_ngay);
       if (filters.type === 'vay_no') result = result.filter(p => p.tai_chinh_suc_khoe?.vay_no?.co_khong);
       if (filters.type === 'ma_tuy') result = result.filter(p => p.lich_su_vi_pham?.ma_tuy?.co_khong);
    }

    return result.sort((a, b) => b.createdAt - a.createdAt);
  }

  getCustomFields(unitId: string | 'all' | null) {
    if (unitId === 'all') return this.data.customFields;
    return this.data.customFields.filter(f => f.unit_id === null || f.unit_id === unitId);
  }

  addPersonnel(p: MilitaryPersonnel) {
    this.data.personnel.push(p);
    this.log('INFO', `Đã thêm hồ sơ mới: ${p.ho_ten}`, `ID: ${p.id}`);
    this.save();
  }

  updatePersonnel(id: string, updated: Partial<MilitaryPersonnel>) {
    this.data.personnel = this.data.personnel.map(p => p.id === id ? { ...p, ...updated } as MilitaryPersonnel : p);
    this.log('INFO', `Đã cập nhật hồ sơ ID: ${id}`);
    this.save();
  }

  deletePersonnel(id: string) {
    const p = this.data.personnel.find(x => x.id === id);
    this.data.personnel = this.data.personnel.filter(p => p.id !== id);
    this.log('WARN', `Đã xóa hồ sơ quân nhân: ${p?.ho_ten || id}`);
    this.save();
  }

  addUnit(name: string, parentId: string | null) {
    const newUnit = { id: Date.now().toString(), name, parentId };
    this.data.units.push(newUnit);
    this.log('INFO', `Đã thêm đơn vị mới: ${name}`);
    this.save();
  }

  deleteUnit(id: string) {
    const u = this.data.units.find(x => x.id === id);
    this.data.units = this.data.units.filter(u => u.id !== id);
    this.log('WARN', `Đã xóa đơn vị: ${u?.name || id}`);
    this.save();
  }

  getShortcuts(): ShortcutConfig[] {
    return this.data.shortcuts || DEFAULT_SHORTCUTS;
  }

  updateShortcut(id: string, config: Partial<ShortcutConfig>) {
    this.data.shortcuts = this.getShortcuts().map(s => s.id === id ? { ...s, ...config } : s);
    this.save();
    this.log('INFO', `Đã cập nhật phím tắt ID: ${id}`);
  }

  resetShortcuts() {
    this.data.shortcuts = [...DEFAULT_SHORTCUTS];
    this.save();
    this.log('SYSTEM', 'Đã đặt lại phím tắt về mặc định.');
  }
}

export const db = new Store();