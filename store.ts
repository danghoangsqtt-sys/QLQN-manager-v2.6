
import { Dexie, type Table } from 'dexie';
import { MilitaryPersonnel, Unit, LogEntry, LogLevel, ShortcutConfig, CustomField } from './types';

export interface FilterCriteria {
  keyword: string;
  unitId: string;
  rank: string;
  position: string;
  political: 'all' | 'dang_vien' | 'quan_chung';
  security: 'all' | 'vay_no' | 'vi_pham' | 'nuoc_ngoai' | 'canh_bao';
  education: 'all' | 'dai_hoc_cao_dang' | 'duoi_dai_hoc';
  marital: 'all' | 'da_vo' | 'chua_vo';
  hasChildren: 'all' | 'co_con' | 'chua_con';
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

  async changePassword(password: string): Promise<boolean> {
    if (window.electronAPI && window.electronAPI.changePassword) {
      return await window.electronAPI.changePassword(password);
    }
    return true;
  }

  private async getAllChildUnitIds(unitId: string): Promise<string[]> {
    const childUnits = await dbInstance.units.where('parentId').equals(unitId).toArray();
    let ids = [unitId];
    for (const unit of childUnits) {
      const subIds = await this.getAllChildUnitIds(unit.id);
      ids = [...ids, ...subIds];
    }
    return ids;
  }

  // LOGIC CỐT LÕI: Kiểm tra cảnh báo an ninh
  public hasSecurityAlert(p: MilitaryPersonnel): boolean {
    return (
      // 1. Vay nợ
      !!p.tai_chinh_suc_khoe?.vay_no?.co_khong ||
      // 2. Vi phạm kỷ luật/pháp luật địa phương
      !!p.lich_su_vi_pham?.vi_pham_dia_phuong?.co_khong ||
      // 3. Ma túy
      !!p.lich_su_vi_pham?.ma_tuy?.co_khong ||
      // 4. Cờ bạc
      !!p.lich_su_vi_pham?.danh_bac?.co_khong ||
      // 5. Yếu tố nước ngoài
      (p.yeu_to_nuoc_ngoai?.than_nhan?.length || 0) > 0 ||
      (p.yeu_to_nuoc_ngoai?.di_nuoc_ngoai?.length || 0) > 0 ||
      !!p.yeu_to_nuoc_ngoai?.ho_chieu?.da_co ||
      !!p.vi_pham_nuoc_ngoai
    );
  }

  async getPersonnel(filters: Partial<FilterCriteria> = {}): Promise<MilitaryPersonnel[]> {
    let collection = dbInstance.personnel.toCollection();

    if (filters.keyword) {
      const k = filters.keyword.toLowerCase();
      collection = collection.filter(p => 
        p.ho_ten.toLowerCase().includes(k) || 
        p.cccd.includes(k) || 
        p.sdt_rieng?.includes(k)
      );
    }

    if (filters.unitId && filters.unitId !== 'all') {
      const allTargetIds = await this.getAllChildUnitIds(filters.unitId);
      collection = collection.filter(p => allTargetIds.includes(p.don_vi_id));
    }

    if (filters.rank && filters.rank !== 'all') {
      collection = collection.filter(p => p.cap_bac === filters.rank);
    }

    if (filters.political === 'dang_vien') {
      collection = collection.filter(p => !!p.vao_dang_ngay);
    } else if (filters.political === 'quan_chung') {
      collection = collection.filter(p => !p.vao_dang_ngay);
    }

    if (filters.security === 'canh_bao') {
        collection = collection.filter(p => this.hasSecurityAlert(p));
    }

    if (filters.education === 'dai_hoc_cao_dang') {
      collection = collection.filter(p => {
        const edu = (p.trinh_do_van_hoa || '').toLowerCase();
        return edu.includes('đại học') || edu.includes('cao đẳng') || edu.includes('thạc sĩ');
      });
    }

    return collection.reverse().sortBy('createdAt');
  }

  async getDashboardStats() {
    const all = await dbInstance.personnel.toArray();
    const stats = {
      total: all.length,
      party: all.filter(p => !!p.vao_dang_ngay).length,
      securityAlert: all.filter(p => this.hasSecurityAlert(p)).length,
      educationHigh: all.filter(p => {
        const edu = (p.trinh_do_van_hoa || '').toLowerCase();
        return edu.includes('đại học') || edu.includes('cao đẳng') || edu.includes('thạc sĩ');
      }).length,
      ranks: {} as Record<string, number>
    };

    all.forEach(p => {
      stats.ranks[p.cap_bac] = (stats.ranks[p.cap_bac] || 0) + 1;
    });

    return stats;
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

  async deleteUnit(id: string) {
    const allChildIds = await this.getAllChildUnitIds(id);
    await dbInstance.units.bulkDelete(allChildIds);
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

  // FIX: Added updateShortcut method
  async updateShortcut(id: string, update: Partial<ShortcutConfig>) {
    const shortcuts = await this.getShortcuts();
    const index = shortcuts.findIndex(s => s.id === id);
    if (index !== -1) {
      shortcuts[index] = { ...shortcuts[index], ...update };
      await this.saveSetting('app_shortcuts', shortcuts);
    }
  }

  // FIX: Added resetShortcuts method
  async resetShortcuts() {
    await this.saveSetting('app_shortcuts', DEFAULT_SHORTCUTS);
  }

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

  // FIX: Added clearLogs method
  async clearLogs() {
    await dbInstance.logs.clear();
  }

  getCustomFields(unitId: string): CustomField[] { return []; }
}

export const db = new Store();
