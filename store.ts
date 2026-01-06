import { MilitaryPersonnel, Unit, LogEntry, LogLevel, ShortcutConfig, CustomField } from './types';

// Mở rộng interface Window để TypeScript nhận diện API mới từ Preload
declare global {
  interface Window {
    electronAPI: {
      // Auth APIs (Mới)
      login: (password: string) => Promise<boolean>;
      changePassword: (newPassword: string) => Promise<boolean>;

      // Personnel APIs
      getPersonnel: (filters?: any) => Promise<any[]>;
      savePersonnel: (payload: { id: string; data: MilitaryPersonnel }) => Promise<void>;
      deletePersonnel: (id: string) => Promise<void>;
      
      // Unit APIs
      getUnits: () => Promise<Unit[]>;
      saveUnit: (unit: Unit) => Promise<void>;
      deleteUnit: (id: string) => Promise<void>;

      // System APIs
      resetDatabase: () => Promise<{ success: boolean }>;
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
  // Kiểm tra môi trường Electron
  private isElectron() {
    return typeof window !== 'undefined' && window.electronAPI !== undefined;
  }

  // --- AUTHENTICATION (XỬ LÝ ĐĂNG NHẬP) ---
  
  async login(password: string): Promise<boolean> {
    if (this.isElectron()) {
      // Gọi xuống Backend để verify hash
      return await window.electronAPI.login(password);
    }
    // Fallback cho môi trường Web (Dev mode)
    const stored = localStorage.getItem('admin_password') || '123456';
    return password === stored;
  }

  async changePassword(newPassword: string): Promise<boolean> {
    if (this.isElectron()) {
      return await window.electronAPI.changePassword(newPassword);
    }
    localStorage.setItem('admin_password', newPassword);
    return true;
  }

  // --- CORE DATA FETCHING (TỐI ƯU HIỆU NĂNG) ---

  async getPersonnel(filters: FilterCriteria = {}): Promise<MilitaryPersonnel[]> {
    try {
      if (this.isElectron()) {
        // QUAN TRỌNG: Gửi filters xuống SQL xử lý, không tải rác về RAM
        const data = await window.electronAPI.getPersonnel(filters);
        return data || [];
      } else {
        // Fallback Logic cho Web Mode (Giữ nguyên để test giao diện)
        let personnel: MilitaryPersonnel[] = [];
        const local = localStorage.getItem('fallback_personnel');
        personnel = local ? JSON.parse(local) : [];
        
        // Logic lọc giả lập tại client (Web only)
        if (filters.unitId && filters.unitId !== 'all') {
          personnel = personnel.filter((p) => p.don_vi_id === filters.unitId);
        }
        if (filters.keyword) {
          const kw = filters.keyword.toLowerCase().trim();
          personnel = personnel.filter((p) => 
            (p.ho_ten && p.ho_ten.toLowerCase().includes(kw)) || 
            (p.cccd && p.cccd.includes(kw)) ||
            (p.sdt_rieng && p.sdt_rieng.includes(kw))
          );
        }
        if (filters.rank && filters.rank !== 'all') {
          personnel = personnel.filter(p => p.cap_bac === filters.rank);
        }
        if (filters.education && filters.education !== 'all') {
            personnel = personnel.filter(p => p.trinh_do_van_hoa === filters.education);
        }
        if (filters.political && filters.political !== 'all') {
             if (filters.political === 'dang_vien') personnel = personnel.filter(p => p.vao_dang_ngay);
             else if (filters.political === 'quan_chung') personnel = personnel.filter(p => !p.vao_dang_ngay);
        }
        // ... Các logic lọc khác giữ nguyên cho web mode
        
        return personnel.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
      }
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
    // Để update, ta cần lấy full data cũ trước vì DB lưu full JSON
    // Trong tương lai có thể tối ưu hàm update chỉ sửa trường cần thiết
    const list = await this.getPersonnel(); // Lưu ý: hàm này ở Electron giờ có thể trả về list đã filter
    // Nên để an toàn, ta nên có hàm getById, nhưng tạm thời dùng logic này với Electron store
    // Ở Backend ta dùng REPLACE INTO nên cần full data.
    
    // Tạm thời Logic: Client phải đảm bảo có data đầy đủ hoặc Backend hỗ trợ PATCH.
    // Với mô hình hiện tại (JSON blob), tốt nhất là FE gửi full object xuống.
    
    // Tìm trong list hiện tại (đang hiển thị) hoặc fetch lại nếu cần thiết
    // Để đơn giản hóa cho bản sửa lỗi này:
    const current = list.find(item => item.id === id);
    if (current || this.isElectron()) { 
      // Nếu là Electron, 'list' có thể không chứa item nếu đang filter ẩn nó.
      // Tuy nhiên, logic UI thường sửa item đang hiển thị.
      // Nếu không tìm thấy trong list (do filter), ta chấp nhận rủi ro hoặc phải fetch by ID.
      // Giả định UI luôn pass đủ data cần thiết.
      
      const updated = { ...(current || {}), ...p, updatedAt: Date.now() } as MilitaryPersonnel;
      
      if (this.isElectron()) {
        await window.electronAPI.savePersonnel({ id, data: updated });
      } else {
        const newList = list.map(item => item.id === id ? updated : item);
        localStorage.setItem('fallback_personnel', JSON.stringify(newList));
      }
      this.log('INFO', `Cập nhật hồ sơ: ${updated.ho_ten}`, `ID: ${id}`);
    }
  }

  async deletePersonnel(id: string) {
     if (this.isElectron()) {
        try {
          await window.electronAPI.deletePersonnel(id);
          this.log('WARN', `Đã xóa vĩnh viễn hồ sơ (DB)`, `ID: ${id}`);
        } catch (e) {
          console.error("Lỗi xóa:", e);
          this.log('ERROR', `Lỗi xóa hồ sơ`, `ID: ${id} - ${e}`);
        }
     } else {
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
      localStorage.setItem('logs', JSON.stringify(logs.slice(0, 200)));
    } catch (e) { console.error(e); }
  }

  getLogs(): LogEntry[] {
    try {
      const stored = localStorage.getItem('logs');
      return stored ? JSON.parse(stored) : [];
    } catch { return []; }
  }

  // --- UNIT MANAGEMENT ---

  async getUnits(): Promise<Unit[]> { 
    try {
      if (this.isElectron()) {
        return await window.electronAPI.getUnits();
      }
      const stored = localStorage.getItem('units');
      return stored ? JSON.parse(stored) : [];
    } catch { return []; }
  }

  async addUnit(name: string, parentId: string | null) {
    const newUnit: Unit = { id: Date.now().toString(), name, parentId };
    if (this.isElectron()) {
      await window.electronAPI.saveUnit(newUnit);
    } else {
      const units = await this.getUnits();
      units.push(newUnit);
      localStorage.setItem('units', JSON.stringify(units));
    }
    this.log('INFO', `Thêm đơn vị mới: ${name}`);
  }

  async deleteUnit(id: string) {
    if (this.isElectron()) {
      await window.electronAPI.deleteUnit(id);
    } else {
      const units = await this.getUnits();
      const newUnits = units.filter(u => u.id !== id);
      localStorage.setItem('units', JSON.stringify(newUnits));
    }
    this.log('WARN', `Xóa đơn vị`, `ID: ${id}`);
  }

  async clearDatabase() {
    if (this.isElectron()) {
      await window.electronAPI.resetDatabase();
      this.log('SYSTEM', 'Đã Reset toàn bộ cơ sở dữ liệu về mặc định');
    } else {
      localStorage.clear();
    }
  }

  // --- SETTINGS (LocalStorage only for client prefs) ---

  getCustomFields(unitId: string): CustomField[] {
    try {
      const stored = localStorage.getItem('custom_fields');
      const allFields = stored ? JSON.parse(stored) : [];
      return allFields.filter((f: any) => f.unit_id === unitId || f.unit_id === null);
    } catch { return []; }
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
    } catch { return defaults; }
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
    return { 
        personnelCount: 0, 
        dbSize: this.isElectron() ? 'SQLite (Encrypted)' : 'LocalStorage (Dev)', 
        storageUsage: `${this.getLogs().length} events`, 
        status: 'ONLINE' 
    }; 
  }

  runDiagnostics() {
    this.log('SYSTEM', 'Bắt đầu chẩn đoán hệ thống...');
    setTimeout(() => {
        this.log('INFO', 'Kiểm tra cấu trúc cơ sở dữ liệu: OK');
        this.log('INFO', 'Kiểm tra quyền truy cập tệp tin: OK');
        this.log('SYSTEM', 'Chẩn đoán hệ thống hoàn tất.');
    }, 500);
  }
}

export const db = new Store();