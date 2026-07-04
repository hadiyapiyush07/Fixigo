import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, User, MapPin, Calendar, Clock, CreditCard, Wrench } from 'lucide-react';

export default function BookingModal({ booking, onClose }) {
  if (!booking) return null;

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
          className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto"
        >
          <div className="sticky top-0 z-10 flex items-center justify-between p-6 bg-white border-b border-slate-100">
            <div>
              <h2 className="text-xl font-bold text-slate-900">Booking {booking.bookingId}</h2>
              <p className="text-slate-500 text-sm capitalize">Status: {booking.status}</p>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="p-6 space-y-6">
            
            {/* Service & Time */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                <div className="flex items-center gap-2 text-slate-500 mb-1">
                  <Wrench className="w-4 h-4" /> <span className="text-sm font-medium">Service</span>
                </div>
                <p className="font-semibold text-slate-900">{booking.categoryId?.name || 'Unknown Service'}</p>
              </div>
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                <div className="flex items-center gap-2 text-slate-500 mb-1">
                  <Calendar className="w-4 h-4" /> <span className="text-sm font-medium">Schedule</span>
                </div>
                <p className="font-semibold text-slate-900">
                  {new Date(booking.scheduledDate).toLocaleDateString()} • {booking.scheduledTime}
                </p>
              </div>
            </div>

            {/* Sub-services */}
            {booking.subServices?.length > 0 && (
              <div>
                <h3 className="font-bold text-slate-900 mb-3 text-sm">Requested Sub-services</h3>
                <div className="bg-slate-50 rounded-xl p-4 border border-slate-100 space-y-2">
                  {booking.subServices.map((sub, idx) => (
                    <div key={idx} className="flex justify-between items-center text-sm">
                      <span className="text-slate-700">{sub.name}</span>
                      <span className="font-medium text-slate-900">₹{sub.price}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* People Involved */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="border border-slate-200 p-4 rounded-xl">
                <h3 className="font-bold text-slate-900 mb-3 text-sm flex items-center gap-2">
                  <User className="w-4 h-4 text-slate-400" /> Customer Details
                </h3>
                {booking.customerId ? (
                  <>
                    <p className="font-medium text-slate-900">{booking.customerId.name}</p>
                    <p className="text-sm text-slate-500">{booking.customerId.phone}</p>
                    <p className="text-sm text-slate-500">{booking.customerId.email}</p>
                  </>
                ) : (
                  <p className="text-sm text-slate-500">N/A</p>
                )}
              </div>
              
              <div className="border border-slate-200 p-4 rounded-xl">
                <h3 className="font-bold text-slate-900 mb-3 text-sm flex items-center gap-2">
                  <User className="w-4 h-4 text-slate-400" /> Provider Details
                </h3>
                {booking.providerId?.userId ? (
                  <>
                    <p className="font-medium text-slate-900">{booking.providerId.userId.name}</p>
                    <p className="text-sm text-slate-500">{booking.providerId.userId.phone}</p>
                    <p className="text-sm text-slate-500">Rating: {booking.providerId.rating?.average || 0} ⭐</p>
                  </>
                ) : (
                  <p className="text-sm text-slate-500 italic">Unassigned</p>
                )}
              </div>
            </div>

            {/* Location */}
            <div>
              <h3 className="font-bold text-slate-900 mb-3 text-sm flex items-center gap-2">
                <MapPin className="w-4 h-4 text-slate-400" /> Service Location
              </h3>
              <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
                <p className="text-sm text-slate-700">
                  {booking.address?.addressLine}, {booking.address?.city}, {booking.address?.pincode}
                </p>
              </div>
            </div>

            {/* Pricing */}
            <div>
              <h3 className="font-bold text-slate-900 mb-3 text-sm flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-slate-400" /> Payment Summary
              </h3>
              <div className="bg-slate-50 rounded-xl p-4 border border-slate-100 space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-600">Base Amount</span>
                  <span className="font-medium text-slate-900">₹{booking.pricing?.baseAmount || 0}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">Platform Fee</span>
                  <span className="font-medium text-slate-900">₹{booking.pricing?.convenienceFee || 0}</span>
                </div>
                {booking.pricing?.discount > 0 && (
                  <div className="flex justify-between text-emerald-600">
                    <span>Discount</span>
                    <span>- ₹{booking.pricing.discount}</span>
                  </div>
                )}
                <div className="pt-2 mt-2 border-t border-slate-200 flex justify-between font-bold text-base">
                  <span className="text-slate-900">Total</span>
                  <span className="text-primary">₹{booking.pricing?.totalAmount || 0}</span>
                </div>
                <div className="mt-2 text-xs text-slate-500 text-right uppercase">
                  Status: {booking.paymentStatus} • Method: {booking.paymentMethod || 'N/A'}
                </div>
              </div>
            </div>

          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
