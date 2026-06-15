const express  = require("express");
const router   = express.Router();
const {
  createBooking, getMyBookings, getProviderBookings,
  getBookingById, acceptBooking, rejectBooking,
  updateBookingStatus, cancelBooking,
} = require("../controllers/booking.controller");
const { verifyToken } = require("../middleware/auth.middleware");
const { requireRole } = require("../middleware/role.middleware");

router.use(verifyToken); // all booking routes need login

// Customer routes
router.post("/",           requireRole("customer"), createBooking);
router.get( "/my",         requireRole("customer"), getMyBookings);
router.put( "/:id/cancel", requireRole("customer"), cancelBooking);

// Provider routes
router.get( "/provider",    requireRole("provider"), getProviderBookings);
router.put( "/:id/accept",  requireRole("provider"), acceptBooking);
router.put( "/:id/reject",  requireRole("provider"), rejectBooking);
router.put( "/:id/status",  requireRole("provider"), updateBookingStatus);

// Both customer and provider
router.get("/:id", getBookingById);

module.exports = router;

// ══════════════════════════════════════════════════════════════
// POSTMAN TESTING GUIDE — BOOKING API
// ══════════════════════════════════════════════════════════════
//
// 1. CREATE BOOKING (customer token)
//    POST http://localhost:5000/api/bookings
//    Headers: Authorization: Bearer <customer_token>
//    Body:
  //  {
  //    "categoryId":    "<ServiceCategory _id>",
  //    "subService":    { "name": "AC Gas Refill", "price": 800 },
  //    "description":   "AC not cooling at all",
  //    "scheduledDate": "2025-06-15",
  //    "scheduledTime": "10:00 AM",
  //    "address": {
  //      "addressLine": "12 Lal Darwaja",
  //      "city":        "Surat",
  //      "pincode":     "395001",
  //      "location": {
  //        "type":        "Point",
  //        "coordinates": [72.8311, 21.1702]
  //      }
  //    },
  //    "pricing": {
  //      "baseAmount": 800, "convenienceFee": 50, "totalAmount": 850
  //    }
  //  }
//    Expected: 201 — booking created, provider notified via FCM
//
// 2. PROVIDER ACCEPTS (provider token)
//    PUT http://localhost:5000/api/bookings/<bookingId>/accept
//    Headers: Authorization: Bearer <provider_token>
//    Expected: 200 — status → confirmed, customer notified
//
// 3. PROVIDER REJECTS (provider token)
//    PUT http://localhost:5000/api/bookings/<bookingId>/reject
//    Body: { "reason": "I am busy today" }
//    Expected: 200 — next nearest provider is notified automatically
//
// 4. PROVIDER UPDATES STATUS (in order)
//    PUT http://localhost:5000/api/bookings/<bookingId>/status
//    Body: { "status": "provider_on_the_way" }   ← provider left home
//    Body: { "status": "in_progress" }            ← arrived, started work
//    Body: { "status": "completed" }              ← job done
//
// 5. CUSTOMER CANCELS
//    PUT http://localhost:5000/api/bookings/<bookingId>/cancel
//    Body: { "reason": "Changed my mind" }
//
// 6. GET MY BOOKINGS (paginated)
//    GET http://localhost:5000/api/bookings/my?page=1&limit=10
//    GET http://localhost:5000/api/bookings/my?status=completed
//    GET http://localhost:5000/api/bookings/my?status=pending
//
// 7. PROVIDER JOBS LIST
//    GET http://localhost:5000/api/bookings/provider?page=1&limit=10
