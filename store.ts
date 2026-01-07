
import { MilitaryPersonnel, Unit, LogEntry, LogLevel, ShortcutConfig, CustomField } from './types.ts';

declare global {
  interface Window {
    electronAPI: {
      login: (password: string) => Promise<boolean>;
      changePassword: (newPassword: string) => Promise<boolean>;
      getPersonnel: (filters?: any) => Promise<MilitaryPersonnel[]>;
      savePersonnel: (payload: { id: string; data: Partial<MilitaryPersonnel> }) => Promise<boolean>;
      deletePersonnel: (id: string) => Promise<boolean>;
      getUnits: () => Promise<Unit[]>;
      saveUnit: (unit: Unit) => Promise<boolean>;
      deleteUnit: (id: string) => Promise<boolean>;
      getSystemStats: () => Promise<any>;
      resetDatabase: () => Promise<{ success: boolean }>;
      saveSetting: (payload: { key: string; value: any }) => Promise<boolean>;
      getSetting: (key: string) => Promise<any>;
    };
  }
}

export interface FilterCriteria {
  unitId?: string;
  keyword?: string;
  rank?: string;
  position?: string;
  education?: string;
  political?: 'all' | 'dang_vien' | 'quan_chung';
  security?: 'all' | 'vay_no' | 'vi_pham' | 'ma_tuy';
  marital?: 'all' | 'da_ket_hon' | 'doc_than';
  foreignElement?: 'all' | 'has_relatives' | 'has_passport';
  familyStatus?: 'all' | 'poor' | 'violation' | 'special_circumstances';
}

const DEFAULT_SHORTCUTS: ShortcutConfig[] = [
  { id: 'add_person', label: 'Thêm chiến sĩ mới', key: 'n', altKey: false, ctrlKey: true, shiftKey: false },
  { id: 'search', label: 'Tiêu điểm tìm kiếm', key: 'f', altKey: false, ctrlKey: true, shiftKey: false },
  { id: 'refresh', label: 'Làm mới dữ liệu', key: 'r', altKey: false, ctrlKey: true, shiftKey: false },
  { id: 'guide', label: 'Mở hướng dẫn sử dụng', key: 'h', altKey: false, ctrlKey: true, shiftKey: false }
];

class Store {
  private isElectron() {
    return typeof window !== 'undefined' && window.electronAPI !== undefined;
  }

  async login(password: string): Promise<boolean> {
    if (this.isElectron()) return await window.electronAPI.login(password);
    return password === '123456';
  }

  async changePassword(newPassword: string): Promise<boolean> {
    if (this.isElectron()) return await window.electronAPI.changePassword(newPassword);
    localStorage.setItem('admin_password', newPassword);
    return true;
  }

  async getSetting(key: string): Promise<any> {
    if (this.isElectron()) {
      try {
        return await window.electronAPI.getSetting(key);
      } catch (e) {
        console.warn("Electron getSetting failed", e);
      }
    }
    const saved = localStorage.getItem(key);
    return saved ? JSON.parse(saved) : null;
  }

  async saveSetting(key: string, value: any): Promise<void> {
    if (this.isElectron()) {
      try {
        await window.electronAPI.saveSetting({ key, value });
        return;
      } catch (e) {
        console.warn("Electron saveSetting failed", e);
      }
    }
    localStorage.setItem(key, JSON.stringify(value));
  }

  async getPersonnel(filters: FilterCriteria = {}): Promise<MilitaryPersonnel[]> {
    if (this.isElectron()) return await window.electronAPI.getPersonnel(filters);
    return [];
  }

  async addPersonnel(p: MilitaryPersonnel) {
    if (this.isElectron()) await window.electronAPI.savePersonnel({ id: p.id, data: p });
  }

  async updatePersonnel(id: string, p: Partial<MilitaryPersonnel>) {
    if (this.isElectron()) await window.electronAPI.savePersonnel({ id, data: p });
  }

  async deletePersonnel(id: string) {
    if (this.isElectron()) await window.electronAPI.deletePersonnel(id);
  }

  async getUnits(): Promise<Unit[]> {
    if (this.isElectron()) return await window.electronAPI.getUnits();
    return [];
  }

  async addUnit(name: string, parentId: string | null) {
    const newUnit: Unit = { id: Date.now().toString(), name, parentId };
    if (this.isElectron()) await window.electronAPI.saveUnit(newUnit);
  }

  async deleteUnit(id: string) {
    if (this.isElectron()) await window.electronAPI.deleteUnit(id);
  }

  async clearDatabase() {
    if (this.isElectron()) await window.electronAPI.resetDatabase();
  }

  getCustomFields(unitId: string): CustomField[] { return []; }

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

  getLogs(): LogEntry[] { return []; }

  async getSystemStats() {
    if (this.isElectron()) return await window.electronAPI.getSystemStats();
    return { personnelCount: 0, unitCount: 0, dbSize: '0 MB', status: 'WEB', storageUsage: '0%' };
  }

  log(level: LogLevel, message: string) {}
  runDiagnostics() {}
}

export const db = new Store();
