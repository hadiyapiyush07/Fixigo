import React from 'react';
import { motion } from 'framer-motion';

export default function Settings() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="space-y-6"
    >
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-slate-900">Platform Settings</h1>
      </div>
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 max-w-2xl">
        <h2 className="text-lg font-bold text-slate-900 mb-4">General Settings</h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Platform Name</label>
            <input type="text" defaultValue="Fixigo" className="w-full border-slate-300 rounded-lg p-2 text-sm border focus:ring-primary outline-none" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Support Email</label>
            <input type="email" defaultValue="support@fixigo.com" className="w-full border-slate-300 rounded-lg p-2 text-sm border focus:ring-primary outline-none" />
          </div>
          <button className="bg-primary hover:opacity-90 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors cursor-pointer">
            Save Settings
          </button>
        </div>
      </div>
    </motion.div>
  );
}
