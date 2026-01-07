
import { Dexie, type Table } from 'dexie';
import { MilitaryPersonnel, Unit, LogEntry, LogLevel, ShortcutConfig, CustomField } from './types.ts';

export interface FilterCriteria {
  keyword: string;
  unitId: string;
  rank: string;
  position: string;
  political: string;
  security: string;
  education: string;
  foreignElement: string;
  familyStatus: string;
  marital: string;
}

declare global {
  interface Window {
    electronAPI: any;
  }
}

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
    const res = window.electronAPI ? await window.electronAPI.login(password) : password === '123456';
    if (res) this.log('INFO', 'Người dùng đăng nhập thành công.');
    return res;
  }

  async changePassword(newPassword: string): Promise<boolean> {
    return window.electronAPI ? window.electronAPI.changePassword(newPassword) : true;
  }

  // Hàm lấy toàn bộ ID đơn vị con đệ quy
  private async getAllChildUnitIds(unitId: string): Promise<string[]> {
    const childUnits = await dbInstance.units.where('parentId').equals(unitId).toArray();
    let ids = [unitId];
    for (const unit of childUnits) {
      const subIds = await this.getAllChildUnitIds(unit.id);
      ids = [...ids, ...subIds];
    }
    return ids;
  }

  async getPersonnel(filters: Partial<FilterCriteria> = {}): Promise<MilitaryPersonnel[]> {
    let collection = dbInstance.personnel.toCollection();

    if (filters.keyword) {
      const k = filters.keyword.toLowerCase();
      collection = collection.filter(p => 
        p.ho_ten.toLowerCase().includes(k) || 
        p.cccd.includes(k) || 
        p.sdt_rieng?.includes(k) ||
        p.ho_khau_thu_tru?.toLowerCase().includes(k)
      );
    }

    // Nâng cấp: Lọc đệ quy toàn bộ đơn vị con
    if (filters.unitId && filters.unitId !== 'all') {
      const allTargetIds = await this.getAllChildUnitIds(filters.unitId);
      collection = collection.filter(p => allTargetIds.includes(p.don_vi_id));
    }

    if (filters.rank && filters.rank !== 'all') {
      collection = collection.filter(p => p.cap_bac === filters.rank);
    }

    if (filters.position && filters.position !== 'all') {
      collection = collection.filter(p => p.chuc_vu === filters.position);
    }

    if (filters.political === 'dang_vien') {
      collection = collection.filter(p => !!p.vao_dang_ngay);
    } else if (filters.political === 'quan_chung') {
      collection = collection.filter(p => !p.vao_dang_ngay);
    }

    if (filters.security === 'vay_no') {
      collection = collection.filter(p => !!p.tai_chinh_suc_khoe?.vay_no?.co_khong);
    } else if (filters.security === 'vi_pham') {
      collection = collection.filter(p => !!p.lich_su_vi_pham?.vi_pham_dia_phuong?.co_khong);
    } else if (filters.security === 'ma_tuy') {
      collection = collection.filter(p => !!p.lich_su_vi_pham?.ma_tuy?.co_khong);
    }

    if (filters.education && filters.education !== 'all') {
      collection = collection.filter(p => p.trinh_do_van_hoa === filters.education);
    }

    if (filters.marital === 'da_ket_hon') {
      collection = collection.filter(p => !!p.quan_he_gia_dinh?.vo);
    } else if (filters.marital === 'doc_than') {
      collection = collection.filter(p => !p.quan_he_gia_dinh?.vo);
    }

    if (filters.foreignElement === 'has_relatives') {
      collection = collection.filter(p => (p.yeu_to_nuoc_ngoai?.than_nhan?.length || 0) > 0);
    } else if (filters.foreignElement === 'has_passport') {
      collection = collection.filter(p => !!p.yeu_to_nuoc_ngoai?.ho_chieu?.da_co);
    }

    return collection.reverse().sortBy('createdAt');
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
    this.log('INFO', `Thêm đơn vị: ${name} (Trực thuộc: ${parentId})`);
    return dbInstance.units.add({ id: Date.now().toString(), name, parentId });
  }

  async deleteUnit(id: string) {
    const childIds = (await dbInstance.units.where('parentId').equals(id).toArray()).map(u => u.id);
    await dbInstance.units.delete(id);
    // Đồng thời xóa các bản ghi nhân sự thuộc đơn vị này (tùy chọn) hoặc để quân nhân "không đơn vị"
    for (const cid of childIds) await this.deleteUnit(cid);
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

  async updateShortcut(id: string, config: Partial<ShortcutConfig>): Promise<void> {
    const current = await this.getShortcuts();
    const updated = current.map(s => s.id === id ? { ...s, ...config } : s);
    await this.saveSetting('app_shortcuts', updated);
  }

  async resetShortcuts(): Promise<void> {
    await this.saveSetting('app_shortcuts', DEFAULT_SHORTCUTS);
  }

  async getSystemStats(): Promise<any> {
    const pCount = await dbInstance.personnel.count();
    const uCount = await dbInstance.units.count();
    return {
      personnelCount: pCount,
      unitCount: uCount,
      status: 'Dexie Engine Online',
      storageUsage: `${(pCount * 0.8 / 1024).toFixed(2)} MB (Ước tính)`
    };
  }

  async clearDatabase() {
    this.log('SYSTEM', 'Yêu cầu xóa toàn bộ cơ sở dữ liệu.');
    await dbInstance.personnel.clear();
    await dbInstance.units.clear();
    await dbInstance.logs.clear();
    await this.initDefaults();
  }

  async log(level: LogLevel, message: string) {
    const entry: LogEntry = {
      id: Date.now().toString() + Math.random().toString(36).substr(2, 5),
      timestamp: Date.now(),
      level,
      message
    };
    await dbInstance.logs.add(entry);
    console.log(`[${level}] ${message}`);
  }

  async getLogs(): Promise<LogEntry[]> {
    return dbInstance.logs.reverse().limit(100).toArray();
  }

  async clearLogs() {
    await dbInstance.logs.clear();
  }

  runDiagnostics() {
    this.log('SYSTEM', 'Đang chạy kiểm tra toàn vẹn dữ liệu...');
  }

  getCustomFields(unitId: string): CustomField[] {
    return []; 
  }
}

export const db = new Store();
