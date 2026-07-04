import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ShieldCheck, MapPin, User, FileText, CreditCard } from 'lucide-react';

export default function ProviderModal({ provider, onClose }) {
  if (!provider) return null;

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
          className="bg-white rounded-2xl shadow-xl w-full max-w-3xl max-h-[90vh] overflow-y-auto"
        >
          <div className="sticky top-0 z-10 flex items-center justify-between p-6 bg-white border-b border-slate-100">
            <div className="flex items-center gap-4">
              <img
                src={provider.userId?.profilePhoto || `https://ui-avatars.com/api/?name=${provider.userId?.name}&background=E2E8F0&color=475569`}
                alt=""
                className="w-16 h-16 rounded-full object-cover bg-slate-100"
              />
              <div>
                <h2 className="text-xl font-bold text-slate-900">{provider.userId?.name || 'Unknown'}</h2>
                <p className="text-slate-500 text-sm flex items-center gap-2">
                  <User className="w-4 h-4" /> {provider.userId?.phone} • {provider.userId?.email || 'No email'}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="p-6 space-y-8">
            {/* Status & Metrics */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                <p className="text-xs text-slate-500 mb-1">Status</p>
                <p className="font-semibold text-slate-900 capitalize">{provider.status || 'Offline'}</p>
              </div>
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                <p className="text-xs text-slate-500 mb-1">Verification</p>
                <div className="flex items-center gap-1.5">
                  {provider.isVerified ? (
                    <span className="text-emerald-600 font-semibold flex items-center text-sm">
                      <ShieldCheck className="w-4 h-4 mr-1" /> Verified
                    </span>
                  ) : (
                    <span className="text-amber-600 font-semibold text-sm">Pending</span>
                  )}
                </div>
              </div>
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                <p className="text-xs text-slate-500 mb-1">Experience</p>
                <p className="font-semibold text-slate-900">{provider.experience} Years</p>
              </div>
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                <p className="text-xs text-slate-500 mb-1">Rating</p>
                <p className="font-semibold text-slate-900">{provider.rating?.average || provider.metrics?.rating || '0.0'} ⭐</p>
              </div>
            </div>

            {/* KYC Documents */}
            <div>
              <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
                <FileText className="w-5 h-5 text-slate-400" /> KYC Documents
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 rounded-xl border border-slate-200">
                  <p className="text-sm font-medium text-slate-700 mb-2">Aadhaar Card / ID Proof</p>
                  {provider.aadhaar || provider.idProof ? (
                    (provider.aadhaar?.startsWith('http') || provider.idProof?.startsWith('http')) ? (
                      <a href={provider.aadhaar || provider.idProof} target="_blank" rel="noreferrer" className="text-primary text-sm hover:underline cursor-pointer">
                        View Document
                      </a>
                    ) : (
                      <p className="text-sm font-medium text-slate-900">{provider.aadhaar || provider.idProof}</p>
                    )
                  ) : (
                    <p className="text-sm text-slate-400">Not provided</p>
                  )}
                </div>
                <div className="p-4 rounded-xl border border-slate-200">
                  <p className="text-sm font-medium text-slate-700 mb-2">PAN Card</p>
                  {provider.pan ? (
                    provider.pan.startsWith('http') ? (
                      <a href={provider.pan} target="_blank" rel="noreferrer" className="text-primary text-sm hover:underline cursor-pointer">
                        View Document
                      </a>
                    ) : (
                      <p className="text-sm font-medium text-slate-900">{provider.pan}</p>
                    )
                  ) : (
                    <p className="text-sm text-slate-400">Not provided</p>
                  )}
                </div>
              </div>
            </div>

            {/* Bank Details */}
            <div>
              <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-slate-400" /> Bank Details
              </h3>
              <div className="bg-slate-50 rounded-xl p-4 border border-slate-100 grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <p className="text-xs text-slate-500">Account Name</p>
                  <p className="font-medium text-slate-900">{provider.bankDetails?.accountHolderName || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500">Account Number</p>
                  <p className="font-medium text-slate-900">{provider.bankDetails?.accountNo || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500">IFSC Code</p>
                  <p className="font-medium text-slate-900">{provider.bankDetails?.ifscCode || 'N/A'}</p>
                </div>
              </div>
            </div>

            {/* Address Details */}
            <div>
              <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
                <MapPin className="w-5 h-5 text-slate-400" /> Address & Service Area
              </h3>
              <div className="bg-slate-50 rounded-xl p-4 border border-slate-100 space-y-3">
                <div>
                  <p className="text-xs text-slate-500">Full Address</p>
                  <p className="font-medium text-slate-900">{provider.address || 'N/A'}</p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-slate-500">Service City</p>
                    <p className="font-medium text-slate-900">{provider.serviceArea?.city || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500">Working Radius</p>
                    <p className="font-medium text-slate-900">{provider.workingRadius || 10} km</p>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
