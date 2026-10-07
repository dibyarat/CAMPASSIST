import React, { useState, useEffect } from 'react';
import { Layers, Plus, Edit2, Trash2, Search, Loader2 } from 'lucide-react';
import { apiClient } from '../../services/apiClient';

export const Sections = () => {
  const [sections, setSections] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSections = async () => {
      try {
        const data = await apiClient('/sections');
        setSections(data);
      } catch (error) {
        console.error("Failed to load sections", error);
      } finally {
        setLoading(false);
      }
    };
    fetchSections();
  }, []);

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-10">
      <div className="flex justify-between items-center bg-white/60 backdrop-blur-xl p-6 rounded-2xl shadow-sm border border-slate-100">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Sections & Batches</h1>
          <p className="text-slate-500 font-medium mt-1">Manage class sections, capacity, and assigned CRs.</p>
        </div>
        <button className="bg-slate-900 text-white px-5 py-2.5 rounded-xl font-medium flex items-center gap-2 hover:bg-slate-800 transition">
          <Plus size={18} /> Add Section
        </button>
      </div>
      
      <div className="bg-white/60 backdrop-blur-xl p-6 rounded-2xl shadow-sm border border-slate-100">
        <div className="flex gap-4 mb-6">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input type="text" placeholder="Search sections..." className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
        </div>

        <div className="overflow-x-auto">
          {loading ? (
            <div className="flex justify-center p-10"><Loader2 className="animate-spin text-blue-500" /></div>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200">
                  <th className="py-3 px-4 text-sm font-semibold text-slate-500">Section ID</th>
                  <th className="py-3 px-4 text-sm font-semibold text-slate-500">Department</th>
                  <th className="py-3 px-4 text-sm font-semibold text-slate-500">Semester</th>
                  <th className="py-3 px-4 text-sm font-semibold text-slate-500 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {sections.length === 0 ? (
                  <tr><td colSpan={4} className="py-8 text-center text-slate-500">No sections found</td></tr>
                ) : sections.map((sec, i) => (
                  <tr key={i} className="border-b border-slate-100 hover:bg-slate-50/50 transition">
                    <td className="py-4 px-4 font-bold text-slate-900">{sec.name}</td>
                    <td className="py-4 px-4 text-slate-600">{sec.department?.name || '-'}</td>
                    <td className="py-4 px-4 text-slate-600">{sec.semester?.name || '-'}</td>
                    <td className="py-4 px-4 text-right space-x-2">
                      <button className="p-1.5 text-slate-400 hover:text-blue-500 hover:bg-blue-50 rounded-lg transition"><Edit2 size={16} /></button>
                      <button className="p-1.5 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition"><Trash2 size={16} /></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
};

