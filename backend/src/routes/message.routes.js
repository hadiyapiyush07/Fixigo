const express = require("express");
const router = express.Router();
const { getMessages, sendMessage, markAsRead } = require("../controllers/message.controller");
const { verifyToken } = require("../middleware/auth.middleware");

router.use(verifyToken);

router.get("/:bookingId", getMessages);
router.post("/:bookingId", sendMessage);
router.put("/:bookingId/read", markAsRead);

module.exports = router;
