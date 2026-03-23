import React from 'react';
import { 
  Settings as SettingsIcon, 
  Shield, 
  Bell, 
  Globe, 
  Database,
  User,
  Save
} from 'lucide-react';

export default function Settings() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">System Settings</h1>
        <p className="text-slate-500">Configure your ERP system preferences and security.</p>
      </div>

      <div className="grid gap-8 lg:grid-cols-3">
        {/* Sidebar Navigation for Settings */}
        <div className="space-y-1">
          {[
            { label: 'General', icon: SettingsIcon, active: true },
            { label: 'Security', icon: Shield },
            { label: 'Notifications', icon: Bell },
            { label: 'Localization', icon: Globe },
            { label: 'Database & Backup', icon: Database },
            { label: 'Account', icon: User },
          ].map((item, i) => (
            <button
              key={i}
              className={`flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-all ${
                item.active 
                  ? 'bg-indigo-50 text-indigo-600 shadow-sm' 
                  : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'
              }`}
            >
              <item.icon size={18} />
              {item.label}
            </button>
          ))}
        </div>

        {/* Settings Content */}
        <div className="lg:col-span-2">
          <div className="rounded-2xl bg-white p-8 shadow-sm ring-1 ring-slate-200">
            <h3 className="mb-6 text-lg font-bold text-slate-900">General Configuration</h3>
            
            <form className="space-y-6">
              <div className="grid gap-6 sm:grid-cols-2">
                <div className="col-span-2">
                  <label className="mb-1 block text-sm font-medium text-slate-700">Company Name</label>
                  <input
                    type="text"
                    defaultValue="Nexus Manufacturing Ltd."
                    className="w-full rounded-xl border-slate-200 bg-slate-50 px-4 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700">System Currency</label>
                  <select className="w-full rounded-xl border-slate-200 bg-slate-50 px-4 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500" defaultValue="INR (₹)">
                    <option>INR (₹)</option>
                    <option>USD ($)</option>
                    <option>EUR (€)</option>
                    <option>GBP (£)</option>
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700">Timezone</label>
                  <select className="w-full rounded-xl border-slate-200 bg-slate-50 px-4 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500">
                    <option>UTC (GMT+0)</option>
                    <option>EST (GMT-5)</option>
                    <option>IST (GMT+5:30)</option>
                  </select>
                </div>
                <div className="col-span-2">
                  <label className="mb-1 block text-sm font-medium text-slate-700">Support Email</label>
                  <input
                    type="email"
                    defaultValue="support@nexus-erp.com"
                    className="w-full rounded-xl border-slate-200 bg-slate-50 px-4 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between border-t border-slate-100 pt-6">
                <p className="text-xs text-slate-500 italic">Last updated: March 22, 2026</p>
                <button
                  type="button"
                  className="flex items-center gap-2 rounded-xl bg-indigo-600 px-6 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:bg-indigo-700"
                >
                  <Save size={18} />
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
