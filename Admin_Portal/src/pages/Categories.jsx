import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { adminService } from '../services/admin.service';
import { toast } from 'react-hot-toast';
import { Plus, Edit2, Trash2, GripVertical, Image as ImageIcon } from 'lucide-react';
import { useForm } from 'react-hook-form';
import SubServicesModal from '../components/SubServicesModal';

export default function Categories() {
  const [categories, setCategories] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [manageSubServicesCat, setManageSubServicesCat] = useState(null);
  
  const { register, handleSubmit, reset, setValue } = useForm();

  const fetchCategories = async () => {
    try {
      setIsLoading(true);
      const res = await adminService.getCategories();
      setCategories(res.data.data);
    } catch (error) {
      toast.error('Failed to fetch categories');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const openModal = (category = null) => {
    setEditingCategory(category);
    if (category) {
      setValue('name', category.name);
      setValue('description', category.description);
      setValue('basePrice', category.basePrice);
      setValue('estimatedDuration', category.estimatedDuration);
      setValue('sortOrder', category.sortOrder);
    } else {
      reset();
    }
    setIsModalOpen(true);
  };

  const onSubmit = async (data) => {
    try {
      const formData = new FormData();
      formData.append('name', data.name);
      formData.append('description', data.description);
      formData.append('basePrice', data.basePrice);
      formData.append('estimatedDuration', data.estimatedDuration);
      formData.append('sortOrder', data.sortOrder || 0);
      if (data.icon && data.icon[0]) {
        formData.append('icon', data.icon[0]);
      }

      if (editingCategory) {
        // Exclude image if not changed
        const updateData = { ...data };
        delete updateData.icon;
        await adminService.updateCategory(editingCategory._id, updateData);
        toast.success('Category updated');
      } else {
        await adminService.createCategory(formData);
        toast.success('Category created');
      }
      setIsModalOpen(false);
      fetchCategories();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to save category');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this category?')) return;
    try {
      await adminService.deleteCategory(id);
      toast.success('Category deleted');
      fetchCategories();
    } catch (error) {
      toast.error('Failed to delete category');
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="space-y-6"
    >
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-slate-900">Service Categories</h1>
        <button onClick={() => { reset(); setEditingCategory(null); setIsModalOpen(true); }} className="bg-primary hover:opacity-90 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors shadow-sm flex items-center gap-2 cursor-pointer">
          <Plus className="w-4 h-4" />
          Add Category
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        {isLoading ? (
          <div className="p-12 text-center text-slate-500">Loading categories...</div>
        ) : categories.length === 0 ? (
          <div className="p-12 text-center text-slate-500">No categories found.</div>
        ) : (
          <ul className="divide-y divide-slate-100">
            {categories.map((category) => (
              <li key={category._id} className="p-4 flex items-center justify-between hover:bg-slate-50 transition-colors group">
                <div className="flex items-center gap-4">
                  <GripVertical className="w-5 h-5 text-slate-300 cursor-grab active:cursor-grabbing" />
                  <div className="h-12 w-12 rounded-lg bg-slate-100 flex items-center justify-center overflow-hidden border border-slate-200">
                    {category.icon?.url ? (
                      <img src={category.icon.url} alt={category.name} className="h-full w-full object-cover" />
                    ) : (
                      <ImageIcon className="w-6 h-6 text-slate-400" />
                    )}
                  </div>
                        <div className="ml-4 flex-1">
                          <h3 className="text-sm font-bold text-slate-900">{category.name}</h3>
                          <p className="text-xs text-slate-500">{category.description}</p>
                          <div className="mt-1 flex items-center gap-2">
                            {category.subServices?.length > 0 && (
                              <span className="text-[10px] font-medium bg-primary/10 text-primary px-2 py-0.5 rounded-full">
                                {category.subServices.length} subservices
                              </span>
                            )}
                            <button
                              onClick={() => setManageSubServicesCat(category)}
                              className="text-[10px] font-medium text-slate-500 hover:text-primary underline cursor-pointer"
                            >
                              Manage Sub-services
                            </button>
                          </div>
                        </div>
                </div>
                <div className="flex items-center gap-6">
                  <div className="text-right hidden sm:block">
                    <p className="text-sm font-medium text-slate-900">₹{category.basePrice}</p>
                    <p className="text-xs text-slate-500">{category.estimatedDuration} mins</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button 
                      onClick={() => openModal(category)}
                      className="p-2 text-slate-400 hover:text-primary rounded-lg hover:bg-primary/10 transition-colors cursor-pointer"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button 
                      onClick={() => handleDelete(category._id)}
                      className="p-2 text-slate-400 hover:text-red-600 rounded-lg hover:bg-red-50 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden"
            >
              <div className="px-6 py-4 border-b border-slate-200 flex justify-between items-center">
                <h2 className="text-lg font-bold text-slate-900">
                  {editingCategory ? 'Edit Category' : 'New Category'}
                </h2>
                <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                  &times;
                </button>
              </div>
              <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Name</label>
                  <input type="text" {...register('name', { required: true })} className="w-full border-slate-300 rounded-lg p-2.5 text-sm border focus:ring-primary focus:border-primary outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Description</label>
                  <textarea {...register('description')} className="w-full border-slate-300 rounded-lg p-2.5 text-sm border focus:ring-primary focus:border-primary outline-none" rows="3" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Base Price (₹)</label>
                    <input type="number" {...register('basePrice', { required: true })} className="w-full border-slate-300 rounded-lg p-2.5 text-sm border focus:ring-primary focus:border-primary outline-none" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Duration (mins)</label>
                    <input type="number" {...register('estimatedDuration')} className="w-full border-slate-300 rounded-lg p-2.5 text-sm border focus:ring-primary focus:border-primary outline-none" />
                  </div>
                </div>
                {!editingCategory && (
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Icon Image</label>
                    <input type="file" {...register('icon')} accept="image/*" className="w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-primary/10 file:text-primary hover:file:bg-primary/20" />
                  </div>
                )}
                <div className="pt-4 flex justify-end gap-3">
                  <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-sm font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg">Cancel</button>
                  <button type="submit" className="px-4 py-2 text-sm font-medium text-white bg-primary hover:opacity-90 rounded-lg cursor-pointer">Save Category</button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <SubServicesModal 
        category={manageSubServicesCat} 
        onClose={() => setManageSubServicesCat(null)} 
        onSaved={() => {
          setManageSubServicesCat(null);
          fetchCategories();
        }} 
      />
    </motion.div>
  );
}
