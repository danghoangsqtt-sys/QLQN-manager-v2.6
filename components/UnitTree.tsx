
import React, { useState, useEffect, useMemo } from 'react';
import { Unit, MilitaryPersonnel } from '../types';
import { db } from '../store';
import { 
  Shield, Flag, Target, Folder, 
  ChevronRight, ChevronDown, 
  Users, ListFilter, Plus,
  Trash2, Landmark, MoreHorizontal,
  UserCheck, Layers
} from 'lucide-react';

interface UnitTreeProps {
  units: Unit[];
  onRefresh: () => void;
  onViewDetailedList: (unitId: string) => void;
}

const UnitTree: React.FC<UnitTreeProps> = ({ units, onRefresh, onViewDetailedList }) => {
  const [activeUnitId, setActiveUnitId] = useState<string | null>(null);
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set(['1']));
  const [allPersonnel, setAllPersonnel] = useState<MilitaryPersonnel[]>([]);
  const [newUnitName, setNewUnitName] = useState('');
  const [isAddMode, setIsAddMode] = useState(false);
  const [targetParentId, setTargetParentId] = useState<string | null>(null);

  useEffect(() => {
    const loadPersonnel = async () => {
      const data = await db.getPersonnel();
      setAllPersonnel(data);
    };
    loadPersonnel();
  }, [units]);

  // Icon thông minh
  const getUnitIcon = (name: string, level: number) => {
    const n = name.toLowerCase();
    if (n.includes('sư đoàn')) return <Shield size={14} className="text-green-700" />;
    if (n.includes('trung đoàn')) return <Flag size={14} className="text-amber-600" />;
    if (n.includes('tiểu đoàn')) return <Target size={14} className="text-emerald-600" />;
    if (n.includes('đại đội') || n.includes('trung đội') || n.includes('đội') || n.includes('ban')) return <Folder size={14} className="text-blue-500" />;
    return level === 0 ? <Shield size={14} /> : <Folder size={14} />;
  };

  // Tính toán số liệu thống kê (bao gồm đệ quy con)
  const unitStats = useMemo(() => {
    const stats: Record<string, { total: number; party: number }> = {};
    
    const getBranchPersonnel = (uId: string): MilitaryPersonnel[] => {
      let results = allPersonnel.filter(p => p.don_vi_id === uId);
      units.filter(u => u.parentId === uId).forEach(child => {
        results = [...results, ...getBranchPersonnel(child.id)];
      });
      return results;
    };

    units.forEach(u => {
      const branchPersonnel = getBranchPersonnel(u.id);
      const uniquePersonnel = Array.from(new Set(branchPersonnel.map(p => p.id)))
        .map(id => branchPersonnel.find(p => p.id === id)!);
      
      const partyCount = uniquePersonnel.filter(p => !!p.vao_dang_ngay).length;
      stats[u.id] = { total: uniquePersonnel.length, party: partyCount };
    });

    return stats;
  }, [allPersonnel, units]);

  const toggleExpand = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const next = new Set(expandedIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setExpandedIds(next);
  };

  const handleAddUnit = async () => {
    if (!newUnitName) return;
    await db.addUnit(newUnitName, targetParentId);
    setNewUnitName('');
    setIsAddMode(false);
    onRefresh();
  };

  const handleDeleteUnit = async (id: string) => {
    if (confirm(`Bạn có chắc chắn muốn xóa đơn vị này và tất cả các đơn vị con trực thuộc?`)) {
      await db.deleteUnit(id);
      setActiveUnitId(null);
      onRefresh();
    }
  };

  const activeUnit = units.find(u => u.id === activeUnitId);
  const activeStats = activeUnitId ? unitStats[activeUnitId] : null;

  const renderSidebarItem = (parentId: string | null = null, level: number = 0) => {
    const children = units.filter(u => u.parentId === parentId);
    return (
      <div className={`${level > 0 ? 'ml-3 border-l border-slate-100 pl-2' : ''} space-y-0.5 mt-0.5`}>
        {children.map(unit => {
          const isExpanded = expandedIds.has(unit.id);
          const hasChildren = units.some(u => u.parentId === unit.id);
          const isActive = activeUnitId === unit.id;
          const stats = unitStats[unit.id];

          return (
            <div key={unit.id} className="select-none">
              <div 
                onClick={() => setActiveUnitId(unit.id)}
                className={`group flex items-center justify-between px-2 py-1.5 rounded-lg cursor-pointer transition-all ${
                  isActive 
                  ? 'bg-[#14452F] text-white shadow-md' 
                  : 'hover:bg-slate-50 text-slate-600'
                }`}
              >
                <div className="flex items-center gap-2 overflow-hidden">
                  <div onClick={(e) => toggleExpand(unit.id, e)} className="p-0.5 hover:bg-black/5 rounded cursor-pointer shrink-0">
                    {hasChildren ? (
                      isExpanded ? <ChevronDown size={12} className={isActive ? 'text-white' : 'text-slate-400'} /> : <ChevronRight size={12} className={isActive ? 'text-white' : 'text-slate-400'} />
                    ) : <div className="w-3" />}
                  </div>
                  <div className="shrink-0">{getUnitIcon(unit.name, level)}</div>
                  <span className={`text-[11px] font-bold truncate tracking-tight uppercase ${isActive ? 'text-white' : 'text-slate-700'}`}>
                    {unit.name}
                  </span>
                </div>
                <div className={`text-[8px] font-black px-1.5 py-0.5 rounded tracking-tighter shrink-0 ${
                  isActive ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-400'
                }`}>
                  {stats?.total || 0} QN
                </div>
              </div>
              {isExpanded && renderSidebarItem(unit.id, level + 1)}
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="flex flex-col h-full animate-fade-in px-4">
      <div className="mb-6">
        <h1 className="text-xl font-black text-[#14452F] uppercase tracking-tighter">Biên chế tổ chức</h1>
        <p className="text-[10px] text-slate-400 font-bold uppercase mt-0.5">Quản lý sơ đồ đơn vị và quân số đệ quy.</p>
      </div>

      <div className="flex-1 grid grid-cols-12 gap-6 min-h-0">
        {/* Sidebar */}
        <div className="col-span-12 lg:col-span-4 bg-white rounded-3xl border border-slate-100 shadow-sm flex flex-col overflow-hidden">
          <div className="px-5 py-3 border-b flex justify-between items-center bg-slate-50/50">
            <h3 className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em]">Danh mục đơn vị</h3>
            <button 
              onClick={() => { setTargetParentId(null); setIsAddMode(true); }}
              className="p-1.5 bg-white border border-slate-200 text-[#14452F] rounded-lg hover:bg-slate-50 transition-all shadow-sm"
              title="Thêm đơn vị cấp cao nhất"
            >
              <Plus size={14} />
            </button>
          </div>
          <div className="flex-1 overflow-y-auto p-3 scrollbar-hide">
            {renderSidebarItem(null)}
          </div>
        </div>

        {/* Dashboard */}
        <div className="col-span-12 lg:col-span-8 h-full">
          {activeUnitId && activeStats ? (
            <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-lg p-10 flex flex-col gap-8 h-full">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 bg-slate-50 border border-slate-100 rounded-2xl flex items-center justify-center text-[#14452F] shadow-inner">
                    <Landmark size={24} />
                  </div>
                  <div>
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] mb-0.5">Đơn vị đang xem</p>
                    <h2 className="text-2xl font-black text-[#14452F] tracking-tighter uppercase leading-none">{activeUnit?.name}</h2>
                  </div>
                </div>
                <button 
                  onClick={() => handleDeleteUnit(activeUnitId)}
                  className="p-3 text-red-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
                  title="Xóa đơn vị này"
                >
                  <Trash2 size={20} />
                </button>
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div className="bg-slate-50 border border-slate-100 rounded-[2rem] p-8 flex flex-col items-center justify-center text-center">
                  <Users size={20} className="text-slate-300 mb-4" />
                  <p className="text-[10px] font-black text-slate-400 uppercase mb-2">Tổng quân số (Gồm đơn vị con)</p>
                  <div className="flex items-baseline gap-1">
                    <span className="text-4xl font-black text-slate-800 tracking-tighter">{activeStats.total}</span>
                    <span className="text-[10px] font-black text-slate-400 uppercase">QN</span>
                  </div>
                </div>

                <div className="bg-red-50/50 border border-red-100 rounded-[2rem] p-8 flex flex-col items-center justify-center text-center">
                  <UserCheck size={20} className="text-red-300 mb-4" />
                  <p className="text-[10px] font-black text-red-800/40 uppercase mb-2">Đảng viên</p>
                  <div className="flex items-baseline gap-1">
                    <span className="text-4xl font-black text-red-600 tracking-tighter">{activeStats.party}</span>
                    <span className="text-[10px] font-black text-red-300 uppercase">Đ/C</span>
                  </div>
                </div>
              </div>

              <div className="mt-auto flex flex-col gap-3 pt-6 border-t border-slate-50">
                <button 
                  onClick={() => onViewDetailedList(activeUnitId)}
                  className="w-full py-5 bg-[#14452F] text-white rounded-2xl font-black uppercase text-xs tracking-[0.2em] shadow-xl hover:bg-green-800 transition-all flex items-center justify-center gap-3"
                >
                  <ListFilter size={20} /> Danh sách chi tiết toàn đơn vị
                </button>
                
                <button 
                  onClick={() => { setTargetParentId(activeUnitId); setIsAddMode(true); }}
                  className="w-full py-5 bg-white border border-slate-200 text-slate-600 rounded-2xl font-black uppercase text-xs tracking-widest hover:bg-slate-50 transition-all flex items-center justify-center gap-3"
                >
                  <Layers size={20} className="text-blue-500" /> Thêm đơn vị trực thuộc
                </button>
              </div>
            </div>
          ) : (
            <div className="h-full bg-white rounded-[2.5rem] border border-slate-100 border-dashed flex flex-col items-center justify-center text-slate-200 p-10 text-center">
              <Shield size={60} className="opacity-10 mb-6" />
              <h3 className="text-xs font-black uppercase tracking-[0.3em]">Chọn một đơn vị để quản lý</h3>
            </div>
          )}
        </div>
      </div>

      {isAddMode && (
        <div className="fixed inset-0 z-[600] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white w-full max-w-sm rounded-3xl p-8 shadow-2xl space-y-6 border border-white/20">
            <div>
              <h3 className="text-lg font-black text-[#14452F] uppercase tracking-tighter">Thêm đơn vị mới</h3>
              <p className="text-[10px] text-slate-400 font-bold uppercase mt-1">
                {targetParentId ? `Trực thuộc: ${units.find(u => u.id === targetParentId)?.name}` : 'Cấp cao nhất'}
              </p>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="text-[9px] font-black text-slate-400 uppercase mb-1.5 block ml-1 tracking-widest">Tên đơn vị</label>
                <input 
                  autoFocus
                  className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none font-bold text-sm text-slate-700 placeholder:text-slate-300"
                  value={newUnitName}
                  onChange={(e) => setNewUnitName(e.target.value)}
                  placeholder="VD: Tiểu đoàn 1, Đại đội 2..."
                  onKeyDown={e => e.key === 'Enter' && handleAddUnit()}
                />
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <button onClick={() => setIsAddMode(false)} className="flex-1 py-4 bg-slate-100 text-slate-400 rounded-xl font-black uppercase text-[10px] tracking-widest">Hủy bỏ</button>
              <button onClick={handleAddUnit} className="flex-1 py-4 bg-[#14452F] text-white rounded-xl font-black uppercase text-[10px] tracking-widest shadow-lg shadow-green-900/10 hover:bg-green-800 transition-all">Lưu đơn vị</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UnitTree;
