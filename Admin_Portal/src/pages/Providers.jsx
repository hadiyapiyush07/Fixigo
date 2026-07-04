import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { adminService } from '../services/admin.service';
import { toast } from 'react-hot-toast';
import { Search, Filter, CheckCircle, XCircle, MoreVertical, ShieldCheck, AlertCircle } from 'lucide-react';
import ProviderModal from '../components/ProviderModal';
import ProviderActionModal from '../components/ProviderActionModal';

export default function Providers() {
  const [providers, setProviders] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all'); // all, verified, pending
  const [selectedProvider, setSelectedProvider] = useState(null);
  const [actionModal, setActionModal] = useState({ isOpen: false, type: 'reject', providerId: null, providerName: '' });

  const fetchProviders = async (isBackground = false) => {
    try {
      if (!isBackground) setIsLoading(true);
      const params = {};
      if (filter === 'verified') params.verified = true;
      if (filter === 'pending') params.verified = false;
      
      const res = await adminService.getProviders(params);
      let data = res.data.data.data;
      if (search) {
        data = data.filter(p => (p.userId?.name || '').toLowerCase().includes(search.toLowerCase()) || (p.userId?.phone || '').includes(search));
      }
      setProviders(data);
    } catch (error) {
      if (!isBackground) toast.error('Failed to fetch providers');
    } finally {
      if (!isBackground) setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchProviders();
    const interval = setInterval(() => {
      fetchProviders(true);
    }, 10000); // 10 seconds polling for real-time status updates
    return () => clearInterval(interval);
  }, [filter, search]);

  const handleApprove = async (id) => {
    if (!window.confirm('Are you sure you want to approve this provider?')) return;
    try {
      await adminService.verifyProvider(id, { verificationStatus: 'verified' });
      toast.success('Provider approved successfully');
      fetchProviders();
    } catch (error) {
      toast.error('Failed to approve provider');
    }
  };

  const handleActionSubmit = async (reason) => {
    try {
      await adminService.verifyProvider(actionModal.providerId, { 
        verificationStatus: actionModal.type === 'suspend' ? 'suspended' : 'rejected',
        reason
      });
      toast.success(`Provider ${actionModal.type === 'suspend' ? 'suspended' : 'rejected'} successfully`);
      setActionModal({ isOpen: false, type: 'reject', providerId: null, providerName: '' });
      fetchProviders();
    } catch (error) {
      toast.error(`Failed to ${actionModal.type} provider`);
    }
  };

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="space-y-6"
    >
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-2xl font-bold text-slate-900">Provider Management</h1>
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
            <input
              type="text"
              placeholder="Search providers..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-sm"
            />
          </div>
          <div className="relative">
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="appearance-none pl-10 pr-8 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-sm bg-white text-slate-700 font-medium"
            >
              <option value="all">All Status</option>
              <option value="verified">Verified</option>
              <option value="pending">Pending KYC</option>
            </select>
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-600">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-900 font-medium">
              <tr>
                <th className="px-6 py-4">Provider Info</th>
                <th className="px-6 py-4">Contact</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">KYC Status</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading ? (
                <tr>
                  <td colSpan="5" className="px-6 py-12 text-center text-slate-500">Loading providers...</td>
                </tr>
              ) : providers.length === 0 ? (
                <tr>
                  <td colSpan="5" className="px-6 py-12 text-center text-slate-500">No providers found.</td>
                </tr>
              ) : (
                providers.map((provider) => (
                  <tr key={provider._id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <img 
                          src={provider.userId?.profilePhoto || `https://ui-avatars.com/api/?name=${provider.userId?.name}&background=E2E8F0&color=475569`} 
                          alt="" 
                          className="h-10 w-10 rounded-full object-cover bg-slate-100"
                        />
                        <div>
                          <p className="font-semibold text-slate-900">{provider.userId?.name || 'Unknown'}</p>
                          <p className="text-xs text-slate-500">{provider.experience} Yrs Exp • {provider.rating?.average?.toFixed(1) || '0.0'} ⭐</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-slate-900">{provider.userId?.phone}</p>
                      <p className="text-xs text-slate-500">{provider.userId?.email || 'No email'}</p>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        (provider.status || 'offline') === 'available' ? 'bg-emerald-100 text-emerald-800' :
                        (provider.status || 'offline') === 'busy' ? 'bg-amber-100 text-amber-800' :
                        'bg-slate-100 text-slate-800'
                      }`}>
                        {(provider.status || 'offline').charAt(0).toUpperCase() + (provider.status || 'offline').slice(1)}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      {provider.verificationStatus === 'verified' ? (
                        <span className="inline-flex items-center text-emerald-600 font-medium">
                          <ShieldCheck className="w-4 h-4 mr-1.5" /> Verified
                        </span>
                      ) : provider.verificationStatus === 'rejected' ? (
                        <span className="inline-flex items-center text-red-600 font-medium">
                          <XCircle className="w-4 h-4 mr-1.5" /> Rejected
                        </span>
                      ) : provider.verificationStatus === 'suspended' ? (
                        <span className="inline-flex items-center text-red-600 font-medium">
                          <AlertCircle className="w-4 h-4 mr-1.5" /> Suspended
                        </span>
                      ) : (
                        <span className="inline-flex items-center text-amber-600 font-medium">
                          <AlertCircle className="w-4 h-4 mr-1.5" /> Pending
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {provider.verificationStatus === 'pending' && (
                          <>
                            <button 
                              onClick={() => handleApprove(provider._id)}
                              className="p-1.5 bg-emerald-50 text-emerald-600 rounded hover:bg-emerald-100 cursor-pointer"
                              title="Approve KYC"
                            >
                              <CheckCircle className="w-4 h-4" />
                            </button>
                            <button 
                              onClick={() => setActionModal({ isOpen: true, type: 'reject', providerId: provider._id, providerName: provider.userId?.name })}
                              className="p-1.5 bg-red-50 text-red-600 rounded hover:bg-red-100 cursor-pointer"
                              title="Reject KYC"
                            >
                              <XCircle className="w-4 h-4" />
                            </button>
                          </>
                        )}
                        {(provider.verificationStatus === 'verified' || provider.verificationStatus === 'suspended') && (
                          <button 
                            onClick={() => setActionModal({ isOpen: true, type: 'suspend', providerId: provider._id, providerName: provider.userId?.name })}
                            className={`p-1.5 rounded hover:bg-amber-100 cursor-pointer ${provider.verificationStatus === 'suspended' ? 'bg-amber-100 text-amber-600' : 'bg-amber-50 text-amber-600'}`}
                            title="Suspend Provider"
                          >
                            <AlertCircle className="w-4 h-4" />
                          </button>
                        )}
                        <button 
                          onClick={() => setSelectedProvider(provider)}
                          className="p-1.5 text-slate-400 hover:text-slate-600 rounded hover:bg-slate-100 cursor-pointer"
                          title="View Details"
                        >
                          <MoreVertical className="w-5 h-5" />
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
      <ProviderModal 
        provider={selectedProvider} 
        onClose={() => setSelectedProvider(null)} 
      />
      <ProviderActionModal
        isOpen={actionModal.isOpen}
        actionType={actionModal.type}
        providerName={actionModal.providerName}
        onClose={() => setActionModal({ isOpen: false, type: 'reject', providerId: null, providerName: '' })}
        onConfirm={handleActionSubmit}
      />
    </>
  );
}
