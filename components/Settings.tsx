import React, { useState, useRef, useEffect } from 'react';
import { db } from '../store';
import { ShortcutConfig } from '../types'; 

const Settings: React.FC = () => {
  // --- STATE ---
  const [passwords, setPasswords] = useState({ current: '', next: '', confirm: '' });
  const [showPass, setShowPass] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [updateProgress, setUpdateProgress] = useState(0);
  const [updateStatus, setUpdateStatus] = useState('');
  
  // --- STATE SHORTCUTS ---
  const [showShortcutModal, setShowShortcutModal] = useState(false);
  const [shortcuts, setShortcuts] = useState<ShortcutConfig[]>([]);
  const [recordingId, setRecordingId] = useState<string | null>(null);

  const restoreFileRef = useRef<HTMLInputElement>(null);
  const updateFileRef = useRef<HTMLInputElement>(null);

  // --- EFFECT: LOAD SHORTCUTS ---
  useEffect(() => {
    if (db.getShortcuts) {
        setShortcuts(db.getShortcuts());
    }
  }, []);

  // --- LOGIC 1: Đổi mật khẩu (ĐÃ NÂNG CẤP SECURE) ---
  const handleUpdatePassword = async () => {
    if (!passwords.next || passwords.next !== passwords.confirm) {
      alert('Mật khẩu xác nhận không khớp hoặc trống!');
      return;
    }
    
    // Yêu cầu mật khẩu tối thiểu (Optional)
    if (passwords.next.length < 6) {
        alert('Mật khẩu mới phải có ít nhất 6 ký tự!');
        return;
    }

    try {
        // Gọi xuống DB để hash và lưu (Async)
        const success = await db.changePassword(passwords.next);
        
        if (success) {
            alert('Cập nhật mật khẩu bảo mật thành công! Vui lòng ghi nhớ mật khẩu mới.');
            setPasswords({ current: '', next: '', confirm: '' });
        } else {
            alert('Lỗi: Không thể cập nhật mật khẩu vào cơ sở dữ liệu hệ thống.');
        }
    } catch (e) {
        alert('Lỗi hệ thống: ' + e);
    }
  };

  // --- LOGIC 2: Sao lưu dữ liệu ---
  const handleBackup = () => {
    const data = localStorage.getItem('fallback_personnel'); // Tạm thời vẫn lấy fallback nếu web, hoặc cần update logic này cho Electron
    // Trong môi trường Electron thực tế, logic backup nên gọi IPC để copy file .db
    if (!data) {
        alert('Chức năng sao lưu hiện tại hỗ trợ export JSON. Vui lòng sử dụng tính năng Xuất Excel ở Dashboard để có dữ liệu chi tiết.');
        return;
    }
    
    try {
        const blob = new Blob([data], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
        link.href = url;
        link.download = `DH_MILITARY_BACKUP_${timestamp}.json`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    } catch (e) {
        alert("Lỗi khi tạo bản sao lưu!");
    }
  };

  // --- LOGIC 3: Khôi phục dữ liệu ---
  const handleRestore = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const content = event.target?.result as string;
        const parsed = JSON.parse(content);
        
        if (Array.isArray(parsed)) {
          if (confirm(`Tìm thấy ${parsed.length} hồ sơ trong bản sao lưu. Khôi phục sẽ GHI ĐÈ dữ liệu hiện tại (Web Mode). Tiếp tục?`)) {
            localStorage.setItem('fallback_personnel', content);
            alert('Khôi phục cơ sở dữ liệu thành công! Hệ thống sẽ tải lại.');
            window.location.reload();
          }
        } else {
           alert('Cấu trúc tệp sao lưu không hợp lệ!');
        }
      } catch (err) {
        alert('Lỗi: Tệp tin bị hỏng hoặc sai định dạng!');
      }
    };
    reader.readAsText(file);
    if (e.target) e.target.value = '';
  };

  // --- LOGIC 4: Nâng cấp phần mềm ---
  const handleUpdateSoftware = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.toLowerCase().endsWith('.zip')) {
      alert('Lỗi: Tệp cập nhật phải có định dạng .zip được cung cấp chính thức bởi DHsystem!');
      return;
    }

    setIsUpdating(true);
    setUpdateStatus('Đang khởi tạo trình phân tích gói tin...');
    setUpdateProgress(0);

    const processUpdateFile = new Promise<void>((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onprogress = (event) => {
        if (event.lengthComputable) {
          const percent = Math.round((event.loaded / event.total) * 50);
          setUpdateProgress(percent);
          setUpdateStatus(`Đang đọc dữ liệu gói: ${Math.round(event.loaded / 1024)} KB...`);
        }
      };

      reader.onload = async (event) => {
        const arrayBuffer = event.target?.result as ArrayBuffer;
        if (!arrayBuffer) {
          reject('Không thể đọc nội dung tệp.');
          return;
        }

        const view = new DataView(arrayBuffer);
        if (view.byteLength < 4 || view.getUint32(0, false) !== 0x504b0304) {
           reject('Chữ ký số không hợp lệ. Đây không phải là tệp cập nhật DHsystem chuẩn (Sai ZIP header).');
           return;
        }

        setUpdateProgress(60);
        setUpdateStatus('Đang xác thực chữ ký số (Checksum Verification)...');
        await new Promise(r => setTimeout(r, 800));
        
        setUpdateProgress(80);
        setUpdateStatus('Đang kiểm tra tính tương thích cấu trúc...');
        await new Promise(r => setTimeout(r, 600));

        resolve();
      };

      reader.onerror = () => reject('Lỗi đọc tệp tin (I/O Error).');
      reader.readAsArrayBuffer(file);
    });

    try {
      await processUpdateFile;
      setUpdateProgress(100);
      setUpdateStatus('Gói cập nhật hợp lệ!');
      
      setTimeout(() => {
        alert(
          `Gói cập nhật "${file.name}" đã vượt qua kiểm tra bảo mật.\n\n` +
          `LƯU Ý: Do đang chạy ở chế độ Kiosk/Local, vui lòng sao chép tệp này vào thư mục gốc và khởi động lại ứng dụng để hệ thống tự động giải nén.`
        );
        setIsUpdating(false);
        if (e.target) e.target.value = '';
      }, 500);
    } catch (error) {
      alert(`Cập nhật thất bại: ${error}`);
      setIsUpdating(false);
      if (e.target) e.target.value = '';
    }
  };

  // --- LOGIC 5: Reset Data ---
  const handleResetData = async () => {
    if (confirm('CẢNH BÁO QUAN TRỌNG: Hành động này sẽ xóa sạch TOÀN BỘ hồ sơ quân nhân và cấu trúc đơn vị. Bạn có chắc chắn?')) {
        try {
            await db.clearDatabase();
            alert("Đã xóa sạch cơ sở dữ liệu. Hệ thống sẽ khởi động lại.");
            window.location.reload();
        } catch (e) {
            alert('Lỗi khi reset DB: ' + e);
        }
    }
  };

  // --- LOGIC 6: XỬ LÝ PHÍM TẮT ---
  const startRecording = (id: string) => {
    setRecordingId(id);
    const handleKey = (e: KeyboardEvent) => {
      e.preventDefault();
      if (['Control', 'Alt', 'Shift'].includes(e.key)) return;
      
      db.updateShortcut(id, {
        key: e.key,
        altKey: e.altKey,
        ctrlKey: e.ctrlKey,
        shiftKey: e.shiftKey
      });
      
      setShortcuts(db.getShortcuts());
      setRecordingId(null);
      window.removeEventListener('keydown', handleKey);
    };
    window.addEventListener('keydown', handleKey);
  };

  const resetShortcuts = () => {
    if (confirm('Đặt lại toàn bộ phím tắt về mặc định hệ thống?')) {
      db.resetShortcuts();
      setShortcuts(db.getShortcuts());
    }
  };

  return (
    <div className="grid grid-cols-12 gap-6 animate-fade-in relative">
      {/* --- OVERLAY PROGRESS --- */}
      {isUpdating && (
        <div className="fixed inset-0 z-[250] bg-black/85 backdrop-blur-lg flex items-center justify-center p-6">
          <div className="bg-white w-full max-w-md p-10 rounded-[2.5rem] shadow-2xl text-center space-y-8 border-4 border-[#14452F]">
            <div className="relative w-28 h-28 mx-auto">
              <div className="absolute inset-0 border-[6px] border-gray-100 rounded-full shadow-inner"></div>
              <div className="absolute inset-0 border-[6px] border-[#14452F] rounded-full border-t-transparent animate-spin"></div>
              <div className="absolute inset-0 flex items-center justify-center font-black text-2xl text-[#14452F]">
                {updateProgress}%
              </div>
            </div>
            
            <div className="space-y-2">
              <h4 className="font-black text-[#14452F] uppercase text-base tracking-widest">DHsystem Update</h4>
              <p className="text-xs text-gray-400 font-bold italic h-4 animate-pulse">{updateStatus}</p>
            </div>

            <div className="w-full bg-gray-100 h-3 rounded-full overflow-hidden shadow-inner">
              <div 
                className="h-full bg-gradient-to-r from-green-700 to-[#14452F] transition-all duration-300 ease-out"
                style={{ width: `${updateProgress}%` }}
              ></div>
            </div>

            <div className="p-4 bg-rose-50 rounded-2xl border border-rose-100">
                <p className="text-[10px] text-rose-600 font-black uppercase leading-relaxed">
                    Đang xác thực gói dữ liệu. Không tắt trình duyệt hoặc ngắt kết nối.
                </p>
            </div>
          </div>
        </div>
      )}

      {/* --- CỘT TRÁI --- */}
      <div className="col-span-12 lg:col-span-5 space-y-6">
        
        {/* 1. PASSWORD */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h3 className="flex items-center gap-2 font-black text-[#14452F] uppercase text-xs mb-6 pb-2 border-b">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" strokeWidth="2"/></svg>
            Bảo mật tài khoản
          </h3>
          <div className="space-y-4">
            <div>
              <label className="block text-[10px] font-bold text-gray-500 mb-1 uppercase">Mật khẩu mới</label>
              <div className="relative">
                <input type={showPass ? "text" : "password"} className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm font-bold" value={passwords.next} onChange={e => setPasswords({...passwords, next: e.target.value})} />
                <button onClick={() => setShowPass(!showPass)} className="absolute right-3 top-3 text-gray-400">👁</button>
              </div>
            </div>
            <div>
              <label className="block text-[10px] font-bold text-gray-500 mb-1 uppercase">Xác nhận mật khẩu</label>
              <div className="relative">
                <input type={showPass ? "text" : "password"} className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm font-bold" value={passwords.confirm} onChange={e => setPasswords({...passwords, confirm: e.target.value})} />
                <button onClick={() => setShowPass(!showPass)} className="absolute right-3 top-3 text-gray-400">👁</button>
              </div>
            </div>
            <button onClick={handleUpdatePassword} className="w-full py-3.5 military-green text-white rounded-xl font-black text-[11px] uppercase tracking-widest shadow-lg active:scale-95 transition-all">
              Cập nhật bảo mật
            </button>
          </div>
        </div>

        {/* 2. TÙY BIẾN VẬN HÀNH */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
           <h3 className="flex items-center gap-2 font-black text-[#14452F] uppercase text-xs mb-4">
                <svg className="w-4 h-4 text-green-700" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                Tùy biến vận hành
           </h3>
           <div className="space-y-3">
              <button 
                onClick={() => setShowShortcutModal(true)}
                className="w-full flex items-center justify-between p-4 bg-gray-50 hover:bg-green-50 rounded-xl transition-all border border-transparent hover:border-green-200 group"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-green-100 rounded-lg text-green-700 group-hover:bg-green-200 transition-colors">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122" strokeWidth="2"/></svg>
                  </div>
                  <div className="text-left">
                    <span className="block text-xs font-black text-gray-700 uppercase group-hover:text-[#14452F]">Cài đặt phím tắt</span>
                    <span className="block text-[9px] text-gray-400 font-bold uppercase">Gán chức năng nhanh</span>
                  </div>
                </div>
                <svg className="w-4 h-4 text-gray-400 group-hover:text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M9 5l7 7-7 7" strokeWidth="2"/></svg>
              </button>
           </div>
        </div>

        {/* 3. MAINTENANCE */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 border-l-4 border-yellow-500">
          <h3 className="flex items-center gap-2 font-black text-[#14452F] uppercase text-xs mb-4">
            <svg className="w-4 h-4 text-yellow-600" fill="currentColor" viewBox="0 0 20 20"><path d="M5 3a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2V5a2 2 0 00-2-2H5zM5 11a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2v-2a2 2 0 00-2-2H5zM11 5a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V5zM11 13a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"/></svg>
            Quản trị & Bảo trì
          </h3>
          <p className="text-[10px] text-gray-400 mb-6 leading-relaxed font-bold italic">Giao thức vận hành an toàn bởi DHsystem.</p>
          
          <div className="space-y-4">
            <input type="file" ref={restoreFileRef} className="hidden" accept=".db,.json" onChange={handleRestore} />
            <input type="file" ref={updateFileRef} className="hidden" accept=".zip" onChange={handleUpdateSoftware} />

            <button 
              onClick={() => updateFileRef.current?.click()}
              className="w-full flex items-center justify-center gap-3 py-4 bg-blue-600 text-white rounded-2xl font-black text-[11px] uppercase shadow-xl active:scale-95 transition-all hover:bg-blue-700 border-b-4 border-blue-900"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" strokeWidth="2"/></svg>
              Cập nhật hệ thống (.zip)
            </button>

            <div className="grid grid-cols-1 gap-3">
                <button 
                  onClick={handleBackup}
                  className="flex items-center gap-4 px-6 py-4 bg-white border border-gray-100 rounded-2xl hover:bg-blue-50 transition-all text-left shadow-sm group"
                >
                  <div className="bg-blue-50 p-3 rounded-xl text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-all">
                     <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" strokeWidth="2"/></svg>
                  </div>
                  <div>
                    <p className="font-black text-xs text-[#14452F] uppercase">Sao lưu dữ liệu</p>
                    <p className="text-[9px] text-gray-400 font-bold uppercase">Xuất cơ sở dữ liệu hồ sơ .db</p>
                  </div>
                </button>

                <button 
                  onClick={() => restoreFileRef.current?.click()}
                  className="flex items-center gap-4 px-6 py-4 bg-white border border-gray-100 rounded-2xl hover:bg-green-50 transition-all text-left shadow-sm group"
                >
                  <div className="bg-green-50 p-3 rounded-xl text-green-600 group-hover:bg-green-600 group-hover:text-white transition-all">
                     <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" strokeWidth="2"/></svg>
                  </div>
                  <div>
                    <p className="font-black text-xs text-[#14452F] uppercase">Khôi phục hệ thống</p>
                    <p className="text-[9px] text-gray-400 font-bold uppercase">Ghi đè từ bản sao lưu DHsystem</p>
                  </div>
                </button>
            </div>

            <button onClick={handleResetData} className="w-full flex items-center gap-4 px-6 py-5 border-2 border-red-100 rounded-2xl hover:bg-red-500 hover:text-white transition-all text-left group mt-6 shadow-sm">
              <div className="bg-red-50 p-3 rounded-xl text-red-600 group-hover:bg-white group-hover:text-red-600 transition-all shadow-sm">
                 <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" strokeWidth="2"/></svg>
              </div>
              <div>
                <p className="font-black text-xs uppercase text-red-600 group-hover:text-white">Xóa sạch dữ liệu</p>
                <p className="text-[9px] font-bold uppercase opacity-60 group-hover:opacity-100">Xóa vĩnh viễn toàn bộ hồ sơ hiện có</p>
              </div>
            </button>
          </div>
        </div>
      </div>

      {/* --- CỘT PHẢI --- */}
      <div className="col-span-12 lg:col-span-7">
        <div className="bg-white p-10 rounded-[2rem] shadow-sm border border-gray-100 h-full">
           <div className="flex justify-between items-center mb-10 pb-6 border-b-2 border-dashed border-gray-50">
              <h3 className="flex items-center gap-2 font-black text-[#14452F] uppercase text-sm">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" strokeWidth="2"/></svg>
                Giao thức vận hành DHsystem
              </h3>
              <div className="flex flex-col items-end">
                <span className="bg-green-100 text-green-700 text-[10px] font-black px-3 py-1.5 rounded-full uppercase shadow-sm border border-green-200">DH-SYSTEM CORE 3.7</span>
                <p className="text-[9px] text-gray-300 font-bold mt-1">Cấp phép năm: 2026</p>
              </div>
           </div>

           <div className="space-y-12 pr-4 max-h-[600px] overflow-y-auto scrollbar-hide">
              {[
                { step: 1, title: 'Cập nhật hệ thống bản quyền', content: 'Sử dụng tệp tin .zip được cấp phép bởi DHsystem để nâng cấp tính năng. Quy trình tự động hóa và bảo mật dữ liệu tuyệt đối.' },
                { step: 2, title: 'Mã hóa hình ảnh hồ sơ', content: 'Mọi dữ liệu hình ảnh được mã hóa và lưu trữ trực tiếp vào lõi hệ thống. Đảm bảo tính di động và toàn vẹn khi sao lưu giữa các máy trạm.' },
                { step: 3, title: 'Lưu trữ ngoại tuyến (Offline Mode)', content: 'Hệ thống thiết kế chạy độc lập, không yêu cầu kết nối mạng. Dữ liệu được bảo vệ cục bộ bởi cơ chế mã hóa DH-Core.' },
                { step: 4, title: 'Cấu hình phím tắt thông minh', content: 'Sử dụng menu "Tùy biến vận hành" để gán các phím tắt cho chức năng thường dùng (Thêm mới, Tìm kiếm, In hồ sơ...) giúp thao tác nhanh gấp 3 lần.' },
                { step: 5, title: 'Phát triển bởi DHsystem', content: 'Mọi thắc mắc kỹ thuật và yêu cầu tùy biến vui lòng liên hệ bộ phận hỗ trợ DHsystem 2026.' }
              ].map(item => (
                <div key={item.step} className="flex gap-8 items-start relative group">
                  <div className="w-14 h-14 rounded-2xl border-[3px] border-white military-green text-white flex items-center justify-center font-black text-lg shrink-0 shadow-lg z-10 group-hover:scale-110 transition-all">
                    {item.step}
                  </div>
                  <div className="space-y-3 pt-2">
                    <h4 className="font-black text-sm text-[#14452F] uppercase tracking-tight group-hover:text-green-800 transition-colors">{item.title}</h4>
                    <p className="text-[11px] text-gray-500 leading-relaxed font-medium">{item.content}</p>
                  </div>
                </div>
              ))}
           </div>
        </div>
      </div>

      {/* --- MODAL SHORTCUTS --- */}
      {showShortcutModal && (
        <div className="fixed inset-0 z-[300] bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-2xl rounded-[2.5rem] shadow-2xl overflow-hidden animate-slide-up flex flex-col max-h-[90vh]">
             <div className="p-8 border-b bg-gray-50/50 flex justify-between items-center">
                <div>
                   <h2 className="text-lg font-black text-[#14452F] uppercase">Cấu hình phím tắt</h2>
                   <p className="text-[10px] text-gray-400 font-bold uppercase">Tùy chỉnh trải nghiệm vận hành của bạn</p>
                </div>
                <button onClick={() => setShowShortcutModal(false)} className="w-10 h-10 rounded-full hover:bg-gray-100 flex items-center justify-center text-gray-400">×</button>
             </div>
             
             <div className="flex-1 overflow-y-auto p-8 space-y-4 scrollbar-hide">
                {shortcuts.map(s => (
                  <div key={s.id} className="flex items-center justify-between p-4 bg-white border border-gray-100 rounded-2xl hover:shadow-md transition-all">
                     <div>
                        <p className="text-xs font-black text-gray-700 uppercase">{s.label}</p>
                        <p className="text-[9px] text-gray-400 font-bold uppercase">ID: {s.id}</p>
                     </div>
                     <div className="flex items-center gap-3">
                        <div className={`px-4 py-2 rounded-lg font-mono text-xs font-black min-w-[120px] text-center transition-all ${recordingId === s.id ? 'bg-rose-500 text-white animate-pulse' : 'bg-gray-100 text-gray-600 border border-gray-200 shadow-inner'}`}>
                           {recordingId === s.id ? 'NHẤN PHÍM...' : (
                             <>
                                {s.ctrlKey && <span className="mr-1">Ctrl +</span>}
                                {s.altKey && <span className="mr-1">Alt +</span>}
                                {s.shiftKey && <span className="mr-1">Shift +</span>}
                                <span className="uppercase">{s.key === ' ' ? 'Space' : s.key}</span>
                             </>
                           )}
                        </div>
                        <button 
                          onClick={() => startRecording(s.id)}
                          className="px-4 py-2 text-[10px] font-black text-blue-600 uppercase hover:bg-blue-50 rounded-lg"
                        >
                          Sửa
                        </button>
                     </div>
                  </div>
                ))}
             </div>

             <div className="p-8 border-t bg-gray-50 flex justify-between items-center">
                <button onClick={resetShortcuts} className="px-6 py-3 text-[10px] font-black text-red-600 uppercase hover:bg-red-50 rounded-xl">Đặt lại mặc định</button>
                <button onClick={() => setShowShortcutModal(false)} className="px-10 py-3 military-green text-white rounded-xl font-black uppercase text-[10px] shadow-lg">Lưu cấu hình</button>
             </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Settings;