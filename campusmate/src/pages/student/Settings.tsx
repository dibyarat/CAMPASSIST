import React, { useState } from 'react';
import { User, Bell, Lock, Shield, Camera, Save } from 'lucide-react';

import { apiClient } from '../../services/apiClient';

export const Settings = () => {
  const [profile, setProfile] = React.useState<any>(null);
  React.useEffect(() => { apiClient('/users/me').then(setProfile).catch(console.error); }, []);
  const [activeTab, setActiveTab] = useState<'Profile' | 'Notifications' | 'Security'>('Profile');

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-10">
      <div className="flex justify-between items-center bg-white/60 backdrop-blur-xl p-6 rounded-2xl shadow-sm border border-slate-100">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Account Settings</h1>
          <p className="text-slate-500 font-medium mt-1">Manage your account preferences</p>
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-6">
        {/* Sidebar Nav */}
        <div className="w-full md:w-64 shrink-0 space-y-2 bg-white/60 backdrop-blur-xl rounded-2xl p-4 border border-slate-100 shadow-sm h-max">
          <button 
            onClick={() => setActiveTab('Profile')}
            className={`w-full flex items-center gap-3 p-3 rounded-xl transition font-semibold text-sm ${
              activeTab === 'Profile' ? 'bg-blue-50 text-blue-700' : 'text-slate-600 hover:bg-slate-50'
            }`}
          >
            <User size={18} /> Edit Profile
          </button>
          <button 
            onClick={() => setActiveTab('Notifications')}
            className={`w-full flex items-center gap-3 p-3 rounded-xl transition font-semibold text-sm ${
              activeTab === 'Notifications' ? 'bg-blue-50 text-blue-700' : 'text-slate-600 hover:bg-slate-50'
            }`}
          >
            <Bell size={18} /> Notifications
          </button>
          <button 
            onClick={() => setActiveTab('Security')}
            className={`w-full flex items-center gap-3 p-3 rounded-xl transition font-semibold text-sm ${
              activeTab === 'Security' ? 'bg-blue-50 text-blue-700' : 'text-slate-600 hover:bg-slate-50'
            }`}
          >
            <Shield size={18} /> Security
          </button>
        </div>

        {/* Form Content */}
        <div className="flex-1 bg-white/60 backdrop-blur-xl rounded-2xl border border-slate-100 shadow-sm p-6 sm:p-8">
          {activeTab === 'Profile' && (
            <div className="space-y-8">
              <div className="flex items-center gap-6 pb-6 border-b border-slate-100">
                <div className="relative group cursor-pointer">
                  <div className="w-24 h-24 rounded-full overflow-hidden ring-4 ring-slate-50">
                    <img src={`https://ui-avatars.com/api/?name=${profile?.profile?.fullName || 'Student'}&background=3B82F6&color=fff&size=128`} alt="Avatar" className="w-full h-full object-cover" />
                  </div>
                  <div className="absolute inset-0 bg-slate-900/40 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition">
                    <Camera size={24} className="text-white" />
                  </div>
                </div>
                <div>
                  <h3 className="font-bold text-xl text-slate-900">{profile?.profile?.fullName || 'Student'}</h3>
                  <p className="text-slate-500 font-medium">{profile?.email || 'student@college.edu'}</p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-700">First Name</label>
                  <input type="text" defaultValue={profile?.profile?.fullName?.split(" ")[0] || "Student"} className="w-full p-3 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 focus:bg-white/60 backdrop-blur-xl focus:border-blue-400 outline-none transition font-medium" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-700">Last Name</label>
                  <input type="text" defaultValue={profile?.profile?.fullName?.split(" ").slice(1).join(" ") || ""} className="w-full p-3 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 focus:bg-white/60 backdrop-blur-xl focus:border-blue-400 outline-none transition font-medium" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-700">Email</label>
                  <input type="email" defaultValue={profile?.email || "student@college.edu"} className="w-full p-3 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 focus:bg-white/60 backdrop-blur-xl focus:border-blue-400 outline-none transition font-medium" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-700">Phone</label>
                  <input type="text" defaultValue="+1 (234) 567-8900" className="w-full p-3 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 focus:bg-white/60 backdrop-blur-xl focus:border-blue-400 outline-none transition font-medium" />
                </div>
              </div>
            </div>
          )}

          {activeTab === 'Notifications' && (
            <div className="space-y-8">
              <h3 className="text-lg font-bold text-slate-900 border-b border-slate-100 pb-4">Communication Preferences</h3>
              
              <div className="space-y-6">
                <div className="flex justify-between items-center">
                  <div>
                    <h4 className="font-bold text-slate-900 mb-1">Email Notifications</h4>
                    <p className="text-sm text-slate-500 font-medium">Receive daily summaries and critical alerts via email.</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" className="sr-only peer" defaultChecked />
                    <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white/60 backdrop-blur-xl after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-500"></div>
                  </label>
                </div>
                
                <div className="flex justify-between items-center">
                  <div>
                    <h4 className="font-bold text-slate-900 mb-1">SMS Alerts</h4>
                    <p className="text-sm text-slate-500 font-medium">Get text messages for class cancellations.</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" className="sr-only peer" />
                    <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white/60 backdrop-blur-xl after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-500"></div>
                  </label>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'Security' && (
            <div className="space-y-8">
              <h3 className="text-lg font-bold text-slate-900 border-b border-slate-100 pb-4">Update Password</h3>
              
              <div className="space-y-4 max-w-md">
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-700">Current Password</label>
                  <input type="password" placeholder="••••••••" className="w-full p-3 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 focus:bg-white/60 backdrop-blur-xl focus:border-blue-400 outline-none transition font-medium" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-700">New Password</label>
                  <input type="password" placeholder="••••••••" className="w-full p-3 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 focus:bg-white/60 backdrop-blur-xl focus:border-blue-400 outline-none transition font-medium" />
                </div>
              </div>
            </div>
          )}

          <div className="mt-10 pt-6 border-t border-slate-100 flex justify-end">
            <button className="flex items-center gap-2 px-6 py-3 bg-gradient-primary text-white font-bold rounded-xl shadow-md hover:shadow-lg transition">
              <Save size={18} /> Save Changes
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

