const express    = require("express");
const router     = express.Router();
const {
  getNearbyProviders, getMyProviderProfile, getProviderById,
  updateProviderProfile, toggleOnlineStatus, updateAvailability, getMyStats, getMyEarnings
} = require("../controllers/provider.controller");
const { verifyToken }  = require("../middleware/auth.middleware");
const { requireRole }  = require("../middleware/role.middleware");

// ── Provider only ─────────────────────────────────────────────────────────
router.get( "/me",             verifyToken, requireRole("provider"), getMyProviderProfile);
router.get( "/my-stats",       verifyToken, requireRole("provider"), getMyStats);         // live DB stats
router.get( "/my-earnings",    verifyToken, requireRole("provider"), getMyEarnings);      // earnings split
router.put( "/profile",        verifyToken, requireRole("provider"), updateProviderProfile);
router.put( "/online-status",  verifyToken, requireRole("provider"), toggleOnlineStatus);
router.put( "/availability",   verifyToken, requireRole("provider"), updateAvailability);

// ── Public ────────────────────────────────────────────────────────────────
router.get("/nearby",  getNearbyProviders);
router.get("/:id",     getProviderById);

module.exports = router;

// ══════════════════════════════════════════════════════════════
// POSTMAN TESTING GUIDE — PROVIDER API
// ══════════════════════════════════════════════════════════════
//
// 1. FIND NEARBY PROVIDERS (public)
//    GET http://localhost:5000/api/providers/nearby?latitude=21.1702&longitude=72.8311&page=1&limit=10
//    GET with category: add &categoryId=<ServiceCategory_id>
//    Expected: paginated list of online verified providers within 10km
//
// 2. GET SPECIFIC PROVIDER
//    GET http://localhost:5000/api/providers/<providerId>
//
// 3. PROVIDER GOES ONLINE
//    PUT http://localhost:5000/api/providers/online-status
//    Headers: Authorization: Bearer <provider_accessToken>
//    Body: { "isOnline": true }
//
// 4. UPDATE PROVIDER PROFILE
//    PUT http://localhost:5000/api/providers/profile
//    Headers: Authorization: Bearer <provider_accessToken>
//    Body: { "bio": "5 years AC repair experience", "experience": 5 }
//
// 5. UPDATE AVAILABILITY
//    PUT http://localhost:5000/api/providers/availability
//    Headers: Authorization: Bearer <provider_accessToken>
//    Body:
//    {
//      "availability": {
//        "monday":    { "isOpen": true,  "start": "09:00", "end": "18:00" },
//        "saturday":  { "isOpen": true,  "start": "10:00", "end": "16:00" },
//        "sunday":    { "isOpen": false, "start": "09:00", "end": "18:00" }
//      }
//    }
