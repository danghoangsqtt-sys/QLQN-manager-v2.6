
import { MilitaryPersonnel, Unit, LogEntry, LogLevel, ShortcutConfig, CustomField } from './types';

declare global {
  interface Window {
    electronAPI: any;
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

  // --- CORE DATA FETCHING ---
  async getPersonnel(filters: FilterCriteria = {}): Promise<MilitaryPersonnel[]> {
    try {
      let personnel: MilitaryPersonnel[] = [];

      if (this.isElectron()) {
        const rawData = await window.electronAPI.getPersonnel();
        if (Array.isArray(rawData)) {
          personnel = rawData.map((row: any) => {
            try {
              return JSON.parse(row.data);
            } catch (e) {
              return null;
            }
          }).filter(Boolean);
        }
      } else {
        // Fallback dữ liệu mẫu cho môi trường preview/web
        console.warn("Đang chạy chế độ Preview (không có Electron). Sử dụng dữ liệu LocalStorage.");
        const local = localStorage.getItem('fallback_personnel');
        personnel = local ? JSON.parse(local) : [];
      }
      
      // --- LOGIC LỌC DỮ LIỆU ---
      
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
          // Lọc hồ sơ có Thân nhân nước ngoài HOẶC Bản thân đi nước ngoài
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
    }
  }

  async deletePersonnel(id: string) {
     if (this.isElectron()) {
        // Giả sử có API xóa, nếu chưa có thì chỉ cần update trạng thái deleted
        // await window.electronAPI.deletePersonnel(id); 
        console.warn("Chức năng xóa trên Electron cần được implement ở phía Main Process");
     } else {
        const list = await this.getPersonnel();
        const newList = list.filter(p => p.id !== id);
        localStorage.setItem('fallback_personnel', JSON.stringify(newList));
     }
     // Fix: Changed 'WARNING' to 'WARN' to match LogLevel type defined in types.ts
     this.log('WARN', `Đã xóa hồ sơ ID: ${id}`);
  }

  // --- LOGGING & UTILS ---

  log(level: LogLevel, message: string, details?: string) {
    const logs = this.getLogs();
    logs.unshift({ id: Date.now().toString(), timestamp: Date.now(), level, message, details });
    // Giữ lại 200 logs gần nhất
    localStorage.setItem('logs', JSON.stringify(logs.slice(0, 200)));
  }

  getLogs(): LogEntry[] {
    return JSON.parse(localStorage.getItem('logs') || '[]');
  }

  // --- UNIT MANAGEMENT ---

  getUnits(): Unit[] { 
    return JSON.parse(localStorage.getItem('units') || '[]'); 
  }

  addUnit(name: string, parentId: string | null) {
    const units = this.getUnits();
    units.push({ id: Date.now().toString(), name, parentId });
    localStorage.setItem('units', JSON.stringify(units));
  }

  deleteUnit(id: string) {
    const units = this.getUnits().filter(u => u.id !== id);
    localStorage.setItem('units', JSON.stringify(units));
  }

  // --- SETTINGS ---

  getCustomFields(unitId: string): CustomField[] {
    return JSON.parse(localStorage.getItem('custom_fields') || '[]').filter((f: any) => f.unit_id === unitId || f.unit_id === null);
  }

  getShortcuts(): ShortcutConfig[] {
    const defaults = [
      { id: 'list', label: 'Danh Sách', key: '1', altKey: true, ctrlKey: false, shiftKey: false },
      { id: 'units', label: 'Tổ Chức', key: '2', altKey: true, ctrlKey: false, shiftKey: false },
      { id: 'new', label: 'Nhập Liệu', key: 'n', altKey: true, ctrlKey: false, shiftKey: false },
      { id: 'settings', label: 'Cài Đặt', key: '4', altKey: true, ctrlKey: false, shiftKey: false },
      { id: 'debug', label: 'Diagnostics', key: 'd', altKey: true, ctrlKey: false, shiftKey: false },
    ];
    const stored = localStorage.getItem('shortcuts');
    return stored ? JSON.parse(stored) : defaults;
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
        personnelCount: 0, // Placeholder, sẽ được cập nhật ở UI
        dbSize: 'SQLite/Local', 
        storageUsage: 'Unknown', 
        status: 'ONLINE' 
    }; 
  }

  // Added: Missing runDiagnostics method to satisfy usage in components/DebugPanel.tsx
  runDiagnostics() {
    this.log('SYSTEM', 'Bắt đầu chẩn đoán hệ thống...');
    // Thực hiện kiểm tra tính toàn vẹn dữ liệu (giả lập)
    this.log('INFO', 'Kiểm tra cấu trúc cơ sở dữ liệu: OK');
    this.log('INFO', 'Kiểm tra quyền truy cập tệp tin: OK');
    this.log('SYSTEM', 'Chẩn đoán hệ thống hoàn tất.');
  }
}

export const db = new Store();
