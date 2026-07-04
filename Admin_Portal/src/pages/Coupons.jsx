import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { adminService } from '../services/admin.service';
import { toast } from 'react-hot-toast';
import { Tag, Plus, Trash2, Calendar, AlertCircle } from 'lucide-react';
import { useForm } from 'react-hook-form';

export default function Coupons() {
  const [coupons, setCoupons] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { register, handleSubmit, reset, formState: { errors } } = useForm();

  const fetchCoupons = async () => {
    try {
      setIsLoading(true);
      const res = await adminService.getCoupons();
      setCoupons(res.data.data);
    } catch (error) {
      toast.error('Failed to fetch coupons');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCoupons();
  }, []);

  const onSubmit = async (data) => {
    try {
      // Ensure one-time is enforced
      const payload = {
        ...data,
        isOneTime: true // Enforced from previous requirements
      };
      await adminService.createCoupon(payload);
      toast.success('Coupon created successfully');
      setIsModalOpen(false);
      reset();
      fetchCoupons();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to create coupon');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this coupon?')) return;
    try {
      await adminService.deleteCoupon(id);
      toast.success('Coupon deleted');
      fetchCoupons();
    } catch (error) {
      toast.error('Failed to delete coupon');
    }
  };

  const isExpired = (expiryDate) => {
    return new Date(expiryDate) < new Date();
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="space-y-6"
    >
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-slate-900">Coupon Management</h1>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="bg-primary hover:opacity-90 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors shadow-sm flex items-center gap-2 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          Create Coupon
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {isLoading ? (
          <div className="col-span-full py-12 text-center text-slate-500">Loading coupons...</div>
        ) : coupons.length === 0 ? (
          <div className="col-span-full py-12 text-center text-slate-500">No coupons found.</div>
        ) : (
          coupons.map((coupon) => (
            <div key={coupon._id} className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200 relative overflow-hidden group hover:shadow-md transition-shadow">
              {isExpired(coupon.expiryDate) && (
                <div className="absolute top-0 right-0 bg-red-100 text-red-700 text-xs font-bold px-3 py-1 rounded-bl-lg">
                  EXPIRED
                </div>
              )}
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <Tag className="w-5 h-5 text-primary" />
                    <h3 className="font-bold text-lg text-slate-900 tracking-wide uppercase">{coupon.code}</h3>
                  </div>
                  <p className="text-sm text-slate-500 mt-1">{coupon.description}</p>
                </div>
                <button 
                  onClick={() => handleDelete(coupon._id)}
                  className="p-2 text-slate-400 hover:text-red-600 rounded-lg hover:bg-red-50 transition-colors opacity-0 group-hover:opacity-100"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
              
              <div className="mt-6 pt-6 border-t border-slate-100 space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">Discount Type</span>
                  <span className="font-medium text-slate-900 capitalize">{coupon.discountType}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">Discount Value</span>
                  <span className="font-medium text-emerald-600">{coupon.discountType === 'percentage' ? `${coupon.discountValue}%` : `₹${coupon.discountValue}`}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">Max Discount</span>
                  <span className="font-medium text-slate-900">₹{coupon.maxDiscount || 'Unlimited'}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">Expires On</span>
                  <span className={`font-medium flex items-center ${isExpired(coupon.expiryDate) ? 'text-red-600' : 'text-slate-900'}`}>
                    <Calendar className="w-3 h-3 mr-1" />
                    {new Date(coupon.expiryDate).toLocaleDateString()}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">Usage Limit</span>
                  <span className="font-medium text-slate-900 flex items-center">
                    {coupon.isOneTime ? 'One-time per user' : 'Unlimited usage'}
                  </span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden"
            >
              <div className="px-6 py-4 border-b border-slate-200 flex justify-between items-center">
                <h2 className="text-lg font-bold text-slate-900">Create New Coupon</h2>
                <button onClick={() => {setIsModalOpen(false); reset();}} className="text-slate-400 hover:text-slate-600">&times;</button>
              </div>
              <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Coupon Code</label>
                  <input type="text" {...register('code', { required: true })} className="w-full border-slate-300 rounded-lg p-2 text-sm border focus:ring-primary focus:border-primary uppercase" placeholder="e.g. WELCOME100" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Description</label>
                  <input type="text" {...register('description')} className="w-full border-slate-300 rounded-lg p-2 text-sm border focus:ring-primary focus:border-primary" placeholder="First time user discount" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Discount Type</label>
                    <select {...register('discountType')} className="w-full border-slate-300 rounded-lg p-2 text-sm border focus:ring-primary focus:border-primary">
                      <option value="percentage">Percentage (%)</option>
                      <option value="fixed">Fixed Amount (₹)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Discount Value</label>
                    <input type="number" {...register('discountValue', { required: true })} className="w-full border-slate-300 rounded-lg p-2 text-sm border focus:ring-primary focus:border-primary" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Max Discount (₹)</label>
                    <input type="number" {...register('maxDiscount')} className="w-full border-slate-300 rounded-lg p-2 text-sm border focus:ring-primary focus:border-primary" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Expiry Date</label>
                    <input type="date" {...register('expiryDate', { required: true })} className="w-full border-slate-300 rounded-lg p-2 text-sm border focus:ring-primary focus:border-primary" />
                  </div>
                </div>
                <div className="p-3 bg-primary/10 text-teal-800 text-xs rounded-lg flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <p>As per requirements, this coupon will be strictly configured as <strong>One-time use per user</strong>.</p>
                </div>
                <div className="pt-4 flex justify-end gap-3">
                  <button type="button" onClick={() => {setIsModalOpen(false); reset();}} className="px-4 py-2 text-sm font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg">Cancel</button>
                  <button type="submit" className="px-4 py-2 text-sm font-medium text-white bg-primary hover:opacity-90 rounded-lg cursor-pointer">Save Coupon</button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
