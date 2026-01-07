
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
  const [allPersonnel, setAllPersonnel] = useState<MilitaryPersonnel[]>([]);
  const [counts, setCounts] = useState<{ [key: string]: { direct: number; total: number } }>({});

  // Tải toàn bộ quân nhân một lần duy nhất khi mount
  useEffect(() => {
    const loadData = async () => {
      const data = await db.getPersonnel();
      setAllPersonnel(data);
    };
    loadData();
  }, [units]);

  // Tính toán tất cả số lượng quân số cho toàn bộ cây
  useEffect(() => {
    const newCounts: { [key: string]: { direct: number; total: number } } = {};
    
    const getChildUnits = (parentId: string): string[] => {
      let ids = [parentId];
      const children = units.filter(u => u.parentId === parentId);
      children.forEach(child => {
        ids = [...ids, ...getChildUnits(child.id)];
      });
      return ids;
    };

    units.forEach(unit => {
      const direct = allPersonnel.filter(p => p.don_vi_id === unit.id).length;
      const allUnitIdsInBranch = getChildUnits(unit.id);
      const total = allPersonnel.filter(p => allUnitIdsInBranch.includes(p.don_vi_id)).length;
      newCounts[unit.id] = { direct, total };
    });

    setCounts(newCounts);
  }, [allPersonnel, units]);

  const handleAdd = async () => {
    if (!newUnitName) {
      alert('Vui lòng nhập tên đơn vị!');
      return;
    }
    await db.addUnit(newUnitName, selectedParent);
    setNewUnitName('');
    onRefresh();
  };

  const exportToCSV = async (unitId: string, unitName: string) => {
    let listToExport: MilitaryPersonnel[] = [];
    
    if (unitId === 'all') {
      listToExport = allPersonnel;
    } else {
      const getChildUnits = (pId: string): string[] => {
        let ids = [pId];
        units.filter(u => u.parentId === pId).forEach(c => {
          ids = [...ids, ...getChildUnits(c.id)];
        });
        return ids;
      };
      const allIds = getChildUnits(unitId);
      listToExport = allPersonnel.filter(p => allIds.includes(p.don_vi_id));
    }
    
    if (listToExport.length === 0) {
      alert(`Đơn vị ${unitName} hiện chưa có quân nhân nào.`);
      return;
    }

    let csvContent = "\ufeff"; 
    csvContent += "CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM\nĐộc lập - Tự do - Hạnh phúc\n\n";
    csvContent += `DANH SÁCH BIÊN CHẾ QUÂN NHÂN - ĐƠN VỊ: ${unitName.toUpperCase()}\n`;
    csvContent += `Ngày xuất dữ liệu: ${new Date().toLocaleDateString('vi-VN')}\n\n`;

    const headers = ["STT", "Họ và tên", "Cấp bậc", "Chức vụ", "Ngày sinh", "Số CCCD", "SĐT", "HKTT", "Nhập ngũ", "Vào Đảng", "Học vấn"];
    csvContent += headers.join(",") + "\n";

    listToExport.forEach((p, index) => {
      const row = [
        index + 1,
        `"${p.ho_ten}"`,
        `"${p.cap_bac}"`,
        `"${p.chuc_vu}"`,
        `"${p.ngay_sinh}"`,
        `"'${p.cccd}"`, 
        `"${p.sdt_rieng}"`,
        `"${(p.ho_khau_thu_tru || '').replace(/"/g, '""')}"`, 
        `"${p.nhap_ngu_ngay}"`,
        `"${p.vao_dang_ngay || 'Chưa vào Đảng'}"`,
        `"${p.trinh_do_van_hoa}"`
      ];
      csvContent += row.join(",") + "\n";
    });

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `BIEN_CHE_${unitName.replace(/\s+/g, '_').toUpperCase()}_${Date.now()}.csv`;
    link.click();
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
                <div className="flex flex-col">
                  <span className="text-xs font-black uppercase tracking-tight">{unit.name}</span>
                  <span className={`text-[8px] font-bold ${activeUnitId === unit.id ? 'text-green-300' : 'text-gray-400'}`}>
                    Quân số: {counts[unit.id]?.total || 0}
                  </span>
                </div>
              </div>
              
              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button 
                  onClick={(e) => { e.stopPropagation(); setSelectedParent(unit.id); }}
                  className="p-1.5 bg-green-500/20 text-green-700 rounded-md hover:bg-green-500 hover:text-white transition-colors"
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M12 4v16m8-8H4" strokeWidth="2.5"/></svg>
                </button>
                <button 
                  onClick={(e) => { e.stopPropagation(); if(confirm(`Xóa đơn vị ${unit.name}?`)) { db.deleteUnit(unit.id).then(onRefresh); } }}
                  className="p-1.5 bg-red-500/20 text-red-700 rounded-md hover:bg-red-500 hover:text-white transition-colors"
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
      <div className="col-span-12 flex justify-between items-center bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
        <div>
          <h2 className="text-sm font-black text-[#14452F] uppercase tracking-widest flex items-center gap-3">
             <div className="w-2 h-6 bg-[#d4af37] rounded-full"></div>
             Quản lý Cơ cấu Tổ chức
          </h2>
          <p className="text-[10px] text-gray-400 font-bold uppercase mt-1">Sơ đồ phân cấp đơn vị chiến đấu</p>
        </div>
        <button onClick={() => exportToCSV('all', 'TOÀN ĐƠN VỊ')} className="gold-btn px-6 py-3 rounded-xl font-black text-[10px] uppercase shadow-lg flex items-center gap-2">
           <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" strokeWidth="2"/></svg>
           Xuất biên chế tổng (.csv)
        </button>
      </div>

      <div className="col-span-12 lg:col-span-5 bg-white rounded-[2rem] shadow-xl border border-gray-100 overflow-hidden flex flex-col h-[750px]">
        <div className="p-8 border-b bg-gray-50/50 flex justify-between items-center">
           <h3 className="flex items-center gap-3 font-black text-[#14452F] uppercase text-xs">
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
          {renderTree(null)}
        </div>
      </div>

      <div className="col-span-12 lg:col-span-7 space-y-8">
        <div className="bg-white p-10 rounded-[2.5rem] shadow-2xl border border-gray-100 relative overflow-hidden">
           <h3 className="flex items-center gap-3 font-black text-[#14452F] uppercase text-sm mb-10 pb-4 border-b">Thêm Đơn Vị Mới</h3>
           <div className="space-y-8">
              <div className="grid grid-cols-2 gap-8">
                <div>
                  <label className="block text-[11px] font-black text-gray-400 mb-3 uppercase">Tên Đơn Vị</label>
                  <input type="text" className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl outline-none font-black text-[#14452F]" value={newUnitName} onChange={e => setNewUnitName(e.target.value)} />
                </div>
                <div>
                  <label className="block text-[11px] font-black text-gray-400 mb-3 uppercase">Trực Thuộc</label>
                  <select className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl outline-none font-black text-xs" value={selectedParent || ''} onChange={e => setSelectedParent(e.target.value || null)}>
                    <option value="">-- Cấp cao nhất --</option>
                    {units.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                  </select>
                </div>
              </div>
              <div className="flex justify-end">
                <button onClick={handleAdd} className="px-12 py-5 military-green text-white rounded-[1.5rem] font-black uppercase text-xs tracking-widest shadow-2xl active:scale-95 transition-all">Lưu Đơn Vị</button>
              </div>
           </div>
        </div>

        {activeUnitId && counts[activeUnitId] && (
          <div className="bg-[#14452F] p-8 rounded-[2.5rem] shadow-2xl text-white animate-slide-up">
            <h3 className="text-2xl font-black uppercase tracking-tighter mb-6">{units.find(u => u.id === activeUnitId)?.name}</h3>
            <div className="grid grid-cols-2 gap-4">
               <div className="p-5 bg-white/5 rounded-2xl border border-white/10">
                  <p className="text-[9px] font-black text-green-400 uppercase">Trực tiếp</p>
                  <p className="text-2xl font-black">{counts[activeUnitId].direct}</p>
               </div>
               <div className="p-5 bg-white/5 rounded-2xl border border-white/10">
                  <p className="text-[9px] font-black text-green-400 uppercase">Toàn đơn vị con</p>
                  <p className="text-2xl font-black">{counts[activeUnitId].total}</p>
               </div>
            </div>
            <button onClick={() => exportToCSV(activeUnitId, units.find(u => u.id === activeUnitId)?.name || '')} className="w-full mt-6 py-5 bg-white text-[#14452F] rounded-2xl font-black uppercase text-xs shadow-xl flex items-center justify-center gap-3">Xuất biên chế (.csv)</button>
          </div>
        )}
      </div>
    </div>
  );
};

export default UnitTree;
