const Provider = require("../models/Provider.model");
const Booking = require("../models/Booking.model");
const { emitToUser } = require("../socket/socket");

// This service runs on an interval to handle timeouts
const startHeartbeatService = () => {
  // Run every 10 seconds
  setInterval(async () => {
    try {
      const now = new Date();

      // 1. Check Provider Offline Timeouts (120 seconds)
      const offlineThreshold = new Date(now.getTime() - 120000);
      
      const timedOutProviders = await Provider.find({
        status: { $in: ["available", "busy"] },
        lastSeen: { $lt: offlineThreshold }
      });

      if (timedOutProviders.length > 0) {
        for (const provider of timedOutProviders) {
          console.log(`⏱️ [Heartbeat] Provider ${provider._id} timed out. Forcing offline.`);
          provider.status = "offline";
          // We can optionally track metrics here, like force-offline count.
          await provider.save();

          const { emitToAll } = require("../socket/socket");
          emitToAll("providers:status_changed", { providerId: provider._id, status: "offline" });

          // Emit to the specific user that they were taken offline by system
          if (provider.userId) {
            emitToUser(provider.userId, "provider:auto_offline", { reason: "heartbeat_timeout" });
          }
        }
      }

      // 2. Check Booking Response Timeouts (20 seconds)
      const timedOutBookings = await Booking.find({
        status: "pending",
        providerResponseDeadline: { $ne: null, $lt: now }
      });

      if (timedOutBookings.length > 0) {
        // Require bookingService lazily to avoid circular dependencies
        const { notifyNextProvider } = require("./booking.service");

        for (const booking of timedOutBookings) {
          console.log(`⏱️ [Heartbeat] Booking ${booking._id} timed out for provider ${booking.notifiedProviderId}. Reassigning...`);
          
          if (booking.notifiedProviderId) {
            // Add provider to rejected list and increment missed requests
            booking.rejectedProviders.push(booking.notifiedProviderId);
            await Provider.findByIdAndUpdate(booking.notifiedProviderId, {
              $inc: { "metrics.missedRequests": 1 }
            });
            
            // Notify provider that request expired
            const provider = await Provider.findById(booking.notifiedProviderId).populate("userId");
            if (provider?.userId) {
               emitToUser(provider.userId._id, "booking:expired", { bookingId: booking._id });
            }
          }

          booking.notifiedProviderId = null;
          booking.providerResponseDeadline = null;
          await booking.save();

          // Try assigning to next provider
          await notifyNextProvider(booking);
        }
      }
    } catch (error) {
      console.error("❌ [Heartbeat] Error running heartbeat loop:", error);
    }
  }, 10000); // 10 seconds
};

module.exports = { startHeartbeatService };
