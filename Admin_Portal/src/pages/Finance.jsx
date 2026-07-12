import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { IndianRupee, TrendingUp, Download, Calendar } from 'lucide-react';
import { adminService } from '../services/admin.service';
import { toast } from 'react-hot-toast';

export default function Finance() {
  const [stats, setStats] = useState({ totalRevenue: 0, pendingPayouts: 0 });
  const [transactions, setTransactions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [statsRes, bookingsRes] = await Promise.all([
          adminService.getDashboardStats(),
          adminService.getBookings({ status: 'completed', limit: 5 })
        ]);
        if (statsRes.data?.data?.finance) {
          setStats(statsRes.data.data.finance);
        }
        if (bookingsRes.data?.data?.data) {
          setTransactions(bookingsRes.data.data.data.slice(0, 5));
        }
      } catch (error) {
        toast.error('Failed to load financial data');
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
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

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 overflow-x-auto">
        <h2 className="text-lg font-bold text-slate-900 mb-6">Recent Completed Bookings (Transactions)</h2>
        {transactions.length > 0 ? (
          <table className="w-full text-left border-collapse min-w-[600px]">
            <thead>
              <tr className="border-b border-slate-100 text-sm text-slate-500">
                <th className="pb-3 font-medium">Booking ID</th>
                <th className="pb-3 font-medium">Customer</th>
                <th className="pb-3 font-medium">Provider</th>
                <th className="pb-3 font-medium">Date</th>
                <th className="pb-3 font-medium text-right">Amount</th>
              </tr>
            </thead>
            <tbody className="text-sm">
              {transactions.map((tx) => (
                <tr key={tx._id} className="border-b border-slate-50 last:border-0 hover:bg-slate-50/50">
                  <td className="py-4 font-medium text-slate-900">#{tx._id.slice(-6).toUpperCase()}</td>
                  <td className="py-4 text-slate-600">{tx.customerId?.name || 'Unknown'}</td>
                  <td className="py-4 text-slate-600">{tx.providerId?.userId?.name || 'Unassigned'}</td>
                  <td className="py-4 text-slate-500">
                    {new Date(tx.createdAt).toLocaleDateString()}
                  </td>
                  <td className="py-4 text-right font-medium text-emerald-600">
                    ₹{tx.pricing?.totalAmount || 0}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className="text-center text-slate-500 py-12">
            No recent completed bookings found.
          </div>
        )}
      </div>
    </motion.div>
  );
}
