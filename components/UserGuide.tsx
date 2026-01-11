
import React, { useState } from 'react';
import { 
  X, BookOpen, UserPlus, Search, 
  Layers, ShieldAlert, Database, 
  Keyboard, FileText, ChevronRight, 
  CheckCircle2, AlertCircle, Printer,
  Info, HelpCircle, ArrowRight,
  ShieldCheck, Layout, Laptop,
  // Thêm Plus icon bị thiếu
  Plus
} from 'lucide-react';

interface UserGuideProps {
  onClose: () => void;
}

const UserGuide: React.FC<UserGuideProps> = ({ onClose }) => {
  const [activeSection, setActiveSection] = useState('overview');

  const menuItems = [
    { id: 'overview', label: 'Tổng quan hệ thống', icon: Layout },
    { id: 'personnel', label: 'Quản lý Hồ sơ', icon: UserPlus },
    { id: 'units', label: 'Quản lý Đơn vị', icon: Layers },
    { id: 'security', label: 'Cảnh báo An ninh', icon: ShieldAlert },
    { id: 'data', label: 'Dữ liệu & Báo cáo', icon: Database },
    { id: 'shortcuts', label: 'Phím tắt vận hành', icon: Keyboard },
  ];

  const renderContent = () => {
    switch (activeSection) {
      case 'overview':
        return (
          <div className="space-y-6 animate-fade-in">
            <div className="p-6 bg-green-50 rounded-2xl border border-green-100 flex items-start gap-4">
              <div className="w-12 h-12 bg-[#14452F] text-white rounded-xl flex items-center justify-center shrink-0 shadow-lg">
                <Laptop size={24} />
              </div>
              <div>
                <h3 className="text-lg font-black text-[#14452F] uppercase mb-1">Chào mừng đến với QN-Manager Pro</h3>
                <p className="text-sm text-slate-600 leading-relaxed">
                  Hệ thống được thiết kế dành riêng cho công tác quản lý quân số nội bộ, ưu tiên tính <strong>Bảo mật - Offline - Tốc độ</strong>. Toàn bộ dữ liệu được lưu trữ trực tiếp trên thiết bị này, không truyền tải qua Internet.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                <h4 className="text-[11px] font-black text-slate-800 uppercase mb-3 flex items-center gap-2">
                  <Info size={14} className="text-blue-600"/> Cấu trúc vận hành
                </h4>
                <ul className="space-y-2">
                  {['Dashboard: Xem thống kê & Danh sách', 'Đơn vị: Quản lý sơ đồ tổ chức', 'Thiết lập: Cấu hình phím & Bảo mật'].map((t, i) => (
                    <li key={i} className="text-[11px] font-bold text-slate-500 flex items-center gap-2">
                      <ChevronRight size={12} className="text-blue-400"/> {t}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                <h4 className="text-[11px] font-black text-slate-800 uppercase mb-3 flex items-center gap-2">
                  <ShieldCheck size={14} className="text-green-600"/> Đặc tính kỹ thuật
                </h4>
                <ul className="space-y-2">
                  {['Không cần kết nối mạng', 'Mã hóa mật khẩu chuẩn SHA-256', 'Công nghệ IndexedDB hiệu suất cao'].map((t, i) => (
                    <li key={i} className="text-[11px] font-bold text-slate-500 flex items-center gap-2">
                      <ChevronRight size={12} className="text-green-400"/> {t}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        );

      case 'personnel':
        return (
          <div className="space-y-6 animate-fade-in">
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-blue-700 font-black uppercase text-xs">
                <UserPlus size={16}/> Quy trình quản lý hồ sơ
              </div>
              
              <div className="space-y-3">
                <div className="flex gap-4 p-4 border border-slate-100 rounded-xl hover:bg-slate-50 transition-colors">
                  <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center shrink-0 font-black">1</div>
                  <div className="text-xs">
                    <p className="font-black text-slate-800 uppercase mb-1">Thêm mới</p>
                    <p className="text-slate-500 font-medium">Sử dụng nút "Thêm mới" hoặc <code className="bg-slate-200 px-1 rounded">Ctrl+N</code>. Lưu ý các trường có dấu <span className="text-red-500">*</span> là bắt buộc.</p>
                  </div>
                </div>
                
                <div className="flex gap-4 p-4 border border-slate-100 rounded-xl hover:bg-slate-50 transition-colors">
                  <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center shrink-0 font-black">2</div>
                  <div className="text-xs">
                    <p className="font-black text-slate-800 uppercase mb-1">Chế độ Xem & Sửa</p>
                    <p className="text-slate-500 font-medium">Nhấn biểu tượng "Mắt" để vào chế độ xem chi tiết. Nếu muốn sửa, nhấn nút "Sửa hồ sơ" trong màn hình chi tiết.</p>
                  </div>
                </div>

                <div className="flex gap-4 p-4 border border-slate-100 rounded-xl hover:bg-slate-50 transition-colors">
                  <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center shrink-0 font-black">3</div>
                  <div className="text-xs">
                    <p className="font-black text-slate-800 uppercase mb-1">In Trích Ngang</p>
                    <p className="text-slate-500 font-medium">Hệ thống hỗ trợ in ấn hồ sơ theo mẫu A4 chuẩn quân đội thông qua biểu tượng "Máy in".</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-4 bg-amber-50 rounded-xl border border-amber-100 flex gap-3">
              <AlertCircle size={18} className="text-amber-600 shrink-0"/>
              <p className="text-[11px] font-bold text-amber-700 italic">Lưu ý: Sau khi xóa hồ sơ, dữ liệu sẽ bị gỡ vĩnh viễn khỏi Database và không thể hoàn tác.</p>
            </div>
          </div>
        );

      case 'units':
        return (
          <div className="space-y-6 animate-fade-in">
            <div className="flex items-center gap-2 text-amber-700 font-black uppercase text-xs">
              <Layers size={16}/> Sơ đồ tổ chức đa cấp
            </div>
            
            <div className="grid grid-cols-1 gap-4">
              <div className="p-5 border border-slate-200 rounded-2xl relative overflow-hidden">
                <div className="relative z-10 space-y-4">
                  <div className="flex items-center gap-3">
                     <div className="p-2 bg-slate-100 rounded-lg"><Search size={16}/></div>
                     <p className="text-xs font-bold text-slate-700">Lọc theo đơn vị: Chọn một đơn vị trên cây thư mục để lọc danh sách nhân sự của đơn vị đó và các đơn vị con.</p>
                  </div>
                  <div className="flex items-center gap-3">
                     <div className="p-2 bg-slate-100 rounded-lg"><Plus size={16}/></div>
                     <p className="text-xs font-bold text-slate-700">Thêm đơn vị: Di chuột qua đơn vị cha hoặc nhấn nút "Thêm đơn vị con" để mở rộng tổ chức.</p>
                  </div>
                  <div className="flex items-center gap-3">
                     <div className="p-2 bg-slate-100 rounded-lg"><X size={16}/></div>
                     <p className="text-xs font-bold text-slate-700">Xóa đơn vị: Chỉ xóa được các đơn vị không phải là đơn vị gốc. Lưu ý: Xóa đơn vị sẽ xóa toàn bộ cấp dưới.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );

      case 'security':
        return (
          <div className="space-y-6 animate-fade-in">
            <div className="flex items-center gap-2 text-red-700 font-black uppercase text-xs">
              <ShieldAlert size={16}/> Quy tắc cảnh báo an ninh
            </div>
            
            <p className="text-xs text-slate-600 font-medium leading-relaxed">
              Hệ thống tự động gắn nhãn <strong>"Cảnh báo"</strong> (Màu đỏ/vàng) đối với quân nhân có các yếu tố sau:
            </p>

            <div className="space-y-3">
               {[
                 { label: 'Tài chính phức tạp', desc: 'Có khoản vay nợ (Tín dụng đen, vay app) chưa thanh toán.', color: 'border-red-500' },
                 { label: 'Vi phạm kỷ luật', desc: 'Có tiền sử vi phạm tại địa phương hoặc trong đơn vị.', color: 'border-red-500' },
                 { label: 'Tệ nạn xã hội', desc: 'Liên quan đến Ma túy, Đánh bạc, Cá độ.', color: 'border-red-600' },
                 { label: 'Yếu tố nước ngoài', desc: 'Có thân nhân đang định cư hoặc làm việc tại nước ngoài.', color: 'border-amber-500' },
               ].map((item, i) => (
                 <div key={i} className={`p-4 bg-white border-l-4 ${item.color} rounded-r-xl shadow-sm`}>
                    <p className="text-[11px] font-black text-slate-800 uppercase mb-1">{item.label}</p>
                    <p className="text-[11px] text-slate-500 font-medium">{item.desc}</p>
                 </div>
               ))}
            </div>
          </div>
        );

      case 'data':
        return (
          <div className="space-y-6 animate-fade-in">
            <div className="flex items-center gap-2 text-blue-700 font-black uppercase text-xs">
              <Database size={16}/> Quản trị & Kết xuất dữ liệu
            </div>

            <div className="space-y-4">
               <div className="p-4 bg-blue-50/50 border border-blue-100 rounded-2xl">
                  <h4 className="text-[10px] font-black text-blue-800 uppercase flex items-center gap-2 mb-2">
                    <Database size={12}/> Backup dữ liệu (.json)
                  </h4>
                  <p className="text-xs text-blue-700/70 font-medium">Vào mục "Thiết lập" → "Sao lưu cơ sở dữ liệu". Hệ thống sẽ tạo một file JSON chứa toàn bộ dữ liệu. Khuyên dùng: Thực hiện hàng tuần.</p>
               </div>

               <div className="p-4 bg-green-50/50 border border-green-100 rounded-2xl">
                  <h4 className="text-[10px] font-black text-green-800 uppercase flex items-center gap-2 mb-2">
                    <FileText size={12}/> Kết xuất báo cáo Excel
                  </h4>
                  <p className="text-xs text-green-700/70 font-medium">Nhấn nút "Xuất Excel" tại màn hình chính để nhận file .xls chuẩn Microsoft Excel, bao gồm đầy đủ các trường thông tin quân nhân đang hiển thị.</p>
               </div>
            </div>
          </div>
        );

      case 'shortcuts':
        return (
          <div className="space-y-6 animate-fade-in">
             <div className="flex items-center gap-2 text-slate-700 font-black uppercase text-xs">
              <Keyboard size={16}/> Hệ thống phím tắt nhanh
            </div>
            
            <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
               <table className="w-full text-xs">
                 <thead className="bg-slate-50 border-b border-slate-200">
                    <tr className="text-slate-400 font-black uppercase text-[10px]">
                       <th className="p-3 text-left">Chức năng</th>
                       <th className="p-3 text-right">Phím tắt mặc định</th>
                    </tr>
                 </thead>
                 <tbody className="divide-y divide-slate-100">
                    {[
                      { l: 'Thêm chiến sĩ mới', k: 'Ctrl + N' },
                      { l: 'Mở tiêu điểm tìm kiếm', k: 'Ctrl + F' },
                      { l: 'Làm mới dữ liệu', k: 'Ctrl + R' },
                      { l: 'Mở hướng dẫn này', k: 'Ctrl + H' },
                    ].map((s, i) => (
                      <tr key={i} className="hover:bg-slate-50 transition-colors">
                        <td className="p-3 font-bold text-slate-600">{s.l}</td>
                        <td className="p-3 text-right">
                           <code className="bg-slate-100 px-2 py-1 rounded-lg border border-slate-200 font-mono font-bold text-blue-600">{s.k}</code>
                        </td>
                      </tr>
                    ))}
                 </tbody>
               </table>
            </div>
            <p className="text-[10px] text-center text-slate-400 font-bold uppercase italic">
              * Bạn có thể thay đổi phím tắt này trong mục Thiết lập cấu hình.
            </p>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-fade-in no-print">
      <div className="bg-white w-full max-w-4xl h-[600px] rounded-[2.5rem] shadow-2xl flex overflow-hidden border border-slate-200 animate-slide-up">
        
        {/* SIDEBAR NAVIGATION */}
        <div className="w-64 bg-[#14452F] flex flex-col shrink-0">
          <div className="p-8 border-b border-white/10">
            <h2 className="text-white font-black uppercase tracking-widest flex items-center gap-3">
              <BookOpen size={20} className="text-amber-400"/> Hướng dẫn
            </h2>
            <p className="text-[9px] text-white/50 font-bold uppercase tracking-[0.2em] mt-1">Version 8.0 Manual</p>
          </div>
          
          <nav className="flex-1 p-4 space-y-1">
            {menuItems.map(item => (
              <button
                key={item.id}
                onClick={() => setActiveSection(item.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-bold text-[11px] uppercase tracking-wider ${activeSection === item.id ? 'bg-white text-[#14452F] shadow-lg scale-105' : 'text-white/60 hover:text-white hover:bg-white/5'}`}
              >
                <item.icon size={16} />
                {item.label}
              </button>
            ))}
          </nav>

          <div className="p-6 border-t border-white/10">
             <div className="bg-white/5 rounded-2xl p-4 text-center">
                <p className="text-[9px] text-white/40 font-bold uppercase leading-relaxed">Phát triển bởi Phòng Công nghệ thông tin DHsystem</p>
             </div>
          </div>
        </div>

        {/* CONTENT AREA */}
        <div className="flex-1 flex flex-col bg-slate-50/50">
          <header className="px-10 py-6 border-b border-slate-100 flex items-center justify-between bg-white">
             <div className="flex items-center gap-3">
                <div className="p-2 bg-slate-100 rounded-lg text-slate-400">
                   <HelpCircle size={18}/>
                </div>
                <div>
                   <h4 className="text-sm font-black text-slate-800 uppercase tracking-tight">Chi tiết tài liệu</h4>
                   <p className="text-[10px] text-slate-400 font-bold uppercase">Tra cứu tính năng hệ thống</p>
                </div>
             </div>
             <button 
                onClick={onClose}
                className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-red-50 text-slate-400 hover:text-red-500 transition-all"
             >
                <X size={20} />
             </button>
          </header>

          <div className="flex-1 overflow-y-auto p-10 custom-scrollbar">
            {renderContent()}
          </div>

          <footer className="px-10 py-4 bg-white border-t border-slate-100 flex items-center justify-between">
             <div className="flex items-center gap-4">
                <div className="flex items-center gap-1.5 px-2 py-0.5 bg-blue-50 rounded text-[9px] font-black text-blue-600 uppercase">
                   <Laptop size={10}/> Desktop App
                </div>
                <div className="flex items-center gap-1.5 px-2 py-0.5 bg-green-50 rounded text-[9px] font-black text-green-600 uppercase">
                   <ShieldCheck size={10}/> Secure Offline
                </div>
             </div>
             <button 
                onClick={onClose}
                className="px-6 py-2 bg-[#14452F] text-white rounded-xl font-black uppercase text-[10px] tracking-widest shadow-lg hover:shadow-green-900/20 transition-all active:scale-95"
             >
                Đã hiểu
             </button>
          </footer>
        </div>
      </div>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #e2e8f0; border-radius: 10px; }
        .animate-fade-in { animation: fadeIn 0.3s ease-out forwards; }
        .animate-slide-up { animation: slideUp 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes slideUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
      `}</style>
    </div>
  );
};

export default UserGuide;
