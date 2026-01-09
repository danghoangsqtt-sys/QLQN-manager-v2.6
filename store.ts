
import { Dexie, type Table } from 'dexie';
import { MilitaryPersonnel, Unit, LogEntry, LogLevel, ShortcutConfig, CustomField } from './types.ts';

export interface FilterCriteria {
  keyword: string;
  unitId: string;
  rank: string;
  position: string;
  political: 'all' | 'dang_vien' | 'quan_chung';
  security: 'all' | 'vay_no' | 'vi_pham';
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

  async changePassword(newPassword: string): Promise<boolean> {
    return window.electronAPI ? window.electronAPI.changePassword(newPassword) : true;
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

    // Logic Lọc Chính Trị
    if (filters.political === 'dang_vien') {
      collection = collection.filter(p => !!p.vao_dang_ngay);
    } else if (filters.political === 'quan_chung') {
      collection = collection.filter(p => !p.vao_dang_ngay);
    }

    // Logic Lọc An Ninh/Tài Chính
    if (filters.security === 'vay_no') {
      collection = collection.filter(p => !!p.tai_chinh_suc_khoe?.vay_no?.co_khong);
    } else if (filters.security === 'vi_pham') {
      collection = collection.filter(p => 
        !!p.lich_su_vi_pham?.vi_pham_dia_phuong?.co_khong || 
        !!p.lich_su_vi_pham?.danh_bac?.co_khong || 
        !!p.lich_su_vi_pham?.ma_tuy?.co_khong
      );
    }

    // Logic Lọc Trình độ
    if (filters.education === 'dai_hoc_cao_dang') {
      collection = collection.filter(p => {
        const edu = (p.trinh_do_van_hoa || '').toLowerCase();
        return edu.includes('đại học') || edu.includes('cao đẳng') || edu.includes('thạc sĩ');
      });
    }

    // Logic Lọc Gia đình
    if (filters.marital === 'da_vo') {
      collection = collection.filter(p => !!p.quan_he_gia_dinh?.vo);
    } else if (filters.marital === 'chua_vo') {
      collection = collection.filter(p => !p.quan_he_gia_dinh?.vo);
    }

    if (filters.hasChildren === 'co_con') {
      collection = collection.filter(p => (p.quan_he_gia_dinh?.con?.length || 0) > 0);
    }

    return collection.reverse().sortBy('createdAt');
  }

  async getDashboardStats() {
    const all = await dbInstance.personnel.toArray();
    const now = new Date();
    const threeMonthsAgo = new Date();
    threeMonthsAgo.setMonth(now.getMonth() - 3);

    const stats = {
      total: all.length,
      party: all.filter(p => !!p.vao_dang_ngay).length,
      mass: all.filter(p => !p.vao_dang_ngay).length,
      debt: all.filter(p => !!p.tai_chinh_suc_khoe?.vay_no?.co_khong).length,
      newRecruits: all.filter(p => {
        if (!p.nhap_ngu_ngay) return false;
        const enlistDate = new Date(p.nhap_ngu_ngay);
        return enlistDate >= threeMonthsAgo;
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
    await dbInstance.units.delete(id);
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
      status: 'Hệ thống trực tuyến',
      storageUsage: `${(pCount * 0.5 / 1024).toFixed(2)} MB`
    };
  }

  async clearDatabase() {
    await dbInstance.personnel.clear();
    await dbInstance.units.clear();
    await dbInstance.logs.clear();
    await this.initDefaults();
  }

  async clearLogs(): Promise<void> {
    await dbInstance.logs.clear();
  }

  async log(level: LogLevel, message: string) {
    const entry: LogEntry = {
      id: Date.now().toString(),
      timestamp: Date.now(),
      level,
      message
    };
    await dbInstance.logs.add(entry);
  }

  async getLogs(): Promise<LogEntry[]> {
    return dbInstance.logs.reverse().limit(50).toArray();
  }

  getCustomFields(unitId: string): CustomField[] {
    return []; 
  }
}

export const db = new Store();
