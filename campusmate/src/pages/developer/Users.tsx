import React, { useState, useEffect } from 'react';
import { Users as UsersIcon, Edit2, Trash2, Search, Filter, Loader2, Save, X } from 'lucide-react';
import { apiClient } from '../../services/apiClient';

export const Users = () => {
  const [users, setUsers] = useState<any[]>([]);
  const [sections, setSections] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  
  const [editUser, setEditUser] = useState<any>(null);
  const [editRole, setEditRole] = useState('STUDENT');
  const [editSectionId, setEditSectionId] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [usersData, sectionsData] = await Promise.all([
        apiClient('/users'),
        apiClient('/sections')
      ]);
      setUsers(usersData);
      setSections(sectionsData);
    } catch (e: any) {
      console.error(e);
      setErrorMsg(e.message || String(e));
    } finally {
      setLoading(false);
    }
  };

    const handleDeleteUser = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this user? This action cannot be undone.")) return;
    try {
      await apiClient(`/users/${id}`, { method: 'DELETE' });
      fetchData(); // Refresh list
    } catch (e: any) {
      alert(e.message);
    }
  };

  const handleSaveRole = async () => {
    if (!editUser) return;
    try {
      await apiClient(`/users/${editUser.id}/role`, {
        method: 'PATCH',
        body: JSON.stringify({ role: editRole, sectionId: editSectionId })
      });
      setEditUser(null);
      fetchData(); // Refresh list
    } catch (e: any) {
      alert(e.message);
    }
  };

  if (loading) {
    return <div className="flex justify-center p-20"><Loader2 className="animate-spin text-blue-500 w-10 h-10" /></div>;
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-10">
      <div className="flex justify-between items-center bg-white/60 backdrop-blur-xl p-6 rounded-2xl shadow-sm border border-slate-100">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">User Management</h1>
          <p className="text-slate-500 font-medium mt-1">Manage Students, CRs, and Developer accounts.</p>
        </div>
      </div>

      <div className="bg-white/60 backdrop-blur-xl p-6 rounded-2xl shadow-sm border border-slate-100">
        {errorMsg && (
          <div className="p-4 bg-red-100 text-red-700 font-bold rounded-xl mb-4">
            API Error: {errorMsg}
          </div>
        )}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200">
                <th className="py-3 px-4 text-sm font-semibold text-slate-500">Name</th>
                <th className="py-3 px-4 text-sm font-semibold text-slate-500">Email</th>
                <th className="py-3 px-4 text-sm font-semibold text-slate-500">Role</th>
                <th className="py-3 px-4 text-sm font-semibold text-slate-500">Institution</th>
                <th className="py-3 px-4 text-sm font-semibold text-slate-500">Section</th>
                <th className="py-3 px-4 text-sm font-semibold text-slate-500 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user, i) => (
                <tr key={i} className="border-b border-slate-100 hover:bg-slate-50/50 transition">
                  <td className="py-4 px-4 font-medium text-slate-800">{user.profile?.fullName || 'N/A'}</td>
                  <td className="py-4 px-4 text-slate-600">{user.email}</td>
                  <td className="py-4 px-4">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${user.role === 'DEVELOPER' ? 'bg-rose-100 text-rose-700' : user.role === 'CR' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'}`}>
                      {user.role}
                    </span>
                  </td>
                  <td className="py-4 px-4 text-slate-600">{user.Institution?.code || "-"}</td>
                  <td className="py-4 px-4 text-slate-600">
                    {user.crAssignment?.section?.name || user.student?.section?.name || '-'}
                  </td>
                                    <td className="py-4 px-4 text-right flex justify-end gap-2">
                     <button onClick={() => {
                        setEditUser(user);
                        setEditRole(user.role);
                        setEditSectionId(user.crAssignment?.sectionId || user.student?.sectionId || '');
                     }} className="p-2 text-slate-400 hover:text-blue-600 transition bg-slate-50 rounded-lg hover:bg-blue-50">
                       <Edit2 size={16} />
                     </button>
                     <button onClick={() => handleDeleteUser(user.id)} className="p-2 text-slate-400 hover:text-rose-600 transition bg-slate-50 rounded-lg hover:bg-rose-50">
                       <Trash2 size={16} />
                     </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {editUser && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md overflow-hidden shadow-xl">
            <div className="flex justify-between items-center p-6 border-b border-slate-100">
              <h2 className="text-xl font-bold text-slate-800">Edit Role: {editUser.profile?.fullName}</h2>
              <button onClick={() => setEditUser(null)} className="text-slate-400 hover:text-slate-600"><X size={20} /></button>
            </div>
            <div className="p-6 space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700">Role</label>
                <select value={editRole} onChange={e => setEditRole(e.target.value)} className="w-full p-3 rounded-xl border border-slate-200 focus:border-blue-400 outline-none">
                  <option value="STUDENT">Student</option>
                  <option value="CR">Class Representative (CR)</option>
                  <option value="DEVELOPER">Developer / Admin</option>
                </select>
              </div>
              
              {editRole === 'CR' && (
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-700">Assign to Section</label>
                  <select value={editSectionId} onChange={e => setEditSectionId(e.target.value)} className="w-full p-3 rounded-xl border border-slate-200 focus:border-blue-400 outline-none">
                    <option value="">Select a section...</option>
                    {sections.map(s => <option key={s.id} value={s.id}>{s.name} ({s.department?.code || ''})</option>)}
                  </select>
                </div>
              )}
              
              <div className="pt-4 flex justify-end gap-3">
                <button onClick={() => setEditUser(null)} className="px-5 py-2.5 rounded-xl font-medium text-slate-600 hover:bg-slate-50">Cancel</button>
                <button onClick={handleSaveRole} className="px-5 py-2.5 rounded-xl font-medium text-white bg-blue-600 hover:bg-blue-700 flex items-center gap-2"><Save size={18} /> Save</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

