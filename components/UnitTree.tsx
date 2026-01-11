import React, { useState, useEffect, useMemo } from 'react';
import { Unit, MilitaryPersonnel } from '../types.ts';
import { db } from '../store.ts';
import { 
  Shield, Folder, FolderOpen, 
  ChevronRight, ChevronDown, 
  Users, Plus, Trash2, Layers, X,
  ShieldCheck, ListFilter,
  Info, Layout, GraduationCap, ShieldAlert,
  ArrowUpRight, AlertCircle, Award, User, Edit3, AlertTriangle
} from 'lucide-react';

interface UnitTreeProps {
  units: Unit[];
  onRefresh: () => void;
  onViewDetailedList: (unitId: string) => void;
}

const UnitTree: React.FC<UnitTreeProps> = ({ units, onRefresh, onViewDetailedList }) => {
  const [activeUnitId, setActiveUnitId] = useState<string | null>(units.length > 0 ? units[0].id : null);
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set(['1']));
  const [allPersonnel, setAllPersonnel] = useState<MilitaryPersonnel[]>([]);
  
  // States for Modals
  const [isAddMode, setIsAddMode] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  
  const [targetParentId, setTargetParentId] = useState<string | null>(null);
  const [editingUnit, setEditingUnit] = useState<Unit | null>(null);
  const [unitToDelete, setUnitToDelete] = useState<Unit | null>(null);
  
  const [newUnitName, setNewUnitName] = useState('');
  const [editUnitName, setEditUnitName] = useState('');

  useEffect(() => {
    const loadPersonnel = async () => {
      // [ĐÃ SỬA LỖI] Truyền true (unlimited) để tải toàn bộ danh sách 
      // cho việc tính toán thống kê chính xác
      const data = await db.getPersonnel({}, true);
      setAllPersonnel(data);
    };
    loadPersonnel();
  }, [units]);

  const activeUnit = useMemo(() => units.find(u => u.id === activeUnitId), [activeUnitId, units]);

  const getAllChildIds = (id: string): string[] => {
    const children = units.filter(u => u.parentId === id);
    let ids = [id];
    children.forEach(child => {
      ids = [...ids, ...getAllChildIds(child.id)];
    });
    return ids;
  };

  const activeUnitMembers = useMemo(() => {
    if (!activeUnitId) return [];
    const relatedIds = getAllChildIds(activeUnitId);
    return allPersonnel.filter(p => relatedIds.includes(p.don_vi_id));
  }, [activeUnitId, allPersonnel, units]);

  const unitStats = useMemo(() => {
    const members = activeUnitMembers;
    const rankMap: Record<string, number> = {};
    members.forEach(m => {
      rankMap[m.cap_bac] = (rankMap[m.cap_bac] || 0) + 1;
    });

    return {
      total: members.length,
      party: members.filter(p => !!p.vao_dang_ngay).length,
      highEdu: members.filter(p => {
        const edu = (p.trinh_do_van_hoa || '').toLowerCase();
        return edu.includes('đại học') || edu.includes('cao đẳng') || edu.includes('thạc sĩ');
      }).length,
      securityAlerts: members.filter(p => db.hasSecurityAlert(p)),
      ranks: rankMap
    };
  }, [activeUnitMembers]);

  const toggleExpand = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const newSet = new Set(expandedIds);
    if (newSet.has(id)) newSet.delete(id);
    else newSet.add(id);
    setExpandedIds(newSet);
  };

  const handleAddUnit = async () => {
    if (!newUnitName.trim()) return;
    await db.addUnit(newUnitName, targetParentId);
    setNewUnitName(''); setIsAddMode(false); onRefresh();
  };

  const handleEditUnit = async () => {
    if (!editingUnit || !editUnitName.trim()) return;
    await db.updateUnit(editingUnit.id, editUnitName);
    setEditingUnit(null); setIsEditMode(false); onRefresh();
  };

  const handleDeleteUnit = async () => {
    if (!unitToDelete) return;
    await db.deleteUnit(unitToDelete.id);
    if (activeUnitId === unitToDelete.id) setActiveUnitId(null);
    setUnitToDelete(null); setIsDeleteConfirmOpen(false); onRefresh();
  };

  const renderTree = (parentId: string | null, level: number = 0) => {
    const childUnits = units.filter(u => u.parentId === parentId);
    return childUnits.map(unit => {
      const isExpanded = expandedIds.has(unit.id);
      const hasChildren = units.some(u => u.parentId === unit.id);
      const isActive = activeUnitId === unit.id;
      return (
        <div key={unit.id} className="relative group/item">
          {level > 0 && (
             <div className="absolute left-[-10px] top-0 bottom-0 w-[1px] bg-slate-200" />
          )}
          <div 
            onClick={() => setActiveUnitId(unit.id)}
            className={`flex items-center gap-2 py-1.5 px-2 rounded-lg cursor-pointer transition-all mb-1 group ${isActive ? 'bg-[#14452F] text-white' : 'hover:bg-slate-100 text-slate-600'}`}
            style={{ marginLeft: `${level * 16}px` }}
          >
            <div onClick={(e) => hasChildren && toggleExpand(unit.id, e)} className="p-1">
              {hasChildren ? (isExpanded ? <ChevronDown size={12}/> : <ChevronRight size={12}/>) : <div className="w-3"/>}
            </div>
            {isExpanded ? <FolderOpen size={14} className="text-amber-500"/> : <Folder size={14} className="text-amber-500"/>}
            <span className="text-[12px] font-bold uppercase truncate flex-1">{unit.name}</span>
            
            {/* Action Buttons for Unit Tree Items */}
            <div className="hidden group-hover:flex items-center gap-1">
                <button 
                  onClick={(e) => { e.stopPropagation(); setEditingUnit(unit); setEditUnitName(unit.name); setIsEditMode(true); }}
                  className={`p-1 rounded hover:bg-white/20 ${isActive ? 'text-white/60 hover:text-white' : 'text-slate-400 hover:text-blue-600'}`}
                >
                  <Edit3 size={12} />
                </button>
                {unit.id !== '1' && (
                  <button 
                    onClick={(e) => { e.stopPropagation(); setUnitToDelete(unit); setIsDeleteConfirmOpen(true); }}
                    className={`p-1 rounded hover:bg-white/20 ${isActive ? 'text-white/60 hover:text-white' : 'text-slate-400 hover:text-red-500'}`}
                  >
                    <Trash2 size={12} />
                  </button>
                )}
            </div>
          </div>
          {isExpanded && renderTree(unit.id, level + 1)}
        </div>
      );
    });
  };

  return (
    <div className="flex h-full gap-5 animate-fade-in overflow-hidden">
      
      {/* CỘT 1: SIDEBAR CÂY ĐƠN VỊ */}
      <div className="w-64 bg-white rounded-2xl shadow-sm border border-slate-200 flex flex-col shrink-0">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
            <Layout size={14}/> Sơ đồ đơn vị
          </h3>
          <button onClick={() => { setTargetParentId(null); setIsAddMode(true); }} className="p-1.5 hover:bg-slate-100 rounded text-[#14452F]"><Plus size={16}/></button>
        </div>
        <div className="flex-1 overflow-y-auto p-3 scrollbar-hide">
          {renderTree(null)}
        </div>
      </div>

      {/* CỘT 2 & 3: CHI TIẾT & PHÂN TÍCH */}
      <div className="flex-1 flex flex-col gap-5 min-w-0">
        
        {activeUnit ? (
          <div className="flex-1 grid grid-cols-12 gap-5 overflow-hidden">
            
            {/* PANEL CHÍNH (Cột 2) */}
            <div className="col-span-8 flex flex-col gap-5 overflow-y-auto pr-2 scrollbar-hide">
                <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-[#14452F]/5 rounded-bl-full -mr-10 -mt-10" />
                    <div className="flex items-center gap-4 mb-6">
                        <div className="w-14 h-14 bg-slate-50 rounded-2xl flex items-center justify-center text-[#14452F] border border-slate-100 shadow-inner">
                            <Shield size={28} />
                        </div>
                        <div>
                            <h2 className="text-xl font-black text-slate-800 uppercase tracking-tight leading-none mb-1">{activeUnit.name}</h2>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1">
                                <Info size={10}/> Quản lý đơn vị trực thuộc
                            </p>
                        </div>
                        <div className="ml-auto flex gap-2">
                             <button 
                                onClick={() => { setEditingUnit(activeUnit); setEditUnitName(activeUnit.name); setIsEditMode(true); }}
                                className="p-2 bg-slate-50 border border-slate-100 rounded-lg text-slate-400 hover:text-blue-600 transition-all"
                             >
                                <Edit3 size={18} />
                             </button>
                             {activeUnit.id !== '1' && (
                               <button 
                                  onClick={() => { setUnitToDelete(activeUnit); setIsDeleteConfirmOpen(true); }}
                                  className="p-2 bg-slate-50 border border-slate-100 rounded-lg text-slate-400 hover:text-red-500 transition-all"
                               >
                                  <Trash2 size={18} />
                               </button>
                             )}
                        </div>
                    </div>

                    <div className="grid grid-cols-4 gap-3">
                        {[
                          { label: 'Quân số', val: unitStats.total, icon: Users, color: 'text-blue-600', bg: 'bg-blue-50' },
                          { label: 'Đảng viên', val: unitStats.party, icon: ShieldCheck, color: 'text-red-600', bg: 'bg-red-50' },
                          { label: 'Trình độ cao', val: unitStats.highEdu, icon: GraduationCap, color: 'text-purple-600', bg: 'bg-purple-50' },
                          { label: 'Cảnh báo', val: unitStats.securityAlerts.length, icon: ShieldAlert, color: 'text-amber-600', bg: 'bg-amber-50' },
                        ].map((s, idx) => (
                           <div key={idx} className="p-3 bg-slate-50/50 rounded-xl border border-slate-100 flex flex-col items-center text-center">
                              <div className={`p-1.5 rounded-lg ${s.bg} ${s.color} mb-1`}><s.icon size={16}/></div>
                              <p className="text-[8px] font-bold text-slate-400 uppercase mb-1">{s.label}</p>
                              <span className="text-xl font-black text-slate-800">{s.val}</span>
                           </div>
                        ))}
                    </div>
                </div>

                <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
                    <h4 className="text-[11px] font-black text-slate-800 uppercase mb-4 flex items-center gap-2">
                        <Award size={16} className="text-[#14452F]"/> Phân bổ cấp bậc trong đơn vị
                    </h4>
                    <div className="space-y-3">
                        {Object.entries(unitStats.ranks).sort((a,b) => b[1] - a[1]).map(([rank, count]) => (
                            <div key={rank}>
                                <div className="flex justify-between text-[10px] font-bold uppercase mb-1">
                                    <span className="text-slate-600">{rank}</span>
                                    <span className="text-slate-400">{count} người ({Math.round(count/unitStats.total*100)}%)</span>
                                </div>
                                <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                                    <div className="h-full bg-[#14452F] rounded-full" style={{ width: `${(count/unitStats.total)*100}%` }} />
                                </div>
                            </div>
                        ))}
                        {Object.keys(unitStats.ranks).length === 0 && (
                            <div className="py-10 text-center opacity-20 text-[10px] uppercase font-bold italic tracking-widest">Không có dữ liệu cấp bậc</div>
                        )}
                    </div>
                </div>

                <div className="flex gap-4">
                    <button 
                        onClick={() => onViewDetailedList(activeUnit.id)}
                        className="flex-1 py-4 bg-[#14452F] text-white rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-lg hover:bg-green-800 transition-all flex items-center justify-center gap-2"
                    >
                        <ListFilter size={16}/> Xem danh sách toàn đơn vị
                    </button>
                    <button 
                        onClick={() => { setTargetParentId(activeUnit.id); setIsAddMode(true); }}
                        className="flex-1 py-4 bg-white border-2 border-slate-100 text-slate-600 rounded-2xl font-black uppercase text-[10px] tracking-widest hover:bg-slate-50 transition-all"
                    >
                        Thêm đơn vị con
                    </button>
                </div>
            </div>

            <div className="col-span-4 flex flex-col gap-5 overflow-hidden">
                <div className="flex-1 bg-white rounded-2xl border border-slate-200 shadow-sm flex flex-col overflow-hidden">
                    <div className="p-4 bg-amber-50/50 border-b border-amber-100 flex items-center justify-between">
                        <h4 className="text-[11px] font-black text-amber-700 uppercase flex items-center gap-2">
                           <AlertCircle size={14}/> Danh sách cảnh báo đỏ
                        </h4>
                        <span className="bg-amber-100 text-amber-700 text-[9px] font-black px-1.5 py-0.5 rounded-full">{unitStats.securityAlerts.length}</span>
                    </div>
                    <div className="flex-1 overflow-y-auto p-4 space-y-3 scrollbar-hide">
                        {unitStats.securityAlerts.map(p => (
                            <div key={p.id} className="p-3 bg-white border border-slate-100 rounded-xl hover:border-amber-300 transition-all group">
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
                                        <User size={14}/>
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-[11px] font-black text-slate-800 uppercase truncate">{p.ho_ten}</p>
                                        <p className="text-[9px] text-slate-400 font-bold truncate italic">{p.cap_bac} - {p.chuc_vu || 'Chiến sĩ'}</p>
                                    </div>
                                    <button className="opacity-0 group-hover:opacity-100 text-amber-500 transition-opacity"><ArrowUpRight size={14}/></button>
                                </div>
                            </div>
                        ))}
                        {unitStats.securityAlerts.length === 0 && (
                            <div className="h-full flex flex-col items-center justify-center opacity-30 text-center p-10">
                                <ShieldCheck size={40} className="mb-2 text-green-500"/>
                                <p className="text-[10px] font-bold uppercase tracking-widest">Đơn vị an toàn</p>
                            </div>
                        )}
                    </div>
                </div>

                <div className="h-1/3 bg-[#14452F] rounded-2xl p-5 text-white flex flex-col justify-between relative overflow-hidden shadow-xl">
                    <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-white/5 rounded-full" />
                    <h5 className="text-[10px] font-black uppercase tracking-widest opacity-60">Chỉ số chất lượng đơn vị</h5>
                    <div className="flex items-end justify-between relative z-10">
                        <span className="text-4xl font-black">
                            {unitStats.total > 0 ? Math.round((unitStats.party / unitStats.total) * 100) : 0}%
                        </span>
                        <p className="text-[9px] font-bold uppercase text-right leading-tight opacity-80">
                            Tỷ lệ <br/> Đảng viên
                        </p>
                    </div>
                    <div className="w-full h-1.5 bg-white/10 rounded-full mt-4">
                        <div 
                           className="h-full bg-amber-400 rounded-full" 
                           style={{ width: `${unitStats.total > 0 ? (unitStats.party / unitStats.total) * 100 : 0}%` }} 
                        />
                    </div>
                </div>
            </div>

          </div>
        ) : (
          <div className="flex-1 bg-white rounded-3xl border-2 border-dashed border-slate-200 flex flex-col items-center justify-center text-slate-300">
            <Layers size={64} strokeWidth={1} className="mb-4 opacity-20" />
            <p className="text-[12px] font-black uppercase tracking-[0.2em]">Chọn đơn vị để phân tích dữ liệu</p>
          </div>
        )}
      </div>

      {/* MODAL THÊM ĐƠN VỊ */}
      {isAddMode && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-fade-in">
          <div className="bg-white w-full max-w-sm rounded-3xl shadow-2xl p-6 border border-slate-200">
            <div className="flex justify-between items-center mb-6">
              <h4 className="text-sm font-black text-slate-800 uppercase tracking-tight">Thêm đơn vị mới</h4>
              <button onClick={() => setIsAddMode(false)} className="p-1 text-slate-400 hover:text-red-500"><X size={20}/></button>
            </div>
            <div className="space-y-4">
                <div>
                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-1 block">Tên đơn vị</label>
                    <input 
                        autoFocus
                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-[#14452F] uppercase outline-none focus:ring-4 ring-green-50/5 transition-all"
                        value={newUnitName}
                        onChange={(e) => setNewUnitName(e.target.value)}
                        placeholder="TIỂU ĐOÀN..."
                    />
                </div>
                <div className="flex gap-3">
                    <button onClick={() => setIsAddMode(false)} className="flex-1 py-3 bg-slate-100 text-slate-500 rounded-xl font-bold uppercase text-[10px]">Hủy</button>
                    <button onClick={handleAddUnit} className="flex-1 py-3 bg-[#14452F] text-white rounded-xl font-bold uppercase text-[10px] shadow-lg">Xác nhận</button>
                </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL SỬA ĐƠN VỊ */}
      {isEditMode && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-fade-in">
          <div className="bg-white w-full max-w-sm rounded-3xl shadow-2xl p-6 border border-slate-200">
            <div className="flex justify-between items-center mb-6">
              <h4 className="text-sm font-black text-slate-800 uppercase tracking-tight">Sửa tên đơn vị</h4>
              <button onClick={() => setIsEditMode(false)} className="p-1 text-slate-400 hover:text-red-500"><X size={20}/></button>
            </div>
            <div className="space-y-4">
                <div>
                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-1 block">Tên đơn vị hiện tại</label>
                    <input 
                        autoFocus
                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-[#14452F] uppercase outline-none focus:ring-4 ring-green-50/5 transition-all"
                        value={editUnitName}
                        onChange={(e) => setEditUnitName(e.target.value)}
                    />
                </div>
                <div className="flex gap-3">
                    <button onClick={() => setIsEditMode(false)} className="flex-1 py-3 bg-slate-100 text-slate-500 rounded-xl font-bold uppercase text-[10px]">Hủy</button>
                    <button onClick={handleEditUnit} className="flex-1 py-3 bg-blue-600 text-white rounded-xl font-bold uppercase text-[10px] shadow-lg">Cập nhật</button>
                </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL XÁC NHẬN XÓA */}
      {isDeleteConfirmOpen && unitToDelete && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-fade-in">
          <div className="bg-white w-full max-w-sm rounded-3xl shadow-2xl p-6 border border-slate-200">
            <div className="flex flex-col items-center text-center mb-6">
              <div className="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center mb-4">
                 <AlertTriangle size={32} />
              </div>
              <h4 className="text-sm font-black text-slate-800 uppercase tracking-tight">Xác nhận xóa đơn vị?</h4>
              <p className="text-[10px] font-bold text-slate-400 mt-2 uppercase leading-relaxed">
                 Hành động này sẽ xóa đơn vị <span className="text-red-600">"{unitToDelete.name}"</span> và TOÀN BỘ đơn vị trực thuộc bên trong.
              </p>
            </div>
            <div className="flex gap-3">
                <button onClick={() => setIsDeleteConfirmOpen(false)} className="flex-1 py-3 bg-slate-100 text-slate-500 rounded-xl font-bold uppercase text-[10px]">Hủy bỏ</button>
                <button onClick={handleDeleteUnit} className="flex-1 py-3 bg-red-600 text-white rounded-xl font-bold uppercase text-[10px] shadow-lg">Đồng ý xóa</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UnitTree;