import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Plus, Trash2, Save } from 'lucide-react';
import { adminService } from '../services/admin.service';
import { toast } from 'react-hot-toast';

export default function SubServicesModal({ category, onClose, onSaved }) {
  const [subServices, setSubServices] = useState([]);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (category) {
      setSubServices(category.subServices || []);
    }
  }, [category]);

  const handleAdd = () => {
    setSubServices([...subServices, { name: '', price: '', duration: 60 }]);
  };

  const handleRemove = (index) => {
    setSubServices(subServices.filter((_, i) => i !== index));
  };

  const handleChange = (index, field, value) => {
    const newSubs = [...subServices];
    newSubs[index][field] = value;
    setSubServices(newSubs);
  };

  const handleSave = async () => {
    // Validate
    const invalid = subServices.find(s => !s.name || s.price === '');
    if (invalid) {
      return toast.error('Please fill name and price for all sub-services');
    }

    try {
      setIsSaving(true);
      await adminService.updateCategory(category._id, { subServices });
      toast.success('Sub-services updated successfully');
      onSaved();
    } catch (error) {
      toast.error('Failed to update sub-services');
    } finally {
      setIsSaving(false);
    }
  };

  if (!category) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm"
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="bg-white rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden"
        >
          <div className="flex items-center justify-between p-6 bg-slate-50 border-b border-slate-100">
            <div>
              <h2 className="text-lg font-bold text-slate-900">Manage Sub-services</h2>
              <p className="text-slate-500 text-sm">Category: {category.name}</p>
            </div>
            <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-200">
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="p-6 max-h-[60vh] overflow-y-auto space-y-4 bg-white">
            {subServices.length === 0 ? (
              <div className="text-center py-10 text-slate-500 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                No sub-services found. Click below to add one.
              </div>
            ) : (
              subServices.map((sub, idx) => (
                <div key={idx} className="flex gap-4 items-end bg-slate-50 p-4 rounded-xl border border-slate-100">
                  <div className="flex-1">
                    <label className="block text-xs font-medium text-slate-700 mb-1">Name (e.g., Gas Refill)</label>
                    <input
                      type="text"
                      value={sub.name}
                      onChange={(e) => handleChange(idx, 'name', e.target.value)}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                      placeholder="Service name"
                    />
                  </div>
                  <div className="w-32">
                    <label className="block text-xs font-medium text-slate-700 mb-1">Price (₹)</label>
                    <input
                      type="number"
                      value={sub.price}
                      onChange={(e) => handleChange(idx, 'price', e.target.value)}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                      placeholder="Amount"
                    />
                  </div>
                  <button
                    onClick={() => handleRemove(idx)}
                    className="p-2.5 text-red-500 hover:bg-red-50 rounded-lg border border-red-100"
                    title="Remove"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))
            )}
            
            <button
              onClick={handleAdd}
              className="w-full py-3 border-2 border-dashed border-slate-200 text-slate-500 font-medium rounded-xl hover:border-primary hover:text-primary transition-colors flex items-center justify-center gap-2 text-sm"
            >
              <Plus className="w-4 h-4" /> Add Sub-service
            </button>
          </div>

          <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-end gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-slate-600 font-medium hover:bg-slate-200 rounded-lg text-sm transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="bg-primary hover:opacity-90 text-white px-6 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 cursor-pointer"
            >
              {isSaving ? 'Saving...' : <><Save className="w-4 h-4" /> Save Sub-services</>}
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
