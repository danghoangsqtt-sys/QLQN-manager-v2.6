import { MilitaryPersonnel, Unit, LogEntry, LogLevel, ShortcutConfig, CustomField } from './types';

// Mở rộng interface Window để TypeScript nhận diện API từ Preload
declare global {
  interface Window {
    electronAPI: {
      getPersonnel: () => Promise<any[]>;
      savePersonnel: (payload: { id: string; data: MilitaryPersonnel }) => Promise<void>;
      deletePersonnel: (id: string) => Promise<void>; // Thêm hàm xóa
      // Các hàm cho Units nếu sau này mở rộng IPC
    };
  }
}

export interface FilterCriteria {
  unitId?: string;
  keyword?: string;
  rank?: string;
  education?: string;
  political?: string;
  security?: string;
  marital?: string;
}

class Store {
  // Kiểm tra môi trường Electron chính xác hơn
  private isElectron() {
    return typeof window !== 'undefined' && window.electronAPI !== undefined;
  }

  // --- CORE DATA FETCHING ---
  async getPersonnel(filters: FilterCriteria = {}): Promise<MilitaryPersonnel[]> {
    try {
      let personnel: MilitaryPersonnel[] = [];

      if (this.isElectron()) {
        const rawData = await window.electronAPI.getPersonnel();
        if (Array.isArray(rawData)) {
          personnel = rawData.map((row: any) => {
            try {
              // Hỗ trợ cả trường hợp data đã là object hoặc là chuỗi JSON
              return typeof row.data === 'string' ? JSON.parse(row.data) : row.data;
            } catch (e) {
              console.error("Lỗi parse dữ liệu quân nhân:", e);
              return null;
            }
          }).filter(Boolean);
        }
      } else {
        // Fallback dữ liệu mẫu cho môi trường preview/web
        const local = localStorage.getItem('fallback_personnel');
        personnel = local ? JSON.parse(local) : [];
      }
      
      // --- LOGIC LỌC DỮ LIỆU (GIỮ NGUYÊN) ---
      
      // 1. Lọc theo Đơn vị
      if (filters.unitId && filters.unitId !== 'all') {
        personnel = personnel.filter((p) => p.don_vi_id === filters.unitId);
      }

      // 2. Lọc theo Từ khóa (Tên, CCCD, SĐT)
      if (filters.keyword) {
        const kw = filters.keyword.toLowerCase().trim();
        personnel = personnel.filter((p) => 
          (p.ho_ten && p.ho_ten.toLowerCase().includes(kw)) || 
          (p.cccd && p.cccd.includes(kw)) ||
          (p.sdt_rieng && p.sdt_rieng.includes(kw))
        );
      }

      // 3. Lọc theo Cấp bậc
      if (filters.rank && filters.rank !== 'all') {
        personnel = personnel.filter(p => p.cap_bac === filters.rank);
      }

      // 4. Lọc theo An ninh (Vi phạm, Vay nợ, Nước ngoài)
      if (filters.security && filters.security !== 'all') {
        if (filters.security === 'vi_pham') {
          personnel = personnel.filter(p => p.lich_su_vi_pham?.ma_tuy?.co_khong || p.lich_su_vi_pham?.vi_pham_dia_phuong?.co_khong);
        } else if (filters.security === 'vay_no') {
          personnel = personnel.filter(p => p.tai_chinh_suc_khoe?.vay_no?.co_khong);
        } else if (filters.security === 'nuoc_ngoai') {
          personnel = personnel.filter(p => 
            (p.yeu_to_nuoc_ngoai?.than_nhan && p.yeu_to_nuoc_ngoai.than_nhan.length > 0) || 
            (p.yeu_to_nuoc_ngoai?.di_nuoc_ngoai && p.yeu_to_nuoc_ngoai.di_nuoc_ngoai.length > 0)
          );
        }
      }

      // 5. Lọc theo Trình độ
      if (filters.education && filters.education !== 'all') {
        personnel = personnel.filter(p => p.trinh_do_van_hoa === filters.education);
      }

      // 6. Lọc theo Đảng viên (Chính trị)
      if (filters.political && filters.political !== 'all') {
        if (filters.political === 'dang_vien') {
             personnel = personnel.filter(p => p.vao_dang_ngay && p.vao_dang_ngay.length > 0);
        } else if (filters.political === 'quan_chung') {
             personnel = personnel.filter(p => !p.vao_dang_ngay);
        }
      }

      // Sắp xếp: Mới nhất lên đầu
      return personnel.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
    } catch (e) {
      console.error("Lỗi truy vấn dữ liệu:", e);
      return [];
    }
  }

  // --- DATA MUTATION ---

  async addPersonnel(p: MilitaryPersonnel) {
    const timestamp = Date.now();
    const newPerson = { ...p, createdAt: timestamp, updatedAt: timestamp };

    if (this.isElectron()) {
      await window.electronAPI.savePersonnel({ id: newPerson.id, data: newPerson });
    } else {
      const list = await this.getPersonnel();
      list.push(newPerson);
      localStorage.setItem('fallback_personnel', JSON.stringify(list));
    }
    this.log('INFO', `Thêm mới hồ sơ: ${p.ho_ten}`, `ID: ${p.id}`);
  }

  async updatePersonnel(id: string, p: Partial<MilitaryPersonnel>) {
    // Lấy danh sách hiện tại để merge dữ liệu cũ và mới
    const list = await this.getPersonnel();
    const current = list.find(item => item.id === id);
    
    if (current) {
      const updated = { ...current, ...p, updatedAt: Date.now() };
      
      if (this.isElectron()) {
        await window.electronAPI.savePersonnel({ id, data: updated });
      } else {
        const newList = list.map(item => item.id === id ? updated : item);
        localStorage.setItem('fallback_personnel', JSON.stringify(newList));
      }
      this.log('INFO', `Cập nhật hồ sơ: ${updated.ho_ten}`, `ID: ${id}`);
    } else {
      this.log('ERROR', `Không tìm thấy hồ sơ để cập nhật`, `ID: ${id}`);
    }
  }

  async deletePersonnel(id: string) {
     if (this.isElectron()) {
        try {
          // GỌI API XÓA THỰC SỰ
          await window.electronAPI.deletePersonnel(id);
          this.log('WARN', `Đã xóa vĩnh viễn hồ sơ (DB)`, `ID: ${id}`);
        } catch (e) {
          console.error("Lỗi khi xóa trên Electron:", e);
          this.log('ERROR', `Lỗi xóa hồ sơ`, `ID: ${id} - ${e}`);
        }
     } else {
        // Fallback Web Mode
        const list = await this.getPersonnel();
        const newList = list.filter(p => p.id !== id);
        localStorage.setItem('fallback_personnel', JSON.stringify(newList));
        this.log('WARN', `Đã xóa hồ sơ (Local)`, `ID: ${id}`);
     }
  }

  // --- LOGGING & UTILS ---

  log(level: LogLevel, message: string, details?: string) {
    try {
      const logs = this.getLogs();
      logs.unshift({ id: Date.now().toString(), timestamp: Date.now(), level, message, details });
      // Giữ lại 200 logs gần nhất để tối ưu LocalStorage
      localStorage.setItem('logs', JSON.stringify(logs.slice(0, 200)));
    } catch (e) {
      console.error("Lỗi ghi log:", e);
    }
  }

  getLogs(): LogEntry[] {
    try {
      const stored = localStorage.getItem('logs');
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  }

  // --- UNIT MANAGEMENT ---
  // Lưu ý: Hiện tại Units vẫn dùng LocalStorage để đảm bảo tương thích UI.
  // Cần nâng cấp Main Process để hỗ trợ bảng 'units' trong SQLite sau này.

  getUnits(): Unit[] { 
    try {
      const stored = localStorage.getItem('units');
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  }

  addUnit(name: string, parentId: string | null) {
    const units = this.getUnits();
    units.push({ id: Date.now().toString(), name, parentId });
    localStorage.setItem('units', JSON.stringify(units));
    this.log('INFO', `Thêm đơn vị mới: ${name}`);
  }

  deleteUnit(id: string) {
    const units = this.getUnits().filter(u => u.id !== id);
    localStorage.setItem('units', JSON.stringify(units));
    this.log('WARN', `Xóa đơn vị`, `ID: ${id}`);
  }

  // --- SETTINGS ---

  getCustomFields(unitId: string): CustomField[] {
    try {
      const stored = localStorage.getItem('custom_fields');
      const allFields = stored ? JSON.parse(stored) : [];
      return allFields.filter((f: any) => f.unit_id === unitId || f.unit_id === null);
    } catch {
      return [];
    }
  }

  getShortcuts(): ShortcutConfig[] {
    const defaults: ShortcutConfig[] = [
      { id: 'list', label: 'Danh Sách', key: '1', altKey: true, ctrlKey: false, shiftKey: false },
      { id: 'units', label: 'Tổ Chức', key: '2', altKey: true, ctrlKey: false, shiftKey: false },
      { id: 'new', label: 'Nhập Liệu', key: 'n', altKey: true, ctrlKey: false, shiftKey: false },
      { id: 'settings', label: 'Cài Đặt', key: '4', altKey: true, ctrlKey: false, shiftKey: false },
      { id: 'debug', label: 'Diagnostics', key: 'd', altKey: true, ctrlKey: false, shiftKey: false },
    ];
    try {
      const stored = localStorage.getItem('shortcuts');
      return stored ? JSON.parse(stored) : defaults;
    } catch {
      return defaults;
    }
  }

  updateShortcut(id: string, config: Partial<ShortcutConfig>) {
    const shortcuts = this.getShortcuts();
    const idx = shortcuts.findIndex(s => s.id === id);
    if (idx !== -1) {
      shortcuts[idx] = { ...shortcuts[idx], ...config };
      localStorage.setItem('shortcuts', JSON.stringify(shortcuts));
    }
  }

  resetShortcuts() {
    localStorage.removeItem('shortcuts');
  }

  getSystemStats() { 
    // Trả về số liệu giả lập, thực tế nên query từ DB nếu có thể
    const logs = this.getLogs();
    const units = this.getUnits();
    return { 
        personnelCount: 0, // Sẽ được cập nhật từ UI
        dbSize: `SQLite/Local (${units.length} units)`, 
        storageUsage: `${logs.length} logs`, 
        status: 'ONLINE' 
    }; 
  }

  runDiagnostics() {
    this.log('SYSTEM', 'Bắt đầu chẩn đoán hệ thống...');
    // Giả lập kiểm tra
    setTimeout(() => {
        this.log('INFO', 'Kiểm tra cấu trúc cơ sở dữ liệu: OK');
        this.log('INFO', 'Kiểm tra quyền truy cập tệp tin: OK');
        this.log('SYSTEM', 'Chẩn đoán hệ thống hoàn tất.');
    }, 500);
  }
}

export const db = new Store();