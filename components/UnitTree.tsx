
import React, { useState, useEffect } from 'react';
import { Unit, MilitaryPersonnel } from '../types';
import { db } from '../store';

interface UnitTreeProps {
  units: Unit[];
  onRefresh: () => void;
}

const UnitTree: React.FC<UnitTreeProps> = ({ units, onRefresh }) => {
  const [newUnitName, setNewUnitName] = useState('');
  const [selectedParent, setSelectedParent] = useState<string | null>(null);
  const [activeUnitId, setActiveUnitId] = useState<string | null>(null);
  // Added state to hold async personnel counts
  const [activeUnitPersonnelCount, setActiveUnitPersonnelCount] = useState(0);
  const [activeUnitTotalCount, setActiveUnitTotalCount] = useState(0);

  const handleAdd = () => {
    if (!newUnitName) {
      alert('Vui lòng nhập tên đơn vị!');
      return;
    }
    db.addUnit(newUnitName, selectedParent);
    setNewUnitName('');
    alert('Đã thêm đơn vị thành công.');
    onRefresh();
  };

  // Fixed: Made async to properly handle Promise from db.getPersonnel
  const getAllPersonnelInUnit = async (unitId: string): Promise<MilitaryPersonnel[]> => {
    // Lấy quân nhân của đơn vị hiện tại
    let list = await db.getPersonnel({ unitId });
    
    // Lấy quân nhân của các đơn vị con (đệ quy)
    const children = units.filter(u => u.parentId === unitId);
    for (const child of children) {
      const childList = await getAllPersonnelInUnit(child.id);
      list = [...list, ...childList];
    }
    
    return list;
  };

  // Added: Update counts when active unit or unit structure changes
  useEffect(() => {
    const updateCounts = async () => {
      if (activeUnitId) {
        const direct = await db.getPersonnel({ unitId: activeUnitId });
        setActiveUnitPersonnelCount(direct.length);
        const total = await getAllPersonnelInUnit(activeUnitId);
        setActiveUnitTotalCount(total.length);
      }
    };
    updateCounts();
  }, [activeUnitId, units]);

  // Fixed: Made async
  const exportToCSV = async (unitId: string, unitName: string) => {
    const personnelList = unitId === 'all' 
      ? await db.getPersonnel() 
      : await getAllPersonnelInUnit(unitId);
    
    if (personnelList.length === 0) {
      alert(`Đơn vị ${unitName} hiện chưa có quân nhân nào trong biên chế.`);
      return;
    }

    // 1. Cấu trúc Header chuẩn văn bản Việt Nam
    let csvContent = "\ufeff"; // BOM for UTF-8 (Quan trọng để Excel đọc được tiếng Việt)
    csvContent += "CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM\n";
    csvContent += "Độc lập - Tự do - Hạnh phúc\n\n";
    csvContent += `DANH SÁCH BIÊN CHẾ QUÂN NHÂN - ĐƠN VỊ: ${unitName.toUpperCase()}\n`;
    csvContent += `Ngày xuất dữ liệu: ${new Date().toLocaleDateString('vi-VN')}\n\n`;

    // 2. Định nghĩa các cột dữ liệu
    const headers = [
      "STT",
      "Họ và tên",
      "Cấp bậc",
      "Chức vụ",
      "Ngày sinh",
      "Số CCCD",
      "SĐT Cá nhân",
      "Hộ khẩu thường trú",
      "Ngày nhập ngũ",
      "Ngày vào Đảng",
      "Trình độ học vấn"
    ];
    csvContent += headers.join(",") + "\n";

    // 3. Đổ dữ liệu
    personnelList.forEach((p, index) => {
      const row = [
        index + 1,
        `"${p.ho_ten}"`,
        `"${p.cap_bac}"`,
        `"${p.chuc_vu}"`,
        `"${p.ngay_sinh}"`,
        `"'${p.cccd}"`, // Thêm dấu nháy đơn để Excel không biến số dài thành số khoa học
        `"${p.sdt_rieng}"`,
        `"${p.ho_khau_thu_tru?.replace(/"/g, '""')}"`, // Wrap text and escape quotes
        `"${p.nhap_ngu_ngay}"`,
        `"${p.vao_dang_ngay || 'Chưa vào Đảng'}"`,
        `"${p.trinh_do_van_hoa}"`
      ];
      csvContent += row.join(",") + "\n";
    });

    // 4. Tạo download link
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `BIEN_CHE_${unitName.replace(/\s+/g, '_').toUpperCase()}_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    db.log('INFO', `Đã xuất danh sách biên chế đơn vị: ${unitName}`);
  };

  const renderTree = (parentId: string | null = null, level: number = 0) => {
    const children = units.filter(u => u.parentId === parentId);
    if (children.length === 0) return null;

    return (
      <div className={`${level > 0 ? 'ml-6 border-l-2 border-green-100/50 pl-2' : ''} space-y-1`}>
        {children.map(unit => (
          <div key={unit.id} className="animate-fade-in">
            <div 
              onClick={() => setActiveUnitId(unit.id)}
              className={`flex items-center justify-between p-3 rounded-xl transition-all cursor-pointer group ${
                activeUnitId === unit.id 
                ? 'bg-[#14452F] text-white shadow-lg' 
                : 'hover:bg-green-50 text-gray-700'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className={`p-1.5 rounded-lg ${activeUnitId === unit.id ? 'bg-white/20' : 'bg-gray-100 group-hover:bg-green-100'}`}>
                  <svg className={`w-4 h-4 ${activeUnitId === unit.id ? 'text-white' : 'text-gray-500'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" strokeWidth="2"/>
                  </svg>
                </div>
                <span className="text-xs font-black uppercase tracking-tight">{unit.name}</span>
              </div>
              
              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button 
                  onClick={(e) => { e.stopPropagation(); setSelectedParent(unit.id); }}
                  className="p-1.5 bg-green-500/20 text-green-700 rounded-md hover:bg-green-500 hover:text-white"
                  title="Thêm cấp dưới"
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M12 4v16m8-8H4" strokeWidth="2.5"/></svg>
                </button>
                <button 
                  onClick={(e) => { e.stopPropagation(); exportToCSV(unit.id, unit.name); }}
                  className="p-1.5 bg-blue-500/20 text-blue-700 rounded-md hover:bg-blue-500 hover:text-white"
                  title="Xuất biên chế"
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" strokeWidth="2"/></svg>
                </button>
                <button 
                  onClick={(e) => { e.stopPropagation(); if(confirm(`Xóa đơn vị ${unit.name}?`)) { db.deleteUnit(unit.id); onRefresh(); } }}
                  className="p-1.5 bg-red-500/20 text-red-700 rounded-md hover:bg-red-500 hover:text-white"
                  title="Xóa"
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" strokeWidth="2"/></svg>
                </button>
              </div>
            </div>
            {renderTree(unit.id, level + 1)}
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="grid grid-cols-12 gap-8 animate-fade-in pb-20">
      {/* Header Info */}
      <div className="col-span-12 flex justify-between items-center bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
        <div>
          <h2 className="text-sm font-black text-[#14452F] uppercase tracking-widest flex items-center gap-3">
             <div className="w-2 h-6 bg-[#d4af37] rounded-full"></div>
             Quản lý Cơ cấu Tổ chức
          </h2>
          <p className="text-[10px] text-gray-400 font-bold uppercase mt-1">Sơ đồ phân cấp đơn vị chiến đấu</p>
        </div>
        <div className="flex gap-4">
           <div className="px-5 py-2.5 bg-gray-50 rounded-xl border flex flex-col items-center">
              <span className="text-[9px] font-black text-gray-400 uppercase">Tổng số đơn vị</span>
              <span className="text-sm font-black text-[#14452F]">{units.length}</span>
           </div>
           <button onClick={() => exportToCSV('all', 'TOÀN ĐƠN VỊ')} className="gold-btn px-6 py-3 rounded-xl font-black text-[10px] uppercase shadow-lg flex items-center gap-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" strokeWidth="2"/></svg>
              Xuất biên chế tổng (.csv)
           </button>
        </div>
      </div>

      {/* Cây Đơn Vị Section */}
      <div className="col-span-12 lg:col-span-5 bg-white rounded-[2rem] shadow-xl border border-gray-100 overflow-hidden flex flex-col h-[750px]">
        <div className="p-8 border-b bg-gray-50/50 flex justify-between items-center">
           <h3 className="flex items-center gap-3 font-black text-[#14452F] uppercase text-xs">
              <svg className="w-5 h-5 text-[#d4af37]" fill="currentColor" viewBox="0 0 20 20"><path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z"/><path fillRule="evenodd" d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 4a1 1 0 000 2h.01a1 1 0 100-2H7zm3 0a1 1 0 000 2h3a1 1 0 100-2h-3zm-3 4a1 1 0 100 2h.01a1 1 0 100-2H7zm3 0a1 1 0 100 2h3a1 1 0 100-2h-3z" clipRule="evenodd"/></svg>
              Sơ đồ Tổ chức
           </h3>
           {selectedParent && (
             <button onClick={() => setSelectedParent(null)} className="text-[10px] font-black text-rose-500 uppercase flex items-center gap-1">
               <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M6 18L18 6M6 6l12 12" strokeWidth="3"/></svg>
               Hủy cấp cha
             </button>
           )}
        </div>
        <div className="flex-1 overflow-y-auto p-6 scrollbar-hide space-y-4">
          {units.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-gray-300 gap-4 opacity-50">
               <svg className="w-20 h-20" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" strokeWidth="1"/></svg>
               <span className="font-black uppercase text-xs tracking-widest">Chưa có dữ liệu đơn vị</span>
            </div>
          ) : (
            renderTree(null)
          )}
        </div>
      </div>

      {/* Thêm Mới & Chi Tiết Section */}
      <div className="col-span-12 lg:col-span-7 space-y-8">
        <div className="bg-white p-10 rounded-[2.5rem] shadow-2xl border border-gray-100 relative overflow-hidden">
           {/* Trang trí background */}
           <div className="absolute top-0 right-0 w-32 h-32 bg-green-50 rounded-bl-full -mr-16 -mt-16 opacity-50"></div>
           
           <h3 className="flex items-center gap-3 font-black text-[#14452F] uppercase text-sm mb-10 pb-4 border-b">
              Thêm Đơn Vị Mới
           </h3>
           
           <div className="space-y-8 relative z-10">
              <div className="grid grid-cols-2 gap-8">
                <div className="col-span-2 md:col-span-1">
                  <label className="block text-[11px] font-black text-gray-400 mb-3 uppercase tracking-wider">Tên Đơn Vị Mới</label>
                  <input 
                    type="text" 
                    placeholder="VD: Đại đội 3, Trung đội 1..."
                    className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl outline-none focus:ring-4 ring-green-600/5 font-black text-[#14452F] placeholder-gray-300 transition-all"
                    value={newUnitName}
                    onChange={e => setNewUnitName(e.target.value)}
                  />
                </div>
                <div className="col-span-2 md:col-span-1">
                  <label className="block text-[11px] font-black text-gray-400 mb-3 uppercase tracking-wider">Cấp Trực Thuộc (Cha)</label>
                  <select 
                    className={`w-full p-4 bg-gray-50 border rounded-2xl outline-none font-black text-xs transition-all ${
                      selectedParent ? 'border-green-500 text-green-700 ring-4 ring-green-500/5' : 'border-gray-100 text-gray-400'
                    }`}
                    value={selectedParent || ''}
                    onChange={e => setSelectedParent(e.target.value || null)}
                  >
                    <option value="">-- Cấp cao nhất --</option>
                    {units.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                  </select>
                </div>
              </div>

              <div className="bg-blue-50/50 p-6 rounded-3xl border border-blue-100 space-y-2">
                 <h4 className="text-[10px] font-black text-blue-700 uppercase">Hỗ trợ vận hành</h4>
                 <p className="text-[11px] text-blue-900/60 leading-relaxed font-medium">
                    Để thêm đơn vị cấp dưới, hãy chọn đơn vị cấp trên ở menu bên trái hoặc chọn từ danh sách bên trên. Hệ thống hỗ trợ đa tầng phân cấp không giới hạn.
                 </p>
              </div>

              <div className="flex items-center justify-between pt-6 border-t border-dashed">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-green-50 flex items-center justify-center text-green-600">
                     <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd"/></svg>
                  </div>
                  <span className="text-[10px] text-gray-400 font-bold uppercase max-w-[200px] leading-tight">
                     Nhấn lưu để xác nhận thay đổi cấu trúc đơn vị.
                  </span>
                </div>
                <button 
                  onClick={handleAdd}
                  className="px-12 py-5 military-green text-white rounded-[1.5rem] font-black uppercase text-xs tracking-widest shadow-2xl active:scale-95 hover:shadow-green-900/20 transition-all flex items-center gap-3"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M5 13l4 4L19 7" strokeWidth="3"/></svg>
                  Lưu Đơn Vị
                </button>
              </div>
           </div>
        </div>

        {activeUnitId && (
          <div className="bg-[#14452F] p-8 rounded-[2.5rem] shadow-2xl text-white animate-slide-up">
            <div className="flex justify-between items-start mb-6">
              <div>
                <span className="text-[10px] font-black text-green-400 uppercase tracking-widest">Đang xem đơn vị</span>
                <h3 className="text-2xl font-black uppercase tracking-tighter mt-1">
                  {units.find(u => u.id === activeUnitId)?.name}
                </h3>
              </div>
              <div className="p-3 bg-white/10 rounded-2xl">
                 <svg className="w-8 h-8 text-[#d4af37]" fill="currentColor" viewBox="0 0 20 20"><path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3zM6 8a2 2 0 11-4 0 2 2 0 014 0zM16 18v-3a5.972 5.972 0 00-.75-2.906A3.005 3.005 0 0119 15v3h-3zM4.75 12.094A5.973 5.973 0 004 15v3H1v-3a3.005 3.005 0 013.75-2.906z"/></svg>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
               <div className="p-5 bg-white/5 rounded-2xl border border-white/10">
                  <p className="text-[9px] font-black text-green-400 uppercase">Quân số trực tiếp</p>
                  <p className="text-2xl font-black">{activeUnitPersonnelCount}</p>
               </div>
               <div className="p-5 bg-white/5 rounded-2xl border border-white/10">
                  <p className="text-[9px] font-black text-green-400 uppercase">Tổng quân số biên chế</p>
                  <p className="text-2xl font-black">{activeUnitTotalCount}</p>
               </div>
            </div>

            <button 
              onClick={() => exportToCSV(activeUnitId, units.find(u => u.id === activeUnitId)?.name || '')}
              className="w-full mt-6 py-5 bg-white text-[#14452F] rounded-2xl font-black uppercase text-xs tracking-widest hover:bg-[#d4af37] hover:text-white transition-all shadow-xl flex items-center justify-center gap-3"
            >
               <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" strokeWidth="2"/></svg>
               Xuất biên chế chi tiết (.csv)
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default UnitTree;
