import React from 'react';
import { motion } from 'framer-motion';
import { Bell } from 'lucide-react';

export default function Notifications() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="space-y-6"
    >
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-slate-900">Notifications</h1>
      </div>
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 flex flex-col items-center justify-center text-slate-500 py-24">
        <Bell className="w-12 h-12 mb-4 text-slate-300" />
        <p>No new notifications right now.</p>
      </div>
    </motion.div>
  );
}
