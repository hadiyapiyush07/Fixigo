import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { adminService } from '../services/admin.service';
import { toast } from 'react-hot-toast';
import { Search, MapPin, Calendar, MoreVertical, Ban, CheckCircle } from 'lucide-react';

export default function Customers() {
  const [customers, setCustomers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');

  const fetchCustomers = async () => {
    try {
      setIsLoading(true);
      const res = await adminService.getCustomers({ role: 'customer' });
      let data = res.data.data.data; // Pagination structure
      if (search) {
        data = data.filter(c => c.name?.toLowerCase().includes(search.toLowerCase()) || c.phone?.includes(search));
      }
      setCustomers(data);
    } catch (error) {
      toast.error('Failed to fetch customers');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, [search]);

  const handleToggleStatus = async (id, currentStatus) => {
    if (!window.confirm(`Are you sure you want to ${currentStatus ? 'suspend' : 'activate'} this user?`)) return;
    try {
      await adminService.toggleUserStatus(id, { isActive: !currentStatus });
      toast.success('User status updated');
      fetchCustomers();
    } catch (error) {
      toast.error('Failed to update status');
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="space-y-6"
    >
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-2xl font-bold text-slate-900">Customer Management</h1>
        <div className="relative flex-1 sm:max-w-xs w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
          <input
            type="text"
            placeholder="Search customers..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-sm bg-white"
          />
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-600">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-900 font-medium">
              <tr>
                <th className="px-6 py-4">Customer Info</th>
                <th className="px-6 py-4">Contact</th>
                <th className="px-6 py-4">Joined On</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading ? (
                <tr>
                  <td colSpan="5" className="px-6 py-12 text-center text-slate-500">Loading customers...</td>
                </tr>
              ) : customers.length === 0 ? (
                <tr>
                  <td colSpan="5" className="px-6 py-12 text-center text-slate-500">No customers found.</td>
                </tr>
              ) : (
                customers.map((customer) => (
                  <tr key={customer._id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <img 
                          src={customer.profilePhoto || `https://ui-avatars.com/api/?name=${customer.name}&background=eff6ff&color=2563eb`} 
                          alt="" 
                          className="h-10 w-10 rounded-full object-cover bg-slate-100"
                        />
                        <div>
                          <p className="font-semibold text-slate-900">{customer.name || 'Unknown User'}</p>
                          <p className="text-xs text-slate-500 flex items-center">
                            <MapPin className="w-3 h-3 mr-1" />
                            {customer.addresses?.[0]?.city || 'No address added'}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-slate-900">{customer.phone}</p>
                      <p className="text-xs text-slate-500">{customer.email || 'No email'}</p>
                    </td>
                    <td className="px-6 py-4">
                      <span className="flex items-center text-slate-600">
                        <Calendar className="w-4 h-4 mr-2 text-slate-400" />
                        {new Date(customer.createdAt).toLocaleDateString()}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      {customer.isActive ? (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800">
                          Active
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                          Suspended
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button 
                          onClick={() => handleToggleStatus(customer._id, customer.isActive)}
                          className={`p-1.5 rounded ${customer.isActive ? 'bg-red-50 text-red-600 hover:bg-red-100' : 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100'}`}
                          title={customer.isActive ? "Suspend User" : "Activate User"}
                        >
                          {customer.isActive ? <Ban className="w-4 h-4" /> : <CheckCircle className="w-4 h-4" />}
                        </button>
                        <button className="p-1.5 bg-slate-50 text-slate-600 rounded hover:bg-slate-100">
                          <MoreVertical className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </motion.div>
  );
}
