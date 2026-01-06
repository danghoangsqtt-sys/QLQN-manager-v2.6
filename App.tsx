import React, { useState, useEffect, createContext, useContext, ReactNode } from 'react';
import { Users, UserPlus, Save, Trash2, Search, Briefcase, MapPin, Phone, Mail, Edit, AlertCircle } from 'lucide-react';

// --- 1. DEFINITIONS & TYPES (Định nghĩa kiểu dữ liệu) ---
// Đây là cấu trúc dữ liệu chuẩn cho toàn bộ ứng dụng
export interface NhanVien {
  id: string;
  hoTen: string;
  ngaySinh: string;
  chucVu: string;
  phongBan: string;
  email: string;
  soDienThoai: string;
  trangThai: 'dang_lam_viec' | 'da_nghi_viec' | 'tam_nghi';
  diaChi: string;
  avatarUrl?: string; // Optional
}

// Kiểu dữ liệu cho Context
interface NhanVienContextType {
  danhSachNhanVien: NhanVien[];
  themNhanVien: (nv: NhanVien) => void;
  suaNhanVien: (nv: NhanVien) => void;
  xoaNhanVien: (id: string) => void;
  isLoading: boolean;
}

// --- 2. STORAGE SERVICE (Dịch vụ lưu trữ Offline) ---
// Tách biệt logic lưu trữ để dễ quản lý lỗi
const STORAGE_KEY = 'OFFLINE_HRM_DATA_V1';

const StorageService = {
  save: (data: NhanVien[]) => {
    try {
      const json = JSON.stringify(data);
      localStorage.setItem(STORAGE_KEY, json);
    } catch (error) {
      console.error("Lỗi khi lưu dữ liệu vào LocalStorage:", error);
      // Có thể thêm thông báo lỗi UI ở đây nếu cần
    }
  },
  load: (): NhanVien[] => {
    try {
      const json = localStorage.getItem(STORAGE_KEY);
      if (!json) return [];
      return JSON.parse(json);
    } catch (error) {
      console.error("Lỗi khi đọc dữ liệu từ LocalStorage:", error);
      return [];
    }
  }
};

// --- 3. CONTEXT & PROVIDER (Quản lý trạng thái toàn cục) ---
const NhanVienContext = createContext<NhanVienContextType | undefined>(undefined);

export const NhanVienProvider = ({ children }: { children: ReactNode }) => {
  const [danhSachNhanVien, setDanhSachNhanVien] = useState<NhanVien[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Load dữ liệu khi App khởi động (Chỉ chạy 1 lần)
  useEffect(() => {
    const data = StorageService.load();
    // Nếu chưa có dữ liệu, thêm dữ liệu mẫu để test
    if (data.length === 0) {
        const sampleData: NhanVien[] = [
            {
                id: 'NV001',
                hoTen: 'Nguyễn Văn A',
                chucVu: 'Trưởng phòng IT',
                phongBan: 'Công nghệ thông tin',
                email: 'vana@example.com',
                soDienThoai: '0901234567',
                ngaySinh: '1990-01-01',
                trangThai: 'dang_lam_viec',
                diaChi: 'Hà Nội'
            },
            {
                id: 'NV002',
                hoTen: 'Trần Thị B',
                chucVu: 'Nhân viên Kế toán',
                phongBan: 'Tài chính Kế toán',
                email: 'thib@example.com',
                soDienThoai: '0909876543',
                ngaySinh: '1995-05-15',
                trangThai: 'dang_lam_viec',
                diaChi: 'TP. Hồ Chí Minh'
            }
        ];
        setDanhSachNhanVien(sampleData);
        StorageService.save(sampleData);
    } else {
        setDanhSachNhanVien(data);
    }
    setIsLoading(false);
  }, []);

  // Tự động lưu mỗi khi danhSachNhanVien thay đổi
  useEffect(() => {
    if (!isLoading) {
      StorageService.save(danhSachNhanVien);
    }
  }, [danhSachNhanVien, isLoading]);

  const themNhanVien = (nv: NhanVien) => {
    setDanhSachNhanVien(prev => [nv, ...prev]);
  };

  const suaNhanVien = (nvCapNhat: NhanVien) => {
    setDanhSachNhanVien(prev => prev.map(nv => nv.id === nvCapNhat.id ? nvCapNhat : nv));
  };

  const xoaNhanVien = (id: string) => {
    if(window.confirm("Bạn có chắc chắn muốn xóa nhân viên này? Hành động này không thể hoàn tác.")){
        setDanhSachNhanVien(prev => prev.filter(nv => nv.id !== id));
    }
  };

  return (
    <NhanVienContext.Provider value={{ danhSachNhanVien, themNhanVien, suaNhanVien, xoaNhanVien, isLoading }}>
      {children}
    </NhanVienContext.Provider>
  );
};

// Custom Hook để sử dụng Context dễ dàng
export const useNhanVien = () => {
  const context = useContext(NhanVienContext);
  if (!context) {
    throw new Error('useNhanVien must be used within a NhanVienProvider');
  }
  return context;
};

// --- 4. COMPONENTS (Các thành phần UI) ---

// Component hiển thị thẻ nhân viên trong danh sách
const EmployeeCard = ({ nv, onEdit, onDelete }: { nv: NhanVien, onEdit: (nv: NhanVien) => void, onDelete: (id: string) => void }) => {
    const statusColors = {
        dang_lam_viec: 'bg-green-100 text-green-800',
        da_nghi_viec: 'bg-red-100 text-red-800',
        tam_nghi: 'bg-yellow-100 text-yellow-800'
    };

    const statusText = {
        dang_lam_viec: 'Đang làm việc',
        da_nghi_viec: 'Đã nghỉ việc',
        tam_nghi: 'Tạm nghỉ'
    };

    return (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 hover:shadow-md transition-shadow">
            <div className="flex justify-between items-start mb-3">
                <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-xl">
                        {nv.hoTen.charAt(0)}
                    </div>
                    <div>
                        <h3 className="font-semibold text-gray-900">{nv.hoTen}</h3>
                        <p className="text-sm text-gray-500">{nv.chucVu}</p>
                    </div>
                </div>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColors[nv.trangThai]}`}>
                    {statusText[nv.trangThai]}
                </span>
            </div>
            
            <div className="space-y-2 mb-4">
                <div className="flex items-center text-sm text-gray-600">
                    <Briefcase className="w-4 h-4 mr-2 text-gray-400" />
                    {nv.phongBan}
                </div>
                <div className="flex items-center text-sm text-gray-600">
                    <Mail className="w-4 h-4 mr-2 text-gray-400" />
                    {nv.email}
                </div>
                <div className="flex items-center text-sm text-gray-600">
                    <Phone className="w-4 h-4 mr-2 text-gray-400" />
                    {nv.soDienThoai}
                </div>
            </div>

            <div className="flex justify-end space-x-2 pt-3 border-t border-gray-100">
                 {/* Nút Sửa gọi lại hàm từ props */}
                <button 
                    onClick={() => onEdit(nv)}
                    className="p-2 text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
                    title="Chỉnh sửa"
                >
                    <Edit className="w-4 h-4" />
                </button>
                <button 
                    onClick={() => onDelete(nv.id)}
                    className="p-2 text-red-600 hover:bg-red-50 rounded-md transition-colors"
                    title="Xóa"
                >
                    <Trash2 className="w-4 h-4" />
                </button>
            </div>
        </div>
    );
};

// Component Danh Sách Nhân Viên
const EmployeeList = ({ onEdit }: { onEdit: (nv: NhanVien) => void }) => {
    const { danhSachNhanVien, xoaNhanVien, isLoading } = useNhanVien();
    const [searchTerm, setSearchTerm] = useState('');

    const filteredList = danhSachNhanVien.filter(nv => 
        nv.hoTen.toLowerCase().includes(searchTerm.toLowerCase()) ||
        nv.phongBan.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (isLoading) return <div className="p-8 text-center text-gray-500">Đang tải dữ liệu...</div>;

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row gap-4 justify-between items-center bg-white p-4 rounded-lg shadow-sm border border-gray-200">
                <div className="relative w-full md:w-96">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <input 
                        type="text" 
                        placeholder="Tìm kiếm theo tên hoặc phòng ban..." 
                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <div className="text-sm text-gray-500 font-medium">
                    Tổng số: <span className="text-blue-600 font-bold">{filteredList.length}</span> nhân viên
                </div>
            </div>

            {filteredList.length === 0 ? (
                <div className="text-center py-12 bg-gray-50 rounded-lg border border-dashed border-gray-300">
                    <Users className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-500">Không tìm thấy nhân viên nào.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredList.map(nv => (
                        <EmployeeCard key={nv.id} nv={nv} onEdit={onEdit} onDelete={xoaNhanVien} />
                    ))}
                </div>
            )}
        </div>
    );
};

// PLACEHOLDER CHO PERSONNEL FORM (Sẽ được thay thế sau)
// Đây là component tạm để logic App không bị gãy
const PersonnelFormPlaceholder = ({ onBack, initialData }: { onBack: () => void, initialData?: NhanVien }) => {
    const { themNhanVien, suaNhanVien } = useNhanVien();
    
    // Giả lập hành động submit để test logic storage
    const handleMockSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        
        // Dữ liệu mẫu giả định lấy từ form
        const formData: NhanVien = initialData ? {
             ...initialData,
             hoTen: initialData.hoTen + " (Updated)", // Test edit
        } : {
            id: Date.now().toString(),
            hoTen: "Nhân viên mới (Test)",
            chucVu: "Nhân viên",
            phongBan: "Chưa phân công",
            email: "test@example.com",
            soDienThoai: "0000000000",
            ngaySinh: "2000-01-01",
            trangThai: "dang_lam_viec",
            diaChi: "N/A"
        };

        if (initialData) {
            suaNhanVien(formData);
        } else {
            themNhanVien(formData);
        }
        onBack();
    };

    return (
        <div className="max-w-2xl mx-auto bg-white rounded-lg shadow-md p-6">
             <div className="flex items-center space-x-2 text-yellow-600 bg-yellow-50 p-4 rounded-md mb-6">
                <AlertCircle className="w-5 h-5" />
                <span className="text-sm font-medium">Đây là màn hình Placeholder. Form nhập liệu chi tiết (PersonnelForm.tsx) sẽ được tích hợp ở bước sau.</span>
            </div>

            <h2 className="text-2xl font-bold mb-4 text-gray-800">
                {initialData ? `Sửa nhân viên: ${initialData.hoTen}` : 'Thêm nhân viên mới'}
            </h2>
            
            <form onSubmit={handleMockSubmit} className="space-y-4">
                <div className="p-4 border border-gray-200 rounded bg-gray-50 text-gray-500 text-sm">
                    Khu vực này sẽ hiển thị Form nhập liệu chi tiết. Hiện tại nhấn "Lưu" sẽ tạo dữ liệu mẫu để kiểm tra tính năng Offline Storage.
                </div>
                <div className="flex justify-end space-x-3 mt-6">
                    <button 
                        type="button"
                        onClick={onBack}
                        className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 font-medium"
                    >
                        Hủy bỏ
                    </button>
                    <button 
                        type="submit"
                        className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center font-medium"
                    >
                        <Save className="w-4 h-4 mr-2" />
                        Lưu dữ liệu
                    </button>
                </div>
            </form>
        </div>
    );
};

// --- 5. MAIN APP COMPONENT ---
const AppContent = () => {
    const [currentView, setCurrentView] = useState<'list' | 'form'>('list');
    const [editingEmployee, setEditingEmployee] = useState<NhanVien | undefined>(undefined);

    const handleAddNew = () => {
        setEditingEmployee(undefined);
        setCurrentView('form');
    };

    const handleEdit = (nv: NhanVien) => {
        setEditingEmployee(nv);
        setCurrentView('form');
    };

    const handleBackToList = () => {
        setCurrentView('list');
        setEditingEmployee(undefined);
    };

    return (
        <div className="min-h-screen bg-gray-50 text-gray-900 font-sans">
            {/* Header */}
            <header className="bg-blue-700 text-white shadow-lg">
                <div className="container mx-auto px-4 py-4 flex justify-between items-center">
                    <div className="flex items-center space-x-2">
                        <Briefcase className="w-8 h-8" />
                        <h1 className="text-2xl font-bold tracking-tight">HRM Offline</h1>
                    </div>
                    {currentView === 'list' && (
                        <button 
                            onClick={handleAddNew}
                            className="bg-white text-blue-700 px-4 py-2 rounded-lg font-semibold hover:bg-blue-50 transition-colors flex items-center shadow-sm"
                        >
                            <UserPlus className="w-5 h-5 mr-2" />
                            Thêm Nhân Viên
                        </button>
                    )}
                </div>
            </header>

            {/* Main Content */}
            <main className="container mx-auto px-4 py-8">
                {currentView === 'list' ? (
                    <EmployeeList onEdit={handleEdit} />
                ) : (
                    <PersonnelFormPlaceholder 
                        onBack={handleBackToList} 
                        initialData={editingEmployee} 
                    />
                )}
            </main>
        </div>
    );
};

// Root Component wrapped with Provider
export default function App() {
  return (
    <NhanVienProvider>
      <AppContent />
    </NhanVienProvider>
  );
}