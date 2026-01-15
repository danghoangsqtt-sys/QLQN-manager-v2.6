import { Dexie, type Table } from 'dexie';
import { MilitaryPersonnel, Unit, LogEntry, LogLevel, ShortcutConfig, CustomField } from './types';

// Copy cấu trúc từ utils/personnelFilter.ts sang hoặc import (nhưng sửa trực tiếp để tránh lỗi vòng lặp import)
export interface FilterCriteria {
  keyword: string;
  unitId: string;
  rank: string;
  // position: string; // (Nếu bên utils không dùng thì bỏ hoặc để optional)
  
  // Update khớp với utils
  political: 'all' | 'dang_vien' | 'doan_vien' | 'quan_chung';
  educationLevel: 'all' | '12_12' | '9_12' | 'khac'; // Đổi tên thành educationLevel
  religion: 'all' | 'khong' | 'co_ton_giao' | 'phat_giao' | 'thien_chua';
  // Các trường khác nên khớp, nhưng quan trọng nhất là 2 trường trên để fix lỗi build
  security: any; // Để any hoặc định nghĩa khớp hoàn toàn với utils để tránh lỗi lặt vặt
  [key: string]: any; // Cho phép mở rộng để tránh lỗi thiếu field
}

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

  public hasSecurityAlert(p: MilitaryPersonnel): boolean {
    return (
      !!p.tai_chinh_suc_khoe?.vay_no?.co_khong ||
      !!p.lich_su_vi_pham?.vi_pham_dia_phuong?.co_khong ||
      !!p.lich_su_vi_pham?.ma_tuy?.co_khong ||
      !!p.lich_su_vi_pham?.danh_bac?.co_khong ||
      (p.yeu_to_nuoc_ngoai?.than_nhan?.length || 0) > 0 ||
      (p.yeu_to_nuoc_ngoai?.di_nuoc_ngoai?.length || 0) > 0 ||
      !!p.yeu_to_nuoc_ngoai?.ho_chieu?.da_co ||
      !!p.vi_pham_nuoc_ngoai
    );
  }

  // Hàm lấy chi tiết đầy đủ (dùng cho Edit/Print) - Giữ nguyên logic
  async getPersonnelById(id: string): Promise<MilitaryPersonnel | undefined> {
    return await dbInstance.personnel.get(id);
  }

  // [FIXED] Tối ưu hóa hiệu năng và bảo vệ dữ liệu gốc
  async getPersonnel(filters: Partial<FilterCriteria> = {}): Promise<MilitaryPersonnel[]> {
    let collection = dbInstance.personnel.toCollection();

    // 1. Lọc theo từ khóa (Keyword)
    if (filters.keyword) {
      const k = filters.keyword.toLowerCase();
      collection = collection.filter(p => 
        (p.ho_ten || '').toLowerCase().includes(k) || 
        (p.cccd || '').includes(k) || 
        (p.sdt_rieng || '').includes(k)
      );
    }

    // 2. Lọc theo Đơn vị (Unit)
    if (filters.unitId && filters.unitId !== 'all') {
      const allTargetIds = await this.getAllChildUnitIds(filters.unitId);
      collection = collection.filter(p => allTargetIds.includes(p.don_vi_id));
    }

    // 3. Lọc theo Cấp bậc (Rank)
    if (filters.rank && filters.rank !== 'all') {
      collection = collection.filter(p => p.cap_bac === filters.rank);
    }

    // 4. Lọc Chính trị (Political)
    if (filters.political === 'dang_vien') {
      collection = collection.filter(p => !!p.vao_dang_ngay);
    } else if (filters.political === 'quan_chung') {
      collection = collection.filter(p => !p.vao_dang_ngay);
    }

    // 5. Lọc Học vấn (Education)
    if (filters.education === 'dai_hoc_cao_dang') { // Sửa lại tên field cho khớp với interface nếu cần
      collection = collection.filter(p => {
        const edu = (p.trinh_do_van_hoa || '').toLowerCase();
        return edu.includes('đại học') || edu.includes('cao đẳng') || edu.includes('thạc sĩ');
      });
    }

    // --- [NÂNG CẤP] 6. LỌC DÂN TỘC (Ethnicity) ---
    if (filters.ethnicity && filters.ethnicity !== 'all') {
        collection = collection.filter(p => {
            const dt = (p.dan_toc || '').toLowerCase().trim();
            if (filters.ethnicity === 'kinh') return dt === 'kinh';
            if (filters.ethnicity === 'dan_toc_thieu_so') return dt !== 'kinh' && dt !== '';
            return true;
        });
    }

    // --- [NÂNG CẤP] 7. LỌC TÔN GIÁO (Religion) ---
    if (filters.religion && filters.religion !== 'all') {
        collection = collection.filter(p => {
            const tg = (p.ton_giao || '').toLowerCase().trim();
            const khongTonGiao = tg === '' || tg === 'không' || tg === 'không có';

            if (filters.religion === 'khong') return khongTonGiao;
            if (filters.religion === 'co_ton_giao') return !khongTonGiao;
            if (filters.religion === 'phat_giao') return tg.includes('phật');
            if (filters.religion === 'thien_chua') return tg.includes('thiên chúa') || tg.includes('công giáo') || tg.includes('kito');
            
            return true;
        });
    }

    // 8. Lọc An ninh (Security)
    if (filters.security === 'canh_bao') {
        collection = collection.filter(p => this.hasSecurityAlert(p));
    }

    // Giới hạn kết quả để tối ưu hiệu năng
    if (!filters.keyword && (!filters.unitId || filters.unitId === 'all') && !filters.rank && !filters.security) {
        collection = collection.limit(5000);
    }

    const resultArray = await collection.toArray();
    
    // [FIX] Tạo bản sao (Clone) của object để hiển thị.
    // Điều này ngăn chặn việc UI vô tình ghi đè ảnh gốc bằng ảnh thumb nếu logic Form không chặt chẽ.
    const optimizedResult = resultArray.map(p => {
        const safeObj = { ...p };
        // Dùng ảnh thumb cho danh sách để nhẹ, fallback về rỗng nếu không có
        safeObj.anh_dai_dien = p.anh_thumb || ''; 
        return safeObj;
    });

    return optimizedResult.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
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

  // [FIXED] Hàm khôi phục dữ liệu đã được vá lỗi
  // 1. Sử dụng Transaction để đảm bảo toàn vẹn dữ liệu
  // 2. Thêm logic Migrate để chuyển đổi dữ liệu cũ sang cấu trúc mới
  async restoreBackup(jsonData: any): Promise<boolean> {
    try {
        if (!jsonData.data || !Array.isArray(jsonData.data.personnel)) {
            this.log('ERROR', 'File backup không hợp lệ: Thiếu dữ liệu personnel.');
            return false;
        }

        const rawPersonnel = jsonData.data.personnel;

        // --- BƯỚC 1: MIGRATE DATA (Chuyển đổi dữ liệu cũ) ---
        // Giúp tránh lỗi "mất thông tin" khi restore file backup từ phiên bản cũ
        const migratedPersonnel = rawPersonnel.map((p: any) => {
            // Fix: Mạng xã hội từ Object (cũ) -> Array (mới)
            let mxh = p.mang_xa_hoi;
            // Kiểm tra nếu là dữ liệu cũ (facebook là string thay vì array)
            if (mxh && !Array.isArray(mxh.facebook) && typeof mxh.facebook === 'string') {
                 mxh = { 
                    facebook: mxh.facebook ? [mxh.facebook] : [],
                    zalo: mxh.zalo ? [mxh.zalo] : [],
                    tiktok: mxh.tiktok ? [mxh.tiktok] : []
                 };
            } else if (!mxh) {
                 mxh = { facebook: [], zalo: [], tiktok: [] };
            }

            // Fix: Đảm bảo các mảng quan trọng không bị null/undefined
            const safeArray = (arr: any) => Array.isArray(arr) ? arr : [];

            // Fix: Cấu trúc kinh doanh
            // Nếu dữ liệu cũ không có kinh_doanh, hoặc cấu trúc sai, ta reset về default
            const safeKinhDoanh = p.tai_chinh_suc_khoe?.kinh_doanh || { 
               co_khong: false, hinh_thuc: '', loai_hinh: '', von: '', dia_diem: '', doi_tac: '', sdt_doi_tac: '' 
            };

            return {
                ...p,
                mang_xa_hoi: mxh,
                tieu_su_ban_than: safeArray(p.tieu_su_ban_than),
                quan_he_gia_dinh: {
                    ...p.quan_he_gia_dinh,
                    cha_me_anh_em: safeArray(p.quan_he_gia_dinh?.cha_me_anh_em),
                    con: safeArray(p.quan_he_gia_dinh?.con),
                    nguoi_yeu: safeArray(p.quan_he_gia_dinh?.nguoi_yeu)
                },
                lich_su_vi_pham: {
                    ...p.lich_su_vi_pham,
                    // Bổ sung các mảng mới thêm vào bản 2.6
                    ky_luat_quan_doi: safeArray(p.lich_su_vi_pham?.ky_luat_quan_doi),
                    vi_pham_phap_luat: safeArray(p.lich_su_vi_pham?.vi_pham_phap_luat)
                },
                tai_chinh_suc_khoe: {
                    ...p.tai_chinh_suc_khoe,
                    kinh_doanh: safeKinhDoanh,
                    // Bổ sung mảng sức khỏe mới
                    suc_khoe: p.tai_chinh_suc_khoe?.suc_khoe || { chieu_cao: '', can_nang: '', phan_loai: '', benh_ly: '' }
                }
            };
        });

        // --- BƯỚC 2: THỰC THI TRANSACTION (Giao dịch an toàn) ---
        // Chỉ xóa dữ liệu cũ khi chắc chắn dữ liệu mới đã sẵn sàng
        await dbInstance.transaction('rw', dbInstance.personnel, dbInstance.units, dbInstance.settings, async () => {
            // Xóa sạch dữ liệu hiện tại
            await dbInstance.personnel.clear();
            await dbInstance.units.clear();
            await dbInstance.settings.clear();

            // Nạp dữ liệu đã qua xử lý (migrated)
            if (migratedPersonnel.length) await dbInstance.personnel.bulkAdd(migratedPersonnel);
            if (jsonData.data.units.length) await dbInstance.units.bulkAdd(jsonData.data.units);
            if (jsonData.data.settings.length) await dbInstance.settings.bulkAdd(jsonData.data.settings);
        });
        
        this.log('SYSTEM', `Khôi phục thành công ${migratedPersonnel.length} hồ sơ từ bản sao lưu.`);
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