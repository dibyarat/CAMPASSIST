import React, { useState, useEffect } from 'react';
import { Edit2, Trash2, Loader2, RefreshCw, Save, X } from 'lucide-react';
import { Link } from 'react-router-dom';
import { adminService, type AdminInstitution, type AdminSection, type AdminUser } from '../../services/adminService';

type UserEditForm = {
  fullName: string;
  role: string;
  sectionId: string;
  institutionId: string;
  rollNumber: string;
  department: string;
  semester: string;
  studentType: 'HOSTELLER' | 'DAY_SCHOLAR';
  hostelName: string;
  hostelBlock: string;
  hostelRoom: string;
  github: string;
  linkedin: string;
  portfolio: string;
};

const emptyUserEditForm: UserEditForm = {
  fullName: '',
  role: 'STUDENT',
  sectionId: '',
  institutionId: '',
  rollNumber: '',
  department: '',
  semester: '',
  studentType: 'DAY_SCHOLAR',
  hostelName: '',
  hostelBlock: '',
  hostelRoom: '',
  github: '',
  linkedin: '',
  portfolio: '',
};

export const Users = () => {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [sections, setSections] = useState<AdminSection[]>([]);
  const [institutions, setInstitutions] = useState<AdminInstitution[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [editUser, setEditUser] = useState<AdminUser | null>(null);
  const [editForm, setEditForm] = useState<UserEditForm>(emptyUserEditForm);
  const [editError, setEditError] = useState('');
  const [saving, setSaving] = useState(false);
  const [loadingSections, setLoadingSections] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setErrorMsg(null);
      const [usersData, sectionsData, institutionsData] = await Promise.all([
        adminService.listUsers(),
        adminService.listSections(),
        adminService.listInstitutions()
      ]);
      setUsers(usersData);
      setSections(sectionsData);
      setInstitutions(institutionsData);
    } catch (e: any) {
      console.error(e);
      setErrorMsg(e.message || String(e));
    } finally {
      setLoading(false);
    }
  };

  const refreshSections = async () => {
    setLoadingSections(true);
    try {
      setSections(await adminService.listSections());
      setEditError('');
    } catch (requestError) {
      setEditError(requestError instanceof Error ? requestError.message : 'Unable to refresh sections.');
    } finally {
      setLoadingSections(false);
    }
  };

  const startEditing = (user: AdminUser) => {
    setEditUser(user);
    setEditError('');
    void refreshSections();
    setEditForm({
      ...emptyUserEditForm,
      fullName: user.profile?.fullName || '',
      role: user.role || 'STUDENT',
      sectionId: user.crAssignment?.sectionId || user.student?.sectionId || '',
      institutionId: user.institutionId || user.Institution?.id || '',
      rollNumber: user.profile?.rollNumber || '',
      department: user.profile?.department || '',
      semester: user.profile?.semester || '',
      studentType: user.profile?.studentType || 'DAY_SCHOLAR',
      hostelName: user.profile?.hostelName || '',
      hostelBlock: user.profile?.hostelBlock || '',
      hostelRoom: user.profile?.hostelRoom || '',
      github: user.profile?.github || '',
      linkedin: user.profile?.linkedin || '',
      portfolio: user.profile?.portfolio || '',
    });
  };

    const handleDeleteUser = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this user? This action cannot be undone.")) return;
    try {
      await adminService.deleteUser(id);
      await fetchData();
    } catch (e: any) {
      alert(e.message);
    }
  };

  const handleSaveUser = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!editUser) return;

    if (editForm.role === 'CR' && !editForm.sectionId) {
      setEditError('Select a section before assigning the CR role.');
      return;
    }

    setSaving(true);
    setEditError('');
    try {
      const roleChanged = editForm.role !== editUser.role;
      const crSectionChanged = editForm.role === 'CR' && editForm.sectionId !== editUser.crAssignment?.sectionId;
      if (roleChanged || crSectionChanged) {
        await adminService.updateRole(editUser.id, editForm.role, editForm.role === 'CR' ? editForm.sectionId : undefined);
      }
      await adminService.updateUserDetails(editUser.id, {
        fullName: editForm.fullName,
        sectionId: editForm.sectionId || null,
        institutionId: editForm.institutionId || null,
        rollNumber: editForm.rollNumber || null,
        department: editForm.department || null,
        semester: editForm.semester || null,
        studentType: editForm.studentType,
        hostelName: editForm.hostelName || null,
        hostelBlock: editForm.hostelBlock || null,
        hostelRoom: editForm.hostelRoom || null,
        github: editForm.github || null,
        linkedin: editForm.linkedin || null,
        portfolio: editForm.portfolio || null,
      });
      setEditUser(null);
      await fetchData();
    } catch (requestError) {
      setEditError(requestError instanceof Error ? requestError.message : 'Unable to save user details.');
    } finally {
      setSaving(false);
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
              {users.map((user) => (
                <tr key={user.id} className="border-b border-slate-100 hover:bg-slate-50/50 transition">
                  <td className="py-4 px-4 font-medium text-slate-800">{user.profile?.fullName || 'N/A'}</td>
                  <td className="py-4 px-4 text-slate-600">{user.email}</td>
                  <td className="py-4 px-4">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${user.role === 'DEVELOPER' ? 'bg-rose-100 text-rose-700' : user.role === 'CR' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'}`}>
                      {user.role}
                    </span>
                  </td>
                  <td className="py-4 px-4 text-slate-600">{user.Institution?.code || "-"}</td>
                  <td className="py-4 px-4 text-slate-600">
                    {user.crAssignment?.section?.name || user.student?.section?.name || user.profile?.section || '-'}
                  </td>
                                    <td className="py-4 px-4 text-right flex justify-end gap-2">
                    <button onClick={() => startEditing(user)} aria-label={`Edit ${user.profile?.fullName || user.email}`} className="p-2 text-slate-400 hover:text-blue-600 transition bg-slate-50 rounded-lg hover:bg-blue-50">
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
          <div className="bg-white rounded-xl w-full max-w-3xl max-h-[90vh] overflow-hidden shadow-xl">
            <div className="flex justify-between items-center p-6 border-b border-slate-100">
              <div>
                <h2 className="text-xl font-bold text-slate-800">Edit user details</h2>
                <p className="mt-1 text-sm text-slate-500">{editUser.email}</p>
              </div>
              <button type="button" onClick={() => setEditUser(null)} aria-label="Close editor" className="text-slate-400 hover:text-slate-600"><X size={20} /></button>
            </div>
            <form onSubmit={handleSaveUser} className="max-h-[calc(90vh-88px)] overflow-y-auto p-6">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <label className="space-y-1.5">
                  <span className="text-sm font-semibold text-slate-700">Full Name</span>
                  <input required value={editForm.fullName} onChange={event => setEditForm({ ...editForm, fullName: event.target.value })} className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-blue-400" />
                </label>
                <label className="space-y-1.5">
                  <span className="text-sm font-semibold text-slate-700">Role</span>
                  <select value={editForm.role} onChange={event => setEditForm({ ...editForm, role: event.target.value })} className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-blue-400">
                    <option value="STUDENT">Student</option>
                    <option value="CR">Class Representative (CR)</option>
                    <option value="DEVELOPER">Developer / Admin</option>
                  </select>
                </label>
                <label className="space-y-1.5">
                  <span className="text-sm font-semibold text-slate-700">Institution</span>
                  <select value={editForm.institutionId} onChange={event => setEditForm({ ...editForm, institutionId: event.target.value })} className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-blue-400">
                    <option value="">No institution assigned</option>
                    {institutions.map(institution => <option key={institution.id} value={institution.id}>{institution.name} ({institution.code})</option>)}
                  </select>
                </label>
                <label className="space-y-1.5">
                  <span className="text-sm font-semibold text-slate-700">Roll Number</span>
                  <input value={editForm.rollNumber} onChange={event => setEditForm({ ...editForm, rollNumber: event.target.value })} className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-blue-400" />
                </label>
                <label className="space-y-1.5">
                  <span className="flex items-center justify-between text-sm font-semibold text-slate-700">
                    Assigned Section
                    <button type="button" onClick={() => void refreshSections()} disabled={loadingSections} aria-label="Refresh sections" title="Refresh sections" className="inline-flex items-center gap-1 text-xs font-medium text-blue-700 disabled:opacity-50">
                      <RefreshCw size={13} className={loadingSections ? 'animate-spin' : ''} /> Refresh
                    </button>
                  </span>
                  <select value={editForm.sectionId} disabled={loadingSections} onChange={event => setEditForm({ ...editForm, sectionId: event.target.value })} className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-blue-400 disabled:opacity-60">
                    <option value="">No section assigned</option>
                    {sections.map(section => <option key={section.id} value={section.id}>{section.name} ({section.department?.code || section.department?.name || ''})</option>)}
                  </select>
                  {sections.length === 0 && !loadingSections && <span className="block text-xs text-slate-500">No sections found. Create one to assign a section.</span>}
                  <Link to="/developer/sections" onClick={() => setEditUser(null)} className="inline-block text-xs font-semibold text-blue-700 hover:underline">Create or manage sections</Link>
                </label>
                <label className="space-y-1.5">
                  <span className="text-sm font-semibold text-slate-700">Department</span>
                  <input value={editForm.department} onChange={event => setEditForm({ ...editForm, department: event.target.value })} className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-blue-400" />
                </label>
                <label className="space-y-1.5">
                  <span className="text-sm font-semibold text-slate-700">Semester</span>
                  <input value={editForm.semester} onChange={event => setEditForm({ ...editForm, semester: event.target.value })} className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-blue-400" />
                </label>
                <label className="space-y-1.5">
                  <span className="text-sm font-semibold text-slate-700">Student Type</span>
                  <select value={editForm.studentType} onChange={event => setEditForm({ ...editForm, studentType: event.target.value as UserEditForm['studentType'] })} className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-blue-400">
                    <option value="DAY_SCHOLAR">Day Scholar</option>
                    <option value="HOSTELLER">Hosteller</option>
                  </select>
                </label>
                {editForm.studentType === 'HOSTELLER' && <>
                  <label className="space-y-1.5">
                    <span className="text-sm font-semibold text-slate-700">Hostel</span>
                    <input value={editForm.hostelName} onChange={event => setEditForm({ ...editForm, hostelName: event.target.value })} className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-blue-400" />
                  </label>
                  <label className="space-y-1.5">
                    <span className="text-sm font-semibold text-slate-700">Hostel Block</span>
                    <input value={editForm.hostelBlock} onChange={event => setEditForm({ ...editForm, hostelBlock: event.target.value })} className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-blue-400" />
                  </label>
                  <label className="space-y-1.5">
                    <span className="text-sm font-semibold text-slate-700">Hostel Room</span>
                    <input value={editForm.hostelRoom} onChange={event => setEditForm({ ...editForm, hostelRoom: event.target.value })} className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-blue-400" />
                  </label>
                </>}
                <label className="space-y-1.5">
                  <span className="text-sm font-semibold text-slate-700">GitHub</span>
                  <input value={editForm.github} onChange={event => setEditForm({ ...editForm, github: event.target.value })} className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-blue-400" />
                </label>
                <label className="space-y-1.5">
                  <span className="text-sm font-semibold text-slate-700">LinkedIn</span>
                  <input value={editForm.linkedin} onChange={event => setEditForm({ ...editForm, linkedin: event.target.value })} className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-blue-400" />
                </label>
                <label className="space-y-1.5 sm:col-span-2">
                  <span className="text-sm font-semibold text-slate-700">Portfolio</span>
                  <input value={editForm.portfolio} onChange={event => setEditForm({ ...editForm, portfolio: event.target.value })} className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-blue-400" />
                </label>
              </div>
              {editError && <p role="alert" className="mt-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">{editError}</p>}
              <div className="mt-6 flex justify-end gap-3 border-t border-slate-100 pt-5">
                <button type="button" onClick={() => setEditUser(null)} disabled={saving} className="rounded-lg px-4 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-50 disabled:opacity-50">Cancel</button>
                <button type="submit" disabled={saving} className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50">
                  <Save size={17} /> {saving ? 'Saving...' : 'Save details'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

