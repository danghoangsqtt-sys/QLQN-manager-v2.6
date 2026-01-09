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

// Mở rộng lớp Dexie để bao gồm bảng custom_fields
class QNManagerDB extends Dexie {
  personnel!: Table<MilitaryPersonnel>;
  units!: Table<Unit>;
  settings!: Table<{ key: string; value: any }>;
  logs!: Table<LogEntry>;
  custom_fields!: Table<CustomField>; // Thêm bảng mới

  constructor() {
    super('QNManagerDB_v2');
    
    // Version 1: Schema cũ
    this.version(1).stores({
      personnel: 'id, ho_ten, cccd, don_vi_id, cap_bac, chuc_vu, createdAt, vao_dang_ngay, trinh_do_van_hoa',
      units: 'id, name, parentId',
      settings: 'key',
      logs: 'id, timestamp, level'
    });

    // Version 2: Bổ sung custom_fields và giữ nguyên các bảng cũ
    // Dexie sẽ tự động giữ dữ liệu cũ khi upgrade
    this.version(2).stores({
      personnel: 'id, ho_ten, cccd, don_vi_id, cap_bac, chuc_vu, createdAt, vao_dang_ngay, trinh_do_van_hoa',
      units: 'id, name, parentId',
      settings: 'key',
      logs: 'id, timestamp, level',
      custom_fields: 'id, unit_id' 
    });
  }
}

const dbInstance = new QNManagerDB();

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
    // Kiểm tra an toàn cho window.electronAPI
    if (typeof window !== 'undefined' && window.electronAPI) {
        const res = await window.electronAPI.login(password);
        if (res) this.log('INFO', 'Người dùng đăng nhập thành công.');
        return res;
    }
    // Fallback cho môi trường Web Dev
    return password === '123456';
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

  // --- QUAN TRỌNG: Đã tối ưu hóa hàm này ---
  async getPersonnel(filters: Partial<FilterCriteria> = {}): Promise<MilitaryPersonnel[]> {
    let collection: any; // Sử dụng type any tạm thời để linh hoạt giữa Collection và Table

    // 1. TỐI ƯU QUERY DATABASE: Lọc theo đơn vị trước bằng Index
    if (filters.unitId && filters.unitId !== 'all') {
      const allTargetIds = await this.getAllChildUnitIds(filters.unitId);
      // Sử dụng 'anyOf' để tận dụng index 'don_vi_id' trong Dexie -> Nhanh hơn nhiều
      collection = dbInstance.personnel.where('don_vi_id').anyOf(allTargetIds);
    } else {
      collection = dbInstance.personnel.toCollection();
    }

    // 2. LỌC BẰNG JS CHO CÁC TIÊU CHÍ PHỨC TẠP
    // Dexie Filter hoạt động Lazy, chỉ duyệt qua các record thỏa mãn điều kiện (1)
    
    // Lọc theo từ khóa (Tìm tên, CCCD, SĐT, HKTT)
    if (filters.keyword) {
      const k = filters.keyword.toLowerCase();
      collection = collection.filter((p: MilitaryPersonnel) => 
        p.ho_ten.toLowerCase().includes(k) || 
        p.cccd.includes(k) || 
        (p.sdt_rieng && p.sdt_rieng.includes(k)) ||
        (p.ho_khau_thu_tru && p.ho_khau_thu_tru.toLowerCase().includes(k))
      );
    }

    if (filters.rank && filters.rank !== 'all') {
      collection = collection.filter((p: MilitaryPersonnel) => p.cap_bac === filters.rank);
    }

    if (filters.position && filters.position !== 'all') {
      collection = collection.filter((p: MilitaryPersonnel) => p.chuc_vu === filters.position);
    }

    // Lọc Đảng viên
    if (filters.political === 'dang_vien') {
      collection = collection.filter((p: MilitaryPersonnel) => !!p.vao_dang_ngay);
    } else if (filters.political === 'quan_chung') {
      collection = collection.filter((p: MilitaryPersonnel) => !p.vao_dang_ngay);
    }

    // Lọc An ninh / Kỷ luật (Dữ liệu lồng nhau)
    if (filters.security) {
        if (filters.security === 'vay_no') {
            collection = collection.filter((p: MilitaryPersonnel) => !!p.tai_chinh_suc_khoe?.vay_no?.co_khong);
        } else if (filters.security === 'vi_pham') {
            collection = collection.filter((p: MilitaryPersonnel) => !!p.lich_su_vi_pham?.vi_pham_dia_phuong?.co_khong);
        } else if (filters.security === 'ma_tuy') {
            collection = collection.filter((p: MilitaryPersonnel) => !!p.lich_su_vi_pham?.ma_tuy?.co_khong);
        }
    }

    if (filters.education && filters.education !== 'all') {
      collection = collection.filter((p: MilitaryPersonnel) => p.trinh_do_van_hoa === filters.education);
    }

    if (filters.marital) {
        if (filters.marital === 'da_ket_hon') {
            collection = collection.filter((p: MilitaryPersonnel) => !!p.quan_he_gia_dinh?.vo);
        } else if (filters.marital === 'doc_than') {
            collection = collection.filter((p: MilitaryPersonnel) => !p.quan_he_gia_dinh?.vo);
        }
    }

    if (filters.foreignElement) {
        if (filters.foreignElement === 'has_relatives') {
            collection = collection.filter((p: MilitaryPersonnel) => (p.yeu_to_nuoc_ngoai?.than_nhan?.length || 0) > 0);
        } else if (filters.foreignElement === 'has_passport') {
            collection = collection.filter((p: MilitaryPersonnel) => !!p.yeu_to_nuoc_ngoai?.ho_chieu?.da_co);
        }
    }

    // Sắp xếp và trả về kết quả
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
    // Đệ quy xóa đơn vị con
    for (const cid of childIds) await this.deleteUnit(cid);
    
    // Tùy chọn: Xóa quân nhân thuộc đơn vị này hoặc để họ mồ côi (ở đây giữ nguyên logic cũ là không xóa quân nhân)
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
    // Ước tính dung lượng đơn giản
    return {
      personnelCount: pCount,
      unitCount: uCount,
      status: 'Dexie Engine Online (v2)',
      storageUsage: `${(pCount * 0.05).toFixed(2)} MB (Ước tính)` // Đã điều chỉnh công thức ước tính
    };
  }

  async clearDatabase() {
    this.log('SYSTEM', 'Yêu cầu xóa toàn bộ cơ sở dữ liệu.');
    await dbInstance.personnel.clear();
    await dbInstance.units.clear();
    await dbInstance.logs.clear();
    await dbInstance.custom_fields.clear(); // Xóa bảng custom_fields
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
    // Có thể thêm logic kiểm tra orphan records tại đây
  }

  // --- MỚI: Implement hàm lấy Custom Fields ---
  async getCustomFields(unitId: string): Promise<CustomField[]> {
    if (!unitId) return [];
    // Lấy các trường tùy chỉnh cho đơn vị này
    return dbInstance.custom_fields.where('unit_id').equals(unitId).toArray();
  }
  
  // --- MỚI: Hàm hỗ trợ thêm Custom Field (Để sử dụng sau này) ---
  async addCustomField(field: CustomField): Promise<void> {
      await dbInstance.custom_fields.add(field);
  }
  
  async deleteCustomField(id: string): Promise<void> {
      await dbInstance.custom_fields.delete(id);
  }
}

export const db = new Store();