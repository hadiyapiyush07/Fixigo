import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { IndianRupee, TrendingUp, Download, Calendar } from 'lucide-react';
import { adminService } from '../services/admin.service';
import { toast } from 'react-hot-toast';

export default function Finance() {
  const [stats, setStats] = useState({ totalRevenue: 0, platformFees: 0, pendingPayouts: 0 });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await adminService.getDashboardStats();
        if (res.data?.data?.finance) {
          setStats(res.data.data.finance);
        }
      } catch (error) {
        toast.error('Failed to load financial data');
      } finally {
        setIsLoading(false);
      }
    };
    fetchStats();
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="space-y-6"
    >
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-slate-900">Financial Reports</h1>
        <button className="bg-primary hover:opacity-90 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors shadow-sm flex items-center gap-2 cursor-pointer">
          <Download className="w-4 h-4" />
          Export Report
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 flex items-center gap-4">
          <div className="h-12 w-12 rounded-xl bg-emerald-100 flex items-center justify-center">
            <IndianRupee className="w-6 h-6 text-emerald-600" />
          </div>
          <div>
            <p className="text-sm font-medium text-slate-500">Total Revenue</p>
            <h3 className="text-2xl font-bold text-slate-900">
              {isLoading ? '...' : `₹${stats.totalRevenue.toLocaleString()}`}
            </h3>
          </div>
        </div>
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 flex items-center gap-4">
          <div className="h-12 w-12 rounded-xl bg-teal-100 flex items-center justify-center">
            <TrendingUp className="w-6 h-6 text-teal-600" />
          </div>
          <div>
            <p className="text-sm font-medium text-slate-500">Platform Fees (10%)</p>
            <h3 className="text-2xl font-bold text-slate-900">
              {isLoading ? '...' : `₹${Math.round(stats.platformFees).toLocaleString()}`}
            </h3>
          </div>
        </div>
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 flex items-center gap-4">
          <div className="h-12 w-12 rounded-xl bg-purple-100 flex items-center justify-center">
            <Calendar className="w-6 h-6 text-purple-600" />
          </div>
          <div>
            <p className="text-sm font-medium text-slate-500">Pending Payouts</p>
            <h3 className="text-2xl font-bold text-slate-900">
              {isLoading ? '...' : `₹${stats.pendingPayouts.toLocaleString()}`}
            </h3>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
        <h2 className="text-lg font-bold text-slate-900 mb-6">Recent Transactions</h2>
        <div className="text-center text-slate-500 py-12">
          Financial transactions will be populated here when payment gateway is fully integrated.
        </div>
      </div>
    </motion.div>
  );
}
