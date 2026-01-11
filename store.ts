import { Dexie, type Table } from 'dexie';
import { MilitaryPersonnel, Unit, LogEntry, LogLevel, ShortcutConfig, CustomField } from './types';
import { executePersonnelQuery, hasSecurityAlert, FilterCriteria } from './utils/personnelFilter';

// Export lại FilterCriteria để Dashboard dùng
export type { FilterCriteria };

declare global {
  interface Window {
    electronAPI: any;
  }
}

// Khởi tạo Database Dexie
const dbInstance = new Dexie('QNManagerDB_v2') as Dexie & {
  personnel: Table<MilitaryPersonnel>;
  units: Table<Unit>;
  settings: Table<{ key: string; value: any }>;
  logs: Table<LogEntry>;
};

dbInstance.version(1).stores({
  personnel: 'id, ho_ten, cccd, don_vi_id, cap_bac, chuc_vu, createdAt, vao_dang_ngay, trinh_do_van_hoa',
  units: 'id, name, parentId',
  settings: 'key',
  logs: 'id, timestamp, level'
});

const DEFAULT_SHORTCUTS: ShortcutConfig[] = [
  { id: 'add_person', label: 'Thêm chiến sĩ mới', key: 'n', altKey: false, ctrlKey: true, shiftKey: false },
  { id: 'search', label: 'Tiêu điểm tìm kiếm', key: 'f', altKey: false, ctrlKey: true, shiftKey: false },
  { id: 'refresh', label: 'Làm mới dữ liệu', key: 'r', altKey: false, ctrlKey: true, shiftKey: false },
  { id: 'guide', label: 'Mở hướng dẫn sử dụng', key: 'h', altKey: false, ctrlKey: true, shiftKey: false }
];

class Store {
  constructor() {
    this.initDefaults();
  }

  private async initDefaults() {
    const unitCount = await dbInstance.units.count();
    if (unitCount === 0) {
      await dbInstance.units.add({ id: '1', name: 'Ban Chỉ Huy', parentId: null });
    }
    const shortcuts = await this.getSetting('app_shortcuts');
    if (!shortcuts) {
      await this.saveSetting('app_shortcuts', DEFAULT_SHORTCUTS);
    }
    this.log('SYSTEM', 'Hệ thống đã sẵn sàng vận hành.');
  }

  async login(password: string): Promise<boolean> {
    // Kiểm tra API Electron có tồn tại không
    if (window.electronAPI) {
        const res = await window.electronAPI.login(password);
        if (res) this.log('INFO', 'Người dùng đăng nhập thành công.');
        return res;
    } 
    
    // Chỉ cho phép fallback 123456 khi đang ở chế độ DEV (localhost)
    if (import.meta.env.DEV) {
         console.warn("Đang dùng mật khẩu debug: 123456");
         return password === '123456';
    }

    return false; // Chặn login nếu chạy trên web production mà không có Electron
}

  async changePassword(password: string): Promise<boolean> {
    if (window.electronAPI && window.electronAPI.changePassword) {
      return await window.electronAPI.changePassword(password);
    }
    return true;
  }

  // Wrapper gọi hàm check an ninh (để giữ tương thích code cũ)
  public hasSecurityAlert(p: MilitaryPersonnel): boolean {
    return hasSecurityAlert(p);
  }

  // Hàm lấy chi tiết đầy đủ (dùng cho Edit/Print)
  async getPersonnelById(id: string): Promise<MilitaryPersonnel | undefined> {
    return await dbInstance.personnel.get(id);
  }

  // [ĐÃ SỬA LỖI] Sử dụng logic từ file utils/personnelFilter
  async getPersonnel(filters: Partial<FilterCriteria> = {}, unlimited: boolean = false): Promise<MilitaryPersonnel[]> {
    // Lấy danh sách đơn vị để hỗ trợ lọc theo cây thư mục
    const allUnits = await dbInstance.units.toArray();
    return executePersonnelQuery(dbInstance.personnel, allUnits, filters, unlimited);
  }

  async getDashboardStats() {
    const total = await dbInstance.personnel.count();
    const party = await dbInstance.personnel.filter(p => !!p.vao_dang_ngay).count();
    
    let securityAlert = 0;
    let educationHigh = 0;
    const ranks: Record<string, number> = {};

    await dbInstance.personnel.each(p => {
        if (this.hasSecurityAlert(p)) securityAlert++;
        
        const edu = (p.trinh_do_van_hoa || '').toLowerCase();
        if (edu.includes('đại học') || edu.includes('cao đẳng') || edu.includes('thạc sĩ')) {
            educationHigh++;
        }
        
        if (p.cap_bac) ranks[p.cap_bac] = (ranks[p.cap_bac] || 0) + 1;
    });

    return {
      total,
      party,
      securityAlert,
      educationHigh,
      ranks
    };
  }

  async addPersonnel(p: MilitaryPersonnel) {
    this.log('INFO', `Thêm mới quân nhân: ${p.ho_ten}`);
    return dbInstance.personnel.add({ ...p, createdAt: Date.now() });
  }

  async updatePersonnel(id: string, p: Partial<MilitaryPersonnel>) {
    this.log('INFO', `Cập nhật hồ sơ ID: ${id}`);
    return dbInstance.personnel.update(id, p);
  }

  async deletePersonnel(id: string) {
    this.log('WARN', `Xóa hồ sơ ID: ${id}`);
    return dbInstance.personnel.delete(id);
  }

  async getUnits(): Promise<Unit[]> {
    return dbInstance.units.toArray();
  }

  async addUnit(name: string, parentId: string | null) {
    this.log('INFO', `Thêm đơn vị: ${name}`);
    return dbInstance.units.add({ id: Date.now().toString(), name, parentId });
  }

  async updateUnit(id: string, name: string) {
    this.log('INFO', `Cập nhật tên đơn vị ID ${id} thành: ${name}`);
    return dbInstance.units.update(id, { name });
  }

  async deleteUnit(id: string) {
    this.log('WARN', `Bắt đầu xóa đơn vị ID: ${id}`);
    // Logic xóa con đệ quy đơn giản
    const toDelete = [id];
    // (Nếu cần xóa đệ quy triệt để, sử dụng hàm getRecursiveUnitIds trong utils, 
    // nhưng ở đây giữ logic đơn giản để tránh import vòng nếu chưa cần thiết)
    await dbInstance.units.bulkDelete(toDelete);
    return true;
  }

  async getSetting(key: string): Promise<any> {
    const entry = await dbInstance.settings.get(key);
    return entry ? entry.value : null;
  }

  async saveSetting(key: string, value: any): Promise<void> {
    await dbInstance.settings.put({ key, value });
  }

  async getShortcuts(): Promise<ShortcutConfig[]> {
    const saved = await this.getSetting('app_shortcuts');
    return saved || DEFAULT_SHORTCUTS;
  }

  async updateShortcut(id: string, update: Partial<ShortcutConfig>) {
    const shortcuts = await this.getShortcuts();
    const index = shortcuts.findIndex(s => s.id === id);
    if (index !== -1) {
      shortcuts[index] = { ...shortcuts[index], ...update };
      await this.saveSetting('app_shortcuts', shortcuts);
    }
  }

  async resetShortcuts() {
    await this.saveSetting('app_shortcuts', DEFAULT_SHORTCUTS);
  }

  // [ĐÃ SỬA LỖI] Lấy stats trực tiếp từ DB renderer thay vì gọi Main Process bị lỗi
  async getSystemStats(): Promise<any> {
    const pCount = await dbInstance.personnel.count();
    const uCount = await dbInstance.units.count();
    return { personnelCount: pCount, unitCount: uCount, status: 'Hệ thống trực tuyến' };
  }

  async clearDatabase() {
    await dbInstance.personnel.clear();
    await dbInstance.units.clear();
    await dbInstance.logs.clear();
    await this.initDefaults();
  }

  async log(level: LogLevel, message: string) {
    const entry: LogEntry = { id: Date.now().toString(), timestamp: Date.now(), level, message };
    await dbInstance.logs.add(entry);
  }

  async getLogs(): Promise<LogEntry[]> {
    return dbInstance.logs.reverse().limit(50).toArray();
  }

  async clearLogs() {
    await dbInstance.logs.clear();
  }

  async createBackup(): Promise<string> {
    try {
      const personnel = await dbInstance.personnel.toArray();
      const units = await dbInstance.units.toArray();
      const settings = await dbInstance.settings.toArray();
      
      const backupData = {
        version: "2.6",
        timestamp: Date.now(),
        data: {
          personnel,
          units,
          settings
        }
      };
      
      return JSON.stringify(backupData, null, 2);
    } catch (error) {
      console.error("Lỗi khi tạo backup:", error);
      return "";
    }
  }

  async restoreBackup(jsonData: any): Promise<boolean> {
    try {
        if (!jsonData.data || !Array.isArray(jsonData.data.personnel)) {
            return false;
        }

        await dbInstance.transaction('rw', dbInstance.personnel, dbInstance.units, dbInstance.settings, async () => {
            await dbInstance.personnel.clear();
            await dbInstance.units.clear();
            await dbInstance.settings.clear();

            if (jsonData.data.personnel.length) await dbInstance.personnel.bulkAdd(jsonData.data.personnel);
            if (jsonData.data.units.length) await dbInstance.units.bulkAdd(jsonData.data.units);
            if (jsonData.data.settings.length) await dbInstance.settings.bulkAdd(jsonData.data.settings);
        });
        
        this.log('SYSTEM', `Khôi phục dữ liệu từ bản sao lưu ngày ${new Date(jsonData.timestamp).toLocaleDateString()}`);
        return true;
    } catch (e) {
        console.error("Restore failed:", e);
        this.log('ERROR', `Lỗi khôi phục dữ liệu: ${e}`);
        return false;
    }
  }

  getCustomFields(unitId: string): CustomField[] { return []; }
}

export const db = new Store();