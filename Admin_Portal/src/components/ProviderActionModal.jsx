import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, AlertTriangle } from 'lucide-react';

export default function ProviderActionModal({ isOpen, onClose, onConfirm, actionType, providerName }) {
  const [reason, setReason] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    onConfirm(reason);
    setReason('');
  };

  const config = {
    reject: {
      title: 'Reject Provider',
      description: `Provide a reason for rejecting ${providerName}'s verification. This will be sent to them via email.`,
      buttonText: 'Reject Provider',
      buttonClass: 'bg-red-600 hover:bg-red-700',
    },
    suspend: {
      title: 'Suspend Provider',
      description: `Provide a reason for suspending ${providerName}. This will be sent to them via email.`,
      buttonText: 'Suspend Provider',
      buttonClass: 'bg-amber-600 hover:bg-amber-700',
    }
  };

  const currentConfig = config[actionType] || config.reject;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="bg-white rounded-2xl w-full max-w-md overflow-hidden shadow-xl"
        >
          <div className="flex justify-between items-center p-6 border-b border-slate-100">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg ${actionType === 'suspend' ? 'bg-amber-100 text-amber-600' : 'bg-red-100 text-red-600'}`}>
                <AlertTriangle className="w-5 h-5" />
              </div>
              <h2 className="text-xl font-bold text-slate-900">{currentConfig.title}</h2>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="p-6">
            <p className="text-sm text-slate-600 mb-4">{currentConfig.description}</p>
            
            <div className="mb-6">
              <label className="block text-sm font-medium text-slate-700 mb-2">Reason</label>
              <textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                required
                rows={4}
                placeholder="e.g., Please complete your profile with a valid ID..."
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary outline-none resize-none text-sm"
              />
            </div>

            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-sm font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className={`px-4 py-2 text-sm font-medium text-white rounded-lg cursor-pointer ${currentConfig.buttonClass}`}
              >
                {currentConfig.buttonText}
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
