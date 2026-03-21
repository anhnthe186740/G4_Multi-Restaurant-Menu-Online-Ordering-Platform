import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getOwnerBranches } from '../api/ownerApi';
import RestaurantOwnerLayout from '../components/owner/RestaurantOwnerLayout';
import { GitBranch, ChevronRight, Play, Utensils, LayoutGrid } from 'lucide-react';

export default function OwnerKitchenTracking() {
    const [branches, setBranches] = useState([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        const fetchBranches = async () => {
            try {
                const response = await getOwnerBranches();
                setBranches(response.data.branches || []);
            } catch (error) {
                console.error("Error fetching branches:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchBranches();
    }, []);

    const handleOpenKDS = (branchID, categoryID = null) => {
        const url = categoryID
            ? `/owner/kds/${branchID}?categoryID=${categoryID}`
            : `/owner/kds/${branchID}`;
        navigate(url);
    };

    return (
        <RestaurantOwnerLayout>
            <div className="p-6 max-w-7xl mx-auto">
                <div className="mb-8">
                    <h1 className="text-2xl font-bold text-slate-800 mb-2">Theo dõi đơn hàng bếp</h1>
                    <p className="text-slate-500">Chọn chi nhánh và khu vực làm việc để bắt đầu theo dõi tiến độ</p>
                </div>

                {loading ? (
                    <div className="flex justify-center py-20">
                        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-500"></div>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {branches.map((branch) => (
                            <div key={branch.branchID} className="bg-white border border-slate-100 rounded-2xl overflow-hidden group hover:border-blue-500/50 transition-all shadow-sm hover:shadow-md">
                                <div className="p-5 border-b border-slate-100 flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600 border border-blue-100">
                                            <GitBranch size={20} />
                                        </div>
                                        <div>
                                            <h3 className="text-slate-800 font-bold">{branch.name}</h3>
                                            <p className="text-slate-400 text-xs truncate max-w-[150px]">{branch.address}</p>
                                        </div>
                                    </div>
                                    <span className={`px-2 py-1 rounded-full text-[10px] font-bold ${branch.isActive ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 'bg-red-50 text-red-600 border border-red-100'}`}>
                                        {branch.isActive ? 'HOẠT ĐỘNG' : 'TẠM DỪNG'}
                                    </span>
                                </div>
                                <div className="p-5 space-y-4">
                                    <div className="space-y-2">
                                        <p className="text-[10px] font-bold text-slate-400 tracking-widest uppercase">KHU VỰC THEO DÕI</p>

                                        {/* Toàn bộ bếp */}
                                        <button
                                            onClick={() => handleOpenKDS(branch.branchID)}
                                            className="w-full flex items-center justify-between p-3 rounded-xl bg-slate-50 hover:bg-blue-50 group/btn transition-all border border-slate-100 hover:border-blue-200 text-left"
                                        >
                                            <div className="flex items-center gap-3">
                                                <LayoutGrid size={16} className="text-slate-400 group-hover/btn:text-blue-600" />
                                                <span className="text-slate-700 font-medium group-hover/btn:text-blue-600">Tất cả khu vực</span>
                                            </div>
                                            <Play size={14} className="text-slate-300 group-hover/btn:text-blue-600" />
                                        </button>

                                        {/* Mock categories for demo */}
                                        <button
                                            onClick={() => handleOpenKDS(branch.branchID)}
                                            className="w-full flex items-center justify-between p-3 rounded-xl bg-slate-50 hover:bg-emerald-50 group/btn transition-all border border-slate-100 hover:border-emerald-200 text-left"
                                        >
                                            <div className="flex items-center gap-3">
                                                <Utensils size={16} className="text-slate-400 group-hover/btn:text-emerald-600" />
                                                <span className="text-slate-700 font-medium group-hover/btn:text-emerald-600">Bếp Chính</span>
                                            </div>
                                            <Play size={14} className="text-slate-300 group-hover/btn:text-emerald-600" />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </RestaurantOwnerLayout>
    );
}
